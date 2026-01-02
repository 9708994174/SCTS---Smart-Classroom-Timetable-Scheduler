const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  entryID: {
    type: String,
    required: true,
    unique: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  timeslot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timeslot',
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  program: {
    type: String,
    enum: ['UG', 'PG'],
    required: true
  }
}, {
  timestamps: true
});

const timetableSchema = new mongoose.Schema({
  timetableID: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    trim: true
  },
  entries: [timetableEntrySchema],
  status: {
    type: String,
    enum: ['draft', 'generated', 'review', 'approved', 'published'],
    default: 'draft'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  publishedAt: {
    type: Date
  },
  metrics: {
    classroomUtilization: { type: Number, default: 0 },
    facultyWorkloadBalance: { type: Number, default: 0 },
    conflictCount: { type: Number, default: 0 },
    preferenceSatisfaction: { type: Number, default: 0 }
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
timetableSchema.index({ academicYear: 1, semester: 1, department: 1 });
timetableSchema.index({ status: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);




