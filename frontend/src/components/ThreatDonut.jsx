export default function ThreatDonut({ high = 0, medium = 0, low = 0, size = 150 }) {
  const total = high + medium + low;
  const r = 70;
  const c = 2 * Math.PI * r;
  const segments = [
    { value: high, color: 'var(--risk)' },
    { value: medium, color: 'var(--warn)' },
    { value: low, color: 'var(--good)' },
  ];
  let offset = 0;

  return (
    <figure className="donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 180 180" width={size} height={size}>
        <circle cx="90" cy="90" r={r} className="ring-track" />
        {total > 0 && segments.map((s, i) => {
          if (!s.value) return null;
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i} cx="90" cy="90" r={r} fill="none" stroke={s.color} strokeWidth="18"
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="ring-center">
        <span className="ring-score">{total}</span>
        <span className="ring-verdict">Competitors</span>
      </div>
    </figure>
  );
}
