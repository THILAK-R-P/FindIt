const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const Item = require('./src/models/Item');
const { analyzeAndFindMatches } = require('./src/services/aiMatchingService');

const runTest = async () => {
  console.log('====================================================');
  console.log('  FindIt - Gemini 3.8 Flash Image Analysis Test');
  console.log('====================================================');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('[Notice] GEMINI_API_KEY is not set or using placeholder in backend/.env.');
    console.log('[Notice] Set GEMINI_API_KEY=AIzaSy... in backend/.env to run live Gemini API calls.\n');
  } else {
    console.log('[Notice] GEMINI_API_KEY detected in environment.\n');
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';
  try {
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected to MongoDB.');

    // Look for existing lost item with an image
    let item = await Item.findOne({ type: 'lost', imageUrl: { $exists: true, $ne: '' } });

    if (!item) {
      // Fallback to any item with an image
      item = await Item.findOne({ imageUrl: { $exists: true, $ne: '' } });
    }

    if (!item) {
      console.log('[Test Error] No items found in the database with an imageUrl.');
      process.exit(1);
    }

    console.log('\n--- Selected Test Item ---');
    console.log(`ID:          ${item._id}`);
    console.log(`Name:        ${item.itemName}`);
    console.log(`Type:        ${item.type}`);
    console.log(`Category:    ${item.category}`);
    console.log(`Description: ${item.description}`);
    console.log(`Image Type:  ${item.imageUrl.substring(0, 30)}... (Length: ${item.imageUrl.length} chars)`);
    console.log('--------------------------\n');

    console.log('[Execution] Calling analyzeAndFindMatches(item)...');
    const result = await analyzeAndFindMatches(item);

    console.log('\n--- Pipeline Return Value ---');
    console.log(JSON.stringify(result, null, 2));
    console.log('-----------------------------\n');

    console.log('[Test Completed Successfully]');
  } catch (error) {
    console.error('[Test Failed]', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTest();
