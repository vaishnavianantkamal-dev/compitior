const list = (items = []) => items.map((i) => `- ${i}`).join('\n') || '- none';

export function reportToMarkdown(analysis) {
  const b = analysis.business;
  const r = analysis.report || {};
  const out = [];

  out.push(`# Competitor Analysis: ${b.name}`);
  out.push(`_Generated ${new Date(analysis.finishedAt || analysis.updatedAt).toDateString()}_\n`);
  out.push(`## Summary\n${r.summary || ''}\n`);

  if (r.viability) {
    out.push(`## Viability: ${r.viability.score}/100 (${r.viability.verdict})\n${r.viability.reasoning}\n`);
  }

  if (r.market) {
    out.push(`## Market\n${r.market.overview || ''}\n\n### Trends\n${list(r.market.trends)}\n`);
    if (r.market.segments?.length) {
      out.push('### Segments');
      r.market.segments.forEach((s) => out.push(`- **${s.name}** (${s.fit} fit): ${s.description}`));
      out.push('');
    }
  }

  if (r.competitors?.length) {
    out.push('## Competitors\n');
    out.push('| Name | Region | Type | Positioning | Pricing | Threat |');
    out.push('|---|---|---|---|---|---|');
    r.competitors.forEach((c) =>
      out.push(`| [${c.name}](${c.url}) | ${c.region} | ${c.type} | ${c.positioning} | ${c.pricing} | ${c.threatLevel} |`)
    );
    out.push('');
    r.competitors.forEach((c) => {
      out.push(`### ${c.name}\n${c.products ? `Products: ${c.products}\n` : ''}Channels: ${c.channels || 'unknown'}\n`);
      out.push(`**Strengths**\n${list(c.strengths)}\n\n**Weaknesses**\n${list(c.weaknesses)}\n`);
    });
  }

  if (r.swot) {
    out.push('## SWOT');
    for (const k of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
      out.push(`### ${k[0].toUpperCase() + k.slice(1)}\n${list(r.swot[k])}\n`);
    }
  }

  if (r.gaps?.length) out.push(`## Market gaps\n${list(r.gaps)}\n`);

  if (r.recommendations?.length) {
    out.push('## Recommendations');
    r.recommendations.forEach((x) => out.push(`- **${x.title}** [${x.priority}, ${x.impact} impact]: ${x.detail}`));
    out.push('');
  }

  if (r.businessModel) {
    const m = r.businessModel;
    out.push(`## Business model\n**Revenue streams**\n${list(m.revenueStreams)}\n\n**Pricing:** ${m.pricing}\n\n**Channels**\n${list(m.channels)}\n\n**Unit economics:** ${m.unitEconomics}\n\n**Risks**\n${list(m.risks)}\n`);
  }

  if (r.experiments?.length) {
    out.push('## Experiments to validate');
    r.experiments.forEach((e) => out.push(`- **${e.hypothesis}**\n  - Test: ${e.test}\n  - Metric: ${e.metric}\n  - Budget: ${e.budget}`));
    out.push('');
  }

  if (r.posts?.length) {
    out.push('## Ready-to-post content');
    r.posts.forEach((p) => out.push(`### ${p.platform}\n${p.caption}\n\n${(p.hashtags || []).join(' ')}\n`));
  }

  if (analysis.warnings?.length) out.push(`## Notes\n${list(analysis.warnings)}\n`);
  return out.join('\n');
}
