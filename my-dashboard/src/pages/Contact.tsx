import React, { useRef, useState } from 'react';
import './Contact.css';

const Contact: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setShowInfo((v) => {
      const next = !v;
      // Scroll after state update and animation
      if (!v) {
        setTimeout(() => {
          infoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400); // Wait for expand animation to start
      }
      return next;
    });
  };

  return (
    <div className="contact-page">
      <div className="contact-card">
  <h1>Contact</h1>
        <form className="contact-form" onSubmit={e => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="name">Naam</label>
            <input id="name" name="name" type="text" required placeholder="Uw naam" />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required placeholder="uw@email.com" />
          </div>
          <div className="form-group">
            <label htmlFor="message">Bericht</label>
            <textarea id="message" name="message" rows={5} required placeholder="Hoe kunnen wij u helpen?" />
          </div>
          <button type="submit" className="contact-btn">Verstuur bericht</button>
        </form>
        <button
          className="toggle-info-btn"
          onClick={handleToggle}
          aria-expanded={showInfo}
          aria-controls="contact-info"
        >
          {showInfo ? '−' : '+'}
        </button>
        <div
          id="contact-info"
          ref={infoRef}
          className={`contact-info${showInfo ? ' show' : ''}`}
        >
          <h2>Of neem contact op via:</h2>
          <p>E-mail: <a href="mailto:spccapelle010@gmail.com">spccapelle010@gmail.com</a></p>
          <p>Telefoon: <a href="tel:+31104585733">010-4585733</a></p>
          <p>Adres: Marsdiep 2, 2904 ES Capelle a/d IJssel</p>
        </div>
      </div>
    </div>
  );
};

export default Contact;