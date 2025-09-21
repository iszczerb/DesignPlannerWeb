import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssignmentTaskDto, Priority } from '../../types/schedule';

interface QuickEditPriorityProps {
  isOpen: boolean;
  selectedTasks: AssignmentTaskDto[];
  onClose: () => void;
  onSave: (priority: Priority | null) => void;
}

const QuickEditPriority: React.FC<QuickEditPriorityProps> = ({
  isOpen,
  selectedTasks,
  onClose,
  onSave
}) => {
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const isInitializedRef = useRef(false);

  const priorityOptions = [
    { value: 1 as Priority, label: 'Low', color: '#10b981', icon: '○' },
    { value: 2 as Priority, label: 'Medium', color: '#f59e0b', icon: '◐' },
    { value: 3 as Priority, label: 'High', color: '#ef4444', icon: '●' },
    { value: 4 as Priority, label: 'Critical', color: '#dc2626', icon: '🔥' }
  ];

  useEffect(() => {
    if (isOpen && selectedTasks.length > 0 && !isInitializedRef.current) {
      // Only pre-select on initial open, not on subsequent changes
      const firstPriority = selectedTasks[0].priority;
      const allSamePriority = selectedTasks.every(task => task.priority === firstPriority);

      if (allSamePriority) {
        setSelectedPriority(firstPriority);
      } else {
        setSelectedPriority(null);
      }
      isInitializedRef.current = true;
    } else if (!isOpen) {
      // Reset when modal closes
      setSelectedPriority(null);
      isInitializedRef.current = false;
    }
  }, [isOpen, selectedTasks]);

  const handleSave = () => {
    onSave(selectedPriority);
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
              Change Priority
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
              ? `Updating priority for "${selectedTasks[0].taskTitle}"`
              : `Updating priority for ${selectedTasks.length} selected tasks`
            }
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {priorityOptions.map(priority => (
                <motion.div
                  key={priority.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPriority(priority.value)}
                  style={{
                    padding: '12px 16px',
                    border: selectedPriority === priority.value ? `2px solid ${priority.color}` : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedPriority === priority.value ?
                      `${priority.color}10` : 'white',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '1.2rem',
                      color: priority.color,
                    }}>
                      {priority.icon}
                    </span>
                    <span style={{
                      fontWeight: selectedPriority === priority.value ? '600' : '500',
                      color: selectedPriority === priority.value ? priority.color : '#374151',
                    }}>
                      {priority.label}
                    </span>
                  </div>
                  {selectedPriority === priority.value && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: priority.color,
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
              Clear Priority
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
                disabled={selectedPriority === null}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedPriority !== null ? '#3b82f6' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: selectedPriority !== null ? 'pointer' : 'not-allowed',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedPriority !== null) e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  if (selectedPriority !== null) e.currentTarget.style.backgroundColor = '#3b82f6';
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

export default QuickEditPriority;