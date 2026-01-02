import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Book as BookIcon,
  People as PeopleIcon,
  MeetingRoom as MeetingRoomIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const steps = ['Configure Parameters', 'Review & Generate', 'Results'];

const GenerateTimetable = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    academicYear: '2024-25',
    semester: 1,
    department: 'CSE',
    populationSize: 50,
    maxGenerations: 100,
    mutationRate: 0.1,
  });
  const [result, setResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });
  const [validationErrors, setValidationErrors] = useState([]);
  const [validating, setValidating] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear validation errors when form data changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Auto-validate when department or semester changes (only on step 0)
  useEffect(() => {
    if (activeStep === 0 && formData.department && formData.semester) {
      // Debounce validation
      const timer = setTimeout(() => {
        validateData();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.department, formData.semester, activeStep]);

  const validateData = async () => {
    setValidating(true);
    setValidationErrors([]);
    const errors = [];

    try {
      // Check subjects
      const subjectsRes = await axios.get('/api/subject', {
        params: {
          department: formData.department,
          semester: formData.semester
        }
      });
      if (!subjectsRes.data.data || subjectsRes.data.data.length === 0) {
        errors.push({
          type: 'subjects',
          message: `No subjects found for ${formData.department} department, Semester ${formData.semester}`,
          action: 'Go to Manage Subjects',
          path: '/admin/subjects'
        });
      } else {
        // Check if subjects have assigned faculty
        const subjectsWithoutFaculty = subjectsRes.data.data.filter(
          subj => !subj.assignedFaculty || subj.assignedFaculty.length === 0
        );
        if (subjectsWithoutFaculty.length > 0) {
          errors.push({
            type: 'subjects',
            message: `${subjectsWithoutFaculty.length} subject(s) without assigned faculty`,
            action: 'Assign faculty to subjects',
            path: '/admin/subjects'
          });
        }
      }

      // Check faculty
      const facultyRes = await axios.get('/api/faculty', {
        params: { department: formData.department }
      });
      if (!facultyRes.data.data || facultyRes.data.data.length === 0) {
        errors.push({
          type: 'faculty',
          message: `No faculty found for ${formData.department} department`,
          action: 'Go to Manage Faculty',
          path: '/admin/faculty'
        });
      }

      // Check classrooms
      const classroomRes = await axios.get('/api/classroom');
      if (!classroomRes.data.data || classroomRes.data.data.length === 0) {
        errors.push({
          type: 'classrooms',
          message: 'No active classrooms found',
          action: 'Go to Manage Classrooms',
          path: '/admin/classrooms'
        });
      }

      // Check timeslots
      const timeslotRes = await axios.get('/api/timeslot');
      if (!timeslotRes.data.data || timeslotRes.data.data.length === 0) {
        errors.push({
          type: 'timeslots',
          message: 'No active timeslots found',
          action: 'Go to Manage Timeslots',
          path: '/admin/timeslots'
        });
      }

      setValidationErrors(errors);
      return errors.length === 0;
    } catch (error) {
      console.error('Error validating data:', error);
      errors.push({
        type: 'validation',
        message: 'Error checking data. Please try again.',
        action: '',
        path: ''
      });
      setValidationErrors(errors);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleNext = async () => {
    // Validate data before moving to next step
    const isValid = await validateData();
    
    if (!isValid) {
      const missingItems = validationErrors.map(e => e.type).join(', ');
      setSnackbar({
        open: true,
        message: `Missing required data: ${missingItems}. Please add the required data before generating timetables.`,
        severity: 'warning'
      });
      return;
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleGenerate = async () => {
    // Validate data before generating
    const isValid = await validateData();
    
    if (!isValid) {
      const missingItems = validationErrors.map(e => e.type).join(', ');
      setSnackbar({
        open: true,
        message: `Cannot generate timetable. Missing required data: ${missingItems}. Please add the required data first.`,
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/admin/generate-timetable', {
        academicYear: formData.academicYear,
        semester: parseInt(formData.semester),
        department: formData.department,
        config: {
          populationSize: parseInt(formData.populationSize),
          maxGenerations: parseInt(formData.maxGenerations),
          mutationRate: parseFloat(formData.mutationRate),
        }
      });

      setResult(response.data.data);
      setSuccess('Timetable generated successfully!');
      setActiveStep(2);
      setTimeout(() => {
        navigate(`/timetable/${response.data.data.timetable}`);
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error generating timetable';
      setError(errorMessage);
      
      // Show toaster for specific data errors
      if (errorMessage.includes('No active subjects') || 
          errorMessage.includes('No active faculty') ||
          errorMessage.includes('No active classrooms') ||
          errorMessage.includes('No active timeslots') ||
          errorMessage.includes('Insufficient data')) {
        setSnackbar({
          open: true,
          message: 'Missing required data. Please add subjects, faculty, classrooms, and timeslots before generating timetables.',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Generate Timetable
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure optimization parameters and generate an optimized timetable
      </Typography>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      {activeStep === 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Basic Configuration
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {validationErrors.length > 0 && (
                <Alert 
                  severity="warning" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  icon={<WarningIcon />}
                >
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Missing Required Data:
                  </Typography>
                  <List dense sx={{ mt: 1 }}>
                    {validationErrors.map((err, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {err.type === 'subjects' && <BookIcon fontSize="small" />}
                          {err.type === 'faculty' && <PeopleIcon fontSize="small" />}
                          {err.type === 'classrooms' && <MeetingRoomIcon fontSize="small" />}
                          {err.type === 'timeslots' && <ScheduleIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={err.message}
                          secondary={
                            err.path ? (
                              <Link
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(err.path);
                                }}
                                sx={{ textDecoration: 'none' }}
                              >
                                {err.action}
                              </Link>
                            ) : null
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
                    Please add the required data before generating timetables.
                  </Typography>
                </Alert>
              )}

              {validating && (
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  Validating data requirements...
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Academic Year"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Population Size"
                    name="populationSize"
                    value={formData.populationSize}
                    onChange={handleChange}
                    inputProps={{ min: 10, max: 200 }}
                    helperText="Number of candidate solutions (10-200)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Generations"
                    name="maxGenerations"
                    value={formData.maxGenerations}
                    onChange={handleChange}
                    inputProps={{ min: 10, max: 500 }}
                    helperText="Maximum iterations (10-500)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Mutation Rate"
                    name="mutationRate"
                    value={formData.mutationRate}
                    onChange={handleChange}
                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                    helperText="Mutation probability (0.0-1.0)"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={validating}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  {validating ? 'Validating...' : 'Next'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeStep === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Review Configuration
              </Typography>
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                {Object.entries(formData).map(([key, value]) => (
                  <Box key={key} display="flex" justifyContent="space-between" py={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {validationErrors.length > 0 && (
                <Alert 
                  severity="warning" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  icon={<WarningIcon />}
                >
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Missing Required Data:
                  </Typography>
                  <List dense sx={{ mt: 1 }}>
                    {validationErrors.map((err, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {err.type === 'subjects' && <BookIcon fontSize="small" />}
                          {err.type === 'faculty' && <PeopleIcon fontSize="small" />}
                          {err.type === 'classrooms' && <MeetingRoomIcon fontSize="small" />}
                          {err.type === 'timeslots' && <ScheduleIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={err.message}
                          secondary={
                            err.path ? (
                              <Link
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(err.path);
                                }}
                                sx={{ textDecoration: 'none' }}
                              >
                                {err.action}
                              </Link>
                            ) : null
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
                    Please add the required data before generating timetables.
                  </Typography>
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={handleBack}>Back</Button>
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={loading || validating || validationErrors.length > 0}
                  startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  {loading ? 'Generating...' : 'Generate Timetable'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeStep === 2 && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent>
              <Box textAlign="center" mb={3}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Timetable Generated Successfully!
                </Typography>
                {success && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                    {success}
                  </Alert>
                )}
              </Box>

              {result.metrics && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {result.metrics.classroomUtilization?.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Utilization
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        {result.metrics.conflictCount || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Conflicts
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700} color="info.main">
                        {result.generation}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Generations
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700} color="warning.main">
                        {(result.fitness * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Fitness Score
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/timetable/${result.timetable}`)}
                  size="large"
                >
                  View Timetable
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Snackbar for toaster notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GenerateTimetable;
