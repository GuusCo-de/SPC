import React, { useState, useEffect, useRef } from 'react';
import RulesAdmin from './RulesAdmin';
import News from './News';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult, DraggableProvided, DroppableProvided } from 'react-beautiful-dnd';
import "./Dashboard.css";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Add these constants after imports, before the Dashboard component:
const THEME_COLORS = ['#232526', '#fff', '#00b894', '#7de2fc', '#e6e600'];
const DEFAULT_COLORS = ['#000', '#b0bec5', '#fff', '#f48fb1', '#c62828', '#ff9800', '#ffc107', '#69f0ae', '#00bcd4', '#2196f3', '#3f51b5', '#9c27b0'];

// --- Types ---
type NavLink = { label: string; path: string };
type Block = { id: string; type: 'heading' | 'text' | 'divider' | 'quote'; text: string };
type Page = { id: string; title: string; path: string; blocks: Block[]; heroTitle?: string; heroSubtitle?: string };

type VersionMeta = {
  version: string; // e.g. '1', '2', '2.1', '2.2'
  timestamp: number;
  name?: string;
  note?: string;
};

type MenuItem = {
  id: string;
  name: string;
  price: string;
  category: string;
  description?: string;
};

type DashboardContent = {
  heroTitle: string;
  heroSubtitle: string;
  infoTitle: string;
  infoText: string;
  mainColor: string;
  accentColor: string;
  backgroundImages: string[];
  logoText: string;
  navLinks: NavLink[];
  pages: Page[];
  menu?: MenuItem[];
  __versionMeta?: VersionMeta;
};
// --- MenuPanel Component ---
const MENU_CATEGORIES = ['Food', 'Drinks', 'Snacks', 'Cocktails', 'Desserts', 'Other'];
const MENU_CATEGORY_LABELS: Record<string,string> = {
  Food: 'Eten',
  Drinks: 'Dranken',
  Snacks: 'Snacks',
  Cocktails: 'Cocktails',
  Desserts: 'Nagerechten',
  Other: 'Overig'
};

function MenuPanel({ menu, onChange, mainColor, accentColor, hideTitle }: {
  menu: MenuItem[];
  onChange: (menu: MenuItem[]) => void;
  mainColor: string;
  accentColor: string;
  hideTitle?: boolean;
}) {
  const [addFields, setAddFields] = React.useState<Partial<MenuItem>>({ category: MENU_CATEGORIES[0] });
  const [addPopup, setAddPopup] = React.useState<string | null>(null); // category or null
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editFields, setEditFields] = React.useState<Partial<MenuItem>>({});
  const [selected, setSelected] = React.useState<string[]>([]);
  const [confirmRemove, setConfirmRemove] = React.useState<{ id?: string; multi?: boolean } | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Group items by category
  const grouped: { [cat: string]: MenuItem[] } = {};
  menu.forEach(item => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  // Add item (popup)
  const openAddPopup = (cat: string) => {
    setAddFields({ category: cat });
    setAddPopup(cat);
  };
  const closeAddPopup = () => {
    setAddPopup(null);
    setAddFields({ category: addPopup || MENU_CATEGORIES[0] });
  };
  const handleAddPopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFields.name || !addFields.price || !addFields.category) return;
    const newItem: MenuItem = {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      name: addFields.name,
      price: addFields.price,
      category: addFields.category,
      description: addFields.description || '',
    };
    onChange([...menu, newItem]);
    setAddPopup(null);
    setAddFields({ category: addFields.category });
  };

  // Backend API URL (prefers Vite env var, then localhost during dev, else production URL)
  // NOTE: When using a temporary blob fallback image the upload failed; those images are NOT persisted.
  const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_URL || 'https://spc-8hcz.onrender.com').replace(/\/$/, '');

  // Save menu to backend
  const saveMenu = async () => {
    setSaving(true);
    try {
      // Save to backend using /api/dashboard-content
      const res = await fetch(`${BACKEND_API_URL}/api/dashboard-content`);
      const data = await res.json();
      const content = data.content;
      const history = data.history || [];
      const updated = { ...content, menu };
      await fetch(`${BACKEND_API_URL}/api/dashboard-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updated, history }),
      });
    } finally {
      setSaving(false);
    }
  };

  // Edit item
  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditFields({ ...item });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditFields(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFields.name || !editFields.price || !editFields.category) return;
    onChange(menu.map(item => item.id === editingId ? { ...item, ...editFields } : item));
    setEditingId(null);
    setEditFields({});
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditFields({});
  };

  // Remove item(s)
  const handleRemove = (id: string) => setConfirmRemove({ id });
  const handleRemoveSelected = () => setConfirmRemove({ multi: true });
  const confirmRemoveAction = () => {
    if (confirmRemove?.multi) {
      onChange(menu.filter(item => !selected.includes(item.id)));
      setSelected([]);
    } else if (confirmRemove?.id) {
      onChange(menu.filter(item => item.id !== confirmRemove.id));
      setSelected(selected.filter(id => id !== confirmRemove.id));
    }
    setConfirmRemove(null);
  };

  // Select item
  const toggleSelect = (id: string) => {
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  };

  // Price input: only allow numbers and dot, auto-add € on display
  const priceDisplay = (price: string) => price ? `€${parseFloat(price).toFixed(2)}` : '';

  return (
    <div className="menu-editor" data-color={mainColor}>
  {!hideTitle && <h2 className="menu-editor-title">Menu Editor</h2>}
      <div className="menu-categories">
        {MENU_CATEGORIES.map(cat => (
          <div key={cat} className="menu-category">
            <div className="menu-category-header">
              <span className="menu-category-name">{MENU_CATEGORY_LABELS[cat] || cat}</span>
              <button onClick={() => openAddPopup(cat)} className="menu-add-item-btn modern" title={`Voeg toe aan ${MENU_CATEGORY_LABELS[cat] || cat}`}> <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg> <span className="visually-hidden">Voeg toe</span></button>
            </div>
            <div className="menu-items">
              {grouped[cat]?.length ? (
                grouped[cat].map(item => (
                  <div key={item.id} className={`menu-item${selected.includes(item.id) ? ' selected' : ''}`}>
                    <input type="checkbox" checked={!!selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="menu-item-select" aria-label="Selecteer gerecht" />
                    {editingId === item.id ? (
                      <form onSubmit={handleEditSave} className="menu-item-edit-form">
                        <input name="name" value={editFields.name || ''} onChange={handleEditChange} required placeholder="Naam" />
                        <input name="price" value={editFields.price || ''} onChange={e => handleEditChange({ ...e, target: { ...e.target, value: e.target.value.replace(/[^\d.]/g, '') } })} required placeholder="Prijs" />
                        <input name="description" value={editFields.description || ''} onChange={handleEditChange} placeholder="Beschrijving" />
                        <div className="menu-item-edit-actions">
                          <button type="submit" className="btn primary">Opslaan</button>
                          <button type="button" onClick={handleEditCancel} className="btn subtle">Annuleren</button>
                        </div>
                      </form>
                    ) : (
                      <div className="menu-item-inner">
                        <div className="menu-item-main">
                          <div className="menu-item-name">{item.name}</div>
                          <div className="menu-item-price">{priceDisplay(item.price)}</div>
                        </div>
                        {item.description && <div className="menu-item-desc">{item.description}</div>}
                        <div className="menu-item-actions">
                          <button onClick={() => startEdit(item)} className="btn subtle">Edit</button>
                          <button onClick={() => handleRemove(item.id)} className="btn danger subtle">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="menu-empty">Geen items</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="menu-selected-bar">
          <button onClick={handleRemoveSelected} className="btn danger">Verwijder geselecteerde ({selected.length})</button>
        </div>
      )}
      <div className="menu-save-bar">
        <button onClick={saveMenu} disabled={saving} className="btn primary large">
          {saving ? 'Bezig met opslaan...' : 'Opslaan'}
        </button>
      </div>
      {addPopup && (
        <div className="menu-popup-overlay" role="dialog" aria-modal="true">
          <form onSubmit={handleAddPopupSubmit} className="menu-popup">
            <h3>Toevoegen aan {addPopup}</h3>
            <input name="name" value={addFields.name || ''} onChange={e => setAddFields(f => ({ ...f, name: e.target.value }))} placeholder="Naam" required autoFocus />
            <input name="price" value={addFields.price || ''} onChange={e => { const val = e.target.value.replace(/[^\d.]/g, ''); setAddFields(f => ({ ...f, price: val })); }} placeholder="Prijs" required />
            <input name="description" value={addFields.description || ''} onChange={e => setAddFields(f => ({ ...f, description: e.target.value }))} placeholder="Beschrijving" />
            <div className="menu-popup-actions">
              <button type="submit" className="btn primary">Toevoegen</button>
              <button type="button" onClick={closeAddPopup} className="btn subtle">Annuleren</button>
            </div>
          </form>
        </div>
      )}
      {confirmRemove && (
        <div className="menu-popup-overlay" role="alertdialog" aria-modal="true">
          <div className="menu-popup">
            <h3>Bevestig verwijderen</h3>
            <p>Weet je zeker dat je {confirmRemove.multi ? 'alle geselecteerde items' : 'dit item'} wilt verwijderen?</p>
            <div className="menu-popup-actions">
              <button onClick={confirmRemoveAction} className="btn danger">Ja, verwijderen</button>
              <button onClick={() => setConfirmRemove(null)} className="btn subtle">Annuleren</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now();
}

// Ensure all default blocks have unique IDs
function withBlockIds(blocks: Omit<Block, 'id'>[]): Block[] {
  return blocks.map(b => ({ ...b, id: generateId() }));
}

const defaultContent: DashboardContent = {
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
  ],
  pages: [
    {
      id: 'home',
      title: 'Home',
      path: '/',
      heroTitle: 'Welcome to SPC',
      heroSubtitle: 'Enjoy a modern pool lounge, specialty drinks, and a vibrant social scene.',
      blocks: withBlockIds([]),
    },
    {
      id: 'menu',
      title: 'Menu',
      path: '/menu',
      heroTitle: 'Menu',
      heroSubtitle: 'Our delicious menu will be here.',
      blocks: withBlockIds([]),
    },
    {
      id: 'contact',
      title: 'Contact',
      path: '/contact',
      heroTitle: 'Contact Us',
      heroSubtitle: 'Contact form and info.',
      blocks: withBlockIds([]),
    },
  ],
};

function safeContent(raw: any): DashboardContent {
  const c = { ...defaultContent, ...raw };
  if (!Array.isArray(c.backgroundImages)) c.backgroundImages = [...defaultContent.backgroundImages];
  if (!Array.isArray(c.navLinks)) c.navLinks = [...defaultContent.navLinks];
  if (!Array.isArray(c.pages)) c.pages = [...defaultContent.pages];
  return c;
}

// --- Backend API Helpers ---
const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_URL || 'https://spc-8hcz.onrender.com').replace(/\/$/, '');
const API_URL = `${BACKEND_API_URL}/api/dashboard-content`;

type DashboardAPIResponse = {
  content: DashboardContent;
  history: DashboardContent[];
};

async function fetchDashboardData(): Promise<DashboardAPIResponse> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch dashboard content');
  return await res.json();
}

async function saveDashboardData(data: { content: DashboardContent; history: DashboardContent[] }): Promise<any> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save dashboard content');
  return await res.json();
}

// --- Versioned Backend Helpers ---
const HISTORY_LIMIT = 20;

function getNextMainVersion(history: DashboardContent[]): string {
  const mainVersions = history
    .map((h: DashboardContent) => h.__versionMeta?.version || '1')
    .map((v: string) => parseInt(v, 10));
  if (mainVersions.length === 0) return '1';
  return (Math.max(...mainVersions) + 1).toString();
}

function ensureBlockIds(content: DashboardContent): DashboardContent {
  const newPages = content.pages.map((page: Page) => ({
    ...page,
    blocks: page.blocks.map((block: Block) => ({
      ...block,
      id: block.id && typeof block.id === 'string' && block.id.length > 8 ? block.id : generateId(),
    })),
  }));
  return { ...content, pages: newPages };
}


const Dashboard: React.FC = () => {
  // --- Main dashboard navigation ---
  // View state: initial home chooser with 3 large buttons
  const [dashboardView, setDashboardView] = useState<'home'|'page'|'menu'|'newsletter'|'rules'>('home');
  // ...existing code...
  const [content, setContent] = useState<DashboardContent>(ensureBlockIds(defaultContent));
  const [selectedPage, setSelectedPage] = useState(0);
  const [textSelection, setTextSelection] = useState<{[blockId: string]: [number, number]}>({});
  const [history, setHistory] = useState<DashboardContent[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved'|'saving'|'unsaved'>('saved');
  const [activeVersion, setActiveVersion] = useState<string>('1');
  const formatDropdownRefs = useRef<{[blockId: string]: HTMLSelectElement | null}>({});
  // --- Add modal state for version name/note ---
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [pendingVersionType, setPendingVersionType] = useState<'main'|'sub'|null>(null);
  const [versionName, setVersionName] = useState('');
  const [versionNote, setVersionNote] = useState('');
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number|null>(null);
  const [revertedContent, setRevertedContent] = useState<DashboardContent|null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalContent, setNoteModalContent] = useState<{title: string, note: string, version: string} | null>(null);
  // --- Edit note/title modal state ---
  const [editNoteModal, setEditNoteModal] = useState<{idx: number, name: string, note: string, version: string}|null>(null);
  const [justReverted, setJustReverted] = useState(false);
  // Add a ref to store the last saved content
  const lastSavedContentRef = useRef(content);
  // Track if we are navigating back to home and need confirm
  const [pendingLeaveToHome, setPendingLeaveToHome] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  // Add state for block delete confirmation
  const [blockToDelete, setBlockToDelete] = useState<{pageIdx: number, blockIdx: number} | null>(null);
  // Clear all history confirmation
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  // Add state for custom colors:
  const [customColors, setCustomColors] = useState<string[]>(['#d500f9']);
  // Track that initial content has loaded so we don't flag unsaved prematurely
  const [initialLoaded, setInitialLoaded] = useState(false);
  // Add handler to add a custom color:
  const addCustomColor = (color: string) => {
    if (!customColors.includes(color)) {
      const updated = [...customColors, color].slice(-8); // max 8
      setCustomColors(updated);
    }
  };
  // Add handler to remove a custom color:
  const removeCustomColor = (color: string) => {
    const updated = customColors.filter(c => c !== color);
    setCustomColors(updated);
  };

  // Dynamically update CSS variables for main color, its RGB, and a light version
  useEffect(() => {
    const main = content.mainColor || '#00b894';
    // Convert hex to RGB
    function hexToRgb(hex: string) {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }
    const [r, g, b] = hexToRgb(main);
    // Lighten color for backgrounds (simple 85% blend with white)
    function lighten([r, g, b]: number[], amt = 0.85) {
      return [
        Math.round(r + (255 - r) * amt),
        Math.round(g + (255 - g) * amt),
        Math.round(b + (255 - b) * amt),
      ];
    }
    const light = lighten([r, g, b]);
    const root = document.documentElement;
    root.style.setProperty('--main', main);
    root.style.setProperty('--main-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--main-light', `rgb(${light[0]}, ${light[1]}, ${light[2]})`);
  }, [content.mainColor]);
  // Add handler to select a palette color:
  const setMainColorFromPalette = (color: string) => {
    setContent(prev => ({ ...prev, mainColor: color }));
    addCustomColor(color);
  };
  const setAccentColorFromPalette = (color: string) => {
    setContent(prev => ({ ...prev, accentColor: color }));
    addCustomColor(color);
  };

  // Add state for dropdowns:
  const [mainColorDropdownOpen, setMainColorDropdownOpen] = useState(false);
  const [accentColorDropdownOpen, setAccentColorDropdownOpen] = useState(false);

  // Add ref and click outside handler for closing dropdowns:
  const mainColorDropdownRef = useRef<HTMLDivElement>(null);
  const accentColorDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainColorDropdownOpen) {
      document.body.classList.add('color-modal-active');
    } else {
      document.body.classList.remove('color-modal-active');
    }
  }, [mainColorDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mainColorDropdownRef.current &&
        !mainColorDropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.color-modal')
      ) setMainColorDropdownOpen(false);
      if (
        accentColorDropdownRef.current &&
        !accentColorDropdownRef.current.contains(event.target as Node)
      ) {
        setAccentColorDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Replace the autosave useEffect with a 60s interval that checks for changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Optionally, implement autosave with backend here if desired
      // (left blank for now)
    }, 60000);
    return () => clearInterval(interval);
  }, [content, history]);

  // --- Load from backend on mount ---
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDashboardData();
        const loaded = ensureBlockIds(data.content);
        lastSavedContentRef.current = loaded; // establish baseline BEFORE marking loaded
        setContent(loaded);
        setHistory(data.history || []);
        setActiveVersion(data.content?.__versionMeta?.version || '1');
      } catch {
        const fallback = ensureBlockIds(defaultContent);
        lastSavedContentRef.current = fallback;
        setContent(fallback);
        setHistory([]);
        setActiveVersion('1');
      }
      setSaveStatus('saved');
      setInitialLoaded(true);
    })();
  }, []);

  // --- Save to backend ---
  const handleSave = async () => {
    // Auto-upload any blob: temporary background images so they become persistent if possible.
    let cleanedContent = content;
    const blobIndices = content.backgroundImages.map((u, i) => u.startsWith('blob:') ? i : -1).filter(i => i >= 0);
    if (blobIndices.length) {
      try {
        // Fetch blobs
        const files: File[] = [];
        for (let bi = 0; bi < blobIndices.length; bi++) {
          const idx = blobIndices[bi];
            const blobUrl = content.backgroundImages[idx];
            const resp = await fetch(blobUrl);
            const blob = await resp.blob();
            const file = new File([blob], `bg-${Date.now()}-${bi}.png`, { type: blob.type || 'image/png' });
            files.push(file);
        }
        // Try backgrounds endpoint first
        let uploaded: string[] | null = null;
        if (files.length) {
          const form = new FormData();
          files.forEach(f => form.append('backgrounds', f));
          let r = await fetch(`${BACKEND_API_URL}/api/backgrounds/upload`, { method: 'POST', body: form });
          if (r.status === 404) {
            // fallback to news upload
            const form2 = new FormData();
            files.forEach(f => form2.append('images', f));
            r = await fetch(`${BACKEND_API_URL}/api/news/upload`, { method: 'POST', body: form2 });
          }
          if (r.ok) {
            const data = await r.json();
            const urls: string[] = (data.urls || []).map((u: string) => u.startsWith('http') ? u : `${BACKEND_API_URL}${u}`);
            if (urls.length === files.length) uploaded = urls;
          }
        }
        if (uploaded) {
          const newImages = [...content.backgroundImages];
          blobIndices.forEach((origIdx, i) => { newImages[origIdx] = uploaded![i]; });
          cleanedContent = { ...content, backgroundImages: newImages };
          setContent(cleanedContent);
        } else {
          // Could not upload; remove blob images to avoid persisting invalid URLs
          const filtered = content.backgroundImages.filter(u => !u.startsWith('blob:'));
            cleanedContent = { ...content, backgroundImages: filtered };
            setContent(cleanedContent);
            console.warn('Removed temporary blob background images during save because upload failed.');
        }
      } catch (err) {
        console.warn('Blob background auto-upload failed, stripping temporary images', err);
        const filtered = content.backgroundImages.filter(u => !u.startsWith('blob:'));
        cleanedContent = { ...content, backgroundImages: filtered };
        setContent(cleanedContent);
      }
    }
    setSaveStatus('saving');
    const nextVer = getNextMainVersion(history);
    const meta = { version: nextVer, timestamp: Date.now(), name: versionName || '', note: versionNote || '' };
    const contentWithMeta = { ...cleanedContent, __versionMeta: meta };
    const newHistory = [{ ...contentWithMeta }, ...history].slice(0, HISTORY_LIMIT);
    try {
      await saveDashboardData({ content: contentWithMeta, history: newHistory });
      setActiveVersion(nextVer);
      setShowVersionModal(false);
      setVersionName('');
      setVersionNote('');
      setPendingVersionType(null);
      setHistory(newHistory);
      setSaveStatus('saved');
      lastSavedContentRef.current = contentWithMeta;
      // If we were saving as part of leaving the editor, go home afterward
      if (pendingLeaveToHome) {
        setPendingLeaveToHome(false);
        setDashboardView('home');
      }
    } catch {
      setSaveStatus('unsaved');
      alert('Failed to save. Please try again.');
    }
  };

  // --- Delete a version from history ---
  const handleDeleteVersion = async (idx: number) => {
    setDeleteConfirmIdx(idx);
  };
  const confirmDelete = async () => {
    if (deleteConfirmIdx !== null) {
      let newHistory = [...history];
      newHistory.splice(deleteConfirmIdx, 1);
      // Save updated history and current content to backend
      try {
        await saveDashboardData({ content, history: newHistory });
        setHistory(newHistory);
        // If the deleted version was active, revert to the latest
        if (history[deleteConfirmIdx]?.__versionMeta?.version === activeVersion) {
          if (newHistory.length > 0) {
            setContent(newHistory[0]);
            setActiveVersion(newHistory[0].__versionMeta?.version || '1');
          } else {
            setContent(ensureBlockIds(defaultContent));
            setActiveVersion('1');
          }
        }
      } catch {
        alert('Failed to delete version. Please try again.');
      }
    }
    setDeleteConfirmIdx(null);
  };
  const cancelDelete = () => setDeleteConfirmIdx(null);

  // --- Revert to a version ---
  const handleRevert = async (h: DashboardContent) => {
    setContent(h);
    setActiveVersion(h.__versionMeta?.version || '1');
    try {
      await saveDashboardData({ content: h, history });
    } catch {
      alert('Failed to revert. Please try again.');
    }
  };

  // --- Clear all history except current ---
  const handleClearHistory = async () => {
    // Save only the current content as v1
    const meta = { version: '1', timestamp: Date.now() };
    const contentWithMeta = { ...content, __versionMeta: meta };
    try {
      await saveDashboardData({ content: contentWithMeta, history: [contentWithMeta] });
      setHistory([contentWithMeta]);
      setActiveVersion('1');
    } catch {
      alert('Failed to clear history. Please try again.');
    }
  };

  // --- Handlers ---
  const handleField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContent((prev) => ({ ...prev, [name]: value }));
  };

  // --- Pages ---
  const handlePage = (i: number, field: keyof Page, value: string) => setContent((prev) => {
    const pages = [...prev.pages];
    pages[i] = { ...pages[i], [field]: value };
    return { ...prev, pages };
  });
  // Add page: new page should look like homepage (heroTitle, heroSubtitle, blocks)
  const addPage = () => setContent((prev) => {
    const newPage: Page = {
      id: generateId(),
      title: 'New Page',
      path: '/new',
      heroTitle: 'New Page',
      heroSubtitle: '',
      blocks: [],
    };
    return {
      ...prev,
      pages: [...prev.pages, newPage],
    };
  });
  const removePage = (i: number) => setContent((prev) => {
    const pages = prev.pages.filter((_, idx) => idx !== i);
    return { ...prev, pages };
  });

  // --- Blocks ---
  const handleBlock = (pageIdx: number, blockIdx: number, field: keyof Block, value: string) => setContent((prev) => {
    const pages = [...prev.pages];
    const blocks = [...pages[pageIdx].blocks];
    blocks[blockIdx] = { ...blocks[blockIdx], [field]: value };
    pages[pageIdx] = { ...pages[pageIdx], blocks };
    return { ...prev, pages };
  });
  const addBlock = (pageIdx: number, type: Block['type']) => setContent((prev) => {
    const pages = [...prev.pages];
    const blocks = [...pages[pageIdx].blocks, { id: generateId(), type, text: '' }];
    pages[pageIdx] = { ...pages[pageIdx], blocks };
    return { ...prev, pages };
  });
  const removeBlock = (pageIdx: number, blockIdx: number) => setContent((prev) => {
    const pages = [...prev.pages];
    const blocks = pages[pageIdx].blocks.filter((_, idx) => idx !== blockIdx);
    pages[pageIdx] = { ...pages[pageIdx], blocks };
    return { ...prev, pages };
  });

  // --- DnD ---
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    // Blocks
    if (result.type.startsWith('block-')) {
      const pageIdx = parseInt(result.type.split('-')[1], 10);
      const pages = Array.from(content.pages);
      const blocks = Array.from(pages[pageIdx].blocks);
      const [removed] = blocks.splice(result.source.index, 1);
      blocks.splice(result.destination.index, 0, removed);
      pages[pageIdx] = { ...pages[pageIdx], blocks };
      setContent((prev) => ({ ...prev, pages }));
    }
    // Pages
    if (result.type === 'page') {
      const pages = Array.from(content.pages);
      const [removed] = pages.splice(result.source.index, 1);
      pages.splice(result.destination.index, 0, removed);
      setContent((prev) => ({ ...prev, pages }));
    }
  };

  // --- Formatting toolbar button handler ---
  const handleFormatToolbar = (pageIdx: number, blockIdx: number, format: string) => {
    handleFormat(pageIdx, blockIdx, format);
  };

  // --- Block formatting handler (for toolbar) ---
  const handleFormat = (pageIdx: number, blockIdx: number, format: string) => {
    const block = content.pages[pageIdx].blocks[blockIdx];
    const sel = textSelection[block.id] || [0, 0];
    let newText = block.text;
    if (format === 'bold') newText = applyFormat(block.text, sel, 'bold');
    if (format === 'italic') newText = applyFormat(block.text, sel, 'italic');
    if (format === 'underline') newText = applyFormat(block.text, sel, 'underline');
    if (format === 'strike') newText = applyFormat(block.text, sel, 'strike');
    if (format === 'link') newText = applyFormat(block.text, sel, 'link');
    if (format === 'ul') newText = applyFormat(block.text, sel, 'ul');
    if (format === 'ol') newText = applyFormat(block.text, sel, 'ol');
    handleBlock(pageIdx, blockIdx, 'text', newText);
  };

  // --- Formatting helpers (extended) ---
  function applyFormat(text: string, selection: [number, number], format: string): string {
    const [start, end] = selection;
    let before = text.slice(0, start);
    let selected = text.slice(start, end);
    let after = text.slice(end);
    if (format === 'bold') {
      selected = selected.startsWith('**') && selected.endsWith('**') ? selected.slice(2, -2) : `**${selected}**`;
    } else if (format === 'italic') {
      selected = selected.startsWith('_') && selected.endsWith('_') ? selected.slice(1, -1) : `_${selected}_`;
    } else if (format === 'underline') {
      selected = selected.startsWith('<u>') && selected.endsWith('</u>') ? selected.slice(3, -4) : `<u>${selected}</u>`;
    } else if (format === 'strike') {
      selected = selected.startsWith('~~') && selected.endsWith('~~') ? selected.slice(2, -2) : `~~${selected}~~`;
    } else if (format === 'link') {
      selected = selected.startsWith('[') && selected.includes('](') ? selected : `[${selected}](url)`;
    } else if (format === 'ul') {
      selected = selected.split('\n').map(line => line.startsWith('- ') ? line : `- ${line}`).join('\n');
    } else if (format === 'ol') {
      selected = selected.split('\n').map((line, i) => line.match(/^\d+\. /) ? line : `${i + 1}. ${line}`).join('\n');
    }
    return before + selected + after;
  }

  // --- In the UI ---
  // In version history, show title (name) next to version number, and add a note icon next to revert/delete
  // Clicking the note icon opens a modal showing the note for that version
  const openNoteModal = (version: string, name?: string, note?: string) => {
    setNoteModalContent({
      title: name || '',
      note: note || '',
      version,
    });
    setShowNoteModal(true);
  };
  const closeNoteModal = () => setShowNoteModal(false);

  // --- Edit note/title for a version ---
  const openEditNoteModal = (idx: number) => {
    const h = history[idx];
    setEditNoteModal({
      idx,
      name: h.__versionMeta?.name || '',
      note: h.__versionMeta?.note || '',
      version: h.__versionMeta?.version || '',
    });
  };
  const closeEditNoteModal = () => setEditNoteModal(null);
  const saveEditNoteModal = () => {
    if (editNoteModal) {
      const newHistory = [...history];
      const h = { ...newHistory[editNoteModal.idx] };
      h.__versionMeta = {
        ...h.__versionMeta,
        name: editNoteModal.name,
        note: editNoteModal.note,
        version: h.__versionMeta?.version || '',
        timestamp: h.__versionMeta?.timestamp || Date.now(),
      };
      newHistory[editNoteModal.idx] = h;
      setHistory(newHistory);
      closeEditNoteModal();
    }
  };

  // Add these handlers:
  const handleBgImage = (i: number, value: string) => setContent((prev) => {
    const backgroundImages = [...prev.backgroundImages];
    backgroundImages[i] = value;
    return { ...prev, backgroundImages };
  });
  const removeBgImage = (i: number) => setContent((prev) => {
    const backgroundImages = prev.backgroundImages.filter((_, idx) => idx !== i);
    return { ...prev, backgroundImages };
  });
  const addBgImage = () => setContent((prev) => ({ ...prev, backgroundImages: [...prev.backgroundImages, ''] }));

  // 1. Add a file input ref and upload handler at the top of the Dashboard component:
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [bgUploading, setBgUploading] = useState(false);
  const [bgUploadError, setBgUploadError] = useState<string|null>(null);
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    setBgUploading(true);
    setBgUploadError(null);
    let added = false;
    try {
      // Attempt primary backgrounds endpoint
      const bgForm = new FormData();
      Array.from(files).forEach(f => bgForm.append('backgrounds', f));
      let up = await fetch(`${BACKEND_API_URL}/api/backgrounds/upload`, { method: 'POST', body: bgForm });
      if (up.status === 404) {
        // Fallback: try using the existing news upload endpoint (older backend deploys)
        const newsForm = new FormData();
        Array.from(files).forEach(f => newsForm.append('images', f));
        const up2 = await fetch(`${BACKEND_API_URL}/api/news/upload`, { method: 'POST', body: newsForm });
        if (up2.ok) {
          const data2 = await up2.json();
            const urls2: string[] = (data2.urls || []).map((u: string) => u.startsWith('http') ? u : `${BACKEND_API_URL}${u}`);
            if (urls2.length) {
              setContent(prev => ({ ...prev, backgroundImages: [...prev.backgroundImages, ...urls2] }));
              added = true;
              setBgUploadError('Achtergrond endpoint ontbreekt (404). Gebruik tijdelijk nieuws-upload route. Update backend voor definitieve oplossing.');
            }
        } else {
          setBgUploadError('Upload endpoints reageren niet (status ' + up2.status + '). Tijdelijke (niet-bewaarde) weergave gebruikt.');
        }
      } else if (up.ok) {
        const data = await up.json();
        const urls: string[] = (data.urls || []).map((u: string) => u.startsWith('http') ? u : `${BACKEND_API_URL}${u}`);
        if (urls.length) {
          setContent(prev => ({ ...prev, backgroundImages: [...prev.backgroundImages, ...urls] }));
          added = true;
        }
      } else {
        setBgUploadError('Upload endpoint niet beschikbaar (status ' + up.status + '). Tijdelijke (niet-bewaarde) weergave gebruikt.');
      }
    } catch (err) {
      console.warn('Background upload failed', err);
      setBgUploadError('Upload mislukt. Tijdelijke (niet-bewaarde) weergave gebruikt.');
    }
    if (!added) {
      // Fallback: local object URLs so user still sees images immediately
      const fallback: string[] = [];
      for (let i = 0; i < files.length; i++) {
        fallback.push(URL.createObjectURL(files[i]));
      }
      if (fallback.length) setContent(prev => ({ ...prev, backgroundImages: [...prev.backgroundImages, ...fallback] }));
    }
    setBgUploading(false);
    e.target.value = '';
  };

  // Add state for block type selection
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);

  // Mark unsaved changes when content diverges from lastSaved snapshot
  useEffect(() => {
    if (!initialLoaded) return; // skip until first load done
    if (saveStatus === 'saving') return;
    const changed = JSON.stringify(content) !== JSON.stringify(lastSavedContentRef.current);
    setSaveStatus(changed ? 'unsaved' : 'saved');
  }, [content, initialLoaded, saveStatus]);

  const requestBackToHome = () => {
    if (saveStatus === 'unsaved') {
      setShowLeaveModal(true);
    } else {
      setDashboardView('home');
    }
  };

  // Overflow toolbar condense for markdown + quill on small screens
  useEffect(() => {
    const condense = () => {
      if (window.innerWidth > 760) return; // only condense on small screens
      const processToolbar = (toolbar: HTMLElement, hideCount: number) => {
        if (toolbar.querySelector('.ql-overflow-toggle')) return;
        const buttons = Array.from(toolbar.querySelectorAll('button'));
        if (buttons.length <= hideCount + 2) return;
        const overflowItems = buttons.slice(-hideCount);
        const menu = document.createElement('div');
        menu.className = 'ql-overflow-menu';
        overflowItems.forEach(b => menu.appendChild(b));
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'ql-overflow-toggle';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
        toggle.onclick = () => {
          const open = menu.classList.toggle('open');
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        toolbar.appendChild(toggle);
        toolbar.appendChild(menu);
      };
      document.querySelectorAll('.dashboard-block-textarea .ql-toolbar').forEach(tb => processToolbar(tb as HTMLElement, 3));
      document.querySelectorAll('.dashboard-format-toolbar-embedded').forEach(tb => processToolbar(tb as HTMLElement, 4));
    };
    condense();
    window.addEventListener('resize', condense);
    return () => window.removeEventListener('resize', condense);
  }, [selectedPage, content.pages[selectedPage]?.blocks.length]);

  const pageTitle = dashboardView === 'page' ? 'Pagina Editor' : dashboardView === 'menu' ? 'Menu Editor' : dashboardView === 'newsletter' ? 'Nieuws Editor' : dashboardView === 'rules' ? 'Spelregels Beheer' : 'Guuscode Dashboard';


  return (
    <div className="dashboard-root">
      <header className={dashboardView !== 'home' ? 'with-back' : 'home'}>
        {dashboardView === 'home' ? (
          <img src="/guuscode-logo-dark.png" alt="GuusCode Logo" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/Images/LogoSquare.png'; }} />
        ) : (
          <button type="button" className="header-back-btn" aria-label="Terug" onClick={requestBackToHome}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
        <h1>{pageTitle}</h1>
        <div className="header-spacer" />
      </header>
      {dashboardView === 'home' && (
        <div className="dashboard-home-select">
          <div className="dashboard-home-grid">
            <button className="dashboard-home-card" onClick={() => setDashboardView('page')}>
              <span className="home-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 4v16"/><path d="M4 9h16"/></svg>
              </span>
              <div className="dashboard-home-card-title">Pagina Bewerken</div>
              <div className="dashboard-home-card-desc">Hero & Blocks aanpassen, achtergrond en thema.</div>
            </button>
            <button className="dashboard-home-card" onClick={() => setDashboardView('menu')}>
              <span className="home-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3h16"/><path d="M4 9h16"/><path d="M4 15h10"/><path d="M4 21h6"/></svg>
              </span>
              <div className="dashboard-home-card-title">Menu Bewerken</div>
              <div className="dashboard-home-card-desc">Voeg gerechten & prijzen toe, bewerk categorieën.</div>
            </button>
            <button className="dashboard-home-card" onClick={() => setDashboardView('newsletter')}>
              <span className="home-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v13H5.17L4 18.17V4z"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>
              </span>
              <div className="dashboard-home-card-title">Nieuwsbrief</div>
              <div className="dashboard-home-card-desc">Nieuws items schrijven & beheren.</div>
            </button>
            <button className="dashboard-home-card" onClick={() => setDashboardView('rules')}>
              <span className="home-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h6"/></svg>
              </span>
              <div className="dashboard-home-card-title">Spelregels</div>
              <div className="dashboard-home-card-desc">Beheer spelvarianten, zichtbaarheid & uitleg.</div>
            </button>
          </div>
        </div>
      )}
  {/* Removed separate editor-bar; title/back now in main header */}
      {/* Page Editor View */}
      {dashboardView === 'page' && (
        <>
          <div className="page-editor">
            <div className="dashboard-settings-card page-settings-card">
              <h2>Site Instellingen</h2>
              <div className="dashboard-settings-section">
                <label className="dashboard-settings-label">
                  Koptekst
                  <input name="logoText" maxLength={24} value={content.logoText} onChange={handleField} className="dashboard-settings-input" />
                </label>
              </div>
              {/* Theme color picker controls site theme (public pages) but dashboard UI stays blauw via CSS variable override */}
              <div className="dashboard-settings-section">
                <div className="dashboard-settings-row">
                  <label className="dashboard-settings-label">Thema</label>
                  <div className="color-dropdown-wrapper" ref={mainColorDropdownRef}>
                    <button
                      className="color-dropdown-btn"
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMainColorDropdownOpen(true); }}
                      aria-haspopup="dialog"
                      aria-expanded={mainColorDropdownOpen}
                    >
                      <span className="color-dropdown-circle" style={{ background: content.mainColor }} />
                      <span className="color-dropdown-caret"></span>
                    </button>
                    {/* Color popup overlay rendered at root when open */}
                  </div>
                </div>
              </div>
              <div className="dashboard-settings-section">
                <h3>Achtergrondafbeeldingen</h3>
                <DragDropContext onDragEnd={result => {
                  if (!result.destination) return;
                  const imgs = Array.from(content.backgroundImages);
                  const [removed] = imgs.splice(result.source.index, 1);
                  imgs.splice(result.destination.index, 0, removed);
                  setContent(prev => ({ ...prev, backgroundImages: imgs }));
                }}>
                  <Droppable droppableId="bgimgs" direction="horizontal">
                    {provided => (
                      <div className="dashboard-bgimg-gallery" ref={provided.innerRef} {...provided.droppableProps}>
                        {content.backgroundImages.map((img, i) => (
                          <Draggable key={img + i} draggableId={img + i} index={i}>
                            {prov => (
                              <div
                                className="dashboard-bgimg-thumb"
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                              >
                                <img src={img} alt="Background" />
                                {img.startsWith('blob:') && (
                                  <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, background: '#000a', color: '#fff', fontSize: 10, padding: '2px 4px', borderRadius: 4, textAlign: 'center' }}>
                                    tijdelijk – niet opgeslagen
                                  </div>
                                )}
                                <button className="dashboard-bgimg-remove" onClick={() => removeBgImage(i)} aria-label="Remove">×</button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleUploadImage}
                />
                <button
                  className="dashboard-bgimg-add"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Add Background Image"
                  title="Add Background Image"
                  type="button"
                >
                  Afbeelding toevoegen
                </button>
                {bgUploading && <div style={{ marginTop: 8, fontSize: 12, color: content.mainColor }}>Uploaden...</div>}
                {bgUploadError && <div style={{ marginTop: 6, fontSize: 12, color: '#c62828' }}>{bgUploadError}</div>}
              </div>
            </div>
            <hr className="page-section-divider" />
            <div className="page-hero-editor">
              <h2 className="page-section-title">Homepage Content</h2>
              {/* Pinned hero block */}
              <div className="dashboard-block-card block-card-modern hero-block-pinned" aria-label="Hero blok (vast)">
                <div className="dashboard-block-header-grid">
                  <span className="block-type-icon-badge" aria-hidden="true" style={{ cursor: 'default' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 3 7h7l-5.5 4.5L19 21l-7-4-7 4 2.5-7.5L2 9h7z"/></svg>
                  </span>
                  <span className="block-type-label">Hero</span>
                </div>
                <label className="hero-label"><strong>Hero Titel</strong></label>
                <input
                  type="text"
                  value={content.pages[selectedPage]?.heroTitle || ''}
                  onChange={e => handlePage(selectedPage, 'heroTitle', e.target.value)}
                  className="dashboard-hero-title-input hero-no-bold"
                />
                <label className="hero-label"><strong>Hero Subtitel</strong></label>
                <input
                  type="text"
                  value={content.pages[selectedPage]?.heroSubtitle || ''}
                  onChange={e => handlePage(selectedPage, 'heroSubtitle', e.target.value)}
                  className="dashboard-hero-subtitle-input hero-no-bold"
                />
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={`blocks-${selectedPage}`} type={`block-${selectedPage}`}>
                  {(provided: DroppableProvided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {content.pages[selectedPage]?.blocks.map((block, j) => (
                        <Draggable key={block.id} draggableId={block.id} index={j}>
                          {(prov: DraggableProvided) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className="dashboard-block-card block-card-modern"
                            >
                              <div className="dashboard-block-header-grid">
                                <span className="block-type-icon-badge" aria-hidden="true" {...prov.dragHandleProps} style={{ cursor: 'grab' }}>
                                  {block.type === 'heading' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>}
                                  {block.type === 'text' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h10"/><path d="M4 18h8"/></svg>}
                                  {block.type === 'divider' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/></svg>}
                                  {block.type === 'quote' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 19c-1.5-2-2-4-2-6 0-3 1-5 3-7l2 2c-1.5 1.5-2 3-2 5 0 1.5.5 3 1.5 4.5L6 19Z"/><path d="M16 19c-1.5-2-2-4-2-6 0-3 1-5 3-7l2 2c-1.5 1.5-2 3-2 5 0 1.5.5 3 1.5 4.5L16 19Z"/></svg>}
                                </span>
                                <span className="block-type-label">
                                  {block.type === 'heading' && 'Titel'}
                                  {block.type === 'text' && 'Tekst'}
                                  {block.type === 'divider' && 'Scheiding'}
                                  {block.type === 'quote' && 'Quote'}
                                </span>
                                <button
                                  className="block-inline-delete"
                                  type="button"
                                  aria-label="Verwijder blok"
                                  onClick={() => setBlockToDelete({ pageIdx: selectedPage, blockIdx: j })}
                                >
                                  <svg className="trash-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <g className="trash-lid"><path d="M9 6V4h6v2"/></g>
                                    <g className="trash-body"><path d="M3 6h18"/><path d="M8 6v12"/><path d="M16 6v12"/><path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></g>
                                  </svg>
                                </button>
                              </div>
                              {block.type === 'heading' ? (
                                <input value={block.text} onChange={e => handleBlock(selectedPage, j, 'text', e.target.value)} className="dashboard-block-input" />
                              ) : block.type === 'divider' ? (
                                <div style={{height:4}} />
                              ) : block.type === 'quote' ? (
                                <blockquote className="dashboard-block-quote">
                                  <textarea value={block.text} onChange={e => handleBlock(selectedPage, j, 'text', e.target.value)} className="dashboard-block-quote-input" placeholder="Quote..." />
                                </blockquote>
                              ) : (
                                <div className="dashboard-block-textarea-wrapper">
                                  <ReactQuill
                                    value={block.text}
                                    onChange={value => handleBlock(selectedPage, j, 'text', value)}
                                    className="dashboard-block-textarea"
                                    theme="snow"
                                  />
                                </div>
                              )}
                              {/* footer removed; inline delete icon now present */}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <div className="dashboard-add-block-row">
                        <div className="dashboard-add-block-menu-wrapper">
                          <button
                            className="dashboard-add-block-btn"
                            aria-label={showAddBlockMenu ? "Close Add Block Menu" : "Add Block"}
                            title={showAddBlockMenu ? "Close Add Block Menu" : "Add Block"}
                            type="button"
                            onClick={() => setShowAddBlockMenu(open => !open)}
                          >
                            {showAddBlockMenu ? '×' : '+'}
                          </button>
                          {showAddBlockMenu && (
                            <div className="dashboard-add-block-menu">
                              <button onClick={() => { addBlock(selectedPage, 'heading'); setShowAddBlockMenu(false); }} className="dashboard-add-block-menu-item">Heading</button>
                              <button onClick={() => { addBlock(selectedPage, 'text'); setShowAddBlockMenu(false); }} className="dashboard-add-block-menu-item">Text</button>
                              <div className="dashboard-add-block-menu-divider" />
                              <button onClick={() => { addBlock(selectedPage, 'divider'); setShowAddBlockMenu(false); }} className="dashboard-add-block-menu-item">Divider</button>
                              <button onClick={() => { addBlock(selectedPage, 'quote'); setShowAddBlockMenu(false); }} className="dashboard-add-block-menu-item">Quote</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Droppable>
                </DragDropContext>
            </div>
          </div>
          {/* Version bar and modals (save, history, block delete, etc.) */}
          <div className="dashboard-version-bar page-version-bar">
            <button onClick={() => setShowVersionModal(true)} disabled={saveStatus === 'saving'} className="btn primary">
              {saveStatus === 'saving' ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button onClick={() => setShowHistory(h => !h)} className="btn subtle">
              {showHistory ? 'Verberg Geschiedenis' : 'Toon Geschiedenis'}
            </button>
          </div>
          {showHistory && (
            <div className="dashboard-version-history version-history-panel">
              <div className="version-history-head">
                <h4 className="version-history-title">Versie Geschiedenis</h4>
                <button onClick={() => setShowClearAllConfirm(true)} className="btn danger subtle">Alles verwijderen</button>
              </div>
              <div>
                {history.map((h, i) => {
                  const v = h.__versionMeta?.version || (history.length - i).toString();
                  const isActive = v === activeVersion;
                  return (
                    <React.Fragment key={v}>
                      <div className={`dashboard-version-row version-row-modern${isActive ? ' dashboard-version-current' : ''}`}>
                        <div className="dashboard-version-info">
                          <span className="dashboard-version-dot">{isActive ? '●' : '○'}</span>
                          <span className="dashboard-version-number">v{v}</span>
                          {h.__versionMeta?.name && <span className="dashboard-version-name">{h.__versionMeta.name}</span>}
                        </div>
                        <div className="dashboard-version-actions version-actions-modern">
                          <button onClick={() => { handleRevert(h); setShowHistory(false); }} className="btn primary">Terugzetten</button>
                          <button onClick={() => handleDeleteVersion(i)} className="btn danger subtle">Verwijder</button>
                          <button onClick={() => openEditNoteModal(i)} className="btn subtle">Notitie</button>
                        </div>
                        <div className="dashboard-version-timestamp">
                          {h.__versionMeta?.timestamp ? new Date(h.__versionMeta.timestamp).toLocaleString() : ''}
                        </div>
                      </div>
                      {i < history.length - 1 && <div className="dashboard-version-divider" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
          {showNoteModal && noteModalContent && (
            <div className="modal modern-modal">
              <div className="modal-content modern-modal-content">
                <h3>Notitie voor v{noteModalContent.version}{noteModalContent.title ? `: ${noteModalContent.title}` : ''}</h3>
                <div>{noteModalContent.note || <span>(Geen notitie)</span>}</div>
                <div className="modal-actions">
                  <button onClick={closeNoteModal} className="btn primary">Sluiten</button>
                </div>
              </div>
            </div>
          )}
          {editNoteModal && (
            <div className="modal modern-modal">
              <div className="modal-content modern-modal-content">
                <h3>Versie notitie aanpassen v{editNoteModal.version}</h3>
                <label>
                  Titel (optioneel):
                  <input value={editNoteModal.name} onChange={e => setEditNoteModal(m => m ? { ...m, name: e.target.value } : m)} />
                </label>
                <label>
                  Notitie (optioneel):
                  <textarea value={editNoteModal.note} onChange={e => setEditNoteModal(m => m ? { ...m, note: e.target.value } : m)} />
                </label>
                <div className="modal-actions">
                  <button onClick={saveEditNoteModal} className="btn primary">Opslaan</button>
                  <button onClick={closeEditNoteModal} className="btn subtle">Annuleren</button>
                </div>
              </div>
            </div>
          )}
          {/* Confirmation modal for block delete */}
          {blockToDelete && (
            <div className="modal modern-modal">
              <div className="modal-content modern-modal-content">
                <h3>Blok Verwijderen</h3>
                <p>Weet je zeker dat je dit blok wilt verwijderen?</p>
                <div className="modal-actions">
                  <button
                    className="btn danger"
                    onClick={() => {
                      removeBlock(blockToDelete.pageIdx, blockToDelete.blockIdx);
                      setBlockToDelete(null);
                    }}
                  >
                    Verwijder
                  </button>
                  <button className="btn subtle" onClick={() => setBlockToDelete(null)}>Annuleren</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {dashboardView === 'rules' && (
        <div style={{padding:'32px 24px'}}>
          <RulesAdmin embedded />
        </div>
      )}
      {/* Menu Editor View */}
      {dashboardView === 'menu' && (
        <MenuPanel
          menu={content.menu || []}
          onChange={menu => setContent(prev => ({ ...prev, menu }))}
          mainColor={content.mainColor}
          accentColor={content.accentColor}
          hideTitle
        />
      )}
      {/* Newsletter View */}
      {dashboardView === 'newsletter' && (
        <div className="dashboard-newsletter-editor" style={{ marginTop: 32 }}>
          <News />
        </div>
      )}
      {showClearAllConfirm && (
        <div className="modal modern-modal">
          <div className="modal-content modern-modal-content">
            <h3>Alle Versies Verwijderen</h3>
            <p>Weet je zeker dat je alle geschiedenis wilt verwijderen? Alleen de huidige versie blijft als v1.</p>
            <div className="modal-actions">
              <button onClick={() => { handleClearHistory(); setShowClearAllConfirm(false); setShowHistory(false); }} className="btn danger">Ja, alles verwijderen</button>
              <button onClick={() => setShowClearAllConfirm(false)} className="btn subtle">Annuleren</button>
            </div>
          </div>
        </div>
      )}
      {showLeaveModal && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <h3>Niet opgeslagen wijzigingen</h3>
            <p>Wil je eerst opslaan voordat je teruggaat naar het hoofdmenu?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setPendingLeaveToHome(true);
                  handleSave();
                }}
                className="dashboard-version-btn"
                disabled={saveStatus === 'saving'}
              >Opslaan en Terug</button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setDashboardView('home');
                }}
                className="dashboard-version-btn"
              >Terug zonder opslaan</button>
              <button onClick={() => setShowLeaveModal(false)} className="dashboard-version-btn">Annuleren</button>
            </div>
          </div>
        </div>
      )}
      {mainColorDropdownOpen && (
        <div className="color-modal-overlay" role="dialog" aria-modal="true" onMouseDown={e => {
          if (!(e.target as HTMLElement).closest('.color-modal')) setMainColorDropdownOpen(false);
        }}>
          <div className="color-modal" role="document">
            <div className="color-modal-head">
              <h4>Kies Thema Kleur</h4>
              <button type="button" className="color-modal-close" aria-label="Sluiten" onClick={() => setMainColorDropdownOpen(false)}>×</button>
            </div>
            <div className="color-palette-group">
              <div className="color-palette-label">THEMA</div>
              <div className="color-palette-row">
                {THEME_COLORS.map(color => (
                  <button
                    key={color}
                    className={`color-swatch${content.mainColor === color ? ' selected' : ''}`}
                    style={{ background: color, borderColor: color === '#fff' ? '#ccc' : color }}
                    onClick={() => { setMainColorFromPalette(color); setMainColorDropdownOpen(false); }}
                    aria-label={`Stel hoofdkleur in op ${color}`}
                  />
                ))}
              </div>
              <div className="color-palette-label">DEFAULT</div>
              <div className="color-palette-row">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    className={`color-swatch${content.mainColor === color ? ' selected' : ''}`}
                    style={{ background: color, borderColor: color === '#fff' ? '#ccc' : color }}
                    onClick={() => { setMainColorFromPalette(color); setMainColorDropdownOpen(false); }}
                    aria-label={`Stel hoofdkleur in op ${color}`}
                  />
                ))}
              </div>
              <div className="color-palette-label">CUSTOM</div>
              <div className="color-palette-row">
                {customColors.map(color => (
                  <div key={color} style={{ position: 'relative' }}>
                    <button
                      className={`color-swatch${content.mainColor === color ? ' selected' : ''}`}
                      style={{ background: color, borderColor: color === '#fff' ? '#ccc' : color }}
                      onClick={() => { setMainColorFromPalette(color); setMainColorDropdownOpen(false); }}
                      aria-label={`Stel hoofdkleur in op ${color}`}
                    />
                    <button className="color-swatch-remove" onClick={() => removeCustomColor(color)} aria-label="Verwijder custom kleur">×</button>
                  </div>
                ))}
                <label className="color-swatch-add">
                  +
                  <input type="color" style={{ opacity: 0, width: 0, height: 0 }} onChange={e => addCustomColor(e.target.value)} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ...existing version/history modals and block delete modal... */}
    </div>
  );
};

export default Dashboard;
