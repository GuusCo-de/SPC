import React, { useEffect, useState } from 'react';
import NieuwsFeed from './NieuwsFeed';
import type { PublicNewsPost } from './NieuwsFeed';

const BACKEND_API_URL = 'https://spc-8hcz.onrender.com';

const NewsPublic: React.FC = () => {
  const [posts, setPosts] = useState<PublicNewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/news`);
        if (res.status === 404) {
          // Endpoint not deployed yet – treat as empty list, no scary error
            if (mounted) setPosts([]);
        } else if (!res.ok) {
          throw new Error(res.status + ' ' + res.statusText);
        } else {
          const data = await res.json();
          if (mounted && Array.isArray(data)) setPosts(data.slice().reverse());
        }
      } catch (e: any) {
        // Fallback: try same-origin (useful if backend served through same domain in prod)
        try {
          const alt = await fetch('/api/news');
          if (alt.ok) {
            const data = await alt.json();
            if (mounted && Array.isArray(data)) {
              setPosts(data.slice().reverse());
              setLoading(false);
              return;
            }
          } else if (alt.status === 404) {
            if (mounted) setPosts([]);
          } else {
            throw new Error(alt.status + ' ' + alt.statusText);
          }
        } catch (e2: any) {
          if (mounted) setError(e2?.message || e?.message || 'Netwerk fout');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ padding: '92px clamp(10px,4vw,36px) 72px clamp(10px,4vw,36px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 'min(42px,10vw)', padding: 'clamp(28px,5vw,56px) clamp(16px,4.2vw,60px)', boxShadow: '0 18px 52px -8px #0003, 0 3px 14px #0002' }}>
          <h1 style={{ textAlign: 'center', margin: 0, fontSize: 'clamp(2.1rem,6vw,3.2rem)', background: 'linear-gradient(90deg,var(--main,#00b894),#232526)', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '.5px' }}>Nieuws</h1>
          <p style={{ textAlign: 'center', marginTop: 10, marginBottom: 'clamp(22px,4vw,40px)', color: '#444', fontSize: 'clamp(15px,2.6vw,18px)', lineHeight: 1.4 }}>Blijf op de hoogte van het laatste nieuws.</p>
          {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: '#555', fontSize: 'clamp(15px,2.8vw,18px)' }}>Laden...</div>}
          {!loading && !error && posts.length === 0 && (
            <div style={{ textAlign: 'center', color: '#777', fontStyle: 'italic', fontSize: 'clamp(14px,2.8vw,17px)' }}>Nog geen nieuwsberichten</div>
          )}
          {error && (
            <div style={{ background: '#ffebee', color: '#c62828', padding: '12px 16px', borderRadius: 14, margin: '0 auto 28px', maxWidth: 680, fontSize: 'clamp(13px,2.8vw,15px)' }}>
              Kon nieuws niet laden ({error}). Controleer of de backend (nieuws endpoints) gedeployed is.
            </div>
          )}
          {!loading && !error && posts.length > 0 && <NieuwsFeed posts={posts} />}
        </div>
      </div>
    </div>
  );
};

export default NewsPublic;
