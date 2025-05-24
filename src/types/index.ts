export interface BarItem {
  type: 'bar';
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  textAnchor?: 'left' | 'right' | 'top' | 'bottom' | 'center';
  label?: string;
}

export interface PointItem {
  type: 'point';
  name: string;
  date: string;
  shape: 'triangle' | 'triangle-down' | 'circle' | 'square';
  color: string;
  textAnchor?: 'left' | 'right' | 'top' | 'bottom' | 'center';
  label?: string;
}

export type TimelineItem = BarItem | PointItem;

export interface Row {
  name: string;
  items: TimelineItem[];
  hideName?: boolean;
}

export interface Track {
  name: string;
  rows: Row[];
}

export interface Milestone {
  name: string;
  date: string;
  color: string;
}

export interface TimelineData {
  tracks: Track[];
  milestones: Milestone[];
}