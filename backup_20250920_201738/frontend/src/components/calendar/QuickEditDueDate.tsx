import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssignmentTaskDto } from '../../types/schedule';

interface QuickEditDueDateProps {
  isOpen: boolean;
  selectedTasks: AssignmentTaskDto[];
  onClose: () => void;
  onSave: (dueDate: string | null) => void;
}

const QuickEditDueDate: React.FC<QuickEditDueDateProps> = ({
  isOpen,
  selectedTasks,
  onClose,
  onSave
}) => {
  const [dueDate, setDueDate] = useState<string>('');
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && selectedTasks.length > 0 && !isInitializedRef.current) {
      // Only pre-fill on initial open, not on subsequent changes
      const firstDueDate = selectedTasks[0].dueDate;
      const allSameDueDate = selectedTasks.every(task => task.dueDate === firstDueDate);

      if (allSameDueDate && firstDueDate) {
        // Convert to YYYY-MM-DD format for input
        const date = new Date(firstDueDate);
        const formattedDate = date.toISOString().split('T')[0];
        setDueDate(formattedDate);
      } else {
        setDueDate('');
      }
      isInitializedRef.current = true;
    } else if (!isOpen) {
      // Reset when modal closes
      setDueDate('');
      isInitializedRef.current = false;
    }
  }, [isOpen, selectedTasks]);

  const handleSave = () => {
    onSave(dueDate || null);
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDueDate(today);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setDueDate(nextWeek.toISOString().split('T')[0]);
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
            width: '400px',
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
              Set Due Date
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
              ? `Setting due date for "${selectedTasks[0].taskTitle}"`
              : `Setting due date for ${selectedTasks.length} selected tasks`
            }
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
            }}>
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToday}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                📅 Today
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNextWeek}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                📆 Next Week
              </motion.button>
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
              Clear Due Date
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
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
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

export default QuickEditDueDate;