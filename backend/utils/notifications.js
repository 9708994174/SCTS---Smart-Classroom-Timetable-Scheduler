const Notification = require('../models/Notification');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

/**
 * Create notification for a single user
 */
async function createNotification(userId, notificationData) {
  try {
    const notification = await Notification.create({
      user: userId,
      ...notificationData
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notifications for all users of a specific role and department
 */
async function createNotificationForRole(role, department, notificationData) {
  try {
    const notifications = await Notification.createForRole(role, department, notificationData);
    return notifications;
  } catch (error) {
    console.error('Error creating notifications for role:', error);
    throw error;
  }
}

/**
 * Create notification when timetable is generated
 */
async function notifyTimetableGenerated(timetable) {
  try {
    // Notify admin
    await createNotificationForRole('admin', null, {
      type: 'timetable_generated',
      title: 'Timetable Generated Successfully',
      message: `A new timetable has been generated successfully for ${timetable.department || 'all departments'} - Semester ${timetable.semester}. Please review and approve it.`,
      relatedEntity: {
        entityType: 'timetable',
        entityId: timetable._id
      },
      priority: 'high'
    });

    console.log('Notifications created for timetable generation');
  } catch (error) {
    console.error('Error creating timetable generation notifications:', error);
  }
}

/**
 * Create notification when timetable is approved
 */
async function notifyTimetableApproved(timetable) {
  try {
    // Notify all faculty in the department
    await createNotificationForRole('faculty', timetable.department, {
      type: 'timetable_approved',
      title: 'Timetable Approved',
      message: `Timetable for ${timetable.department || 'your department'} - Semester ${timetable.semester} has been approved. It will be available in your account once published.`,
      relatedEntity: {
        entityType: 'timetable',
        entityId: timetable._id
      },
      priority: 'high',
      department: timetable.department
    });

    // Notify all students in the department
    await createNotificationForRole('student', timetable.department, {
      type: 'timetable_approved',
      title: 'Timetable Approved',
      message: `Timetable for ${timetable.department || 'your department'} - Semester ${timetable.semester} has been approved and will be available in your account soon.`,
      relatedEntity: {
        entityType: 'timetable',
        entityId: timetable._id
      },
      priority: 'medium',
      department: timetable.department
    });

    // Notify admin
    await createNotificationForRole('admin', null, {
      type: 'timetable_approved',
      title: 'Timetable Approved',
      message: `Timetable for ${timetable.department || 'all departments'} - Semester ${timetable.semester} has been approved successfully.`,
      relatedEntity: {
        entityType: 'timetable',
        entityId: timetable._id
      },
      priority: 'medium'
    });

    console.log('Notifications created for timetable approval');
  } catch (error) {
    console.error('Error creating timetable approval notifications:', error);
  }
}

/**
 * Create notification when timetable is published
 */
async function notifyTimetablePublished(timetable) {
  try {
    // Get all faculty assigned to this timetable and their user IDs
    const mongoose = require('mongoose');
    
    const facultyIds = [...new Set(timetable.entries.map(entry => {
      const facultyId = entry.faculty?._id || entry.faculty;
      return facultyId ? (facultyId.toString ? facultyId.toString() : facultyId) : null;
    }).filter(Boolean))];
    
    // Notify assigned faculty (get user IDs from faculty records)
    if (facultyIds.length > 0) {
      const Faculty = require('../models/Faculty');
      // Convert to ObjectIds for query
      const facultyObjectIds = facultyIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => mongoose.Types.ObjectId(id));
      
      if (facultyObjectIds.length === 0) {
        console.warn('No valid faculty ObjectIds found');
        return;
      }
      
      const facultyRecords = await Faculty.find({ _id: { $in: facultyObjectIds } }).select('user');
      const userIds = facultyRecords
        .map(f => {
          const userId = f.user?._id || f.user;
          return userId ? (userId.toString ? userId.toString() : userId) : null;
        })
        .filter(Boolean)
        .map(userId => mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : userId);
      
      console.log('Faculty IDs found:', facultyIds.length);
      console.log('Faculty records found:', facultyRecords.length);
      console.log('User IDs to notify:', userIds.length);
      
      if (userIds.length > 0) {
        const facultyNotifications = userIds.map(userId => ({
          user: userId,
          type: 'timetable_published',
          title: 'Timetable Available in Your Account',
          message: `Your timetable for ${timetable.department || 'your department'} - Semester ${timetable.semester} is now available in your account. You can view it in your dashboard and start marking attendance.`,
          relatedEntity: {
            entityType: 'timetable',
            entityId: timetable._id
          },
          priority: 'high',
          role: 'faculty',
          department: timetable.department
        }));

        try {
          const result = await Notification.insertMany(facultyNotifications);
          console.log('Created', result.length, 'faculty notifications');
        } catch (insertError) {
          console.error('Error inserting faculty notifications:', insertError);
          // Try inserting one by one to see which one fails
          for (const notif of facultyNotifications) {
            try {
              await Notification.create(notif);
            } catch (err) {
              console.error('Failed to create notification for user:', notif.user, err);
            }
          }
        }
      } else {
        console.warn('No user IDs found for faculty notifications. Faculty records:', facultyRecords.map(f => ({ id: f._id, user: f.user })));
      }
    }

    // Notify all students in the department
    await createNotificationForRole('student', timetable.department, {
      type: 'timetable_available',
      title: 'Timetable Available in Your Account',
      message: `The timetable for ${timetable.department || 'your department'} - Semester ${timetable.semester} is now available in your account. You can view your class schedule in your dashboard.`,
      relatedEntity: {
        entityType: 'timetable',
        entityId: timetable._id
      },
      priority: 'high',
      department: timetable.department
    });

    // Notify admin
    await createNotificationForRole('admin', null, {
      type: 'timetable_published',
      title: 'Timetable Published Successfully',
      message: `Timetable for ${timetable.department || 'all departments'} - Semester ${timetable.semester} has been published successfully. Faculty and students can now view it in their accounts.`,
      relatedEntity: {
        entityType: 'timetable',
        entityId: timetable._id
      },
      priority: 'medium'
    });

    console.log('Notifications created for timetable publication');
  } catch (error) {
    console.error('Error creating timetable publication notifications:', error);
  }
}

module.exports = {
  createNotification,
  createNotificationForRole,
  notifyTimetableGenerated,
  notifyTimetableApproved,
  notifyTimetablePublished
};

