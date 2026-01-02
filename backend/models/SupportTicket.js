const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['admin', 'faculty', 'student'],
    required: true
  },
  attachments: [{
    filename: String,
    url: String
  }]
}, {
  timestamps: true
});

const supportTicketSchema = new mongoose.Schema({
  ticketID: {
    type: String,
    unique: true,
    sparse: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['timetable', 'attendance', 'technical', 'account', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  messages: [ticketMessageSchema],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  resolution: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
supportTicketSchema.index({ user: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ category: 1, status: 1 });

// Pre-save hook to generate ticket ID
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketID) {
    try {
      const count = await mongoose.model('SupportTicket').countDocuments();
      this.ticketID = `TKT-${Date.now().toString().slice(-8)}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      // Fallback if count fails
      this.ticketID = `TKT-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    }
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

