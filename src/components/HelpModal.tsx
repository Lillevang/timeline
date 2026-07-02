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
          <h2>Timeline DSL Reference</h2>
          <button className="help-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="help-modal-content">

          <section>
            <h3>Basic structure</h3>
            <pre>{`# Comments start with #
window from 2025-01-01 to 2025-12-31

track "Track Name"
  row "Row Name"
    bar "Bar Name" from 2025-01-01 to 2025-03-31 color blue
    point "Event" at 2025-02-01 shape circle color red
  row "Hidden Row" hidden
    bar "Internal" from 2025-01-01 to 2025-06-30 color gray

milestone "Launch" at 2025-06-01 color green`}</pre>
            <p>
              <code>window</code> pins the x-axis to a fixed date range instead of auto-fitting to your data.
              Comments (<code>#</code>) are ignored by the parser.
            </p>
          </section>

          <section>
            <h3>Elements</h3>

            <h4>Bars</h4>
            <pre>{`bar "Name" from YYYY-MM-DD to YYYY-MM-DD color COLOR
bar "With label" from 2025-01-01 to 2025-03-31 color blue label "%duration"
bar "Left text" from 2025-01-01 to 2025-03-31 color green text left`}</pre>
            <p>Options (in order after the date range):</p>
            <ul>
              <li><code>color COLOR</code> — required</li>
              <li><code>text left|right|top|bottom|center</code> — label position (default: center)</li>
              <li><code>label "..."</code> — secondary label; supports <code>%date</code> and <code>%duration</code> tokens</li>
            </ul>

            <h4>Points</h4>
            <pre>{`point "Name" at YYYY-MM-DD color COLOR
point "Name" at YYYY-MM-DD shape circle color red
point "Name" at YYYY-MM-DD shape triangle-down color blue text right label "%date"`}</pre>
            <p>
              <strong>Note:</strong> <code>shape</code> must come before <code>color</code>. Available shapes:{' '}
              <code>triangle</code> (default), <code>triangle-down</code>, <code>circle</code>, <code>square</code>.
            </p>
            <p>Options (in order after the date):</p>
            <ul>
              <li><code>shape SHAPE</code> — optional, defaults to <code>triangle</code></li>
              <li><code>color COLOR</code> — required</li>
              <li><code>text left|right|top|bottom|center</code> — label position (default: above)</li>
              <li><code>label "..."</code> — secondary label</li>
            </ul>

            <h4>Recurring points</h4>
            <pre>{`recurring point "Name" weekly from YYYY-MM-DD to YYYY-MM-DD color blue
recurring point "Name" monthly from YYYY-MM-DD to YYYY-MM-DD shape square color red`}</pre>
            <p>
              <strong>Note:</strong> <code>shape</code> must come before <code>color</code>.
              Available frequencies: <code>daily</code>, <code>weekly</code>, <code>monthly</code>, <code>yearly</code>.
            </p>

            <h4>Milestones</h4>
            <pre>{`milestone "Name" at YYYY-MM-DD color blue`}</pre>
            <p>Milestones render as a vertical dashed line across all tracks. <code>color</code> is optional and defaults to blue.</p>
          </section>

          <section>
            <h3>Label tokens</h3>
            <ul>
              <li><code>%date</code> — the element's date in short format, e.g. <code>14 Apr</code> (bars show their start date)</li>
              <li><code>%duration</code> — duration in days for bars, e.g. <code>90d</code></li>
            </ul>
          </section>

          <section>
            <h3>Available colors</h3>
            <p>
              <code>blue</code> · <code>lightblue</code> · <code>green</code> · <code>lightgreen</code> ·{' '}
              <code>yellow</code> · <code>orange</code> · <code>red</code> · <code>purple</code> ·{' '}
              <code>pink</code> · <code>cyan</code> · <code>teal</code> · <code>indigo</code> ·{' '}
              <code>violet</code> · <code>lime</code> · <code>gray</code>
            </p>
            <p>
              Any element that takes <code>color</code> also accepts a hex value for custom
              (e.g. brand) colors: <code>bar "API" from 2025-01-01 to 2025-02-01 color #1c7ed6</code>.
              Both <code>#rgb</code> and <code>#rrggbb</code> forms work.
            </p>
          </section>

          <section>
            <h3>Sharing</h3>
            <p>
              Your timeline lives entirely in the URL (the <code>#d=…</code> fragment), so
              copying the address bar is already a share. The <strong>Share</strong> button
              additionally mints a stable short link (<code>s.lvang.dev/…</code>) and copies it
              to your clipboard. Sharing again from the same browser <em>updates</em> the same
              short link, so a link you've sent around always shows the latest version.
            </p>
          </section>

          <section>
            <h3>Full example</h3>
            <pre>{`# Q2 roadmap
window from 2025-04-01 to 2025-06-30

track "Engineering"
  row "Backend"
    bar "API v2" from 2025-04-01 to 2025-05-15 color blue label "%duration"
    point "Deploy" at 2025-05-15 shape triangle-down color red
  row "Frontend"
    bar "Dashboard" from 2025-04-15 to 2025-06-01 color indigo
    recurring point "Sync" weekly from 2025-04-15 to 2025-06-01 shape circle color gray

track "Design"
  row "UX"
    bar "Research" from 2025-04-01 to 2025-04-30 color teal label "%date"

milestone "Beta" at 2025-05-15 color orange
milestone "Launch" at 2025-06-20 color green`}</pre>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpModal;
