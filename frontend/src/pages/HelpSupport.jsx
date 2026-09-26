const FAQ = [
  {
    q: 'How does a market analysis work?',
    a: 'You describe the business on the Idea Check page. The app plans research queries, searches Google for real competitors via Apify, crawls their websites, then asks Claude to turn all of that into a scored report with market analysis, SWOT, gaps, recommendations and ready-to-post captions.',
  },
  {
    q: 'How long does it take?',
    a: 'Usually 2–5 minutes. You can navigate away — the report keeps building in the background and finishes even if you close the tab.',
  },
  {
    q: 'Where do competitors come from?',
    a: 'The Competitors page aggregates every competitor found across all of your completed analyses, so you can compare threat levels and positioning across ideas.',
  },
  {
    q: 'What are the suggested posts?',
    a: 'Each finished report includes ready-to-edit social captions (Instagram, LinkedIn, X) based on the positioning Claude recommends. Edit them inline, copy them, or publish through a Zapier/Make/n8n webhook if you\'ve set PUBLISH_WEBHOOK_URL.',
  },
  {
    q: 'Why is a section missing from my report?',
    a: 'If Apify or Claude couldn\'t find enough data, some sections may say "unknown" or be shorter than usual. Check Settings to confirm both API keys are configured, then use "Run again" on the report page.',
  },
];

export default function HelpSupport() {
  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Help & Support</h1>
          <p className="muted">Quick answers about how IdeaCheck works.</p>
        </div>
      </div>

      <div className="faq-list">
        {FAQ.map((item) => (
          <details key={item.q} className="card faq-item">
            <summary>{item.q}</summary>
            <p className="muted">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
