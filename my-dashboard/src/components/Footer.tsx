import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDashboardContent } from '../DashboardContentContext';
import './Footer.css';

const Footer: React.FC = () => {
  const loc = useLocation();
  const content: any = useDashboardContent();
  if (loc.pathname.startsWith('/dashboard')) return null; // never show on dashboard

  const main: string = content?.mainColor || '#0b5bd7';
  const opening = Array.isArray(content.opening) ? content.opening : [];
  const rates = Array.isArray(content.rates) ? content.rates : [];
  function hexToRgb(hex: string){
    let c = hex.replace('#','');
    if(c.length===3) c = c.split('').map(x=>x+x).join('');
    const n = parseInt(c,16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }
  const {r,g,b} = hexToRgb(main);
  // Perceptual luma approximation
  const luma = 0.299*r + 0.587*g + 0.114*b;
  const isLightBg = luma > 155; // threshold where we switch to dark text / dark logo
  // Select logo: light (square) logo for dark backgrounds, dark logo for light backgrounds
  const logoSrc = isLightBg ? '/guuscode-logo-dark.png' : '/Images/LogoSquare.png';
  const footerClass = `site-footer ${isLightBg ? 'on-light' : 'on-dark'}`;

  return (
  <footer className={footerClass} role="contentinfo">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>{content.logoText?.split(' - ')[0] || 'SPC Capelle'}</h4>
          <address>{(content.address || '').replace(', ', '<br/>')}</address>
          {content.email && <p className="contact-row"><span>Email:</span> <a href={`mailto:${content.email}`}>{content.email}</a></p>}
          {content.tel && <p className="contact-row"><span>Tel:</span> <a href={`tel:${content.tel.replace(/[^+\d]/g,'')}`}>{content.tel}</a></p>}
          {content.kvk && <p className="contact-row"><span>KvK:</span> {content.kvk}</p>}
          {content.payment && <p className="contact-row"><span>Betaling:</span> {content.payment}</p>}
        </div>
        <div className="footer-col">
          <h5>Tafel Tarieven</h5>
          <ul className="rates-list">
            {rates.map((r: any) => <li key={r.label}><span>{r.label}</span><strong>{r.price}</strong></li>)}
          </ul>
        </div>
        <div className="footer-col">
          <h5>Openingstijden</h5>
          <ul className="open-list">
            {opening.map((o: any) => <li key={o.d}><span>{o.d}</span><strong>{o.v}</strong></li>)}
          </ul>
        </div>
      </div>
      <div className="footer-base">
        <span>© {new Date().getFullYear()} SPC Capelle</span>
        <span className="sep" aria-hidden="true">•</span>
        <span>Site door <a href="https://guusco.de/" target="_blank" rel="noopener" className="guuscode-link">GuusCode</a></span>
        <a href="https://guusco.de/" target="_blank" rel="noopener" className="footer-logo-link push-right" aria-label="GuusCode website">
          <img src={logoSrc} alt="GuusCode" className="footer-logo" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
