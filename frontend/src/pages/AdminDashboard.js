import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  TableChart as TableChartIcon,
  People as PeopleIcon,
  MeetingRoom as MeetingRoomIcon,
  Book as BookIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../config/axios';
import StatCard from '../components/Cards/StatCard';
import UtilizationChart from '../components/Charts/UtilizationChart';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    classroomUtilization: 0,
    conflictResolution: 100,
    dataCompleteness: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (stats) {
      calculateMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  const calculateMetrics = async () => {
    try {
      let classroomUtilization = 0;
      let conflictResolution = 100;
      let dataCompleteness = 0;

      // Get published timetables for utilization calculation
      const timetablesRes = await axiosInstance.get('/api/timetable?status=published');
      const timetables = timetablesRes.data.data || [];
      
      if (timetables.length > 0 && stats.classrooms > 0) {
        // Calculate utilization: classrooms used / total classrooms
        const usedClassrooms = new Set();
        timetables.forEach(tt => {
          if (tt.entries) {
            tt.entries.forEach(entry => {
              if (entry.classroom) {
                const classroomId = entry.classroom._id || entry.classroom;
                usedClassrooms.add(classroomId.toString());
              }
            });
          }
        });
        classroomUtilization = Math.round((usedClassrooms.size / stats.classrooms) * 100);
      }

      // Calculate data completeness
      const hasFaculty = stats.faculty > 0;
      const hasClassrooms = stats.classrooms > 0;
      const hasSubjects = stats.subjects > 0;
      const hasTimetables = stats.timetables > 0;
      const completenessScore = (hasFaculty ? 25 : 0) + (hasClassrooms ? 25 : 0) + (hasSubjects ? 25 : 0) + (hasTimetables ? 25 : 0);
      dataCompleteness = completenessScore;

      // Conflict resolution (from timetable metrics if available)
      if (timetables.length > 0) {
        const avgConflicts = timetables.reduce((sum, tt) => {
          return sum + (tt.metrics?.conflictCount || 0);
        }, 0) / timetables.length;
        conflictResolution = Math.max(0, Math.min(100, 100 - (avgConflicts * 10))); // Penalize conflicts
      }

      setMetrics({
        classroomUtilization,
        conflictResolution: Math.round(conflictResolution),
        dataCompleteness,
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Fetch real utilization data from timetables
    const fetchUtilizationData = async () => {
      try {
        const response = await axiosInstance.get('/api/timetable?status=published');
        const timetables = response.data.data;
        
        if (timetables.length > 0) {
          // Calculate utilization by day (simplified - can be enhanced)
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const data = days.map(day => {
            // Count entries for each day
            const dayEntries = timetables.flatMap(tt => 
              tt.entries?.filter(e => {
                const entryDay = e.timeslot?.day?.substring(0, 3);
                return entryDay === day.substring(0, 3);
              }) || []
            );
            // Simple utilization calculation (can be improved)
            const utilization = Math.min(100, (dayEntries.length / 10) * 100);
            return { name: day, utilization: Math.round(utilization) };
          });
          setChartData(data);
        } else {
          // Default empty data
          setChartData([
            { name: 'Mon', utilization: 0 },
            { name: 'Tue', utilization: 0 },
            { name: 'Wed', utilization: 0 },
            { name: 'Thu', utilization: 0 },
            { name: 'Fri', utilization: 0 },
            { name: 'Sat', utilization: 0 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching utilization data:', error);
        setChartData([]);
      }
    };
    
    if (stats) {
      fetchUtilizationData();
    }
  }, [stats]);

  if (loading) {
    return (
      <Box>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your scheduling system today.
          </Typography>
        </Box>
      </motion.div>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Faculty Members"
              value={stats.faculty || 0}
              icon={<PeopleIcon sx={{ fontSize: 28 }} />}
              color="#1976d2"
              subtitle="Active faculty"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Classrooms"
              value={stats.classrooms || 0}
              icon={<MeetingRoomIcon sx={{ fontSize: 28 }} />}
              color="#9c27b0"
              subtitle="Available rooms"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Subjects"
              value={stats.subjects || 0}
              icon={<BookIcon sx={{ fontSize: 28 }} />}
              color="#2e7d32"
              subtitle="Active courses"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Timetables"
              value={stats.timetables || 0}
              icon={<ScheduleIcon sx={{ fontSize: 28 }} />}
              color="#ed6c02"
              subtitle="Generated schedules"
            />
          </Grid>
        </Grid>
      )}

      {/* Charts and Actions */}
      <Grid container spacing={3}>
        {/* Utilization Chart */}
        {chartData.length > 0 && (
          <Grid item xs={12} md={8}>
            <UtilizationChart data={chartData} />
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/generate')}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                  }}
                >
                  Generate Timetable
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<TableChartIcon />}
                  onClick={() => navigate('/timetables')}
                  sx={{ py: 1.5 }}
                >
                  View Timetables
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Management Links */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Manage Data
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/admin/faculty')}
                >
                  Manage Faculty
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/admin/classrooms')}
                >
                  Manage Classrooms
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/admin/subjects')}
                >
                  Manage Subjects
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/admin/timeslots')}
                >
                  Manage Timeslots
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                System Performance
              </Typography>
              <Box sx={{ mt: 3 }}>
                {stats && [
                  { 
                    label: 'Classroom Utilization', 
                    value: metrics.classroomUtilization, 
                    color: 'primary' 
                  },
                  { 
                    label: 'Conflict Resolution', 
                    value: metrics.conflictResolution, 
                    color: 'success' 
                  },
                  { 
                    label: 'Data Completeness', 
                    value: metrics.dataCompleteness, 
                    color: 'info' 
                  },
                ].map((metric, idx) => (
                  <Box key={idx} sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={500}>
                        {metric.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color={`${metric.color}.main`}>
                        {metric.value}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.value}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: `${metric.color}.lighter`,
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: `${metric.color}.main`,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
