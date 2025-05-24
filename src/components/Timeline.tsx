import React, { useRef, useEffect, useState } from 'react';
import { TimelineData, Track, TimelineItem, Milestone, Row } from '../types';
import './Timeline.css';

interface TimelineProps {
  data: TimelineData;
}

const Timeline: React.FC<TimelineProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showWeekNumbers, setShowWeekNumbers] = useState(true);
  const [showDates, setShowDates] = useState(true);
  
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

  const exportSVG = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    // Create a new SVG element
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // Set dimensions
    const downloadWidth = Math.max(dimensions.width, 1200);
    const downloadHeight = totalHeight;
    newSvg.setAttribute('width', downloadWidth.toString());
    newSvg.setAttribute('height', downloadHeight.toString());
    
    // Add padding to viewBox
    const padding = 20;
    const newViewBox = [
      -padding,
      -padding,
      downloadWidth + (padding * 2),
      downloadHeight + (padding * 2)
    ];
    newSvg.setAttribute('viewBox', newViewBox.join(' '));
    
    // Add background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', '#ffffff');
    newSvg.appendChild(bgRect);
    
    // Add styles
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .timeline-track-bg { fill: #ffffff; stroke: #e9ecef; stroke-width: 1; }
      .timeline-track-label { font-weight: 600; font-size: 14px; fill: #495057; text-transform: uppercase; letter-spacing: 0.5px; }
      .timeline-row-label { font-size: 12px; fill: #495057; font-weight: 500; }
      .timeline-grid-line { stroke: #f1f3f5; stroke-width: 1; }
      .timeline-month-label { font-size: 12px; fill: #495057; font-weight: 500; }
      .timeline-day-label { font-size: 12px; fill: #6c757d; }
      .timeline-bar-rect { stroke-width: 1; opacity: 0.9; }
      .timeline-bar-label { font-size: 12px; fill: #212529; font-weight: 500; }
      .timeline-point-label { font-size: 12px; fill: #212529; font-weight: 500; }
      .timeline-milestone-line { stroke-width: 2; stroke-dasharray: 4 2; opacity: 0.7; }
      .timeline-milestone-marker { stroke-width: 2; opacity: 0.9; }
      .timeline-milestone-label { font-size: 14px; fill: #212529; font-weight: 600; }
      .timeline-milestone-bg { fill: white; stroke: none; }
      .timeline-today-line { stroke: #fa5252; stroke-width: 2; stroke-dasharray: 4 4; opacity: 0.7; }
      .timeline-today-stipple { stroke: #fa5252; stroke-width: 1; stroke-dasharray: 1 3; opacity: 0.3; }
      .timeline-today-bg { fill: #fa5252; rx: 4; ry: 4; }
      .timeline-today-label { fill: white; font-size: 12px; font-weight: 600; }
      .color-blue { fill: #339af0; stroke: #228be6; }
      .color-green { fill: #40c057; stroke: #37b24d; }
      .color-yellow { fill: #fcc419; stroke: #f59f00; }
      .color-orange { fill: #fd7e14; stroke: #f76707; }
      .color-red { fill: #fa5252; stroke: #f03e3e; }
      .color-purple { fill: #cc5de8; stroke: #be4bdb; }
      .color-gray { fill: #868e96; stroke: #495057; }
    `;
    newSvg.appendChild(style);
    
    // Create a group for all content
    const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    contentGroup.setAttribute('transform', `translate(${padding}, ${padding})`);
    
    // Add all the timeline content
    const headerDates = svgElement.querySelector('.timeline-header-dates');
    if (headerDates) {
      contentGroup.appendChild(headerDates.cloneNode(true));
    }
    
    // Add tracks
    let yOffset = topMargin;
    data.tracks.forEach((track, trackIndex) => {
      const trackGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      trackGroup.setAttribute('class', 'timeline-track');
      
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
      
      // Add track label with wrapping
      const trackLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      trackLabel.setAttribute('x', (leftMargin - 20).toString());
      trackLabel.setAttribute('y', (yOffset - 5).toString());
      trackLabel.setAttribute('class', 'timeline-track-label');
      trackLabel.setAttribute('text-anchor', 'end');
      trackLabel.setAttribute('style', `font-size: ${fontSize}`);
      
      lines.forEach((line, i) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', (leftMargin - 20).toString());
        tspan.setAttribute('dy', i === 0 ? '0' : '16');
        tspan.textContent = line;
        trackLabel.appendChild(tspan);
      });
      trackGroup.appendChild(trackLabel);
      
      // Add track background
      const trackBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      trackBg.setAttribute('x', leftMargin.toString());
      trackBg.setAttribute('y', yOffset.toString());
      trackBg.setAttribute('width', (downloadWidth - leftMargin - 10).toString());
      trackBg.setAttribute('height', trackTotalHeight.toString());
      trackBg.setAttribute('class', 'timeline-track-bg');
      trackGroup.appendChild(trackBg);
      
      // Add rows and items
      track.rows.forEach((row, rowIndex) => {
        const rowY = yOffset + extraPadding + rowIndex * rowHeight + 10;
        
        // Add row label if not hidden
        if (!row.hideName) {
          const rowLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          rowLabel.setAttribute('x', (leftMargin - 20).toString());
          rowLabel.setAttribute('y', (rowY + rowHeight / 2).toString());
          rowLabel.setAttribute('class', 'timeline-row-label');
          rowLabel.setAttribute('text-anchor', 'end');
          rowLabel.textContent = row.name;
          trackGroup.appendChild(rowLabel);
        }
        
        // Add items
        row.items.forEach(item => {
          if (item.type === 'bar') {
            const barGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            barGroup.setAttribute('class', 'timeline-bar');
            
            const barRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            const startX = dateToX(new Date(item.startDate));
            const endX = dateToX(new Date(item.endDate));
            barRect.setAttribute('x', startX.toString());
            barRect.setAttribute('y', (rowY + 5).toString());
            barRect.setAttribute('width', (endX - startX).toString());
            barRect.setAttribute('height', (rowHeight - 10).toString());
            barRect.setAttribute('class', `timeline-bar-rect color-${item.color}`);
            barRect.setAttribute('rx', '3');
            barRect.setAttribute('ry', '3');
            barGroup.appendChild(barRect);
            
            // Add bar label with proper anchoring
            const barLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            let labelX = startX;
            let textAnchor = 'start';
            let transform = '';
            
            switch (item.textAnchor) {
              case 'left':
                labelX = startX;
                textAnchor = 'start';
                transform = 'translateX(-10px)';
                break;
              case 'right':
                labelX = endX;
                textAnchor = 'end';
                transform = 'translateX(10px)';
                break;
              default: // center
                labelX = (startX + endX) / 2;
                textAnchor = 'middle';
                transform = 'translateX(5px)';
            }
            
            barLabel.setAttribute('x', labelX.toString());
            barLabel.setAttribute('y', (rowY + rowHeight / 2).toString());
            barLabel.setAttribute('class', 'timeline-bar-label');
            barLabel.setAttribute('text-anchor', textAnchor);
            barLabel.setAttribute('dominant-baseline', 'middle');
            barLabel.setAttribute('style', `transform: ${transform}`);
            barLabel.textContent = item.name;
            barGroup.appendChild(barLabel);
            
            // Add bar label if present
            if (item.label) {
              const label = processLabel(item.label, item);
              if (label) {
                const barSubLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                barSubLabel.setAttribute('x', ((startX + endX) / 2).toString());
                barSubLabel.setAttribute('y', (rowY + rowHeight / 2 + 16).toString());
                barSubLabel.setAttribute('class', 'timeline-bar-label');
                barSubLabel.setAttribute('text-anchor', 'middle');
                barSubLabel.setAttribute('dominant-baseline', 'middle');
                barSubLabel.setAttribute('style', 'font-size: 10px; opacity: 0.8; transform: translateX(5px)');
                barSubLabel.textContent = label;
                barGroup.appendChild(barSubLabel);
              }
            }
            
            trackGroup.appendChild(barGroup);
          } else if (item.type === 'point') {
            const pointGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            pointGroup.setAttribute('class', 'timeline-point');
            
            const pointX = dateToX(new Date(item.date));
            const pointY = rowY + 5;
            
            // Add point shape
            let shapeElement;
            switch (item.shape) {
              case 'circle':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                shapeElement.setAttribute('cx', pointX.toString());
                shapeElement.setAttribute('cy', (pointY + 5).toString());
                shapeElement.setAttribute('r', '5');
                break;
              case 'square':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shapeElement.setAttribute('x', (pointX - 5).toString());
                shapeElement.setAttribute('y', pointY.toString());
                shapeElement.setAttribute('width', '10');
                shapeElement.setAttribute('height', '10');
                break;
              case 'triangle-down':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shapeElement.setAttribute('points', `${pointX},${pointY + 10} ${pointX - 6},${pointY} ${pointX + 6},${pointY}`);
                break;
              default: // triangle
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shapeElement.setAttribute('points', `${pointX},${pointY} ${pointX - 6},${pointY + 10} ${pointX + 6},${pointY + 10}`);
            }
            shapeElement.setAttribute('class', `timeline-point-shape color-${item.color}`);
            pointGroup.appendChild(shapeElement);
            
            // Add point label with proper anchoring
            const pointLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            let labelX = pointX;
            let textAnchor = 'middle';
            let dominantBaseline = 'text-after-edge';
            let transform = '';
            
            switch (item.textAnchor) {
              case 'left':
                labelX = pointX;
                textAnchor = 'end';
                dominantBaseline = 'middle';
                transform = 'translateX(-10px)';
                break;
              case 'right':
                labelX = pointX;
                textAnchor = 'start';
                dominantBaseline = 'middle';
                transform = 'translateX(10px)';
                break;
              case 'top':
                labelX = pointX;
                textAnchor = 'middle';
                dominantBaseline = 'text-after-edge';
                transform = 'translateY(-15px)';
                break;
              case 'bottom':
                labelX = pointX;
                textAnchor = 'middle';
                dominantBaseline = 'text-before-edge';
                transform = 'translateY(15px)';
                break;
              default: // center
                labelX = pointX;
                textAnchor = 'middle';
                dominantBaseline = 'text-after-edge';
                transform = 'translateY(-2px)';
            }
            
            pointLabel.setAttribute('x', labelX.toString());
            pointLabel.setAttribute('y', rowY.toString());
            pointLabel.setAttribute('class', 'timeline-point-label');
            pointLabel.setAttribute('text-anchor', textAnchor);
            pointLabel.setAttribute('dominant-baseline', dominantBaseline);
            pointLabel.setAttribute('style', `transform: ${transform}`);
            pointLabel.textContent = item.name;
            
            // Add point label if present
            if (item.label) {
              const label = processLabel(item.label, item);
              if (label) {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('dx', '8');
                tspan.setAttribute('style', 'font-size: 10px; opacity: 0.8; font-weight: normal');
                tspan.textContent = label;
                pointLabel.appendChild(tspan);
              }
            }
            
            pointGroup.appendChild(pointLabel);
            
            trackGroup.appendChild(pointGroup);
          }
        });
      });
      
      contentGroup.appendChild(trackGroup);
      yOffset += trackTotalHeight;
    });
    
    // Add milestones
    if (data.milestones) {
      data.milestones.forEach((milestone, index) => {
        const milestoneGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        milestoneGroup.setAttribute('class', 'timeline-milestone');
        
        const x = dateToX(new Date(milestone.date));
        
        // Add milestone line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toString());
        line.setAttribute('y1', topMargin.toString());
        line.setAttribute('x2', x.toString());
        line.setAttribute('y2', totalHeight.toString());
        line.setAttribute('class', `timeline-milestone-line color-${milestone.color}`);
        milestoneGroup.appendChild(line);
        
        // Add milestone marker
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.setAttribute('cx', x.toString());
        marker.setAttribute('cy', topMargin.toString());
        marker.setAttribute('r', '4');
        marker.setAttribute('class', `timeline-milestone-marker color-${milestone.color}`);
        milestoneGroup.appendChild(marker);
        
        // Add milestone label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x.toString());
        label.setAttribute('y', (topMargin - 10).toString());
        label.setAttribute('class', 'timeline-milestone-label');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = milestone.name;
        milestoneGroup.appendChild(label);
        
        contentGroup.appendChild(milestoneGroup);
      });
    }
    
    // Add today indicator if applicable
    const today = new Date();
    if (today >= minDate && today <= maxDate) {
      const todayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      todayGroup.setAttribute('class', 'timeline-today');
      
      const x = dateToX(today);
      const labelY = topMargin - 35;
      
      // Add today line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', (labelY + 20).toString());
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', totalHeight.toString());
      line.setAttribute('class', 'timeline-today-line');
      todayGroup.appendChild(line);
      
      // Add stippled line
      const stipple = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      stipple.setAttribute('x1', x.toString());
      stipple.setAttribute('y1', (labelY + 20).toString());
      stipple.setAttribute('x2', x.toString());
      stipple.setAttribute('y2', totalHeight.toString());
      stipple.setAttribute('class', 'timeline-today-stipple');
      todayGroup.appendChild(stipple);
      
      // Add today label background
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', (x - 30).toString());
      labelBg.setAttribute('y', labelY.toString());
      labelBg.setAttribute('width', '60');
      labelBg.setAttribute('height', '20');
      labelBg.setAttribute('class', 'timeline-today-bg');
      todayGroup.appendChild(labelBg);
      
      // Add today label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x.toString());
      label.setAttribute('y', (labelY + 15).toString());
      label.setAttribute('class', 'timeline-today-label');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = 'Today';
      todayGroup.appendChild(label);
      
      contentGroup.appendChild(todayGroup);
    }
    
    newSvg.appendChild(contentGroup);
    
    // Create the SVG data
    const svgData = new XMLSerializer().serializeToString(newSvg);
    const svgWithDoctype = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgData}`;
    
    const svgBlob = new Blob([svgWithDoctype], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'timeline.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const exportPNG = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    // Create a new SVG element
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // Set dimensions
    const downloadWidth = Math.max(dimensions.width, 1200);
    const downloadHeight = totalHeight;
    newSvg.setAttribute('width', downloadWidth.toString());
    newSvg.setAttribute('height', downloadHeight.toString());
    
    // Add padding to viewBox
    const padding = 20;
    const newViewBox = [
      -padding,
      -padding,
      downloadWidth + (padding * 2),
      downloadHeight + (padding * 2)
    ];
    newSvg.setAttribute('viewBox', newViewBox.join(' '));
    
    // Add background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', '#ffffff');
    newSvg.appendChild(bgRect);
    
    // Add styles
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .timeline-track-bg { fill: #ffffff; stroke: #e9ecef; stroke-width: 1; }
      .timeline-track-label { font-weight: 600; font-size: 14px; fill: #495057; text-transform: uppercase; letter-spacing: 0.5px; }
      .timeline-row-label { font-size: 12px; fill: #495057; font-weight: 500; }
      .timeline-grid-line { stroke: #f1f3f5; stroke-width: 1; }
      .timeline-month-label { font-size: 12px; fill: #495057; font-weight: 500; }
      .timeline-day-label { font-size: 12px; fill: #6c757d; }
      .timeline-bar-rect { stroke-width: 1; opacity: 0.9; }
      .timeline-bar-label { font-size: 12px; fill: #212529; font-weight: 500; }
      .timeline-point-label { font-size: 12px; fill: #212529; font-weight: 500; }
      .timeline-milestone-line { stroke-width: 2; stroke-dasharray: 4 2; opacity: 0.7; }
      .timeline-milestone-marker { stroke-width: 2; opacity: 0.9; }
      .timeline-milestone-label { font-size: 14px; fill: #212529; font-weight: 600; }
      .timeline-milestone-bg { fill: white; stroke: none; }
      .timeline-today-line { stroke: #fa5252; stroke-width: 2; stroke-dasharray: 4 4; opacity: 0.7; }
      .timeline-today-stipple { stroke: #fa5252; stroke-width: 1; stroke-dasharray: 1 3; opacity: 0.3; }
      .timeline-today-bg { fill: #fa5252; rx: 4; ry: 4; }
      .timeline-today-label { fill: white; font-size: 12px; font-weight: 600; }
      .color-blue { fill: #339af0; stroke: #228be6; }
      .color-green { fill: #40c057; stroke: #37b24d; }
      .color-yellow { fill: #fcc419; stroke: #f59f00; }
      .color-orange { fill: #fd7e14; stroke: #f76707; }
      .color-red { fill: #fa5252; stroke: #f03e3e; }
      .color-purple { fill: #cc5de8; stroke: #be4bdb; }
      .color-gray { fill: #868e96; stroke: #495057; }
    `;
    newSvg.appendChild(style);
    
    // Create a group for all content
    const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    contentGroup.setAttribute('transform', `translate(${padding}, ${padding})`);
    
    // Add all the timeline content
    const headerDates = svgElement.querySelector('.timeline-header-dates');
    if (headerDates) {
      contentGroup.appendChild(headerDates.cloneNode(true));
    }
    
    // Add tracks
    let yOffset = topMargin;
    data.tracks.forEach((track, trackIndex) => {
      const trackGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      trackGroup.setAttribute('class', 'timeline-track');
      
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
      
      // Add track label with wrapping
      const trackLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      trackLabel.setAttribute('x', (leftMargin - 20).toString());
      trackLabel.setAttribute('y', (yOffset - 5).toString());
      trackLabel.setAttribute('class', 'timeline-track-label');
      trackLabel.setAttribute('text-anchor', 'end');
      trackLabel.setAttribute('style', `font-size: ${fontSize}`);
      
      lines.forEach((line, i) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', (leftMargin - 20).toString());
        tspan.setAttribute('dy', i === 0 ? '0' : '16');
        tspan.textContent = line;
        trackLabel.appendChild(tspan);
      });
      trackGroup.appendChild(trackLabel);
      
      // Add track background
      const trackBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      trackBg.setAttribute('x', leftMargin.toString());
      trackBg.setAttribute('y', yOffset.toString());
      trackBg.setAttribute('width', (downloadWidth - leftMargin - 10).toString());
      trackBg.setAttribute('height', trackTotalHeight.toString());
      trackBg.setAttribute('class', 'timeline-track-bg');
      trackGroup.appendChild(trackBg);
      
      // Add rows and items
      track.rows.forEach((row, rowIndex) => {
        const rowY = yOffset + extraPadding + rowIndex * rowHeight + 10;
        
        // Add row label if not hidden
        if (!row.hideName) {
          const rowLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          rowLabel.setAttribute('x', (leftMargin - 20).toString());
          rowLabel.setAttribute('y', (rowY + rowHeight / 2).toString());
          rowLabel.setAttribute('class', 'timeline-row-label');
          rowLabel.setAttribute('text-anchor', 'end');
          rowLabel.textContent = row.name;
          trackGroup.appendChild(rowLabel);
        }
        
        // Add items
        row.items.forEach(item => {
          if (item.type === 'bar') {
            const barGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            barGroup.setAttribute('class', 'timeline-bar');
            
            const barRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            const startX = dateToX(new Date(item.startDate));
            const endX = dateToX(new Date(item.endDate));
            barRect.setAttribute('x', startX.toString());
            barRect.setAttribute('y', (rowY + 5).toString());
            barRect.setAttribute('width', (endX - startX).toString());
            barRect.setAttribute('height', (rowHeight - 10).toString());
            barRect.setAttribute('class', `timeline-bar-rect color-${item.color}`);
            barRect.setAttribute('rx', '3');
            barRect.setAttribute('ry', '3');
            barGroup.appendChild(barRect);
            
            // Add bar label with proper anchoring
            const barLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            let labelX = startX;
            let textAnchor = 'start';
            let transform = '';
            
            switch (item.textAnchor) {
              case 'left':
                labelX = startX;
                textAnchor = 'start';
                transform = 'translateX(-10px)';
                break;
              case 'right':
                labelX = endX;
                textAnchor = 'end';
                transform = 'translateX(10px)';
                break;
              default: // center
                labelX = (startX + endX) / 2;
                textAnchor = 'middle';
                transform = 'translateX(5px)';
            }
            
            barLabel.setAttribute('x', labelX.toString());
            barLabel.setAttribute('y', (rowY + rowHeight / 2).toString());
            barLabel.setAttribute('class', 'timeline-bar-label');
            barLabel.setAttribute('text-anchor', textAnchor);
            barLabel.setAttribute('dominant-baseline', 'middle');
            barLabel.setAttribute('style', `transform: ${transform}`);
            barLabel.textContent = item.name;
            barGroup.appendChild(barLabel);
            
            // Add bar label if present
            if (item.label) {
              const label = processLabel(item.label, item);
              if (label) {
                const barSubLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                barSubLabel.setAttribute('x', ((startX + endX) / 2).toString());
                barSubLabel.setAttribute('y', (rowY + rowHeight / 2 + 16).toString());
                barSubLabel.setAttribute('class', 'timeline-bar-label');
                barSubLabel.setAttribute('text-anchor', 'middle');
                barSubLabel.setAttribute('dominant-baseline', 'middle');
                barSubLabel.setAttribute('style', 'font-size: 10px; opacity: 0.8; transform: translateX(5px)');
                barSubLabel.textContent = label;
                barGroup.appendChild(barSubLabel);
              }
            }
            
            trackGroup.appendChild(barGroup);
          } else if (item.type === 'point') {
            const pointGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            pointGroup.setAttribute('class', 'timeline-point');
            
            const pointX = dateToX(new Date(item.date));
            const pointY = rowY + 5;
            
            // Add point shape
            let shapeElement;
            switch (item.shape) {
              case 'circle':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                shapeElement.setAttribute('cx', pointX.toString());
                shapeElement.setAttribute('cy', (pointY + 5).toString());
                shapeElement.setAttribute('r', '5');
                break;
              case 'square':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shapeElement.setAttribute('x', (pointX - 5).toString());
                shapeElement.setAttribute('y', pointY.toString());
                shapeElement.setAttribute('width', '10');
                shapeElement.setAttribute('height', '10');
                break;
              case 'triangle-down':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shapeElement.setAttribute('points', `${pointX},${pointY + 10} ${pointX - 6},${pointY} ${pointX + 6},${pointY}`);
                break;
              default: // triangle
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shapeElement.setAttribute('points', `${pointX},${pointY} ${pointX - 6},${pointY + 10} ${pointX + 6},${pointY + 10}`);
            }
            shapeElement.setAttribute('class', `timeline-point-shape color-${item.color}`);
            pointGroup.appendChild(shapeElement);
            
            // Add point label with proper anchoring
            const pointLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            let labelX = pointX;
            let textAnchor = 'middle';
            let dominantBaseline = 'text-after-edge';
            let transform = '';
            
            switch (item.textAnchor) {
              case 'left':
                labelX = pointX;
                textAnchor = 'end';
                dominantBaseline = 'middle';
                transform = 'translateX(-10px)';
                break;
              case 'right':
                labelX = pointX;
                textAnchor = 'start';
                dominantBaseline = 'middle';
                transform = 'translateX(10px)';
                break;
              case 'top':
                labelX = pointX;
                textAnchor = 'middle';
                dominantBaseline = 'text-after-edge';
                transform = 'translateY(-15px)';
                break;
              case 'bottom':
                labelX = pointX;
                textAnchor = 'middle';
                dominantBaseline = 'text-before-edge';
                transform = 'translateY(15px)';
                break;
              default: // center
                labelX = pointX;
                textAnchor = 'middle';
                dominantBaseline = 'text-after-edge';
                transform = 'translateY(-2px)';
            }
            
            pointLabel.setAttribute('x', labelX.toString());
            pointLabel.setAttribute('y', rowY.toString());
            pointLabel.setAttribute('class', 'timeline-point-label');
            pointLabel.setAttribute('text-anchor', textAnchor);
            pointLabel.setAttribute('dominant-baseline', dominantBaseline);
            pointLabel.setAttribute('style', `transform: ${transform}`);
            pointLabel.textContent = item.name;
            
            // Add point label if present
            if (item.label) {
              const label = processLabel(item.label, item);
              if (label) {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('dx', '8');
                tspan.setAttribute('style', 'font-size: 10px; opacity: 0.8; font-weight: normal');
                tspan.textContent = label;
                pointLabel.appendChild(tspan);
              }
            }
            
            pointGroup.appendChild(pointLabel);
            
            trackGroup.appendChild(pointGroup);
          }
        });
      });
      
      contentGroup.appendChild(trackGroup);
      yOffset += trackTotalHeight;
    });
    
    // Add milestones
    if (data.milestones) {
      data.milestones.forEach((milestone, index) => {
        const milestoneGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        milestoneGroup.setAttribute('class', 'timeline-milestone');
        
        const x = dateToX(new Date(milestone.date));
        
        // Add milestone line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toString());
        line.setAttribute('y1', topMargin.toString());
        line.setAttribute('x2', x.toString());
        line.setAttribute('y2', totalHeight.toString());
        line.setAttribute('class', `timeline-milestone-line color-${milestone.color}`);
        milestoneGroup.appendChild(line);
        
        // Add milestone marker
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.setAttribute('cx', x.toString());
        marker.setAttribute('cy', topMargin.toString());
        marker.setAttribute('r', '4');
        marker.setAttribute('class', `timeline-milestone-marker color-${milestone.color}`);
        milestoneGroup.appendChild(marker);
        
        // Add milestone label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x.toString());
        label.setAttribute('y', (topMargin - 10).toString());
        label.setAttribute('class', 'timeline-milestone-label');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = milestone.name;
        milestoneGroup.appendChild(label);
        
        contentGroup.appendChild(milestoneGroup);
      });
    }
    
    // Add today indicator if applicable
    const today = new Date();
    if (today >= minDate && today <= maxDate) {
      const todayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      todayGroup.setAttribute('class', 'timeline-today');
      
      const x = dateToX(today);
      const labelY = topMargin - 35;
      
      // Add today line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', (labelY + 20).toString());
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', totalHeight.toString());
      line.setAttribute('class', 'timeline-today-line');
      todayGroup.appendChild(line);
      
      // Add stippled line
      const stipple = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      stipple.setAttribute('x1', x.toString());
      stipple.setAttribute('y1', (labelY + 20).toString());
      stipple.setAttribute('x2', x.toString());
      stipple.setAttribute('y2', totalHeight.toString());
      stipple.setAttribute('class', 'timeline-today-stipple');
      todayGroup.appendChild(stipple);
      
      // Add today label background
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', (x - 30).toString());
      labelBg.setAttribute('y', labelY.toString());
      labelBg.setAttribute('width', '60');
      labelBg.setAttribute('height', '20');
      labelBg.setAttribute('class', 'timeline-today-bg');
      todayGroup.appendChild(labelBg);
      
      // Add today label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x.toString());
      label.setAttribute('y', (labelY + 15).toString());
      label.setAttribute('class', 'timeline-today-label');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = 'Today';
      todayGroup.appendChild(label);
      
      contentGroup.appendChild(todayGroup);
    }
    
    newSvg.appendChild(contentGroup);
    
    // Convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(newSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create an image element to load the SVG
    const img = new Image();
    img.onload = () => {
      // Create a canvas with the same dimensions as the SVG
      const canvas = document.createElement('canvas');
      canvas.width = downloadWidth;
      canvas.height = downloadHeight;
      
      // Draw the SVG onto the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to PNG
        const pngUrl = canvas.toDataURL('image/png');
        
        // Create a download link
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'timeline.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      
      // Clean up
      URL.revokeObjectURL(svgUrl);
    };
    
    img.src = svgUrl;
  };

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
  
  if (data.tracks.length > 0) {
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
      
      // Add some padding to the date range
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
    let currentDate = new Date(minDate);
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
    let currentDate = new Date(minDate);
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
    let currentDate = new Date(minDate);
    
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

  const renderPoint = (x: number, y: number, shape: string, color: string) => {
    switch (shape) {
      case 'triangle':
        return (
          <polygon
            points={`${x},${y} ${x - 6},${y + 10} ${x + 6},${y + 10}`}
            className={`timeline-point-shape color-${color}`}
          />
        );
      case 'triangle-down':
        return (
          <polygon
            points={`${x},${y + 10} ${x - 6},${y} ${x + 6},${y}`}
            className={`timeline-point-shape color-${color}`}
          />
        );
      case 'circle':
        return (
          <circle
            cx={x}
            cy={y + 5}
            r="5"
            className={`timeline-point-shape color-${color}`}
          />
        );
      case 'square':
        return (
          <rect
            x={x - 5}
            y={y}
            width="10"
            height="10"
            className={`timeline-point-shape color-${color}`}
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
                      className={`timeline-bar-rect color-${item.color}`}
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
                ) : (
                  <g className="timeline-point">
                    {renderPoint(
                      dateToX(new Date(item.date)),
                      rowY + 5,
                      item.shape,
                      item.color
                    )}
                    <text
                      x={dateToX(new Date(item.date))}
                      y={item.textAnchor === 'top' ? rowY - 15 :
                         item.textAnchor === 'bottom' ? rowY + rowHeight + 5 :
                         rowY - 2}
                      className="timeline-point-label"
                      textAnchor={item.textAnchor === 'left' ? 'end' : item.textAnchor === 'right' ? 'start' : 'middle'}
                      dominantBaseline={item.textAnchor === 'top' ? 'text-after-edge' : item.textAnchor === 'bottom' ? 'text-before-edge' : 'text-after-edge'}
                      style={{ 
                        transform: item.textAnchor === 'left' ? 'translateX(-10px)' : 
                                 item.textAnchor === 'right' ? 'translateX(10px)' : 
                                 'translateX(5px)'
                      }}
                    >
                      {item.name}
                      {label && (
                        <tspan
                          dx="8"
                          style={{ 
                            fontSize: '10px',
                            opacity: 0.8,
                            fontWeight: 'normal'
                          }}
                        >
                          {label}
                        </tspan>
                      )}
                    </text>
                  </g>
                )}
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
        
        return (
          <g key={`milestone-${groupIndex}-${index}`} className="timeline-milestone">
            {/* Background for milestone label */}
            <rect
              x={x - 50}
              y={topMargin - 45 - verticalOffset}
              width="100"
              height="20"
              className="timeline-milestone-bg"
            />
            
            {/* Milestone vertical line */}
            <line
              x1={x}
              y1={topMargin - 15}
              x2={x}
              y2={totalHeight}
              className={`timeline-milestone-line color-${milestone.color}`}
            />
            
            {/* Milestone marker */}
            <circle
              cx={x}
              cy={topMargin - 15}
              r="4"
              className={`timeline-milestone-marker color-${milestone.color}`}
            />
            
            {/* Milestone label */}
            <text
              x={x}
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
        case 'date':
          const date = new Date(item.type === 'bar' ? item.startDate : item.date);
          return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
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

  const renderTimelineItem = (item: TimelineItem, rowIndex: number, itemIndex: number) => {
    const x = dateToX(new Date(item.type === 'bar' ? item.startDate : item.date));
    const color = item.color || 'blue';
    const textAnchor = item.textAnchor || 'center';
    const label = processLabel(item.label, item);

    if (item.type === 'bar') {
      const endX = dateToX(new Date(item.endDate));
      const width = endX - x;
      const y = rowIndex * rowHeight + rowHeight / 2;

      return (
        <g key={`${rowIndex}-${itemIndex}`}>
          <rect
            x={x}
            y={y - rowHeight / 2}
            width={width}
            height={rowHeight}
            fill={color}
            rx={4}
          />
          <text
            x={x + width / 2}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={12}
            fontWeight="bold"
          >
            {item.name}
          </text>
          {label && (
            <text
              x={x + width / 2}
              y={y + 16}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={10}
              opacity={0.8}
            >
              {label}
            </text>
          )}
        </g>
      );
    } else {
      const y = rowIndex * rowHeight + rowHeight / 2;
      const shape = item.shape || 'triangle';
      let shapeElement;

      switch (shape) {
        case 'circle':
          shapeElement = <circle cx={x} cy={y} r={6} fill={color} />;
          break;
        case 'square':
          shapeElement = <rect x={x - 6} y={y - 6} width={12} height={12} fill={color} />;
          break;
        default:
          shapeElement = (
            <path
              d={`M ${x} ${y - 6} L ${x - 6} ${y + 6} L ${x + 6} ${y + 6} Z`}
              fill={color}
            />
          );
      }

      return (
        <g key={`${rowIndex}-${itemIndex}`}>
          {shapeElement}
          <text
            x={x}
            y={y - 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={12}
            fontWeight="bold"
          >
            {item.name}
          </text>
          {label && (
            <text
              x={x}
              y={y + 16}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={10}
              opacity={0.8}
            >
              {label}
            </text>
          )}
        </g>
      );
    }
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2>Timeline Visualization</h2>
        <div className="timeline-controls">
          <label className="timeline-toggle">
            <input
              type="checkbox"
              checked={showWeekNumbers}
              onChange={(e) => setShowWeekNumbers(e.target.checked)}
            />
            Show Week Numbers
          </label>
          <label className="timeline-toggle">
            <input
              type="checkbox"
              checked={showDates}
              onChange={(e) => setShowDates(e.target.checked)}
            />
            Show Dates
          </label>
          <div className="timeline-export-buttons">
            <button onClick={exportSVG} className="timeline-download-btn">
              Download SVG
            </button>
            <button onClick={exportPNG} className="timeline-download-btn">
              Download PNG
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
          <g className="timeline-header-dates">
            {showWeekNumbers && weekTicks.map((tick, index) => (
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
            
            {showDates && dayTicks.map((tick, index) => (
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
                
                <line
                  x1={tick.x}
                  y1={topMargin}
                  x2={tick.x}
                  y2={totalHeight}
                  className="timeline-grid-line"
                />
              </g>
            ))}
          </g>
          
          {renderTracks()}
          {renderMilestones()}
          {renderTodayIndicator()}
        </svg>
      </div>
    </div>
  );
};

export default Timeline;