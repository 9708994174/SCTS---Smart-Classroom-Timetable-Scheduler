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
  Select,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axiosInstance from '../../config/axios';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    program: '',
    isActive: 'true',
  });
  const [formData, setFormData] = useState({
    studentID: '',
    name: '',
    email: '',
    department: '',
    semester: 1,
    program: 'UG',
    phone: '',
    password: '',
    uid: '',
  });
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [bulkMode, setBulkMode] = useState('csv'); // 'csv' or 'form'
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [bulkFormData, setBulkFormData] = useState([{ name: '', email: '', department: '', semester: 1, program: 'UG', phone: '', studentID: '', uid: '' }]);
  const [bulkImportResults, setBulkImportResults] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.semester) params.semester = filters.semester;
      if (filters.program) params.program = filters.program;
      if (filters.isActive) params.isActive = filters.isActive;

      const response = await axiosInstance.get('/api/student', { params });
      setStudents(response.data.data || []);
    } catch (error) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (student = null) => {
    if (student) {
      setEditing(student);
      setFormData({
        studentID: student.studentID || '',
        name: student.name || '',
        email: student.email || '',
        department: student.department || '',
        semester: student.semester || 1,
        program: student.program || 'UG',
        phone: student.phone || '',
        password: '',
        uid: student.user?.uid || '',
      });
    } else {
      setEditing(null);
      setFormData({
        studentID: '',
        name: '',
        email: '',
        department: '',
        semester: 1,
        program: 'UG',
        phone: '',
        password: '',
        uid: '',
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
        await axiosInstance.put(`/api/student/${editing._id}`, formData);
        setSuccess('Student updated successfully!');
      } else {
        await axiosInstance.post('/api/student', formData);
        setSuccess('Student created successfully! Default password: student123');
      }
      
      setTimeout(() => {
        handleClose();
        fetchStudents();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this student?')) return;
    
    try {
      await axiosInstance.delete(`/api/student/${id}`);
      setSuccess('Student deactivated successfully!');
      fetchStudents();
    } catch (error) {
      setError('Failed to deactivate student');
    }
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length && values.some(v => v)) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push({
            name: row.name || row['student name'] || '',
            email: row.email || '',
            department: row.department || '',
            semester: parseInt(row.semester) || 1,
            program: (row.program || 'UG').toUpperCase(),
            phone: row.phone || '',
            studentID: row.studentid || row['student id'] || '',
            uid: row.uid || '',
          });
        }
      }
      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleBulkFormAdd = () => {
    setBulkFormData([...bulkFormData, { name: '', email: '', department: '', semester: 1, program: 'UG', phone: '', studentID: '', uid: '' }]);
  };

  const handleBulkFormRemove = (index) => {
    setBulkFormData(bulkFormData.filter((_, i) => i !== index));
  };

  const handleBulkFormChange = (index, field, value) => {
    const newData = [...bulkFormData];
    newData[index][field] = value;
    setBulkFormData(newData);
  };

  const handleBulkImport = async () => {
    setImporting(true);
    setError('');
    setSuccess('');
    setBulkImportResults(null);

    try {
      const studentsToImport = bulkMode === 'csv' ? csvData : bulkFormData.filter(row => row.name && row.email);
      
      if (studentsToImport.length === 0) {
        setError('No valid students to import');
        setImporting(false);
        return;
      }

      const response = await axiosInstance.post('/api/student/bulk', { students: studentsToImport });
      setBulkImportResults(response.data.results);
      setSuccess(response.data.message);
      fetchStudents();
      
      setTimeout(() => {
        if (response.data.results.failed === 0 && response.data.results.skipped === 0) {
          setOpenBulkDialog(false);
          setCsvData([]);
          setBulkFormData([{ name: '', email: '', department: '', semester: 1, program: 'UG', phone: '', studentID: '', uid: '' }]);
          setCsvFile(null);
        }
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = ['Name', 'Email', 'Department', 'Semester', 'Program', 'Phone', 'Student ID', 'UID'];
    const example = ['John Doe', 'john.doe@example.com', 'CSE', '1', 'UG', '1234567890', 'STU001', 'UID001'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentID.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get unique departments, semesters, and programs for filters
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const programs = ['UG', 'PG'];

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Manage Students
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add, edit, and manage student records
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenBulkDialog(true)}
            sx={{
              borderColor: 'primary.main',
            }}
          >
            Bulk Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Add Student
          </Button>
        </Box>
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  label="Department"
                >
                  <MenuItem value="">All</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Semester</InputLabel>
                <Select
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  label="Semester"
                >
                  <MenuItem value="">All</MenuItem>
                  {semesters.map(sem => (
                    <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Program</InputLabel>
                <Select
                  value={filters.program}
                  onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                  label="Program"
                >
                  <MenuItem value="">All</MenuItem>
                  {programs.map(prog => (
                    <MenuItem key={prog} value={prog}>{prog}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                  <MenuItem value="">All</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilters({ department: '', semester: '', program: '', isActive: 'true' });
                  setSearchTerm('');
                }}
                size="small"
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Students ({filteredStudents.length})
            </Typography>
          </Box>
          {filteredStudents.length === 0 ? (
            <Box textAlign="center" py={4}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No students found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your search or filters.'
                  : 'Add your first student to get started.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpen()}
              >
                Add Student
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
              <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '12%', fontWeight: 600 }}>Student ID</TableCell>
                    <TableCell sx={{ width: '18%', fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ width: '20%', fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ width: '12%', fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ width: '10%', fontWeight: 600 }}>Semester</TableCell>
                    <TableCell sx={{ width: '10%', fontWeight: 600 }}>Program</TableCell>
                    <TableCell sx={{ width: '10%', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ width: '8%', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student._id} hover>
                      <TableCell>
                        <Chip 
                          label={student.studentID} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1} sx={{ whiteSpace: 'nowrap' }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2" noWrap>
                            {student.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '100%' }}>
                          {student.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={student.department} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`Sem ${student.semester}`} 
                          size="small" 
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={student.program} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.isActive ? 'Active' : 'Inactive'}
                          color={student.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpen(student)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(student._id)} 
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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

      {/* Add/Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            height: 'auto',
          }
        }}
      >
        <DialogTitle>
          {editing ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent 
            sx={{ 
              overflow: 'hidden',
              padding: '20px 24px',
              maxHeight: 'calc(90vh - 140px)',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student ID"
                  name="studentID"
                  value={formData.studentID}
                  onChange={handleChange}
                  required={!editing}
                  size="small"
                  helperText={editing ? "Student ID cannot be changed" : "Auto-generated if left empty"}
                  disabled={!!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="UID (Optional)"
                  name="uid"
                  value={formData.uid}
                  onChange={handleChange}
                  size="small"
                  helperText="University ID"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  size="small"
                  disabled={!!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Semester"
                  name="semester"
                  type="number"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  size="small"
                  inputProps={{ min: 1, max: 8 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Program</InputLabel>
                  <Select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    label="Program"
                    required
                  >
                    <MenuItem value="UG">Undergraduate (UG)</MenuItem>
                    <MenuItem value="PG">Postgraduate (PG)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  size="small"
                />
              </Grid>
              {!editing && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    size="small"
                    helperText="Leave empty to use default password: student123"
                  />
                </Grid>
              )}
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

      {/* Bulk Import Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Bulk Import Students
            </Typography>
            <IconButton onClick={() => setOpenBulkDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Tabs value={bulkMode === 'csv' ? 0 : 1} onChange={(e, v) => setBulkMode(v === 0 ? 'csv' : 'form')}>
                <Tab label="CSV Upload" icon={<UploadIcon />} iconPosition="start" />
                <Tab label="Form Entry" icon={<AddIcon />} iconPosition="start" />
              </Tabs>
              <Button
                variant="outlined"
                size="small"
                onClick={downloadCSVTemplate}
                startIcon={<DownloadIcon />}
              >
                Download Template
              </Button>
            </Box>
          </Box>

          {bulkMode === 'csv' ? (
            <Box>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="csv-upload"
                type="file"
                onChange={handleCSVUpload}
              />
              <label htmlFor="csv-upload">
                <Button variant="outlined" component="span" fullWidth sx={{ mb: 2, py: 2 }}>
                  <UploadIcon sx={{ mr: 1 }} />
                  {csvFile ? csvFile.name : 'Choose CSV File'}
                </Button>
              </label>

              {csvData.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Preview ({csvData.length} students found)
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Department</strong></TableCell>
                          <TableCell><strong>Semester</strong></TableCell>
                          <TableCell><strong>Program</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {csvData.slice(0, 10).map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{row.name || '-'}</TableCell>
                            <TableCell>{row.email || '-'}</TableCell>
                            <TableCell>{row.department || '-'}</TableCell>
                            <TableCell>{row.semester || '-'}</TableCell>
                            <TableCell>{row.program || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {csvData.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Showing first 10 of {csvData.length} rows
                    </Typography>
                  )}
                </Box>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>CSV Format:</strong> Name, Email, Department, Semester, Program, Phone, Student ID, UID
                  <br />
                  First row should contain headers. Download template for reference.
                </Typography>
              </Alert>
            </Box>
          ) : (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Add Multiple Students
                </Typography>
                <Button size="small" onClick={handleBulkFormAdd} startIcon={<AddIcon />}>
                  Add Row
                </Button>
              </Box>
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {bulkFormData.map((row, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Student {index + 1}
                      </Typography>
                      {bulkFormData.length > 1 && (
                        <IconButton size="small" onClick={() => handleBulkFormRemove(index)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Name *"
                          value={row.name}
                          onChange={(e) => handleBulkFormChange(index, 'name', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Email *"
                          type="email"
                          value={row.email}
                          onChange={(e) => handleBulkFormChange(index, 'email', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Department *"
                          value={row.department}
                          onChange={(e) => handleBulkFormChange(index, 'department', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Semester *"
                          type="number"
                          value={row.semester}
                          onChange={(e) => handleBulkFormChange(index, 'semester', parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, max: 8 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Program *</InputLabel>
                          <Select
                            value={row.program}
                            onChange={(e) => handleBulkFormChange(index, 'program', e.target.value)}
                            label="Program *"
                          >
                            <MenuItem value="UG">UG</MenuItem>
                            <MenuItem value="PG">PG</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Phone"
                          value={row.phone}
                          onChange={(e) => handleBulkFormChange(index, 'phone', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Student ID"
                          value={row.studentID}
                          onChange={(e) => handleBulkFormChange(index, 'studentID', e.target.value)}
                          helperText="Auto-generated if empty"
                        />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {bulkImportResults && (
            <Box sx={{ mt: 3 }}>
              <Alert 
                severity={bulkImportResults.failed === 0 && bulkImportResults.skipped === 0 ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Import Results
                </Typography>
                <Typography variant="body2">
                  Created: {bulkImportResults.created} | 
                  Failed: {bulkImportResults.failed} | 
                  Skipped: {bulkImportResults.skipped}
                </Typography>
              </Alert>

              {bulkImportResults.details.failed.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Failed Imports:
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Error</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bulkImportResults.details.failed.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name || '-'}</TableCell>
                            <TableCell>{item.email || '-'}</TableCell>
                            <TableCell>
                              <Typography variant="caption" color="error">
                                {item.error}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {bulkImportResults.details.skipped.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Skipped (Already Exists):
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Reason</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bulkImportResults.details.skipped.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name || '-'}</TableCell>
                            <TableCell>{item.email || '-'}</TableCell>
                            <TableCell>
                              <Typography variant="caption" color="warning.main">
                                {item.error}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenBulkDialog(false);
            setCsvData([]);
            setBulkFormData([{ name: '', email: '', department: '', semester: 1, program: 'UG', phone: '', studentID: '', uid: '' }]);
            setCsvFile(null);
            setBulkImportResults(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkImport}
            variant="contained"
            disabled={importing || (bulkMode === 'csv' && csvData.length === 0) || (bulkMode === 'form' && bulkFormData.filter(r => r.name && r.email).length === 0)}
            startIcon={importing ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {importing ? 'Importing...' : `Import ${bulkMode === 'csv' ? csvData.length : bulkFormData.filter(r => r.name && r.email).length} Student(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageStudents;

