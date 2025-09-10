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
    },
    cardStyle: {
      width: '100%',
      height: '100%',
      flex: 1,
    }
  },
  2: {
    cardSize: 'medium',
    containerStyle: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100%',
      gap: '4px',
    },
    cardStyle: {
      width: '50%',
      height: '100%',
      flex: 1,
    }
  },
  3: {
    cardSize: 'small',
    containerStyle: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      gap: '4px',
    },
    cardStyle: {
      width: '50%',
      height: '50%',
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
      gap: '4px',
    },
    cardStyle: {
      width: '100%',
      height: '100%',
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
        gap: '4px',
      },
      cardStyle: {
        // This will be overridden by individual card positioning
        width: '50%',
        height: '50%',
      }
    };
  }

  return TASK_LAYOUTS[taskCount] || TASK_LAYOUTS[1];
};