import React, { useEffect, useState } from 'react';
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
      {/* Background slideshow */}
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