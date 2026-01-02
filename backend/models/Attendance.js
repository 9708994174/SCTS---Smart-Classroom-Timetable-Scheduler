const mongoose = require('mongoose');

const attendanceEntrySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const attendanceSchema = new mongoose.Schema({
  attendanceID: {
    type: String,
    required: true,
    unique: true
  },
  timetableEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable.entries',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
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
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true
  },
  entries: [attendanceEntrySchema],
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'marked', 'locked'],
    default: 'draft'
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  presentCount: {
    type: Number,
    default: 0
  },
  absentCount: {
    type: Number,
    default: 0
  },
  lateCount: {
    type: Number,
    default: 0
  },
  headCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
attendanceSchema.index({ date: -1, subject: 1, faculty: 1 });
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ timetableEntry: 1, date: 1 });
attendanceSchema.index({ department: 1, semester: 1, academicYear: 1 });

// Method to calculate statistics
attendanceSchema.methods.calculateStats = function() {
  this.presentCount = this.entries.filter(e => e.status === 'present').length;
  this.absentCount = this.entries.filter(e => e.status === 'absent').length;
  this.lateCount = this.entries.filter(e => e.status === 'late').length;
  this.totalStudents = this.entries.length;
  return this;
};

// Pre-save hook to calculate stats
attendanceSchema.pre('save', function(next) {
  this.calculateStats();
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);


