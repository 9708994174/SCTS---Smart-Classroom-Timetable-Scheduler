import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';

const FacultyAvailability = () => {
  const [faculty, setFaculty] = useState(null);
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openLeave, setOpenLeave] = useState(false);
  const [leaveData, setLeaveData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchFacultyData();
    fetchTimeslots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFacultyData = async () => {
    try {
      // Get faculty profile by current user (will auto-create if missing)
      const response = await axios.get('/api/faculty/me');
      setFaculty(response.data.data);
      setSuccess('Faculty profile loaded successfully!');
    } catch (error) {
      if (error.response?.status === 404) {
        // Try refreshing once - profile might be auto-creating
        setTimeout(() => {
          fetchFacultyData();
        }, 2000);
        setError('Creating your faculty profile... Please wait a moment.');
      } else if (error.response?.status === 403) {
        setError('Access denied. This page is for faculty only.');
      } else {
        setError('Failed to load faculty data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeslots = async () => {
    try {
      const response = await axios.get('/api/timeslot');
      setTimeslots(response.data.data);
    } catch (error) {
      console.error('Error fetching timeslots:', error);
    }
  };

  const handleAvailabilityUpdate = async (day, slot) => {
    if (!faculty) return;

    try {
      const updatedAvailability = faculty.availability || [];
      const existingIndex = updatedAvailability.findIndex(
        a => a.day === day && a.startTime === slot.start && a.endTime === slot.end
      );

      if (existingIndex >= 0) {
        updatedAvailability[existingIndex].isAvailable = !updatedAvailability[existingIndex].isAvailable;
      } else {
        updatedAvailability.push({
          day,
          startTime: slot.start,
          endTime: slot.end,
          isAvailable: true,
        });
      }

      // Use /me endpoint for easier access
      await axios.put('/api/faculty/me/availability', {
        availability: updatedAvailability,
      });

      setSuccess('Availability updated successfully!');
      fetchFacultyData();
    } catch (error) {
      console.error('Error updating availability:', error);
      setError(error.response?.data?.message || 'Failed to update availability. Please try again.');
    }
  };

  const handleAddLeave = async () => {
    if (!faculty) return;

    try {
      await axios.post(`/api/faculty/${faculty._id}/leaves`, {
        ...leaveData,
        status: 'pending',
      });

      setSuccess('Leave request submitted successfully!');
      setOpenLeave(false);
      setLeaveData({ startDate: '', endDate: '', reason: '' });
      fetchFacultyData();
    } catch (error) {
      setError('Failed to submit leave request');
    }
  };

  // Get unique days and timeslots from database
  const days = [...new Set(timeslots.map(ts => ts.day))].sort();
  const uniqueTimeSlots = [...new Set(timeslots.map(ts => ({
    start: ts.startTime,
    end: ts.endTime,
  })))].sort((a, b) => a.start.localeCompare(b.start));

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!faculty) {
    return (
      <Box>
        <Alert severity="error">
          Faculty profile not found. Please contact administrator to create your faculty profile.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Update Availability
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your weekly availability and leave requests
      </Typography>

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

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Weekly Availability
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click on time slots to toggle availability (Green = Available, Red = Unavailable)
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Day</strong></TableCell>
                      {uniqueTimeSlots.map((slot, idx) => (
                        <TableCell key={idx} align="center">
                          {slot.start}
                          <br />
                          <Typography variant="caption">{slot.end}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {days.length > 0 ? days.map((day) => (
                      <TableRow key={day}>
                        <TableCell><strong>{day}</strong></TableCell>
                        {uniqueTimeSlots.map((slot, idx) => {
                          const availability = faculty?.availability?.find(
                            a => a.day === day && a.startTime === slot.start && a.endTime === slot.end
                          );
                          const isAvailable = availability?.isAvailable !== false;

                          return (
                            <TableCell
                              key={idx}
                              align="center"
                              onClick={() => handleAvailabilityUpdate(day, slot)}
                              sx={{
                                cursor: 'pointer',
                                bgcolor: isAvailable ? 'success.lighter' : 'error.lighter',
                                '&:hover': {
                                  bgcolor: isAvailable ? 'success.light' : 'error.light',
                                },
                              }}
                            >
                              <Chip
                                label={isAvailable ? 'Available' : 'Busy'}
                                size="small"
                                color={isAvailable ? 'success' : 'error'}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={uniqueTimeSlots.length + 1} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No timeslots found. Please ask administrator to add timeslots.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Leave Requests
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenLeave(true)}
                fullWidth
                sx={{ mb: 2 }}
              >
                Request Leave
              </Button>

              {faculty.leaves && faculty.leaves.length > 0 ? (
                <Box>
                  {faculty.leaves.map((leave, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {leave.reason}
                      </Typography>
                      <Chip
                        label={leave.status}
                        size="small"
                        color={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'error' : 'warning'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No leave requests
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openLeave} onClose={() => setOpenLeave(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={leaveData.startDate}
            onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={leaveData.endDate}
            onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Reason"
            multiline
            rows={3}
            value={leaveData.reason}
            onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeave(false)}>Cancel</Button>
          <Button onClick={handleAddLeave} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyAvailability;
