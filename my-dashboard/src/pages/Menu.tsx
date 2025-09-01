import React from 'react';
import { useDashboardContent } from '../DashboardContentContext';

const MENU_CATEGORIES = ['Eten', 'Drinken', 'Snacks', 'Cocktails', 'Desserts', 'Overig'];

function priceDisplay(price: string) {
  return price ? `€${parseFloat(price).toFixed(2)}` : '';
}

const Menu: React.FC = () => {
  const content = useDashboardContent() as any;
  const menuItems = Array.isArray(content.menu) ? content.menu : [];
  // Group by category
  const grouped: { [cat: string]: any[] } = {};
  menuItems.forEach((item: { category: string; }) => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  return (
    <div className="menu-page" style={{ maxWidth: 1200, margin: '2rem auto', background: 'rgba(255,255,255,0.97)', borderRadius: 24, boxShadow: '0 8px 48px #23252622', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Menu</h1>
      <div style={{ display: 'block' }}>
        {MENU_CATEGORIES.map(cat => (
          <div key={cat} style={{ maxWidth: 480, margin: '0 auto 32px auto', background: '#f8fafc', borderRadius: 16, boxShadow: '0 2px 8px #23252611', padding: 16 }}>
            <h2 style={{ color: content.accentColor, borderBottom: '2px solid #eee', paddingBottom: 4, marginBottom: 12, textAlign: 'center' }}>{cat}</h2>
            {grouped[cat]?.length ? (
              grouped[cat].map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 10, marginBottom: 12, padding: 12, boxShadow: '0 1px 4px #23252611' }}>
                  <div style={{ fontWeight: 600, fontSize: 17 }}>{item.name}</div>
                  <div style={{ color: content.mainColor, fontWeight: 700 }}>{priceDisplay(item.price)}</div>
                  {item.description && <div style={{ color: '#666', fontSize: 14 }}>{item.description}</div>}
                </div>
              ))
            ) : (
              <div style={{ color: '#bbb', textAlign: 'center', fontStyle: 'italic' }}>Geen items</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;