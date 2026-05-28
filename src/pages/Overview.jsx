import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useData } from '../context/DataContext';
import Scorecard from '../components/ui/Scorecard';
import { sumField, groupCount, pct, formatDate, uniq } from '../utils/dataUtils';

const PALETTE = ['#1a73e8', '#34a853', '#f9ab00', '#ea4335', '#9334e6', '#00897b', '#e67c13', '#0097a7'];
const GRID = 'rgba(0,0,0,0.05)';
const baseScales = {
  x: { grid: { color: GRID }, border: { color: 'transparent' } },
  y: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
};
const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

export default function Overview() {
  const { filtered } = useData();
  const O = filtered.onboarding;
  const D = filtered.daily;

  const tot = O.length;
  const vis = sumField(D, 'Total Merchants Visited Today');
  const blk = sumField(D, "Interested Merchants But Couldn't Enroll");
  const enrolled = Math.max(0, vis - blk);
  const apr = sumField(D, 'Total People Approached');
  const gpl = sumField(D, "Interested GP Leads But Couldn't Enroll");
  const br = vis > 0 ? Math.round((blk / vis) * 100) : 0;
  const activeAgents = uniq([...O.map((r) => r['Field Agent Name']), ...D.map((r) => r['Agent Name'])]);
  const activeZones = uniq([...O.map((r) => r['Assigned Zone']), ...D.map((r) => r['Assigned Zone'])]);

  // Visits vs Enrollments chart
  const byDate = {};
  D.forEach((r) => {
    const d = formatDate(r['Date'] || r['Timestamp']);
    if (!byDate[d]) byDate[d] = { v: 0, b: 0 };
    byDate[d].v += parseFloat(r['Total Merchants Visited Today']) || 0;
    byDate[d].b += parseFloat(r["Interested Merchants But Couldn't Enroll"]) || 0;
  });
  const dates = Object.keys(byDate).sort();
  const visData = {
    labels: dates.length ? dates : ['No data'],
    datasets: [
      { label: 'Visited', data: dates.map((d) => byDate[d].v), backgroundColor: '#1a73e8', borderRadius: 4, barThickness: 16 },
      { label: 'Enrolled', data: dates.map((d) => Math.max(0, byDate[d].v - byDate[d].b)), backgroundColor: '#34a853', borderRadius: 4, barThickness: 16 },
    ],
  };
  const visOpts = {
    ...baseOpts,
    scales: baseScales,
    plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 9, boxHeight: 9, padding: 10 } } },
  };

  // Donut charts
  const typeData = buildDonut(groupCount(O, 'Who Are You Onboarding?'));
  const readyData = buildDonut(groupCount(O, 'Merchant Readiness Level'));
  const qrData = buildDonut(groupCount(O, 'Is Merchant Interested In QR Activation?'));

  // Block reasons
  const blockCounts = { Network: 0, 'QR Speed': 0, Other: 0 };
  D.forEach((r) => {
    const c = (r['Comments On Merchant Visits'] || '').toLowerCase() + (r['Comments On Gp Enrollment issue'] || '').toLowerCase();
    if (c.includes('network')) blockCounts.Network += parseFloat(r["Interested Merchants But Couldn't Enroll"]) || 0;
    else if (c.includes('qr') || c.includes('response')) blockCounts['QR Speed']++;
    else blockCounts.Other++;
  });
  const blkData = {
    labels: ['Network', 'QR Speed', 'Other'],
    datasets: [{ data: [blockCounts.Network, blockCounts['QR Speed'], blockCounts.Other], backgroundColor: ['#ea4335', '#f9ab00', '#9334e6'], borderRadius: 4, barThickness: 28 }],
  };
  const donutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '63%',
    plugins: {
      legend: { display: true, position: 'bottom', labels: { padding: 9, boxWidth: 8, boxHeight: 8 } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const p = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
            return `  ${ctx.label}: ${ctx.parsed} (${p}%)`;
          },
        },
      },
      datalabels: {
        display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0,
        color: '#fff',
        font: { weight: 'bold', size: 12 },
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const p = total > 0 ? Math.round((value / total) * 100) : 0;
          return p >= 8 ? `${value}\n${p}%` : value;
        },
        textAlign: 'center',
      },
    },
  };

  // Enrollment rate label
  const enrollRate = vis > 0 ? Math.round((enrolled / vis) * 100) : 0;
  const blockLabel = br >= 100 ? 'No enrollments today' : br > 50 ? `High failure — ${br}% blocked` : `${br}% blocked`;

  return (
    <div>
      {/* Source legend */}
      <div className="src-banner">
        <div className="src-banner-item">
          <span className="src-dot" style={{ background: 'var(--blue)' }} />
          <span><span className="src-banner-label">Onboarding DB</span> Every merchant, GP & agent formally enrolled onto STEP</span>
        </div>
        <div className="src-banner-item">
          <span className="src-dot" style={{ background: 'var(--green)' }} />
          <span><span className="src-banner-label">Daily DB</span> Daily field activity — visits, enrollment attempts & agent outreach</span>
        </div>
      </div>

      <div className="sec">Combined network snapshot — how is STEP performing today?</div>

      <div className="r g5">
        <Scorecard
          source="Onboarding DB"
          colorClass="bl"
          label="Total Onboarded"
          value={tot}
          sub={`${tot} business${tot !== 1 ? 'es' : ''} on the STEP platform`}
          subType="up"
        />
        <Scorecard
          source="Daily DB"
          colorClass="rd"
          label="Enrollment Block Rate"
          value={`${br}%`}
          sub={blockLabel}
          subType={br >= 50 ? 'dn' : ''}
        />
        <Scorecard
          source="Daily DB"
          colorClass="gr"
          label="Successfully Enrolled"
          value={enrolled}
          sub={vis > 0 ? `${enrollRate}% conversion rate today` : 'No visits recorded'}
          subType={enrollRate > 50 ? 'up' : 'wn'}
        />
        <Scorecard
          source="Daily DB"
          colorClass="pu"
          label="GP People Approached"
          value={apr}
          sub={gpl > 0 ? `${gpl} couldn't complete — follow up needed` : apr > 0 ? 'All approaches completed' : 'No outreach yet'}
          subType={gpl > 0 ? 'wn' : 'up'}
        />
        <Scorecard
          source="Both DBs"
          colorClass="te"
          label="Active Agents"
          value={activeAgents.length}
          sub={activeZones.length > 0 ? `Covering: ${activeZones.join(', ')}` : 'No zones recorded'}
          subType="up"
        />
      </div>

      <div className="r g32">
        <div className="card">
          <div className="ct">
            Are visits turning into enrollments?
            <span className="ds">Daily DB</span>
          </div>
          <div className="cs">
            Each bar day shows how many merchants were visited vs how many were actually enrolled — the gap is your block problem
          </div>
          <div className="cw" style={{ height: '200px' }}>
            <Bar data={visData} options={visOpts} />
          </div>
        </div>
        <div className="card">
          <div className="ct">
            Who is being onboarded?
            <span className="ds">Onboarding DB</span>
          </div>
          <div className="cs">
            Merchants, General Public (GP), or Agents — understanding the mix shapes strategy
          </div>
          <div className="cw" style={{ height: '200px' }}>
            <Doughnut data={typeData} options={donutOpts} plugins={[ChartDataLabels]} />
          </div>
        </div>
      </div>

      <div className="r g3">
        <div className="card">
          <div className="ct">
            Are merchants ready to transact?
            <span className="ds">Onboarding DB</span>
          </div>
          <div className="cs">
            Active = cleared and ready now. Others need follow-up before going live
          </div>
          <div className="cw" style={{ height: '170px' }}>
            <Doughnut data={readyData} options={donutOpts} plugins={[ChartDataLabels]} />
          </div>
        </div>
        <div className="card">
          <div className="ct">
            QR activation pipeline
            <span className="ds">Onboarding DB</span>
          </div>
          <div className="cs">
            Merchants who said Yes to QR are your next activation targets
          </div>
          <div className="cw" style={{ height: '170px' }}>
            <Doughnut data={qrData} options={donutOpts} plugins={[ChartDataLabels]} />
          </div>
        </div>
        <div className="card">
          <div className="ct">
            Why are enrollments failing?
            <span className="ds">Daily DB</span>
          </div>
          <div className="cs">
            Extracted from agent comments — Network is the most common blocker
          </div>
          <div className="cw" style={{ height: '170px' }}>
            <Bar data={blkData} options={{ ...baseOpts, scales: baseScales }} />
          </div>
        </div>
      </div>

      <div className="footer">STEP Network Live Ops &bull; Onboarding DB + Daily Report DB &bull; Filters apply to both sources</div>
    </div>
  );
}

function buildDonut(map) {
  const keys = Object.keys(map);
  return {
    labels: keys.length ? keys : ['No data'],
    datasets: [{ data: keys.length ? Object.values(map) : [1], backgroundColor: PALETTE, borderColor: '#fff', borderWidth: 3, hoverOffset: 4 }],
  };
}
