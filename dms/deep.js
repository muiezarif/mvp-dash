/* Dash DMS — deepening layer:
   SLA policy and state, order trace, intervention cases, dispatch diagnostics,
   operational settlement, capacity planning. Registers screens + window.ACT actions. */
window.SCREENS = window.SCREENS || {};
window.STATE = window.STATE || {};
window.ACT = window.ACT || {};

window.DEEP = (function () {
  const U = () => window.UI, D = () => window.DMS;
  const NOW = 15 * 60 + 48;
  const mn = t => { const p = String(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
  const hm = v => { const x = ((v % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
  const dur = m => m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min';
  const OPERATOR = 'Sara Al Fahad';
  const DONE = ['Delivered', 'Cancelled', 'Returned'];

  /* ---------------- SLA policy ---------------- */
  const POLICY = {
    pickup: 15, delivery: 45, atRisk: 35, late: 45, schedWindow: 30, schedTol: 10,
    overrides: [
      { scope: 'Merchant', name: 'Tamra Pharmacy', pickup: 10, delivery: 35,
        why: 'Chilled medicine — shorter promise written into the contract' },
      { scope: 'Zone', name: 'RYD-W — Al Sahafah', pickup: 20, delivery: 60,
        why: 'Thin coverage while the zone is being built out' },
      { scope: 'Service type', name: 'Scheduled', pickup: 15, delivery: 45,
        why: 'Measured against the slot, not creation — ±10 min tolerance' }
    ]
  };

  function effective(o) {
    const d = D(), m = d.merchant(o.merchant), z = d.zone(o.zone);
    let p = { pickup: POLICY.pickup, delivery: POLICY.delivery, atRisk: POLICY.atRisk, src: 'Account default' };
    const zo = POLICY.overrides.find(x => x.scope === 'Zone' && x.name.startsWith(z.code));
    if (zo) p = { pickup: zo.pickup, delivery: zo.delivery, atRisk: Math.round(zo.delivery * 0.78), src: 'Zone override · ' + z.code };
    const mo = POLICY.overrides.find(x => x.scope === 'Merchant' && m && x.name === m.name);
    if (mo) p = { pickup: mo.pickup, delivery: mo.delivery, atRisk: Math.round(mo.delivery * 0.78), src: 'Merchant override · ' + m.name };
    return p;
  }

  /* SLA state for one order — first-class, sits beside the delivery status */
  function sla(o) {
    const p = effective(o);
    const created = mn(o.created);
    const scheduled = o.type === 'Scheduled';
    const promisedPickup = hm(created + p.pickup);
    const promisedDelivery = scheduled ? o.eta : hm(created + p.delivery);
    const end = scheduled ? mn(o.eta) + p.schedTol : created + p.delivery;
    const closed = DONE.includes(o.status);
    const closeEvent = closed ? (o.log[o.log.length - 1] || { t: o.created }) : null;
    const at = closed ? mn(closeEvent.t) : NOW;
    const age = Math.max(0, at - created);
    const over = at - end;
    let state;
    if (o.status === 'Cancelled') state = '—';
    else if (closed) state = over > 0 ? 'Late' : 'On time';
    else if (over > 0 || o.late) state = 'Late';
    else if (age >= p.atRisk || o.stuck) state = 'At risk';
    else state = 'On time';
    return { p, state, age, over, promisedPickup, promisedDelivery, src: p.src, scheduled,
      left: Math.max(0, end - NOW) };
  }
  const SC = { 'On time': '#1f8a4c', 'At risk': '#FFCC99', 'Late': '#FCA38B', '—': '#c9c9c9' };
  const slaTag = s => `<span class="sla s-${s.replace(/[^a-z]/gi, '').toLowerCase()}">${s}</span>`;
  const slaOf = id => sla(D().order(id));

  /* ---------------- offers and assignment history ---------------- */
  const SEED = {
    'DX-40921': { offers: [], assigns: [],
      notes: [{ t: '15:41', k: 'system', title: 'No candidate inside the 3 km radius', sub: 'Three drivers in RYD-N, all on a job — nothing offered yet' }] },
    'DX-40911': { offers: [
      { t: '15:44', d: 'd1', out: 'Timed out', sub: 'No response in 45 s · 1.8 km away' },
      { t: '15:45', d: 'd3', out: 'Rejected', sub: 'Driver declined — “too far, on another drop”' },
      { t: '15:46', d: 'd9', out: 'Open', sub: 'Waiting for a response · 42 s elapsed' }], assigns: [] },
    'DX-40918': { offers: [
      { t: '15:12', d: 'd5', out: 'Timed out', sub: 'No response in 45 s' },
      { t: '15:13', d: 'd2', out: 'Accepted', sub: 'Accepted in 12 s' }], assigns: [] },
    'DX-40890': { offers: [{ t: '14:52', d: 'd7', out: 'Accepted', sub: 'Accepted in 9 s' }],
      assigns: [{ t: '15:38', from: 'd7', to: 'd1', actor: 'Mishal (Dispatcher)', why: 'Driver reported a vehicle problem' }] },
    'DX-40907': { offers: [], assigns: [],
      notes: [{ t: '14:58', k: 'system', title: 'Held for scheduled assignment', sub: 'Offers start at 18:10, twenty minutes before the 18:30 slot' }] },
    'DX-40866': { offers: [{ t: '12:45', d: 'd7', out: 'Accepted', sub: 'Accepted in 20 s' }], assigns: [] }
  };

  function seed() {
    const d = D();
    d.ORDERS.forEach(o => {
      if (o.offers) return;
      const s = SEED[o.id];
      if (s) { o.offers = s.offers; o.assigns = s.assigns; o.notes = s.notes || []; return; }
      const asg = o.log.find(l => /^Assigned to/.test(l.e));
      o.offers = asg && o.driver ? [{ t: asg.t, d: o.driver, out: 'Accepted', sub: /Auto/.test(asg.s || '') ? 'Auto assigned · accepted' : 'Manual assignment' }] : [];
      o.assigns = []; o.notes = [];
    });
  }

  /* ---------------- intervention cases ---------------- */
  let CASES = [];
  let seq = 3140;
  const CASE_SEV = { High: '#FCA38B', Medium: '#FFCC99', Low: '#FFEE50' };

  function newCase(c) {
    const x = Object.assign({ id: 'IC-' + (++seq), state: 'Open', owner: null, action: null,
      resolution: null, resolvedAt: null, via: 'Control tower', sev: 'Medium' }, c);
    CASES.unshift(x);
    return x;
  }

  function seedCases() {
    if (CASES.length) return;
    const d = D();
    d.ORDERS.forEach(o => {
      if (DONE.includes(o.status)) return;
      const s = sla(o), dr = o.driver ? d.driver(o.driver) : null;
      if (dr && !dr.online)
        newCase({ type: 'Driver offline', reason: dr.name + ' went offline mid-order', sev: 'High', order: o.id, driver: dr.id, created: '15:40' });
      if (s.state === 'Late')
        newCase({ type: 'SLA breach', reason: 'Delivery promise ' + s.promisedDelivery + ' missed by ' + dur(Math.max(1, s.over)), sev: 'High', order: o.id, driver: o.driver, created: hm(NOW - Math.max(1, s.over)) });
      if (o.stuck)
        newCase({ type: 'No movement', reason: 'No status update for ' + o.stuck + ' min at ' + o.status.toLowerCase(), sev: 'Medium', order: o.id, driver: o.driver, created: hm(NOW - o.stuck) });
      if (o.offers && o.offers.some(x => x.out === 'Timed out' || x.out === 'Rejected') && !o.driver)
        newCase({ type: 'Assignment failing', reason: o.offers.filter(x => x.out !== 'Open').length + ' offers refused or timed out — order still unassigned', sev: 'High', order: o.id, created: o.created });
      if (!o.driver && !o.offers.length && o.type === 'On demand')
        newCase({ type: 'No supply', reason: 'No eligible driver inside the radius since ' + o.created, sev: 'High', order: o.id, created: o.created });
    });
    /* reported from the driver app — the loop closes here */
    newCase({ type: 'Merchant delay', reason: 'Order not ready — waiting 12 min at the counter', sev: 'Medium',
      order: 'DX-40902', driver: 'd9', created: '15:39', via: 'Driver app · Nawaf Al Ghamdi' });
    newCase({ type: 'Wrong address', reason: 'Customer changed location by phone — new pin is 2.4 km out of zone', sev: 'Medium',
      order: 'DX-40915', driver: 'd6', created: '15:31', via: 'Driver app · Turki Al Dosari' });
    const r = newCase({ type: 'Customer unavailable', reason: 'Three call attempts, no answer at the gate', sev: 'Medium',
      order: 'DX-40881', driver: 'd5', created: '14:44', via: 'Driver app · Ahmed Salem' });
    r.state = 'Resolved'; r.owner = 'Mishal (Dispatcher)'; r.action = 'Called the customer from the office and got the gate opened';
    r.resolution = 'Delivered on the same attempt'; r.resolvedAt = '14:52';
  }

  const casesFor = id => CASES.filter(c => c.order === id);
  const openCases = () => CASES.filter(c => c.state !== 'Resolved');

  /* ---------------- order trace ---------------- */
  function trace(o) {
    const d = D(), ev = [];
    o.log.forEach(l => ev.push({ t: l.t, k: /Fail|Cancel|Return/i.test(l.e) ? 'bad' : 'status', title: l.e, sub: l.s }));
    (o.offers || []).forEach(x => ev.push({ t: x.t, k: x.out === 'Accepted' ? 'ok' : x.out === 'Open' ? 'wait' : 'bad',
      title: 'Offered to ' + d.driver(x.d).name + (x.out === 'Open' ? '' : ' — ' + x.out.toLowerCase()), sub: x.sub }));
    (o.assigns || []).forEach(x => ev.push({ t: x.t, k: 'act',
      title: 'Reassigned ' + d.driver(x.from).name + ' → ' + d.driver(x.to).name,
      sub: x.why + ' · ' + x.actor }));
    (o.notes || []).forEach(x => ev.push({ t: x.t, k: x.k, title: x.title, sub: x.sub }));
    casesFor(o.id).forEach(c => {
      ev.push({ t: c.created, k: 'case', title: c.type + ' raised · ' + c.id, sub: c.reason + ' · ' + c.via });
      if (c.state === 'Acknowledged') ev.push({ t: c.ackAt || c.created, k: 'act', title: c.id + ' acknowledged', sub: 'Owned by ' + c.owner });
      if (c.state === 'Resolved') ev.push({ t: c.resolvedAt, k: 'ok', title: c.id + ' resolved', sub: c.resolution + ' · ' + (c.owner || OPERATOR) });
    });
    const s = sla(o);
    ev.push({ t: s.promisedDelivery, k: 'promise', title: 'Delivery promised', sub: s.src + ' · ' + s.p.delivery + ' min from creation' });
    ev.sort((a, b) => mn(a.t) - mn(b.t));
    return ev;
  }

  function traceHTML(o, opt) {
    opt = opt || {};
    const ev = trace(o).filter(e => !(opt.hideInternals && (e.k === 'act' || e.title.startsWith('Offered'))));
    const s = sla(o), out = [];
    let prev = null;
    ev.forEach(e => {
      if (prev != null && mn(e.t) - prev >= 8 && e.k !== 'promise')
        out.push('<div class="tlgap"><span>' + dur(mn(e.t) - prev) + ' with no movement</span></div>');
      prev = Math.max(prev == null ? 0 : prev, mn(e.t));
      out.push('<div class="tli k-' + e.k + '"><span class="tli-t">' + e.t + '</span>' +
        '<span class="tli-b"><b>' + U().esc(e.title) + '</b>' + (e.sub ? '<em>' + U().esc(e.sub) + '</em>' : '') + '</span></div>');
    });
    if (!DONE.includes(o.status))
      out.push('<div class="tli k-live"><span class="tli-t">' + hm(NOW) + '</span><span class="tli-b"><b>Now — ' +
        o.status.toLowerCase() + ' for ' + dur(s.age) + '</b><em>' + (s.state === 'Late' ? dur(s.over) + ' past the promise' :
        s.state === 'At risk' ? dur(s.left) + ' left before it breaches' : dur(s.left) + ' of the promise left') + '</em></span></div>');
    return '<div class="tl">' + out.join('') + '</div>';
  }

  /* ---------------- dispatch diagnostics ---------------- */
  function candidates(o) {
    const d = D();
    return d.DRIVERS.map(x => {
      const km = +(1.1 + ((x.id.charCodeAt(1) * 7 + o.id.charCodeAt(5) * 3) % 62) / 10).toFixed(1);
      const inZone = x.zone === o.zone;
      const live = d.ORDERS.filter(z => z.driver === x.id && !DONE.includes(z.status)).length;
      const gps = x.online ? (x.id === 'd7' ? 11 : x.id === 'd8' ? 6 : 1) : 34;
      let verdict = 'Eligible', why = 'In ' + d.zone(x.zone).code + ' · ' + km + ' km · ' + live + ' live task' + (live === 1 ? '' : 's');
      if (!x.online) { verdict = 'Excluded'; why = 'Offline — last seen ' + x.app.lastSeen; }
      else if (x.status === 'Break') { verdict = 'Excluded'; why = 'On break inside shift ' + d.SHIFTS.find(s => s.id === x.shift).window; }
      else if (!inZone && (STATE.assign && STATE.assign.geofenceStrict !== false)) { verdict = 'Excluded'; why = 'Outside the geofence — sits in ' + d.zone(x.zone).code + ', order is ' + d.zone(o.zone).code; }
      else if (km > (STATE.assign ? STATE.assign.radius : 3)) { verdict = 'Excluded'; why = km + ' km away — radius is ' + (STATE.assign ? STATE.assign.radius : 3) + ' km'; }
      else if (live >= (STATE.assign ? STATE.assign.capacity : 3)) { verdict = 'Excluded'; why = 'At capacity — ' + live + ' live tasks, cap is ' + (STATE.assign ? STATE.assign.capacity : 3); }
      else if (gps > 5) { verdict = 'Excluded'; why = 'GPS is ' + gps + ' min stale — position cannot be trusted'; }
      else if (o.items && /kg/.test(o.items) && parseFloat(o.items.split('· ')[1]) > 10 && d.vehicle(x.vehicle).type === 'Motorcycle') { verdict = 'Excluded'; why = 'Motorcycle — order is ' + o.items.split('· ')[1] + ', needs a car or van'; }
      const offer = (o.offers || []).find(f => f.d === x.id);
      if (offer) { verdict = offer.out === 'Accepted' ? 'Selected' : 'Offered · ' + offer.out; why = offer.sub; }
      return { x, km, verdict, why, gps, live };
    }).sort((a, b) => ({ Selected: 0, Eligible: 1 }[a.verdict] ?? 2) - ({ Selected: 0, Eligible: 1 }[b.verdict] ?? 2) || a.km - b.km);
  }

  function diagHTML(o) {
    const d = D(), c = candidates(o);
    const elig = c.filter(x => x.verdict === 'Eligible' || x.verdict === 'Selected');
    const head = o.driver
      ? U().note('Why ' + d.driver(o.driver).name, 'Closest eligible driver inside ' + d.zone(o.zone).code + ' at the time of assignment, under capacity, GPS fresh.', '#1f8a4c')
      : U().note('Why it has not assigned', elig.length ? elig.length + ' driver' + (elig.length === 1 ? '' : 's') + ' eligible; offers are out and unanswered.' :
        'No eligible driver. Every candidate failed at least one check below — most on geofence and radius.', '#FCA38B');
    return head + '<div class="cands diag">' + c.map(k =>
      '<div class="cand d-' + k.verdict.split(' ')[0].toLowerCase() + '">' +
        '<span class="cand-n">' + (k.verdict === 'Selected' ? '✓' : k.verdict === 'Eligible' ? '·' : '×') + '</span>' +
        '<div><b>' + U().esc(k.x.name) + '</b><em>' + U().esc(k.why) + '</em></div>' +
        '<span class="cand-v">' + k.verdict + '</span></div>').join('') + '</div>' +
      U().defs([['Checks applied', 'Zone geofence · vehicle type · shift and availability · live capacity · GPS freshness'],
        ['Radius', (STATE.assign ? STATE.assign.radius : 3) + ' km'],
        ['Capacity cap', (STATE.assign ? STATE.assign.capacity : 3) + ' live tasks per driver'],
        ['Rule in force', (STATE.assign ? STATE.assign.rule : 'Nearest driver')]]);
  }

  /* ---------------- settlement ---------------- */
  const ADJ = {
    'DX-40918': [{ t: 'Late delivery credit', a: -4.4, why: 'SLA breach — 14 min past promise', by: 'Bader Al Otaibi (Finance)' }],
    'DX-40866': [{ t: 'Return leg', a: 8.0, why: 'Returned to merchant after a failed attempt', by: 'System' }],
    'DX-40890': [{ t: 'Waiting time', a: 6.0, why: '17 min held at the delivery point', by: 'Mishal (Dispatcher)' }]
  };

  function settle(o) {
    const d = D(), z = d.zone(o.zone);
    const km = +(2.2 + ((o.id.charCodeAt(4) * 5) % 58) / 10).toFixed(1);
    const base = 14, rate = 1.2;
    const gross = o.price || +(base + km * rate).toFixed(2);
    const adj = (ADJ[o.id] || []).reduce((s, x) => s + x.a, 0);
    const supply = o.source === 'Direct' ? 'Own fleet' : o.source === 'Marketplace' ? '3PL — Sanad Logistics' : 'Dash Network supply';
    const driverPay = supply === 'Own fleet' && o.driver ? (d.driver(o.driver).contract.model === 'Per order' ? 9.5 : 0) : 0;
    const tplPay = supply === 'Own fleet' ? 0 : +(gross * 0.72).toFixed(2);
    let state = 'Unsettled';
    if (['DX-40881', 'DX-40874'].includes(o.id)) state = 'Ready';
    if (['DX-40852'].includes(o.id)) state = 'Settled';
    if (o.id === 'DX-40918') state = 'Disputed';
    if (!DONE.includes(o.status)) state = 'Unsettled';
    return { km, base, rate, gross, adj, adjustments: ADJ[o.id] || [], receivable: +(gross + adj).toFixed(2),
      driverPay, tplPay, supply, cod: o.cod || 0,
      codState: o.cod ? (o.status === 'Delivered' ? 'Collected · handed over' : o.driver ? 'With driver' : 'Not collected') : 'Cash free',
      state, dispute: o.id === 'DX-40918' ? 'Open — merchant contests the late credit' : '—',
      period: DONE.includes(o.status) ? 'SP-2026-W35' : 'SP-2026-W36' };
  }

  const PERIODS = [
    { id: 'SP-2026-W36', label: '1 – 7 Sep 2026', state: 'Unsettled', orders: 268, receivable: 6142.8, driverPay: 2318, tplPay: 964, cod: 1780, closes: '7 Sep 23:59' },
    { id: 'SP-2026-W35', label: '25 – 31 Aug 2026', state: 'Ready', orders: 412, receivable: 8940.5, driverPay: 3560, tplPay: 1210, cod: 2140, closes: 'Closed 31 Aug' },
    { id: 'SP-2026-W34', label: '18 – 24 Aug 2026', state: 'Disputed', orders: 388, receivable: 8214.0, driverPay: 3312, tplPay: 1104, cod: 1962, closes: 'Closed 24 Aug' },
    { id: 'SP-2026-W33', label: '11 – 17 Aug 2026', state: 'Settled', orders: 366, receivable: 7712.4, driverPay: 3120, tplPay: 988, cod: 1844, closes: 'Paid 20 Aug' }
  ];
  const SETTLE_STATE = { Unsettled: '#FFEE50', Ready: '#C0D2FF', Settled: '#1f8a4c', Disputed: '#FCA38B' };
  const FINAUDIT = [
    { t: 'Today 15:12', u: 'Bader Al Otaibi (Finance)', a: 'Added adjustment', o: 'DX-40918 · Late delivery credit −SAR 4.40' },
    { t: 'Today 09:40', u: 'System', a: 'Closed settlement period', o: 'SP-2026-W35 · moved to Ready' },
    { t: 'Yesterday 22:02', u: 'Mishal (Dispatcher)', a: 'Recorded COD handover', o: 'Bandar Al Otaibi · SAR 780' },
    { t: '30 Aug 11:18', u: 'Bader Al Otaibi (Finance)', a: 'Opened dispute', o: 'SP-2026-W34 · Almasa Foods' }
  ];

  /* ---------------- capacity ---------------- */
  const HOURS = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
  const CAP = [
    { z: 'RYD-N', name: 'Al Malqa', demand: [22, 28, 34, 41, 36, 24], sched: [2, 3, 6, 4, 2, 1], planned: [4, 4, 5, 5, 4, 3] },
    { z: 'RYD-E', name: 'Al Malaz', demand: [16, 19, 24, 28, 22, 14], sched: [1, 1, 3, 2, 1, 0], planned: [3, 3, 3, 3, 3, 2] },
    { z: 'RYD-C', name: 'Olaya', demand: [26, 32, 38, 44, 40, 30], sched: [3, 4, 5, 6, 4, 2], planned: [5, 5, 6, 6, 5, 4] },
    { z: 'RYD-W', name: 'Al Sahafah', demand: [9, 12, 15, 18, 14, 9], sched: [0, 1, 2, 2, 1, 0], planned: [1, 1, 1, 1, 1, 1] },
    { z: 'RYD-S', name: 'Al Yasmin', demand: [14, 17, 21, 25, 20, 13], sched: [1, 2, 3, 3, 2, 1], planned: [3, 3, 3, 2, 2, 2] }
  ];
  const PER_DRIVER = 8; /* deliveries per driver per hour of capacity */
  const req = n => Math.ceil(n / PER_DRIVER);

  /* ---------------- integration health ---------------- */
  const CONNS = [
    { n: 'Kanz Market', k: 'Shopify connector', s: 'Connected', last: '40 s ago', err: null, fails: 0, ref: 'KZ-88214', hook: '200 OK · 84 ms' },
    { n: 'Almasa Foods', k: 'REST API', s: 'Error', last: 'Today 13:22', err: '401 Unauthorized — key rotated on their side', fails: 14, ref: 'ALM-4471', hook: 'Retrying · 4 attempts' },
    { n: 'Chopped', k: 'REST API', s: 'Connected', last: '3 min ago', err: 'Yesterday · 422 missing customer phone', fails: 1, ref: 'CH-90233', hook: '200 OK · 141 ms' },
    { n: 'Tamra Pharmacy', k: 'Zid connector', s: 'Connected', last: '11 min ago', err: null, fails: 0, ref: 'TM-1109', hook: '200 OK · 96 ms' },
    { n: 'Shawarmer', k: 'Manual entry', s: 'Not connected', last: '—', err: null, fails: 0, ref: '—', hook: '—' }
  ];

  return { NOW, POLICY, sla, slaOf, slaTag, SC, seed, seedCases, CASES: () => CASES, newCase, casesFor, openCases,
    CASE_SEV, trace, traceHTML, candidates, diagHTML, settle, PERIODS, SETTLE_STATE, FINAUDIT,
    HOURS, CAP, req, PER_DRIVER, CONNS, mn, hm, dur, OPERATOR, DONE, effective };
})();

/* ================= screens ================= */
(function () {
  const U = UI, D = () => window.DMS, X = () => window.DEEP;
  X().seed(); X().seedCases();
  STATE.settle = STATE.settle || { state: 'All states', period: 'SP-2026-W35' };
  STATE.cap = STATE.cap || { day: 'Tomorrow · Thu 4 Sep', shift: 'All shifts' };
  STATE.caseFilter = STATE.caseFilter || 'Open';

  const fg = (l, c) => '<span class="f-g"><span class="f-l">' + l + '</span>' + c + '</span>';

  /* ---------------- SLA and service policy ---------------- */
  SCREENS['sla'] = {
    title: 'SLA and service policy', epic: 'Epic 17 · SLA',
    render() {
      const d = D(), P = X().POLICY;
      const live = d.ORDERS.filter(o => !X().DONE.includes(o.status));
      const byState = s => live.filter(o => X().sla(o).state === s).length;
      return U.page('SLA and service policy',
        'One definition of late for the whole account, with a short list of named exceptions',
        U.btn('Save policy', { kind: 'primary', act: 'savePolicy' }) +
        U.btn('Add an exception', { act: 'addOverride' })) + `
        <div class="kpis">
          ${U.kpi('On time', byState('On time'), 'Inside the promise', '#1f8a4c')}
          ${U.kpi('At risk', byState('At risk'), 'Past the at-risk threshold', d.PAL.peach)}
          ${U.kpi('Late', byState('Late'), 'Promise already missed', d.PAL.tang)}
          ${U.kpi('Breach rate today', '4.1%', '18 of 441 orders', d.PAL.lav)}
        </div>
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Account policy', `
              <div class="grid2">
                ${U.field('Pickup SLA', U.input(P.pickup + ' min'), 'Measured from order creation to picked up')}
                ${U.field('Delivery SLA', U.input(P.delivery + ' min'), 'Measured from order creation to delivered')}
                ${U.field('At-risk threshold', U.input(P.atRisk + ' min'), 'When an order starts showing as At risk')}
                ${U.field('Late threshold', U.input(P.late + ' min'), 'When the promise counts as breached')}
                ${U.field('Scheduled delivery window', U.input(P.schedWindow + ' min'), 'The slot length offered to merchants')}
                ${U.field('Scheduled tolerance', U.input('± ' + P.schedTol + ' min'), 'Grace either side of the slot before it breaches')}
              </div>
              ${U.note('This is the definition, not a rule builder.', 'Three numbers decide every SLA state in the product: pickup, delivery, and when at-risk starts. Everything else is an exception with a name.', d.PAL.lemon)}`)}
            ${U.panel('Named exceptions', U.table(
              [{ t: 'Applies to' }, { t: 'Name' }, { t: 'Pickup', num: true }, { t: 'Delivery', num: true }, { t: 'Why it exists' }, { t: '', w: '90px' }],
              P.overrides.map(o => ({ cells: [U.tag(o.scope, d.PAL.lav), '<b>' + U.esc(o.name) + '</b>',
                o.pickup + ' min', o.delivery + ' min', '<em class="sub">' + U.esc(o.why) + '</em>',
                '<div class="rowact">' + U.btn('Remove', { act: 'stub', arg: 'Exception removed' }) + '</div>'] }))),
              { pad: false, right: '<span class="ph-note">Variation by merchant, branch, service type or zone — only where operations require it</span>' })}
            ${U.panel('Live orders against the policy', U.table(
              [{ t: 'Order' }, { t: 'Merchant' }, { t: 'Zone' }, { t: 'Promised pickup' }, { t: 'Promised delivery' }, { t: 'Ageing' }, { t: 'SLA state' }, { t: 'Policy applied' }],
              live.map(o => { const s = X().sla(o); return { act: 'trace', arg: o.id, cells: [
                '<b>' + o.id + '</b>', U.esc(d.merchant(o.merchant).name), d.zone(o.zone).code,
                s.promisedPickup, s.promisedDelivery, X().dur(s.age), X().slaTag(s.state),
                '<em class="sub">' + s.src + '</em>'] }; })), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Where the SLA state shows up', U.defs([
              ['Control tower', 'A filter, and a colour on every order row and card'],
              ['Order trace', 'The promise sits in the timeline with the breach measured against it'],
              ['Needs intervention', 'A breach opens an SLA case with an owner'],
              ['Merchant', 'Read only — promised times and the state, never the thresholds'],
              ['Reports', 'SLA performance and breach reports read this policy']]))}
            ${U.panel('Breach reasons this week', `<div class="blist">
              ${[['Assignment delay', 41], ['Merchant not ready', 28], ['Traffic and distance', 17], ['Failed first attempt', 9], ['Customer unavailable', 5]]
                .map(([k, v]) => '<div class="bl"><span>' + k + '</span>' + U.bar(v, d.PAL.tang) + '<b>' + v + '%</b></div>').join('')}
            </div>`, { pad: false })}
            ${U.panel('Change history', U.table([{ t: 'When' }, { t: 'Change' }],
              [['20 Aug', 'Delivery SLA 50 → 45 min'], ['12 Aug', 'RYD-W exception added at 60 min'], ['2 Aug', 'Policy created at signup']]
                .map(r => ({ cells: [r[0], U.esc(r[1])] }))), { pad: false })}
          </div>
        </div>`;
    }
  };

  /* ---------------- Operational settlement ---------------- */
  SCREENS['settlement'] = {
    title: 'Operational settlement', epic: 'Epic 23 · Settlement',
    render() {
      const d = D(), f = STATE.settle;
      const recs = d.ORDERS.map(o => ({ o, s: X().settle(o) }));
      const states = ['Unsettled', 'Ready', 'Settled', 'Disputed'];
      const shown = recs.filter(r => f.state === 'All states' || r.s.state === f.state);
      const sum = st => recs.filter(r => r.s.state === st).reduce((a, r) => a + r.s.receivable, 0);

      const stateCards = '<div class="scards">' + states.map(st => {
        const n = recs.filter(r => r.s.state === st).length;
        return '<button type="button" class="scard ' + (f.state === st ? 'on' : '') + '" data-act="setState" data-arg="' + st + '" style="--sc:' + X().SETTLE_STATE[st] + '">' +
          '<span class="scard-s">' + st + '</span><span class="scard-v">' + U.money(sum(st)) + '</span>' +
          '<span class="scard-f">' + n + ' order' + (n === 1 ? '' : 's') + ' · ' +
          ({ Unsettled: 'still accruing this period', Ready: 'closed and waiting for payment', Settled: 'paid and reconciled', Disputed: 'held until the dispute closes' }[st]) + '</span></button>';
      }).join('') + '</div>';

      return U.page('Operational settlement',
        'One financial record per order. Merchant receivable, driver and supply payable, COD — every product reads these numbers',
        U.btn('Close current period', { kind: 'primary', act: 'closePeriod' }) +
        U.btn('Export statements', { act: 'export', arg: 'settlement statements' })) +
        stateCards +
        U.filters([
          fg('State', U.select(['All states'].concat(states), f.state, { act: 'setF', arg: 'state' })),
          fg('Period', U.select(X().PERIODS.map(p => p.id + ' · ' + p.label), f.period + ' · ' + (X().PERIODS.find(p => p.id === f.period) || {}).label, { act: 'setF', arg: 'period' })),
          '<span class="f-sp"></span><span class="f-c">' + shown.length + ' orders shown</span>',
          f.state !== 'All states' ? U.btn('Show all states', { act: 'setState', arg: 'All states' }) : ''
        ]) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Per-order records', U.table(
              [{ t: 'Order' }, { t: 'Merchant' }, { t: 'Supply' }, { t: 'Rate applied', num: true }, { t: 'Adjust', num: true },
               { t: 'Receivable', num: true }, { t: 'Driver pay', num: true }, { t: '3PL pay', num: true }, { t: 'COD', num: true }, { t: 'State' }],
              shown.map(r => ({ act: 'settleOrder', arg: r.o.id, cells: [
                '<b>' + r.o.id + '</b>', U.esc(d.merchant(r.o.merchant).name),
                '<em class="sub">' + r.s.supply + '</em>',
                U.money(r.s.gross) + '<em class="sub"> · ' + r.s.km + ' km</em>',
                r.s.adj ? '<b style="color:' + (r.s.adj < 0 ? '#b0432a' : '#1f8a4c') + '">' + (r.s.adj < 0 ? '−' : '+') + U.money(Math.abs(r.s.adj)) + '</b>' : '—',
                '<b>' + U.money(r.s.receivable) + '</b>',
                r.s.driverPay ? U.money(r.s.driverPay) : '—',
                r.s.tplPay ? U.money(r.s.tplPay) : '—',
                r.s.cod ? U.money(r.s.cod) : '—',
                U.tag(r.s.state, X().SETTLE_STATE[r.s.state], { solid: r.s.state !== 'Settled' })] }))), { pad: false })}
            ${U.panel('Settlement periods', U.table(
              [{ t: 'Cycle' }, { t: 'Range' }, { t: 'Orders', num: true }, { t: 'Receivable', num: true }, { t: 'Driver pay', num: true },
               { t: '3PL pay', num: true }, { t: 'COD', num: true }, { t: 'State' }, { t: '', w: '190px' }],
              X().PERIODS.map(p => ({ cells: [
                '<b>' + p.id + '</b>', p.label, p.orders, U.money(p.receivable), U.money(p.driverPay), U.money(p.tplPay), U.money(p.cod),
                U.tag(p.state, X().SETTLE_STATE[p.state], { solid: p.state !== 'Settled' }),
                '<div class="rowact">' + U.btn('Statement', { act: 'statement', arg: p.id }) +
                  U.btn('Export', { act: 'export', arg: p.id + ' statement' }) + '</div>'] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Which way the money runs', U.defs([
              ['Orders your fleet carried', 'Dash pays you — the rate applied less the 8% commission on Network work — whether the order came from one of your own merchants or from the Network.'],
              ['Overflow you pushed out', 'You pay Dash. Sending an order into the Network makes you the customer for that delivery, on the Network rate card.'],
              ['Your merchant contracts', 'Priced between you and the merchant. Dash takes a platform fee and nothing else.'],
              ['On the statement', 'The two directions net against each other before money moves.']]))}
            ${U.panel('COD reconciliation', `${U.defs([
              ['Collected today', U.money(1284)],
              ['Handed over', U.money(780)],
              ['With drivers', U.money(504)],
              ['Oldest holding', 'Bandar Al Otaibi · 2 days']])}
              <div class="sub-h">Drivers holding cash</div>
              ${U.table([{ t: 'Driver' }, { t: 'Holding', num: true }, { t: '', w: '110px' }],
                d.DRIVERS.filter(x => x.wallet.cod > 0).map(x => ({ cells: [U.esc(x.name), U.money(x.wallet.cod),
                  '<div class="rowact">' + U.btn('Handover', { act: 'handover', arg: x.id }) + '</div>'] })))}`, { pad: false })}
            ${U.panel('Disputes', `<div class="mlist">
              ${recs.filter(r => r.s.state === 'Disputed').map(r =>
                '<button type="button" class="ml warn" data-act="settleOrder" data-arg="' + r.o.id + '">' +
                '<span class="ml-h"><b>' + r.o.id + '</b>' + U.tag('Disputed', d.PAL.tang, { solid: true }) + '</span>' +
                '<span class="ml-s">' + U.esc(r.s.dispute) + '</span></button>').join('') ||
                '<div class="empty">No open disputes.</div>'}
            </div>`, { pad: false })}
            ${U.panel('Audit trail', `<div class="log">${X().FINAUDIT.map(a =>
              '<div class="lg"><span class="lg-t">' + a.t + '</span><span class="lg-e"><b>' + U.esc(a.a) + '</b><em>' + U.esc(a.o) + ' · ' + U.esc(a.u) + '</em></span></div>').join('')}</div>`, { pad: false })}
          </div>
        </div>`;
    }
  };

  /* ---------------- Capacity planning ---------------- */
  SCREENS['capacity'] = {
    title: 'Capacity planning', epic: 'Epic 08 · Capacity',
    render() {
      const d = D(), H = X().HOURS, C = X().CAP;
      const gap = (r, i) => r.planned[i] - X().req(r.demand[i]);
      const worst = C.flatMap(r => H.map((h, i) => ({ z: r.z, name: r.name, h, g: gap(r, i), need: X().req(r.demand[i]), planned: r.planned[i] })))
        .filter(x => x.g < 0).sort((a, b) => a.g - b.g);
      const totalShort = worst.reduce((s, x) => s + Math.abs(x.g), 0);

      const grid = '<div class="cap"><div class="cap-r cap-h"><span class="cap-z">Zone</span>' +
        H.map(h => '<span>' + h + '</span>').join('') + '</div>' +
        C.map(r => '<div class="cap-r"><span class="cap-z"><b>' + r.z + '</b><em>' + r.name + '</em></span>' +
          H.map((h, i) => { const g = gap(r, i);
            return '<span class="cap-c ' + (g < 0 ? 'short' : g > 1 ? 'over' : 'ok') + '">' +
              '<b>' + (g === 0 ? 'Even' : (g > 0 ? '+' : '') + g) + '</b>' +
              '<em>' + r.demand[i] + ' orders · need ' + X().req(r.demand[i]) + ' · ' + r.planned[i] + ' planned</em></span>'; }).join('') +
        '</div>').join('') + '</div>';

      return U.page('Capacity planning',
        'What capacity tomorrow needs — demand, planned supply, and the gap between them. The control tower handles today',
        U.btn('Publish shift plan', { kind: 'primary', act: 'stub', arg: 'Shift plan published to the roster' }) +
        U.btn('Export plan', { act: 'export', arg: 'capacity plan' })) + `
        ${totalShort ? U.note(totalShort + ' driver-hours short tomorrow evening.',
          'Worst: ' + worst.slice(0, 3).map(x => Math.abs(x.g) + ' short in ' + x.z + ' at ' + x.h).join(' · ') + '. Fix it today, not at 19:00 tomorrow.', d.PAL.tang)
          : U.note('Supply covers demand.', 'No shortage in any zone or hour on this plan.', '#1f8a4c')}
        ${U.filters([
          fg('Day', U.select(['Today · Wed 3 Sep', 'Tomorrow · Thu 4 Sep', 'Fri 5 Sep', 'Sat 6 Sep'], STATE.cap.day, { act: 'capF', arg: 'day' })),
          fg('Shift', U.select(['All shifts'].concat(d.SHIFTS.map(s => s.name + ' · ' + s.window)), STATE.cap.shift, { act: 'capF', arg: 'shift' })),
          fg('City', U.select(['Riyadh'], 'Riyadh')),
          '<span class="f-sp"></span><span class="f-c">' + (totalShort ? totalShort + ' driver-hours short' : 'Covered') + '</span>'
        ])}
        ${U.panel('Gap by zone and hour', grid, { pad: false,
          right: '<span class="ph-note">Green covered · amber tight · red short. One driver clears ' + X().PER_DRIVER + ' deliveries an hour</span>' })}
        <div class="cols c-1-1">
          ${U.panel('Shortages to fix', U.table(
            [{ t: 'When' }, { t: 'Zone' }, { t: 'Need', num: true }, { t: 'Planned', num: true }, { t: 'Short', num: true }, { t: '', w: '200px' }],
            worst.slice(0, 8).map(x => ({ cells: [x.h, '<b>' + x.z + '</b> <em class="sub">' + x.name + '</em>', x.need, x.planned,
              '<b style="color:#b0432a">' + Math.abs(x.g) + '</b>',
              '<div class="rowact">' + U.btn('Extend shift', { act: 'stub', arg: 'Shift extension offered to the group' }) +
                U.btn('Open to network', { act: 'stub', arg: 'Capacity request sent to Dash Network' }) + '</div>'] }))), { pad: false })}
          <div class="stack">
            ${U.panel('Demand tomorrow', `${U.defs([
              ['Expected orders', '1,046 across five zones'],
              ['Already scheduled', '61 committed slots'],
              ['Peak hour', '19:00 — 156 orders'],
              ['Basis', 'Scheduled orders plus the last four Thursdays']])}
              <div class="sub-h">Expected by hour</div>
              ${U.spark(H.map((h, i) => C.reduce((s, r) => s + r.demand[i], 0)), d.PAL.lav, 44)}
              ${U.note('No forecasting engine here.', 'Scheduled orders, historical demand and the published roster are enough to see a gap a day out.', d.PAL.lemon)}`)}
            ${U.panel('Planned supply', U.table(
              [{ t: 'Shift' }, { t: 'Window' }, { t: 'Planned', num: true }, { t: 'Committed', num: true }, { t: 'Available', num: true }],
              d.SHIFTS.map(s => ({ cells: [U.esc(s.name), s.window, s.drivers.length,
                Math.max(0, s.drivers.length - 1), 1] }))
                .concat([{ cells: ['<b>Dash Network</b>', 'On request', 6, 2, 4] },
                         { cells: ['<b>3PL pool</b>', 'Contracted', 9, 3, 6] }])), { pad: false })}
          </div>
        </div>`;
    }
  };
})();

/* ================= actions ================= */
(function () {
  const U = UI, D = () => window.DMS, X = () => window.DEEP;
  const R = () => window.RENDER();
  const NOWS = () => X().hm(X().NOW);

  Object.assign(window.ACT, {
    /* order trace — the single deep view of one order */
    trace: id => {
      const d = D(), o = d.order(id), s = X().sla(o), st = X().settle(o), dr = o.driver ? d.driver(o.driver) : null;
      const cs = X().casesFor(id);
      U.drawer('<b>' + id + '</b> — order trace', [
        '<div class="dw-meta">' + U.esc(d.merchant(o.merchant).name) + ' · ' + U.esc(o.branch) + ' → ' + U.esc(d.customer(o.customer).addr) + '</div>',
        '<div class="slahead">' + X().slaTag(s.state) + U.statusTag(o.status) +
          '<span class="slahead-m">Ageing ' + X().dur(s.age) + ' · promised ' + s.promisedDelivery +
          (s.state === 'Late' ? ' · ' + X().dur(s.over) + ' over' : '') + '</span></div>',
        U.defs([
          ['Merchant and branch', U.esc(d.merchant(o.merchant).name) + ' · ' + U.esc(o.branch)],
          ['Driver and fleet', dr ? U.esc(dr.name) + ' · ' + d.GROUPS.find(g => g.id === dr.group).name : '<em class="warn">Not assigned</em>'],
          ['Source', o.source + ' · ' + o.type],
          ['Location freshness', dr ? (dr.online ? 'Updated 1 min ago · ' + dr.pos[0].toFixed(4) + ', ' + dr.pos[1].toFixed(4) : '<em class="warn">Driver offline — last fix 34 min ago</em>') : 'No driver reporting'],
          ['Promised pickup', s.promisedPickup + ' <em class="sub">· ' + s.src + '</em>'],
          ['Settlement', U.money(st.receivable) + ' receivable · ' + st.state + (st.cod ? ' · COD ' + U.money(st.cod) : '')],
          ['Cases', cs.length ? cs.map(c => '<a href="#" data-act="caseOpen" data-arg="' + c.id + '">' + c.id + '</a> ' + c.state).join(' · ') : 'None raised']
        ]),
        '<div class="sub-h">Lifecycle</div>',
        X().traceHTML(o),
        '<div class="sub-h">Offer attempts</div>',
        (o.offers || []).length ? '<div class="offers">' + o.offers.map((f, i) =>
          '<div class="of o-' + f.out.toLowerCase().replace(/\s/g, '') + '"><span class="of-n">' + (i + 1) + '</span>' +
          '<div><b>' + U.esc(d.driver(f.d).name) + '</b><em>' + U.esc(f.sub) + '</em></div>' +
          '<span class="of-o">' + f.out + '</span><span class="of-t">' + f.t + '</span></div>').join('') + '</div>'
          : U.note('No offer has gone out.', 'The router found no eligible driver — open the dispatch diagnostics to see which check each candidate failed.', D().PAL.peach),
        (o.assigns || []).length ? '<div class="sub-h">Assignment changes</div>' + U.table(
          [{ t: 'Time' }, { t: 'From' }, { t: 'To' }, { t: 'Actor' }, { t: 'Reason' }],
          o.assigns.map(a => ({ cells: [a.t, U.esc(d.driver(a.from).name), U.esc(d.driver(a.to).name), U.esc(a.actor), U.esc(a.why)] }))) : ''
      ].join(''), { footer:
        U.btn('Dispatch diagnostics', { kind: 'primary', act: 'diag', arg: id }) +
        (o.source === 'Direct' || o.source === 'Dash Network' ? U.btn(o.driver ? 'Reassign' : 'Assign driver', { act: 'assign', arg: id }) : '') +
        U.btn('Raise a case', { act: 'caseNew', arg: id }) +
        U.btn('Settlement', { act: 'settleOrder', arg: id }) +
        U.btn('Open order', { act: 'go', arg: '/orders/' + id }) });
    },

    diag: id => {
      const o = D().order(id);
      U.drawer('Dispatch diagnostics — <b>' + id + '</b>', X().diagHTML(o),
        { footer: U.btn('Back to trace', { kind: 'primary', act: 'trace', arg: id }) +
          U.btn('Assignment rules', { act: 'go', arg: '/assignment' }) });
    },

    /* intervention cases */
    caseOpen: cid => {
      const c = X().CASES().find(k => k.id === cid), o = D().order(c.order);
      U.drawer('<b>' + c.id + '</b> — ' + c.type, [
        '<div class="dw-meta">' + U.esc(c.reason) + '</div>',
        U.defs([
          ['State', U.tag(c.state, c.state === 'Resolved' ? '#1f8a4c' : c.state === 'Acknowledged' ? D().PAL.lav : D().PAL.lemon, { solid: c.state !== 'Resolved' })],
          ['Severity', U.tag(c.sev, X().CASE_SEV[c.sev], { solid: true })],
          ['Owner', c.owner ? U.esc(c.owner) : '<em class="warn">Unclaimed — anyone could be working this</em>'],
          ['Order', '<a href="#" data-act="trace" data-arg="' + c.order + '">' + c.order + '</a>' + (o ? ' · ' + U.statusTag(o.status) : '')],
          ['Driver', c.driver ? U.esc(D().driver(c.driver).name) : '—'],
          ['Raised', c.created + ' · ' + U.esc(c.via)],
          ['Action taken', c.action ? U.esc(c.action) : '—'],
          ['Resolution', c.resolution ? U.esc(c.resolution) + ' · ' + c.resolvedAt : '—']
        ]),
        o ? '<div class="sub-h">Where it sits in the order</div>' + X().traceHTML(o) : ''
      ].join(''), { footer:
        (c.state === 'Open' ? U.btn('Acknowledge — claim this', { kind: 'primary', act: 'caseAck', arg: c.id }) : '') +
        (c.state !== 'Resolved' ? U.btn('Resolve', { kind: c.state === 'Acknowledged' ? 'primary' : '', act: 'caseResolve', arg: c.id }) : '') +
        (o ? U.btn('Order trace', { act: 'trace', arg: c.order }) : '') +
        (c.driver ? U.btn('Chat driver', { act: 'chat', arg: c.driver }) : '') });
    },
    caseAck: cid => {
      const c = X().CASES().find(k => k.id === cid);
      c.state = 'Acknowledged'; c.owner = X().OPERATOR; c.ackAt = NOWS();
      c.action = 'Claimed by ' + X().OPERATOR;
      const o = D().order(c.order);
      if (o) o.log.push({ t: NOWS(), e: c.id + ' acknowledged', s: X().OPERATOR + ' owns this case' });
      D().AUDIT.unshift({ t: NOWS(), u: X().OPERATOR, r: 'Admin', a: 'Acknowledged case', o: c.id + ' · ' + c.order, ip: '188.55.x.x' });
      U.toast(c.id + ' is yours — ' + c.type.toLowerCase()); R();
      const dw = document.getElementById('drawer');
      if (dw && dw.classList.contains('open')) window.ACT.caseOpen(cid);
    },
    caseResolve: cid => {
      const c = X().CASES().find(k => k.id === cid);
      const opts = { 'SLA breach': ['Customer informed, delivery continued', 'Credit applied to the merchant', 'Reassigned and delivered'],
        'Driver offline': ['Reassigned to another driver', 'Driver came back online', 'Order cancelled'],
        'No movement': ['Driver contacted — moving again', 'Reassigned', 'Failed and returned'],
        'Assignment failing': ['Assigned manually', 'Sent to Dash Network', 'Cancelled with the merchant'],
        'No supply': ['Sent to Dash Network', 'Shift extended in the zone', 'Cancelled with the merchant'],
        'Merchant delay': ['Merchant confirmed ready — driver collected', 'Promise reset with the merchant', 'Order cancelled'],
        'Wrong address': ['New address confirmed and pushed to the driver', 'Delivered to the original address', 'Failed — customer to rebook'],
        'Customer unavailable': ['Reached the customer, delivered', 'Reattempt scheduled', 'Returned to merchant'] }[c.type]
        || ['Handled', 'No action needed', 'Escalated to Dash'];
      U.drawer('Resolve <b>' + c.id + '</b>', '<div class="dw-meta">' + U.esc(c.reason) + '</div><div class="cands">' +
        opts.map(x => '<button type="button" class="cand pick" data-act="doResolve" data-arg="' + c.id + '|' + x + '">' +
          '<span class="cand-n">·</span><div><b>' + x + '</b></div></button>').join('') + '</div>');
    },
    doResolve: arg => {
      const [cid, choice] = arg.split('|'), c = X().CASES().find(k => k.id === cid);
      c.state = 'Resolved'; c.owner = c.owner || X().OPERATOR; c.resolution = choice; c.resolvedAt = NOWS();
      c.action = c.action || 'Handled from the control tower';
      const o = D().order(c.order);
      if (o) o.log.push({ t: NOWS(), e: c.id + ' resolved', s: choice + ' · ' + c.owner });
      D().AUDIT.unshift({ t: NOWS(), u: X().OPERATOR, r: 'Admin', a: 'Resolved case', o: c.id + ' · ' + choice, ip: '188.55.x.x' });
      U.closeDrawer(); U.toast(cid + ' resolved — ' + choice.toLowerCase()); R();
    },
    caseNew: id => {
      const types = ['SLA breach', 'No movement', 'Driver offline', 'Merchant delay', 'Wrong address', 'Order or item issue', 'COD or payment issue'];
      U.drawer('Raise a case — <b>' + id + '</b>', '<div class="dw-meta">A case has an owner and a resolution. An alert does not.</div><div class="cands">' +
        types.map(t => '<button type="button" class="cand pick" data-act="doCaseNew" data-arg="' + id + '|' + t + '">' +
          '<span class="cand-n">·</span><div><b>' + t + '</b></div></button>').join('') + '</div>');
    },
    doCaseNew: arg => {
      const [id, type] = arg.split('|');
      const c = X().newCase({ type, reason: 'Raised by the dispatcher from the order trace', sev: 'Medium',
        order: id, driver: (D().order(id) || {}).driver || null, created: NOWS(), via: 'Control tower · ' + X().OPERATOR });
      c.state = 'Acknowledged'; c.owner = X().OPERATOR; c.ackAt = NOWS();
      U.closeDrawer(); U.toast(c.id + ' opened and assigned to you'); R();
    },
    caseTab: t => { STATE.caseFilter = t; R(); },

    /* settlement */
    setF: (a, el) => { STATE.settle[a] = a === 'period' ? el.value.split(' · ')[0] : el.value; R(); },
    setState: s => { STATE.settle.state = s; R(); },
    settleOrder: id => {
      const d = D(), o = d.order(id), s = X().settle(o);
      U.drawer('Settlement — <b>' + id + '</b>', [
        '<div class="dw-meta">' + U.esc(d.merchant(o.merchant).name) + ' · ' + s.supply + ' · period ' + s.period + '</div>',
        '<div class="slahead">' + U.tag(s.state, X().SETTLE_STATE[s.state], { solid: s.state !== 'Settled' }) +
          '<span class="slahead-m">Every product shows these same numbers</span></div>',
        U.defs([
          ['Rate applied', U.money(s.base) + ' base + ' + s.km + ' km × ' + U.money(s.rate) + ' = <b>' + U.money(s.gross) + '</b>'],
          ['Merchant receivable', '<b>' + U.money(s.receivable) + '</b>'],
          ['Driver payable', s.driverPay ? U.money(s.driverPay) : '—'],
          ['3PL or supply payable', s.tplPay ? U.money(s.tplPay) + ' · ' + s.supply : '—'],
          ['COD', s.cod ? U.money(s.cod) + ' · ' + s.codState : 'Cash free'],
          ['Dispute', U.esc(s.dispute)]
        ]),
        '<div class="sub-h">Adjustments</div>',
        s.adjustments.length ? U.table([{ t: 'Adjustment' }, { t: 'Amount', num: true }, { t: 'Reason' }, { t: 'Actor' }],
          s.adjustments.map(a => ({ cells: ['<b>' + U.esc(a.t) + '</b>',
            '<b style="color:' + (a.a < 0 ? '#b0432a' : '#1f8a4c') + '">' + (a.a < 0 ? '−' : '+') + U.money(Math.abs(a.a)) + '</b>',
            U.esc(a.why), U.esc(a.by)] })))
          : '<div class="empty">No adjustments on this order.</div>'
      ].join(''), { footer:
        U.btn('Add adjustment', { kind: 'primary', act: 'stub', arg: 'Adjustment needs a reason and is written to the audit trail' }) +
        (s.state === 'Disputed' ? U.btn('Close dispute', { act: 'stub', arg: 'Dispute closed — order moves to Ready' }) : U.btn('Open dispute', { act: 'stub', arg: 'Dispute opened — order held out of settlement' })) +
        U.btn('Order trace', { act: 'trace', arg: id }) });
    },
    statement: pid => {
      const p = X().PERIODS.find(x => x.id === pid);
      U.drawer('Statement — <b>' + p.id + '</b>', [
        '<div class="dw-meta">' + p.label + ' · ' + p.closes + '</div>',
        U.defs([['State', U.tag(p.state, X().SETTLE_STATE[p.state], { solid: p.state !== 'Settled' })],
          ['Orders', p.orders], ['Merchant receivable', '<b>' + U.money(p.receivable) + '</b>'],
          ['Driver payable', U.money(p.driverPay)], ['3PL payable', U.money(p.tplPay)],
          ['COD handled', U.money(p.cod)],
          ['Net to Rehla Fleet', '<b>' + U.money(+(p.receivable - p.driverPay - p.tplPay).toFixed(2)) + '</b>']])
      ].join(''), { footer: U.btn('Download statement', { kind: 'primary', act: 'export', arg: p.id + ' statement' }) +
        (p.state === 'Ready' ? U.btn('Mark settled', { act: 'stub', arg: p.id + ' marked settled' }) : '') });
    },
    closePeriod: () => U.toast('SP-2026-W36 closed — moves to Ready once COD is reconciled'),
    savePolicy: () => U.toast('SLA policy saved — new orders are measured against it immediately'),
    addOverride: () => U.drawer('Add an exception', `
      <div class="dw-meta">Only where operations require it. Every exception needs a reason someone can read later.</div>
      ${U.field('Applies to', U.select(['Merchant', 'Branch', 'Service type', 'Zone'], 'Merchant'))}
      ${U.field('Name', U.select(D().MERCHANTS.map(m => m.name), D().MERCHANTS[0].name))}
      ${U.field('Pickup SLA', U.input('15 min'))}
      ${U.field('Delivery SLA', U.input('45 min'))}
      ${U.field('Why it exists', U.input('', 'Chilled goods — shorter promise in the contract'))}`,
      { footer: U.btn('Add exception', { kind: 'primary', act: 'stub', arg: 'Exception added to the policy' }) }),
    capF: (a, el) => { STATE.cap[a] = el.value; R(); }
  });
})();
