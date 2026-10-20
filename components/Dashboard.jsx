'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const time = value => new Date(value).toLocaleTimeString('en-IN', { hour12: false });
const titles = {
  control: ['Control room', 'Transaction control room'],
  audit: ['Audit trail', 'Audit trail'],
  policy: ['Policy registry', 'Policy registry'],
};
const policies = [
  ['Agent identity', 'Only payment-agent-01 may propose create_payment_request. Unknown agents and tools are denied.'],
  ['Authoritative context', 'Required source records must be available. Missing context holds the action; it is never treated as verified.'],
  ['Supplier verification', 'The supplier must be active and its current bank beneficiary independently verified in the mock registry.'],
  ['Three-way matching', 'The purchase order, goods receipt, invoice and action must agree on supplier, quantity, value and beneficiary.'],
  ['Separation of duties', 'An initiator cannot approve their own order or payment. Only the demo finance role may record payment approval.'],
  ['Value limits', 'Reversible requests above ₹5,00,000 require review. Requests above ₹10,00,000 are blocked. No funds are settled.'],
  ['Approval integrity', 'Approval binds the exact action, source records, requester, agent and policy version. It expires after five minutes.'],
  ['Duplicate prevention', 'A unique invoice and operation key guard mock request creation. Identical retries return the existing result.'],
  ['Document isolation', 'Invoice text cannot alter the policy or grant approval. This demonstrates one controlled injection fixture, not general attack detection.'],
];

function Empty({ symbol, title, children }) {
  return <div className="empty-state"><span className="empty-symbol" aria-hidden="true">{symbol}</span><strong>{title}</strong><p>{children}</p></div>;
}

function Flow({ tx }) {
  const endClass = !tx ? '' : tx.payment ? 'verified' : tx.decision?.outcome === 'BLOCK' ? 'blocked' : 'held';
  const nodes = [
    ['▧', 'Invoice agent', tx ? 'Intent extracted' : 'Read document', ''],
    ['⊞', 'Source records', tx ? 'Evidence linked' : 'Resolve context', ''],
    ['◇', 'Policy engine', tx ? 'Rules evaluated' : 'Check invariants', ''],
    ['♧', 'ChainGuard gate', tx ? tx.status.replaceAll('_', ' ') : 'Enforce before action', 'gate'],
    [tx?.payment ? '✓' : tx ? '⊘' : '↗', 'Payment tool', tx?.payment ? 'Request verified' : tx ? 'Not invoked' : 'Awaiting intent', endClass],
  ];
  return <div className="flow" id="flow">{nodes.map(([icon, title, sub, cls], i) => <Fragment key={title}>
    {i > 0 && <span className="flow-arrow" aria-hidden="true">→</span>}
    <div className={`flow-node ${cls}`}><span className="flow-icon" aria-hidden="true">{icon}</span><strong>{title}</strong><small>{sub}</small></div>
  </Fragment>)}</div>;
}

function Evidence({ tx }) {
  if (!tx) return <Empty symbol="▧" title="The complete transaction, in context">Run a scenario to correlate the supplier, order, goods receipt and invoice.</Empty>;
  const { supplier, po, receipt, invoice } = tx.records;
  const rows = [
    ['Supplier', supplier?.name || 'Source unavailable', supplier?.id || 'No authoritative response', supplier?.bankStatus || 'UNKNOWN', !supplier ? 'warn' : supplier.bankStatus !== 'VERIFIED' ? 'bad' : ''],
    ['Purchase order', money(po.amount), po.id, po.status, ''],
    ['Goods receipt', `${receipt.quantity} / ${po.quantity} units received`, receipt.id, 'MATCHED', ''],
    ['Invoice', money(invoice.amount), invoice.id, invoice.amount === po.amount ? 'MATCHED' : 'MISMATCH', invoice.amount === po.amount ? '' : 'bad'],
    ['Beneficiary', `Demo account •${tx.action.beneficiary.slice(-4)}`, `Source version ${supplier?.version || 'unknown'}`, supplier?.bankStatus || 'UNKNOWN', supplier?.bankStatus === 'VERIFIED' ? '' : 'warn'],
  ];
  return <>
    <div className="record-summary"><div><div className="supplier-name">Meridian Components</div><div className="supplier-desc">Industrial sensors · 20 units</div></div><div><div className="amount">{money(tx.action.amount)}</div><div className="currency-label">PROPOSED REQUEST · INR</div></div></div>
    <table className="evidence-table"><tbody>{rows.map(([label, main, ref, status, cls]) => <tr key={label}><td>{label}</td><td><span className="record-main">{main}</span><span className="record-ref mono">{ref}</span></td><td><span className={`state-pill ${cls}`}>{status}</span></td></tr>)}</tbody></table>
    <details key={tx.id} className={`invoice-document ${tx.scenario === 'injection' ? 'injection' : ''}`} open={tx.scenario === 'injection' ? true : undefined}><summary>View invoice document <span className="trust-tag">UNTRUSTED DATA</span></summary><pre>{tx.document}</pre></details>
  </>;
}

function Decision({ tx, identity, busy, onAction }) {
  if (!tx) return <Empty symbol="◇" title="Ready to evaluate">Every protected action is checked against the same server-side policies.</Empty>;
  const decision = tx.decision;
  const approved = tx.status === 'APPROVED';
  const changed = tx.status === 'STATE_CHANGED';
  const color = tx.payment ? '' : decision.outcome === 'BLOCK' ? 'block' : 'hold';
  const title = tx.payment ? 'Allowed · request verified' : approved ? 'Approved · awaiting execution' : changed ? 'State changed · recheck required' : decision.outcome === 'BLOCK' ? 'Blocked before execution' : 'Held · action paused';
  const reason = approved ? 'Approval saved; execution rechecks every policy' : changed ? 'The beneficiary no longer matches the approved action' : decision.reason.replaceAll('_', ' ').toLowerCase();
  const checks = decision.checks.map(c => {
    if (c.id === 'approval' && approved) return { ...c, pass: true, detail: 'Approval recorded for this snapshot. All rules will be rechecked at execution.' };
    if (c.id === 'approval' && changed) return { ...c, pass: false, detail: 'Beneficiary changed since approval. Execute to recheck and record the stale-approval decision.' };
    return c;
  });
  const actions = [];
  if (!tx.payment && decision.outcome === 'HOLD' && decision.reason !== 'CONTEXT_UNAVAILABLE') {
    if (approved || changed) actions.push(['execute', 'Execute with recheck →', 'primary']);
    else if (identity.role === 'finance') actions.push(['approve', 'Approve as finance reviewer', 'primary']);
    else actions.push(['reviewer', 'Switch to finance reviewer →', 'primary']);
    if (tx.scenario === 'stale' && approved) actions.push(['change-beneficiary', 'Change beneficiary', 'secondary']);
  }
  if (tx.payment) actions.push(['execute', '↻ Retry same request', 'secondary']);
  return <>
    <div className={`decision-banner ${color}`}><span className="decision-symbol">{tx.payment ? '✓' : decision.outcome === 'BLOCK' ? '×' : 'Ⅱ'}</span><div><strong>{title}</strong><p>{reason}</p></div></div>
    <div className="checks">{checks.map(c => <div key={c.id} className={`check-row ${c.pass ? '' : 'fail'}`}><span className="check-icon">{c.pass ? '✓' : '!'}</span><details><summary><span className="check-label">{c.label}</span><span className="check-value">{c.pass ? 'PASS' : c.failure === 'BLOCK' ? 'FAIL' : 'HOLD'}</span></summary><p>{c.detail}</p></details></div>)}
      <div className="check-row"><span className="check-icon">✓</span><span>Duplicate guard</span><span className="check-value">{tx.payment ? 'ONE REQUEST' : 'ON DISPATCH'}</span></div>
    </div>
    <div className="tool-counter"><span>Protected-tool invocations <span className="mono">/ this transaction</span></span><strong>{tx.toolInvocations}</strong></div>
    {tx.approval && <p className="approval-info">Approval: {tx.approval.approver} · expires {time(tx.approval.expiresAt)}<br />Bound digest: <span className="mono">{tx.approval.fingerprint.slice(0, 24)}…</span></p>}
    {actions.length > 0 && <div className="decision-actions">{actions.map(([action, label, cls]) => <button key={action} disabled={busy} className={`button ${cls}`} data-action={action} onClick={() => onAction(action)}>{label}</button>)}</div>}
    <p className="baseline"><strong>Permission-only baseline: {decision.baseline}.</strong> The demo payment agent has tool access. ChainGuard also checks the complete transaction. This baseline is not a commercial ERP comparison.</p>
  </>;
}

function Timeline({ tx, events }) {
  if (!tx) return <div className="empty-trace">No events yet.</div>;
  return <div className="timeline">{events.filter(event => event.transactionId === tx.id).map(event => <div key={event.id} className="trace-row"><span className="trace-dot">{event.kind === 'INTERVENTION' ? '!' : '✓'}</span><span className="trace-time">{time(event.timestamp)}</span><span className="trace-kind">{event.kind}</span><div className="trace-message">{event.message}<span className="trace-actor">{event.actor} · {event.policyVersion}{event.resultRef && ` · ${event.resultRef}`}</span></div></div>)}</div>;
}

function Audit({ state, filter, onFilter }) {
  const events = state.events.filter(event => filter === 'all' || event.transactionId === filter).toReversed();
  return <div className="panel"><div className="panel-heading"><h2>Every action, connected</h2><label className="filter-label">Filter <select id="audit-filter" value={filter} onChange={e => onFilter(e.target.value)}><option value="all">All transactions</option>{state.transactions.map(tx => <option key={tx.id} value={tx.id}>{tx.id} · {tx.scenario}</option>)}</select></label></div>
    <div id="audit-content">{events.length ? <div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>Time</th><th>Transaction / actor</th><th>Event</th><th>Decision & evidence</th></tr></thead><tbody>{events.map(event => <tr key={event.id}><td className="mono">{time(event.timestamp)}</td><td><span className="mono">{event.transactionId}</span><br />{event.actor}</td><td><span className={`state-pill ${event.kind === 'INTERVENTION' ? 'warn' : ''}`}>{event.kind}</span></td><td><details><summary>{event.message}</summary><pre className="audit-json">{JSON.stringify(event, null, 2)}</pre></details></td></tr>)}</tbody></table></div> : <Empty symbol="≡" title="Your audit trail starts here">Run a scenario to capture an evidence-linked chain of actions and decisions.</Empty>}</div>
  </div>;
}

export default function Dashboard() {
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState('safe');
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState('control');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  const dialog = useRef(null);
  const initialFetch = useRef(null);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load the local demo. Check that the server is running.');
    const next = await response.json();
    setState(next);
    setError('');
    return next;
  }, []);

  useEffect(() => {
    // Reuse the request during React Strict Mode's effect replay so there is
    // only one initial session-cookie response.
    initialFetch.current ??= refresh();
    let active = true;
    initialFetch.current.catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function mutate(path, data = {}) {
    if (pending.current || !state) return;
    pending.current = true;
    setBusy(true);
    try {
      const post = async (endpoint, payload) => {
        const response = await fetch(`/api/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf }, body: JSON.stringify(payload) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'The action could not complete.');
        return body.result;
      };
      if (path === 'run' && state.identity.role !== 'operator') await post('session', { role: 'operator' });
      const result = await post(path, data);
      if (result?.id && result?.scenario) setActiveId(result.id);
      if (path === 'reset') { setActiveId(null); setSelected('safe'); setFilter('all'); }
      const next = await refresh();
      if (path === 'session') setNotice(`Demo identity: ${next.identity.name}. This is a role simulation, not production sign-in.`);
      if (path === 'approve') setNotice('Approval recorded. Execute the request to recheck current state.');
      if (path === 'change-beneficiary') setNotice('Beneficiary changed to •9036. Try execution to test the previous approval.');
      if (path === 'reset') setNotice('Demo reset. Ready for a clean recording.');
    } catch (e) {
      setNotice(e.message);
      try { await refresh(); } catch { setError('Connection lost. Restart the local server and refresh this page.'); }
    } finally { pending.current = false; setBusy(false); }
  }
  function chooseScenario(id) {
    if (busy || !id) return;
    setSelected(id);
    setActiveId(state.transactions.find(tx => tx.scenario === id)?.id || null);
  }
  const tx = state?.transactions.find(t => t.id === activeId);
  const scenario = state?.scenarios.find(s => s.id === selected);
  const metrics = state ? [
    ['Transactions evaluated', state.metrics.transactions, null, '▤'],
    ['Requests blocked', state.metrics.blocked, null, '⊘'],
    ['Requests on hold', state.metrics.held, null, '◷'],
    ['Requests verified', state.metrics.requests, `${state.metrics.toolInvocations} protected-tool invocations`, '✓'],
  ] : [];
  return <>
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="ChainGuard home"><img src="/favicon.svg" width="36" height="36" alt="" /><span>ChainGuard</span></a>
      <div className="workspace"><span className="workspace-icon">M</span><div>Meridian workspace</div><span className="workspace-chevron">⌄</span></div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">{[['control', '▦'], ['audit', '≡'], ['policy', '◇']].map(([name, icon]) => <button key={name} disabled={busy} className={`nav-item ${view === name ? 'active' : ''}`} data-view={name} onClick={() => setView(name)}><span className="nav-icon">{icon}</span>{titles[name][0]}{name === 'control' && <span className="nav-dot" />}{name === 'audit' && <span id="audit-count" className="nav-count">{state?.events.length || 0}</span>}</button>)}</nav>
    </aside>
    <div className="shell">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong id="page-label">{titles[view][0]}</strong></div><div className="top-actions"><label className="identity-label"><span className="avatar" aria-hidden="true">◉</span><select id="identity" aria-label="Demo session identity" disabled={busy || !state} value={state?.identity.role === 'finance' ? 'finance' : 'operator'} onChange={e => mutate('session', { role: e.target.value })}><option value="operator">Demo operator</option><option value="finance">Aisha · Finance reviewer</option></select></label></div></header>
      <main>
        <div className="page-heading"><div><h1 id="page-title">{titles[view][1]}</h1></div><div className="heading-actions"><button disabled={busy || !state} className="button secondary" id="reset" onClick={() => dialog.current.showModal()}>↺ Reset demo</button><a className="button secondary" href="/api/export" download>↓ Export evidence</a></div></div>
        {error && <div role="alert" className="disclosure">{error} <button className="button secondary" onClick={() => refresh().catch(e => setError(e.message))}>Reconnect</button></div>}
        {!state && !error && <Empty symbol="◇" title="Connecting to the local gate">Loading source records, policies and audit evidence…</Empty>}
        <section className="metrics" aria-label="Live demo metrics" id="metrics">{metrics.map(([label, value, note, icon]) => <div className="metric" key={label}><span className="metric-icon">{icon}</span><div className="metric-label">{label}</div><div className="metric-value">{String(value).padStart(2, '0')}</div>{note && <div className="metric-foot">{note}</div>}</div>)}</section>
        {state && <>
          <section id="control-view" hidden={view !== 'control'}>
            <div className="section-heading"><h2>Scenarios</h2></div>
            <div className="scenario-grid" id="scenarios">{state.scenarios.filter(s => s.category === 'core').map((s, i) => <button key={s.id} disabled={busy} className={`scenario-card ${selected === s.id ? 'selected' : ''}`} data-scenario={s.id} aria-pressed={selected === s.id} onClick={() => chooseScenario(s.id)}><div className="scenario-top"><span className="scenario-number">0{i + 1}</span><span className="scenario-mark">{selected === s.id ? '◉' : '○'}</span></div><strong>{s.short}</strong><small>{['Allow & verify', 'Block before execution', 'Hold → approve → execute', 'Untrusted instructions'][i]}</small></button>)}</div>
            <div className="extra-row"><label htmlFor="extra-scenario">Explore edge cases</label><select id="extra-scenario" disabled={busy} value={scenario.category === 'extra' ? selected : ''} onChange={e => chooseScenario(e.target.value)}><option value="">Select an extra scenario…</option>{state.scenarios.filter(s => s.category === 'extra').map(s => <option key={s.id} value={s.id}>{s.short}</option>)}</select></div>
            <section className="transaction-panel">
              <div className="transaction-heading"><div><div className="eyebrow" id="scenario-label">SCENARIO {String(state.scenarios.indexOf(scenario) + 1).padStart(2, '0')}</div><h2 id="scenario-title">{scenario.short}</h2></div><button id="run" disabled={busy} className="button primary" onClick={() => mutate('run', { scenario: selected })}><span>▶</span> {tx ? 'Run again' : 'Run scenario'}</button></div>
              <Flow tx={tx} />
            </section>
            <div className="detail-grid">
              <section className="panel evidence-panel"><div className="panel-heading"><h2>Transaction evidence</h2>{tx && <span id="transaction-ref" className="mono muted">{tx.id}</span>}</div><div id="evidence"><Evidence tx={tx} /></div></section>
              <section className="panel decision-panel"><div className="panel-heading"><h2>Gate decision</h2><span className="policy-tag">P2P-1.0</span></div><div id="decision" aria-live="polite"><Decision tx={tx} identity={state.identity} busy={busy} onAction={action => action === 'reviewer' ? mutate('session', { role: 'finance' }) : mutate(action, { id: activeId })} /></div></section>
            </div>
            <section className="panel timeline-panel"><div className="panel-heading"><h2>Execution trace</h2>{tx && <span id="trace-id" className="mono muted">TRACE {tx.traceId.slice(0, 18)}…</span>}</div><div id="timeline"><Timeline tx={tx} events={state.events} /></div></section>
          </section>
          <section id="audit-view" hidden={view !== 'audit'}><Audit state={state} filter={state.transactions.some(tx => tx.id === filter) ? filter : 'all'} onFilter={setFilter} /></section>
        </>}
        <section id="policy-view" hidden={view !== 'policy'}>
          <div className="policy-intro"><p>These server-side rules execute on every proposal and retry. Human approval cannot override failed business checks.</p></div>
          <div className="policy-grid" id="policy-content">{policies.map(([title, body], i) => <article className="policy-card" key={title}><span className="number">RULE {String(i + 1).padStart(2, '0')} / P2P-1.0</span><h3>{title}</h3><p>{body}</p></article>)}</div>
          <div className="panel architecture"><h2>The enforced path</h2><p>Scenario agents → structured intent → trusted mock records → deterministic policy → approval if required → protected mock tool → read-back verification</p><p className="muted">The mock tool has no direct HTTP route. In production, connector credentials, authentication and network controls must enforce the same boundary.</p></div>
        </section>
      </main>
    </div>
    <div className="toast" id="toast" role="status" hidden={!notice}>{notice}</div>
    <dialog id="reset-dialog" ref={dialog}><div className="dialog-icon">↺</div><h2>Start a clean recording?</h2><p>This clears the demo transactions, mock payment requests and audit events. Export evidence first if you want to keep it.</p><div className="dialog-actions"><button className="button secondary" id="cancel-reset" onClick={() => dialog.current.close()}>Keep current demo</button><button className="button primary" id="confirm-reset" disabled={busy} onClick={() => { dialog.current.close(); mutate('reset'); }}>Reset demo</button></div></dialog>
  </>;
}
