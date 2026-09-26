import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, ArrowRight, Bookmark, Trash2 } from 'lucide-react';
import ScoreRing from './ScoreRing.jsx';
import { api } from '../api.js';
import { initials, avatarHue, formatDate } from '../utils.js';

export default function AnalysisCard({ item, onChanged }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const b = item.business || {};
  const score = item.viability?.score;
  const isRunning = !['done', 'failed'].includes(item.status);

  async function toggleSave(e) {
    e.preventDefault();
    setMenuOpen(false);
    await api.save(item._id, !item.saved);
    onChanged?.();
  }

  async function remove(e) {
    e.preventDefault();
    setMenuOpen(false);
    if (!confirm(`Delete the analysis for ${b.name}?`)) return;
    await api.remove(item._id);
    onChanged?.();
  }

  return (
    <article className="a-card">
      <div className="a-card-top">
        <span className="a-thumb" style={{ background: `hsl(${avatarHue(b.name)} 45% 40%)` }}>
          {initials(b.name)}
        </span>
        <div className="a-card-title">
          <strong>{b.name}</strong>
          <span className="muted">{[b.location, b.industry].filter(Boolean).join(' · ') || 'Business'}</span>
        </div>
        <span className="a-card-date muted">{formatDate(item.createdAt)}</span>
        <div className="a-card-menu">
          <button type="button" className="icon-btn sm" onClick={() => setMenuOpen((s) => !s)} aria-label="More options">
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="popover popover-sm">
              <button type="button" className="menu-item" onClick={toggleSave}>
                <Bookmark size={14} /> {item.saved ? 'Remove from saved' : 'Save idea'}
              </button>
              <button type="button" className="menu-item danger" onClick={remove}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {isRunning ? (
        <p className="notice">Analysis running… check back shortly.</p>
      ) : item.status === 'failed' ? (
        <p className="notice risk">Analysis failed.</p>
      ) : (
        <div className="a-card-stats">
          <div className="a-stat">
            <span className="muted sm-label">Market Score</span>
            <ScoreRing score={score} size={56} />
          </div>
          <Stat value={item.competitorsCount} label="Competitors" />
          <Stat value={item.gapsCount} label="Market Gaps" />
          <Stat value={item.recommendationsCount} label="Recommendations" />
        </div>
      )}

      <Link to={`/analysis/${item._id}`} className="btn ghost block">
        View Full Report <ArrowRight size={15} />
      </Link>
    </article>
  );
}

function Stat({ value, label }) {
  return (
    <div className="a-stat">
      <strong className="a-stat-num">{value ?? '–'}</strong>
      <span className="muted sm-label">{label}</span>
    </div>
  );
}
