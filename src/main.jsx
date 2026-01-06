import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found!</div>';
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log('✅ App rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>Error rendering app</h1>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
}


