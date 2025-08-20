import './DockNav.css';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDashboardContent } from '../DashboardContentContext';

const DockNav: React.FC = () => {
  const content = useDashboardContent();
  const [showDock, setShowDock] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation();

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

  useEffect(() => {
    setMobileMenu(false);
  }, [location.pathname]);

  return (
    <div className={`dock-nav${showDock ? ' show' : ' hide'}${mobileMenu ? ' expanded' : ''}`}>
      <div className="dock-header">
        <div className="dock-title">{mobileMenu ? 'Pages:' : content.logoText}</div>
        <button
          className={`dock-hamburger${mobileMenu ? ' open' : ''}`}
          aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileMenu((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {mobileMenu && (
        <div className="dock-links mobile expanded">
          {content.navLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.path}
              onClick={() => setMobileMenu(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DockNav;
