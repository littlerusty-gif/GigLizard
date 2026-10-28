import { analytics } from '@heycatch/sdk';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';

// Ensure window.fetch has a setter if sandboxed environment made it getter-only
if (typeof window !== 'undefined' && window.fetch) {
  try {
    let currentFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get() { return currentFetch; },
      set(fn) { currentFetch = fn; },
      configurable: true,
      enumerable: true,
    });
  } catch (_) {}
}

try {
  analytics.init({
    projectKey: 'hck_pk_vYte28EY2OYwgTW9mqPV5-I41Q4w-ygw',
    install: {
      framework: 'vite-react',
      frameworkVersion: '19',
      agent: 'other',
    },
  });
} catch (err) {
  console.warn('[HeyCatch] Analytics init notice:', err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
);
