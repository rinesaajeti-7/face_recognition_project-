import { useContext } from 'react';
import { SocketContext } from './SocketContext';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn('useSocket must be used within a SocketProvider');
    return {
      notifications: [],
      unreadCount: 0,
      isConnected: false,
      latestNotification: null,
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotifications: () => {},
      removeNotification: () => {},
      sendMessage: () => {}
    };
  }
  return context;
};