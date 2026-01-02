import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/notification', {
        params: { limit: 50 }
      });
      const fetchedNotifications = response.data.data || [];
      const fetchedUnreadCount = response.data.unreadCount || 0;
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedUnreadCount);
      
      // If unreadCount doesn't match, log for debugging
      const actualUnreadCount = fetchedNotifications.filter(n => !n.isRead).length;
      if (fetchedUnreadCount !== actualUnreadCount) {
        console.warn(`Unread count mismatch: API says ${fetchedUnreadCount}, but array has ${actualUnreadCount} unread notifications`);
        // Use the actual count from the array as fallback
        setUnreadCount(actualUnreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // On error, try to at least get the unread count
      try {
        const countResponse = await axios.get('/api/notification/unread-count');
        setUnreadCount(countResponse.data.count || 0);
      } catch (countError) {
        console.error('Error fetching unread count:', countError);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count only (lighter request)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await axios.get('/api/notification/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.put(`/api/notification/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.put('/api/notification/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await axios.delete(`/api/notification/${notificationId}`);
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Start polling for real-time updates
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Set up polling every 30 seconds for unread count
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    setPollingInterval(interval);

    // Full refresh every 2 minutes
    const fullRefreshInterval = setInterval(() => {
      fetchNotifications();
    }, 120000);

    return () => {
      clearInterval(interval);
      clearInterval(fullRefreshInterval);
    };
  }, [user, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};


