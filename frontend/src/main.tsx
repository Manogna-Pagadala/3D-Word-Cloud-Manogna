import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This is the entry point of the app
// It mounts the React app into the div with id="root" in index.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);