import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

export interface ModalTab {
  /** Unique identifier for the tab */
  key: string;
  /** Tab label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

export interface ModalTabsProps {
  /** Array of tab definitions */
  tabs: ModalTab[];
  /** Currently active tab key */
  activeTab: string;
  /** Callback when tab changes */
  onChange: (tabKey: string) => void;
  /** Variant style */
  variant?: 'standard' | 'fullWidth';
  /** Show border below tabs */
  showBorder?: boolean;
}

/**
 * ModalTabs - Standardized tab component for modals
 *
 * Features:
 * - Consistent styling across all modals
 * - Light/dark mode support
 * - Icon support
 * - Disabled state
 * - Active indicator
 * - Smooth transitions
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useState('profile');
 *
 * <ModalTabs
 *   tabs={[
 *     { key: 'profile', label: 'Profile' },
 *     { key: 'security', label: 'Security' },
 *     { key: 'appearance', label: 'Appearance' },
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 * />
 * ```
 */
export const ModalTabs: React.FC<ModalTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'standard',
  showBorder = true,
}) => {
  // Find active tab index
  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const selectedTab = tabs[newValue];
    if (selectedTab && !selectedTab.disabled) {
      onChange(selectedTab.key);
    }
  };

  return (
    <Box
      sx={{
        borderBottom: showBorder ? '1px solid var(--dp-neutral-200)' : 'none',
        backgroundColor: 'var(--dp-neutral-0)',
      }}
    >
      <Tabs
        value={activeIndex === -1 ? 0 : activeIndex}
        onChange={handleChange}
        variant={variant === 'fullWidth' ? 'fullWidth' : 'standard'}
        sx={{
          minHeight: '48px',
          '& .MuiTabs-indicator': {
            backgroundColor: 'var(--dp-primary-600)',
            height: '3px',
            borderRadius: '3px 3px 0 0',
            transition: 'var(--dp-transition-normal)',
          },
          '& .MuiTabs-flexContainer': {
            gap: variant === 'fullWidth' ? 0 : 'var(--dp-space-2)',
            paddingLeft: 'var(--dp-space-6)',
            paddingRight: 'var(--dp-space-6)',
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
            disabled={tab.disabled}
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
              fontWeight: 'var(--dp-font-weight-medium)',
              textTransform: 'none',
              color: 'var(--dp-neutral-600)',
              minHeight: '48px',
              padding: 'var(--dp-space-3) var(--dp-space-4)',
              transition: 'var(--dp-transition-fast)',
              gap: 'var(--dp-space-2)',

              '&.Mui-selected': {
                color: 'var(--dp-primary-700)',
                fontWeight: 'var(--dp-font-weight-semibold)',
              },

              '&:hover': {
                color: 'var(--dp-primary-600)',
                backgroundColor: 'var(--dp-neutral-50)',
              },

              '&.Mui-disabled': {
                color: 'var(--dp-neutral-400)',
                opacity: 0.5,
              },

              '&:not(:last-child)': {
                marginRight: variant === 'fullWidth' ? 0 : 'var(--dp-space-1)',
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};
