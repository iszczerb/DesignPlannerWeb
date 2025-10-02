import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssignmentTaskDto, TaskStatus, STATUS_LABELS } from '../../types/schedule';
import scheduleService from '../../services/scheduleService';

interface QuickEditStatusProps {
  isOpen: boolean;
  selectedTasks: AssignmentTaskDto[];
  onClose: () => void;
  onSave: (status: TaskStatus | null) => void;
}

const QuickEditStatus: React.FC<QuickEditStatusProps> = ({
  isOpen,
  selectedTasks,
  onClose,
  onSave
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const isInitializedRef = useRef(false);

  const statusOptions = [
    { value: 1 as TaskStatus, label: 'Not Started', color: '#6b7280' },
    { value: 2 as TaskStatus, label: 'In Progress', color: '#3b82f6' },
    { value: 3 as TaskStatus, label: 'Completed', color: '#10b981' },
    { value: 4 as TaskStatus, label: 'On Hold', color: '#f59e0b' }
  ];

  useEffect(() => {
    if (isOpen && selectedTasks.length > 0 && !isInitializedRef.current) {
      // Only pre-select on initial open, not on subsequent changes
      const firstStatus = selectedTasks[0].taskStatus;
      const allSameStatus = selectedTasks.every(task => task.taskStatus === firstStatus);

      if (allSameStatus) {
        setSelectedStatus(firstStatus);
      } else {
        setSelectedStatus(null);
      }
      isInitializedRef.current = true;
    } else if (!isOpen) {
      // Reset when modal closes
      setSelectedStatus(null);
      isInitializedRef.current = false;
    }
  }, [isOpen, selectedTasks]);

  const handleSave = () => {
    onSave(selectedStatus);
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

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
        zIndex: 1000,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '380px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
              Change Status
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '20px', color: '#6b7280', fontSize: '0.875rem' }}>
            {selectedTasks.length === 1
              ? `Updating status for "${selectedTasks[0].taskTitle}"`
              : `Updating status for ${selectedTasks.length} selected tasks`
            }
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {statusOptions.map(status => (
                <motion.div
                  key={status.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStatus(status.value)}
                  style={{
                    padding: '12px 16px',
                    border: selectedStatus === status.value ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedStatus === status.value ? '#eff6ff' : 'white',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: status.color,
                    }} />
                    <span style={{
                      fontWeight: selectedStatus === status.value ? '600' : '500',
                      color: selectedStatus === status.value ? '#1d4ed8' : '#374151',
                    }}>
                      {status.label}
                    </span>
                  </div>
                  {selectedStatus === status.value && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                    }}>
                      ✓
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
          }}>
            <button
              onClick={handleClear}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                color: '#6b7280',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              Clear Status
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={selectedStatus === null}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedStatus !== null ? '#3b82f6' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: selectedStatus !== null ? 'pointer' : 'not-allowed',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedStatus !== null) e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  if (selectedStatus !== null) e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickEditStatus;