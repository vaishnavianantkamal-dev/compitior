import { Link, useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AnalysisCard from '../components/AnalysisCard.jsx';

export default function PastAnalyses() {
  const { filtered, refresh, search } = useOutletContext();

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Past Analyses</h1>
          <p className="muted">Every business idea you've run through IdeaCheck.</p>
        </div>
        <Link to="/" className="btn primary"><Plus size={16} /> New Analysis</Link>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          {search ? 'No analyses match your search.' : <>Nothing here yet. <Link to="/">Run your first analysis</Link>.</>}
        </p>
      ) : (
        <div className="card-grid">
          {filtered.map((item) => <AnalysisCard key={item._id} item={item} onChanged={refresh} />)}
        </div>
      )}
    </div>
  );
}
