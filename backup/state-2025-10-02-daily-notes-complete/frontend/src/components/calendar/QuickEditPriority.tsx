import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
} from '@mui/material';
import { AssignmentTaskDto, Priority } from '../../types/schedule';
import { ModalHeader } from '../common/modal/ModalHeader';
import { ModalFooter } from '../common/modal/ModalFooter';
import { StandardButton } from '../common/modal/StandardButton';

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
    {
      value: 1 as Priority,
      label: 'Low',
      color: 'var(--dp-success-600)',
      bgColor: 'var(--dp-success-50)',
      borderColor: 'var(--dp-success-600)',
      icon: '○'
    },
    {
      value: 2 as Priority,
      label: 'Medium',
      color: 'var(--dp-warning-600)',
      bgColor: 'var(--dp-warning-50)',
      borderColor: 'var(--dp-warning-600)',
      icon: '◐'
    },
    {
      value: 3 as Priority,
      label: 'High',
      color: 'var(--dp-error-600)',
      bgColor: 'var(--dp-error-50)',
      borderColor: 'var(--dp-error-600)',
      icon: '●'
    },
    {
      value: 4 as Priority,
      label: 'Critical',
      color: 'var(--dp-error-700)',
      bgColor: 'var(--dp-error-100)',
      borderColor: 'var(--dp-error-700)',
      icon: '🔥'
    }
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

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--dp-radius-xl)',
          boxShadow: 'var(--dp-shadow-2xl)',
          backgroundColor: 'var(--dp-neutral-0)',
          maxWidth: '480px',
        },
      }}
    >
      <ModalHeader
        title="Change Priority"
        onClose={onClose}
        variant="primary"
      />

      <DialogContent
        sx={{
          backgroundColor: 'var(--dp-neutral-50)',
          padding: 'var(--dp-space-6)',
          minHeight: '320px',
        }}
      >
        {/* Task description */}
        <Typography
          sx={{
            fontFamily: 'var(--dp-font-family-primary)',
            fontSize: 'var(--dp-text-body-medium)',
            fontWeight: 'var(--dp-font-weight-regular)',
            color: 'var(--dp-neutral-600)',
            marginBottom: 'var(--dp-space-5)',
          }}
        >
          {selectedTasks.length === 1
            ? `Updating priority for "${selectedTasks[0].taskTitle}"`
            : `Updating priority for ${selectedTasks.length} selected tasks`
          }
        </Typography>

        {/* Priority options */}
        <RadioGroup
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(Number(e.target.value) as Priority)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--dp-space-3)',
          }}
        >
          {priorityOptions.map((priority) => (
            <Box
              key={priority.value}
              onClick={() => setSelectedPriority(priority.value)}
              sx={{
                padding: 'var(--dp-space-4)',
                border: selectedPriority === priority.value
                  ? `2px solid ${priority.borderColor}`
                  : '2px solid var(--dp-neutral-200)',
                borderRadius: 'var(--dp-radius-lg)',
                cursor: 'pointer',
                backgroundColor: selectedPriority === priority.value
                  ? priority.bgColor
                  : 'var(--dp-neutral-0)',
                transition: 'var(--dp-transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                '&:hover': {
                  borderColor: priority.borderColor,
                  backgroundColor: priority.bgColor,
                  transform: 'translateY(-1px)',
                  boxShadow: 'var(--dp-shadow-sm)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: 'none',
                },
              }}
            >
              <FormControlLabel
                value={priority.value}
                control={
                  <Radio
                    sx={{
                      color: priority.color,
                      '&.Mui-checked': {
                        color: priority.color,
                      },
                      padding: 'var(--dp-space-2)',
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--dp-space-3)' }}>
                    <Typography
                      sx={{
                        fontSize: 'var(--dp-text-title-medium)',
                        color: priority.color,
                      }}
                    >
                      {priority.icon}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-large)',
                        fontWeight: selectedPriority === priority.value
                          ? 'var(--dp-font-weight-semibold)'
                          : 'var(--dp-font-weight-medium)',
                        color: selectedPriority === priority.value
                          ? priority.color
                          : 'var(--dp-neutral-800)',
                      }}
                    >
                      {priority.label}
                    </Typography>
                  </Box>
                }
                sx={{
                  margin: 0,
                  flex: 1,
                  '& .MuiFormControlLabel-label': {
                    flex: 1,
                  },
                }}
              />
              {selectedPriority === priority.value && (
                <Box
                  sx={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: priority.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--dp-neutral-0)',
                    fontSize: 'var(--dp-text-label-small)',
                    fontWeight: 'var(--dp-font-weight-bold)',
                    boxShadow: 'var(--dp-shadow-sm)',
                  }}
                >
                  ✓
                </Box>
              )}
            </Box>
          ))}
        </RadioGroup>
      </DialogContent>

      <ModalFooter
        align="space-between"
        primaryAction={
          <StandardButton
            variant="contained"
            colorScheme="primary"
            onClick={handleSave}
            disabled={selectedPriority === null}
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
            Clear Priority
          </StandardButton>,
          <StandardButton
            key="cancel"
            variant="text"
            colorScheme="secondary"
            onClick={onClose}
          >
            Cancel
          </StandardButton>,
        ]}
      />
    </Dialog>
  );
};

export default QuickEditPriority;
