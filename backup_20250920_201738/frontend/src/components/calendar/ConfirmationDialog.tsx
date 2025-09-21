import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: '#fef2f2',
          iconColor: '#ef4444',
          icon: '⚠️',
          confirmBg: '#ef4444',
          confirmHoverBg: '#dc2626'
        };
      case 'warning':
        return {
          iconBg: '#fef3c7',
          iconColor: '#f59e0b',
          icon: '⚠️',
          confirmBg: '#f59e0b',
          confirmHoverBg: '#d97706'
        };
      case 'info':
        return {
          iconBg: '#dbeafe',
          iconColor: '#3b82f6',
          icon: 'ℹ️',
          confirmBg: '#3b82f6',
          confirmHoverBg: '#2563eb'
        };
      default:
        return {
          iconBg: '#fef3c7',
          iconColor: '#f59e0b',
          icon: '⚠️',
          confirmBg: '#f59e0b',
          confirmHoverBg: '#d97706'
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: typeStyles.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}>
              {typeStyles.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                lineHeight: '1.4',
              }}>
                {title}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: '1.5',
              }}>
                {message}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
          }}>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 20px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                color: '#374151',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '8px 20px',
                backgroundColor: typeStyles.confirmBg,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = typeStyles.confirmHoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = typeStyles.confirmBg}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationDialog;