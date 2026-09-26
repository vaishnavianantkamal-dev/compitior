function inline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>
          : <span key={`${key}-${i}`}>{part}</span>
      )}
    </>
  );
}

function parse(md) {
  const lines = (md || '').split('\n');
  const blocks = [];
  let list = null;

  const flushList = () => { if (list) { blocks.push(list); list = null; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }
    if (/^###\s+/.test(line)) { flushList(); blocks.push({ t: 'h3', text: line.replace(/^###\s+/, '') }); }
    else if (/^##\s+/.test(line)) { flushList(); blocks.push({ t: 'h2', text: line.replace(/^##\s+/, '') }); }
    else if (/^#\s+/.test(line)) { flushList(); blocks.push({ t: 'h1', text: line.replace(/^#\s+/, '') }); }
    else if (/^[-*]\s+/.test(line)) { if (!list) list = { t: 'ul', items: [] }; list.items.push(line.replace(/^[-*]\s+/, '')); }
    else { flushList(); blocks.push({ t: 'p', text: line }); }
  }
  flushList();
  return blocks;
}

export default function Markdown({ text }) {
  const blocks = parse(text);
  return (
    <div className="markdown">
      {blocks.map((b, i) => {
        if (b.t === 'ul') return <ul key={i}>{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ul>;
        if (b.t === 'h1') return <h2 key={i}>{inline(b.text, i)}</h2>;
        if (b.t === 'h2') return <h2 key={i}>{inline(b.text, i)}</h2>;
        if (b.t === 'h3') return <h3 key={i}>{inline(b.text, i)}</h3>;
        return <p key={i}>{inline(b.text, i)}</p>;
      })}
    </div>
  );
}
