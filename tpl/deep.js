/* Dash 3PL — deepening layer: SLA state, order trace with offer attempts,
   settlement from the payable side, integration health. Read only throughout. */
window.SCREENS = window.SCREENS || {};
window.STATE = window.STATE || {};
window.ACT = window.ACT || {};

window.TDEEP = (function () {
  const D = () => window.TPL;
  const NOW = 15 * 60 + 48;
  const mn = t => { const p = String(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
  const hm = v => { const x = ((v % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
  const dur = m => m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min';
  const DONE = ['Delivered', 'Returned', 'Cancelled', 'Declined'];

  /* the promise Dash holds the 3PL to — read only, and it varies by who owns the order */
  const POLICY = { pickup: 15, delivery: 45, atRisk: 35, schedTol: 10,
    exceptions: [
      { scope: 'Merchant contract', name: 'Tamra Pharmacy', pickup: 10, delivery: 35, why: 'Chilled medicine — the tighter promise is in your own contract with them' },
      { scope: 'Zone', name: 'Zone West', pickup: 20, delivery: 60, why: 'Dash relaxed it while coverage there is thin' },
      { scope: 'Service type', name: 'Scheduled', pickup: 15, delivery: 45, why: 'Measured against the slot with ±10 min tolerance' }
    ] };

  function effective(o) {
    const d = D(), m = d.merchant(o.merchant);
    if (m && m.name === 'Tamra Pharmacy') return { pickup: 10, delivery: 35, atRisk: 27, src: 'Your contract with Tamra Pharmacy' };
    if (o.zone === 'Zone West') return { pickup: 20, delivery: 60, atRisk: 47, src: 'Dash exception · Zone West' };
    return { pickup: POLICY.pickup, delivery: POLICY.delivery, atRisk: POLICY.atRisk,
      src: o.source === 'Network' ? 'Dash Network standard' : 'Dash standard promise' };
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
    if (['Cancelled', 'Declined'].includes(o.status)) state = '—';
    else if (closed) state = over > 0 ? 'Late' : 'On time';
    else if (over > 0 || o.late) state = 'Late';
    else if (age >= p.atRisk || o.stuck) state = 'At risk';
    else state = 'On time';
    return { p, state, age, over, promisedPickup, promisedDelivery, src: p.src, left: Math.max(0, end - NOW) };
  }
  const slaTag = s => '<span class="sla s-' + s.replace(/[^a-z]/gi, '').toLowerCase() + '">' + s + '</span>';

  /* offer attempts — for a 3PL these are Dash offering the ORDER to providers,
     including the times it went elsewhere before reaching them */
  const OFFERS = {
    'DX-41092': [{ t: '15:42', who: 'You — Sahel Logistics', out: 'Timed out', sub: 'Your OMS did not accept inside the 4 min window' },
                 { t: '15:46', who: 'Rehla Fleet', out: 'Open', sub: 'Dash is rerouting — you are no longer in line for it' }],
    'DX-41094': [{ t: '15:46', who: 'You — Sahel Logistics', out: 'Open', sub: '2 min 40 s left to accept in your system' }],
    'DX-40977': [{ t: '11:52', who: 'You — Sahel Logistics', out: 'Declined', sub: 'No refrigerated vehicle available · no penalty applied' },
                 { t: '11:56', who: 'Rehla Fleet', out: 'Accepted', sub: 'Dash reassigned it four minutes later' }],
    'DX-41020': [{ t: '13:10', who: 'Rehla Fleet', out: 'Timed out', sub: 'No response inside the window' },
                 { t: '13:10', who: 'You — Sahel Logistics', out: 'Accepted', sub: 'Accepted in your OMS 46 s later' }],
    'DX-41099': [{ t: '14:37', who: 'You — Sahel Logistics', out: 'Accepted', sub: 'Direct order — the merchant asked for you by name' }]
  };
  const offersFor = id => OFFERS[id] || [];

  function trace(o) {
    const d = D(), ev = [];
    o.log.forEach(l => ev.push({ t: l.t, k: /Fail|Declin|Return|closed|Cancel/i.test(l.e) ? 'bad' : 'status', title: l.e, sub: l.s }));
    offersFor(o.id).forEach(x => ev.push({ t: x.t, k: x.out === 'Accepted' ? 'ok' : x.out === 'Open' ? 'wait' : 'bad',
      title: 'Offered to ' + x.who + (x.out === 'Open' ? '' : ' — ' + x.out.toLowerCase()), sub: x.sub }));
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
        out.push('<div class="tlgap"><span>' + dur(mn(e.t) - prev) + ' with no status pushed</span></div>');
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

  /* settlement — the payable side of the same per-order record */
  const ADJ = {
    'DX-40998': [{ t: 'Return leg at 50%', a: -8.0, why: 'Failed delivery returned to Kanz Market', by: 'Dash · contract rule' }],
    'DX-41099': [{ t: 'Late delivery penalty', a: -4.5, why: 'Promise of 15:22 missed by 26 min', by: 'Dash · SLA rule' }],
    'DX-41061': [{ t: 'Waiting time', a: 6.0, why: '18 min held at reception', by: 'Sahel Logistics · approved by Dash' }]
  };

  function settle(o) {
    const d = D(), km = +(2.4 + ((o.id.charCodeAt(4) * 7) % 54) / 10).toFixed(1);
    const base = 12, rate = 1.1;
    const gross = o.revenue || 0;
    const network = o.source === 'Network';
    const commission = network ? +(gross * d.BILLING.commission).toFixed(2) : 0;
    const adjustments = ADJ[o.id] || [];
    const adj = adjustments.reduce((s, x) => s + x.a, 0);
    let state = DONE.includes(o.status) && gross ? 'Ready' : 'Unsettled';
    if (['DX-41055', 'DX-40951'].includes(o.id)) state = 'Settled';
    if (o.id === 'DX-40998') state = 'Disputed';
    if (!gross) state = '—';
    return { km, base, rate, gross, commission, adjustments, adj,
      payable: +(gross - commission + adj).toFixed(2),
      priced: network ? 'Dash Network rate card' : 'Your contract with ' + (d.merchant(o.merchant) || {}).name,
      cod: o.cod || 0,
      codState: o.cod ? (o.status === 'Delivered' ? 'Collected by your driver · you owe the merchant' : 'With your driver') : 'Cash free',
      state, dispute: o.id === 'DX-40998' ? 'Open — you contest the 50% return leg, Kanz Market raised a ticket' : '—',
      period: DONE.includes(o.status) ? 'SP-2026-W35' : 'SP-2026-W36' };
  }

  const PERIODS = [
    { id: 'SP-2026-W36', label: '1 – 7 Sep 2026', state: 'Unsettled', orders: 184, gross: 3722.4, commission: 118.2, adj: -22.5, cod: 940, closes: 'Closes 7 Sep 23:59' },
    { id: 'SP-2026-W35', label: '25 – 31 Aug 2026', state: 'Ready', orders: 296, gross: 5988.0, commission: 191.6, adj: -34.0, cod: 1480, closes: 'Payout Sunday 30 Aug' },
    { id: 'SP-2026-W34', label: '18 – 24 Aug 2026', state: 'Disputed', orders: 271, gross: 5482.2, commission: 175.4, adj: -68.5, cod: 1320, closes: 'Held pending dispute' },
    { id: 'SP-2026-W33', label: '11 – 17 Aug 2026', state: 'Settled', orders: 258, gross: 5219.4, commission: 167.0, adj: -12.0, cod: 1188, closes: 'Paid 20 Aug' }
  ];
  const SETTLE_STATE = { Unsettled: '#FFEE50', Ready: '#C0D2FF', Settled: '#1f8a4c', Disputed: '#FCA38B', '—': '#c9c9c9' };
  const net = p => +(p.gross - p.commission + p.adj).toFixed(2);

  /* integration health — the 3PL's own API connection into Dash */
  const CONNS = [
    { n: 'Order intake', k: 'Dash → your OMS webhook', s: 'Connected', last: '25 s ago', err: null, fails: 0, hook: '200 OK · 96 ms average' },
    { n: 'Status push', k: 'Your OMS → Dash API', s: 'Error', last: 'Today 15:22', err: 'Your last 26 status calls were rejected — the signing key on your side no longer matches', fails: 26, hook: 'Rejected · 401' },
    { n: 'Proof of delivery upload', k: 'Your OMS → Dash API', s: 'Connected', last: '11 min ago', err: 'Yesterday · one photo over the 5 MB limit', fails: 1, hook: '201 Created · 340 ms' },
    { n: 'Driver location feed', k: 'Your OMS → Dash API', s: 'Degraded', last: '4 min ago', err: 'Positions arriving every 4 min instead of every 30 s', fails: 0, hook: '200 OK · intermittent' }
  ];
  const FAILED = [
    { t: '15:22', o: 'DX-41096', x: 'SAHEL-77214', e: 'Status "Picked up" rejected — 401, signing key mismatch', fix: 'This is why the order looks stuck to Dash and to Almasa Foods' },
    { t: '15:14', o: 'DX-41088', x: 'SAHEL-77208', e: 'Status "In transit" rejected — 401, signing key mismatch', fix: 'Retried and accepted at 15:52' },
    { t: 'Yesterday 21:40', o: 'DX-40951', x: 'SAHEL-77171', e: 'Proof photo rejected — 6.2 MB, limit is 5 MB', fix: 'Resend under 5 MB or the order stays without proof' }
  ];

  return { NOW, POLICY, sla, slaTag, trace, traceHTML, offersFor, settle, PERIODS, SETTLE_STATE, net,
    CONNS, FAILED, mn, hm, dur, DONE };
})();

/* ================= screens ================= */
(function () {
  const U = UI, D = () => window.TPL, X = () => window.TDEEP;
  STATE.st = STATE.st || { state: 'All states', period: 'SP-2026-W35' };
  const fg = (l, c) => '<span class="f-g"><span class="f-l">' + l + '</span>' + c + '</span>';

  SCREENS['settlement'] = {
    title: 'Settlement', epic: 'Epic 16 · Settlement', ro: true,
    render() {
      const d = D(), f = STATE.st, X_ = X();
      const recs = d.ORDERS.map(o => ({ o, s: X_.settle(o) })).filter(r => r.s.state !== '—');
      const states = ['Unsettled', 'Ready', 'Settled', 'Disputed'];
      const shown = recs.filter(r => f.state === 'All states' || r.s.state === f.state);
      const sum = st => recs.filter(r => r.s.state === st).reduce((a, r) => a + r.s.payable, 0);
      const cards = '<div class="scards">' + states.map(st => {
        const n = recs.filter(r => r.s.state === st).length;
        return '<button type="button" class="scard ' + (f.state === st ? 'on' : '') + '" data-act="stState" data-arg="' + st + '" style="--sc:' + X_.SETTLE_STATE[st] + '">' +
          '<span class="scard-s">' + st + '</span><span class="scard-v">' + U.money(sum(st)) + '</span>' +
          '<span class="scard-f">' + n + ' order' + (n === 1 ? '' : 's') + ' · ' +
          ({ Unsettled: 'still accruing this period', Ready: 'closed and waiting for payout', Settled: 'paid to your account', Disputed: 'held until the dispute closes' }[st]) + '</span></button>';
      }).join('') + '</div>';

      return U.page('Settlement',
        'What Dash owes you, order by order. The same record the merchant and Dash read',
        U.btn('Download statement', { kind: 'primary', act: 'export', arg: 'SP-2026-W35 statement' }) +
        U.btn('Billing and payouts', { act: 'go', arg: '/billing' })) +
        U.mode('ro', 'You cannot change a number on this screen. Rates come from your contracts, commission from your Dash plan, and penalties from the SLA — dispute a line rather than editing it.') +
        cards +
        U.filters([
          fg('State', U.select(['All states'].concat(states), f.state, { act: 'stF', arg: 'state' })),
          fg('Period', U.select(X_.PERIODS.map(p => p.id + ' · ' + p.label), f.period + ' · ' + (X_.PERIODS.find(p => p.id === f.period) || {}).label, { act: 'stF', arg: 'period' })),
          '<span class="f-sp"></span><span class="f-c">' + shown.length + ' orders shown</span>',
          f.state !== 'All states' ? U.btn('Show all states', { act: 'stState', arg: 'All states' }) : ''
        ]) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Per-order payable', U.table(
              [{ t: 'Order' }, { t: 'Merchant' }, { t: 'Priced by' }, { t: 'Rate applied', num: true }, { t: 'Dash commission', num: true },
               { t: 'Adjustments', num: true }, { t: 'Payable to you', num: true }, { t: 'COD held', num: true }, { t: 'State' }],
              shown.map(r => ({ act: 'tSettle', arg: r.o.id, cells: [
                '<b>' + r.o.id + '</b>', U.esc(d.merchant(r.o.merchant).name),
                '<em class="sub">' + U.esc(r.s.priced) + '</em>',
                U.money(r.s.gross),
                r.s.commission ? '<b style="color:#b0432a">−' + U.money(r.s.commission) + '</b>' : '<em class="sub">None</em>',
                r.s.adj ? '<b style="color:' + (r.s.adj < 0 ? '#b0432a' : '#1f8a4c') + '">' + (r.s.adj < 0 ? '−' : '+') + U.money(Math.abs(r.s.adj)) + '</b>' : '—',
                '<b>' + U.money(r.s.payable) + '</b>',
                r.s.cod ? U.money(r.s.cod) : '—',
                U.tag(r.s.state, X_.SETTLE_STATE[r.s.state], { solid: r.s.state !== 'Settled' })] }))), { pad: false })}
            ${U.panel('Settlement periods', U.table(
              [{ t: 'Cycle' }, { t: 'Range' }, { t: 'Orders', num: true }, { t: 'Gross', num: true }, { t: 'Commission', num: true },
               { t: 'Adjustments', num: true }, { t: 'Net payout', num: true }, { t: 'COD you owe merchants', num: true }, { t: 'State' }, { t: '', w: '190px' }],
              X_.PERIODS.map(p => ({ cells: ['<b>' + p.id + '</b>', p.label, p.orders, U.money(p.gross),
                '<b style="color:#b0432a">−' + U.money(p.commission) + '</b>',
                '<b style="color:#b0432a">' + U.money(p.adj) + '</b>',
                '<b>' + U.money(X_.net(p)) + '</b>', U.money(p.cod),
                U.tag(p.state, X_.SETTLE_STATE[p.state], { solid: p.state !== 'Settled' }),
                '<div class="rowact">' + U.btn('Statement', { act: 'tStatement', arg: p.id }) +
                  U.btn('Download', { act: 'export', arg: p.id + ' statement' }) + '</div>'] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Which way the money runs', U.defs([
              ['Orders you carried', 'Dash pays you — the rate applied less the 8% commission on Network work. It makes no difference whether the order came from a direct merchant of yours or from another Network participant.'],
              ['Overflow you sent out', 'You pay Dash. Handing an order to the Network makes you the customer for that delivery, priced on the Network rate card.'],
              ['Your own contract work', 'Priced between you and the merchant. Dash takes a platform fee and stays out of it.'],
              ['On your statement', 'Both directions net against each other before payout — one figure, with every order behind it.']]))}
            ${U.panel('Cash your drivers collected', U.defs([
              ['Collected today', U.money(285)],
              ['Owed to merchants', U.money(285)],
              ['Still with drivers', U.money(135)],
              ['How it settles', 'Netted off your payout on the statement']]) +
              U.note('This money is not yours.', 'Your driver collected it for the merchant. Dash records it so a shortfall is visible before payout, not after.', d.PAL.peach))}
            ${U.panel('Disputes', '<div class="mlist">' + (recs.filter(r => r.s.state === 'Disputed').map(r =>
              '<button type="button" class="ml warn" data-act="tSettle" data-arg="' + r.o.id + '">' +
              '<span class="ml-h"><b>' + r.o.id + '</b>' + U.tag('Disputed', d.PAL.tang, { solid: true }) + '</span>' +
              '<span class="ml-s">' + U.esc(r.s.dispute) + '</span></button>').join('') ||
              '<div class="empty">No open disputes.</div>') + '</div>', { pad: false })}
            ${U.panel('Penalties charged to you', U.table([{ t: 'Order' }, { t: 'Reason' }, { t: 'Amount', num: true }],
              recs.flatMap(r => r.s.adjustments.filter(a => a.a < 0).map(a => ({ act: 'tSettle', arg: r.o.id,
                cells: ['<b>' + r.o.id + '</b>', U.esc(a.why), '<b style="color:#b0432a">−' + U.money(Math.abs(a.a)) + '</b>'] })))), { pad: false,
              right: '<span class="ph-note">Every penalty traces to an SLA breach or a contract rule</span>' })}
          </div>
        </div>`;
    }
  };
})();

/* ================= actions ================= */
(function () {
  const U = UI, D = () => window.TPL, X = () => window.TDEEP;
  const R = () => window.RENDER();
  Object.assign(window.ACT, {
    tTrace: id => {
      const d = D(), o = d.order(id), s = X().sla(o), st = X().settle(o);
      const dr = o.driver ? d.driver(o.driver) : null, of = X().offersFor(id);
      U.drawer('<b>' + id + '</b> — order trace', [
        '<div class="dw-meta">' + U.esc(d.merchant(o.merchant).name) + ' · ' + o.zone + ' → ' + U.esc(o.addr) + '</div>',
        '<div class="slahead">' + X().slaTag(s.state) + U.statusTag(o.status) +
          '<span class="slahead-m">Ageing ' + X().dur(s.age) + ' · promised ' + s.promisedDelivery +
          (s.state === 'Late' ? ' · ' + X().dur(s.over) + ' over' : '') + '</span></div>',
        U.defs([
          ['Merchant', U.esc(d.merchant(o.merchant).name) + ' <em class="sub">' + d.merchant(o.merchant).rel + '</em>'],
          ['Your driver', dr ? U.esc(dr.name) + ' · ' + U.esc(dr.vehicle) : '<em class="sub">Your system has not assigned one</em>'],
          ['Source', d.SOURCES[o.source] + ' · ' + o.type],
          ['Your reference', o.ref === '—' ? '<em class="sub">Never pulled into your OMS</em>' : '<code>' + U.esc(o.ref) + '</code>'],
          ['Promised pickup', s.promisedPickup + ' <em class="sub">· ' + s.src + '</em>'],
          ['Payable', st.state === '—' ? 'Nothing earned' : U.money(st.payable) + ' · ' + st.state],
          ['Status freshness', o.stuck ? '<em class="warn">Your OMS has pushed nothing for ' + o.stuck + ' min</em>' : 'Last push accepted']
        ]),
        '<div class="sub-h">Lifecycle</div>',
        X().traceHTML(o),
        '<div class="sub-h">Offer attempts</div>',
        of.length ? '<div class="offers">' + of.map((f, i) =>
          '<div class="of o-' + f.out.toLowerCase().replace(/\s/g, '') + '"><span class="of-n">' + (i + 1) + '</span>' +
          '<div><b>' + U.esc(f.who) + '</b><em>' + U.esc(f.sub) + '</em></div>' +
          '<span class="of-o">' + f.out + '</span><span class="of-t">' + f.t + '</span></div>').join('') + '</div>' +
          U.note('You can see where the order went, not why.', 'Dash shows you every offer on an order you were in line for. Which of Rehla Fleet’s drivers refused it is theirs, not yours.', D().PAL.lav)
          : U.note('No offer chain on this order.', 'A Direct order comes straight to you by name — Dash never shopped it around.', D().PAL.peach),
        o.stuck ? U.note('Dash thinks this order is stuck.', 'It is not: your driver is moving. Your status pushes are being rejected — check the connection health on Developer.', D().PAL.tang) : ''
      ].join(''), { footer:
        (o.status === 'Received' ? U.btn('Accept in your OMS', { kind: 'primary', act: 'acceptOrder', arg: id }) : '') +
        U.btn('Settlement record', { act: 'tSettle', arg: id }) +
        U.btn('Raise a ticket', { act: 'ticketFor', arg: id }) +
        U.btn('Open order', { act: 'go', arg: '/orders/' + id }) });
    },
    stF: (a, el) => { STATE.st[a] = a === 'period' ? el.value.split(' · ')[0] : el.value; R(); },
    stState: s => { STATE.st.state = s; R(); },
    tSettle: id => {
      const d = D(), o = d.order(id), s = X().settle(o);
      U.drawer('Settlement — <b>' + id + '</b>', [
        '<div class="dw-meta">' + U.esc(s.priced) + ' · period ' + s.period + '</div>',
        '<div class="slahead">' + U.tag(s.state, X().SETTLE_STATE[s.state], { solid: s.state !== 'Settled' }) +
          '<span class="slahead-m">One record — the merchant sees the receivable side of it</span></div>',
        U.defs([
          ['Rate applied', U.money(s.gross) + ' <em class="sub">' + s.priced + '</em>'],
          ['Dash commission', s.commission ? '−' + U.money(s.commission) + ' <em class="sub">' + Math.round(d.BILLING.commission * 100) + '% on Network orders only</em>' : 'None — this is your own merchant'],
          ['Adjustments', s.adj ? (s.adj < 0 ? '−' : '+') + U.money(Math.abs(s.adj)) : 'None'],
          ['Payable to you', '<b>' + U.money(s.payable) + '</b>'],
          ['Cash on delivery', s.cod ? U.money(s.cod) + ' <em class="sub">' + s.codState + '</em>' : 'Cash free'],
          ['Settlement period', s.period],
          ['Dispute', U.esc(s.dispute)]
        ]),
        '<div class="sub-h">Adjustments</div>',
        s.adjustments.length ? U.table([{ t: 'Adjustment' }, { t: 'Amount', num: true }, { t: 'Reason' }, { t: 'Applied by' }],
          s.adjustments.map(a => ({ cells: ['<b>' + U.esc(a.t) + '</b>',
            '<b style="color:' + (a.a < 0 ? '#b0432a' : '#1f8a4c') + '">' + (a.a < 0 ? '−' : '+') + U.money(Math.abs(a.a)) + '</b>',
            U.esc(a.why), U.esc(a.by)] })))
          : '<div class="empty">No adjustments on this order.</div>'
      ].join(''), { footer:
        (s.state === 'Disputed' ? U.btn('Withdraw dispute', { kind: 'primary', act: 'stub', arg: 'Dispute withdrawn — the order returns to Ready' })
          : U.btn('Dispute this line', { kind: 'primary', act: 'stub', arg: 'Dispute opened — the line is held out of payout while Dash reviews it' })) +
        U.btn('Order trace', { act: 'tTrace', arg: id }) +
        U.btn('Open order', { act: 'go', arg: '/orders/' + id }) });
    },
    tStatement: pid => {
      const p = X().PERIODS.find(x => x.id === pid);
      U.drawer('Statement — <b>' + p.id + '</b>', [
        '<div class="dw-meta">' + p.label + ' · ' + p.closes + '</div>',
        U.defs([['State', U.tag(p.state, X().SETTLE_STATE[p.state], { solid: p.state !== 'Settled' })],
          ['Orders', p.orders], ['Gross revenue', U.money(p.gross)],
          ['Dash commission', '<b style="color:#b0432a">−' + U.money(p.commission) + '</b>'],
          ['Adjustments and penalties', '<b style="color:#b0432a">' + U.money(p.adj) + '</b>'],
          ['Net payout to you', '<b>' + U.money(X().net(p)) + '</b>'],
          ['COD you owe merchants', U.money(p.cod)]])
      ].join(''), { footer: U.btn('Download statement', { kind: 'primary', act: 'export', arg: p.id + ' statement' }) +
        U.btn('Billing and payouts', { act: 'go', arg: '/billing' }) });
    }
  });
})();
