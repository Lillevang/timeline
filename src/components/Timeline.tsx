import React, { useRef, useEffect, useState } from 'react';
import { TimelineData, Track, TimelineItem, Milestone } from '../types/index';
import { colorStyles, getExportStyles, isHexColor } from '../theme';
import './Timeline.css';

interface TimelineProps {
  data: TimelineData;
}

const colorClass = (base: string, color: string) =>
  isHexColor(color) ? base : `${base} color-${color}`;
const colorAttrs = (color: string) =>
  isHexColor(color) ? { fill: color, stroke: color } : {};

const Timeline: React.FC<TimelineProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showWeekNumbers, setShowWeekNumbers] = useState(true);
  const [showDates, setShowDates] = useState(true);
  const [showToday, setShowToday] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | 'free'>('free');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const ASPECT_RATIOS = {
    '16:9': { width: 1920, height: 1080 },
    '4:3':  { width: 1600, height: 1200 },
    'free': null,
  } as const;
  
  // // Add debug logging
  // useEffect(() => {
  //   console.log('Timeline data received:', JSON.stringify(data, null, 2));
  // }, [data]);

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        const { width, height } = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Build a standalone SVG for export by cloning what's on screen, so exports
  // are WYSIWYG (Weeks/Dates toggles included). With a slide aspect ratio
  // selected, the canvas extends to match the dashed overlay in the preview.
  const buildExportSvg = (): { svg: SVGSVGElement; width: number; height: number } | null => {
    const svgElement = svgRef.current;
    if (!svgElement) return null;

    const padding = 20;
    const target = ASPECT_RATIOS[aspectRatio];
    const vbWidth = dimensions.width + padding * 2;
    const contentHeight = totalHeight + padding * 2;
    const vbHeight = target
      ? Math.max(contentHeight, vbWidth * (target.height / target.width))
      : contentHeight;
    const width = target ? target.width : Math.max(dimensions.width, 1200);
    const height = Math.round(width * (vbHeight / vbWidth));

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('viewBox', `${-padding} ${-padding} ${vbWidth} ${vbHeight}`);

    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', (-padding).toString());
    bg.setAttribute('y', (-padding).toString());
    bg.setAttribute('width', vbWidth.toString());
    bg.setAttribute('height', vbHeight.toString());
    bg.setAttribute('fill', '#ffffff');
    svg.appendChild(bg);

    const style = document.createElementNS(SVG_NS, 'style');
    style.textContent = getExportStyles();
    svg.appendChild(style);

    const headerDates = svgElement.querySelector('.timeline-header-dates');
    if (headerDates) svg.appendChild(headerDates.cloneNode(true));
    svgElement.querySelectorAll('.timeline-track, .timeline-milestone, .timeline-today').forEach(el => {
      svg.appendChild(el.cloneNode(true));
    });

    return { svg, width, height };
  };

  const svgToBlob = (svg: SVGSVGElement): Blob =>
    new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSVG = () => {
    const built = buildExportSvg();
    if (!built) return;
    downloadBlob(svgToBlob(built.svg), 'timeline.svg');
  };

  // Rasterize at 2x so PNGs stay crisp on slides and hi-dpi screens.
  const PNG_SCALE = 2;
  const renderPNG = (onBlob: (blob: Blob) => void) => {
    const built = buildExportSvg();
    if (!built) return;
    // Bump the intrinsic size so the browser rasterizes the SVG at 2x
    built.svg.setAttribute('width', (built.width * PNG_SCALE).toString());
    built.svg.setAttribute('height', (built.height * PNG_SCALE).toString());
    const url = URL.createObjectURL(svgToBlob(built.svg));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = built.width * PNG_SCALE;
      canvas.height = built.height * PNG_SCALE;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => { if (blob) onBlob(blob); }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportPNG = () => renderPNG(blob => downloadBlob(blob, 'timeline.png'));

  const copyPNG = () => renderPNG(async (pngBlob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Clipboard unavailable — download instead
      downloadBlob(pngBlob, 'timeline.png');
    }
  });

  if (!data || !data.tracks || data.tracks.length === 0) {
    return (
      <div className="timeline-container empty-timeline">
        <p>No timeline data to display. Start editing the DSL to visualize your timeline.</p>
      </div>
    );
  }

  // Calculate the date range for the timeline
  let minDate = new Date();
  let maxDate = new Date();

  if (data.window) {
    minDate = new Date(data.window.start);
    maxDate = new Date(data.window.end);
  } else if (data.tracks.length > 0) {
    const allDates: Date[] = [];

    data.tracks.forEach(track => {
      track.rows.forEach(row => {
        row.items.forEach(item => {
          if (item.type === 'bar') {
            allDates.push(new Date(item.startDate));
            allDates.push(new Date(item.endDate));
          } else if (item.type === 'point') {
            allDates.push(new Date(item.date));
          }
        });
      });
    });

    if (data.milestones && data.milestones.length > 0) {
      data.milestones.forEach(milestone => {
        allDates.push(new Date(milestone.date));
      });
    }

    if (allDates.length > 0) {
      minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
      minDate = new Date(minDate.setDate(minDate.getDate() - 2));
      maxDate = new Date(maxDate.setDate(maxDate.getDate() + 2));
    }
  }
  
  // Timeline dimensions and scales
  const topMargin = 60; // Increased space for milestone labels
  const leftMargin = 150; // Increased from 100 to accommodate longer track names
  const baseTrackHeight = 40; // Base height for track header
  const rowHeight = 30;
  const totalHeight = topMargin + data.tracks.reduce((acc, track) => 
    acc + baseTrackHeight + (track.rows.length * rowHeight), 0);
  
  // Helper function to map date to x position
  const dateToX = (date: Date): number => {
    const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const dayWidth = (dimensions.width - leftMargin - 20) / totalDays;
    const days = (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    return leftMargin + days * dayWidth;
  };

  // Generate month ticks for the timeline header
  const getMonthTicks = () => {
    const months: { date: Date; x: number }[] = [];
    const currentDate = new Date(minDate);
    currentDate.setDate(1);
    if (currentDate.getTime() < minDate.getTime()) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    while (currentDate <= maxDate) {
      months.push({
        date: new Date(currentDate),
        x: dateToX(new Date(currentDate))
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  };

  // Generate day ticks for the timeline header
  const getDayTicks = () => {
    const days: { date: Date; x: number }[] = [];
    const currentDate = new Date(minDate);
    currentDate.setHours(0, 0, 0, 0);
    while (currentDate <= maxDate) {
      days.push({
        date: new Date(currentDate),
        x: dateToX(new Date(currentDate))
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  // Generate week ticks for the timeline header
  const getWeekTicks = () => {
    const weeks: { date: Date; x: number; weekNumber: number }[] = [];
    const currentDate = new Date(minDate);
    
    // Move to the start of the week (Monday)
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    currentDate.setDate(diff);
    
    while (currentDate <= maxDate) {
      // Calculate ISO week number
      const getWeekNumber = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      };

      weeks.push({
        date: new Date(currentDate),
        x: dateToX(new Date(currentDate)),
        weekNumber: getWeekNumber(currentDate)
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return weeks;
  };

  const monthTicks = getMonthTicks();
  const dayTicks = getDayTicks();
  const weekTicks = getWeekTicks();

  // Adaptive tick density: on long ranges per-day labels smear into noise, so
  // drop day numbers below ~15px/day and thin the grid to weeks, then months.
  const totalRangeDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
  const pxPerDay = totalRangeDays > 0 ? (dimensions.width - leftMargin - 20) / totalRangeDays : 0;
  const showDayDetail = pxPerDay >= 15;
  const gridTicks = showDayDetail ? dayTicks : pxPerDay * 7 >= 18 ? weekTicks : monthTicks;
  // Thin week-number labels to keep ~30px between them (every 2nd, 4th, … week)
  const weekStep = Math.max(1, Math.ceil(30 / Math.max(pxPerDay * 7, 1)));

  const renderTracks = () => {
    let yOffset = topMargin;
    
    return data.tracks.map((track, trackIndex) => {
      const trackY = yOffset;
      
      // Calculate if text needs wrapping
      const maxWidth = leftMargin - 30; // Leave some padding
      const words = track.name.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        // Approximate text width (rough estimate: 8px per character)
        const estimatedWidth = testLine.length * 8;
        
        if (estimatedWidth > maxWidth) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // If a single word is too long, split it
            lines.push(word);
            currentLine = '';
          }
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) {
        lines.push(currentLine);
      }

      // Determine font size based on number of lines
      const fontSize = lines.length > 1 ? '0.75rem' : '0.875rem';
      
      // Calculate extra padding needed for wrapped text
      const extraPadding = Math.max(0, (lines.length - 1) * 16); // 16px per additional line
      const trackTotalHeight = baseTrackHeight + (track.rows.length * rowHeight) + extraPadding;
      
      yOffset += trackTotalHeight;
      
      return (
        <g key={`track-${trackIndex}`} className="timeline-track">
          <text 
            x={leftMargin - 20} 
            y={trackY - 5} 
            className="timeline-track-label"
            textAnchor="end"
            style={{ fontSize }}
          >
            {lines.map((line, i) => (
              <tspan
                key={i}
                x={leftMargin - 20}
                dy={i === 0 ? '0' : '16'}
              >
                {line}
              </tspan>
            ))}
          </text>
          
          <rect
            x={leftMargin}
            y={trackY}
            width={dimensions.width - leftMargin - 10}
            height={trackTotalHeight}
            className="timeline-track-bg"
          />
          
          {renderRows(track, trackY + extraPadding)}
        </g>
      );
    });
  };

  // cx/cy is the visual centre of the shape
  const SHAPE_R = 6;
  const renderPoint = (cx: number, cy: number, shape: string, color: string) => {
    const r = SHAPE_R;
    switch (shape) {
      case 'triangle':
        return (
          <polygon
            points={`${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}`}
            className={colorClass('timeline-point-shape', color)}
            {...colorAttrs(color)}
          />
        );
      case 'triangle-down':
        return (
          <polygon
            points={`${cx},${cy + r} ${cx - r},${cy - r} ${cx + r},${cy - r}`}
            className={colorClass('timeline-point-shape', color)}
            {...colorAttrs(color)}
          />
        );
      case 'circle':
        return (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            className={colorClass('timeline-point-shape', color)}
            {...colorAttrs(color)}
          />
        );
      case 'square':
        return (
          <rect
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            className={colorClass('timeline-point-shape', color)}
            {...colorAttrs(color)}
          />
        );
      default:
        return null;
    }
  };

  const renderRows = (track: Track, trackY: number) => {
    return track.rows.map((row, rowIndex) => {
      const rowY = trackY + rowIndex * rowHeight + 10;
      
      return (
        <g key={`row-${trackY}-${rowIndex}`} className="timeline-row">
          {row.hideName !== true && (
            <text 
              x={leftMargin - 20} 
              y={rowY + rowHeight / 2} 
              className="timeline-row-label"
              textAnchor="end"
            >
              {row.name}
            </text>
          )}
          
          {row.items.map((item, itemIndex) => {
            const label = processLabel(item.label, item);
            
            return (
              <g key={`item-${rowY}-${itemIndex}`}>
                {item.type === 'bar' ? (
                  <g className="timeline-bar">
                    <rect
                      x={dateToX(new Date(item.startDate))}
                      y={rowY + 5}
                      width={dateToX(new Date(item.endDate)) - dateToX(new Date(item.startDate))}
                      height={rowHeight - 10}
                      className={colorClass('timeline-bar-rect', item.color)}
                      {...colorAttrs(item.color)}
                      rx="3"
                      ry="3"
                    />
                    <text
                      x={item.textAnchor === 'left' ? dateToX(new Date(item.startDate)) :
                         item.textAnchor === 'right' ? dateToX(new Date(item.endDate)) :
                         dateToX(new Date(item.startDate)) + (dateToX(new Date(item.endDate)) - dateToX(new Date(item.startDate))) / 2}
                      y={item.textAnchor === 'top' ? rowY - 5 :
                         item.textAnchor === 'bottom' ? rowY + rowHeight + 5 :
                         rowY + rowHeight / 2}
                      className="timeline-bar-label"
                      textAnchor={item.textAnchor === 'left' ? 'end' : item.textAnchor === 'right' ? 'start' : 'middle'}
                      dominantBaseline={item.textAnchor === 'top' ? 'text-after-edge' : item.textAnchor === 'bottom' ? 'text-before-edge' : 'middle'}
                      style={{ 
                        transform: item.textAnchor === 'left' ? 'translateX(-10px)' : 
                                 item.textAnchor === 'right' ? 'translateX(10px)' : 
                                 'translateX(5px)'
                      }}
                    >
                      {item.name}
                    </text>
                    {label && (
                      <text
                        x={dateToX(new Date(item.startDate)) + (dateToX(new Date(item.endDate)) - dateToX(new Date(item.startDate))) / 2}
                        y={rowY + rowHeight / 2 + 16}
                        className="timeline-bar-label"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ 
                          fontSize: '10px',
                          opacity: 0.8,
                          transform: 'translateX(5px)'
                        }}
                      >
                        {label}
                      </text>
                    )}
                  </g>
                ) : (() => {
                  const px = dateToX(new Date(item.date));
                  const cy = rowY + rowHeight / 2;      // vertical centre of the row
                  const anchor = item.textAnchor ?? 'center';

                  // Use dominantBaseline='auto' (alphabetic baseline) throughout —
                  // it's the most reliable cross-browser SVG baseline.
                  // At ~11px font: cap-height ≈ 8px above baseline, descent ≈ 3px below.
                  // For above: set baseline so descent clears shape top (cy - SHAPE_R) by ~4px
                  //   → baseline = cy - SHAPE_R - 4 - 3(descent) = cy - SHAPE_R - 7
                  // For below: set baseline so cap-top clears shape bottom (cy + SHAPE_R) by ~4px
                  //   → baseline = cy + SHAPE_R + 4 + 8(cap) = cy + SHAPE_R + 12
                  const sideGap = SHAPE_R + 6;

                  let labelX = px;
                  let labelY = cy - SHAPE_R - 7;  // default: above the shape
                  let textAnchor: React.CSSProperties['textAnchor'] = 'middle';
                  let dominantBaseline: React.CSSProperties['dominantBaseline'] = 'auto';

                  if (anchor === 'left') {
                    labelX = px - sideGap;
                    labelY = cy;
                    textAnchor = 'end';
                    dominantBaseline = 'middle';
                  } else if (anchor === 'right') {
                    labelX = px + sideGap;
                    labelY = cy;
                    textAnchor = 'start';
                    dominantBaseline = 'middle';
                  } else if (anchor === 'bottom') {
                    labelY = cy + SHAPE_R + 12;
                  } else {
                    // top or center: label above (already set as default)
                  }

                  return (
                    <g className="timeline-point">
                      {renderPoint(px, cy, item.shape, item.color)}
                      <text
                        x={labelX}
                        y={labelY}
                        className="timeline-point-label"
                        style={{ textAnchor, dominantBaseline }}
                      >
                        {item.name}
                        {label && (
                          <tspan
                            dx="6"
                            style={{ fontSize: '10px', opacity: 0.75, fontWeight: 'normal' }}
                          >
                            {label}
                          </tspan>
                        )}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}
        </g>
      );
    });
  };

  const renderMilestones = () => {
    if (!data.milestones || data.milestones.length === 0) return null;
    
    // Sort milestones by date to ensure consistent rendering
    const sortedMilestones = [...data.milestones].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Group milestones that are close together
    const milestoneGroups: Milestone[][] = [];
    let currentGroup: Milestone[] = [];
    
    sortedMilestones.forEach((milestone, index) => {
      if (index === 0) {
        currentGroup.push(milestone);
      } else {
        const prevDate = new Date(sortedMilestones[index - 1].date);
        const currDate = new Date(milestone.date);
        const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 3) { // If milestones are within 3 days of each other
          currentGroup.push(milestone);
        } else {
          milestoneGroups.push(currentGroup);
          currentGroup = [milestone];
        }
      }
    });
    if (currentGroup.length > 0) {
      milestoneGroups.push(currentGroup);
    }
    
    return milestoneGroups.map((group, groupIndex) => {
      return group.map((milestone, index) => {
        const x = dateToX(new Date(milestone.date));
        const verticalOffset = index * 25; // 25px vertical spacing between labels in the same group

        // Size the label background to the text and keep it inside the canvas
        const bgWidth = milestone.name.length * 7.5 + 16;
        const halfBg = bgWidth / 2;
        const labelX = Math.min(Math.max(x, halfBg), Math.max(dimensions.width - halfBg, halfBg));

        return (
          <g key={`milestone-${groupIndex}-${index}`} className="timeline-milestone">
            {/* Background for milestone label */}
            <rect
              x={labelX - halfBg}
              y={topMargin - 45 - verticalOffset}
              width={bgWidth}
              height="20"
              className="timeline-milestone-bg"
            />
            
            {/* Milestone vertical line */}
            <line
              x1={x}
              y1={topMargin - 15}
              x2={x}
              y2={totalHeight}
              className={colorClass('timeline-milestone-line', milestone.color)}
              {...colorAttrs(milestone.color)}
            />
            
            {/* Milestone marker */}
            <circle
              cx={x}
              cy={topMargin - 15}
              r="4"
              className={colorClass('timeline-milestone-marker', milestone.color)}
              {...colorAttrs(milestone.color)}
            />
            
            {/* Milestone label */}
            <text
              x={labelX}
              y={topMargin - 30 - verticalOffset}
              className="timeline-milestone-label"
              textAnchor="middle"
            >
              {milestone.name}
            </text>
          </g>
        );
      });
    });
  };

  const renderTodayIndicator = () => {
    const today = new Date();
    if (today < minDate || today > maxDate) return null;

    const x = dateToX(today);
    const labelY = topMargin - 35; // Moved up from -25
    return (
      <g className="timeline-today">
        {/* Main today line */}
        <line
          x1={x}
          y1={labelY + 20} // Start from below the label
          x2={x}
          y2={totalHeight}
          className="timeline-today-line"
        />
        {/* Stippled line through tracks */}
        <line
          x1={x}
          y1={labelY + 20} // Start from below the label
          x2={x}
          y2={totalHeight}
          className="timeline-today-stipple"
        />
        <rect
          x={x - 30}
          y={labelY}
          width="60"
          height="20"
          className="timeline-today-bg"
        />
        <text
          x={x}
          y={labelY + 15}
          className="timeline-today-label"
          textAnchor="middle"
        >
          Today
        </text>
      </g>
    );
  };

  const processLabel = (label: string | undefined, item: TimelineItem): string | undefined => {
    if (!label) return undefined;
    
    return label.replace(/%(\w+)/g, (match, token) => {
      switch (token) {
        case 'date': {
          const date = new Date(item.type === 'bar' ? item.startDate : item.date);
          return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
        }
        case 'duration':
          if (item.type === 'bar') {
            const start = new Date(item.startDate);
            const end = new Date(item.endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return `${days}d`;
          }
          return '';
        default:
          return match;
      }
    });
  };

  const slideOverlay = (() => {
    const target = ASPECT_RATIOS[aspectRatio];
    if (!target || dimensions.width === 0) return null;
    const previewScale = dimensions.width / target.width;
    const slideH = target.height * previewScale;
    if (slideH >= totalHeight) return null;
    return (
      <rect
        x={0}
        y={0}
        width={dimensions.width}
        height={slideH}
        fill="none"
        stroke="#339af0"
        strokeWidth="1.5"
        strokeDasharray="6 3"
        opacity="0.5"
        style={{ pointerEvents: 'none' }}
      />
    );
  })();

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2>Preview</h2>
        <div className="timeline-controls">
          <div className="timeline-toggles">
            <button
              className={`timeline-pill-btn ${showWeekNumbers ? 'active' : ''}`}
              onClick={() => setShowWeekNumbers(v => !v)}
            >
              Weeks
            </button>
            <button
              className={`timeline-pill-btn ${showDates ? 'active' : ''}`}
              onClick={() => setShowDates(v => !v)}
            >
              Dates
            </button>
            <button
              className={`timeline-pill-btn ${showToday ? 'active' : ''}`}
              onClick={() => setShowToday(v => !v)}
            >
              Today
            </button>
          </div>
          <div className="timeline-ratio-group">
            {(['free', '16:9', '4:3'] as const).map(r => (
              <button
                key={r}
                className={`timeline-ratio-btn ${aspectRatio === r ? 'active' : ''}`}
                onClick={() => setAspectRatio(r)}
              >
                {r === 'free' ? 'Free' : r}
              </button>
            ))}
          </div>
          <div className="timeline-export-buttons">
            <button onClick={exportSVG} className="timeline-download-btn secondary">
              SVG
            </button>
            <button onClick={exportPNG} className="timeline-download-btn secondary">
              PNG
            </button>
            <button onClick={copyPNG} className={`timeline-download-btn ${copyState === 'copied' ? 'success' : 'primary'}`}>
              {copyState === 'copied' ? 'Copied!' : 'Copy PNG'}
            </button>
          </div>
        </div>
      </div>
      <div className="timeline-content">
        <svg
          ref={svgRef}
          className="timeline-svg"
          width={dimensions.width}
          height={totalHeight}
        >
          <style>{colorStyles()}</style>
          <g className="timeline-header-dates">
            {showWeekNumbers && weekTicks.filter((_, index) => index % weekStep === 0).map((tick, index) => (
              <g key={`week-${index}`} className="timeline-week-tick">
                <line
                  x1={tick.x}
                  y1={topMargin - 45}
                  x2={tick.x}
                  y2={topMargin - 30}
                  stroke="#adb5bd"
                  strokeWidth="1"
                />
                <text
                  x={tick.x}
                  y={topMargin - 50}
                  textAnchor="middle"
                  className="timeline-week-label"
                >
                  W{tick.weekNumber}
                </text>
              </g>
            ))}
            
            {showDates && monthTicks.map((tick, index) => (
              <g key={`month-${index}`} className="timeline-month-tick">
                <line
                  x1={tick.x}
                  y1={topMargin - 30}
                  x2={tick.x}
                  y2={topMargin - 15}
                  stroke="#adb5bd"
                  strokeWidth="1"
                />
                <text
                  x={tick.x}
                  y={topMargin - 35}
                  textAnchor="middle"
                  className="timeline-month-label"
                >
                  {tick.date.toLocaleDateString(undefined, { month: 'short' })}
                </text>
              </g>
            ))}
            
            {showDates && showDayDetail && dayTicks.map((tick, index) => (
              <g key={`day-${index}`} className="timeline-day-tick">
                <line
                  x1={tick.x}
                  y1={topMargin - 15}
                  x2={tick.x}
                  y2={topMargin}
                  stroke="#dee2e6"
                  strokeWidth="1"
                />
                <text
                  x={tick.x}
                  y={topMargin - 5}
                  textAnchor="middle"
                  className="timeline-day-label"
                >
                  {tick.date.getDate()}
                </text>
              </g>
            ))}

            {showDates && gridTicks.map((tick, index) => (
              <line
                key={`grid-${index}`}
                x1={tick.x}
                y1={topMargin}
                x2={tick.x}
                y2={totalHeight}
                className="timeline-grid-line"
              />
            ))}
          </g>
          
          {renderTracks()}
          {renderMilestones()}
          {showToday && renderTodayIndicator()}
          {slideOverlay}
        </svg>
      </div>
    </div>
  );
};

export default Timeline;