import { Target, Lightbulb, Send } from 'lucide-react';
import ScoreRing from './ScoreRing.jsx';
import PostCard from './PostCard.jsx';

const Bullets = ({ items }) =>
  items?.length ? <ul className="bullets">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="muted">None noted.</p>;

const PRIORITY = [
  ['now', 'Do now'],
  ['next', 'Next 1–3 months'],
  ['later', 'Later'],
];

export function ReportMain({ doc }) {
  const r = doc.report || {};
  const b = doc.business;

  return (
    <>
      <section className="hero">
        <div>
          <p className="muted">{b.industry || 'Business'}{b.location ? `, ${b.location}` : ''}</p>
          <h1>{b.name}</h1>
          <p className="summary">{r.summary}</p>
        </div>
        {r.viability && <ScoreRing score={r.viability.score} verdict={r.viability.verdict} />}
      </section>

      {r.viability?.reasoning && (
        <section className="block">
          <h2>Why this score</h2>
          <p>{r.viability.reasoning}</p>
        </section>
      )}

      {r.market && (
        <section className="block">
          <h2>Market</h2>
          <p>{r.market.overview}</p>
          <div className="two-col">
            <div>
              <h3>Trends</h3>
              <Bullets items={r.market.trends} />
            </div>
            <div>
              <h3>Customer segments</h3>
              <ul className="bullets">
                {r.market.segments?.map((s) => (
                  <li key={s.name}><strong>{s.name}</strong> <span className={`chip ${s.fit === 'high' ? 'good' : s.fit === 'low' ? 'risk' : 'warn'}`}>{s.fit} fit</span><br />{s.description}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {r.competitors?.length > 0 && (
        <section className="block">
          <h2>Competitors ({r.competitors.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Brand</th><th>Where</th><th>Positioning</th><th>Pricing</th><th>Threat</th></tr>
              </thead>
              <tbody>
                {r.competitors.map((c) => (
                  <tr key={c.name + c.url}>
                    <td><a href={c.url} target="_blank" rel="noreferrer">{c.name}</a><br /><span className="muted">{c.type}</span></td>
                    <td>{c.region === 'home' ? 'Home market' : 'International'}</td>
                    <td>{c.positioning}</td>
                    <td>{c.pricing}</td>
                    <td><span className={`chip ${c.threatLevel === 'high' ? 'risk' : c.threatLevel === 'low' ? 'good' : 'warn'}`}>{c.threatLevel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="comp-details">
            {r.competitors.map((c) => (
              <details key={c.name + c.url}>
                <summary>{c.name}: strengths and weaknesses</summary>
                {c.products && <p><strong>Products:</strong> {c.products}</p>}
                {c.channels && <p><strong>Sells through:</strong> {c.channels}</p>}
                <div className="two-col">
                  <div><h3>Strengths</h3><Bullets items={c.strengths} /></div>
                  <div><h3>Weaknesses</h3><Bullets items={c.weaknesses} /></div>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {r.swot && (
        <section className="block">
          <h2>SWOT for {b.name}</h2>
          <div className="swot">
            <div className="q good"><h3>Strengths</h3><Bullets items={r.swot.strengths} /></div>
            <div className="q risk"><h3>Weaknesses</h3><Bullets items={r.swot.weaknesses} /></div>
            <div className="q good"><h3>Opportunities</h3><Bullets items={r.swot.opportunities} /></div>
            <div className="q risk"><h3>Threats</h3><Bullets items={r.swot.threats} /></div>
          </div>
        </section>
      )}

      {r.businessModel && (
        <section className="block">
          <h2>Business model</h2>
          <div className="two-col">
            <div>
              <h3>Revenue streams</h3><Bullets items={r.businessModel.revenueStreams} />
              <h3>Channels</h3><Bullets items={r.businessModel.channels} />
            </div>
            <div>
              <h3>Pricing</h3><p>{r.businessModel.pricing}</p>
              <h3>Unit economics</h3><p>{r.businessModel.unitEconomics}</p>
              <h3>Risks</h3><Bullets items={r.businessModel.risks} />
            </div>
          </div>
        </section>
      )}

      {r.experiments?.length > 0 && (
        <section className="block">
          <h2>Cheap tests before you spend big</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>If this is true…</th><th>Test it by</th><th>Success looks like</th><th>Budget</th></tr></thead>
              <tbody>
                {r.experiments.map((e, i) => (
                  <tr key={i}><td>{e.hypothesis}</td><td>{e.test}</td><td>{e.metric}</td><td>{e.budget}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {doc.warnings?.length > 0 && (
        <section className="block">
          <h2>Notes on this run</h2>
          <Bullets items={doc.warnings} />
        </section>
      )}
    </>
  );
}

export function ReportSuggestions({ doc, canPublish = false }) {
  const r = doc.report || {};

  return (
    <div className="suggestions-panel">
      {r.gaps?.length > 0 && (
        <section className="side-block">
          <header className="side-head"><Target size={16} /><h3>Market gaps you can own</h3></header>
          <Bullets items={r.gaps} />
        </section>
      )}

      {r.recommendations?.length > 0 && (
        <section className="side-block">
          <header className="side-head"><Lightbulb size={16} /><h3>Suggested improvements</h3></header>
          {PRIORITY.map(([key, label]) => {
            const items = r.recommendations.filter((x) => x.priority === key);
            if (!items.length) return null;
            return (
              <div key={key} className="rec-lane">
                <h4>{label}</h4>
                {items.map((x) => (
                  <div key={x.title} className="rec-sm">
                    <strong>{x.title}</strong>
                    <span className={`chip sm ${x.impact === 'high' ? 'good' : ''}`}>{x.impact} impact</span>
                    <p>{x.detail}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      )}

      {r.posts?.length > 0 && (
        <section className="side-block">
          <header className="side-head"><Send size={16} /><h3>Suggested posts</h3></header>
          {canPublish && <p className="muted sm">Edit a caption, then copy or publish it through your webhook.</p>}
          <div className="posts posts-stack">
            {r.posts.map((p, i) => (
              <PostCard key={i} post={p} index={i} analysisId={doc._id} canPublish={canPublish} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ReportView({ doc, canPublish = false }) {
  return (
    <>
      <ReportMain doc={doc} />
      <section className="block">
        <h2>Suggestions</h2>
        <ReportSuggestions doc={doc} canPublish={canPublish} />
      </section>
    </>
  );
}
