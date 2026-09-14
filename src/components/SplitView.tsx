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
  const [resizing, setResizing] = useState(false);
  const splitViewRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startLeftWidthRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startLeftWidthRef.current = leftWidth;
    setResizing(true);
  };

  // While a drag is in progress, track the pointer on the document so the
  // divider keeps following it even when the cursor leaves the handle.
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitViewRef.current) return;
      const splitViewWidth = splitViewRef.current.offsetWidth;
      const deltaX = e.clientX - startXRef.current;
      const newLeftWidth = Math.min(
        Math.max(20, startLeftWidthRef.current + (deltaX / splitViewWidth) * 100),
        80
      );
      setLeftWidth(newLeftWidth);
    };
    const handleMouseUp = () => setResizing(false);

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

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