import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { History, Plus, FileText, TrendingUp, Users2, Lightbulb, Search, ArrowUpDown } from 'lucide-react';
import AnalysisCard from '../components/AnalysisCard.jsx';
import HeroArt from '../components/HeroArt.jsx';

const SORTS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  'score-desc': (a, b) => (b.viability?.score ?? -1) - (a.viability?.score ?? -1),
  'score-asc': (a, b) => (a.viability?.score ?? 999) - (b.viability?.score ?? 999),
};

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export default function PastAnalyses() {
  const { analyses, refresh } = useOutletContext();
  const [industry, setIndustry] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = monthKey(now);
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const thisMonthCount = analyses.filter((a) => monthKey(a.createdAt) === thisMonth).length;

    const done = analyses.filter((a) => a.status === 'done' && typeof a.viability?.score === 'number');
    const avg = (list) => (list.length ? Math.round(list.reduce((s, a) => s + a.viability.score, 0) / list.length) : null);
    const avgThisMonth = avg(done.filter((a) => monthKey(a.createdAt) === thisMonth));
    const avgLastMonth = avg(done.filter((a) => monthKey(a.createdAt) === lastMonth));
    const avgAll = avg(done);
    const pctChange = avgThisMonth != null && avgLastMonth ? Math.round(((avgThisMonth - avgLastMonth) / avgLastMonth) * 100) : null;

    const totalCompetitors = analyses.reduce((s, a) => s + (a.competitorsCount || 0), 0);
    const totalGaps = analyses.reduce((s, a) => s + (a.gapsCount || 0), 0);

    return { total: analyses.length, thisMonthCount, avgAll, pctChange, totalCompetitors, totalGaps };
  }, [analyses]);

  const industries = useMemo(() => {
    const counts = new Map();
    for (const a of analyses) {
      const key = a.business?.industry?.trim() || 'Other';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [analyses]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return analyses
      .filter((a) => industry === 'all' || (a.business?.industry?.trim() || 'Other') === industry)
      .filter((a) => !query || a.business?.name?.toLowerCase().includes(query) || a.business?.industry?.toLowerCase().includes(query))
      .sort(SORTS[sort]);
  }, [analyses, industry, q, sort]);

  return (
    <div className="idea-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="pill"><History size={13} /> History</span>
          <h1>Past Analyses</h1>
          <p className="lede">Every business idea you've run through IdeaCheck. View, compare and revisit your reports.</p>
        </div>
        <HeroArt />
        <Link to="/" className="btn primary hero-cta"><Plus size={16} /> New Analysis</Link>
      </section>

      <div className="stat-grid">
        <StatCard icon={FileText} label="Total Analyses" value={stats.total} delta={stats.thisMonthCount ? `+${stats.thisMonthCount} this month` : null} />
        <StatCard icon={TrendingUp} label="Avg. Market Score" value={stats.avgAll != null ? `${stats.avgAll}/100` : '–'} delta={stats.pctChange != null ? `${stats.pctChange >= 0 ? '+' : ''}${stats.pctChange}% from last month` : null} />
        <StatCard icon={Users2} label="Total Competitors Found" value={stats.totalCompetitors} sub="Across all analyses" />
        <StatCard icon={Lightbulb} label="Total Opportunities" value={stats.totalGaps} sub="Identified market gaps" />
      </div>

      <div className="filter-row">
        <button type="button" className={`filter-pill ${industry === 'all' ? 'active' : ''}`} onClick={() => setIndustry('all')}>
          All Analyses <span className="pill-count">{analyses.length}</span>
        </button>
        {industries.map(([name, count]) => (
          <button key={name} type="button" className={`filter-pill ${industry === name ? 'active' : ''}`} onClick={() => setIndustry(name)}>
            {name} <span className="pill-count">{count}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-row">
        <label className="search-box search-box-flat">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search analyses…" />
        </label>
        <label className="sort-box">
          <ArrowUpDown size={14} />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="score-desc">Highest score</option>
            <option value="score-asc">Lowest score</option>
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <p className="empty">
          {analyses.length === 0 ? <>Nothing here yet. <Link to="/">Run your first analysis</Link>.</> : 'No analyses match your filters.'}
        </p>
      ) : (
        <div className="card-grid">
          {list.map((item) => <AnalysisCard key={item._id} item={item} onChanged={refresh} />)}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-card-icon"><Icon size={18} /></span>
      <div>
        <span className="muted">{label}</span>
        <strong className="stat-card-value">{value}</strong>
        {delta && <span className="stat-delta">↑ {delta}</span>}
        {sub && <span className="muted sm">{sub}</span>}
      </div>
    </div>
  );
}
