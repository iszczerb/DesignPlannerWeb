import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, Box, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { AssignmentTaskDto } from '../../types/schedule';
import { TaskType } from '../../types/database';
import { ModalHeader, ModalFooter, StandardButton } from '../common/modal';

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

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--dp-neutral-0)',
          borderRadius: 'var(--dp-radius-xl)',
          boxShadow: 'var(--dp-shadow-2xl)',
        }
      }}
    >
      <ModalHeader
        title="Change Task Type"
        onClose={onClose}
        variant="primary"
      />

      <DialogContent
        sx={{
          backgroundColor: 'var(--dp-neutral-50)',
          padding: 'var(--dp-space-6)',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            mb: 3,
            fontFamily: 'var(--dp-font-family-primary)',
            color: 'var(--dp-neutral-600)',
          }}
        >
          {selectedTasks.length === 1
            ? `Updating task type for "${selectedTasks[0].taskTitle}"`
            : `Updating task type for ${selectedTasks.length} selected tasks`
          }
        </Typography>

        <RadioGroup
          value={selectedTypeId || ''}
          onChange={(e) => setSelectedTypeId(Number(e.target.value))}
        >
          {taskTypes.map(taskType => (
            <FormControlLabel
              key={taskType.id}
              value={taskType.id}
              control={
                <Radio
                  sx={{
                    color: 'var(--dp-primary-500)',
                    '&.Mui-checked': {
                      color: 'var(--dp-primary-600)',
                    },
                  }}
                />
              }
              label={taskType.name}
              sx={{
                mb: 1,
                padding: 'var(--dp-space-2)',
                borderRadius: 'var(--dp-radius-md)',
                border: '1px solid',
                borderColor: selectedTypeId === taskType.id ? 'var(--dp-primary-500)' : 'var(--dp-neutral-200)',
                backgroundColor: selectedTypeId === taskType.id ? 'var(--dp-primary-50)' : 'var(--dp-neutral-0)',
                transition: 'var(--dp-transition-fast)',
                '&:hover': {
                  borderColor: 'var(--dp-primary-500)',
                  backgroundColor: 'var(--dp-primary-50)',
                },
                '& .MuiTypography-root': {
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontWeight: selectedTypeId === taskType.id ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-regular)',
                  color: selectedTypeId === taskType.id ? 'var(--dp-primary-700)' : 'var(--dp-neutral-800)',
                },
              }}
            />
          ))}
        </RadioGroup>
      </DialogContent>

      <ModalFooter
        primaryAction={
          <StandardButton
            variant="contained"
            colorScheme="primary"
            onClick={handleSave}
            disabled={!selectedTypeId}
          >
            Apply Changes
          </StandardButton>
        }
        secondaryActions={[
          <StandardButton
            key="cancel"
            variant="outlined"
            colorScheme="neutral"
            onClick={onClose}
          >
            Cancel
          </StandardButton>
        ]}
      />
    </Dialog>
  );
};

export default QuickEditTaskType;
