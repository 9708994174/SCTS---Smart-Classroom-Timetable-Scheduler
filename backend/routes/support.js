const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// @route   POST /api/support
// @desc    Create a new support ticket
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    const ticket = await SupportTicket.create({
      user: req.user.id,
      subject: subject.trim(),
      category: category || 'other',
      priority: priority || 'medium',
      description: description.trim(),
      messages: [{
        message: description.trim(),
        sender: req.user.id,
        senderRole: req.user.role
      }]
    });

    // Notify admins about new ticket
    try {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      
      const Notification = require('../models/Notification');
      const adminNotifications = admins.map(admin => ({
        user: admin._id,
        type: 'system_announcement',
        title: 'New Support Ticket',
        message: `A new support ticket "${subject}" has been created by ${req.user.name}. Priority: ${priority || 'medium'}`,
        relatedEntity: {
          entityType: 'system',
          entityId: ticket._id
        },
        priority: priority === 'urgent' || priority === 'high' ? 'high' : 'medium'
      }));

      await Notification.insertMany(adminNotifications);
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
    }

    await ticket.populate('user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/support
// @desc    Get support tickets for current user (or all for admin)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    let query = {};

    // Regular users can only see their own tickets
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email role')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/support/:id
// @desc    Get single support ticket
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && ticket.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/support/:id
// @desc    Update support ticket (status, priority, assign, etc.)
// @access  Private (Admin can update any, users can update their own)
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { status, priority, assignedTo, resolution } = req.body;

    if (status) {
      ticket.status = status;
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
        ticket.resolution = resolution || ticket.resolution;
      }
      if (status === 'closed') {
        ticket.closedAt = new Date();
      }
    }

    if (priority && req.user.role === 'admin') {
      ticket.priority = priority;
    }

    if (assignedTo && req.user.role === 'admin') {
      ticket.assignedTo = assignedTo;
    }

    if (resolution && req.user.role === 'admin') {
      ticket.resolution = resolution;
    }

    await ticket.save();
    await ticket.populate('user', 'name email role');
    await ticket.populate('assignedTo', 'name email');

    // Notify user if ticket status changed
    if (status && status !== 'open') {
      try {
        await createNotification(ticket.user._id, {
          type: 'system_announcement',
          title: 'Support Ticket Updated',
          message: `Your support ticket "${ticket.subject}" has been ${status}.`,
          relatedEntity: {
            entityType: 'system',
            entityId: ticket._id
          },
          priority: 'medium'
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Support ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/support/:id/message
// @desc    Add a message to support ticket
// @access  Private
router.post('/:id/message', protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add message
    ticket.messages.push({
      message: message.trim(),
      sender: req.user.id,
      senderRole: req.user.role
    });

    // Update status if ticket was closed/resolved
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      ticket.status = 'in_progress';
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    }

    await ticket.save();
    await ticket.populate('messages.sender', 'name email role');

    // Notify the other party
    const recipientId = req.user.role === 'admin' ? ticket.user : null;
    if (recipientId) {
      try {
        await createNotification(recipientId, {
          type: 'system_announcement',
          title: 'New Message on Support Ticket',
          message: `You have a new message on your support ticket "${ticket.subject}".`,
          relatedEntity: {
            entityType: 'system',
            entityId: ticket._id
          },
          priority: 'medium'
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Message added successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/support/:id
// @desc    Delete support ticket (Admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

