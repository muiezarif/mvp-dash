/* Dash DMS — operations screens: Dashboard (04), Control Tower (16 · 17) */
window.SCREENS = window.SCREENS || {};
window.STATE = window.STATE || {};
(function () {
  const U = UI, D = () => window.DMS;

  const live = () => D().ORDERS.filter(o => !['Delivered','Cancelled','Returned'].includes(o.status));
  const unassigned = () => D().ORDERS.filter(o => o.status === 'Assigning');
  const late = () => live().filter(o => o.prio === 'High' || o.status === 'Assigning');

  /* ---------------- 04 Dashboard ---------------- */
  SCREENS['dashboard'] = {
    title: 'Dashboard', epic: 'Epic 04',
    render() {
      const d = D(), on = d.DRIVERS.filter(x => x.online);
      const busy = d.DRIVERS.filter(x => x.status === 'On job');
      const done = d.ORDERS.filter(o => o.status === 'Delivered');
      const avg = Math.round(d.DRIVERS.reduce((s, x) => s + x.avgMin, 0) / d.DRIVERS.length);
      const top = [...d.DRIVERS].sort((a, b) => b.completion - a.completion || a.avgMin - b.avgMin).slice(0, 5);

      return U.page('Fleet overview', 'Rehla Fleet · Riyadh · today, Saturday 29 August',
        U.btn('Create order', { kind: 'primary', act: 'go', arg: '/create-order' }) + U.btn('Open control tower', { act: 'go', arg: '/control-tower' })) + `
        <div class="kpis">
          ${U.kpi('Active orders', live().length, `${unassigned().length} waiting for a driver`, d.PAL.lemon)}
          ${U.kpi('Active drivers', `${on.length}<span class="of">/${d.DRIVERS.length}</span>`, `${busy.length} on job · ${on.length - busy.length} idle`, d.PAL.lav)}
          ${U.kpi('Completed today', done.length + 116, 'On-time 94% · 8 late', d.PAL.flax)}
          ${U.kpi('Avg delivery time', avg + '<span class="of">min</span>', 'Target 35 min · 4 min under', d.PAL.vodka)}
          ${U.kpi('COD held by drivers', U.money(d.DRIVERS.reduce((s, x) => s + x.wallet.cod, 0)), '5 drivers pending handover', d.PAL.peach)}
          ${U.kpi('Network orders in', 1, 'Supply role active · RYD-W', d.PAL.tang)}
        </div>

        <div class="cols c-2-1">
          ${U.panel('Fleet status', `
            <div class="fleetgrid">
              ${['On job','Idle','Break','Offline'].map(s => {
                const n = d.DRIVERS.filter(x => x.status === s).length;
                const c = { 'On job': d.PAL.lav, 'Idle': d.PAL.flax, 'Break': d.PAL.peach, 'Offline': '#c9c9c9' }[s];
                return `<div class="fs"><div class="fs-n">${n}</div><div class="fs-l">${U.dot(c)}${s}</div>${U.bar(n / d.DRIVERS.length * 100, c)}</div>`;
              }).join('')}
            </div>
            <div class="sub-h">Orders across the last 7 days</div>
            <div class="wk">
              ${d.REPORTS.week.map(w => `<div class="wk-c"><span class="wk-b" style="height:${w.orders / 280 * 100}%;background:${w.onTime < 93 ? d.PAL.tang : d.PAL.lav}"></span><span class="wk-l">${w.d}</span><span class="wk-v">${w.orders}</span></div>`).join('')}
            </div>
            <div class="legend">${U.dot(d.PAL.lav)}On-time 93%+ ${U.dot(d.PAL.tang)}Below target</div>`,
            { right: `<span class="ph-note">Epic 04 · Dashboard</span>` })}

          ${U.panel('Needs attention', `
            <div class="alerts">
              ${d.NOTIFS.filter(n => n.sev !== 'low').map(n => `
                <a class="alert s-${n.sev}" href="${n.link}">
                  <span class="alert-k">${n.k}</span>
                  <span class="alert-t">${U.esc(n.t)}</span>
                  <span class="alert-d">${n.d}</span>
                </a>`).join('')}
            </div>`, { right: U.btn('All notifications', { act: 'go', arg: '/notifications' }) })}
        </div>

        <div class="cols c-1-1">
          ${U.panel('Top performing drivers', U.table(
            [{ t: 'Driver' }, { t: 'Zone' }, { t: 'Deliveries', num: true }, { t: 'Completion', w: '110px' }, { t: 'Avg', num: true }],
            top.map(x => ({ act: 'go', arg: '/drivers/' + x.id, cells: [
              `<div class="who">${U.avatar(x.name)}<span>${U.esc(x.name)}<em>${x.status}</em></span></div>`,
              d.zone(x.zone).code, x.deliveries.toLocaleString(),
              `${x.completion}% ${U.bar(x.completion, d.PAL.lav)}`, x.avgMin + 'm'] }))))}

          ${U.panel('Zone performance', U.table(
            [{ t: 'Zone' }, { t: 'Live', num: true }, { t: 'On time', w: '110px' }, { t: 'Avg pickup', num: true }, { t: 'Status' }],
            d.ZONES.map(z => ({ act: 'go', arg: '/zones', cells: [
              `${U.dot(z.color)}${U.esc(z.name)}`, z.orders,
              `${z.onTime}% ${U.bar(z.onTime, z.color)}`, z.avgPickup + 'm',
              U.tag(z.status, z.status === 'Active' ? '#1f8a4c' : d.PAL.peach)] }))))}
        </div>`;
    }
  };

  /* ---------------- 16 · 17 Control Tower — one live operations screen ---------------- */
  const CT_DEF = { view:'Map', city:'All cities', district:'All districts', zone:'All zones',
    status:'All statuses', driver:'All drivers', merchant:'All merchants',
    source:'All sources', type:'All types', vehicle:'All vehicles',
    sla:'All SLA states', branch:'All branches', q:'' };
  STATE.ct = STATE.ct || Object.assign({}, CT_DEF);

  /* one filter predicate, both views */
  function ctFilter(list) {
    const d = D(), f = STATE.ct;
    return list.filter(o => {
      const z = d.zone(o.zone);
      const dr = o.driver ? d.driver(o.driver) : null;
      if (f.city !== 'All cities' && z.city !== f.city) return false;
      if (f.district !== 'All districts' && z.districts.indexOf(f.district) < 0) return false;
      if (f.zone !== 'All zones' && !f.zone.startsWith(z.code)) return false;
      if (f.status !== 'All statuses' && o.status !== f.status) return false;
      if (f.driver !== 'All drivers') {
        if (f.driver.startsWith('Group: ')) {
          const g = d.GROUPS.find(x => x.name === f.driver.slice(7));
          if (!dr || !g || dr.group !== g.id) return false;
        } else if (!dr || dr.name !== f.driver) return false;
      }
      if (f.merchant !== 'All merchants' && d.merchant(o.merchant).name !== f.merchant) return false;
      if (f.source !== 'All sources' && o.source !== f.source) return false;
      if (f.type !== 'All types' && o.type !== f.type) return false;
      if (f.vehicle !== 'All vehicles' && (!dr || d.vehicle(dr.vehicle).type !== f.vehicle)) return false;
      if (f.branch !== 'All branches' && o.branch !== f.branch) return false;
      if (f.sla !== 'All SLA states' && DEEP.sla(o).state !== f.sla) return false;
      if (f.q) {
        const q = f.q.toLowerCase();
        const hay = [o.id, o.branch, d.merchant(o.merchant).name, d.customer(o.customer).name,
          d.customer(o.customer).phone, 'ext-' + o.id.slice(3)].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function ctDrivers() {
    const d = D(), f = STATE.ct;
    return d.DRIVERS.filter(x => {
      const z = d.zone(x.zone);
      if (f.city !== 'All cities' && z.city !== f.city) return false;
      if (f.district !== 'All districts' && z.districts.indexOf(f.district) < 0) return false;
      if (f.zone !== 'All zones' && !f.zone.startsWith(z.code)) return false;
      if (f.driver !== 'All drivers') {
        if (f.driver.startsWith('Group: ')) {
          const g = d.GROUPS.find(y => y.name === f.driver.slice(7));
          if (!g || x.group !== g.id) return false;
        } else if (x.name !== f.driver) return false;
      }
      if (f.vehicle !== 'All vehicles' && d.vehicle(x.vehicle).type !== f.vehicle) return false;
      return true;
    });
  }
  const ctZones = () => {
    const d = D(), f = STATE.ct;
    return d.ZONES.filter(z =>
      (f.city === 'All cities' || z.city === f.city) &&
      (f.district === 'All districts' || z.districts.indexOf(f.district) >= 0) &&
      (f.zone === 'All zones' || f.zone.startsWith(z.code)));
  };
  const fg = (label, control) =>
    '<span class="f-g"><span class="f-l">' + label + '</span>' + control + '</span>';

  const ctDirty = () => Object.keys(CT_DEF).some(k => k !== 'view' && STATE.ct[k] !== CT_DEF[k]);

  /* Needs intervention — cases with a lifecycle, owned and resolved in place */
  const SEVP = { High:0, Medium:1, Low:2 };
  function ctCases() {
    const tab = STATE.caseFilter;
    return DEEP.CASES()
      .filter(c => tab === 'All' ? true : tab === 'Mine' ? c.owner === DEEP.OPERATOR && c.state !== 'Resolved'
        : tab === 'Resolved' ? c.state === 'Resolved' : c.state !== 'Resolved')
      .sort((a, b) => (a.state === 'Resolved') - (b.state === 'Resolved') || SEVP[a.sev] - SEVP[b.sev] || DEEP.mn(a.created) - DEEP.mn(b.created));
  }
  function caseStrip() {
    const d = D(), cases = ctCases(), all = DEEP.CASES();
    const open = all.filter(c => c.state === 'Open').length;
    const ack = all.filter(c => c.state === 'Acknowledged').length;
    const head = '<div class="astrip-h"><b>Needs intervention</b>' +
      '<em>' + open + ' open</em><em class="ack">' + ack + ' acknowledged</em>' +
      '<span class="casetabs">' + ['Open', 'Mine', 'Resolved', 'All'].map(t =>
        '<button type="button" class="ctab ' + (STATE.caseFilter === t ? 'on' : '') + '" data-act="caseTab" data-arg="' + t + '">' + t + '</button>').join('') + '</span></div>';
    if (!cases.length)
      return '<section class="astrip">' + head + '<div class="astrip-b"><div class="empty">Nothing in this view.</div></div></section>';
    return '<section class="astrip">' + head + '<div class="astrip-b">' + cases.map(c => {
      const o = d.order(c.order);
      return '<div class="case st-' + c.state.toLowerCase() + '" style="--cs:' + DEEP.CASE_SEV[c.sev] + '">' +
        '<div class="case-h"><span class="case-id">' + c.id + '</span><span class="case-k">' + U.esc(c.type) + '</span>' +
          U.tag(c.state, c.state === 'Resolved' ? '#1f8a4c' : c.state === 'Acknowledged' ? d.PAL.lav : d.PAL.lemon, { solid: c.state !== 'Resolved' }) +
          '<span class="case-o">' + (c.owner ? U.esc(c.owner) : 'Unclaimed') + '</span></div>' +
        '<div class="case-t">' + U.esc(c.reason) + '</div>' +
        '<div class="case-m">' + c.order + (o ? ' · ' + o.status : '') + ' · raised ' + c.created + ' · ' + U.esc(c.via) +
          (c.resolution ? ' · resolved ' + c.resolvedAt + ' — ' + U.esc(c.resolution) : '') + '</div>' +
        '<div class="case-a">' +
          (c.state === 'Open' ? U.btn('Acknowledge', { kind:'primary', act:'caseAck', arg:c.id }) : '') +
          (c.state === 'Acknowledged' ? U.btn('Resolve', { kind:'primary', act:'caseResolve', arg:c.id }) : '') +
          U.btn('Case', { act:'caseOpen', arg:c.id }) +
          U.btn('Trace', { act:'trace', arg:c.order }) +
          (c.driver && c.state !== 'Resolved' ? U.btn('Chat', { act:'chat', arg:c.driver }) : '') +
        '</div></div>';
    }).join('') + '</div></section>';
  }

  SCREENS['control-tower'] = {
    title: 'Control tower', epic: 'Epics 16 · 17',
    render() {
      const d = D(), f = STATE.ct;
      const all = ctFilter(live());
      const queue = all.filter(o => !o.driver || o.status === 'Assigning');
      const flight = all.filter(o => o.driver && o.status !== 'Assigning');
      const drv = ctDrivers();
      const byState = {
        'Online and idle': drv.filter(x => x.online && x.status === 'Idle'),
        'On a job': drv.filter(x => x.online && x.status === 'On job'),
        'On break': drv.filter(x => x.online && x.status === 'Break'),
        'Offline': drv.filter(x => !x.online)
      };

      const cityOpts = ['All cities'].concat(d.CITIES);
      const distPool = d.ZONES.filter(z => f.city === 'All cities' || z.city === f.city);
      const distOpts = ['All districts'].concat([...new Set(distPool.flatMap(z => z.districts))].sort());
      const zonePool = distPool.filter(z => f.district === 'All districts' || z.districts.indexOf(f.district) >= 0);
      const zoneOpts = ['All zones'].concat(zonePool.map(z => z.code + ' — ' + z.name.split('— ')[1]));

      const mapView =
        '<div class="ctmap"><div class="mapwrap"><div class="lf" id="map"></div>' +
          '<div class="maplegend">' + ctZones().map(z => '<span>' + U.dot(z.color) + z.code + '</span>').join('') +
            '<span class="sep"></span><span>' + U.dot('#FFEE50') + 'Driver</span><span>' + U.dot(d.PAL.peach) + 'Pickup</span><span>' + U.dot(d.PAL.vodka) + 'Drop-off</span></div>' +
          '<div class="maptools">' + U.toggle(true, 'mapLayer', 'zones', 'Zones') +
            U.toggle(true, 'mapLayer', 'drivers', 'Drivers') + U.toggle(true, 'mapLayer', 'orders', 'Routes') + '</div>' +
        '</div></div>';

      const cols = ['Assigning'].concat(d.FLOW.filter(s => s !== 'Delivered'));
      const listView = '<div class="board">' + cols.map(st => {
        const items = all.filter(o => o.status === st);
        return '<div class="bcol"><div class="bcol-h">' + U.statusTag(st) + '<em>' + items.length + '</em></div>' +
          '<div class="bcol-b">' + (items.map(o =>
            '<button type="button" class="bcard ' + (o.late || o.stuck ? 'warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
              '<span class="bc-h"><b>' + o.id + '</b>' + DEEP.slaTag(DEEP.sla(o).state) + '</span>' +
              '<span class="bc-m">' + U.esc(d.merchant(o.merchant).name) + ' · ' + d.zone(o.zone).code + '</span>' +
              '<span class="bc-m">' + (o.driver ? U.esc(d.driver(o.driver).name) : '<em class="warn">No driver</em>') + '</span>' +
              '<span class="bc-f"><em>' + (o.elapsed || '0m') + ' elapsed</em><em>ETA ' + o.eta + '</em></span>' +
            '</button>').join('') || '<div class="bcol-e">—</div>') + '</div></div>';
      }).join('') + '</div>';

      const strip = caseStrip();

      const vtog = '<div class="vtog">' +
        '<button type="button" class="vt ' + (f.view === 'Map' ? 'on' : '') + '" data-act="ctView" data-arg="Map">Map</button>' +
        '<button type="button" class="vt ' + (f.view === 'List' ? 'on' : '') + '" data-act="ctView" data-arg="List">List</button>' +
      '</div>';

      const centre = U.panel(f.view === 'Map' ? 'Live map' : 'Live board',
        f.view === 'Map' ? mapView : listView,
        { pad: false, right: '<span class="ph-note">' + all.length + ' orders · ' +
          drv.filter(x => x.online).length + ' on shift</span>' + vtog });

      const queuePanel = U.panel('Assignment queue',
        '<div class="queue">' + (queue.map(o =>
          '<div class="qi"><div class="qi-h"><b>' + o.id + '</b>' + U.statusTag(o.status) +
            (o.prio === 'High' ? U.tag('Priority', d.PAL.tang, { solid: true }) : '') + '</div>' +
            '<div class="qi-m">' + U.esc(d.merchant(o.merchant).name) + ' · ' + U.esc(o.branch) + '</div>' +
            '<div class="qi-m">' + d.zone(o.zone).code + ' · ' + o.type + ' · ' + U.esc(o.source) + ' · waiting ' + (o.elapsed || '0m') + '</div>' +
            '<div class="qi-m">' + DEEP.slaTag(DEEP.sla(o).state) + ' <em class="sub">promised ' + DEEP.sla(o).promisedDelivery + '</em></div>' +
            (o.offered ? '<div class="qi-m warn">Offered to ' + U.esc(d.driver(o.offered).name) + ' — not accepted</div>' : '') +
            '<div class="qi-a">' + U.btn('Assign driver', { kind: 'primary', act: 'assign', arg: o.id }) +
              U.btn('Auto assign', { act: 'autoAssign', arg: o.id }) +
              U.btn('To network', { act: 'toNetwork', arg: o.id }) +
              U.btn('Cancel', { kind: 'danger', act: 'cancelOrder', arg: o.id }) + '</div></div>').join('')
          || '<div class="empty">Queue is clear — everything has a driver.</div>') + '</div>',
        { pad: false, right: '<span class="ph-note">' + queue.length + ' waiting</span>' });

      const driverPanel = U.panel('Drivers on shift',
        '<div class="mlist">' + (Object.keys(byState).map(state => {
          const list = byState[state];
          if (!list.length) return '';
          return '<div class="dgrp">' + state + '<em>' + list.length + '</em></div>' + list.map(x =>
            '<button type="button" class="ml" data-act="ctDriver" data-arg="' + x.id + '">' +
              '<span class="ml-h"><b>' + U.esc(x.name) + '</b>' +
              U.tag(x.status, { 'On job': d.PAL.lav, 'Idle': d.PAL.flax, 'Break': d.PAL.peach, 'Offline': '#c9c9c9' }[x.status]) + '</span>' +
              '<span class="ml-s">' + d.zone(x.zone).code + ' · ' + d.vehicle(x.vehicle).type + ' · ' +
              d.ORDERS.filter(o => o.driver === x.id && !['Delivered','Cancelled','Returned'].includes(o.status)).length + ' active</span>' +
            '</button>').join('');
        }).join('') || '<div class="empty">No drivers match these filters.</div>') + '</div>',
        { pad: false, right: '<span class="ph-note">' + drv.filter(x => x.online).length + ' online</span>' });

      const flightPanel = U.panel('Live orders',
        '<div class="mlist">' + (d.FLOW.filter(st => flight.some(o => o.status === st)).map(st =>
          '<div class="dgrp">' + st + '<em>' + flight.filter(o => o.status === st).length + '</em></div>' +
          flight.filter(o => o.status === st).map(o =>
            '<button type="button" class="ml ' + (o.late || o.stuck ? 'warn' : '') + '" data-act="ctPick" data-arg="' + o.id + '">' +
              '<span class="ml-h"><b>' + o.id + '</b>' + DEEP.slaTag(DEEP.sla(o).state) + '<em class="el">' + (o.elapsed || '0m') + '</em></span>' +
              '<span class="ml-s">' + U.esc(d.driver(o.driver).name) + ' · ' + d.zone(o.zone).code + ' · ETA ' + o.eta + '</span>' +
            '</button>').join('')).join('') || '<div class="empty">Nothing in flight.</div>') + '</div>',
        { pad: false, right: '<span class="ph-note">' + flight.length + ' in flight</span>' });

      return U.page('Control tower',
        'The live operations screen — every active order, every driver, everything needing a decision right now',
        U.btn('Create order', { kind: 'primary', act: 'go', arg: '/create-order' }) +
        U.btn('Order history', { act: 'go', arg: '/orders' })) +
        strip +
        U.filters([
          fg('City', U.select(cityOpts, f.city, { act: 'ctF', arg: 'city' })),
          fg('District', U.select(distOpts, f.district, { act: 'ctF', arg: 'district' })),
          fg('Zone', U.select(zoneOpts, f.zone, { act: 'ctF', arg: 'zone' })),
          fg('Status', U.select(['All statuses', 'Assigning'].concat(d.FLOW, ['Cancelled', 'Returned']), f.status, { act: 'ctF', arg: 'status' })),
          fg('Driver', U.select(['All drivers'].concat(d.GROUPS.map(g => 'Group: ' + g.name), d.DRIVERS.map(x => x.name)), f.driver, { act: 'ctF', arg: 'driver' })),
          fg('Merchant', U.select(['All merchants'].concat(d.MERCHANTS.map(m => m.name)), f.merchant, { act: 'ctF', arg: 'merchant' })),
          fg('Source', U.select(['All sources', 'Direct', 'Marketplace', 'Dash Network'], f.source, { act: 'ctF', arg: 'source' })),
          fg('Type', U.select(['All types', 'On demand', 'Scheduled'], f.type, { act: 'ctF', arg: 'type' })),
          fg('Vehicle', U.select(['All vehicles', 'Motorcycle', 'Car', 'Van'], f.vehicle, { act: 'ctF', arg: 'vehicle' })),
          fg('Branch', U.select(['All branches'].concat([...new Set(d.ORDERS.map(o => o.branch))].sort()), f.branch, { act: 'ctF', arg: 'branch' })),
          fg('SLA state', U.select(['All SLA states', 'On time', 'At risk', 'Late'], f.sla, { act: 'ctF', arg: 'sla' })),
          fg('Find an order', U.input(f.q, 'Order ID, reference or customer', { act: 'ctQ' })),
          '<span class="f-sp"></span><span class="f-c">' + all.length + ' active</span>',
          ctDirty() ? U.btn('Clear filters', { act: 'ctReset' }) : ''
        ]) +
        '<div class="ctgrid">' + centre + '<div class="ctrail">' + queuePanel + driverPanel + flightPanel + '</div></div>';
    },
    mount() {
      if (STATE.ct.view !== 'Map') return;
      const orders = ctFilter(live()), drv = ctDrivers().filter(x => x.online), zn = ctZones();
      MAP.build('map', { routes: true, orders: orders, drivers: drv, zones: zn,
        fit: ctDirty() ? orders.flatMap(o => [o.pickup, o.drop]).concat(drv.map(x => x.pos)) : null });
    }
  };
})();
