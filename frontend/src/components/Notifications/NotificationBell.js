import React, { useState, useRef, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (event) => {
    setAnchorEl(event.currentTarget);
    // Force refresh notifications when opening
    await fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.relatedEntity?.entityType === 'timetable') {
      navigate('/timetables');
    } else if (notification.type === 'leave_request') {
      navigate('/availability');
    } else if (notification.type === 'attendance_marked' || notification.type === 'attendance_updated') {
      navigate('/student/attendance');
    }

    handleClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'timetable_generated':
      case 'timetable_approved':
      case 'timetable_published':
      case 'timetable_available':
        return <ScheduleIcon fontSize="small" />;
      case 'leave_request':
      case 'leave_approved':
      case 'leave_rejected':
        return <CheckCircleIcon fontSize="small" />;
      case 'attendance_marked':
      case 'attendance_updated':
        return <CheckCircleIcon fontSize="small" />;
      default:
        return <SchoolIcon fontSize="small" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'timetable_published':
      case 'timetable_available':
        return 'success';
      case 'timetable_generated':
      case 'timetable_approved':
        return 'info';
      case 'leave_approved':
        return 'success';
      case 'leave_rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? (
              <NotificationsIcon />
            ) : (
              <NotificationsNoneIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                sx={{ textTransform: 'none' }}
              >
                Mark all read
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 1 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: 'text.secondary',
              }}
            >
              <NotificationsNoneIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">No notifications</Typography>
              {unreadCount > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                    Note: {unreadCount} unread notification(s) detected but not loading.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={async () => {
                      await fetchNotifications();
                    }}
                  >
                    Refresh Notifications
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
              {unreadNotifications.length > 0 && (
                <>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onDelete={() => deleteNotification(notification._id)}
                      getIcon={getNotificationIcon}
                      getColor={getNotificationColor}
                      isUnread={true}
                    />
                  ))}
                  {readNotifications.length > 0 && <Divider sx={{ my: 1 }} />}
                </>
              )}

              {readNotifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => deleteNotification(notification._id)}
                  getIcon={getNotificationIcon}
                  getColor={getNotificationColor}
                  isUnread={false}
                />
              ))}
              
              {unreadCount > 0 && unreadNotifications.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Some notifications may not be loading. Please refresh the page.
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

const NotificationItem = ({
  notification,
  onClick,
  onDelete,
  getIcon,
  getColor,
  isUnread,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <ListItem
      disablePadding
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        backgroundColor: isUnread ? 'action.selected' : 'transparent',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <ListItemButton onClick={onClick} sx={{ py: 1.5, px: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          <Box
            sx={{
              color: getColor(notification.type) + '.main',
              mr: 1.5,
              mt: 0.5,
            }}
          >
            {getIcon(notification.type)}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 0.5,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={isUnread ? 600 : 400}
                sx={{ flex: 1 }}
              >
                {notification.title}
              </Typography>
              {hovered && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  sx={{ ml: 1, p: 0.5 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {notification.message}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </Typography>
              <Chip
                label={notification.type.replace(/_/g, ' ')}
                size="small"
                color={getColor(notification.type)}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>
          </Box>
        </Box>
      </ListItemButton>
    </ListItem>
  );
};

export default NotificationBell;

