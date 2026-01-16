import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import StatCard from '../../components/Cards/StatCard';

const ManageAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    overallPercentage: 0,
  });
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    academicYear: '',
    date: '',
  });
  const [error, setError] = useState('');

  // Debounced effect to prevent refresh on every input
  useEffect(() => {
    // Set timer to fetch after user stops typing
    const timer = setTimeout(() => {
      fetchAttendance();
      fetchStats();
    }, 500); // Wait 500ms after user stops typing

    // Cleanup timer on unmount or when filters change
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.semester) params.semester = filters.semester;
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.date) params.date = filters.date;

      const response = await axios.get('/api/attendance', { params });
      setAttendance(response.data.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.semester) params.semester = filters.semester;
      if (filters.academicYear) params.academicYear = filters.academicYear;

      const response = await axios.get('/api/attendance/stats', { params });
      setStats(response.data.data || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading && attendance.length === 0) {
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
            Attendance Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all attendance records
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchAttendance();
            fetchStats();
          }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Records"
            value={stats.totalRecords}
            icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
            color="#1976d2"
            subtitle="Attendance records"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Present"
            value={stats.totalPresent}
            icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
            color="#2e7d32"
            subtitle="Total present"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Absent"
            value={stats.totalAbsent}
            icon={<CancelIcon sx={{ fontSize: 28 }} />}
            color="#d32f2f"
            subtitle="Total absent"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overall %"
            value={`${stats.overallPercentage}%`}
            icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
            color={stats.overallPercentage >= 75 ? "#2e7d32" : "#ed6c02"}
            subtitle="Attendance rate"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Department"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Semester"
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Academic Year"
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Attendance Records ({attendance.length})
          </Typography>
          {attendance.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No attendance records found
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell><strong>Faculty</strong></TableCell>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Semester</strong></TableCell>
                    <TableCell align="center"><strong>Total</strong></TableCell>
                    <TableCell align="center"><strong>Present</strong></TableCell>
                    <TableCell align="center"><strong>Absent</strong></TableCell>
                    <TableCell align="center"><strong>Late</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((att) => (
                    <TableRow key={att._id} hover>
                      <TableCell>
                        {format(new Date(att.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {att.subject?.subjectName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{att.faculty?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip label={att.department} size="small" />
                      </TableCell>
                      <TableCell>Sem {att.semester}</TableCell>
                      <TableCell align="center">{att.totalStudents}</TableCell>
                      <TableCell align="center">
                        <Chip label={att.presentCount} color="success" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={att.absentCount} color="error" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={att.lateCount} color="warning" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={att.status}
                          color={att.status === 'marked' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ManageAttendance;


