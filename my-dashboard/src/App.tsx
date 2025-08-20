import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import { DashboardContentProvider, useDashboardContent } from './DashboardContentContext';
import DockNav from './components/DockNav';

const AppContent = () => {
  const content = useDashboardContent();
  const images = content.backgroundImages;
  const [bgIndex, setBgIndex] = useState(0);

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