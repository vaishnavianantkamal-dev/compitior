import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { api } from '../api.js';

export default function Layout() {
  const [analyses, setAnalyses] = useState([]);
  const [health, setHealth] = useState(null);
  const [search, setSearch] = useState('');

  const refresh = useCallback(() => {
    api.list().then(setAnalyses).catch(() => {});
  }, []);

  const refreshHealth = useCallback(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  useEffect(() => {
    refresh();
    refreshHealth();
  }, [refresh, refreshHealth]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? analyses.filter((a) =>
        a.business?.name?.toLowerCase().includes(q) || a.business?.industry?.toLowerCase().includes(q)
      )
    : analyses;

  return (
    <div className="app-shell">
      <Sidebar creditsUsed={analyses.length} creditsTotal={20} />
      <div className="app-main">
        <Topbar search={search} onSearch={setSearch} health={health} />
        <main className="app-content">
          <Outlet context={{ analyses, filtered, search, refresh, health, refreshHealth }} />
        </main>
      </div>
    </div>
  );
}
