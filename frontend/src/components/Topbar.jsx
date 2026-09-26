import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, HelpCircle } from 'lucide-react';

export default function Topbar({ search, onSearch, health }) {
  const [showHealth, setShowHealth] = useState(false);
  const issue = health && (!health.ok || !health.anthropic || !health.apify);

  return (
    <header className="topbar">
      <label className="search-box">
        <Search size={17} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search analyses, competitors, industries…"
        />
      </label>

      <div className="topbar-actions">
        <div className="icon-btn-wrap">
          <button type="button" className="icon-btn" onClick={() => setShowHealth((s) => !s)} aria-label="Notifications">
            <Bell size={19} />
            {issue && <span className="dot" />}
          </button>
          {showHealth && (
            <div className="popover">
              <strong>System status</strong>
              {!health ? (
                <p className="muted">Checking…</p>
              ) : !health.ok ? (
                <p className="notice risk">API server unreachable.</p>
              ) : (
                <ul className="status-list">
                  <li><span className={`dot-status ${health.anthropic ? 'good' : 'risk'}`} />Anthropic key {health.anthropic ? 'configured' : 'missing'}</li>
                  <li><span className={`dot-status ${health.apify ? 'good' : 'risk'}`} />Apify key {health.apify ? 'configured' : 'missing'}</li>
                  <li><span className={`dot-status ${health.publishWebhook ? 'good' : 'warn'}`} />Publish webhook {health.publishWebhook ? 'configured' : 'not set'}</li>
                </ul>
              )}
            </div>
          )}
        </div>
        <Link to="/help" className="icon-btn" aria-label="Help"><HelpCircle size={19} /></Link>
        <Link to="/settings" className="user-chip">
          <span className="user-avatar">AI</span>
          <span className="user-meta">
            <strong>Workspace</strong>
            <span className="muted">Admin</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
