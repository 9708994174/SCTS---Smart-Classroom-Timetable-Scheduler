import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Publish as PublishIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import axiosInstance from '../config/axios';

const Timetables = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const response = await axiosInstance.get('/api/timetable');
      setTimetables(response.data.data);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/timetable/${id}/approve`);
      setSuccess('Timetable approved successfully!');
      fetchTimetables();
      setTimeout(() => setSuccess(''), 3000);
      return Promise.resolve();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to approve timetable');
      setTimeout(() => setError(''), 5000);
      return Promise.reject(error);
    }
  };

  const handlePublish = async (id) => {
    try {
      await axios.put(`/api/timetable/${id}/publish`);
      setSuccess('Timetable published successfully! Faculty can now see it.');
      fetchTimetables();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to publish timetable');
      setTimeout(() => setError(''), 5000);
    }
  };

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

  const filteredTimetables = timetables.filter(tt => {
    const matchesSearch = tt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tt.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Timetables
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage all generated timetables
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Search timetables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setFilterStatus(filterStatus === 'all' ? 'published' : 'all')}
            >
              {filterStatus === 'all' ? 'All' : 'Published Only'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Timetables Table */}
      <Card>
        <CardContent>
          {filteredTimetables.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No timetables found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Generate your first timetable to get started'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Academic Year</strong></TableCell>
                    <TableCell><strong>Semester</strong></TableCell>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTimetables.map((tt) => (
                      <TableRow
                        key={tt._id}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight={500}>{tt.name}</Typography>
                        </TableCell>
                        <TableCell>{tt.academicYear}</TableCell>
                        <TableCell>Semester {tt.semester}</TableCell>
                        <TableCell>{tt.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={tt.status}
                            color={getStatusColor(tt.status)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1} alignItems="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => navigate(`/timetable/${tt._id}`)}
                            >
                              View
                            </Button>
                            {user?.role === 'admin' && (
                              <>
                                {(tt.status === 'generated' || tt.status === 'approved') && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    startIcon={<PublishIcon />}
                                    onClick={() => handlePublish(tt._id)}
                                    sx={{ ml: 1 }}
                                  >
                                    {tt.status === 'generated' ? 'Publish Now' : 'Publish'}
                                  </Button>
                                )}
                                {tt.status === 'generated' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleApprove(tt._id)}
                                    sx={{ ml: 1 }}
                                  >
                                    Approve Only
                                  </Button>
                                )}
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Timetables;
