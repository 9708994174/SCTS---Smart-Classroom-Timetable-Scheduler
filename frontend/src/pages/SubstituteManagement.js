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
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const SubstituteManagement = () => {
  const { user } = useAuth();
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timetables, setTimetables] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    facultyId: '',
  });

  const [formData, setFormData] = useState({
    originalFacultyId: '',
    substituteFacultyId: '',
    timetableEntryId: '',
    entryID: '',
    date: '',
    reason: '',
  });

  useEffect(() => {
    fetchSubstitutes();
    if (user?.role === 'admin') {
      fetchTimetables();
      fetchFaculty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchSubstitutes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.date) params.date = filters.date;
      if (filters.facultyId) params.facultyId = filters.facultyId;

      const response = await axios.get('/api/substitute', { params });
      setSubstitutes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching substitutes:', error);
      setError('Failed to load substitute assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetables = async () => {
    try {
      const response = await axios.get('/api/timetable?status=published');
      setTimetables(response.data.data || []);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await axios.get('/api/faculty');
      setFaculty(response.data.data || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const handleCreateSubstitute = async () => {
    try {
      setError('');
      setSuccess('');
      await axios.post('/api/substitute', formData);
      setSuccess('Substitute assignment created successfully!');
      setOpenDialog(false);
      setFormData({
        originalFacultyId: '',
        substituteFacultyId: '',
        timetableEntryId: '',
        entryID: '',
        date: '',
        reason: '',
      });
      fetchSubstitutes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create substitute assignment');
    }
  };

  const handleUpdateStatus = async (substituteId, newStatus) => {
    try {
      await axios.put(`/api/substitute/${substituteId}`, { status: newStatus });
      setSuccess('Substitute assignment updated successfully!');
      fetchSubstitutes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update substitute assignment');
    }
  };

  const handleDelete = async (substituteId) => {
    if (!window.confirm('Are you sure you want to delete this substitute assignment?')) return;

    try {
      await axios.delete(`/api/substitute/${substituteId}`);
      setSuccess('Substitute assignment deleted successfully!');
      fetchSubstitutes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete substitute assignment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTimetableEntries = () => {
    if (!formData.originalFacultyId || !timetables.length) return [];
    
    const allEntries = [];
    timetables.forEach(timetable => {
      timetable.entries?.forEach(entry => {
        if (entry.faculty?._id === formData.originalFacultyId || 
            entry.faculty?.toString() === formData.originalFacultyId) {
          allEntries.push({
            ...entry,
            timetableId: timetable._id,
            timetableName: timetable.name,
            department: timetable.department,
            semester: timetable.semester,
          });
        }
      });
    });
    return allEntries;
  };

  if (loading && substitutes.length === 0) {
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
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Substitute Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage substitute teacher assignments for classes
          </Typography>
        </Box>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Assign Substitute
          </Button>
        )}
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

      {/* Filters */}
      {user?.role === 'admin' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Faculty</InputLabel>
                  <Select
                    value={filters.facultyId}
                    onChange={(e) => setFilters({ ...filters, facultyId: e.target.value })}
                    label="Faculty"
                  >
                    <MenuItem value="">All Faculty</MenuItem>
                    {faculty.map((f) => (
                      <MenuItem key={f._id} value={f._id}>
                        {f.name} ({f.facultyID})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Substitutes Grid */}
      {substitutes.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No substitute assignments found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.role === 'admin'
                  ? 'Create your first substitute assignment to get started.'
                  : 'You don\'t have any substitute assignments yet.'}
              </Typography>
              {user?.role === 'admin' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                >
                  Assign Substitute
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {substitutes.map((substitute) => (
            <Grid item xs={12} md={6} lg={4} key={substitute._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Chip
                      label={substitute.status}
                      color={getStatusColor(substitute.status)}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {substitute.substituteID}
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {substitute.subject?.subjectName || 'N/A'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Date:</strong> {format(new Date(substitute.date), 'PP')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Time:</strong> {substitute.timeslot?.day} {substitute.timeslot?.startTime} - {substitute.timeslot?.endTime}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Room:</strong> {substitute.classroom?.roomID || 'N/A'}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Original Faculty
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight={500}>
                        {substitute.originalFaculty?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Substitute Faculty
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="success" />
                      <Typography variant="body2" fontWeight={500}>
                        {substitute.substituteFaculty?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  {substitute.reason && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Reason
                      </Typography>
                      <Typography variant="body2">
                        {substitute.reason}
                      </Typography>
                    </Box>
                  )}

                  {substitute.approvedBy && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Approved by: {substitute.approvedBy?.name} on {format(new Date(substitute.approvedAt), 'PP')}
                    </Typography>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  {user?.role === 'admin' && (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {substitute.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleUpdateStatus(substitute._id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleUpdateStatus(substitute._id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(substitute._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  {user?.role === 'faculty' && substitute.status === 'approved' && (
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleUpdateStatus(substitute._id, 'completed')}
                    >
                      Mark as Completed
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Substitute Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Assign Substitute Teacher
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Original Faculty</InputLabel>
                <Select
                  value={formData.originalFacultyId}
                  onChange={(e) => {
                    setFormData({ ...formData, originalFacultyId: e.target.value, timetableEntryId: '', entryID: '' });
                  }}
                  label="Original Faculty"
                >
                  {faculty.map((f) => (
                    <MenuItem key={f._id} value={f._id}>
                      {f.name} ({f.facultyID})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Substitute Faculty</InputLabel>
                <Select
                  value={formData.substituteFacultyId}
                  onChange={(e) => setFormData({ ...formData, substituteFacultyId: e.target.value })}
                  label="Substitute Faculty"
                >
                  {faculty
                    .filter(f => f._id !== formData.originalFacultyId)
                    .map((f) => (
                      <MenuItem key={f._id} value={f._id}>
                        {f.name} ({f.facultyID})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            {formData.originalFacultyId && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Timetable Entry</InputLabel>
                  <Select
                    value={formData.timetableEntryId}
                    onChange={(e) => {
                      const entry = getTimetableEntries().find(ent => ent._id === e.target.value);
                      setFormData({
                        ...formData,
                        timetableEntryId: e.target.value,
                        entryID: entry?.entryID || '',
                      });
                    }}
                    label="Timetable Entry"
                  >
                    {getTimetableEntries().map((entry) => (
                      <MenuItem key={entry._id} value={entry._id}>
                        {entry.subject?.subjectName || 'N/A'} - {entry.timeslot?.day} {entry.timeslot?.startTime} - {entry.timeslot?.endTime} ({entry.classroom?.roomID || 'N/A'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                multiline
                rows={3}
                placeholder="Reason for substitute assignment..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSubstitute}
            variant="contained"
            disabled={!formData.originalFacultyId || !formData.substituteFacultyId || !formData.timetableEntryId || !formData.date}
          >
            Create Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubstituteManagement;

