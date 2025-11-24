import React from 'react';
import ReactDOM from 'react-dom/client';
import { v4 as uuidv4 } from 'uuid';
import App from './App';
import './index.css';
import { getAnonId, setAnonId } from './lib/storage';

// Initialize anonymous ID with multi-tier storage BEFORE rendering the app
// This ensures the ID is available when the app makes its first API call
(async () => {
  let anonId = await getAnonId();
  
  if (!anonId) {
    // Generate new ID if none exists
    anonId = uuidv4();
    await setAnonId(anonId);
  }
  
  // Ensure it's available synchronously for API calls
  if (!localStorage.getItem('anonId')) {
    localStorage.setItem('anonId', anonId);
  }
  
  // Register service worker for PWA support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
  
  // Now that the ID is ready, render the app
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();

