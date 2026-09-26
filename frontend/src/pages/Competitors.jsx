import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users2, ExternalLink } from 'lucide-react';
import { api } from '../api.js';
import { formatDate } from '../utils.js';

export default function Competitors() {
  const { search } = useOutletContext();
  const [rows, setRows] = useState(null);
  const [threat, setThreat] = useState('all');

  useEffect(() => { api.competitors().then(setRows).catch(() => setRows([])); }, []);

  const q = search.trim().toLowerCase();
  const filtered = (rows || []).filter((c) => {
    if (threat !== 'all' && c.threatLevel !== threat) return false;
    if (!q) return true;
    return c.name?.toLowerCase().includes(q) || c.sourceBusiness?.toLowerCase().includes(q) || c.sourceIndustry?.toLowerCase().includes(q);
  });

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Competitors</h1>
          <p className="muted">Every competitor found across all of your market analyses.</p>
        </div>
        <div className="segmented">
          {['all', 'high', 'medium', 'low'].map((t) => (
            <button key={t} type="button" className={`seg ${threat === t ? 'active' : ''}`} onClick={() => setThreat(t)}>
              {t === 'all' ? 'All' : `${t[0].toUpperCase()}${t.slice(1)} threat`}
            </button>
          ))}
        </div>
      </div>

      {rows === null ? (
        <p className="empty">Loading competitors…</p>
      ) : filtered.length === 0 ? (
        <p className="empty">
          <Users2 size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          No competitors found yet. Run a market analysis from <strong>Idea Check</strong> to populate this page.
        </p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Competitor</th><th>Found via</th><th>Region</th><th>Positioning</th><th>Pricing</th><th>Threat</th><th>Found</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={`${c.analysisId}-${c.name}-${i}`}>
                  <td>
                    <a href={c.url} target="_blank" rel="noreferrer" className="row-link">
                      {c.name} <ExternalLink size={12} />
                    </a>
                    <br /><span className="muted">{c.type}</span>
                  </td>
                  <td>{c.sourceBusiness}<br /><span className="muted">{c.sourceIndustry || '—'}</span></td>
                  <td>{c.region === 'home' ? 'Home market' : 'International'}</td>
                  <td>{c.positioning || '—'}</td>
                  <td>{c.pricing || '—'}</td>
                  <td><span className={`chip ${c.threatLevel === 'high' ? 'risk' : c.threatLevel === 'low' ? 'good' : 'warn'}`}>{c.threatLevel || 'unknown'}</span></td>
                  <td className="muted">{formatDate(c.foundAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
