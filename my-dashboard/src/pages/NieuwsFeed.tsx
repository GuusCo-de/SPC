import React from 'react';

export type PublicNewsPost = {
  id: string;
  title: string;
  description: string; // HTML
  images?: string[];
  bigImage?: boolean;
  datetime: string;
};

export const NieuwsFeed: React.FC<{ posts: PublicNewsPost[] }> = ({ posts }) => {
  if (!posts.length) return <div style={{ color: '#666', fontStyle: 'italic' }}>Nog geen nieuwsberichten</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {posts.map(post => (
        <div key={post.id} style={{ background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 4px 24px #00000011' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>{post.title}</h3>
            <div style={{ fontSize: 12, color: '#777' }}>{post.datetime}</div>
          </div>
          {!post.bigImage && post.images && post.images.length ? (
            <img src={post.images[0]} alt={post.title} style={{ width: 160, height: 110, objectFit: 'cover', borderRadius: 12, margin: '12px 0' }} />
          ) : null}
          <div style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: post.description }} />
          {post.bigImage && post.images && post.images.length ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {post.images.map((src, i) => (
                <img key={i} src={src} alt={`${post.title} ${i + 1}`} style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default NieuwsFeed;
