import { useEffect, useState } from 'react';
import SplitView from './components/SplitView';
import Editor from './components/Editor';
import Timeline from './components/Timeline';
import { parseTimelineDSL, ParseResult } from './utils/parser';
import { TimelineProvider } from './context/TimelineContext';
import HelpModal from './components/HelpModal';
import { encodeDSL, decodeDSL, readDSLFromHash, writeDSLToHash, shareTimeline } from './utils/share';
import './App.css';

// Where shared links point. Overridable so a dev build can mint links to the
// deployed app (the shortener's allowlist won't accept localhost targets).
const PUBLIC_BASE_URL: string | undefined = import.meta.env.VITE_PUBLIC_BASE_URL;

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

const STORAGE_KEY = 'timeline-dsl';

function loadInitialDSL(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultDSL;
  } catch {
    return defaultDSL;
  }
}

function App() {
  const [dsl, setDSL] = useState(loadInitialDSL);
  const [parseResult, setParseResult] = useState<ParseResult>(() => parseTimelineDSL(loadInitialDSL()));
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'copied' | 'done' | 'error'>('idle');
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [shareErrorMsg, setShareErrorMsg] = useState<string | null>(null);

  const handleShare = async () => {
    if (shareState === 'sharing') return;
    setShareState('sharing');
    setShareErrorMsg(null);
    try {
      const payload = await encodeDSL(dsl);
      writeDSLToHash(payload);
      const base = PUBLIC_BASE_URL || `${location.origin}${location.pathname}`;
      const target = `${base.replace(/#.*$/, '')}#d=${payload}`;
      const { shortUrl: url } = await shareTimeline(target);
      setShortUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setShareState('copied');
      } catch {
        setShareState('done'); // clipboard unavailable — the link is still shown
      }
      setTimeout(() => setShareState('idle'), 2500);
    } catch (error) {
      setShareErrorMsg(error instanceof Error ? error.message : 'share failed');
      setShareState('error');
    }
  };

  const handleDSLChange = (newDSL: string) => {
    setDSL(newDSL);
    setParseResult(parseTimelineDSL(newDSL));
  };

  // Hydrate from the URL fragment (#d=...) — a shared link wins over localStorage
  useEffect(() => {
    const payload = readDSLFromHash();
    if (!payload) return;
    decodeDSL(payload)
      .then(text => {
        setDSL(text);
        setParseResult(parseTimelineDSL(text));
      })
      .catch(() => {
        console.warn('Could not decode timeline from URL fragment; falling back to saved/default DSL');
      });
  }, []);

  // Persist to localStorage and the URL fragment (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, dsl);
      } catch {
        // Storage full or unavailable — the URL fragment still works
      }
      encodeDSL(dsl).then(writeDSLToHash).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [dsl]);

  return (
    <TimelineProvider value={parseResult.data}>
      <div className="app">
        <header className="app-header">
          <h1>Timeline Visualizer</h1>
          <div className="header-actions">
            {shareState === 'error' && (
              <span className="share-error" title={shareErrorMsg ?? undefined}>
                Share failed{shareErrorMsg ? `: ${shareErrorMsg}` : ''}
              </span>
            )}
            {shortUrl && shareState !== 'error' && (
              <a className="share-link" href={shortUrl} target="_blank" rel="noreferrer">
                {shortUrl.replace(/^https?:\/\//, '')}
              </a>
            )}
            <button
              className={`share-button ${shareState}`}
              onClick={handleShare}
              disabled={shareState === 'sharing'}
              title="Create or update a stable short link to this timeline"
            >
              {shareState === 'sharing' ? 'Sharing…'
                : shareState === 'copied' ? 'Copied!'
                : shareState === 'done' ? 'Link ready'
                : 'Share'}
            </button>
            <button
              className="help-button"
              onClick={() => setIsHelpOpen(true)}
              title="Show Help"
            >
              ?
            </button>
          </div>
        </header>
        <main className="app-content">
          <SplitView
            left={<Editor value={dsl} onChange={handleDSLChange} errors={parseResult.errors} />}
            right={<Timeline data={parseResult.data} />}
          />
        </main>
      </div>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </TimelineProvider>
  );
}

export default App;
