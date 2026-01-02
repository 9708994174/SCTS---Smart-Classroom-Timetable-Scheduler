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
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import StatCard from '../components/Cards/StatCard';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [statistics, setStatistics] = useState({
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendancePercentage: 0,
  });
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
    
    // Real-time polling every 30 seconds
    const interval = setInterval(() => {
      fetchAttendance();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, selectedSubject]);

  const fetchAttendance = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const params = {};
      if (selectedSubject !== 'all') {
        params.subject = selectedSubject;
      }

      if (!user?._id && !user?.id) {
        setError('User information not available');
        setLoading(false);
        return;
      }
      const userId = user._id || user.id;
      const response = await axios.get(`/api/attendance/student/${userId}`, { params });
      setAttendance(response.data.data || []);
      setStatistics(response.data.statistics || {
        totalClasses: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendancePercentage: 0,
      });

      // Get unique subjects
      const uniqueSubjects = [...new Set(
        response.data.data.map(att => att.subject?._id).filter(Boolean)
      )];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to load attendance data');
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

  if (loading) {
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
            My Attendance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your attendance records and statistics
          </Typography>
        </Box>
        {subjects.length > 0 && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Subject</InputLabel>
            <Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              label="Filter by Subject"
            >
              <MenuItem value="all">All Subjects</MenuItem>
              {attendance
                .filter((att, index, self) => 
                  index === self.findIndex(a => a.subject?._id === att.subject?._id)
                )
                .map(att => (
                  <MenuItem key={att.subject?._id} value={att.subject?._id}>
                    {att.subject?.subjectName}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}
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
            title="Total Classes"
            value={statistics.totalClasses}
            icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
            color="#1976d2"
            subtitle="Attended classes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Present"
            value={statistics.presentCount}
            icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
            color="#2e7d32"
            subtitle="Times present"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Absent"
            value={statistics.absentCount}
            icon={<CancelIcon sx={{ fontSize: 28 }} />}
            color="#d32f2f"
            subtitle="Times absent"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Attendance"
            value={`${statistics.attendancePercentage}%`}
            icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
            color={statistics.attendancePercentage >= 75 ? "#2e7d32" : statistics.attendancePercentage >= 50 ? "#ed6c02" : "#d32f2f"}
            subtitle="Overall percentage"
          />
        </Grid>
      </Grid>

      {/* Attendance Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Attendance Progress
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" fontWeight={500}>
                Overall Attendance
              </Typography>
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {statistics.attendancePercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={statistics.attendancePercentage}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  backgroundColor: statistics.attendancePercentage >= 75 
                    ? 'success.main' 
                    : statistics.attendancePercentage >= 50 
                    ? 'warning.main' 
                    : 'error.main',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Attendance Records
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
                    <TableCell><strong>Day</strong></TableCell>
                    <TableCell><strong>Time</strong></TableCell>
                    <TableCell><strong>Faculty</strong></TableCell>
                    <TableCell><strong>Room</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((att) => {
                    const userId = user?._id || user?.id;
                    const studentEntry = att.entries.find(e => {
                      const entryStudentId = (e.student._id || e.student)?.toString();
                      return entryStudentId === userId?.toString();
                    });
                    return (
                      <TableRow key={att._id} hover>
                        <TableCell>
                          {format(new Date(att.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {att.subject?.subjectName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{att.timeslot?.day || 'N/A'}</TableCell>
                        <TableCell>
                          {att.timeslot?.startTime && att.timeslot?.endTime
                            ? `${att.timeslot.startTime} - ${att.timeslot.endTime}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{att.faculty?.name || 'N/A'}</TableCell>
                        <TableCell>{att.classroom?.roomID || 'N/A'}</TableCell>
                        <TableCell align="center">
                          {studentEntry ? (
                            <Chip
                              label={studentEntry.status}
                              color={getStatusColor(studentEntry.status)}
                              size="small"
                              icon={getStatusIcon(studentEntry.status)}
                            />
                          ) : (
                            <Chip label="N/A" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentAttendance;

