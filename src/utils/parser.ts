import { TimelineData, Track, Row, BarItem, PointItem, Milestone } from '../types/index';
import { PALETTE, isHexColor } from '../theme';

export interface ParseError {
  line: number; // 1-indexed
  message: string;
}

export interface ParseResult {
  data: TimelineData;
  errors: ParseError[];
}

export const KNOWN_COLORS = Object.keys(PALETTE);
const COLOR_SET = new Set(KNOWN_COLORS);
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const DATE = '(\\d{4}-\\d{2}-\\d{2})';
const COLOR = '(#?\\w+)';
// Every statement may end with trailing whitespace or a trailing # comment
const EOL = '\\s*(?:#.*)?$';

const PATTERNS = {
  window: new RegExp(`^window\\s+from\\s+${DATE}\\s+to\\s+${DATE}${EOL}`),
  track: new RegExp(`^track\\s+"([^"]+)"${EOL}`),
  row: new RegExp(`^row\\s+"([^"]+)"(\\s+hidden)?${EOL}`),
  bar: new RegExp(`^bar\\s+"([^"]+)"\\s+from\\s+${DATE}\\s+to\\s+${DATE}\\s+color\\s+${COLOR}(?:\\s+text\\s+(left|right|top|bottom|center))?(?:\\s+label\\s+"([^"]+)")?${EOL}`),
  point: new RegExp(`^point\\s+"([^"]+)"\\s+at\\s+${DATE}(?:\\s+shape\\s+(triangle|triangle-down|circle|square))?\\s+color\\s+${COLOR}(?:\\s+text\\s+(left|right|top|bottom|center))?(?:\\s+label\\s+"([^"]+)")?${EOL}`),
  recurring: new RegExp(`^recurring point\\s+"([^"]+)"\\s+(daily|weekly|monthly|yearly)\\s+from\\s+${DATE}\\s+to\\s+${DATE}(?:\\s+shape\\s+(triangle|triangle-down|circle|square))?\\s+color\\s+${COLOR}${EOL}`),
  milestone: new RegExp(`^milestone\\s+"([^"]+)"\\s+at\\s+${DATE}(?:\\s+color\\s+${COLOR})?${EOL}`),
};

const SYNTAX_HINTS: Record<keyof typeof PATTERNS, string> = {
  window: 'window from YYYY-MM-DD to YYYY-MM-DD',
  track: 'track "name"',
  row: 'row "name" [hidden]',
  bar: 'bar "name" from YYYY-MM-DD to YYYY-MM-DD color <color> [text left|right|top|bottom|center] [label "text"]',
  point: 'point "name" at YYYY-MM-DD [shape triangle|triangle-down|circle|square] color <color> [text ...] [label "text"]',
  recurring: 'recurring point "name" daily|weekly|monthly|yearly from YYYY-MM-DD to YYYY-MM-DD [shape ...] color <color>',
  milestone: 'milestone "name" at YYYY-MM-DD [color <color>]',
};

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

export function parseTimelineDSL(dsl: string): ParseResult {
  const lines = dsl.split('\n');
  const data: TimelineData = {
    tracks: [],
    milestones: []
  };
  const errors: ParseError[] = [];

  let currentTrack: Track | null = null;
  let currentRow: Row | null = null;

  const syntaxError = (line: number, keyword: keyof typeof PATTERNS) => {
    errors.push({ line, message: `Invalid ${keyword === 'recurring' ? 'recurring point' : keyword} syntax. Expected: ${SYNTAX_HINTS[keyword]}` });
  };

  const checkColor = (line: number, color: string | undefined) => {
    if (!color) return;
    if (isHexColor(color)) {
      if (!HEX_COLOR.test(color)) {
        errors.push({ line, message: `Invalid hex color "${color}". Expected #rgb or #rrggbb` });
      }
    } else if (!COLOR_SET.has(color)) {
      errors.push({ line, message: `Unknown color "${color}". Available colors: ${KNOWN_COLORS.join(', ')}, or a hex value like #12b886` });
    }
  };

  const checkDateOrder = (line: number, start: string, end: string) => {
    if (new Date(end) < new Date(start)) {
      errors.push({ line, message: `End date ${end} is before start date ${start}` });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNo = i + 1;

    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('window')) {
      const match = line.match(PATTERNS.window);
      if (!match) { syntaxError(lineNo, 'window'); continue; }
      checkDateOrder(lineNo, match[1], match[2]);
      data.window = { start: match[1], end: match[2] };
    }
    else if (line.startsWith('track')) {
      const match = line.match(PATTERNS.track);
      if (!match) { syntaxError(lineNo, 'track'); continue; }
      currentTrack = { name: match[1], rows: [] };
      data.tracks.push(currentTrack);
      currentRow = null;
    }
    else if (line.startsWith('row')) {
      if (!currentTrack) {
        errors.push({ line: lineNo, message: 'A row must appear inside a track' });
        continue;
      }
      const match = line.match(PATTERNS.row);
      if (!match) { syntaxError(lineNo, 'row'); continue; }
      const row: Row = {
        name: match[1],
        items: [],
        hideName: Boolean(match[2])
      };
      currentTrack.rows.push(row);
      currentRow = row;
    }
    else if (line.startsWith('recurring point')) {
      if (!currentRow) {
        errors.push({ line: lineNo, message: 'A recurring point must appear inside a row' });
        continue;
      }
      const match = line.match(PATTERNS.recurring);
      if (!match) { syntaxError(lineNo, 'recurring'); continue; }
      checkDateOrder(lineNo, match[3], match[4]);
      checkColor(lineNo, match[6]);
      const dates = generateRecurringDates(match[3], match[4], match[2] as 'daily' | 'weekly' | 'monthly' | 'yearly');
      for (const date of dates) {
        const pointItem: PointItem = {
          type: 'point',
          name: match[1],
          date,
          shape: (match[5] || 'triangle') as PointItem['shape'],
          color: match[6]
        };
        currentRow.items.push(pointItem);
      }
    }
    else if (line.startsWith('bar')) {
      if (!currentRow) {
        errors.push({ line: lineNo, message: 'A bar must appear inside a row' });
        continue;
      }
      const match = line.match(PATTERNS.bar);
      if (!match) { syntaxError(lineNo, 'bar'); continue; }
      checkDateOrder(lineNo, match[2], match[3]);
      checkColor(lineNo, match[4]);
      const barItem: BarItem = {
        type: 'bar',
        name: match[1],
        startDate: match[2],
        endDate: match[3],
        color: match[4],
        textAnchor: (match[5] as BarItem['textAnchor']) || 'center',
        label: match[6]
      };
      currentRow.items.push(barItem);
    }
    else if (line.startsWith('point')) {
      if (!currentRow) {
        errors.push({ line: lineNo, message: 'A point must appear inside a row' });
        continue;
      }
      const match = line.match(PATTERNS.point);
      if (!match) { syntaxError(lineNo, 'point'); continue; }
      checkColor(lineNo, match[4]);
      const pointItem: PointItem = {
        type: 'point',
        name: match[1],
        date: match[2],
        shape: (match[3] || 'triangle') as PointItem['shape'],
        color: match[4],
        textAnchor: (match[5] as PointItem['textAnchor']) || 'center',
        label: match[6]
      };
      currentRow.items.push(pointItem);
    }
    else if (line.startsWith('milestone')) {
      const match = line.match(PATTERNS.milestone);
      if (!match) { syntaxError(lineNo, 'milestone'); continue; }
      checkColor(lineNo, match[3]);
      const milestone: Milestone = {
        name: match[1],
        date: match[2],
        color: match[3] || 'blue'
      };
      data.milestones.push(milestone);
    }
    else {
      const keyword = line.split(/\s+/)[0];
      errors.push({ line: lineNo, message: `Unknown keyword "${keyword}". Expected one of: window, track, row, bar, point, recurring point, milestone` });
    }
  }

  return { data, errors };
}
