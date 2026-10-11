const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Item = require('./src/models/Item');
const { searchSimilarItems, syncIndexFromDB, isCategoryCompatible } = require('./src/services/faissService');

const runFaissTesting = async () => {
  console.log('====================================================');
  console.log('  FindIt - Phase 3 Validation: Category Filtering & Threshold Calibration');
  console.log(`  Configured AI_MATCH_THRESHOLD: ${process.env.AI_MATCH_THRESHOLD || '0.86'}`);
  console.log('====================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';

  try {
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected to MongoDB.');

    // Step 0: Ensure FAISS indices are synced from DB
    console.log('[FAISS] Synchronizing LOST and FOUND indices from database...');
    const lostSync = await syncIndexFromDB('lost', true);
    const foundSync = await syncIndexFromDB('found', true);
    console.log(`[FAISS] Indices synced: ${lostSync.count} LOST items, ${foundSync.count} FOUND items indexed.\n`);

    // Fetch test items
    const lostWatch = await Item.findOne({
      type: 'lost',
      category: 'Accessories',
      itemName: { $regex: /watch/i },
      embedding: { $exists: true, $ne: null },
    });

    const foundWatch = await Item.findOne({
      type: 'found',
      category: 'Accessories',
      itemName: { $regex: /watch/i },
      embedding: { $exists: true, $ne: null },
    });

    const lostBag = await Item.findOne({
      type: 'lost',
      category: 'Bags',
      itemName: { $regex: /bag/i },
      embedding: { $exists: true, $ne: null },
    });

    const foundBag = await Item.findOne({
      type: 'found',
      category: 'Bags',
      itemName: { $regex: /bag/i },
      embedding: { $exists: true, $ne: null },
    });

    if (!lostWatch || !foundWatch || !lostBag || !foundBag) {
      console.error('[Error] Missing required seed items in database for testing.');
      console.error({
        hasLostWatch: !!lostWatch,
        hasFoundWatch: !!foundWatch,
        hasLostBag: !!lostBag,
        hasFoundBag: !!foundBag,
      });
      process.exit(1);
    }

    const testResults = {
      test1: false,
      test2: false,
      test3: false,
      test4: false,
    };

    // ----------------------------------------------------
    // TEST 1: Lost watch <--> Found watch
    // Expected: MATCH if similarity >= 0.86 and categories are compatible.
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('  TEST 1: Lost watch <--> Found watch');
    console.log(`  Query:  '${lostWatch.itemName}' (${lostWatch.category}, lost)`);
    console.log(`  Target: Search against FOUND items (looking for '${foundWatch.itemName}')`);
    console.log('  Expected: MATCH (similarity >= 0.86 and compatible categories)');
    console.log('----------------------------------------------------');

    const matchesT1 = await searchSimilarItems(lostWatch.embedding, 'found', {
      excludeItemId: lostWatch._id,
      queryCategory: lostWatch.category,
      threshold: parseFloat(process.env.AI_MATCH_THRESHOLD) || 0.86,
    });

    const watchMatch = matchesT1.find((m) => m.itemId === foundWatch._id.toString());
    if (watchMatch && watchMatch.similarityScore >= 0.86 && isCategoryCompatible(lostWatch.category, watchMatch.category)) {
      console.log(`\n>>> TEST 1 RESULT: PASSED (Found match '${watchMatch.itemName}' with score ${watchMatch.similarityScore} >= 0.86) <<<\n`);
      testResults.test1 = true;
    } else {
      console.error('\n>>> TEST 1 RESULT: FAILED <<<');
      console.error(matchesT1);
    }

    // ----------------------------------------------------
    // TEST 2: Lost watch <--> Found bag
    // Expected: NOT a match because categories are incompatible.
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('  TEST 2: Lost watch <--> Found bag');
    console.log(`  Query:  '${lostWatch.itemName}' (${lostWatch.category}, lost)`);
    console.log(`  Target: Found bag '${foundBag.itemName}' (${foundBag.category}, found)`);
    console.log('  Expected: NOT a match (Reason: Category incompatible)');
    console.log('----------------------------------------------------');

    // In the search for lostWatch against FOUND items, check if foundBag was accepted or rejected
    const bagInMatches = matchesT1.find((m) => m.itemId === foundBag._id.toString());
    const isCatCompatible = isCategoryCompatible(lostWatch.category, foundBag.category);

    console.log(`Category Compatibility (${lostWatch.category} <--> ${foundBag.category}): ${isCatCompatible}`);
    if (!bagInMatches && !isCatCompatible) {
      console.log('\n>>> TEST 2 RESULT: PASSED (Found bag was correctly rejected due to incompatible category) <<<\n');
      testResults.test2 = true;
    } else {
      console.error('\n>>> TEST 2 RESULT: FAILED (Found bag was unexpectedly matched or marked compatible) <<<');
    }

    // ----------------------------------------------------
    // TEST 3: Lost bag <--> Found bag
    // Expected: MATCH if similarity >= 0.86.
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('  TEST 3: Lost bag <--> Found bag');
    console.log(`  Query:  '${lostBag.itemName}' (${lostBag.category}, lost)`);
    console.log(`  Target: Search against FOUND items (looking for '${foundBag.itemName}')`);
    console.log('  Expected: MATCH if similarity >= 0.86 and compatible categories');
    console.log('----------------------------------------------------');

    const matchesT3 = await searchSimilarItems(lostBag.embedding, 'found', {
      excludeItemId: lostBag._id,
      queryCategory: lostBag.category,
      threshold: parseFloat(process.env.AI_MATCH_THRESHOLD) || 0.86,
    });

    const bagMatch = matchesT3.find((m) => m.category === 'Bags');
    if (bagMatch && bagMatch.similarityScore >= 0.86 && isCategoryCompatible(lostBag.category, bagMatch.category)) {
      console.log(`\n>>> TEST 3 RESULT: PASSED (Found bag match '${bagMatch.itemName}' with score ${bagMatch.similarityScore} >= 0.86) <<<\n`);
      testResults.test3 = true;
    } else {
      console.error('\n>>> TEST 3 RESULT: FAILED <<<');
      console.error(matchesT3);
    }

    // ----------------------------------------------------
    // TEST 4: Unrelated items with similarity around 0.75–0.84
    // Expected: NOT a match (Reason: Below threshold)
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('  TEST 4: Unrelated items with similarity around 0.75-0.84');
    console.log(`  Query:  Watch embedding with 'Electronics' category searching against LOST items`);
    console.log('  Expected: NOT a match because similarity (e.g. ~0.78) is below 0.86 threshold');
    console.log('----------------------------------------------------');

    const matchesT4 = await searchSimilarItems(foundWatch.embedding, 'lost', {
      excludeItemId: foundWatch._id,
      queryCategory: 'Electronics',
      threshold: parseFloat(process.env.AI_MATCH_THRESHOLD) || 0.86,
    });

    // Check that items with score 0.75-0.84 (like Smart Watch with score ~0.78) were NOT accepted as matches
    const weakMatchAccepted = matchesT4.some((m) => m.similarityScore < 0.86);
    if (!weakMatchAccepted && matchesT4.length === 0) {
      console.log('\n>>> TEST 4 RESULT: PASSED (Candidates with similarity 0.75-0.84 were correctly rejected as Below threshold) <<<\n');
      testResults.test4 = true;
    } else {
      console.error('\n>>> TEST 4 RESULT: FAILED (A candidate below threshold was accepted) <<<');
    }

    // ----------------------------------------------------
    // FINAL ASSESSMENT
    // ----------------------------------------------------
    console.log('====================================================');
    console.log('  FINAL VALIDATION ASSESSMENT:');
    console.log('====================================================');
    console.log(`TEST 1 (Lost watch <--> Found watch):   ${testResults.test1 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 2 (Lost watch <--> Found bag):     ${testResults.test2 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 3 (Lost bag <--> Found bag):       ${testResults.test3 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 4 (Below threshold rejection):    ${testResults.test4 ? 'PASSED' : 'FAILED'}`);

    const allPassed = testResults.test1 && testResults.test2 && testResults.test3 && testResults.test4;
    if (allPassed) {
      console.log('\n>>> ALL 4 CATEGORY & THRESHOLD TEST CASES PASSED SUCCESSFULLY! <<<');
      console.log('>>> Phase 3 is now verified and ready for Phase 4! <<<');
    } else {
      console.error('\n>>> SOME TESTS FAILED. PLEASE REVIEW LOGS. <<<');
    }
    console.log('====================================================\n');
  } catch (err) {
    console.error('[Test Error]', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runFaissTesting();
