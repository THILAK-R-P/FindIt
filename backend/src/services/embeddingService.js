const { GoogleGenAI } = require('@google/genai');
const { parseImageData } = require('./geminiService');

const EMBEDDING_MODEL = 'gemini-embedding-2';

/**
 * Get or initialize GoogleGenAI client
 * @returns {GoogleGenAI|null}
 */
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
};

/**
 * Build rich text representation from item metadata and AI-extracted attributes
 * @param {Object} item
 * @param {Object|null} aiAttributes
 * @returns {string}
 */
const buildItemEmbeddingText = (item, aiAttributes) => {
  const lines = [];

  if (item.itemName) lines.push(`Item: ${item.itemName}`);
  const cat = aiAttributes?.category || item.category;
  if (cat) lines.push(`Category: ${cat}`);
  if (aiAttributes?.objectType) lines.push(`Object Type: ${aiAttributes.objectType}`);
  const brand = aiAttributes?.brand || item.brand;
  if (brand) lines.push(`Brand: ${brand}`);
  const color = aiAttributes?.primaryColor || item.color;
  if (color) lines.push(`Primary Color: ${color}`);

  if (Array.isArray(aiAttributes?.secondaryColors) && aiAttributes.secondaryColors.length > 0) {
    lines.push(`Secondary Colors: ${aiAttributes.secondaryColors.join(', ')}`);
  }

  const features = [];
  if (Array.isArray(aiAttributes?.distinctiveFeatures)) {
    features.push(...aiAttributes.distinctiveFeatures);
  }
  if (item.distinctiveMarks) features.push(item.distinctiveMarks);
  if (features.length > 0) {
    lines.push(`Distinctive Features: ${features.join('; ')}`);
  }

  if (aiAttributes?.visibleText) {
    lines.push(`Visible Text: ${aiAttributes.visibleText}`);
  }

  if (item.description) lines.push(`Description: ${item.description}`);
  if (item.location) lines.push(`Campus Location: ${item.location}`);

  return lines.join('\n');
};

/**
 * Generate embedding vector using gemini-embedding-2
 * Supports multimodal (image + text) or text-only embedding
 *
 * @param {Object} item - Item document or object
 * @param {Object|null} aiAttributes - Attributes extracted from Gemini image analysis
 * @returns {Promise<Array<number>|null>} - 3072-dimensional embedding vector or null
 */
const generateItemEmbedding = async (item, aiAttributes = null) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      console.warn('----------------------------------------------------');
      console.warn('[Embedding Service] GEMINI_API_KEY is not configured in backend/.env.');
      console.warn('[Embedding Service] Skipping embedding generation.');
      console.warn('----------------------------------------------------');
      return null;
    }

    const textPayload = buildItemEmbeddingText(item, aiAttributes);
    let contents = textPayload;

    // Check if item has an image we can use for multimodal embedding
    if (item.imageUrl) {
      const parsedImage = await parseImageData(item.imageUrl);
      if (parsedImage && parsedImage.data) {
        contents = [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: parsedImage.data,
                  mimeType: parsedImage.mimeType,
                },
              },
              {
                text: textPayload,
              },
            ],
          },
        ];
      }
    }

    // Call gemini-embedding-2 with retry backoff for transient load spikes
    let response = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents,
        });
        break;
      } catch (err) {
        const isTransient =
          err.status === 503 ||
          err.status === 429 ||
          (err.message && err.message.includes('high demand'));

        if (isTransient && attempt < maxRetries) {
          const delay = (attempt + 1) * 2000;
          console.warn(
            `[Embedding Service] Transient API load (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay / 1000}s...`
          );
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }

    if (!response || !response.embeddings || response.embeddings.length === 0) {
      console.warn('[Embedding Service] Empty embedding response received.');
      return null;
    }

    const embeddingValues = response.embeddings[0].values;
    if (!Array.isArray(embeddingValues) || embeddingValues.length === 0) {
      console.warn('[Embedding Service] Embedding values array missing in response.');
      return null;
    }

    console.log('====================================================');
    console.log('  [Gemini Embedding 2] Embedding Generated:');
    console.log(`  Item: '${item.itemName}'`);
    console.log(`  Model: ${EMBEDDING_MODEL}`);
    console.log(`  Dimension: ${embeddingValues.length}`);
    console.log('  Status: SUCCESS');
    console.log('====================================================');

    return embeddingValues;
  } catch (error) {
    console.error('====================================================');
    console.error('  [Embedding Service Error] Embedding Generation Failed:');
    console.error(`  Message: ${error.message}`);
    if (error.status) console.error(`  Status: ${error.status}`);
    console.error('====================================================');
    return null;
  }
};

module.exports = {
  generateItemEmbedding,
  buildItemEmbeddingText,
  EMBEDDING_MODEL,
};
