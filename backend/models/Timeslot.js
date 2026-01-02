const mongoose = require('mongoose');

const timeslotSchema = new mongoose.Schema({
  timeslotID: {
    type: String,
    required: true,
    unique: true
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening'],
    default: 'morning'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
timeslotSchema.index({ day: 1, startTime: 1 });

module.exports = mongoose.model('Timeslot', timeslotSchema);




