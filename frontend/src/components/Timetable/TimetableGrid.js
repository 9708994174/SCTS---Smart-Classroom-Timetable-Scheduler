import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Person as PersonIcon,
  MeetingRoom as MeetingRoomIcon,
} from '@mui/icons-material';

const TimetableGrid = ({ entries, timeslots, days }) => {

  // Group entries by day and timeslot
  const schedule = {};
  days.forEach(day => {
    schedule[day] = {};
    timeslots.forEach(slot => {
      schedule[day][slot.id] = [];
    });
  });

  entries?.forEach(entry => {
    const day = entry.timeslot?.day;
    if (!day || !entry.timeslot?.startTime || !entry.timeslot?.endTime) return;
    
    // Create slot ID matching the format used in timeslots array
    const slotId = `${day}-${entry.timeslot.startTime}-${entry.timeslot.endTime}`;
    
    if (schedule[day] && schedule[day][slotId]) {
      schedule[day][slotId].push(entry);
    }
  });

  const getColorForSubject = (subjectName) => {
    const colors = [
      '#1976d2', '#9c27b0', '#2e7d32', '#ed6c02',
      '#d32f2f', '#0288d1', '#7b1fa2', '#388e3c',
    ];
    const index = subjectName?.charCodeAt(0) % colors.length;
    return colors[index] || '#1976d2';
  };

  return (
    <Paper sx={{ p: 1, borderRadius: 2, width: 'fit-content', maxWidth: '85%' }}>
      <Box sx={{ overflowX: 'auto', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `60px repeat(${days.length}, minmax(140px, 200px))`, gap: 0.5 }}>
          {/* Header */}
          <Box sx={{ position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper' }} />
          {days.map(day => (
            <Box
              key={day}
              sx={{
                p: 0.75,
                textAlign: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            >
              {day.substring(0, 3)}
            </Box>
          ))}

          {/* Time slots */}
          {timeslots.map(slot => (
            <React.Fragment key={slot.id}>
              <Box
                sx={{
                  p: 0.5,
                  textAlign: 'center',
                  borderRadius: 0.5,
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: 60,
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                  {slot.startTime}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1.2 }}>
                  {slot.endTime}
                </Typography>
              </Box>
              {days.map(day => (
                <Box
                  key={`${day}-${slot.id}`}
                  sx={{
                    minHeight: 80,
                    p: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 0.75,
                    bgcolor: schedule[day]?.[slot.id]?.length > 0 ? 'background.paper' : 'grey.50',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    justifyContent: schedule[day]?.[slot.id]?.length > 0 ? 'flex-start' : 'center',
                    alignItems: 'stretch',
                  }}
                >
                  {schedule[day]?.[slot.id]?.length > 0 ? (
                    schedule[day][slot.id].map((entry, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {entry.subject?.subjectName}
                            </Typography>
                            <Typography variant="caption">
                              Faculty: {entry.faculty?.name}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              Room: {entry.classroom?.roomID}
                            </Typography>
                          </Box>
                        }
                        arrow
                      >
                        <Box
                          sx={{
                            p: 0.5,
                            borderRadius: 0.5,
                            bgcolor: `${getColorForSubject(entry.subject?.subjectName)}15`,
                            border: `1px solid ${getColorForSubject(entry.subject?.subjectName)}40`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flex: 1,
                            '&:hover': {
                              transform: 'scale(1.02)',
                              boxShadow: 1,
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            sx={{
                              color: getColorForSubject(entry.subject?.subjectName),
                              fontSize: '0.65rem',
                              lineHeight: 1.2,
                              display: 'block',
                              mb: 0.25,
                            }}
                          >
                            {entry.subject?.subjectName || 'N/A'}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.2} mb={0.15}>
                            <PersonIcon sx={{ fontSize: 8, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
                              {entry.faculty?.name?.split(' ')[0] || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.2}>
                            <MeetingRoomIcon sx={{ fontSize: 8, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
                              {entry.classroom?.roomID || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Tooltip>
                    </motion.div>
                    ))
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        opacity: 0.3,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        Free
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default TimetableGrid;

