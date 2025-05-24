import React, { useState, useRef, useEffect } from 'react';
import './SplitView.css';

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftWidth?: number;
}

const SplitView: React.FC<SplitViewProps> = ({ 
  left, 
  right, 
  initialLeftWidth = 40 
}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const splitViewRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startLeftWidthRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startLeftWidthRef.current = leftWidth;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current || !splitViewRef.current) return;
    
    const splitViewWidth = splitViewRef.current.offsetWidth;
    const deltaX = e.clientX - startXRef.current;
    const newLeftWidth = Math.min(
      Math.max(20, startLeftWidthRef.current + (deltaX / splitViewWidth) * 100),
      80
    );
    
    setLeftWidth(newLeftWidth);
  };

  const handleMouseUp = () => {
    resizingRef.current = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="split-view" ref={splitViewRef}>
      <div 
        className="split-view-left" 
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>
      <div 
        className="split-view-divider"
        onMouseDown={handleMouseDown}
      >
        <div className="split-view-divider-grip">
          <div className="split-view-divider-grip-line"></div>
          <div className="split-view-divider-grip-line"></div>
          <div className="split-view-divider-grip-line"></div>
        </div>
      </div>
      <div 
        className="split-view-right" 
        style={{ width: `${100 - leftWidth}%` }}
      >
        {right}
      </div>
    </div>
  );
};

export default SplitView;