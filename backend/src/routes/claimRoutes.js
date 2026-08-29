const express = require('express');
const router = express.Router();
const {
  createClaim,
  getClaims,
  getClaimById,
  updateClaimStatus,
} = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', createClaim);
router.get('/', getClaims);
router.get('/:id', getClaimById);
router.patch('/:id/status', authorize('admin'), updateClaimStatus);

module.exports = router;
