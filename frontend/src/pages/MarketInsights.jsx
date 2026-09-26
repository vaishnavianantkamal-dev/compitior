import { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { TrendingUp, Target, Gauge, Users2, ArrowRight } from 'lucide-react';
import { api } from '../api.js';

export default function MarketInsights() {
  const { search } = useOutletContext();
  const [data, setData] = useState(null);

  useEffect(() => { api.insightsSummary().then(setData).catch(() => setData({ stats: {}, markets: [] })); }, []);

  const q = search.trim().toLowerCase();
  const markets = (data?.markets || []).filter((m) =>
    !q || m.business?.toLowerCase().includes(q) || m.industry?.toLowerCase().includes(q)
  );

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Market Insights</h1>
          <p className="muted">Trends and gaps pulled from every completed analysis.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon={Gauge} label="Analyses run" value={data?.stats?.totalAnalyses ?? '–'} />
        <StatCard icon={TrendingUp} label="Average market score" value={data?.stats?.avgScore ?? '–'} />
        <StatCard icon={Users2} label="Competitors tracked" value={data?.stats?.totalCompetitors ?? '–'} />
        <StatCard icon={Target} label="Market gaps found" value={data?.stats?.totalGaps ?? '–'} />
      </div>

      {data === null ? (
        <p className="empty">Loading…</p>
      ) : markets.length === 0 ? (
        <p className="empty">No completed analyses yet. <Link to="/">Run one</Link> to see market trends here.</p>
      ) : (
        <div className="insight-list">
          {markets.map((m) => (
            <article key={m.analysisId} className="card insight-card">
              <header className="insight-head">
                <div>
                  <strong>{m.business}</strong>
                  <span className="muted"> · {[m.industry, m.location].filter(Boolean).join(', ') || 'Business'}</span>
                </div>
                {m.score != null && <span className="chip good">{m.score}/100</span>}
              </header>
              {m.overview && <p className="muted">{m.overview}</p>}
              <div className="two-col">
                <div>
                  <h3>Trends</h3>
                  {m.trends?.length ? <ul className="bullets">{m.trends.map((t, i) => <li key={i}>{t}</li>)}</ul> : <p className="muted">None noted.</p>}
                </div>
                <div>
                  <h3>Gaps to own</h3>
                  {m.gaps?.length ? <ul className="bullets">{m.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul> : <p className="muted">None noted.</p>}
                </div>
              </div>
              <Link to={`/analysis/${m.analysisId}`} className="link-arrow">Full report <ArrowRight size={14} /></Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-card-icon"><Icon size={18} /></span>
      <div>
        <strong className="stat-card-value">{value}</strong>
        <span className="muted">{label}</span>
      </div>
    </div>
  );
}
