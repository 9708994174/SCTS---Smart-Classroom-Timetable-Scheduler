const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'timetable_generated',
      'timetable_approved',
      'timetable_published',
      'timetable_available',
      'leave_request',
      'leave_approved',
      'leave_rejected',
      'classroom_assigned',
      'schedule_change',
      'attendance_marked',
      'attendance_updated',
      'system_announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['timetable', 'leave', 'classroom', 'subject', 'faculty', 'attendance', 'system'],
      default: 'system'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      // refPath will be handled dynamically
    }
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  role: {
    type: String,
    enum: ['admin', 'faculty', 'student', 'all'],
    default: 'all'
  },
  department: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ role: 1, department: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Static method to create notifications for multiple users
notificationSchema.statics.createForUsers = async function(users, notificationData) {
  const notifications = users.map(userId => ({
    ...notificationData,
    user: userId
  }));
  return await this.insertMany(notifications);
};

// Static method to create notifications for role/department
notificationSchema.statics.createForRole = async function(role, department, notificationData) {
  const User = require('./User');
  let query = { role, isActive: true };
  if (department) {
    query.department = department;
  }
  
  const users = await User.find(query).select('_id');
  if (users.length === 0) return [];
  
  const notifications = users.map(user => ({
    ...notificationData,
    user: user._id,
    role,
    department: department || undefined
  }));
  
  return await this.insertMany(notifications);
};

module.exports = mongoose.model('Notification', notificationSchema);

