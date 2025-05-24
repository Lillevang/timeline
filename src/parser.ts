import { TimelineData, Track, Row, TimelineItem } from './types';

const parseItem = (line: string): TimelineItem => {
  const parts = line.split(' ');
  const type = parts[0] as 'bar' | 'point';
  const name = parts[1].replace(/^"|"$/g, '');
  
  if (type === 'bar') {
    // Handle "bar "name" from date to date color color" format
    const fromIndex = parts.indexOf('from');
    const toIndex = parts.indexOf('to');
    const colorIndex = parts.indexOf('color');
    
    if (fromIndex === -1 || toIndex === -1 || colorIndex === -1) {
      throw new Error(`Invalid bar format: ${line}`);
    }
    
    const startDate = parts[fromIndex + 1];
    const endDate = parts[toIndex + 1];
    const color = parts[colorIndex + 1];
    
    return {
      name,
      type,
      color,
      startDate,
      endDate
    };
  } else {
    const date = parts[3].replace(/^"|"$/g, '');
    const shape = parts[4];
    const color = parts[2];
    return {
      name,
      type,
      color,
      date,
      shape
    };
  }
};

const parseRow = (lines: string[], startIndex: number): { row: Row; endIndex: number } => {
  const rowLine = lines[startIndex];
  console.log('Parsing row line:', rowLine);
  
  // Match both formats: "row "name" hidden" and "row "name""
  const rowMatch = rowLine.match(/^row\s+"([^"]+)"(?:\s+hidden)?$/);
  if (!rowMatch) {
    throw new Error(`Invalid row definition at line ${startIndex + 1}`);
  }

  // Extract the name and check for hidden flag
  const name = rowMatch[1];
  const isHidden = rowLine.trim().endsWith(' hidden');
  console.log('Row parsing:', { rowLine, name, isHidden, trimmed: rowLine.trim() });

  const row: Row = {
    name,
    items: [],
    hideName: isHidden
  };

  let currentIndex = startIndex + 1;
  while (currentIndex < lines.length) {
    const line = lines[currentIndex].trim();
    if (line === 'end') {
      break;
    }
    if (line.startsWith('bar ') || line.startsWith('point ')) {
      row.items.push(parseItem(line));
    }
    currentIndex++;
  }

  return { row, endIndex: currentIndex + 1 };
};

const parseTrack = (lines: string[], startIndex: number): { track: Track; endIndex: number } => {
  const trackLine = lines[startIndex];
  const trackMatch = trackLine.match(/^track\s+"([^"]+)"$/);
  if (!trackMatch) {
    throw new Error(`Invalid track definition at line ${startIndex + 1}`);
  }

  const track: Track = {
    name: trackMatch[1],
    rows: []
  };

  let currentIndex = startIndex + 1;
  while (currentIndex < lines.length) {
    const line = lines[currentIndex].trim();
    if (line === 'end') {
      break;
    }
    if (line.startsWith('row ')) {
      const { row, endIndex } = parseRow(lines, currentIndex);
      track.rows.push(row);
      currentIndex = endIndex;
    }
    currentIndex++;
  }

  return { track, endIndex: currentIndex + 1 };
};

const parseMilestone = (line: string): { name: string; date: string; color: string } => {
  const parts = line.split(' ');
  const name = parts[1].replace(/^"|"$/g, '');
  const date = parts[2].replace(/^"|"$/g, '');
  const color = parts[3];
  return { name, date, color };
};

export const parseTimeline = (input: string): TimelineData => {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
  const data: TimelineData = {
    tracks: []
  };

  let currentIndex = 0;
  while (currentIndex < lines.length) {
    const line = lines[currentIndex];
    if (line.startsWith('track ')) {
      const { track, endIndex } = parseTrack(lines, currentIndex);
      data.tracks.push(track);
      currentIndex = endIndex;
    } else if (line.startsWith('milestone ')) {
      if (!data.milestones) {
        data.milestones = [];
      }
      data.milestones.push(parseMilestone(line));
      currentIndex++;
    } else {
      currentIndex++;
    }
  }

  return data;
}; 