const express = require('express');
const router = express.Router();
const Substitute = require('../models/Substitute');
const Timetable = require('../models/Timetable');
const Faculty = require('../models/Faculty');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// @route   POST /api/substitute
// @desc    Create a substitute assignment
// @access  Private (Admin, Faculty)
router.post('/', protect, async (req, res) => {
  try {
    const { originalFacultyId, substituteFacultyId, timetableEntryId, entryID, date, reason } = req.body;

    if (!originalFacultyId || !substituteFacultyId || !timetableEntryId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Original faculty, substitute faculty, timetable entry, and date are required'
      });
    }

    // Verify original faculty exists
    const originalFaculty = await Faculty.findById(originalFacultyId);
    if (!originalFaculty) {
      return res.status(404).json({
        success: false,
        message: 'Original faculty not found'
      });
    }

    // Verify substitute faculty exists
    const substituteFaculty = await Faculty.findById(substituteFacultyId);
    if (!substituteFaculty) {
      return res.status(404).json({
        success: false,
        message: 'Substitute faculty not found'
      });
    }

    // Verify timetable entry exists
    const timetable = await Timetable.findOne({ 'entries._id': timetableEntryId });
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    const entry = timetable.entries.id(timetableEntryId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    // Check if substitute already exists for this entry and date
    const existingSubstitute = await Substitute.findOne({
      timetableEntry: timetable._id,
      entryID: entryID || entry.entryID,
      date: new Date(date)
    });

    if (existingSubstitute) {
      return res.status(400).json({
        success: false,
        message: 'A substitute assignment already exists for this class on this date'
      });
    }

    // Create substitute
    const substitute = await Substitute.create({
      originalFaculty: originalFacultyId,
      substituteFaculty: substituteFacultyId,
      timetableEntry: timetable._id,
      entryID: entryID || entry.entryID,
      date: new Date(date),
      reason: reason || '',
      department: timetable.department,
      subject: entry.subject,
      classroom: entry.classroom,
      timeslot: entry.timeslot,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    if (req.user.role === 'admin') {
      substitute.approvedBy = req.user.id;
      substitute.approvedAt = new Date();
      await substitute.save();
    }

    await substitute.populate([
      { path: 'originalFaculty', select: 'name facultyID email department' },
      { path: 'substituteFaculty', select: 'name facultyID email department' },
      { path: 'subject', select: 'subjectName subjectID' },
      { path: 'classroom', select: 'roomID building' },
      { path: 'timeslot', select: 'day startTime endTime' }
    ]);

    // Notify substitute faculty
    if (substitute.substituteFaculty.user) {
      try {
        await createNotification(substitute.substituteFaculty.user, {
          type: 'system_announcement',
          title: 'Substitute Assignment',
          message: `You have been assigned as a substitute for ${originalFaculty.name} on ${new Date(date).toLocaleDateString()}.`,
          relatedEntity: {
            entityType: 'system',
            entityId: substitute._id
          },
          priority: 'high'
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Substitute assignment created successfully',
      data: substitute
    });
  } catch (error) {
    console.error('Error creating substitute:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/substitute
// @desc    Get all substitute assignments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, date, facultyId, department } = req.query;
    let query = {};

    // Faculty can only see their own substitutes
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (faculty) {
        query.$or = [
          { originalFaculty: faculty._id },
          { substituteFaculty: faculty._id }
        ];
      } else {
        return res.json({
          success: true,
          count: 0,
          data: []
        });
      }
    }

    if (status) query.status = status;
    if (date) query.date = new Date(date);
    if (facultyId && req.user.role === 'admin') {
      query.$or = [
        { originalFaculty: facultyId },
        { substituteFaculty: facultyId }
      ];
    }
    if (department && req.user.role === 'admin') {
      query.department = department;
    }

    const substitutes = await Substitute.find(query)
      .populate('originalFaculty', 'name facultyID email department')
      .populate('substituteFaculty', 'name facultyID email department')
      .populate('subject', 'subjectName subjectID')
      .populate('classroom', 'roomID building')
      .populate('timeslot', 'day startTime endTime')
      .populate('approvedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: substitutes.length,
      data: substitutes
    });
  } catch (error) {
    console.error('Error fetching substitutes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/substitute/:id
// @desc    Get single substitute assignment
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const substitute = await Substitute.findById(req.params.id)
      .populate('originalFaculty', 'name facultyID email department')
      .populate('substituteFaculty', 'name facultyID email department')
      .populate('subject', 'subjectName subjectID')
      .populate('classroom', 'roomID building')
      .populate('timeslot', 'day startTime endTime')
      .populate('approvedBy', 'name email');

    if (!substitute) {
      return res.status(404).json({
        success: false,
        message: 'Substitute assignment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (faculty && 
          substitute.originalFaculty._id.toString() !== faculty._id.toString() &&
          substitute.substituteFaculty._id.toString() !== faculty._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: substitute
    });
  } catch (error) {
    console.error('Error fetching substitute:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/substitute/:id
// @desc    Update substitute assignment (approve/reject/complete)
// @access  Private (Admin can approve/reject, Faculty can complete)
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const substitute = await Substitute.findById(req.params.id);

    if (!substitute) {
      return res.status(404).json({
        success: false,
        message: 'Substitute assignment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty || substitute.substituteFaculty.toString() !== faculty._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the assigned substitute can update this assignment.'
        });
      }
      // Faculty can only mark as completed
      if (status && status !== 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Faculty can only mark assignments as completed'
        });
      }
    }

    if (status) {
      substitute.status = status;
      if ((status === 'approved' || status === 'rejected') && req.user.role === 'admin') {
        substitute.approvedBy = req.user.id;
        substitute.approvedAt = new Date();
      }
      if (status === 'completed') {
        // Mark as completed
      }
    }

    if (reason !== undefined) {
      substitute.reason = reason;
    }

    await substitute.save();
    await substitute.populate([
      { path: 'originalFaculty', select: 'name facultyID email department' },
      { path: 'substituteFaculty', select: 'name facultyID email department' },
      { path: 'subject', select: 'subjectName subjectID' },
      { path: 'classroom', select: 'roomID building' },
      { path: 'timeslot', select: 'day startTime endTime' }
    ]);

    res.json({
      success: true,
      message: 'Substitute assignment updated successfully',
      data: substitute
    });
  } catch (error) {
    console.error('Error updating substitute:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/substitute/:id
// @desc    Delete substitute assignment
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const substitute = await Substitute.findByIdAndDelete(req.params.id);

    if (!substitute) {
      return res.status(404).json({
        success: false,
        message: 'Substitute assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Substitute assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting substitute:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

