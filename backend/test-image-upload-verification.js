const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Item = require('./src/models/Item');
const User = require('./src/models/User');

const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';

// Sample 1x1 PNG base64 data url for testing image upload
const SAMPLE_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const runVerification = async () => {
  console.log('====================================================');
  console.log('  FindIt - Image Upload Complete Flow Verification');
  console.log('====================================================\n');

  let token = '';
  let testUserId = '';

  try {
    // 1. Authenticate to obtain token
    console.log('[Step 1] Authenticating test student user...');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sukesh@campus.edu',
        password: 'Password@123',
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.token) {
      throw new Error(`Login failed (${loginRes.status}): ${JSON.stringify(loginData)}`);
    }
    token = loginData.token;
    testUserId = loginData.user?._id;
    console.log(`[Step 1 PASSED] Authenticated as '${loginData.user?.name}' (${testUserId})\n`);

    // Connect to MongoDB directly for verification
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit');

    // 2. Test LOST Item Creation WITH Image
    console.log('----------------------------------------------------');
    console.log('[Test 1] Submit LOST item WITH image via HTTP POST /api/items/lost');
    console.log('----------------------------------------------------');

    const lostPayload = {
      itemName: 'Verification Test Lost Bag with Photo',
      category: 'Bags',
      description: 'Navy blue backpack containing notebooks and pencil case',
      date: new Date().toISOString().split('T')[0],
      time: '10:15 AM',
      location: 'Library',
      brand: 'Wildcraft',
      color: 'Navy Blue',
      distinctiveMarks: 'Yellow key tag attached to main zipper',
      imageUrl: SAMPLE_IMAGE_DATA_URL,
    };

    const lostRes = await fetch(`${API_URL}/api/items/lost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(lostPayload),
    });

    const lostData = await lostRes.json();
    console.log('HTTP Status Code:', lostRes.status);
    console.log('API Response success:', lostData.success);

    if (lostRes.status !== 201 || !lostData.item || !lostData.item._id) {
      throw new Error(`Failed to create lost item: ${JSON.stringify(lostData)}`);
    }

    const lostItemId = lostData.item._id;
    console.log('Created Item ID:', lostItemId);
    console.log('Response imageUrl length:', lostData.item.imageUrl?.length || 0);

    // Verify in MongoDB
    const lostItemInDb = await Item.findById(lostItemId);
    const lostImagePersisted = Boolean(lostItemInDb && lostItemInDb.imageUrl === SAMPLE_IMAGE_DATA_URL);
    console.log('MongoDB Persistence Confirmed:', lostImagePersisted);

    if (!lostImagePersisted) {
      throw new Error('Lost item image URL was not stored correctly in MongoDB!');
    }
    console.log('>>> TEST 1 RESULT: PASSED <<<\n');

    // 3. Test FOUND Item Creation WITH Image
    console.log('----------------------------------------------------');
    console.log('[Test 2] Submit FOUND item WITH image via HTTP POST /api/items/found');
    console.log('----------------------------------------------------');

    const foundPayload = {
      itemName: 'Verification Test Found Bag with Photo',
      category: 'Bags',
      description: 'Found navy backpack on second floor desk',
      date: new Date().toISOString().split('T')[0],
      time: '11:45 AM',
      location: 'Library',
      brand: 'Wildcraft',
      color: 'Navy Blue',
      distinctiveMarks: 'Yellow key tag',
      imageUrl: SAMPLE_IMAGE_DATA_URL,
    };

    const foundRes = await fetch(`${API_URL}/api/items/found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(foundPayload),
    });

    const foundData = await foundRes.json();
    console.log('HTTP Status Code:', foundRes.status);
    console.log('API Response success:', foundData.success);

    if (foundRes.status !== 201 || !foundData.item || !foundData.item._id) {
      throw new Error(`Failed to create found item: ${JSON.stringify(foundData)}`);
    }

    const foundItemId = foundData.item._id;
    console.log('Created Item ID:', foundItemId);
    console.log('Response imageUrl length:', foundData.item.imageUrl?.length || 0);

    // Verify in MongoDB
    const foundItemInDb = await Item.findById(foundItemId);
    const foundImagePersisted = Boolean(foundItemInDb && foundItemInDb.imageUrl === SAMPLE_IMAGE_DATA_URL);
    console.log('MongoDB Persistence Confirmed:', foundImagePersisted);

    if (!foundImagePersisted) {
      throw new Error('Found item image URL was not stored correctly in MongoDB!');
    }
    console.log('>>> TEST 2 RESULT: PASSED <<<\n');

    // 4. Test Single Item Details Fetch (GET /api/items/:id)
    console.log('----------------------------------------------------');
    console.log('[Test 3] Verify image appears in Item Details View (GET /api/items/:id)');
    console.log('----------------------------------------------------');

    const detailRes = await fetch(`${API_URL}/api/items/${lostItemId}`);
    const detailData = await detailRes.json();
    console.log('HTTP Status Code:', detailRes.status);
    console.log('Item Name:', detailData.item?.itemName);
    const detailImageMatches = detailData.item?.imageUrl === SAMPLE_IMAGE_DATA_URL;
    console.log('Image URL Returned to Details View:', detailImageMatches);

    if (!detailImageMatches) {
      throw new Error('GET /api/items/:id did not return the stored image URL!');
    }
    console.log('>>> TEST 3 RESULT: PASSED <<<\n');

    // 5. Test Browse Items Fetch (GET /api/items)
    console.log('----------------------------------------------------');
    console.log('[Test 4] Verify image appears in Browse Directory View (GET /api/items)');
    console.log('----------------------------------------------------');

    const browseRes = await fetch(`${API_URL}/api/items?limit=10`);
    const browseData = await browseRes.json();
    console.log('HTTP Status Code:', browseRes.status);
    console.log('Total Items in Browse List:', browseData.items?.length);

    const foundInBrowse = browseData.items?.find((i) => i._id.toString() === lostItemId.toString());
    const browseImageMatches = Boolean(foundInBrowse && foundInBrowse.imageUrl === SAMPLE_IMAGE_DATA_URL);
    console.log('Found created item in browse list with intact image:', browseImageMatches);

    if (!browseImageMatches) {
      throw new Error('Browse items endpoint did not return the item with its image URL!');
    }
    console.log('>>> TEST 4 RESULT: PASSED <<<\n');

    // 6. Test Reporting WITHOUT Image (Optional Image Check)
    console.log('----------------------------------------------------');
    console.log('[Test 5] Verify reporting still works when NO image is attached (optional image)');
    console.log('----------------------------------------------------');

    const noImagePayload = {
      itemName: 'Verification Test Lost Keys without Photo',
      category: 'Keys',
      description: 'Bunch of keys with blue metallic keychain',
      date: new Date().toISOString().split('T')[0],
      time: '01:00 PM',
      location: 'Canteen',
      brand: '',
      color: 'Silver',
      distinctiveMarks: 'Blue keychain',
      imageUrl: '',
    };

    const noImageRes = await fetch(`${API_URL}/api/items/lost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(noImagePayload),
    });

    const noImageData = await noImageRes.json();
    console.log('HTTP Status Code:', noImageRes.status);
    console.log('API Response success:', noImageData.success);

    if (noImageRes.status !== 201 || !noImageData.item || !noImageData.item._id) {
      throw new Error(`Failed to create item without image: ${JSON.stringify(noImageData)}`);
    }

    const noImageItemId = noImageData.item._id;
    const noImageItemInDb = await Item.findById(noImageItemId);
    const noImagePersisted = Boolean(noImageItemInDb && noImageItemInDb.imageUrl === '');
    console.log('Report Created Successfully with empty imageUrl:', noImagePersisted);

    if (!noImagePersisted) {
      throw new Error('Item without image did not persist correctly!');
    }
    console.log('>>> TEST 5 RESULT: PASSED <<<\n');

    // 7. Clean up test records
    console.log('----------------------------------------------------');
    console.log('[Cleanup] Removing test verification items from database...');
    await Item.deleteMany({ _id: { $in: [lostItemId, foundItemId, noImageItemId] } });
    console.log('[Cleanup] Cleaned up test items successfully.');

    console.log('\n====================================================');
    console.log('  ALL 5 IMAGE UPLOAD VERIFICATION TESTS PASSED (100%)');
    console.log('====================================================');
  } catch (err) {
    console.error('\n[VERIFICATION ERROR]:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runVerification();
