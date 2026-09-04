/* Dash Merchant — Dashboard (05), Live Map (06), Control Tower (09), Branches (07) */
window.SCREENS = window.SCREENS || {};
window.STATE = window.STATE || {};
(function () {
  const U = UI, D = () => window.MER;
  const live = () => D().ORDERS.filter(o => !['Delivered','Cancelled','Returned'].includes(o.status));
  const waiting = () => D().ORDERS.filter(o => o.status === 'Awaiting provider');

  /* ---------------- 05 Dashboard ---------------- */
  SCREENS['dashboard'] = {
    title: 'Dashboard', epic: 'Epic 05',
    render() {
      const d = D();
      const done = d.ORDERS.filter(o => o.status === 'Delivered');
      const cancelled = d.ORDERS.filter(o => ['Cancelled','Returned'].includes(o.status));
      const topB = [...d.BRANCHES].sort((a, b) => b.onTime - a.onTime || a.avgMin - b.avgMin);
      return U.page('Dashboard', `${d.BIZ.name} · 4 branches · today, Saturday 29 August`,
        U.btn('Create order', { kind: 'primary', act: 'go', arg: '/create-order' }) + U.btn('Control tower', { act: 'go', arg: '/control-tower' })) + `
        <div class="kpis">
          ${U.kpi('Orders today', 96, '1,396 this month · 5,842 this year', d.PAL.peach)}
          ${U.kpi('Active now', live().length, `${waiting().length} still waiting for a provider`, d.PAL.lemon)}
          ${U.kpi('Completed today', done.length + 84, 'On time 94% · 5 late', d.PAL.flax)}
          ${U.kpi('Cancelled or returned', cancelled.length + 3, '1.4% of today — returns not charged', d.PAL.tang)}
          ${U.kpi('Avg delivery time', '34<span class="of">min</span>', 'Across all providers', d.PAL.vodka)}
          ${U.kpi('Spend today', U.money(1486), U.money(d.WALLET.monthSpend) + ' this month', d.PAL.lav)}        </div>
        <div class="cols c-2-1">
          ${U.panel('Orders and spend, last 7 days', `
            <div class="wk big">${d.REPORTS.week.map(w => `<div class="wk-c">
              <span class="wk-b" style="height:${w.orders / 280 * 100}%;background:${w.onTime < 93 ? d.PAL.tang : d.PAL.peach}"></span>
              <span class="wk-l">${w.d}</span><span class="wk-v">${w.orders}</span></div>`).join('')}</div>
            <div class="legend">${U.dot(d.PAL.peach)}On time 93%+ ${U.dot(d.PAL.tang)}Below target · spend ${U.money(d.REPORTS.week.reduce((s, w) => s + w.spend, 0))} this week</div>
            <div class="sub-h">Where today's orders came from</div>
            <div class="zonebars">${['Salla','Shopify','Kanz ERP','Manual entry'].map(src => {
              const n = { 'Salla': 52, 'Shopify': 21, 'Kanz ERP': 17, 'Manual entry': 6 }[src];
              return `<div class="zb"><span>${src}</span>${U.bar(n, d.PAL.lav)}<em>${n} orders</em></div>`; }).join('')}</div>`,
            { right: `<span class="ph-note">Epic 05</span>` })}
          ${U.panel('Needs attention', `<div class="alerts">${d.NOTIFS.filter(n => n.sev !== 'low').map(n => `
            <a class="alert s-${n.sev}" href="${n.link}"><span class="alert-k">${n.k}</span>
              <span class="alert-t">${U.esc(n.t)}</span><span class="alert-d">${n.d}</span></a>`).join('')}</div>`,
            { pad: false, right: U.btn('All notifications', { act: 'go', arg: '/notifications' }) })}
        </div>
        <div class="cols c-1-1">
          ${U.panel('Top performing branches', U.table(
            [{ t: 'Branch' }, { t: 'Live', num: true }, { t: 'On time', w: '120px' }, { t: 'Avg', num: true }, { t: 'Spend today', num: true }],
            topB.map(b => ({ act: 'go', arg: '/branches/' + b.id, cells: [
              `<b>${U.esc(b.name)}</b><em class="sub">${U.esc(b.mgr)}</em>`, b.orders,
              `${b.onTime}% ${U.bar(b.onTime, b.onTime >= 93 ? d.PAL.peach : d.PAL.tang)}`, b.avgMin + 'm', U.money(b.spend)] }))))}
          ${U.panel('Provider performance', U.table(
            [{ t: 'Provider' }, { t: 'Orders', num: true }, { t: 'On time', w: '120px' }, { t: 'Avg pickup', num: true }, { t: 'Spend', num: true }],
            d.PROVIDERS.filter(p => p.status === 'Connected').map(p => ({ act: 'go', arg: '/marketplace/' + p.id, cells: [
              `<b>${U.esc(p.name)}</b><em class="sub">${p.kind}</em>`,
              { p0: 412, p1: 786, p2: 198 }[p.id] || 0,
              `${p.onTime}% ${U.bar(p.onTime, p.onTime >= 93 ? d.PAL.vodka : d.PAL.tang)}`, p.avgPickup + 'm',
              U.money({ p0: 6420, p1: 12280, p2: 3160 }[p.id] || 0)] }))))}
        </div>`;
    }
  };

  /* ---------------- 06 · 09 Control Tower — one live operations screen ----------------
     Deliberately shallower than the DMS version: the merchant watches and escalates,
     they never dispatch. No assign, no reassign, no driver contact. */
  const CT_DEF = { view:'Map', city:'All cities', district:'All districts', branch:'All branches',
    status:'All statuses', provider:'All providers', type:'All types', source:'All sources',
    sla:'All SLA states', q:'' };
  STATE.ct = STATE.ct || Object.assign({}, CT_DEF);

  const fg = (label, control) =>
    '<span class="f-g"><span class="f-l">' + label + '</span>' + control + '</span>';
  const ctDirty = () => Object.keys(CT_DEF).some(k => k !== 'view' && STATE.ct[k] !== CT_DEF[k]);

  /* one predicate, both views */
  function ctFilter(list) {
    const d = D(), f = STATE.ct;
    return list.filter(o => {
      const b = d.branch(o.branch);
      if (f.city !== 'All cities' && b.city !== f.city) return false;
      if (f.district !== 'All districts' && b.district !== f.district) return false;
      if (f.branch !== 'All branches' && !f.branch.startsWith(b.code)) return false;
      if (f.status !== 'All statuses' && o.status !== f.status) return false;
      if (f.provider !== 'All providers') {
        if (f.provider === 'Not yet assigned') { if (o.provider) return false; }
        else if (!o.provider || d.prov(o.provider).name !== f.provider) return false;
      }
      if (f.type !== 'All types' && o.type !== f.type) return false;
      if (f.source !== 'All sources' && o.source !== f.source) return false;
      if (f.sla !== 'All SLA states' && MDEEP.sla(o).state !== f.sla) return false;
      if (f.q) {
        const q = f.q.toLowerCase();
        const hay = [o.id, o.ref, b.code, b.name, d.customer(o.customer).name, d.customer(o.customer).phone].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  const ctBranches = () => {
    const d = D(), f = STATE.ct;
    return d.BRANCHES.filter(b =>
      (f.city === 'All cities' || b.city === f.city) &&
      (f.district === 'All districts' || b.district === f.district) &&
      (f.branch === 'All branches' || f.branch.startsWith(b.code)));
  };

  /* alert strip — what the merchant needs to know, ordered by urgency */
  function ctAlerts() {
    const d = D(), a = [];
    ctFilter(d.ORDERS).forEach(o => {
      if (['Delivered','Cancelled','Returned'].includes(o.status)) return;
      const esc = U.btn('Escalate to Dash', { kind:'primary', act:'escalate', arg:o.id });
      const open = U.btn('Open', { act:'ctPick', arg:o.id });
      if (o.failed)
        a.push({ p:0, k:'Failed delivery', t:o.id + ' — nobody answered at the door, awaiting your decision',
          act:U.btn('Decide', { kind:'primary', act:'failedDecision', arg:o.id }) + open });
      if (o.fellThrough)
        a.push({ p:0, k:'Fell through', t:o.id + ' — ' + o.fellThrough + ' could not take it, fallback is running',
          act:esc + open });
      if (o.late)
        a.push({ p:1, k:'Running late', t:o.id + ' passed its ' + o.eta + ' delivery time' + (o.cod ? ' · COD ' + U.money(o.cod) : ''),
          act:esc + open });
      if (!o.provider && o.status === 'Awaiting provider')
        a.push({ p:1, k:'No provider', t:o.id + ' has had no provider for ' + (o.elapsed || '0m'),
          act:esc + open });
      if (o.stuck)
        a.push({ p:2, k:'Stuck', t:o.id + ' — no status update for ' + o.stuck + ' min',
          act:esc + open });
      if (o.type === 'Scheduled' && !o.driver)
        a.push({ p:3, k:'Scheduled', t:o.id + ' — slot ' + o.eta + ', a driver is named at ' + (o.assignAt || 'the window'),
          act:open });
    });
    return a.sort((x, y) => x.p - y.p);
  }

  SCREENS['control-tower'] = {
    title: 'Control tower', epic: 'Epics 06 · 09',
    render() {
      const d = D(), f = STATE.ct;
      const all = ctFilter(live());
      const waiting = all.filter(o => !o.provider || o.status === 'Awaiting provider');
      const flight = all.filter(o => o.provider && o.status !== 'Awaiting provider');
      const alerts = ctAlerts();

      const cityOpts = ['All cities'].concat(d.CITIES);
      const distPool = d.BRANCHES.filter(b => f.city === 'All cities' || b.city === f.city);
      const distOpts = ['All districts'].concat([...new Set(distPool.map(b => b.district))].sort());
      const brPool = distPool.filter(b => f.district === 'All districts' || b.district === f.district);
      const brOpts = ['All branches'].concat(brPool.map(b => b.code + ' — ' + b.name.split('— ')[1]));

      /* fulfilment split — who is actually carrying the work right now */
      const carriers = {};
      flight.forEach(o => { const n = d.prov(o.provider).name; carriers[n] = (carriers[n] || 0) + 1; });
      const carrierMax = Math.max(1, ...Object.values(carriers));

      const mapView =
        '<div class="ctmap"><div class="mapwrap"><div class="lf" id="map"></div>' +
          '<div class="maplegend">' + ctBranches().map(b => '<span>' + U.dot(d.PAL.peach) + b.code + '</span>').join('') +
            '<span class="sep"></span><span>' + U.dot('#FFEE50') + 'Driver</span><span>' + U.dot(d.PAL.vodka) + 'Drop-off</span></div>' +
          '<div class="maptools">' + U.toggle(true, 'mapLayer', 'branches', 'Branches') +
            U.toggle(true, 'mapLayer', 'drivers', 'Drivers') + U.toggle(true, 'mapLayer', 'orders', 'Routes') + '</div>' +
        '</div></div>';

      const cols = ['Awaiting provider', 'Assigned', 'To pickup', 'Picked up', 'To delivery', 'At delivery'];
      const listView = '<div class="board">' + cols.map(st => {
        const items = all.filter(o => o.status === st);
        return '<div class="bcol"><div class="bcol-h">' + U.statusTag(st) + '<em>' + items.length + '</em></div>' +
          '<div class="bcol-b">' + (items.map(o =>
            '<button type="button" class="bcard ' + (o.late || o.stuck || o.failed || o.fellThrough ? 'warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
              '<span class="bc-h"><b>' + o.id + '</b>' + MDEEP.slaTag(MDEEP.sla(o).state) + '</span>' +
              '<span class="bc-m">' + U.esc(d.branch(o.branch).code) + ' → ' + U.esc(d.customer(o.customer).name) + '</span>' +
              '<span class="bc-m">' + (o.provider ? U.esc(d.prov(o.provider).name) : '<em class="warn">No provider</em>') + '</span>' +
              '<span class="bc-f"><em>' + (o.elapsed || '0m') + ' elapsed</em><em>ETA ' + o.eta + '</em></span>' +
            '</button>').join('') || '<div class="bcol-e">—</div>') + '</div></div>';
      }).join('') + '</div>';

      const strip = alerts.length
        ? '<section class="astrip"><div class="astrip-h"><b>Needs your attention</b><em>' + alerts.length + '</em></div>' +
          '<div class="astrip-b">' + alerts.map(x =>
            '<div class="astrip-i p' + x.p + '"><span class="astrip-k">' + x.k + '</span>' +
            '<span class="astrip-t">' + U.esc(x.t) + '</span><span class="astrip-a">' + x.act + '</span></div>').join('') +
          '</div></section>'
        : U.note('Nothing needs your attention.', 'Every order in flight is moving and inside its window.', '#1f8a4c');

      const vtog = '<div class="vtog">' +
        '<button type="button" class="vt ' + (f.view === 'Map' ? 'on' : '') + '" data-act="ctView" data-arg="Map">Map</button>' +
        '<button type="button" class="vt ' + (f.view === 'List' ? 'on' : '') + '" data-act="ctView" data-arg="List">List</button>' +
      '</div>';

      const centre = U.panel(f.view === 'Map' ? 'Live map' : 'Live board',
        f.view === 'Map' ? mapView : listView,
        { pad: false, right: '<span class="ph-note">' + all.length + ' in flight</span>' + vtog });

      const waitPanel = U.panel('Awaiting a driver',
        '<div class="mlist">' + (waiting.map(o =>
          '<button type="button" class="ml ' + (o.fellThrough ? 'warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
            '<span class="ml-h"><b>' + o.id + '</b>' + MDEEP.slaTag(MDEEP.sla(o).state) + '<em class="el">' + (o.elapsed || '0m') + '</em></span>' +
            '<span class="ml-s">' + U.esc(d.branch(o.branch).name) + ' → ' + U.esc(d.customer(o.customer).name) + '</span>' +
            '<span class="ml-s">' + (o.fellThrough ? '<em class="warn">' + U.esc(o.fellThrough) + ' declined — fallback running</em>' : U.esc(o.source) + ' · ' + o.type) + '</span>' +
          '</button>').join('') || '<div class="empty">Every order has a driver.</div>') + '</div>' +
        (waiting.length ? '<div class="fld-h" style="padding:9px 12px;border-top:1px solid var(--line2);margin:0">You cannot assign a driver yourself — your dispatch rules decide that. This queue is your early warning that they are not finding one.</div>' : ''),
        { pad: false, right: '<span class="ph-note">' + waiting.length + ' waiting</span>' });

      const flightPanel = U.panel('In flight',
        '<div class="mlist">' + (['Assigned','To pickup','Picked up','To delivery','At delivery']
          .filter(st => flight.some(o => o.status === st)).map(st =>
          '<div class="dgrp">' + st + '<em>' + flight.filter(o => o.status === st).length + '</em></div>' +
          flight.filter(o => o.status === st).map(o =>
            '<button type="button" class="ml ' + (o.late || o.stuck || o.failed ? 'warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
              '<span class="ml-h"><b>' + o.id + '</b>' + MDEEP.slaTag(MDEEP.sla(o).state) + '<em class="el">' + (o.elapsed || '0m') + '</em></span>' +
              '<span class="ml-s">' + (o.driver ? U.esc(o.driver) : 'Driver not yet named') + ' · ' + U.esc(d.prov(o.provider).name) + '</span>' +
              '<span class="ml-s">' + U.esc(d.branch(o.branch).code) + ' · ETA ' + o.eta + '</span>' +
            '</button>').join('')).join('') || '<div class="empty">Nothing in flight.</div>') + '</div>',
        { pad: false, right: '<span class="ph-note">' + flight.length + ' moving</span>' });

      const splitPanel = U.panel('Fulfilment split',
        (Object.keys(carriers).length
          ? '<div class="zonebars">' + Object.keys(carriers).sort((a, b) => carriers[b] - carriers[a]).map(n => {
              const p = d.PROVIDERS.find(x => x.name === n);
              return '<div class="zb"><span>' + U.esc(n) + '</span>' +
                U.bar(carriers[n] / carrierMax * 100, p && p.kind === 'Network' ? d.PAL.vodka : d.PAL.lav) +
                '<em>' + carriers[n] + ' order' + (carriers[n] === 1 ? '' : 's') + ' · ' + (p ? p.kind : '—') + '</em></div>';
            }).join('') + '</div>' +
            '<div class="fld-h">Where your volume is landing right now, not this month. ' +
            U.btn('Dispatch rules', { act: 'go', arg: '/dispatch' }) + '</div>'
          : '<div class="empty">Nothing in flight to split.</div>'));

      return U.page('Control tower',
        'What is happening with your deliveries right now — and the few things you can do about it',
        U.btn('Create order', { kind: 'primary', act: 'go', arg: '/create-order' }) +
        U.btn('Order history', { act: 'go', arg: '/orders' })) +
        strip +
        U.filters([
          fg('City', U.select(cityOpts, f.city, { act: 'ctF', arg: 'city' })),
          fg('District', U.select(distOpts, f.district, { act: 'ctF', arg: 'district' })),
          fg('Branch', U.select(brOpts, f.branch, { act: 'ctF', arg: 'branch' })),
          fg('Status', U.select(['All statuses'].concat(Object.keys(d.STATUS)), f.status, { act: 'ctF', arg: 'status' })),
          fg('Fulfilled by', U.select(['All providers', 'Not yet assigned'].concat(
            d.PROVIDERS.filter(p => p.status === 'Connected').map(p => p.name)), f.provider, { act: 'ctF', arg: 'provider' })),
          fg('Type', U.select(['All types', 'On demand', 'Scheduled'], f.type, { act: 'ctF', arg: 'type' })),
          fg('Source', U.select(['All sources', 'Salla', 'Shopify', 'Kanz ERP', 'Manual entry'], f.source, { act: 'ctF', arg: 'source' })),
          fg('SLA state', U.select(['All SLA states', 'On time', 'At risk', 'Late'], f.sla, { act: 'ctF', arg: 'sla' })),
          fg('Find an order', U.input(f.q, 'Order ID, your reference or customer', { act: 'ctQ' })),
          '<span class="f-sp"></span><span class="f-c">' + all.length + ' in flight</span>',
          ctDirty() ? U.btn('Clear filters', { act: 'ctReset' }) : ''
        ]) +
        '<div class="ctgrid">' + centre + '<div class="ctrail">' + waitPanel + flightPanel + splitPanel + '</div></div>';
    },
    mount() {
      if (STATE.ct.view !== 'Map') return;
      const orders = ctFilter(live()), br = ctBranches();
      MAP.build('map', { routes: true, orders: orders, branches: br,
        fit: ctDirty() ? orders.flatMap(o => [o.pickup, o.drop]).concat(br.map(b => b.pos)) : null });
    }
  };

  /* ---------------- 07 Branches ---------------- */
  SCREENS['branches'] = {
    title: 'Branches', epic: 'Epic 07',
    render() {
      const d = D();
      return U.page('Branches', 'Each branch is a pickup point with its own hours, manager and numbers',
        U.btn('Add branch', { kind: 'primary', act: 'stub', arg: 'Add a branch — address, hours, manager' }) + U.btn('Export CSV', { act: 'export', arg: 'branches' })) + `
        <div class="kpis k-4">
          ${U.kpi('Branches', d.BRANCHES.length, `${d.BRANCHES.filter(b => b.status === 'Open').length} on normal hours`, d.PAL.peach)}
          ${U.kpi('Live orders', d.BRANCHES.reduce((s, b) => s + b.orders, 0), 'Across all branches', d.PAL.lemon)}
          ${U.kpi('Best on time', Math.max(...d.BRANCHES.map(b => b.onTime)) + '%', 'Hittin', d.PAL.flax)}
          ${U.kpi('Spend today', U.money(d.BRANCHES.reduce((s, b) => s + b.spend, 0)), 'Delivery charges only', d.PAL.lav)}
        </div>
        ${U.note('Plan limit — 5 branches on Retail Growth.', 'You are using 4. A fifth is included; beyond that you would move to Retail Scale. ' + U.btn('See plans', { act: 'go', arg: '/billing' }), d.PAL.lav)}
        ${U.panel('', U.table(
          [{ t: 'Branch' }, { t: 'Code' }, { t: 'Address' }, { t: 'Business hours' }, { t: 'Manager' }, { t: 'Live', num: true },
           { t: 'On time', w: '120px' }, { t: 'Avg', num: true }, { t: 'Spend today', num: true }, { t: 'Status' }],
          d.BRANCHES.map(b => ({ act: 'go', arg: '/branches/' + b.id, cells: [
            `<b>${U.esc(b.name)}</b>`, b.code, U.esc(b.addr), U.esc(b.hours), U.esc(b.mgr), b.orders,
            `${b.onTime}% ${U.bar(b.onTime, b.onTime >= 93 ? d.PAL.peach : d.PAL.tang)}`, b.avgMin + 'm', U.money(b.spend),
            U.tag(b.status, b.status === 'Open' ? '#1f8a4c' : d.PAL.peach, { solid: b.status !== 'Open' })] }))), { pad: false })}
        <div class="maplayout">
          <div class="mapwrap"><div class="lf" id="bmap"></div>
            <div class="maplegend">${d.BRANCHES.map(b => `<span>${U.dot(d.PAL.peach)}${b.code} — ${b.name.split('— ')[1]}</span>`).join('')}</div>
          </div>
          <div class="mapside">${U.panel('Coverage', `
            ${U.defs([['Circles', 'Roughly 1.4 km around each branch — where most of your orders land'],
                      ['Gaps', 'East Riyadh has no branch; those orders travel further and cost more'],
                      ['Providers', 'Rehla covers north and central, Sahel covers east and south']])}
            ${U.note('Branch visibility follows roles.', 'A Branch Manager only sees their own branch — orders, customers and numbers. ' + U.btn('Roles', { act: 'go', arg: '/roles' }), d.PAL.vodka)}`)}</div>
        </div>`;
    },
    mount() { MAP.build('bmap', { routes: false }); }
  };

  SCREENS['branch'] = {
    title: 'Branch', epic: 'Epic 07',
    render(id) {
      const d = D(), b = d.branch(id);
      if (!b) return U.page('Branch not found', '');
      const orders = d.ORDERS.filter(o => o.branch === b.id);
      return U.page(b.name, `${b.code} · ${b.addr} · ${b.mgr}`,
        U.btn('Edit branch', { kind: 'primary', act: 'stub', arg: 'Edit address, hours and manager' }) +
        U.btn('Create order here', { act: 'go', arg: '/create-order' }) +
        U.btn('Back to branches', { act: 'go', arg: '/branches' })) + `
        <div class="kpis k-4">
          ${U.kpi('Live orders', b.orders, 'Right now', d.PAL.lemon)}
          ${U.kpi('On time', b.onTime + '%', 'Last 7 days', d.PAL.peach)}
          ${U.kpi('Avg delivery', b.avgMin + '<span class="of">min</span>', 'Merchant avg 34 min', d.PAL.vodka)}
          ${U.kpi('Spend today', U.money(b.spend), 'Delivery charges', d.PAL.lav)}
        </div>
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Settings', U.defs([
              ['Branch name', U.esc(b.name)], ['Code', b.code], ['Address', U.esc(b.addr)],
              ['Business hours', U.esc(b.hours)], ['Manager', U.esc(b.mgr)],
              ['Status', U.tag(b.status, b.status === 'Open' ? '#1f8a4c' : d.PAL.peach, { solid: b.status !== 'Open' })],
              ['Coordinates', b.pos[0].toFixed(4) + ', ' + b.pos[1].toFixed(4)]
            ]), { right: U.btn('Change hours', { act: 'stub', arg: 'Business hours per day of week' }) })}
            ${U.panel('Orders from this branch', U.table(
              [{ t: 'Order' }, { t: 'Customer' }, { t: 'Provider' }, { t: 'Status' }, { t: 'Charge', num: true }, { t: 'Created' }],
              orders.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
                `<b>${o.id}</b>`, U.esc(d.customer(o.customer).name),
                o.provider ? U.esc(d.prov(o.provider).name) : '<em class="warn">Waiting</em>',
                U.statusTag(o.status), o.charge ? U.money(o.charge) : '—', o.created] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Location', `<div class="minimap" style="height:260px"><div class="lf" id="bdmap"></div></div>`, { pad: false })}
            ${U.panel('This week', `
              <div class="wk">${d.REPORTS.week.map(w => `<div class="wk-c">
                <span class="wk-b" style="height:${Math.round(w.orders * (b.orders / 90)) / 80 * 100}%;background:${d.PAL.peach}"></span>
                <span class="wk-l">${w.d}</span></div>`).join('')}</div>
              ${U.defs([['Orders', Math.round(b.orders * 7)], ['On time', b.onTime + '%'], ['Avg delivery', b.avgMin + ' min'],
                        ['Spend', U.money(b.spend * 7)]])}`)}
          </div>
        </div>`;
    },
    mount(id) { MAP.build('bdmap', { routes: false }); setTimeout(() => MAP.focusBranch(id), 200); }
  };
})();
