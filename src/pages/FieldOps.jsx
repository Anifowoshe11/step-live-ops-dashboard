import { Bar } from 'react-chartjs-2';
import { useData } from '../context/DataContext';
import Scorecard from '../components/ui/Scorecard';
import ProgressBar from '../components/ui/ProgressBar';
import { sumField, pct, formatDate, uniq } from '../utils/dataUtils';

const GRID = 'rgba(0,0,0,0.05)';
const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

export default function FieldOps() {
  const { filtered } = useData();
  const D = filtered.daily;

  // ── Merchant metrics ──
  const vis     = sumField(D, 'Total Merchants Visited Today');
  const blk     = sumField(D, "Interested Merchants But Couldn't Enroll");
  const enrolled = Math.max(0, vis - blk);
  const br      = vis > 0 ? Math.round((blk / vis) * 100) : 0;

  // ── GP metrics ──
  const apr = sumField(D, 'Total People Approached');
  const gpl = sumField(D, "Interested GP Leads But Couldn't Enroll");
  const gpConverted = Math.max(0, apr - gpl);

  const agents = uniq(D.map((r) => r['Agent Name']));

  // ── Merchant funnel chart ──
  const merchantFunnelData = {
    labels: ['Merchants Visited', "Couldn't Enroll", 'Successfully Enrolled'],
    datasets: [{
      data: [vis, blk, enrolled],
      backgroundColor: ['#1a73e8', '#ea4335', '#34a853'],
      borderRadius: 5,
      barThickness: 32,
    }],
  };
  const hBarOpts = {
    ...baseOpts,
    indexAxis: 'y',
    scales: {
      x: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
      y: { grid: { display: false }, ticks: { color: '#202124', font: { weight: '500' } } },
    },
  };

  // ── GP funnel chart ──
  const gpFunnelData = {
    labels: ['People Approached', 'GP Leads Lost', 'Leads Converted'],
    datasets: [{
      data: [apr, gpl, gpConverted],
      backgroundColor: ['#9334e6', '#ea4335', '#34a853'],
      borderRadius: 5,
      barThickness: 32,
    }],
  };

  // ── Agent breakdown: merchant visits ──
  const agentMerchData = {
    labels: agents.length ? agents : ['No data'],
    datasets: [
      { label: 'Visited',  data: agents.map(a => sumField(D.filter(r => r['Agent Name'] === a), 'Total Merchants Visited Today')), backgroundColor: '#1a73e8', borderRadius: 4, barThickness: 18 },
      { label: 'Blocked',  data: agents.map(a => sumField(D.filter(r => r['Agent Name'] === a), "Interested Merchants But Couldn't Enroll")), backgroundColor: '#ea4335', borderRadius: 4, barThickness: 18 },
      { label: 'Enrolled', data: agents.map(a => { const v = sumField(D.filter(r => r['Agent Name'] === a), 'Total Merchants Visited Today'); const b = sumField(D.filter(r => r['Agent Name'] === a), "Interested Merchants But Couldn't Enroll"); return Math.max(0, v - b); }), backgroundColor: '#34a853', borderRadius: 4, barThickness: 18 },
    ],
  };

  // ── Agent breakdown: GP outreach ──
  const agentGPData = {
    labels: agents.length ? agents : ['No data'],
    datasets: [
      { label: 'Approached',  data: agents.map(a => sumField(D.filter(r => r['Agent Name'] === a), 'Total People Approached')), backgroundColor: '#9334e6', borderRadius: 4, barThickness: 20 },
      { label: "Couldn't Complete", data: agents.map(a => sumField(D.filter(r => r['Agent Name'] === a), "Interested GP Leads But Couldn't Enroll")), backgroundColor: '#ea4335', borderRadius: 4, barThickness: 20 },
    ],
  };

  const groupedOpts = (pos = 'top') => ({
    ...baseOpts,
    scales: {
      x: { grid: { color: GRID }, border: { color: 'transparent' } },
      y: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
    },
    plugins: { legend: { display: true, position: pos, labels: { boxWidth: 9, boxHeight: 9, padding: 10 } } },
  });

  // ── Blockers ──
  const blockNet = D.reduce((s, r) => (r['Comments On Merchant Visits'] || '').toLowerCase().includes('network') ? s + (parseFloat(r["Interested Merchants But Couldn't Enroll"]) || 0) : s, 0);
  const blockQR  = D.filter(r => { const c = (r['Comments On Merchant Visits'] || '').toLowerCase(); return c.includes('qr') || c.includes('response'); }).length;
  const maxBlock = Math.max(blockNet, blockQR, gpl, 1);

  return (
    <div>
      <div className="src-banner">
        <div className="src-banner-item">
          <span className="src-dot" style={{ background: 'var(--green)' }} />
          <span><span className="src-banner-label">Daily DB only</span> Submitted by agents each day — Merchant activity and GP outreach are tracked separately</span>
        </div>
      </div>

      {/* ═══ MERCHANT SECTION ═══ */}
      <div className="sec">Merchant field activity — what happened at the stores today?</div>
      <div className="r g4">
        <Scorecard source="Daily DB" colorClass="am" label="Merchant Visits Made" value={vis}
          sub={agents.length ? `By ${agents.join(' & ')}` : 'No agents reporting'} subType="wn" />
        <Scorecard source="Daily DB" colorClass="rd" label="Could Not Enroll"    value={blk}
          sub={vis > 0 ? `${br}% block rate today` : 'No visits recorded'} subType="dn" />
        <Scorecard source="Daily DB" colorClass="gr" label="Successfully Enrolled" value={enrolled}
          sub={vis > 0 ? `${100 - br}% conversion rate` : '—'} subType={enrolled > 0 ? 'up' : ''} />
        <Scorecard source="Daily DB" colorClass="bl" label="Unique Zones Covered" value={uniq(D.map(r => r['Assigned Zone'])).length}
          sub={uniq(D.map(r => r['Assigned Zone'])).join(', ') || '—'} />
      </div>

      <div className="r g2">
        <div className="card">
          <div className="ct">Merchant enrollment funnel <span className="ds">Daily DB</span></div>
          <div className="cs">Visits → blocked → enrolled. The gap between visited and enrolled is your network problem</div>
          <div className="cw" style={{ height: '200px' }}><Bar data={merchantFunnelData} options={hBarOpts} /></div>
        </div>
        <div className="card">
          <div className="ct">Merchant activity per agent <span className="ds">Daily DB</span></div>
          <div className="cs">Who visited the most stores today — and how many converted</div>
          <div className="cw" style={{ height: '200px' }}><Bar data={agentMerchData} options={groupedOpts()} /></div>
        </div>
      </div>

      {/* ═══ GP SECTION ═══ */}
      <div className="sec" style={{ marginTop: '8px' }}>Growth Partner (GP) outreach — people approached in the field today</div>
      <div className="r g4">
        <Scorecard source="Daily DB" colorClass="pu" label="People Approached"    value={apr}
          sub="Total GP outreach today" />
        <Scorecard source="Daily DB" colorClass="rd" label="GP Leads Lost"        value={gpl}
          sub={apr > 0 ? `${pct(gpl, apr)} of approaches didn't convert` : 'No outreach'} subType={gpl > 0 ? 'dn' : ''} />
        <Scorecard source="Daily DB" colorClass="gr" label="GP Leads Converted"   value={gpConverted}
          sub={apr > 0 ? `${pct(gpConverted, apr)} conversion rate` : '—'} subType={gpConverted > 0 ? 'up' : ''} />
        <Scorecard source="Daily DB" colorClass="te" label="Agents Reporting GP"  value={uniq(D.filter(r => parseFloat(r['Total People Approached']) > 0).map(r => r['Agent Name'])).length}
          sub="Agents with GP activity today" />
      </div>

      <div className="r g2">
        <div className="card">
          <div className="ct">GP outreach funnel <span className="ds">Daily DB</span></div>
          <div className="cs">People approached → leads lost → leads converted. Purple = reached, Red = dropped off, Green = won</div>
          <div className="cw" style={{ height: '200px' }}><Bar data={gpFunnelData} options={hBarOpts} /></div>
        </div>
        <div className="card">
          <div className="ct">GP outreach per agent <span className="ds">Daily DB</span></div>
          <div className="cs">Purple = total people approached. Red = those who were interested but couldn't complete</div>
          <div className="cw" style={{ height: '200px' }}><Bar data={agentGPData} options={groupedOpts()} /></div>
        </div>
      </div>

      {/* ═══ FULL LOG ═══ */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">Full agent daily log <span className="ds">Daily DB</span></div>
        <div className="cs">One row per agent submission. Merchant and GP metrics shown in separate column groups</div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th rowSpan="2" style={{ verticalAlign: 'bottom' }}>Date</th>
                <th rowSpan="2" style={{ verticalAlign: 'bottom' }}>Agent</th>
                <th rowSpan="2" style={{ verticalAlign: 'bottom' }}>Zone</th>
                <th colSpan="4" style={{ textAlign: 'center', background: '#e8f0fe', color: 'var(--blue)', borderBottom: '2px solid var(--blue)' }}>Merchant Activity</th>
                <th colSpan="3" style={{ textAlign: 'center', background: '#f3e8ff', color: 'var(--purple)', borderBottom: '2px solid var(--purple)' }}>GP Outreach</th>
              </tr>
              <tr>
                <th style={{ background: '#f0f4ff' }}>Visited</th>
                <th style={{ background: '#f0f4ff' }}>Blocked</th>
                <th style={{ background: '#f0f4ff' }}>Enrolled</th>
                <th style={{ background: '#f0f4ff' }}>Block %</th>
                <th style={{ background: '#faf0ff' }}>Approached</th>
                <th style={{ background: '#faf0ff' }}>Leads Lost</th>
                <th style={{ background: '#faf0ff' }}>Converted</th>
              </tr>
            </thead>
            <tbody>
              {D.length ? D.map((r, i) => {
                const vi = parseFloat(r['Total Merchants Visited Today']) || 0;
                const bl = parseFloat(r["Interested Merchants But Couldn't Enroll"]) || 0;
                const en = Math.max(0, vi - bl);
                const bpct = vi > 0 ? Math.round((bl / vi) * 100) : 0;
                const ap = parseFloat(r['Total People Approached']) || 0;
                const gl = parseFloat(r["Interested GP Leads But Couldn't Enroll"]) || 0;
                const gc = Math.max(0, ap - gl);
                return (
                  <tr key={i}>
                    <td>{formatDate(r['Date'] || r['Timestamp'])}</td>
                    <td><b>{r['Agent Name'] || '—'}</b></td>
                    <td>{r['Assigned Zone'] || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{vi}</td>
                    <td><span className="pill blocked">{bl}</span></td>
                    <td><span className="pill active">{en}</span></td>
                    <td style={{ fontWeight: 600, color: bpct >= 100 ? 'var(--red)' : bpct > 50 ? 'var(--amber)' : 'var(--green)' }}>
                      {vi > 0 ? `${bpct}%` : '—'}
                    </td>
                    <td>{ap}</td>
                    <td style={{ color: 'var(--red)', fontWeight: gl > 0 ? 500 : 400 }}>{gl}</td>
                    <td style={{ color: 'var(--green)', fontWeight: gc > 0 ? 500 : 400 }}>{gc}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="10" style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--muted)', padding: '20px' }}>No field reports match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">What is blocking merchant enrollments? <span className="ds">Daily DB</span></div>
        <div className="cs">Ranked from agent comments on merchant visit issues</div>
        <div style={{ marginTop: '12px' }}>
          <ProgressBar label="Network / Connectivity issues" value={blockNet} max={maxBlock} color="#ea4335" />
          <ProgressBar label="QR Code response speed"        value={blockQR}  max={maxBlock} color="#f9ab00" />
          <ProgressBar label="GP enrollment drop-off"        value={gpl}      max={maxBlock} color="#9334e6" />
        </div>
      </div>

      <div className="footer">Field Ops &bull; Daily Report DB &bull; Merchant and GP activity tracked separately</div>
    </div>
  );
}
