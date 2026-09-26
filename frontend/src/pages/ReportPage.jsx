import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Bookmark, Download, Share2, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import Progress from '../components/Progress.jsx';
import { ReportMain, ReportSuggestions } from '../components/ReportView.jsx';

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const timer = useRef();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.get(id);
        if (cancelled) return;
        setDoc(data);
        if (!['done', 'failed'].includes(data.status)) timer.current = setTimeout(load, 3000);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, [id]);

  async function rerun() {
    await api.rerun(id);
    setDoc((d) => ({ ...d, status: 'queued', error: null }));
    const poll = async () => {
      const data = await api.get(id);
      setDoc(data);
      if (!['done', 'failed'].includes(data.status)) timer.current = setTimeout(poll, 3000);
    };
    poll();
  }

  async function toggleShare() {
    const { isPublic } = await api.share(id, !doc.isPublic);
    setDoc((d) => ({ ...d, isPublic }));
    if (isPublic) {
      const link = `${window.location.origin}/share/${id}`;
      await navigator.clipboard?.writeText(link).catch(() => {});
      setShareMsg(`Public link copied: ${link}`);
    } else setShareMsg('Link turned off. The report is private again.');
  }

  async function toggleSave() {
    const { saved } = await api.save(id, !doc.saved);
    setDoc((d) => ({ ...d, saved }));
    outlet?.refresh?.();
  }

  async function remove() {
    if (!confirm('Delete this report?')) return;
    await api.remove(id);
    outlet?.refresh?.();
    navigate('/');
  }

  if (error) return <p className="notice risk">{error}</p>;
  if (!doc) return <p className="empty">Loading report…</p>;

  if (doc.status === 'failed') {
    return (
      <div className="report">
        <h1>{doc.business.name}</h1>
        <p className="notice risk">The analysis stopped: {doc.error}</p>
        <div className="toolbar">
          <button className="btn primary" onClick={rerun}><RefreshCw size={15} /> Run again</button>
          <button className="btn ghost danger" onClick={remove}><Trash2 size={15} /> Delete</button>
        </div>
      </div>
    );
  }

  if (doc.status !== 'done') return <Progress doc={doc} />;

  return (
    <div className="report">
      <div className="toolbar">
        <a className="btn ghost" href={api.markdownUrl(id)}><Download size={15} /> Download .md</a>
        <button className={`btn ghost ${doc.saved ? 'active-toggle' : ''}`} onClick={toggleSave}>
          <Bookmark size={15} /> {doc.saved ? 'Saved' : 'Save idea'}
        </button>
        <button className="btn ghost" onClick={toggleShare}><Share2 size={15} /> {doc.isPublic ? 'Turn off public link' : 'Create public link'}</button>
        <button className="btn ghost" onClick={rerun}><RefreshCw size={15} /> Run again</button>
        <button className="btn ghost danger" onClick={remove}><Trash2 size={15} /> Delete</button>
      </div>
      {shareMsg && <p className="notice">{shareMsg}</p>}

      <div className="report-layout">
        <div className="report-main">
          <ReportMain doc={doc} />
        </div>
        <aside className="report-side">
          <h2 className="side-title">Suggestions</h2>
          <ReportSuggestions doc={doc} canPublish />
        </aside>
      </div>
    </div>
  );
}
