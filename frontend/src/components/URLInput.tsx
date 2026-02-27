import { useState } from 'react';
// Sample article links so user can try the app without finding a URL themselves
const SAMPLE_URLS = [
  'https://www.cnn.com/2026/01/28/india/ajit-pawar-dead-deputy-chief-india-maharashtra-intl',
  'https://www.bbc.com/news/articles/c204626888zo',
  'https://www.bbc.com/travel/article/20260224-the-most-anticipated-new-hiking-trails-of-2026',
];
interface URLInputProps {
  onAnalyze: (url:string) => void; // function to call when user submits a URL
  loading: boolean;                  // disables the form while backend is processing
}
export function URLInput({onAnalyze,loading}:URLInputProps) {
  // Store what user has typed in the input field
  const [url,setUrl]=useState('');
  // When the form is submitted, send the URL up to the parent component
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // prevent page from refreshing on form submit
    if (url.trim()) onAnalyze(url.trim());
  };

  return (
    <div className="url-input-container">
      <form onSubmit={handleSubmit} className="url-form">
        <div className="input-row">
          {/* Text field where user types or pastes an article URL */}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://paste-any-article-url-here"
            className="url-field"
            disabled={loading}
            required
          />
          {/* Submit button — shows animated dots while loading */}
          <button type="submit" disabled={loading || !url.trim()} className="analyze-btn">
            {loading ? (
              <span className="btn-loading">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            ) : (
              'ANALYZE'
            )}
          </button>
        </div>
      </form>

      {/* Sample links the user can click to auto fill the input */}
      <div className="samples">
        <span className="samples-label">try:</span>
        {SAMPLE_URLS.map((u) => (
          <button
            key={u}
            className="sample-btn"
            onClick={() => setUrl(u)}
            disabled={loading}
          >
            {new URL(u).hostname.replace('www.', '')}
          </button>
        ))}
      </div>
    </div>
  );
}