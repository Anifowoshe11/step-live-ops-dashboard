import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { sumField, uniq, formatDate } from '../utils/dataUtils';

const ISSUE_TYPES = ['Network / Connectivity', 'QR Code Speed', 'GP Enrollment Drop-off', 'Agent Issue', 'Other'];
const PRIORITIES  = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES    = ['Open', 'In Progress', 'Resolved'];

const PRIORITY_STYLE = {
  Critical:  { background: 'var(--red-lt)',   color: '#c5221f', border: '1px solid #f5c6c3' },
  High:      { background: 'var(--amber-lt)', color: '#92400e', border: '1px solid #fbbf24' },
  Medium:    { background: 'var(--blue-lt)',  color: 'var(--blue)', border: '1px solid #a8c7fa' },
  Low:       { background: '#f1f3f4',         color: 'var(--muted)', border: '1px solid var(--border)' },
};
const STATUS_STYLE = {
  Open:        { background: 'var(--red-lt)',   color: '#c5221f' },
  'In Progress':{ background: 'var(--amber-lt)', color: '#92400e' },
  Resolved:    { background: 'var(--green-lt)', color: '#137333' },
};

function Pill({ label, styleMap }) {
  const s = styleMap[label] || {};
  return (
    <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:'10px', fontSize:'10px', fontWeight:600, ...s }}>
      {label}
    </span>
  );
}

export default function Escalations() {
  const { filtered, filters }  = useData();
  const { user }               = useAuth();
  const D = filtered.daily;
  const O = filtered.onboarding;

  // ── Live data pre-fill ───────────────────────────────────────────────────
  const vis      = sumField(D, 'Total Merchants Visited Today');
  const blk      = sumField(D, "Interested Merchants But Couldn't Enroll");
  const br       = vis > 0 ? Math.round((blk / vis) * 100) : 0;
  const agents   = uniq(D.map(r => r['Agent Name']));
  const zones    = uniq([...D.map(r => r['Assigned Zone']), ...O.map(r => r['Assigned Zone'])]);

  // ── State ────────────────────────────────────────────────────────────────
  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [configured,  setConfigured]  = useState(true);
  const [fetchErr,    setFetchErr]    = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitMsg,   setSubmitMsg]   = useState('');
  const [updatingId,  setUpdatingId]  = useState(null);

  const [form, setForm] = useState({
    agentName:   agents[0] || '',
    zone:        filters.zone || zones[0] || '',
    issueType:   br >= 100 ? 'Network / Connectivity' : '',
    priority:    br >= 100 ? 'Critical' : br > 50 ? 'High' : 'Medium',
    blockRate:   br > 0 ? `${br}%` : '',
    notes:       '',
  });

  // ── Fetch from Airtable via proxy ────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const res  = await fetch('/.netlify/functions/escalations');
      const data = await res.json();
      if (data.error === 'AIRTABLE_NOT_CONFIGURED') { setConfigured(false); setLoading(false); return; }
      if (data.records) setRecords(data.records.map(r => ({ id: r.id, ...r.fields })));
      else setFetchErr('Unexpected response from Airtable.');
    } catch {
      setFetchErr('Could not reach the escalations function. Make sure you are on the deployed site.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchRecords]);

  // Refresh pre-fill when live data changes
  useEffect(() => {
    setForm(f => ({
      ...f,
      agentName: f.agentName || agents[0] || '',
      zone:      f.zone      || filters.zone || zones[0] || '',
      issueType: f.issueType || (br >= 100 ? 'Network / Connectivity' : ''),
      priority:  br >= 100 ? 'Critical' : br > 50 ? 'High' : f.priority,
      blockRate: f.blockRate || (br > 0 ? `${br}%` : ''),
    }));
  }, [br, agents.join(), zones.join(), filters.zone]); // eslint-disable-line

  // ── Raise escalation ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agentName || !form.zone || !form.issueType) {
      setSubmitMsg('error:Please fill in Agent, Zone and Issue Type.');
      return;
    }
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const res = await fetch('/.netlify/functions/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'Agent Name': form.agentName,
          'Zone':       form.zone,
          'Issue Type': form.issueType,
          'Priority':   form.priority,
          'Status':     'Open',
          'Block Rate': form.blockRate,
          'Date':       new Date().toISOString().split('T')[0],
          'Notes':      form.notes,
          'Raised By':  user?.displayName || user?.email || 'Dashboard',
        }),
      });
      const data = await res.json();
      if (data.id) {
        setSubmitMsg('ok:Escalation raised successfully!');
        setForm(f => ({ ...f, notes: '', issueType: '', blockRate: '' }));
        setShowForm(false);
        fetchRecords();
      } else {
        setSubmitMsg('error:' + (data.error?.message || 'Failed to create record.'));
      }
    } catch {
      setSubmitMsg('error:Network error — could not reach Airtable function.');
    }
    setSubmitting(false);
  };

  // ── Update status ────────────────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/.netlify/functions/escalations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fields: { Status: status } }),
      });
      const data = await res.json();
      if (data.id) fetchRecords();
    } catch { /* silent */ }
    setUpdatingId(null);
  };

  // ── Derived counts ───────────────────────────────────────────────────────
  const openCount     = records.filter(r => r['Status'] === 'Open').length;
  const criticalCount = records.filter(r => r['Priority'] === 'Critical' && r['Status'] !== 'Resolved').length;
  const resolvedCount = records.filter(r => r['Status'] === 'Resolved').length;

  // ── Setup screen ─────────────────────────────────────────────────────────
  if (!configured) {
    return (
      <div>
        <div className="src-banner">
          <div className="src-banner-item">
            <span className="src-dot" style={{ background: '#f59e0b' }} />
            <span><span className="src-banner-label">Airtable</span> Escalation board — two-way sync with your Airtable base</span>
          </div>
        </div>
        <div className="card" style={{ maxWidth: 560, margin: '0 auto', marginTop: 8 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔗</div>
          <div className="ct" style={{ fontSize: 15, marginBottom: 4 }}>Connect your Airtable base</div>
          <div className="cs" style={{ marginBottom: 18 }}>Add 3 environment variables to your Netlify site to activate this tab.</div>
          <pre style={{ background: '#f8f9fa', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', fontSize: 11, lineHeight: 1.8, overflowX: 'auto' }}>
{`AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Escalations`}
          </pre>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 14, lineHeight: 1.8 }}>
            <b>Steps:</b><br />
            1. Go to <b>airtable.com/create/tokens</b> → Create token → add <i>data.records:read</i> + <i>data.records:write</i><br />
            2. Copy your Base ID from <b>airtable.com/api</b><br />
            3. In Netlify → Site config → Environment variables → add all 3 above<br />
            4. Trigger a new deploy
          </div>
        </div>
        <div className="footer">Escalations &bull; Airtable integration &bull; Setup required</div>
      </div>
    );
  }

  const msgType = submitMsg.startsWith('ok:') ? 'ok' : 'err';
  const msgText = submitMsg.replace(/^(ok|error):/, '');

  return (
    <div>
      <div className="src-banner">
        <div className="src-banner-item">
          <span className="src-dot" style={{ background: '#f59e0b' }} />
          <span><span className="src-banner-label">Airtable</span> Live two-way sync — raise escalations from here, resolve them in Airtable or below</span>
        </div>
        <div className="src-banner-item">
          <span className="src-dot" style={{ background: 'var(--green)' }} />
          <span><span className="src-banner-label">Daily DB</span> Form pre-fills from live field data</span>
        </div>
      </div>

      <div className="sec">Escalation board — field issues tracked and resolved</div>

      {/* ── Summary ── */}
      <div className="r g3" style={{ marginBottom: 12 }}>
        <div className="sc rd">
          <div className="sc-src onboarding" style={{ background: '#fef2f2', color: '#c5221f', border: '1px solid #fecaca' }}>Airtable</div>
          <div className="sc-l">Open Escalations</div>
          <div className="sc-v">{loading ? '…' : openCount}</div>
          <div className="sc-s dn">{openCount > 0 ? `${openCount} issue${openCount !== 1 ? 's' : ''} need attention` : 'Nothing open'}</div>
        </div>
        <div className="sc am">
          <div className="sc-src onboarding" style={{ background: '#fff7ed', color: '#92400e', border: '1px solid #fbbf24' }}>Airtable</div>
          <div className="sc-l">Critical Priority</div>
          <div className="sc-v">{loading ? '…' : criticalCount}</div>
          <div className="sc-s dn">{criticalCount > 0 ? 'Requires immediate action' : 'No critical issues'}</div>
        </div>
        <div className="sc gr">
          <div className="sc-src daily">Airtable</div>
          <div className="sc-l">Resolved</div>
          <div className="sc-v">{loading ? '…' : resolvedCount}</div>
          <div className="sc-s up">{resolvedCount > 0 ? `${resolvedCount} closed out` : '—'}</div>
        </div>
      </div>

      {/* ── Submit feedback ── */}
      {submitMsg && (
        <div className={`status ${msgType}`} style={{ marginBottom: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
          {msgType === 'ok' ? '✓ ' : '⚠ '}{msgText}
        </div>
      )}

      {/* ── Raise form ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? 16 : 0 }}>
          <div>
            <div className="ct">Raise a new escalation</div>
            {!showForm && <div className="cs" style={{ marginBottom: 0 }}>Pre-filled from live field data — edit and submit to Airtable</div>}
          </div>
          <button className={showForm ? 'clear-btn' : 'ref-btn'} style={{ fontSize: 12 }} onClick={() => { setShowForm(!showForm); setSubmitMsg(''); }}>
            {showForm ? '✕ Cancel' : '+ Raise Escalation'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div className="r g3" style={{ marginBottom: 12 }}>
              <div>
                <label className="auth-label">Agent Name *</label>
                <select className={`flt${form.agentName ? ' active' : ''}`} style={{ width: '100%' }}
                  value={form.agentName} onChange={e => setForm(f => ({ ...f, agentName: e.target.value }))}>
                  <option value="">Select agent…</option>
                  {agents.map(a => <option key={a} value={a}>{a}</option>)}
                  <option value="__other">Other</option>
                </select>
              </div>
              <div>
                <label className="auth-label">Zone *</label>
                <select className={`flt${form.zone ? ' active' : ''}`} style={{ width: '100%' }}
                  value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}>
                  <option value="">Select zone…</option>
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="auth-label">Issue Type *</label>
                <select className={`flt${form.issueType ? ' active' : ''}`} style={{ width: '100%' }}
                  value={form.issueType} onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}>
                  <option value="">Select type…</option>
                  {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="r g3" style={{ marginBottom: 12 }}>
              <div>
                <label className="auth-label">Priority</label>
                <select className={`flt${form.priority ? ' active' : ''}`} style={{ width: '100%' }}
                  value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="auth-label">Block Rate (auto-filled)</label>
                <input className="auth-input" value={form.blockRate}
                  onChange={e => setForm(f => ({ ...f, blockRate: e.target.value }))}
                  placeholder="e.g. 100%" />
              </div>
              <div>
                <label className="auth-label">Raised By</label>
                <input className="auth-input" value={user?.displayName || user?.email || ''}
                  disabled style={{ background: '#f8f9fa', color: 'var(--muted)' }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="auth-label">Notes / Description</label>
              <textarea className="auth-input" rows={3}
                style={{ resize: 'vertical', minHeight: 70 }}
                placeholder="Describe the issue — what happened, impact, what was tried…"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <button type="submit" className="ref-btn" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Submitting to Airtable…' : 'Submit Escalation →'}
            </button>
          </form>
        )}
      </div>

      {/* ── Records table ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="ct">All escalations <span className="ds">Airtable</span></div>
            <div className="cs" style={{ marginBottom: 0 }}>{records.length} total record{records.length !== 1 ? 's' : ''} — newest first</div>
          </div>
          <button className="ref-btn" style={{ fontSize: 11, padding: '5px 12px' }} onClick={fetchRecords} disabled={loading}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {fetchErr && <div className="status err" style={{ marginBottom: 10, borderRadius: 6 }}>{fetchErr}</div>}

        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Agent</th>
                <th>Zone</th>
                <th>Issue Type</th>
                <th>Priority</th>
                <th>Block Rate</th>
                <th>Status</th>
                <th>Raised By</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontStyle: 'italic' }}>Loading from Airtable…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontStyle: 'italic' }}>No escalations yet — raise one using the form above</td></tr>
              ) : records.map(r => (
                <tr key={r.id} style={{ opacity: r['Status'] === 'Resolved' ? 0.6 : 1 }}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r['Date']) || '—'}</td>
                  <td><b>{r['Agent Name'] || '—'}</b></td>
                  <td>{r['Zone'] || '—'}</td>
                  <td>{r['Issue Type'] || '—'}</td>
                  <td><Pill label={r['Priority'] || 'Medium'} styleMap={PRIORITY_STYLE} /></td>
                  <td style={{ fontWeight: 600, color: r['Block Rate'] === '100%' ? 'var(--red)' : 'var(--text)' }}>{r['Block Rate'] || '—'}</td>
                  <td><Pill label={r['Status'] || 'Open'} styleMap={STATUS_STYLE} /></td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{r['Raised By'] || '—'}</td>
                  <td style={{ fontSize: 11, maxWidth: 180, whiteSpace: 'normal', color: 'var(--muted)' }}>{r['Notes'] || '—'}</td>
                  <td>
                    {r['Status'] !== 'Resolved' ? (
                      <button
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--green)', background: 'var(--green-lt)', color: '#137333', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap' }}
                        disabled={updatingId === r.id}
                        onClick={() => updateStatus(r.id, 'Resolved')}
                      >
                        {updatingId === r.id ? '…' : '✓ Resolve'}
                      </button>
                    ) : (
                      <button
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', background: '#f1f3f4', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        disabled={updatingId === r.id}
                        onClick={() => updateStatus(r.id, 'Open')}
                      >
                        {updatingId === r.id ? '…' : '↩ Reopen'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="footer">Escalations &bull; Airtable two-way sync &bull; Raises from STEP dashboard · Resolved here or in Airtable</div>
    </div>
  );
}
