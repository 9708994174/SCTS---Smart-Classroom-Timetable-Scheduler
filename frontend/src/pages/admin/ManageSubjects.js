import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  Autocomplete,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    subjectID: '',
    subjectName: '',
    department: '',
    program: 'UG',
    semester: 1,
    credits: 3,
    classesPerWeek: 3,
    duration: 60,
    enrollment: 0,
    roomRequirements: {
      roomType: 'lecture',
      minCapacity: 30,
      requiredEquipment: [],
      accessibilityNeeded: false,
    },
    assignedFaculty: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, facultyRes] = await Promise.all([
        axios.get('/api/subject'),
        axios.get('/api/faculty'),
      ]);
      setSubjects(subjectsRes.data.data);
      setFaculty(facultyRes.data.data);
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (subj = null) => {
    if (subj) {
      setEditing(subj);
      setFormData({
        subjectID: subj.subjectID || '',
        subjectName: subj.subjectName || '',
        department: subj.department || '',
        program: subj.program || 'UG',
        semester: subj.semester || 1,
        credits: subj.credits || 3,
        classesPerWeek: subj.classesPerWeek || 3,
        duration: subj.duration || 60,
        enrollment: subj.enrollment || 0,
        roomRequirements: subj.roomRequirements || {
          roomType: 'lecture',
          minCapacity: 30,
          requiredEquipment: [],
          accessibilityNeeded: false,
        },
        assignedFaculty: subj.assignedFaculty?.map(f => f._id || f) || [],
      });
    } else {
      setEditing(null);
      setFormData({
        subjectID: '',
        subjectName: '',
        department: '',
        program: 'UG',
        semester: 1,
        credits: 3,
        classesPerWeek: 3,
        duration: 60,
        enrollment: 0,
        roomRequirements: {
          roomType: 'lecture',
          minCapacity: 30,
          requiredEquipment: [],
          accessibilityNeeded: false,
        },
        assignedFaculty: [],
      });
    }
    setOpen(true);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('roomRequirements.')) {
      const key = name.split('.')[1];
      setFormData({
        ...formData,
        roomRequirements: {
          ...formData.roomRequirements,
          [key]: type === 'number' ? parseInt(value) : value === 'true' ? true : value === 'false' ? false : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseInt(value) : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editing) {
        await axios.put(`/api/subject/${editing._id}`, formData);
        setSuccess('Subject updated successfully!');
      } else {
        await axios.post('/api/subject', formData);
        setSuccess('Subject created successfully!');
      }
      
      setTimeout(() => {
        handleClose();
        fetchData();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      await axios.delete(`/api/subject/${id}`);
      setSuccess('Subject deleted successfully!');
      fetchData();
    } catch (error) {
      setError('Failed to delete subject');
    }
  };

  if (loading) return <Box>Loading...</Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Manage Subjects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Add Subject
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Subject ID</strong></TableCell>
                  <TableCell><strong>Subject Name</strong></TableCell>
                  <TableCell><strong>Department</strong></TableCell>
                  <TableCell><strong>Program</strong></TableCell>
                  <TableCell><strong>Semester</strong></TableCell>
                  <TableCell><strong>Credits</strong></TableCell>
                  <TableCell><strong>Classes/Week</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.map((subj) => (
                  <TableRow key={subj._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BookIcon fontSize="small" color="action" />
                        {subj.subjectID}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {subj.subjectName}
                        {(!subj.assignedFaculty || subj.assignedFaculty.length === 0) && (
                          <Chip 
                            label="⚠ No Faculty" 
                            size="small" 
                            color="error" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={subj.department} size="small" />
                    </TableCell>
                    <TableCell>{subj.program}</TableCell>
                    <TableCell>{subj.semester}</TableCell>
                    <TableCell>{subj.credits}</TableCell>
                    <TableCell>{subj.classesPerWeek}</TableCell>
                    <TableCell>
                      {subj.assignedFaculty && subj.assignedFaculty.length > 0 ? (
                        <Chip label={`${subj.assignedFaculty.length} assigned`} size="small" color="success" />
                      ) : (
                        <Chip label="No faculty" size="small" color="error" />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpen(subj)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(subj._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subject ID"
                  name="subjectID"
                  value={formData.subjectID}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subject Name"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Program"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="UG">UG</MenuItem>
                  <MenuItem value="PG">PG</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Credits"
                  name="credits"
                  type="number"
                  value={formData.credits}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Classes Per Week"
                  name="classesPerWeek"
                  type="number"
                  value={formData.classesPerWeek}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1, max: 7 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  inputProps={{ min: 30 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Enrollment"
                  name="enrollment"
                  type="number"
                  value={formData.enrollment}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={faculty}
                  getOptionLabel={(option) => `${option.name} (${option.facultyID})`}
                  value={faculty.filter(f => formData.assignedFaculty.includes(f._id))}
                  onChange={(e, newValue) => {
                    setFormData({
                      ...formData,
                      assignedFaculty: newValue.map(f => f._id),
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Assigned Faculty" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Room Type"
                  name="roomRequirements.roomType"
                  value={formData.roomRequirements.roomType}
                  onChange={handleChange}
                >
                  <MenuItem value="lecture">Lecture Hall</MenuItem>
                  <MenuItem value="laboratory">Laboratory</MenuItem>
                  <MenuItem value="seminar">Seminar Room</MenuItem>
                  <MenuItem value="auditorium">Auditorium</MenuItem>
                  <MenuItem value="computer_lab">Computer Lab</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Min Capacity"
                  name="roomRequirements.minCapacity"
                  type="number"
                  value={formData.roomRequirements.minCapacity}
                  onChange={handleChange}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ManageSubjects;

