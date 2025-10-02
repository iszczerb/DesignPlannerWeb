import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BulkActionType } from '../../../types/database';
import './BulkActions.css';

interface BulkActionsProps {
  selectedCount: number;
  onAction: (action: BulkActionType) => Promise<void>;
  onClose: () => void;
  actions?: Array<{
    type: BulkActionType;
    label: string;
    icon: string;
    variant: 'primary' | 'secondary' | 'danger' | 'success';
    confirmMessage?: string;
  }>;
}

const defaultActions = [
  {
    type: BulkActionType.Activate,
    label: 'Activate',
    icon: '✅',
    variant: 'success' as const,
    confirmMessage: 'Are you sure you want to activate the selected items?'
  },
  {
    type: BulkActionType.Deactivate,
    label: 'Deactivate',
    icon: '❌',
    variant: 'secondary' as const,
    confirmMessage: 'Are you sure you want to deactivate the selected items?'
  },
  {
    type: BulkActionType.Export,
    label: 'Export',
    icon: '📤',
    variant: 'primary' as const
  },
  {
    type: BulkActionType.Delete,
    label: 'Delete',
    icon: '🗑️',
    variant: 'danger' as const,
    confirmMessage: 'Are you sure you want to permanently delete the selected items? This action cannot be undone.'
  }
];

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onAction,
  onClose,
  actions = defaultActions
}) => {
  const [loadingAction, setLoadingAction] = useState<BulkActionType | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<BulkActionType | null>(null);

  const handleAction = async (actionType: BulkActionType) => {
    const action = actions.find(a => a.type === actionType);

    if (action?.confirmMessage) {
      setConfirmingAction(actionType);
      return;
    }

    await executeAction(actionType);
  };

  const executeAction = async (actionType: BulkActionType) => {
    try {
      setLoadingAction(actionType);
      await onAction(actionType);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoadingAction(null);
      setConfirmingAction(null);
    }
  };

  const cancelConfirmation = () => {
    setConfirmingAction(null);
  };

  if (confirmingAction) {
    const action = actions.find(a => a.type === confirmingAction);
    return (
      <motion.div
        className="bulk-actions-container confirmation"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="bulk-actions-content">
          <div className="confirmation-message">
            <span className="confirmation-icon">⚠️</span>
            <div className="confirmation-text">
              <h4>Confirm Action</h4>
              <p>{action?.confirmMessage}</p>
              <p className="selection-count">
                This will affect <strong>{selectedCount}</strong> selected item{selectedCount !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
          <div className="confirmation-actions">
            <button
              className="database-btn database-btn-secondary"
              onClick={cancelConfirmation}
            >
              Cancel
            </button>
            <button
              className={`database-btn database-btn-${action?.variant || 'primary'}`}
              onClick={() => executeAction(confirmingAction)}
              disabled={loadingAction === confirmingAction}
            >
              {loadingAction === confirmingAction ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  {action?.icon} {action?.label}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bulk-actions-container"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="bulk-actions-content">
        <div className="bulk-actions-info">
          <span className="selection-icon">☑️</span>
          <span className="selection-text">
            <strong>{selectedCount}</strong> item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="bulk-actions-buttons">
          {actions.map((action) => (
            <button
              key={action.type}
              className={`bulk-action-btn bulk-action-${action.variant}`}
              onClick={() => handleAction(action.type)}
              disabled={loadingAction !== null}
            >
              {loadingAction === action.type ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </>
              )}
            </button>
          ))}
        </div>

        <button
          className="bulk-actions-close"
          onClick={onClose}
          aria-label="Close bulk actions"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};

export default BulkActions;