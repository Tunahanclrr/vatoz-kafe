import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Eski/bozuk service worker'ları temizle ve yeni temizleme worker'ını kaydet
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Kayıt başarısız olursa sorun değil, sadece eski worker'ları temizledik
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
