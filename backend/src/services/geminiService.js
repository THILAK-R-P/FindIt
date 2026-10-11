const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');

/**
 * Structured schema definition for Gemini 3.8 Flash item analysis
 */
const itemAttributeSchema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description:
        'Standard category of the lost/found item (e.g., Electronics, Bags, Documents, Accessories, Clothing, Keys, Books, ID Cards, Other)',
    },
    objectType: {
      type: Type.STRING,
      description:
        'Specific type or description of the object (e.g., school backpack, smartwatch, wireless headphones, stainless steel water bottle, scientific calculator)',
    },
    brand: {
      type: Type.STRING,
      description:
        'Identifiable brand or manufacturer name (e.g., Nike, Apple, Sony, Casio), or empty string if unbranded or not visible',
    },
    primaryColor: {
      type: Type.STRING,
      description: 'Dominant primary color of the item (e.g., black, navy blue, red, silver)',
    },
    secondaryColors: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'Secondary or accent colors visible on the item',
    },
    distinctiveFeatures: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description:
        'List of notable features, markings, keychains, logos, scratches, stickers, straps, or design patterns',
    },
    visibleText: {
      type: Type.STRING,
      description:
        'Any visible text, brand logos, model numbers, engraved labels, or writing on the item, or empty string if none',
    },
  },
  required: [
    'category',
    'objectType',
    'brand',
    'primaryColor',
    'secondaryColors',
    'distinctiveFeatures',
    'visibleText',
  ],
};

/**
 * Parse various image inputs into base64 data and mimeType
 * Supports:
 * - Data URLs (e.g. data:image/png;base64,...)
 * - Raw base64 strings
 * - Local file paths
 * - Remote HTTP/HTTPS URLs
 * - Buffers
 *
 * @param {string|Buffer|Object} imageData
 * @returns {Promise<{data: string, mimeType: string}|null>}
 */
const parseImageData = async (imageData) => {
  if (!imageData) return null;

  // 1. Direct object format { data, mimeType }
  if (typeof imageData === 'object' && !Buffer.isBuffer(imageData)) {
    if (imageData.inlineData && imageData.inlineData.data) {
      return {
        data: imageData.inlineData.data,
        mimeType: imageData.inlineData.mimeType || 'image/jpeg',
      };
    }
    if (imageData.data) {
      return {
        data: imageData.data,
        mimeType: imageData.mimeType || 'image/jpeg',
      };
    }
  }

  // 2. Buffer format
  if (Buffer.isBuffer(imageData)) {
    return {
      data: imageData.toString('base64'),
      mimeType: 'image/jpeg',
    };
  }

  if (typeof imageData !== 'string') return null;

  const trimmed = imageData.trim();
  if (!trimmed) return null;

  // 3. Data URL (e.g., data:image/png;base64,....)
  const dataUrlMatch = trimmed.match(/^data:([a-zA-Z0-9/+-.]+)(?:;[a-zA-Z0-9=+._-]+)*;base64,(.+)$/s);
  if (dataUrlMatch) {
    let mime = dataUrlMatch[1].split(';')[0].trim().toLowerCase();
    if (mime === 'image/jpg') mime = 'image/jpeg';
    return {
      mimeType: mime || 'image/jpeg',
      data: dataUrlMatch[2].replace(/[\r\n\s]/g, ''),
    };
  }

  // 4. Remote URL (http:// or https://)
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const response = await fetch(trimmed);
      if (!response.ok) {
        console.warn(`[Gemini Service] Failed to fetch image URL: ${trimmed} (${response.status})`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      return {
        data: buffer.toString('base64'),
        mimeType: mimeType.split(';')[0].trim(),
      };
    } catch (fetchErr) {
      console.warn(`[Gemini Service] Error downloading image from URL: ${fetchErr.message}`);
      return null;
    }
  }

  // 5. Local file path
  if (
    (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('.')) &&
    fs.existsSync(trimmed)
  ) {
    try {
      const ext = path.extname(trimmed).toLowerCase();
      const mimeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
      };
      const mimeType = mimeMap[ext] || 'image/jpeg';
      const fileBuffer = fs.readFileSync(trimmed);
      return {
        data: fileBuffer.toString('base64'),
        mimeType,
      };
    } catch (fileErr) {
      console.warn(`[Gemini Service] Error reading local image file: ${fileErr.message}`);
      return null;
    }
  }

  // 6. Raw base64 string without data URL prefix
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
    let mimeType = 'image/jpeg';
    if (trimmed.startsWith('iVBORw0KGgo')) mimeType = 'image/png';
    else if (trimmed.startsWith('/9j/')) mimeType = 'image/jpeg';
    else if (trimmed.startsWith('R0lGOD')) mimeType = 'image/gif';
    else if (trimmed.startsWith('UklGR')) mimeType = 'image/webp';

    return {
      data: trimmed,
      mimeType,
    };
  }

  return null;
};

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
 * Analyze an item image using Gemini 3.8 Flash
 *
 * @param {string|Buffer|Object} imageData - Base64 Data URL, path, URL, or buffer
 * @returns {Promise<Object|null>} - Structured attributes or null on failure/missing key
 */
const analyzeItemImage = async (imageData) => {
  try {
    // 1. Verify API Key
    const ai = getGenAIClient();
    if (!ai) {
      console.warn('----------------------------------------------------');
      console.warn('[Gemini Service] GEMINI_API_KEY is not configured in backend/.env.');
      console.warn('[Gemini Service] Skipping AI image analysis.');
      console.warn('----------------------------------------------------');
      return null;
    }

    // 2. Validate and parse image input
    if (!imageData) {
      console.warn('[Gemini Service] No image data provided to analyzeItemImage.');
      return null;
    }

    const parsed = await parseImageData(imageData);
    if (!parsed || !parsed.data) {
      console.warn('[Gemini Service] Invalid image data format provided. Unable to parse image.');
      return null;
    }

    // 3. Construct prompt
    const prompt =
      'You are an expert lost-and-found item identification assistant for a campus community. ' +
      'Examine this item image in detail. Extract structured attributes including the broad category, specific object type, ' +
      'brand or manufacturer, primary color, secondary colors, distinctive features (e.g. logos, keychains, scratches, stickers, patterns), ' +
      'and any visible text or model numbers. Return the response strictly as JSON matching the schema.';

    // 4. Request analysis from Gemini 3.8 Flash (with retry for transient demand spikes)
    let response = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: parsed.data,
                    mimeType: parsed.mimeType,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: itemAttributeSchema,
            temperature: 0.1,
          },
        });
        break; // Success
      } catch (callErr) {
        const isTransient = callErr.status === 503 || callErr.status === 429 || (callErr.message && callErr.message.includes('high demand'));
        if (isTransient && attempt < maxRetries) {
          const delay = (attempt + 1) * 2000;
          console.warn(`[Gemini Service] Transient API load (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw callErr;
        }
      }
    }

    if (!response || !response.text) {
      console.warn('[Gemini Service] Received empty response from Gemini 3.8 Flash.');
      return null;
    }

    // 5. Parse and normalize structured JSON result
    let attributes;
    try {
      attributes = JSON.parse(response.text);
    } catch (parseErr) {
      console.error('[Gemini Service] Failed to parse Gemini response as JSON:', parseErr.message);
      console.error('[Gemini Service] Raw output:', response.text);
      return null;
    }

    // Normalization safeguard
    const normalizedAttributes = {
      category: String(attributes.category || 'Other').trim(),
      objectType: String(attributes.objectType || '').trim(),
      brand: String(attributes.brand || '').trim(),
      primaryColor: String(attributes.primaryColor || '').trim(),
      secondaryColors: Array.isArray(attributes.secondaryColors)
        ? attributes.secondaryColors.map((c) => String(c).trim()).filter(Boolean)
        : [],
      distinctiveFeatures: Array.isArray(attributes.distinctiveFeatures)
        ? attributes.distinctiveFeatures.map((f) => String(f).trim()).filter(Boolean)
        : [],
      visibleText: String(attributes.visibleText || '').trim(),
    };

    // 6. Print Gemini result clearly in backend console for verification
    console.log('====================================================');
    console.log('  [Gemini 3.8 Flash] Image Analysis Result:');
    console.log('====================================================');
    console.log(JSON.stringify(normalizedAttributes, null, 2));
    console.log('====================================================');

    return normalizedAttributes;
  } catch (error) {
    console.error('====================================================');
    console.error('  [Gemini Service Error] Image Analysis Failed:');
    console.error(`  Message: ${error.message}`);
    if (error.status) console.error(`  Status: ${error.status}`);
    console.error('====================================================');
    return null;
  }
};

module.exports = {
  analyzeItemImage,
  itemAttributeSchema,
  parseImageData,
};
