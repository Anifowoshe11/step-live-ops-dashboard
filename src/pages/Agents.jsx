import { Bar } from 'react-chartjs-2';
import { useData } from '../context/DataContext';
import Scorecard from '../components/ui/Scorecard';
import { sumField, pct, uniq } from '../utils/dataUtils';

const PALETTE = ['#1a73e8', '#34a853', '#f9ab00', '#ea4335', '#9334e6', '#00897b', '#e67c13', '#0097a7'];
const GRID = 'rgba(0,0,0,0.05)';
const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

export default function Agents() {
  const { filtered } = useData();
  const O = filtered.onboarding;
  const D = filtered.daily;

  const allAgents = uniq([...O.map(r => r['Field Agent Name']), ...D.map(r => r['Agent Name'])]);

  const vis = sumField(D, 'Total Merchants Visited Today');
  const blk = sumField(D, "Interested Merchants But Couldn't Enroll");
  const apr = sumField(D, 'Total People Approached');
  const gpl = sumField(D, "Interested GP Leads But Couldn't Enroll");
  const br  = vis > 0 ? Math.round((blk / vis) * 100) : 0;

  // Onboarding split by type per agent
  const merchantOnb = (a) => O.filter(r => r['Field Agent Name'] === a && r['Who Are You Onboarding?'] === 'Merchant').length;
  const gpOnb       = (a) => O.filter(r => r['Field Agent Name'] === a && r['Who Are You Onboarding?'] !== 'Merchant').length;

  // Charts
  const onbData = {
    labels: allAgents.length ? allAgents : ['No data'],
    datasets: [
      { label: 'Merchants', data: allAgents.map(merchantOnb), backgroundColor: '#1a73e8', borderRadius: 4, barThickness: 18 },
      { label: 'GP / Other', data: allAgents.map(gpOnb),      backgroundColor: '#9334e6', borderRadius: 4, barThickness: 18 },
    ],
  };

  const agV = allAgents.map(a => sumField(D.filter(r => r['Agent Name'] === a), 'Total Merchants Visited Today'));
  const agB = allAgents.map(a => sumField(D.filter(r => r['Agent Name'] === a), "Interested Merchants But Couldn't Enroll"));
  const actData = {
    labels: allAgents.length ? allAgents : ['No data'],
    datasets: [
      { label: 'Visited',  data: agV,                                              backgroundColor: '#1a73e8', borderRadius: 4, barThickness: 18 },
      { label: 'Blocked',  data: agB,                                              backgroundColor: '#ea4335', borderRadius: 4, barThickness: 18 },
      { label: 'Enrolled', data: agV.map((v, i) => Math.max(0, v - agB[i])),      backgroundColor: '#34a853', borderRadius: 4, barThickness: 18 },
    ],
  };

  const gpData = {
    labels: allAgents.length ? allAgents : ['No data'],
    datasets: [
      { label: 'Approached', data: allAgents.map(a => sumField(D.filter(r => r['Agent Name'] === a), 'Total People Approached')),                         backgroundColor: '#9334e6', borderRadius: 4, barThickness: 18 },
      { label: 'Lost',       data: allAgents.map(a => sumField(D.filter(r => r['Agent Name'] === a), "Interested GP Leads But Couldn't Enroll")), backgroundColor: '#ea4335', borderRadius: 4, barThickness: 18 },
    ],
  };

  const sharedScales = {
    x: { grid: { color: GRID }, border: { color: 'transparent' } },
    y: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } },
  };
  const legendOpts = { ...baseOpts, scales: sharedScales, plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 9, boxHeight: 9, padding: 10 } } } };
  const barOpts    = { ...baseOpts, scales: sharedScales };

  return (
    <div>
      <div className="src-banner">
        <div className="src-banner-item">
          <span className="src-dot" style={{ background: 'var(--blue)' }} />
          <span><span className="src-banner-label">Onboarding DB</span> Merchant &amp; GP onboardings per agent</span>
        </div>
        <div className="src-banner-item">
          <span className="src-dot" style={{ background: 'var(--green)' }} />
          <span><span className="src-banner-label">Daily DB</span> Daily merchant visits &amp; GP outreach per agent</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>Linked by Agent Name</div>
      </div>

      <div className="sec">Who is driving STEP? — agent performance across merchants and GP</div>

      <div className="r g4">
        <Scorecard source="Both DBs"     colorClass="bl" label="Agents Reporting"
          value={allAgents.length} sub={allAgents.join(' · ') || 'None found'} subType="up" />
        <Scorecard source="Onboarding DB" colorClass="gr" label="Total Onboardings"
          value={O.length}
          sub={`${O.filter(r => r['Who Are You Onboarding?'] === 'Merchant').length} merchants + ${O.filter(r => r['Who Are You Onboarding?'] !== 'Merchant').length} GP/other`}
          subType="up" />
        <Scorecard source="Daily DB" colorClass="rd" label="Merchant Block Rate"
          value={`${br}%`} sub={vis > 0 ? `${blk} blocked of ${vis} visits` : 'No visits recorded'} subType={br >= 50 ? 'dn' : ''} />
        <Scorecard source="Daily DB" colorClass="pu" label="Total GP Approached"
          value={apr} sub={gpl > 0 ? `${gpl} leads lost across all agents` : apr > 0 ? 'All converted' : 'No GP activity'} subType={gpl > 0 ? 'wn' : 'up'} />
      </div>

      {/* ── Onboarding charts ── */}
      <div className="sec" style={{ marginTop: '4px' }}>Onboarding performance — from Onboarding DB</div>
      <div className="r g2">
        <div className="card">
          <div className="ct">Who is onboarding the most? <span className="ds">Onboarding DB</span></div>
          <div className="cs">Blue = merchants enrolled. Purple = GP & other types. Shows each agent's contribution by category</div>
          <div className="cw" style={{ height: '190px' }}><Bar data={onbData} options={legendOpts} /></div>
        </div>
        <div className="card">
          <div className="ct">Daily merchant field activity <span className="ds">Daily DB</span></div>
          <div className="cs">Blue = visits, Red = blocked, Green = enrolled — field conversion performance per agent</div>
          <div className="cw" style={{ height: '190px' }}><Bar data={actData} options={legendOpts} /></div>
        </div>
      </div>

      {/* ── GP chart ── */}
      <div className="sec" style={{ marginTop: '4px' }}>GP outreach performance — from Daily DB</div>
      <div className="r g2">
        <div className="card">
          <div className="ct">GP outreach by agent <span className="ds">Daily DB</span></div>
          <div className="cs">Purple = total people approached. Red = lost leads. The smaller the red vs purple, the better</div>
          <div className="cw" style={{ height: '190px' }}><Bar data={gpData} options={legendOpts} /></div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.8' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginBottom: '8px' }}>How to read this page</div>
            <div><span style={{ color: 'var(--blue)' }}>■</span> <b>Onboarding DB</b> — counts every person formally enrolled (left charts)</div>
            <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--green)' }}>■</span> <b>Daily DB</b> — tracks what agents do on the ground daily (right charts &amp; GP)</div>
            <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--muted)' }}>ℹ</span> Merchant visits and GP outreach are two separate activities and tracked independently</div>
          </div>
        </div>
      </div>

      {/* ── Summary table ── */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">Agent performance summary <span className="ds">Both DBs — matched by Agent Name</span></div>
        <div className="cs">Merchant metrics (blue columns) from Onboarding DB · Merchant field metrics (green) and GP metrics (purple) from Daily DB</div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th rowSpan="2" style={{ verticalAlign: 'bottom' }}>Agent</th>
                <th rowSpan="2" style={{ verticalAlign: 'bottom' }}>Zone</th>
                <th colSpan="2" style={{ textAlign: 'center', background: '#e8f0fe', color: 'var(--blue)', borderBottom: '2px solid var(--blue)' }}>Onboarding DB</th>
                <th colSpan="4" style={{ textAlign: 'center', background: '#e6f4ea', color: '#137333', borderBottom: '2px solid var(--green)' }}>Daily DB — Merchant</th>
                <th colSpan="3" style={{ textAlign: 'center', background: '#f3e8ff', color: 'var(--purple)', borderBottom: '2px solid var(--purple)' }}>Daily DB — GP</th>
              </tr>
              <tr>
                <th style={{ background: '#f0f4ff' }}>Merchants</th>
                <th style={{ background: '#f0f4ff' }}>GP / Other</th>
                <th style={{ background: '#f0f6f0' }}>Visits</th>
                <th style={{ background: '#f0f6f0' }}>Enrolled</th>
                <th style={{ background: '#f0f6f0' }}>Blocked</th>
                <th style={{ background: '#f0f6f0' }}>Block %</th>
                <th style={{ background: '#faf0ff' }}>Approached</th>
                <th style={{ background: '#faf0ff' }}>Lost</th>
                <th style={{ background: '#faf0ff' }}>Converted</th>
              </tr>
            </thead>
            <tbody>
              {allAgents.length ? allAgents.map(a => {
                const vv = sumField(D.filter(r => r['Agent Name'] === a), 'Total Merchants Visited Today');
                const bb = sumField(D.filter(r => r['Agent Name'] === a), "Interested Merchants But Couldn't Enroll");
                const en = Math.max(0, vv - bb);
                const bpct = vv > 0 ? Math.round((bb / vv) * 100) : 0;
                const ap = sumField(D.filter(r => r['Agent Name'] === a), 'Total People Approached');
                const gl = sumField(D.filter(r => r['Agent Name'] === a), "Interested GP Leads But Couldn't Enroll");
                const gc = Math.max(0, ap - gl);
                const zn = (D.find(r => r['Agent Name'] === a) || O.find(r => r['Field Agent Name'] === a) || {})['Assigned Zone'] || '—';
                return (
                  <tr key={a}>
                    <td><b>{a}</b></td>
                    <td>{zn}</td>
                    <td style={{ color: 'var(--blue)', fontWeight: 600 }}>{merchantOnb(a)}</td>
                    <td style={{ color: 'var(--purple)', fontWeight: 600 }}>{gpOnb(a)}</td>
                    <td>{vv}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 500 }}>{en}</td>
                    <td>{bb}</td>
                    <td style={{ fontWeight: 600, color: bpct >= 100 ? 'var(--red)' : bpct > 50 ? 'var(--amber)' : bpct > 0 ? 'var(--text)' : 'var(--muted)' }}>
                      {vv > 0 ? `${bpct}%` : '—'}
                    </td>
                    <td>{ap}</td>
                    <td style={{ color: 'var(--red)', fontWeight: gl > 0 ? 500 : 400 }}>{gl}</td>
                    <td style={{ color: 'var(--green)', fontWeight: gc > 0 ? 500 : 400 }}>{gc}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="11" style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--muted)', padding: '20px' }}>No agents match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="footer">Agents &bull; Onboarding DB + Daily Report DB &bull; Merchant and GP tracked separately</div>
    </div>
  );
}
