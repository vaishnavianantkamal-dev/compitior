import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PastAnalyses from './pages/PastAnalyses.jsx';
import Competitors from './pages/Competitors.jsx';
import MarketInsights from './pages/MarketInsights.jsx';
import SavedIdeas from './pages/SavedIdeas.jsx';
import Settings from './pages/Settings.jsx';
import HelpSupport from './pages/HelpSupport.jsx';
import ReportPage from './pages/ReportPage.jsx';
import SharedReport from './pages/SharedReport.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/past-analyses" element={<PastAnalyses />} />
        <Route path="/competitors" element={<Competitors />} />
        <Route path="/market-insights" element={<MarketInsights />} />
        <Route path="/saved-ideas" element={<SavedIdeas />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/analysis/:id" element={<ReportPage />} />
      </Route>
      <Route path="/share/:id" element={<div className="shell"><SharedReport /></div>} />
      <Route path="*" element={<div className="shell"><p className="empty">This page doesn't exist. <Link to="/">Go home</Link>.</p></div>} />
    </Routes>
  );
}
