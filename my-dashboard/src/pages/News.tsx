import React, { useEffect, useRef, useState } from 'react';
import { useAuth, authHeader } from '../AuthContext';
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
  const { token } = useAuth();
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
  const up = await fetch(`${BACKEND_API_URL}/api/news/upload`, { method: 'POST', headers: { ...authHeader(token) }, body: form });
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
  const res = await fetch(`${BACKEND_API_URL}/api/news`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader(token) }, body: JSON.stringify(payload) });
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
  try { await fetch(`${BACKEND_API_URL}/api/news/${id}`, { method: 'DELETE', headers: { ...authHeader(token) } }); } catch {}
  };

  return (
    <div className="news-editor">
      <div className="news-form-card">
        <h2 className="news-title">Nieuws</h2>
        <form onSubmit={handleSubmit} className="news-form">
          <label className="news-label">Titel
            <input className="news-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Titel" />
          </label>
          <div className="news-toggle-row">
            <span className="news-toggle-label">Groote afbeelding(en)</span>
            <div
              role="switch"
              aria-checked={bigImage}
              tabIndex={0}
              className="toggle"
              data-on={bigImage}
              onClick={() => setBigImage(b => !b)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBigImage(b => !b); } }}
            />
          </div>
          <div className="news-upload" onClick={() => fileInputRef.current?.click()}>
            <div className="news-upload-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4"/><path d="M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>
            </div>
            <div style={{fontSize:'.85rem', fontWeight:600, letterSpacing:'.5px', color:'#334155'}}>Upload {bigImage ? '1 of meer afbeelding(en)' : 'afbeelding'}</div>
            <div style={{fontSize:'.7rem', letterSpacing:'.5px', color:'#64748b'}}>{bigImage ? 'Max 10 bestanden (grote weergave)' : 'Max 1 bestand (thumbnail)'}</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={bigImage}
              onChange={e => {
                const list = e.target.files ? Array.from(e.target.files) : [];
                setImageFiles(list.slice(0, bigImage ? 10 : 1));
              }}
            />
          </div>
          <label className="news-label">Beschrijving
            <div className="news-quill-wrapper">
              <ReactQuill value={description} onChange={setDescription} placeholder="Schrijf hier de beschrijving..." />
            </div>
          </label>
          <div className="news-actions">
            <button disabled={loading} type="submit" className="btn primary">{loading ? 'Toevoegen...' : 'Toevoegen'}</button>
            <button type="button" onClick={resetForm} className="btn subtle">Reset</button>
          </div>
        </form>
      </div>
      <div className="news-posts">
        {posts.length === 0 ? <div className="news-empty">Nog geen nieuwsberichten</div> : posts.map(p => (
          <article key={p.id} className="news-post-card">
            <header className="news-post-head">
              <div className="news-post-meta">
                <h3 className="news-post-title">{p.title}</h3>
                <time className="news-post-time">{p.datetime}</time>
              </div>
              <button onClick={() => removePost(p.id)} className="news-post-delete" aria-label="Verwijderen">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12"/><path d="M16 6v12"/><path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </header>
            <div className="news-post-body" dangerouslySetInnerHTML={{ __html: p.description }} />
            {p.bigImage && p.images && p.images.length ? (
              <div className="news-post-gallery">
                {p.images.map((src, i) => (
                  <img key={i} src={src} alt={`${p.title} ${i+1}`} />
                ))}
              </div>
            ) : (!p.bigImage && p.images && p.images.length ? (
              <img className="news-post-thumb" src={p.images[0]} alt={p.title} />
            ) : null)}
          </article>
        ))}
      </div>
    </div>
  );
};

export default News;
