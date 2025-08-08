import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Log app initialization
console.log('🚀 Scholar AI App Initializing...');
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_ENV:', import.meta.env.VITE_ENV);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 