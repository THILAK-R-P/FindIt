/**
 * AI Matching Service
 * Multimodal Gemini image analysis, high-dimensional vector embeddings,
 * and FAISS vector similarity search.
 */

const Item = require('../models/Item');
const { analyzeItemImage } = require('./geminiService');
const { generateItemEmbedding } = require('./embeddingService');
const { searchSimilarItems, addItemToIndex } = require('./faissService');

/**
 * Triggers AI image analysis, embedding generation, and FAISS vector similarity matching
 * Pipeline:
 * Uploaded Image -> Gemini Image Analysis -> Generate Embedding -> Store in MongoDB -> FAISS Search
 *
 * @param {Object} item - Newly created or updated Item document
 * @returns {Promise<Object>} - Resolves with extracted AI attributes, embedding status, and verified FAISS matches
 */
const analyzeAndFindMatches = async (item) => {
  console.log(`[AI Matching] Processing item '${item.itemName}' (${item._id}) through matching pipeline.`);

  let aiAttributes = null;

  // Step 1: Gemini Image Analysis
  if (item.imageUrl) {
    console.log(`[AI Pipeline] Requesting Gemini 3.8 Flash image analysis for item '${item.itemName}'...`);
    aiAttributes = await analyzeItemImage(item.imageUrl);
    if (aiAttributes) {
      console.log(`[AI Pipeline] Successfully extracted structured attributes for item '${item.itemName}'.`);
    } else {
      console.log(`[AI Pipeline] Image analysis returned no attributes (skipped or error handled).`);
    }
  } else {
    console.log(`[AI Pipeline] No image attached for item '${item.itemName}'. Skipping Gemini image analysis.`);
  }

  // Step 2: Generate Embedding Vector using gemini-embedding-2
  console.log(`[AI Pipeline] Generating embedding vector for item '${item.itemName}'...`);
  const embedding = await generateItemEmbedding(item, aiAttributes);

  // Step 3: Store Embedding & AI status in MongoDB Item document
  if (embedding && Array.isArray(embedding) && embedding.length > 0) {
    try {
      await Item.findByIdAndUpdate(item._id, {
        embedding,
        aiProcessed: true,
        aiAttributes: aiAttributes || null,
      });
      item.embedding = embedding;
      item.aiProcessed = true;
      item.aiAttributes = aiAttributes || null;
      console.log(`[AI Pipeline] Successfully stored ${embedding.length}-dim embedding and aiProcessed=true in MongoDB.`);
    } catch (dbErr) {
      console.error(`[AI Pipeline Error] Failed to update item embedding in MongoDB: ${dbErr.message}`);
    }
  } else {
    console.warn(`[AI Pipeline] Embedding could not be generated. Skipping MongoDB embedding storage.`);
  }

  // Step 4: FAISS Vector Similarity Search against opposite item type
  let matches = [];
  const targetType = item.type === 'lost' ? 'found' : 'lost';

  if (embedding && Array.isArray(embedding) && embedding.length > 0) {
    console.log(`[AI Pipeline] Running FAISS similarity search for ${item.type.toUpperCase()} item against ${targetType.toUpperCase()} items...`);
    matches = await searchSimilarItems(embedding, targetType, {
      excludeItemId: item._id,
      queryCategory: item.category,
    });

    // Add newly processed item into its own FAISS index for future searches
    await addItemToIndex(item);
  } else {
    console.log(`[AI Pipeline] Skipping FAISS search due to missing embedding vector.`);
  }

  return {
    status: matches.length > 0 ? 'matches_found' : 'no_matches_found',
    message: `FAISS similarity search completed against ${targetType} items. Found ${matches.length} candidate matches.`,
    aiAttributes: aiAttributes || null,
    embeddingDimension: embedding ? embedding.length : 0,
    targetType,
    matchCount: matches.length,
    matches,
  };
};

/**
 * Generate embedding for item data
 * @param {Object} itemData
 * @param {Object|null} aiAttributes
 * @returns {Promise<Array<number>|null>}
 */
const generateEmbeddings = async (itemData, aiAttributes = null) => {
  return generateItemEmbedding(itemData, aiAttributes);
};

module.exports = {
  analyzeAndFindMatches,
  generateEmbeddings,
};
