const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentID: {
    type: String,
    required: true,
    unique: true,
    sparse: true // Allow multiple nulls
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow auto-creation without user initially
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  program: {
    type: String,
    enum: ['UG', 'PG'],
    default: 'UG',
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
studentSchema.index({ studentID: 1 });
studentSchema.index({ user: 1 });
studentSchema.index({ department: 1, semester: 1 });
studentSchema.index({ email: 1 });

module.exports = mongoose.model('Student', studentSchema);

