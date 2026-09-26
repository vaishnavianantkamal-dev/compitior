import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { api } from '../api.js';
import AnalysisCard from '../components/AnalysisCard.jsx';

export default function SavedIdeas() {
  const { search } = useOutletContext();
  const [saved, setSaved] = useState(null);

  const load = useCallback(() => {
    api.list({ saved: true }).then(setSaved).catch(() => setSaved([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = (saved || []).filter((a) =>
    !q || a.business?.name?.toLowerCase().includes(q) || a.business?.industry?.toLowerCase().includes(q)
  );

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Saved Ideas</h1>
          <p className="muted">Analyses you've bookmarked to revisit later.</p>
        </div>
      </div>

      {saved === null ? (
        <p className="empty">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="empty">
          <Bookmark size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          No saved ideas yet. Open any report and use the <strong>Save</strong> button, or the ⋮ menu on a card in{' '}
          <Link to="/past-analyses">Past Analyses</Link>.
        </p>
      ) : (
        <div className="card-grid">
          {filtered.map((item) => <AnalysisCard key={item._id} item={item} onChanged={load} />)}
        </div>
      )}
    </div>
  );
}
