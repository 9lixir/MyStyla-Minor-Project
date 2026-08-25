import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { API_BASE_URL } from "./config";

const _origFetch = window.fetch;
window.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url ?? "";
  // Only add the header to real API endpoints, NOT to image/static files.
  const isApiCall = url.startsWith(API_BASE_URL) && !url.includes("/processed/") && !url.includes("/uploads/");
  if (isApiCall) {
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