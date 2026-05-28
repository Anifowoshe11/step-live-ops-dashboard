import { useData } from '../../context/DataContext';

const SOURCE_HINT = {
  zone:           'Applies to both Onboarding DB and Daily DB',
  agent:          'Applies to both Onboarding DB and Daily DB',
  date:           'Filters Daily Report DB by submission date',
  onboardingType: 'Filters Onboarding DB — Merchant, GP, or Agent',
  storeType:      'Filters Onboarding DB by store category',
  readiness:      'Filters Onboarding DB by merchant readiness level',
};

export default function ControlBar() {
  const {
    filters, filterOptions, setFilter, clearAllFilters,
    lastUpdated, filtered, raw,
  } = useData();

  const activeCount = Object.values(filters).filter(Boolean).length;

  const dateLbl = lastUpdated
    ? lastUpdated.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' ' + lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Show filtered/total only when a filter is active
  const onbFiltered  = filtered.onboarding.length;
  const onbTotal     = raw.onboarding.length;
  const dailyFiltered = filtered.daily.length;
  const dailyTotal    = raw.daily.length;
  const isFiltered    = activeCount > 0;

  return (
    <div className="ctrl">

      {/* Group 1 — cross-DB filters */}
      <div className="flt-group">
        <span className="flt-group-lbl">Both DBs</span>
        <FilterSelect
          label="Zone"  options={filterOptions.zones}
          value={filters.zone}  onChange={v => setFilter('zone', v)}
          hint={SOURCE_HINT.zone}
        />
        <FilterSelect
          label="Agent" options={filterOptions.agents}
          value={filters.agent} onChange={v => setFilter('agent', v)}
          hint={SOURCE_HINT.agent}
        />
      </div>

      <div className="flt-sep" />

      {/* Group 2 — Daily DB filter */}
      <div className="flt-group">
        <span className="flt-group-lbl">Daily DB</span>
        <FilterSelect
          label="Report Date" options={filterOptions.dates}
          value={filters.date}  onChange={v => setFilter('date', v)}
          hint={SOURCE_HINT.date}
        />
      </div>

      <div className="flt-sep" />

      {/* Group 3 — Onboarding DB filters */}
      <div className="flt-group">
        <span className="flt-group-lbl">Onboarding DB</span>
        <FilterSelect
          label="Type"       options={filterOptions.onboardingTypes}
          value={filters.onboardingType} onChange={v => setFilter('onboardingType', v)}
          hint={SOURCE_HINT.onboardingType}
        />
        <FilterSelect
          label="Store Type" options={filterOptions.storeTypes}
          value={filters.storeType}      onChange={v => setFilter('storeType', v)}
          hint={SOURCE_HINT.storeType}
        />
        <FilterSelect
          label="Readiness"  options={filterOptions.readiness}
          value={filters.readiness}      onChange={v => setFilter('readiness', v)}
          hint={SOURCE_HINT.readiness}
        />
      </div>

      {/* Clear button */}
      {activeCount > 0 && (
        <button className="clear-btn" onClick={clearAllFilters}>
          ✕ Clear {activeCount} filter{activeCount !== 1 ? 's' : ''}
        </button>
      )}

      {/* Right side */}
      <div className="ctrl-r">
        {isFiltered && (
          <span className="rec-count">
            <span className="rec-dot onb" />
            {onbFiltered}/{onbTotal} onboarding
            <span className="rec-divider">·</span>
            <span className="rec-dot daily" />
            {dailyFiltered}/{dailyTotal} daily
          </span>
        )}
        <span className="date-lbl">{dateLbl}</span>
      </div>
    </div>
  );
}

function FilterSelect({ label, options, value, onChange, hint }) {
  const active = Boolean(value);
  return (
    <select
      className={`flt${active ? ' active' : ''}`}
      value={value}
      title={hint}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">{label}: All</option>
      {options.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
