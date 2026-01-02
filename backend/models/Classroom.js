const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  roomID: {
    type: String,
    required: true,
    unique: true
  },
  building: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: Number,
    default: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  roomType: {
    type: String,
    enum: ['lecture', 'laboratory', 'seminar', 'auditorium', 'computer_lab'],
    default: 'lecture'
  },
  equipment: {
    smartBoard: { type: Boolean, default: false },
    projector: { type: Boolean, default: false },
    computerLab: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false },
    wifi: { type: Boolean, default: true },
    specializedEquipment: [String]
  },
  accessibility: {
    groundFloor: { type: Boolean, default: false },
    wheelchairAccessible: { type: Boolean, default: false },
    elevatorAccess: { type: Boolean, default: false }
  },
  availability: {
    type: Map,
    of: Boolean,
    default: {}
  },
  maintenanceSchedule: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Classroom', classroomSchema);




