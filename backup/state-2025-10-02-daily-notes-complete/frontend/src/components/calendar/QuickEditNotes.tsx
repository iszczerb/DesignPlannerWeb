import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, TextField, Typography, Box, Alert } from '@mui/material';
import { AssignmentTaskDto } from '../../types/schedule';
import { ModalHeader, ModalFooter, StandardButton } from '../common/modal';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';

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

  const noteTemplates = [
    'In progress...',
    'Waiting for approval',
    'Need more details',
    'Ready for review'
  ];

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
        title="Edit Notes"
        subtitle={
          selectedTasks.length === 1
            ? `Editing notes for "${selectedTasks[0].taskTitle}"`
            : `Editing notes for ${selectedTasks.length} selected tasks`
        }
        onClose={onClose}
        variant="primary"
      />

      <DialogContent
        sx={{
          backgroundColor: 'var(--dp-neutral-50)',
          padding: 'var(--dp-space-6)',
          // Global MUI overrides
          '& .MuiTypography-root': {
            fontFamily: 'var(--dp-font-family-primary)',
            color: 'var(--dp-neutral-800)',
          },
          '& .MuiOutlinedInput-root': {
            fontFamily: 'var(--dp-font-family-primary)',
            color: 'var(--dp-neutral-800)',
            backgroundColor: 'var(--dp-neutral-0)',
            '& fieldset': {
              borderColor: 'var(--dp-neutral-300)',
            },
            '&:hover fieldset': {
              borderColor: 'var(--dp-primary-500)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'var(--dp-primary-500)',
            },
          },
          '& .MuiInputLabel-root': {
            fontFamily: 'var(--dp-font-family-primary)',
            color: 'var(--dp-neutral-600)',
          },
          '& .MuiAlert-root': {
            fontFamily: 'var(--dp-font-family-primary)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Notes Input */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                color: 'var(--dp-neutral-600)',
                fontSize: 'var(--dp-text-body-small)',
                fontWeight: 'var(--dp-font-weight-medium)',
                marginBottom: 'var(--dp-space-2)',
              }}
            >
              Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes or comments..."
              sx={{
                '& .MuiInputBase-root': {
                  minHeight: '120px',
                  alignItems: 'flex-start',
                  fontFamily: 'var(--dp-font-family-primary)',
                },
                '& .MuiInputBase-input': {
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-body-medium)',
                  color: 'var(--dp-neutral-800)',
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                color: 'var(--dp-neutral-500)',
                fontSize: 'var(--dp-text-body-small)',
                marginTop: 'var(--dp-space-1)',
                display: 'block',
                textAlign: 'right',
              }}
            >
              {notes.length} characters
            </Typography>
          </Box>

          {/* Note Templates */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                color: 'var(--dp-neutral-600)',
                fontSize: 'var(--dp-text-body-small)',
                fontWeight: 'var(--dp-font-weight-medium)',
                marginBottom: 'var(--dp-space-2)',
              }}
            >
              Quick Templates
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 'var(--dp-space-2)',
                flexWrap: 'wrap',
              }}
            >
              {noteTemplates.map((template) => (
                <Box
                  key={template}
                  component="button"
                  onClick={() => setNotes(template)}
                  sx={{
                    padding: 'var(--dp-space-1) var(--dp-space-3)',
                    backgroundColor: 'var(--dp-neutral-0)',
                    border: '1px solid var(--dp-neutral-300)',
                    borderRadius: 'var(--dp-radius-md)',
                    fontSize: 'var(--dp-text-body-small)',
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontWeight: 'var(--dp-font-weight-regular)',
                    color: 'var(--dp-neutral-700)',
                    cursor: 'pointer',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      backgroundColor: 'var(--dp-neutral-100)',
                      borderColor: 'var(--dp-primary-400)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      backgroundColor: 'var(--dp-neutral-200)',
                    },
                  }}
                >
                  {template}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Multi-task Warning */}
          {selectedTasks.length > 1 && (
            <Alert
              severity="warning"
              sx={{
                backgroundColor: 'var(--dp-warning-50)',
                borderColor: 'var(--dp-warning-300)',
                color: 'var(--dp-warning-900)',
                fontFamily: 'var(--dp-font-family-primary)',
                '& .MuiAlert-icon': {
                  color: 'var(--dp-warning-600)',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-body-small)',
                }}
              >
                <strong>Note:</strong> These notes will replace the existing notes for all selected tasks.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <ModalFooter
        primaryAction={
          <StandardButton
            variant="contained"
            colorScheme="primary"
            leftIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Notes
          </StandardButton>
        }
        secondaryActions={[
          <StandardButton
            key="clear"
            variant="outlined"
            colorScheme="warning"
            leftIcon={<DeleteIcon />}
            onClick={handleClear}
          >
            Clear Notes
          </StandardButton>,
          <StandardButton
            key="cancel"
            variant="outlined"
            colorScheme="neutral"
            leftIcon={<CancelIcon />}
            onClick={onClose}
          >
            Cancel
          </StandardButton>
        ]}
      />
    </Dialog>
  );
};

export default QuickEditNotes;
