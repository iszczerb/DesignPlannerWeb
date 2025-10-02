import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

export interface StandardButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  /** Button variant */
  variant?: 'contained' | 'outlined' | 'text' | 'ghost';
  /** Button color scheme */
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Loading state */
  loading?: boolean;
  /** Icon to show on the left */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * StandardButton - Consistent button component across the app
 *
 * Features:
 * - Multiple variants: contained, outlined, text, ghost
 * - Color schemes matching design system
 * - Loading states with spinner
 * - Icon support (left/right)
 * - Light/dark mode support
 * - Consistent sizing and spacing
 * - Hover/active/focus states
 *
 * @example
 * ```tsx
 * // Primary contained button
 * <StandardButton variant="contained" colorScheme="primary">
 *   Save Changes
 * </StandardButton>
 *
 * // Outlined secondary button
 * <StandardButton variant="outlined" colorScheme="secondary">
 *   Cancel
 * </StandardButton>
 *
 * // Loading state
 * <StandardButton variant="contained" loading={isLoading}>
 *   Submit
 * </StandardButton>
 *
 * // With icons
 * <StandardButton leftIcon={<SaveIcon />} colorScheme="success">
 *   Save
 * </StandardButton>
 * ```
 */
export const StandardButton: React.FC<StandardButtonProps> = ({
  variant = 'contained',
  colorScheme = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  fullWidth = false,
  ...props
}) => {
  // Get color values based on color scheme
  const getColorValues = () => {
    switch (colorScheme) {
      case 'primary':
        return {
          main: 'var(--dp-primary-600)',
          hover: 'var(--dp-primary-700)',
          active: 'var(--dp-primary-800)',
          text: 'var(--dp-neutral-0)',
        };
      case 'success':
        return {
          main: 'var(--dp-success-600)',
          hover: 'var(--dp-success-700)',
          active: 'var(--dp-success-700)',
          text: 'var(--dp-neutral-0)',
        };
      case 'warning':
        return {
          main: 'var(--dp-warning-600)',
          hover: 'var(--dp-warning-700)',
          active: 'var(--dp-warning-700)',
          text: 'var(--dp-neutral-0)',
        };
      case 'error':
        return {
          main: 'var(--dp-error-600)',
          hover: 'var(--dp-error-700)',
          active: 'var(--dp-error-700)',
          text: 'var(--dp-neutral-0)',
        };
      case 'neutral':
        return {
          main: 'var(--dp-neutral-100)',
          hover: 'var(--dp-neutral-200)',
          active: 'var(--dp-neutral-300)',
          text: 'var(--dp-neutral-900)',
        };
      case 'secondary':
      default:
        return {
          main: 'var(--dp-neutral-600)',
          hover: 'var(--dp-neutral-700)',
          active: 'var(--dp-neutral-800)',
          text: 'var(--dp-neutral-0)',
        };
    }
  };

  const colors = getColorValues();

  // Get size values
  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return {
          padding: 'var(--dp-space-2) var(--dp-space-4)',
          fontSize: 'var(--dp-text-label-medium)',
          minHeight: '36px',
        };
      case 'large':
        return {
          padding: 'var(--dp-space-4) var(--dp-space-6)',
          fontSize: 'var(--dp-text-label-large)',
          minHeight: '48px',
        };
      case 'medium':
      default:
        return {
          padding: 'var(--dp-space-3) var(--dp-space-5)',
          fontSize: 'var(--dp-text-label-large)',
          minHeight: '44px',
        };
    }
  };

  const sizeValues = getSizeValues();

  // Build sx styles based on variant
  const getVariantStyles = () => {
    const baseStyles = {
      fontFamily: 'var(--dp-font-family-primary)',
      fontWeight: 'var(--dp-font-weight-semibold)',
      fontSize: sizeValues.fontSize,
      padding: sizeValues.padding,
      minHeight: sizeValues.minHeight,
      borderRadius: 'var(--dp-radius-md)',
      textTransform: 'none' as const,
      transition: 'var(--dp-transition-fast)',
      boxShadow: 'none',
      width: fullWidth ? '100%' : 'auto',
      gap: 'var(--dp-space-2)',
    };

    switch (variant) {
      case 'contained':
        return {
          ...baseStyles,
          backgroundColor: colors.main,
          color: colors.text,
          border: 'none',
          boxShadow: 'var(--dp-shadow-sm)',
          '&:hover': {
            backgroundColor: colors.hover,
            boxShadow: 'var(--dp-shadow-md)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            backgroundColor: colors.active,
            transform: 'translateY(0)',
            boxShadow: 'var(--dp-shadow-sm)',
          },
          '&:disabled': {
            backgroundColor: 'var(--dp-neutral-200)',
            color: 'var(--dp-neutral-400)',
            boxShadow: 'none',
            cursor: 'not-allowed',
          },
        };

      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: colors.main,
          border: `2px solid ${colors.main}`,
          '&:hover': {
            backgroundColor: `${colors.main}15`,
            borderColor: colors.hover,
            color: colors.hover,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            backgroundColor: `${colors.main}25`,
            transform: 'translateY(0)',
          },
          '&:disabled': {
            borderColor: 'var(--dp-neutral-300)',
            color: 'var(--dp-neutral-400)',
            backgroundColor: 'transparent',
            cursor: 'not-allowed',
          },
        };

      case 'text':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: colors.main,
          border: 'none',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: 'var(--dp-neutral-100)',
            color: colors.hover,
          },
          '&:active': {
            backgroundColor: 'var(--dp-neutral-200)',
          },
          '&:disabled': {
            color: 'var(--dp-neutral-400)',
            backgroundColor: 'transparent',
            cursor: 'not-allowed',
          },
        };

      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'var(--dp-neutral-700)',
          border: 'none',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: 'var(--dp-neutral-100)',
          },
          '&:active': {
            backgroundColor: 'var(--dp-neutral-200)',
          },
          '&:disabled': {
            color: 'var(--dp-neutral-400)',
            backgroundColor: 'transparent',
            cursor: 'not-allowed',
          },
        };

      default:
        return baseStyles;
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      sx={getVariantStyles()}
    >
      {/* Left icon */}
      {leftIcon && !loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{leftIcon}</span>
      )}

      {/* Loading spinner */}
      {loading && (
        <CircularProgress
          size={16}
          sx={{
            color: variant === 'contained' ? colors.text : colors.main,
          }}
        />
      )}

      {/* Button text */}
      <span>{children}</span>

      {/* Right icon */}
      {rightIcon && !loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{rightIcon}</span>
      )}
    </Button>
  );
};
