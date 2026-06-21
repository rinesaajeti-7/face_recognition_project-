import { useState, useRef, useEffect } from 'react';
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../contexts/useSocket';
import './NotificationBell.css';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'alert':
        return '🚨';
      case 'report':
        return '📝';
      case 'status':
        return '🔄';
      case 'match':
        return '🎯';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'alert':
        return 'alert';
      case 'report':
        return 'report';
      case 'match':
        return 'match';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Tani';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Tani';
    if (minutes < 60) return `${minutes} min më parë`;
    if (hours < 24) return `${hours} orë më parë`;
    return `${days} ditë më parë`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
        <BellIcon className="icon" />
        {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        {!isConnected && <span className="offline-dot" title="Offline">⚠️</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Njoftimet</h3>
            <div className="dropdown-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead} className="mark-read-btn">
                    <CheckIcon className="icon-small" />
                    <span>Shënoji të lexuara</span>
                  </button>
                  <button onClick={clearNotifications} className="clear-btn">
                    <XMarkIcon className="icon-small" />
                    <span>Pastro</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <BellIcon className="empty-icon" />
                <p>Nuk ka njoftime të reja</p>
                <span>Do të shfaqen këtu njoftimet e reja</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.read ? 'unread' : ''} ${getNotificationColor(notif.type)}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{notif.title}</p>
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">{formatTime(notif.timestamp)}</span>
                  </div>
                  {!notif.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;