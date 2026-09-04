/* Dash Admin — deepening layer: platform SLA policy, order trace with dispatch
   diagnostics, intervention cases, platform settlement, integration health.
   The intervention boundary holds throughout: Dash acts only on Dash Network orders. */
window.SCREENS = window.SCREENS || {};
window.STATE = window.STATE || {};
window.ACT = window.ACT || {};

window.XDEEP = (function () {
  const D = () => window.ADM;
  const NOW = 15 * 60 + 48;
  const mn = t => { const p = String(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
  const hm = v => { const x = ((v % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
  const dur = m => m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min';
  const DONE = ['Delivered', 'Cancelled', 'Returned'];
  const OPERATOR = 'Dana Al Rasheed';

  /* platform default — the number every account inherits unless it sets its own */
  const POLICY = {
    pickup: 15, delivery: 45, atRisk: 35, late: 45, schedWindow: 30, schedTol: 10,
    reviewed: '20 Aug 2026', owner: 'Dash platform operations',
    overrides: [
      { scope: 'Client', name: 'Tamra Pharmacy', pickup: 10, delivery: 35, why: 'Chilled medicine — written into their contract', by: 'Dana Al Rasheed · 27 Feb 2026' },
      { scope: 'Zone', name: 'Zone West', pickup: 20, delivery: 60, why: 'Thin coverage while Dash builds supply there', by: 'Dana Al Rasheed · 12 Aug 2026' },
      { scope: 'Service type', name: 'Scheduled', pickup: 15, delivery: 45, why: 'Measured against the slot with ±10 min tolerance', by: 'Platform default' },
      { scope: 'Product', name: 'Freelancer App', pickup: 20, delivery: 50, why: 'On-demand supply with no fleet behind it — a wider promise is honest', by: 'Dana Al Rasheed · 3 Jun 2026' }
    ]
  };

  function effective(o) {
    const mo = POLICY.overrides.find(x => x.scope === 'Client' && x.name === o.merchant);
    if (mo) return { pickup: mo.pickup, delivery: mo.delivery, atRisk: Math.round(mo.delivery * .78), src: 'Client override · ' + o.merchant };
    const zo = POLICY.overrides.find(x => x.scope === 'Zone' && x.name === o.zone);
    if (zo) return { pickup: zo.pickup, delivery: zo.delivery, atRisk: Math.round(zo.delivery * .78), src: 'Zone override · ' + o.zone };
    const po = POLICY.overrides.find(x => x.scope === 'Product' && x.name === o.product);
    if (po) return { pickup: po.pickup, delivery: po.delivery, atRisk: Math.round(po.delivery * .78), src: 'Product override · ' + o.product };
    return { pickup: POLICY.pickup, delivery: POLICY.delivery, atRisk: POLICY.atRisk, src: 'Platform default' };
  }

  function sla(o) {
    const p = effective(o), created = mn(o.created), scheduled = o.type === 'Scheduled';
    const promisedPickup = hm(created + p.pickup);
    const promisedDelivery = scheduled && o.eta !== '—' ? o.eta : hm(created + p.delivery);
    const end = scheduled && o.eta !== '—' ? mn(o.eta) + POLICY.schedTol : created + p.delivery;
    const closed = DONE.includes(o.status);
    const at = closed ? mn((o.log[o.log.length - 1] || { t: o.created }).t) : NOW;
    const age = o.stuck > 300 ? o.stuck : Math.max(0, at - created), over = at - end;
    let state;
    if (o.status === 'Cancelled') state = '—';
    else if (closed) state = over > 0 ? 'Late' : 'On time';
    else if (over > 0 || o.late || o.stuck > 60) state = 'Late';
    else if (age >= p.atRisk || o.stuck) state = 'At risk';
    else state = 'On time';
    return { p, state, age, over: Math.max(over, o.stuck > 60 ? o.stuck - p.delivery : over),
      promisedPickup, promisedDelivery, src: p.src, left: Math.max(0, end - NOW) };
  }
  const slaTag = s => '<span class="sla s-' + s.replace(/[^a-z]/gi, '').toLowerCase() + '">' + s + '</span>';

  /* offer chains — for Dash Network orders these are the routing engine's own attempts */
  const OFFERS = {
    'DX-41094': [{ t: '15:46', who: 'Sahel Logistics', out: 'Open', sub: 'Decline window closes at 15:50 · 2 min 40 s left' }],
    'DX-40940': [{ t: '09:31', who: 'Sahel Logistics', out: 'Declined', sub: 'No van available' },
                 { t: '09:34', who: 'Rehla Fleet', out: 'Declined', sub: 'Outside their coverage in Zone East' },
                 { t: '09:41', who: 'Nuqta Express', out: 'Timed out', sub: 'No response — account suspended three hours later' },
                 { t: '09:52', who: 'Freelancer pool', out: 'Timed out', sub: 'No freelancer within 3 km accepted' },
                 { t: '10:12', who: 'Sahel Logistics', out: 'Returned', sub: 'Handed back to the originating provider — nobody took it' }],
    'DX-41108': [{ t: '15:37', who: 'Freelancer pool', out: 'Accepted', sub: 'Rakan Al Zahrani accepted in 14 s' }],
    'DX-41105': [{ t: '15:12', who: 'Rehla Fleet', out: 'Accepted', sub: 'Accepted in 8 s · driver Ahmed Salem' }],
    'DX-40907': [{ t: '14:58', who: 'Rehla Fleet', out: 'Accepted', sub: 'Held for scheduled assignment at 18:10' },
                 { t: '15:50', who: 'Rehla Fleet', out: 'Timed out', sub: 'Zone West paused by Rehla — no driver can be named' }],
    'DX-41102': [{ t: '15:48', who: 'Freelancer pool', out: 'Accepted', sub: 'Rakan Al Zahrani · SAR 24.50 to the driver' }]
  };
  const offersFor = id => OFFERS[id] || [];

  /* ---------------- intervention cases ---------------- */
  let CASES = [];
  let seq = 4200;
  const CASE_SEV = { High: '#FCA38B', Medium: '#FFCC99', Low: '#FFEE50' };

  function newCase(c) {
    const x = Object.assign({ id: 'IC-' + (++seq), state: 'Open', owner: null, action: null,
      resolution: null, resolvedAt: null, via: 'Global control tower', sev: 'Medium', scope: 'dash' }, c);
    CASES.unshift(x);
    return x;
  }

  function seedCases() {
    if (CASES.length) return;
    const d = D();
    d.ORDERS.forEach(o => {
      if (DONE.includes(o.status)) return;
      const s = sla(o), dash = o.scope === 'dash';
      if (o.offline)
        newCase({ type: 'Driver offline', reason: o.offline + ' has sent no location for 11 min mid-order', sev: 'High',
          order: o.id, client: o.merchant, scope: o.scope, created: '15:52' });
      if (o.noResponse)
        newCase({ type: 'Not accepted', reason: 'Offered to ' + o.provider + ' — the decline window closed with no answer', sev: 'High',
          order: o.id, client: o.merchant, scope: o.scope, created: o.created });
      if (o.failed)
        newCase({ type: 'Failed delivery', reason: 'Nobody answered at the door — a decision is needed on reattempt or return', sev: 'Medium',
          order: o.id, client: o.merchant, scope: o.scope, created: '15:44' });
      if (o.stuck > 30)
        newCase({ type: 'No movement', reason: dur(o.stuck) + ' with no status change at ' + o.status.toLowerCase(), sev: o.stuck > 120 ? 'High' : 'Medium',
          order: o.id, client: o.merchant, scope: o.scope, created: hm(NOW - o.stuck) });
      if (s.state === 'Late' && !o.stuck)
        newCase({ type: 'SLA breach', reason: 'Delivery promise ' + s.promisedDelivery + ' missed by ' + dur(Math.max(1, s.over)), sev: 'Medium',
          order: o.id, client: o.merchant, scope: o.scope, created: hm(NOW - Math.max(1, s.over)) });
    });
    /* reported from the Freelancer App — a freelancer has no fleet, so it lands here */
    newCase({ type: 'Merchant delay', reason: 'Order not ready — waiting 12 min at the counter', sev: 'Medium',
      order: 'DX-41102', client: 'Kanz Market', scope: 'dash', created: '15:52',
      via: 'Freelancer app · Rakan Al Zahrani' });
    const r = newCase({ type: 'Wrong address', reason: 'Customer moved the pin two blocks after collection', sev: 'Low',
      order: 'DX-41108', client: 'Chopped', scope: 'dash', created: '15:44',
      via: 'Freelancer app · Rakan Al Zahrani' });
    r.state = 'Resolved'; r.owner = 'Reem Al Harbi (Support)';
    r.action = 'Confirmed the new address with the customer and pushed it to the app';
    r.resolution = 'New address confirmed and the fare adjusted for 2.1 km'; r.resolvedAt = '15:47';
  }
  const casesFor = id => CASES.filter(c => c.order === id);

  /* ---------------- dispatch diagnostics — why the routing engine chose what it did ---------------- */
  function candidates(o) {
    const d = D();
    const nodes = d.NETWORK.supply.map(s => ({ name: s.name, cat: s.cat, accept: s.accept, complete: s.complete, state: s.state }));
    return nodes.map(n => {
      const km = +(1.2 + ((n.name.charCodeAt(0) * 5 + o.id.charCodeAt(5) * 3) % 74) / 10).toFixed(1);
      const offer = offersFor(o.id).find(f => f.who === n.name);
      let verdict = 'Eligible', why = n.cat + ' · ' + km + ' km to pickup · accepts ' + n.accept + '%, completes ' + n.complete + '%';
      if (n.state === 'Suspended') { verdict = 'Excluded'; why = 'Account suspended — cannot receive Network orders'; }
      else if (n.state === 'Not joined') { verdict = 'Excluded'; why = 'Has not joined the Network as supply'; }
      else if (o.zone === 'Zone West' && n.name === 'Sahel Logistics') { verdict = 'Excluded'; why = 'No coverage in Zone West'; }
      else if (o.zone === 'Zone West' && n.name === 'Rehla Fleet') { verdict = 'Excluded'; why = 'Zone West paused by Rehla Fleet at 15:12'; }
      else if (km > 8) { verdict = 'Excluded'; why = km + ' km to pickup — outside the 8 km routing radius'; }
      else if (n.accept < 70) { verdict = 'Excluded'; why = 'Acceptance rate ' + n.accept + '% — below the 70% routing floor'; }
      if (offer) { verdict = offer.out === 'Accepted' ? 'Selected' : 'Offered · ' + offer.out; why = offer.sub; }
      return { n, km, verdict, why };
    }).sort((a, b) => ({ Selected: 0, Eligible: 1 }[a.verdict] ?? 2) - ({ Selected: 0, Eligible: 1 }[b.verdict] ?? 2) || a.km - b.km);
  }

  function diagHTML(o) {
    const U = window.UI, d = D(), c = candidates(o), dash = o.scope === 'dash';
    if (!dash) return U.note('No diagnostics on this order.',
      'Dash did not route it. ' + U.esc(o.merchant) + ' chose ' + U.esc(o.provider === '—' ? 'their own provider' : o.provider) +
      ' and that provider decided which driver carried it. Dash holds the timeline, not the reasoning.', d.PAL.lav);
    const elig = c.filter(x => x.verdict === 'Eligible' || x.verdict === 'Selected');
    const head = offersFor(o.id).some(f => f.out === 'Accepted')
      ? U.note('Why ' + o.provider, 'Highest acceptance and completion among eligible nodes inside the radius at the time of routing.', '#1f8a4c')
      : U.note('Why it has not been carried', elig.length
        ? elig.length + ' node' + (elig.length === 1 ? '' : 's') + ' eligible; offers are out and unanswered.'
        : 'No eligible supply. Every node failed a check below — coverage and paused zones did most of the damage.', d.PAL.tang);
    return head + '<div class="cands diag">' + c.map(k =>
      '<div class="cand d-' + k.verdict.split(' ')[0].toLowerCase() + '">' +
        '<span class="cand-n">' + (k.verdict === 'Selected' ? '✓' : k.verdict === 'Eligible' ? '·' : '×') + '</span>' +
        '<div><b>' + U.esc(k.n.name) + '</b><em>' + U.esc(k.why) + '</em></div>' +
        '<span class="cand-v">' + k.verdict + '</span></div>').join('') + '</div>' +
      U.defs([['Checks applied', 'Network membership and state · zone coverage and pauses · distance to pickup · acceptance rate floor · completion rate'],
        ['Routing radius', '8 km to pickup'],
        ['Acceptance floor', '70% — below it a node stops receiving offers'],
        ['Rule in force', 'Best-performing eligible node, nearest first on a tie']]);
  }

  function trace(o) {
    const ev = [];
    o.log.forEach(l => ev.push({ t: l.t, k: /Fail|Declin|Return|Cancel|offline|No supply|paused/i.test(l.e) ? 'bad' : 'status', title: l.e, sub: l.s }));
    offersFor(o.id).forEach(x => ev.push({ t: x.t, k: x.out === 'Accepted' ? 'ok' : x.out === 'Open' ? 'wait' : 'bad',
      title: 'Offered to ' + x.who + (x.out === 'Open' ? '' : ' — ' + x.out.toLowerCase()), sub: x.sub }));
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

  function traceHTML(o) {
    const U = window.UI, out = [];
    let prev = null;
    trace(o).forEach(e => {
      if (prev != null && mn(e.t) - prev >= 8 && e.k !== 'promise')
        out.push('<div class="tlgap"><span>' + dur(mn(e.t) - prev) + ' with no movement</span></div>');
      prev = Math.max(prev == null ? 0 : prev, mn(e.t));
      out.push('<div class="tli k-' + e.k + '"><span class="tli-t">' + e.t + '</span><span class="tli-b"><b>' +
        U.esc(e.title) + '</b>' + (e.sub ? '<em>' + U.esc(e.sub) + '</em>' : '') + '</span></div>');
    });
    const s = sla(o);
    if (!DONE.includes(o.status))
      out.push('<div class="tli k-live"><span class="tli-t">' + hm(NOW) + '</span><span class="tli-b"><b>Now — ' +
        o.status.toLowerCase() + ' for ' + dur(s.age) + '</b><em>' +
        (s.state === 'Late' ? dur(Math.max(1, s.over)) + ' past the promise' : dur(s.left) + ' of the promise left') + '</em></span></div>');
    return '<div class="tl">' + out.join('') + '</div>';
  }

  /* ---------------- platform settlement ---------------- */
  const ADJ = {
    'DX-40998': [{ t: 'Return leg at 50%', a: -8.0, why: 'Failed delivery returned to Kanz Market — 3PL contests it', by: 'Dash · contract rule' }],
    'DX-41088': [{ t: 'Late delivery credit', a: -4.4, why: 'Promise of 16:09 missed by 12 min', by: 'System · SLA rule' }],
    'DX-40907': [{ t: 'No supply credit', a: -24.0, why: 'Dash Network could not carry it — the merchant is not charged', by: 'Dana Al Rasheed (Super Admin)' }]
  };

  function settle(o) {
    const d = D(), gross = o.value || 0;
    const network = o.source === 'Network';
    const commission = network ? +(gross * 0.08).toFixed(2) : 0;
    const platformFee = network ? commission : +(gross * 0.02).toFixed(2);
    const adjustments = ADJ[o.id] || [];
    const adj = adjustments.reduce((s, x) => s + x.a, 0);
    const supplyPay = gross ? +(gross - commission).toFixed(2) : 0;
    let state = DONE.includes(o.status) && gross ? 'Ready' : 'Unsettled';
    if (['DX-41055'].includes(o.id)) state = 'Settled';
    if (['DX-40998', 'DX-40907'].includes(o.id)) state = 'Disputed';
    if (!gross) state = '—';
    /* who pays whom. Sending work into the Network makes you a paying customer for that order,
       whoever you are; carrying it makes Dash owe you, whether the order came from a direct
       merchant or from another Network participant. */
    const carrier = o.provider === '—' ? null : o.provider;
    const legs = network
      ? [{ dir: 'in', party: o.merchant, amount: +(gross + adj).toFixed(2),
           why: 'Sent this order into Dash Network — Dash owns the delivery and bills them for it' }]
          .concat(carrier ? [{ dir: 'out', party: carrier, amount: supplyPay,
            why: 'Carried it for Dash — gross less the 8% commission' }] : [])
      : [{ dir: 'in', party: o.merchant, amount: platformFee,
           why: 'Platform fee only. The delivery is priced between them and their own provider' }];
    return { gross, commission, platformFee, supplyPay, adjustments, adj, legs,
      flow: network ? o.merchant + ' → Dash → ' + (carrier || 'no carrier yet')
        : o.merchant + ' ↔ ' + (carrier || 'their provider'),
      dirLabel: network ? 'Dash bills and pays' : 'Dash takes a fee',
      receivable: +(gross + adj).toFixed(2),
      owner: o.scope === 'dash' ? 'Dash — Network order' : o.merchant + ' ↔ ' + (o.provider === '—' ? 'their provider' : o.provider),
      priced: network ? 'Dash Network rate card' : o.source === 'Marketplace' ? 'Marketplace contract between the two parties' : 'Direct contract between the two parties',
      cod: o.cod || 0,
      codState: o.cod ? (o.status === 'Delivered' ? 'Collected · settled to the merchant' : 'With the driver') : 'Cash free',
      state, dispute: o.id === 'DX-40998' ? 'Open — Sahel Logistics contests the 50% return leg'
        : o.id === 'DX-40907' ? 'Open — Almasa Foods disputes any charge on an order nobody carried' : '—',
      period: DONE.includes(o.status) ? 'SP-2026-W35' : 'SP-2026-W36' };
  }

  const PERIODS = [
    { id: 'SP-2026-W36', label: '1 – 7 Sep 2026', state: 'Unsettled', orders: 8420, gross: 168400, commission: 8214, fees: 42600, payouts: 118600, cod: 38200, closes: 'Closes 7 Sep 23:59' },
    { id: 'SP-2026-W35', label: '25 – 31 Aug 2026', state: 'Ready', orders: 12680, gross: 253600, commission: 12380, fees: 42600, payouts: 178400, cod: 54800, closes: 'Payouts release Sunday 30 Aug' },
    { id: 'SP-2026-W34', label: '18 – 24 Aug 2026', state: 'Disputed', orders: 11940, gross: 238800, commission: 11640, fees: 42600, payouts: 168200, cod: 51200, closes: 'Held — two disputes open' },
    { id: 'SP-2026-W33', label: '11 – 17 Aug 2026', state: 'Settled', orders: 11210, gross: 224200, commission: 10940, fees: 41800, payouts: 158100, cod: 48600, closes: 'Paid 20 Aug' }
  ];
  const SETTLE_STATE = { Unsettled: '#FFEE50', Ready: '#C0D2FF', Settled: '#1f8a4c', Disputed: '#FCA38B', '—': '#c9c9c9' };
  const FINAUDIT = [
    { t: 'Today 15:12', u: 'Dana Al Rasheed (Super Admin)', a: 'Added adjustment', o: 'DX-40907 · No supply credit −SAR 24.00' },
    { t: 'Today 09:40', u: 'System', a: 'Closed settlement period', o: 'SP-2026-W35 · moved to Ready' },
    { t: 'Yesterday 18:22', u: 'Bader Al Otaibi (Finance)', a: 'Opened dispute', o: 'DX-40998 · Sahel Logistics return leg' },
    { t: '28 Aug 11:04', u: 'Bader Al Otaibi (Finance)', a: 'Released payouts', o: 'SP-2026-W33 · SAR 158,100 to 34 providers' }
  ];

  /* ---------------- integration health, per client ---------------- */
  const CONNS = [
    { c: 'Kanz Market', n: 'Kanz ERP', k: 'Client API key', s: 'Error', last: 'Today 13:22', err: 'Their key was rotated on their side and never given to Dash — 14 orders held', fails: 14, hook: 'Retrying · 4 attempts', ref: 'KZ-88214' },
    { c: 'Almasa Foods', n: 'Salla', k: 'Platform connector', s: 'Connected', last: '40 s ago', err: null, fails: 0, hook: '200 OK · 84 ms', ref: 'ALM-4471' },
    { c: 'Sahel Logistics', n: 'Sahel OMS v4', k: 'Client API key', s: 'Error', last: 'Today 15:22', err: 'Signing key mismatch — 26 status pushes rejected, so their live orders look stuck to Dash', fails: 26, hook: 'Rejected · 401', ref: 'SAHEL-77214' },
    { c: 'Rehla Fleet', n: 'Dash DMS native', k: 'First party', s: 'Connected', last: '12 s ago', err: null, fails: 0, hook: '200 OK · 38 ms', ref: '—' },
    { c: 'Chopped', n: 'Shopify', k: 'Platform connector', s: 'Connected', last: '3 min ago', err: 'Yesterday · 422 missing customer phone', fails: 1, hook: '200 OK · 141 ms', ref: 'CH-90233' },
    { c: 'Tamra Pharmacy', n: 'Zid', k: 'Platform connector', s: 'Connected', last: '11 min ago', err: null, fails: 0, hook: '200 OK · 96 ms', ref: 'TM-1109' },
    { c: 'Barq Riyadh', n: '—', k: 'Not integrated', s: 'Not connected', last: '—', err: null, fails: 0, hook: '—', ref: '—' }
  ];

  return { NOW, POLICY, sla, slaTag, offersFor, trace, traceHTML, candidates, diagHTML,
    CASES: () => CASES, newCase, casesFor, seedCases, CASE_SEV,
    settle, PERIODS, SETTLE_STATE, FINAUDIT, CONNS, mn, hm, dur, DONE, OPERATOR, effective };
})();

/* ================= screens ================= */
(function () {
  const U = UI, D = () => window.ADM, X = () => window.XDEEP;
  X().seedCases();
  STATE.settle = STATE.settle || { state: 'All states', period: 'SP-2026-W35' };
  STATE.caseFilter = STATE.caseFilter || 'Open';
  const fg = (l, c) => '<span class="f-g"><span class="f-l">' + l + '</span>' + c + '</span>';

  SCREENS['sla'] = {
    title: 'SLA and service policy', epic: 'Epic 16 · SLA',
    render() {
      const d = D(), P = X().POLICY;
      const live = d.ORDERS.filter(o => !X().DONE.includes(o.status));
      const n = s => live.filter(o => X().sla(o).state === s).length;
      return U.page('SLA and service policy',
        'The platform definition of late, and the short list of accounts and zones that vary from it',
        U.btn('Save policy', { kind: 'primary', act: 'savePolicy' }) +
        U.btn('Add an override', { act: 'addOverride' })) + `
        <div class="kpis k-4">
          ${U.kpi('On time', n('On time'), 'Inside the promise', '#1f8a4c')}
          ${U.kpi('At risk', n('At risk'), 'Past the at-risk threshold', d.PAL.peach)}
          ${U.kpi('Late', n('Late'), 'Promise already missed', d.PAL.tang)}
          ${U.kpi('Platform breach rate', '4.6%', 'Rolling 7 days · target under 5%', d.PAL.lav)}
        </div>
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Platform default', `
              <div class="grid2">
                ${U.field('Pickup SLA', U.input(P.pickup + ' min'), 'From order creation to picked up')}
                ${U.field('Delivery SLA', U.input(P.delivery + ' min'), 'From order creation to delivered')}
                ${U.field('At-risk threshold', U.input(P.atRisk + ' min'), 'When an order starts showing as At risk')}
                ${U.field('Late threshold', U.input(P.late + ' min'), 'When the promise counts as breached')}
                ${U.field('Scheduled window', U.input(P.schedWindow + ' min'), 'Slot length offered to merchants')}
                ${U.field('Scheduled tolerance', U.input('± ' + P.schedTol + ' min'), 'Grace either side of the slot')}
              </div>
              ${U.note('Every account inherits this.', 'A DMS client can tighten it for their own merchants, never loosen it past the platform floor. Owner: ' + U.esc(P.owner) + ' · last reviewed ' + P.reviewed + '.', d.PAL.lemon)}`)}
            ${U.panel('Overrides in force', U.table(
              [{ t: 'Applies to' }, { t: 'Name' }, { t: 'Pickup', num: true }, { t: 'Delivery', num: true }, { t: 'Why it exists' }, { t: 'Set by' }, { t: '', w: '90px' }],
              P.overrides.map(o => ({ cells: [U.tag(o.scope, d.PAL.lav), '<b>' + U.esc(o.name) + '</b>',
                o.pickup + ' min', o.delivery + ' min', '<em class="sub">' + U.esc(o.why) + '</em>', '<em class="sub">' + U.esc(o.by) + '</em>',
                '<div class="rowact">' + U.btn('Remove', { act: 'stub', arg: 'Override removed — the account falls back to the platform default' }) + '</div>'] }))),
              { pad: false, right: '<span class="ph-note">Four overrides across 195 accounts — this list should stay short</span>' })}
            ${U.panel('Live orders against the policy', U.table(
              [{ t: 'Order' }, { t: 'Client' }, { t: 'Product' }, { t: 'Zone' }, { t: 'Promised delivery' }, { t: 'Ageing' }, { t: 'State' }, { t: 'Policy applied' }, { t: 'Intervention' }],
              live.map(o => { const s = X().sla(o); return { act: 'xTrace', arg: o.id, cells: [
                '<b>' + o.id + '</b>', U.esc(o.merchant), '<em class="sub">' + U.esc(o.product) + '</em>', o.zone,
                s.promisedDelivery, X().dur(s.age), X().slaTag(s.state),
                '<em class="sub">' + s.src + '</em>', U.scope(o.scope)] }; })), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Breach rate by product', `<div class="blist">
              ${[['Freelancer App', 7.2], ['Dash 3PL', 5.4], ['Dash Merchant', 4.1], ['Dash DMS', 3.2]]
                .map(([k, v]) => '<div class="bl"><span>' + k + '</span>' + U.bar(v * 12, v > 5 ? d.PAL.tang : d.PAL.peach) + '<b>' + v + '%</b></div>').join('')}
            </div><div class="fld-h">The Freelancer App carries the widest promise and still breaches most — on-demand supply with no fleet behind it.</div>`, { pad: false })}
            ${U.panel('Where the state is enforced', U.defs([
              ['Global control tower', 'A filter, and a colour on every order'],
              ['Order trace', 'The promise sits in the timeline'],
              ['Cases', 'A breach on a Network order opens a case Dash owns'],
              ['Settlement', 'A breach credits the merchant automatically'],
              ['Client products', 'DMS, Merchant and 3PL all read this policy']]))}
            ${U.panel('Change history', U.table([{ t: 'When' }, { t: 'Change' }, { t: 'By' }],
              [['20 Aug', 'Platform delivery SLA 50 → 45 min', 'Dana Al Rasheed'],
               ['12 Aug', 'Zone West override added at 60 min', 'Dana Al Rasheed'],
               ['3 Jun', 'Freelancer App override added at 50 min', 'Dana Al Rasheed']]
                .map(r => ({ cells: [r[0], U.esc(r[1]), '<em class="sub">' + r[2] + '</em>'] }))), { pad: false })}
          </div>
        </div>`;
    }
  };

  SCREENS['settlement'] = {
    title: 'Platform settlement', epic: 'Epic 10 · Settlement',
    render() {
      const d = D(), f = STATE.settle, X_ = X();
      const recs = d.ORDERS.map(o => ({ o, s: X_.settle(o) })).filter(r => r.s.state !== '—');
      const states = ['Unsettled', 'Ready', 'Settled', 'Disputed'];
      const shown = recs.filter(r => f.state === 'All states' || r.s.state === f.state);
      const sum = st => recs.filter(r => r.s.state === st).reduce((a, r) => a + r.s.receivable, 0);
      const cards = '<div class="scards">' + states.map(st => {
        const n = recs.filter(r => r.s.state === st).length;
        return '<button type="button" class="scard ' + (f.state === st ? 'on' : '') + '" data-act="setState" data-arg="' + st + '" style="--sc:' + X_.SETTLE_STATE[st] + '">' +
          '<span class="scard-s">' + st + '</span><span class="scard-v">' + U.money(sum(st)) + '</span>' +
          '<span class="scard-f">' + n + ' order' + (n === 1 ? '' : 's') + ' · ' +
          ({ Unsettled: 'still accruing this period', Ready: 'closed and waiting for payout', Settled: 'paid and reconciled', Disputed: 'held until the dispute closes' }[st]) + '</span></button>';
      }).join('') + '</div>';

      return U.page('Platform settlement',
        'One financial record per order, whoever owns it. Merchant receivable, supply payable, commission, COD',
        U.btn('Close current period', { kind: 'primary', act: 'closePeriod' }) +
        U.btn('Release payouts', { act: 'go', arg: '/payouts' }) +
        U.btn('Export statements', { act: 'export', arg: 'platform settlement statements' })) +
        U.note('Dash holds the record even where Dash cannot intervene.', 'A Direct or Marketplace order is priced by the two parties, not by Dash — but the record lives here, which is why both sides see the same numbers and a dispute is about the record rather than whose spreadsheet is right.', d.PAL.lav) +
        U.note('Sending work in makes you a customer. Carrying it makes Dash owe you.', 'A DMS or 3PL client that pushes overflow into the Network buys that delivery from Dash on the same terms as a merchant. A client that carries an order for the Network is paid by Dash — gross less commission — whether the order came from a direct merchant or from another participant. The same account can sit on both sides of one period.', d.PAL.lemon) +
        cards +
        U.filters([
          fg('State', U.select(['All states'].concat(states), f.state, { act: 'setF', arg: 'state' })),
          fg('Period', U.select(X_.PERIODS.map(p => p.id + ' · ' + p.label), f.period + ' · ' + (X_.PERIODS.find(p => p.id === f.period) || {}).label, { act: 'setF', arg: 'period' })),
          '<span class="f-sp"></span><span class="f-c">' + shown.length + ' orders shown</span>',
          f.state !== 'All states' ? U.btn('Show all states', { act: 'setState', arg: 'All states' }) : ''
        ]) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Per-order records', U.table(
              [{ t: 'Order' }, { t: 'Client' }, { t: 'Priced by' }, { t: 'Direction' }, { t: 'Gross', num: true }, { t: 'Dash take', num: true },
               { t: 'Supply payable', num: true }, { t: 'Adjustments', num: true }, { t: 'Receivable', num: true }, { t: 'COD', num: true }, { t: 'State' }],
              shown.map(r => ({ act: 'xSettle', arg: r.o.id, cells: [
                '<b>' + r.o.id + '</b>', U.esc(r.o.merchant),
                '<em class="sub">' + U.esc(r.s.priced) + '</em>',
                U.esc(r.s.flow) + '<em class="sub">' + r.s.dirLabel + '</em>',
                U.money(r.s.gross),
                r.s.commission ? U.money(r.s.commission) + '<em class="sub"> · 8%</em>' : U.money(r.s.platformFee) + '<em class="sub"> · fee</em>',
                r.s.supplyPay ? U.money(r.s.supplyPay) : '—',
                r.s.adj ? '<b style="color:' + (r.s.adj < 0 ? '#b0432a' : '#1f8a4c') + '">' + (r.s.adj < 0 ? '−' : '+') + U.money(Math.abs(r.s.adj)) + '</b>' : '—',
                '<b>' + U.money(r.s.receivable) + '</b>',
                r.s.cod ? U.money(r.s.cod) : '—',
                U.tag(r.s.state, X_.SETTLE_STATE[r.s.state], { solid: r.s.state !== 'Settled' })] }))), { pad: false })}
            ${U.panel('Settlement periods', U.table(
              [{ t: 'Cycle' }, { t: 'Range' }, { t: 'Orders', num: true }, { t: 'Gross GMV', num: true }, { t: 'Commission', num: true },
               { t: 'Subscriptions', num: true }, { t: 'Payouts', num: true }, { t: 'COD handled', num: true }, { t: 'State' }, { t: '', w: '190px' }],
              X_.PERIODS.map(p => ({ cells: ['<b>' + p.id + '</b>', p.label, p.orders.toLocaleString(),
                U.money(p.gross), U.money(p.commission), U.money(p.fees), U.money(p.payouts), U.money(p.cod),
                U.tag(p.state, X_.SETTLE_STATE[p.state], { solid: p.state !== 'Settled' }),
                '<div class="rowact">' + U.btn('Statement', { act: 'xStatement', arg: p.id }) +
                  U.btn('Export', { act: 'export', arg: p.id + ' statement' }) + '</div>'] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Who pays whom', U.defs([
              ['Sent into the Network', 'The client that raised the order buys the delivery from Dash. A DMS or 3PL pushing overflow in pays exactly like a merchant does.'],
              ['Delivered for the Network', 'Dash pays whoever carried it — fleet, 3PL or freelancer — gross less the 8% commission. Direct merchant or Network origin makes no difference.'],
              ['Direct and Marketplace', 'The two parties price it themselves. Dash collects the 2% platform fee and nothing more.'],
              ['Both sides at once', 'Rehla Fleet this period: pays Dash for 84 overflow orders it sent, is paid by Dash for 612 it carried. Netted on one statement.'],
              ['COD', 'Never Dash revenue. It passes through and lands with the merchant whose goods they were.']]))}
            ${U.panel('Dash revenue this period', U.defs([
              ['Commission on Network orders', U.money(12380)],
              ['Subscription fees', U.money(42600)],
              ['Platform fees on client orders', U.money(3840)],
              ['Total', '<b>' + U.money(58820) + '</b>'],
              ['Payouts owed to supply', U.money(178400)],
              ['COD passing through', U.money(54800)]]))}
            ${U.panel('Disputes', '<div class="mlist">' + (recs.filter(r => r.s.state === 'Disputed').map(r =>
              '<button type="button" class="ml warn" data-act="xSettle" data-arg="' + r.o.id + '">' +
              '<span class="ml-h"><b>' + r.o.id + '</b>' + U.tag('Disputed', d.PAL.tang, { solid: true }) + '</span>' +
              '<span class="ml-s">' + U.esc(r.s.dispute) + '</span></button>').join('') ||
              '<div class="empty">No open disputes.</div>') + '</div>', { pad: false })}
            ${U.panel('Audit trail', `<div class="log">${X_.FINAUDIT.map(a =>
              '<div class="lg"><span class="lg-t">' + a.t + '</span><span class="lg-e"><b>' + U.esc(a.a) + '</b><em>' + U.esc(a.o) + ' · ' + U.esc(a.u) + '</em></span></div>').join('')}</div>`,
              { pad: false, right: '<span class="ph-note">Every financial change, with an actor</span>' })}
          </div>
        </div>`;
    }
  };
})();

/* ================= actions ================= */
(function () {
  const U = UI, D = () => window.ADM, X = () => window.XDEEP;
  const R = () => window.RENDER();
  const NOWS = () => X().hm(X().NOW);

  Object.assign(window.ACT, {
    xTrace: id => {
      const d = D(), o = d.order(id), s = X().sla(o), st = X().settle(o), dash = o.scope === 'dash';
      const cs = X().casesFor(id), of = X().offersFor(id);
      U.drawer('<b>' + id + '</b> — order trace', [
        '<div class="dw-meta">' + U.esc(o.merchant) + ' → ' + U.esc(o.customer) + ' · ' + U.esc(o.product) + '</div>',
        '<div class="slahead">' + X().slaTag(s.state) + U.statusTag(o.status) + U.scope(o.scope) +
          '<span class="slahead-m">Ageing ' + X().dur(s.age) + ' · promised ' + s.promisedDelivery +
          (s.state === 'Late' ? ' · ' + X().dur(Math.max(1, s.over)) + ' over' : '') + '</span></div>',
        U.defs([
          ['Client', U.esc(o.merchant) + ' <em class="sub">' + U.esc(o.product) + '</em>'],
          ['Fulfilled by', o.provider === '—' ? '<em class="warn">Nobody yet</em>' : U.esc(o.provider)],
          ['Source', (o.source === 'Network' ? 'Dash Network' : o.source) + ' · ' + (o.type || 'On demand')],
          ['Intervention', U.scope(o.scope) + ' <em class="sub">' + (dash ? 'Dash routed this, so Dash owns it' : 'Read only — escalate to the owner') + '</em>'],
          ['Promised pickup', s.promisedPickup + ' <em class="sub">· ' + s.src + '</em>'],
          ['Location freshness', o.offline ? '<em class="warn">' + U.esc(o.offline) + ' — no location for 11 min</em>' : o.stuck ? '<em class="warn">No status change for ' + X().dur(o.stuck) + '</em>' : 'Reporting normally'],
          ['Settlement', st.state === '—' ? 'Nothing charged' : U.money(st.receivable) + ' receivable · ' + st.state],
          ['Cases', cs.length ? cs.map(c => '<a href="#" data-act="xCase" data-arg="' + c.id + '">' + c.id + '</a> ' + c.state).join(' · ') : 'None raised']
        ]),
        '<div class="sub-h">Lifecycle</div>',
        X().traceHTML(o),
        '<div class="sub-h">Offer attempts</div>',
        of.length ? '<div class="offers">' + of.map((f, i) =>
          '<div class="of o-' + f.out.toLowerCase().replace(/\s/g, '') + '"><span class="of-n">' + (i + 1) + '</span>' +
          '<div><b>' + U.esc(f.who) + '</b><em>' + U.esc(f.sub) + '</em></div>' +
          '<span class="of-o">' + f.out + '</span><span class="of-t">' + f.t + '</span></div>').join('') + '</div>'
          : U.note(dash ? 'No offer has gone out.' : 'Dash did not route this order.',
            dash ? 'The routing engine found no eligible supply — the diagnostics show which check each node failed.'
              : U.esc(o.merchant) + ' chose their own provider. Dash holds the timeline, not the reasoning behind the driver choice.',
            dash ? d.PAL.peach : d.PAL.lav)
      ].join(''), { footer:
        U.btn('Dispatch diagnostics', { kind: 'primary', act: 'xDiag', arg: id }) +
        (dash ? U.btn('Reassign supply', { act: 'reassign', arg: id }) + U.btn('Raise a case', { act: 'xCaseNew', arg: id })
              : U.btn('Escalate to the owner', { act: 'escalateOwner', arg: id })) +
        U.btn('Settlement', { act: 'xSettle', arg: id }) +
        U.btn('Open order', { act: 'go', arg: '/orders/' + id }) });
    },

    xDiag: id => {
      const o = D().order(id);
      U.drawer('Dispatch diagnostics — <b>' + id + '</b>', X().diagHTML(o),
        { footer: U.btn('Back to trace', { kind: 'primary', act: 'xTrace', arg: id }) +
          U.btn('Routing engine', { act: 'go', arg: '/routing' }) });
    },

    xCase: cid => {
      const c = X().CASES().find(k => k.id === cid), o = D().order(c.order);
      const dash = c.scope === 'dash';
      U.drawer('<b>' + c.id + '</b> — ' + c.type, [
        '<div class="dw-meta">' + U.esc(c.reason) + '</div>',
        U.defs([
          ['State', U.tag(c.state, c.state === 'Resolved' ? '#1f8a4c' : c.state === 'Acknowledged' ? D().PAL.lav : D().PAL.lemon, { solid: c.state !== 'Resolved' })],
          ['Severity', U.tag(c.sev, X().CASE_SEV[c.sev], { solid: true })],
          ['Owner', c.owner ? U.esc(c.owner) : '<em class="warn">Unclaimed — anyone could be working this</em>'],
          ['Intervention', U.scope(c.scope) + ' <em class="sub">' + (dash ? 'Dash can resolve this directly' : 'Dash can only escalate to the owner') + '</em>'],
          ['Order', '<a href="#" data-act="xTrace" data-arg="' + c.order + '">' + c.order + '</a>' + (o ? ' · ' + U.statusTag(o.status) : '')],
          ['Client', U.esc(c.client)],
          ['Raised', c.created + ' · ' + U.esc(c.via)],
          ['Action taken', c.action ? U.esc(c.action) : '—'],
          ['Resolution', c.resolution ? U.esc(c.resolution) + ' · ' + c.resolvedAt : '—']
        ]),
        o ? '<div class="sub-h">Where it sits in the order</div>' + X().traceHTML(o) : '',
        dash ? '' : U.note('Dash cannot close this from here.', 'The order belongs to ' + U.esc(c.client) +
          ' and their provider. Acknowledging means Dash is watching it and has told the owner — not that Dash will fix it.', D().PAL.lav)
      ].join(''), { footer:
        (c.state === 'Open' ? U.btn('Acknowledge — claim this', { kind: 'primary', act: 'xCaseAck', arg: c.id }) : '') +
        (c.state !== 'Resolved' && dash ? U.btn('Resolve', { kind: c.state === 'Acknowledged' ? 'primary' : '', act: 'xCaseResolve', arg: c.id }) : '') +
        (c.state !== 'Resolved' && !dash ? U.btn('Escalate to the owner', { act: 'escalateOwner', arg: c.order }) : '') +
        (o ? U.btn('Order trace', { act: 'xTrace', arg: c.order }) : '') });
    },
    xCaseAck: cid => {
      const c = X().CASES().find(k => k.id === cid);
      c.state = 'Acknowledged'; c.owner = X().OPERATOR; c.ackAt = NOWS();
      c.action = 'Claimed by ' + X().OPERATOR;
      D().AUDIT.unshift({ t: NOWS(), u: X().OPERATOR, r: 'Super Admin', a: 'Acknowledged case', o: c.id + ' · ' + c.order, ip: '188.55.x.x' });
      U.toast(c.id + ' is yours — ' + c.type.toLowerCase()); R();
      window.ACT.xCase(cid);
    },
    xCaseResolve: cid => {
      const c = X().CASES().find(k => k.id === cid);
      const opts = { 'SLA breach': ['Merchant credited, delivery continued', 'Reassigned and delivered', 'Charge waived with the merchant'],
        'Driver offline': ['Reassigned to another supply node', 'Driver came back online', 'Order cancelled and the merchant credited'],
        'No movement': ['Provider contacted — moving again', 'Reassigned supply', 'Cancelled and credited'],
        'Not accepted': ['Rerouted to the next node', 'Offered to the freelancer pool', 'Returned to the merchant'],
        'Failed delivery': ['Reattempt scheduled', 'Returned to the merchant', 'Cancelled with the merchant'],
        'Merchant delay': ['Merchant confirmed ready — collected', 'Promise reset with the merchant', 'Order cancelled'],
        'Wrong address': ['New address confirmed and pushed to the driver', 'Delivered to the original address', 'Failed — customer to rebook'] }[c.type]
        || ['Handled', 'No action needed'];
      U.drawer('Resolve <b>' + c.id + '</b>', '<div class="dw-meta">' + U.esc(c.reason) + '</div><div class="cands">' +
        opts.map(x => '<button type="button" class="cand pick" data-act="xDoResolve" data-arg="' + c.id + '|' + x + '">' +
          '<span class="cand-n">·</span><div><b>' + x + '</b></div></button>').join('') + '</div>');
    },
    xDoResolve: arg => {
      const [cid, choice] = arg.split('|'), c = X().CASES().find(k => k.id === cid);
      c.state = 'Resolved'; c.owner = c.owner || X().OPERATOR; c.resolution = choice; c.resolvedAt = NOWS();
      c.action = c.action || 'Handled from the global control tower';
      D().AUDIT.unshift({ t: NOWS(), u: X().OPERATOR, r: 'Super Admin', a: 'Resolved case', o: c.id + ' · ' + choice, ip: '188.55.x.x' });
      U.closeDrawer(); U.toast(cid + ' resolved — ' + choice.toLowerCase()); R();
    },
    xCaseNew: id => {
      const types = ['SLA breach', 'No movement', 'Driver offline', 'Not accepted', 'Failed delivery', 'Merchant delay', 'Wrong address'];
      U.drawer('Raise a case — <b>' + id + '</b>', '<div class="dw-meta">A case has an owner and a resolution. An alert does not.</div><div class="cands">' +
        types.map(t => '<button type="button" class="cand pick" data-act="xDoCaseNew" data-arg="' + id + '|' + t + '">' +
          '<span class="cand-n">·</span><div><b>' + t + '</b></div></button>').join('') + '</div>');
    },
    xDoCaseNew: arg => {
      const [id, type] = arg.split('|'), o = D().order(id);
      const c = X().newCase({ type, reason: 'Raised by Dash from the order trace', sev: 'Medium',
        order: id, client: o.merchant, scope: o.scope, created: NOWS(), via: 'Global control tower · ' + X().OPERATOR });
      c.state = 'Acknowledged'; c.owner = X().OPERATOR; c.ackAt = NOWS();
      U.closeDrawer(); U.toast(c.id + ' opened and assigned to you'); R();
    },
    caseTab: t => { STATE.caseFilter = t; R(); },

    setF: (a, el) => { STATE.settle[a] = a === 'period' ? el.value.split(' · ')[0] : el.value; R(); },
    setState: s => { STATE.settle.state = s; R(); },
    xSettle: id => {
      const d = D(), o = d.order(id), s = X().settle(o);
      U.drawer('Settlement — <b>' + id + '</b>', [
        '<div class="dw-meta">' + U.esc(s.owner) + ' · period ' + s.period + '</div>',
        '<div class="slahead">' + U.tag(s.state, X().SETTLE_STATE[s.state], { solid: s.state !== 'Settled' }) +
          '<span class="slahead-m">The merchant and the provider read this same record</span></div>',
        U.defs([
          ['Priced by', U.esc(s.priced)],
          ['Gross', U.money(s.gross)],
          ['Dash take', s.commission ? U.money(s.commission) + ' <em class="sub">8% commission on Network supply</em>' : U.money(s.platformFee) + ' <em class="sub">platform fee — Dash did not route this</em>'],
          ['Supply payable', s.supplyPay ? U.money(s.supplyPay) : '—'],
          ['Adjustments', s.adj ? (s.adj < 0 ? '−' : '+') + U.money(Math.abs(s.adj)) : 'None'],
          ['Merchant receivable', '<b>' + U.money(s.receivable) + '</b>'],
          ['COD', s.cod ? U.money(s.cod) + ' <em class="sub">' + s.codState + '</em>' : 'Cash free'],
          ['Dispute', U.esc(s.dispute)]
        ]),
        '<div class="sub-h">Who pays whom</div>',
        '<div class="cands">' + s.legs.map(l =>
          '<div class="cand"><span class="cand-n">' + (l.dir === 'in' ? '+' : '−') + '</span>' +
          '<div><b>' + U.esc(l.party) + ' — ' + (l.dir === 'in' ? 'pays Dash' : 'is paid by Dash') + '</b><em>' + U.esc(l.why) + '</em></div>' +
          '<span class="cand-v">' + U.money(l.amount) + '</span></div>').join('') + '</div>',
        '<div class="sub-h">Adjustments</div>',
        s.adjustments.length ? U.table([{ t: 'Adjustment' }, { t: 'Amount', num: true }, { t: 'Reason' }, { t: 'Actor' }],
          s.adjustments.map(a => ({ cells: ['<b>' + U.esc(a.t) + '</b>',
            '<b style="color:' + (a.a < 0 ? '#b0432a' : '#1f8a4c') + '">' + (a.a < 0 ? '−' : '+') + U.money(Math.abs(a.a)) + '</b>',
            U.esc(a.why), U.esc(a.by)] })))
          : '<div class="empty">No adjustments on this order.</div>'
      ].join(''), { footer:
        U.btn('Add adjustment', { kind: 'primary', act: 'stub', arg: 'Adjustment needs a reason and is written to the audit trail' }) +
        (s.state === 'Disputed' ? U.btn('Close dispute', { act: 'stub', arg: 'Dispute closed — the order moves to Ready' })
          : U.btn('Open dispute', { act: 'stub', arg: 'Dispute opened — the order is held out of settlement' })) +
        U.btn('Order trace', { act: 'xTrace', arg: id }) });
    },
    xStatement: pid => {
      const p = X().PERIODS.find(x => x.id === pid);
      U.drawer('Statement — <b>' + p.id + '</b>', [
        '<div class="dw-meta">' + p.label + ' · ' + p.closes + '</div>',
        U.defs([['State', U.tag(p.state, X().SETTLE_STATE[p.state], { solid: p.state !== 'Settled' })],
          ['Orders', p.orders.toLocaleString()], ['Gross GMV', U.money(p.gross)],
          ['Commission on Network orders', U.money(p.commission)],
          ['Subscription revenue', U.money(p.fees)],
          ['Dash revenue', '<b>' + U.money(p.commission + p.fees) + '</b>'],
          ['Payouts owed to supply', U.money(p.payouts)],
          ['COD passing through', U.money(p.cod)]])
      ].join(''), { footer: U.btn('Download statement', { kind: 'primary', act: 'export', arg: p.id + ' statement' }) +
        (p.state === 'Ready' ? U.btn('Release payouts', { act: 'go', arg: '/payouts' }) : '') });
    },
    closePeriod: () => U.toast('SP-2026-W36 closed — it moves to Ready once COD is reconciled'),
    savePolicy: () => U.toast('Platform SLA policy saved — new orders are measured against it immediately'),
    addOverride: () => U.drawer('Add an override', `
      <div class="dw-meta">Only where operations require it. Every override needs a reason someone can read a year from now.</div>
      ${U.field('Applies to', U.select(['Client', 'Zone', 'Service type', 'Product'], 'Client'))}
      ${U.field('Name', U.select(D().CLIENTS.map(c => c.name), D().CLIENTS[0].name))}
      ${U.field('Pickup SLA', U.input('15 min'))}
      ${U.field('Delivery SLA', U.input('45 min'))}
      ${U.field('Why it exists', U.input('', 'Chilled goods — shorter promise in the contract'))}`,
      { footer: U.btn('Add override', { kind: 'primary', act: 'stub', arg: 'Override added to the platform policy' }) })
  });
})();
