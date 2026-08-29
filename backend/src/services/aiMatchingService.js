/**
 * AI Matching Service (Architecture Placeholder for Phase 2)
 *
 * NOTE FOR FIRST REVIEW:
 * Gemini API and FAISS vector index are intentionally NOT connected in Phase 1.
 * This service establishes the architectural contract and future integration hooks.
 *
 * =========================================================================
 * FUTURE PHASE 2 IMPLEMENTATION PIPELINE:
 * =========================================================================
 * 1. Receive item image / metadata payload upon report submission (lost/found).
 * 2. Send item image + prompt to Gemini 2.5 Flash multimodal endpoint to extract:
 *    - Standardized category, color palette, brand recognition, text/OCR features.
 * 3. Generate high-dimensional vector embeddings using Google text-embedding / multimodal embeddings.
 * 4. Index and query vectors in FAISS (Facebook AI Similarity Search) index.
 * 5. Compute cosine similarity between lost and found item feature vectors.
 * 6. Filter by threshold (e.g. cosine score > 0.82) and cross-reference campus location/time.
 * 7. Return verified potential match candidates.
 * 8. Automatically trigger in-app notifications and email alerts via Nodemailer.
 * =========================================================================
 */

/**
 * Placeholder function for triggering AI similarity matching
 * @param {Object} item - Newly created or updated Item document
 * @returns {Promise<Array>} - Resolves with empty matches in Phase 1
 */
const analyzeAndFindMatches = async (item) => {
  // TODO: Phase 2 - Integrate Gemini 2.5 Flash & FAISS vector search pipeline
  console.log(`[AI Architecture Hook] Item '${item.itemName}' (${item._id}) queued for Phase 2 vector analysis.`);
  return {
    status: 'pending_phase_2',
    message: 'AI-powered multimodal matching will be enabled in Phase 2 with Gemini 2.5 Flash and FAISS.',
    matches: [],
  };
};

/**
 * Placeholder function for generating embeddings
 * @param {Object} itemData
 * @returns {Promise<null>}
 */
const generateEmbeddings = async (itemData) => {
  // TODO: Phase 2 - Call Embedding model
  return null;
};

module.exports = {
  analyzeAndFindMatches,
  generateEmbeddings,
};
