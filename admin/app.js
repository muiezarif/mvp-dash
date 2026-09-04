/* Dash Admin — router, sidebar, actions */
(function () {
  const D = () => window.ADM;
  window.STATE = window.STATE || {};

  const NAV = [
    { g: 'Platform', items: [
      { r: '/', k: 'dashboard', t: 'Platform dashboard', e: '03' },
      { r: '/control-tower', k: 'control-tower', t: 'Global control tower', e: '07' }
    ]},
    { g: 'Dash Network', pill: 'Product 06', items: [
      { r: '/network', k: 'network', t: 'Participants and control', e: '01·05·06' },
      { r: '/network-requests', k: 'network-requests', t: 'Join requests', e: '02' },
      { r: '/contracts', k: 'contracts', t: 'Participation contracts', e: '02·10' },
      { r: '/sla', k: 'sla', t: 'SLA and service policy', e: '16' },
      { r: '/network-monitor', k: 'network-monitor', t: 'Monitoring', e: '07' },
      { r: '/routing', k: 'routing', t: 'Routing engine', e: '09·10' }
    ]},
    { g: 'Marketplace', pill: 'Product 07', items: [
      { r: '/marketplace', k: 'marketplace', t: 'Listings', e: '10' },
      { r: '/marketplace-monitor', k: 'marketplace-monitor', t: 'Connections', e: '11' }
    ]},
    { g: 'Accounts', items: [
      { r: '/clients', k: 'clients', t: 'Clients', e: '04' },
      { r: '/verification', k: 'verification', t: 'Verification', e: '05' },
      { r: '/freelancers', k: 'freelancers', t: 'Freelancers', e: '06' },
      { r: '/customers', k: 'customers', t: 'Customer directory', e: '12' }
    ]},
    { g: 'Money', items: [
      { r: '/billing', k: 'billing', t: 'Billing and revenue', e: '10' },
      { r: '/payouts', k: 'payouts', t: 'Payouts', e: '10' },
      { r: '/settlement', k: 'settlement', t: 'Settlement', e: '10' }
    ]},
    { g: 'Operations', items: [
      { r: '/support', k: 'support', t: 'Support — Dash Hub', e: '11' },
      { r: '/announcements', k: 'announcements', t: 'Announcements', e: '13' },
      { r: '/notifications', k: 'notifications', t: 'Notifications', e: '03' },
      { r: '/reports', k: 'reports', t: 'Reports', e: '14' }
    ]},
    { g: 'Administration', items: [
      { r: '/team', k: 'team', t: 'Team and permissions', e: '15' },
      { r: '/settings', k: 'settings', t: 'System settings', e: '16' },
      { r: '/audit', k: 'audit', t: 'Audit log', e: '17' }
    ]}
  ];

  function sidebar(route) {
    const unread = D().NOTIFS.filter(n => n.sev === 'high').length;
    return `
      <a class="brand" href="#/"><span class="brand-w">DASH</span><span class="brand-d"></span><span class="brand-p">ADMIN</span></a>
      <div class="internal"><i></i><span>Internal · staff only</span></div>
      <div class="acct-chip">
        <div><b>Dash Platform</b><em>195 clients · 3 products</em></div>
        <span class="ver">Live</span>
      </div>
      <nav class="nav">
        ${NAV.map(sec => `<div class="nav-g">${sec.g}${sec.pill ? `<em style="float:right;font-style:normal;font:500 8px ui-monospace,Menlo,monospace;color:#7E7E7E;letter-spacing:.1em">${sec.pill}</em>` : ''}</div>
          ${sec.items.map(i => `<a class="nav-i ${route === i.r || (i.r !== '/' && route.startsWith(i.r)) ? 'on' : ''}" href="#${i.r}">
            <span>${i.t}</span>${i.r === '/notifications' && unread ? `<em class="badge">${unread}</em>` : `<em class="epic">${i.e}</em>`}</a>`).join('')}`).join('')}
      </nav>
      <div class="nav-foot"><div class="who sm"><span class="av">DR</span><span>${D().ME.name}<em>${D().ME.role}</em></span></div></div>`;
  }

  function parse() {
    let h = (location.hash || '#/').replace('#', '') || '/';
    if (h === '/global-map') { location.replace('#/control-tower'); h = '/control-tower'; }
    const p = h.split('/').filter(Boolean);
    if (!p.length) return { key: 'dashboard', route: '/', arg: null };
    if (p[0] === 'control-tower' && p[1]) return { key: 'gorder', route: '/control-tower', arg: p[1] };
    if (p[0] === 'clients' && p[1]) return { key: 'client', route: '/clients', arg: p[1] };
    if (p[0] === 'freelancers' && p[1]) return { key: 'freelancer', route: '/freelancers', arg: p[1] };
    if (p[0] === 'marketplace' && p[1]) return { key: 'listing', route: '/marketplace', arg: p[1] };
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
  const log = (a, o, r) => D().AUDIT.unshift({ t: now(), u: D().ME.name, r: r || D().ME.role, a, o, ip: '188.55.x.x' });

  const A = window.ACT = Object.assign(window.ACT || {}, {
    go: a => { location.hash = '#' + a; },
    closeDrawer: () => UI.closeDrawer(),
    stub: a => UI.toast(a || 'Not part of this prototype'),
    clientByName: n => { const c = D().CLIENTS.find(x => x.name === n); c ? location.hash = '#/clients/' + c.id : UI.toast(n + ' is not a client account yet'); },

    /* control tower — shared filters, both views */
    ctF: (arg, el) => {
      const f = STATE.ct;
      f[arg] = el.value;
      if (arg === 'city') { f.district = 'All districts'; f.zone = 'All zones'; }
      if (arg === 'district') f.zone = 'All zones';
      render();
    },
    ctQ: (arg, el) => {
      STATE.ct.q = el.value;
      const p = el.selectionStart; render();
      const i = document.querySelector('[data-act="ctQ"]');
      if (i) { i.focus(); i.setSelectionRange(p, p); }
    },
    ctView: v => { STATE.ct.view = v; render(); },
    ctReset: () => {
      const v = STATE.ct.view;
      STATE.ct = { view: v, client:'All clients', ctype:'All client types', city:'Riyadh',
        district:'All districts', zone:'All zones', status:'All statuses', source:'All sources',
        type:'All types', by:'All providers', sla:'All SLA states', q:'' };
      render();
    },
    ctPick: id => {
      if (STATE.ct.view === 'Map') MAP.focusOrder(id);
      window.ACT.xTrace(id);
    },

    /* filters */
    gfF: (a, el) => { STATE.gf[a] = el.value; render(); },
    gfQ: (a, el) => { STATE.gf.q = el.value; const p = el.selectionStart; render(); const i = document.querySelector('[data-act="gfQ"]'); if (i) { i.focus(); i.setSelectionRange(p, p); } },
    gfReset: () => { STATE.gf = { client: 'All clients', source: 'All sources', status: 'All statuses', zone: 'All zones', product: 'All products', scope: 'All orders', q: '' }; render(); },
    cfF: (a, el) => { STATE.cf[a] = el.value; render(); },
    cfQ: (a, el) => { STATE.cf.q = el.value; const p = el.selectionStart; render(); const i = document.querySelector('[data-act="cfQ"]'); if (i) { i.focus(); i.setSelectionRange(p, p); } },
    cfReset: () => { STATE.cf = { type: 'All types', state: 'All states', product: 'All products', q: '' }; render(); },
    rfF: (a, el) => { STATE.rf[a] = el.value; render(); },
    tfF: (a, el) => { STATE.tf[a] = el.value; render(); },
    billTab: a => { STATE.bt = a; render(); },

    mapLayer: (a, el) => { const on = !el.classList.contains('on'); el.classList.toggle('on', on); MAP.toggleLayer(a, on); },
    focusOrder: a => MAP.focusOrder(a),

    /* control tower — scope enforced */
    reassign: id => {
      const d = D(), o = d.order(id);
      if (o.scope !== 'dash') return UI.toast('Dash cannot reassign a ' + o.source.toLowerCase() + ' order — escalate to the owner');
      UI.drawer('Reassign <b>' + id + '</b>', `
        <div class="dw-meta">${o.merchant} · ${o.zone} · ${o.status}. Dash Network routed this, so Dash may reroute it.</div>
        <div class="cands">${d.NETWORK.supply.filter(s => s.state === 'Active').map((s, i) => `
          <button type="button" class="cand pick" data-act="doReassign" data-arg="${id}|${s.name}">
            <span class="cand-n">${i + 1}</span>
            <div><b>${s.name}</b><em>${s.cat} · accepts ${s.accept}% · completes ${s.complete}%</em></div>
          </button>`).join('')}</div>`);
    },
    doReassign: a => {
      const [id, node] = a.split('|'), o = D().order(id);
      o.provider = node; o.status = 'Assigned'; o.stuck = 0;
      o.log.push({ t: now(), e: 'Reassigned by Dash', s: 'Routed to ' + node + ' · ' + D().ME.name });
      log('Reassigned order', id + ' → ' + node);
      UI.closeDrawer(); UI.toast(id + ' reassigned to ' + node); render();
    },
    cancelOrder: id => {
      const o = D().order(id);
      if (o.scope !== 'dash') return UI.toast('Only ' + o.merchant + ' can cancel their own order');
      o.status = 'Cancelled'; o.stuck = 0;
      o.log.push({ t: now(), e: 'Cancelled by Dash', s: 'Network order · ' + D().ME.name });
      log('Cancelled order', id);
      UI.toast(id + ' cancelled'); render();
    },
    escalateOwner: id => {
      const d = D(), o = d.order(id);
      d.TICKETS.unshift({ id: 'TK-5' + (100 + Math.floor(Math.random() * 800)), from: o.merchant, product: o.product,
        kind: 'Escalation', p: 'High', s: 'Open', t: 'Dash escalated ' + id + ' — ' + o.status.toLowerCase() + ' for ' + (o.stuck || 0) + ' min',
        link: id, assignee: d.ME.name, opened: 'Today ' + now(), last: 'Just sent' });
      o.log.push({ t: now(), e: 'Escalated by Dash', s: 'Owner notified · ' + o.merchant + ' and ' + o.provider });
      log('Escalated to owner', id);
      UI.toast(id + ' escalated to ' + o.merchant + ' — ticket opened'); render();
    },
    escalateOrder: id => { A.escalateOwner(id); },
    ticketFor: id => { A.escalateOwner(id); },

    /* network */
    netMaster: () => {
      const n = D().NETWORK; n.master = !n.master;
      log(n.master ? 'Enabled Dash Network' : 'Disabled Dash Network', 'Platform wide', 'Super Admin');
      UI.toast(n.master ? 'Dash Network is on' : 'Dash Network off — all orders fall back to direct routing'); render();
    },
    netCat: (a, el) => {
      const c = D().NETWORK.categories[a]; c.on = !c.on;
      log(c.on ? 'Enabled category' : 'Disabled category', a + ' · Dash Network');
      UI.toast(a + ' ' + (c.on ? 'participating again' : 'switched off — every participant in this category stops')); render();
    },
    netPause: a => {
      const [side, id] = a.split('|'), p = D().NETWORK[side].find(x => x.id === id);
      p.state = 'Paused'; log('Paused participant', p.name + ' · ' + side); UI.toast(p.name + ' paused'); render();
    },
    netSuspend: a => {
      const [side, id] = a.split('|'), p = D().NETWORK[side].find(x => x.id === id);
      p.state = 'Suspended'; log('Suspended participant', p.name + ' · ' + side);
      UI.toast(p.name + ' suspended — they cannot undo this themselves'); render();
    },
    netResume: a => {
      const [side, id] = a.split('|'), p = D().NETWORK[side].find(x => x.id === id);
      p.state = 'Active'; log('Reactivated participant', p.name + ' · ' + side); UI.toast(p.name + ' active again'); render();
    },
    approveReq: id => {
      const d = D(), r = d.request(id);
      r.state = 'Approved';
      const side = r.role === 'Supply' ? 'supply' : 'demand';
      const node = d.NETWORK[side].find(x => x.name === r.who);
      if (node) node.state = 'Active';
      log('Approved Network role', r.who + ' · ' + r.role);
      UI.toast(r.who + ' approved for ' + r.role); render();
    },
    rejectReq: id => {
      const r = D().request(id);
      UI.drawer('Reject <b>' + r.who + '</b> — ' + r.role, `
        <div class="dw-meta">They see the reason. Rejecting one role says nothing about the other.</div>
        <div class="cands">${['Coverage already well served', 'Capacity too small to matter', 'No performance history yet — reapply after 100 direct orders', 'Verification concerns', 'Vehicle types do not match demand']
          .map(x => `<button type="button" class="cand pick" data-act="doRejectReq" data-arg="${id}|${x}">
            <span class="cand-n">·</span><div><b>${x}</b></div></button>`).join('')}</div>`);
    },
    doRejectReq: a => {
      const [id, why] = a.split('|'), r = D().request(id);
      r.state = 'Not joined'; r.note = 'Rejected ' + now() + ' — ' + why.toLowerCase() + '.';
      log('Rejected Network role', r.who + ' · ' + r.role + ' · ' + why);
      UI.closeDrawer(); UI.toast(r.who + ' rejected — ' + why.toLowerCase()); render();
    },
    revokeRole: id => {
      const d = D(), r = d.request(id);
      r.state = 'Pending';
      const side = r.role === 'Supply' ? 'supply' : 'demand';
      const node = d.NETWORK[side].find(x => x.name === r.who);
      if (node) node.state = 'Suspended';
      log('Revoked Network role', r.who + ' · ' + r.role);
      UI.toast(r.who + ' — ' + r.role + ' role revoked'); render();
    },
    rtMode: a => { D().NETWORK.routing.mode = a; UI.toast('Default routing mode: ' + a); render(); },
    rtDirect: () => { const r = D().NETWORK.routing; r.directHonoured = !r.directHonoured; render(); },
    rtSched: (a, el) => { D().NETWORK.routing.schedLead = +el.value; render(); },
    saveRouting: () => { log('Changed routing configuration', 'Mode ' + D().NETWORK.routing.mode + ' · lead ' + D().NETWORK.routing.schedLead + ' min'); UI.toast('Routing configuration saved'); },

    /* marketplace */
    approveListing: id => { const l = D().listing(id); l.state = 'Live'; l.approved = '30 Aug 2026'; log('Approved listing', l.provider); UI.toast(l.provider + ' listing is live'); render(); },
    rejectListing: id => {
      const l = D().listing(id);
      UI.drawer('Reject <b>' + l.provider + '</b> listing', `
        <div class="dw-meta">The provider sees the reason and can resubmit. We reject listings; we never edit them.</div>
        <div class="cands">${['Coverage claim not credible for their fleet size', 'Pricing is misleading', 'Capabilities claimed without the vehicles for them', 'Company description incomplete']
          .map(x => `<button type="button" class="cand pick" data-act="doRejectListing" data-arg="${id}|${x}">
            <span class="cand-n">·</span><div><b>${x}</b></div></button>`).join('')}</div>`);
    },
    doRejectListing: a => {
      const [id, why] = a.split('|'), l = D().listing(id);
      l.state = 'Draft'; l.note = 'Rejected 30 Aug — ' + why.toLowerCase() + '.';
      log('Rejected listing', l.provider + ' · ' + why);
      UI.closeDrawer(); UI.toast(l.provider + ' listing rejected'); render();
    },
    suspendListing: id => { const l = D().listing(id); l.state = 'Suspended'; l.featured = false; l.note = 'Suspended 30 Aug by ' + D().ME.name + '.'; log('Suspended listing', l.provider); UI.toast(l.provider + ' listing suspended — existing connections continue'); render(); },
    reinstateListing: id => { const l = D().listing(id); l.state = 'Live'; log('Reinstated listing', l.provider); UI.toast(l.provider + ' listing is live again'); render(); },
    featureListing: id => {
      const l = D().listing(id); l.featured = !l.featured;
      log(l.featured ? 'Featured listing' : 'Removed feature', l.provider);
      UI.toast(l.provider + (l.featured ? ' featured on the browse page' : ' no longer featured')); render();
    },
    rankUp: id => {
      const d = D(), l = d.listing(id);
      const live = d.LISTINGS.filter(x => x.state === 'Live').sort((a, b) => a.rank - b.rank);
      const i = live.indexOf(l); if (i <= 0) return;
      const other = live[i - 1]; const t = l.rank; l.rank = other.rank; other.rank = t;
      log('Reordered Marketplace ranking', l.provider + ' → #' + l.rank); render();
    },
    rankDown: id => {
      const d = D(), l = d.listing(id);
      const live = d.LISTINGS.filter(x => x.state === 'Live').sort((a, b) => a.rank - b.rank);
      const i = live.indexOf(l); if (i < 0 || i >= live.length - 1) return;
      const other = live[i + 1]; const t = l.rank; l.rank = other.rank; other.rank = t;
      log('Reordered Marketplace ranking', l.provider + ' → #' + l.rank); render();
    },

    /* clients and verification */
    suspendClient: id => {
      const c = D().client(id); c.state = 'Suspended';
      c.note = 'Suspended 30 Aug by ' + D().ME.name + '. Orders in flight will finish.';
      log('Suspended client', c.name, 'Super Admin');
      UI.toast(c.name + ' suspended — orders in flight finish normally'); render();
    },
    reactivateClient: id => { const c = D().client(id); c.state = 'Active'; c.note = ''; log('Reactivated client', c.name, 'Super Admin'); UI.toast(c.name + ' reactivated'); render(); },
    verifyClient: id => {
      const d = D(), v = d.verify(id);
      if (v.docs.some(x => ['Expired','Unreadable','Missing'].includes(x.s)))
        return UI.toast('Cannot verify — ' + v.docs.find(x => ['Expired','Unreadable','Missing'].includes(x.s)).k + ' is ' + v.docs.find(x => ['Expired','Unreadable','Missing'].includes(x.s)).s.toLowerCase());
      d.VERIFY.splice(d.VERIFY.indexOf(v), 1);
      const c = d.CLIENTS.find(x => x.name === v.client);
      if (c) { c.state = 'Active'; c.verified = '30 Aug 2026'; c.note = ''; }
      log('Verified client', v.client);
      UI.toast(v.client + ' verified — full access granted'); render();
    },
    rejectVerify: id => {
      const v = D().verify(id);
      UI.drawer('Reject <b>' + v.client + '</b>', `
        <div class="dw-meta">They see this reason in plain words on their onboarding page, and can resubmit as many times as they need.</div>
        <div class="cands">${['A document is unreadable — rescan and resubmit', 'Commercial registration does not match the trade name', 'VAT certificate has expired', 'Municipality licence missing']
          .map(x => `<button type="button" class="cand pick" data-act="doRejectVerify" data-arg="${id}|${x}">
            <span class="cand-n">·</span><div><b>${x}</b></div></button>`).join('')}</div>`);
    },
    doRejectVerify: a => {
      const [id, why] = a.split('|'), v = D().verify(id);
      v.state = 'Blocked'; v.note = 'Rejected 30 Aug — ' + why.toLowerCase() + '. Resubmission welcome.';
      log('Rejected verification', v.client + ' · ' + why);
      UI.closeDrawer(); UI.toast(v.client + ' told why, and can resubmit'); render();
    },
    requestResubmit: id => { const v = D().verify(id); log('Requested resubmission', v.client); UI.toast(v.client + ' asked to resubmit — email and dashboard notice sent'); },
    assignVerify: id => { const v = D().verify(id); v.assignee = D().ME.name; UI.toast('Assigned to you'); render(); },

    /* freelancers */
    approveFreelancer: id => {
      const f = D().freelancer(id);
      if (f.docs.some(x => x.s === 'Missing')) return UI.toast('Cannot approve — vehicle insurance was never uploaded');
      f.state = 'Active'; f.approved = '30 Aug 2026'; f.note = '';
      f.docs.forEach(x => { if (x.s === 'Accepted') x.s = 'Valid'; });
      log('Approved freelancer', f.name);
      UI.toast(f.name + ' approved — they now receive Network offers'); render();
    },
    rejectFreelancer: id => { const f = D().freelancer(id); D().FREELANCERS.splice(D().FREELANCERS.indexOf(f), 1); log('Rejected freelancer', f.name); UI.toast(f.name + ' rejected'); location.hash = '#/freelancers'; },
    suspendFreelancer: id => { const f = D().freelancer(id); f.state = 'Suspended'; f.note = 'Suspended 30 Aug by ' + D().ME.name + '.'; log('Suspended freelancer', f.name); UI.toast(f.name + ' suspended — no more offers'); render(); },
    reinstateFreelancer: id => {
      const f = D().freelancer(id);
      if (f.docs.some(x => x.s === 'Expired')) return UI.toast('Cannot reinstate — a document is still expired');
      f.state = 'Active'; f.note = ''; log('Reinstated freelancer', f.name); UI.toast(f.name + ' active again'); render();
    },
    chaseDocs: id => { const f = D().freelancer(id); UI.toast(f.name + ' asked again for vehicle insurance — SMS and push sent'); },
    expirySweep: () => {
      const d = D();
      let flagged = 0, susp = 0;
      d.FREELANCERS.forEach(f => {
        if (f.docs.some(x => x.s === 'Expired') && f.state === 'Active') { f.state = 'Suspended'; susp++; }
        else if (f.docs.some(x => x.s === 'Expiring')) flagged++;
      });
      log('Ran document expiry sweep', flagged + ' flagged, ' + susp + ' suspended', 'System');
      UI.toast('Sweep complete — ' + flagged + ' flagged, ' + susp + ' auto-suspended'); render();
    },

    /* money */
    approveWithdrawal: id => {
      const w = D().REVENUE.withdrawals.find(x => x.id === id);
      if (w.state === 'Blocked') return UI.toast('Blocked — ' + w.who + ' owes Dash money');
      D().REVENUE.withdrawals.splice(D().REVENUE.withdrawals.indexOf(w), 1);
      log('Approved withdrawal', w.who + ' · ' + UI.money(w.amount), 'Finance');
      UI.toast(UI.money(w.amount) + ' released to ' + w.who); render();
    },
    holdWithdrawal: id => { const w = D().REVENUE.withdrawals.find(x => x.id === id); w.state = 'Held'; w.flag = w.flag || 'Held for review by ' + D().ME.name; log('Held withdrawal', w.who, 'Finance'); UI.toast(w.who + ' withdrawal held'); render(); },
    approveAllWithdrawals: () => {
      const r = D().REVENUE;
      const clean = r.withdrawals.filter(w => w.state === 'Pending' && !w.flag);
      clean.forEach(w => r.withdrawals.splice(r.withdrawals.indexOf(w), 1));
      log('Approved withdrawals in bulk', clean.length + ' payouts', 'Finance');
      UI.toast(clean.length + ' clean withdrawals released — flagged ones left for review'); render();
    },
    ruleDispute: a => {
      const [id, side] = a.split('|'), x = D().REVENUE.disputes.find(y => y.id === id);
      x.state = 'Resolved';
      log('Ruled on dispute', x.id.toUpperCase() + ' · ' + x.order + ' for the ' + side, 'Super Admin');
      UI.toast('Ruled for the ' + side + ' — ' + UI.money(x.amount) + ' settled on ' + x.order); render();
    },

    /* ops */
    assignTicket: id => { const t = D().TICKETS.find(x => x.id === id); t.assignee = D().ME.name; UI.toast(id + ' assigned to you'); render(); },
    resolveTicket: id => { const t = D().TICKETS.find(x => x.id === id); t.s = 'Resolved'; t.last = 'Resolved ' + now(); log('Resolved ticket', id, 'Support'); UI.toast(id + ' resolved'); render(); },
    newAnnouncement: () => {
      D().ANNOUNCEMENTS.unshift({ id: 'a' + Date.now(), t: 'New announcement', kind: 'Notice', audience: 'All clients',
        sent: '30 Aug 2026', reach: 195, state: 'Sent', body: 'Composed from the dashboard.' });
      log('Sent announcement', 'All clients · 195 recipients');
      UI.toast('Announcement sent to 195 clients'); render();
    },
    sendAnnouncement: id => { const a = D().ANNOUNCEMENTS.find(x => x.id === id); a.state = 'Sent'; a.sent = '30 Aug 2026'; log('Sent announcement', a.t); UI.toast('Sent to ' + a.reach + ' recipients'); render(); },
    export: what => { log('Exported data', what + ' · CSV', 'Finance'); UI.toast('Exported ' + what + ' — file downloaded'); },
    scheduleReport: () => UI.toast('Report scheduled — daily at 23:45 to ops@dash.sa'),
    reportTab: a => { STATE.rt = a; render(); }
  });

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
    if (['rtSched', 'gfQ', 'cfQ', 'ctQ'].includes(act) && A[act]) A[act](t.getAttribute('data-arg'), t);
  });

  window.addEventListener('hashchange', render);
  window.RENDER = render;
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
