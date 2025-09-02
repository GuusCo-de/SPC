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
    <div style={{ padding: '90px 20px 60px 20px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: 40, padding: '48px clamp(16px,4vw,56px)', boxShadow: '0 24px 60px -10px #00000025, 0 4px 12px #00000018' }}>
          <h1 style={{ textAlign: 'center', margin: 0, fontSize: 'clamp(2rem,5vw,3rem)', background: 'linear-gradient(90deg,var(--main,#00b894),#232526)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Nieuws</h1>
          <p style={{ textAlign: 'center', marginTop: 8, marginBottom: 32, color: '#444', fontSize: 18 }}>Blijf op de hoogte van het laatste nieuws.</p>
          {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: '#555' }}>Laden...</div>}
          {!loading && !error && posts.length === 0 && (
            <div style={{ textAlign: 'center', color: '#777', fontStyle: 'italic' }}>Nog geen nieuwsberichten</div>
          )}
          {error && (
            <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 12, margin: '0 auto 24px', maxWidth: 640, fontSize: 14 }}>
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
