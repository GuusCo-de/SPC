import React from 'react';
import '../index.css';
import Pool3DSection from '../components/Pool3DSection';
import { useDashboardContent } from '../DashboardContentContext';

type Block = { id: string; type: 'heading' | 'text' | 'divider' | 'quote'; text: string };
type Page = { id: string; title: string; path: string; blocks: Block[]; heroTitle?: string; heroSubtitle?: string };
type DashboardContent = {
  heroTitle: string;
  heroSubtitle: string;
  infoTitle: string;
  infoText: string;
  mainColor: string;
  accentColor: string;
  backgroundImages: string[];
  logoText: string;
  navLinks: { label: string; path: string }[];
  pages?: Page[];
};

function renderWithBreaks(text: string) {
  return text?.split('\n').map((line, idx, arr) => (
    <React.Fragment key={idx}>
      {line}
      {idx < arr.length - 1 && <br />}
    </React.Fragment>
  ));
}

function renderBlock(block: Block) {
  if (!block) return null;
  switch (block.type) {
    case 'heading':
      return <h2 key={block.id}>{block.text}</h2>;
    case 'text':
      return <div key={block.id} dangerouslySetInnerHTML={{ __html: block.text }} />;
    case 'divider':
      return <hr key={block.id} />;
    case 'quote':
      return <blockquote key={block.id}>{block.text}</blockquote>;
    default:
      return null;
  }
}

const Home: React.FC = () => {
  const content = useDashboardContent() as DashboardContent;
  // Find the 'Home' page in content.pages
  const homePage = content.pages?.find((p: Page) => p.path === '/' || p.id === 'home');
  const heroTitle = homePage?.heroTitle || content.heroTitle;
  const heroSubtitle = homePage?.heroSubtitle || content.heroSubtitle;
  const blocks = homePage?.blocks || [];
  return (
    <div className="home-wrapper">
      <section className="hero-card">
        <img
          src="/Images/8Ball.png"
          alt="8 Ball"
          className="hero-img"
        />
        <h1>{heroTitle}</h1>
        <p>
          {renderWithBreaks(heroSubtitle)}
          <br />
          <span className="muted">Bar · WiFi · Tournamenten · Pool · Snooker</span>
        </p>
        <a className="cta" href="#info">Meer informatie</a>
      </section>
      <section id="info" className="info-section">
        <div className="info-content">
          <h2>{content.infoTitle}</h2>
          <p>{renderWithBreaks(content.infoText)}</p>
          {/* Render blocks from the Home page inside the same card */}
          {blocks.length > 0 && (
            <div className="home-blocks-list">
              {blocks.map(renderBlock)}
            </div>
          )}
        </div>
      </section>
      <Pool3DSection />
    </div>
  );
};

export default Home;