const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { syncIndexFromDB } = require('../services/faissService');

const cleanup = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';
  await mongoose.connect(uri);
  console.log('[Cleanup] Connected to MongoDB.');

  const priya = await User.findOne({ email: 'priya.staff@campus.edu' });
  const sukesh = await User.findOne({ email: 'sukesh@campus.edu' });

  // 1. Remove orphaned test items under Priya (keep only original 2 seed items)
  if (priya) {
    const keepPriyaTitles = [
      'HP Black Laptop Bag with Charger',
      'Ring of 3 Campus Keys with Green Lanyard',
    ];
    const deletedPriya = await Item.deleteMany({
      reportedBy: priya._id,
      itemName: { $nin: keepPriyaTitles },
    });
    console.log(`[Cleanup] Deleted ${deletedPriya.deletedCount} junk test items from Dr. Priya Sharma.`);
  }

  // 2. Remove orphaned test items under Sukesh (keep only original seed items)
  if (sukesh) {
    const junkPatterns = [
      /^HTTP Test/,
      /^Lost Brown Leather Tri-fold Wallet/,
      /^Lost Digital Lecture Notes Tablet/,
      /^Found Digital Notes Tablet/,
      /^watch$/,
      /^earbuds?$/,
    ];
    const deletedSukesh = await Item.deleteMany({
      reportedBy: sukesh._id,
      $or: junkPatterns.map((p) => ({ itemName: { $regex: p } })),
    });
    console.log(`[Cleanup] Deleted ${deletedSukesh.deletedCount} junk test items from Sukesh R.`);
  }

  // 3. Remove orphaned notifications whose items no longer exist or were test items
  const allItemIds = (await Item.find().select('_id').lean()).map((i) => i._id);
  const deletedNotifs = await Notification.deleteMany({
    $or: [
      { lostItem: { $nin: allItemIds, $ne: null } },
      { foundItem: { $nin: allItemIds, $ne: null } },
      { user: priya ? priya._id : null, message: { $regex: /dfsdf|ih|laptop|wrist watch|\b'a'\b/ } },
      { user: priya ? priya._id : null, title: 'Potential Match Found' },
    ],
  });
  console.log(`[Cleanup] Deleted ${deletedNotifs.deletedCount} orphaned/test notifications.`);

  // 4. Re-sync FAISS indices
  console.log('[Cleanup] Re-synchronizing FAISS indices from database...');
  await syncIndexFromDB('lost', true);
  await syncIndexFromDB('found', true);
  console.log('[Cleanup] FAISS indices synchronized successfully.');

  // Print remaining counts
  const totalItems = await Item.countDocuments();
  const totalNotifs = await Notification.countDocuments();
  console.log(`[Cleanup] Database now has ${totalItems} clean items and ${totalNotifs} notifications.`);

  await mongoose.disconnect();
  console.log('[Cleanup] Finished successfully.');
};

cleanup().catch((err) => {
  console.error('[Cleanup Error]:', err);
  process.exit(1);
});
