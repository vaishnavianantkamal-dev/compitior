import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Users2, ShieldAlert, ShieldCheck, Leaf, ExternalLink, MoreVertical, Trash2, RefreshCw,
  Plus, Download, Lightbulb, Trophy, Filter as FilterIcon,
} from 'lucide-react';
import { api } from '../api.js';
import { formatDate, industryIcon } from '../utils.js';
import ThreatDonut from '../components/ThreatDonut.jsx';
import Modal from '../components/Modal.jsx';

const THREAT_RANK = { high: 3, medium: 2, low: 1, undefined: 0 };

export default function Competitors() {
  const { search } = useOutletContext();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [threat, setThreat] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [overviewIndustry, setOverviewIndustry] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setError(false);
    api.competitors().then(setRows).catch(() => { setRows([]); setError(true); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const rowKey = (c) => c.manual ? `manual-${c.manualId}` : `${c.analysisId}-${c.name}`;

  const industries = useMemo(() => {
    const set = new Set((rows || []).map((c) => c.sourceIndustry?.trim()).filter(Boolean));
    return [...set].sort();
  }, [rows]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => (rows || []).filter((c) => {
    if (threat !== 'all' && c.threatLevel !== threat) return false;
    if (industryFilter !== 'all' && c.sourceIndustry !== industryFilter) return false;
    if (!q) return true;
    return c.name?.toLowerCase().includes(q) || c.sourceBusiness?.toLowerCase().includes(q) || c.sourceIndustry?.toLowerCase().includes(q);
  }), [rows, threat, industryFilter, q]);

  const counts = useMemo(() => {
    const all = rows || [];
    return {
      total: all.length,
      high: all.filter((c) => c.threatLevel === 'high').length,
      medium: all.filter((c) => c.threatLevel === 'medium').length,
      low: all.filter((c) => c.threatLevel === 'low').length,
    };
  }, [rows]);

  const overviewRows = useMemo(() => {
    const all = rows || [];
    return overviewIndustry === 'all' ? all : all.filter((c) => c.sourceIndustry === overviewIndustry);
  }, [rows, overviewIndustry]);

  const overviewCounts = useMemo(() => ({
    high: overviewRows.filter((c) => c.threatLevel === 'high').length,
    medium: overviewRows.filter((c) => c.threatLevel === 'medium').length,
    low: overviewRows.filter((c) => c.threatLevel === 'low').length,
  }), [overviewRows]);

  const topCompetitors = useMemo(() => {
    const byName = new Map();
    for (const c of overviewRows) {
      const key = c.name?.toLowerCase();
      if (!key) continue;
      const existing = byName.get(key);
      if (!existing) byName.set(key, { ...c, count: 1 });
      else {
        existing.count += 1;
        if (THREAT_RANK[c.threatLevel] > THREAT_RANK[existing.threatLevel]) existing.threatLevel = c.threatLevel;
      }
    }
    return [...byName.values()]
      .sort((a, b) => b.count - a.count || THREAT_RANK[b.threatLevel] - THREAT_RANK[a.threatLevel])
      .slice(0, 5);
  }, [overviewRows]);

  const insights = useMemo(() => {
    const list = [];
    const total = overviewRows.length;
    if (!total) return list;
    const repeat = topCompetitors.find((c) => c.count > 1);
    if (repeat) list.push({ icon: Trophy, text: `${repeat.name} shows up across ${repeat.count} of your analyses — worth watching closely.` });
    const highPct = Math.round((overviewCounts.high / total) * 100);
    if (highPct > 0) list.push({ icon: ShieldAlert, text: `${highPct}% of these competitors are rated high threat.` });
    const home = overviewRows.filter((c) => c.region === 'home').length;
    const intl = total - home;
    if (intl > 0) list.push({ icon: Leaf, text: `${home} home-market vs ${intl} international competitors found.` });
    return list.slice(0, 3);
  }, [overviewRows, overviewCounts, topCompetitors]);

  function toggleRow(key) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelected((s) => (s.size === filtered.length ? new Set() : new Set(filtered.map(rowKey))));
  }

  function exportCsv() {
    const chosen = selected.size ? filtered.filter((c) => selected.has(rowKey(c))) : filtered;
    const header = ['Name', 'Website', 'Found via', 'Industry', 'Region', 'Positioning', 'Pricing', 'Threat', 'Found'];
    const lines = chosen.map((c) => [
      c.name, c.url, c.sourceBusiness, c.sourceIndustry || '', c.region, c.positioning || '', c.pricing || '', c.threatLevel || '', formatDate(c.foundAt),
    ].map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'competitors.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteManual(id) {
    if (!confirm('Remove this competitor?')) return;
    await api.removeCompetitor(id);
    load();
  }

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Competitors</h1>
          <p className="muted">Every competitor found across all of your market analyses. Explore their strengths, weaknesses and opportunities.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Competitor</button>
      </div>

      <div className="comp-layout">
        <div className="comp-main">
          <div className="stat-grid">
            <StatCard icon={Users2} tone="blue" label="Total Competitors" value={counts.total} />
            <StatCard icon={ShieldAlert} tone="red" label="High Threat" value={counts.high} sub={counts.total ? `${Math.round((counts.high / counts.total) * 100)}% of total` : null} />
            <StatCard icon={ShieldCheck} tone="orange" label="Medium Threat" value={counts.medium} sub={counts.total ? `${Math.round((counts.medium / counts.total) * 100)}% of total` : null} />
            <StatCard icon={Leaf} tone="green" label="Low Threat" value={counts.low} sub={counts.total ? `${Math.round((counts.low / counts.total) * 100)}% of total` : null} />
          </div>

          <div className="filter-row">
            <button type="button" className={`filter-pill ${threat === 'all' ? 'active' : ''}`} onClick={() => setThreat('all')}>All <span className="pill-count">{counts.total}</span></button>
            <button type="button" className={`filter-pill ${threat === 'high' ? 'active' : ''}`} onClick={() => setThreat('high')}>High threat <span className="pill-count">{counts.high}</span></button>
            <button type="button" className={`filter-pill ${threat === 'medium' ? 'active' : ''}`} onClick={() => setThreat('medium')}>Medium threat <span className="pill-count">{counts.medium}</span></button>
            <button type="button" className={`filter-pill ${threat === 'low' ? 'active' : ''}`} onClick={() => setThreat('low')}>Low threat <span className="pill-count">{counts.low}</span></button>
          </div>

          {(industries.length > 1 || selected.size > 0) && (
            <div className="toolbar-row">
              {industries.length > 1 && (
                <label className="sort-box">
                  <FilterIcon size={14} />
                  <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
                    <option value="all">All industries</option>
                    {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </label>
              )}
              {selected.size > 0 && (
                <button type="button" className="btn ghost" onClick={exportCsv}><Download size={15} /> Export {selected.size} selected</button>
              )}
            </div>
          )}

          {rows === null ? (
            <p className="empty">Loading competitors…</p>
          ) : error ? (
            <p className="notice risk">
              Couldn't reach the server to load competitors.{' '}
              <button type="button" className="btn ghost sm-inline" onClick={load}><RefreshCw size={13} /> Retry</button>
            </p>
          ) : filtered.length === 0 ? (
            <p className="empty">
              <Users2 size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
              No competitors found yet. Run a market analysis from <strong>Idea Check</strong> to populate this page.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={toggleAll} /></th>
                    <th>Competitor</th><th>Found via</th><th>Region</th><th>Positioning</th><th>Pricing</th><th>Threat</th><th>Found</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <CompetitorRow
                      key={rowKey(c)}
                      c={c}
                      checked={selected.has(rowKey(c))}
                      onToggle={() => toggleRow(rowKey(c))}
                      onDelete={c.manual ? () => deleteManual(c.manualId) : null}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="comp-side">
          <section className="card side-block">
            <div className="side-head" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users2 size={16} /> Market Overview</h3>
              {industries.length > 1 && (
                <select className="mini-select" value={overviewIndustry} onChange={(e) => setOverviewIndustry(e.target.value)}>
                  <option value="all">All industries</option>
                  {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              )}
            </div>
            <div className="donut-wrap">
              <ThreatDonut {...overviewCounts} />
              <ul className="donut-legend">
                <li><span className="dot-status risk" /> High threat <strong>{overviewCounts.high}</strong></li>
                <li><span className="dot-status warn" /> Medium threat <strong>{overviewCounts.medium}</strong></li>
                <li><span className="dot-status good" /> Low threat <strong>{overviewCounts.low}</strong></li>
              </ul>
            </div>
          </section>

          {topCompetitors.length > 0 && (
            <section className="card side-block">
              <header className="side-head"><Trophy size={16} /><h3>Recurring Competitors</h3></header>
              <ol className="top-list">
                {topCompetitors.map((c, i) => (
                  <li key={c.name}>
                    <span className="top-rank">{i + 1}</span>
                    <CompetitorLogo c={c} size={26} />
                    <a href={c.url} target="_blank" rel="noreferrer" className="row-link">{c.name}</a>
                    <span className={`chip sm ${c.threatLevel === 'high' ? 'risk' : c.threatLevel === 'low' ? 'good' : 'warn'}`}>
                      {c.count > 1 ? `${c.count}× found` : c.threatLevel}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {insights.length > 0 && (
            <section className="card side-block">
              <header className="side-head"><Lightbulb size={16} /><h3>Insights</h3></header>
              <ul className="insight-bullets">
                {insights.map((ins, i) => (
                  <li key={i}><ins.icon size={15} /><span>{ins.text}</span></li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {showAdd && <AddCompetitorModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <div className="stat-card">
      <span className={`stat-card-icon tone-${tone}`}><Icon size={18} /></span>
      <div>
        <span className="muted">{label}</span>
        <strong className="stat-card-value">{value}</strong>
        {sub && <span className="stat-delta">↑ {sub}</span>}
      </div>
    </div>
  );
}

function CompetitorLogo({ c, size = 32 }) {
  const [failed, setFailed] = useState(!c.url);
  const Icon = industryIcon(c.sourceIndustry);
  if (failed) {
    return <span className="a-thumb sm" style={{ width: size, height: size }}><Icon size={size * 0.5} /></span>;
  }
  return (
    <img
      className="comp-favicon" style={{ width: size, height: size }}
      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(c.url)}`}
      onError={() => setFailed(true)} alt=""
    />
  );
}

function CompetitorRow({ c, checked, onToggle, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <tr>
      <td><input type="checkbox" checked={checked} onChange={onToggle} /></td>
      <td>
        <div className="comp-name-cell">
          <CompetitorLogo c={c} />
          <div>
            {c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer" className="row-link">{c.name} <ExternalLink size={12} /></a>
            ) : <strong>{c.name}</strong>}
            <br /><span className="muted">{c.manual ? 'manually added' : c.type}</span>
          </div>
        </div>
      </td>
      <td>{c.sourceBusiness}<br /><span className="muted">{c.sourceIndustry || '—'}</span></td>
      <td>{c.region === 'home' ? 'Home market' : 'International'}</td>
      <td>{c.positioning || '—'}</td>
      <td>{c.pricing || '—'}</td>
      <td><span className={`chip ${c.threatLevel === 'high' ? 'risk' : c.threatLevel === 'low' ? 'good' : 'warn'}`}>{c.threatLevel || 'unknown'}</span></td>
      <td className="muted">{formatDate(c.foundAt)}</td>
      <td>
        <div className="a-card-menu">
          <button type="button" className="icon-btn sm" onClick={() => setMenuOpen((s) => !s)} aria-label="More options"><MoreVertical size={15} /></button>
          {menuOpen && (
            <div className="popover popover-sm">
              {!c.manual && <Link to={`/analysis/${c.analysisId}`} className="menu-item">View source analysis</Link>}
              {onDelete && <button type="button" className="menu-item danger" onClick={onDelete}><Trash2 size={14} /> Delete</button>}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

const EMPTY_FORM = { name: '', url: '', industry: '', region: 'home', positioning: '', pricing: '', threatLevel: 'medium' };

function AddCompetitorModal({ onClose, onAdded }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.addCompetitor(form);
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add a competitor" onClose={onClose}>
      <form onSubmit={submit} className="intake-form">
        <label className="field wide"><span>Name *</span><input value={form.name} onChange={update('name')} required /></label>
        <label className="field wide"><span>Website</span><input value={form.url} onChange={update('url')} placeholder="https://" /></label>
        <label className="field"><span>Industry</span><input value={form.industry} onChange={update('industry')} /></label>
        <label className="field">
          <span>Region</span>
          <select value={form.region} onChange={update('region')}>
            <option value="home">Home market</option>
            <option value="international">International</option>
          </select>
        </label>
        <label className="field wide"><span>Positioning</span><input value={form.positioning} onChange={update('positioning')} /></label>
        <label className="field"><span>Pricing</span><input value={form.pricing} onChange={update('pricing')} /></label>
        <label className="field">
          <span>Threat level</span>
          <select value={form.threatLevel} onChange={update('threatLevel')}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        {error && <p className="notice risk wide">{error}</p>}
        <div className="wide"><button type="submit" className="btn primary" disabled={saving}>{saving ? 'Adding…' : 'Add competitor'}</button></div>
      </form>
    </Modal>
  );
}
