import React, { useEffect, useState } from 'react';
import '../pages/Dashboard.css';

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

  useEffect(()=>{ (async()=>{
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/rules`);
      const data = await res.json();
      setRules(Array.isArray(data)? data : []);
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
      {editing && (
        <div className="dashboard-section-card" style={{border:'2px solid var(--main)'}}>
          <h2>{editing.id.startsWith('tmp-')? 'Nieuwe spelregel' : 'Bewerk spelregel'}</h2>
          <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
            <label> Titel<input value={editing.title} onChange={e=>updateField('title', e.target.value)} required /></label>
            <label> Type<select value={editing.type} onChange={e=>updateField('type', e.target.value)}>{TYPES.map(t=> <option key={t}>{t}</option>)}</select></label>
            <label> Korte beschrijving<textarea value={editing.shortDescription} onChange={e=>updateField('shortDescription', e.target.value)} /></label>
            <label style={{display:'flex', gap:8, alignItems:'center'}}> Zichtbaar <input type="checkbox" checked={editing.enabled} onChange={e=>updateField('enabled', e.target.checked)} /></label>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:28, marginTop:24}}>
            {(['details','rules','tips'] as const).map(section => (
              <div key={section}>
                <h3 style={{margin:'0 0 8px'}}>{section === 'details' ? 'Uitleg paragrafen' : section === 'rules' ? 'Regels (bullets)' : 'Tips'}</h3>
                {editing[section].map((val, idx) => (
                  <div key={idx} style={{display:'flex', gap:8, marginBottom:8}}>
                    <textarea style={{flex:1}} value={val} onChange={e=>updateArray(section, idx, e.target.value)} />
                    <button type="button" onClick={()=>removeArrayItem(section, idx)} className="btn subtle" aria-label="Verwijderen">×</button>
                  </div>
                ))}
                <button type="button" onClick={()=>addArrayItem(section)}>+ Voeg toe</button>
              </div>
            ))}
          </div>
          <div style={{marginTop:24, display:'flex', gap:12, flexWrap:'wrap'}}>
            <button onClick={saveRule} className="btn primary">Gereed</button>
            <button onClick={cancelEdit} className="btn subtle">Annuleren</button>
          </div>
        </div>
      )}
      <div style={{display:'grid', gap:18, gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))'}}>
        {rules.map((r,i) => (
          <div key={r.id} className="dashboard-page-card" style={{opacity: r.enabled?1:0.55}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
              <strong>{r.title}</strong>
              <label style={{display:'flex', alignItems:'center', gap:4, fontSize:12}}>Zichtbaar <input type="checkbox" checked={r.enabled} onChange={()=>toggleEnabled(r.id)} /></label>
            </div>
            <div style={{fontSize:'.75rem', fontWeight:600, letterSpacing:'.08em', color:'var(--main)'}}>{r.type}</div>
            <p style={{margin:'4px 0 8px', fontSize:'.85rem', lineHeight:1.4}}>{r.shortDescription}</p>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              <button onClick={()=>startEdit(r)} className="btn primary" style={{margin:0}}>Bewerk</button>
              <button onClick={()=>handleDuplicate(r.id)} className="btn subtle" style={{margin:0}}>Dupliceer</button>
              <button onClick={()=>handleDelete(r.id)} className="btn danger" style={{margin:0}}>Verwijder</button>
            </div>
            <div style={{fontSize:10, opacity:.6, marginTop:6}}>Volgorde: {i}</div>
          </div>
        ))}
        {!rules.length && <div>Geen spelregels opgeslagen.</div>}
      </div>
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
