const STEPS = [
  {
    title: 'Go to Looker Studio',
    code: 'lookerstudio.google.com → + Create → Report',
  },
  {
    title: 'Connect Source 1 — Onboarding DB',
    code: `Google Sheets → STEP NETWORK ONBOARDING FORM\nTab: Form Responses 1  |  Check "Use first row as header"`,
  },
  {
    title: 'Connect Source 2 — Daily Report DB',
    code: `Resource → Manage data sources → + Add data source\nGoogle Sheets → DAILY REPORT DB  |  Join field: Agent Name`,
  },
  {
    title: 'Add 4 filter controls + date range',
    code: `Date Range: Timestamp\nDrop-down 1: Assigned Zone\nDrop-down 2: Field Agent Name\nDrop-down 3: Type of Store\nDrop-down 4: Merchant Readiness Level`,
  },
  {
    title: 'Page 1 — 5 Scorecards',
    code: `KPI 1: Record Count [Onboarding] → "Total Onboarded"\nKPI 2: SUM(Merchants Visited) [Daily] → "Merchants Visited"\nKPI 3: SUM(Couldn't Enroll)/SUM(Visited) → "Block Rate"\nKPI 4: SUM(People Approached) [Daily]\nKPI 5: COUNT DISTINCT(Agent Name) [Daily]`,
  },
  {
    title: 'Visits vs Enrolled bar chart',
    code: `Source: Daily DB  |  Dimension: Date\nMetric 1: SUM(Total Merchants Visited) → "Visited"\nMetric 2: SUM(Visited) - SUM(Couldn't Enroll) → "Enrolled"\nStyle: Grouped bars, Blue + Green`,
  },
  {
    title: 'Page 2 — Field Ops charts',
    code: `Funnel (horizontal bar):\n  Dimension: Agent Name\n  Metrics: Visited, Couldn't Enroll\nGP Outreach (grouped bar):\n  Dimension: Agent Name\n  Metrics: People Approached, GP Leads Lost`,
  },
  {
    title: 'Page 3 — Merchant charts',
    code: `Donut: Dimension = Type of Store | Metric = Record Count\nBar:   Dimension = Assigned Zone | Metric = Record Count\nTable: All Onboarding columns, sort Timestamp DESC`,
  },
  {
    title: 'Page 4 — Agent cross-source view',
    code: `Bar [Onboarding]: Field Agent Name vs Record Count\nBar [Daily]: Agent Name vs Visited + Blocked + Enrolled\nBlended Table: join Agent Name from both sources`,
  },
  {
    title: 'Create Block Rate calculated field',
    code: `Name: Block Rate\nFormula: SUM(Couldn't Enroll) / SUM(Total Merchants Visited)\nFormat: Percent`,
  },
  {
    title: 'Apply styling',
    code: `Theme: Simple Light\nPrimary: #1a73e8 (Blue)  |  #34a853 (Green)  |  #ea4335 (Red)\nFont: Google Sans (titles)  |  Roboto (body)\nCard radius: 8px`,
  },
];

export default function BuildGuide() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct" style={{ fontSize: '15px', marginBottom: '3px' }}>
          Build this in Looker Studio — step by step
        </div>
        <div className="cs" style={{ marginBottom: '14px' }}>
          11 steps to replicate this dashboard using your two Google Sheets
        </div>
        {STEPS.map((step, i) => (
          <div className="gs" key={i}>
            <div className="gn">{i + 1}</div>
            <div>
              <div className="gt">{step.title}</div>
              <span className="gc">{step.code}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="footer">Build Guide &bull; STEP Network Live Ops &bull; 2 data sources</div>
    </div>
  );
}
