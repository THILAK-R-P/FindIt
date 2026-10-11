const Item = require('../models/Item');
const Notification = require('../models/Notification');
const { analyzeAndFindMatches } = require('../services/aiMatchingService');

// @desc    Report a lost item
// @route   POST /api/items/lost
// @access  Private
const createLostItem = async (req, res, next) => {
  try {
    const {
      itemName,
      category,
      description,
      date,
      time,
      location,
      brand,
      color,
      distinctiveMarks,
      imageUrl,
    } = req.body;

    if (!itemName || !category || !description || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Item Name, Category, Description, Date, Location)',
      });
    }

    const item = await Item.create({
      itemName: itemName.trim(),
      type: 'lost',
      category,
      description: description.trim(),
      date,
      time: time || '',
      location: location.trim(),
      brand: brand ? brand.trim() : '',
      color: color ? color.trim() : '',
      distinctiveMarks: distinctiveMarks ? distinctiveMarks.trim() : '',
      imageUrl: imageUrl || '',
      status: 'lost',
      reportedBy: req.user._id,
    });

    // Create user notification
    await Notification.create({
      user: req.user._id,
      title: 'Lost Item Report Submitted',
      message: `Your report for '${item.itemName}' at '${item.location}' has been recorded. We will notify you if a matching item is found.`,
      type: 'report_created',
      link: `/items/${item._id}`,
    });

    // Call AI pipeline hook (Gemini Analysis -> Embedding -> FAISS Search)
    try {
      await analyzeAndFindMatches(item);
    } catch (aiErr) {
      console.error('[AI Hook Warning] Error in AI pipeline during lost item report:', aiErr.message);
    }

    const populatedItem = await Item.findById(item._id).populate(
      'reportedBy',
      'name email studentId phone role'
    );

    return res.status(201).json({
      success: true,
      message: 'Lost item reported successfully',
      item: populatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a found item
// @route   POST /api/items/found
// @access  Private
const createFoundItem = async (req, res, next) => {
  try {
    const {
      itemName,
      category,
      description,
      date,
      time,
      location,
      brand,
      color,
      distinctiveMarks,
      imageUrl,
    } = req.body;

    if (!itemName || !category || !description || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Item Name, Category, Description, Date, Location)',
      });
    }

    const item = await Item.create({
      itemName: itemName.trim(),
      type: 'found',
      category,
      description: description.trim(),
      date,
      time: time || '',
      location: location.trim(),
      brand: brand ? brand.trim() : '',
      color: color ? color.trim() : '',
      distinctiveMarks: distinctiveMarks ? distinctiveMarks.trim() : '',
      imageUrl: imageUrl || '',
      status: 'found',
      reportedBy: req.user._id,
    });

    // Create user notification
    await Notification.create({
      user: req.user._id,
      title: 'Found Item Report Submitted',
      message: `Thank you for reporting found item '${item.itemName}' at '${item.location}'. The community appreciates your honesty!`,
      type: 'report_created',
      link: `/items/${item._id}`,
    });

    // Call AI pipeline hook (Gemini Analysis -> Embedding -> FAISS Search)
    try {
      await analyzeAndFindMatches(item);
    } catch (aiErr) {
      console.error('[AI Hook Warning] Error in AI pipeline during found item report:', aiErr.message);
    }

    const populatedItem = await Item.findById(item._id).populate(
      'reportedBy',
      'name email studentId phone role'
    );

    return res.status(201).json({
      success: true,
      message: 'Found item reported successfully',
      item: populatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all items with search, filters, sorting & pagination
// @route   GET /api/items
// @access  Public
const getItems = async (req, res, next) => {
  try {
    const {
      search,
      type,
      category,
      location,
      status,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    // Filter by type (lost / found)
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Filter by location
    if (location && location !== 'all') {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Search query across fields
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { itemName: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { brand: searchRegex },
        { color: searchRegex },
        { distinctiveMarks: searchRegex },
      ];
    }

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortOptions = { date: 1 };
    } else if (sortBy === 'date_desc') {
      sortOptions = { date: -1 };
    } else if (sortBy === 'name_asc') {
      sortOptions = { itemName: 1 };
    } else if (sortBy === 'name_desc') {
      sortOptions = { itemName: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const total = await Item.countDocuments(filter);
    const items = await Item.find(filter)
      .populate('reportedBy', 'name email studentId role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Public
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      'reportedBy',
      'name email studentId phone role'
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    return res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an item report
// @route   PUT /api/items/:id
// @access  Private (Owner or Admin)
const updateItem = async (req, res, next) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check authorization: Owner or Admin
    const isOwner = item.reportedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this report',
      });
    }

    const previousStatus = item.status;

    // Fields that can be updated
    const allowedUpdates = [
      'itemName',
      'category',
      'description',
      'date',
      'time',
      'location',
      'brand',
      'color',
      'distinctiveMarks',
      'imageUrl',
      'status',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    const updatedItem = await item.save();

    // If status was changed by admin or owner, send notification to original reporter
    if (req.body.status && req.body.status !== previousStatus) {
      await Notification.create({
        user: item.reportedBy,
        title: 'Item Status Updated',
        message: `The status of your reported item '${item.itemName}' was changed from '${previousStatus}' to '${item.status}'.`,
        type: 'status_updated',
        link: `/items/${item._id}`,
      });
    }

    const populatedItem = await Item.findById(updatedItem._id).populate(
      'reportedBy',
      'name email studentId phone role'
    );

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      item: populatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an item report
// @route   DELETE /api/items/:id
// @access  Private (Owner or Admin)
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check authorization: Owner or Admin
    const isOwner = item.reportedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this report',
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get items reported by current user
// @route   GET /api/items/user/my-reports
// @access  Private
const getMyReports = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = { reportedBy: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public high-level stats for Landing & Dashboard
// @route   GET /api/items/stats/summary
// @access  Public
const getStatsSummary = async (req, res, next) => {
  try {
    const totalLost = await Item.countDocuments({ type: 'lost' });
    const totalFound = await Item.countDocuments({ type: 'found' });
    const recovered = await Item.countDocuments({
      status: { $in: ['recovered', 'claimed'] },
    });
    const totalReports = await Item.countDocuments();

    return res.status(200).json({
      success: true,
      stats: {
        totalReports,
        totalLost,
        totalFound,
        recovered,
        recoveryRate: totalReports > 0 ? Math.round((recovered / totalReports) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLostItem,
  createFoundItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyReports,
  getStatsSummary,
};
