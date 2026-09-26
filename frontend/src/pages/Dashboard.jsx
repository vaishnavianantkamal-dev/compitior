import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight, Users2, Target, TrendingUp, Gauge, Plus } from 'lucide-react';
import { api } from '../api.js';
import AnalysisCard from '../components/AnalysisCard.jsx';

export default function Dashboard() {
  const { filtered, refresh } = useOutletContext();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.insightsSummary().then(setSummary).catch(() => {});
  }, [filtered.length]);

  const stats = summary?.stats;

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="muted">A quick overview of every idea you've tested so far.</p>
        </div>
        <Link to="/" className="btn primary"><Plus size={16} /> New Analysis</Link>
      </div>

      <div className="stat-grid">
        <StatCard icon={Gauge} label="Analyses run" value={stats?.totalAnalyses ?? '–'} />
        <StatCard icon={TrendingUp} label="Average market score" value={stats?.avgScore ?? '–'} />
        <StatCard icon={Users2} label="Competitors tracked" value={stats?.totalCompetitors ?? '–'} />
        <StatCard icon={Target} label="Market gaps found" value={stats?.totalGaps ?? '–'} />
      </div>

      <div className="recent-head">
        <h2>Recent Analyses</h2>
        <Link to="/past-analyses" className="link-arrow">View all <ArrowRight size={14} /></Link>
      </div>
      {filtered.length === 0 ? (
        <p className="empty">Nothing here yet. <Link to="/">Run your first analysis</Link>.</p>
      ) : (
        <div className="card-grid">
          {filtered.slice(0, 6).map((item) => <AnalysisCard key={item._id} item={item} onChanged={refresh} />)}
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
