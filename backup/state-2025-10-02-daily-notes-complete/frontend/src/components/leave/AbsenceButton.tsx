import React, { useState, useEffect } from 'react';
import {
  Button,
  Badge,
  Tooltip
} from '@mui/material';
import {
  TimeToLeave as AbsenceIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import { UserRole } from '../../types/auth';
import { leaveService, LeaveRequest } from '../../services/leaveService';
import LeaveRequestModal from './LeaveRequestModal';
import AbsenceManagementModal from './AbsenceManagementModal';

interface AbsenceButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const AbsenceButton: React.FC<AbsenceButtonProps> = ({
  variant = 'text',
  size = 'medium',
  showLabel = true
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [managementModalOpen, setManagementModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isManager = user && (user.role === UserRole.Admin || user.role === UserRole.Manager);

  // Fetch pending requests count for managers
  useEffect(() => {
    if (isManager) {
      fetchPendingRequestsCount();
      // Set up polling every 30 seconds for real-time updates
      const interval = setInterval(fetchPendingRequestsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isManager]);

  const fetchPendingRequestsCount = async () => {
    try {
      const pendingRequests = await leaveService.getPendingLeaveRequests();
      setPendingRequestsCount(pendingRequests.length);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
      // Don't set count to 0 on error to avoid confusion
    }
  };

  const handleButtonClick = () => {
    if (isManager) {
      setManagementModalOpen(true);
    } else {
      setLeaveModalOpen(true);
    }
  };

  const handleLeaveRequestSubmitted = () => {
    // Refresh pending count if manager (in case they can see their own requests)
    if (isManager) {
      fetchPendingRequestsCount();
    }
  };

  const handleLeaveRequestProcessed = () => {
    // Refresh pending count when a manager processes a request
    fetchPendingRequestsCount();
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      startIcon={
        isManager && pendingRequestsCount > 0 ? (
          <Badge badgeContent={pendingRequestsCount} color="error" max={99}>
            <AbsenceIcon />
          </Badge>
        ) : (
          <AbsenceIcon />
        )
      }
      onClick={handleButtonClick}
      disabled={loading}
      sx={{
        color: isManager && pendingRequestsCount > 0 ? 'error.main' : 'inherit',
        '&:hover': {
          backgroundColor: isManager && pendingRequestsCount > 0 
            ? 'error.light' 
            : 'action.hover',
        }
      }}
    >
      {showLabel && (isManager ? 'Absence Management' : 'Request Leave')}
    </Button>
  );

  return (
    <>
      {isManager && pendingRequestsCount > 0 ? (
        <Tooltip title={`${pendingRequestsCount} pending leave request${pendingRequestsCount !== 1 ? 's' : ''}`}>
          {buttonContent}
        </Tooltip>
      ) : (
        buttonContent
      )}

      {/* Leave Request Modal for Team Members */}
      <LeaveRequestModal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onRequestSubmitted={handleLeaveRequestSubmitted}
      />

      {/* Absence Management Modal for Managers */}
      {isManager && (
        <AbsenceManagementModal
          open={managementModalOpen}
          onClose={() => setManagementModalOpen(false)}
          onRequestProcessed={handleLeaveRequestProcessed}
        />
      )}
    </>
  );
};

export default AbsenceButton;