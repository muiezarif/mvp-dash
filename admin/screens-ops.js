/* Dash Admin — Platform dashboard (03), Global control tower (07) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.ADM;
  window.STATE = window.STATE || {};
  STATE.gf = STATE.gf || { client: 'All clients', source: 'All sources', status: 'All statuses', zone: 'All zones', product: 'All products', scope: 'All orders', q: '' };

  const live = () => D().ORDERS.filter(o => !['Delivered','Cancelled','Returned'].includes(o.status));
  const stuck = () => D().ORDERS.filter(o => o.stuck > 0);
  const srcTag = s => U.tag(s === 'Network' ? 'Dash Network' : s,
    s === 'Network' ? D().PAL.vodka : s === 'Marketplace' ? D().PAL.lav : D().PAL.peach);

  /* ---------------- 03 Platform dashboard ---------------- */
  SCREENS['dashboard'] = {
    title: 'Platform', epic: 'Epic 03',
    render() {
      const d = D(), p = d.PLATFORM;
      const bad = p.health.filter(h => h.state !== 'Healthy');
      return U.page('Platform dashboard', 'Every product, every client, every order — Saturday 30 August, 15:48',
        U.btn('Global control tower', { kind: 'primary', act: 'go', arg: '/control-tower' }) + U.btn('Network monitor', { act: 'go', arg: '/network-monitor' })) + `
        <div class="kpis">
          ${U.kpi('Orders today', p.orders.today.toLocaleString(), p.orders.month.toLocaleString() + ' this month', d.PAL.peach)}
          ${U.kpi('Active right now', p.orders.active, stuck().length + ' stuck or unfulfilled', d.PAL.lemon)}
          ${U.kpi('Active clients', 195, '164 merchants · 19 DMS · 12 3PL', d.PAL.lav)}
          ${U.kpi('Active supply', 435, '412 freelancers · 14 DMS · 9 3PL', d.PAL.vodka)}
          ${U.kpi('Monthly recurring revenue', U.money(d.REVENUE.mrr), 'Subscriptions and commission', d.PAL.flax)}
          ${U.kpi('Network margin', U.money(d.REVENUE.margin), d.REVENUE.marginPct + '% on ' + d.REVENUE.networkOrders.toLocaleString() + ' orders', '#1f8a4c')}
        </div>
        ${bad.length ? U.note('Integration health.', bad.map(h => `<b>${U.esc(h.i)}</b> at ${h.errors}% errors across ${h.clients} clients`).join(', ') + '. Errors here surface as missing orders inside client dashboards. ' + U.btn('Client list', { act: 'go', arg: '/clients' }), d.PAL.tang) : ''}
        <div class="cols c-2-1">
          ${U.panel('Volume by source channel', `
            <div class="zonebars">${d.PLATFORM.bySource.map(s => `
              <div class="zb"><span>${U.tag(s.s === 'Dash Network' ? 'Dash Network' : s.s, s.s === 'Dash Network' ? d.PAL.vodka : s.s === 'Marketplace' ? d.PAL.lav : d.PAL.peach)}</span>
                ${U.bar(s.share, s.s === 'Dash Network' ? d.PAL.vodka : s.s === 'Marketplace' ? d.PAL.lav : d.PAL.peach)}
                <em>${s.orders.toLocaleString()} · ${s.share}% · ${U.esc(s.note)}</em></div>`).join('')}</div>
            ${U.note('Order source is a first-class attribute.', 'It is set at creation, visible in every product, and it drives reconciliation — who bills whom, and whether Dash takes a margin.', d.PAL.vodka)}
            <div class="sub-h">Volume by product</div>
            <div class="zonebars">${p.byProduct.map(x => `
              <div class="zb"><span>${U.esc(x.p)}</span>${U.bar(x.share, d.PAL.peach)}<em>${x.orders.toLocaleString()} orders · ${x.clients} clients</em></div>`).join('')}</div>
            <div class="sub-h">Growth</div>
            <div class="wk big">${p.growth.map(g => `<div class="wk-c">
              <span class="wk-b" style="height:${g.orders / 56000 * 100}%;background:${d.PAL.lav}"></span>
              <span class="wk-l">${g.m}</span><span class="wk-v">${g.clients}</span></div>`).join('')}</div>
            <div class="legend">Bar height is monthly orders · number above is client count</div>`,
            { right: `<span class="ph-note">Epic 03</span>` })}
          ${U.panel('Internal alerts', `<div class="alerts">${d.NOTIFS.filter(n => n.sev !== 'low').map(n => `
            <a class="alert s-${n.sev}" href="${n.link}"><span class="alert-k">${n.k}</span>
              <span class="alert-t">${U.esc(n.t)}</span><span class="alert-d">${n.d}</span></a>`).join('')}</div>`,
            { pad: false, right: U.btn('All', { act: 'go', arg: '/notifications' }) })}
        </div>
        <div class="cols c-1-1">
          ${U.panel('Merchant distribution by integration type', U.table(
            [{ t: 'Integration' }, { t: 'Clients', num: true }, { t: 'Share', w: '170px' }],
            p.byIntegration.map(x => ({ cells: [U.esc(x.i), x.n, `${Math.round(x.n / 192 * 100)}% ${U.bar(x.n / 74 * 100, d.PAL.lav)}`] }))), { pad: false })}
          ${U.panel('Integration health across the platform', U.table(
            [{ t: 'Integration' }, { t: 'Clients', num: true }, { t: 'Error rate', num: true }, { t: 'State' }],
            p.health.map(h => ({ cells: [U.esc(h.i), h.clients, h.errors + '%',
              U.tag(h.state, h.state === 'Healthy' ? '#1f8a4c' : d.PAL.tang, { solid: h.state !== 'Healthy' })] }))), { pad: false })}
        </div>`;
    }
  };

  /* ---------------- 07 Global control tower — one live operations screen ----------------
     Visibility and authority are not the same thing. Dash sees every order; Dash acts
     only on Dash Network orders, where it is the owner. That boundary is visible on the
     row and on the map pin, never discovered by clicking a dead button. */
  const CT_DEF = { view:'List', client:'All clients', ctype:'All client types',
    city:'Riyadh', district:'All districts', zone:'All zones', status:'All statuses',
    source:'All sources', type:'All types', by:'All providers', q:'' };
  STATE.ct = STATE.ct || Object.assign({}, CT_DEF);

  const fg = (label, control) =>
    '<span class="f-g"><span class="f-l">' + label + '</span>' + control + '</span>';
  /* the view toggle is not a filter — switching Map/List must not claim otherwise */
  const ctDirty = () => Object.keys(CT_DEF).filter(k => k !== 'view')
    .some(k => STATE.ct[k] !== CT_DEF[k]);
  const geo = z => (D().ZONE_GEO[z] || ['Riyadh', '—']);
  const clientType = n => { const c = D().CLIENTS.find(x => x.name === n); return c ? c.type : 'Merchant'; };

  function ctFilter(list) {
    const d = D(), f = STATE.ct;
    return list.filter(o => {
      const g = geo(o.zone);
      if (f.client !== 'All clients' && o.merchant !== f.client) return false;
      if (f.ctype !== 'All client types' && clientType(o.merchant) !== f.ctype) return false;
      if (f.city !== 'All cities' && g[0] !== f.city) return false;
      if (f.district !== 'All districts' && g[1] !== f.district) return false;
      if (f.zone !== 'All zones' && o.zone !== f.zone) return false;
      if (f.status !== 'All statuses' && o.status !== f.status) return false;
      if (f.source !== 'All sources' && (f.source === 'Dash Network' ? o.source !== 'Network' : o.source !== f.source)) return false;
      if (f.type !== 'All types' && o.type !== f.type) return false;
      if (f.by !== 'All providers' && o.provider !== f.by) return false;
      if (f.q && !(o.id + ' ' + o.merchant + ' ' + o.customer).toLowerCase().includes(f.q.toLowerCase())) return false;
      return true;
    });
  }

  /* Two tiers, and the design must not blur them. The first is Dash's queue.
     The second is Dash knowing what is happening to its clients. */
  function ctAlerts() {
    const d = D(), act = [], obs = [];
    ctFilter(d.ORDERS).forEach(o => {
      const dash = o.scope === 'dash';
      const bucket = dash ? act : obs;
      const push = (p, k, t) => bucket.push({ p, k, t, o: o.id, dash });
      if (o.offline) push(0, 'Went offline', o.id + ' — ' + o.offline + ' has sent no location for 11 min');
      if (o.noResponse) push(0, 'Not accepted', o.id + ' — offered to ' + o.provider + ', response window closed');
      if (!dash && o.stuck) push(1, 'Stuck', o.id + ' — ' + o.stuck + ' min without movement at ' + o.provider);
      if (dash && o.stuck) push(1, 'Stuck', o.id + ' — ' + o.stuck + ' min without movement · ' + (o.provider === '—' ? 'no provider took it' : o.provider));
      if (o.failed) push(1, 'Failed delivery', o.id + ' failed at the door — awaiting a decision');
      if (o.late) push(2, 'Late', o.id + ' passed its ' + o.eta + ' delivery time · ' + o.merchant);
      if (dash && o.provider === '—' && !o.stuck) push(2, 'Unassigned', o.id + ' has no provider and is past its window');
    });
    const by = (x, y) => x.p - y.p;
    return { act: act.sort(by), obs: obs.sort(by) };
  }

  SCREENS['control-tower'] = {
    title: 'Global control tower', epic: 'Epic 07',
    render() {
      const d = D(), f = STATE.ct;
      const all = ctFilter(live());
      const alerts = ctAlerts();
      const dashQueue = all.filter(o => o.scope === 'dash' &&
        (o.stuck || o.provider === '—' || o.noResponse || o.failed || o.offline || o.status === 'Routing'));
      const flight = all.filter(o => dashQueue.indexOf(o) < 0);

      const cityOpts = ['All cities'].concat(d.CITIES);
      const zonePairs = Object.keys(d.ZONE_GEO);
      const distOpts = ['All districts'].concat([...new Set(zonePairs
        .filter(z => f.city === 'All cities' || geo(z)[0] === f.city).map(z => geo(z)[1]))].sort());
      const zoneOpts = ['All zones'].concat(zonePairs.filter(z =>
        (f.city === 'All cities' || geo(z)[0] === f.city) &&
        (f.district === 'All districts' || geo(z)[1] === f.district)));

      const mapView =
        '<div class="ctmap"><div class="mapwrap"><div class="lf" id="gmap"></div>' +
          '<div class="maplegend"><span>' + U.dot(d.PAL.vodka) + 'Network</span><span>' + U.dot(d.PAL.lav) + 'Marketplace</span>' +
            '<span>' + U.dot(d.PAL.peach) + 'Direct</span><span class="sep"></span><span>' + U.dot(d.PAL.tang) + 'Stuck</span>' +
            '<span class="sep"></span><span class="shp"><i class="sq"></i>Dash can act</span><span class="shp"><i class="ci"></i>Owner only</span></div>' +
          '<div class="maptools">' + U.toggle(true, 'mapLayer', 'orders', 'Orders') +
            U.toggle(true, 'mapLayer', 'stuck', 'Stuck') + '</div>' +
          '<div class="mapclust">Clustered by zone below street level — zoom in or click a cluster to resolve</div>' +
        '</div></div>';

      const cols = ['Awaiting provider', 'Routing', 'Assigned', 'Picked up', 'In transit', 'Stuck'];
      const listView = '<div class="board">' + cols.map(st => {
        const items = all.filter(o => o.status === st);
        return '<div class="bcol"><div class="bcol-h">' + U.statusTag(st) + '<em>' + items.length + '</em></div>' +
          '<div class="bcol-b">' + (items.map(o => {
            const dash = o.scope === 'dash';
            return '<button type="button" class="bcard ' + (dash ? 'sc-dash' : 'sc-owner') + (o.stuck || o.late || o.failed ? ' warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
              '<span class="bc-h"><b>' + o.id + '</b>' + srcTag(o.source) + '</span>' +
              '<span class="bc-m">' + U.esc(o.merchant) + ' · ' + o.zone + '</span>' +
              '<span class="bc-m">' + (o.provider === '—' ? '<em class="warn">No provider</em>' : U.esc(o.provider)) + '</span>' +
              '<span class="bc-f"><em class="' + (dash ? 'sc-y' : 'sc-n') + '">' + (dash ? 'Dash can act' : 'Owner only') + '</em>' +
                '<em>' + (o.stuck ? o.stuck + 'm stuck' : 'ETA ' + o.eta) + '</em></span>' +
            '</button>';
          }).join('') || '<div class="bcol-e">—</div>') + '</div></div>';
      }).join('') + '</div>';

      const stripFor = (list, kind) => list.length
        ? '<div class="astrip-b">' + list.map(x =>
            '<div class="astrip-i p' + x.p + (kind === 'obs' ? ' ro' : '') + '"><span class="astrip-k">' + x.k + '</span>' +
            '<span class="astrip-t">' + U.esc(x.t) + '</span>' +
            (kind === 'act'
              ? '<span class="astrip-a">' + U.btn('Open', { kind: 'primary', act: 'ctPick', arg: x.o }) +
                U.btn('Reassign', { act: 'reassign', arg: x.o }) + '</span>'
              : '<span class="astrip-a">' + U.btn('Ticket', { act: 'ticketFor', arg: x.o }) + '</span>') +
            '</div>').join('') + '</div>'
        : '<div class="astrip-none">Nothing here.</div>';

      const strip =
        '<div class="cols c-1-1 astrips">' +
          '<section class="astrip"><div class="astrip-h"><b>Dash must act</b><em>' + alerts.act.length + '</em>' +
            '<span class="astrip-ro">Dash Network orders — nobody else will fix these</span></div>' +
            stripFor(alerts.act, 'act') + '</section>' +
          '<section class="astrip obs"><div class="astrip-h"><b>Happening to clients</b><em>' + alerts.obs.length + '</em>' +
            '<span class="astrip-ro">Direct and Marketplace — reach out, do not reach in</span></div>' +
            stripFor(alerts.obs, 'obs') + '</section>' +
        '</div>';

      const vtog = '<div class="vtog">' +
        '<button type="button" class="vt ' + (f.view === 'Map' ? 'on' : '') + '" data-act="ctView" data-arg="Map">Map</button>' +
        '<button type="button" class="vt ' + (f.view === 'List' ? 'on' : '') + '" data-act="ctView" data-arg="List">List</button>' +
      '</div>';

      const centre = U.panel(f.view === 'Map' ? 'Platform map' : 'Live board',
        f.view === 'Map' ? mapView : listView,
        { pad: false, right: '<span class="ph-note">' + all.length + ' active · ' +
          all.filter(o => o.scope === 'dash').length + ' Dash can act</span>' + vtog });

      const queuePanel = U.panel('Network orders needing attention',
        '<div class="mlist">' + (dashQueue.map(o =>
          '<button type="button" class="ml sc-dash ' + (o.stuck || o.failed || o.offline ? 'warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
            '<span class="ml-h"><b>' + o.id + '</b><em class="el">' + (o.stuck ? o.stuck + 'm stuck' : (o.elapsed || '0m')) + '</em></span>' +
            '<span class="ml-s">' + U.esc(o.merchant) + ' · ' + o.zone + ' · ' + (o.provider === '—' ? '<em class="warn">no provider</em>' : U.esc(o.provider)) + '</span>' +
            '<span class="ml-s">' + (o.offline ? '<em class="warn">' + U.esc(o.offline) + ' offline</em>'
              : o.failed ? '<em class="warn">Failed — awaiting a decision</em>'
              : o.noResponse ? '<em class="warn">Not accepted in the window</em>'
              : o.provider === '—' ? '<em class="warn">Nobody has taken it</em>'
              : U.statusTag(o.status)) + '</span>' +
          '</button>').join('') || '<div class="empty">No Network order needs attention.</div>') + '</div>' +
        '<div class="q-foot">The only queue on this screen. Everything else here is observation — this is the work.</div>',
        { pad: false, right: '<span class="ph-note">' + dashQueue.length + ' to work</span>' });

      const flightPanel = U.panel('Live orders',
        '<div class="mlist">' + (['Routing','Assigned','Picked up','In transit','At delivery']
          .filter(st => flight.some(o => o.status === st)).map(st =>
          '<div class="dgrp">' + st + '<em>' + flight.filter(o => o.status === st).length + '</em></div>' +
          flight.filter(o => o.status === st).map(o =>
            '<button type="button" class="ml ' + (o.scope === 'dash' ? 'sc-dash' : 'sc-owner') + (o.late ? ' warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
              '<span class="ml-h"><b>' + o.id + '</b><em class="el">' + (o.elapsed || '0m') + '</em></span>' +
              '<span class="ml-s">' + U.esc(o.merchant) + ' · ' + U.esc(o.provider) + '</span>' +
              '<span class="ml-s">' + srcTag(o.source) + ' ' + o.zone + ' · ETA ' + o.eta + '</span>' +
            '</button>').join('')).join('') || '<div class="empty">Nothing else in flight.</div>') + '</div>',
        { pad: false, right: '<span class="ph-note">' + flight.length + ' watching</span>' });

      const supplyPanel = U.panel('Supply state',
        '<div class="supl">' + [
          ['Freelancer pool', 412, 268, d.PAL.vodka],
          ['DMS fleets', 14, 11, d.PAL.lav],
          ['3PLs', 9, 7, d.PAL.flax]
        ].map(([n, online, busy, c]) =>
          '<div class="sup"><span class="sup-n">' + n + '</span>' +
            U.bar(busy / online * 100, c) +
            '<em>' + online + ' online · ' + busy + ' busy · <b>' + (online - busy) + ' free</b></em></div>').join('') +
        '</div>' +
        '<div class="sub-h">By zone</div>' +
        '<div style="padding:0 13px 13px">' + d.NETWORK.monitor.zones.map(z =>
          '<div class="bal"><span>' + U.esc(z.z.split(' — ')[0]) + '</span>' +
            '<span class="bal-t"><i class="bal-d" style="width:' + (z.demand / 45 * 100) + '%"></i><i class="bal-s" style="width:' + (z.supply / 45 * 100) + '%"></i></span>' +
            '<span class="bal-n">' + U.tag(z.state, z.state === 'Healthy' ? '#1f8a4c' : z.state === 'Critical' ? d.PAL.tang : d.PAL.peach, { solid: z.state !== 'Healthy' }) + '</span></div>').join('') +
          '<div class="legend">' + U.dot(d.PAL.peach) + 'Demand ' + U.dot(d.PAL.lav) + 'Supply</div></div>');

      return U.page('Global control tower',
        'Every order on the platform — Dash sees all of it and acts on its own',
        U.btn('Network monitor', { act: 'go', arg: '/network-monitor' }) +
        U.btn('Export CSV', { act: 'export', arg: 'orders' })) +
        '<div class="cols c-1-1">' +
          U.mode('dash', 'Dash Network orders — ' + d.ORDERS.filter(o => o.scope === 'dash').length +
            ' here. The merchant handed these to the network, so nobody else is responsible. Assign, reassign, cancel and escalate are all live. Square pins on the map, black left edge in the list.') +
          U.mode('owner', 'Direct and Marketplace orders — ' + d.ORDERS.filter(o => o.scope === 'owner').length +
            ' here. A DMS client or 3PL owns the relationship. Dash reads the full history and can open a ticket with the client, but the operational buttons do not exist. Round pins, grey edge.') +
        '</div>' +
        strip +
        U.filters([
          U.input(f.q, 'Search order, client or customer…', { act: 'ctQ' }),
          fg('Client', U.select(['All clients'].concat([...new Set(d.ORDERS.map(o => o.merchant))]), f.client, { act: 'ctF', arg: 'client' })),
          fg('Client type', U.select(['All client types', 'Merchant', 'DMS client', '3PL'], f.ctype, { act: 'ctF', arg: 'ctype' })),
          fg('City', U.select(cityOpts, f.city, { act: 'ctF', arg: 'city' })),
          fg('District', U.select(distOpts, f.district, { act: 'ctF', arg: 'district' })),
          fg('Zone', U.select(zoneOpts, f.zone, { act: 'ctF', arg: 'zone' })),
          fg('Status', U.select(['All statuses'].concat(Object.keys(d.STATUS)), f.status, { act: 'ctF', arg: 'status' })),
          fg('Source', U.select(['All sources', 'Direct', 'Marketplace', 'Dash Network'], f.source, { act: 'ctF', arg: 'source' })),
          fg('Type', U.select(['All types', 'On demand', 'Scheduled'], f.type, { act: 'ctF', arg: 'type' })),
          fg('Fulfilled by', U.select(['All providers'].concat([...new Set(d.ORDERS.map(o => o.provider))].filter(p => p !== '—')), f.by, { act: 'ctF', arg: 'by' })),
          '<span class="f-sp"></span><span class="f-c">' + all.length + ' of ' + live().length + ' active</span>',
          ctDirty() ? U.btn('Clear filters', { act: 'ctReset' })
            : '<span class="f-c dim">Scoped to Riyadh — the platform default</span>'
        ]) +
        '<div class="ctgrid">' + centre + '<div class="ctrail">' + queuePanel + flightPanel + supplyPanel + '</div></div>';
    },
    mount() {
      if (STATE.ct.view !== 'Map') return;
      const orders = ctFilter(live());
      MAP.build('gmap', { orders: orders,
        fitZones: ctDirty() ? [...new Set(orders.map(o => o.zone))] : null });
    }
  };

  /* ---------------- Order detail with scope enforcement ---------------- */
  SCREENS['gorder'] = {
    title: 'Order', epic: 'Epic 07',
    render(id) {
      const d = D(), o = d.order(id);
      if (!o) return U.page('Order not found', '');
      const dash = o.scope === 'dash';
      return U.page(o.id, `${U.esc(o.merchant)} · ${U.esc(o.product)} · ${o.source === 'Network' ? 'Dash Network' : o.source} · ${o.zone}`,
        (dash
          ? U.btn('Reassign supply', { kind: 'primary', act: 'reassign', arg: o.id }) +
            U.btn('Escalate', { act: 'escalateOrder', arg: o.id }) +
            U.btn('Cancel order', { kind: 'danger', act: 'cancelOrder', arg: o.id })
          : U.btn('Escalate to the owner', { kind: 'primary', act: 'escalateOwner', arg: o.id }) +
            U.btn('Open a ticket', { act: 'ticketFor', arg: o.id })) +
        U.btn('Back to the tower', { act: 'go', arg: '/control-tower' })) +
        (dash
          ? U.mode('dash', 'Dash Network routed this order, so Dash owns the intervention. Reassigning picks a different supply node; the merchant sees continuity, not a failure.')
          : U.mode('owner', 'A ' + (o.source === 'Direct' ? 'direct' : 'Marketplace') + ' order between ' + U.esc(o.merchant) + ' and ' + U.esc(o.provider === '—' ? 'their chosen provider' : o.provider) + '. Dash is a spectator here — the buttons to reassign or cancel do not exist for us. Escalating notifies the owner and opens a ticket.')) + `
        ${o.stuck ? U.note('No movement for ' + o.stuck + ' minutes.',
          U.esc(o.log[o.log.length - 1].e) + ' — ' + U.esc(o.log[o.log.length - 1].s || 'no note') + '. '
          + (dash ? 'Dash can act on this now.' : 'Only ' + U.esc(o.merchant) + ' or ' + U.esc(o.provider) + ' can move it.'), d.PAL.tang) : ''}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Order', U.defs([
              ['Status', U.statusTag(o.status)],
              ['Intervention scope', U.scope(o.scope) + ' <em class="sub">' + (dash ? 'Reassign, cancel and escalate are all available' : 'Read only — escalate to the owner instead') + '</em>'],
              ['Source', srcTag(o.source) + ' <em class="sub">' + (o.source === 'Network' ? 'Routed by the engine — Dash chose the provider' : o.source === 'Marketplace' ? 'Merchant connected to this provider through a listing' : 'Merchant sent it straight to their own provider') + '</em>'],
              ['Client', `<a href="#/clients/${(d.CLIENTS.find(c => c.name === o.merchant) || {}).id || ''}">${U.esc(o.merchant)}</a>`],
              ['Product it lives in', U.esc(o.product)],
              ['Provider', o.provider === '—' ? '<em class="warn">None assigned</em>' : U.esc(o.provider)],
              ['Zone', o.zone], ['Customer', `<a href="#/customers">${U.esc(o.customer)}</a>`],
              ['Order value', o.value ? U.money(o.value) : '—'],
              ['Cash on delivery', o.cod ? U.money(o.cod) : 'Cash free'],
              ['Created', o.created], ['ETA', o.eta]
            ]))}
            ${U.panel('Full history', `<div class="log">${o.log.map(l =>
              `<div class="lg"><span class="lg-t">${l.t}</span><span class="lg-e"><b>${U.esc(l.e)}</b>${l.s ? `<em>${U.esc(l.s)}</em>` : ''}</span></div>`).join('')}</div>`, { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Who can do what', `<div class="states">
              ${[['Dash Admin', dash ? 'Reassign, cancel, escalate' : 'View and escalate only', dash],
                 [o.merchant, o.source === 'Network' ? 'Sees status only — Dash owns routing' : 'Cancel, reassign, contact the customer', o.scope === 'owner'],
                 [o.provider === '—' ? 'No provider yet' : o.provider, o.provider === '—' ? 'Nothing to do' : 'Accept, decline, fulfil, report proof', false],
                 ['The customer', 'Receives whatever the merchant chooses to tell them', false]].map(([who, can, hi]) =>
                `<div class="st ${hi ? 'on' : ''}"><b>${U.esc(who)}</b><em>${U.esc(can)}</em></div>`).join('')}
            </div>`, { pad: false })}
            ${dash ? U.panel('Supply candidates', `
              <div class="candidates">
                ${d.NETWORK.supply.filter(s => s.state === 'Active').map((s, i) => `
                  <div class="cand"><span class="cand-n">${i + 1}</span>
                    <div><b>${U.esc(s.name)}</b><em>${s.cat} · accepts ${s.accept}% · completes ${s.complete}%</em></div>
                    ${i === 0 ? U.tag('Best', d.PAL.lemon, { solid: true }) : ''}</div>`).join('')}
              </div>
              <div class="btnrow">${U.btn('Reassign now', { kind: 'primary', act: 'reassign', arg: o.id })}</div>`)
              : U.panel('Escalation', `${U.defs([
                  ['Goes to', U.esc(o.merchant) + ' and ' + U.esc(o.provider === '—' ? 'their provider' : o.provider)],
                  ['Creates', 'A ticket in Dash Support linked to this order'],
                  ['Dash cannot', 'Reassign, cancel, or contact the customer'],
                  ['Why', 'This is their commercial relationship. Dash intervening would break the contract they signed with each other.']
                ])}
                <div class="btnrow">${U.btn('Escalate to the owner', { kind: 'primary', act: 'escalateOwner', arg: o.id })}</div>`)}
          </div>
        </div>`;
    }
  };

})();
