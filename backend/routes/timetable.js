const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/timetable
// @desc    Get all timetables
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { academicYear, semester, department, status } = req.query;
    let query = {};

    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (department) query.department = department;
    if (status) query.status = status;

    const timetables = await Timetable.find(query)
      .populate('generatedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate({
        path: 'entries.faculty',
        select: 'name facultyID department'
      })
      .populate({
        path: 'entries.subject',
        select: 'subjectName subjectID credits'
      })
      .populate({
        path: 'entries.classroom',
        select: 'roomID building capacity roomType'
      })
      .populate({
        path: 'entries.timeslot',
        select: 'day startTime endTime'
      })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: timetables.length,
      data: timetables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/timetable/:id
// @desc    Get single timetable
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate({
        path: 'entries.faculty',
        select: 'name facultyID department'
      })
      .populate({
        path: 'entries.subject',
        select: 'subjectName subjectID credits'
      })
      .populate({
        path: 'entries.classroom',
        select: 'roomID building capacity roomType'
      })
      .populate({
        path: 'entries.timeslot',
        select: 'day startTime endTime'
      });
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/timetable/:id/approve
// @desc    Approve timetable
// @access  Private (Admin only)
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // Allow approving from 'generated' or 'review' status
    if (!['generated', 'review', 'draft'].includes(timetable.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve timetable with status: ${timetable.status}`
      });
    }

    timetable.status = 'approved';
    timetable.approvedBy = req.user.id;
    timetable.approvedAt = new Date();
    await timetable.save();

    // Create notifications for timetable approval
    const { notifyTimetableApproved } = require('../utils/notifications');
    await notifyTimetableApproved(timetable);

    res.json({
      success: true,
      message: 'Timetable approved successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Error approving timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/timetable/:id/publish
// @desc    Publish timetable (can publish from generated or approved status)
// @access  Private (Admin only)
router.put('/:id/publish', protect, authorize('admin'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // Allow publishing from 'generated' or 'approved' status
    if (!['generated', 'approved'].includes(timetable.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot publish timetable with status: ${timetable.status}. Status must be 'generated' or 'approved'.`
      });
    }

    // Auto-approve if status is 'generated'
    if (timetable.status === 'generated') {
      timetable.status = 'approved';
      timetable.approvedBy = req.user.id;
      timetable.approvedAt = new Date();
    }

    timetable.status = 'published';
    timetable.publishedAt = new Date();
    await timetable.save();

    // Populate timetable entries before creating notifications
    await timetable.populate({
      path: 'entries.faculty',
      select: 'user'
    });

    // Create notifications for timetable publication
    const { notifyTimetablePublished } = require('../utils/notifications');
    await notifyTimetablePublished(timetable);

    res.json({
      success: true,
      message: 'Timetable published successfully. Faculty can now view it.',
      data: timetable
    });
  } catch (error) {
    console.error('Error publishing timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

