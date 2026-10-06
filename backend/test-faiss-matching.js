const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Item = require('./src/models/Item');
const User = require('./src/models/User');
const { analyzeAndFindMatches } = require('./src/services/aiMatchingService');
const { syncIndexFromDB } = require('./src/services/faissService');

const runFaissTesting = async () => {
  console.log('====================================================');
  console.log('  FindIt - Phase 3: FAISS Vector Similarity Matching Test');
  console.log('====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';
  try {
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected to MongoDB.');

    const reporter = (await User.findOne({ role: 'student' })) || (await User.findOne());
    if (!reporter) {
      console.error('[Error] No user found in database to associate test items with.');
      process.exit(1);
    }

    // Reuse existing image from DB
    const seedItemWithImage = await Item.findOne({ imageUrl: { $exists: true, $regex: '^data:image' } });
    if (!seedItemWithImage || !seedItemWithImage.imageUrl) {
      console.error('[Error] No existing image found in database to attach.');
      process.exit(1);
    }
    const sampleImage = seedItemWithImage.imageUrl;

    // 1. SETUP: Create or ensure at least one FOUND item exists with embedding
    console.log('\n----------------------------------------------------');
    console.log(' [STEP 1] Setting up Target FOUND Item in Database...');
    console.log('----------------------------------------------------');

    const foundItem = await Item.create({
      itemName: 'Found Digital Notes Tablet displaying MongoDB Schemas',
      type: 'found',
      category: 'Documents',
      description: 'Found on 2nd floor lecture hall. Has handwritten notes and database schemas on black screen.',
      date: new Date(),
      time: '10:15 AM',
      location: 'Academic Block 3 - Hall 201',
      brand: 'MongoDB',
      color: 'Black',
      distinctiveMarks: 'Diagram showing User and Course tables',
      imageUrl: sampleImage,
      status: 'found',
      reportedBy: reporter._id,
    });

    console.log(`[Created FOUND Item] '${foundItem.itemName}' (ID: ${foundItem._id})`);
    console.log('[Processing FOUND Item through AI Pipeline to generate & index embedding]...');
    const foundResult = await analyzeAndFindMatches(foundItem);
    console.log(`[FOUND Item Processed] Embedding generated: ${foundResult.embeddingDimension}-dim. Saved to DB.\n`);

    // Force sync the FOUND index to make sure all found items are in FAISS
    await syncIndexFromDB('found', true);

    // 2. TEST CASE A: Submit a visually & semantically SIMILAR LOST item
    console.log('----------------------------------------------------');
    console.log(' [STEP 2] Submitting SIMILAR LOST Item...');
    console.log('----------------------------------------------------');

    const similarLostItem = await Item.create({
      itemName: 'Lost Digital Lecture Notes Tablet with White Pen Notes',
      type: 'lost',
      category: 'Documents',
      description: 'Lost my digital tablet with database lecture notes and NoSQL diagram sketches in room 201.',
      date: new Date(),
      time: '10:00 AM',
      location: 'Academic Block 3 - Hall 201',
      brand: 'MongoDB',
      color: 'Black',
      distinctiveMarks: 'White handwriting on dark screen with red underlines',
      imageUrl: sampleImage,
      status: 'lost',
      reportedBy: reporter._id,
    });

    console.log(`[Created SIMILAR LOST Item] '${similarLostItem.itemName}' (ID: ${similarLostItem._id})`);
    console.log('[Invoking Pipeline: Gemini Analysis -> Embedding -> FAISS Search against FOUND Items]...\n');

    const similarResult = await analyzeAndFindMatches(similarLostItem);

    console.log('\n--- SIMILAR ITEM RESULT SUMMARY ---');
    console.log(`Target Type Searched:  ${similarResult.targetType}`);
    console.log(`Match Count:           ${similarResult.matchCount}`);
    console.log(`Pipeline Status:       ${similarResult.status}`);
    if (similarResult.matches && similarResult.matches.length > 0) {
      console.log('Top Match Details:');
      similarResult.matches.forEach((m, idx) => {
        console.log(`  #${idx + 1} Found Item: '${m.itemName}'`);
        console.log(`     Item ID:     ${m.itemId}`);
        console.log(`     Location:    ${m.location}`);
        console.log(`     Similarity:  ${m.similarityScore} (Threshold: ${process.env.AI_MATCH_THRESHOLD || 0.75})`);
      });
    } else {
      console.log('No matches exceeded threshold.');
    }
    console.log('-----------------------------------\n');

    // 3. TEST CASE B: Submit an UNRELATED LOST item (e.g. Leather Wallet)
    console.log('----------------------------------------------------');
    console.log(' [STEP 3] Submitting UNRELATED LOST Item...');
    console.log('----------------------------------------------------');

    const unrelatedLostItem = await Item.create({
      itemName: 'Lost Brown Leather Tri-fold Wallet with ID and Cash',
      type: 'lost',
      category: 'Accessories',
      description: 'Lost my brown vintage leather wallet near the cafeteria benches during lunch.',
      date: new Date(),
      time: '01:30 PM',
      location: 'Campus Cafeteria Benches',
      brand: 'Wildhorn',
      color: 'Dark Brown',
      distinctiveMarks: 'Worn edges with brass coin zipper',
      imageUrl: '', // Text-based item report
      status: 'lost',
      reportedBy: reporter._id,
    });

    console.log(`[Created UNRELATED LOST Item] '${unrelatedLostItem.itemName}' (ID: ${unrelatedLostItem._id})`);
    console.log('[Invoking Pipeline: Gemini Analysis -> Embedding -> FAISS Search against FOUND Items]...\n');

    const unrelatedResult = await analyzeAndFindMatches(unrelatedLostItem);

    console.log('\n--- UNRELATED ITEM RESULT SUMMARY ---');
    console.log(`Target Type Searched:  ${unrelatedResult.targetType}`);
    console.log(`Match Count:           ${unrelatedResult.matchCount}`);
    console.log(`Pipeline Status:       ${unrelatedResult.status}`);
    if (unrelatedResult.matches && unrelatedResult.matches.length > 0) {
      console.log('Unexpected matches found:');
      unrelatedResult.matches.forEach((m) => {
        console.log(`  Matched with: '${m.itemName}' | Score: ${m.similarityScore}`);
      });
    } else {
      console.log(`[SUCCESS] 0 matches returned. Threshold properly filtered out unrelated items.`);
    }
    console.log('-----------------------------------\n');

    // 4. VERIFICATION SUMMARY
    console.log('====================================================');
    console.log('  PHASE 3 VERIFICATION FINAL ASSESSMENT:');
    console.log('====================================================');
    const similarPassed = similarResult.matchCount > 0 && similarResult.matches[0].similarityScore >= 0.75;
    const unrelatedPassed = unrelatedResult.matchCount === 0;

    console.log(`1. Similar Item Match Test:   ${similarPassed ? 'PASSED (Match found with score ' + similarResult.matches[0]?.similarityScore + ')' : 'FAILED'}`);
    console.log(`2. Unrelated Item Filter Test: ${unrelatedPassed ? 'PASSED (0 matches, threshold enforced)' : 'FAILED'}`);

    if (similarPassed && unrelatedPassed) {
      console.log('\n>>> ALL PHASE 3 FAISS REQUIREMENTS SATISFIED SUCCESSFULLY! <<<');
    }
    console.log('====================================================');
  } catch (err) {
    console.error('[Test Error]', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runFaissTesting();
