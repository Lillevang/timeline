import React from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>Timeline DSL Guide</h2>
          <button className="help-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="help-modal-content">
          <section>
            <h3>Basic Structure</h3>
            <p>The Timeline DSL (Domain Specific Language) allows you to create timeline visualizations using a simple text-based format. Each line defines a track, row, or timeline element.</p>
          </section>

          <section>
            <h3>Elements</h3>
            
            <h4>Tracks</h4>
            <p>Define a track with a name</p>
            <pre>track "Track Name"</pre>

            <h4>Rows</h4>
            <p>Define a row within a track:</p>
            <pre>row "Row Name"</pre>
            <p>You can hide the row name by adding <code>hidden</code>:</p>
            <pre>row "Row Name" hidden</pre>

            <h4>Bars</h4>
            <p>Create a bar with start and end dates:</p>
            <pre>bar "Bar Name" from 2024-01-01 to 2024-01-14 color blue</pre>
            <p>Additional options:</p>
            <ul>
              <li>Text position: <code>text left|right|top|bottom|center</code></li>
              <li>Label: <code>label "%duration"</code> or <code>label "Custom Text"</code></li>
            </ul>

            <h4>Points</h4>
            <p>Create a point at a specific date:</p>
            <pre>point "Point Name" at 2024-01-14 color red shape circle</pre>
            <p>Available shapes: circle, square, triangle, triangle-down</p>
            <p>Additional options:</p>
            <ul>
              <li>Text position: <code>text left|right|top|bottom|center</code></li>
              <li>Label: <code>label "%date"</code> or <code>label "Custom Text"</code></li>
            </ul>

            <h4>Milestones</h4>
            <p>Create a milestone at a specific date:</p>
            <pre>milestone "Milestone Name" at 2024-01-14 color blue</pre>
          </section>

          <section>
            <h3>Special Features</h3>
            
            <h4>Labels</h4>
            <p>Special tokens for labels:</p>
            <ul>
              <li><code>%date</code>: Shows the date in "dd MMM" format (e.g., "14 Apr")</li>
              <li><code>%duration</code>: Shows the duration in days for bars (e.g., "14d")</li>
            </ul>

            <h4>Text Positioning</h4>
            <p>Control where text appears relative to the element:</p>
            <ul>
              <li><code>text left</code>: Text appears to the left</li>
              <li><code>text right</code>: Text appears to the right</li>
              <li><code>text top</code>: Text appears above</li>
              <li><code>text bottom</code>: Text appears below</li>
              <li><code>text center</code>: Text appears centered</li>
            </ul>
          </section>

          <section>
            <h3>Example</h3>
            <pre>{`track "Project Timeline" color blue
row "Development"
bar "Sprint 1" from 2024-01-01 to 2024-01-14 color blue label "%duration"
point "Release" at 2024-01-14 shape triangle-down color red label "%date"
milestone "Launch" at 2024-01-14 color green`}</pre>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpModal; 