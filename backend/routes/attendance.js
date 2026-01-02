const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// @route   GET /api/attendance/students/:timetableEntryId
// @desc    Get students for a timetable entry (for marking attendance)
// @access  Private (Faculty)
router.get('/students/:timetableEntryId', protect, async (req, res) => {
  try {
    // Get timetable entry
    const timetable = await Timetable.findOne({ 'entries._id': req.params.timetableEntryId })
      .populate('entries.subject');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    const timetableEntry = timetable.entries.id(req.params.timetableEntryId);
    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    // Verify faculty authorization
    const Faculty = require('../models/Faculty');
    const faculty = await Faculty.findOne({ user: req.user.id });
    
    if (!faculty) {
      return res.status(403).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }

    const entryFacultyId = timetableEntry.faculty?._id || timetableEntry.faculty;
    if (entryFacultyId.toString() !== faculty._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view students for this class'
      });
    }

    // Get students from the same department and semester
    const students = await User.find({
      role: 'student',
      department: timetableEntry.department,
      semester: timetableEntry.semester,
      isActive: true
    }).select('name email uid department semester').sort({ name: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students,
      timetableEntry: {
        subject: timetableEntry.subject,
        timeslot: timetableEntry.timeslot,
        classroom: timetableEntry.classroom,
        semester: timetableEntry.semester,
        department: timetableEntry.department
      }
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

// @route   POST /api/attendance
// @desc    Mark attendance for a class
// @access  Private (Faculty)
router.post('/', protect, async (req, res) => {
  try {
    const { timetableEntryId, date, entries, headCount } = req.body;

    if (!timetableEntryId || !date || !entries || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: timetableEntryId, date, and entries array are required'
      });
    }

    // Get timetable entry to validate
    const timetable = await Timetable.findOne({ 'entries._id': timetableEntryId })
      .populate('entries.faculty')
      .populate('entries.subject');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    const timetableEntry = timetable.entries.id(timetableEntryId);
    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    // Verify faculty is authorized (check if faculty matches)
    const Faculty = require('../models/Faculty');
    const faculty = await Faculty.findOne({ user: req.user.id });
    
    if (!faculty) {
      return res.status(403).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }

    const entryFacultyId = timetableEntry.faculty?._id || timetableEntry.faculty;
    if (entryFacultyId.toString() !== faculty._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark attendance for this class'
      });
    }

    // Generate attendance ID
    const attendanceID = `ATT-${timetableEntryId}-${new Date(date).toISOString().split('T')[0]}-${Date.now()}`;

    // Create or update attendance
    let attendance = await Attendance.findOne({
      timetableEntry: timetableEntryId,
      date: new Date(date)
    });

    if (attendance) {
      // Update existing attendance
      attendance.entries = entries;
      attendance.status = 'marked';
      attendance.markedBy = req.user.id;
      attendance.headCount = headCount || 0;
      attendance.calculateStats();
      await attendance.save();
    } else {
      // Create new attendance
      attendance = await Attendance.create({
        attendanceID,
        timetableEntry: timetableEntryId,
        subject: timetableEntry.subject,
        faculty: faculty._id,
        classroom: timetableEntry.classroom,
        date: new Date(date),
        timeslot: timetableEntry.timeslot,
        semester: timetableEntry.semester,
        department: timetableEntry.department,
        academicYear: timetable.academicYear,
        entries,
        markedBy: req.user.id,
        status: 'marked',
        headCount: headCount || 0
      });
    }

    // Populate for response
    await attendance.populate([
      { path: 'subject', select: 'subjectName subjectID' },
      { path: 'faculty', select: 'name facultyID' },
      { path: 'classroom', select: 'roomID building' },
      { path: 'timeslot', select: 'day startTime endTime' },
      { path: 'entries.student', select: 'name email uid' }
    ]);

    // Notify students about attendance
    const subject = await Subject.findById(timetableEntry.subject);
    if (subject) {
      const studentIds = entries.map(e => e.student).filter(Boolean);
      
      try {
        const Notification = require('../models/Notification');
        
        // Notify students
        const studentNotifications = studentIds.map(studentId => ({
          user: studentId,
          type: 'attendance_marked',
          title: 'Attendance Marked',
          message: `Your attendance has been marked for ${subject.subjectName} on ${new Date(date).toLocaleDateString()}. Check your attendance record in your account.`,
          relatedEntity: {
            entityType: 'attendance',
            entityId: attendance._id
          },
          priority: 'medium'
        }));

        // Notify faculty (the one who marked attendance)
        const facultyNotification = {
          user: req.user.id,
          type: 'attendance_marked',
          title: 'Attendance Marked Successfully',
          message: `You have successfully marked attendance for ${subject.subjectName} on ${new Date(date).toLocaleDateString()}. ${entries.filter(e => e.status === 'present').length} students were marked present.`,
          relatedEntity: {
            entityType: 'attendance',
            entityId: attendance._id
          },
          priority: 'medium'
        };

        const notifications = [...studentNotifications, facultyNotification];

        await Notification.insertMany(notifications);
      } catch (notifError) {
        console.error('Error creating notifications:', notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { subject, date, student, faculty, department, semester, academicYear } = req.query;
    let query = {};

    if (req.user.role === 'student') {
      // Students can only see their own attendance
      query['entries.student'] = req.user.id;
    } else if (req.user.role === 'faculty') {
      // Faculty can see their own classes
      const Faculty = require('../models/Faculty');
      const facultyProfile = await Faculty.findOne({ user: req.user.id });
      if (facultyProfile) {
        query.faculty = facultyProfile._id;
      }
    }

    if (subject) query.subject = subject;
    if (date) query.date = new Date(date);
    if (student) query['entries.student'] = student;
    if (faculty) query.faculty = faculty;
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;

    const attendance = await Attendance.find(query)
      .populate('subject', 'subjectName subjectID')
      .populate('faculty', 'name facultyID')
      .populate('classroom', 'roomID building')
      .populate('timeslot', 'day startTime endTime')
      .populate('entries.student', 'name email uid')
      .populate('markedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for a specific student
// @access  Private
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    // Students can only see their own attendance
    if (req.user.role === 'student' && req.params.studentId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { subject, semester, academicYear } = req.query;
    let query = { 'entries.student': req.params.studentId };

    if (subject) query.subject = subject;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;

    const attendance = await Attendance.find(query)
      .populate('subject', 'subjectName subjectID')
      .populate('faculty', 'name facultyID')
      .populate('classroom', 'roomID building')
      .populate('timeslot', 'day startTime endTime')
      .populate('entries.student', 'name email uid')
      .sort({ date: -1 });

    // Calculate statistics
    let totalClasses = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    attendance.forEach(att => {
      const studentEntry = att.entries.find(e => 
        (e.student._id || e.student).toString() === req.params.studentId
      );
      if (studentEntry) {
        totalClasses++;
        if (studentEntry.status === 'present') presentCount++;
        else if (studentEntry.status === 'absent') absentCount++;
        else if (studentEntry.status === 'late') lateCount++;
      }
    });

    const attendancePercentage = totalClasses > 0 
      ? ((presentCount + lateCount) / totalClasses * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      count: attendance.length,
      statistics: {
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        attendancePercentage: parseFloat(attendancePercentage)
      },
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/subject/:subjectId
// @desc    Get attendance for a specific subject
// @access  Private (Faculty, Admin)
router.get('/subject/:subjectId', protect, async (req, res) => {
  try {
    const { date, semester, academicYear } = req.query;
    let query = { subject: req.params.subjectId };

    if (date) query.date = new Date(date);
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;

    // Faculty can only see their own subjects
    if (req.user.role === 'faculty') {
      const Faculty = require('../models/Faculty');
      const facultyProfile = await Faculty.findOne({ user: req.user.id });
      if (facultyProfile) {
        query.faculty = facultyProfile._id;
      }
    }

    const attendance = await Attendance.find(query)
      .populate('subject', 'subjectName subjectID')
      .populate('faculty', 'name facultyID')
      .populate('classroom', 'roomID building')
      .populate('timeslot', 'day startTime endTime')
      .populate('entries.student', 'name email uid')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching subject attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance for faculty
// @access  Private (Faculty)
router.get('/today', protect, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for faculty only.'
      });
    }

    const Faculty = require('../models/Faculty');
    const faculty = await Faculty.findOne({ user: req.user.id });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.find({
      faculty: faculty._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate('subject', 'subjectName subjectID')
      .populate('classroom', 'roomID building')
      .populate('timeslot', 'day startTime endTime')
      .populate('entries.student', 'name email uid')
      .sort({ 'timeslot.startTime': 1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private (Faculty, Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check authorization
    if (req.user.role === 'faculty') {
      const Faculty = require('../models/Faculty');
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty || attendance.faculty.toString() !== faculty._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this attendance'
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update entries if provided
    if (req.body.entries) {
      attendance.entries = req.body.entries;
      attendance.calculateStats();
    }

    if (req.body.status) {
      attendance.status = req.body.status;
    }

    await attendance.save();

    await attendance.populate([
      { path: 'subject', select: 'subjectName subjectID' },
      { path: 'faculty', select: 'name facultyID' },
      { path: 'classroom', select: 'roomID building' },
      { path: 'timeslot', select: 'day startTime endTime' },
      { path: 'entries.student', select: 'name email uid' }
    ]);

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics (Admin)
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { department, semester, academicYear } = req.query;
    let query = {};

    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;

    const attendance = await Attendance.find(query)
      .populate('entries.student', 'name email uid');

    // Calculate overall statistics
    let totalRecords = attendance.length;
    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;

    attendance.forEach(att => {
      totalStudents += att.totalStudents;
      totalPresent += att.presentCount;
      totalAbsent += att.absentCount;
      totalLate += att.lateCount;
    });

    const overallPercentage = totalStudents > 0
      ? ((totalPresent + totalLate) / totalStudents * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalRecords,
        totalStudents,
        totalPresent,
        totalAbsent,
        totalLate,
        overallPercentage: parseFloat(overallPercentage)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

