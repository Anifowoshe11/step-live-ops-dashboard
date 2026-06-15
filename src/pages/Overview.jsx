import { useMemo, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import EmptyStateCard from '../components/ui/EmptyStateCard';
import { useData } from '../context/DataContext';
import Scorecard from '../components/ui/Scorecard';
import { formatCompactNumber, formatNumber } from '../utils/dataUtils';

const GRID = 'rgba(0,0,0,0.05)';
const PIE_COLORS = ['#1a73e8', '#34a853', '#f9ab00', '#9334e6', '#00897b', '#ea4335', '#5f6368'];
const baseScales = {
  x: { grid: { color: GRID }, border: { color: 'transparent' } },
  y: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
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

  const leaderboardChart = useMemo(
    () => buildLeaderboardChart(filteredAgentPerformanceSummary),
    [filteredAgentPerformanceSummary]
  );
  const onboardingTrendChart = useMemo(
    () => buildDailyOnboardingTrendChart(filteredAgentPerformanceRecords, selectedPerformanceAgent),
    [filteredAgentPerformanceRecords, selectedPerformanceAgent]
  );
  const contributionChart = useMemo(
    () => buildContributionPieChart(filteredAgentPerformanceSummary),
    [filteredAgentPerformanceSummary]
  );
  const zonePerformanceChart = useMemo(
    () => buildZonePerformanceChart(filteredAgentPerformanceRecords),
    [filteredAgentPerformanceRecords]
  );
  const weekOverWeek = useMemo(
    () => buildWeekOverWeekMetric(filteredAgentPerformanceRecords),
    [filteredAgentPerformanceRecords]
  );

  const topPerformer = filteredAgentPerformanceSummary[0] || null;
  const bottomPerformer = filteredAgentPerformanceSummary.at(-1) || null;
  const activeAgentCount = filteredAgentPerformanceSummary.length;
  const filteredMerchantCount = filteredAgentPerformanceRecords.length;

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

  const finalDayTrendOptions = {
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

      <section className="performance-shell">
        <div className="performance-hero">
          <div>
            <div className="performance-title">Growth Partner Onboarding Performance</div>
            <div className="performance-copy">
              Executive view of live merchant onboarding momentum, contribution mix, and agent performance signals.
            </div>
          </div>
          <div className="performance-meta">
            <span>{formatNumber(filteredMerchantCount)} merchant row(s)</span>
            <span>{formatNumber(activeAgentCount)} active agent(s)</span>
          </div>
        </div>

        <div className="records-toolbar performance-toolbar">
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
        </div>

        {filteredAgentPerformanceSummary.length ? (
          <>
            <div className="performance-callouts">
              <CalloutCard
                tone="hero"
                eyebrow="Top performer badge"
                title={topPerformer?.agentName || 'No top performer yet'}
                value={`${formatNumber(topPerformer?.totalOnboardedMerchants || 0)} onboardings`}
                detail={
                  topPerformer
                    ? `${formatShare(topPerformer.percentageShare)} share • Latest ${topPerformer.latestSubmissionDate}`
                    : 'No merchant onboarding rows are available yet.'
                }
              />
              <CalloutCard
                tone={weekOverWeek.tone}
                eyebrow="Week-over-week growth %"
                title={weekOverWeek.valueLabel}
                value={`${formatNumber(weekOverWeek.currentWeekCount)} this week`}
                detail={weekOverWeek.detail}
              />
              <CalloutCard
                tone="alert"
                eyebrow="Bottom performer alert"
                title={bottomPerformer?.agentName || 'No comparison set'}
                value={`${formatNumber(bottomPerformer?.totalOnboardedMerchants || 0)} onboardings`}
                detail={buildBottomPerformerDetail(topPerformer, bottomPerformer, activeAgentCount)}
              />
              <CalloutCard
                tone="neutral"
                eyebrow="Performance snapshot"
                title={`${formatNumber(activeAgentCount)} agents contributing`}
                value={`${formatNumber(filteredMerchantCount)} merchant rows`}
                detail="Filters above recast every chart and ranking card in this performance view."
              />
            </div>

            <div className="ranking-card-grid">
              {filteredAgentPerformanceSummary.map((agent) => (
                <article
                  key={agent.agentName}
                  className={`ranking-card${selectedPerformanceAgent === agent.agentName ? ' selected' : ''}`}
                >
                  <div className="ranking-head">
                    <div className="ranking-rank">#{agent.rank}</div>
                    <div className="ranking-share">{formatShare(agent.percentageShare)} share</div>
                  </div>
                  <div className="ranking-name">{agent.agentName}</div>
                  <div className="ranking-total">{formatNumber(agent.totalOnboardedMerchants)}</div>
                  <div className="ranking-sub">merchant onboardings</div>
                  <div className="ranking-meta-grid">
                    <MetricPill label="Latest" value={agent.latestSubmissionDate} />
                    <MetricPill label="QR interest" value={formatNumber(agent.qrActivationInterestCount)} />
                    <MetricPill label="High readiness" value={formatNumber(agent.highReadinessCount)} />
                    <MetricPill label="Store photos" value={formatNumber(agent.storePhotoCount)} />
                  </div>
                  <div className="ranking-zones">
                    {agent.zones.map((zone) => (
                      <span key={zone} className="zone-chip">{zone}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="analytics-grid">
              <div className="analytics-card analytics-card-wide">
                <div className="ct">
                  Leaderboard bar chart
                  <span className="ds">Highest onboarded merchants first</span>
                </div>
                <div className="cs">
                  Agent ranking by total merchant onboardings in the current filter set.
                </div>
                <div className="analytics-chart">
                  <Bar data={leaderboardChart} options={leaderboardChartOptions} />
                </div>
              </div>

              <div className="analytics-card">
                <div className="ct">
                  Team contribution pie chart
                  <span className="ds">Share of merchant onboardings</span>
                </div>
                <div className="cs">
                  Contribution mix across the team. Smaller slices are grouped under `Others` when needed.
                </div>
                <div className="analytics-chart">
                  <Pie data={contributionChart} options={contributionChartOptions} />
                </div>
              </div>

              <div className="analytics-card analytics-card-wide">
                <div className="ct">
                  Daily onboarding trend line chart
                  <span className="ds">Merchant onboarding momentum</span>
                </div>
                <div className="cs">
                  {selectedPerformanceAgent
                    ? `Daily merchant onboarding counts for ${selectedPerformanceAgent}.`
                    : 'Daily merchant onboarding counts for the full filtered team.'}
                </div>
                <div className="analytics-chart">
                  <Line data={onboardingTrendChart} options={onboardingTrendChartOptions} />
                </div>
              </div>

              <div className="analytics-card">
                <div className="ct">
                  Zone performance chart
                  <span className="ds">Merchant onboardings by zone</span>
                </div>
                <div className="cs">
                  Shows where the team is converting the most merchant onboardings right now.
                </div>
                <div className="analytics-chart">
                  <Bar data={zonePerformanceChart} options={zonePerformanceChartOptions} />
                </div>
              </div>
            </div>
          </>
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
      </section>

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
              <Bar data={dailyTrendChart} options={finalDayTrendOptions} />
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

function CalloutCard({ tone, eyebrow, title, value, detail }) {
  return (
    <article className={`callout-card ${tone}`}>
      <div className="callout-eyebrow">{eyebrow}</div>
      <div className="callout-title">{title}</div>
      <div className="callout-value">{value}</div>
      <div className="callout-detail">{detail}</div>
    </article>
  );
}

function MetricPill({ label, value }) {
  return (
    <div className="metric-pill">
      <span>{label}</span>
      <b>{value}</b>
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

function buildLeaderboardChart(summaryRows) {
  const rows = summaryRows.slice(0, 8);

  return {
    labels: rows.map((row) => row.agentName),
    datasets: [
      {
        label: 'Merchant onboardings',
        data: rows.map((row) => row.totalOnboardedMerchants),
        backgroundColor: rows.map((_, index) =>
          index === 0 ? '#1a73e8' : index === rows.length - 1 ? '#ea4335' : '#9ec2ff'
        ),
        borderRadius: 8,
        barThickness: 18,
      },
    ],
  };
}

function buildDailyOnboardingTrendChart(records, selectedAgent) {
  const dailyMap = new Map();

  records.forEach((record) => {
    const key = record.submittedDateKey || 'unknown';
    const existing = dailyMap.get(key) || {
      dateKey: key,
      label: record.submittedDateLabel || 'Unknown date',
      count: 0,
    };
    existing.count += 1;
    dailyMap.set(key, existing);
  });

  const ordered = [...dailyMap.values()].sort((left, right) => sortDateKey(left.dateKey, right.dateKey));

  return {
    labels: ordered.map((entry) => entry.label),
    datasets: [
      {
        label: selectedAgent ? `${selectedAgent} merchant onboardings` : 'Team merchant onboardings',
        data: ordered.map((entry) => entry.count),
        borderColor: '#1a73e8',
        backgroundColor: 'rgba(26, 115, 232, 0.14)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
    ],
  };
}

function buildContributionPieChart(summaryRows) {
  const topRows = summaryRows.slice(0, 5);
  const otherCount = summaryRows.slice(5).reduce((sum, row) => sum + row.totalOnboardedMerchants, 0);
  const labels = topRows.map((row) => row.agentName);
  const values = topRows.map((row) => row.totalOnboardedMerchants);

  if (otherCount > 0) {
    labels.push('Others');
    values.push(otherCount);
  }

  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, index) => PIE_COLORS[index % PIE_COLORS.length]),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };
}

function buildZonePerformanceChart(records) {
  const zoneMap = new Map();

  records.forEach((record) => {
    zoneMap.set(record.zone, (zoneMap.get(record.zone) || 0) + 1);
  });

  const ordered = [...zoneMap.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  return {
    labels: ordered.map(([zone]) => zone),
    datasets: [
      {
        label: 'Merchant onboardings',
        data: ordered.map(([, count]) => count),
        backgroundColor: '#34a853',
        borderRadius: 8,
        barThickness: 18,
      },
    ],
  };
}

function buildWeekOverWeekMetric(records) {
  const datedRecords = records
    .filter((record) => record.submittedDateKey && record.submittedDateKey !== 'unknown')
    .map((record) => record.submittedDateKey);

  if (!datedRecords.length) {
    return {
      tone: 'neutral',
      valueLabel: '—',
      currentWeekCount: 0,
      previousWeekCount: 0,
      detail: 'No valid timestamps are available for a week-over-week comparison.',
    };
  }

  const latestDate = parseDateKey(datedRecords.sort(sortDateKey).at(-1));
  const currentStart = addDays(latestDate, -6);
  const previousStart = addDays(latestDate, -13);
  const previousEnd = addDays(latestDate, -7);

  const currentWeekCount = records.filter((record) => {
    const date = parseDateKey(record.submittedDateKey);
    return date && date >= currentStart && date <= latestDate;
  }).length;

  const previousWeekCount = records.filter((record) => {
    const date = parseDateKey(record.submittedDateKey);
    return date && date >= previousStart && date <= previousEnd;
  }).length;

  if (!previousWeekCount) {
    return {
      tone: 'neutral',
      valueLabel: '—',
      currentWeekCount,
      previousWeekCount,
      detail: 'No prior-week baseline is available yet for a percentage comparison.',
    };
  }

  const growth = ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100;

  return {
    tone: growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral',
    valueLabel: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
    currentWeekCount,
    previousWeekCount,
    detail: `${formatNumber(currentWeekCount)} this week vs ${formatNumber(previousWeekCount)} last week.`,
  };
}

function buildBottomPerformerDetail(topPerformer, bottomPerformer, activeAgentCount) {
  if (!bottomPerformer || activeAgentCount < 2) {
    return 'At least two active agents are needed before a bottom-performer comparison is meaningful.';
  }

  const gap = Math.max((topPerformer?.totalOnboardedMerchants || 0) - bottomPerformer.totalOnboardedMerchants, 0);
  return `${formatNumber(gap)} onboarding(s) behind the current leader in this filter set.`;
}

function parseDateKey(dateKey) {
  if (!dateKey || dateKey === 'unknown') {
    return null;
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
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

const leaderboardChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
    y: { grid: { display: false }, border: { color: 'transparent' } },
  },
};

const onboardingTrendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: baseScales,
};

const contributionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { boxWidth: 10, boxHeight: 10, padding: 12 },
    },
  },
};

const zonePerformanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
    y: { grid: { display: false }, border: { color: 'transparent' } },
  },
};
