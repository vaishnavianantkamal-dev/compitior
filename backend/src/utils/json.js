// Pulls the first JSON object/array out of a model reply, tolerating ```json fences and stray prose.
export function extractJson(text) {
  if (!text) throw new Error('Empty model response');
  const cleaned = text.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[\[{]/);
    if (start === -1) throw new Error('No JSON found in model response');
    const open = cleaned[start];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
      }
    }
    throw new Error('Model response contained incomplete JSON');
  }
}

export function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
