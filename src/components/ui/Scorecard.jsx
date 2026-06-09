export default function Scorecard({ label, value, sub, subType = '', colorClass = 'bl', source = '' }) {
  const srcClass =
    source === 'Merchant Onboarding Sheet' ? 'onboarding'
    : source === 'Final Day Report Sheet' ? 'daily'
    : source === 'Both Sheets' ? 'both'
    : '';
  return (
    <div className={`sc ${colorClass}`}>
      {source && <div className={`sc-src ${srcClass}`}>{source}</div>}
      <div className="sc-l">{label}</div>
      <div className="sc-v">{value ?? '—'}</div>
      {sub && <div className={`sc-s ${subType}`}>{sub}</div>}
    </div>
  );
}
