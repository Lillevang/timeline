export interface TimelineItem {
  name: string;
  type: 'bar' | 'point';
  color: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  shape?: string;
}

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
  milestones?: Milestone[];
} 