const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Item = require('./src/models/Item');

const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';

const testHttpUpload = async () => {
  try {
    console.log('--- 1. Testing Auth Login ---');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sukesh@campus.edu',
        password: 'Password@123',
      }),
    });

    const loginData = await loginRes.json();
    console.log('Login HTTP status:', loginRes.status);
    console.log('Login success:', loginData.success);

    if (!loginData.token) {
      console.error('Failed to get token:', loginData);
      process.exit(1);
    }
    const token = loginData.token;

    console.log('\n--- 2. Fetching Seed Image from Database ---');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit');
    const seedItem = await Item.findOne({
      imageUrl: { $exists: true, $regex: '^data:image' },
    });

    if (!seedItem || !seedItem.imageUrl) {
      console.error('No seed image found in DB');
      process.exit(1);
    }

    console.log(`Seed item: '${seedItem.itemName}'`);
    console.log(`Image data URL length: ${seedItem.imageUrl.length} characters`);

    console.log('\n--- 3. Sending POST /api/items/lost with Image (Measuring Request Time) ---');
    console.time('Total HTTP Request Time');
    const reportRes = await fetch(`${API_URL}/api/items/lost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itemName: 'HTTP Test Lost Item with Photo',
        category: 'Documents',
        description: 'Testing image upload via HTTP endpoint with AI pipeline',
        date: '2026-10-06',
        time: '14:30',
        location: 'Library 2nd Floor',
        brand: 'MongoDB',
        color: 'Black',
        distinctiveMarks: 'White handwriting',
        imageUrl: seedItem.imageUrl,
      }),
    });
    console.timeEnd('Total HTTP Request Time');

    console.log('Report HTTP Status:', reportRes.status);
    const reportData = await reportRes.json();
    console.log('Report Response Body:');
    console.log(JSON.stringify(reportData, null, 2));

    if (reportRes.status === 201) {
      console.log('\n[SUCCESS] Image upload and report submission via HTTP API completed successfully!');
    } else {
      console.error('\n[FAILED] Request returned non-201 status code.');
    }
  } catch (err) {
    console.error('Error during HTTP upload test:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testHttpUpload();
