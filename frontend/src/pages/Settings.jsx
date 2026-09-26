import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, Save } from 'lucide-react';
import { api } from '../api.js';

const EMPTY_FORM = {
  anthropicApiKey: '', anthropicModel: '', apifyToken: '', apifyCountry: '', maxCompetitorsToCrawl: '', publishWebhookUrl: '',
};

export default function Settings() {
  const { health, analyses, refreshHealth } = useOutletContext();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  function loadConfig() {
    api.getConfig().then((c) => {
      setConfig(c);
      setForm({
        anthropicApiKey: '', apifyToken: '',
        anthropicModel: c.anthropicModel, apifyCountry: c.apifyCountry,
        maxCompetitorsToCrawl: c.maxCompetitorsToCrawl, publishWebhookUrl: c.publishWebhookUrl,
      });
    });
  }

  useEffect(() => { loadConfig(); }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      await api.updateConfig(form);
      setStatus('Saved. New requests will use the updated values right away.');
      setForm((f) => ({ ...f, anthropicApiKey: '', apifyToken: '' }));
      loadConfig();
      refreshHealth();
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="muted">Connection status and app configuration.</p>
        </div>
      </div>

      <section className="card settings-card">
        <h2>Integrations</h2>
        <p className="muted">Live status, read from the running server.</p>
        <ul className="status-list lg">
          <Row ok={health?.ok} label="API server" detail={health?.ok ? 'Reachable' : 'Not reachable — start it with npm start in backend'} />
          <Row ok={health?.anthropic} label="Anthropic (Claude)" detail={health?.anthropic ? 'ANTHROPIC_API_KEY configured' : 'ANTHROPIC_API_KEY missing'} />
          <Row ok={health?.apify} label="Apify (competitor research)" detail={health?.apify ? 'APIFY_TOKEN configured' : 'APIFY_TOKEN missing'} />
          <Row ok={health?.publishWebhook} warn label="Publish webhook" detail={health?.publishWebhook ? 'PUBLISH_WEBHOOK_URL configured' : 'Optional — not set'} />
        </ul>
      </section>

      <section className="card settings-card">
        <h2>API keys & options</h2>
        <p className="muted">
          Saved directly to <code>backend/.env</code> and applied immediately — no restart needed. This app has no
          login, so only run it somewhere you trust.
        </p>
        <form onSubmit={save} className="intake-form">
          <label className="field">
            <span>Anthropic API key</span>
            <input
              type="password"
              value={form.anthropicApiKey}
              onChange={update('anthropicApiKey')}
              placeholder={config?.anthropicApiKey || 'sk-ant-…'}
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Anthropic model</span>
            <input value={form.anthropicModel} onChange={update('anthropicModel')} placeholder="claude-sonnet-5" />
          </label>

          <label className="field">
            <span>Apify token</span>
            <input
              type="password"
              value={form.apifyToken}
              onChange={update('apifyToken')}
              placeholder={config?.apifyToken || 'apify_api_…'}
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Apify search country (ISO code)</span>
            <input value={form.apifyCountry} onChange={update('apifyCountry')} placeholder="in" />
          </label>

          <label className="field">
            <span>Max competitors to crawl</span>
            <input type="number" min="1" max="20" value={form.maxCompetitorsToCrawl} onChange={update('maxCompetitorsToCrawl')} />
          </label>
          <label className="field">
            <span>Publish webhook URL (optional)</span>
            <input value={form.publishWebhookUrl} onChange={update('publishWebhookUrl')} placeholder="https://hook.make.com/…" />
          </label>

          {status && <p className={`notice wide ${status.includes('Saved') ? '' : 'risk'}`}>{status}</p>}
          <div className="wide">
            <button type="submit" className="btn primary" disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
          <p className="fine wide">Leave a key field blank to keep its current value — it won't be cleared.</p>
        </form>
      </section>

      <section className="card settings-card">
        <h2>Usage</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <strong className="stat-card-value">{analyses.length}</strong>
            <span className="muted">Analyses stored</span>
          </div>
          <div className="stat-card">
            <strong className="stat-card-value">{analyses.filter((a) => a.saved).length}</strong>
            <span className="muted">Saved ideas</span>
          </div>
        </div>
        <p className="muted">
          Every "Run Market Analysis" call uses Apify credits (Google search + website crawl) and one Claude request.
          Plan limits depend on your Apify and Anthropic account tiers, not this app.
        </p>
      </section>
    </div>
  );
}

function Row({ ok, warn, label, detail }) {
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : XCircle;
  return (
    <li>
      <Icon size={16} className={ok ? 'ic-good' : warn ? 'ic-warn' : 'ic-risk'} />
      <div>
        <strong>{label}</strong>
        <span className="muted"> — {detail}</span>
      </div>
    </li>
  );
}
