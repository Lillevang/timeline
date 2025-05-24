import React, { useState } from 'react';
import SplitView from './components/SplitView';
import Editor from './components/Editor';
import Timeline from './components/Timeline';
import { parseTimelineDSL } from './utils/parser';
import { TimelineProvider } from './context/TimelineContext';
import HelpModal from './components/HelpModal';
import './App.css';

// Default example DSL
const defaultDSL = `track "System Dev"
  row "Tasks"
    bar "R25.1" from 2025-04-14 to 2025-04-24 color green
    point "Status" at 2025-04-21 shape triangle color blue
track "UX Design"
  row "Research"
    bar "User Testing" from 2025-04-10 to 2025-04-20 color yellow
    point "Approval" at 2025-04-18 shape circle color red
track "Marketing"
  row "Campaign"
    bar "Social Media" from 2025-04-17 to 2025-04-30 color orange
    point "Launch" at 2025-04-25 shape square color green
milestone "Project Start" at 2025-04-10 color blue
milestone "Phase 1 Complete" at 2025-04-25 color red`;

function App() {
  const [dsl, setDSL] = useState(defaultDSL);
  const [timelineData, setTimelineData] = useState(parseTimelineDSL(defaultDSL));
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleDSLChange = (newDSL: string) => {
    setDSL(newDSL);
    try {
      const parsedData = parseTimelineDSL(newDSL);
      setTimelineData(parsedData);
    } catch (error) {
      console.error('Error parsing DSL:', error);
    }
  };

  return (
    <TimelineProvider value={timelineData}>
      <div className="app">
        <header className="app-header">
          <h1>Timeline Visualizer</h1>
          <button 
            className="help-button"
            onClick={() => setIsHelpOpen(true)}
            title="Show Help"
          >
            ?
          </button>
        </header>
        <main className="app-content">
          <SplitView
            left={<Editor value={dsl} onChange={handleDSLChange} />}
            right={<Timeline data={timelineData} />}
          />
        </main>
      </div>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </TimelineProvider>
  );
}

export default App;