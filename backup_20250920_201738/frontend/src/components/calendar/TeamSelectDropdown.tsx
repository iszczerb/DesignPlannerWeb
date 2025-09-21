import React, { useState, useEffect, useRef } from 'react';
import { Team } from '../../types/database';
import { databaseService } from '../../services/databaseService';

export interface TeamSelection {
  type: 'all' | 'specific';
  teamId?: number;
  teamName?: string;
}

interface TeamSelectDropdownProps {
  selectedTeam: TeamSelection;
  onTeamChange: (selection: TeamSelection) => void;
  userRole: string;
  disabled?: boolean;
}

const TeamSelectDropdown: React.FC<TeamSelectDropdownProps> = ({
  selectedTeam,
  onTeamChange,
  userRole,
  disabled = false
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show for Admin users
  if (userRole !== 'Admin') {
    return null;
  }

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await databaseService.getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (selection: TeamSelection) => {
    onTeamChange(selection);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selectedTeam.type === 'all') {
      return 'All Teams';
    }
    return selectedTeam.teamName || 'Select Team';
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    minWidth: '180px',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  };

  const buttonHoverStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e5e7eb',
    borderColor: '#9ca3af',
  };

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    marginTop: '2px',
    maxHeight: '200px',
    overflowY: 'auto',
  };

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: '#374151',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    textAlign: 'left',
  };

  const menuItemHoverStyle: React.CSSProperties = {
    ...menuItemStyle,
    backgroundColor: '#f3f4f6',
  };

  const selectedItemStyle: React.CSSProperties = {
    ...menuItemStyle,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: '600',
  };

  const iconStyle: React.CSSProperties = {
    marginRight: '8px',
    fontSize: '0.875rem',
  };

  return (
    <div style={dropdownStyle} ref={dropdownRef}>
      <button
        style={isOpen ? buttonHoverStyle : buttonStyle}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen) {
            Object.assign(e.currentTarget.style, buttonStyle);
          }
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span style={iconStyle}>
            {selectedTeam.type === 'all' ? '🏢' : '👥'}
          </span>
          {getDisplayText()}
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease-in-out'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div style={dropdownMenuStyle}>
          {loading ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
              Loading teams...
            </div>
          ) : (
            <>
              {/* All Teams Option */}
              <button
                style={selectedTeam.type === 'all' ? selectedItemStyle : menuItemStyle}
                onClick={() => handleTeamSelect({ type: 'all' })}
                onMouseEnter={(e) => {
                  if (selectedTeam.type !== 'all') {
                    Object.assign(e.currentTarget.style, menuItemHoverStyle);
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTeam.type !== 'all') {
                    Object.assign(e.currentTarget.style, menuItemStyle);
                  }
                }}
              >
                <span style={iconStyle}>🏢</span>
                All Teams
                {selectedTeam.type === 'all' && (
                  <span style={{ marginLeft: 'auto', color: '#10b981' }}>✓</span>
                )}
              </button>

              {/* Individual Teams */}
              {teams.map((team) => (
                <button
                  key={team.id}
                  style={
                    selectedTeam.type === 'specific' && selectedTeam.teamId === team.id
                      ? selectedItemStyle
                      : menuItemStyle
                  }
                  onClick={() => handleTeamSelect({
                    type: 'specific',
                    teamId: team.id,
                    teamName: team.name
                  })}
                  onMouseEnter={(e) => {
                    if (!(selectedTeam.type === 'specific' && selectedTeam.teamId === team.id)) {
                      Object.assign(e.currentTarget.style, menuItemHoverStyle);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(selectedTeam.type === 'specific' && selectedTeam.teamId === team.id)) {
                      Object.assign(e.currentTarget.style, menuItemStyle);
                    }
                  }}
                >
                  <span style={iconStyle}>👥</span>
                  {team.name}
                  {selectedTeam.type === 'specific' && selectedTeam.teamId === team.id && (
                    <span style={{ marginLeft: 'auto', color: '#10b981' }}>✓</span>
                  )}
                </button>
              ))}

              {teams.length === 0 && !loading && (
                <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                  No teams available
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamSelectDropdown;