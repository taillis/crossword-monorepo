import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Auto-Update 100% automático e silencioso (sem popups)
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl?: string, r?: ServiceWorkerRegistration) {
    if (r) {
      // Checa por novidades a cada 60 segundos
      setInterval(() => {
        r.update();
      }, 60 * 1000);

      // Checa por atualizações ao reabrir o app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          r.update();
        }
      });
    }
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
