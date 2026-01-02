import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/Cards/StatCard';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  useEffect(() => {
    fetchUpcomingClasses();
  }, []);

  const fetchUpcomingClasses = async () => {
    try {
      // Get faculty profile by current user
      const facultyRes = await axios.get('/api/faculty/me');
      const myFaculty = facultyRes.data.data;
      
      if (!myFaculty || !myFaculty._id) {
        console.log('Faculty profile not found or invalid');
        return;
      }
      
      // Get both published and approved timetables
      const [publishedRes, approvedRes] = await Promise.all([
        axios.get('/api/timetable?status=published').catch(() => ({ data: { data: [] } })),
        axios.get('/api/timetable?status=approved').catch(() => ({ data: { data: [] } }))
      ]);
      
      const allTimetables = [
        ...(publishedRes.data.data || []),
        ...(approvedRes.data.data || [])
      ];
      
      console.log('Published timetables:', allTimetables.length);
      console.log('My faculty ID:', myFaculty._id);
      
      // Get all upcoming classes for the week
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayIndex = daysOfWeek.indexOf(today);
      
      const upcomingClasses = [];
      
      allTimetables.forEach(tt => {
        if (!tt.entries || tt.entries.length === 0) {
          console.log('Timetable has no entries:', tt._id);
          return;
        }
        
        tt.entries.forEach(entry => {
          // Handle both populated and unpopulated faculty references
          let entryFacultyId = null;
          if (entry.faculty) {
            entryFacultyId = entry.faculty._id || entry.faculty;
          }
          
          // Convert both to strings for comparison
          const myFacultyIdStr = myFaculty._id.toString();
          const entryFacultyIdStr = entryFacultyId ? entryFacultyId.toString() : null;
          
          if (entryFacultyIdStr === myFacultyIdStr) {
            const entryDay = entry.timeslot?.day;
            if (!entryDay) {
              console.log('Entry missing day:', entry);
              return;
            }
            
            const entryDayIndex = daysOfWeek.indexOf(entryDay);
            
            // Include today and future days (or all if today is not in list)
            if (todayIndex === -1 || entryDayIndex >= todayIndex) {
              const isToday = entryDay === today;
              upcomingClasses.push({
                subject: entry.subject?.subjectName || entry.subject || 'N/A',
                time: entry.timeslot?.startTime && entry.timeslot?.endTime 
                  ? `${entry.timeslot.startTime} - ${entry.timeslot.endTime}`
                  : 'Time TBA',
                room: entry.classroom?.roomID || entry.classroom || 'N/A',
                day: isToday ? 'Today' : entryDay,
                dayIndex: entryDayIndex >= 0 ? entryDayIndex : 999,
                startTime: entry.timeslot?.startTime || '00:00',
              });
            }
          }
        });
      });
      
      console.log('Found upcoming classes:', upcomingClasses.length);
      
      // Sort by day and time
      upcomingClasses.sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.startTime.localeCompare(b.startTime);
      });
      
      setUpcomingClasses(upcomingClasses.slice(0, 10)); // Show up to 10 upcoming classes
    } catch (error) {
      console.error('Error fetching upcoming classes:', error);
      if (error.response?.status !== 404) {
        console.error('Full error:', error.response?.data || error.message);
      }
    }
  };

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
            Here's your teaching schedule and upcoming classes.
          </Typography>
        </Box>
      </motion.div>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Classes"
            value={upcomingClasses.length}
            icon={<SchoolIcon sx={{ fontSize: 28 }} />}
            color="#1976d2"
            subtitle="Upcoming this week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Classes"
            value={upcomingClasses.filter(c => c.day === 'Today').length}
            icon={<ScheduleIcon sx={{ fontSize: 28 }} />}
            color="#9c27b0"
            subtitle="Classes today"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Subjects"
            value={new Set(upcomingClasses.map(c => c.subject)).size || 0}
            icon={<SchoolIcon sx={{ fontSize: 28 }} />}
            color="#2e7d32"
            subtitle="Active courses"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Weekly Hours"
            value={(() => {
              let totalHours = 0;
              upcomingClasses.forEach(c => {
                if (c.time && c.time.includes('-')) {
                  const [start, end] = c.time.split(' - ');
                  if (start && end) {
                    const startTime = start.split(':').map(Number);
                    const endTime = end.split(':').map(Number);
                    const startMinutes = startTime[0] * 60 + startTime[1];
                    const endMinutes = endTime[0] * 60 + endTime[1];
                    totalHours += (endMinutes - startMinutes) / 60;
                  }
                }
              });
              return Math.round(totalHours);
            })()}
            icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
            color={upcomingClasses.length > 0 ? "#2e7d32" : "#ed6c02"}
            subtitle="Teaching hours"
          />
        </Grid>
      </Grid>

      {/* Quick Actions and Upcoming Classes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<CalendarTodayIcon />}
                  onClick={() => navigate('/timetables')}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  View My Timetable
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<ScheduleIcon />}
                  onClick={() => navigate('/availability')}
                  sx={{ py: 1.5 }}
                >
                  Update Availability
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<CalendarTodayIcon />}
                  onClick={() => navigate('/faculty/timetable')}
                  sx={{ py: 1.5 }}
                >
                  View My Timetable
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => navigate('/faculty/attendance')}
                  sx={{ py: 1.5 }}
                >
                  Mark Attendance
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Upcoming Classes
              </Typography>
              {upcomingClasses.length > 0 ? (
                <List>
                  {upcomingClasses.map((classItem, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <ListItem
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          bgcolor: classItem.day === 'Today' ? 'primary.lighter' : 'grey.50',
                          border: classItem.day === 'Today' ? '1px solid' : 'none',
                          borderColor: classItem.day === 'Today' ? 'primary.main' : 'transparent',
                          '&:hover': { bgcolor: classItem.day === 'Today' ? 'primary.light' : 'grey.100' },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: classItem.day === 'Today' ? 'primary.main' : 'grey.400' }}>
                            <SchoolIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={600}>
                              {classItem.subject}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary">
                                ⏰ {classItem.time}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                🏫 Room: {classItem.room}
                              </Typography>
                              <Chip
                                label={classItem.day}
                                size="small"
                                color={classItem.day === 'Today' ? 'primary' : 'default'}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No upcoming classes found.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Make sure timetables are published by admin.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FacultyDashboard;
