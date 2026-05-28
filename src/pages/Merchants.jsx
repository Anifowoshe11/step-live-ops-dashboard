import { Bar } from 'react-chartjs-2';
import { useData } from '../context/DataContext';
import Scorecard from '../components/ui/Scorecard';
import { groupCount, formatDate } from '../utils/dataUtils';

const PALETTE = ['#1a73e8', '#34a853', '#f9ab00', '#ea4335', '#9334e6', '#00897b', '#e67c13', '#0097a7'];
const GRID = 'rgba(0,0,0,0.05)';
const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

export default function Merchants() {
  const { filtered } = useData();
  const O = filtered.onboarding;

  const tot = O.length;
  const merchants = O.filter((r) => r['Who Are You Onboarding?'] === 'Merchant');
  const ac = O.filter((r) => r['Merchant Readiness Level'] === 'Active').length;
  const qc = O.filter((r) => r['Is Merchant Interested In QR Activation?'] === 'Yes').length;
  const ht = O.filter((r) => r['Estimated Daily Customer Traffic'] === '50+').length;
  const withFinancing = O.filter((r) => r['Existing Financing Providers In Store'] === 'Yes').length;

  const storeMap = groupCount(merchants, 'Type of Store');
  const zoneMap = groupCount(O, 'Assigned Zone');

  const storeData = {
    labels: Object.keys(storeMap).length ? Object.keys(storeMap) : ['No data'],
    datasets: [{ data: Object.values(storeMap).length ? Object.values(storeMap) : [0], backgroundColor: PALETTE, borderRadius: 4, barThickness: 20 }],
  };
  const zoneData = {
    labels: Object.keys(zoneMap).length ? Object.keys(zoneMap) : ['No data'],
    datasets: [{ data: Object.values(zoneMap).length ? Object.values(zoneMap) : [0], backgroundColor: PALETTE, borderRadius: 4, barThickness: 20 }],
  };
  const storeOpts = {
    ...baseOpts,
    scales: { x: { grid: { color: GRID }, border: { color: 'transparent' } }, y: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } } },
  };
  const zoneOpts = {
    ...baseOpts,
    indexAxis: 'y',
    scales: { x: { beginAtZero: true, grid: { color: GRID }, border: { color: 'transparent' } }, y: { grid: { display: false } } },
  };

  return (
    <div>
      {/* Source context */}
      <div className="src-banner">
        <div className="src-banner-item">
          <span className="src-dot" style={{ background: 'var(--blue)' }} />
          <span><span className="src-banner-label">Onboarding DB only</span> Every business formally brought onto the STEP platform — this is your network directory</span>
        </div>
      </div>

      <div className="sec">Who is on the STEP network?</div>

      <div className="r g4">
        <Scorecard
          source="Onboarding DB"
          colorClass="bl"
          label="Total Onboarded"
          value={tot}
          sub={`${merchants.length} merchant${merchants.length !== 1 ? 's' : ''} + ${tot - merchants.length} other(s)`}
          subType="up"
        />
        <Scorecard
          source="Onboarding DB"
          colorClass="gr"
          label="Active & Ready"
          value={ac}
          sub={tot > 0 ? `${Math.round((ac / tot) * 100)}% of network cleared to transact` : '—'}
          subType="up"
        />
        <Scorecard
          source="Onboarding DB"
          colorClass="am"
          label="Want QR Activation"
          value={qc}
          sub={tot > 0 ? `${Math.round((qc / tot) * 100)}% of network — your QR pipeline` : '—'}
          subType="up"
        />
        <Scorecard
          source="Onboarding DB"
          colorClass="te"
          label="High-Traffic Stores"
          value={ht}
          sub={`50+ daily customers — prime STEP visibility spots`}
          subType="up"
        />
      </div>

      <div className="r g2">
        <div className="card">
          <div className="ct">
            What types of stores are on STEP?
            <span className="ds">Onboarding DB</span>
          </div>
          <div className="cs">
            Store category breakdown — helps identify which sectors are being targeted and where there are gaps
          </div>
          <div className="cw" style={{ height: '190px' }}>
            <Bar data={storeData} options={storeOpts} />
          </div>
        </div>
        <div className="card">
          <div className="ct">
            Where is STEP most active?
            <span className="ds">Onboarding DB</span>
          </div>
          <div className="cs">
            Merchants per zone — shows geographic concentration and where to expand next
          </div>
          <div className="cw" style={{ height: '190px' }}>
            <Bar data={zoneData} options={zoneOpts} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">
          Merchant directory
          <span className="ds">Onboarding DB</span>
        </div>
        <div className="cs">
          Every onboarded record — {withFinancing} already have existing financing providers in-store. Use filters above to narrow by zone, agent, or readiness
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Date Onboarded</th>
                <th>Business Name</th>
                <th>Merchant / Contact</th>
                <th>Zone</th>
                <th>Store Type</th>
                <th>Daily Traffic</th>
                <th>Financing Present</th>
                <th>Wants QR</th>
                <th>Readiness</th>
                <th>Onboarded By</th>
              </tr>
            </thead>
            <tbody>
              {O.length ? O.map((r, i) => (
                <tr key={i}>
                  <td>{formatDate(r['Timestamp'])}</td>
                  <td><b>{r['Merchant Business Name'] || '—'}</b></td>
                  <td>
                    <div>{r['Merchant Name'] || '—'}</div>
                    {r['Store Attendant Name'] && (
                      <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Attendant: {r['Store Attendant Name']}</div>
                    )}
                  </td>
                  <td>{r['Assigned Zone'] || '—'}</td>
                  <td>{r['Type of Store'] || '—'}</td>
                  <td>
                    <span style={{
                      fontWeight: r['Estimated Daily Customer Traffic'] === '50+' ? 700 : 400,
                      color: r['Estimated Daily Customer Traffic'] === '50+' ? 'var(--green)' : 'inherit',
                    }}>
                      {r['Estimated Daily Customer Traffic'] || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${r['Existing Financing Providers In Store'] === 'Yes' ? 'yes' : 'no'}`}>
                      {r['Existing Financing Providers In Store'] || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${r['Is Merchant Interested In QR Activation?'] === 'Yes' ? 'yes' : 'no'}`}>
                      {r['Is Merchant Interested In QR Activation?'] || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${r['Merchant Readiness Level'] === 'Active' ? 'active' : ''}`}>
                      {r['Merchant Readiness Level'] || '—'}
                    </span>
                  </td>
                  <td>{r['Field Agent Name'] || '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--muted)', padding: '20px' }}>
                    No onboarding records match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="footer">Merchants &bull; Onboarding DB &bull; Every business brought onto the STEP platform</div>
    </div>
  );
}
