import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssignmentTaskDto, Priority, TaskStatus } from '../../types/schedule';
import { TaskType } from '../../types/database';

interface BulkEditModalProps {
  isOpen: boolean;
  selectedTasks: AssignmentTaskDto[];
  onClose: () => void;
  onSave: (updates: BulkEditData) => void;
  taskTypes: TaskType[];
}

export interface BulkEditData {
  taskType?: { id: number; name: string } | null;
  priority?: Priority | null;
  status?: TaskStatus | null;
  dueDate?: string | null; // ISO string or null for clear
  notes?: string | null;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  selectedTasks,
  onClose,
  onSave,
  taskTypes
}) => {
  const [formData, setFormData] = useState<BulkEditData>({});
  const [changesMade, setChangesMade] = useState<Set<string>>(new Set());

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({});
      setChangesMade(new Set());
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof BulkEditData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setChangesMade(prev => new Set(prev).add(field));
  };

  const handleClearField = (field: keyof BulkEditData) => {
    setFormData(prev => ({ ...prev, [field]: null }));
    setChangesMade(prev => new Set(prev).add(field));
  };

  const handleSave = () => {
    // Only send fields that were actually changed
    const updates: BulkEditData = {};
    changesMade.forEach(field => {
      const value = formData[field as keyof BulkEditData];
      (updates as any)[field] = value;
    });

    onSave(updates);
    onClose();
  };

  const priorityOptions = [
    { value: 1, label: 'Low', color: '#10b981' },
    { value: 2, label: 'Medium', color: '#f59e0b' },
    { value: 3, label: 'High', color: '#ef4444' },
    { value: 4, label: 'Critical', color: '#dc2626' }
  ];

  const statusOptions = [
    { value: 1, label: 'Not Started', color: '#6b7280' },
    { value: 2, label: 'In Progress', color: '#3b82f6' },
    { value: 3, label: 'Completed', color: '#10b981' },
    { value: 4, label: 'On Hold', color: '#f59e0b' }
  ];

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
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
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
              Bulk Edit Tasks ({selectedTasks.length} selected)
            </h2>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Task Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Task Type
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={formData.taskType?.id || ''}
                  onChange={(e) => {
                    const selectedType = taskTypes.find(t => t.id === parseInt(e.target.value));
                    handleInputChange('taskType', selectedType ? { id: selectedType.id, name: selectedType.name } : undefined);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select task type...</option>
                  {taskTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Priority
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={formData.priority || ''}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || undefined)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select priority...</option>
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleClearField('priority')}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Status
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={formData.status || ''}
                  onChange={(e) => handleInputChange('status', parseInt(e.target.value) || undefined)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select status...</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleClearField('status')}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Due Date
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleInputChange('dueDate', e.target.value || undefined)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={() => handleClearField('dueDate')}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Notes
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value || undefined)}
                  placeholder="Add notes..."
                  rows={3}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
                <button
                  onClick={() => handleClearField('notes')}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  Clear Notes
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
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
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={changesMade.size === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: changesMade.size > 0 ? '#3b82f6' : '#9ca3af',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: changesMade.size > 0 ? 'pointer' : 'not-allowed',
                color: 'white',
              }}
            >
              Apply Changes ({changesMade.size})
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BulkEditModal;