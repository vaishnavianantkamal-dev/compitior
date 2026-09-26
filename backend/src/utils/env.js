import fs from 'node:fs';

// Reads a .env file into a plain object. Missing file returns {}.
export function readEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  const out = {};
  for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

// Updates specific keys in a .env file, preserving everything else (comments, order, blank lines).
// Keys that don't exist yet are appended. Pass `undefined` to leave a key untouched.
export function writeEnvUpdates(path, updates) {
  const lines = fs.existsSync(path) ? fs.readFileSync(path, 'utf8').split('\n') : [];
  const remaining = new Map(Object.entries(updates).filter(([, v]) => v !== undefined));

  const next = lines.map((line) => {
    const m = /^([A-Z0-9_]+)=/.exec(line.trim());
    if (m && remaining.has(m[1])) {
      const key = m[1];
      const value = remaining.get(key);
      remaining.delete(key);
      return `${key}=${value}`;
    }
    return line;
  });

  while (next.length && next[next.length - 1] === '') next.pop();
  for (const [key, value] of remaining) next.push(`${key}=${value}`);

  fs.writeFileSync(path, next.join('\n') + '\n');
}
