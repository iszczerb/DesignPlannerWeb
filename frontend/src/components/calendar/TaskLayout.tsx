import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectTaskCard from './ProjectTaskCard';
import { AssignmentTaskDto } from '../../types/schedule';
import { getTaskLayout } from '../../types/dragDrop';
import { calculateTaskHours } from '../../utils/hoursCalculator';

interface TaskLayoutProps {
  tasks: AssignmentTaskDto[];
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onTaskEdit?: (task: AssignmentTaskDto) => void;
  onTaskDelete?: (assignmentId: number) => void;
  onTaskView?: (task: AssignmentTaskDto) => void;
  onTaskCopy?: (task: AssignmentTaskDto) => void;
  maxTasks?: number;
  isDraggable?: boolean;
  sourceDate?: Date;
  sourceSlot?: number;
  sourceEmployeeId?: number;
}

const TaskLayout: React.FC<TaskLayoutProps> = ({
  tasks,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
  onTaskCopy,
  maxTasks = 4,
  isDraggable = false,
  sourceDate,
  sourceSlot,
  sourceEmployeeId
}) => {
  // Calculate hours for all tasks in this slot
  const tasksWithCalculatedHours = useMemo(() => {
    return calculateTaskHours(tasks);
  }, [tasks]);

  const taskCount = Math.min(tasks.length, maxTasks);
  const tasksToShow = tasksWithCalculatedHours.slice(0, maxTasks);
  const hasMoreTasks = tasks.length > maxTasks;
  const layout = getTaskLayout(taskCount);

  const handleTaskClick = (task: AssignmentTaskDto) => {
    onTaskClick?.(task);
  };


  // Special handling for 3 tasks layout (2 top, 1 bottom)
  const renderThreeTasksLayout = () => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        gap: '4px',
      }}>
        {/* Top row - 2 tasks */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '50%',
          gap: '4px',
        }}>
          <motion.div
            key={`task-${tasksToShow[0].assignmentId}`}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ width: '50%', height: '100%' }}
          >
            <ProjectTaskCard
              task={tasksToShow[0]}
              size={layout.cardSize}
              maxWidth="100%"
              onClick={handleTaskClick}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onView={onTaskView}
              onCopy={onTaskCopy}
              showTooltip={true}
              isDraggable={isDraggable}
              sourceDate={sourceDate}
              sourceSlot={sourceSlot}
              sourceEmployeeId={sourceEmployeeId}
              calculatedHours={tasksToShow[0].calculatedHours}
            />
          </motion.div>
          <motion.div
            key={`task-${tasksToShow[1].assignmentId}`}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ width: '50%', height: '100%' }}
          >
            <ProjectTaskCard
              task={tasksToShow[1]}
              size={layout.cardSize}
              maxWidth="100%"
              onClick={handleTaskClick}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onView={onTaskView}
              onCopy={onTaskCopy}
              showTooltip={true}
              isDraggable={isDraggable}
              sourceDate={sourceDate}
              sourceSlot={sourceSlot}
              sourceEmployeeId={sourceEmployeeId}
              calculatedHours={tasksToShow[1].calculatedHours}
            />
          </motion.div>
        </div>
        
        {/* Bottom row - 1 task */}
        <motion.div
          key={`task-${tasksToShow[2].assignmentId}`}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ width: '100%', height: '50%' }}
        >
          <ProjectTaskCard
            task={tasksToShow[2]}
            size={layout.cardSize}
            maxWidth="100%"
            onClick={handleTaskClick}
            onEdit={onTaskEdit}
            onDelete={onTaskDelete}
            onView={onTaskView}
            onCopy={onTaskCopy}
            showTooltip={true}
            isDraggable={isDraggable}
            sourceDate={sourceDate}
            sourceSlot={sourceSlot}
            sourceEmployeeId={sourceEmployeeId}
            calculatedHours={tasksToShow[2].calculatedHours}
          />
        </motion.div>
      </div>
    );
  };

  const renderRegularLayout = () => {
    return (
      <motion.div
        layout
        style={layout.containerStyle}
      >
        <AnimatePresence mode="popLayout">
          {tasksToShow.map((task, index) => (
            <motion.div
              key={`task-${task.assignmentId}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={layout.cardStyle}
            >
              <ProjectTaskCard
                task={task}
                size={layout.cardSize}
                maxWidth="100%"
                onClick={handleTaskClick}
                onEdit={onTaskEdit}
                onDelete={onTaskDelete}
                onView={onTaskView}
                onCopy={onTaskCopy}
                showTooltip={true}
                isDraggable={isDraggable}
                sourceDate={sourceDate}
                sourceSlot={sourceSlot}
                sourceEmployeeId={sourceEmployeeId}
                calculatedHours={task.calculatedHours}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {taskCount === 3 ? renderThreeTasksLayout() : renderRegularLayout()}
      
      {/* More tasks indicator */}
      {hasMoreTasks && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            padding: '2px 6px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: '500',
            zIndex: 10,
          }}
        >
          +{tasks.length - maxTasks}
        </motion.div>
      )}
    </div>
  );
};

export default TaskLayout;