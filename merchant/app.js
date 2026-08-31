/* Dash Merchant — router, sidebar, actions */
(function () {
  const D = () => window.MER;
  window.STATE = window.STATE || {};

  const NAV = [
    { g: 'Operations', items: [
      { r: '/', k: 'dashboard', t: 'Dashboard', e: '05' },
      { r: '/control-tower', k: 'control-tower', t: 'Control tower', e: '09' },
      { r: '/orders', k: 'orders', t: 'Orders', e: '08' },
      { r: '/create-order', k: 'create-order', t: 'Create order', e: '08' }
    ]},
    { g: 'Business', items: [
      { r: '/branches', k: 'branches', t: 'Branches', e: '07' },
      { r: '/customers', k: 'customers', t: 'Customers', e: '18' },
      { r: '/profile', k: 'profile', t: 'Public profile', e: '04' }
    ]},
    { g: 'Fulfilment', items: [
      { r: '/dispatch', k: 'dispatch', t: 'Dispatch configuration', e: '10' },
      { r: '/marketplace', k: 'marketplace', t: '3PL Marketplace', e: '11' },
      { r: '/integrations', k: 'integrations', t: 'Integrations', e: '12' }
    ]},
    { g: 'Account', items: [
      { r: '/roles', k: 'roles', t: 'Roles and permissions', e: '15' },
      { r: '/account', k: 'account', t: 'Account settings', e: '03' },
      { r: '/security', k: 'security', t: 'Authentication', e: '02' },
      { r: '/onboarding', k: 'onboarding', t: 'Verification', e: '01' }
    ]},
    { g: 'Insight and platform', items: [
      { r: '/reports', k: 'reports', t: 'Reports', e: '13' },
      { r: '/billing', k: 'billing', t: 'Billing', e: '14' },
      { r: '/notifications', k: 'notifications', t: 'Notifications', e: '17' },
      { r: '/developer', k: 'developer', t: 'Developer', e: '16' },
      { r: '/support', k: 'support', t: 'Support', e: '19' },
      { r: '/audit', k: 'audit', t: 'Audit log', e: '20' }
    ]}
  ];

  function sidebar(route) {
    const unread = D().NOTIFS.filter(n => n.sev !== 'low').length;
    return `
      <a class="brand" href="#/"><span class="brand-w">DASH</span><span class="brand-d"></span><span class="brand-p">MERCHANT</span></a>
      <div class="acct-chip">
        <div><b>${D().BIZ.name}</b><em>4 branches · ${D().BIZ.plan}</em></div>
        <span class="ver">Verified</span>
      </div>
      <nav class="nav">
        ${NAV.map(sec => `<div class="nav-g">${sec.g}</div>
          ${sec.items.map(i => `<a class="nav-i ${route === i.r || (i.r !== '/' && route.startsWith(i.r)) ? 'on' : ''}" href="#${i.r}">
            <span>${i.t}</span>${i.r === '/notifications' && unread ? `<em class="badge">${unread}</em>` : `<em class="epic">${i.e}</em>`}</a>`).join('')}`).join('')}
      </nav>
      <div class="nav-foot"><div class="who sm"><span class="av">SA</span><span>Sara Al Fahad<em>Admin · all branches</em></span></div></div>`;
  }

  function parse() {
    let h = (location.hash || '#/').replace('#', '') || '/';
    if (h === '/live-map') { location.replace('#/control-tower'); h = '/control-tower'; }
    const p = h.split('/').filter(Boolean);
    if (!p.length) return { key: 'dashboard', route: '/', arg: null };
    if (p[0] === 'orders' && p[1]) return { key: 'order', route: '/orders', arg: p[1] };
    if (p[0] === 'branches' && p[1]) return { key: 'branch', route: '/branches', arg: p[1] };
    if (p[0] === 'customers' && p[1]) return { key: 'customer', route: '/customers', arg: p[1] };
    if (p[0] === 'marketplace' && p[1]) return { key: 'provider', route: '/marketplace', arg: p[1] };
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
  const now = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  const A = {
    go: a => { location.hash = '#' + a; },
    closeDrawer: () => UI.closeDrawer(),
    stub: a => UI.toast(a || 'Not part of this prototype'),

    /* filters */
    ofF: (a, el) => { STATE.of[a] = el.value; render(); },
    ofQ: (a, el) => { STATE.of.q = el.value; const p = el.selectionStart; render(); const i = document.querySelector('[data-act="ofQ"]'); if (i) { i.focus(); i.setSelectionRange(p, p); } },
    ofReset: () => { STATE.of = { status: 'All statuses', branch: 'All branches', source: 'All sources', type: 'All types', provider: 'All providers', q: '' }; render(); },
    mfF: (a, el) => { STATE.mf[a] = el.value; render(); },
    mfQ: (a, el) => { STATE.mf.q = el.value; const p = el.selectionStart; render(); const i = document.querySelector('[data-act="mfQ"]'); if (i) { i.focus(); i.setSelectionRange(p, p); } },
    reportTab: a => { STATE.rt = a; render(); },

    /* control tower — shared filters, both views */
    ctF: (arg, el) => {
      const f = STATE.ct;
      f[arg] = el.value;
      if (arg === 'city') { f.district = 'All districts'; f.branch = 'All branches'; }
      if (arg === 'district') { f.branch = 'All branches'; }
      render();
    },
    ctView: v => { STATE.ct.view = v; render(); },
    ctReset: () => {
      const v = STATE.ct.view;
      STATE.ct = { view: v, city:'All cities', district:'All districts', branch:'All branches',
        status:'All statuses', provider:'All providers', type:'All types', source:'All sources' };
      render();
    },
    ctPick: id => {
      const d = D(), o = d.order(id), b = d.branch(o.branch), c = d.customer(o.customer);
      if (STATE.ct.view === 'Map') MAP.focusOrder(id);
      UI.drawer('<b>' + id + '</b> — ' + o.status, [
        '<div class="dw-meta">' + UI.esc(b.name) + ' → ' + UI.esc(c.name) + ' · ' + UI.esc(o.items) + '</div>',
        UI.defs([
          ['Status', UI.statusTag(o.status)],
          ['Elapsed', (o.elapsed || '0m') + (o.stuck ? ' · no update for ' + o.stuck + ' min' : '')],
          ['ETA', o.eta + (o.late ? ' — running late' : '')],
          ['Fulfilled by', o.provider ? UI.esc(d.prov(o.provider).name) + ' <em class="sub">' + d.prov(o.provider).kind + '</em>' : '<em class="warn">No provider yet</em>'],
          ['Driver', o.driver ? UI.esc(o.driver) : '<em class="sub">Not named yet</em>'],
          ['Branch', UI.esc(b.name)], ['Source', UI.esc(o.source)], ['Type', o.type],
          ['Cash on delivery', o.cod ? UI.money(o.cod) : 'Cash free']
        ]),
        o.driver ? UI.note('You do not contact the driver.', 'They belong to ' + UI.esc(d.prov(o.provider).name) + '. Escalate through Dash and whoever owns fulfilment acts.', MER.PAL.vodka) : ''
      ].join(''), { footer:
        UI.btn('Escalate to Dash', { kind:'primary', act:'escalate', arg:id }) +
        UI.btn('Share tracking link', { act:'sendLink', arg:id }) +
        UI.btn('Contact support', { act:'ticketFor', arg:id }) +
        UI.btn('Cancel order', { kind:'danger', act:'cancelOrder', arg:id }) +
        UI.btn('Full details', { act:'go', arg:'/orders/' + id }) });
    },
    failedDecision: id => {
      UI.drawer('Failed delivery — <b>' + id + '</b>', [
        '<div class="dw-meta">Nobody answered at the door. Your call — the provider carries out whichever you pick.</div>',
        '<div class="cands">',
        ['Reattempt today', 'Reattempt tomorrow', 'Return to my branch', 'Cancel the order'].map(x =>
          '<button type="button" class="cand pick" data-act="doFailed" data-arg="' + id + '|' + x + '">' +
          '<span class="cand-n">·</span><div><b>' + x + '</b></div></button>').join(''),
        '</div>'
      ].join(''));
    },
    doFailed: arg => {
      const [id, choice] = arg.split('|'), o = D().order(id);
      o.failed = false;
      if (choice.startsWith('Return')) { o.status = 'Returned'; o.charge = 0; }
      else if (choice.startsWith('Cancel')) { o.status = 'Cancelled'; o.charge = 0; }
      o.log.push({ t: now(), e: 'Failed delivery resolved', s: choice + ' · decided by you' });
      UI.closeDrawer(); UI.toast(id + ' — ' + choice.toLowerCase()); render();
    },
    ticketFor: id => { UI.toast('Support ticket opened for ' + id + ' with the full routing trace'); },

    /* map */
    mapBranch: (a, el) => MAP.filterBranch(el.value),
    mapLayer: (a, el) => { const on = !el.classList.contains('on'); el.classList.toggle('on', on); MAP.toggleLayer(a, on); },
    focusOrder: a => MAP.focusOrder(a),
    focusBranch: a => MAP.focusBranch(a),

    /* dispatch config */
    dsMode: a => { D().DISPATCH.mode = a; UI.toast('Dispatch mode: ' + a); render(); },
    dsSpecific: (a, el) => { D().DISPATCH.specific = el.value; render(); },
    dsBehaviour: a => { D().DISPATCH.poolBehaviour = a; render(); },
    dsFallback: a => { D().DISPATCH.fallback = a; render(); },
    dsAfter: (a, el) => { D().DISPATCH.fallbackAfter = +el.value; render(); },
    dsUp: id => { const p = D().DISPATCH.poolOrder, i = p.indexOf(id); if (i > 0) { p.splice(i, 1); p.splice(i - 1, 0, id); render(); } },
    dsDown: id => { const p = D().DISPATCH.poolOrder, i = p.indexOf(id); if (i < p.length - 1) { p.splice(i, 1); p.splice(i + 1, 0, id); render(); } },
    dsAdd: id => { D().DISPATCH.poolOrder.push(id); UI.toast(D().prov(id).name + ' added to your pool'); render(); },
    dsRemove: id => {
      const p = D().DISPATCH.poolOrder;
      if (p.length <= 1) return UI.toast('A pool needs at least one provider. Switch mode instead.');
      p.splice(p.indexOf(id), 1); UI.toast(D().prov(id).name + ' removed from the pool'); render();
    },
    saveDispatch: () => UI.toast('Dispatch rules saved — they apply to the next order in'),

    /* orders */
    assignProvider: id => {
      const d = D(), o = d.order(id); if (!o) return;
      const cands = d.PROVIDERS.filter(p => p.status === 'Connected')
        .map(p => ({ p, inPool: d.DISPATCH.poolOrder.indexOf(p.id) }))
        .sort((a, b) => (a.inPool < 0 ? 99 : a.inPool) - (b.inPool < 0 ? 99 : b.inPool));
      UI.drawer(`Assign a provider — <b>${id}</b>`, `
        <div class="dw-meta">${d.branch(o.branch).name} → ${d.customer(o.customer).name} · ${o.type}${o.cod ? ' · COD ' + UI.money(o.cod) : ''} · ${o.items}</div>
        <div class="cands">${cands.map((c, i) => `
          <button type="button" class="cand pick" data-act="doAssign" data-arg="${id}|${c.p.id}">
            <span class="cand-n">${i + 1}</span>
            <div><b>${c.p.name}</b><em>${c.p.zones} · on time ${c.p.onTime}% · accepts ${c.p.accept}% · ${c.p.price}</em></div>
            ${c.inPool === 0 ? UI.tag('First in pool', MER.PAL.lemon, { solid: true }) : c.inPool > 0 ? UI.tag('In pool', MER.PAL.lav) : ''}
          </button>`).join('')}</div>
        <div class="fld-h" style="margin-top:12px">Overrides your dispatch rules for this order only.</div>`,
        { footer: UI.btn('Send to Dash Network', { kind: 'primary', act: 'toNetwork', arg: id }) + UI.btn('Cancel order', { kind: 'danger', act: 'cancelOrder', arg: id }) });
    },
    doAssign: a => {
      const [id, pid] = a.split('|'), d = D(), o = d.order(id), p = d.prov(pid);
      o.provider = pid; o.status = 'Assigned';
      o.log.push({ t: now(), e: 'Assigned to ' + p.name, s: 'Manual override by you' });
      d.AUDIT.unshift({ t: now(), u: 'Sara Al Fahad', r: 'Admin', a: 'Assigned provider', o: id + ' · ' + p.name, ip: '188.55.x.x' });
      UI.closeDrawer(); UI.toast(id + ' assigned to ' + p.name); render();
    },
    toNetwork: id => {
      const d = D(), o = d.order(id);
      o.provider = 'p0'; o.status = 'Assigned';
      o.log.push({ t: now(), e: 'Sent to Dash Network', s: 'Fallback engaged manually' });
      UI.closeDrawer(); UI.toast(id + ' handed to Dash Network — it will find whoever is free'); render();
    },
    escalate: id => {
      const o = D().order(id);
      o.prio = 'High'; o.log.push({ t: now(), e: 'Escalated to Dash', s: 'Priority raised · Dash Hub notified' });
      D().TICKETS.unshift({ id: 'TK-33' + (20 + Math.floor(Math.random() * 60)), s: 'Open', p: 'High',
        t: 'Escalation on ' + id, link: id, opened: 'Today ' + now(), last: 'Just sent', kind: 'Escalate an order' });
      UI.toast(id + ' escalated — a ticket was opened with Dash'); render();
    },
    cancelOrder: id => {
      const o = D().order(id);
      o.status = 'Cancelled'; o.charge = 0;
      o.log.push({ t: now(), e: 'Cancelled by you', s: 'No delivery charge applied' });
      UI.closeDrawer(); UI.toast(id + ' cancelled — you were not charged'); render();
    },
    waybill: id => UI.drawer('Waybill — <b>' + (id === 'new' ? 'preview' : id) + '</b>', (() => {
      const o = id === 'new' ? null : D().order(id);
      const b = o ? D().branch(o.branch) : D().BRANCHES[0];
      const c = o ? D().customer(o.customer) : D().CUSTOMERS[0];
      return `<div class="waybill big"><div class="wb-h"><b>KANZ MARKET</b><span>${id === 'new' ? 'DX-NEW' : id}</span></div>
        <div class="wb-b">
          <div><em>From</em>${b.name} — ${b.addr}</div>
          <div><em>To</em>${c.addrs[0]}</div>
          <div><em>Customer</em>${c.name} · ${c.phone}</div>
          <div><em>Items</em>${o ? o.items : '2 bags · 6.2 kg'}</div>
          <div><em>COD</em>${o && o.cod ? UI.money(o.cod) : 'Cash free'}</div>
          <div><em>Proof</em>${o ? o.pod.join(', ') : 'Photo'}</div>
          <div><em>Provider</em>${o && o.provider ? D().prov(o.provider).name : 'Per dispatch rules'}</div>
        </div><div class="wb-c">▌▐▌▌▐▐▌▐▌▌▐▌▐▐▌▌▐▌▐▌▐▐▌▌▐▐▌▐▌▌▐</div></div>`;
    })(), { footer: UI.btn('Print', { kind: 'primary', act: 'printWb' }) }),
    printWb: () => { UI.closeDrawer(); UI.toast('Sent to printer'); },
    copyLink: id => UI.toast('Tracking link for ' + id + ' copied'),
    sendLink: id => UI.toast('Tracking link for ' + id + ' sent to the customer by SMS'),

    /* create order */
    noType: a => { STATE.no.type = a; render(); },
    noPrio: a => { STATE.no.prio = a; render(); },
    noRoute: a => { STATE.no.route = a; render(); },
    noBranch: (a, el) => { STATE.no.branch = el.value; render(); },
    noProv: (a, el) => { STATE.no.prov = el.value; render(); },
    noCod: (a, el) => { STATE.no.cod = el.value; },
    noPod: a => { const p = STATE.no.pod, i = p.indexOf(a); i < 0 ? p.push(a) : (p.length > 1 && p.splice(i, 1)); render(); },
    createOrder: () => {
      const d = D(), n = STATE.no;
      const id = 'DX-411' + (10 + Math.floor(Math.random() * 80));
      const b = d.BRANCHES.find(x => x.name === n.branch) || d.BRANCHES[0];
      const usePool = n.route === 'Use my dispatch rules';
      const pid = usePool
        ? (d.DISPATCH.mode === 'Manual assignment' ? null : d.DISPATCH.mode === 'Dash Network only' ? 'p0' : d.DISPATCH.mode === 'Specific 3PL' ? (d.PROVIDERS.find(p => p.name === d.DISPATCH.specific) || {}).id : d.DISPATCH.poolOrder[0])
        : (d.PROVIDERS.find(p => p.name === n.prov) || {}).id;
      d.ORDERS.unshift({ id, ref: 'MANUAL-' + (312 + Math.floor(Math.random() * 40)), branch: b.id, customer: 'c1',
        status: pid ? 'Assigned' : 'Awaiting provider', type: n.type, source: 'Manual entry',
        provider: pid || null, driver: null, driverPhone: null, vehicle: null,
        created: now(), eta: n.type === 'Scheduled' ? '18:30' : '16:45', cod: +n.cod || 0, charge: 18.42,
        items: '2 bags · 6.2 kg', pod: n.pod.slice(), instr: 'Call on arrival, gate code 4471', prio: n.prio,
        pickup: b.pos, drop: [24.8471, 46.6338],
        log: [{ t: now(), e: 'Order created', s: 'Manual entry · Sara Al Fahad' }].concat(
          pid ? [{ t: now(), e: 'Assigned to ' + d.prov(pid).name, s: usePool ? d.DISPATCH.mode : 'Provider picked on the order' }]
              : [{ t: now(), e: 'Waiting for a provider', s: 'Manual assignment mode' }]) });
      d.AUDIT.unshift({ t: now(), u: 'Sara Al Fahad', r: 'Admin', a: 'Created order', o: id, ip: '188.55.x.x' });
      UI.toast(id + (pid ? ' created and sent to ' + d.prov(pid).name : ' created — waiting for a provider'));
      location.hash = '#/orders/' + id;
    },

    /* marketplace */
    requestProvider: id => { const p = D().prov(id); p.status = 'Requested'; UI.toast('Request sent to ' + p.name + ' — they review your public profile'); render(); },
    cancelRequest: id => { const p = D().prov(id); p.status = 'Available'; UI.toast('Request to ' + p.name + ' cancelled'); render(); },
    disconnectProvider: id => {
      const d = D(), p = d.prov(id);
      p.status = 'Available'; p.since = '—';
      const i = d.DISPATCH.poolOrder.indexOf(id);
      if (i >= 0) d.DISPATCH.poolOrder.splice(i, 1);
      if (!d.DISPATCH.poolOrder.length) d.DISPATCH.poolOrder.push('p0');
      UI.toast(p.name + ' disconnected' + (i >= 0 ? ' and removed from your pool' : '')); render();
    },
    approveProvider: id => { const p = D().prov(id); p.status = 'Connected'; p.since = '29 Aug 2026'; UI.toast(p.name + ' connected'); render(); },

    /* integrations */
    connectInt: id => { const i = D().INTEGRATIONS.find(x => x.id === id); i.status = 'Connected'; i.health = 'Healthy'; i.synced = 'just now'; UI.toast(i.n + ' connected — orders will start arriving'); render(); },
    disconnectInt: id => { const i = D().INTEGRATIONS.find(x => x.id === id); i.status = 'Available'; i.health = '—'; i.synced = '—'; UI.toast(i.n + ' disconnected'); render(); },
    syncSettings: id => {
      const i = D().INTEGRATIONS.find(x => x.id === id);
      UI.drawer('Sync settings — <b>' + i.n + '</b>', `
        ${UI.field('Import orders', UI.toggle(true, 'stub', '', 'As soon as a customer checks out'))}
        ${UI.field('Which branch', UI.select(['Match by store location', ...D().BRANCHES.map(b => b.name)], 'Match by store location'))}
        ${UI.field('Order status', UI.select(['Only paid orders', 'All orders including unpaid'], 'Only paid orders'))}
        ${UI.field('Push status back', UI.toggle(true, 'stub', '', 'Update the platform when we deliver'))}
        ${UI.field('Sync notes and instructions', UI.toggle(true, 'stub', '', 'Carry the customer note onto the order'))}
        ${UI.note('Health: ' + i.health + '.', UI.esc(i.note), i.health === 'Healthy' ? '#1f8a4c' : MER.PAL.tang)}`,
        { footer: UI.btn('Save', { kind: 'primary', act: 'closeDrawer' }) + UI.btn('Sync now', { act: 'stub', arg: 'Sync triggered' }) });
    },

    /* customers */
    toggleFlag: id => {
      const c = D().customer(id);
      c.flagged = !c.flagged;
      if (c.flagged && !c.note) c.note = 'Flagged by staff — confirm before dispatch.';
      UI.toast(c.name + (c.flagged ? ' flagged' : ' unflagged')); render();
    },

    /* misc */
    export: what => UI.toast('Exported ' + what + ' — file downloaded'),
    scheduleReport: () => UI.toast('Report scheduled — daily at 23:45 to ops@kanzmarket.sa'),
    topUp: () => { D().WALLET.balance += 4000; D().WALLET.tx.unshift({ d: 'Today ' + now(), t: 'Wallet top-up', a: 4000 }); UI.toast('SAR 4,000 added to your wallet'); render(); },
    changePlan: n => UI.toast('Plan change to ' + n + ' requested — Dash will confirm'),
    genKey: () => UI.toast('New key generated: dsh_live_5c77••••'),
    newTicket: () => { D().TICKETS.unshift({ id: 'TK-33' + (40 + Math.floor(Math.random() * 50)), s: 'Open', p: 'Normal', t: 'New ticket from the dashboard', link: '—', opened: 'Today ' + now(), last: 'Just sent', kind: 'Something else' }); UI.toast('Ticket submitted to Dash Hub'); render(); },
    acctLang: (a, el) => { STATE.acct.lang = el.value; },
    acctTz: (a, el) => { STATE.acct.tz = el.value; },
    acctCur: (a, el) => { STATE.acct.cur = el.value; },
    saveAcct: () => UI.toast('Account settings saved'),
    npOrder: (a, el) => { STATE.np.order = !STATE.np.order; el.classList.toggle('on', STATE.np.order); },
    npAlerts: (a, el) => { STATE.np.alerts = !STATE.np.alerts; el.classList.toggle('on', STATE.np.alerts); },
    npProvider: (a, el) => { STATE.np.provider = !STATE.np.provider; el.classList.toggle('on', STATE.np.provider); },
    npBilling: (a, el) => { STATE.np.billing = !STATE.np.billing; el.classList.toggle('on', STATE.np.billing); },
    npSystem: (a, el) => { STATE.np.system = !STATE.np.system; el.classList.toggle('on', STATE.np.system); }
  };

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (['SELECT', 'INPUT', 'TEXTAREA'].includes(t.tagName)) return;
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
    if (!t) return;
    const act = t.getAttribute('data-act');
    if (['dsAfter', 'ofQ', 'mfQ'].includes(act) && A[act]) A[act](t.getAttribute('data-arg'), t);
  });

  window.addEventListener('hashchange', render);
  window.RENDER = render;
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
