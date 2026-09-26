import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { PenSquare, Sparkles, Wand2, FileText, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api.js';
import { formatDate } from '../utils.js';

export default function Content() {
  const { analyses } = useOutletContext();
  const [seed, setSeed] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [topic, setTopic] = useState('');
  const [analysisId, setAnalysisId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [articles, setArticles] = useState(null);

  const doneAnalyses = analyses.filter((a) => a.status === 'done');

  function loadArticles() {
    api.listArticles().then(setArticles).catch(() => setArticles([]));
  }
  useEffect(() => { loadArticles(); }, []);

  async function getSuggestions(e) {
    e.preventDefault();
    setSuggesting(true);
    setError('');
    try {
      const { topics } = await api.suggestTopics(seed);
      setSuggestions(topics || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSuggesting(false);
    }
  }

  async function generate(e) {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setError('');
    try {
      await api.createArticle(topic.trim(), analysisId || undefined);
      setTopic('');
      loadArticles();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <span className="pill"><PenSquare size={13} /> Content Studio</span>
          <h1 className="page-title">Write a full article</h1>
          <p className="muted">Get topic ideas, then generate a complete long-form article with matching social posts.</p>
        </div>
      </div>

      <section className="card form-card">
        <header className="card-head">
          <span className="card-icon"><Wand2 size={18} /></span>
          <div>
            <h2>Need topic ideas?</h2>
            <p className="muted">Describe a niche (or leave blank for general startup/AI topics) and get headline ideas.</p>
          </div>
        </header>
        <form onSubmit={getSuggestions} className="toolbar-row">
          <label className="search-box search-box-flat">
            <Sparkles size={16} />
            <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="e.g. AI tools for solo founders" />
          </label>
          <button type="submit" className="btn primary" disabled={suggesting}>
            {suggesting ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />} {suggesting ? 'Thinking…' : 'Suggest topics'}
          </button>
        </form>
        {suggestions.length > 0 && (
          <div className="filter-row" style={{ marginTop: 14 }}>
            {suggestions.map((t) => (
              <button key={t} type="button" className={`filter-pill ${topic === t ? 'active' : ''}`} onClick={() => setTopic(t)}>
                {t}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card form-card">
        <header className="card-head">
          <span className="card-icon"><FileText size={18} /></span>
          <div>
            <h2>Generate the article</h2>
            <p className="muted">Pick a topic above, type your own, or write about one of your analyzed businesses.</p>
          </div>
        </header>
        <form onSubmit={generate} className="intake-form">
          <label className="field wide">
            <span>Topic</span>
            <textarea rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. How AI can help test a business idea" required minLength={5} />
          </label>
          {doneAnalyses.length > 0 && (
            <label className="field wide">
              <span>Base it on one of your businesses (optional)</span>
              <select value={analysisId} onChange={(e) => setAnalysisId(e.target.value)}>
                <option value="">General audience — no specific business</option>
                {doneAnalyses.map((a) => <option key={a._id} value={a._id}>{a.business.name}</option>)}
              </select>
            </label>
          )}
          {error && <p className="notice risk wide">{error}</p>}
          <div className="wide">
            <button type="submit" className="btn primary lg" disabled={generating}>
              {generating ? <Loader2 size={16} className="spin" /> : <PenSquare size={16} />} {generating ? 'Writing… this takes 20-40s' : 'Generate article'}
            </button>
          </div>
        </form>
      </section>

      <div className="recent-head">
        <h2>Your articles</h2>
      </div>
      {articles === null ? (
        <p className="empty">Loading…</p>
      ) : articles.length === 0 ? (
        <p className="empty">No articles yet — generate your first one above.</p>
      ) : (
        <div className="card-grid">
          {articles.map((a) => <ArticleCard key={a._id} article={a} onChanged={loadArticles} />)}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, onChanged }) {
  async function remove(e) {
    e.preventDefault();
    if (!confirm(`Delete "${article.title || article.topic}"?`)) return;
    await api.removeArticle(article._id);
    onChanged?.();
  }

  return (
    <article className="a-card">
      <div className="a-card-top">
        <span className="a-thumb" style={{ background: 'linear-gradient(150deg, #1f6b45, #123524)' }}>
          <FileText size={18} />
        </span>
        <div className="a-card-title">
          <strong>{article.title || article.topic}</strong>
          <span className="muted a-card-line">{article.wordCount ? `${article.wordCount} words` : article.status === 'failed' ? 'Generation failed' : ''}</span>
        </div>
        <span className="a-card-date muted">{formatDate(article.createdAt)}</span>
        <button type="button" className="icon-btn sm" onClick={remove} aria-label="Delete"><Trash2 size={16} /></button>
      </div>
      {article.tags?.length > 0 && (
        <div className="filter-row">
          {article.tags.slice(0, 4).map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      )}
      {article.status === 'failed' ? (
        <p className="notice risk">Something went wrong generating this one. Delete and try again.</p>
      ) : (
        <Link to={`/content/${article._id}`} className="btn soft block">
          Read article <ArrowRight size={15} />
        </Link>
      )}
    </article>
  );
}
