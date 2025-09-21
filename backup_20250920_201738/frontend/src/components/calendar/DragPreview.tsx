import React from 'react';
import { useDragLayer } from 'react-dnd';
import { motion } from 'framer-motion';
import ProjectTaskCard from './ProjectTaskCard';
import { ItemTypes, DragItem } from '../../types/dragDrop';

const DragPreview: React.FC = () => {
  const { isDragging, item, currentOffset } = useDragLayer<{
    isDragging: boolean;
    item: DragItem | null;
    currentOffset: { x: number; y: number } | null;
  }>((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !item || !currentOffset || item.type !== ItemTypes.TASK) {
    return null;
  }

  const transform = `translate(${currentOffset.x}px, ${currentOffset.y}px)`;

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1000,
        left: 0,
        top: 0,
        transform,
      }}
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1.05, rotate: 5 }}
        style={{
          width: '200px',
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
          opacity: 0.9,
        }}
      >
        <ProjectTaskCard
          task={item.task}
          size="medium"
          maxWidth="200px"
          showTooltip={false}
          isDraggable={false}
        />
      </motion.div>
    </div>
  );
};

export default DragPreview;