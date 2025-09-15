import { AssignmentTaskDto, Slot } from './schedule';

// Drag and Drop types
export interface DragItem {
  type: string;
  task: AssignmentTaskDto;
  sourceSlot: {
    date: Date;
    slot: Slot;
    employeeId: number;
  };
}

export interface DropResult {
  targetSlot: {
    date: Date;
    slot: Slot;
    employeeId: number;
  };
  dropEffect?: string;
}

export interface TaskDropData {
  task: AssignmentTaskDto;
  sourceDate: Date;
  sourceSlot: Slot;
  sourceEmployeeId: number;
  targetDate: Date;
  targetSlot: Slot;
  targetEmployeeId: number;
}

// DnD constants
export const ItemTypes = {
  TASK: 'task',
} as const;

// Task layout configurations based on number of tasks
export interface TaskLayoutConfig {
  cardSize: 'small' | 'medium' | 'large';
  containerStyle: React.CSSProperties;
  cardStyle: React.CSSProperties;
}

export const TASK_LAYOUTS: Record<number, TaskLayoutConfig> = {
  1: {
    cardSize: 'large',
    containerStyle: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      maxHeight: '72px', // Fixed height constraint
    },
    cardStyle: {
      width: '100%',
      height: '100%',
      flex: 1,
      minHeight: '56px', // Ensure minimum size for single task
    }
  },
  2: {
    cardSize: 'medium',
    containerStyle: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100%',
      maxHeight: '72px',
      gap: '3px',
    },
    cardStyle: {
      width: '50%',
      height: '100%',
      flex: 1,
      minHeight: '36px',
    }
  },
  3: {
    cardSize: 'small',
    containerStyle: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      maxHeight: '72px',
      gap: '3px',
    },
    cardStyle: {
      width: '100%',
      height: '50%',
      minHeight: '22px',
    }
  },
  4: {
    cardSize: 'small',
    containerStyle: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      width: '100%',
      height: '100%',
      maxHeight: '72px',
      gap: '3px',
    },
    cardStyle: {
      width: '100%',
      height: '100%',
      minHeight: '30px',
    }
  }
};

// Special layout for 3 tasks (2 on top, 1 on bottom)
export const getTaskLayout = (taskCount: number): TaskLayoutConfig => {
  if (taskCount <= 0) {
    return TASK_LAYOUTS[1]; // Default
  }
  
  if (taskCount >= 4) {
    return TASK_LAYOUTS[4];
  }

  if (taskCount === 3) {
    return {
      cardSize: 'small',
      containerStyle: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        maxHeight: '72px',
        gap: '3px',
      },
      cardStyle: {
        // This will be overridden by individual card positioning
        width: '100%',
        height: '50%',
        minHeight: '22px',
      }
    };
  }

  return TASK_LAYOUTS[taskCount] || TASK_LAYOUTS[1];
};