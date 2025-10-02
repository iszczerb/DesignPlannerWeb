import React, { createContext, useContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DragDropContextType {
  // Add any context-specific methods if needed
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: React.ReactNode;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ children }) => {
  const contextValue: DragDropContextType = {
    // Add context methods if needed
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <DragDropContext.Provider value={contextValue}>
        {children}
      </DragDropContext.Provider>
    </DndProvider>
  );
};