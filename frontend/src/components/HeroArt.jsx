export default function HeroArt({ badges = [] }) {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-art-card">
        <div className="art-line" /><div className="art-line short" />
        <div className="art-bars"><span style={{ height: '40%' }} /><span style={{ height: '65%' }} /><span style={{ height: '50%' }} /><span style={{ height: '85%' }} /></div>
      </div>
      {badges.map((b, i) => (
        <div key={b.title} className={`float-badge badge-${i + 1}`}>
          <b.icon size={15} />
          <div><strong>{b.title}</strong><span>{b.detail}</span></div>
        </div>
      ))}
    </div>
  );
}
