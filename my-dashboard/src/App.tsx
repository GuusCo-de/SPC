import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import NewsPublic from './pages/NewsPublic';
import { DashboardContentProvider, useDashboardContent } from './DashboardContentContext';
import DockNav from './components/DockNav';

const AppContent = () => {
  const content = useDashboardContent();
  const loading = (content as any).__loading;
  const [showLoader, setShowLoader] = useState(true); // controls actual visibility
  const [exitAnim, setExitAnim] = useState(false); // triggers fade-out class
  const loadStartRef = useRef<number>(Date.now());

  // Manage minimum display time + fade-out
  useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - loadStartRef.current;
      const remaining = 500 - elapsed; // 500ms min
      const delay = remaining > 0 ? remaining : 0;
      const t = setTimeout(() => {
        setExitAnim(true);
        // remove after fade-out duration (350ms)
        const t2 = setTimeout(() => setShowLoader(false), 360);
        return () => clearTimeout(t2);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [loading]);
  const images = content.backgroundImages;
  const [bgIndex, setBgIndex] = useState(0);

  // Set CSS variables for main color, main-rgb, and main-light for all pages
  useEffect(() => {
    const main = content.mainColor || '#00b894';
    function hexToRgb(hex: string): [number, number, number] {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map((x: string) => x + x).join('');
      const num = parseInt(c, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }
    const [r, g, b] = hexToRgb(main);
    function lighten([r, g, b]: [number, number, number], amt: number = 0.85): [number, number, number] {
      return [
        Math.round(r + (255 - r) * amt),
        Math.round(g + (255 - g) * amt),
        Math.round(b + (255 - b) * amt),
      ];
    }
    const light = lighten([r, g, b]);
    const root = document.documentElement;
    root.style.setProperty('--main', main);
    root.style.setProperty('--main-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--main-light', `rgb(${light[0]}, ${light[1]}, ${light[2]})`);
  }, [content.mainColor]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((i) => (i + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="main-bg">
      {!loading && (
        <div className="bg-slideshow">
          {images.map((img, i) => (
            <img
              key={img}
              src={img}
              alt=""
              className={`bg-slide${i === bgIndex ? " active" : ""}`}
              style={{ zIndex: i === bgIndex ? 1 : 0 }}
            />
          ))}
          <div className="bg-overlay" />
        </div>
      )}
      {showLoader && (
        <div className={`initial-loading${exitAnim ? ' exit' : ''}`}>
          <div className="eight-ball-wrapper">
            <div className="eight-ball">
              <div className="shadow" />
              <div className="circle">
                <div className="window">
                  <div className="number">8</div>
                </div>
              </div>
            </div>
            <div className="loading-text">Laden...</div>
          </div>
        </div>
      )}
      {!loading && (
        <>
          <DockNav />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/nieuws" element={<NewsPublic />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
        </>
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <DashboardContentProvider>
      <AppContent />
    </DashboardContentProvider>
  </Router>
);

export default App;