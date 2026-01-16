import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon,
} from '@mui/icons-material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axiosInstance from '../config/axios';
import TimetableGrid from '../components/Timetable/TimetableGrid';

const ViewTimetable = () => {
  const { id } = useParams();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTimetable = async () => {
    try {
      const response = await axiosInstance.get(`/api/timetable/${id}`);
      setTimetable(response.data.data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!timetable) {
    return (
      <Box>
        <Typography variant="h5">Timetable not found</Typography>
      </Box>
    );
  }

  // Prepare data for TimetableGrid
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Get unique timeslots from entries
  const timeslotMap = new Map();
  timetable.entries?.forEach(entry => {
    if (entry.timeslot) {
      const key = `${entry.timeslot.day}-${entry.timeslot.startTime}-${entry.timeslot.endTime}`;
      if (!timeslotMap.has(key)) {
        timeslotMap.set(key, {
          id: key,
          startTime: entry.timeslot.startTime,
          endTime: entry.timeslot.endTime,
        });
      }
    }
  });
  
  const uniqueTimeslots = Array.from(timeslotMap.values()).sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'approved':
        return 'info';
      case 'generated':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {timetable.name}
            </Typography>
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {timetable.academicYear} • Semester {timetable.semester} • {timetable.department}
              </Typography>
              <Chip
                label={timetable.status}
                color={getStatusColor(timetable.status)}
                size="small"
                sx={{ textTransform: 'capitalize', fontSize: '0.7rem', height: 24 }}
              />
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Metrics Cards */}
      {timetable.metrics && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontSize: '0.7rem' }}>
                      Utilization
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {timetable.metrics.classroomUtilization?.toFixed(1)}%
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 28, color: 'primary.main', opacity: 0.3 }} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={timetable.metrics.classroomUtilization || 0}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontSize: '0.7rem' }}>
                      Workload Balance
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      {timetable.metrics.facultyWorkloadBalance?.toFixed(1)}%
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 28, color: 'success.main', opacity: 0.3 }} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={timetable.metrics.facultyWorkloadBalance || 0}
                  color="success"
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontSize: '0.7rem' }}>
                      Conflicts
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color={timetable.metrics.conflictCount > 0 ? 'error.main' : 'success.main'}>
                      {timetable.metrics.conflictCount || 0}
                    </Typography>
                  </Box>
                  {timetable.metrics.conflictCount === 0 ? (
                    <CheckCircleIcon sx={{ fontSize: 28, color: 'success.main', opacity: 0.3 }} />
                  ) : (
                    <ErrorIcon sx={{ fontSize: 28, color: 'error.main', opacity: 0.3 }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontSize: '0.7rem' }}>
                      Preference Score
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="info.main">
                      {timetable.metrics.preferenceSatisfaction?.toFixed(1)}%
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 28, color: 'info.main', opacity: 0.3 }} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={timetable.metrics.preferenceSatisfaction || 0}
                  color="info"
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Timetable Grid */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Grid View" />
            <Tab label="List View" />
          </Tabs>
          {tabValue === 0 && (
            <TimetableGrid
              entries={timetable.entries}
              timeslots={uniqueTimeslots}
              days={days}
            />
          )}
          {tabValue === 1 && (
            <Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>Day</strong></TableCell>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell><strong>Faculty</strong></TableCell>
                      <TableCell><strong>Classroom</strong></TableCell>
                      <TableCell><strong>Department</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timetable.entries
                      .sort((a, b) => {
                        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayA = dayOrder.indexOf(a.timeslot?.day || '');
                        const dayB = dayOrder.indexOf(b.timeslot?.day || '');
                        if (dayA !== dayB) return dayA - dayB;
                        return (a.timeslot?.startTime || '').localeCompare(b.timeslot?.startTime || '');
                      })
                      .map((entry, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {entry.timeslot?.startTime || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              to {entry.timeslot?.endTime || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={entry.timeslot?.day || 'N/A'} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {entry.subject?.subjectName || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {entry.subject?.subjectID || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {entry.faculty?.name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {entry.faculty?.facultyID || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <MeetingRoomIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {entry.classroom?.roomID || 'N/A'}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {entry.classroom?.building || ''} • Capacity: {entry.classroom?.capacity || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={entry.department || 'N/A'} size="small" color="primary" variant="outlined" />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ViewTimetable;
