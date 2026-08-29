const Claim = require('../models/Claim');
const Item = require('../models/Item');
const Notification = require('../models/Notification');

// @desc    Submit a new claim for a found/lost item
// @route   POST /api/claims
// @access  Private
const createClaim = async (req, res, next) => {
  try {
    const { itemId, reason, proofDetails, contactPhone } = req.body;

    if (!itemId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Item ID and reason/proof are required to submit a claim',
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check if user already claimed this item
    const existingClaim = await Claim.findOne({
      item: itemId,
      claimant: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an active claim for this item',
      });
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: req.user._id,
      reason: reason.trim(),
      proofDetails: proofDetails ? proofDetails.trim() : '',
      contactPhone: contactPhone ? contactPhone.trim() : req.user.phone || '',
      status: 'pending',
    });

    // Notify item reporter if someone claimed their found item
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: item.reportedBy,
        title: 'New Ownership Claim Submitted',
        message: `A student/staff member submitted a claim for '${item.itemName}'. An administrator is reviewing it.`,
        type: 'claim_submitted',
        link: `/items/${item._id}`,
      });
    }

    // Notify claimant
    await Notification.create({
      user: req.user._id,
      title: 'Claim Submitted Successfully',
      message: `Your ownership claim for '${item.itemName}' was received and is pending admin verification.`,
      type: 'claim_submitted',
      link: `/items/${item._id}`,
    });

    const populatedClaim = await Claim.findById(claim._id)
      .populate('item', 'itemName type category location status imageUrl')
      .populate('claimant', 'name email studentId phone role');

    return res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      claim: populatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all claims (Admin sees all, User sees their own)
// @route   GET /api/claims
// @access  Private
const getClaims = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role !== 'admin') {
      filter.claimant = req.user._id;
    }

    const { status } = req.query;
    if (status && status !== 'all') {
      filter.status = status;
    }

    const claims = await Claim.find(filter)
      .populate('item', 'itemName type category location status imageUrl date')
      .populate('claimant', 'name email studentId phone role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get claim by ID
// @route   GET /api/claims/:id
// @access  Private
const getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('item')
      .populate('claimant', 'name email studentId phone role');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
      });
    }

    // Allow claimant or admin to view
    if (
      claim.claimant._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this claim',
      });
    }

    return res.status(200).json({
      success: true,
      claim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update claim status (Approve / Reject)
// @route   PATCH /api/claims/:id/status
// @access  Private (Admin Only)
const updateClaimStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected.',
      });
    }

    const claim = await Claim.findById(req.params.id).populate('item');
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
      });
    }

    claim.status = status;
    if (adminNotes !== undefined) claim.adminNotes = adminNotes;
    await claim.save();

    // If approved, update the item status to 'claimed' or 'recovered'
    if (status === 'approved' && claim.item) {
      await Item.findByIdAndUpdate(claim.item._id, {
        status: claim.item.type === 'found' ? 'claimed' : 'recovered',
      });
    }

    // Send notification to claimant
    await Notification.create({
      user: claim.claimant,
      title: `Claim ${status.toUpperCase()}: ${claim.item ? claim.item.itemName : 'Item'}`,
      message:
        status === 'approved'
          ? `Your claim for '${claim.item?.itemName}' has been APPROVED! Please visit the campus recovery desk to collect it.`
          : `Your claim for '${claim.item?.itemName}' was reviewed and rejected. Reason/Note: ${adminNotes || 'Verification unfulfilled'}.`,
      type: status === 'approved' ? 'claim_approved' : 'claim_rejected',
      link: `/items/${claim.item?._id}`,
    });

    const updatedClaim = await Claim.findById(claim._id)
      .populate('item', 'itemName type category location status imageUrl')
      .populate('claimant', 'name email studentId phone role');

    return res.status(200).json({
      success: true,
      message: `Claim status updated to ${status}`,
      claim: updatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim,
  getClaims,
  getClaimById,
  updateClaimStatus,
};
