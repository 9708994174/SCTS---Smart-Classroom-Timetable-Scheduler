const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/faculty
// @desc    Get all faculty
// @access  Private (Admin, Faculty)
router.get('/', protect, async (req, res) => {
  try {
    const faculty = await Faculty.find({ isActive: true })
      .populate('user', 'name email')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: faculty.length,
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/faculty/me
// @desc    Get current user's faculty profile (auto-creates if missing)
// @access  Private (Faculty)
router.get('/me', protect, async (req, res) => {
  try {
    // Only allow faculty role
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for faculty only.'
      });
    }

    let faculty = await Faculty.findOne({ user: req.user.id })
      .populate('user', 'name email');
    
    // If faculty profile doesn't exist, try to find by email
    if (!faculty && req.user.email) {
      faculty = await Faculty.findOne({ email: req.user.email })
        .populate('user', 'name email');
    }
    
    // If still not found, auto-create a basic profile
    if (!faculty) {
      try {
        // Generate faculty ID
        const facultyID = req.user.uid || `FAC${Date.now().toString().slice(-6)}`;
        
        // Check if faculty ID already exists
        const existingFaculty = await Faculty.findOne({ facultyID });
        if (existingFaculty) {
          // Update existing faculty to link to this user
          existingFaculty.user = req.user.id;
          await existingFaculty.save();
          faculty = existingFaculty;
        } else {
          // Create new faculty profile
          faculty = await Faculty.create({
            facultyID,
            user: req.user.id,
            name: req.user.name,
            email: req.user.email,
            department: req.user.department || 'General',
            maxHoursPerWeek: 20,
            isActive: true
          });
        }
        
        faculty = await Faculty.findById(faculty._id).populate('user', 'name email');
      } catch (createError) {
        console.error('Error auto-creating faculty profile:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create faculty profile. Please contact administrator.',
          error: process.env.NODE_ENV === 'development' ? createError.message : undefined
        });
      }
    }

    res.json({
      success: true,
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/faculty/me
// @desc    Update current faculty profile
// @access  Private (Faculty)
router.put('/me', protect, async (req, res) => {
  try {
    // Only allow faculty role
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for faculty only.'
      });
    }

    let faculty = await Faculty.findOne({ user: req.user.id });
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }

    const { name, email, phone, department } = req.body;
    
    // Check if email is being changed and if it already exists
    if (email && email !== faculty.email) {
      const emailExists = await Faculty.findOne({ email: email.toLowerCase().trim() });
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
    if (department !== undefined) updateData.department = department?.trim() || null;

    faculty = await Faculty.findByIdAndUpdate(
      faculty._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({
      success: true,
      message: 'Faculty profile updated successfully',
      data: faculty
    });
  } catch (error) {
    console.error('Error updating faculty profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/faculty
// @desc    Create faculty
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/faculty/:id
// @desc    Get single faculty
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    res.json({
      success: true,
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/faculty/me/availability
// @desc    Update current faculty's availability
// @access  Private (Faculty)
router.put('/me/availability', protect, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for faculty only.'
      });
    }

    let faculty = await Faculty.findOne({ user: req.user.id });
    
    // If faculty profile doesn't exist, try to find by email
    if (!faculty && req.user.email) {
      faculty = await Faculty.findOne({ email: req.user.email });
    }
    
    // If still not found, auto-create
    if (!faculty) {
      const facultyID = req.user.uid || `FAC${Date.now().toString().slice(-6)}`;
      faculty = await Faculty.create({
        facultyID,
        user: req.user.id,
        name: req.user.name,
        email: req.user.email,
        department: req.user.department || 'General',
        maxHoursPerWeek: 20,
        isActive: true
      });
    }

    faculty.availability = req.body.availability;
    await faculty.save();

    res.json({
      success: true,
      data: faculty
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/faculty/:id/availability
// @desc    Update faculty availability (by ID - for admin)
// @access  Private (Faculty, Admin)
router.put('/:id/availability', protect, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Check if user is the faculty member or admin
    if (req.user.role !== 'admin' && faculty.user && faculty.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    faculty.availability = req.body.availability;
    await faculty.save();

    res.json({
      success: true,
      data: faculty
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/faculty/:id
// @desc    Update faculty
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    res.json({
      success: true,
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/faculty/:id
// @desc    Delete faculty
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    res.json({
      success: true,
      message: 'Faculty deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/faculty/:id/leaves
// @desc    Add leave request
// @access  Private (Faculty, Admin)
router.post('/:id/leaves', protect, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    faculty.leaves.push(req.body);
    await faculty.save();

    res.json({
      success: true,
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/faculty/:id/leaves/:leaveId/approve
// @desc    Approve leave request
// @access  Private (Admin only)
router.put('/:id/leaves/:leaveId/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const leave = faculty.leaves.id(req.params.leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    leave.status = 'approved';
    await faculty.save();

    res.json({
      success: true,
      message: 'Leave request approved',
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/faculty/:id/leaves/:leaveId/reject
// @desc    Reject leave request
// @access  Private (Admin only)
router.put('/:id/leaves/:leaveId/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const leave = faculty.leaves.id(req.params.leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    leave.status = 'rejected';
    await faculty.save();

    res.json({
      success: true,
      message: 'Leave request rejected',
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/faculty/leaves/pending
// @desc    Get all pending leave requests
// @access  Private (Admin only)
router.get('/leaves/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const allFaculty = await Faculty.find({ isActive: true })
      .populate('user', 'name email')
      .select('name email facultyID department leaves');
    
    const pendingLeaves = [];
    
    allFaculty.forEach(faculty => {
      if (faculty.leaves && faculty.leaves.length > 0) {
        faculty.leaves.forEach(leave => {
          if (leave.status === 'pending') {
            pendingLeaves.push({
              leaveId: leave._id,
              facultyId: faculty._id,
              facultyName: faculty.name,
              facultyEmail: faculty.email,
              facultyID: faculty.facultyID,
              department: faculty.department,
              startDate: leave.startDate,
              endDate: leave.endDate,
              reason: leave.reason,
              status: leave.status
            });
          }
        });
      }
    });
    
    res.json({
      success: true,
      count: pendingLeaves.length,
      data: pendingLeaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

