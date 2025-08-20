import React, { useState, useEffect, useRef } from 'react';
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

function MenuPanel({ menu, onChange, mainColor, accentColor }: {
  menu: MenuItem[];
  onChange: (menu: MenuItem[]) => void;
  mainColor: string;
  accentColor: string;
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

  // Save menu to backend
  const saveMenu = async () => {
    setSaving(true);
    try {
      // Save to backend using /api/dashboard-content
    const res = await fetch('https://spc-8hcz.onrender.com/api/dashboard-content');
      const data = await res.json();
      const content = data.content;
      const history = data.history || [];
      const updated = { ...content, menu };
    await fetch('https://spc-8hcz.onrender.com/api/dashboard-content', {
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
    <div className="dashboard-section-card" style={{ marginTop: 32, padding: 24, background: 'rgba(255,255,255,0.97)', borderRadius: 24, boxShadow: '0 8px 48px #23252622' }}>
      <h2 style={{ color: accentColor, textAlign: 'center', marginBottom: 24 }}>Menu Editor</h2>
      {/* Columns for each category */}
      <div style={{ display: 'block' }}>
        {MENU_CATEGORIES.map(cat => (
          <div key={cat} style={{ maxWidth: 480, margin: '0 auto 32px auto', background: '#f8fafc', borderRadius: 16, boxShadow: '0 2px 8px #23252611', padding: 16, position: 'relative' }}>
            <h3 style={{ color: accentColor, borderBottom: '2px solid #eee', paddingBottom: 4, marginBottom: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ flex: 1 }}>{cat}</span>
              <button onClick={() => openAddPopup(cat)} style={{ marginLeft: 8, background: mainColor, color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={`Add to ${cat}`}>+</button>
            </h3>
            {grouped[cat]?.length ? (
              grouped[cat].map(item => (
                <div key={item.id} style={{ background: selected.includes(item.id) ? '#e0f7fa' : '#fff', borderRadius: 10, marginBottom: 12, padding: 12, boxShadow: '0 1px 4px #23252611', position: 'relative' }}>
                  <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} style={{ position: 'absolute', left: 8, top: 8 }} />
                  {editingId === item.id ? (
                    <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input name="name" value={editFields.name || ''} onChange={handleEditChange} required placeholder="Name" />
                      <input name="price" value={editFields.price || ''} onChange={e => handleEditChange({ ...e, target: { ...e.target, value: e.target.value.replace(/[^\d.]/g, '') } })} required placeholder="Price" />
                      <input name="description" value={editFields.description || ''} onChange={handleEditChange} placeholder="Description" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" style={{ background: mainColor, color: '#fff', borderRadius: 8, padding: '0.3rem 1rem', border: 'none' }}>Save</button>
                        <button type="button" onClick={handleEditCancel} style={{ background: '#eee', color: '#232526', borderRadius: 8, padding: '0.3rem 1rem', border: 'none' }}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 17 }}>{item.name}</div>
                      <div style={{ color: mainColor, fontWeight: 700 }}>{priceDisplay(item.price)}</div>
                      {item.description && <div style={{ color: '#666', fontSize: 14 }}>{item.description}</div>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => startEdit(item)} style={{ background: '#eee', color: '#232526', borderRadius: 8, padding: '0.3rem 1rem', border: 'none' }}>Edit</button>
                        <button onClick={() => handleRemove(item.id)} style={{ background: '#ffcdd2', color: '#c62828', borderRadius: 8, padding: '0.3rem 1rem', border: 'none' }}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#bbb', textAlign: 'center', fontStyle: 'italic' }}>No items</div>
            )}
          </div>
        ))}
      </div>
      {/* Add Item Popup */}
      {addPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleAddPopupSubmit} style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 8px 48px #23252622', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: accentColor, marginBottom: 8 }}>Add to {addPopup}</h3>
            <input name="name" value={addFields.name || ''} onChange={e => setAddFields(f => ({ ...f, name: e.target.value }))} placeholder="Name" required style={{ minWidth: 120 }} autoFocus />
            <input name="price" value={addFields.price || ''} onChange={e => {
              const val = e.target.value.replace(/[^\d.]/g, '');
              setAddFields(f => ({ ...f, price: val }));
            }} placeholder="Price" required style={{ minWidth: 80 }} />
            <input name="description" value={addFields.description || ''} onChange={e => setAddFields(f => ({ ...f, description: e.target.value }))} placeholder="Description" style={{ minWidth: 160 }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <button type="submit" style={{ background: mainColor, color: '#fff', borderRadius: 8, padding: '0.5rem 1.2rem', border: 'none', fontWeight: 600 }}>Add</button>
              <button type="button" onClick={closeAddPopup} style={{ background: '#eee', color: '#232526', borderRadius: 8, padding: '0.5rem 1.2rem', border: 'none', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {/* Remove selected button */}
      {selected.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={handleRemoveSelected} style={{ background: '#ffcdd2', color: '#c62828', borderRadius: 8, padding: '0.7rem 2rem', border: 'none', fontWeight: 600, fontSize: 18 }}>Remove all selected items</button>
        </div>
      )}
      {/* Save Button */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button onClick={saveMenu} disabled={saving} style={{ background: mainColor, color: '#fff', borderRadius: 8, padding: '0.7rem 2.5rem', border: 'none', fontWeight: 700, fontSize: 20, boxShadow: '0 2px 8px #23252622', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {/* Confirmation Modal */}
      {confirmRemove && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 8px 48px #23252622', textAlign: 'center' }}>
            <h3>Are you sure you want to remove {confirmRemove.multi ? 'all selected items' : 'this item'}?</h3>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
              <button onClick={confirmRemoveAction} style={{ background: '#c62828', color: '#fff', borderRadius: 8, padding: '0.5rem 2rem', border: 'none' }}>Yes, Remove</button>
              <button onClick={() => setConfirmRemove(null)} style={{ background: '#eee', color: '#232526', borderRadius: 8, padding: '0.5rem 2rem', border: 'none' }}>Cancel</button>
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
const API_URL = 'http://localhost:4000/api/dashboard-content';

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
  const [dashboardView, setDashboardView] = useState<'page'|'menu'|'newsletter'>('page');
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
  // Add state for block delete confirmation
  const [blockToDelete, setBlockToDelete] = useState<{pageIdx: number, blockIdx: number} | null>(null);
  // Add state for custom colors:
  const [customColors, setCustomColors] = useState<string[]>(['#d500f9']);
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
    function handleClickOutside(event: MouseEvent) {
      if (
        mainColorDropdownRef.current &&
        !mainColorDropdownRef.current.contains(event.target as Node)
      ) {
        setMainColorDropdownOpen(false);
      }
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
        setContent(ensureBlockIds(data.content));
        setHistory(data.history || []);
        setActiveVersion(data.content?.__versionMeta?.version || '1');
      } catch {
        setContent(ensureBlockIds(defaultContent));
        setHistory([]);
        setActiveVersion('1');
      }
    })();
  }, []);

  // --- Save to backend ---
  const handleSave = async () => {
    setSaveStatus('saving');
    const nextVer = getNextMainVersion(history);
    const meta = { version: nextVer, timestamp: Date.now(), name: versionName || '', note: versionNote || '' };
    const contentWithMeta = { ...content, __versionMeta: meta };
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
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // TODO: Replace this with real upload logic to your backend/cloud storage
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      newImages.push(url);
    }
    setContent(prev => ({ ...prev, backgroundImages: [...prev.backgroundImages, ...newImages] }));
    e.target.value = '';
  };

  // Add state for block type selection
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);

  return (
    <div className="dashboard-root">
      <header>
        <img src="/Images/LogoSquare.png" alt="GuusCode Logo" />
        <h1>GuusCode Site Builder</h1>
        <span>Admin Dashboard</span>
      </header>
      {/* Main dashboard navigation */}
      <nav className="dashboard-main-nav" style={{ display: 'flex', gap: 16, margin: '24px 0' }}>
        <button className={dashboardView === 'page' ? 'active' : ''} onClick={() => setDashboardView('page')}>Page Editor</button>
        <button className={dashboardView === 'menu' ? 'active' : ''} onClick={() => setDashboardView('menu')}>Edit Menu</button>
        <button className={dashboardView === 'newsletter' ? 'active' : ''} onClick={() => setDashboardView('newsletter')}>Newsletter</button>
      </nav>
      {/* Page Editor View */}
      {dashboardView === 'page' && (
        <>
          <div>
            <div className="dashboard-settings-card">
              <h2>Site Settings</h2>
              <div className="dashboard-settings-section">
                <label className="dashboard-settings-label">
                  Header Text
                  <input name="logoText" value={content.logoText} onChange={handleField} className="dashboard-settings-input" />
                </label>
              </div>
              <div className="dashboard-settings-section">
                <div className="dashboard-settings-row">
                  <label className="dashboard-settings-label">Main Color</label>
                  <div className="color-dropdown-wrapper" ref={mainColorDropdownRef}>
                    <button
                      className="color-dropdown-btn"
                      type="button"
                      onClick={() => setMainColorDropdownOpen(o => !o)}
                      aria-haspopup="listbox"
                      aria-expanded={mainColorDropdownOpen}
                    >
                      <span className="color-dropdown-circle" style={{ background: content.mainColor }} />
                      <span className="color-dropdown-caret"></span>
                    </button>
                    {mainColorDropdownOpen && (
                      <div className="color-dropdown-menu">
                        <div className="color-palette-group">
                          <div className="color-palette-label">THEME</div>
                          <div className="color-palette-row">
                            {THEME_COLORS.map(color => (
                              <button
                                key={color}
                                className={`color-swatch${content.mainColor === color ? ' selected' : ''}`}
                                style={{ background: color, borderColor: color === '#fff' ? '#ccc' : color }}
                                onClick={() => { setMainColorFromPalette(color); setMainColorDropdownOpen(false); }}
                                aria-label={`Set main color to ${color}`}
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
                                aria-label={`Set main color to ${color}`}
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
                                  aria-label={`Set main color to ${color}`}
                                />
                                <button className="color-swatch-remove" onClick={() => removeCustomColor(color)} aria-label="Remove custom color">×</button>
                              </div>
                            ))}
                            <label className="color-swatch-add">
                              +
                              <input type="color" style={{ opacity: 0, width: 0, height: 0 }} onChange={e => addCustomColor(e.target.value)} />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="dashboard-settings-row">
                  <label className="dashboard-settings-label">Accent Color</label>
                  <div className="color-dropdown-wrapper" ref={accentColorDropdownRef}>
                    <button
                      className="color-dropdown-btn"
                      type="button"
                      onClick={() => setAccentColorDropdownOpen(o => !o)}
                      aria-haspopup="listbox"
                      aria-expanded={accentColorDropdownOpen}
                    >
                      <span className="color-dropdown-circle" style={{ background: content.accentColor }} />
                      <span className="color-dropdown-caret"></span>
                    </button>
                    {accentColorDropdownOpen && (
                      <div className="color-dropdown-menu">
                        <div className="color-palette-group">
                          <div className="color-palette-label">THEME</div>
                          <div className="color-palette-row">
                            {THEME_COLORS.map(color => (
                              <button
                                key={color}
                                className={`color-swatch${content.accentColor === color ? ' selected' : ''}`}
                                style={{ background: color, borderColor: color === '#fff' ? '#ccc' : color }}
                                onClick={() => { setAccentColorFromPalette(color); setAccentColorDropdownOpen(false); }}
                                aria-label={`Set accent color to ${color}`}
                              />
                            ))}
                          </div>
                          <div className="color-palette-label">DEFAULT</div>
                          <div className="color-palette-row">
                            {DEFAULT_COLORS.map(color => (
                              <button
                                key={color}
                                className={`color-swatch${content.accentColor === color ? ' selected' : ''}`}
                                style={{ background: color, borderColor: color === '#fff' ? '#ccc' : color }}
                                onClick={() => { setAccentColorFromPalette(color); setAccentColorDropdownOpen(false); }}
                                aria-label={`Set accent color to ${color}`}
                              />
                            ))}
                          </div>
                          <div className="color-palette-label">CUSTOM</div>
                          <div className="color-palette-row">
                            {customColors.map(color => (
                              <div key={color} style={{ position: 'relative' }}>
                                <button
                                  className={`color-swatch${content.accentColor === color ? ' selected' : ''}`}
                                  style={{ background: color, borderColor: color === '#fff' ? '#ccc' : color }}
                                  onClick={() => { setAccentColorFromPalette(color); setAccentColorDropdownOpen(false); }}
                                  aria-label={`Set accent color to ${color}`}
                                />
                                <button className="color-swatch-remove" onClick={() => removeCustomColor(color)} aria-label="Remove custom color">×</button>
                              </div>
                            ))}
                            <label className="color-swatch-add">
                              +
                              <input type="color" style={{ opacity: 0, width: 0, height: 0 }} onChange={e => addCustomColor(e.target.value)} />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="dashboard-settings-section">
                <h3>Background Images</h3>
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
                          <Draggable key={img} draggableId={img} index={i}>
                            {prov => (
                              <div
                                className="dashboard-bgimg-thumb"
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                              >
                                <img src={img} alt="Background" />
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
                  Add Image
                </button>
              </div>
            </div>
            <hr />
            <div>
              <h2>Pages & Content Blocks</h2>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="pages" type="page" direction="vertical">
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="dashboard-pages-area"
                    >
                      {/* Only show pages that are not menu/contact (filter by path) */}
                      {content.pages.filter(page => page.path !== '/menu' && page.path !== '/contact').map((page) => {
                        // Find the real index in content.pages
                        const realIdx = content.pages.findIndex(p => p.id === page.id);
                        return (
                          <Draggable key={page.id} draggableId={page.id} index={realIdx}>
                            {(prov: DraggableProvided) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                className={`dashboard-page-card${selectedPage === realIdx ? ' selected' : ''}`}
                                onClick={() => setSelectedPage(realIdx)}
                              >
                                <button
                                  {...prov.dragHandleProps}
                                  className="dashboard-page-drag"
                                  type="button"
                                  tabIndex={-1}
                                  aria-label="Drag page"
                                  onMouseDown={() => document.activeElement instanceof HTMLElement && document.activeElement.blur()}
                                >
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect y="6" width="24" height="2.5" rx="1.25" fill="#b2b8c6"/><rect y="11" width="24" height="2.5" rx="1.25" fill="#b2b8c6"/><rect y="16" width="24" height="2.5" rx="1.25" fill="#b2b8c6"/></svg>
                                </button>
                                <input value={page.title} onChange={e => handlePage(realIdx, 'title', e.target.value)} />
                                <input value={page.path} onChange={e => handlePage(realIdx, 'path', e.target.value)} />
                                <button onClick={e => { e.stopPropagation(); removePage(realIdx); }} aria-label="Remove Page" title="Remove Page" className="dashboard-block-delete">
                                  Remove
                                </button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={addPage}
                    aria-label="Add Page"
                    className="dashboard-add-page-btn"
                    title="Add Page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {/* Non-deletable, editable hero section for the selected page */}
                <section className="dashboard-hero-section">
                  <label>Hero Title</label>
                  <input
                    type="text"
                    value={content.pages[selectedPage]?.heroTitle || ''}
                    onChange={e => handlePage(selectedPage, 'heroTitle', e.target.value)}
                    className="dashboard-hero-title-input"
                  />
                  <label>Hero Subtitle</label>
                  <input
                    type="text"
                    value={content.pages[selectedPage]?.heroSubtitle || ''}
                    onChange={e => handlePage(selectedPage, 'heroSubtitle', e.target.value)}
                    className="dashboard-hero-subtitle-input"
                  />
                </section>
                <h3>Blocks for: {content.pages[selectedPage]?.title}</h3>
                <Droppable droppableId={`blocks-${selectedPage}`} type={`block-${selectedPage}`}>
                  {(provided: DroppableProvided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {content.pages[selectedPage]?.blocks.map((block, j) => (
                        <Draggable key={block.id} draggableId={block.id} index={j}>
                          {(prov: DraggableProvided) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className="dashboard-block-card"
                            >
                              <div className="dashboard-block-header-grid">
                                <button
                                  {...prov.dragHandleProps}
                                  className="dashboard-block-drag"
                                  type="button"
                                  tabIndex={-1}
                                  aria-label="Drag block"
                                  onMouseDown={() => document.activeElement instanceof HTMLElement && document.activeElement.blur()}
                                >
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect y="6" width="24" height="2.5" rx="1.25" fill="#b2b8c6"/><rect y="11" width="24" height="2.5" rx="1.25" fill="#b2b8c6"/><rect y="16" width="24" height="2.5" rx="1.25" fill="#b2b8c6"/></svg>
                                </button>
                                <select
                                  value={block.type}
                                  onChange={e => handleBlock(selectedPage, j, 'type', e.target.value)}
                                  className="dashboard-block-type"
                                >
                                  <option value="heading">Heading</option>
                                  <option value="text">Text</option>
                                  <option value="divider">Divider</option>
                                  <option value="quote">Quote</option>
                                </select>
                              </div>
                              {block.type === 'heading' ? (
                                <input value={block.text} onChange={e => handleBlock(selectedPage, j, 'text', e.target.value)} className="dashboard-block-input" />
                              ) : block.type === 'divider' ? (
                                <hr className="dashboard-block-divider" />
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
                              <button
                                className="dashboard-block-remove-btn"
                                onClick={() => setBlockToDelete({ pageIdx: selectedPage, blockIdx: j })}
                                type="button"
                              >
                                Remove
                              </button>
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
          <div className="dashboard-version-bar">
            <button
              onClick={() => setShowVersionModal(true)}
              disabled={saveStatus === 'saving'}
              className="dashboard-version-btn"
            >
              Save
            </button>
            <span className="dashboard-version-status">
              {saveStatus === 'saved' ? 'Saved' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'Saving...'}
            </span>
            <span className="dashboard-version-current-label">
              Current Version: {activeVersion}
            </span>
            <button
              onClick={() => setShowHistory(h => !h)}
              className="dashboard-version-btn"
            >
              {showHistory ? 'Hide' : 'Show'} Version History
            </button>
          </div>
          {showHistory && (
            <div className="dashboard-version-history">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>Version History</h4>
                <button onClick={() => { handleClearHistory(); setShowHistory(false); }} className="dashboard-version-clear-btn">Clear All History</button>
              </div>
              <div>
                {history.map((h, i) => {
                  const v = h.__versionMeta?.version || (history.length - i).toString();
                  const isActive = v === activeVersion;
                  return (
                    <React.Fragment key={v}>
                      <div className={`dashboard-version-row${isActive ? ' dashboard-version-current' : ''}`}> 
                        <div className="dashboard-version-info">
                          <span className="dashboard-version-dot">{isActive ? '●' : '○'}</span>
                          <span className="dashboard-version-number">v{v}</span>
                          {h.__versionMeta?.name && <span className="dashboard-version-name">{h.__versionMeta.name}</span>}
                        </div>
                        <div className="dashboard-version-actions">
                          <button onClick={() => { handleRevert(h); setShowHistory(false); }} className="dashboard-version-btn">Revert</button>
                          <button onClick={() => handleDeleteVersion(i)} className="dashboard-version-btn">Delete</button>
                          <button onClick={() => openEditNoteModal(i)} className="dashboard-version-btn">Show/Edit Note</button>
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
          {showVersionModal && (
            <div className="modal">
              <div className="modal-content">
                <h3>New Version</h3>
                <label>
                  Version Title (optional):
                  <input value={versionName} onChange={e => setVersionName(e.target.value)} />
                </label>
                <label>
                  Version Note (optional):
                  <textarea value={versionNote} onChange={e => setVersionNote(e.target.value)} />
                </label>
                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                  <button onClick={handleSave} className="dashboard-version-btn">Save Version</button>
                  <button onClick={() => { setShowVersionModal(false); setVersionName(''); setVersionNote(''); setPendingVersionType(null); }} className="dashboard-version-btn">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {deleteConfirmIdx !== null && (
            <div>
              <div>
                <h3>Confirm Delete</h3>
                <p>Are you sure you want to delete this version? This cannot be undone.</p>
                <div>
                  <button onClick={confirmDelete}>Yes, Delete</button>
                  <button onClick={cancelDelete}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {showNoteModal && noteModalContent && (
            <div>
              <div>
                <h3>Note for v{noteModalContent.version}{noteModalContent.title ? `: ${noteModalContent.title}` : ''}</h3>
                <div>{noteModalContent.note || <span>(No note provided)</span>}</div>
                <div>
                  <button onClick={closeNoteModal}>Close</button>
                </div>
              </div>
            </div>
          )}
          {editNoteModal && (
            <div>
              <div>
                <h3>Edit Note/Title for v{editNoteModal.version}</h3>
                <label>
                  Version Title (optional):
                  <input value={editNoteModal.name} onChange={e => setEditNoteModal(m => m ? { ...m, name: e.target.value } : m)} />
                </label>
                <label>
                  Version Note (optional):
                  <textarea value={editNoteModal.note} onChange={e => setEditNoteModal(m => m ? { ...m, note: e.target.value } : m)} />
                </label>
                <div>
                  <button onClick={saveEditNoteModal}>Save</button>
                  <button onClick={closeEditNoteModal}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {/* Confirmation modal for block delete */}
          {blockToDelete && (
            <div className="modal">
              <div className="modal-content">
                <h3>Delete Block</h3>
                <p>Are you sure you want to delete this block?</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                  <button
                    style={{ background: '#d32f2f', color: '#fff' }}
                    onClick={() => {
                      removeBlock(blockToDelete.pageIdx, blockToDelete.blockIdx);
                      setBlockToDelete(null);
                    }}
                  >
                    Delete
                  </button>
                  <button onClick={() => setBlockToDelete(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Menu Editor View */}
      {dashboardView === 'menu' && (
        <MenuPanel
          menu={content.menu || []}
          onChange={menu => setContent(prev => ({ ...prev, menu }))}
          mainColor={content.mainColor}
          accentColor={content.accentColor}
        />
      )}
      {/* Newsletter View */}
      {dashboardView === 'newsletter' && (
        <div className="dashboard-newsletter-editor">
          <h2>Newsletter</h2>
          <p>This is a placeholder for newsletter management.</p>
        </div>
      )}
      {/* ...existing version/history modals and block delete modal... */}
    </div>
  );
};

export default Dashboard;
