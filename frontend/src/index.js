// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ScraperProvider } from './context/ScraperContext';
import './styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ScraperProvider>
      <App />
    </ScraperProvider>
  </React.StrictMode>
);
