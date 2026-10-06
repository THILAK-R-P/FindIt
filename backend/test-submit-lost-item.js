const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Item = require('./src/models/Item');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const { analyzeAndFindMatches } = require('./src/services/aiMatchingService');

const testSubmitLostItem = async () => {
  console.log('====================================================');
  console.log('  Submitting New Lost Item with Image (Gemini 3.8 Flash Test)');
  console.log('====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';
  try {
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected to MongoDB.');

    // Find a student user to associate the report with
    const reporter = await User.findOne({ role: 'student' }) || await User.findOne();
    if (!reporter) {
      console.error('[Error] No user found in database to submit lost item.');
      process.exit(1);
    }

    // Get an existing image from DB to use as the uploaded photo
    const itemWithImage = await Item.findOne({ imageUrl: { $exists: true, $regex: '^data:image' } });
    if (!itemWithImage || !itemWithImage.imageUrl) {
      console.error('[Error] No existing image found in database to attach.');
      process.exit(1);
    }

    console.log(`[User] Reporting as: ${reporter.name} (${reporter.email})`);

    // 1. Create item in DB matching createLostItem controller logic
    const newItem = await Item.create({
      itemName: 'Lost Smart Watch with White Screen',
      type: 'lost',
      category: 'Electronics',
      description: 'Lost during database lecture in room 302, contains notes on screen.',
      date: new Date(),
      time: '11:00 AM',
      location: 'Academic Block 3 - Room 302',
      brand: '',
      color: 'Black',
      distinctiveMarks: 'Displaying lecture notes',
      imageUrl: itemWithImage.imageUrl,
      status: 'lost',
      reportedBy: reporter._id,
    });

    console.log(`[Database] Created lost item: '${newItem.itemName}' (ID: ${newItem._id})`);

    // Create user notification (matching controller flow)
    await Notification.create({
      user: reporter._id,
      title: 'Lost Item Report Submitted',
      message: `Your report for '${newItem.itemName}' at '${newItem.location}' has been recorded.`,
      type: 'report_created',
      link: `/items/${newItem._id}`,
    });

    // 2. Call AI pipeline hook (matching controller line 56: await analyzeAndFindMatches(item))
    console.log('\n[AI Pipeline Hook] Invoking analyzeAndFindMatches(item)...');
    const aiResult = await analyzeAndFindMatches(newItem);

    console.log('\n--- Controller AI Result ---');
    console.log(JSON.stringify(aiResult, null, 2));
    console.log('----------------------------\n');

    // 3. Verify item in DB has embedding and aiProcessed
    const fetched = await Item.findById(newItem._id);
    console.log('====================================================');
    console.log('  [MongoDB Verification] Checking Persisted Document:');
    console.log('====================================================');
    console.log(`  Item ID:          ${fetched._id}`);
    console.log(`  Item Name:        ${fetched.itemName}`);
    console.log(`  aiProcessed:      ${fetched.aiProcessed}`);
    console.log(`  aiAttributes:     ${fetched.aiAttributes ? fetched.aiAttributes.objectType : 'None'}`);
    console.log(`  embedding in DB:  ${Array.isArray(fetched.embedding)}`);
    console.log(`  embedding dim:    ${fetched.embedding ? fetched.embedding.length : 0}`);
    if (fetched.embedding && fetched.embedding.length > 0) {
      console.log(`  vector sample:    [${fetched.embedding.slice(0, 5).join(', ')}, ...]`);
    }
    console.log('====================================================');

    if (fetched.aiProcessed && fetched.embedding && fetched.embedding.length === 3072) {
      console.log('[Phase 2 Verified] Gemini image analysis + 3072-dim embedding successfully generated & stored in MongoDB!');
    } else {
      console.error('[Verification Failed] Document was not updated with expected embedding values.');
    }
  } catch (err) {
    console.error('[Test Error]', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testSubmitLostItem();
