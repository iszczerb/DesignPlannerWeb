import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, Box, Typography } from '@mui/material';
import { AssignmentTaskDto } from '../../types/schedule';
import { ModalHeader } from '../common/modal/ModalHeader';
import { ModalFooter } from '../common/modal/ModalFooter';
import { StandardButton } from '../common/modal/StandardButton';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';

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
          overflow: 'hidden',
        },
      }}
    >
      {/* Modal Header */}
      <ModalHeader
        title="Change Due Date"
        subtitle={
          selectedTasks.length === 1
            ? `Setting due date for "${selectedTasks[0].taskTitle}"`
            : `Setting due date for ${selectedTasks.length} selected tasks`
        }
        onClose={onClose}
        variant="primary"
        icon={<EventIcon />}
      />

      {/* Modal Content */}
      <DialogContent
        sx={{
          backgroundColor: 'var(--dp-neutral-50)',
          padding: 'var(--dp-space-6)',

          // Global MUI overrides for form fields with design tokens
          '& input[type="date"]': {
            width: '100%',
            padding: 'var(--dp-space-3)',
            border: '2px solid var(--dp-neutral-300)',
            borderRadius: 'var(--dp-radius-md)',
            fontSize: 'var(--dp-text-body-large)',
            fontFamily: 'var(--dp-font-family-primary)',
            color: 'var(--dp-neutral-900)',
            backgroundColor: 'var(--dp-neutral-0)',
            transition: 'var(--dp-transition-fast)',
            outline: 'none',
            boxSizing: 'border-box',

            '&:hover': {
              borderColor: 'var(--dp-primary-400)',
            },

            '&:focus': {
              borderColor: 'var(--dp-primary-600)',
              boxShadow: '0 0 0 3px var(--dp-primary-100)',
            },

            '&:disabled': {
              backgroundColor: 'var(--dp-neutral-100)',
              color: 'var(--dp-neutral-500)',
              cursor: 'not-allowed',
            },

            // Dark mode support
            '@media (prefers-color-scheme: dark)': {
              backgroundColor: 'var(--dp-neutral-800)',
              color: 'var(--dp-neutral-100)',
              borderColor: 'var(--dp-neutral-600)',

              '&:hover': {
                borderColor: 'var(--dp-primary-500)',
              },

              '&:focus': {
                borderColor: 'var(--dp-primary-500)',
                boxShadow: '0 0 0 3px var(--dp-primary-900)',
              },
            },
          },

          // Calendar icon color in date input
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            cursor: 'pointer',
            filter: 'var(--dp-neutral-600)',

            '@media (prefers-color-scheme: dark)': {
              filter: 'invert(0.8)',
            },
          },
        }}
      >
        {/* Due Date Input Section */}
        <Box sx={{ marginBottom: 'var(--dp-space-5)' }}>
          <Typography
            component="label"
            htmlFor="due-date-input"
            sx={{
              display: 'block',
              marginBottom: 'var(--dp-space-2)',
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-label-large)',
              fontWeight: 'var(--dp-font-weight-semibold)',
              color: 'var(--dp-neutral-800)',
              lineHeight: 'var(--dp-line-height-tight)',

              '@media (prefers-color-scheme: dark)': {
                color: 'var(--dp-neutral-200)',
              },
            }}
          >
            Due Date
          </Typography>
          <input
            id="due-date-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Select due date"
          />
        </Box>

        {/* Quick Date Selection Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 'var(--dp-space-3)',
            flexWrap: 'wrap',
          }}
        >
          <StandardButton
            variant="outlined"
            colorScheme="primary"
            size="small"
            onClick={handleToday}
            leftIcon={<CalendarTodayIcon fontSize="small" />}
            sx={{
              flex: '1 1 auto',
              minWidth: '140px',
            }}
          >
            Today
          </StandardButton>
          <StandardButton
            variant="outlined"
            colorScheme="primary"
            size="small"
            onClick={handleNextWeek}
            leftIcon={<EventIcon fontSize="small" />}
            sx={{
              flex: '1 1 auto',
              minWidth: '140px',
            }}
          >
            Next Week
          </StandardButton>
        </Box>
      </DialogContent>

      {/* Modal Footer */}
      <ModalFooter
        primaryAction={
          <StandardButton
            variant="contained"
            colorScheme="primary"
            onClick={handleSave}
            size="medium"
          >
            Apply Changes
          </StandardButton>
        }
        secondaryActions={[
          <StandardButton
            key="clear"
            variant="outlined"
            colorScheme="warning"
            onClick={handleClear}
            size="medium"
          >
            Clear Due Date
          </StandardButton>,
          <StandardButton
            key="cancel"
            variant="outlined"
            colorScheme="neutral"
            onClick={onClose}
            size="medium"
          >
            Cancel
          </StandardButton>,
        ]}
        align="space-between"
      />
    </Dialog>
  );
};

export default QuickEditDueDate;
