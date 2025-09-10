# DesignPlanner Web - Material Design 3 UI System Specification

## Table of Contents
1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Elevation & Surfaces](#elevation--surfaces)
6. [Components](#components)
7. [Animation System](#animation-system)
8. [Responsive Grid](#responsive-grid)
9. [Drag & Drop System](#drag--drop-system)
10. [Accessibility](#accessibility)
11. [Implementation Guidelines](#implementation-guidelines)

---

## Design Principles

### 1. Material Design 3 (Material You) Foundation
- **Dynamic Color**: Adaptive color system based on user preferences and client branding
- **Expressive Typography**: Clear hierarchy with improved readability
- **Elevated Interactions**: Smooth, physics-based animations that feel responsive
- **Personal & Adaptive**: Tailored experience for architecture professionals

### 2. Architecture Firm Aesthetic
- **Professional**: Clean, organized, suitable for client-facing presentations
- **Functional**: Information-dense but well-organized
- **Trustworthy**: Consistent, reliable visual language
- **Efficient**: Quick to scan and understand at a glance

### 3. Interaction Philosophy
- **Satisfying**: Micro-interactions that provide clear feedback
- **Predictable**: Consistent behaviors across all components
- **Responsive**: Immediate visual response to user actions
- **Forgiving**: Easy to undo mistakes, clear error states

---

## Color System

### Primary Palette (Architecture-focused)
```scss
// Primary - Professional Blue (inspired by architectural blueprints)
$md-sys-color-primary: #1565C0;        // Deep blue
$md-sys-color-on-primary: #FFFFFF;
$md-sys-color-primary-container: #E3F2FD;
$md-sys-color-on-primary-container: #0D47A1;

// Secondary - Warm Gray (concrete/steel inspiration)
$md-sys-color-secondary: #546E7A;
$md-sys-color-on-secondary: #FFFFFF;
$md-sys-color-secondary-container: #ECEFF1;
$md-sys-color-on-secondary-container: #263238;

// Tertiary - Accent Orange (construction/safety color)
$md-sys-color-tertiary: #FB8C00;
$md-sys-color-on-tertiary: #FFFFFF;
$md-sys-color-tertiary-container: #FFF3E0;
$md-sys-color-on-tertiary-container: #E65100;
```

### Neutral Palette
```scss
// Surface colors
$md-sys-color-surface-dim: #DDD7CF;
$md-sys-color-surface: #FBF8F6;
$md-sys-color-surface-bright: #FBF8F6;

$md-sys-color-surface-container-lowest: #FFFFFF;
$md-sys-color-surface-container-low: #F5F1F0;
$md-sys-color-surface-container: #EFE9E6;
$md-sys-color-surface-container-high: #E9E4E1;
$md-sys-color-surface-container-highest: #E4DEDB;

// Text colors
$md-sys-color-on-surface: #1C1B1F;
$md-sys-color-on-surface-variant: #49454F;
$md-sys-color-outline: #79747E;
$md-sys-color-outline-variant: #CAC4D0;
```

### Semantic Colors
```scss
// Status Colors (Task Management)
$status-not-started: #616161;
$status-in-progress: #1976D2;
$status-on-hold: #FF8F00;
$status-completed: #388E3C;
$status-blocked: #D32F2F;

// Priority Colors
$priority-low: #4CAF50;
$priority-medium: #FF9800;
$priority-high: #F44336;
$priority-critical: #000000;

// Leave Types
$leave-annual: #00695C;
$leave-sick: #C62828;
$leave-training: #5E35B1;
$leave-bank-holiday: #37474F;
```

### Client Brand Integration
```scss
// Dynamic client colors (examples)
$client-colors: (
  'techcorp': #2196F3,
  'greenspace': #4CAF50,
  'urbandesign': #FF9800,
  'modernhomes': #9C27B0,
  'cityscape': #F44336
);
```

---

## Typography

### Font Family
```scss
// Primary font - Google Fonts Roboto
$md-sys-typescale-font-family-name: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

// Monospace for dates/times/IDs
$font-family-mono: 'Roboto Mono', 'Consolas', monospace;
```

### Type Scale (Material Design 3)
```scss
// Display styles (Large headings, hero text)
$md-sys-typescale-display-large-font-size: 57px;
$md-sys-typescale-display-large-line-height: 64px;
$md-sys-typescale-display-large-font-weight: 400;

$md-sys-typescale-display-medium-font-size: 45px;
$md-sys-typescale-display-medium-line-height: 52px;
$md-sys-typescale-display-medium-font-weight: 400;

$md-sys-typescale-display-small-font-size: 36px;
$md-sys-typescale-display-small-line-height: 44px;
$md-sys-typescale-display-small-font-weight: 400;

// Headline styles (Page titles, section headers)
$md-sys-typescale-headline-large-font-size: 32px;
$md-sys-typescale-headline-large-line-height: 40px;
$md-sys-typescale-headline-large-font-weight: 400;

$md-sys-typescale-headline-medium-font-size: 28px;
$md-sys-typescale-headline-medium-line-height: 36px;
$md-sys-typescale-headline-medium-font-weight: 400;

$md-sys-typescale-headline-small-font-size: 24px;
$md-sys-typescale-headline-small-line-height: 32px;
$md-sys-typescale-headline-small-font-weight: 400;

// Title styles (Card titles, dialog titles)
$md-sys-typescale-title-large-font-size: 22px;
$md-sys-typescale-title-large-line-height: 28px;
$md-sys-typescale-title-large-font-weight: 500;

$md-sys-typescale-title-medium-font-size: 16px;
$md-sys-typescale-title-medium-line-height: 24px;
$md-sys-typescale-title-medium-font-weight: 500;

$md-sys-typescale-title-small-font-size: 14px;
$md-sys-typescale-title-small-line-height: 20px;
$md-sys-typescale-title-small-font-weight: 500;

// Label styles (Buttons, tabs, labels)
$md-sys-typescale-label-large-font-size: 14px;
$md-sys-typescale-label-large-line-height: 20px;
$md-sys-typescale-label-large-font-weight: 500;

$md-sys-typescale-label-medium-font-size: 12px;
$md-sys-typescale-label-medium-line-height: 16px;
$md-sys-typescale-label-medium-font-weight: 500;

$md-sys-typescale-label-small-font-size: 11px;
$md-sys-typescale-label-small-line-height: 16px;
$md-sys-typescale-label-small-font-weight: 500;

// Body styles (Paragraph text, descriptions)
$md-sys-typescale-body-large-font-size: 16px;
$md-sys-typescale-body-large-line-height: 24px;
$md-sys-typescale-body-large-font-weight: 400;

$md-sys-typescale-body-medium-font-size: 14px;
$md-sys-typescale-body-medium-line-height: 20px;
$md-sys-typescale-body-medium-font-weight: 400;

$md-sys-typescale-body-small-font-size: 12px;
$md-sys-typescale-body-small-line-height: 16px;
$md-sys-typescale-body-small-font-weight: 400;
```

---

## Spacing & Layout

### Spacing Scale (8px base unit)
```scss
$spacing-0: 0px;
$spacing-1: 4px;     // 0.25 * 16px
$spacing-2: 8px;     // 0.5 * 16px (base unit)
$spacing-3: 12px;    // 0.75 * 16px
$spacing-4: 16px;    // 1 * 16px
$spacing-5: 20px;    // 1.25 * 16px
$spacing-6: 24px;    // 1.5 * 16px
$spacing-8: 32px;    // 2 * 16px
$spacing-10: 40px;   // 2.5 * 16px
$spacing-12: 48px;   // 3 * 16px
$spacing-16: 64px;   // 4 * 16px
$spacing-20: 80px;   // 5 * 16px
$spacing-24: 96px;   // 6 * 16px
```

### Container Sizes
```scss
// Calendar grid containers
$container-calendar-max-width: 1400px;
$container-sidebar-width: 280px;
$container-header-height: 64px;

// Task card constraints
$task-card-min-height: 56px;
$task-card-max-height: 120px;
$task-slot-height: 120px;
$task-slot-max-tasks: 4;
```

### Border Radius Scale
```scss
$radius-none: 0px;
$radius-xs: 4px;     // Small elements
$radius-sm: 8px;     // Cards, buttons
$radius-md: 12px;    // Larger cards
$radius-lg: 16px;    // Modals, containers
$radius-xl: 20px;    // Large surfaces
$radius-full: 9999px; // Pills, avatars
```

---

## Elevation & Surfaces

### Material Design 3 Elevation System
```scss
// Elevation tokens (box-shadow)
$md-elevation-0: none;
$md-elevation-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
$md-elevation-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
$md-elevation-3: 0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15);
$md-elevation-4: 0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15);
$md-elevation-5: 0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15);
```

### Surface Hierarchy
```scss
// Component elevation mapping
$elevation-map: (
  'task-card-rest': $md-elevation-1,
  'task-card-hover': $md-elevation-2,
  'task-card-dragging': $md-elevation-4,
  'slot-surface': $md-elevation-0,
  'modal-surface': $md-elevation-3,
  'dropdown-menu': $md-elevation-2,
  'floating-action-button': $md-elevation-3,
  'app-bar': $md-elevation-0,
  'navigation-drawer': $md-elevation-1
);
```

---

## Components

### Task Cards

#### Design Specifications
- **Auto-resizing**: Dynamic height based on slot occupancy (1-4 tasks)
- **Color System**: Client brand color with intelligent contrast
- **Information Hierarchy**: Project name → Task type → Client → Icons
- **Interactive States**: Rest, Hover, Pressed, Dragging, Selected

#### Sizing Logic
```scss
.task-card {
  // Dynamic height calculation
  height: calc((#{$task-slot-height} - #{$spacing-4}) / min(var(--task-count), #{$task-slot-max-tasks}));
  min-height: $task-card-min-height;
  max-height: $task-card-max-height;
  
  // Base styling
  padding: $spacing-3 $spacing-4;
  border-radius: $radius-sm;
  background: var(--task-bg-color);
  box-shadow: map-get($elevation-map, 'task-card-rest');
  
  // Smooth transitions for all properties
  transition: all 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

#### States & Interactions
```scss
.task-card {
  // Hover state
  &:hover {
    box-shadow: map-get($elevation-map, 'task-card-hover');
    transform: translateY(-1px);
    cursor: grab;
  }
  
  // Dragging state
  &.dragging {
    box-shadow: map-get($elevation-map, 'task-card-dragging');
    opacity: 0.8;
    transform: rotate(2deg) scale(1.02);
    cursor: grabbing;
    z-index: 1000;
  }
  
  // Selected state
  &.selected {
    outline: 2px solid $md-sys-color-primary;
    outline-offset: 2px;
  }
  
  // Overdue state
  &.overdue {
    border-left: 4px solid $priority-high;
  }
}
```

### Time Slots

#### Design Specifications
- **Fixed Size**: Consistent height regardless of content
- **Flexible Content**: Accommodates 1-4 tasks with auto-resizing
- **Clear Boundaries**: Visual separation between AM/PM slots
- **Drop Targets**: Clear visual feedback during drag operations

```scss
.time-slot {
  height: $task-slot-height;
  min-height: $task-slot-height;
  padding: $spacing-2;
  border-radius: $radius-md;
  background: $md-sys-color-surface-container-low;
  border: 1px solid $md-sys-color-outline-variant;
  
  // Flex container for auto-resizing tasks
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
  
  // Drop target states
  &.drag-over {
    background: $md-sys-color-primary-container;
    border-color: $md-sys-color-primary;
    animation: pulse 1s ease-in-out infinite;
  }
  
  &.drop-valid {
    border-color: $status-completed;
    background: rgba($status-completed, 0.1);
  }
  
  &.drop-invalid {
    border-color: $status-blocked;
    background: rgba($status-blocked, 0.1);
  }
}
```

### Calendar Grid

#### Layout Structure
```scss
.calendar-grid {
  display: grid;
  gap: $spacing-2;
  width: 100%;
  max-width: $container-calendar-max-width;
  margin: 0 auto;
  
  // Dynamic columns based on view type
  grid-template-columns: 
    200px // Employee names column
    repeat(var(--day-count), minmax(120px, 1fr)); // Day columns
  
  // Header + employees rows
  grid-template-rows: auto repeat(var(--employee-count), auto);
}
```

### Navigation & Controls

#### View Switcher
```scss
.view-switcher {
  display: flex;
  background: $md-sys-color-surface-container;
  border-radius: $radius-lg;
  padding: $spacing-1;
  gap: $spacing-1;
  
  .view-option {
    padding: $spacing-2 $spacing-4;
    border-radius: $radius-md;
    background: transparent;
    color: $md-sys-color-on-surface-variant;
    font-weight: $md-sys-typescale-label-large-font-weight;
    font-size: $md-sys-typescale-label-large-font-size;
    transition: all 200ms ease;
    
    &.active {
      background: $md-sys-color-surface-container-highest;
      color: $md-sys-color-on-surface;
      box-shadow: $md-elevation-1;
    }
    
    &:hover:not(.active) {
      background: $md-sys-color-surface-container-high;
    }
  }
}
```

---

## Animation System

### Core Animation Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Performant**: GPU-accelerated transforms and opacity changes
3. **Consistent**: Standard easing curves and durations
4. **Satisfying**: Spring physics for natural movement

### Timing Functions
```scss
// Material Design 3 easing curves
$easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
$easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
$easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
$easing-sharp: cubic-bezier(0.4, 0.0, 0.6, 1);

// Spring physics (for Framer Motion)
$spring-gentle: { type: "spring", stiffness: 120, damping: 20 };
$spring-bouncy: { type: "spring", stiffness: 400, damping: 25 };
$spring-snappy: { type: "spring", stiffness: 500, damping: 30 };
```

### Duration Scale
```scss
$duration-instant: 0ms;
$duration-fast: 150ms;     // Micro-interactions
$duration-normal: 300ms;   // Standard transitions
$duration-slow: 450ms;     // Complex animations
$duration-slower: 600ms;   // Page transitions
```

### Drag & Drop Animations

#### Task Card Dragging
```javascript
// Framer Motion variants for task cards
export const taskCardVariants = {
  rest: {
    scale: 1,
    rotate: 0,
    boxShadow: "0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: "0px 2px 6px 2px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
  
  dragging: {
    scale: 1.05,
    rotate: 2,
    boxShadow: "0px 4px 12px 4px rgba(0, 0, 0, 0.25)",
    zIndex: 1000,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  },
  
  drop: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 35
    }
  }
};
```

#### Slot Reorganization
```javascript
// Auto-layout animation when tasks are added/removed
export const slotLayoutAnimation = {
  layout: true,
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};
```

### Page Transitions
```scss
// Route change animations
.page-transition-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-transition-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity $duration-normal $easing-standard,
              transform $duration-normal $easing-standard;
}

.page-transition-exit {
  opacity: 1;
  transform: translateY(0);
}

.page-transition-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity $duration-fast $easing-accelerate,
              transform $duration-fast $easing-accelerate;
}
```

---

## Responsive Grid

### Breakpoint System
```scss
$breakpoints: (
  'xs': 0px,
  'sm': 600px,
  'md': 900px,
  'lg': 1200px,
  'xl': 1536px
);

// Media query mixins
@mixin mobile-only {
  @media (max-width: #{map-get($breakpoints, 'sm') - 1}) {
    @content;
  }
}

@mixin tablet-up {
  @media (min-width: #{map-get($breakpoints, 'md')}) {
    @content;
  }
}

@mixin desktop-up {
  @media (min-width: #{map-get($breakpoints, 'lg')}) {
    @content;
  }
}
```

### Responsive Calendar Views

#### Desktop (1200px+)
```scss
.calendar-grid {
  @include desktop-up {
    grid-template-columns: 200px repeat(var(--day-count), minmax(150px, 1fr));
    gap: $spacing-3;
  }
}
```

#### Tablet (900px - 1199px)
```scss
.calendar-grid {
  @include tablet-up {
    grid-template-columns: 150px repeat(var(--day-count), minmax(120px, 1fr));
    gap: $spacing-2;
    
    .employee-name {
      font-size: $md-sys-typescale-body-small-font-size;
    }
    
    .task-card {
      padding: $spacing-2 $spacing-3;
      
      .project-name {
        font-size: $md-sys-typescale-title-small-font-size;
      }
    }
  }
}
```

#### Mobile (< 900px)
```scss
.calendar-grid {
  @include mobile-only {
    // Switch to single-employee stacked view
    grid-template-columns: 1fr;
    gap: $spacing-4;
    
    .employee-section {
      border: 1px solid $md-sys-color-outline-variant;
      border-radius: $radius-md;
      padding: $spacing-4;
      
      .employee-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-3;
        
        .employee-name {
          font-size: $md-sys-typescale-title-medium-font-size;
          font-weight: $md-sys-typescale-title-medium-font-weight;
        }
      }
      
      .days-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: $spacing-3;
      }
    }
  }
}
```

### Mobile-Optimized Task Cards
```scss
@include mobile-only {
  .task-card {
    padding: $spacing-3;
    min-height: 64px;
    
    .project-name {
      font-size: $md-sys-typescale-title-medium-font-size;
      line-height: $md-sys-typescale-title-medium-line-height;
    }
    
    .client-name {
      font-size: $md-sys-typescale-body-medium-font-size;
      margin-top: $spacing-2;
    }
    
    .task-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-1;
    }
  }
}
```

---

## Drag & Drop System

### Visual Feedback States

#### Drag Source (Task being dragged)
```scss
.task-card.dragging {
  opacity: 0.8;
  transform: rotate(2deg) scale(1.05);
  box-shadow: $md-elevation-4;
  cursor: grabbing;
  z-index: 1000;
  
  // Disable pointer events on content during drag
  * {
    pointer-events: none;
  }
}
```

#### Drop Targets (Time slots)
```scss
.time-slot {
  // Valid drop target
  &.drag-over-valid {
    background: rgba($status-completed, 0.1);
    border: 2px solid $status-completed;
    animation: drop-target-pulse 1s ease-in-out infinite;
  }
  
  // Invalid drop target
  &.drag-over-invalid {
    background: rgba($status-blocked, 0.1);
    border: 2px solid $status-blocked;
    cursor: not-allowed;
  }
  
  // Drop preview (ghost task)
  .task-preview {
    opacity: 0.5;
    border: 2px dashed $md-sys-color-outline;
    background: transparent;
    animation: preview-pulse 2s ease-in-out infinite;
  }
}

// Animation keyframes
@keyframes drop-target-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes preview-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
```

### Drag Handle & Cursors
```scss
.task-card {
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
  
  // Drag handle (when not using full card as handle)
  .drag-handle {
    cursor: grab;
    padding: $spacing-1;
    opacity: 0.6;
    transition: opacity 200ms ease;
    
    &:hover {
      opacity: 1;
    }
  }
}
```

### Spring Physics Animation
```javascript
// React DnD with Framer Motion integration
export const dragTransition = {
  type: "spring",
  stiffness: 600,
  damping: 35,
  mass: 1
};

export const dropAnimation = {
  scale: [1.05, 0.95, 1],
  transition: {
    duration: 0.4,
    times: [0, 0.6, 1],
    ease: "easeOut"
  }
};
```

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio for borders/states

#### Focus Management
```scss
// Focus indicators
.focusable {
  &:focus-visible {
    outline: 2px solid $md-sys-color-primary;
    outline-offset: 2px;
    border-radius: $radius-xs;
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .task-card {
    border: 2px solid $md-sys-color-outline;
  }
  
  .time-slot {
    border: 2px solid $md-sys-color-outline;
  }
}
```

#### Reduced Motion Support
```scss
// Respect user's motion preferences
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .task-card.dragging {
    transform: none;
  }
}
```

#### Keyboard Navigation
- **Tab order**: Logical flow through calendar
- **Arrow keys**: Navigate between time slots
- **Enter/Space**: Activate drag mode
- **Escape**: Cancel drag operation

#### Screen Reader Support
```html
<!-- Task card accessibility -->
<div class="task-card" 
     role="button"
     tabindex="0"
     aria-label="Task: Project Design for TechCorp, Due tomorrow"
     aria-describedby="task-details-123">
  
  <div id="task-details-123" class="sr-only">
    Project: TechCorp Office Design
    Status: In Progress
    Assigned to: John Smith
    Time slot: Monday 9:00 AM
  </div>
</div>

<!-- Time slot accessibility -->
<div class="time-slot"
     role="region"
     aria-label="Monday 9:00 AM slot for John Smith"
     tabindex="0"
     aria-dropeffect="move">
</div>
```

---

## Implementation Guidelines

### CSS Custom Properties Strategy
```scss
// Component-level theming
.task-card {
  --task-bg-color: #{$md-sys-color-surface-container-low};
  --task-text-color: #{$md-sys-color-on-surface};
  --task-border-color: #{$md-sys-color-outline-variant};
  
  // Client brand color override
  &[data-client-color] {
    --task-bg-color: var(--client-color-light);
    --task-border-color: var(--client-color-dark);
  }
}
```

### Component Architecture
```typescript
// Task Card component structure
interface TaskCardProps {
  task: Task;
  clientColor: string;
  slotOccupancy: number;
  isDragging: boolean;
  isSelected: boolean;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
}

// Responsive hook for grid calculations
const useResponsiveGrid = () => {
  const [breakpoint, setBreakpoint] = useState('lg');
  const [gridColumns, setGridColumns] = useState(7);
  
  useEffect(() => {
    // Calculate optimal columns based on viewport
  }, []);
  
  return { breakpoint, gridColumns };
};
```

### Performance Considerations

#### Optimized Animations
- Use `transform` and `opacity` for smooth 60fps animations
- Leverage `will-change` property for dragging elements
- Implement virtual scrolling for large employee lists

#### Memory Management
```scss
// Enable hardware acceleration for dragging elements
.task-card.dragging {
  will-change: transform, opacity;
}

// Clean up after animation
.task-card {
  &:not(.dragging) {
    will-change: auto;
  }
}
```

### Progressive Enhancement
1. **Base experience**: Static calendar with basic functionality
2. **Enhanced**: Drag & drop with JavaScript enabled
3. **Premium**: Smooth animations with modern browser support

---

## Testing & Validation

### Visual Regression Testing
- Component storybook with all states
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Device testing (iOS/Android)

### Accessibility Testing
- Screen reader testing (NVDA, VoiceOver, JAWS)
- Keyboard navigation testing
- Color contrast validation
- Motion sensitivity testing

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Animation frame rate**: Consistent 60fps
- **Bundle size**: Material components < 150kb gzipped

---

## Conclusion

This Material Design 3 UI system specification provides a comprehensive foundation for building a professional, accessible, and satisfying task scheduling application for architecture firms. The system emphasizes:

1. **Professional Aesthetic**: Clean, organized design suitable for client presentations
2. **Satisfying Interactions**: Spring physics animations and smooth transitions
3. **Accessibility**: WCAG 2.1 AA compliance with comprehensive keyboard and screen reader support
4. **Responsiveness**: Adaptive layouts that work across all device sizes
5. **Performance**: GPU-accelerated animations and optimized component architecture

The implementation should prioritize user experience, with particular attention to the drag-and-drop interactions that form the core of the application's functionality.

---

*Last Updated: September 2025*
*Version: 1.0.0*