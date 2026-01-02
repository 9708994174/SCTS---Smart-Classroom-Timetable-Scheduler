const mongoose = require('mongoose');

const substituteSchema = new mongoose.Schema({
  substituteID: {
    type: String,
    unique: true,
    sparse: true
  },
  originalFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
    index: true
  },
  substituteFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
    index: true
  },
  timetableEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable',
    required: true
  },
  entryID: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  department: {
    type: String,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  timeslot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timeslot'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
substituteSchema.index({ originalFaculty: 1, date: 1 });
substituteSchema.index({ substituteFaculty: 1, date: 1 });
substituteSchema.index({ status: 1, date: 1 });
substituteSchema.index({ department: 1, date: 1 });

// Pre-save hook to generate substitute ID
substituteSchema.pre('save', async function(next) {
  if (!this.substituteID) {
    try {
      const count = await mongoose.model('Substitute').countDocuments();
      this.substituteID = `SUB-${Date.now().toString().slice(-8)}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      // Fallback if count fails
      this.substituteID = `SUB-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    }
  }
  next();
});

module.exports = mongoose.model('Substitute', substituteSchema);

