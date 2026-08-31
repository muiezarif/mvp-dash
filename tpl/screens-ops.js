/* Dash 3PL — read-only operations: Dashboard (04), Orders (05), Live Map (06),
   Driver profiles (07), Customer profiles (08) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.TPL;
  window.STATE = window.STATE || {};
  STATE.of = STATE.of || { status: 'All statuses', source: 'All sources', merchant: 'All merchants', zone: 'All zones', q: '' };

  const liveO = () => D().ORDERS.filter(o => ['Received','Accepted','Picked up','In transit'].includes(o.status));
  const srcPill = s => {
    const c = { Marketplace: D().PAL.vodka, Network: D().PAL.lav, Direct: D().PAL.peach }[s];
    return `<span class="src"><i style="background:${c}"></i>${s === 'Network' ? 'Dash Network' : s}</span>`;
  };

  /* ---------------- 04 Dashboard ---------------- */
  SCREENS['dashboard'] = {
    title: 'Dashboard', epic: 'Epic 04', ro: true,
    render() {
      const d = D();
      const done = d.ORDERS.filter(o => o.status === 'Delivered');
      const lost = d.ORDERS.filter(o => ['Returned','Cancelled','Declined'].includes(o.status));
      return U.page('Dashboard', `${d.BIZ.name} · orders that reached you through Dash · today, Saturday 29 August`,
        U.btn('View orders', { act: 'go', arg: '/orders' }) + U.btn('Network roles', { act: 'go', arg: '/network' })) +
        U.mode('ro', 'These are Dash orders only. Your own direct business lives in ' + U.esc(d.BIZ.ownSystem) + ' and never appears here.') + `
        <div class="oms">
          <div class="oms-c"><b>${U.esc(d.BIZ.ownSystem)} — your system</b>
            <em>Dispatch, drivers, routing, payroll. You run all of it. Dash does not touch any of it.</em></div>
          <div class="oms-a">⇄</div>
          <div class="oms-c dash"><b>Dash — this window</b>
            <em>Orders arrive by API, you fulfil them in your OMS, statuses flow back. Plus the commercial layer for merchants you win here.</em></div>
        </div>
        <div class="kpis" style="margin-top:12px">
          ${U.kpi('Active Dash orders', liveO().length, '1 waiting for you to accept', d.PAL.lemon)}
          ${U.kpi('Completed today', done.length + 44, 'On time 92% · 4 late', d.PAL.flax)}
          ${U.kpi('Avg delivery time', '36<span class="of">min</span>', 'On Dash orders only', d.PAL.vodka)}
          ${U.kpi('Completion rate', '93%', 'Target 95% — Zone North drags it', d.PAL.lav)}
          ${U.kpi('Revenue today', U.money(374), U.money(d.BILLING.earnedMonth) + ' this month', d.PAL.peach)}
          ${U.kpi('Lost orders', lost.length, 'Returned, cancelled or declined', d.PAL.tang)}
        </div>
        <div class="cols c-2-1">
          ${U.panel('Orders and revenue, last 7 days', `
            <div class="wk big">${d.REPORTS.week.map(w => `<div class="wk-c">
              <span class="wk-b" style="height:${w.orders / 70 * 100}%;background:${w.onTime < 92 ? d.PAL.tang : d.PAL.lav}"></span>
              <span class="wk-l">${w.d}</span><span class="wk-v">${w.orders}</span></div>`).join('')}</div>
            <div class="legend">${U.dot(d.PAL.lav)}On time 92%+ ${U.dot(d.PAL.tang)}Below · revenue ${U.money(d.REPORTS.week.reduce((s, w) => s + w.rev, 0))} this week</div>
            <div class="sub-h">Where these orders came from</div>
            <div class="zonebars">
              ${[['Marketplace', 814, d.PAL.vodka, 'Merchants you won on Dash — your pricing'],
                 ['Dash Network', 186, d.PAL.lav, 'Routed to you as Supply — Dash pricing'],
                 ['Direct', 14, d.PAL.peach, 'Merchants who picked you specifically']].map(([n, v, c, why]) =>
                `<div class="zb"><span>${n}</span>${U.bar(v / 900 * 100, c)}<em>${v} orders · ${why}</em></div>`).join('')}
            </div>`, { right: `<span class="ph-note">Epic 04</span>` })}
          ${U.panel('Needs attention', `<div class="alerts">${d.NOTIFS.filter(n => n.sev !== 'low').map(n => `
            <a class="alert s-${n.sev}" href="${n.link}"><span class="alert-k">${n.k}</span>
              <span class="alert-t">${U.esc(n.t)}</span><span class="alert-d">${n.d}</span></a>`).join('')}</div>`,
            { pad: false, right: U.btn('All', { act: 'go', arg: '/notifications' }) })}
        </div>
        <div class="cols c-1-1">
          ${U.panel('Performance by merchant', U.table(
            [{ t: 'Merchant' }, { t: 'Relationship' }, { t: 'Orders', num: true }, { t: 'On time', w: '120px' }, { t: 'Avg', num: true }, { t: 'Revenue', num: true }],
            d.MERCHANTS.filter(m => m.orders).map(m => ({ act: 'go', arg: '/merchants/' + m.id, cells: [
              `<b>${U.esc(m.name)}</b>`,
              U.tag(m.rel, m.rel === 'Commercial' ? d.PAL.vodka : d.PAL.lav),
              m.orders, `${m.onTime}% ${U.bar(m.onTime, m.onTime >= 92 ? d.PAL.lav : d.PAL.tang)}`,
              m.avgMin + 'm', U.money(m.revenue)] }))))}
          ${U.panel('Earnings overview', `
            <div class="split">
              <span class="split-r" style="--p:${Math.round((1 - d.BILLING.commission) * 100)}"><s>${Math.round((1 - d.BILLING.commission) * 100)}%</s></span>
              <div><b style="font-size:13px">You keep ${Math.round((1 - d.BILLING.commission) * 100)}% of Network revenue</b>
                <div class="mono" style="font:500 11px ui-monospace,Menlo,monospace;color:#6B6B6B;margin-top:4px">Dash takes ${Math.round(d.BILLING.commission * 100)}% commission on Dash Network orders only. Marketplace orders are billed at your own contract price — Dash takes nothing.</div></div>
            </div>
            <div class="hr" style="height:1px;background:#EFEFEF;margin:13px 0"></div>
            ${U.defs([
              ['Earned this month', U.money(d.BILLING.earnedMonth)],
              ['Marketplace revenue', U.money(12820) + ' <em class="sub">your contracts, no commission</em>'],
              ['Network revenue', U.money(d.NETWORK.supply.revenue) + ' <em class="sub">less 8% commission</em>'],
              ['Overflow cost', '− ' + U.money(d.NETWORK.demand.cost) + ' <em class="sub">what you paid others</em>'],
              ['Next payout', U.esc(d.BILLING.payoutNext) + ' → ' + U.esc(d.BILLING.payoutMethod)]
            ])}
            <div class="btnrow">${U.btn('Billing and payouts', { act: 'go', arg: '/billing' })}</div>`)}
        </div>`;
    }
  };

  /* ---------------- 05 Orders (read only) ---------------- */
  SCREENS['orders'] = {
    title: 'Orders', epic: 'Epic 05', ro: true,
    render() {
      const d = D(), f = STATE.of;
      const rows = d.ORDERS.filter(o =>
        (f.status === 'All statuses' || o.status === f.status) &&
        (f.source === 'All sources' || (f.source === 'Dash Network' ? o.source === 'Network' : o.source === f.source)) &&
        (f.merchant === 'All merchants' || d.merchant(o.merchant).name === f.merchant) &&
        (f.zone === 'All zones' || o.zone === f.zone) &&
        (!f.q || (o.id + ' ' + o.ref + ' ' + d.merchant(o.merchant).name).toLowerCase().includes(f.q.toLowerCase())));
      return U.page('Orders', 'Everything Dash sent you — you fulfil it in ' + U.esc(d.BIZ.ownSystem),
        U.btn('Export CSV', { act: 'export', arg: 'orders' }) + U.btn('Export PDF', { act: 'export', arg: 'orders-pdf' })) +
        U.mode('ro', 'You cannot create, edit or reassign an order here. Statuses arrive from your own system over the API.') + `
        <div class="kpis k-4">
          ${U.kpi('Marketplace', d.ORDERS.filter(o => o.source === 'Marketplace').length, 'Your merchants, your pricing', d.PAL.vodka)}
          ${U.kpi('Dash Network', d.ORDERS.filter(o => o.source === 'Network').length, 'Supply role · Dash pricing', d.PAL.lav)}
          ${U.kpi('Direct', d.ORDERS.filter(o => o.source === 'Direct').length, 'Merchant chose you specifically', d.PAL.peach)}
          ${U.kpi('Cash on delivery', d.ORDERS.filter(o => o.cod).length, U.money(d.ORDERS.reduce((s, o) => s + o.cod, 0)) + ' across them', d.PAL.flax)}
        </div>
        ${U.filters([
          U.input(f.q, 'Search Dash id, your reference or merchant…', { act: 'ofQ' }),
          `<span class="f-l">Status</span>` + U.select(['All statuses', ...Object.keys(d.STATUS)], f.status, { act: 'ofF', arg: 'status' }),
          `<span class="f-l">Source</span>` + U.select(['All sources', 'Marketplace', 'Dash Network', 'Direct'], f.source, { act: 'ofF', arg: 'source' }),
          `<span class="f-l">Merchant</span>` + U.select(['All merchants', ...d.MERCHANTS.filter(m => m.orders).map(m => m.name)], f.merchant, { act: 'ofF', arg: 'merchant' }),
          `<span class="f-l">Zone</span>` + U.select(['All zones', 'Zone East', 'Zone South', 'Zone Central', 'Zone North', 'Zone West'], f.zone, { act: 'ofF', arg: 'zone' }),
          `<span class="f-sp"></span><span class="f-c">${rows.length} of ${d.ORDERS.length}</span>`,
          U.btn('Reset', { act: 'ofReset' })
        ])}
        ${U.panel('', U.table(
          [{ t: 'Dash id' }, { t: 'Your reference' }, { t: 'Merchant' }, { t: 'Source' }, { t: 'Zone' }, { t: 'Type' },
           { t: 'Driver' }, { t: 'Status' }, { t: 'COD', num: true }, { t: 'Revenue', num: true }, { t: 'Created' }, { t: 'ETA' }],
          rows.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
            `<b>${o.id}</b>`, o.ref === '—' ? '<em class="sub">Never pulled</em>' : `<code>${U.esc(o.ref)}</code>`,
            U.esc(d.merchant(o.merchant).name), srcPill(o.source), o.zone, o.type,
            o.driver ? U.esc(d.driver(o.driver).name) : '—', U.statusTag(o.status),
            o.cod ? U.money(o.cod) : '—', o.revenue ? U.money(o.revenue) : '—', o.created, o.eta] }))), { pad: false })}`;
    }
  };

  /* ---------------- Order detail ---------------- */
  SCREENS['order'] = {
    title: 'Order', epic: 'Epic 05', ro: true,
    render(id) {
      const d = D(), o = d.order(id);
      if (!o) return U.page('Order not found', '');
      const m = d.merchant(o.merchant), c = d.customer(o.customer), dr = o.driver ? d.driver(o.driver) : null;
      const step = d.STATUS[o.status].step;
      return U.page(o.id, `${U.esc(m.name)} · ${o.source === 'Network' ? 'Dash Network' : o.source} · ${o.zone}`,
        (o.status === 'Received' ? U.btn('Accept in your OMS', { kind: 'primary', act: 'acceptOrder', arg: o.id }) + U.btn('Decline', { kind: 'danger', act: 'declineOrder', arg: o.id }) : '') +
        U.btn('Waybill', { act: 'waybill', arg: o.id }) +
        U.btn('Raise a ticket', { act: 'ticketFor', arg: o.id }) +
        U.btn('Back to orders', { act: 'go', arg: '/orders' })) +
        (o.status === 'Received'
          ? U.mode('rw', 'Accepting or declining is the one action you take on a Dash order. Everything after it happens in ' + U.esc(d.BIZ.ownSystem) + '.')
          : U.mode('ro', 'Read only. This record mirrors what your own system reported back to Dash.')) + `
        <div class="flowbar" style="grid-template-columns:repeat(4,1fr)">
          ${d.FLOW.map((s, i) => `<div class="fb ${step >= i + 1 ? 'done' : ''} ${step === i + 1 ? 'now' : ''}">
            <span class="fb-d"></span><span class="fb-l">${s}</span>
            <span class="fb-t">${(o.log.find(l => l.e.toLowerCase().includes(s.toLowerCase())) || {}).t || (step >= i + 1 ? '' : '—')}</span></div>`).join('')}
        </div>
        ${step < 0 ? U.note(o.status + '.', U.esc(o.log[o.log.length - 1].e) + ' — ' + U.esc(o.log[o.log.length - 1].s || 'no note'), d.PAL.tang) : ''}
        ${o.status === 'Received' ? U.note('Dash Network is waiting on you.',
          'Declining costs you nothing and does not affect future offers — but the clock is running and Dash will offer it elsewhere.', d.PAL.lemon) : ''}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Order', U.defs([
              ['Status', U.statusTag(o.status)],
              ['Dash id', `<code>${o.id}</code>`],
              ['Your reference', o.ref === '—' ? '<em class="sub">Not pulled into your system</em>' : `<code>${U.esc(o.ref)}</code>`],
              ['Source', srcPill(o.source) + ' <em class="sub">' + (o.source === 'Marketplace' ? 'Your own merchant — priced by your contract' : o.source === 'Network' ? 'Routed to you as Supply — priced by Dash' : 'The merchant asked for you by name') + '</em>'],
              ['Type', o.type + (o.type === 'Scheduled' ? ' · slot ' + o.eta : '')],
              ['Zone', o.zone],
              ['Items', U.esc(o.items)],
              ['Cash on delivery', o.cod ? U.money(o.cod) + ' <em class="sub">your driver collects it; you settle with the merchant</em>' : 'Cash free'],
              ['Proof required', o.pod.map(p => U.tag(p, d.PAL.flax)).join(' ')],
              ['Your revenue', o.revenue ? U.money(o.revenue) + (o.source === 'Network' ? ' <em class="sub">less 8% Dash commission</em>' : ' <em class="sub">your contract price, no commission</em>') : 'Nothing earned'],
              ['Instructions', o.instr ? U.esc(o.instr) : '—']
            ]))}
            ${U.panel('Route', `<div class="route">
              <div class="rt"><span class="rt-d" style="background:${d.PAL.peach}"></span>
                <div><b>Pickup — ${U.esc(m.name)}</b><em>${o.zone}</em></div></div>
              <div class="rt-line"></div>
              <div class="rt"><span class="rt-d" style="background:${d.PAL.vodka}"></span>
                <div><b>Drop-off — ${U.esc(o.addr)}</b><em>${U.esc(c.name)} · ${U.esc(c.phone)}</em></div></div>
            </div><div class="minimap"><div class="lf" id="omap2"></div></div>`, { pad: false })}
            ${U.panel('History', `<div class="log">${o.log.map(l =>
              `<div class="lg"><span class="lg-t">${l.t}</span><span class="lg-e"><b>${U.esc(l.e)}</b>${l.s ? `<em>${U.esc(l.s)}</em>` : ''}</span></div>`).join('')}</div>`, { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Your driver', dr ? `
              <div class="who lg">${U.avatar(dr.name)}<span><b>${U.esc(dr.name)}</b><em>${U.esc(dr.vehicle)} · ${U.esc(dr.phone)}</em></span></div>
              ${U.defs([['On Dash orders', dr.orders], ['Completion', dr.completion + '%'], ['Avg delivery', dr.avgMin + ' min'], ['Flagged', dr.flagged ? U.tag('Yes', d.PAL.tang, { solid: true }) : 'No']])}
              ${U.note('Assigned in your system, not here.', 'Dash learned this name from the status your OMS pushed back.', d.PAL.lav)}
              <div class="btnrow">${U.btn('Driver profile', { act: 'go', arg: '/drivers/' + dr.id })}</div>`
              : '<div class="empty">No driver — your system has not assigned one yet.</div>')}
            ${U.panel('Merchant', U.defs([
              ['Name', `<a href="#/merchants/${m.id}">${U.esc(m.name)}</a>`],
              ['Relationship', U.tag(m.rel, m.rel === 'Commercial' ? d.PAL.vodka : d.PAL.lav)],
              ['Pricing', m.contract ? U.esc(m.contract.pricing) : '<em class="sub">Dash prices Network orders</em>'],
              ['Terms', m.contract ? m.contract.terms : '—']
            ]))}
            ${U.panel('Customer', U.defs([
              ['Name', `<a href="#/customers/${c.id}">${U.esc(c.name)}</a>` + (c.flagged ? ' ' + U.tag('Flagged', d.PAL.tang, { solid: true }) : '')],
              ['Phone', U.esc(c.phone)], ['Orders through Dash', c.orders], ['Success rate', c.success + '%']
            ]) + U.note('Not your customer.', 'They belong to ' + U.esc(m.name) + '. This profile exists so your dispatchers know what to expect at the door.', d.PAL.peach))}
          </div>
        </div>`;
    },
    mount(id) { MAP.build('omap2', { only: id }); }
  };

  /* ---------------- 05 · 06 Control Tower — one live operations screen ----------------
     Read only by design. Nothing here changes the state of an order: acceptance,
     assignment and cancellation all happen in the 3PL's own system and reach Dash
     through the API. The only action is opening an order's full detail. */
  const CT_DEF = { view:'List', city:'All cities', district:'All districts',
    status:'All statuses', merchant:'All merchants', source:'All sources', type:'All types' };
  STATE.ct = STATE.ct || Object.assign({}, CT_DEF);

  const fg = (label, control) =>
    '<span class="f-g"><span class="f-l">' + label + '</span>' + control + '</span>';
  const ctDirty = () => Object.keys(CT_DEF).some(k => k !== 'view' && STATE.ct[k] !== CT_DEF[k]);
  const geo = z => (D().ZONE_GEO[z] || ['Riyadh', '—']);

  function ctFilter(list) {
    const d = D(), f = STATE.ct;
    return list.filter(o => {
      const g = geo(o.zone);
      if (f.city !== 'All cities' && g[0] !== f.city) return false;
      if (f.district !== 'All districts' && g[1] !== f.district) return false;
      if (f.status !== 'All statuses' && o.status !== f.status) return false;
      if (f.merchant !== 'All merchants' && d.merchant(o.merchant).name !== f.merchant) return false;
      if (f.source !== 'All sources' && d.SOURCES[o.source] !== f.source) return false;
      if (f.type !== 'All types' && o.type !== f.type) return false;
      return true;
    });
  }

  /* alerts inform — they carry no resolution path on this screen */
  function ctAlerts() {
    const d = D(), a = [];
    ctFilter(d.ORDERS).forEach(o => {
      if (o.noResponse)
        a.push({ p:0, k:'Not accepted', t:o.id + ' — the response window closed before your system accepted it. Dash is rerouting.' });
      if (o.late)
        a.push({ p:1, k:'Running late', t:o.id + ' passed its ' + o.eta + ' delivery time · ' + d.driver(o.driver).name + (o.cod ? ' · COD ' + U.money(o.cod) : '') });
      if (o.stuck)
        a.push({ p:2, k:'Stuck', t:o.id + ' — your system has pushed no status for ' + o.stuck + ' min' });
      if (o.status === 'Returned')
        a.push({ p:3, k:'Failed delivery', t:o.id + ' failed and was returned to ' + d.merchant(o.merchant).name + ' · return leg at 50%' });
    });
    return a.sort((x, y) => x.p - y.p);
  }

  SCREENS['control-tower'] = {
    title: 'Control tower', epic: 'Epics 05 · 06', ro: true,
    render() {
      const d = D(), f = STATE.ct;
      const all = ctFilter(liveO());
      const pending = all.filter(o => o.status === 'Received');
      const flight = all.filter(o => o.status !== 'Received');
      const alerts = ctAlerts();

      const cityOpts = ['All cities'].concat(d.CITIES);
      const pairs = Object.keys(d.ZONE_GEO).map(z => d.ZONE_GEO[z]);
      const distOpts = ['All districts'].concat([...new Set(pairs
        .filter(g => f.city === 'All cities' || g[0] === f.city).map(g => g[1]))].sort());

      const srcColor = s => ({ Marketplace: d.PAL.vodka, Network: d.PAL.lav, Direct: d.PAL.peach }[s]);

      const mapView =
        '<div class="ctmap"><div class="mapwrap"><div class="lf" id="tmap"></div>' +
          '<div class="maplegend"><span>' + U.dot(d.PAL.vodka) + 'Marketplace</span><span>' + U.dot(d.PAL.lav) + 'Network</span>' +
            '<span>' + U.dot(d.PAL.peach) + 'Direct</span><span class="sep"></span><span>' + U.dot('#FFEE50') + 'Driver</span></div>' +
          '<div class="maptools">' + U.toggle(true, 'mapLayer', 'orders', 'Routes') +
            U.toggle(true, 'mapLayer', 'drivers', 'Drivers') + '</div>' +
        '</div></div>';

      const cols = ['Received', 'Accepted', 'Picked up', 'In transit'];
      const listView = '<div class="board">' + cols.map(st => {
        const items = all.filter(o => o.status === st);
        return '<div class="bcol"><div class="bcol-h">' + U.statusTag(st) + '<em>' + items.length + '</em></div>' +
          '<div class="bcol-b">' + (items.map(o =>
            '<button type="button" class="bcard ' + (o.late || o.stuck || o.noResponse ? 'warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
              '<span class="bc-h"><b>' + o.id + '</b>' + U.tag(d.SOURCES[o.source], srcColor(o.source)) + '</span>' +
              '<span class="bc-m">' + U.esc(d.merchant(o.merchant).name) + ' · ' + o.zone + '</span>' +
              '<span class="bc-m">' + (o.driver ? U.esc(d.driver(o.driver).name) : '<em class="sub">Not accepted yet</em>') + '</span>' +
              '<span class="bc-f"><em>' + (o.elapsed || '0m') + ' elapsed</em><em>ETA ' + o.eta + '</em></span>' +
            '</button>').join('') || '<div class="bcol-e">—</div>') + '</div></div>';
      }).join('') + '</div>';

      const strip = alerts.length
        ? '<section class="astrip"><div class="astrip-h"><b>Worth knowing</b><em>' + alerts.length + '</em>' +
          '<span class="astrip-ro">Informational — resolve these in ' + U.esc(d.BIZ.ownSystem) + '</span></div>' +
          '<div class="astrip-b">' + alerts.map(x =>
            '<div class="astrip-i p' + x.p + ' ro"><span class="astrip-k">' + x.k + '</span>' +
            '<span class="astrip-t">' + U.esc(x.t) + '</span></div>').join('') +
          '</div></section>'
        : U.note('Nothing worth flagging.', 'Every active Dash order is moving and inside its window.', '#1f8a4c');

      const vtog = '<div class="vtog">' +
        '<button type="button" class="vt ' + (f.view === 'Map' ? 'on' : '') + '" data-act="ctView" data-arg="Map">Map</button>' +
        '<button type="button" class="vt ' + (f.view === 'List' ? 'on' : '') + '" data-act="ctView" data-arg="List">List</button>' +
      '</div>';

      const centre = U.panel(f.view === 'Map' ? 'Live map' : 'Live board',
        f.view === 'Map' ? mapView : listView,
        { pad: false, right: '<span class="ph-note">' + all.length + ' active</span>' + vtog });

      const flightPanel = U.panel('In flight',
        '<div class="mlist">' + (['Accepted', 'Picked up', 'In transit']
          .filter(st => flight.some(o => o.status === st)).map(st =>
          '<div class="dgrp">' + st + '<em>' + flight.filter(o => o.status === st).length + '</em></div>' +
          flight.filter(o => o.status === st).map(o =>
            '<button type="button" class="ml ' + (o.late || o.stuck ? 'warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
              '<span class="ml-h"><b>' + o.id + '</b><em class="el">' + (o.elapsed || '0m') + '</em></span>' +
              '<span class="ml-s">' + U.esc(d.driver(o.driver).name) + ' · ' + U.esc(d.merchant(o.merchant).name) + '</span>' +
              '<span class="ml-s">' + U.tag(d.SOURCES[o.source], srcColor(o.source)) + ' ' + o.zone + ' · ETA ' + o.eta + '</span>' +
            '</button>').join('')).join('') || '<div class="empty">Nothing in flight.</div>') + '</div>',
        { pad: false, right: '<span class="ph-note">' + flight.length + ' moving</span>' });

      /* deliberately inert: no buttons, no hover, nothing that reads as a tap target */
      const pendPanel = U.panel('Awaiting acceptance',
        '<div class="rolist">' + (pending.map(o =>
          '<div class="ro-i ' + (o.noResponse ? 'warn' : '') + '">' +
            '<div class="ro-h"><b>' + o.id + '</b>' + U.tag(d.SOURCES[o.source], srcColor(o.source)) +
              '<em class="el">' + (o.elapsed || '0m') + '</em></div>' +
            '<div class="ro-s">' + U.esc(d.merchant(o.merchant).name) + ' · ' + o.zone + ' · ' + U.esc(o.items) + '</div>' +
            '<div class="ro-s">' + (o.noResponse
              ? '<em class="warn">Window closed — Dash is rerouting</em>'
              : 'Offered ' + o.created + ' · your system has not accepted it yet') + '</div>' +
          '</div>').join('') || '<div class="empty">Nothing waiting.</div>') + '</div>' +
        '<div class="ro-foot">Acceptance happens in ' + U.esc(d.BIZ.ownSystem) + ' over the API. There is nothing to press here — this panel only shows what Dash has offered.</div>',
        { pad: false, right: '<span class="ph-note">' + pending.length + ' offered</span>' });

      return U.page('Control tower', 'What is happening with your Dash work right now') +
        U.mode('ro', 'Read only. Nothing on this screen changes an order — assignment and acceptance live in ' + U.esc(d.BIZ.ownSystem) + ', and positions here are inferred from the statuses your system reports. Dash does not track your vehicles.') +
        strip +
        U.filters([
          fg('City', U.select(cityOpts, f.city, { act: 'ctF', arg: 'city' })),
          fg('District', U.select(distOpts, f.district, { act: 'ctF', arg: 'district' })),
          fg('Status', U.select(['All statuses', 'Received', 'Accepted', 'Picked up', 'In transit'], f.status, { act: 'ctF', arg: 'status' })),
          fg('Merchant', U.select(['All merchants'].concat(d.MERCHANTS.map(m => m.name)), f.merchant, { act: 'ctF', arg: 'merchant' })),
          fg('Type', U.select(['All types', 'On demand', 'Scheduled'], f.type, { act: 'ctF', arg: 'type' })),
          '<span class="f-sp"></span><span class="f-c">' + all.length + ' active</span>',
          ctDirty() ? U.btn('Clear filters', { act: 'ctReset' }) : ''
        ]) +
        /* source gets its own row — the three carry different commercial terms */
        '<div class="srcrow"><span class="srcrow-l">Order source</span>' +
          ['All sources', 'Marketplace', 'Dash Network', 'Direct'].map(sv => {
            const key = Object.keys(d.SOURCES).find(k => d.SOURCES[k] === sv);
            const n = sv === 'All sources' ? ctFilter(liveO().filter(() => true)).length
              : liveO().filter(o => o.source === key).length;
            return '<button type="button" class="srcb ' + (f.source === sv ? 'on' : '') + '" data-act="ctF2" data-arg="source|' + sv + '"' +
              (sv === 'All sources' ? '' : ' style="--sc:' + srcColor(key) + '"') + '>' +
              (sv === 'All sources' ? '' : '<i></i>') + sv + '<em>' + n + '</em></button>';
          }).join('') +
          '<span class="srcrow-n">Each source carries different commercial terms — margin, return charges and who you invoice.</span>' +
        '</div>' +
        '<div class="ctgrid">' + centre + '<div class="ctrail">' + flightPanel + pendPanel + '</div></div>';
    },
    mount() {
      if (STATE.ct.view !== 'Map') return;
      const orders = ctFilter(liveO());
      MAP.build('tmap', { orders: orders,
        fit: ctDirty() ? orders.flatMap(o => [o.pickup, o.drop]) : null });
    }
  };

  /* ---------------- 07 Driver profiles ---------------- */
  SCREENS['drivers'] = {
    title: 'Drivers', epic: 'Epic 07', ro: true,
    render() {
      const d = D();
      return U.page('Driver profiles', 'Built automatically from the orders your system reported',
        U.btn('Export CSV', { act: 'export', arg: 'drivers' })) +
        U.mode('ro', 'Dash never created these records — every field below was derived from order data. You cannot add or edit a driver here; do it in ' + U.esc(d.BIZ.ownSystem) + '. Flagging is the one thing you can set.') + `
        <div class="kpis k-4">
          ${U.kpi('Drivers seen on Dash', d.DRIVERS.length, 'Of your 180 — the rest never took a Dash order', d.PAL.lav)}
          ${U.kpi('Avg completion', Math.round(d.DRIVERS.reduce((s, x) => s + x.completion, 0) / d.DRIVERS.length) + '%', 'On Dash orders only', d.PAL.flax)}
          ${U.kpi('Flagged', d.DRIVERS.filter(x => x.flagged).length, 'Raised with your operations team', d.PAL.tang)}
          ${U.kpi('Late deliveries', d.DRIVERS.reduce((s, x) => s + x.late, 0), 'Across all Dash orders', d.PAL.peach)}
        </div>
        ${d.DRIVERS.filter(x => x.flagged).map(x => `<div class="flagbar">
          <b>${U.esc(x.name)} is flagged.</b><span>${U.esc(x.flagNote)} Flags stay inside Dash — they are a note to yourself, not a report to the merchant.</span></div>`).join('')}
        ${U.panel('', U.table(
          [{ t: 'Driver' }, { t: 'Vehicle' }, { t: 'Dash orders', num: true }, { t: 'Completion', w: '120px' },
           { t: 'Avg delivery', num: true }, { t: 'Cancellation', num: true }, { t: 'Late', num: true }, { t: 'First seen' }, { t: 'Last seen' }, { t: 'Flag', w: '150px' }],
          d.DRIVERS.map(x => ({ cells: [
            `<div class="who">${U.avatar(x.name)}<span>${U.esc(x.name)}<em>${U.esc(x.phone)}</em></span></div>`,
            U.esc(x.vehicle), x.orders,
            `${x.completion}% ${U.bar(x.completion, x.completion >= 95 ? d.PAL.lav : d.PAL.tang)}`,
            x.avgMin + 'm', x.cancel + '%', x.late, x.first, x.last,
            `<div class="rowact">${U.btn(x.flagged ? 'Unflag' : 'Flag', { kind: x.flagged ? '' : 'danger', act: 'flagDriver', arg: x.id })}${U.btn('Open', { act: 'go', arg: '/drivers/' + x.id })}</div>`] }))), { pad: false })}`;
    }
  };

  SCREENS['driver'] = {
    title: 'Driver', epic: 'Epic 07', ro: true,
    render(id) {
      const d = D(), x = d.driver(id);
      if (!x) return U.page('Driver not found', '');
      const orders = d.ORDERS.filter(o => o.driver === x.id);
      return U.page(x.name, `${U.esc(x.vehicle)} · ${U.esc(x.phone)} · first Dash order ${x.first}`,
        U.btn(x.flagged ? 'Remove flag' : 'Flag this driver', { kind: x.flagged ? '' : 'danger', act: 'flagDriver', arg: x.id }) +
        U.btn('Back to drivers', { act: 'go', arg: '/drivers' })) +
        U.mode('ro', 'Auto generated from order data. Contact details came through with the statuses your system pushed.') + `
        ${x.flagged ? `<div class="flagbar"><b>Flagged.</b><span>${U.esc(x.flagNote)}</span></div>` : ''}
        <div class="kpis k-4">
          ${U.kpi('Dash orders', x.orders, 'Since ' + x.first, d.PAL.lav)}
          ${U.kpi('Completion rate', x.completion + '%', 'Your average 93%', d.PAL.flax)}
          ${U.kpi('Avg delivery', x.avgMin + '<span class="of">min</span>', 'Your average 36 min', d.PAL.vodka)}
          ${U.kpi('Cancellation rate', x.cancel + '%', 'Your average 2.3%', d.PAL.tang)}
        </div>
        <div class="cols c-1-1">
          ${U.panel('What Dash knows', U.defs([
            ['Name', U.esc(x.name)], ['Contact', U.esc(x.phone)], ['Vehicle', U.esc(x.vehicle)],
            ['First Dash order', x.first], ['Last Dash order', x.last],
            ['Late deliveries', x.late + ' of ' + x.orders],
            ['Flag', x.flagged ? U.tag('Flagged', d.PAL.tang, { solid: true }) : 'Not flagged']
          ]))}
          ${U.panel('What Dash does not know', `${U.defs([
            ['Employment', 'Contract, salary, shift — all in your system'],
            ['Their other work', 'Non-Dash orders never appear here'],
            ['Availability', 'Dash cannot see whether they are on shift'],
            ['Location', 'Only inferred from order status timestamps']
          ])}${U.note('This is a mirror, not a record.', 'If this driver leaves your company, the profile stays as history and simply stops updating.', d.PAL.lav)}`)}
        </div>
        ${U.panel('Dash orders they handled', U.table(
          [{ t: 'Order' }, { t: 'Merchant' }, { t: 'Source' }, { t: 'Status' }, { t: 'Revenue', num: true }, { t: 'Created' }],
          orders.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
            `<b>${o.id}</b>`, U.esc(d.merchant(o.merchant).name), srcPill(o.source),
            U.statusTag(o.status), o.revenue ? U.money(o.revenue) : '—', o.created] }))), { pad: false })}`;
    }
  };

  /* ---------------- 08 Customer profiles ---------------- */
  SCREENS['customers'] = {
    title: 'Customers', epic: 'Epic 08', ro: true,
    render() {
      const d = D();
      return U.page('Customer profiles', 'The people your drivers met on Dash orders',
        U.btn('Export CSV', { act: 'export', arg: 'customers' })) +
        U.mode('ro', 'These are the merchants’ customers, not yours. Dash builds the profile so your dispatchers know what to expect; flagging is the one field you own.') + `
        <div class="kpis k-4">
          ${U.kpi('Profiles', d.CUSTOMERS.length + 486, 'Seen on at least one Dash order', d.PAL.lav)}
          ${U.kpi('Flagged', d.CUSTOMERS.filter(c => c.flagged).length, 'Refused or unreachable repeatedly', d.PAL.tang)}
          ${U.kpi('Avg success rate', Math.round(d.CUSTOMERS.reduce((s, c) => s + c.success, 0) / d.CUSTOMERS.length) + '%', 'Delivered first attempt', d.PAL.flax)}
          ${U.kpi('Across merchants', 5, 'A customer can reach you through several', d.PAL.vodka)}
        </div>
        ${U.panel('', U.table(
          [{ t: 'Customer' }, { t: 'Phone' }, { t: 'Orders through Dash', num: true }, { t: 'Success', w: '130px' },
           { t: 'Reached you via' }, { t: 'Last order' }, { t: 'Flag', w: '140px' }, { t: 'Note' }],
          d.CUSTOMERS.map(c => ({ cells: [
            `<div class="who sm">${U.avatar(c.name)}<span>${U.esc(c.name)}</span></div>`, U.esc(c.phone), c.orders,
            `${c.success}% ${U.bar(c.success, c.success < 90 ? d.PAL.tang : d.PAL.lav)}`,
            U.esc(c.merchants), U.esc(c.last),
            `<div class="rowact">${U.btn(c.flagged ? 'Unflag' : 'Flag', { kind: c.flagged ? '' : 'danger', act: 'flagCustomer', arg: c.id })}</div>`,
            c.note ? U.esc(c.note) : '<em class="sub">—</em>'] }))), { pad: false })}
        ${U.note('A flag is a private warning.', 'It shows on the order your driver sees. It is never sent to the customer, and the merchant keeps their own separate flag.', d.PAL.peach)}`;
    }
  };
})();
