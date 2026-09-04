/* Dash Merchant — deepening layer: SLA read-only, order trace, settlement view.
   Every number here is read from the shared record; the merchant sets none of it. */
window.SCREENS = window.SCREENS || {};
window.STATE = window.STATE || {};
window.ACT = window.ACT || {};

window.MDEEP = (function () {
  const D = () => window.MER;
  const NOW = 15 * 60 + 48;
  const mn = t => { const p = String(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
  const hm = v => { const x = ((v % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
  const dur = m => m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min';
  const DONE = ['Delivered', 'Cancelled', 'Returned'];

  /* the policy Dash set — shown, never edited */
  const POLICY = { pickup: 15, delivery: 45, atRisk: 35, late: 45, schedWindow: 30, schedTol: 10,
    setBy: 'Rehla Fleet · your delivery account', reviewed: '20 Aug 2026',
    exceptions: [
      { scope: 'Branch', name: 'KZ-03 — Al Sahafah', pickup: 20, delivery: 60, why: 'Thin driver coverage in that district while it is being built out' },
      { scope: 'Service type', name: 'Scheduled', pickup: 15, delivery: 45, why: 'Measured against your slot with ±10 min tolerance, not against creation' }
    ] };

  function effective(o) {
    const b = D().branch(o.branch);
    const ex = POLICY.exceptions.find(x => x.scope === 'Branch' && x.name.startsWith(b.code));
    return ex ? { pickup: ex.pickup, delivery: ex.delivery, atRisk: Math.round(ex.delivery * .78), src: 'Branch exception · ' + b.code }
      : { pickup: POLICY.pickup, delivery: POLICY.delivery, atRisk: POLICY.atRisk, src: 'Account policy' };
  }

  function sla(o) {
    const p = effective(o), created = mn(o.created), scheduled = o.type === 'Scheduled';
    const promisedPickup = hm(created + p.pickup);
    const promisedDelivery = scheduled ? o.eta : hm(created + p.delivery);
    const end = scheduled ? mn(o.eta) + POLICY.schedTol : created + p.delivery;
    const closed = DONE.includes(o.status);
    const at = closed ? mn((o.log[o.log.length - 1] || { t: o.created }).t) : NOW;
    const age = Math.max(0, at - created), over = at - end;
    let state;
    if (o.status === 'Cancelled') state = '—';
    else if (closed) state = over > 0 ? 'Late' : 'On time';
    else if (over > 0 || o.late) state = 'Late';
    else if (age >= p.atRisk || o.stuck) state = 'At risk';
    else state = 'On time';
    return { p, state, age, over, promisedPickup, promisedDelivery, src: p.src, left: Math.max(0, end - NOW) };
  }
  const slaTag = s => '<span class="sla s-' + s.replace(/[^a-z]/gi, '').toLowerCase() + '">' + s + '</span>';

  /* order trace — no assignment internals; the merchant does not dispatch */
  function trace(o) {
    const d = D(), ev = [];
    o.log.forEach(l => ev.push({ t: l.t, k: /Fail|Cancel|Return|declin/i.test(l.e) ? 'bad' : 'status', title: l.e, sub: l.s }));
    if (o.fellThrough) ev.push({ t: o.created, k: 'bad', title: o.fellThrough + ' could not take it', sub: 'Your fallback chain moved on to the next provider' });
    if (o.provider) ev.push({ t: (o.log.find(l => /provider|assign/i.test(l.e)) || { t: o.created }).t, k: 'ok',
      title: 'Fulfilled by ' + d.prov(o.provider).name, sub: d.prov(o.provider).kind + (o.driver ? ' · driver ' + o.driver : ' · driver not yet named') });
    (ESCALATIONS[o.id] || []).forEach(x => ev.push({ t: x.t, k: x.state === 'Resolved' ? 'ok' : 'case',
      title: x.state === 'Resolved' ? 'Dash resolved your escalation' : 'You escalated to Dash', sub: x.reason + (x.reply ? ' · ' + x.reply : ' · ' + x.state.toLowerCase()) }));
    const s = sla(o);
    ev.push({ t: s.promisedDelivery, k: 'promise', title: 'Delivery promised', sub: s.src + ' · ' + s.p.delivery + ' min from creation' });
    ev.sort((a, b) => mn(a.t) - mn(b.t));
    return ev;
  }

  const ESCALATIONS = {
    'DX-41074': [{ t: '15:46', reason: 'No provider for 4 minutes after Rehla Fleet declined', state: 'Acknowledged', reply: 'Dash is widening the pool' }],
    'DX-41090': [{ t: '15:30', reason: 'Running late past the 15:35 promise', state: 'Acknowledged', reply: 'Dash is chasing Sahel Logistics' }]
  };

  function traceHTML(o) {
    const U = window.UI, ev = trace(o), out = [];
    let prev = null;
    ev.forEach(e => {
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
        (s.state === 'Late' ? dur(s.over) + ' past the promise' : dur(s.left) + ' of the promise left') + '</em></span></div>');
    return '<div class="tl">' + out.join('') + '</div>';
  }

  /* settlement — the same per-order record the DMS holds, from the payable side */
  const ADJ = {
    'DX-41090': [{ t: 'Late delivery credit', a: -4.4, why: 'Promise of 15:20 missed by 14 min', by: 'Dash · applied automatically' }],
    'DX-40998': [{ t: 'Return leg', a: 8.0, why: 'Returned to your branch after a failed attempt', by: 'Rehla Fleet' }]
  };

  function settle(o) {
    const d = D(), km = +(2.2 + ((o.id.charCodeAt(4) * 5) % 58) / 10).toFixed(1);
    const base = 14, rate = 1.2;
    const gross = o.charge || +(base + km * rate).toFixed(2);
    const adjustments = ADJ[o.id] || [];
    const adj = adjustments.reduce((s, x) => s + x.a, 0);
    let state = DONE.includes(o.status) ? 'Ready' : 'Unsettled';
    if (o.id === 'DX-41042') state = 'Settled';
    if (o.id === 'DX-41090') state = 'Disputed';
    if (o.status === 'Returned') state = 'Unsettled';
    return { km, base, rate, gross, adj, adjustments, due: +(gross + adj).toFixed(2),
      provider: o.provider ? d.prov(o.provider).name : 'Not yet assigned',
      cod: o.cod || 0, codState: o.cod ? (o.status === 'Delivered' ? 'Collected by the driver · credited to you' : 'With the driver') : 'Cash free',
      state, dispute: o.id === 'DX-41090' ? 'Open — you contested the delivery charge on 30 Aug' : '—',
      period: DONE.includes(o.status) ? 'SP-2026-W35' : 'SP-2026-W36' };
  }

  const PERIODS = [
    { id: 'SP-2026-W36', label: '1 – 7 Sep 2026', state: 'Unsettled', orders: 96, charges: 1842.4, cod: 620, credits: -18.4, closes: 'Closes 7 Sep 23:59' },
    { id: 'SP-2026-W35', label: '25 – 31 Aug 2026', state: 'Ready', orders: 148, charges: 2814.0, cod: 940, credits: -26.4, closes: 'Due 7 Sep' },
    { id: 'SP-2026-W34', label: '18 – 24 Aug 2026', state: 'Disputed', orders: 132, charges: 2508.6, cod: 812, credits: -8.8, closes: 'Held pending dispute' },
    { id: 'SP-2026-W33', label: '11 – 17 Aug 2026', state: 'Settled', orders: 121, charges: 2296.2, cod: 744, credits: -13.2, closes: 'Paid 20 Aug' }
  ];
  const SETTLE_STATE = { Unsettled: '#FFEE50', Ready: '#C0D2FF', Settled: '#1f8a4c', Disputed: '#FCA38B' };

  /* integration health — plain language, for an operations person */
  const CONNS = [
    { n: 'Salla', k: 'Platform connector', s: 'Connected', last: '40 s ago', err: null, fails: 0, ref: 'SL-88214', hook: 'Delivering · 200 OK, 84 ms' },
    { n: 'Shopify', k: 'Platform connector', s: 'Error', last: 'Today 13:22', err: 'Your API key was rotated in Shopify and Dash was not given the new one', fails: 14, ref: 'SH-4471', hook: 'Retrying · 4 attempts' },
    { n: 'Kanz ERP', k: 'Your own API key', s: 'Connected', last: '3 min ago', err: 'Yesterday 19:04 · one order rejected, no customer phone', fails: 1, ref: 'KZ-90233', hook: 'Delivering · 200 OK, 141 ms' },
    { n: 'Zid', k: 'Platform connector', s: 'Not connected', last: '—', err: null, fails: 0, ref: '—', hook: '—' }
  ];
  const FAILED = [
    { t: 'Today 13:22', c: 'Shopify', x: 'SH-4471', ref: '#1188', e: 'Key rejected — reconnect Shopify to fix all 14' },
    { t: 'Today 13:18', c: 'Shopify', x: 'SH-4470', ref: '#1187', e: 'Key rejected — reconnect Shopify to fix all 14' },
    { t: 'Yesterday 19:04', c: 'Kanz ERP', x: 'KZ-90233', ref: 'PO-2214', e: 'No customer phone on the order' }
  ];

  return { NOW, POLICY, sla, slaTag, trace, traceHTML, settle, PERIODS, SETTLE_STATE, CONNS, FAILED,
    ESCALATIONS, mn, hm, dur, DONE };
})();

/* ================= screens ================= */
(function () {
  const U = UI, D = () => window.MER, X = () => window.MDEEP;
  STATE.st = STATE.st || { state: 'All states', period: 'SP-2026-W35' };
  const fg = (l, c) => '<span class="f-g"><span class="f-l">' + l + '</span>' + c + '</span>';

  SCREENS['sla'] = {
    title: 'Delivery promise', epic: 'Epic 09 · SLA',
    render() {
      const d = D(), P = X().POLICY;
      const live = d.ORDERS.filter(o => !X().DONE.includes(o.status));
      const n = s => live.filter(o => X().sla(o).state === s).length;
      return U.page('Delivery promise',
        'The times your delivery account commits to, and how your orders are tracking against them') + `
        ${U.note('Set by Rehla Fleet, not by you.', 'Your delivery account owns these numbers and reviewed them on ' + P.reviewed +
          '. If a promise does not fit your business, raise it with them — Dash shows you the promise and whether it was met.', d.PAL.vodka)}
        <div class="kpis k-4">
          ${U.kpi('On time', n('On time'), 'Inside the promise', '#1f8a4c')}
          ${U.kpi('At risk', n('At risk'), 'Ageing past the at-risk mark', d.PAL.peach)}
          ${U.kpi('Late', n('Late'), 'Promise already missed', d.PAL.tang)}
          ${U.kpi('On time this week', '95.9%', '148 of 154 orders', d.PAL.lav)}
        </div>
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Your promise', U.defs([
              ['Pickup', P.pickup + ' min <em class="sub">from the moment the order reaches Dash</em>'],
              ['Delivery', P.delivery + ' min <em class="sub">from the moment the order reaches Dash</em>'],
              ['Counts as at risk after', P.atRisk + ' min'],
              ['Counts as late after', P.late + ' min'],
              ['Scheduled slot length', P.schedWindow + ' min'],
              ['Scheduled tolerance', '± ' + P.schedTol + ' min either side of your slot'],
              ['Set by', U.esc(P.setBy)],
              ['Last reviewed', P.reviewed]]), { right: '<span class="ph-note">Read only</span>' })}
            ${U.panel('Exceptions that apply to you', U.table(
              [{ t: 'Applies to' }, { t: 'Name' }, { t: 'Pickup', num: true }, { t: 'Delivery', num: true }, { t: 'Why' }],
              P.exceptions.map(e => ({ cells: [U.tag(e.scope, d.PAL.lav), '<b>' + U.esc(e.name) + '</b>',
                e.pickup + ' min', e.delivery + ' min', '<em class="sub">' + U.esc(e.why) + '</em>'] }))), { pad: false })}
            ${U.panel('Live orders against the promise', U.table(
              [{ t: 'Order' }, { t: 'Branch' }, { t: 'Fulfilled by' }, { t: 'Promised pickup' }, { t: 'Promised delivery' }, { t: 'Ageing' }, { t: 'State' }],
              live.map(o => { const s = X().sla(o); return { act: 'go', arg: '/orders/' + o.id, cells: [
                '<b>' + o.id + '</b>', d.branch(o.branch).code,
                o.provider ? U.esc(d.prov(o.provider).name) : '<em class="warn">Waiting</em>',
                s.promisedPickup, s.promisedDelivery, X().dur(s.age), X().slaTag(s.state)] }; })), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Where the promise shows up', U.defs([
              ['Control tower', 'A filter, and a state on every order'],
              ['Order detail', 'The promise sits in the trace with the breach measured against it'],
              ['Reports', 'SLA performance, breaches and the causes behind them'],
              ['Escalation', 'A missed promise is the strongest thing you can escalate on']]))}
            ${U.panel('Breaches this week', `<div class="blist">
              ${[['Provider took too long to assign', 44], ['Your branch was not ready', 26], ['Traffic and distance', 18], ['Failed first attempt', 12]]
                .map(([k, v]) => '<div class="bl"><span>' + k + '</span>' + U.bar(v, d.PAL.tang) + '<b>' + v + '%</b></div>').join('')}
            </div><div class="fld-h">Two of the four causes are yours to fix, and both sit in your branches.</div>`, { pad: false })}
          </div>
        </div>`;
    }
  };

  SCREENS['settlement'] = {
    title: 'Settlement', epic: 'Epic 14 · Settlement',
    render() {
      const d = D(), f = STATE.st, X_ = X();
      const recs = d.ORDERS.filter(o => o.charge || X_.DONE.includes(o.status)).map(o => ({ o, s: X_.settle(o) }));
      const states = ['Unsettled', 'Ready', 'Settled', 'Disputed'];
      const shown = recs.filter(r => f.state === 'All states' || r.s.state === f.state);
      const sum = st => recs.filter(r => r.s.state === st).reduce((a, r) => a + r.s.due, 0);
      const cards = '<div class="scards">' + states.map(st => {
        const n = recs.filter(r => r.s.state === st).length;
        return '<button type="button" class="scard ' + (f.state === st ? 'on' : '') + '" data-act="stState" data-arg="' + st + '" style="--sc:' + X_.SETTLE_STATE[st] + '">' +
          '<span class="scard-s">' + st + '</span><span class="scard-v">' + U.money(sum(st)) + '</span>' +
          '<span class="scard-f">' + n + ' order' + (n === 1 ? '' : 's') + ' · ' +
          ({ Unsettled: 'still accruing this period', Ready: 'invoiced and due', Settled: 'paid', Disputed: 'held until it is closed' }[st]) + '</span></button>';
      }).join('') + '</div>';

      return U.page('Settlement',
        'What you owe for delivery, order by order. The same record Dash and your provider read',
        U.btn('Download statement', { kind: 'primary', act: 'export', arg: 'SP-2026-W35 statement' }) +
        U.btn('Billing and subscription', { act: 'go', arg: '/billing' })) +
        U.note('You do not calculate these charges.', 'Every line is read from the order record Dash holds. If a number looks wrong, open a dispute — do not adjust it here, because you cannot.', d.PAL.vodka) +
        cards +
        U.filters([
          fg('State', U.select(['All states'].concat(states), f.state, { act: 'stF', arg: 'state' })),
          fg('Period', U.select(X_.PERIODS.map(p => p.id + ' · ' + p.label), f.period + ' · ' + (X_.PERIODS.find(p => p.id === f.period) || {}).label, { act: 'stF', arg: 'period' })),
          '<span class="f-sp"></span><span class="f-c">' + shown.length + ' orders shown</span>',
          f.state !== 'All states' ? U.btn('Show all states', { act: 'stState', arg: 'All states' }) : ''
        ]) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Delivered orders and charges', U.table(
              [{ t: 'Order' }, { t: 'Branch' }, { t: 'Fulfilled by' }, { t: 'Rate applied', num: true }, { t: 'Adjustments', num: true },
               { t: 'You owe', num: true }, { t: 'COD credited', num: true }, { t: 'State' }],
              shown.map(r => ({ act: 'mSettle', arg: r.o.id, cells: [
                '<b>' + r.o.id + '</b>', d.branch(r.o.branch).code, U.esc(r.s.provider),
                U.money(r.s.gross) + '<em class="sub"> · ' + r.s.km + ' km</em>',
                r.s.adj ? '<b style="color:' + (r.s.adj < 0 ? '#1f8a4c' : '#b0432a') + '">' + (r.s.adj < 0 ? '−' : '+') + U.money(Math.abs(r.s.adj)) + '</b>' : '—',
                '<b>' + U.money(r.s.due) + '</b>', r.s.cod ? U.money(r.s.cod) : '—',
                U.tag(r.s.state, X_.SETTLE_STATE[r.s.state], { solid: r.s.state !== 'Settled' })] }))), { pad: false })}
            ${U.panel('Statement periods', U.table(
              [{ t: 'Cycle' }, { t: 'Range' }, { t: 'Orders', num: true }, { t: 'Charges', num: true }, { t: 'Credits', num: true },
               { t: 'COD credited', num: true }, { t: 'Amount due', num: true }, { t: 'State' }, { t: '', w: '190px' }],
              X_.PERIODS.map(p => ({ cells: ['<b>' + p.id + '</b>', p.label, p.orders, U.money(p.charges),
                '<b style="color:#1f8a4c">' + U.money(p.credits) + '</b>', U.money(p.cod),
                '<b>' + U.money(+(p.charges + p.credits).toFixed(2)) + '</b>',
                U.tag(p.state, X_.SETTLE_STATE[p.state], { solid: p.state !== 'Settled' }),
                '<div class="rowact">' + U.btn('Statement', { act: 'mStatement', arg: p.id }) +
                  U.btn('Download', { act: 'export', arg: p.id + ' statement' }) + '</div>'] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Cash on delivery', U.defs([
              ['Collected on your behalf', U.money(620)],
              ['Credited to this period', U.money(482)],
              ['Still with drivers', U.money(138)],
              ['How it settles', 'Netted off your charges on the statement']]))}
            ${U.panel('Disputes', '<div class="mlist">' + (recs.filter(r => r.s.state === 'Disputed').map(r =>
              '<button type="button" class="ml warn" data-act="mSettle" data-arg="' + r.o.id + '">' +
              '<span class="ml-h"><b>' + r.o.id + '</b>' + U.tag('Disputed', d.PAL.tang, { solid: true }) + '</span>' +
              '<span class="ml-s">' + U.esc(r.s.dispute) + '</span></button>').join('') ||
              '<div class="empty">No open disputes.</div>') + '</div>', { pad: false })}
            ${U.panel('Credits applied to you', U.table([{ t: 'Order' }, { t: 'Reason' }, { t: 'Amount', num: true }],
              recs.flatMap(r => r.s.adjustments.filter(a => a.a < 0).map(a => ({ cells: ['<b>' + r.o.id + '</b>', U.esc(a.why),
                '<b style="color:#1f8a4c">−' + U.money(Math.abs(a.a)) + '</b>'] })))), { pad: false,
              right: '<span class="ph-note">A missed promise credits you automatically</span>' })}
          </div>
        </div>`;
    }
  };
})();

/* ================= actions ================= */
(function () {
  const U = UI, D = () => window.MER, X = () => window.MDEEP;
  const R = () => window.RENDER();
  Object.assign(window.ACT, {
    mTrace: id => {
      const d = D(), o = d.order(id), s = X().sla(o), st = X().settle(o);
      const esc = X().ESCALATIONS[id] || [];
      U.drawer('<b>' + id + '</b> — order trace', [
        '<div class="dw-meta">' + U.esc(d.branch(o.branch).name) + ' → ' + U.esc(d.customer(o.customer).name) + '</div>',
        '<div class="slahead">' + X().slaTag(s.state) + U.statusTag(o.status) +
          '<span class="slahead-m">Ageing ' + X().dur(s.age) + ' · promised ' + s.promisedDelivery +
          (s.state === 'Late' ? ' · ' + X().dur(s.over) + ' over' : '') + '</span></div>',
        U.defs([
          ['Branch', U.esc(d.branch(o.branch).name)],
          ['Fulfilled by', o.provider ? U.esc(d.prov(o.provider).name) + ' <em class="sub">' + d.prov(o.provider).kind + '</em>' : '<em class="warn">No provider yet</em>'],
          ['Driver', o.driver ? U.esc(o.driver) + ' <em class="sub">not your employee</em>' : '—'],
          ['Source', U.esc(o.source) + ' · ' + o.type],
          ['Promised pickup', s.promisedPickup + ' <em class="sub">· ' + s.src + '</em>'],
          ['Delivery charge', U.money(st.due) + ' · ' + st.state],
          ['Escalations', esc.length ? esc.map(e => e.state + ' — ' + U.esc(e.reason)).join('<br>') : 'None raised']
        ]),
        '<div class="sub-h">Lifecycle</div>',
        X().traceHTML(o),
        U.note('You are not seeing dispatch internals.', 'Which drivers were offered the order and who declined belongs to your provider. What you get is the promise, the timeline, and the right to escalate.', D().PAL.vodka)
      ].join(''), { footer:
        U.btn('Escalate to Dash', { kind: 'primary', act: 'escalate', arg: id }) +
        U.btn('Delivery charge', { act: 'mSettle', arg: id }) +
        U.btn('Open order', { act: 'go', arg: '/orders/' + id }) });
    },
    stF: (a, el) => { STATE.st[a] = a === 'period' ? el.value.split(' · ')[0] : el.value; R(); },
    stState: s => { STATE.st.state = s; R(); },
    mSettle: id => {
      const d = D(), o = d.order(id), s = X().settle(o);
      U.drawer('Delivery charge — <b>' + id + '</b>', [
        '<div class="dw-meta">' + U.esc(s.provider) + ' · period ' + s.period + '</div>',
        '<div class="slahead">' + U.tag(s.state, X().SETTLE_STATE[s.state], { solid: s.state !== 'Settled' }) +
          '<span class="slahead-m">Read from the order record — not calculated here</span></div>',
        U.defs([
          ['Rate applied', U.money(s.base) + ' base + ' + s.km + ' km × ' + U.money(s.rate) + ' = <b>' + U.money(s.gross) + '</b>'],
          ['Adjustments', s.adj ? (s.adj < 0 ? '−' : '+') + U.money(Math.abs(s.adj)) : 'None'],
          ['You owe', '<b>' + U.money(s.due) + '</b>'],
          ['Cash on delivery', s.cod ? U.money(s.cod) + ' <em class="sub">' + s.codState + '</em>' : 'Cash free'],
          ['Statement period', s.period],
          ['Dispute', U.esc(s.dispute)]
        ]),
        '<div class="sub-h">Adjustments</div>',
        s.adjustments.length ? U.table([{ t: 'Adjustment' }, { t: 'Amount', num: true }, { t: 'Reason' }, { t: 'Applied by' }],
          s.adjustments.map(a => ({ cells: ['<b>' + U.esc(a.t) + '</b>',
            '<b style="color:' + (a.a < 0 ? '#1f8a4c' : '#b0432a') + '">' + (a.a < 0 ? '−' : '+') + U.money(Math.abs(a.a)) + '</b>',
            U.esc(a.why), U.esc(a.by)] })))
          : '<div class="empty">No adjustments on this order.</div>'
      ].join(''), { footer:
        (s.state === 'Disputed' ? U.btn('Withdraw dispute', { kind: 'primary', act: 'stub', arg: 'Dispute withdrawn — the order returns to Ready' })
          : U.btn('Dispute this charge', { kind: 'primary', act: 'stub', arg: 'Dispute opened — the charge is held out of settlement while Dash reviews it' })) +
        U.btn('Order trace', { act: 'mTrace', arg: id }) +
        U.btn('Open order', { act: 'go', arg: '/orders/' + id }) });
    },
    mStatement: pid => {
      const p = X().PERIODS.find(x => x.id === pid);
      U.drawer('Statement — <b>' + p.id + '</b>', [
        '<div class="dw-meta">' + p.label + ' · ' + p.closes + '</div>',
        U.defs([['State', U.tag(p.state, X().SETTLE_STATE[p.state], { solid: p.state !== 'Settled' })],
          ['Delivered orders', p.orders], ['Delivery charges', U.money(p.charges)],
          ['Credits for missed promises', '<b style="color:#1f8a4c">' + U.money(p.credits) + '</b>'],
          ['Cash on delivery credited', U.money(p.cod)],
          ['Amount due', '<b>' + U.money(+(p.charges + p.credits).toFixed(2)) + '</b>']])
      ].join(''), { footer: U.btn('Download statement', { kind: 'primary', act: 'export', arg: p.id + ' statement' }) +
        U.btn('Billing', { act: 'go', arg: '/billing' }) });
    }
  });
})();
