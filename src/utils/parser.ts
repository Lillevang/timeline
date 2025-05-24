import { TimelineData, Track, Row, TimelineItem, BarItem, PointItem, Milestone } from '../types';

function generateRecurringDates(startDate: string, endDate: string, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    
    switch (frequency) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return dates;
}

export function parseTimelineDSL(dsl: string): TimelineData {
  const lines = dsl.split('\n');
  const timelineData: TimelineData = {
    tracks: [],
    milestones: []
  };

  let currentTrack: Track | null = null;
  let currentRow: Row | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue; // Skip empty lines
    
    // Handle track
    if (line.startsWith('track')) {
      const nameMatch = line.match(/track\s+"([^"]+)"/);
      if (nameMatch) {
        currentTrack = {
          name: nameMatch[1],
          rows: []
        };
        timelineData.tracks.push(currentTrack);
        currentRow = null;
      }
    }
    // Handle row
    else if (line.startsWith('row') && currentTrack) {
      const nameMatch = line.match(/row\s+"([^"]+)"(?:\s+hidden)?/);
      if (nameMatch) {
        const row: Row = {
          name: nameMatch[1],
          items: [],
          hideName: line.trim().endsWith(' hidden')
        };
        currentTrack.rows.push(row);
        currentRow = row;
      }
    }
    // Handle bar
    else if (line.startsWith('bar') && currentRow) {
      const barMatch = line.match(/bar\s+"([^"]+)"\s+from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\s+color\s+(\w+)(?:\s+text\s+(left|right|top|bottom|center))?(?:\s+label\s+"([^"]+)")?/);
      if (barMatch) {
        const barItem: BarItem = {
          type: 'bar',
          name: barMatch[1],
          startDate: barMatch[2],
          endDate: barMatch[3],
          color: barMatch[4],
          textAnchor: barMatch[5] as 'left' | 'right' | 'top' | 'bottom' | 'center' || 'center',
          label: barMatch[6]
        };
        currentRow.items.push(barItem);
      }
    }
    // Handle point
    else if (line.startsWith('point') && currentRow) {
      const pointMatch = line.match(/point\s+"([^"]+)"\s+at\s+(\d{4}-\d{2}-\d{2})(?:\s+shape\s+(triangle|triangle-down|circle|square))?\s+color\s+(\w+)(?:\s+text\s+(left|right|top|bottom|center))?(?:\s+label\s+"([^"]+)")?/);
      if (pointMatch) {
        const pointItem: PointItem = {
          type: 'point',
          name: pointMatch[1],
          date: pointMatch[2],
          shape: (pointMatch[3] || 'triangle') as 'triangle' | 'triangle-down' | 'circle' | 'square',
          color: pointMatch[4],
          textAnchor: pointMatch[5] as 'left' | 'right' | 'top' | 'bottom' | 'center' || 'center',
          label: pointMatch[6]
        };
        currentRow.items.push(pointItem);
      }
    }
    // Handle recurring point
    else if (line.startsWith('recurring point') && currentRow) {
      const recurringMatch = line.match(/recurring point\s+"([^"]+)"\s+(daily|weekly|monthly|yearly)\s+from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})(?:\s+shape\s+(\w+))?\s+color\s+(\w+)/);
      if (recurringMatch) {
        const dates = generateRecurringDates(
          recurringMatch[3],
          recurringMatch[4],
          recurringMatch[2] as 'daily' | 'weekly' | 'monthly' | 'yearly'
        );

        dates.forEach(date => {
          const pointItem: PointItem = {
            type: 'point',
            name: recurringMatch[1],
            date: date,
            shape: (recurringMatch[5] || 'triangle') as 'triangle' | 'circle' | 'square',
            color: recurringMatch[6]
          };
          currentRow!.items.push(pointItem);
        });
      }
    }
    // Handle milestone
    else if (line.startsWith('milestone')) {
      const milestoneMatch = line.match(/milestone\s+"([^"]+)"\s+at\s+(\d{4}-\d{2}-\d{2})(?:\s+color\s+(\w+))?/);
      if (milestoneMatch) {
        const milestone: Milestone = {
          name: milestoneMatch[1],
          date: milestoneMatch[2],
          color: milestoneMatch[3] || 'blue'
        };
        timelineData.milestones.push(milestone);
      }
    }
  }

  return timelineData;
}