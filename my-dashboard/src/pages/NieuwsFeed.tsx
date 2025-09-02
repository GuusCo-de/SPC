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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px,3.2vw,20px)' }}>
      {posts.map(post => (
        <div key={post.id} style={{ background: '#fff', padding: 'clamp(14px,3.5vw,26px)', borderRadius: 'clamp(14px,4vw,22px)', boxShadow: '0 6px 26px -8px #0002, 0 2px 10px #0001' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 'clamp(1.05rem,4.4vw,1.35rem)', lineHeight: 1.2 }}>{post.title}</h3>
            <div style={{ fontSize: 'clamp(11px,2.7vw,12px)', color: '#777', whiteSpace: 'nowrap' }}>{post.datetime}</div>
          </div>
          {!post.bigImage && post.images && post.images.length ? (
            <img src={post.images[0]} alt={post.title} style={{ width: 'clamp(150px,48vw,200px)', height: 'clamp(105px,34vw,140px)', objectFit: 'cover', borderRadius: 14, margin: '14px 0' }} />
          ) : null}
          <div style={{ marginTop: 8, fontSize: 'clamp(14px,3.4vw,16px)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: post.description }} />
          {post.bigImage && post.images && post.images.length ? (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 'clamp(10px,2.8vw,14px)' }}>
              {post.images.map((src, i) => (
                <img key={i} src={src} alt={`${post.title} ${i + 1}`} style={{ width: '100%', height: 'auto', borderRadius: 'clamp(12px,3.5vw,18px)' }} />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default NieuwsFeed;
