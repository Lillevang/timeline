// Single source of truth for timeline colors and export styling.
// The live preview injects colorStyles() into the SVG, and every export path
// uses getExportStyles() — so named colors can never drift between app and export again.

export const PALETTE: Record<string, string> = {
  blue: '#339af0',
  lightblue: '#74c0fc',
  green: '#40c057',
  lightgreen: '#8ce99a',
  yellow: '#fcc419',
  orange: '#fd7e14',
  red: '#fa5252',
  purple: '#cc5de8',
  pink: '#f06595',
  cyan: '#15aabf',
  teal: '#12b886',
  gray: '#868e96',
  indigo: '#5c7cfa',
  violet: '#845ef7',
  lime: '#82c91e',
};

export const isHexColor = (color: string): boolean => color.startsWith('#');

export function colorStyles(): string {
  return Object.entries(PALETTE)
    .map(([name, hex]) => `.color-${name} { fill: ${hex}; stroke: ${hex}; }`)
    .join('\n');
}

export function getExportStyles(): string {
  return `
    .timeline-track-bg { fill: #f8f9fa; stroke: #e9ecef; stroke-width: 1; }
    .timeline-track-label { font-weight: 700; font-size: 13px; fill: #343a40; text-transform: uppercase; letter-spacing: 0.8px; }
    .timeline-row-label { font-size: 11px; fill: #6c757d; font-weight: 500; }
    .timeline-grid-line { stroke: #f1f3f5; stroke-width: 1; }
    .timeline-month-label { font-size: 11px; fill: #495057; font-weight: 600; }
    .timeline-day-label { font-size: 10px; fill: #adb5bd; }
    .timeline-week-label { font-size: 10px; fill: #868e96; font-weight: 500; }
    .timeline-bar-rect { stroke-width: 0; opacity: 1; rx: 4; }
    .timeline-bar-label { font-size: 11px; fill: white; font-weight: 600; }
    .timeline-point-label { font-size: 11px; fill: #212529; font-weight: 500; }
    .timeline-point-shape { stroke-width: 0; }
    .timeline-milestone-line { stroke-width: 1.5; stroke-dasharray: 4 3; opacity: 0.6; }
    .timeline-milestone-marker { stroke-width: 0; opacity: 1; }
    .timeline-milestone-label { font-size: 12px; fill: #212529; font-weight: 600; }
    .timeline-milestone-bg { fill: white; stroke: none; }
    .timeline-today-line { stroke: #fa5252; stroke-width: 1.5; stroke-dasharray: 4 4; opacity: 0.8; }
    .timeline-today-stipple { stroke: #fa5252; stroke-width: 1; stroke-dasharray: 1 3; opacity: 0.25; }
    .timeline-today-bg { fill: #fa5252; }
    .timeline-today-label { fill: white; font-size: 11px; font-weight: 600; }
    ${colorStyles()}
  `;
}
