
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Garantindo que o elemento root existe antes da montagem
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Erro crítico: Elemento #root não encontrado no DOM.");
} else {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
