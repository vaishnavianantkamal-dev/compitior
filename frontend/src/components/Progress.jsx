const STEPS = [
  ['planning', 'Plan the research'],
  ['searching', 'Search Google'],
  ['selecting', 'Pick competitors'],
  ['crawling', 'Read competitor websites'],
  ['analyzing', 'Write report and posts'],
];

export default function Progress({ doc }) {
  const current = STEPS.findIndex(([key]) => key === doc.status);

  return (
    <div className="progress">
      <h1>Checking {doc.business.name}</h1>
      <p className="lede">This usually takes 2–5 minutes. You can leave this page; the report keeps building.</p>
      <ol className="steps">
        {STEPS.map(([key, label], i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'todo';
          return (
            <li key={key} className={`step ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
              <span className="step-label">{label}</span>
              {state === 'active' && <span className="step-msg">{doc.stepMessage}</span>}
            </li>
          );
        })}
      </ol>
      {doc.competitorsFound?.length > 0 && (
        <div className="found">
          <h2>Competitors found so far</h2>
          <ul>
            {doc.competitorsFound.map((c) => (
              <li key={c.url}>{c.name} <span className="muted">{c.region === 'home' ? 'home market' : 'international'}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
