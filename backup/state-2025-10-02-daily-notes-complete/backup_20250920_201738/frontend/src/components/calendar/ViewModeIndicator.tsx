import React from 'react';
import { TeamViewMode } from './TeamToggle';

interface ViewModeIndicatorProps {
  mode: TeamViewMode;
  teamName?: string;
  isVisible?: boolean;
}

const ViewModeIndicator: React.FC<ViewModeIndicatorProps> = ({
  mode,
  teamName,
  isVisible = true
}) => {
  if (!isVisible) return null;

  const getIndicatorStyle = (): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '500',
    border: '1px solid',
    backgroundColor: mode === TeamViewMode.MyTeam ? '#dbeafe' : '#fef3c7',
    borderColor: mode === TeamViewMode.MyTeam ? '#93c5fd' : '#fcd34d',
    color: mode === TeamViewMode.MyTeam ? '#1e40af' : '#92400e',
  });

  const getIconStyle = (): React.CSSProperties => ({
    fontSize: '0.875rem',
  });

  const getStatusText = () => {
    if (mode === TeamViewMode.MyTeam) {
      return teamName ? `Managing: ${teamName}` : 'My Team - Full Access';
    }
    return 'Global View - Read Only';
  };

  const getIcon = () => {
    return mode === TeamViewMode.MyTeam ? '✏️' : '👁️';
  };

  return (
    <div style={getIndicatorStyle()}>
      <span style={getIconStyle()}>{getIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  );
};

export default ViewModeIndicator;