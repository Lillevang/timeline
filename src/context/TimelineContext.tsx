import React, { createContext, useContext } from 'react';
import { TimelineData } from '../types';

const TimelineContext = createContext<TimelineData | null>(null);

export const TimelineProvider: React.FC<{
  children: React.ReactNode;
  value: TimelineData;
}> = ({ children, value }) => {
  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};