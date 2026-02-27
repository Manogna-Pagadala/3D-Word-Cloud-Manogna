import { useAnalyze } from './hooks/useAnalyze';
import { URLInput } from './components/URLInput';
import { Scene } from './components/Scene';
import './styles.css';

// One color per topic — matches the colors used in the word cloud
const TOPIC_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffd93d',
  '#a29bfe',
  '#fd79a8',
  '#55efc4',
  '#fdcb6e',
];

export default function App() {
  // Get the data, loading state, error, and analyze function from our custom hook
  const { data, loading, error, analyze } = useAnalyze();

  return (
    <div className="app">
      {/* Top header bar with logo and URL input */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
  <span className="logo-bracket">[ </span>
  <span className="logo-text">3D </span>
  <span className="logo-word">WORD </span>
  <span className="logo-cloud">CLOUD</span>
  <span className="logo-bracket"> ]</span>
</div>
          <URLInput onAnalyze={analyze} loading={loading} />
        </div>
      </header>

      <main className="main">
        {/* Show this when the user hasn't analyzed anything yet */}
        {!data && !loading && !error && (
          <div className="empty-state">
            <div className="empty-glow" />
            <p className="empty-text">
              paste an article URL above<br />
              <span className="empty-sub">and watch it come alive</span>
            </p>
          </div>
        )}

        {/* Show this while waiting for the backend to respond */}
        {loading && (
          <div className="loading-state">
            <div className="loading-ring" />
            <p className="loading-text">crawling · extracting · modeling</p>
          </div>
        )}

        {/* Show this if something went wrong */}
        {error && (
          <div className="error-state">
            <span className="error-icon">⚠</span>
            <p className="error-text">{error}</p>
          </div>
        )}

        {/* Show the 3D word cloud once we have data */}
        {data && !loading && (
          <>
            {/* The 3D canvas takes up the full screen */}
            <div className="canvas-wrapper">
              <Scene words={data.words} />
            </div>

            {/* Info panel in the bottom left showing article title and topics */}
            <div className="info-panel">
              {data.article_title && (
                <p className="article-title">{data.article_title}</p>
              )}
              <p className="word-count">{data.words.length} keywords extracted</p>

              {/* Show each topic with its color dot and top words */}
              {data.topics.some((t) => t.length > 0) && (
                <div className="topics-list">
                  {data.topics.map((topic, i) =>
                    topic.length > 0 ? (
                      <div key={i} className="topic-row">
                        <span
                          className="topic-dot"
                          style={{ background: TOPIC_COLORS[i % TOPIC_COLORS.length] }}
                        />
                        <span className="topic-words">{topic.slice(0, 4).join(' · ')}</span>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              <p className="hint">drag to rotate · scroll to zoom</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}