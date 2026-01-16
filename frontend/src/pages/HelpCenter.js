import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Book as BookIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Help as HelpIcon,
  QuestionAnswer as QuestionAnswerIcon,
  VideoLibrary as VideoLibraryIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState('');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const featuredGuides = [
    {
      title: 'Timetable Generation',
      description: 'Learn how to generate optimized timetables for your institution. From adding subjects to finalizing schedules.',
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      duration: '15 min read',
      level: 'Essential',
      updated: 'Mar 2025',
    },
    {
      title: 'Marking Attendance',
      description: 'Complete guide to marking and managing student attendance. Learn how to use the attendance system effectively.',
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      duration: '10 min read',
      level: 'Essential',
      updated: 'Mar 2025',
    },
    {
      title: 'Faculty Management',
      description: 'Manage faculty profiles, availability, and subject assignments. Set up your teaching staff efficiently.',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      duration: '12 min read',
      level: 'Essential',
      updated: 'Mar 2025',
    },
  ];

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I generate my first timetable?',
          a: 'Navigate to "Generate Timetable" from the admin dashboard. Fill in the required information (Academic Year, Semester, Department) and configure optimization parameters. Click "Generate Timetable" and wait for the system to create an optimized schedule.',
        },
        {
          q: 'What information do I need before generating a timetable?',
          a: 'You need: Active subjects for the department and semester, Faculty members assigned to subjects, Active classrooms, and Active timeslots. The system will validate these before generation.',
        },
        {
          q: 'How do I publish a timetable?',
          a: 'After generating a timetable, go to the "Timetables" page. Find your timetable and click "Publish". Once published, faculty and students can view it in their accounts.',
        },
      ],
    },
    {
      category: 'Timetable Management',
      questions: [
        {
          q: 'Can I edit a timetable after it\'s generated?',
          a: 'Currently, timetables cannot be edited after generation. You can generate a new timetable with updated parameters. The system will create a new version.',
        },
        {
          q: 'How do I assign classes to specific faculty?',
          a: 'Classes are automatically assigned based on faculty-subject relationships. Make sure subjects have assigned faculty in the "Manage Subjects" section before generating timetables.',
        },
        {
          q: 'What does "approved" status mean?',
          a: 'An approved timetable has been reviewed and approved by an admin but is not yet published. Faculty and students cannot see approved timetables until they are published.',
        },
      ],
    },
    {
      category: 'Attendance',
      questions: [
        {
          q: 'How do I mark attendance for my classes?',
          a: 'Go to "Mark Attendance" from the faculty menu. Select a class and date, then mark each student as present or absent. Enter the head count and confirm to save.',
        },
        {
          q: 'Can I update attendance after marking it?',
          a: 'Yes, you can update attendance for any date. Select the same class and date, make your changes, and save. The system will update the existing record.',
        },
        {
          q: 'What is head count?',
          a: 'Head count is the actual number of students physically present in the class. This helps track attendance accuracy and can differ from the number of enrolled students.',
        },
      ],
    },
    {
      category: 'Account & Profile',
      questions: [
        {
          q: 'How do I update my profile information?',
          a: 'Click on your profile icon in the top right corner, select "Profile", then click "Edit Profile". Update your information and click "Save Changes".',
        },
        {
          q: 'How do I change my password?',
          a: 'Go to your Profile page and click "Change Password" in the Account Settings section. Enter your current password and new password, then confirm.',
        },
        {
          q: 'Can I change my email address?',
          a: 'Yes, you can update your email from the Profile page. The system will verify that the new email is not already in use.',
        },
      ],
    },
    {
      category: 'Notifications',
      questions: [
        {
          q: 'Why am I not seeing my notifications?',
          a: 'If you see a notification count but no messages, try clicking the refresh button in the notification panel. If the issue persists, contact support.',
        },
        {
          q: 'What types of notifications will I receive?',
          a: 'You\'ll receive notifications for: Timetable availability, Attendance marked, Leave requests, System announcements, and Support ticket updates.',
        },
        {
          q: 'How do I mark notifications as read?',
          a: 'Click on a notification to mark it as read, or use the "Mark all read" button in the notification panel.',
        },
      ],
    },
    {
      category: 'Technical Issues',
      questions: [
        {
          q: 'The page keeps refreshing when I type in filters',
          a: 'This has been fixed. The system now waits 500ms after you stop typing before refreshing. If you still experience issues, try refreshing the page.',
        },
        {
          q: 'I can\'t see my timetable entries',
          a: 'Ensure the timetable is published or approved, and that you are assigned to subjects in that timetable. Check with your administrator if issues persist.',
        },
        {
          q: 'How do I report a bug or issue?',
          a: 'Use the Support Tickets feature to create a ticket describing your issue. Our support team will respond to help resolve it.',
        },
      ],
    },
  ];

  const helpTopics = [
    {
      title: 'Timetable Generation',
      icon: <ScheduleIcon />,
      items: [
        'Setting up general information',
        'Adding subjects to your timetable',
        'Adding teachers to your timetable',
        'Creating and organizing lessons',
        'Reviewing and generating timetables',
      ],
    },
    {
      title: 'Attendance Management',
      icon: <CheckCircleIcon />,
      items: [
        'Marking attendance for classes',
        'Viewing attendance records',
        'Understanding attendance statistics',
        'Updating attendance records',
      ],
    },
    {
      title: 'Faculty Management',
      icon: <PeopleIcon />,
      items: [
        'Managing faculty profiles',
        'Setting faculty availability',
        'Assigning subjects to faculty',
        'Managing leave requests',
      ],
    },
    {
      title: 'Student Features',
      icon: <SchoolIcon />,
      items: [
        'Viewing your timetable',
        'Checking attendance records',
        'Understanding notifications',
        'Managing your profile',
      ],
    },
  ];

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      qa =>
        qa.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qa.a.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <Box>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Help Center
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
          Find comprehensive guides and resources to help you use Smart Classroom and Timetable Scheduler efficiently.
        </Typography>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search for help articles, FAQs, or guides..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600, mx: 'auto' }}
        />
      </Box>

      {/* Featured Guides */}
      <Box mb={6}>
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
          Featured Guides
        </Typography>
        <Grid container spacing={3}>
          {featuredGuides.map((guide, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      bgcolor: `${guide.color}15`,
                      color: guide.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    {guide.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {guide.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {guide.description}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    <Chip label={guide.level} size="small" color="primary" variant="outlined" />
                    <Chip label={guide.duration} size="small" />
                    <Chip label={`Updated: ${guide.updated}`} size="small" variant="outlined" />
                  </Box>
                  <Button variant="outlined" fullWidth>
                    Read Guide
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Help Topics */}
      <Box mb={6}>
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
          Popular Help Topics
        </Typography>
        <Grid container spacing={3}>
          {helpTopics.map((topic, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {topic.icon}
                    <Typography variant="h6" fontWeight={600}>
                      {topic.title}
                    </Typography>
                  </Box>
                  <List dense>
                    {topic.items.map((item, itemIdx) => (
                      <ListItem key={itemIdx} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <ArticleIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* FAQs */}
      <Box mb={6}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <QuestionAnswerIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Frequently Asked Questions
          </Typography>
        </Box>

        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <HelpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No results found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try different search terms or browse the categories above.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          filteredFAQs.map((category, catIdx) => (
            <Box key={catIdx} mb={3}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                {category.category}
              </Typography>
              {category.questions.map((qa, qaIdx) => (
                <Accordion
                  key={qaIdx}
                  expanded={expanded === `panel-${catIdx}-${qaIdx}`}
                  onChange={handleChange(`panel-${catIdx}-${qaIdx}`)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {qa.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {qa.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))
        )}
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ p: 4, bgcolor: 'primary.lighter', borderRadius: 2 }}>
        <Box textAlign="center">
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Need More Help?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Can't find what you're looking for? Our support team is ready to assist you with any questions or issues.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/support')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Contact Support
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/support')}
            >
              Create Support Ticket
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default HelpCenter;


