const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { generateTimetable } = require('../algorithms/optimizationEngine');
const { notifyTimetableGenerated } = require('../utils/notifications');
const Timetable = require('../models/Timetable');

// @route   POST /api/admin/generate-timetable
// @desc    Generate timetable
// @access  Private (Admin only)
router.post('/generate-timetable', protect, authorize('admin'), async (req, res) => {
  try {
    const { academicYear, semester, department, config } = req.body;

    if (!academicYear || !semester || !department) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: academicYear, semester, and department are required'
      });
    }

    const result = await generateTimetable({ 
      academicYear, 
      semester, 
      department, 
      config: { ...config, userId: req.user.id }
    });

    // The generateTimetable function returns the timetable ID, not the full object
    // So we need to fetch it
    const timetable = await Timetable.findById(result.timetable)
      .populate('generatedBy', 'name email')
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
      return res.status(500).json({
        success: false,
        message: 'Timetable generated but could not be retrieved'
      });
    }

    // Notify admins about timetable generation
    await notifyTimetableGenerated(timetable);

    res.status(201).json({
      success: true,
      message: result.message || 'Timetable generated successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Timetable generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    const Subject = require('../models/Subject');
    const Classroom = require('../models/Classroom');
    const Timeslot = require('../models/Timeslot');

    const [facultyCount, subjectCount, classroomCount, timeslotCount, timetableCount] = await Promise.all([
      Faculty.countDocuments({ isActive: true }),
      Subject.countDocuments({ isActive: true }),
      Classroom.countDocuments({ isActive: true }),
      Timeslot.countDocuments(),
      Timetable.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        faculty: facultyCount,
        subjects: subjectCount,
        classrooms: classroomCount,
        timeslots: timeslotCount,
        timetables: timetableCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/students
// @desc    Create a student
// @access  Private (Admin only)
router.post('/students', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, uid, department, semester, program, password } = req.body;

    if (!name || !email || !uid || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, uid, department, and semester are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { uid }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or UID already exists'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    // Create student
    const student = await User.create({
      name,
      email,
      uid,
      password: hashedPassword,
      role: 'student',
      department,
      semester: parseInt(semester),
      program: program || 'UG',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/students
// @desc    Get all students
// @access  Private (Admin only)
router.get('/students', protect, authorize('admin'), async (req, res) => {
  try {
    const { department, semester, program } = req.query;
    let query = { role: 'student' };

    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (program) query.program = program;

    const students = await User.find(query)
      .select('-password')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
