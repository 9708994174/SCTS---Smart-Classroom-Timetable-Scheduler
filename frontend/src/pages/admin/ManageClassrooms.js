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
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MeetingRoom as RoomIcon,
} from '@mui/icons-material';
import axiosInstance from '../../config/axios';

const ManageClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    roomID: '',
    building: '',
    floor: 0,
    capacity: 30,
    roomType: 'lecture',
    equipment: {
      smartBoard: false,
      projector: false,
      computerLab: false,
      airConditioning: false,
      wifi: true,
    },
    accessibility: {
      groundFloor: false,
      wheelchairAccessible: false,
    },
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await axiosInstance.get('/api/classroom');
      setClassrooms(response.data.data);
    } catch (error) {
      setError('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (room = null) => {
    if (room) {
      setEditing(room);
      setFormData({
        roomID: room.roomID || '',
        building: room.building || '',
        floor: room.floor || 0,
        capacity: room.capacity || 30,
        roomType: room.roomType || 'lecture',
        equipment: room.equipment || {
          smartBoard: false,
          projector: false,
          computerLab: false,
          airConditioning: false,
          wifi: true,
        },
        accessibility: room.accessibility || {
          groundFloor: false,
          wheelchairAccessible: false,
        },
      });
    } else {
      setEditing(null);
      setFormData({
        roomID: '',
        building: '',
        floor: 0,
        capacity: 30,
        roomType: 'lecture',
        equipment: {
          smartBoard: false,
          projector: false,
          computerLab: false,
          airConditioning: false,
          wifi: true,
        },
        accessibility: {
          groundFloor: false,
          wheelchairAccessible: false,
        },
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
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('equipment.')) {
      const key = name.split('.')[1];
      setFormData({
        ...formData,
        equipment: { ...formData.equipment, [key]: checked },
      });
    } else if (name.startsWith('accessibility.')) {
      const key = name.split('.')[1];
      setFormData({
        ...formData,
        accessibility: { ...formData.accessibility, [key]: checked },
      });
    } else {
      setFormData({ ...formData, [name]: type === 'number' ? parseInt(value) : value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editing) {
        await axiosInstance.put(`/api/classroom/${editing._id}`, formData);
        setSuccess('Classroom updated successfully!');
      } else {
        await axiosInstance.post('/api/classroom', formData);
        setSuccess('Classroom created successfully!');
      }
      
      setTimeout(() => {
        handleClose();
        fetchClassrooms();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this classroom?')) return;
    
    try {
      await axiosInstance.delete(`/api/classroom/${id}`);
      setSuccess('Classroom deleted successfully!');
      fetchClassrooms();
    } catch (error) {
      setError('Failed to delete classroom');
    }
  };

  if (loading) return <Box>Loading...</Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Manage Classrooms
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Add Classroom
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
                  <TableCell><strong>Room ID</strong></TableCell>
                  <TableCell><strong>Building</strong></TableCell>
                  <TableCell><strong>Floor</strong></TableCell>
                  <TableCell><strong>Capacity</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classrooms.map((room) => (
                  <TableRow key={room._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <RoomIcon fontSize="small" color="action" />
                        {room.roomID}
                      </Box>
                    </TableCell>
                    <TableCell>{room.building}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.roomType}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpen(room)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(room._id)} color="error">
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
        <DialogTitle>{editing ? 'Edit Classroom' : 'Add New Classroom'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Room ID"
                  name="roomID"
                  value={formData.roomID}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Building"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Floor"
                  name="floor"
                  type="number"
                  value={formData.floor}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Room Type"
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="lecture">Lecture Hall</MenuItem>
                  <MenuItem value="laboratory">Laboratory</MenuItem>
                  <MenuItem value="seminar">Seminar Room</MenuItem>
                  <MenuItem value="auditorium">Auditorium</MenuItem>
                  <MenuItem value="computer_lab">Computer Lab</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Equipment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.equipment.smartBoard}
                          onChange={handleChange}
                          name="equipment.smartBoard"
                        />
                      }
                      label="Smart Board"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.equipment.projector}
                          onChange={handleChange}
                          name="equipment.projector"
                        />
                      }
                      label="Projector"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.equipment.computerLab}
                          onChange={handleChange}
                          name="equipment.computerLab"
                        />
                      }
                      label="Computer Lab"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.equipment.airConditioning}
                          onChange={handleChange}
                          name="equipment.airConditioning"
                        />
                      }
                      label="Air Conditioning"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.equipment.wifi}
                          onChange={handleChange}
                          name="equipment.wifi"
                        />
                      }
                      label="WiFi"
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Accessibility
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.accessibility.groundFloor}
                          onChange={handleChange}
                          name="accessibility.groundFloor"
                        />
                      }
                      label="Ground Floor"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.accessibility.wheelchairAccessible}
                          onChange={handleChange}
                          name="accessibility.wheelchairAccessible"
                        />
                      }
                      label="Wheelchair Accessible"
                    />
                  </Grid>
                </Grid>
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

export default ManageClassrooms;





