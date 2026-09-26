import { scoreTone } from '../utils.js';

export default function ScoreRing({ score = 0, verdict, size = 180 }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const small = size < 100;
  return (
    <figure
      className={`ring ${scoreTone(safe)} ${small ? 'ring-sm' : ''}`}
      style={{ width: size, height: size }}
      aria-label={`Score ${safe} out of 100${verdict ? `, ${verdict}` : ''}`}
    >
      <svg viewBox="0 0 180 180" width={size} height={size}>
        <circle cx="90" cy="90" r={r} className="ring-track" />
        <circle
          cx="90" cy="90" r={r}
          className="ring-value"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - safe / 100)}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="ring-center">
        <span className="ring-score">{safe}</span>
        {!small && verdict && <span className="ring-verdict">{verdict}</span>}
      </div>
    </figure>
  );
}
