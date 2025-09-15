import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssignmentTaskDto } from '../../types/schedule';

interface QuickEditNotesProps {
  isOpen: boolean;
  selectedTasks: AssignmentTaskDto[];
  onClose: () => void;
  onSave: (notes: string | null) => void;
}

const QuickEditNotes: React.FC<QuickEditNotesProps> = ({
  isOpen,
  selectedTasks,
  onClose,
  onSave
}) => {
  const [notes, setNotes] = useState<string>('');
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && selectedTasks.length > 0 && !isInitializedRef.current) {
      // Only pre-fill on initial open, not on subsequent changes
      const firstNotes = selectedTasks[0].notes || '';
      const allSameNotes = selectedTasks.every(task => (task.notes || '') === firstNotes);

      if (allSameNotes) {
        setNotes(firstNotes);
      } else {
        setNotes('');
      }
      isInitializedRef.current = true;
    } else if (!isOpen) {
      // Reset when modal closes
      setNotes('');
      isInitializedRef.current = false;
    }
  }, [isOpen, selectedTasks]);

  const handleSave = () => {
    onSave(notes.trim() || null);
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
            width: '500px',
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
              Edit Notes
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
              ? `Editing notes for "${selectedTasks[0].taskTitle}"`
              : `Editing notes for ${selectedTasks.length} selected tasks`
            }
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
            }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes or comments..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '100px',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '4px',
              textAlign: 'right',
            }}>
              {notes.length} characters
            </div>
          </div>

          {selectedTasks.length > 1 && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: '#92400e',
            }}>
              <strong>Note:</strong> These notes will replace the existing notes for all selected tasks.
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            {['In progress...', 'Waiting for approval', 'Need more details', 'Ready for review'].map((template) => (
              <motion.button
                key={template}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setNotes(template)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                {template}
              </motion.button>
            ))}
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
              Clear Notes
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

export default QuickEditNotes;