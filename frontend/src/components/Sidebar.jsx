import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Lightbulb, History, Users2, BarChart3, Bookmark, Settings, HelpCircle, Sparkles, PenSquare,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Idea Check', icon: Lightbulb, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/past-analyses', label: 'Past Analyses', icon: History },
  { to: '/competitors', label: 'Competitors', icon: Users2 },
  { to: '/market-insights', label: 'Market Insights', icon: BarChart3 },
  { to: '/content', label: 'Content Studio', icon: PenSquare },
  { to: '/saved-ideas', label: 'Saved Ideas', icon: Bookmark },
];

const FOOT_NAV = [
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/help', label: 'Help & Support', icon: HelpCircle },
];

export default function Sidebar({ creditsUsed = 0, creditsTotal = 20 }) {
  const pct = Math.min(100, Math.round((creditsUsed / creditsTotal) * 100));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark"><Sparkles size={18} /></span>
        <span className="brand-word">IdeaCheck</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <nav className="sidebar-nav sidebar-nav-foot">
        {FOOT_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="credits-card">
        <div className="credits-top">
          <span className="credits-icon"><Sparkles size={16} /></span>
          <span className="credits-title">Analysis Credits</span>
        </div>
        <div className="credits-count">{creditsUsed} / {creditsTotal}</div>
        <div className="credits-bar"><div className="credits-fill" style={{ width: `${pct}%` }} /></div>
        <NavLink to="/settings" className="btn primary block">Upgrade Plan →</NavLink>
      </div>
    </aside>
  );
}
