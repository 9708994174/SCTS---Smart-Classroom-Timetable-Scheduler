const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   GET /api/notification
// @desc    Get all notifications for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { unreadOnly, limit = 50 } = req.query;
    const mongoose = require('mongoose');
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Convert user ID to ObjectId for consistent querying
    let userId;
    try {
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        userId = new mongoose.Types.ObjectId(req.user.id);
      } else {
        userId = req.user.id;
      }
    } catch (e) {
      console.error('Error converting user ID to ObjectId:', e);
      userId = req.user.id;
    }
    
    // Query notifications for this user
    let query = { user: userId };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    let notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Map entityType to model names for populate
    const entityTypeToModel = {
      'timetable': 'Timetable',
      'attendance': 'Attendance',
      'leave': 'Leave',
      'classroom': 'Classroom',
      'subject': 'Subject',
      'faculty': 'Faculty',
      'system': null // No model for system
    };

    // Populate related entities only if they exist (skip 'system' type)
    await Promise.all(
      notifications.map(async (notif) => {
        if (notif.relatedEntity?.entityId && notif.relatedEntity?.entityType) {
          const modelName = entityTypeToModel[notif.relatedEntity.entityType];
          if (modelName) {
            try {
              const Model = mongoose.model(modelName);
              const entity = await Model.findById(notif.relatedEntity.entityId);
              if (entity) {
                notif.relatedEntity.entityId = entity;
              }
            } catch (populateError) {
              // If populate fails (model not found), just skip it
              console.warn('Failed to populate related entity:', populateError.message);
            }
          }
        }
      })
    );

    // Count unread notifications
    const unreadQuery = {
      user: userId,
      isRead: false
    };
    const unreadCount = await Notification.countDocuments(unreadQuery);

    // Also check for any notifications that might have been created with different ID format
    // This is a fallback to catch any edge cases
    if (notifications.length === 0 && unreadCount > 0) {
      console.log('No notifications found but unreadCount > 0, trying fallback query...');
      // Try a broader search
      const allNotifications = await Notification.find({
        $or: [
          { user: { $exists: true } }
        ]
      }).limit(100);
      
      // Manually filter by user ID string comparison
      const matchingNotifications = allNotifications.filter(notif => {
        const notifUserId = notif.user?._id?.toString() || notif.user?.toString() || notif.user;
        const currentUserId = req.user.id.toString();
        return notifUserId === currentUserId || notifUserId === userId.toString();
      });
      
      if (matchingNotifications.length > 0) {
        notifications = matchingNotifications.slice(0, parseInt(limit));
        console.log('Found notifications using fallback query:', notifications.length);
      } else {
        console.log('Fallback query also found no matching notifications');
        console.log('Sample notification user IDs:', allNotifications.slice(0, 3).map(n => ({
          id: n._id,
          userId: n.user?._id?.toString() || n.user?.toString() || n.user,
          type: n.type
        })));
      }
    }

    // Debug logging
    console.log('Fetching notifications for user:', req.user.id);
    console.log('User role:', req.user.role, 'Department:', req.user.department);
    console.log('Found notifications:', notifications.length);
    console.log('Unread count:', unreadCount);

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/notification/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const mongoose = require('mongoose');
    // Convert user ID to ObjectId for consistent querying
    let userId;
    try {
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        userId = new mongoose.Types.ObjectId(req.user.id);
      } else {
        userId = req.user.id;
      }
    } catch (e) {
      console.error('Error converting user ID to ObjectId:', e);
      userId = req.user.id;
    }
    
    // Query unread notifications for this user
    const query = {
      user: userId,
      isRead: false
    };
    
    const count = await Notification.countDocuments(query);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/notification/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/notification/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      count: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/notification/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
      data: notification
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


