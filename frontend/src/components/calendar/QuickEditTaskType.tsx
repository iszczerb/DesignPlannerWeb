import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssignmentTaskDto } from '../../types/schedule';
import { TaskType } from '../../types/database';

interface QuickEditTaskTypeProps {
  isOpen: boolean;
  selectedTasks: AssignmentTaskDto[];
  taskTypes: TaskType[];
  onClose: () => void;
  onSave: (taskTypeId: number) => void;
}

const QuickEditTaskType: React.FC<QuickEditTaskTypeProps> = ({
  isOpen,
  selectedTasks,
  taskTypes,
  onClose,
  onSave
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && selectedTasks.length > 0 && !isInitializedRef.current) {
      // Only pre-select on initial open, not on subsequent changes
      const firstTaskType = selectedTasks[0].taskTypeName;
      const allSameType = selectedTasks.every(task => task.taskTypeName === firstTaskType);

      if (allSameType) {
        const taskType = taskTypes.find(type => type.name === firstTaskType);
        setSelectedTypeId(taskType?.id || null);
      } else {
        setSelectedTypeId(null);
      }
      isInitializedRef.current = true;
    } else if (!isOpen) {
      // Reset when modal closes
      setSelectedTypeId(null);
      isInitializedRef.current = false;
    }
  }, [isOpen, selectedTasks, taskTypes]);

  const handleSave = () => {
    if (selectedTypeId) {
      onSave(selectedTypeId);
      onClose();
    }
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
              Change Task Type
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
              ? `Updating task type for "${selectedTasks[0].taskTitle}"`
              : `Updating task type for ${selectedTasks.length} selected tasks`
            }
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {taskTypes.map(taskType => (
                <motion.div
                  key={taskType.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTypeId(taskType.id)}
                  style={{
                    padding: '12px 16px',
                    border: selectedTypeId === taskType.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedTypeId === taskType.id ? '#eff6ff' : 'white',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{
                    fontWeight: selectedTypeId === taskType.id ? '600' : '500',
                    color: selectedTypeId === taskType.id ? '#1d4ed8' : '#374151',
                  }}>
                    {taskType.name}
                  </span>
                  {selectedTypeId === taskType.id && (
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
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
          }}>
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
              disabled={!selectedTypeId}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedTypeId ? '#3b82f6' : '#9ca3af',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: selectedTypeId ? 'pointer' : 'not-allowed',
                color: 'white',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (selectedTypeId) e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                if (selectedTypeId) e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              Apply Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickEditTaskType;