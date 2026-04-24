import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// ─── Root Element ───────────────────────────────────────────────────────────
const root = document.getElementById('root');

if (!root) {
    document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;
                font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;
                flex-direction:column;gap:12px;padding:24px;text-align:center;">
      <div style="font-size:48px;">😵</div>
      <h1 style="font-size:20px;margin:0;">Something went wrong</h1>
      <p style="font-size:14px;color:#94a3b8;margin:0;">
        Could not find the root element. Please refresh the page.
      </p>
      <button onclick="location.reload()"
              style="margin-top:8px;padding:10px 24px;border:none;border-radius:8px;
                     background:linear-gradient(135deg,#8b5cf6,#ec4899);color:white;
                     font-size:14px;cursor:pointer;font-weight:600;">
        Refresh Page
      </button>
    </div>
  `;
    throw new Error('[App] Root element #root not found in DOM');
}

// ─── Global Error Handlers ─────────────────────────────────────────────────
window.addEventListener('error', (event) => {
    console.error('[App] Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[App] Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// ─── Performance Mark (Dev Only) ────────────────────────────────────────────
if (import.meta.env.DEV) {
    performance.mark('app-init-start');
    console.log(
        '%c🎵 PrivMITLab Music Player %c v1.0.0 ',
        'background:linear-gradient(135deg,#8b5cf6,#ec4899);color:white;padding:4px 8px;border-radius:4px 0 0 4px;font-weight:bold;',
        'background:#1e293b;color:#e2e8f0;padding:4px 8px;border-radius:0 4px 4px 0;',
    );
}

// ─── Preconnect to Critical Domains ─────────────────────────────────────────
const PRECONNECT_ORIGINS = [
    'https://www.youtube.com',
    'https://i.scdn.co',
    'https://yt3.googleusercontent.com',
];

PRECONNECT_ORIGINS.forEach((origin) => {
    if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }
});

// ─── Render ─────────────────────────────────────────────────────────────────
const rootElement = createRoot(root);

rootElement.render(
    <StrictMode>
        <App />
    </StrictMode>,
);

// ─── Register Service Worker ────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });
            console.log('[SW] Registered:', registration.scope);

            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data?.type === 'KEEP_ALIVE_ACK') {
                    // SW is alive — good
                }
            });
        } catch (error) {
            console.warn('[SW] Registration failed:', error);
        }
    });
}

// ─── Dev Performance Log ────────────────────────────────────────────────────
if (import.meta.env.DEV) {
    requestAnimationFrame(() => {
        performance.mark('app-init-end');
        performance.measure('app-init', 'app-init-start', 'app-init-end');
        const measure = performance.getEntriesByName('app-init')[0];
        if (measure) {
            console.log(`[App] Init time: ${Math.round(measure.duration)}ms`);
        }
    });
}