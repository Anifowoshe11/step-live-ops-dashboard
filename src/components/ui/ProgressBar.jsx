export default function ProgressBar({ label, value, max, color }) {
  const fill = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="prog">
      <div className="prog-meta">
        <span>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{value}</span>
      </div>
      <div className="prog-bg">
        <div className="prog-fill" style={{ width: `${fill}%`, background: color }} />
      </div>
    </div>
  );
}
