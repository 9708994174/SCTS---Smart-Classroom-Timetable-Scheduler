import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  TableChart as TableChartIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  MeetingRoom as MeetingRoomIcon,
  Book as BookIcon,
  Schedule as ScheduleIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
  ContactSupport as SupportIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';

const drawerWidth = 280;

const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const commonItems = [
      { text: 'Help Center', icon: <HelpIcon />, path: '/help' },
      { text: 'Support Tickets', icon: <SupportIcon />, path: '/support' },
    ];

    if (user?.role === 'admin') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
        { text: 'Generate Timetable', icon: <ScheduleIcon />, path: '/generate' },
        { text: 'Timetables', icon: <TableChartIcon />, path: '/timetables' },
        { text: 'Manage Faculty', icon: <PeopleIcon />, path: '/admin/faculty' },
        { text: 'Manage Students', icon: <SchoolIcon />, path: '/admin/students' },
        { text: 'Manage Classrooms', icon: <MeetingRoomIcon />, path: '/admin/classrooms' },
        { text: 'Manage Subjects', icon: <BookIcon />, path: '/admin/subjects' },
        { text: 'Manage Timeslots', icon: <ScheduleIcon />, path: '/admin/timeslots' },
        { text: 'Leave Requests', icon: <CalendarTodayIcon />, path: '/admin/leave-requests' },
        { text: 'Attendance', icon: <CheckCircleIcon />, path: '/admin/attendance' },
        { text: 'Substitute Management', icon: <SwapHorizIcon />, path: '/substitute' },
        { text: 'Support Tickets', icon: <SupportIcon />, path: '/support' },
      ];
    } else if (user?.role === 'faculty') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/faculty' },
        { text: 'My Timetable', icon: <TableChartIcon />, path: '/faculty/timetable' },
        { text: 'Mark Attendance', icon: <CheckCircleIcon />, path: '/faculty/attendance' },
        { text: 'Update Availability', icon: <ScheduleIcon />, path: '/availability' },
        { text: 'Substitute Assignments', icon: <SwapHorizIcon />, path: '/substitute' },
        ...commonItems,
      ];
    } else {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
        { text: 'My Timetable', icon: <TableChartIcon />, path: '/timetables' },
        { text: 'My Attendance', icon: <CheckCircleIcon />, path: '/student/attendance' },
        ...commonItems,
      ];
    }
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: '80px !important',
        }}
      >
        <SchoolIcon sx={{ mr: 2, fontSize: 32 }} />
        <Box>
          <Typography variant="h6" noWrap component="div" fontWeight={700}>
            SCTS
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Smart Classroom Scheduler
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, py: 2 }}>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                minHeight: 48, // Touch-friendly height
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {getMenuItems().find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <NotificationBell />
          <IconButton 
            onClick={handleMenuOpen} 
            sx={{ 
              ml: 1,
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/help'); handleMenuClose(); }}>
              <ListItemIcon>
                <HelpIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Help Center</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/support'); handleMenuClose(); }}>
              <ListItemIcon>
                <SupportIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Support Tickets</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              maxWidth: '85vw',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '56px', sm: '64px' },
          pb: { xs: 3, sm: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;

