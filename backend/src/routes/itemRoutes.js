const express = require('express');
const router = express.Router();
const {
  createLostItem,
  createFoundItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyReports,
  getStatsSummary,
} = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

// Public stats
router.get('/stats/summary', getStatsSummary);

// User-specific reports
router.get('/user/my-reports', protect, getMyReports);

// Item creation
router.post('/lost', protect, createLostItem);
router.post('/found', protect, createFoundItem);

// Item search & list
router.get('/', getItems);
router.get('/:id', getItemById);

// Update and Delete
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;
