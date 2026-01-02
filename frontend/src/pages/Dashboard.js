import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'faculty') {
      navigate('/faculty');
    } else if (user?.role === 'student') {
      navigate('/student');
    }
  }, [user, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="400px"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          Welcome, {user?.name || 'User'}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Redirecting to your dashboard...
        </Typography>
      </motion.div>
    </Box>
  );
};

export default Dashboard;

