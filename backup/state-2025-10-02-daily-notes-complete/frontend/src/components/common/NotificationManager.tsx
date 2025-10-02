import React, { useState } from 'react';
import NotificationToast, { NotificationProps } from './NotificationToast';

interface Notification extends Omit<NotificationProps, 'onClose'> {
  id: string;
}

interface NotificationManagerProps {
  children: (showNotification: (notification: Omit<Notification, 'id'>) => void) => React.ReactNode;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {children(showNotification)}
      <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999 }}>
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{
              marginBottom: '12px',
              transform: `translateY(${index * 80}px)`
            }}
          >
            <NotificationToast
              {...notification}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default NotificationManager;