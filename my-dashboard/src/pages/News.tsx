import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Use same backend URL as dashboard content file (duplicated here to avoid circular import)
const BACKEND_API_URL = 'https://spc-8hcz.onrender.com';

export type NewsPost = {
  id: string;
  title: string;
  description: string; // HTML
  images?: string[];
  bigImage?: boolean;
  datetime: string;
};

const News: React.FC = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [bigImage, setBigImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/news`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && Array.isArray(data)) setPosts(data.slice().reverse());
      } catch (e) {
        console.warn('Failed loading news', e);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageFiles([]);
    setBigImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    let uploaded: string[] = [];
    if (imageFiles.length) {
      try {
        const form = new FormData();
        imageFiles.forEach(f => form.append('images', f));
        const up = await fetch(`${BACKEND_API_URL}/api/news/upload`, { method: 'POST', body: form });
        if (up.ok) {
          const body = await up.json();
            uploaded = Array.isArray(body.urls) ? body.urls.map((u: string) => u.startsWith('http') ? u : `${BACKEND_API_URL}${u}`) : [];
        }
      } catch (err) {
        console.warn('Upload failed', err);
      }
    }
    const now = new Date();
    const payload: NewsPost = {
      id: Math.random().toString(36).slice(2,9)+Date.now(),
      title: title.trim(),
      description,
      images: uploaded.length ? uploaded : undefined,
      bigImage,
      datetime: now.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    };
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/news`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const created = await res.json();
        setPosts(ps => [created, ...ps]);
      } else {
        setPosts(ps => [payload, ...ps]);
      }
    } catch {
      setPosts(ps => [payload, ...ps]);
    }
    resetForm();
    setLoading(false);
  };

  const removePost = async (id: string) => {
    setPosts(ps => ps.filter(p => p.id !== id));
    try { await fetch(`${BACKEND_API_URL}/api/news/${id}`, { method: 'DELETE' }); } catch {}
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Nieuws</h2>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 6px 24px #00000011', maxWidth: 900, marginBottom: 32 }}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Titel
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Titel" style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 8, border: '1px solid #ddd' }} />
        </label>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="radio" name="imgSize" checked={!bigImage} onChange={() => setBigImage(false)} /> Klein
          </label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="radio" name="imgSize" checked={bigImage} onChange={() => setBigImage(true)} /> Groot (volle breedte / meerdere)
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 16 }}>
          Afbeeldingen uploaden {bigImage ? '(meerdere mogelijk)' : '(één)'}
          <input ref={fileInputRef} type="file" accept="image/*" multiple={bigImage} onChange={e => {
            const list = e.target.files ? Array.from(e.target.files) : [];
            setImageFiles(list.slice(0, bigImage ? 10 : 1));
          }} style={{ width: '100%', marginTop: 6 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>
          Beschrijving
          <div style={{ marginTop: 6 }}>
            <ReactQuill value={description} onChange={setDescription} />
          </div>
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <button disabled={loading} type="submit" style={{ background: 'var(--main,#00b894)', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: 10, fontWeight: 600 }}>{loading ? 'Toevoegen...' : 'Toevoegen'}</button>
          <button type="button" onClick={resetForm} style={{ background: '#eee', border: 'none', padding: '0.6rem 1.4rem', borderRadius: 10 }}>Reset</button>
        </div>
      </form>
      <div style={{ maxWidth: 900 }}>
        {posts.length === 0 ? <div style={{ color: '#666', fontStyle: 'italic' }}>Nog geen nieuwsberichten</div> : posts.map(p => (
          <div key={p.id} style={{ background: '#f8fafc', padding: 16, borderRadius: 16, boxShadow: '0 2px 12px #00000011', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px 0' }}>{p.title}</h3>
                <div style={{ fontSize: 12, color: '#777' }}>{p.datetime}</div>
                <div style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: p.description }} />
                {p.bigImage && p.images && p.images.length ? (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {p.images.map((src, i) => (
                      <img key={i} src={src} alt={`${p.title} ${i+1}`} style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
                    ))}
                  </div>
                ) : (!p.bigImage && p.images && p.images.length ? (
                  <img src={p.images[0]} alt={p.title} style={{ width: 160, height: 110, objectFit: 'cover', borderRadius: 12, marginTop: 12 }} />
                ) : null)}
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => removePost(p.id)} style={{ background: '#ffcdd2', color: '#c62828', border: 'none', padding: '0.4rem 0.9rem', borderRadius: 8 }}>Verwijderen</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;
