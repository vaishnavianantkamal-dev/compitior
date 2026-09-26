async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('/health'),
  list: (opts = {}) => request(`/analyses${opts.saved ? '?saved=true' : ''}`),
  get: (id) => request(`/analyses/${id}`),
  create: (business) => request('/analyses', { method: 'POST', body: business }),
  remove: (id) => request(`/analyses/${id}`, { method: 'DELETE' }),
  rerun: (id) => request(`/analyses/${id}/rerun`, { method: 'POST' }),
  share: (id, isPublic) => request(`/analyses/${id}/share`, { method: 'POST', body: { isPublic } }),
  save: (id, saved) => request(`/analyses/${id}/save`, { method: 'POST', body: { saved } }),
  publish: (id, postIndex, caption, hashtags) =>
    request(`/analyses/${id}/publish`, { method: 'POST', body: { postIndex, caption, hashtags } }),
  getPublic: (id) => request(`/public/${id}`),
  markdownUrl: (id) => `/api/analyses/${id}/markdown`,
  competitors: () => request('/insights/competitors'),
  addCompetitor: (fields) => request('/insights/competitors', { method: 'POST', body: fields }),
  removeCompetitor: (id) => request(`/insights/competitors/${id}`, { method: 'DELETE' }),
  insightsSummary: () => request('/insights/summary'),
  getConfig: () => request('/config'),
  updateConfig: (fields) => request('/config', { method: 'POST', body: fields }),
  suggestTopics: (seed) => request('/content/topics', { method: 'POST', body: { seed } }),
  listArticles: () => request('/content/articles'),
  createArticle: (topic, analysisId) => request('/content/articles', { method: 'POST', body: { topic, analysisId } }),
  getArticle: (id) => request(`/content/articles/${id}`),
  removeArticle: (id) => request(`/content/articles/${id}`, { method: 'DELETE' }),
  articleMarkdownUrl: (id) => `/api/content/articles/${id}/markdown`,
};
