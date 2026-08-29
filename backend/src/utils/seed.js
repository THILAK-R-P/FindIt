const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing collections
    await User.deleteMany();
    await Item.deleteMany();
    await Claim.deleteMany();
    await Notification.deleteMany();
    console.log('[Seed] Cleared existing database records.');

    // 1. Create Users
    const users = await User.create([
      {
        name: 'System Administrator',
        studentId: 'ADM-001',
        email: 'admin@findit.campus.edu',
        phone: '9876543210',
        password: 'Admin@123Password',
        role: 'admin',
      },
      {
        name: 'Sukesh R',
        studentId: 'CS202301',
        email: 'sukesh@campus.edu',
        phone: '9876543211',
        password: 'Password@123',
        role: 'student',
      },
      {
        name: 'Thilak R P',
        studentId: 'CS202302',
        email: 'thilak@campus.edu',
        phone: '9876543212',
        password: 'Password@123',
        role: 'student',
      },
      {
        name: 'Dr. Priya Sharma',
        studentId: 'STF-401',
        email: 'priya.staff@campus.edu',
        phone: '9876543213',
        password: 'Password@123',
        role: 'staff',
      },
      {
        name: 'Rahul Verma',
        studentId: 'EC202345',
        email: 'rahul@campus.edu',
        phone: '9876543214',
        password: 'Password@123',
        role: 'student',
      },
    ]);

    console.log(`[Seed] Created ${users.length} users (Admin, Staff, Students).`);

    const admin = users[0];
    const sukesh = users[1];
    const thilak = users[2];
    const priya = users[3];
    const rahul = users[4];

    // 2. Create Sample Items across campus locations
    const items = await Item.create([
      {
        itemName: 'Black Sony Wireless Headphones',
        type: 'lost',
        category: 'Electronics',
        description: 'Over-ear Sony WH-1000XM4 matte black headphones left on the second floor study table near the window.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        time: '14:30',
        location: 'Library',
        brand: 'Sony',
        color: 'Matte Black',
        distinctiveMarks: 'Small silver scratch on the left ear cup headband',
        status: 'lost',
        reportedBy: sukesh._id,
      },
      {
        itemName: 'Casio FX-991EX ClassWiz Calculator',
        type: 'found',
        category: 'Electronics',
        description: 'Scientific calculator with slide-on protective cover found under bench 14 after Math II tutorial.',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        time: '11:15',
        location: 'Main Block',
        brand: 'Casio',
        color: 'Black & White',
        distinctiveMarks: 'A small yellow smiley sticker on the back of the cover',
        status: 'found',
        reportedBy: rahul._id,
      },
      {
        itemName: 'Campus Student ID Card',
        type: 'found',
        category: 'ID Cards',
        description: 'RFID RFID Student identity card found on counter 2 in the campus cafeteria.',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        time: '13:00',
        location: 'Canteen',
        brand: 'Campus ID',
        color: 'Blue & White',
        distinctiveMarks: 'Belongs to Dept of Mechanical Engg (Roll: ME202412)',
        status: 'found',
        reportedBy: thilak._id,
      },
      {
        itemName: 'Navy Blue Stainless Steel Water Bottle',
        type: 'lost',
        category: 'Accessories',
        description: 'Insulated 750ml Milton thermal water bottle misplaced during basketball practice.',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        time: '17:45',
        location: 'Sports Ground',
        brand: 'Milton',
        color: 'Navy Blue',
        distinctiveMarks: 'Engraved with initials "T.R."',
        status: 'lost',
        reportedBy: thilak._id,
      },
      {
        itemName: 'HP Black Laptop Bag with Charger',
        type: 'found',
        category: 'Bags',
        description: 'Padded laptop shoulder bag with a 65W HP type-C power adapter and a spiral notebook inside.',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        time: '16:20',
        location: 'Computer Lab',
        brand: 'HP',
        color: 'Black',
        distinctiveMarks: 'Keychain with anime character attached to main zipper',
        status: 'claimed',
        reportedBy: priya._id,
      },
      {
        itemName: 'Engineering Mathematics Textbook (Vol 2)',
        type: 'lost',
        category: 'Books',
        description: 'Hardcover textbook by B.S. Grewal with lecture notes clipped into chapter 5.',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        time: '10:00',
        location: 'Auditorium',
        brand: 'Khanna Publishers',
        color: 'Red & Yellow',
        distinctiveMarks: 'Highlighted notes on pages 140-160',
        status: 'recovered',
        reportedBy: rahul._id,
      },
      {
        itemName: 'Anker 65W Fast Charger with Braided Cable',
        type: 'lost',
        category: 'Electronics',
        description: 'GaN compact dual USB-C charger left plugged into socket near the seminar hall stage.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        time: '15:10',
        location: 'Auditorium',
        brand: 'Anker',
        color: 'White',
        distinctiveMarks: 'Grey braided cable wrapped with velcro strap',
        status: 'lost',
        reportedBy: sukesh._id,
      },
      {
        itemName: 'Ring of 3 Campus Keys with Green Lanyard',
        type: 'found',
        category: 'Keys',
        description: 'Three brass keys on a campus robotics club lanyard found near the two-wheeler parking stand.',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        time: '09:00',
        location: 'Parking Area',
        brand: 'Generic',
        color: 'Green & Brass',
        distinctiveMarks: 'Green lanyard with "RoboClub 2025" lettering',
        status: 'found',
        reportedBy: priya._id,
      },
      {
        itemName: 'Keychron K2 Mechanical Keyboard',
        type: 'lost',
        category: 'Electronics',
        description: '75% layout wireless mechanical keyboard with RGB backlighting and brown switches.',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        time: '18:30',
        location: 'Computer Lab',
        brand: 'Keychron',
        color: 'Dark Grey',
        distinctiveMarks: 'Custom red Esc keycap',
        status: 'matched',
        reportedBy: sukesh._id,
      },
      {
        itemName: 'Brown Leather Bi-fold Wallet',
        type: 'lost',
        category: 'Accessories',
        description: 'Leather wallet containing library pass and campus bus card lost in the main block corridor.',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        time: '12:45',
        location: 'Main Block',
        brand: 'WildHorn',
        color: 'Dark Brown',
        distinctiveMarks: 'Stitched edges and a small coin pocket',
        status: 'lost',
        reportedBy: rahul._id,
      },
    ]);

    console.log(`[Seed] Created ${items.length} sample items across campus.`);

    // 3. Create Sample Claims
    await Claim.create([
      {
        item: items[4]._id, // HP Laptop Bag
        claimant: sukesh._id,
        reason: 'This is my personal HP laptop bag. I forgot it after the cloud computing lab session on Monday.',
        proofDetails: 'The spiral notebook inside has my name Sukesh R and student ID CS202301 written on the first page.',
        contactPhone: '9876543211',
        status: 'approved',
        adminNotes: 'Verified ID matches notebook details.',
      },
      {
        item: items[1]._id, // Casio Calculator
        claimant: thilak._id,
        reason: 'I misplaced my Casio 991EX in Main Block room 204 during the afternoon tutorial.',
        proofDetails: 'Has a yellow smiley sticker at the back of the sliding cover.',
        contactPhone: '9876543212',
        status: 'pending',
      },
    ]);

    // 4. Create Sample Notifications
    await Notification.create([
      {
        user: sukesh._id,
        title: 'Claim Approved!',
        message: 'Your claim for HP Black Laptop Bag has been approved. You can pick it up at the Admin Desk.',
        type: 'claim_approved',
        read: false,
        link: `/items/${items[4]._id}`,
      },
      {
        user: sukesh._id,
        title: 'Lost Item Registered',
        message: 'Your report for Black Sony Wireless Headphones was registered on campus board.',
        type: 'report_created',
        read: true,
        link: `/items/${items[0]._id}`,
      },
      {
        user: thilak._id,
        title: 'Found Item Registered',
        message: 'Thank you for reporting Campus Student ID Card. Community members can now view it.',
        type: 'report_created',
        read: true,
        link: `/items/${items[2]._id}`,
      },
      {
        user: admin._id,
        title: 'New Claim Pending Review',
        message: 'Student Thilak R P submitted an ownership claim for Casio FX-991EX Calculator.',
        type: 'claim_submitted',
        read: false,
        link: `/admin/claims`,
      },
    ]);

    console.log('[Seed] Sample claims and notifications created.');
    console.log('====================================================');
    console.log(' SEEDING COMPLETE');
    console.log(' Admin Login:   admin@findit.campus.edu  /  Admin@123Password');
    console.log(' Student Login: sukesh@campus.edu        /  Password@123');
    console.log(' Staff Login:   priya.staff@campus.edu   /  Password@123');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
