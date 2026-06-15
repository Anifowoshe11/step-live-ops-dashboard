import { useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import EmptyStateCard from '../components/ui/EmptyStateCard';
import { useData } from '../context/DataContext';
import Scorecard from '../components/ui/Scorecard';
import { formatCompactNumber, formatNumber } from '../utils/dataUtils';

const GRID = 'rgba(0,0,0,0.05)';
const AGENT_TREND_COLORS = [
  { border: '#1a73e8', background: 'rgba(26, 115, 232, 0.14)' },
  { border: '#34a853', background: 'rgba(52, 168, 83, 0.14)' },
  { border: '#9334e6', background: 'rgba(147, 52, 230, 0.14)' },
  { border: '#ea4335', background: 'rgba(234, 67, 53, 0.14)' },
  { border: '#f9ab00', background: 'rgba(249, 171, 0, 0.14)' },
  { border: '#00897b', background: 'rgba(0, 137, 123, 0.14)' },
];
const AGENT_DETAIL_COLUMNS = [
  { key: 'submittedAt', label: 'Timestamp', recordField: 'submittedAtLabel' },
  { key: 'businessName', label: 'Merchant Business Name', recordField: 'businessName' },
  { key: 'merchantName', label: 'Merchant Name', recordField: 'merchantName' },
  { key: 'attendantName', label: 'Store Attendant Name', recordField: 'attendantName' },
  { key: 'phoneNumber', label: 'Phone Number', recordField: 'phoneNumber' },
  { key: 'whatsappNumber', label: 'WhatsApp Number', recordField: 'whatsappNumber' },
  { key: 'storeAddress', label: 'Store Address', recordField: 'storeAddress' },
  { key: 'zone', label: 'Assigned Zone', recordField: 'zone' },
  { key: 'storeType', label: 'Type of Store', recordField: 'storeType' },
  { key: 'trafficBand', label: 'Estimated Daily Customer Traffic', recordField: 'trafficBand' },
  {
    key: 'existingFinancing',
    label: 'Existing Financing Providers',
    recordField: 'existingFinancing',
  },
  { key: 'wantsQr', label: 'QR Activation Interest', recordField: 'wantsQr' },
  { key: 'readiness', label: 'Merchant Readiness Level', recordField: 'readiness' },
  { key: 'storePhoto', label: 'Store Photo', recordField: 'storePhoto' },
  { key: 'notes', label: 'Additional Notes', recordField: 'notes' },
];
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
    merchantOnboardingRecords,
    agentPerformanceFilterOptions,
    onboardingRecords,
    onboardingRecordColumns,
    onboardingFilterOptions,
    finalDaySummary,
    agentLeaderboard,
    dailyActivityTrend,
    qualityChecks,
    sourceStatus,
    emptyStates,
  } = dashboard;
  const [selectedPerformanceAgent, setSelectedPerformanceAgent] = useState('');
  const [selectedPerformanceZone, setSelectedPerformanceZone] = useState('');
  const [selectedQrInterest, setSelectedQrInterest] = useState('');
  const [selectedReadinessLevel, setSelectedReadinessLevel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rawAgentQuery, setRawAgentQuery] = useState('');
  const [rawOnboardingType, setRawOnboardingType] = useState('');
  const [rawZone, setRawZone] = useState('');

  const filteredAgentPerformanceRecords = useMemo(
    () =>
      merchantOnboardingRecords.filter((record) => {
        const matchesAgent = !selectedPerformanceAgent || record.agentName === selectedPerformanceAgent;
        const matchesZone = !selectedPerformanceZone || record.zone === selectedPerformanceZone;
        const matchesQrInterest = !selectedQrInterest || record.wantsQr === selectedQrInterest;
        const matchesReadiness = !selectedReadinessLevel || record.readiness === selectedReadinessLevel;
        const matchesDateFrom =
          !dateFrom ||
          (record.submittedDateKey !== 'unknown' && record.submittedDateKey >= dateFrom);
        const matchesDateTo =
          !dateTo ||
          (record.submittedDateKey !== 'unknown' && record.submittedDateKey <= dateTo);

        return (
          matchesAgent &&
          matchesZone &&
          matchesQrInterest &&
          matchesReadiness &&
          matchesDateFrom &&
          matchesDateTo
        );
      }),
    [
      dateFrom,
      dateTo,
      merchantOnboardingRecords,
      selectedPerformanceAgent,
      selectedPerformanceZone,
      selectedQrInterest,
      selectedReadinessLevel,
    ]
  );

  const filteredAgentPerformanceSummary = useMemo(
    () => buildAgentPerformanceSummary(filteredAgentPerformanceRecords, summary.totalOnboardedMerchants),
    [filteredAgentPerformanceRecords, summary.totalOnboardedMerchants]
  );

  const performanceTrendChart = useMemo(
    () => buildAgentTrendChart(filteredAgentPerformanceRecords, filteredAgentPerformanceSummary),
    [filteredAgentPerformanceRecords, filteredAgentPerformanceSummary]
  );

  const selectedAgentDetailRows = useMemo(
    () =>
      selectedPerformanceAgent
        ? filteredAgentPerformanceRecords.filter((record) => record.agentName === selectedPerformanceAgent)
        : [],
    [filteredAgentPerformanceRecords, selectedPerformanceAgent]
  );

  const filteredOnboardingRecords = useMemo(
    () =>
      onboardingRecords.filter((record) => {
        const matchesAgent =
          !rawAgentQuery || record.agentName.toLowerCase().includes(rawAgentQuery.trim().toLowerCase());
        const matchesType = !rawOnboardingType || record.onboardingType === rawOnboardingType;
        const matchesZone = !rawZone || record.zone === rawZone;
        return matchesAgent && matchesType && matchesZone;
      }),
    [onboardingRecords, rawAgentQuery, rawOnboardingType, rawZone]
  );

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

  const performanceTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: baseScales,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { boxWidth: 9, boxHeight: 9, padding: 10 },
      },
    },
  };

  const hasActivePerformanceFilters =
    Boolean(selectedPerformanceAgent) ||
    Boolean(selectedPerformanceZone) ||
    Boolean(selectedQrInterest) ||
    Boolean(selectedReadinessLevel) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

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

      <div className="sec">Growth Partner onboarding performance</div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">
          Growth Partner Onboarding Performance
          <span className="ds">Merchant Onboarding Sheet</span>
        </div>
        <div className="cs">
          Merchant-only onboarding performance by field agent, using normalized onboarding-type logic from the live sheet.
        </div>
        <div className="records-toolbar">
          <select
            className={`flt${selectedPerformanceAgent ? ' active' : ''}`}
            value={selectedPerformanceAgent}
            onChange={(event) => setSelectedPerformanceAgent(event.target.value)}
          >
            <option value="">Agent: All</option>
            {agentPerformanceFilterOptions.agents.map((agent) => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
          <select
            className={`flt${selectedPerformanceZone ? ' active' : ''}`}
            value={selectedPerformanceZone}
            onChange={(event) => setSelectedPerformanceZone(event.target.value)}
          >
            <option value="">Zone: All</option>
            {agentPerformanceFilterOptions.zones.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
          <input
            className="auth-input filter-date"
            type="date"
            min={agentPerformanceFilterOptions.minDate || undefined}
            max={agentPerformanceFilterOptions.maxDate || undefined}
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            aria-label="Filter from date"
          />
          <input
            className="auth-input filter-date"
            type="date"
            min={agentPerformanceFilterOptions.minDate || undefined}
            max={agentPerformanceFilterOptions.maxDate || undefined}
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            aria-label="Filter to date"
          />
          <select
            className={`flt${selectedQrInterest ? ' active' : ''}`}
            value={selectedQrInterest}
            onChange={(event) => setSelectedQrInterest(event.target.value)}
          >
            <option value="">QR Interest: All</option>
            {agentPerformanceFilterOptions.qrInterest.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select
            className={`flt${selectedReadinessLevel ? ' active' : ''}`}
            value={selectedReadinessLevel}
            onChange={(event) => setSelectedReadinessLevel(event.target.value)}
          >
            <option value="">Readiness: All</option>
            {agentPerformanceFilterOptions.readinessLevels.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          {hasActivePerformanceFilters ? (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setSelectedPerformanceAgent('');
                setSelectedPerformanceZone('');
                setSelectedQrInterest('');
                setSelectedReadinessLevel('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear filters
            </button>
          ) : null}
          <div className="records-count">
            {formatNumber(filteredAgentPerformanceRecords.length)} merchant row(s)
          </div>
        </div>
      </div>

      <div className="r g2">
        <div className="card">
          <div className="ct">
            Agent total onboarding summary
            <span className="ds">Merchant rows only</span>
          </div>
          <div className="cs">
            Latest submission date, assigned zones, QR interest, high readiness, and store-photo coverage by agent.
          </div>
          {filteredAgentPerformanceSummary.length ? (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Agent name</th>
                    <th>Total onboarded merchants</th>
                    <th>Latest submission date</th>
                    <th>Assigned zone(s)</th>
                    <th>QR activation interest count</th>
                    <th>High readiness count</th>
                    <th>Store photo count</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgentPerformanceSummary.map((row) => (
                    <tr key={row.agentName}>
                      <td><b>{row.agentName}</b></td>
                      <td>{formatNumber(row.totalOnboardedMerchants)}</td>
                      <td>{row.latestSubmissionDate}</td>
                      <td>{row.zonesLabel || 'Unassigned zone'}</td>
                      <td>{formatNumber(row.qrActivationInterestCount)}</td>
                      <td>{formatNumber(row.highReadinessCount)}</td>
                      <td>{formatNumber(row.storePhotoCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyStateCard
              title="No merchant onboarding performance rows match these filters"
              description={
                summary.totalOnboardedMerchants
                  ? 'Try broadening the agent, zone, date, QR-interest, or readiness filters.'
                  : emptyStates.merchant
              }
            />
          )}
        </div>

        <div className="card">
          <div className="ct">
            Agent leaderboard
            <span className="ds">Merchant rows only</span>
          </div>
          <div className="cs">
            Ranked by highest onboarded merchants first. Share is measured against all valid merchant onboarding rows.
          </div>
          {filteredAgentPerformanceSummary.length ? (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Agent</th>
                    <th>Total merchant count</th>
                    <th>Percentage share</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgentPerformanceSummary.map((row) => (
                    <tr key={row.agentName}>
                      <td>{row.rank}</td>
                      <td><b>{row.agentName}</b></td>
                      <td>{formatNumber(row.totalOnboardedMerchants)}</td>
                      <td>{formatShare(row.percentageShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyStateCard
              title="No leaderboard rows yet"
              description={
                summary.totalOnboardedMerchants
                  ? 'The current filters removed every merchant onboarding row from the ranking.'
                  : emptyStates.merchant
              }
            />
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">
          Agent onboarding trend
          <span className="ds">By date and field agent</span>
        </div>
        <div className="cs">
          Daily merchant onboarding counts grouped by `Field Agent Name`. Unknown or invalid timestamps are grouped under `Unknown date`.
        </div>
        <div className="cw agent-trend-chart">
          {performanceTrendChart.labels.length ? (
            <Line data={performanceTrendChart} options={performanceTrendOptions} />
          ) : (
            <EmptyStateCard
              title="No onboarding trend data yet"
              description={
                summary.totalOnboardedMerchants
                  ? 'Adjust the performance filters to include merchant rows with matching agent activity.'
                  : emptyStates.merchant
              }
            />
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">
          Agent detail table
          <span className="ds">Selected agent records</span>
        </div>
        <div className="cs">
          Select an agent above to inspect the merchant onboarding submissions behind their totals.
        </div>
        {selectedPerformanceAgent ? (
          selectedAgentDetailRows.length ? (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    {AGENT_DETAIL_COLUMNS.map((column) => (
                      <th key={column.key}>
                        <div>{column.label}</div>
                        <div className="table-subhead">
                          {debug.onboardingResolvedHeaderMap?.[column.key] || 'Not found'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedAgentDetailRows.map((record) => (
                    <tr key={record.id}>
                      {AGENT_DETAIL_COLUMNS.map((column) => (
                        <td key={column.key}>
                          {renderTableCellValue(record[column.recordField])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyStateCard
              title="No merchant rows match this agent selection"
              description="The selected agent has no merchant onboarding rows inside the current zone, date, QR-interest, or readiness filters."
            />
          )
        ) : (
          <EmptyStateCard
            title="Choose an agent to view detail rows"
            description="Use the agent filter above to load that Growth Partner's merchant onboarding submissions."
          />
        )}
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
                    <td><b>{row.agentName || 'Unassigned'}</b></td>
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
            value={rawAgentQuery}
            onChange={(event) => setRawAgentQuery(event.target.value)}
            placeholder="Search by agent name"
          />
          <select
            className={`flt${rawOnboardingType ? ' active' : ''}`}
            value={rawOnboardingType}
            onChange={(event) => setRawOnboardingType(event.target.value)}
          >
            <option value="">Onboarding Type: All</option>
            {onboardingFilterOptions.onboardingTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            className={`flt${rawZone ? ' active' : ''}`}
            value={rawZone}
            onChange={(event) => setRawZone(event.target.value)}
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
          <MiniStat label="Total Valid Merchant Rows" value={formatNumber(debug.validMerchantRows)} />
          <MiniStat label="Unique Agent Count" value={formatNumber(debug.uniqueMerchantAgentCount)} />
          <MiniStat label="Unassigned Agent Rows" value={formatNumber(debug.unassignedAgentRows)} />
          <MiniStat label="Rows Missing Timestamp" value={formatNumber(debug.merchantRowsMissingTimestamp)} />
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

function buildAgentPerformanceSummary(records, totalMerchantRows) {
  const summaryMap = new Map();

  records.forEach((record) => {
    const existing = summaryMap.get(record.agentName) || {
      agentName: record.agentName,
      totalOnboardedMerchants: 0,
      latestSubmissionAt: null,
      latestSubmissionDate: 'Unknown date',
      zones: new Set(),
      qrActivationInterestCount: 0,
      highReadinessCount: 0,
      storePhotoCount: 0,
    };

    existing.totalOnboardedMerchants += 1;
    existing.zones.add(record.zone || 'Unassigned zone');
    if (record.hasQrInterest) {
      existing.qrActivationInterestCount += 1;
    }
    if (record.isHighReadiness) {
      existing.highReadinessCount += 1;
    }
    if (record.hasStorePhoto) {
      existing.storePhotoCount += 1;
    }
    if (record.submittedAt && (!existing.latestSubmissionAt || record.submittedAt > existing.latestSubmissionAt)) {
      existing.latestSubmissionAt = record.submittedAt;
      existing.latestSubmissionDate = record.submittedAtLabel;
    }

    summaryMap.set(record.agentName, existing);
  });

  return [...summaryMap.values()]
    .map((entry) => {
      const zones = [...entry.zones].sort((left, right) => left.localeCompare(right));

      return {
        ...entry,
        zones,
        zonesLabel: zones.join(', '),
        percentageShare: totalMerchantRows
          ? (entry.totalOnboardedMerchants / totalMerchantRows) * 100
          : 0,
      };
    })
    .sort((left, right) =>
      right.totalOnboardedMerchants - left.totalOnboardedMerchants ||
      left.agentName.localeCompare(right.agentName)
    )
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function buildAgentTrendChart(records, summaryRows) {
  const dateMap = new Map();

  records.forEach((record) => {
    const key = record.submittedDateKey || 'unknown';
    const existing = dateMap.get(key) || {
      dateKey: key,
      label: record.submittedDateLabel || 'Unknown date',
      counts: {},
    };
    existing.counts[record.agentName] = (existing.counts[record.agentName] || 0) + 1;
    dateMap.set(key, existing);
  });

  const labelsByDate = [...dateMap.values()].sort((left, right) => sortDateKey(left.dateKey, right.dateKey));
  const agentNames = summaryRows.map((row) => row.agentName);

  return {
    labels: labelsByDate.map((entry) => entry.label),
    datasets: agentNames.map((agentName, index) => {
      const palette = AGENT_TREND_COLORS[index % AGENT_TREND_COLORS.length];

      return {
        label: agentName,
        data: labelsByDate.map((entry) => entry.counts[agentName] || 0),
        borderColor: palette.border,
        backgroundColor: palette.background,
        tension: 0.25,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 4,
      };
    }),
  };
}

function sortDateKey(left, right) {
  if (left === 'unknown' && right === 'unknown') {
    return 0;
  }

  if (left === 'unknown') {
    return 1;
  }

  if (right === 'unknown') {
    return -1;
  }

  return left.localeCompare(right);
}

function formatShare(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(1)}%`;
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
