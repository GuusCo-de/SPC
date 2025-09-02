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
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/news`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted && Array.isArray(data)) {
          // ensure newest first
            setPosts(data.slice().reverse());
        }
      } catch (e: any) {
        if (mounted) setError(e.message || 'Error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ padding: '90px 20px 40px 20px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Nieuws</h1>
      {loading && <div>Laden...</div>}
      {error && <div style={{ color: 'red' }}>Fout: {error}</div>}
      {!loading && !error && <NieuwsFeed posts={posts} />}
    </div>
  );
};

export default NewsPublic;
