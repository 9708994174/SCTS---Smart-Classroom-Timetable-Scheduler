const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/student
// @desc    Get all students
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { department, semester, program, isActive } = req.query;
    let query = {};

    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (program) query.program = program;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const students = await Student.find(query)
      .populate('user', 'name email role')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/student/me
// @desc    Get current user's student profile (auto-creates if missing)
// @access  Private (Student)
router.get('/me', protect, async (req, res) => {
  try {
    // Only allow student role
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for students only.'
      });
    }

    let student = await Student.findOne({ user: req.user.id })
      .populate('user', 'name email role');
    
    // If student profile doesn't exist, try to find by email
    if (!student && req.user.email) {
      student = await Student.findOne({ email: req.user.email })
        .populate('user', 'name email role');
    }
    
    // If still not found, auto-create a basic profile
    if (!student) {
      try {
        // Generate student ID
        const studentID = req.user.uid || `STU${Date.now().toString().slice(-6)}`;
        
        // Check if student ID already exists
        const existingStudent = await Student.findOne({ studentID });
        if (existingStudent) {
          // Update existing student to link to this user
          existingStudent.user = req.user.id;
          await existingStudent.save();
          student = existingStudent;
        } else {
          // Create new student profile
          student = await Student.create({
            studentID,
            user: req.user.id,
            name: req.user.name,
            email: req.user.email,
            department: req.user.department || 'General',
            semester: req.user.semester || 1,
            program: req.user.program || 'UG',
            isActive: true
          });
        }
        
        student = await Student.findById(student._id).populate('user', 'name email role');
      } catch (createError) {
        console.error('Error auto-creating student profile:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create student profile. Please contact administrator.',
          error: process.env.NODE_ENV === 'development' ? createError.message : undefined
        });
      }
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/student
// @desc    Create a new student
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentID, name, email, department, semester, program, phone, password, uid } = req.body;

    if (!name || !email || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, department, and semester are required'
      });
    }

    // Check if student with email already exists
    const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Check if studentID is provided and already exists
    const finalStudentID = studentID || `STU${Date.now().toString().slice(-6)}`;
    const studentIDExists = await Student.findOne({ studentID: finalStudentID });
    if (studentIDExists) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already exists'
      });
    }

    // Create or find user account
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Create new user account
      const defaultPassword = password || 'student123'; // Default password
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: defaultPassword,
        role: 'student',
        uid: uid || finalStudentID,
        department: department.trim(),
        semester: parseInt(semester),
        program: program || 'UG',
        isActive: true
      });
    } else {
      // Update existing user if needed
      if (user.role !== 'student') {
        return res.status(400).json({
          success: false,
          message: 'User with this email exists but is not a student'
        });
      }
      user.department = department.trim();
      user.semester = parseInt(semester);
      user.program = program || 'UG';
      await user.save();
    }

    // Create student profile
    const student = await Student.create({
      studentID: finalStudentID,
      user: user._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      department: department.trim(),
      semester: parseInt(semester),
      program: program || 'UG',
      phone: phone?.trim() || undefined,
      isActive: true
    });

    await student.populate('user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    console.error('Error creating student:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Student ID'} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/student/:id
// @desc    Get single student
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email role');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization - students can only see their own profile
    if (req.user.role === 'student' && student.user?._id?.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/student/:id
// @desc    Update student
// @access  Private (Admin can update any, students can update their own)
router.put('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && student.user?.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, email, department, semester, program, phone, isActive } = req.body;

    // Update student fields
    if (name) student.name = name.trim();
    if (email && email !== student.email) {
      // Check if new email already exists
      const emailExists = await Student.findOne({ email: email.toLowerCase().trim() });
      if (emailExists && emailExists._id.toString() !== student._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      student.email = email.toLowerCase().trim();
    }
    if (department) student.department = department.trim();
    if (semester !== undefined) student.semester = parseInt(semester);
    if (program) student.program = program;
    if (phone !== undefined) student.phone = phone?.trim() || null;
    if (isActive !== undefined && req.user.role === 'admin') {
      student.isActive = isActive;
    }

    await student.save();

    // Update user account if it exists
    if (student.user) {
      const user = await User.findById(student.user);
      if (user) {
        if (name) user.name = name.trim();
        if (email && email !== user.email) {
          user.email = email.toLowerCase().trim();
        }
        if (department) user.department = department.trim();
        if (semester !== undefined) user.semester = parseInt(semester);
        if (program) user.program = program;
        if (isActive !== undefined && req.user.role === 'admin') {
          user.isActive = isActive;
        }
        await user.save();
      }
    }

    await student.populate('user', 'name email role');

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/student/:id
// @desc    Delete student
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete - set isActive to false instead of deleting
    student.isActive = false;
    await student.save();

    // Also deactivate user account
    if (student.user) {
      const user = await User.findById(student.user);
      if (user) {
        user.isActive = false;
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Student deactivated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/student/me
// @desc    Update current student profile
// @access  Private (Student)
router.put('/me', protect, async (req, res) => {
  try {
    // Only allow student role
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for students only.'
      });
    }

    let student = await Student.findOne({ user: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const { name, email, phone } = req.body;
    
    // Check if email is being changed and if it already exists
    if (email && email !== student.email) {
      const emailExists = await Student.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;

    student = await Student.findByIdAndUpdate(
      student._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/student/bulk
// @desc    Create multiple students in bulk
// @access  Private (Admin only)
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Students array is required and must not be empty'
      });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const studentData of students) {
      try {
        const { studentID, name, email, department, semester, program, phone, password, uid } = studentData;

        // Validate required fields
        if (!name || !email || !department || !semester) {
          results.failed.push({
            ...studentData,
            error: 'Missing required fields: name, email, department, or semester'
          });
          continue;
        }

        // Check if student with email already exists
        const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
        if (existingStudent) {
          results.skipped.push({
            ...studentData,
            error: 'Student with this email already exists'
          });
          continue;
        }

        // Generate student ID if not provided
        const finalStudentID = studentID || `STU${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        const studentIDExists = await Student.findOne({ studentID: finalStudentID });
        if (studentIDExists) {
          results.failed.push({
            ...studentData,
            error: 'Student ID already exists'
          });
          continue;
        }

        // Create or find user account
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
          const defaultPassword = password || 'student123';
          user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: defaultPassword,
            role: 'student',
            uid: uid || finalStudentID,
            department: department.trim(),
            semester: parseInt(semester),
            program: program || 'UG',
            isActive: true
          });
        } else {
          if (user.role !== 'student') {
            results.failed.push({
              ...studentData,
              error: 'User with this email exists but is not a student'
            });
            continue;
          }
          user.department = department.trim();
          user.semester = parseInt(semester);
          user.program = program || 'UG';
          await user.save();
        }

        // Create student profile
        const student = await Student.create({
          studentID: finalStudentID,
          user: user._id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          department: department.trim(),
          semester: parseInt(semester),
          program: program || 'UG',
          phone: phone?.trim() || undefined,
          isActive: true
        });

        results.success.push({
          studentID: finalStudentID,
          name: student.name,
          email: student.email
        });
      } catch (error) {
        results.failed.push({
          ...studentData,
          error: error.message || 'Unknown error'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk import completed: ${results.success.length} created, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      results: {
        created: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        details: {
          success: results.success,
          failed: results.failed,
          skipped: results.skipped
        }
      }
    });
  } catch (error) {
    console.error('Error in bulk student creation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk import',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

