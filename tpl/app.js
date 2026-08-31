/* Dash 3PL — router, sidebar, actions */
(function () {
  const D = () => window.TPL;
  window.STATE = window.STATE || {};

  const NAV = [
    { g: 'Dash orders · read only', ro: true, items: [
      { r: '/', k: 'dashboard', t: 'Dashboard', e: '04' },
      { r: '/control-tower', k: 'control-tower', t: 'Control tower', e: '05·06' },
      { r: '/orders', k: 'orders', t: 'Orders', e: '05' },
      { r: '/drivers', k: 'drivers', t: 'Driver profiles', e: '07' },
      { r: '/customers', k: 'customers', t: 'Customer profiles', e: '08' }
    ]},
    { g: 'Commercial · you control', rw: true, items: [
      { r: '/merchants', k: 'merchants', t: 'Merchants', e: '09/10' },
      { r: '/marketplace', k: 'marketplace', t: '3PL Marketplace', e: '13' },
      { r: '/network', k: 'network', t: 'Dash Network', e: '12' },
      { r: '/overflow', k: 'overflow', t: 'Overflow orders', e: '12' }
    ]},
    { g: 'Insight', items: [
      { r: '/analytics', k: 'analytics', t: 'Performance and analytics', e: '11' },
      { r: '/billing', k: 'billing', t: 'Billing and payouts', e: '16' }
    ]},
    { g: 'Account and platform', items: [
      { r: '/roles', k: 'roles', t: 'Roles and permissions', e: '14' },
      { r: '/notifications', k: 'notifications', t: 'Notifications', e: '15' },
      { r: '/developer', k: 'developer', t: 'Developer', e: '17' },
      { r: '/account', k: 'account', t: 'Account settings', e: '03' },
      { r: '/security', k: 'security', t: 'Authentication', e: '02' },
      { r: '/onboarding', k: 'onboarding', t: 'Verification', e: '01' },
      { r: '/support', k: 'support', t: 'Support', e: '18' },
      { r: '/audit', k: 'audit', t: 'Audit log', e: '19' }
    ]}
  ];

  function sidebar(route) {
    const unread = D().NOTIFS.filter(n => n.sev !== 'low').length;
    return `
      <a class="brand" href="#/"><span class="brand-w">DASH</span><span class="brand-d"></span><span class="brand-p">3PL</span></a>
      <div class="acct-chip">
        <div><b>${D().BIZ.name}</b><em>${D().BIZ.fleet.split(' · ')[0]} · ${D().BILLING.plan}</em></div>
        <span class="ver">Verified</span>
      </div>
      <nav class="nav">
        ${NAV.map(sec => `<div class="nav-g">${sec.g}</div>
          ${sec.items.map(i => `<a class="nav-i ${route === i.r || (i.r !== '/' && route.startsWith(i.r)) ? 'on' : ''}" href="#${i.r}">
            <span style="display:flex;align-items:center;gap:7px">${sec.ro ? '<i class="ro-d"></i>' : sec.rw ? '<i class="rw-d"></i>' : ''}${i.t}</span>
            ${i.r === '/notifications' && unread ? `<em class="badge">${unread}</em>` : `<em class="epic">${i.e}</em>`}</a>`).join('')}`).join('')}
      </nav>
      <div class="nav-foot"><div class="who sm"><span class="av">FM</span><span>Faisal Al Mutairi<em>Admin · ${D().BIZ.ownSystem}</em></span></div></div>`;
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
  const now = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  const A = {
    go: a => { location.hash = '#' + a; },
    closeDrawer: () => UI.closeDrawer(),
    stub: a => UI.toast(a || 'Read only in Dash — do this in Sahel OMS'),

    ofF: (a, el) => { STATE.of[a] = el.value; render(); },
    ofQ: (a, el) => { STATE.of.q = el.value; const p = el.selectionStart; render(); const i = document.querySelector('[data-act="ofQ"]'); if (i) { i.focus(); i.setSelectionRange(p, p); } },
    ofReset: () => { STATE.of = { status: 'All statuses', source: 'All sources', merchant: 'All merchants', zone: 'All zones', q: '' }; render(); },
    reportTab: a => { STATE.rt = a; render(); },

    /* control tower — shared filters, both views. No state-changing actions. */
    ctF: (arg, el) => {
      const f = STATE.ct;
      f[arg] = el.value;
      if (arg === 'city') f.district = 'All districts';
      render();
    },
    ctF2: arg => { const [k, v] = arg.split('|'); STATE.ct[k] = v; render(); },
    ctView: v => { STATE.ct.view = v; render(); },
    ctReset: () => {
      const v = STATE.ct.view;
      STATE.ct = { view: v, city:'All cities', district:'All districts', status:'All statuses',
        merchant:'All merchants', source:'All sources', type:'All types' };
      render();
    },
    ctPick: id => { location.hash = '#/orders/' + id; },

    mapLayer: (a, el) => { const on = !el.classList.contains('on'); el.classList.toggle('on', on); MAP.toggleLayer(a, on); },
    focusOrder: a => MAP.focusOrder(a),

    /* the two real order actions */
    acceptOrder: id => {
      const d = D(), o = d.order(id);
      o.status = 'Accepted'; o.ref = 'SAHEL-772' + (20 + Math.floor(Math.random() * 40));
      o.log.push({ t: now(), e: 'Accepted', s: 'Pulled into ' + d.BIZ.ownSystem + ' · ref ' + o.ref });
      d.AUDIT.unshift({ t: now(), u: 'Faisal Al Mutairi', r: 'Admin', a: 'Accepted network order', o: id, ip: '188.55.x.x' });
      UI.toast(id + ' accepted — assign a driver in ' + d.BIZ.ownSystem); render();
    },
    declineOrder: id => {
      const d = D();
      UI.drawer('Decline <b>' + id + '</b>', `
        <div class="dw-meta">Declining costs you nothing and does not affect future offers. Dash will offer it to someone else.</div>
        <div class="cands">${['No vehicle available', 'Outside our coverage', 'No refrigerated vehicle', 'At capacity for this hour', 'Price too low for the distance']
          .map(r => `<button type="button" class="cand pick" data-act="doDecline" data-arg="${id}|${r}">
            <span class="cand-n">·</span><div><b>${r}</b></div></button>`).join('')}</div>`);
    },
    doDecline: a => {
      const [id, r] = a.split('|'), d = D(), o = d.order(id);
      o.status = 'Declined'; o.revenue = 0;
      o.log.push({ t: now(), e: 'Declined by you', s: 'Reason: ' + r.toLowerCase() + ' · no penalty' });
      d.AUDIT.unshift({ t: now(), u: 'Faisal Al Mutairi', r: 'Admin', a: 'Declined network order', o: id + ' · ' + r, ip: '188.55.x.x' });
      UI.closeDrawer(); UI.toast(id + ' declined — ' + r.toLowerCase()); render();
    },
    waybill: id => UI.drawer('Waybill — <b>' + id + '</b>', (() => {
      const d = D(), o = d.order(id), m = d.merchant(o.merchant), c = d.customer(o.customer);
      return `<div class="waybill big"><div class="wb-h"><b>SAHEL LOGISTICS</b><span>${o.ref === '—' ? o.id : o.ref}</span></div>
        <div class="wb-b">
          <div><em>Dash id</em>${o.id}</div>
          <div><em>From</em>${m.name} · ${o.zone}</div>
          <div><em>To</em>${o.addr}</div>
          <div><em>Customer</em>${c.name} · ${c.phone}</div>
          <div><em>Items</em>${o.items}</div>
          <div><em>COD</em>${o.cod ? UI.money(o.cod) : 'Cash free'}</div>
          <div><em>Proof</em>${o.pod.join(', ')}</div>
          <div><em>Driver</em>${o.driver ? d.driver(o.driver).name + ' · ' + d.driver(o.driver).vehicle : 'Assigned in Sahel OMS'}</div>
        </div><div class="wb-c">▌▐▌▌▐▐▌▐▌▌▐▌▐▐▌▌▐▌▐▌▐▐▌▌▐▐▌▐▌▌▐</div></div>`;
    })(), { footer: UI.btn('Print', { kind: 'primary', act: 'printWb' }) }),
    printWb: () => { UI.closeDrawer(); UI.toast('Sent to printer'); },

    /* flags — the one editable field on read-only profiles */
    flagDriver: id => {
      const x = D().driver(id);
      x.flagged = !x.flagged;
      if (x.flagged && !x.flagNote) x.flagNote = 'Flagged today by Faisal Al Mutairi. Raise it with your operations team.';
      D().AUDIT.unshift({ t: now(), u: 'Faisal Al Mutairi', r: 'Admin', a: x.flagged ? 'Flagged driver' : 'Unflagged driver', o: x.name, ip: '188.55.x.x' });
      UI.toast(x.name + (x.flagged ? ' flagged' : ' unflagged')); render();
    },
    flagCustomer: id => {
      const c = D().customer(id);
      c.flagged = !c.flagged;
      if (c.flagged && !c.note) c.note = 'Flagged today — warn the driver before dispatch.';
      UI.toast(c.name + (c.flagged ? ' flagged' : ' unflagged')); render();
    },

    /* commercial layer */
    editContract: id => {
      const d = D(), m = d.merchant(id);
      if (!m.contract) return UI.toast('No contract — Dash prices Network orders');
      UI.drawer('Contract — <b>' + m.name + '</b>', `
        <div class="dw-meta">A commercial agreement between you and ${m.name}. Dash does not intervene.</div>
        ${UI.field('Pricing', UI.input(m.contract.pricing))}
        ${UI.field('Payment terms', UI.select(['Net 15', 'Net 30', 'Net 45', 'Prepaid'], m.contract.terms))}
        ${UI.field('Monthly minimum', UI.input(m.contract.minMonthly))}
        ${UI.field('Start date', UI.input(m.contract.start, '', { type: 'date' }))}
        ${UI.field('End date', UI.input(m.contract.end, '', { type: 'date' }))}
        ${UI.field('Status', UI.radio(['Active', 'Expiring', 'Ended'], m.contract.status, 'stub'))}
        ${UI.note('Changes apply to new orders.', 'Orders already delivered keep the price they were charged at.', D().PAL.vodka)}`,
        { footer: UI.btn('Save contract', { kind: 'primary', act: 'saveContract', arg: id }) });
    },
    saveContract: id => {
      const m = D().merchant(id);
      D().AUDIT.unshift({ t: now(), u: 'Faisal Al Mutairi', r: 'Admin', a: 'Updated contract', o: m.name, ip: '188.55.x.x' });
      UI.closeDrawer(); UI.toast('Contract with ' + m.name + ' saved'); render();
    },
    renewContract: id => {
      const m = D().merchant(id);
      m.contract.status = 'Active'; m.contract.end = '2027-12-07';
      UI.toast(m.name + ' contract renewed to 7 Dec 2027'); render();
    },
    approveRequest: id => {
      const d = D(), m = d.merchant(id);
      m.rel = 'Commercial'; m.kind = 'Marketplace'; m.since = '29 Aug 2026';
      m.contract = { pricing: 'SAR 12.50 flat, zone-capped', terms: 'Net 30', start: '2026-08-29', end: '2027-08-28', status: 'Active', minMonthly: 'None' };
      m.note = 'Approved 29 August. Set the real pricing with them next.';
      d.LISTING.requests += 0;
      d.AUDIT.unshift({ t: now(), u: 'Faisal Al Mutairi', r: 'Admin', a: 'Approved merchant request', o: m.name, ip: '188.55.x.x' });
      UI.toast(m.name + ' approved — build their pricing contract next');
      location.hash = '#/merchants/' + id;
    },
    rejectRequest: id => {
      const m = D().merchant(id);
      UI.drawer('Reject <b>' + m.name + '</b>', `
        <div class="dw-meta">They see the reason you pick. Rejecting does not affect your listing or your rating.</div>
        <div class="cands">${['Outside our coverage areas', 'Volume too high for our capacity', 'We cannot meet their service requirements', 'Pricing expectations do not work for us', 'Not taking new merchants right now']
          .map(r => `<button type="button" class="cand pick" data-act="doReject" data-arg="${id}|${r}">
            <span class="cand-n">·</span><div><b>${r}</b></div></button>`).join('')}</div>`);
    },
    doReject: a => {
      const [id, r] = a.split('|'), m = D().merchant(id);
      m.rel = 'Rejected'; m.note = 'Rejected 29 August — reason: ' + r.toLowerCase() + '.';
      D().MERCHANTS.splice(D().MERCHANTS.indexOf(m), 1);
      UI.closeDrawer(); UI.toast(m.name + ' rejected — ' + r.toLowerCase()); location.hash = '#/marketplace';
    },
    disconnectMerchant: id => {
      const d = D(), m = d.merchant(id);
      m.rel = 'Auto generated'; m.kind = 'Network'; m.contract = null; m.since = '—';
      m.note = 'Disconnected. Their orders can still reach you through Dash Network, but at Dash pricing.';
      UI.closeDrawer(); UI.toast(m.name + ' disconnected — no contract, Network routing only'); render();
    },

    /* network roles */
    netSupply: () => { const n = D().NETWORK.supply; n.on = !n.on; UI.toast('Supply ' + (n.on ? 'resumed' : 'paused')); render(); },
    netDemand: () => { const n = D().NETWORK.demand; n.on = !n.on; UI.toast('Demand ' + (n.on ? 'resumed' : 'paused')); render(); },
    netSupplyJoin: () => { D().NETWORK.supply.state = 'Pending'; UI.toast('Supply request sent to Dash'); render(); },
    netDemandJoin: () => { D().NETWORK.demand.state = 'Pending'; UI.toast('Demand request sent to Dash'); render(); },
    netWithdraw: role => {
      const n = D().NETWORK;
      if (role.startsWith('Supply')) { n.supply.state = 'Not joined'; n.supply.on = false; }
      else { n.demand.state = 'Not joined'; n.demand.on = false; }
      UI.toast('Withdrawn from ' + role + ' — you would need to reapply'); render();
    },

    /* listing */
    lsZone: z => { const l = D().LISTING, i = l.zones.indexOf(z); i < 0 ? l.zones.push(z) : l.zones.splice(i, 1); render(); },
    lsVeh: v => { const l = D().LISTING, i = l.vehicles.indexOf(v); i < 0 ? l.vehicles.push(v) : l.vehicles.splice(i, 1); render(); },
    lsCap: c => { const l = D().LISTING, i = l.caps.indexOf(c); i < 0 ? l.caps.push(c) : l.caps.splice(i, 1); render(); },
    toggleListing: () => { const l = D().LISTING; l.listed = !l.listed; UI.toast(l.listed ? 'Listing is live again' : 'Unlisted — your contracts continue'); render(); },
    submitListing: () => { D().LISTING.status = 'Pending'; UI.toast('Listing submitted for Dash approval'); render(); },

    /* platform */
    export: what => UI.toast('Exported ' + what + ' — file downloaded'),
    scheduleReport: () => UI.toast('Report scheduled — daily at 23:45 to ops@sahel-logistics.sa'),
    withdraw: () => { const b = D().BILLING; UI.toast(UI.money(2740) + ' sent to ' + b.payoutMethod); },
    topUp: () => { const b = D().BILLING; b.balance += 2000; b.tx.unshift({ d: 'Today ' + now(), t: 'Wallet top-up', a: 2000 }); UI.toast('SAR 2,000 added to your wallet'); render(); },
    changePlan: n => UI.toast('Plan change to ' + n + ' requested — Dash will confirm'),
    genKey: () => UI.toast('New key generated: dsh_live_4f88••••'),
    newTicket: () => { D().TICKETS.unshift({ id: 'TK-44' + (30 + Math.floor(Math.random() * 60)), s: 'Open', p: 'Normal', t: 'New ticket from the dashboard', link: '—', opened: 'Today ' + now(), last: 'Just sent', kind: 'Something else' }); UI.toast('Ticket submitted to Dash Hub'); render(); },
    ticketFor: id => { D().TICKETS.unshift({ id: 'TK-44' + (30 + Math.floor(Math.random() * 60)), s: 'Open', p: 'High', t: 'Query on ' + id, link: id, opened: 'Today ' + now(), last: 'Just sent', kind: 'Order or routing problem' }); UI.toast('Ticket opened for ' + id + ' with the full routing trace'); },
    acctLang: (a, el) => { STATE.acct.lang = el.value; },
    acctTz: (a, el) => { STATE.acct.tz = el.value; },
    acctCur: (a, el) => { STATE.acct.cur = el.value; },
    saveAcct: () => UI.toast('Account settings saved'),
    npIncoming: (a, el) => { STATE.np.incoming = !STATE.np.incoming; el.classList.toggle('on', STATE.np.incoming); },
    npStatus: (a, el) => { STATE.np.status = !STATE.np.status; el.classList.toggle('on', STATE.np.status); },
    npOverflow: (a, el) => { STATE.np.overflow = !STATE.np.overflow; el.classList.toggle('on', STATE.np.overflow); },
    npCommercial: (a, el) => { STATE.np.commercial = !STATE.np.commercial; el.classList.toggle('on', STATE.np.commercial); },
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
    if (['ofQ'].includes(act) && A[act]) A[act](t.getAttribute('data-arg'), t);
  });

  window.addEventListener('hashchange', render);
  window.RENDER = render;
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
