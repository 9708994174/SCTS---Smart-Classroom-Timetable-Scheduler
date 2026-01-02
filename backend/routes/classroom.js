const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/classroom
// @desc    Get all classrooms
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { roomType, minCapacity, building } = req.query;
    let query = { isActive: true };

    if (roomType) query.roomType = roomType;
    if (minCapacity) query.capacity = { $gte: parseInt(minCapacity) };
    if (building) query.building = building;

    const classrooms = await Classroom.find(query).sort({ roomID: 1 });
    
    res.json({
      success: true,
      count: classrooms.length,
      data: classrooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/classroom/:id
// @desc    Get single classroom
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    res.json({
      success: true,
      data: classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/classroom
// @desc    Create classroom
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    res.status(201).json({
      success: true,
      data: classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/classroom/:id
// @desc    Update classroom
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    res.json({
      success: true,
      data: classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/classroom/:id
// @desc    Delete classroom
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    res.json({
      success: true,
      message: 'Classroom deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

