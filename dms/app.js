/* Dash DMS — router, sidebar, action handling */
(function () {
  const U = () => window.UI, D = () => window.DMS;
  window.STATE = window.STATE || {};

  const NAV = [
    { g: 'Operations', items: [
      { r: '/', k: 'dashboard', t: 'Dashboard', e: '04' },
      { r: '/control-tower', k: 'control-tower', t: 'Control tower', e: '17' },
      { r: '/orders', k: 'orders', t: 'Orders', e: '15' },
      { r: '/create-order', k: 'create-order', t: 'Create order', e: '14' }
    ]},
    { g: 'Fleet', items: [
      { r: '/drivers', k: 'drivers', t: 'Drivers', e: '05' },
      { r: '/vehicles', k: 'vehicles', t: 'Vehicles', e: '06' },
      { r: '/groups', k: 'groups', t: 'Driver groups', e: '07' },
      { r: '/shifts', k: 'shifts', t: 'Shifts', e: '08' },
      { r: '/zones', k: 'zones', t: 'Zones', e: '11' }
    ]},
    { g: 'Commercial', items: [
      { r: '/merchants', k: 'merchants', t: 'Merchants', e: '12' },
      { r: '/customers', k: 'customers', t: 'Customers', e: '13' },
      { r: '/marketplace', k: 'marketplace', t: '3PL Marketplace', e: '19' },
      { r: '/network', k: 'network', t: 'Dash Network', e: '18' }
    ]},
    { g: 'Configuration', items: [
      { r: '/assignment', k: 'assignment', t: 'Order assignment', e: '10' },
      { r: '/app-settings', k: 'app-settings', t: 'Driver app', e: '09' },
      { r: '/roles', k: 'roles', t: 'Roles and permissions', e: '21' },
      { r: '/account', k: 'account', t: 'Account settings', e: '03' },
      { r: '/security', k: 'security', t: 'Authentication', e: '02' },
      { r: '/onboarding', k: 'onboarding', t: 'Verification', e: '01' }
    ]},
    { g: 'Insight and platform', items: [
      { r: '/reports', k: 'reports', t: 'Reports', e: '20' },
      { r: '/notifications', k: 'notifications', t: 'Notifications', e: '22' },
      { r: '/billing', k: 'billing', t: 'Billing', e: '23' },
      { r: '/developer', k: 'developer', t: 'Developer', e: '24' },
      { r: '/support', k: 'support', t: 'Support', e: '25' },
      { r: '/audit', k: 'audit', t: 'Audit log', e: '26' }
    ]}
  ];

  function sidebar(route) {
    const unread = D().NOTIFS.filter(n => n.sev !== 'low').length;
    return `
      <a class="brand" href="#/">
        <span class="brand-w">DASH</span><span class="brand-d"></span><span class="brand-p">DMS</span>
      </a>
      <div class="acct-chip">
        <div><b>Rehla Fleet</b><em>Riyadh · Fleet Pro</em></div>
        <span class="ver">Verified</span>
      </div>
      <nav class="nav">
        ${NAV.map(sec => `
          <div class="nav-g">${sec.g}</div>
          ${sec.items.map(i => `
            <a class="nav-i ${route === i.r || (i.r !== '/' && route.startsWith(i.r)) ? 'on' : ''}" href="#${i.r}">
              <span>${i.t}</span>
              ${i.r === '/notifications' && unread ? `<em class="badge">${unread}</em>` : `<em class="epic">${i.e}</em>`}
            </a>`).join('')}`).join('')}
      </nav>
      <div class="nav-foot">
        <div class="who sm"><span class="av">SA</span><span>Sara Al Fahad<em>Admin</em></span></div>
      </div>`;
  }

  function parse() {
    let h = (location.hash || '#/').replace('#', '') || '/';
    if (h === '/live-map') { location.replace('#/control-tower'); h = '/control-tower'; }
    const p = h.split('/').filter(Boolean);
    if (!p.length) return { key: 'dashboard', route: '/', arg: null };
    if (p[0] === 'orders' && p[1]) return { key: 'order', route: '/orders', arg: p[1] };
    if (p[0] === 'drivers' && p[1]) return { key: 'driver', route: '/drivers', arg: p[1] };
    if (p[0] === 'merchants' && p[1]) return { key: 'merchant', route: '/merchants', arg: p[1] };
    const found = NAV.flatMap(s => s.items).find(i => i.r === '/' + p[0]);
    return { key: found ? found.k : 'dashboard', route: found ? found.r : '/', arg: null };
  }

  function render() {
    const { key, route, arg } = parse();
    const s = SCREENS[key];
    if (window.MAP) MAP.destroy();
    document.getElementById('side').innerHTML = sidebar(route);
    const view = document.getElementById('view');
    view.innerHTML = s ? s.render(arg) : '<div class="empty">Screen not found.</div>';
    view.scrollTop = 0;
    document.getElementById('crumb').textContent = (s ? s.title : '') + (s && s.epic ? '  ·  ' + s.epic : '');
    if (s && s.mount) setTimeout(() => s.mount(arg), 40);
  }

  /* ---------- actions ---------- */
  const A = {
    go: a => { location.hash = '#' + a; },
    closeDrawer: () => UI.closeDrawer(),
    stub: a => UI.toast(a || 'Not part of this prototype'),

    /* order filters */
    ordF: (a, el) => { STATE.orderFilter[a] = el.value; render(); },
    ordQ: (a, el) => { STATE.orderFilter.q = el.value; const p = el.selectionStart; render(); const i = document.querySelector('[data-act="ordQ"]'); if (i) { i.focus(); i.setSelectionRange(p, p); } },
    ordReset: () => { STATE.orderFilter = { status: 'All statuses', source: 'All sources', zone: 'All zones', type: 'All types', q: '' }; render(); },
    drvF: (a, el) => { STATE.driverFilter[a] = el.value; render(); },
    drvQ: (a, el) => { STATE.driverFilter.q = el.value; const p = el.selectionStart; render(); const i = document.querySelector('[data-act="drvQ"]'); if (i) { i.focus(); i.setSelectionRange(p, p); } },

    /* tabs */
    driverTab: a => { STATE.driverTab = a; render(); },
    reportTab: a => { STATE.reportTab = a; render(); },

    /* control tower — shared filters, both views */
    ctF: (a, el) => {
      const f = STATE.ct;
      f[a] = el.value;
      if (a === 'city') { f.district = 'All districts'; f.zone = 'All zones'; }
      if (a === 'district') { f.zone = 'All zones'; }
      render();
    },
    ctView: v => { STATE.ct.view = v; render(); },
    ctReset: () => {
      const v = STATE.ct.view;
      STATE.ct = { view: v, city:'All cities', district:'All districts', zone:'All zones', status:'All statuses',
        driver:'All drivers', merchant:'All merchants', source:'All sources', type:'All types', vehicle:'All vehicles' };
      render();
    },
    ctPick: id => {
      const d = D(), o = d.order(id), dr = o.driver ? d.driver(o.driver) : null;
      if (STATE.ct.view === 'Map') MAP.focusOrder(id);
      UI.drawer('<b>' + id + '</b> — ' + o.status, [
        '<div class="dw-meta">' + d.merchant(o.merchant).name + ' · ' + o.branch + ' → ' + d.customer(o.customer).addr + '</div>',
        UI.defs([
          ['Status', UI.statusTag(o.status)],
          ['Elapsed', (o.elapsed || '0m') + (o.stuck ? ' · no update for ' + o.stuck + ' min' : '')],
          ['ETA', o.eta + (o.late ? ' — running late' : '')],
          ['Zone', d.zone(o.zone).code + ' — ' + d.zone(o.zone).name.split('— ')[1]],
          ['Driver', dr ? UI.esc(dr.name) + ' · ' + UI.esc(dr.phone) : '<em class="warn">Not assigned</em>'],
          ['Source', o.source], ['Type', o.type],
          ['Cash on delivery', o.cod ? UI.money(o.cod) : 'Cash free']
        ])
      ].join(''), { footer:
        (o.driver ? UI.btn('Reassign', { kind:'primary', act:'assign', arg:id }) : UI.btn('Assign driver', { kind:'primary', act:'assign', arg:id })) +
        (o.driver ? UI.btn('Contact driver', { act:'chat', arg:o.driver }) : '') +
        UI.btn('Escalate', { act:'escalate', arg:id }) +
        UI.btn('Cancel order', { kind:'danger', act:'cancelOrder', arg:id }) +
        UI.btn('Full history', { act:'go', arg:'/orders/' + id }) });
    },
    ctDriver: id => {
      const d = D(), x = d.driver(id);
      const jobs = d.ORDERS.filter(o => o.driver === id && !['Delivered','Cancelled','Returned'].includes(o.status));
      if (STATE.ct.view === 'Map' && x.online) MAP.focusDriver(id);
      UI.drawer('<b>' + UI.esc(x.name) + '</b>', [
        '<div class="dw-meta">' + x.phone + ' · ' + d.vehicle(x.vehicle).type + ' ' + d.vehicle(x.vehicle).plate + '</div>',
        UI.defs([
          ['Status', UI.tag(x.status, { 'On job': d.PAL.lav, 'Idle': d.PAL.flax, 'Break': d.PAL.peach, 'Offline': '#c9c9c9' }[x.status])],
          ['Zone', d.zone(x.zone).code + ' — ' + d.zone(x.zone).name.split('— ')[1]],
          ['Online since', x.online ? x.since : '<em class="warn">Offline</em>'],
          ['Active orders', jobs.length ? jobs.map(o => '<a href="#/orders/' + o.id + '">' + o.id + '</a>').join(', ') : 'None']
        ])
      ].join(''), { footer:
        UI.btn('Contact driver', { kind:'primary', act:'chat', arg:id }) +
        UI.btn('Change status', { act:'driverStatus', arg:id }) +
        UI.btn('Driver details', { act:'go', arg:'/drivers/' + id }) });
    },
    failedDecision: id => {
      const o = D().order(id);
      UI.drawer('Failed delivery — <b>' + id + '</b>', [
        '<div class="dw-meta">The driver could not complete it. Your decision, not the driver\'s.</div>',
        '<div class="cands">',
        ['Reattempt today', 'Reattempt tomorrow', 'Return to the merchant', 'Cancel the order'].map(x =>
          '<button type="button" class="cand pick" data-act="doFailed" data-arg="' + id + '|' + x + '">' +
          '<span class="cand-n">·</span><div><b>' + x + '</b></div></button>').join(''),
        '</div>'
      ].join(''));
    },
    doFailed: arg => {
      const [id, choice] = arg.split('|'), o = D().order(id);
      o.failed = false;
      if (choice.startsWith('Return')) o.status = 'Returned';
      else if (choice.startsWith('Cancel')) o.status = 'Cancelled';
      o.log.push({ t: now(), e: 'Failed delivery resolved', s: choice });
      UI.closeDrawer(); UI.toast(id + ' — ' + choice.toLowerCase()); render();
    },

    /* map */
    mapZone: (a, el) => MAP.filterZone(el.value),
    mapLayer: (a, el) => { const on = !el.classList.contains('on'); el.classList.toggle('on', on); MAP.toggleLayer(a, on); },
    focusOrder: a => MAP.focusOrder(a),
    focusDriver: a => MAP.focusDriver(a),
    focusZone: a => { const z = D().zone(a); MAP.filterZone(z.code); },

    /* assignment — real behaviour */
    assign: id => {
      const d = D(), o = d.order(id);
      if (!o) return;
      const cands = d.DRIVERS.filter(x => x.online && x.status !== 'Offline')
        .map(x => ({ x, km: +(1.2 + Math.random() * 5).toFixed(1) }))
        .sort((a, b) => (a.x.zone === o.zone ? -1 : 1) - (b.x.zone === o.zone ? -1 : 1) || a.km - b.km);
      UI.drawer(`Assign a driver — <b>${id}</b>`, `
        <div class="dw-meta">${d.merchant(o.merchant).name} · ${o.branch} · ${d.zone(o.zone).code} · ${o.type}${o.cod ? ' · COD ' + UI.money(o.cod) : ''}</div>
        <div class="cands">${cands.map((c, i) => `
          <button type="button" class="cand pick" data-act="doAssign" data-arg="${id}|${c.x.id}">
            <span class="cand-n">${i + 1}</span>
            <div><b>${c.x.name}</b><em>${d.zone(c.x.zone).code} · ${d.vehicle(c.x.vehicle).type} · ${c.km} km · ${c.x.completion}% · ${d.ORDERS.filter(z => z.driver === c.x.id && !['Delivered','Cancelled','Returned'].includes(z.status)).length} live</em></div>
            ${c.x.zone === o.zone ? UI.tag('In zone', d.PAL.lemon, { solid: true }) : ''}
            ${i === 0 ? UI.tag('Best match', '#000', { solid: true }) : ''}
          </button>`).join('')}</div>`,
        { footer: UI.btn('Auto assign best match', { kind: 'primary', act: 'autoAssign', arg: id }) + UI.btn('Send to Dash Network', { act: 'toNetwork', arg: id }) });
    },
    doAssign: a => {
      const [id, did] = a.split('|'), d = D(), o = d.order(id), dr = d.driver(did);
      o.driver = did; o.status = 'Accepted'; o.offered = null; o.stuck = 0; o.elapsed = '0m';
      o.log.push({ t: now(), e: 'Assigned to ' + dr.name, s: 'Manual · dispatcher' });
      d.AUDIT.unshift({ t: now(), u: 'Sara Al Fahad', r: 'Admin', a: 'Assigned driver', o: id + ' · ' + dr.name, ip: '188.55.x.x' });
      UI.closeDrawer(); UI.toast(id + ' assigned to ' + dr.name); render();
    },
    autoAssign: id => {
      const d = D(), o = d.order(id);
      const dr = d.DRIVERS.filter(x => x.online && x.zone === o.zone)[0] || d.DRIVERS.filter(x => x.online)[0];
      o.driver = dr.id; o.status = 'Accepted';
      o.log.push({ t: now(), e: 'Assigned to ' + dr.name, s: 'Auto · ' + STATE.assign.rule.toLowerCase() });
      UI.closeDrawer(); UI.toast('Auto-assigned ' + id + ' to ' + dr.name); render();
    },
    toNetwork: id => {
      const d = D(), o = d.order(id);
      o.source = 'Dash Network'; o.status = 'Assigning'; o.driver = null;
      o.log.push({ t: now(), e: 'Sent to Dash Network', s: 'Demand role · fulfilment by another provider' });
      UI.closeDrawer(); UI.toast(id + ' sent into Dash Network as Demand'); render();
    },
    escalate: id => {
      const d = D(), o = d.order(id);
      o.prio = 'High'; o.log.push({ t: now(), e: 'Escalated', s: 'Priority raised to High by dispatcher' });
      UI.toast(id + ' escalated — priority High'); render();
    },
    cancelOrder: id => {
      const o = D().order(id);
      o.status = 'Cancelled'; o.log.push({ t: now(), e: 'Cancelled by dispatcher', s: 'Reason: merchant request' });
      UI.toast(id + ' cancelled'); render();
    },
    chat: id => {
      if (!id) return UI.toast('No driver on this order yet');
      const x = D().driver(id);
      UI.drawer(`Chat — <b>${x.name}</b>`, `
        <div class="chat">
          <div class="cm in"><span>Traffic on Northern Ring, running 6 min late on DX-40918.</span><em>15:42</em></div>
          <div class="cm out"><span>Understood. Customer is flagged — call before you arrive.</span><em>15:43</em></div>
          <div class="cm in"><span>Will do.</span><em>15:43</em></div>
        </div>`,
        { footer: `<input class="in" placeholder="Message ${x.name.split(' ')[0]}…"><button class="btn primary" data-act="sendChat" type="button">Send</button>` });
    },
    sendChat: () => { UI.toast('Message sent to driver'); UI.closeDrawer(); },
    driverStatus: id => {
      const x = D().driver(id);
      UI.drawer(`Set status — <b>${x.name}</b>`, `
        <div class="dw-meta">Changing status here overrides the driver app. The driver is notified.</div>
        <div class="statuspick">${['On job', 'Idle', 'Break', 'Offline'].map(s =>
          `<button type="button" class="sp ${x.status === s ? 'on' : ''}" data-act="doStatus" data-arg="${id}|${s}">${s}</button>`).join('')}</div>`);
    },
    doStatus: a => {
      const [id, s] = a.split('|'), x = D().driver(id);
      x.status = s; x.online = s !== 'Offline';
      UI.closeDrawer(); UI.toast(x.name + ' set to ' + s); render();
    },
    handover: id => {
      const x = D().driver(id);
      x.wallet.tx.unshift({ d: 'Today', t: 'Cash handed over to office', a: -x.wallet.cod });
      UI.toast(UI.money(x.wallet.cod) + ' handover recorded for ' + x.name);
      x.wallet.cod = 0; render();
    },
    toggleZone: id => {
      const z = D().zone(id);
      z.status = z.status === 'Active' ? 'Paused' : 'Active';
      UI.toast(z.code + ' ' + (z.status === 'Active' ? 'resumed' : 'paused')); render();
    },
    shiftAuto: (id, el) => { const s = D().SHIFTS.find(x => x.id === id); s.auto = !s.auto; el.classList.toggle('on', s.auto); UI.toast(s.name + ' shift auto-online ' + (s.auto ? 'on' : 'off')); },
    shiftRoster: id => {
      const d = D(), s = d.SHIFTS.find(x => x.id === id);
      UI.drawer(`Roster — <b>${s.name}</b> ${s.window}`, `<div class="members">${s.drivers.map(x =>
        `<a class="mem" href="#/drivers/${x}">${UI.avatar(d.driver(x).name)}<span>${d.driver(x).name}<em>${d.zone(d.driver(x).zone).code} · ${d.driver(x).status}</em></span></a>`).join('')}</div>`);
    },

    /* settings */
    asMode: a => { STATE.assign.mode = a; render(); },
    asRule: a => { STATE.assign.rule = a; render(); },
    asRadius: (a, el) => { STATE.assign.radius = +el.value; render(); },
    asCap: (a, el) => { STATE.assign.capacity = +el.value; render(); },
    asSched: (a, el) => { STATE.assign.schedMin = +el.value; render(); },
    asPrio: a => { STATE.assign.priority = a; render(); },
    asGeo: () => { STATE.assign.geofenceStrict = !STATE.assign.geofenceStrict; render(); },
    asGroup: () => { STATE.assign.groupScope = !STATE.assign.groupScope; render(); },
    asFallback: () => { STATE.assign.fallbackNetwork = !STATE.assign.fallbackNetwork; render(); },
    saveAssign: () => UI.toast('Assignment rules saved — applies to new orders immediately'),

    apDist: (a, el) => { STATE.appSet.distance = +el.value; render(); },
    apPod: () => { STATE.appSet.podRequired = !STATE.appSet.podRequired; render(); },
    apCancel: () => { STATE.appSet.cancelReason = !STATE.appSet.cancelReason; render(); },
    apAccept: a => { STATE.appSet.accept = a; render(); },
    apRe: () => { STATE.appSet.reattempt = !STATE.appSet.reattempt; render(); },
    apMax: a => { STATE.appSet.maxReattempt = +a; render(); },
    apReturn: () => { STATE.appSet.autoReturn = !STATE.appSet.autoReturn; render(); },
    apFail: () => { STATE.appSet.failReason = !STATE.appSet.failReason; render(); },
    apTrack: () => { STATE.appSet.trackEnabled = !STATE.appSet.trackEnabled; render(); },
    apShare: a => { STATE.appSet.trackShare = a; render(); },
    apExpiry: (a, el) => { STATE.appSet.trackExpiry = el.value; render(); },
    saveApp: () => UI.toast('Driver app settings saved — devices pick them up on next sync'),

    /* new order */
    noType: a => { STATE.newOrder.type = a; render(); },
    noPrio: a => { STATE.newOrder.prio = a; render(); },
    noRoute: a => { STATE.newOrder.route = a; render(); },
    noMerchant: (a, el) => { STATE.newOrder.merchant = el.value; render(); },
    noCod: (a, el) => { STATE.newOrder.cod = el.value; },
    noPod: a => {
      const p = STATE.newOrder.pod, i = p.indexOf(a);
      i < 0 ? p.push(a) : (p.length > 1 && p.splice(i, 1)); render();
    },
    createOrder: () => {
      const d = D(), n = STATE.newOrder;
      const id = 'DX-4' + (1100 + Math.floor(Math.random() * 90));
      const m = d.MERCHANTS.find(x => x.name === n.merchant) || d.MERCHANTS[0];
      const dr = n.route === 'Own fleet' ? d.DRIVERS.filter(x => x.online && x.status !== 'Break')[0] : null;
      d.ORDERS.unshift({ id, merchant: m.id, branch: 'Kanz — Hittin', customer: 'c1', zone: 'z1',
        driver: dr ? dr.id : null, status: dr ? 'Accepted' : 'Assigning', type: n.type,
        source: n.route === 'Own fleet' ? 'Direct' : 'Dash Network', cod: +n.cod || 0, price: 18.9,
        created: now(), eta: n.type === 'Scheduled' ? '18:30' : '16:40', prio: n.prio,
        pickup: [24.8232, 46.6089], drop: [24.8471, 46.6338], items: '2 bags · 6.2 kg', pod: n.pod.slice(),
        instr: 'Call on arrival, gate code 4471',
        log: [{ t: now(), e: 'Order created', s: 'Manual entry · dispatcher' }].concat(
          dr ? [{ t: now(), e: 'Assigned to ' + dr.name, s: 'Auto · ' + STATE.assign.rule.toLowerCase() }] : []) });
      d.AUDIT.unshift({ t: now(), u: 'Sara Al Fahad', r: 'Admin', a: 'Created order', o: id, ip: '188.55.x.x' });
      UI.toast(id + (dr ? ' created and assigned to ' + dr.name : ' created — waiting in the queue'));
      location.hash = '#/orders/' + id;
    },
    createOrderQ: () => { STATE.newOrder.route = 'Own fleet'; A.createOrder(); },
    waybill: id => UI.drawer('Waybill — <b>' + (id === 'new' ? 'preview' : id) + '</b>', `
      <div class="waybill big"><div class="wb-h"><b>REHLA FLEET</b><span>${id === 'new' ? 'DX-NEW' : id}</span></div>
      <div class="wb-b"><div><em>From</em>Kanz Market — Hittin, Riyadh</div><div><em>To</em>Al Yasmin block 4, Riyadh</div>
      <div><em>Customer</em>Layla A. · +966 50 220 1188</div><div><em>Items</em>2 bags · 6.2 kg</div>
      <div><em>COD</em>SAR 0.00</div><div><em>Proof</em>Photo</div></div>
      <div class="wb-c">▌▐▌▌▐▐▌▐▌▌▐▌▐▐▌▌▐▌▐▌▐▐▌▌▐▐▌▐▌▌▐</div></div>`,
      { footer: UI.btn('Print', { kind: 'primary', act: 'printWb' }) }),
    printWb: () => { UI.closeDrawer(); UI.toast('Sent to printer'); },
    copyLink: id => UI.toast('Tracking link for ' + id + ' copied'),
    resend: id => UI.toast('Tracking link for ' + id + ' resent to the merchant'),

    /* commercial */
    approveMerchant: id => {
      const m = D().merchant(id);
      m.status = 'Connected'; m.since = '29 Aug 2026';
      m.contract = { pricing: 'SAR 14.00 base + SAR 1.20/km', terms: 'Net 15', start: '2026-08-29', end: '2027-08-28', status: 'Active' };
      UI.toast(m.name + ' approved — build the pricing contract next'); render();
    },
    disconnect: id => { const m = D().merchant(id); m.status = 'Pending request'; UI.toast(m.name + ' disconnected'); render(); },
    netSupply: (a, el) => { STATE.net.supplyOn = !STATE.net.supplyOn; UI.toast('Supply ' + (STATE.net.supplyOn ? 'resumed' : 'paused')); render(); },
    netDemand: () => { STATE.net.demandOn = !STATE.net.demandOn; UI.toast('Demand ' + (STATE.net.demandOn ? 'resumed' : 'paused')); render(); },
    netSupplyJoin: () => { STATE.net.supply = 'Pending'; UI.toast('Supply request sent to Dash'); render(); },
    netDemandJoin: () => { STATE.net.demand = 'Pending'; UI.toast('Demand request sent to Dash'); render(); },
    netWithdraw: role => { if (role.startsWith('Supply')) { STATE.net.supply = 'Not joined'; } else { STATE.net.demand = 'Not joined'; } UI.toast('Withdrawn from ' + role); render(); },
    toggleListing: () => { STATE.listing.listed = !STATE.listing.listed; UI.toast(STATE.listing.listed ? 'Listing is live' : 'Listing unlisted — connections kept'); render(); },
    submitListing: () => { STATE.listing.status = 'Pending'; UI.toast('Listing submitted for Dash approval'); render(); },

    /* misc */
    export: what => UI.toast('Exported ' + what + ' — CSV downloaded'),
    scheduleReport: () => UI.toast('Report scheduled — daily at 23:45'),
    topUp: () => UI.toast('Wallet topped up SAR 2,000'),
    genKey: () => UI.toast('New key generated: dsh_live_7b44••••'),
    newTicket: () => UI.toast('Ticket TK-2213 submitted to Dash'),
    resetCreds: id => UI.toast('Credentials for ' + D().driver(id).name + ' resent by SMS'),
    toggleAccess: id => { const x = D().driver(id); x.app.active = !x.app.active; UI.toast(x.name + ' app access ' + (x.app.active ? 'activated' : 'deactivated')); render(); },
    addDriver: () => UI.drawer('Add driver', `
      <div class="grid2">
        ${UI.field('Full name', UI.input('', 'Abdullah Al Mutairi'))}
        ${UI.field('Mobile number', UI.input('', '+966 5X XXX XXXX'))}
        ${UI.field('National ID', UI.input('', '10XXXXXXXX'))}
        ${UI.field('Zone', UI.select(D().ZONES.map(z => z.code + ' — ' + z.name.split('— ')[1]), 'RYD-N — Al Malqa'))}
        ${UI.field('Group', UI.select(D().GROUPS.map(g => g.name), D().GROUPS[0].name))}
        ${UI.field('Shift', UI.select(D().SHIFTS.map(s => s.name + ' · ' + s.window), 'Morning · 07:30 – 15:30'))}
        ${UI.field('Vehicle', UI.select(['RYD 4406 — Toyota Corolla (available)', 'Assign later'], 'RYD 4406 — Toyota Corolla (available)'))}
        ${UI.field('Payment model', UI.select(['Per order', 'Salary'], 'Per order'))}
      </div>
      ${UI.note('Documents next.', 'After saving, upload the licence and insurance — the driver app stays locked until both are valid.', D().PAL.lemon)}`,
      { footer: UI.btn('Save and invite to app', { kind: 'primary', act: 'inviteDriver' }) }),
    inviteDriver: () => { UI.closeDrawer(); UI.toast('Driver created — credentials sent by SMS'); }
  };

  function now() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.tagName === 'SELECT' || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
    const act = t.getAttribute('data-act'), arg = t.getAttribute('data-arg');
    if (A[act]) { e.preventDefault(); A[act](arg, t); }
  });
  document.addEventListener('change', e => {
    const t = e.target.closest('[data-act]');
    if (!t || !['SELECT', 'INPUT'].includes(t.tagName)) return;
    const act = t.getAttribute('data-act');
    if (A[act]) A[act](t.getAttribute('data-arg'), t);
  });
  document.addEventListener('input', e => {
    const t = e.target.closest('[data-act]');
    if (!t || t.type !== 'range' && t.tagName !== 'INPUT') return;
    const act = t.getAttribute('data-act');
    if (['asRadius', 'asCap', 'asSched', 'apDist', 'ordQ', 'drvQ'].includes(act) && A[act]) A[act](t.getAttribute('data-arg'), t);
  });

  window.addEventListener('hashchange', render);
  window.RENDER = render;
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
