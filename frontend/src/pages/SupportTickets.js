import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const SupportTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    category: 'other',
    priority: 'medium',
    description: '',
  });
  const [messageText, setMessageText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [openResolveDialog, setOpenResolveDialog] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchSelectedTicket = async () => {
    if (!selectedTicket?._id) return;
    try {
      const response = await axios.get(`/api/support/${selectedTicket._id}`);
      setSelectedTicket(response.data.data);
    } catch (error) {
      console.error('Error fetching selected ticket:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue]);

  useEffect(() => {
    // Real-time polling every 5 seconds
    const interval = setInterval(() => {
      fetchTickets();
      // If a ticket is selected, refresh it too
      if (selectedTicket?._id) {
        fetchSelectedTicket();
      }
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket?._id]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let status = null;
      if (tabValue === 1) status = 'open';
      else if (tabValue === 2) status = 'in_progress';
      else if (tabValue === 3) status = 'resolved';
      else if (tabValue === 4) status = 'closed';

      const params = status ? { status } : {};
      const response = await axios.get('/api/support', { params });
      setTickets(response.data.data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      setError('');
      setSuccess('');
      await axios.post('/api/support', formData);
      setSuccess('Support ticket created successfully!');
      setOpenDialog(false);
      setFormData({
        subject: '',
        category: 'other',
        priority: 'medium',
        description: '',
      });
      fetchTickets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create support ticket');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedTicket) return;

    try {
      setError('');
      await axios.post(`/api/support/${selectedTicket._id}/message`, {
        message: messageText,
      });
      setMessageText('');
      fetchTickets();
      // Refresh selected ticket
      const response = await axios.get(`/api/support/${selectedTicket._id}`);
      setSelectedTicket(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus, resolution = null) => {
    try {
      const updateData = { status: newStatus };
      if (resolution) {
        updateData.resolution = resolution;
      }
      await axios.put(`/api/support/${ticketId}`, updateData);
      setSuccess('Ticket status updated successfully!');
      fetchTickets();
      if (selectedTicket && selectedTicket._id === ticketId) {
        const response = await axios.get(`/api/support/${ticketId}`);
        setSelectedTicket(response.data.data);
      }
      if (newStatus === 'resolved') {
        setOpenResolveDialog(false);
        setResolutionText('');
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update ticket status');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleResolveTicket = () => {
    if (!selectedTicket || !resolutionText.trim()) return;
    handleUpdateStatus(selectedTicket._id, 'resolved', resolutionText.trim());
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <ErrorIcon fontSize="small" />;
      case 'high':
        return <WarningIcon fontSize="small" />;
      case 'medium':
        return <InfoIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Support Tickets
            </Typography>
            <Chip
              label={`Last updated: ${format(lastUpdate, 'HH:mm:ss')}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Get help with your questions and issues {user?.role === 'admin' && '- Resolve issues via messaging'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Create Ticket
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Status Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Tickets" />
          <Tab label="Open" />
          <Tab label="In Progress" />
          <Tab label="Resolved" />
          <Tab label="Closed" />
        </Tabs>
      </Card>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No support tickets found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tabValue === 0
                  ? 'You haven\'t created any support tickets yet.'
                  : `No ${['', 'open', 'in_progress', 'resolved', 'closed'][tabValue]} tickets found.`}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Create Your First Ticket
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {tickets.map((ticket) => (
            <Grid item xs={12} key={ticket._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" gap={1} alignItems="center" mb={1}>
                        <Typography variant="h6" fontWeight={600}>
                          {ticket.subject}
                        </Typography>
                        <Chip
                          label={ticket.ticketID}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {ticket.description.length > 150
                          ? `${ticket.description.substring(0, 150)}...`
                          : ticket.description}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip
                          label={ticket.status.replace('_', ' ')}
                          color={getStatusColor(ticket.status)}
                          size="small"
                        />
                        <Chip
                          icon={getPriorityIcon(ticket.priority)}
                          label={ticket.priority}
                          color={getPriorityColor(ticket.priority)}
                          size="small"
                        />
                        <Chip
                          label={ticket.category}
                          size="small"
                          variant="outlined"
                        />
                        {ticket.assignedTo && (
                          <Chip
                            label={`Assigned to: ${ticket.assignedTo.name}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary" display="block">
                        {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {ticket.messages?.length || 0} message(s)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Create Support Ticket
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder="Brief description of your issue"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="timetable">Timetable</MenuItem>
                  <MenuItem value="attendance">Attendance</MenuItem>
                  <MenuItem value="technical">Technical Issue</MenuItem>
                  <MenuItem value="account">Account Issue</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                multiline
                rows={6}
                placeholder="Please provide detailed information about your issue..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTicket}
            variant="contained"
            disabled={!formData.subject || !formData.description}
          >
            Create Ticket
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedTicket && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedTicket.subject}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip
                      label={selectedTicket.ticketID}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={selectedTicket.status.replace('_', ' ')}
                      color={getStatusColor(selectedTicket.status)}
                      size="small"
                    />
                    <Chip
                      icon={getPriorityIcon(selectedTicket.priority)}
                      label={selectedTicket.priority}
                      color={getPriorityColor(selectedTicket.priority)}
                      size="small"
                    />
                  </Box>
                </Box>
                <IconButton onClick={() => setSelectedTicket(null)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created: {format(new Date(selectedTicket.createdAt), 'PPpp')}
                </Typography>
                {selectedTicket.assignedTo && (
                  <Typography variant="body2" color="text.secondary">
                    Assigned to: {selectedTicket.assignedTo.name}
                  </Typography>
                )}
              </Box>

              <Typography variant="body1" paragraph>
                {selectedTicket.description}
              </Typography>

              {selectedTicket.resolution && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Resolution:
                  </Typography>
                  <Typography variant="body2">{selectedTicket.resolution}</Typography>
                </Alert>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Messages ({selectedTicket.messages?.length || 0})
              </Typography>

              <List sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                {selectedTicket.messages?.map((msg, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          {msg.sender?.name?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="subtitle2" fontWeight={600}>
                              {msg.sender?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(msg.createdAt), 'PPpp')}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {msg.message}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {idx < selectedTicket.messages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box display="flex" justifyContent="space-between">
                  {user?.role === 'admin' && (
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUpdateStatus(selectedTicket._id, 'in_progress')}
                        disabled={selectedTicket.status === 'in_progress'}
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => setOpenResolveDialog(true)}
                        disabled={selectedTicket.status === 'resolved'}
                      >
                        Resolve Issue
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUpdateStatus(selectedTicket._id, 'closed')}
                        disabled={selectedTicket.status === 'closed'}
                      >
                        Close Ticket
                      </Button>
                    </Box>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    Send Message
                  </Button>
                </Box>
              </Paper>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Resolve Ticket Dialog */}
      <Dialog open={openResolveDialog} onClose={() => setOpenResolveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Resolve Support Ticket
            </Typography>
            <IconButton onClick={() => setOpenResolveDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a resolution message that will be sent to the user. This will mark the ticket as resolved.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Resolution Message"
            placeholder="Describe how the issue was resolved..."
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenResolveDialog(false);
            setResolutionText('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleResolveTicket}
            variant="contained"
            color="success"
            disabled={!resolutionText.trim()}
          >
            Resolve & Notify User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportTickets;

