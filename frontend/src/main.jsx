import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL } from "./config";

// ngrok free tier shows an interstitial HTML page unless this header is present.
// Inject it on every request to our backend so responses come back as real JSON.
const _origFetch = window.fetch;
window.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url ?? "";
  if (url.startsWith(API_BASE_URL)) {
    init = {
      ...init,
      headers: { ...(init.headers || {}), "ngrok-skip-browser-warning": "true" },
    };
  }
  return _origFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)