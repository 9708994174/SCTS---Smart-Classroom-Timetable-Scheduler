import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ManageTimeslots = () => {
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    timeslotID: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    shift: 'morning',
  });

  useEffect(() => {
    fetchTimeslots();
  }, []);

  const fetchTimeslots = async () => {
    try {
      const response = await axios.get('/api/timeslot');
      setTimeslots(response.data.data);
    } catch (error) {
      setError('Failed to load timeslots');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (slot = null) => {
    if (slot) {
      setEditing(slot);
      setFormData({
        timeslotID: slot.timeslotID || '',
        day: slot.day || 'Monday',
        startTime: slot.startTime || '09:00',
        endTime: slot.endTime || '10:00',
        shift: slot.shift || 'morning',
      });
    } else {
      setEditing(null);
      setFormData({
        timeslotID: '',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        shift: 'morning',
      });
    }
    setOpen(true);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editing) {
        await axios.put(`/api/timeslot/${editing._id}`, formData);
        setSuccess('Timeslot updated successfully!');
      } else {
        await axios.post('/api/timeslot', formData);
        setSuccess('Timeslot created successfully!');
      }
      
      setTimeout(() => {
        handleClose();
        fetchTimeslots();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timeslot?')) return;
    
    try {
      await axios.delete(`/api/timeslot/${id}`);
      setSuccess('Timeslot deleted successfully!');
      fetchTimeslots();
    } catch (error) {
      setError('Failed to delete timeslot');
    }
  };

  const handleBulkCreate = async () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '12:00', end: '13:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' },
    ];

    const bulkData = [];
    days.forEach(day => {
      timeSlots.forEach((slot, idx) => {
        bulkData.push({
          timeslotID: `TS-${day.substring(0, 3)}-${idx + 1}`,
          day: day,
          startTime: slot.start,
          endTime: slot.end,
          shift: 'morning',
        });
      });
    });

    try {
      await axios.post('/api/timeslot/bulk', bulkData);
      setSuccess('Bulk timeslots created successfully!');
      fetchTimeslots();
    } catch (error) {
      setError('Failed to create bulk timeslots');
    }
  };

  if (loading) return <Box>Loading...</Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Manage Timeslots
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={handleBulkCreate}
          >
            Bulk Create
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Add Timeslot
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Timeslot ID</strong></TableCell>
                  <TableCell><strong>Day</strong></TableCell>
                  <TableCell><strong>Time</strong></TableCell>
                  <TableCell><strong>Shift</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeslots.map((slot) => (
                  <TableRow key={slot._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ScheduleIcon fontSize="small" color="action" />
                        {slot.timeslotID}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={slot.day} size="small" />
                    </TableCell>
                    <TableCell>{slot.startTime} - {slot.endTime}</TableCell>
                    <TableCell>{slot.shift}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpen(slot)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(slot._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Timeslot' : 'Add New Timeslot'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Timeslot ID"
                  name="timeslotID"
                  value={formData.timeslotID}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Day"
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="Monday">Monday</MenuItem>
                  <MenuItem value="Tuesday">Tuesday</MenuItem>
                  <MenuItem value="Wednesday">Wednesday</MenuItem>
                  <MenuItem value="Thursday">Thursday</MenuItem>
                  <MenuItem value="Friday">Friday</MenuItem>
                  <MenuItem value="Saturday">Saturday</MenuItem>
                  <MenuItem value="Sunday">Sunday</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Shift"
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="evening">Evening</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ManageTimeslots;




