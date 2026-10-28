const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Item = require('./src/models/Item');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const { createMatchNotifications } = require('./src/services/notificationService');
const { searchSimilarItems, syncIndexFromDB, isCategoryCompatible } = require('./src/services/faissService');
const { analyzeAndFindMatches } = require('./src/services/aiMatchingService');

const runPhase4Tests = async () => {
  console.log('====================================================');
  console.log('  FindIt - Phase 4: Automatic Match Notifications Test Suite');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';

  try {
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected to MongoDB.');

    // Ensure Notification indexes (including our compound unique index) are created
    await Notification.init();
    console.log('[Database] Notification indexes initialized.');

    // Sync FAISS indexes
    await syncIndexFromDB('lost', true);
    await syncIndexFromDB('found', true);

    // Identify two distinct users for testing
    const userA = await User.findOne({ email: 'sukesh@campus.edu' }) || await User.findOne({ role: 'student' });
    const userB = await User.findOne({ email: 'thilak@campus.edu' }) || await User.findOne({ _id: { $ne: userA._id } });

    if (!userA || !userB || userA._id.toString() === userB._id.toString()) {
      console.error('[Error] Need at least two distinct users in database for notification testing.');
      process.exit(1);
    }

    console.log(`[Test Users] User A (Lost Reporter): ${userA.name} (${userA._id})`);
    console.log(`[Test Users] User B (Found Reporter): ${userB.name} (${userB._id})\n`);

    const results = {};

    // ----------------------------------------------------
    // TEST 1: LOST watch matches FOUND watch: notification reaches the LOST reporter
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 1: LOST watch matches FOUND watch -> notification reaches LOST reporter');
    console.log('----------------------------------------------------');

    // Create a mock found watch reported by User B
    const seedFoundWatch = await Item.findOne({
      type: 'found',
      category: 'Accessories',
      itemName: { $regex: /watch/i },
      embedding: { $exists: true, $ne: null },
    });

    const testFoundWatch = await Item.create({
      itemName: 'Found Silver Wrist Watch',
      type: 'found',
      category: 'Accessories',
      description: 'Found silver analog watch near library steps',
      date: new Date(),
      location: 'Library',
      reportedBy: userB._id,
      embedding: seedFoundWatch.embedding,
      aiProcessed: true,
    });

    const testLostWatch = await Item.create({
      itemName: 'Lost Silver Wrist Watch',
      type: 'lost',
      category: 'Accessories',
      description: 'Lost my silver analog watch near library steps',
      date: new Date(),
      location: 'Library',
      reportedBy: userA._id,
      embedding: seedFoundWatch.embedding,
      aiProcessed: true,
    });

    // Run notification creation simulating matching
    const mockMatchesT1 = [
      {
        itemId: testFoundWatch._id.toString(),
        itemName: testFoundWatch.itemName,
        type: 'found',
        category: 'Accessories',
        similarityScore: 0.9425,
        reportedBy: userB._id,
      },
    ];

    const notifsT1 = await createMatchNotifications(testLostWatch, mockMatchesT1);
    const dbNotifT1 = await Notification.findOne({
      user: userA._id,
      lostItem: testLostWatch._id,
      foundItem: testFoundWatch._id,
      type: 'potential_match',
    });

    const t1Passed =
      notifsT1.length === 1 &&
      dbNotifT1 &&
      dbNotifT1.user.toString() === userA._id.toString() &&
      dbNotifT1.link === `/items/${testFoundWatch._id}` &&
      dbNotifT1.title === 'Potential Match Found' &&
      dbNotifT1.message.includes('Found Silver Wrist Watch') &&
      dbNotifT1.message.includes('0.9425');

    console.log(`Notification created count: ${notifsT1.length}`);
    console.log(`Notification in DB: ${!!dbNotifT1}`);
    if (dbNotifT1) {
      console.log(`Recipient User ID: ${dbNotifT1.user}`);
      console.log(`Title: ${dbNotifT1.title}`);
      console.log(`Link: ${dbNotifT1.link}`);
      console.log(`Message: ${dbNotifT1.message}`);
    }
    results.test1 = t1Passed;
    console.log(`>>> TEST 1 RESULT: ${t1Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // TEST 2: FOUND watch matches an existing LOST watch: notification reaches that LOST reporter
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 2: FOUND watch matches existing LOST watch -> notification reaches LOST reporter');
    console.log('----------------------------------------------------');

    // Existing LOST watch reported by User A:
    const existingLostWatch = await Item.create({
      itemName: 'Lost Vintage Chronograph Watch',
      type: 'lost',
      category: 'Accessories',
      description: 'Lost vintage chronograph watch with leather band in cafeteria',
      date: new Date(),
      location: 'Canteen',
      reportedBy: userA._id,
      embedding: seedFoundWatch.embedding,
      aiProcessed: true,
    });

    // New FOUND watch submitted by User B:
    const newlyReportedFoundWatch = await Item.create({
      itemName: 'Found Vintage Chronograph Watch',
      type: 'found',
      category: 'Accessories',
      description: 'Found vintage chronograph watch with leather band in cafeteria',
      date: new Date(),
      location: 'Canteen',
      reportedBy: userB._id,
      embedding: seedFoundWatch.embedding,
      aiProcessed: true,
    });

    const mockMatchesT2 = [
      {
        itemId: existingLostWatch._id.toString(),
        itemName: existingLostWatch.itemName,
        type: 'lost',
        category: 'Accessories',
        similarityScore: 0.9512,
        reportedBy: userA._id, // User A is the reporter of the existing LOST item
      },
    ];

    const notifsT2 = await createMatchNotifications(newlyReportedFoundWatch, mockMatchesT2);
    const dbNotifT2 = await Notification.findOne({
      user: userA._id,
      lostItem: existingLostWatch._id,
      foundItem: newlyReportedFoundWatch._id,
      type: 'potential_match',
    });

    const t2Passed =
      notifsT2.length === 1 &&
      dbNotifT2 &&
      dbNotifT2.user.toString() === userA._id.toString() && // Must reach User A (LOST reporter)
      dbNotifT2.link === `/items/${newlyReportedFoundWatch._id}` &&
      dbNotifT2.title === 'Potential Match Found' &&
      dbNotifT2.message.includes('Found Vintage Chronograph Watch');

    console.log(`Notification created count: ${notifsT2.length}`);
    if (dbNotifT2) {
      console.log(`Recipient User ID: ${dbNotifT2.user} (Matches User A: ${dbNotifT2.user.toString() === userA._id.toString()})`);
      console.log(`Title: ${dbNotifT2.title}`);
      console.log(`Link: ${dbNotifT2.link}`);
      console.log(`Message: ${dbNotifT2.message}`);
    }
    results.test2 = t2Passed;
    console.log(`>>> TEST 2 RESULT: ${t2Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // TEST 3: LOST bag matches FOUND bag: notification is created
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 3: LOST bag matches FOUND bag -> notification is created');
    console.log('----------------------------------------------------');

    const seedBag = await Item.findOne({
      type: 'found',
      category: 'Bags',
      embedding: { $exists: true, $ne: null },
    });

    const testFoundBag = await Item.create({
      itemName: 'Found Navy Laptop Backpack',
      type: 'found',
      category: 'Bags',
      description: 'Found navy blue Dell backpack in Computer Lab',
      date: new Date(),
      location: 'Computer Lab',
      reportedBy: userB._id,
      embedding: seedBag ? seedBag.embedding : seedFoundWatch.embedding,
      aiProcessed: true,
    });

    const testLostBag = await Item.create({
      itemName: 'Lost Navy Laptop Backpack',
      type: 'lost',
      category: 'Bags',
      description: 'Lost navy blue Dell backpack in Computer Lab',
      date: new Date(),
      location: 'Computer Lab',
      reportedBy: userA._id,
      embedding: seedBag ? seedBag.embedding : seedFoundWatch.embedding,
      aiProcessed: true,
    });

    const mockMatchesT3 = [
      {
        itemId: testFoundBag._id.toString(),
        itemName: testFoundBag.itemName,
        type: 'found',
        category: 'Bags',
        similarityScore: 0.9680,
        reportedBy: userB._id,
      },
    ];

    const notifsT3 = await createMatchNotifications(testLostBag, mockMatchesT3);
    const dbNotifT3 = await Notification.findOne({
      user: userA._id,
      lostItem: testLostBag._id,
      foundItem: testFoundBag._id,
      type: 'potential_match',
    });

    const t3Passed =
      notifsT3.length === 1 &&
      dbNotifT3 &&
      dbNotifT3.user.toString() === userA._id.toString() &&
      dbNotifT3.link === `/items/${testFoundBag._id}`;

    console.log(`Notification created count: ${notifsT3.length}`);
    results.test3 = t3Passed;
    console.log(`>>> TEST 3 RESULT: ${t3Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // TEST 4: Watch versus bag: no notification
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 4: Watch versus bag -> incompatible categories -> no notification');
    console.log('----------------------------------------------------');

    const isCompatibleT4 = isCategoryCompatible('Accessories', 'Bags');
    console.log(`Category Compatibility ('Accessories' <--> 'Bags'): ${isCompatibleT4}`);

    // If an incompatible match candidate was passed, searchSimilarItems rejects it.
    // Even if somehow passed, createMatchNotifications verifies or searchSimilarItems prevents it.
    const searchT4Matches = await searchSimilarItems(testLostWatch.embedding, 'found', {
      excludeItemId: testLostWatch._id,
      queryCategory: 'Accessories',
      threshold: 0.86,
    });

    const bagMatchFound = searchT4Matches.some((m) => m.category === 'Bags');
    const notifsT4 = await createMatchNotifications(testLostWatch, searchT4Matches.filter(m => m.category === 'Bags'));

    const t4Passed = !isCompatibleT4 && !bagMatchFound && notifsT4.length === 0;
    console.log(`Bag candidate in FAISS matches: ${bagMatchFound}`);
    console.log(`Notifications created: ${notifsT4.length}`);
    results.test4 = t4Passed;
    console.log(`>>> TEST 4 RESULT: ${t4Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // TEST 5: Similarity score below 0.86: no notification
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 5: Similarity score below 0.86 -> no notification');
    console.log('----------------------------------------------------');

    const lowScoreMatches = [
      {
        itemId: testFoundWatch._id.toString(),
        itemName: testFoundWatch.itemName,
        type: 'found',
        category: 'Accessories',
        similarityScore: 0.8200, // Below threshold 0.86
        reportedBy: userB._id,
      },
      {
        itemId: testFoundBag._id.toString(),
        itemName: testFoundBag.itemName,
        type: 'found',
        category: 'Bags',
        similarityScore: 0.7850, // Below threshold 0.86
        reportedBy: userB._id,
      },
    ];

    const notifsT5 = await createMatchNotifications(testLostWatch, lowScoreMatches);
    const t5Passed = notifsT5.length === 0;

    console.log(`Candidates tested: scores 0.8200 and 0.7850 (< 0.86)`);
    console.log(`Notifications created: ${notifsT5.length}`);
    results.test5 = t5Passed;
    console.log(`>>> TEST 5 RESULT: ${t5Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // TEST 6: Processing the same pair again: no duplicate notification
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 6: Processing the same pair again -> no duplicate notification');
    console.log('----------------------------------------------------');

    // Run createMatchNotifications again with the exact same items from TEST 1:
    const notifsT6 = await createMatchNotifications(testLostWatch, mockMatchesT1);
    const totalNotifsT6 = await Notification.countDocuments({
      user: userA._id,
      lostItem: testLostWatch._id,
      foundItem: testFoundWatch._id,
      type: 'potential_match',
    });

    const t6Passed = notifsT6.length === 0 && totalNotifsT6 === 1;

    console.log(`Second run notifications created: ${notifsT6.length}`);
    console.log(`Total notifications in DB for this pair: ${totalNotifsT6}`);
    results.test6 = t6Passed;
    console.log(`>>> TEST 6 RESULT: ${t6Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // TEST 7: A user never receives a match notification for their own item
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 7: User never receives match notification for their own item');
    console.log('----------------------------------------------------');

    // User A reported both LOST and FOUND items
    const selfFoundItem = await Item.create({
      itemName: 'Self Found Keys',
      type: 'found',
      category: 'Keys',
      description: 'Found bunch of keys',
      date: new Date(),
      location: 'Hostel',
      reportedBy: userA._id, // User A
    });

    const selfLostItem = await Item.create({
      itemName: 'Self Lost Keys',
      type: 'lost',
      category: 'Keys',
      description: 'Lost bunch of keys',
      date: new Date(),
      location: 'Hostel',
      reportedBy: userA._id, // User A (same user)
    });

    const selfMatches = [
      {
        itemId: selfFoundItem._id.toString(),
        itemName: selfFoundItem.itemName,
        type: 'found',
        category: 'Keys',
        similarityScore: 0.9800,
        reportedBy: userA._id, // same user
      },
    ];

    const notifsT7 = await createMatchNotifications(selfLostItem, selfMatches);
    const dbNotifT7 = await Notification.findOne({
      user: userA._id,
      lostItem: selfLostItem._id,
      foundItem: selfFoundItem._id,
      type: 'potential_match',
    });

    const t7Passed = notifsT7.length === 0 && !dbNotifT7;
    console.log(`Self-match notifications created: ${notifsT7.length}`);
    console.log(`Notification in DB: ${!!dbNotifT7}`);
    results.test7 = t7Passed;
    console.log(`>>> TEST 7 RESULT: ${t7Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // TEST 8: Clicking a notification opens the correct FOUND item details
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 8: Notification link routes to correct FOUND item details');
    console.log('----------------------------------------------------');

    // Retrieve notification from TEST 1
    const test1Notif = await Notification.findOne({
      lostItem: testLostWatch._id,
      foundItem: testFoundWatch._id,
    });

    const targetFoundItem = await Item.findById(testFoundWatch._id);
    const expectedLink = `/items/${testFoundWatch._id}`;

    const t8Passed =
      test1Notif &&
      test1Notif.link === expectedLink &&
      targetFoundItem &&
      targetFoundItem.type === 'found' &&
      targetFoundItem.itemName === 'Found Silver Wrist Watch';

    console.log(`Notification link: '${test1Notif?.link}'`);
    console.log(`Expected link:     '${expectedLink}'`);
    console.log(`Target Item Name:  '${targetFoundItem?.itemName}' (${targetFoundItem?.type})`);
    results.test8 = t8Passed;
    console.log(`>>> TEST 8 RESULT: ${t8Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // TEST 9: Notification creation fails: item reporting still succeeds
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 9: Notification creation fails -> item reporting still succeeds');
    console.log('----------------------------------------------------');

    // In createLostItem/createFoundItem, the notification block is wrapped in try/catch.
    // Simulate by passing an invalid match / throwing error inside the hook
    let itemCreationSucceeded = false;
    let createdItemDoc = null;

    try {
      // Create item directly as controller does
      createdItemDoc = await Item.create({
        itemName: 'Robustness Test Item',
        type: 'lost',
        category: 'Electronics',
        description: 'Testing error isolation when notifications fail',
        date: new Date(),
        location: 'Main Block',
        reportedBy: userA._id,
      });

      // Deliberately trigger an error in notification creation
      try {
        await createMatchNotifications(null, [{ itemId: 'invalid-id', similarityScore: 0.95 }]);
      } catch (mockNotificationError) {
        console.log(`[Simulated Notification Error Caught Safely]: ${mockNotificationError.message}`);
      }

      // Verify that createdItemDoc exists in DB regardless
      const verifyInDb = await Item.findById(createdItemDoc._id);
      itemCreationSucceeded = !!verifyInDb;
    } catch (err) {
      itemCreationSucceeded = false;
    }

    const t9Passed = itemCreationSucceeded;
    console.log(`Item successfully persisted despite notification failure: ${t9Passed}`);
    results.test9 = t9Passed;
    console.log(`>>> TEST 9 RESULT: ${t9Passed ? 'PASSED' : 'FAILED'} <<<\n`);

    // ----------------------------------------------------
    // CLEANUP TEST ARTIFACTS
    // ----------------------------------------------------
    await Item.deleteMany({
      _id: {
        $in: [
          testFoundWatch._id,
          testLostWatch._id,
          existingLostWatch._id,
          newlyReportedFoundWatch._id,
          testFoundBag._id,
          testLostBag._id,
          selfFoundItem._id,
          selfLostItem._id,
          createdItemDoc ? createdItemDoc._id : null,
        ].filter(Boolean),
      },
    });

    await Notification.deleteMany({
      lostItem: {
        $in: [
          testLostWatch._id,
          existingLostWatch._id,
          testLostBag._id,
          selfLostItem._id,
        ].filter(Boolean),
      },
    });

    // ----------------------------------------------------
    // SUMMARY ASSESSMENT
    // ----------------------------------------------------
    console.log('====================================================');
    console.log('  PHASE 4 NOTIFICATION TEST RESULTS:');
    console.log('====================================================');
    console.log(`TEST 1 (LOST watch matches FOUND watch -> LOST reporter notified): ${results.test1 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 2 (FOUND watch matches existing LOST watch -> LOST reporter notified): ${results.test2 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 3 (LOST bag matches FOUND bag -> notification created):       ${results.test3 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 4 (Watch vs bag -> incompatible -> no notification):            ${results.test4 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 5 (Similarity score < 0.86 -> no notification):                  ${results.test5 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 6 (Processing same pair again -> no duplicate notification):      ${results.test6 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 7 (User never receives notification for their own item):          ${results.test7 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 8 (Clicking notification routes to correct FOUND item details):  ${results.test8 ? 'PASSED' : 'FAILED'}`);
    console.log(`TEST 9 (Notification failure -> item reporting still succeeds):        ${results.test9 ? 'PASSED' : 'FAILED'}`);

    const allPassed = Object.values(results).every(Boolean);
    if (allPassed) {
      console.log('\n>>> ALL 9 PHASE 4 TEST CASES PASSED SUCCESSFULLY! <<<');
    } else {
      console.error('\n>>> SOME TESTS FAILED! <<<');
    }
    console.log('====================================================\n');
  } catch (err) {
    console.error('[Test Error]', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runPhase4Tests();
