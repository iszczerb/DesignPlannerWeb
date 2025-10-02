import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface ModalHeaderProps {
  /** Main title of the modal */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Close button click handler */
  onClose?: () => void;
  /** Show/hide close button (default: true) */
  showCloseButton?: boolean;
  /** Optional action buttons to display in header (e.g., Edit button) */
  actions?: React.ReactNode;
  /** Header background variant */
  variant?: 'default' | 'primary' | 'custom';
  /** Custom background color (only used when variant='custom') */
  customBg?: string;
  /** Optional icon to display before title */
  icon?: React.ReactNode;
}

/**
 * ModalHeader - Standardized modal header component
 *
 * Features:
 * - Consistent styling across all modals
 * - Light/dark mode support via design tokens
 * - Optional close button
 * - Optional subtitle
 * - Optional action buttons (e.g., Edit)
 * - Optional icon
 * - Multiple background variants
 *
 * @example
 * ```tsx
 * <ModalHeader
 *   title="Skills Management"
 *   subtitle="Track and manage team member skills"
 *   onClose={handleClose}
 *   actions={<Button>Edit</Button>}
 * />
 * ```
 */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  actions,
  variant = 'default',
  customBg,
  icon,
}) => {
  // Determine background color based on variant
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return 'var(--dp-primary-600)';
      case 'custom':
        return customBg || 'var(--dp-neutral-0)';
      case 'default':
      default:
        return 'var(--dp-neutral-0)';
    }
  };

  // Determine text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return 'var(--dp-neutral-0)'; // White text on primary background
      case 'custom':
        return customBg ? 'var(--dp-neutral-0)' : 'var(--dp-neutral-900)';
      case 'default':
      default:
        return 'var(--dp-neutral-900)';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--dp-space-6) var(--dp-space-6)',
        backgroundColor: getBackgroundColor(),
        borderBottom: '1px solid var(--dp-neutral-200)',
        borderTopLeftRadius: 'var(--dp-radius-xl)',
        borderTopRightRadius: 'var(--dp-radius-xl)',
        minHeight: '72px',
        transition: 'var(--dp-transition-fast)',
      }}
    >
      {/* Left side: Icon + Title + Subtitle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--dp-space-3)',
          flex: 1,
          minWidth: 0, // Allow text truncation
        }}
      >
        {/* Optional Icon */}
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: getTextColor(),
            }}
          >
            {icon}
          </Box>
        )}

        {/* Title and Subtitle */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-title-large)',
              fontWeight: 'var(--dp-font-weight-semibold)',
              lineHeight: 'var(--dp-line-height-tight)',
              color: getTextColor(),
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                fontSize: 'var(--dp-text-body-medium)',
                fontWeight: 'var(--dp-font-weight-regular)',
                lineHeight: 'var(--dp-line-height-normal)',
                color: variant === 'primary' || variant === 'custom'
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'var(--dp-neutral-600)',
                marginTop: 'var(--dp-space-1)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Right side: Actions + Close button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--dp-space-2)',
          marginLeft: 'var(--dp-space-4)',
        }}
      >
        {/* Optional action buttons */}
        {actions && (
          <Box sx={{ display: 'flex', gap: 'var(--dp-space-2)' }}>
            {actions}
          </Box>
        )}

        {/* Close button */}
        {showCloseButton && onClose && (
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close modal"
            sx={{
              color: getTextColor(),
              padding: 'var(--dp-space-2)',
              transition: 'var(--dp-transition-fast)',
              '&:hover': {
                backgroundColor: variant === 'primary' || variant === 'custom'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'var(--dp-neutral-100)',
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};
