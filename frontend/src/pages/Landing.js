import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Stack,
  Divider,
  IconButton,
} from '@mui/material';
import {
  School,
  Schedule,
  People,
  Assessment,
  TrendingUp,
  Security,
  ArrowForward,
  CheckCircle,
  Email,
  Phone,
  LocationOn,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/* ------------------ DATA ------------------ */

const features = [
  { icon: <Schedule sx={{ fontSize: 50 }} />, title: 'Smart Scheduling', description: 'AI-powered timetable generation with conflict detection' },
  { icon: <People sx={{ fontSize: 50 }} />, title: 'Attendance Management', description: 'Real-time attendance with instant notifications' },
  { icon: <Assessment sx={{ fontSize: 50 }} />, title: 'Analytics Dashboard', description: 'Visual insights into schedules & performance' },
  { icon: <Security sx={{ fontSize: 50 }} />, title: 'Secure Platform', description: 'Role-based access with enterprise-grade security' },
  { icon: <TrendingUp sx={{ fontSize: 50 }} />, title: 'Performance Tracking', description: 'Monitor academic & faculty performance' },
  { icon: <School sx={{ fontSize: 50 }} />, title: 'Resource Management', description: 'Optimize classrooms, faculty & assets' },
];

const benefits = [
  'Reduce scheduling conflicts by 95%',
  'Save 20+ hours weekly on admin work',
  'Accurate attendance tracking',
  'Real-time alerts & updates',
  'Mobile-first design',
  '24/7 technical support',
];

const stats = [
  { number: '10K+', label: 'Active Users' },
  { number: '500+', label: 'Institutions' },
  { number: '99.9%', label: 'Uptime' },
  { number: '24/7', label: 'Support' },
];

/* ------------------ COMPONENT ------------------ */

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, #7f7fd5, #86a8e7, #91eae4)',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      {/* ---------------- HEADER ---------------- */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          width: '100%',
          backdropFilter: 'blur(16px)',
          background: 'rgba(255,255,255,0.15)',
          zIndex: 1000,
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <School sx={{ fontSize: 36, mr: 1 }} />
              <Typography fontWeight={900} variant="h5">
                SCTS
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              <Button href="#features" sx={{ color: 'white', textTransform: 'none' }}>Features</Button>
              <Button href="#benefits" sx={{ color: 'white', textTransform: 'none' }}>Benefits</Button>
              <Button variant="outlined" component={Link} to="/login" sx={{ color: 'white', borderColor: 'white' }}>
                Login
              </Button>
              <Button variant="contained" component={Link} to="/signup" sx={{ background: 'white', color: '#5f6ddf' }}>
                Sign Up
              </Button>
            </Box>

            <IconButton sx={{ display: { xs: 'block', md: 'none' }, color: 'white' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* ---------------- HERO ---------------- */}
      <Container maxWidth="lg" sx={{ pt: { xs: 14, md: 18 }, pb: 10 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2.8rem', md: '4.8rem' },
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(90deg,#ffffff,#dfe9f3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Smart Classroom
              <br />
              Timetable
              <br />
              Scheduler
            </Typography>

            <Typography sx={{ mt: 3, fontSize: '1.3rem', opacity: 0.95 }}>
              Intelligent scheduling, real-time attendance, and complete academic management — all in one platform.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mt: 5 }}>
              <Button component={Link} to="/signup" variant="contained" size="large" endIcon={<ArrowForward />}
                sx={{ background: 'white', color: '#5f6ddf', px: 4, py: 1.5, fontWeight: 700 }}>
                Get Started Free
              </Button>
              <Button component={Link} to="/help" variant="outlined" size="large"
                sx={{ color: 'white', borderColor: 'white' }}>
                Learn More
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800"
              alt="Education"
              style={{
                width: '100%',
                borderRadius: 20,
                boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
                border: '3px solid rgba(255,255,255,0.3)',
              }}
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          </Grid>
        </Grid>
      </Container>

      {/* ---------------- BENEFITS ---------------- */}
      <Box id="benefits" sx={{ py: 12, background: 'rgba(255,255,255,0.12)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" fontWeight={800} mb={3}>
                Why Choose SCTS?
              </Typography>

              <Stack spacing={2}>
                {benefits.map((b, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle />
                    <Typography>{b}</Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>

            {/* IMAGE RESTORED */}
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', borderRadius: 4, overflow: 'hidden' }}>
                <motion.img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800"
                  alt="Why Choose SCTS"
                  style={{
                    width: '100%',
                    borderRadius: 16,
                    boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
                    border: '3px solid rgba(255,255,255,0.3)',
                  }}
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ---------------- FOOTER ---------------- */}
      <Box sx={{ py: 6, background: 'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography fontWeight={800} variant="h5">SCTS</Typography>
              <Typography opacity={0.8} mt={2}>Smart Classroom & Timetable Scheduler</Typography>
              <Typography opacity={0.8}>Transforming academic management with AI-driven solutions.</Typography>
              <Stack direction="row" spacing={1} mt={3}>
                {[Facebook, Twitter, LinkedIn, Instagram].map((Icon, i) => (
                  <IconButton key={i} sx={{ color: 'white' }}><Icon /></IconButton>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography fontWeight={700}>Platform Features</Typography>
              <Stack spacing={1} mt={2}>
                <Typography>Smart Timetable Scheduling</Typography>
                <Typography>Attendance Management</Typography>
                <Typography>Faculty & Resource Management</Typography>
                <Typography>Secure Role-Based Access</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography fontWeight={700}>Contact</Typography>
              <Stack spacing={1} mt={2}>
                <Typography><Email /> support@scts.com</Typography>
                <Typography><Phone /> +91 9708994174</Typography>
                <Typography><LocationOn /> Learning City</Typography>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.2)' }} />

          <Typography textAlign="center" opacity={0.7}>
            © {new Date().getFullYear()} SCTS. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
