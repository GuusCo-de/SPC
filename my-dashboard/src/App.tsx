import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import NewsPublic from './pages/NewsPublic';
import Rules from './pages/Rules';
import RulesAdmin from './pages/RulesAdmin';
import { DashboardContentProvider, useDashboardContent } from './DashboardContentContext';
import DockNav from './components/DockNav';

const AppContent = () => {
  const content = useDashboardContent();
  const loading = (content as any).__loading;
  const [showLoader, setShowLoader] = useState(true); // controls actual visibility
  const [exitAnim, setExitAnim] = useState(false); // triggers fade-out class
  const loadStartRef = useRef<number>(Date.now());
  const [progress, setProgress] = useState(0); // 0 - 100 cue fill
  const [progressStage, setProgressStage] = useState<'breathing' | 'retract' | 'shoot' | 'done'>('breathing');

  // Handle sequence after real loading completes: wait min time, retract to 60, then shoot to 100
  useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - loadStartRef.current;
  const remaining = 1500 - elapsed; // 1500ms minimum display
      const delay = remaining > 0 ? remaining : 0;
      const t = setTimeout(() => {
        // Retract phase
        setProgressStage('retract');
        setProgress(60);
        // After retract, shoot
        const tShoot = setTimeout(() => {
          setProgressStage('shoot');
          // quick shoot to 100
          setProgress(100);
          // Fade out slightly after shoot reaches end
          const tFade = setTimeout(() => {
            setExitAnim(true);
            const tDone = setTimeout(() => { setShowLoader(false); setProgressStage('done'); }, 360);
            return () => clearTimeout(tDone);
          }, 300);
          return () => clearTimeout(tFade);
        }, 250);
        return () => clearTimeout(tShoot);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Breathing motion (50% - 80%) while loading; stops when retract begins
  useEffect(() => {
    if (!showLoader || exitAnim || progressStage !== 'breathing') return;
    let raf: number;
  const base = 70; // midpoint (range target 50-90)
  const amp = 20; // amplitude (base ± amp => 50 to 90)
    const start = performance.now();
    const step = (now: number) => {
      const t = (now - start) / 1000; // seconds
      const value = base + Math.sin(t * 2) * amp; // 2Hz-ish breathing
      // Only update if still in breathing stage and loading
      if (progressStage === 'breathing' && loading) setProgress(value);
      if (showLoader && !exitAnim && progressStage === 'breathing') raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [loading, showLoader, exitAnim, progressStage]);
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
          <div className="cue-progress-track" aria-label="Laden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className="cue-progress" style={{ width: `${progress}%` }} />
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
              <Route path="/spelregels" element={<Rules />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/rules" element={<RulesAdmin />} />
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