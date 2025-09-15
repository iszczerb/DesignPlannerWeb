import React, { useEffect, useState } from 'react';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#d1fae5',
          borderColor: '#10b981',
          textColor: '#065f46',
          icon: '✅'
        };
      case 'error':
        return {
          backgroundColor: '#fee2e2',
          borderColor: '#ef4444',
          textColor: '#991b1b',
          icon: '❌'
        };
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#92400e',
          icon: '⚠️'
        };
      case 'info':
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#3b82f6',
          textColor: '#1e40af',
          icon: 'ℹ️'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          borderColor: '#6b7280',
          textColor: '#374151',
          icon: 'ℹ️'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: styles.backgroundColor,
        border: `2px solid ${styles.borderColor}`,
        borderRadius: '8px',
        padding: '16px 20px',
        minWidth: '320px',
        maxWidth: '500px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        color: styles.textColor
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }}>
          {styles.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: '600',
            fontSize: '0.875rem',
            marginBottom: '4px'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '0.8rem',
            lineHeight: '1.4',
            whiteSpace: 'pre-line'
          }}>
            {message}
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: styles.textColor,
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '0',
            opacity: 0.7,
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;