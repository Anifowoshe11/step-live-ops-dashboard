import { useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import EmptyStateCard from '../components/ui/EmptyStateCard';
import { useData } from '../context/DataContext';
import Scorecard from '../components/ui/Scorecard';
import { formatCompactNumber, formatNumber } from '../utils/dataUtils';

const GRID = 'rgba(0,0,0,0.05)';
const baseScales = {
  x: { grid: { color: GRID }, border: { color: 'transparent' } },
  y: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
};
const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

export default function Overview() {
  const { dashboard, lastUpdated } = useData();
  const {
    debug,
    summary,
    onboardingRecords,
    onboardingRecordColumns,
    onboardingFilterOptions,
    onboardingByAgent,
    onboardingByDate,
    finalDaySummary,
    agentLeaderboard,
    dailyActivityTrend,
    qualityChecks,
    sourceStatus,
    emptyStates,
  } = dashboard;
  const [agentQuery, setAgentQuery] = useState('');
  const [selectedOnboardingType, setSelectedOnboardingType] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  const filteredOnboardingRecords = useMemo(
    () =>
      onboardingRecords.filter((record) => {
        const matchesAgent = !agentQuery
          || record.agentName.toLowerCase().includes(agentQuery.trim().toLowerCase());
        const matchesType = !selectedOnboardingType || record.onboardingType === selectedOnboardingType;
        const matchesZone = !selectedZone || record.zone === selectedZone;
        return matchesAgent && matchesType && matchesZone;
      }),
    [agentQuery, onboardingRecords, selectedOnboardingType, selectedZone]
  );

  const onboardingAgentChart = {
    labels: onboardingByAgent.map((entry) => entry.label),
    datasets: [
      {
        label: 'Merchant onboardings',
        data: onboardingByAgent.map((entry) => entry.count),
        backgroundColor: '#1a73e8',
        borderRadius: 4,
        barThickness: 26,
      },
    ],
  };

  const onboardingDateChart = {
    labels: onboardingByDate.map((entry) => entry.label),
    datasets: [
      {
        label: 'Merchant onboardings',
        data: onboardingByDate.map((entry) => entry.count),
        borderColor: '#34a853',
        backgroundColor: 'rgba(52, 168, 83, 0.14)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const dailyTrendChart = {
    labels: dailyActivityTrend.map((entry) => entry.label),
    datasets: [
      {
        label: 'Merchants visited',
        data: dailyActivityTrend.map((entry) => entry.merchantsVisited),
        backgroundColor: '#1a73e8',
        borderRadius: 4,
        barThickness: 20,
      },
      {
        label: 'People approached',
        type: 'line',
        data: dailyActivityTrend.map((entry) => entry.peopleApproached),
        borderColor: '#9334e6',
        backgroundColor: '#9334e6',
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: GRID }, border: { color: 'transparent' } },
      y: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
      y1: {
        beginAtZero: true,
        position: 'right',
        grid: { display: false },
        border: { color: 'transparent' },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { boxWidth: 9, boxHeight: 9, padding: 10 },
      },
    },
  };

  return (
    <div>
      <div className="src-banner">
        {sourceStatus.map((source) => (
          <div className="src-banner-item" key={source.label}>
            <span
              className="src-dot"
              style={{
                background:
                  source.tone === 'ok'
                    ? 'var(--green)'
                    : source.tone === 'err'
                      ? 'var(--red)'
                      : 'var(--amber)',
              }}
            />
            <span>
              <span className="src-banner-label">{source.label}</span>
              {source.detail}
            </span>
          </div>
        ))}
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>
          Last sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Pending'}
        </div>
      </div>

      <div className="sec">Live production summary</div>

      <div className="r g3">
        <Scorecard
          source="Merchant Onboarding Sheet"
          colorClass="bl"
          label="Total Onboarded Merchants"
          value={summary.totalOnboardedMerchants}
          sub={
            summary.totalOnboardedMerchants === 0
              ? 'No merchant onboarding rows found yet. The sheet may currently contain only Growth Partner rows or empty submissions.'
              : summary.onboardingSubmissions > summary.totalOnboardedMerchants
                ? `${summary.onboardingSubmissions - summary.totalOnboardedMerchants} non-merchant submission(s) excluded`
                : 'All live rows are merchant records'
          }
          subType={summary.totalOnboardedMerchants === 0 ? 'wn' : 'up'}
        />
        <Scorecard
          source="Merchant Onboarding Sheet"
          colorClass="gr"
          label="Onboarding Agents"
          value={summary.onboardingAgents}
          sub={
            summary.onboardingAgents
              ? 'Agents with merchant onboarding rows'
              : 'No merchant onboarding agents yet'
          }
          subType="up"
        />
        <Scorecard
          source="Merchant Onboarding Sheet"
          colorClass="te"
          label="Onboarding Submissions"
          value={summary.onboardingSubmissions}
          sub="All non-blank live rows from the onboarding sheet"
          subType="up"
        />
        <Scorecard
          source="Final Day Report Sheet"
          colorClass="pu"
          label="Final Day Reports"
          value={summary.finalDayReports}
          sub={
            summary.finalDayReports
              ? 'Live day-report submissions loaded'
              : 'The sheet currently has headers only'
          }
          subType={summary.finalDayReports ? 'up' : 'wn'}
        />
        <Scorecard
          source="Final Day Report Sheet"
          colorClass="am"
          label="Merchants Visited"
          value={summary.merchantsVisited ?? '—'}
          sub={
            summary.merchantsVisited === null
              ? 'No final day activity rows yet'
              : `${formatCompactNumber(summary.merchantsVisited)} merchant visit(s) reported`
          }
          subType={summary.merchantsVisited === null ? 'wn' : 'up'}
        />
        <Scorecard
          source="Final Day Report Sheet"
          colorClass="rd"
          label="People Approached"
          value={summary.peopleApproached ?? '—'}
          sub={
            summary.peopleApproached === null
              ? 'No GP outreach rows yet'
              : `${formatCompactNumber(summary.peopleApproached)} people approached in live reports`
          }
          subType={summary.peopleApproached === null ? 'wn' : 'up'}
        />
      </div>

      <div className="sec">Merchant onboarding trends</div>

      <div className="r g2">
        <div className="card">
          <div className="ct">
            Onboarding by agent
            <span className="ds">Merchant Onboarding Sheet</span>
          </div>
          <div className="cs">
            Merchant-like onboarding values are normalized through config before matching.
          </div>
          <div className="cw" style={{ height: '200px' }}>
            {onboardingByAgent.length ? (
              <Bar data={onboardingAgentChart} options={{ ...baseOpts, scales: baseScales }} />
            ) : (
              <EmptyStateCard
                title="No merchant onboarding rows yet"
                description={emptyStates.merchant}
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="ct">
            Onboarding by date
            <span className="ds">Merchant Onboarding Sheet</span>
          </div>
          <div className="cs">Daily count of merchant onboarding submissions.</div>
          <div className="cw" style={{ height: '200px' }}>
            {onboardingByDate.length ? (
              <Line data={onboardingDateChart} options={{ ...baseOpts, scales: baseScales }} />
            ) : (
              <EmptyStateCard
                title="No merchant onboarding trend yet"
                description={emptyStates.merchant}
              />
            )}
          </div>
        </div>
      </div>

      <div className="sec">Final day performance</div>

      <div className="r g2">
        <div className="card">
          <div className="ct">
            Final day performance summary
            <span className="ds">Final Day Report Sheet</span>
          </div>
          <div className="cs">
            Visits, blocked enrollments, derived enrollments, and GP outreach from the live day-report feed.
          </div>
          {finalDaySummary.reportsSubmitted ? (
            <div className="mini-grid">
              <MiniStat label="Reports Submitted" value={formatNumber(finalDaySummary.reportsSubmitted)} />
              <MiniStat label="Merchants Visited" value={formatNumber(finalDaySummary.merchantsVisited)} />
              <MiniStat label="Blocked Enrollments" value={formatNumber(finalDaySummary.blockedEnrollments)} />
              <MiniStat label="Enrolled Merchants" value={formatNumber(finalDaySummary.enrolledMerchants)} />
              <MiniStat label="People Approached" value={formatNumber(finalDaySummary.peopleApproached)} />
              <MiniStat label="Blocked GP Leads" value={formatNumber(finalDaySummary.blockedGpLeads)} />
            </div>
          ) : (
            <EmptyStateCard
              title="No final day performance rows yet"
              description={emptyStates.finalDay}
            />
          )}
        </div>

        <div className="card">
          <div className="ct">
            Daily activity trend
            <span className="ds">Final Day Report Sheet</span>
          </div>
          <div className="cs">
            Blue bars show merchants visited. Purple line shows people approached.
          </div>
          <div className="cw" style={{ height: '200px' }}>
            {dailyActivityTrend.length ? (
              <Bar data={dailyTrendChart} options={trendOptions} />
            ) : (
              <EmptyStateCard
                title="No daily activity trend yet"
                description={emptyStates.finalDay}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">Agent leaderboard <span className="ds">Both Sheets</span></div>
        <div className="cs">
          Merchant onboardings come from the onboarding sheet. Day-report activity comes from the final day report sheet.
        </div>
        {agentLeaderboard.length ? (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Merchant Onboardings</th>
                  <th>Final Day Reports</th>
                  <th>Merchants Visited</th>
                  <th>Blocked Enrollments</th>
                  <th>Enrolled Merchants</th>
                  <th>People Approached</th>
                </tr>
              </thead>
              <tbody>
                {agentLeaderboard.map((row) => (
                  <tr key={row.agentName}>
                    <td><b>{row.agentName}</b></td>
                    <td>{formatNumber(row.merchantOnboardings)}</td>
                    <td>{formatNumber(row.finalDayReports)}</td>
                    <td>{formatNumber(row.merchantsVisited)}</td>
                    <td>{formatNumber(row.blockedEnrollments)}</td>
                    <td>{formatNumber(row.enrolledMerchants)}</td>
                    <td>{formatNumber(row.peopleApproached)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStateCard
            title="No agents to rank yet"
            description="The leaderboard will populate as soon as merchant onboarding rows or final day report rows are submitted."
          />
        )}
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">Live onboarding records <span className="ds">Merchant Onboarding Sheet</span></div>
        <div className="cs">
          Latest submissions first. This table shows the actual onboarding records agents are submitting from the live sheet.
        </div>
        <div className="records-toolbar">
          <input
            className="auth-input records-search"
            value={agentQuery}
            onChange={(event) => setAgentQuery(event.target.value)}
            placeholder="Search by agent name"
          />
          <select
            className={`flt${selectedOnboardingType ? ' active' : ''}`}
            value={selectedOnboardingType}
            onChange={(event) => setSelectedOnboardingType(event.target.value)}
          >
            <option value="">Onboarding Type: All</option>
            {onboardingFilterOptions.onboardingTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            className={`flt${selectedZone ? ' active' : ''}`}
            value={selectedZone}
            onChange={(event) => setSelectedZone(event.target.value)}
          >
            <option value="">Zone: All</option>
            {onboardingFilterOptions.zones.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
          <div className="records-count">{formatNumber(filteredOnboardingRecords.length)} row(s)</div>
        </div>
        {filteredOnboardingRecords.length ? (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  {onboardingRecordColumns.map((column) => (
                    <th key={column.key}>
                      <div>{column.label}</div>
                      <div className="table-subhead">
                        {column.sourceHeader || debug.onboardingResolvedHeaderMap?.[column.key] || 'Not found'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOnboardingRecords.map((record) => (
                  <tr key={record.id}>
                    {onboardingRecordColumns.map((column) => {
                      const value =
                        column.valueType === 'raw'
                          ? record.raw?.[column.sourceHeader]
                          : record[column.recordField];
                      return <td key={column.key}>{renderTableCellValue(value)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStateCard
            title="No onboarding records match the current filters"
            description="Try clearing the agent, onboarding type, or zone filters to see the latest live submissions."
          />
        )}
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">Debug visibility <span className="ds">Live parsing</span></div>
        <div className="cs">
          Raw source counts from the published CSVs so we can verify what was loaded and what was ignored.
        </div>
        <div className="mini-grid">
          <MiniStat label="Onboarding Source Rows" value={formatNumber(debug.onboardingSourceRows)} />
          <MiniStat label="Onboarding Blank Rows" value={formatNumber(debug.onboardingBlankRows)} />
          <MiniStat label="Onboarding Valid Rows" value={formatNumber(debug.onboardingValidRows)} />
          <MiniStat label="Onboarding Ignored Rows" value={formatNumber(debug.onboardingIgnoredRows)} />
          <MiniStat label="Valid Merchant Rows" value={formatNumber(debug.validMerchantRows)} />
          <MiniStat label="Ignored Non-Merchant Rows" value={formatNumber(debug.ignoredNonMerchantRows)} />
          <MiniStat label="Final Day Source Rows" value={formatNumber(debug.finalDaySourceRows)} />
          <MiniStat label="Final Day Blank Rows" value={formatNumber(debug.finalDayBlankRows)} />
          <MiniStat
            label="Last Refreshed"
            value={
              lastUpdated
                ? lastUpdated.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : 'Pending'
            }
            compact
          />
        </div>
        <div className="debug-panel-grid">
          <DebugList title="Detected Headers" items={debug.onboardingDetectedHeaders} />
          <DebugList title="Mapped Headers" items={debug.onboardingMappedHeaders} />
          <DebugList title="Unmapped Headers" items={debug.onboardingUnmappedHeaders} />
        </div>
        <div className="mapping-grid">
          {debug.onboardingHeaderMatches?.map((match) => (
            <div key={match.key} className="mapping-item">
              <div className="mapping-label">{match.key}</div>
              <div className="mapping-value">
                {match.resolved || 'No header matched'}
              </div>
              <div className="mapping-note">
                Requested: {match.requested.join(' | ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">Data quality checks <span className="ds">Production sources</span></div>
        <div className="cs">
          These checks report what was loaded, what was excluded, and where live source cleanup may still be needed.
        </div>
        <div className="quality-list">
          {qualityChecks.map((check) => (
            <div key={check.title} className={`quality-item ${check.tone}`}>
              <div className="quality-meta">
                <div className="quality-title">{check.title}</div>
                <div className="quality-detail">{check.detail}</div>
              </div>
              <div className="quality-value">{check.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">STEP Network Live Ops &bull; Live Google Sheets sources only &bull; No fallback demo data</div>
    </div>
  );
}

function MiniStat({ label, value, compact = false }) {
  return (
    <div className="mini-stat">
      <div className="mini-stat-label">{label}</div>
      <div className={`mini-stat-value${compact ? ' compact' : ''}`}>{value}</div>
    </div>
  );
}

function DebugList({ title, items }) {
  return (
    <div className="debug-list">
      <div className="debug-list-title">{title}</div>
      {items?.length ? (
        <div className="debug-chip-wrap">
          {items.map((item) => (
            <span key={item} className="debug-chip">{item}</span>
          ))}
        </div>
      ) : (
        <div className="debug-empty">None</div>
      )}
    </div>
  );
}

function renderTableCellValue(value) {
  if (!value) {
    return '—';
  }

  if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
    return (
      <a href={value} target="_blank" rel="noreferrer">
        Open link
      </a>
    );
  }

  return value;
}
