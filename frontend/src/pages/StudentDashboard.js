import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Book as BookIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/Cards/StatCard';
import axios from 'axios';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    weeklyClasses: 0,
    totalHours: 0,
    attendance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentStats();
  }, [user]);

  const fetchStudentStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get published timetables for student's department
      const [publishedRes, approvedRes] = await Promise.all([
        axios.get('/api/timetable?status=published').catch(() => ({ data: { data: [] } })),
        axios.get('/api/timetable?status=approved').catch(() => ({ data: { data: [] } }))
      ]);

      const allTimetables = [
        ...(publishedRes.data.data || []),
        ...(approvedRes.data.data || [])
      ];

      // Filter timetables for student's department
      const studentTimetables = allTimetables.filter(tt => 
        tt.department === user.department
      );

      // Calculate stats from timetable entries
      let enrolledCourses = new Set();
      let weeklyClasses = 0;
      let totalHours = 0;

      studentTimetables.forEach(tt => {
        if (tt.entries && tt.entries.length > 0) {
          tt.entries.forEach(entry => {
            // Count unique subjects
            if (entry.subject) {
              const subjectId = entry.subject._id || entry.subject;
              enrolledCourses.add(subjectId.toString());
            }

            // Count classes per week
            weeklyClasses++;

            // Calculate hours (assuming duration from timeslot or default 1 hour)
            if (entry.timeslot) {
              const timeslot = entry.timeslot;
              if (timeslot.startTime && timeslot.endTime) {
                const start = timeslot.startTime.split(':').map(Number);
                const end = timeslot.endTime.split(':').map(Number);
                const startMinutes = start[0] * 60 + start[1];
                const endMinutes = end[0] * 60 + end[1];
                const durationHours = (endMinutes - startMinutes) / 60;
                totalHours += durationHours;
              } else {
                // Default to 1 hour if times not available
                totalHours += 1;
              }
            } else {
              totalHours += 1;
            }
          });
        }
      });

      // Calculate real attendance from attendance records
      let attendance = 0;
      try {
        if (user?._id || user?.id) {
          const userId = user._id || user.id;
          const attendanceRes = await axios.get(`/api/attendance/student/${userId}`);
          if (attendanceRes.data.statistics) {
            attendance = attendanceRes.data.statistics.attendancePercentage || 0;
          }
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        // Fallback to 0 if attendance not available
        attendance = 0;
      }

      setStats({
        enrolledCourses: enrolledCourses.size,
        weeklyClasses,
        totalHours: Math.round(totalHours),
        attendance,
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
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
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome, {user?.name?.split(' ')[0]}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Access your timetable and class schedules here.
          </Typography>
        </Box>
      </motion.div>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Enrolled Courses"
            value={stats.enrolledCourses}
            icon={<BookIcon sx={{ fontSize: 28 }} />}
            color="#1976d2"
            subtitle="This semester"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Weekly Classes"
            value={stats.weeklyClasses}
            icon={<ScheduleIcon sx={{ fontSize: 28 }} />}
            color="#9c27b0"
            subtitle={`${stats.totalHours} total hours`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Attendance"
            value={`${stats.attendance}%`}
            icon={<CalendarTodayIcon sx={{ fontSize: 28 }} />}
            color="#2e7d32"
            subtitle="This month"
          />
        </Grid>
      </Grid>

      {/* Main Action Card */}
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                mb: 3,
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 64, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              View Your Timetable
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Access your complete class schedule with room assignments and timings
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<CalendarTodayIcon />}
              onClick={() => navigate('/timetables')}
              sx={{
                py: 1.5,
                px: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              View Timetable
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentDashboard;
