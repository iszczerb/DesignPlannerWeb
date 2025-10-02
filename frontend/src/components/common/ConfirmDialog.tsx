import React from 'react';
import { Dialog, DialogContent, Box, Typography } from '@mui/material';
import { ModalHeader, ModalFooter, StandardButton } from './modal';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <ErrorIcon />,
          colorScheme: 'error' as const,
          iconColor: 'var(--dp-error-600)',
        };
      case 'info':
        return {
          icon: <InfoIcon />,
          colorScheme: 'primary' as const,
          iconColor: 'var(--dp-info-600)',
        };
      default:
        return {
          icon: <WarningIcon />,
          colorScheme: 'warning' as const,
          iconColor: 'var(--dp-warning-600)',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--dp-neutral-0)',
          borderRadius: 'var(--dp-radius-xl)',
          boxShadow: 'var(--dp-shadow-2xl)',
          maxWidth: '500px',
        },
      }}
    >
      <ModalHeader
        title={title}
        onClose={onCancel}
        variant="primary"
      />

      <DialogContent
        sx={{
          backgroundColor: 'var(--dp-neutral-50)',
          padding: 'var(--dp-space-6)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 'var(--dp-space-4)',
            alignItems: 'flex-start',
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              color: config.iconColor,
              fontSize: 'var(--dp-text-display-small)',
              flexShrink: 0,
              marginTop: 'var(--dp-space-1)',
            }}
          >
            {config.icon}
          </Box>

          {/* Message */}
          <Typography
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
              color: 'var(--dp-neutral-800)',
              lineHeight: 'var(--dp-line-height-relaxed)',
              whiteSpace: 'pre-line',
              flex: 1,
            }}
          >
            {message}
          </Typography>
        </Box>
      </DialogContent>

      <ModalFooter
        primaryAction={
          <StandardButton
            variant="contained"
            colorScheme={config.colorScheme}
            onClick={onConfirm}
          >
            {confirmText}
          </StandardButton>
        }
        secondaryActions={[
          <StandardButton
            key="cancel"
            variant="outlined"
            colorScheme="neutral"
            onClick={onCancel}
          >
            {cancelText}
          </StandardButton>
        ]}
      />
    </Dialog>
  );
};

export default ConfirmDialog;
