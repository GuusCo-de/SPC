import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import { DashboardContentProvider, useDashboardContent } from './DashboardContentContext';

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

  // Dock hide/show on scroll
  const [showDock, setShowDock] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY;
          if (curr < 32) {
            setShowDock(true);
          } else if (curr > lastScroll && curr > 80) {
            setShowDock(false);
          } else if (curr < lastScroll) {
            setShowDock(true);
          }
          setLastScroll(curr);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line
  }, [lastScroll]);

  // Mobile dropdown state
  const [mobileMenu, setMobileMenu] = useState(false);
  // Responsive check
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMobileMenu(false);
    // eslint-disable-next-line
  }, [window.location.pathname]);

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
      <div
        className={`dock-nav${showDock ? ' show' : ' hide'}${isMobile ? ' mobile' : ''}${mobileMenu ? ' expanded' : ''}`}
      >
        <div className="dock-header">
          <div className="dock-title">{isMobile && mobileMenu ? 'Pages:' : content.logoText}</div>
          {isMobile && (
            <button
              className={`dock-hamburger${mobileMenu ? ' open' : ''}`}
              aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenu((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          )}
        </div>
        {(!isMobile || (isMobile && mobileMenu)) && (
          <div className={`dock-links${isMobile ? ' mobile' : ''}${mobileMenu ? ' expanded' : ''}`}>
            {content.navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                onClick={() => { if (isMobile) setMobileMenu(false); }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
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