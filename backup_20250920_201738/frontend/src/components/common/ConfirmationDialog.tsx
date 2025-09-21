import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'default' | 'danger' | 'warning';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'default'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirmBg: '#dc2626',
          confirmHoverBg: '#b91c1c',
          icon: '⚠️',
          iconColor: '#dc2626'
        };
      case 'warning':
        return {
          confirmBg: '#d97706',
          confirmHoverBg: '#b45309',
          icon: '⚠️',
          iconColor: '#d97706'
        };
      default:
        return {
          confirmBg: '#3b82f6',
          confirmHoverBg: '#2563eb',
          icon: '❓',
          iconColor: '#3b82f6'
        };
    }
  };

  const typeStyles = getTypeStyles();

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
        zIndex: 2000,
        padding: '20px',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '450px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px 24px 16px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '12px',
            }}>
              {typeStyles.icon}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px',
            }}>
              {title}
            </h2>
            <p style={{
              margin: 0,
              fontSize: '0.875rem',
              color: '#6b7280',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
            }}>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div style={{
            padding: '16px 24px 24px 24px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                color: '#374151',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '10px 20px',
                backgroundColor: typeStyles.confirmBg,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
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