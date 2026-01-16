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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    facultyID: '',
    name: '',
    email: '',
    department: '',
    phone: '',
    maxHoursPerWeek: 20,
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get('/api/faculty');
      setFaculty(response.data.data);
    } catch (error) {
      setError('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (fac = null) => {
    if (fac) {
      setEditing(fac);
      setFormData({
        facultyID: fac.facultyID || '',
        name: fac.name || '',
        email: fac.email || '',
        department: fac.department || '',
        phone: fac.phone || '',
        maxHoursPerWeek: fac.maxHoursPerWeek || 20,
      });
    } else {
      setEditing(null);
      setFormData({
        facultyID: '',
        name: '',
        email: '',
        department: '',
        phone: '',
        maxHoursPerWeek: 20,
      });
    }
    setOpen(true);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editing) {
        await axios.put(`/api/faculty/${editing._id}`, formData);
        setSuccess('Faculty updated successfully!');
      } else {
        // First create user account
        const userResponse = await axios.post('/api/auth/register', {
          name: formData.name,
          email: formData.email,
          password: 'faculty123', // Default password
          role: 'faculty',
          department: formData.department,
        });

        // Then create faculty profile
        await axios.post('/api/faculty', {
          ...formData,
          user: userResponse.data.data.user.id,
        });
        setSuccess('Faculty created successfully! Default password: faculty123');
      }
      
      setTimeout(() => {
        handleClose();
        fetchFaculty();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
    
    try {
      await axios.delete(`/api/faculty/${id}`);
      setSuccess('Faculty deleted successfully!');
      fetchFaculty();
    } catch (error) {
      setError('Failed to delete faculty');
    }
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Manage Faculty
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Add Faculty
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
                  <TableCell><strong>Faculty ID</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Department</strong></TableCell>
                  <TableCell><strong>Max Hours/Week</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faculty.map((fac) => (
                  <TableRow key={fac._id}>
                    <TableCell>{fac.facultyID}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" color="action" />
                        {fac.name}
                      </Box>
                    </TableCell>
                    <TableCell>{fac.email}</TableCell>
                    <TableCell>
                      <Chip label={fac.department} size="small" />
                    </TableCell>
                    <TableCell>{fac.maxHoursPerWeek}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpen(fac)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(fac._id)} color="error">
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Faculty ID"
              name="facultyID"
              value={formData.facultyID}
              onChange={handleChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
              disabled={!!editing}
            />
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Max Hours Per Week"
              name="maxHoursPerWeek"
              type="number"
              value={formData.maxHoursPerWeek}
              onChange={handleChange}
              margin="normal"
              inputProps={{ min: 1, max: 40 }}
            />
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

export default ManageFaculty;





