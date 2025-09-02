import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const defaultContent = {
  heroTitle: 'Snooker Pool Centrum',
  heroSubtitle: 'Enjoy a modern pool lounge, specialty drinks, and a vibrant social scene.',
  infoTitle: 'About Our Cafe',
  infoText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  mainColor: '#00b894',
  accentColor: '#232526',
  backgroundImages: [
    'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/bc/33/4e/getlstd-property-photo.jpg?w=1200&h=-1&s=1',
    'https://images.socialdeal.nl/bedrijf/pool-cafe-hart-van-utrecht-19062608564682.jpg',
    'https://m-en.bredastudentapp.com/uploads/image/5c8252172a5ab06d94dfcd1e-large.jpg',
  ],
  logoText: 'SPC - Snooker Pool Centrum',
  navLinks: [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
  { label: 'Contact', path: '/contact' },
  { label: 'Nieuws', path: '/nieuws' },
  ],
};

function safeContent(raw: any) {
  const c = { ...defaultContent, ...raw };
  if (!Array.isArray(c.backgroundImages)) c.backgroundImages = [...defaultContent.backgroundImages];
  if (!Array.isArray(c.navLinks)) c.navLinks = [...defaultContent.navLinks];
  return c;
}

const DashboardContentContext = createContext(defaultContent);

export function useDashboardContent() {
  return useContext(DashboardContentContext);
}

// Backend API URL (change here for all backend requests)
const BACKEND_API_URL = 'https://spc-8hcz.onrender.com';

export const DashboardContentProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/dashboard-content`);
        if (!res.ok) throw new Error('Failed to fetch dashboard content');
        const data = await res.json();
        // The backend returns { content, history }, we want .content
        setContent(safeContent(data.content));
      } catch {
        setContent(defaultContent);
      }
    }
    fetchContent();
  }, []);

  return (
    <DashboardContentContext.Provider value={content}>
      {children}
    </DashboardContentContext.Provider>
  );
};
