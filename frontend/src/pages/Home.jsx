import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Layers, Sparkles, MapPin, Link2, Users, DollarSign, Users2, ArrowRight, Clock } from 'lucide-react';
import { api } from '../api.js';
import AnalysisCard from '../components/AnalysisCard.jsx';
import HeroArt from '../components/HeroArt.jsx';

const EMPTY = {
  name: '', description: '', industry: '', location: '', website: '',
  targetMarket: '', priceRange: '', knownCompetitors: '',
};

const EXAMPLE = {
  name: 'NIVAHN',
  description:
    'D2C brand selling Himalayan seabuckthorn products: seabuckthorn leaf tea, seabuckthorn berry tea blends, dried seabuckthorn berries and dried leaves. Sourced from Ladakh / Himachal, positioned as a premium caffeine-free daily wellness tea.',
  industry: 'Herbal tea / functional foods',
  location: 'India',
  website: '',
  targetMarket: 'Urban health-conscious buyers 25-45 in India, later exports to UAE, UK, US',
  priceRange: '₹300–₹900 per pack',
  knownCompetitors: 'Cherker, WellWith, Pahari Haat, Leh Berry, SeabuckWonders, SIBU',
};

const INDUSTRIES = [
  'Food & Beverage', 'Fitness & Wellness', 'Beauty & Personal Care', 'Fashion & Apparel',
  'Home & Living', 'Health & Nutrition', 'Tech / SaaS', 'Education', 'Other',
];

export default function Home() {
  const navigate = useNavigate();
  const { filtered, refresh, health } = useOutletContext();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const doc = await api.create(form);
      refresh();
      navigate(`/analysis/${doc._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const missingKeys = health && health.ok && (!health.anthropic || !health.apify);
  const recent = filtered.slice(0, 5);

  return (
    <div className="idea-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="pill"><Sparkles size={13} /> AI-Powered Market Research</span>
          <h1>Test a business idea against the real market</h1>
          <p className="lede">
            Get competitors, market insights, gaps and actionable next steps. Our AI searches Google, reads competitor
            websites and gives you a detailed report.
          </p>
        </div>
        <HeroArt badges={[
          { icon: Sparkles, title: 'Market Opportunities', detail: `${filtered.reduce((s, a) => s + (a.gapsCount || 0), 0)} gaps found` },
          { icon: Users2, title: 'Competitor Analysis', detail: `${filtered.reduce((s, a) => s + (a.competitorsCount || 0), 0)} competitors` },
        ]} />
      </section>

      <div className="idea-columns">
        <section className="card form-card">
          <header className="card-head">
            <span className="card-icon"><Layers size={18} /></span>
            <div>
              <h2>Business Information</h2>
              <p className="muted">Tell us about your business idea so we can analyze it for you.</p>
            </div>
          </header>

          {health && !health.ok && <p className="notice risk">The API server isn't reachable. Start it with <code>npm run dev</code>.</p>}
          {missingKeys && (
            <p className="notice risk">
              Add {!health.anthropic && 'ANTHROPIC_API_KEY'} {!health.anthropic && !health.apify && 'and'} {!health.apify && 'APIFY_TOKEN'} to <code>backend/.env</code>, then restart the server.
            </p>
          )}

          <form onSubmit={submit} className="intake-form">
            <label className="field wide">
              <span>What does the business do? *</span>
              <textarea
                rows={5}
                required
                minLength={30}
                maxLength={500}
                value={form.description}
                onChange={update('description')}
                placeholder="Describe your product or service, who it's for, where you sell, what makes it different…"
              />
              <span className="char-count">{form.description.length}/500</span>
            </label>

            <label className="field">
              <span>Business name *</span>
              <input value={form.name} onChange={update('name')} required placeholder="e.g. NIVAHN" />
            </label>
            <label className="field">
              <span>Industry</span>
              <select value={form.industry} onChange={update('industry')}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Home market</span>
              <div className="input-icon"><MapPin size={15} /><input value={form.location} onChange={update('location')} placeholder="India, Maharashtra, Dubai…" /></div>
            </label>
            <label className="field">
              <span>Website (if any)</span>
              <div className="input-icon"><Link2 size={15} /><input value={form.website} onChange={update('website')} placeholder="https://yourwebsite.com" /></div>
            </label>

            <label className="field wide">
              <span>Who buys it?</span>
              <div className="input-icon"><Users size={15} /><input value={form.targetMarket} onChange={update('targetMarket')} placeholder="e.g. Age group, customer type, businesses, etc." /></div>
            </label>

            <label className="field">
              <span>Price range</span>
              <div className="input-icon"><DollarSign size={15} /><input value={form.priceRange} onChange={update('priceRange')} placeholder="e.g. ₹100 - ₹500 or $10 - $50" /></div>
            </label>
            <label className="field">
              <span>Competitors you already know</span>
              <div className="input-icon"><Users2 size={15} /><input value={form.knownCompetitors} onChange={update('knownCompetitors')} placeholder="Comma separated (e.g. Zomato, Swiggy, Bl…)" /></div>
            </label>

            {error && <p className="notice risk wide">{error}</p>}

            <div className="wide">
              <button type="submit" className="btn primary block lg" disabled={submitting}>
                <Sparkles size={16} /> {submitting ? 'Starting…' : 'Run Market Analysis'} <ArrowRight size={16} />
              </button>
            </div>
            <p className="fine wide">
              <Clock size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Analysis usually takes 2–5 minutes. We'll research competitors, market gaps and opportunities for you.
            </p>
            <button type="button" className="btn ghost wide" onClick={() => setForm(EXAMPLE)}>
              Fill with NIVAHN example
            </button>
          </form>
        </section>

        <aside className="recent-panel">
          <div className="recent-head">
            <h2>Recent Analyses</h2>
            <Link to="/past-analyses" className="link-arrow">View all <ArrowRight size={14} /></Link>
          </div>
          {recent.length === 0 ? (
            <p className="empty">Your analyses will appear here after the first run.</p>
          ) : (
            <div className="recent-list">
              {recent.map((item) => <AnalysisCard key={item._id} item={item} onChanged={refresh} />)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
