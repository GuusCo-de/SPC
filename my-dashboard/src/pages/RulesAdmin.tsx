import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import '../pages/Dashboard.css';
import { GAMES_FALLBACK } from './Rules';

type GameRule = {
  id: string;
  title: string;
  type: string;
  shortDescription: string;
  details: string[];
  rules: string[];
  tips: string[];
  enabled: boolean;
  order: number;
};

const DEFAULT_RULE: GameRule = {
  id: '',
  title: '',
  type: 'Pool',
  shortDescription: '',
  details: [''],
  rules: [''],
  tips: [''],
  enabled: true,
  order: 0,
};

const TYPES = ['Pool','Snooker','Carambole','Gezelschap'];

const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_URL || 'https://spc-8hcz.onrender.com').replace(/\/$/, '');

const RulesAdmin: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const [rules, setRules] = useState<GameRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<GameRule | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GameRule | null>(null);

  useEffect(()=>{ (async()=>{
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/rules`);
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        setRules(data);
      } else {
        // Seed from fallback (map public schema -> admin schema)
        const seeded = GAMES_FALLBACK.map((g, idx) => ({
          id: g.id,
          title: g.titel,
          type: g.type,
          shortDescription: g.korteBeschrijving,
            details: g.details || [''],
            rules: g.regels || [''],
            tips: g.tips || [''],
            enabled: g.enabled !== false,
            order: idx,
        }));
        setRules(seeded);
      }
    } catch {
      // On error also seed fallback
      const seeded = GAMES_FALLBACK.map((g, idx) => ({
        id: g.id,
        title: g.titel,
        type: g.type,
        shortDescription: g.korteBeschrijving,
        details: g.details || [''],
        rules: g.regels || [''],
        tips: g.tips || [''],
        enabled: g.enabled !== false,
        order: idx,
      }));
      setRules(seeded);
    } finally { setLoading(false); }
  })(); },[]);

  const startNew = () => setEditing({ ...DEFAULT_RULE, id: 'tmp-'+Date.now() });
  const startEdit = (r: GameRule) => setEditing(JSON.parse(JSON.stringify(r)));
  const cancelEdit = () => setEditing(null);

  const updateField = (field: keyof GameRule, value: any) => setEditing(e => e ? { ...e, [field]: value } : e);
  const updateArray = (field: 'details'|'rules'|'tips', idx: number, value: string) => setEditing(e => {
    if (!e) return e;
    const arr = [...e[field]];
    arr[idx] = value;
    return { ...e, [field]: arr };
  });
  const addArrayItem = (field: 'details'|'rules'|'tips') => setEditing(e => e ? { ...e, [field]: [...e[field], ''] } : e);
  const removeArrayItem = (field: 'details'|'rules'|'tips', idx:number) => setEditing(e => {
    if (!e) return e; const arr=[...e[field]]; arr.splice(idx,1); return { ...e, [field]: arr.length?arr:[''] };
  });

  const toggleEnabled = (id: string) => setRules(rs => rs.map(r => r.id===id? { ...r, enabled: !r.enabled }: r));
  const handleDuplicate = (id:string) => setRules(rs => {
    const r = rs.find(x=>x.id===id); if(!r) return rs;
    const copy = { ...r, id: r.id+'-copy-'+Date.now(), title: r.title + ' (kopie)', order: (r.order||0)+0.01 };
    return [...rs, copy].sort((a,b)=>(a.order||0)-(b.order||0));
  });
  const handleDelete = (id:string) => setRules(rs => rs.filter(r=>r.id!==id));

  const saveRule = () => {
    if (!editing) return;
    setRules(rs => {
      const exists = rs.some(r=>r.id===editing.id);
      const cleaned: GameRule = {
        ...editing,
        details: editing.details.filter(d=>d.trim()),
        rules: editing.rules.filter(d=>d.trim()),
        tips: editing.tips.filter(d=>d.trim()),
      };
      return exists ? rs.map(r=> r.id===editing.id ? cleaned : r) : [...rs, cleaned];
    });
    setEditing(null);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const ordered = rules.map((r,i)=> ({ ...r, order: i }));
      setRules(ordered);
      await fetch(`${BACKEND_API_URL}/api/rules`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(ordered) });
    } finally { setSaving(false); }
  };

  if (loading) return embedded ? <div style={{padding:24}}>Laden...</div> : <div className="dashboard-root"><header className="home"><div className="header-spacer"/><h1>Spelregels</h1><div className="header-spacer"/></header><div style={{padding:32}}>Laden...</div></div>;

  const editorBlock = (
    <>
      <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom:24}}>
        <button onClick={startNew}>Nieuwe regelset</button>
        <button onClick={saveAll} disabled={saving}>{saving? 'Opslaan...' : 'Alles opslaan'}</button>
      </div>
      {editing && ReactDOM.createPortal(
        <div className="dashboard-modal-overlay" role="dialog" aria-modal="true" aria-label="Spelregel Bewerken" onClick={cancelEdit}>
          <div className="dashboard-modal rule-edit-modal" onClick={e=>e.stopPropagation()}>
            <button className="dashboard-modal-close" aria-label="Sluiten" onClick={cancelEdit}>×</button>
            <div className="dashboard-modal-header rule-edit-header">
              <div className="rule-edit-topbar">
                <select className="rule-type-select" value={editing.type} onChange={e=>updateField('type', e.target.value)} aria-label="Type">
                  {TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
                </select>
                <label className="rule-visible-toggle">
                  <input type="checkbox" checked={editing.enabled} onChange={e=>updateField('enabled', e.target.checked)} aria-label="Zichtbaar" />
                  <span className="rule-toggle-slider" aria-hidden="true"></span>
                  <span className="rule-toggle-text">{editing.enabled ? 'Zichtbaar' : 'Verborgen'}</span>
                </label>
              </div>
              <div className="rule-title-wrap">
                <label className="rule-title-label">Titel
                  <input className="rule-title-input" value={editing.title} onChange={e=>updateField('title', e.target.value)} placeholder="Titel van spelvariant" required />
                </label>
              </div>
              <label className="rule-shortdesc-label">Korte beschrijving
                <textarea className="rule-shortdesc-input" value={editing.shortDescription} onChange={e=>updateField('shortDescription', e.target.value)} placeholder="Korte teaser / samenvatting" />
              </label>
            </div>
            <div className="dashboard-modal-body rule-modal-body">
              {(['details','rules','tips'] as const).map(section => (
                <div className="rule-section-block" key={section}>
                  <h3>{section === 'details' ? 'Uitleg paragrafen' : section === 'rules' ? 'Regels (bullets)' : 'Tips'}</h3>
                  {editing[section].map((val, idx) => (
                    <div key={idx} className="rule-array-row">
                      <textarea value={val} onChange={e=>updateArray(section, idx, e.target.value)} />
                      <button type="button" onClick={()=>removeArrayItem(section, idx)} className="btn subtle" aria-label="Verwijderen">×</button>
                    </div>
                  ))}
                  <button type="button" className="btn subtle" onClick={()=>addArrayItem(section)}>+ Voeg {section === 'rules' ? 'regel' : section === 'details' ? 'paragraaf' : 'tip'} toe</button>
                </div>
              ))}
            </div>
            <div className="dashboard-modal-footer">
              <button onClick={cancelEdit} className="btn subtle">Annuleren</button>
              <button onClick={saveRule} className="btn primary">Opslaan</button>
            </div>
          </div>
  </div>, document.body)}
      <div style={{display:'grid', gap:22, gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
        {rules.map(r => (
          <div key={r.id} className="dashboard-page-card" style={{padding:'18px 18px 16px', opacity:r.enabled?1:.55}}>
            <div className="rule-card-top">
              <div style={{flex:1,minWidth:0}}>
                <p className="rule-card-title" title={r.title}>{r.title}</p>
                <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
                  <span className="rule-card-type">{r.type}</span>
                  <label className="rule-small-toggle">
                    <input type="checkbox" checked={r.enabled} onChange={()=>toggleEnabled(r.id)} />
                    <span className="slider"></span>
                    <span>{r.enabled? 'AAN':'UIT'}</span>
                  </label>
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'row', gap:8}}>
                <button className="rule-icon-btn" title="Bewerken" onClick={()=>startEdit(r)} aria-label={`Bewerk ${r.title}`}>
                  <img src="/icons/edit.svg" alt="" width={20} height={20} loading="lazy" />
                </button>
                <button className="rule-icon-btn" title="Dupliceer" onClick={()=>handleDuplicate(r.id)} aria-label={`Dupliceer ${r.title}`}>
                  <img src="/icons/duplicate.svg" alt="" width={20} height={20} loading="lazy" />
                </button>
                <button className="rule-icon-btn" title="Verwijder" onClick={()=>setConfirmDelete(r)} aria-label={`Verwijder ${r.title}`}>
                  <img src="/icons/delete.svg" alt="" width={20} height={20} loading="lazy" />
                </button>
              </div>
            </div>
            {r.shortDescription && <p className="rule-card-desc">{r.shortDescription}</p>}
          </div>
        ))}
        {!rules.length && <div>Geen spelregels opgeslagen.</div>}
      </div>
      {confirmDelete && ReactDOM.createPortal(
        <div className="dashboard-confirm-overlay" role="alertdialog" aria-modal="true" aria-label="Bevestig verwijderen" onClick={()=>setConfirmDelete(null)}>
          <div className="dashboard-confirm-box" onClick={e=>e.stopPropagation()}>
            <h3>Verwijder spelregel?</h3>
            <p style={{margin:0, lineHeight:1.5}}>Weet je zeker dat je <strong>{confirmDelete.title}</strong> wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.</p>
            <div className="dashboard-confirm-actions">
              <button className="btn subtle" onClick={()=>setConfirmDelete(null)}>Annuleren</button>
              <button className="btn danger" onClick={()=>{ handleDelete(confirmDelete.id); setConfirmDelete(null); }}>Verwijder</button>
            </div>
          </div>
        </div>, document.body)}
    </>
  );

  if (embedded) return editorBlock;

  return (
    <div className="dashboard-root">
      <header className="home">
        <div className="header-spacer" />
        <h1>Spelregels Beheer</h1>
        <div className="header-spacer" />
      </header>
      <div>
        {editorBlock}
      </div>
    </div>
  );
};

export default RulesAdmin;
