const { IndexFlatIP } = require('faiss-node');
const fs = require('fs');
const path = require('path');
const Item = require('../models/Item');

const EMBEDDING_DIM = 3072;
const DEFAULT_THRESHOLD = parseFloat(process.env.AI_MATCH_THRESHOLD) || 0.86;
const INDEX_DIR = path.resolve(__dirname, '../../', process.env.FAISS_INDEX_DIR || './data/faiss');

/**
 * Category compatibility mapping for campus lost and found items.
 * Prevents obviously incompatible categories (e.g. Bags vs Accessories) from matching.
 */
const CATEGORY_COMPATIBILITY_MAP = {
  bags: ['bags', 'other'],
  accessories: ['accessories', 'other'],
  electronics: ['electronics', 'other'],
  clothing: ['clothing', 'other'],
  keys: ['keys', 'other'],
  documents: ['documents', 'books', 'id cards', 'other'],
  books: ['books', 'documents', 'other'],
  'id cards': ['id cards', 'documents', 'other'],
  other: ['bags', 'accessories', 'electronics', 'clothing', 'keys', 'documents', 'books', 'id cards', 'other'],
};

/**
 * Checks whether two item categories are compatible for matching.
 *
 * @param {string|null} catA - Query item category
 * @param {string|null} catB - Candidate item category
 * @returns {boolean}
 */
const isCategoryCompatible = (catA, catB) => {
  if (!catA || !catB) return true;
  const normA = catA.trim().toLowerCase();
  const normB = catB.trim().toLowerCase();
  if (normA === normB) return true;
  if (normA === 'other' || normB === 'other') return true;

  const compatibleList = CATEGORY_COMPATIBILITY_MAP[normA];
  if (compatibleList && compatibleList.includes(normB)) {
    return true;
  }
  return false;
};

/**
 * In-memory index cache for 'lost' and 'found' collections
 */
const indexCache = {
  lost: {
    index: null,
    metadata: [],
    lastSynced: 0,
  },
  found: {
    index: null,
    metadata: [],
    lastSynced: 0,
  },
};

/**
 * L2 normalize a vector to unit length (for cosine similarity via inner product)
 * @param {Array<number>} vector
 * @returns {Array<number>|null}
 */
const l2Normalize = (vector) => {
  if (!vector || !Array.isArray(vector) || vector.length === 0) return null;
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector.slice();
  const normalized = new Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    normalized[i] = vector[i] / norm;
  }
  return normalized;
};

/**
 * Ensure storage directory for FAISS files exists
 */
const ensureStorageDir = () => {
  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
  }
};

/**
 * Save in-memory index and metadata to disk
 * @param {'lost'|'found'} type
 */
const saveIndexToDisk = (type) => {
  try {
    ensureStorageDir();
    const cache = indexCache[type];
    if (!cache.index || cache.metadata.length === 0) return;

    const indexPath = path.join(INDEX_DIR, `${type}_items.index`);
    const metaPath = path.join(INDEX_DIR, `${type}_metadata.json`);

    cache.index.write(indexPath);
    fs.writeFileSync(metaPath, JSON.stringify(cache.metadata, null, 2));
  } catch (err) {
    console.error(`[FAISS Warning] Failed to persist ${type} index to disk: ${err.message}`);
  }
};

/**
 * Load index from disk if available
 * @param {'lost'|'found'} type
 * @returns {boolean} - True if loaded from disk
 */
const loadIndexFromDisk = (type) => {
  try {
    const indexPath = path.join(INDEX_DIR, `${type}_items.index`);
    const metaPath = path.join(INDEX_DIR, `${type}_metadata.json`);

    if (fs.existsSync(indexPath) && fs.existsSync(metaPath)) {
      const readIndex = IndexFlatIP.read(indexPath);
      const metaContent = fs.readFileSync(metaPath, 'utf8');
      const metadata = JSON.parse(metaContent);

      if (readIndex && readIndex.ntotal() === metadata.length) {
        indexCache[type].index = readIndex;
        indexCache[type].metadata = metadata;
        indexCache[type].lastSynced = Date.now();
        return true;
      }
    }
  } catch (err) {
    console.warn(`[FAISS] Disk index load for ${type} failed (${err.message}), will sync from DB.`);
  }
  return false;
};

/**
 * Synchronize FAISS index from MongoDB items of a specific type
 * Handles empty database, server restart, invalid dimensions, and duplicate vectors
 *
 * @param {'lost'|'found'} type
 * @param {boolean} force - Force resync from DB even if cached
 * @returns {Promise<{count: number}>}
 */
const syncIndexFromDB = async (type, force = false) => {
  try {
    ensureStorageDir();

    // Check if valid in-memory index already exists (cache for 60s unless forced)
    if (!force && indexCache[type].index && Date.now() - indexCache[type].lastSynced < 60000) {
      return { count: indexCache[type].metadata.length };
    }

    const items = await Item.find({
      type,
      embedding: { $exists: true, $ne: null },
      status: { $nin: ['claimed', 'recovered'] },
    }).lean();

    const newIndex = new IndexFlatIP(EMBEDDING_DIM);
    const newMetadata = [];
    const seenIds = new Set();

    for (const item of items) {
      if (!item.embedding || !Array.isArray(item.embedding)) continue;
      if (item.embedding.length !== EMBEDDING_DIM) {
        console.warn(
          `[FAISS] Skipping item '${item.itemName}' (${item._id}): invalid dimension ${item.embedding.length} (expected ${EMBEDDING_DIM})`
        );
        continue;
      }

      // Handle duplicate item vectors
      const itemIdStr = item._id.toString();
      if (seenIds.has(itemIdStr)) continue;
      seenIds.add(itemIdStr);

      const normVec = l2Normalize(item.embedding);
      if (!normVec) continue;

      newIndex.add(normVec);
      newMetadata.push({
        itemId: itemIdStr,
        itemName: item.itemName,
        type: item.type,
        category: item.category,
        location: item.location,
        date: item.date,
        imageUrl: item.imageUrl || '',
        description: item.description || '',
        reportedBy: item.reportedBy,
        status: item.status,
      });
    }

    indexCache[type].index = newIndex;
    indexCache[type].metadata = newMetadata;
    indexCache[type].lastSynced = Date.now();

    // Persist to disk
    if (newMetadata.length > 0) {
      saveIndexToDisk(type);
    }

    return { count: newMetadata.length };
  } catch (err) {
    console.error(`[FAISS Error] Failed to sync index for ${type}: ${err.message}`);
    // Safe empty fallback
    if (!indexCache[type].index) {
      indexCache[type].index = new IndexFlatIP(EMBEDDING_DIM);
      indexCache[type].metadata = [];
    }
    return { count: 0 };
  }
};

/**
 * Add a single item vector to the index cache and disk
 * @param {Object} item
 */
const addItemToIndex = async (item) => {
  try {
    if (!item || !item.type || !item.embedding || item.embedding.length !== EMBEDDING_DIM) {
      return;
    }

    const type = item.type;
    const cache = indexCache[type];

    // Ensure index is loaded
    if (!cache.index) {
      await syncIndexFromDB(type);
    }

    const itemIdStr = item._id ? item._id.toString() : '';
    // Avoid duplicate additions
    const existingIndex = cache.metadata.findIndex((m) => m.itemId === itemIdStr);
    if (existingIndex !== -1) {
      return; // Already present
    }

    const normVec = l2Normalize(item.embedding);
    if (!normVec) return;

    cache.index.add(normVec);
    cache.metadata.push({
      itemId: itemIdStr,
      itemName: item.itemName,
      type: item.type,
      category: item.category,
      location: item.location,
      date: item.date,
      imageUrl: item.imageUrl || '',
      description: item.description || '',
      reportedBy: item.reportedBy,
      status: item.status,
    });

    saveIndexToDisk(type);
  } catch (err) {
    console.error(`[FAISS Warning] Failed to incrementally add item to index: ${err.message}`);
  }
};

/**
 * Search for opposite-type items similar to the given embedding
 *
 * @param {Array<number>} queryEmbedding - 3072-dimensional vector
 * @param {'lost'|'found'} targetType - Target collection to search against
 * @param {Object} [options]
 * @param {number} [options.threshold] - Minimum cosine similarity score (e.g. 0.75)
 * @param {number} [options.topK] - Maximum number of matches to return (default: 5)
 * @param {string} [options.excludeItemId] - Optional item ID to exclude from matches
 * @returns {Promise<Array<Object>>} - Ranked matches exceeding threshold
 */
const searchSimilarItems = async (queryEmbedding, targetType, options = {}) => {
  try {
    // 1. Validate inputs
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      console.warn('[FAISS] Query embedding is missing or invalid.');
      return [];
    }

    if (queryEmbedding.length !== EMBEDDING_DIM) {
      console.warn(
        `[FAISS] Invalid query embedding dimension: ${queryEmbedding.length} (expected ${EMBEDDING_DIM}).`
      );
      return [];
    }

    if (targetType !== 'lost' && targetType !== 'found') {
      console.warn(`[FAISS] Invalid targetType: ${targetType}. Must be 'lost' or 'found'.`);
      return [];
    }

    const threshold =
      options.threshold !== undefined ? Number(options.threshold) : DEFAULT_THRESHOLD;
    const topK = options.topK || 5;
    const excludeItemId = options.excludeItemId ? options.excludeItemId.toString() : null;
    const queryCategory = options.queryCategory || options.category || null;

    // 2. Ensure target index is loaded/synced
    const cache = indexCache[targetType];
    if (!cache.index || cache.metadata.length === 0) {
      // Try disk first, fallback to DB
      if (!loadIndexFromDisk(targetType)) {
        await syncIndexFromDB(targetType);
      }
    } else {
      // Sync from DB in background/refresh to ensure fresh data
      await syncIndexFromDB(targetType);
    }

    const totalIndexed = cache.metadata.length;
    if (totalIndexed === 0) {
      console.log('====================================================');
      console.log(`  [FAISS Vector Search] No ${targetType.toUpperCase()} candidates available to match.`);
      console.log('====================================================');
      return [];
    }

    // 3. Normalize query vector
    const normQuery = l2Normalize(queryEmbedding);
    if (!normQuery) return [];

    // 4. Perform FAISS Inner Product (Cosine Similarity) search
    const k = Math.min(topK * 2, totalIndexed); // Request slightly more to allow excludeItemId filtering
    const searchResult = cache.index.search(normQuery, k);

    if (!searchResult || !searchResult.labels || searchResult.labels.length === 0) {
      return [];
    }

    // 5. Filter and rank results
    const matches = [];
    for (let i = 0; i < searchResult.labels.length; i++) {
      const labelIdx = searchResult.labels[i];
      const similarity = searchResult.distances[i];

      if (labelIdx < 0 || labelIdx >= cache.metadata.length) continue;
      const candidate = cache.metadata[labelIdx];

      // Exclude self if same item
      if (excludeItemId && candidate.itemId === excludeItemId) continue;

      const score = Number(similarity.toFixed(4));

      // Category compatibility filter
      const isCompatible = isCategoryCompatible(queryCategory, candidate.category);
      if (!isCompatible) {
        console.log(`[FAISS] Candidate rejected:`);
        console.log(`Score: ${score}`);
        console.log(`Reason: Category incompatible`);
        continue;
      }

      // Similarity threshold filter
      if (score < threshold) {
        console.log(`[FAISS] Candidate rejected:`);
        console.log(`Score: ${score}`);
        console.log(`Reason: Below threshold`);
        continue;
      }

      matches.push({
        itemId: candidate.itemId,
        itemName: candidate.itemName,
        type: candidate.type,
        category: candidate.category,
        location: candidate.location,
        date: candidate.date,
        imageUrl: candidate.imageUrl,
        description: candidate.description,
        similarityScore: score,
        reportedBy: candidate.reportedBy,
      });

      if (matches.length >= topK) break;
    }

    // Sort descending by similarity
    matches.sort((a, b) => b.similarityScore - a.similarityScore);

    // 6. Print clear summary to backend console
    console.log('====================================================');
    console.log('  [FAISS Vector Search] Similarity Matching:');
    console.log(`  Target Pool:       ${targetType.toUpperCase()} Items (${totalIndexed} indexed candidates)`);
    console.log(`  Config Threshold:  ${threshold}`);
    console.log(`  Matches Found:     ${matches.length}`);
    if (matches.length > 0) {
      matches.forEach((m, idx) => {
        console.log(`    #${idx + 1}: '${m.itemName}' (${m.type}) | Score: ${m.similarityScore} | ID: ${m.itemId}`);
      });
    } else {
      console.log('  No candidates met the minimum similarity threshold.');
    }
    console.log('====================================================');

    return matches;
  } catch (error) {
    console.error('====================================================');
    console.error(`  [FAISS Search Error] Vector search failed: ${error.message}`);
    console.error('====================================================');
    return [];
  }
};

module.exports = {
  searchSimilarItems,
  syncIndexFromDB,
  addItemToIndex,
  l2Normalize,
  isCategoryCompatible,
  CATEGORY_COMPATIBILITY_MAP,
  EMBEDDING_DIM,
  DEFAULT_THRESHOLD,
  INDEX_DIR,
};
