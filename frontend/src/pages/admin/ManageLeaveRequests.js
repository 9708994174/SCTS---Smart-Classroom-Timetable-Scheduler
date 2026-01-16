import React, { useState, useEffect } from 'react';
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
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const ManageLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approveDialog, setApproveDialog] = useState({ open: false, leave: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, leave: null });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/faculty/leaves/pending');
      setLeaveRequests(response.data.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveDialog.leave) return;

    try {
      await axios.put(
        `/api/faculty/${approveDialog.leave.facultyId}/leaves/${approveDialog.leave.leaveId}/approve`
      );
      setSuccess('Leave request approved successfully!');
      setApproveDialog({ open: false, leave: null });
      fetchLeaveRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to approve leave request');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.leave) return;

    try {
      await axios.put(
        `/api/faculty/${rejectDialog.leave.facultyId}/leaves/${rejectDialog.leave.leaveId}/reject`
      );
      setSuccess('Leave request rejected successfully!');
      setRejectDialog({ open: false, leave: null });
      fetchLeaveRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reject leave request');
      setTimeout(() => setError(''), 5000);
    }
  };

  const getDaysDifference = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading leave requests...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Manage Leave Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and approve/reject faculty leave requests
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchLeaveRequests}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {leaveRequests.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <CalendarTodayIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Pending Leave Requests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                All leave requests have been processed.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Faculty</strong></TableCell>
                    <TableCell><strong>Faculty ID</strong></TableCell>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Leave Period</strong></TableCell>
                    <TableCell><strong>Duration</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveRequests.map((leave) => (
                    <TableRow key={leave.leaveId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {leave.facultyName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {leave.facultyEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>{leave.facultyID}</TableCell>
                      <TableCell>
                        <Chip label={leave.department} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(leave.startDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2">
                          to {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${getDaysDifference(leave.startDate, leave.endDate)} days`}
                          size="small"
                          color="info"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {leave.reason || 'No reason provided'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Approve">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => setApproveDialog({ open: true, leave })}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => setRejectDialog({ open: true, leave })}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, leave: null })}>
        <DialogTitle>Approve Leave Request</DialogTitle>
        <DialogContent>
          {approveDialog.leave && (
            <DialogContentText>
              Are you sure you want to approve the leave request for{' '}
              <strong>{approveDialog.leave.facultyName}</strong>?
              <br />
              <br />
              <strong>Leave Period:</strong> {format(new Date(approveDialog.leave.startDate), 'MMM dd, yyyy')} to{' '}
              {format(new Date(approveDialog.leave.endDate), 'MMM dd, yyyy')}
              <br />
              <strong>Duration:</strong> {getDaysDifference(approveDialog.leave.startDate, approveDialog.leave.endDate)} days
              <br />
              <strong>Reason:</strong> {approveDialog.leave.reason || 'No reason provided'}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, leave: null })}>Cancel</Button>
          <Button onClick={handleApprove} color="success" variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, leave: null })}>
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          {rejectDialog.leave && (
            <DialogContentText>
              Are you sure you want to reject the leave request for{' '}
              <strong>{rejectDialog.leave.facultyName}</strong>?
              <br />
              <br />
              <strong>Leave Period:</strong> {format(new Date(rejectDialog.leave.startDate), 'MMM dd, yyyy')} to{' '}
              {format(new Date(rejectDialog.leave.endDate), 'MMM dd, yyyy')}
              <br />
              <strong>Duration:</strong> {getDaysDifference(rejectDialog.leave.startDate, rejectDialog.leave.endDate)} days
              <br />
              <strong>Reason:</strong> {rejectDialog.leave.reason || 'No reason provided'}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, leave: null })}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageLeaveRequests;



