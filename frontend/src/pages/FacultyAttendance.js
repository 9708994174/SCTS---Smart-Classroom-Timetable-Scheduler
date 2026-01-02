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
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const FacultyAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [faculty, setFaculty] = useState(null);
  const [existingAttendance, setExistingAttendance] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, data: null, headCount: 0 });
  const [showAttendancePage, setShowAttendancePage] = useState(false);

  useEffect(() => {
    fetchFacultyData();
  }, []);

  useEffect(() => {
    if (selectedEntry && selectedDate && showAttendancePage) {
      fetchStudents();
      checkExistingAttendance();
    }
  }, [selectedEntry, selectedDate, showAttendancePage]);

  const fetchFacultyData = async () => {
    try {
      const facultyRes = await axios.get('/api/faculty/me');
      setFaculty(facultyRes.data.data);

      // Get published timetables with faculty assignments
      const [publishedRes, approvedRes] = await Promise.all([
        axios.get('/api/timetable?status=published'),
        axios.get('/api/timetable?status=approved')
      ]);

      const allTimetables = [
        ...(publishedRes.data.data || []),
        ...(approvedRes.data.data || [])
      ];

      // Get all entries for this faculty
      const entries = [];
      allTimetables.forEach(tt => {
        if (tt.entries && Array.isArray(tt.entries)) {
          tt.entries.forEach(entry => {
            const entryFacultyId = entry.faculty?._id || entry.faculty;
            if (entryFacultyId) {
              const facultyIdStr = typeof entryFacultyId === 'object' ? entryFacultyId.toString() : entryFacultyId;
              const currentFacultyIdStr = facultyRes.data.data._id.toString();
              
              if (facultyIdStr === currentFacultyIdStr) {
                entries.push({
                  ...entry.toObject ? entry.toObject() : entry,
                  timetableId: tt._id,
                  timetableName: tt.name,
                  academicYear: tt.academicYear
                });
              }
            }
          });
        }
      });

      console.log('Found timetable entries:', entries.length);
      setTimetableEntries(entries);
      
      if (entries.length === 0) {
        // Check if there are any published/approved timetables at all
        if (allTimetables.length === 0) {
          setError('No published or approved timetables found. Please contact administrator to publish a timetable.');
        } else {
          setError('No classes found for your faculty profile. Please ensure you are assigned to subjects in a published/approved timetable.');
        }
      } else {
        setError(''); // Clear error if entries are found
      }
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      setError('Failed to load timetable data');
    }
  };

  const fetchStudents = async () => {
    if (!selectedEntry) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/attendance/students/${selectedEntry._id}`);
      setStudents(response.data.data || []);

      // Initialize attendance data
      const initialData = {};
      response.data.data.forEach(student => {
        initialData[student._id] = 'present';
      });
      setAttendanceData(initialData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAttendance = async () => {
    if (!selectedEntry || !selectedDate) return;

    try {
      const response = await axios.get('/api/attendance', {
        params: {
          date: selectedDate
        }
      });
      
      // Filter by timetable entry ID
      const filtered = response.data.data?.filter(att => {
        const entryId = att.timetableEntry?._id || att.timetableEntry;
        return entryId && entryId.toString() === selectedEntry._id.toString();
      });

      if (filtered && filtered.length > 0) {
        const existing = filtered[0];
        setExistingAttendance(existing);
        
        // Populate attendance data from existing record
        const data = {};
        existing.entries.forEach(entry => {
          const studentId = entry.student._id || entry.student;
          data[studentId] = entry.status;
        });
        setAttendanceData(data);
      } else {
        setExistingAttendance(null);
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const newData = {};
    students.forEach(student => {
      newData[student._id] = status;
    });
    setAttendanceData(newData);
  };

  const handleProceedToAttendance = () => {
    if (!selectedEntry) {
      setError('Please select a class');
      return;
    }
    setShowAttendancePage(true);
    setError('');
    setSuccess('');
  };

  const handleBackToSelection = () => {
    setShowAttendancePage(false);
    setStudents([]);
    setAttendanceData({});
    setExistingAttendance(null);
    setError('');
    setSuccess('');
  };

  const handleSave = () => {
    if (!selectedEntry) return;

    const entries = students.map(student => ({
      student: student._id,
      status: attendanceData[student._id] || 'absent'
    }));

    const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
    setConfirmDialog({
      open: true,
      data: {
        timetableEntryId: selectedEntry._id,
        date: selectedDate,
        entries,
        headCount: presentCount // Default to present count
      },
      headCount: presentCount
    });
  };

  const confirmSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const dataToSend = {
        ...confirmDialog.data,
        headCount: confirmDialog.headCount
      };
      await axios.post('/api/attendance', dataToSend);

      setSuccess('Attendance marked successfully!');
      setConfirmDialog({ open: false, data: null, headCount: 0 });
      checkExistingAttendance();
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'excused':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon fontSize="small" />;
      case 'absent':
        return <CancelIcon fontSize="small" />;
      case 'late':
        return <AccessTimeIcon fontSize="small" />;
      default:
        return null;
    }
  };

  if (!faculty) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Selection Page
  if (!showAttendancePage) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Mark Attendance
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Select a class and date to mark attendance
        </Typography>

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

        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={selectedEntry?._id || ''}
                    onChange={(e) => {
                      const entry = timetableEntries.find(te => te._id === e.target.value);
                      setSelectedEntry(entry);
                    }}
                    label="Class"
                    disabled={timetableEntries.length === 0}
                  >
                    {timetableEntries.length === 0 ? (
                      <MenuItem value="" disabled>
                        No classes available. Please ensure timetable is published/approved.
                      </MenuItem>
                    ) : (
                      timetableEntries.map(entry => (
                        <MenuItem key={entry._id} value={entry._id}>
                          {entry.subject?.subjectName || 'N/A'} - {entry.timeslot?.day || 'N/A'} {entry.timeslot?.startTime || ''} - {entry.timeslot?.endTime || ''}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 3 }}
                />
              </Grid>
            </Grid>

            {selectedEntry && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Class Details:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Subject:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedEntry.subject?.subjectName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Day:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedEntry.timeslot?.day}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Time:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedEntry.timeslot?.startTime} - {selectedEntry.timeslot?.endTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Room:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedEntry.classroom?.roomID}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                size="large"
                onClick={handleProceedToAttendance}
                disabled={!selectedEntry || loading}
                startIcon={<EventIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                Proceed to Mark Attendance
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Attendance Marking Page
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToSelection}
          sx={{ mr: 2 }}
        >
          Back to Selection
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Mark Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedEntry?.subject?.subjectName} - {format(new Date(selectedDate), 'MMM dd, yyyy')}
          </Typography>
        </Box>
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

      {existingAttendance && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Attendance already marked for this date. You can update it.
        </Alert>
      )}

      {selectedEntry && students.length > 0 ? (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <PeopleIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Students ({students.length})
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => handleMarkAll('present')}
                  startIcon={<CheckCircleIcon />}
                >
                  Mark All Present
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleMarkAll('absent')}
                  startIcon={<CancelIcon />}
                >
                  Mark All Absent
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Student Name</strong></TableCell>
                    <TableCell><strong>UID</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const currentStatus = attendanceData[student._id] || 'absent';
                    return (
                      <TableRow key={student._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {student.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{student.uid || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={currentStatus}
                            color={getStatusColor(currentStatus)}
                            size="small"
                            icon={getStatusIcon(currentStatus)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Button
                              size="small"
                              variant={currentStatus === 'present' ? 'contained' : 'outlined'}
                              color="success"
                              onClick={() => handleStatusChange(student._id, 'present')}
                              startIcon={<CheckCircleIcon />}
                            >
                              Present
                            </Button>
                            <Button
                              size="small"
                              variant={currentStatus === 'absent' ? 'contained' : 'outlined'}
                              color="error"
                              onClick={() => handleStatusChange(student._id, 'absent')}
                              startIcon={<CancelIcon />}
                            >
                              Absent
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Present: {Object.values(attendanceData).filter(s => s === 'present').length} | 
                  Absent: {Object.values(attendanceData).filter(s => s === 'absent').length}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading || students.length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {loading ? 'Saving...' : existingAttendance ? 'Update Attendance' : 'Mark Attendance'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : selectedEntry ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              {loading ? (
                <CircularProgress />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    No students found for this class
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : null}

      {/* Confirm Dialog with Head Count */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, data: null, headCount: 0 })} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Attendance</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to {existingAttendance ? 'update' : 'mark'} attendance for:
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ mt: 1, mb: 2 }}>
            {selectedEntry?.subject?.subjectName} on {format(new Date(selectedDate), 'MMM dd, yyyy')}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Attendance Summary:
            </Typography>
            <Typography variant="body2">
              Present: {Object.values(attendanceData).filter(s => s === 'present').length} | 
              Absent: {Object.values(attendanceData).filter(s => s === 'absent').length} | 
              Late: {Object.values(attendanceData).filter(s => s === 'late').length}
            </Typography>
          </Box>

          <TextField
            fullWidth
            type="number"
            label="Head Count (Number of Students Present)"
            value={confirmDialog.headCount}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 0;
              setConfirmDialog(prev => ({ ...prev, headCount: count }));
            }}
            inputProps={{ min: 0, max: students.length }}
            helperText={`Enter the actual number of students present (out of ${students.length} total)`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, data: null, headCount: 0 })}>
            Cancel
          </Button>
          <Button onClick={confirmSave} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyAttendance;
