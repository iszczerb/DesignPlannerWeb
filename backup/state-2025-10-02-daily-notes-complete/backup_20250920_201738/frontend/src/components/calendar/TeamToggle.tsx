import React from 'react';

export enum TeamViewMode {
  MyTeam = 'my-team',
  AllTeams = 'all-teams'
}

interface TeamToggleProps {
  mode: TeamViewMode;
  onModeChange: (mode: TeamViewMode) => void;
  disabled?: boolean;
}

const TeamToggle: React.FC<TeamToggleProps> = ({
  mode,
  onModeChange,
  disabled = false
}) => {
  const toggleStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '4px',
    gap: '2px',
    opacity: disabled ? 0.6 : 1,
  };

  const getButtonStyle = (buttonMode: TeamViewMode): React.CSSProperties => {
    const isActive = mode === buttonMode;
    
    return {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: isActive ? '#3b82f6' : 'transparent',
      color: isActive ? '#ffffff' : '#374151',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease-in-out',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      outline: 'none',
    };
  };

  const getIconStyle = (): React.CSSProperties => ({
    fontSize: '0.875rem',
    opacity: 0.8,
  });

  return (
    <div style={toggleStyle}>
      <button
        style={getButtonStyle(TeamViewMode.MyTeam)}
        onClick={() => !disabled && onModeChange(TeamViewMode.MyTeam)}
        disabled={disabled}
        title="View and manage your team members - full editing permissions"
        onMouseEnter={(e) => {
          if (!disabled && mode !== TeamViewMode.MyTeam) {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && mode !== TeamViewMode.MyTeam) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <span style={getIconStyle()}>👥</span>
        My Team
      </button>
      
      <button
        style={getButtonStyle(TeamViewMode.AllTeams)}
        onClick={() => !disabled && onModeChange(TeamViewMode.AllTeams)}
        disabled={disabled}
        title="View all teams - read-only mode"
        onMouseEnter={(e) => {
          if (!disabled && mode !== TeamViewMode.AllTeams) {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && mode !== TeamViewMode.AllTeams) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <span style={getIconStyle()}>🏢</span>
        All Teams
      </button>
    </div>
  );
};

export default TeamToggle;