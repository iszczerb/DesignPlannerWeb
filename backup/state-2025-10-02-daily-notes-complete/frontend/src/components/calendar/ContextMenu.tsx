import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Paper, MenuList, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { AssignmentTaskDto } from '../../types/schedule';

interface ContextMenuProps {
  task: AssignmentTaskDto;
  x: number;
  y: number;
  onClose: () => void;
  onViewEdit?: (task: AssignmentTaskDto) => void;
  onCopy?: (task: AssignmentTaskDto) => void;
  onDelete?: (assignmentId: number) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  task,
  x,
  y,
  onClose,
  onViewEdit,
  onCopy,
  onDelete,
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

  const handleViewEdit = () => {
    onViewEdit?.(task);
    onClose();
  };

  const handleCopy = () => {
    onCopy?.(task);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete?.(task.assignmentId);
    }
    onClose();
  };

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
        {/* Single View/Edit option */}
        <MenuItem
          onClick={handleViewEdit}
          sx={{
            fontFamily: 'var(--dp-font-family-primary)',
            color: 'var(--dp-neutral-800)',
            '&:hover': {
              backgroundColor: 'var(--dp-neutral-100)',
            },
          }}
        >
          <ListItemIcon>
            <InfoIcon fontSize="small" sx={{ color: 'var(--dp-primary-500)' }} />
          </ListItemIcon>
          <ListItemText
            primary="View/Edit Task"
            primaryTypographyProps={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
            }}
          />
        </MenuItem>

        {/* Copy Task */}
        <MenuItem
          onClick={handleCopy}
          sx={{
            fontFamily: 'var(--dp-font-family-primary)',
            color: 'var(--dp-neutral-800)',
            '&:hover': {
              backgroundColor: 'var(--dp-neutral-100)',
            },
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" sx={{ color: 'var(--dp-neutral-600)' }} />
          </ListItemIcon>
          <ListItemText
            primary="Copy Task"
            primaryTypographyProps={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
            }}
          />
        </MenuItem>

        <Divider sx={{ borderColor: 'var(--dp-neutral-200)', my: 1 }} />

        {/* Delete Task */}
        <MenuItem
          onClick={handleDelete}
          sx={{
            color: 'var(--dp-error-600)',
            fontFamily: 'var(--dp-font-family-primary)',
            '&:hover': {
              backgroundColor: 'var(--dp-error-50)',
            },
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'var(--dp-error-600)' }} />
          </ListItemIcon>
          <ListItemText
            primary="Delete Task"
            primaryTypographyProps={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
            }}
          />
        </MenuItem>
      </MenuList>
    </Paper>
  );

  // Render using portal to body to avoid clipping issues
  return ReactDOM.createPortal(menuContent, document.body);
};

export default ContextMenu;