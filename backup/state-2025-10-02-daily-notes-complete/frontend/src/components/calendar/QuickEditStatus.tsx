import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, Typography, RadioGroup, FormControlLabel, Radio, Box, Chip } from '@mui/material';
import { AssignmentTaskDto, TaskStatus } from '../../types/schedule';
import { ModalHeader, ModalFooter, StandardButton } from '../common/modal';

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
    { value: 1 as TaskStatus, label: 'Not Started', color: 'var(--dp-neutral-600)' },
    { value: 2 as TaskStatus, label: 'In Progress', color: 'var(--dp-primary-600)' },
    { value: 3 as TaskStatus, label: 'Completed', color: 'var(--dp-success-600)' },
    { value: 4 as TaskStatus, label: 'On Hold', color: 'var(--dp-warning-600)' }
  ];

  useEffect(() => {
    if (isOpen && selectedTasks.length > 0 && !isInitializedRef.current) {
      const firstStatus = selectedTasks[0].taskStatus;
      const allSameStatus = selectedTasks.every(task => task.taskStatus === firstStatus);

      if (allSameStatus) {
        setSelectedStatus(firstStatus);
      } else {
        setSelectedStatus(null);
      }
      isInitializedRef.current = true;
    } else if (!isOpen) {
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
        title="Change Status"
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
            ? `Updating status for "${selectedTasks[0].taskTitle}"`
            : `Updating status for ${selectedTasks.length} selected tasks`
          }
        </Typography>

        <RadioGroup
          value={selectedStatus || ''}
          onChange={(e) => setSelectedStatus(Number(e.target.value) as TaskStatus)}
        >
          {statusOptions.map(option => (
            <FormControlLabel
              key={option.value}
              value={option.value}
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
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{option.label}</span>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: option.color,
                    }}
                  />
                </Box>
              }
              sx={{
                mb: 1,
                padding: 'var(--dp-space-2)',
                borderRadius: 'var(--dp-radius-md)',
                border: '1px solid',
                borderColor: selectedStatus === option.value ? 'var(--dp-primary-500)' : 'var(--dp-neutral-200)',
                backgroundColor: selectedStatus === option.value ? 'var(--dp-primary-50)' : 'var(--dp-neutral-0)',
                transition: 'var(--dp-transition-fast)',
                '&:hover': {
                  borderColor: 'var(--dp-primary-500)',
                  backgroundColor: 'var(--dp-primary-50)',
                },
                '& .MuiTypography-root': {
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontWeight: selectedStatus === option.value ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-regular)',
                  color: selectedStatus === option.value ? 'var(--dp-primary-700)' : 'var(--dp-neutral-800)',
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
          >
            Apply Changes
          </StandardButton>
        }
        secondaryActions={[
          <StandardButton
            key="clear"
            variant="outlined"
            colorScheme="neutral"
            onClick={handleClear}
          >
            Clear Status
          </StandardButton>,
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

export default QuickEditStatus;
