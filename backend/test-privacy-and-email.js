const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Item = require('./src/models/Item');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const { getMyReports, updateItem, deleteItem, getItems, getItemById } = require('./src/controllers/itemController');
const { getNotifications, markAsRead, markAllAsRead } = require('./src/controllers/notificationController');
const { createMatchNotifications } = require('./src/services/notificationService');
const { setTransporter, sendMatchEmail, isRealRecipientEmail } = require('./src/services/emailService');
const { isCategoryCompatible } = require('./src/services/faissService');

// Helper to mock Express response
const createMockRes = () => {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
};

const runTestSuite = async () => {
  console.log('================================================================');
  console.log('  FindIt - Privacy & Automatic Gmail Notifications Test Suite');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';

  try {
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected to MongoDB.');

    await Notification.init();
    await Item.init();
    await User.init();
    console.log('[Database] Schemas and indexes initialized.');

    // Find two distinct test users with real email domains
    let userA = await User.findOne({ email: 'thilak.ct23@bitsathy.ac.in' });
    let userB = await User.findOne({ email: 'sharveshg.ad23@bitsathy.ac.in' });

    if (!userA || !userB) {
      const users = await User.find().limit(2);
      if (users.length >= 2) {
        userA = users[0];
        userB = users[1];
      }
    }

    if (!userA || !userB || userA._id.toString() === userB._id.toString()) {
      console.error('[Error] Requires at least two distinct users in the database.');
      process.exit(1);
    }

    console.log(`[Test Users] User A (Lost Reporter): ${userA.name} (${userA.email}) [ID: ${userA._id}]`);
    console.log(`[Test Users] User B (Found Reporter): ${userB.name} (${userB.email}) [ID: ${userB._id}]\n`);

    const results = {};

    // ========================================================================
    // TEST 1: Report Privacy - My Reports returns ONLY the authenticated user's reports
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 1: My Reports Privacy - Authenticated User Isolation');
    console.log('----------------------------------------------------------------');

    const itemA = await Item.create({
      itemName: 'User A Private Blue Backpack',
      type: 'lost',
      category: 'Bags',
      description: 'Navy blue Herschel backpack with laptop inside',
      date: new Date(),
      location: 'Mech Block Room 204',
      reportedBy: userA._id,
      status: 'lost',
    });

    const itemB = await Item.create({
      itemName: 'User B Found Umbrella',
      type: 'found',
      category: 'Other',
      description: 'Black umbrella left at library entrance',
      date: new Date(),
      location: 'Library Entrance',
      reportedBy: userB._id,
      status: 'found',
    });

    // Request My Reports as User A
    const reqUserA = { user: userA, query: {} };
    const resUserA = createMockRes();
    await getMyReports(reqUserA, resUserA);

    const userAItems = resUserA.data?.items || [];
    const hasOnlyUserA = userAItems.every(
      (item) => item.reportedBy.toString() === userA._id.toString()
    );
    const containsItemB = userAItems.some(
      (item) => item._id.toString() === itemB._id.toString()
    );

    // Request My Reports as User A while maliciously passing query ?reportedBy=userB._id
    const maliciousReq = {
      user: userA,
      query: { reportedBy: userB._id.toString(), userId: userB._id.toString() },
    };
    const maliciousRes = createMockRes();
    await getMyReports(maliciousReq, maliciousRes);

    const maliciousItems = maliciousRes.data?.items || [];
    const queryTamperingPrevented = maliciousItems.every(
      (item) => item.reportedBy.toString() === userA._id.toString()
    );

    const test1Passed = hasOnlyUserA && !containsItemB && queryTamperingPrevented;
    results['TEST 1: My Reports Isolation & Query Tampering Prevention'] = test1Passed ? 'PASSED' : 'FAILED';
    console.log(`- User A's my-reports contains only User A's items: ${hasOnlyUserA ? 'YES' : 'NO'}`);
    console.log(`- User B's report leaked to User A: ${containsItemB ? 'YES (FAIL)' : 'NO (SECURE)'}`);
    console.log(`- Query tampering with ?reportedBy=${userB._id} prevented: ${queryTamperingPrevented ? 'YES' : 'NO'}`);
    console.log(`Result: ${test1Passed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 2: Report Privacy - Unauthorized Modification / Deletion Rejected
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log("TEST 2: Modification Privacy - Unauthorized Update/Delete Rejected");
    console.log('----------------------------------------------------------------');

    const updateReq = {
      user: userA,
      params: { id: itemB._id },
      body: { itemName: 'Hijacked Item Title' },
    };
    const updateRes = createMockRes();
    await updateItem(updateReq, updateRes);

    const deleteReq = {
      user: userA,
      params: { id: itemB._id },
    };
    const deleteRes = createMockRes();
    await deleteItem(deleteReq, deleteRes);

    const updateRejected = updateRes.statusCode === 403;
    const deleteRejected = deleteRes.statusCode === 403;

    const unchangedItemB = await Item.findById(itemB._id);
    const itemNotModified = unchangedItemB.itemName === 'User B Found Umbrella';

    const test2Passed = updateRejected && deleteRejected && itemNotModified;
    results['TEST 2: Unauthorized Update and Delete Protection (403)'] = test2Passed ? 'PASSED' : 'FAILED';
    console.log(`- Unauthorized update rejected with 403: ${updateRejected ? 'YES' : 'NO'}`);
    console.log(`- Unauthorized delete rejected with 403: ${deleteRejected ? 'YES' : 'NO'}`);
    console.log(`- Target item remained unaltered in DB: ${itemNotModified ? 'YES' : 'NO'}`);
    console.log(`Result: ${test2Passed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 3: Public Browse Items remains functional
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 3: Public Browse Items - Functionality Intact');
    console.log('----------------------------------------------------------------');

    const publicReq = { query: { limit: 10 } };
    const publicRes = createMockRes();
    await getItems(publicReq, publicRes);

    const publicItemsCount = publicRes.data?.items?.length || 0;
    const test3Passed = publicRes.statusCode === 200 && publicItemsCount > 0;
    results['TEST 3: Public Browse Items Endpoint'] = test3Passed ? 'PASSED' : 'FAILED';
    console.log(`- Public items query status: ${publicRes.statusCode}`);
    console.log(`- Items returned for public browsing: ${publicItemsCount}`);
    console.log(`Result: ${test3Passed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 4: Notification Privacy - Scoped strictly to authenticated user
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 4: Notification Privacy - Strict User Isolation');
    console.log('----------------------------------------------------------------');

    const notifB = await Notification.create({
      user: userB._id,
      title: 'Private Notification for User B',
      message: 'Secret message meant only for User B',
      type: 'info',
      read: false,
    });

    const notifReqA = { user: userA };
    const notifResA = createMockRes();
    await getNotifications(notifReqA, notifResA);

    const userANotifs = notifResA.data?.notifications || [];
    const notifBLeakedToA = userANotifs.some(
      (n) => n._id.toString() === notifB._id.toString()
    );

    const markReqA = { user: userA, params: { id: notifB._id } };
    const markResA = createMockRes();
    await markAsRead(markReqA, markResA);

    const markRejected = markResA.statusCode === 404;

    const notifBInDb = await Notification.findById(notifB._id);
    const notifBStillUnread = notifBInDb.read === false;

    const test4Passed = !notifBLeakedToA && markRejected && notifBStillUnread;
    results['TEST 4: Notification Privacy Isolation (Read & Update)'] = test4Passed ? 'PASSED' : 'FAILED';
    console.log(`- User B's notification leaked to User A: ${notifBLeakedToA ? 'YES (FAIL)' : 'NO (SECURE)'}`);
    console.log(`- User A marking User B notification returned 404: ${markRejected ? 'YES' : 'NO'}`);
    console.log(`- User B notification unread status preserved: ${notifBStillUnread ? 'YES' : 'NO'}`);
    console.log(`Result: ${test4Passed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 5: Automatic Gmail Match Notification - Sent to Actual Reporter
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 5: Automatic Match Email - Sent to Actual Reporter');
    console.log('----------------------------------------------------------------');

    const dispatchedEmails = [];
    const mockTransporter = {
      sendMail: async (mailOptions) => {
        dispatchedEmails.push(mailOptions);
        return { messageId: `mock-msg-${Date.now()}` };
      },
      verify: async () => true,
    };
    setTransporter(mockTransporter);

    const testLostItem = await Item.create({
      itemName: 'Lost Dell Laptop Bag',
      type: 'lost',
      category: 'Bags',
      description: 'Black Dell laptop bag with charger inside',
      date: new Date(),
      location: 'Computer Center Lab 3',
      reportedBy: userA._id,
      status: 'lost',
    });

    const testFoundItem = await Item.create({
      itemName: 'Found Black Laptop Bag',
      type: 'found',
      category: 'Bags',
      description: 'Found black laptop backpack near Lab 3',
      date: new Date(),
      location: 'Computer Center Corridor',
      reportedBy: userB._id,
      status: 'found',
    });

    const mockMatchQualifying = [
      {
        itemId: testFoundItem._id.toString(),
        itemName: testFoundItem.itemName,
        location: testFoundItem.location,
        type: 'found',
        category: 'Bags',
        similarityScore: 0.925,
        reportedBy: userB._id,
      },
    ];

    await createMatchNotifications(testLostItem, mockMatchQualifying);

    const capturedEmailToLost = dispatchedEmails.find((e) => e.to === userA.email);
    const emailToLostReporter = Boolean(capturedEmailToLost);
    const emailContainsLostName = capturedEmailToLost ? capturedEmailToLost.text.includes('Lost Dell Laptop Bag') : false;
    const emailContainsFoundName = capturedEmailToLost ? capturedEmailToLost.text.includes('Found Black Laptop Bag') : false;
    const emailContainsLocation = capturedEmailToLost ? capturedEmailToLost.text.includes('Computer Center') : false;
    const emailContainsLink = capturedEmailToLost ? capturedEmailToLost.text.includes(`/items/${testFoundItem._id}`) : false;
    const emailFromSender = capturedEmailToLost ? capturedEmailToLost.from.includes('findit.bitsathy@gmail.com') : false;

    // Verify DB tracking on Notification document
    const notificationDoc1 = await Notification.findOne({
      user: userA._id,
      lostItem: testLostItem._id,
      foundItem: testFoundItem._id,
    });

    const dbTrackingSuccess = notificationDoc1 && notificationDoc1.emailSent === true && notificationDoc1.emailRecipient === userA.email;

    const test5Passed =
      emailToLostReporter &&
      emailContainsLostName &&
      emailContainsFoundName &&
      emailContainsLocation &&
      emailContainsLink &&
      emailFromSender &&
      dbTrackingSuccess;

    results['TEST 5: Gmail Notification to LOST Reporter & DB Tracking'] = test5Passed ? 'PASSED' : 'FAILED';
    console.log(`- Email dispatched to LOST reporter (${userA.email}): ${emailToLostReporter ? 'YES' : 'NO'}`);
    console.log(`- Sender is findit.bitsathy@gmail.com: ${emailFromSender ? 'YES' : 'NO'}`);
    console.log(`- Email contains lost item name: ${emailContainsLostName ? 'YES' : 'NO'}`);
    console.log(`- Email contains found item name: ${emailContainsFoundName ? 'YES' : 'NO'}`);
    console.log(`- Email contains campus location: ${emailContainsLocation ? 'YES' : 'NO'}`);
    console.log(`- Email contains link to item: ${emailContainsLink ? 'YES' : 'NO'}`);
    console.log(`- DB record tracked with emailSent=true: ${dbTrackingSuccess ? 'YES' : 'NO'}`);
    console.log(`Result: ${test5Passed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 6: Reverse Flow - When FOUND item is created, LOST reporter gets notified
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 6: Reverse Flow - FOUND report matches existing LOST report');
    console.log('----------------------------------------------------------------');

    const emailCountBefore6 = dispatchedEmails.length;

    const existingLostItem = await Item.create({
      itemName: 'Lost Casio Scientific Calculator',
      type: 'lost',
      category: 'Electronics',
      description: 'Casio fx-991EX classwiz calculator',
      date: new Date(),
      location: 'Science Block 101',
      reportedBy: userA._id,
      status: 'lost',
    });

    const newlyCreatedFoundItem = await Item.create({
      itemName: 'Found Casio Scientific Calculator',
      type: 'found',
      category: 'Electronics',
      description: 'Found scientific calculator on desk in SB 101',
      date: new Date(),
      location: 'Science Block 101 Desk 4',
      reportedBy: userB._id,
      status: 'found',
    });

    const mockMatchReverse = [
      {
        itemId: existingLostItem._id.toString(),
        itemName: existingLostItem.itemName,
        type: 'lost',
        category: 'Electronics',
        similarityScore: 0.941,
        reportedBy: userA._id,
      },
    ];

    await createMatchNotifications(newlyCreatedFoundItem, mockMatchReverse);

    const capturedEmail2 = dispatchedEmails.slice(emailCountBefore6).find((e) => e.to === userA.email);
    const reverseEmailSentToLostReporter = Boolean(capturedEmail2);

    const test6Passed = reverseEmailSentToLostReporter;
    results['TEST 6: Reverse Flow - LOST Reporter Notified when FOUND Item Added'] = test6Passed ? 'PASSED' : 'FAILED';
    console.log(`- Recipient is User A (LOST reporter): ${reverseEmailSentToLostReporter ? 'YES' : 'NO'}`);
    console.log(`Result: ${test6Passed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 7: Persistent Duplicate Email Prevention across repeated runs
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 7: Duplicate Email Prevention Across Repeated Runs');
    console.log('----------------------------------------------------------------');

    const emailCountBefore7 = dispatchedEmails.length;

    await createMatchNotifications(testLostItem, mockMatchQualifying);

    const emailCountAfter7 = dispatchedEmails.length;
    const noDuplicateSent = emailCountBefore7 === emailCountAfter7;

    const test7Passed = noDuplicateSent;
    results['TEST 7: Persistent Duplicate Email Prevention'] = test7Passed ? 'PASSED' : 'FAILED';
    console.log(`- Email count before repeated run: ${emailCountBefore7}`);
    console.log(`- Email count after repeated run: ${emailCountAfter7}`);
    console.log(`- Duplicate email prevented: ${noDuplicateSent ? 'YES' : 'NO'}`);
    console.log(`Result: ${test7Passed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 8: Below-Threshold (< 0.86) Rejection
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 8: Below-Threshold (< 0.86) Rejection');
    console.log('----------------------------------------------------------------');

    const emailCountBefore8 = dispatchedEmails.length;

    const belowThresholdMatches = [
      {
        itemId: testFoundItem._id.toString(),
        itemName: testFoundItem.itemName,
        similarityScore: 0.785,
        reportedBy: userB._id,
      },
    ];

    const belowNotifs = await createMatchNotifications(testLostItem, belowThresholdMatches);
    const emailCountAfter8 = dispatchedEmails.length;

    const belowThresholdRejected = belowNotifs.length === 0 && emailCountBefore8 === emailCountAfter8;
    results['TEST 8: Similarity Threshold (< 0.86) Enforcement'] = belowThresholdRejected ? 'PASSED' : 'FAILED';
    console.log(`- Notifications created for 0.785 score: ${belowNotifs.length}`);
    console.log(`- Emails sent for below-threshold candidate: ${emailCountAfter8 - emailCountBefore8}`);
    console.log(`Result: ${belowThresholdRejected ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 9: Incompatible Category Rejection
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 9: Category Compatibility Filtering');
    console.log('----------------------------------------------------------------');

    const bagsCompatibleWithBags = isCategoryCompatible('Bags', 'Bags');
    const bagsCompatibleWithAccessories = isCategoryCompatible('Bags', 'Accessories');
    const electronicsCompatibleWithBags = isCategoryCompatible('Electronics', 'Bags');
    const electronicsCompatibleWithElectronics = isCategoryCompatible('Electronics', 'Electronics');

    const categoryFilterCorrect =
      bagsCompatibleWithBags === true &&
      bagsCompatibleWithAccessories === false &&
      electronicsCompatibleWithBags === false &&
      electronicsCompatibleWithElectronics === true;

    results['TEST 9: Category Compatibility Filtering'] = categoryFilterCorrect ? 'PASSED' : 'FAILED';
    console.log(`- Bags <-> Bags compatible: ${bagsCompatibleWithBags}`);
    console.log(`- Bags <-> Accessories incompatible: ${!bagsCompatibleWithAccessories}`);
    console.log(`- Electronics <-> Bags incompatible: ${!electronicsCompatibleWithBags}`);
    console.log(`Result: ${categoryFilterCorrect ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 10: Self-Match Handling - User Testing Both Reports Gets Correctly Notified
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 10: Self-Match Handling - User Notified of Matching Reports');
    console.log('----------------------------------------------------------------');

    const emailCountBefore10 = dispatchedEmails.length;

    // User A reported both LOST and FOUND items
    const selfLostItem = await Item.create({
      itemName: 'Self Lost Water Bottle',
      type: 'lost',
      category: 'Other',
      description: 'Blue insulated water bottle',
      date: new Date(),
      location: 'Gym',
      reportedBy: userA._id,
      status: 'lost',
    });

    const selfFoundItem = await Item.create({
      itemName: 'Self Found Water Bottle',
      type: 'found',
      category: 'Other',
      description: 'Blue insulated water bottle found at Gym',
      date: new Date(),
      location: 'Gym',
      reportedBy: userA._id,
      status: 'found',
    });

    const selfMatch = [
      {
        itemId: selfFoundItem._id.toString(),
        itemName: selfFoundItem.itemName,
        similarityScore: 0.95,
        reportedBy: userA._id,
      },
    ];

    const selfNotifs = await createMatchNotifications(selfLostItem, selfMatch);
    const emailCountAfter10 = dispatchedEmails.length;

    const selfMatchPrevented = selfNotifs.length === 0 && emailCountBefore10 === emailCountAfter10;
    results['TEST 10: Self-Match Prevention'] = selfMatchPrevented ? 'PASSED' : 'FAILED';
    console.log(`- In-app notification created for self-match: ${selfNotifs.length}`);
    console.log(`- Email dispatched for self-match: ${emailCountAfter10 - emailCountBefore10}`);
    console.log(`Result: ${selfMatchPrevented ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 11: Demo / Faculty Seed Email Address Exclusion
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 11: Demo / Faculty Seed Email Address Exclusion');
    console.log('----------------------------------------------------------------');

    const priyaDemoRejected = !isRealRecipientEmail('priya.staff@campus.edu');
    const campusEduRejected = !isRealRecipientEmail('student@campus.edu');
    const realEmailAccepted = isRealRecipientEmail('thilak.ct23@bitsathy.ac.in');
    const realGmailAccepted = isRealRecipientEmail('student@gmail.com');

    const demoExclusionPassed =
      priyaDemoRejected && campusEduRejected && realEmailAccepted && realGmailAccepted;

    results['TEST 11: Demo/Faculty Seed Email Exclusion'] = demoExclusionPassed ? 'PASSED' : 'FAILED';
    console.log(`- priya.staff@campus.edu delivery blocked: ${priyaDemoRejected ? 'YES' : 'NO'}`);
    console.log(`- @campus.edu delivery blocked: ${campusEduRejected ? 'YES' : 'NO'}`);
    console.log(`- Real college email (@bitsathy.ac.in) accepted: ${realEmailAccepted ? 'YES' : 'NO'}`);
    console.log(`- Real Gmail (@gmail.com) accepted: ${realGmailAccepted ? 'YES' : 'NO'}`);
    console.log(`Result: ${demoExclusionPassed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // TEST 12: Fault Tolerance - Safe Handling of Email Delivery Failures
    // ========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 12: Fault Tolerance - Safe Handling of Email Delivery Failures');
    console.log('----------------------------------------------------------------');

    const failingTransporter = {
      sendMail: async () => {
        throw new Error('SMTP connection timed out or authentication failed');
      },
    };
    setTransporter(failingTransporter);

    const testLostFail = await Item.create({
      itemName: 'Lost Graphing Calculator',
      type: 'lost',
      category: 'Electronics',
      description: 'TI-84 plus CE graphing calculator',
      date: new Date(),
      location: 'Math Block 202',
      reportedBy: userA._id,
      status: 'lost',
    });

    const testFoundFail = await Item.create({
      itemName: 'Found Graphing Calculator',
      type: 'found',
      category: 'Electronics',
      description: 'Found TI-84 calculator in room 202',
      date: new Date(),
      location: 'Math Block 202',
      reportedBy: userB._id,
      status: 'found',
    });

    const failMatches = [
      {
        itemId: testFoundFail._id.toString(),
        itemName: testFoundFail.itemName,
        similarityScore: 0.93,
        reportedBy: userB._id,
      },
    ];

    let failureHandledSafely = false;
    let notifDocFail = null;
    try {
      const created = await createMatchNotifications(testLostFail, failMatches);
      failureHandledSafely = created.length >= 1;
      notifDocFail = await Notification.findById(created[0]._id);
    } catch (err) {
      failureHandledSafely = false;
    }

    const emailErrorRecorded = notifDocFail && notifDocFail.emailSent === false && notifDocFail.emailError !== null;

    const test12Passed = failureHandledSafely && emailErrorRecorded;
    results['TEST 12: Safe Handling of Email Failures (Non-blocking)'] = test12Passed ? 'PASSED' : 'FAILED';
    console.log(`- Notification creation succeeded despite email failure: ${failureHandledSafely ? 'YES' : 'NO'}`);
    console.log(`- Failure recorded in notification.emailError: ${emailErrorRecorded ? 'YES' : 'NO'}`);
    console.log(`Result: ${test12Passed ? 'PASSED' : 'FAILED'}\n`);

    // ========================================================================
    // Cleanup temporary test items
    // ========================================================================
    await Item.deleteMany({
      _id: {
        $in: [
          itemA._id,
          itemB._id,
          testLostItem._id,
          testFoundItem._id,
          existingLostItem._id,
          newlyCreatedFoundItem._id,
          selfLostItem._id,
          selfFoundItem._id,
          testLostFail._id,
          testFoundFail._id,
        ],
      },
    });

    await Notification.deleteMany({
      $or: [
        { _id: notifB._id },
        { lostItem: { $in: [testLostItem._id, existingLostItem._id, selfLostItem._id, testLostFail._id] } },
      ],
    });

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('================================================================');
    console.log('                     TEST SUMMARY RESULTS                       ');
    console.log('================================================================');
    let allPassed = true;
    for (const [testName, status] of Object.entries(results)) {
      console.log(`[${status}] ${testName}`);
      if (status !== 'PASSED') {
        allPassed = false;
      }
    }
    console.log('================================================================');
    console.log(`Final Status: ${allPassed ? 'ALL TESTS PASSED SUCCESSFULLY' : 'SOME TESTS FAILED'}`);
    console.log('================================================================');

    await mongoose.disconnect();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('[Test Suite Error]:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

runTestSuite();
