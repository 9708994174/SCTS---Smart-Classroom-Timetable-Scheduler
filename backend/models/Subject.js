const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectID: {
    type: String,
    required: true,
    unique: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  program: {
    type: String,
    enum: ['UG', 'PG'],
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  classesPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  duration: {
    type: Number,
    default: 60,
    min: 30
  },
  roomRequirements: {
    roomType: {
      type: String,
      enum: ['lecture', 'laboratory', 'seminar', 'auditorium', 'computer_lab'],
      default: 'lecture'
    },
    minCapacity: {
      type: Number,
      required: true
    },
    requiredEquipment: [String],
    accessibilityNeeded: {
      type: Boolean,
      default: false
    }
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  assignedFaculty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  }],
  enrollment: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);





