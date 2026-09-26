import { useState } from 'react';
import { api } from '../api.js';

const LABEL = { instagram: 'Instagram', linkedin: 'LinkedIn', x: 'X' };

export default function PostCard({ post, index, analysisId, canPublish }) {
  const [caption, setCaption] = useState(post.caption);
  const [status, setStatus] = useState('');
  const tags = post.hashtags || [];
  const fullText = `${caption}\n\n${tags.join(' ')}`.trim();

  async function copy() {
    await navigator.clipboard.writeText(fullText);
    setStatus('Copied');
  }

  async function publish() {
    setStatus('Publishing…');
    try {
      await api.publish(analysisId, index, caption, tags);
      setStatus('Published to your webhook');
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <article className="post">
      <header>
        <strong>{LABEL[post.platform] || post.platform}</strong>
        {post.goal && <span className="muted">{post.goal}</span>}
      </header>
      {canPublish ? (
        <textarea rows={7} value={caption} onChange={(e) => setCaption(e.target.value)} aria-label={`${post.platform} caption`} />
      ) : (
        <p className="post-text">{caption}</p>
      )}
      <p className="tags">{tags.join(' ')}</p>
      <div className="post-actions">
        <button className="btn ghost" onClick={copy}>Copy</button>
        {canPublish && <button className="btn primary" onClick={publish}>Publish</button>}
        {status && <span className="muted" role="status">{status}</span>}
      </div>
    </article>
  );
}
