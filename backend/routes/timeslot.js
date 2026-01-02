const express = require('express');
const router = express.Router();
const Timeslot = require('../models/Timeslot');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/timeslot
// @desc    Get all timeslots
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { day, shift } = req.query;
    let query = { isActive: true };

    if (day) query.day = day;
    if (shift) query.shift = shift;

    const timeslots = await Timeslot.find(query)
      .sort({ day: 1, startTime: 1 });
    
    res.json({
      success: true,
      count: timeslots.length,
      data: timeslots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/timeslot
// @desc    Create timeslot
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const timeslot = await Timeslot.create(req.body);
    res.status(201).json({
      success: true,
      data: timeslot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/timeslot/bulk
// @desc    Create multiple timeslots
// @access  Private (Admin only)
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const timeslots = await Timeslot.insertMany(req.body);
    res.status(201).json({
      success: true,
      count: timeslots.length,
      data: timeslots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/timeslot/:id
// @desc    Update timeslot
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const timeslot = await Timeslot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: 'Timeslot not found'
      });
    }

    res.json({
      success: true,
      data: timeslot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/timeslot/:id
// @desc    Delete timeslot
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const timeslot = await Timeslot.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: 'Timeslot not found'
      });
    }

    res.json({
      success: true,
      message: 'Timeslot deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

