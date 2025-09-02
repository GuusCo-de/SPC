import './DockNav.css';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDashboardContent } from '../DashboardContentContext';

const DockNav: React.FC = () => {
  const content = useDashboardContent();
  const [showDock, setShowDock] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false); // whether menu content is mounted
  const [closing, setClosing] = useState(false); // animate retract phase
  const closeTimer = useRef<number | null>(null);
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
    // Close menu on route change with animation
    if (mobileMenu) handleClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current); }, []);

  const handleOpen = () => {
    if (closing) {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      setClosing(false);
    }
    setMobileMenu(true);
  };
  const handleClose = () => {
    if (!mobileMenu || closing) return;
    setClosing(true);
    // Duration should match CSS close animation (380ms container height + slight buffer)
    closeTimer.current = window.setTimeout(() => {
      setMobileMenu(false);
      setClosing(false);
    }, 400);
  };
  const toggleMenu = () => {
    if (mobileMenu && !closing) {
      handleClose();
    } else if (!mobileMenu) {
      handleOpen();
    }
  };

  const navClass = `dock-nav${showDock ? ' show' : ' hide'}${mobileMenu && !closing ? ' expanded' : ''}${closing ? ' closing' : ''}`;
  return (
    <>
    {mobileMenu && <div className={`dock-screen-overlay${closing ? ' closing' : ''}`} onClick={handleClose} />}
    <div className={navClass}>
      <div className="dock-header">
        <div className="dock-title">{mobileMenu ? 'Pagina\'s:' : content.logoText}</div>
        <button
          className={`dock-hamburger${mobileMenu && !closing ? ' open' : ''}`}
          aria-label={mobileMenu ? 'Sluit menu' : 'Open menu'}
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {mobileMenu && (
        <div className={`dock-links mobile expanded${closing ? ' closing' : ''}`}>
          {content.navLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.path}
              onClick={handleClose}
              style={{ animationDelay: `${Math.min(idx * 60, 600)}ms` }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default DockNav;
