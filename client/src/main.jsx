import React from 'react';
import { createRoot } from 'react-dom/client';

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
const root = createRoot(document.getElementById('root'));

if (demoMode) {
  import('./DemoApp').then(({ default: DemoApp }) => {
    root.render(<React.StrictMode><DemoApp /></React.StrictMode>);
  });
} else {
  Promise.all([import('react-router-dom'), import('./App'), import('./style.css')]).then(([router, app]) => {
    const BrowserRouter = router.BrowserRouter;
    const App = app.default;
    root.render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>);
  });
}
