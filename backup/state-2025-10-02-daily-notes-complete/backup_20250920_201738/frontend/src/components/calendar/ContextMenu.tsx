import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Paper, MenuList, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
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
        left: Math.max(10, Math.min(position.x, window.innerWidth - 200)), // Keep on screen
        top: Math.max(10, Math.min(position.y, window.innerHeight - 200)), // Keep on screen
        zIndex: 999999, // Very high z-index
        minWidth: 180,
        py: 1,
        backgroundColor: 'white',
      }}
    >
      <MenuList dense>
        {/* Single View/Edit option */}
        <MenuItem onClick={handleViewEdit}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View/Edit Task" />
        </MenuItem>

        {/* Copy Task */}
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy Task" />
        </MenuItem>

        <Divider />

        {/* Delete Task */}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete Task" />
        </MenuItem>
      </MenuList>
    </Paper>
  );

  // Render using portal to body to avoid clipping issues
  return ReactDOM.createPortal(menuContent, document.body);
};

export default ContextMenu;