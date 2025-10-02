import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Paper, MenuList, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import { AssignmentTaskDto, Slot } from '../../types/schedule';

interface SlotContextMenuProps {
  x: number;
  y: number;
  date: Date;
  slot: Slot;
  employeeId: number;
  onClose: () => void;
  onCreateTask?: (date: Date, slot: Slot, employeeId: number) => void;
  onPasteTask?: (date: Date, slot: Slot, employeeId: number) => void;
  hasCopiedTask: boolean;
}

const SlotContextMenu: React.FC<SlotContextMenuProps> = ({
  x,
  y,
  date,
  slot,
  employeeId,
  onClose,
  onCreateTask,
  onPasteTask,
  hasCopiedTask,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > windowWidth) {
        adjustedX = windowWidth - rect.width - 10;
      }

      if (y + rect.height > windowHeight) {
        adjustedY = windowHeight - rect.height - 10;
      }

      setPosition({ x: Math.max(10, adjustedX), y: Math.max(10, adjustedY) });
    }
  }, [x, y]);

  const handleCreateTask = () => {
    onCreateTask?.(date, slot, employeeId);
    onClose();
  };

  const handlePasteTask = () => {
    onPasteTask?.(date, slot, employeeId);
    onClose();
  };

  const slotLabel = slot === Slot.Morning ? 'Morning' : 'Afternoon';

  const menuContent = (
    <Paper
      ref={menuRef}
      elevation={8}
      sx={{
        position: 'fixed',
        left: Math.max(10, Math.min(position.x, window.innerWidth - 200)),
        top: Math.max(10, Math.min(position.y, window.innerHeight - 200)),
        zIndex: 999999,
        minWidth: 180,
        py: 1,
        backgroundColor: 'var(--dp-neutral-0)',
        borderRadius: 'var(--dp-radius-lg)',
        border: '1px solid var(--dp-neutral-200)',
        boxShadow: 'var(--dp-shadow-2xl)',
      }}
    >
      <MenuList dense>
        <MenuItem
          onClick={handleCreateTask}
          sx={{
            fontFamily: 'var(--dp-font-family-primary)',
            color: 'var(--dp-neutral-800)',
            '&:hover': {
              backgroundColor: 'var(--dp-neutral-100)',
            },
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" sx={{ color: 'var(--dp-primary-500)' }} />
          </ListItemIcon>
          <ListItemText
            primary={`Create Task (${slotLabel})`}
            primaryTypographyProps={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
            }}
          />
        </MenuItem>

        {hasCopiedTask && (
          <MenuItem
            onClick={handlePasteTask}
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              color: 'var(--dp-neutral-800)',
              '&:hover': {
                backgroundColor: 'var(--dp-neutral-100)',
              },
            }}
          >
            <ListItemIcon>
              <CallReceivedIcon fontSize="small" sx={{ color: 'var(--dp-neutral-600)' }} />
            </ListItemIcon>
            <ListItemText
              primary="Paste Task Here"
              primaryTypographyProps={{
                fontFamily: 'var(--dp-font-family-primary)',
                fontSize: 'var(--dp-text-body-medium)',
              }}
            />
          </MenuItem>
        )}
      </MenuList>
    </Paper>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};

export default SlotContextMenu;