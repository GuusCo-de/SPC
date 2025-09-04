import React, { useRef, useState, useEffect } from 'react';
import { useDashboardContent } from '../DashboardContentContext';

interface OpeningItem { d: string; v: string; }
interface RateItem { label: string; price: string; }

interface SettingsProps {
  content: any;
  setContent: React.Dispatch<React.SetStateAction<any>>;
}

const Settings: React.FC<SettingsProps> = ({ content, setContent }) => {
  // Fallback to context if props not passed (defensive)
  const ctx = useDashboardContent();
  const data = content || ctx;
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const colorBtnRef = useRef<HTMLButtonElement|null>(null);
  const [showColorPopup, setShowColorPopup] = useState(false);

  useEffect(()=>{
    function onDoc(e:MouseEvent){
      if(showColorPopup){
        if(!colorBtnRef.current) return setShowColorPopup(false);
        const pop = document.querySelector('.settings-color-popup');
        if(pop && (pop.contains(e.target as Node) || colorBtnRef.current.contains(e.target as Node))) return;
        setShowColorPopup(false);
      }
    }
    document.addEventListener('mousedown',onDoc);
    return ()=>document.removeEventListener('mousedown',onDoc);
  },[showColorPopup]);

  function update<K extends keyof typeof data>(key: K, value: (typeof data)[K]) {
    setContent((prev: any) => ({ ...prev, [key]: value }));
  }
  // Opening times handlers
  const opening: OpeningItem[] = Array.isArray(data.opening) ? data.opening : [];
  function updateOpening(i: number, value: Partial<OpeningItem>) {
    update('opening', opening.map((o, idx) => idx === i ? { ...o, ...value } : o));
  }
  function addOpening() { update('opening', [...opening, { d: 'Dag', v: '00:00 – 00:00' }]); }
  function removeOpening(i: number) { update('opening', opening.filter((_, idx) => idx !== i)); }
  // Rates handlers
  const rates: RateItem[] = Array.isArray(data.rates) ? data.rates : [];
  function updateRate(i: number, value: Partial<RateItem>) {
    update('rates', rates.map((r, idx) => idx === i ? { ...r, ...value } : r));
  }
  function addRate() { update('rates', [...rates, { label: 'Nieuw', price: '€0' }]); }
  function removeRate(i: number) { update('rates', rates.filter((_, idx) => idx !== i)); }

  function handleBgFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = files.map(f => URL.createObjectURL(f));
    update('backgroundImages', [...(data.backgroundImages||[]), ...urls]);
    e.target.value = '';
  }
  function removeBg(i: number) {
    const imgs = [...(data.backgroundImages||[])];
    imgs.splice(i,1);
    update('backgroundImages', imgs);
  }

  return (
    <div style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1060 }}>
      <h2 style={{marginTop:0}}>Instellingen</h2>
      <p style={{marginTop:0}}>Beheer thema, achtergrondafbeeldingen, openingstijden, tarieven en contactgegevens.</p>

      <section style={{marginTop:'2rem'}}>
        <h3 style={{margin:'0 0 .75rem'}}>Site Basis</h3>
        <div style={{display:'flex',flexWrap:'wrap',gap:20}}>
          <label style={{display:'flex',flexDirection:'column',gap:4, flex:'1 1 220px', minWidth:220}}>
            <span>Koptekst (logo tekst)</span>
            <input value={data.logoText || ''} maxLength={32} onChange={e=>update('logoText', e.target.value)} />
          </label>
          <div style={{display:'flex',flexDirection:'column',gap:4,width:160,position:'relative'}}>
            <span>Thema kleur</span>
            <button
              ref={colorBtnRef}
              type="button"
              onClick={()=>setShowColorPopup(s=>!s)}
              style={{height:42, border:'1px solid #2e3b47', background:data.mainColor, borderRadius:10, cursor:'pointer', position:'relative'}}
              aria-haspopup="dialog"
              aria-expanded={showColorPopup}
              aria-label="Kies thema kleur"
            >
              <span style={{position:'absolute',inset:0,borderRadius:10,boxShadow:'inset 0 0 0 2px #ffffff22'}}></span>
            </button>
            {showColorPopup && (
              <div className="settings-color-popup" style={{position:'absolute',top:'100%',marginTop:8,zIndex:60,background:'#1d2731',border:'1px solid #2d3a45',borderRadius:12,padding:14,width:240,boxShadow:'0 10px 28px -6px rgba(0,0,0,.45)'}}>
                <h4 style={{margin:'0 0 8px',fontSize:13,fontWeight:600,letterSpacing:.5,textTransform:'uppercase',opacity:.75}}>Palette</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
                  {['#00b894','#0b5bd7','#ff9800','#ef4444','#8e44ad','#16a085','#2c3e50','#e91e63','#9c27b0','#3f51b5','#4caf50','#795548'].map(c=> (
                    <button key={c} onClick={()=>{update('mainColor', c); setShowColorPopup(false);}} style={{width:30,height:30,background:c,border:'none',borderRadius:8,cursor:'pointer',boxShadow:c===data.mainColor?'0 0 0 3px #fff inset,0 0 0 1px #000':'0 0 0 1px #0005'}} aria-label={`Kies ${c}`}></button>
                  ))}
                </div>
                <div style={{marginTop:12, display:'flex',flexDirection:'column',gap:6}}>
                  <label style={{display:'flex',flexDirection:'column',fontSize:12,gap:4}}>
                    <span style={{opacity:.8}}>Custom Hex</span>
                    <input value={data.mainColor} onChange={e=>update('mainColor', e.target.value)} style={{background:'#111a22',border:'1px solid #324150',padding:'6px 8px',borderRadius:8,color:'#fff',fontFamily:'monospace'}} />
                  </label>
                  <input type="color" value={data.mainColor} onChange={e=>update('mainColor', e.target.value)} style={{height:34,border:'none',padding:0,background:'transparent',cursor:'pointer'}} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{marginTop:'2rem'}}>
        <h3 style={{margin:'0 0 .75rem'}}>Achtergrondafbeeldingen</h3>
        <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
          {(data.backgroundImages||[]).map((img: string, i: number) => (
            <div key={i} style={{position:'relative'}}>
              <img src={img} alt="bg" style={{width:160,height:100,objectFit:'cover',borderRadius:6,boxShadow:'0 2px 6px rgba(0,0,0,.25)'}} />
              <button type="button" onClick={()=>removeBg(i)} aria-label="Verwijderen" style={{position:'absolute',top:4,right:4,background:'#0009',color:'#fff',border:'none',borderRadius:4,padding:'2px 6px',cursor:'pointer'}}>×</button>
              {img.startsWith('blob:') && <div style={{position:'absolute',left:0,right:0,bottom:0,fontSize:10,background:'#0008',color:'#fff',padding:'2px 4px',borderRadius:'0 0 6px 6px',textAlign:'center'}}>tijdelijk</div>}
            </div>
          ))}
          <button type="button" onClick={()=>fileInputRef.current?.click()} style={{width:160,height:100,display:'flex',alignItems:'center',justifyContent:'center',border:'2px dashed #888',borderRadius:6,cursor:'pointer',background:'transparent'}}>+ Toevoegen</button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleBgFiles} />
        </div>
        <p style={{marginTop:8,fontSize:12,opacity:.65}}>Nieuwe afbeeldingen worden bij Opslaan geüpload.</p>
      </section>

      <section style={{marginTop:'2.5rem'}}>
        <h3 style={{margin:'0 0 .75rem'}}>Openingstijden</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {opening.map((o,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
              <input value={o.d} onChange={e=>updateOpening(i,{d:e.target.value})} style={{flex:'0 0 130px'}} />
              <input value={o.v} onChange={e=>updateOpening(i,{v:e.target.value})} style={{flex:1}} />
              <button type="button" onClick={()=>removeOpening(i)} aria-label="Verwijderen" style={{padding:'4px 8px'}}>×</button>
            </div>
          ))}
          <button type="button" onClick={addOpening} style={{alignSelf:'flex-start'}}>+ Regel toevoegen</button>
        </div>
      </section>

      <section style={{marginTop:'2.5rem'}}>
        <h3 style={{margin:'0 0 .75rem'}}>Tafel Tarieven</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {rates.map((r,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
              <input value={r.label} onChange={e=>updateRate(i,{label:e.target.value})} style={{flex:'0 0 200px'}} />
              <input value={r.price} onChange={e=>updateRate(i,{price:e.target.value})} style={{flex:1}} />
              <button type="button" onClick={()=>removeRate(i)} aria-label="Verwijderen" style={{padding:'4px 8px'}}>×</button>
            </div>
          ))}
          <button type="button" onClick={addRate} style={{alignSelf:'flex-start'}}>+ Tarief toevoegen</button>
        </div>
      </section>

      <section style={{marginTop:'2.5rem'}}>
        <h3 style={{margin:'0 0 .75rem'}}>Contact & Bedrijf</h3>
        <div style={{display:'flex',flexDirection:'column',gap:10,maxWidth:700}}>
          <label style={{display:'flex',flexDirection:'column',gap:4}}>
            <span>Adres</span>
            <input value={data.address||''} onChange={e=>update('address', e.target.value)} />
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:4}}>
            <span>Email</span>
            <input value={data.email||''} onChange={e=>update('email', e.target.value)} />
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:4}}>
            <span>Telefoon</span>
            <input value={data.tel||''} onChange={e=>update('tel', e.target.value)} />
          </label>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <label style={{display:'flex',flexDirection:'column',gap:4,flex:'1 1 180px'}}>
              <span>KvK</span>
              <input value={data.kvk||''} onChange={e=>update('kvk', e.target.value)} />
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:4,flex:'1 1 180px'}}>
              <span>Betaling</span>
              <input value={data.payment||''} onChange={e=>update('payment', e.target.value)} />
            </label>
          </div>
        </div>
      </section>

      <p style={{marginTop:'2.5rem',fontSize:12,opacity:.65}}>Gebruik de hoofdbalk Opslaan knop om wijzigingen permanent op te slaan.</p>
    </div>
  );
};

export default Settings;