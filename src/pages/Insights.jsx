import { useData } from '../context/DataContext';
import InsightCard from '../components/ui/InsightCard';
import { sumField, pct, formatDate, uniq } from '../utils/dataUtils';

export default function Insights() {
  const { filtered } = useData();
  const O = filtered.onboarding;
  const D = filtered.daily;

  const vis = sumField(D, 'Total Merchants Visited Today');
  const blk = sumField(D, "Interested Merchants But Couldn't Enroll");
  const apr = sumField(D, 'Total People Approached');
  const gpl = sumField(D, "Interested GP Leads But Couldn't Enroll");
  const br = vis > 0 ? Math.round((blk / vis) * 100) : 0;
  const actv = O.filter((r) => r['Merchant Readiness Level'] === 'Active').length;

  // System-generated alerts
  const alerts = [];
  if (br >= 100 && vis > 0) {
    alerts.push({ type: 'cr', icon: '🚨', tag: 'Critical — 100% Block Rate', text: `${vis} merchants visited, 0 enrolled. Network issues are completely blocking field conversions. Escalate immediately.` });
  } else if (br > 50) {
    alerts.push({ type: 'wn', icon: '⚠️', tag: `Warning — ${br}% Block Rate`, text: `${br}% of visited merchants could not enroll. Investigate connectivity in active zones.` });
  }
  if (gpl > 0) {
    alerts.push({ type: 'wn', icon: '📲', tag: `GP Lead Loss — ${pct(gpl, apr)}`, text: `${gpl} of ${apr} people approached were interested but couldn't complete GP enrollment due to infrastructure issues.` });
  }
  if (actv > 0) {
    alerts.push({ type: 'po', icon: '✅', tag: 'Active Merchants', text: `${actv} merchant(s) marked Active and ready to transact immediately.` });
  }

  // Agent feedback rows — one per daily submission that has any comment
  const feedbackRows = D.reduce((acc, r) => {
    const fb = r['Overall Field Experience Feedbacks/Recommendations'];
    const mc = r['Comments On Merchant Visits'];
    const gpc = r['Comments On Gp Enrollment issue'];
    if (fb || mc || gpc) {
      acc.push({
        agent: r['Agent Name'] || 'Unknown Agent',
        zone: r['Assigned Zone'] || '—',
        date: formatDate(r['Date'] || r['Timestamp']),
        feedback: fb || '',
        merchantComment: mc || '',
        gpComment: gpc || '',
      });
    }
    return acc;
  }, []);

  const allAgents = uniq(D.map((r) => r['Agent Name']));
  const hasAlerts = alerts.length > 0;
  const hasFeedback = feedbackRows.length > 0;

  return (
    <div>
      <div className="sec">Agent insights &amp; field feedback</div>

      {/* Alerts section */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">Operational Alerts</div>
        <div className="cs">Auto-generated from live field data</div>
        {hasAlerts ? (
          <div className="ins-wrap" style={{ marginBottom: 0 }}>
            {alerts.map((a, i) => (
              <InsightCard key={i} type={a.type} icon={a.icon} tag={a.tag} text={a.text} />
            ))}
          </div>
        ) : (
          <div style={emptyStyle}>No active alerts — all metrics look healthy</div>
        )}
      </div>

      {/* Agent feedback cards */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="ct">Agent Field Feedback</div>
        <div className="cs">
          Suggestions, observations and recommendations submitted by agents —{' '}
          <b>{allAgents.length}</b> agent(s) reporting
        </div>
        {hasFeedback ? (
          <div className="feedback-grid">
            {feedbackRows.map((row, i) => (
              <FeedbackCard key={i} row={row} />
            ))}
          </div>
        ) : (
          <div style={emptyStyle}>No feedback submitted yet — data updates on Refresh</div>
        )}
      </div>

      <div className="footer">Insights &bull; STEP Network Live Ops &bull; Live from Daily Report DB</div>
    </div>
  );
}

const emptyStyle = {
  fontSize: '12px',
  color: 'var(--muted)',
  fontStyle: 'italic',
  padding: '14px 0 4px',
};

function FeedbackCard({ row }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '14px 16px',
      borderLeft: '4px solid var(--blue)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={avatarStyle}>{row.agent.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{row.agent}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{row.zone}</div>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--muted)', background: '#f1f3f4', padding: '3px 9px', borderRadius: '10px' }}>
          {row.date}
        </span>
      </div>

      {row.feedback && (
        <FeedbackItem label="Overall Feedback" icon="💬" text={row.feedback} color="var(--blue)" />
      )}
      {row.merchantComment && (
        <FeedbackItem label="Merchant Visit Comment" icon="🏪" text={row.merchantComment} color="var(--amber)" />
      )}
      {row.gpComment && (
        <FeedbackItem label="GP Enrollment Comment" icon="📲" text={row.gpComment} color="var(--purple)" />
      )}
    </div>
  );
}

function FeedbackItem({ label, icon, text, color }) {
  return (
    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border2)' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color, marginBottom: '3px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text)' }}>{text}</div>
    </div>
  );
}

const avatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'var(--blue-lt)',
  color: 'var(--blue)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '13px',
  flexShrink: 0,
};
