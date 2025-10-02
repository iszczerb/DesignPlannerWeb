import React from 'react';
import { Box } from '@mui/material';

export interface ModalFooterAction {
  /** Unique identifier for the action */
  key: string;
  /** Button component to render */
  button: React.ReactNode;
}

export interface ModalFooterProps {
  /** Primary action button (e.g., Save, Confirm, Submit) */
  primaryAction?: React.ReactNode;
  /** Secondary actions (e.g., Cancel, Close) */
  secondaryActions?: React.ReactNode[];
  /** Footer alignment */
  align?: 'left' | 'right' | 'space-between' | 'center';
  /** Additional content to show in footer (e.g., timestamp, info) */
  extraContent?: React.ReactNode;
  /** Position of extra content */
  extraContentPosition?: 'left' | 'right';
  /** Show border on top */
  showBorder?: boolean;
}

/**
 * ModalFooter - Standardized modal footer component
 *
 * Features:
 * - Consistent styling across all modals
 * - Light/dark mode support via design tokens
 * - Flexible button arrangement
 * - Support for primary and secondary actions
 * - Optional extra content (timestamps, info, etc.)
 * - Responsive layout
 *
 * @example
 * ```tsx
 * // Simple close button
 * <ModalFooter
 *   primaryAction={<Button onClick={handleClose}>Close</Button>}
 * />
 *
 * // Save/Cancel pattern
 * <ModalFooter
 *   primaryAction={<Button variant="contained" onClick={handleSave}>Save</Button>}
 *   secondaryActions={[<Button onClick={handleCancel}>Cancel</Button>]}
 *   align="right"
 * />
 *
 * // With timestamp
 * <ModalFooter
 *   primaryAction={<Button onClick={handleClose}>Close</Button>}
 *   extraContent={<Typography variant="caption">Last updated: 2025-10-02</Typography>}
 *   extraContentPosition="left"
 * />
 * ```
 */
export const ModalFooter: React.FC<ModalFooterProps> = ({
  primaryAction,
  secondaryActions = [],
  align = 'right',
  extraContent,
  extraContentPosition = 'left',
  showBorder = true,
}) => {
  // Build the button group
  const renderButtons = () => {
    const buttons = [];

    // Add secondary actions first (they appear before primary)
    if (secondaryActions && secondaryActions.length > 0) {
      secondaryActions.forEach((action, index) => (
        <Box key={`secondary-${index}`} sx={{ display: 'inline-flex' }}>
          {action}
        </Box>
      ));
    }

    // Add primary action last (it appears after secondary)
    if (primaryAction) {
      buttons.push(
        <Box key="primary" sx={{ display: 'inline-flex' }}>
          {primaryAction}
        </Box>
      );
    }

    return buttons;
  };

  // Determine flex properties based on alignment
  const getFlexAlignment = () => {
    switch (align) {
      case 'left':
        return 'flex-start';
      case 'center':
        return 'center';
      case 'right':
        return 'flex-end';
      case 'space-between':
        return 'space-between';
      default:
        return 'flex-end';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'space-between' ? 'space-between' : getFlexAlignment(),
        padding: 'var(--dp-space-4) var(--dp-space-6)',
        backgroundColor: 'var(--dp-neutral-0)',
        borderTop: showBorder ? '1px solid var(--dp-neutral-200)' : 'none',
        borderBottomLeftRadius: 'var(--dp-radius-xl)',
        borderBottomRightRadius: 'var(--dp-radius-xl)',
        gap: 'var(--dp-space-3)',
        minHeight: '72px',
        transition: 'var(--dp-transition-fast)',
        flexWrap: 'wrap',

        // Responsive behavior
        '@media (max-width: 600px)': {
          flexDirection: 'column',
          alignItems: 'stretch',
          '& > *': {
            width: '100%',
          },
        },
      }}
    >
      {/* Extra content on left */}
      {extraContent && extraContentPosition === 'left' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flex: align === 'space-between' ? 1 : undefined,
            color: 'var(--dp-neutral-600)',
            fontSize: 'var(--dp-text-body-small)',
          }}
        >
          {extraContent}
        </Box>
      )}

      {/* Button group */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--dp-space-3)',
          flex: align === 'space-between' ? undefined : 1,
          justifyContent: align === 'space-between' ? 'flex-end' : getFlexAlignment(),
          flexWrap: 'wrap',

          // Responsive behavior
          '@media (max-width: 600px)': {
            flexDirection: 'column-reverse',
            width: '100%',
            '& > *': {
              width: '100%',
            },
          },
        }}
      >
        {secondaryActions && secondaryActions.length > 0 && secondaryActions.map((action, index) => (
          <Box key={`secondary-${index}`}>{action}</Box>
        ))}
        {primaryAction && <Box>{primaryAction}</Box>}
      </Box>

      {/* Extra content on right */}
      {extraContent && extraContentPosition === 'right' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--dp-neutral-600)',
            fontSize: 'var(--dp-text-body-small)',
          }}
        >
          {extraContent}
        </Box>
      )}
    </Box>
  );
};
