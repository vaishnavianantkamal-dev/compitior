import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Send } from 'lucide-react';
import { api } from '../api.js';
import { formatDate } from '../utils.js';
import Markdown from '../components/Markdown.jsx';
import PostCard from '../components/PostCard.jsx';

export default function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getArticle(id).then(setDoc).catch((e) => setError(e.message));
  }, [id]);

  async function remove() {
    if (!confirm('Delete this article?')) return;
    await api.removeArticle(id);
    navigate('/content');
  }

  if (error) return <p className="notice risk">{error}</p>;
  if (!doc) return <p className="empty">Loading article…</p>;

  return (
    <div className="report">
      <div className="toolbar">
        <Link to="/content" className="btn ghost"><ArrowLeft size={15} /> All articles</Link>
        <a className="btn ghost" href={api.articleMarkdownUrl(id)}><Download size={15} /> Download .md</a>
        <button className="btn ghost danger" onClick={remove}><Trash2 size={15} /> Delete</button>
      </div>

      <section className="hero">
        <div>
          <p className="muted">{formatDate(doc.createdAt)}{doc.wordCount ? ` · ${doc.wordCount} words` : ''}</p>
          <h1>{doc.title}</h1>
          {doc.metaDescription && <p className="summary">{doc.metaDescription}</p>}
          {doc.tags?.length > 0 && (
            <div className="filter-row" style={{ marginTop: 10 }}>
              {doc.tags.map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
          )}
        </div>
      </section>

      <div className="report-layout">
        <div className="report-main">
          <section className="block">
            <Markdown text={doc.content} />
          </section>
        </div>
        {doc.posts?.length > 0 && (
          <aside className="report-side">
            <h2 className="side-title">Suggestions</h2>
            <div className="suggestions-panel">
              <section className="side-block">
                <header className="side-head"><Send size={16} /><h3>Posts to promote this</h3></header>
                <div className="posts posts-stack">
                  {doc.posts.map((p, i) => <PostCard key={i} post={p} index={i} canPublish={false} />)}
                </div>
              </section>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
