import { useState, useEffect, useCallback, useRef } from 'react';
import { SocketContext } from './SocketContext';

export const SocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const socketRef = useRef(null);

  const sendMessage = useCallback((type, data) => {
    if (socketRef.current && isConnected && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    }
  }, [isConnected]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Krijo lidhjen WebSocket (pa Socket.IO)
    const wsUrl = `ws://localhost:8000/ws/police`;
    const newSocket = new WebSocket(wsUrl);
    
    socketRef.current = newSocket;

    newSocket.onopen = () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
    };

    newSocket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
      // Tentoni të rilidheni pas 3 sekondash
      setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          const reconnectSocket = new WebSocket(wsUrl);
          socketRef.current = reconnectSocket;
        }
      }, 3000);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        
        if (data.type === 'new_alert') {
          const notification = {
            id: Date.now(),
            type: 'alert',
            title: data.title || '🚨 Alert i Ri',
            message: data.message || 'Një alert i ri është krijuar',
            data: data.data,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false
          };
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setLatestNotification(notification);
          
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.svg'
            });
          }
        }
        
        else if (data.type === 'new_report') {
          const notification = {
            id: Date.now(),
            type: 'report',
            title: '📝 Raport i Ri',
            message: data.message || 'Një raport i ri është dërguar nga qytetarët',
            data: data.data,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false
          };
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setLatestNotification(notification);
        }
        
        else if (data.type === 'status_update') {
          const notification = {
            id: Date.now(),
            type: 'status',
            title: '🔄 Ndryshim Statusi',
            message: data.message || 'Statusi i personit u ndryshua',
            data: data.data,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false
          };
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setLatestNotification(notification);
        }
        
        else if (data.type === 'match_found') {
          const notification = {
            id: Date.now(),
            type: 'match',
            title: '🎯 U gjet një Match!',
            message: data.message || `Një person i ngjashëm u gjet`,
            data: data.data,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false
          };
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setLatestNotification(notification);
        }
        
        else if (data.type === 'history') {
          console.log('📋 Notification history:', data);
          if (data.data && Array.isArray(data.data)) {
            const historyNotifications = data.data.map((notif, idx) => ({
              id: Date.now() - idx,
              type: notif.type || 'info',
              title: notif.title || 'Njoftim',
              message: notif.message || '',
              data: notif.data,
              timestamp: notif.timestamp || new Date().toISOString(),
              read: true
            }));
            setNotifications(prev => [...historyNotifications, ...prev]);
          }
        }
        
        else if (data.type === 'connection') {
          console.log('Connection message:', data.message);
        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const contextValue = {
    notifications,
    unreadCount,
    isConnected,
    latestNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    sendMessage
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};