/* Dash Admin — Dash Network participation contracts (Product 06).
   Nobody sends work into the Network or carries work for it without one of these.
   The contract is where the commission, the overflow rate and the SLA policy are agreed. */
window.SCREENS = window.SCREENS || {};
window.STATE = window.STATE || {};
window.ACT = window.ACT || {};

window.NETC = (function () {
  const STATES = ['Draft', 'Sent for signature', 'Active', 'Expiring', 'Terminated'];
  const STATE_COL = { Draft: '#c9c9c9', 'Sent for signature': '#FFEE50', Active: '#1f8a4c', Expiring: '#FFCC99', Terminated: '#FCA38B' };

  const CONTRACTS = [
    { id: 'NC-1041', party: 'Rehla Fleet', type: '3PL', role: 'Supply and demand', state: 'Active',
      commission: '8% of gross on orders they carry', overflow: 'Network rate card — SAR 13.50 base + SAR 1.10/km',
      terms: 'Net 15, netted against payouts', sla: 'Platform default — 15 / 45 min',
      zones: 'Zone North, Zone Central, Zone South', start: '6 Aug 2026', end: '5 Aug 2027', v: 'v3',
      signer: 'Majed Al Dosari (GM) · countersigned Dana Al Rasheed', notice: '30 days either side',
      note: 'Runs both directions: 612 orders carried and 84 pushed out last period.' },
    { id: 'NC-1038', party: 'Sahel Logistics', type: '3PL', role: 'Supply only', state: 'Active',
      commission: '8% of gross on orders they carry', overflow: 'Not permitted — supply role only',
      terms: 'Net 15', sla: 'Platform default — 15 / 45 min',
      zones: 'Zone East, Zone South', start: '3 Feb 2026', end: '2 Feb 2027', v: 'v2',
      signer: 'Hussam Al Otaibi (Ops Director)', notice: '30 days either side',
      note: 'Asked twice to add the demand role. Blocked until their OMS signing key is fixed.' },
    { id: 'NC-1044', party: 'Kanz Market', type: 'Merchant', role: 'Demand only', state: 'Active',
      commission: 'None — they buy deliveries, they do not carry them', overflow: 'Network rate card, 4% volume discount above 2,000 orders / month',
      terms: 'Net 15, invoiced on the 1st', sla: 'Platform default — 15 / 45 min',
      zones: 'All Riyadh', start: '12 Aug 2024', end: '11 Aug 2027', v: 'v4',
      signer: 'Faisal Al Kanz (Owner)', notice: '30 days either side',
      note: 'Renewed early in exchange for the volume discount.' },
    { id: 'NC-1046', party: 'Almasa Foods', type: 'Merchant', role: 'Demand only', state: 'Expiring',
      commission: 'None — demand role', overflow: 'Negotiated — SAR 12.50 flat, zone-capped',
      terms: 'Net 30', sla: 'Platform default — 15 / 45 min',
      zones: 'All Riyadh', start: '2 May 2023', end: '1 Oct 2026', v: 'v5',
      signer: 'Lama Al Suwaidi (CFO)', notice: '60 days — notice window opens 2 Aug',
      note: 'Largest merchant by volume and the only negotiated overflow rate. 27 days left.' },
    { id: 'NC-1051', party: 'Tayar Delivery', type: '3PL', role: 'Supply only', state: 'Sent for signature',
      commission: '8% of gross on orders they carry', overflow: 'Not permitted — supply role only',
      terms: 'Net 15', sla: 'Platform default — 15 / 45 min',
      zones: 'All Riyadh, Jeddah', start: 'On signature', end: '12 months from signature', v: 'v1',
      signer: 'Awaiting Tayar — sent 28 Aug, unopened', notice: '30 days either side',
      note: 'Refrigerated capacity Dash has no other source for. Chase before the weekend.' },
    { id: 'NC-1052', party: 'Bayt Market', type: 'Merchant', role: 'Demand only', state: 'Draft',
      commission: 'None — demand role', overflow: 'Network rate card',
      terms: 'Prepaid wallet — no credit until 3 months of history', sla: 'Platform default — 15 / 45 min',
      zones: 'Zone Central, Zone East', start: '—', end: '—', v: 'v1',
      signer: '—', notice: '30 days either side',
      note: 'Cannot be sent: verification is still open and their CR is unreadable.' },
    { id: 'NC-1049', party: 'Barq Riyadh', type: '3PL', role: 'Supply only', state: 'Terminated',
      commission: '8% of gross on orders they carry', overflow: 'Not permitted — supply role only',
      terms: 'Net 15', sla: 'Tightened — 12 / 40 min under a performance clause',
      zones: 'Zone North', start: '19 Jan 2026', end: 'Terminated 24 Aug 2026', v: 'v2',
      signer: 'Nawaf Al Barq (Owner)', notice: 'Terminated for cause — no notice required',
      note: 'On-time fell to 78% against a 90% floor and the wallet went negative. Two merchant complaints on file.' }
  ];

  const CLAUSES = [
    ['Role in the Network', 'Supply, demand, or both. The role decides which side of settlement they can appear on.'],
    ['Commission on carried orders', 'What Dash keeps from gross when they deliver a Network order.'],
    ['Overflow rate', 'What they pay Dash when they send an order into the Network. Rate card unless negotiated.'],
    ['Performance floor', 'On-time and acceptance minimums, and what happens when they are missed.'],
    ['SLA policy', 'The platform policy, or a named exception written into this contract.'],
    ['COD handling', 'Cash collected is never theirs — it nets off their payout on the statement.'],
    ['Notice and termination', 'Notice period, and the causes that let Dash terminate without one.']
  ];

  const AUDIT = [
    { t: 'Today 11:20', u: 'Dana Al Rasheed (Super Admin)', a: 'Sent for signature', o: 'NC-1051 · Tayar Delivery' },
    { t: '27 Aug 16:05', u: 'Khalid Al Anzi (Operations)', a: 'Flagged renewal', o: 'NC-1046 · Almasa Foods · 27 days left' },
    { t: '24 Aug 09:12', u: 'Dana Al Rasheed (Super Admin)', a: 'Terminated for cause', o: 'NC-1049 · Barq Riyadh' },
    { t: '6 Aug 14:41', u: 'Dana Al Rasheed (Super Admin)', a: 'Activated v3', o: 'NC-1041 · Rehla Fleet · demand role added' }
  ];

  return { CONTRACTS, STATES, STATE_COL, CLAUSES, AUDIT,
    get: id => CONTRACTS.find(c => c.id === id) };
})();

(function () {
  const U = UI, D = () => window.ADM, N = () => window.NETC;
  STATE.nc = STATE.nc || { state: 'All states', role: 'All roles', q: '' };
  const fg = (l, c) => '<span class="f-g"><span class="f-l">' + l + '</span>' + c + '</span>';

  SCREENS['contracts'] = {
    title: 'Participation contracts', epic: 'Epic 02 · 10 · Dash Network',
    render() {
      const d = D(), n = N(), f = STATE.nc;
      const count = s => n.CONTRACTS.filter(c => c.state === s).length;
      const rows = n.CONTRACTS.filter(c =>
        (f.state === 'All states' || c.state === f.state) &&
        (f.role === 'All roles' || c.role === f.role) &&
        (!f.q || (c.party + ' ' + c.id).toLowerCase().includes(f.q.toLowerCase())));

      return U.page('Participation contracts',
        'Nobody joins the Network on either side without one. The contract is where the commission, the overflow rate and the SLA policy are agreed',
        U.btn('Draft a contract', { kind: 'primary', act: 'ncNew' }) +
        U.btn('Join requests', { act: 'go', arg: '/network-requests' }) +
        U.btn('Export register', { act: 'export', arg: 'Network contract register' })) +
        U.mode('dash', 'These are Dash’s own agreements. Editing a term here changes what a participant is charged or paid from the next settlement period — never retroactively.') + `
        <div class="kpis k-4">
          ${U.kpi('Active', count('Active'), 'Trading on agreed terms', '#1f8a4c')}
          ${U.kpi('Expiring', count('Expiring'), 'Inside the notice window', d.PAL.peach)}
          ${U.kpi('Awaiting signature', count('Sent for signature'), 'Sent, not yet countersigned', d.PAL.lemon)}
          ${U.kpi('Drafts and terminated', count('Draft') + count('Terminated'), 'Not trading', d.PAL.vodka)}
        </div>
        ${U.note('Almasa Foods expires in 27 days.', 'Net 30 terms and a negotiated overflow rate — if it lapses they fall back to the rate card mid-period, which is a conversation nobody wants to have after the fact.', d.PAL.peach)}
        ${U.filters([
          U.input(f.q, 'Search a party or contract number…', { act: 'ncQ' }),
          fg('State', U.select(['All states'].concat(n.STATES), f.state, { act: 'ncF', arg: 'state' })),
          fg('Role', U.select(['All roles', 'Supply only', 'Demand only', 'Supply and demand'], f.role, { act: 'ncF', arg: 'role' })),
          '<span class="f-sp"></span><span class="f-c">' + rows.length + ' of ' + n.CONTRACTS.length + ' contracts</span>'
        ])}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Register', U.table(
              [{ t: 'Contract' }, { t: 'Party' }, { t: 'Role' }, { t: 'Commission when they carry' }, { t: 'Rate when they send' },
               { t: 'Terms' }, { t: 'Term' }, { t: 'State' }, { t: '', w: '150px' }],
              rows.map(c => ({ act: 'ncOpen', arg: c.id, cells: [
                '<b>' + c.id + '</b><em class="sub"> ' + c.v + '</em>',
                U.esc(c.party) + '<em class="sub">' + c.type + '</em>',
                U.tag(c.role, c.role === 'Supply and demand' ? d.PAL.lav : c.role === 'Supply only' ? d.PAL.vodka : d.PAL.peach),
                '<em class="sub">' + U.esc(c.commission) + '</em>',
                '<em class="sub">' + U.esc(c.overflow) + '</em>',
                U.esc(c.terms),
                c.start === '—' ? '<em class="sub">Not started</em>' : c.start + ' → ' + c.end,
                U.tag(c.state, n.STATE_COL[c.state], { solid: c.state !== 'Active' }),
                '<div class="rowact">' + U.btn('Open', { act: 'ncOpen', arg: c.id }) +
                  (c.state === 'Draft' ? U.btn('Send', { kind: 'primary', act: 'ncSend', arg: c.id }) :
                   c.state === 'Sent for signature' ? U.btn('Activate', { kind: 'primary', act: 'ncActivate', arg: c.id }) :
                   c.state === 'Expiring' ? U.btn('Renew', { kind: 'primary', act: 'ncRenew', arg: c.id }) : '') + '</div>'
              ] }))), { pad: false })}
            ${U.panel('What a contract governs', U.table([{ t: 'Clause' }, { t: 'What it decides' }],
              N().CLAUSES.map(([k, v]) => ({ cells: ['<b>' + U.esc(k) + '</b>', '<em class="sub">' + U.esc(v) + '</em>'] }))),
              { pad: false, right: '<span class="ph-note">Seven clauses, the same seven every time — a participant can read the diff between two versions</span>' })}
          </div>
          <div class="stack">
            ${U.panel('Who can be on which side', U.defs([
              ['Supply only', 'Carries Network orders. Paid by Dash, gross less commission.'],
              ['Demand only', 'Sends orders into the Network. Pays Dash on the rate card.'],
              ['Supply and demand', 'Both, netted on one statement. Only granted where performance is proven.'],
              ['No contract', 'No offers received and no orders accepted. The routing engine excludes them.']]))}
            ${U.panel('Renewals and notice', U.table([{ t: 'Contract' }, { t: 'Ends' }, { t: 'Notice' }],
              N().CONTRACTS.filter(c => ['Active', 'Expiring'].includes(c.state))
                .map(c => ({ act: 'ncOpen', arg: c.id, cells: ['<b>' + U.esc(c.party) + '</b>', c.end,
                  '<em class="sub">' + U.esc(c.notice) + '</em>'] }))), { pad: false })}
            ${U.panel('Contract changes', `<div class="log">${N().AUDIT.map(a =>
              '<div class="lg"><span class="lg-t">' + a.t + '</span><span class="lg-e"><b>' + U.esc(a.a) + '</b><em>' +
              U.esc(a.o) + ' · ' + U.esc(a.u) + '</em></span></div>').join('')}</div>`,
              { pad: false, right: '<span class="ph-note">Every version change, with an actor</span>' })}
          </div>
        </div>`;
    }
  };
})();

(function () {
  const U = UI, D = () => window.ADM, N = () => window.NETC;
  const R = () => window.RENDER();

  Object.assign(window.ACT, {
    ncF: (a, el) => { STATE.nc[a] = el.value; R(); },
    ncQ: (a, el) => { STATE.nc.q = el.value; R(); },
    ncOpen: id => {
      const c = N().get(id), d = D();
      U.drawer('<b>' + c.id + '</b> · ' + U.esc(c.party), [
        '<div class="dw-meta">' + c.type + ' · ' + c.role + ' · version ' + c.v + '</div>',
        '<div class="slahead">' + U.tag(c.state, N().STATE_COL[c.state], { solid: c.state !== 'Active' }) +
          '<span class="slahead-m">' + (c.start === '—' ? 'Not started' : c.start + ' → ' + c.end) + '</span></div>',
        U.defs([
          ['Role in the Network', U.tag(c.role, d.PAL.lav)],
          ['Commission when they carry', U.esc(c.commission)],
          ['Rate when they send work in', U.esc(c.overflow)],
          ['Payment terms', U.esc(c.terms)],
          ['SLA policy', U.esc(c.sla) + ' <em class="sub">· <a href="#/sla">platform policy</a></em>'],
          ['Zones', U.esc(c.zones)],
          ['Notice', U.esc(c.notice)],
          ['Signed by', U.esc(c.signer)]
        ]),
        U.note('Where this contract shows up.', 'Settlement reads the commission and the overflow rate. The routing engine reads the role and the zones. SLA reads the policy line. Nothing here is a document sitting in a folder.', d.PAL.lav),
        c.note ? U.note('Note.', U.esc(c.note), c.state === 'Terminated' ? d.PAL.tang : d.PAL.peach) : ''
      ].join(''), { footer:
        (c.state === 'Draft' ? U.btn('Send for signature', { kind: 'primary', act: 'ncSend', arg: c.id }) : '') +
        (c.state === 'Sent for signature' ? U.btn('Activate', { kind: 'primary', act: 'ncActivate', arg: c.id }) : '') +
        (['Active', 'Expiring'].includes(c.state) ? U.btn('Renew', { kind: 'primary', act: 'ncRenew', arg: c.id }) : '') +
        U.btn('New version', { act: 'stub', arg: 'A new version starts from the current terms and needs both signatures' }) +
        (['Active', 'Expiring'].includes(c.state) ? U.btn('Terminate', { kind: 'danger', act: 'ncTerminate', arg: c.id }) : '') });
    },
    ncSend: id => {
      const c = N().get(id);
      if (c.party === 'Bayt Market') return U.toast('Verification is still open — a contract cannot be sent to an unverified account');
      c.state = 'Sent for signature'; c.signer = 'Awaiting ' + c.party + ' — sent today';
      U.closeDrawer(); U.toast(c.id + ' sent to ' + c.party + ' for signature'); R();
    },
    ncActivate: id => {
      const c = N().get(id);
      c.state = 'Active'; c.start = 'Today'; c.end = '12 months from today';
      U.closeDrawer(); U.toast(c.id + ' active — ' + c.party + ' can trade from the next period'); R();
    },
    ncRenew: id => {
      const c = N().get(id);
      U.drawer('Renew <b>' + c.id + '</b>', `
        <div class="dw-meta">${U.esc(c.party)} · current term ends ${c.end}</div>
        ${U.field('New term', U.select(['12 months', '24 months', '6 months'], '12 months'))}
        ${U.field('Commission when they carry', U.input(c.commission))}
        ${U.field('Rate when they send work in', U.input(c.overflow))}
        ${U.field('Payment terms', U.select(['Net 15, netted against payouts', 'Net 15', 'Net 30', 'Prepaid wallet'], c.terms))}
        ${U.field('SLA policy', U.select(['Platform default — 15 / 45 min', 'Named exception in this contract'], c.sla.startsWith('Platform') ? 'Platform default — 15 / 45 min' : 'Named exception in this contract'))}
        ${U.note('Terms take effect at the next period boundary.', 'Never mid-period — a settled order keeps the terms it was carried under.', D().PAL.lemon)}`,
        { footer: U.btn('Send renewal', { kind: 'primary', act: 'ncSend', arg: c.id }) });
    },
    ncTerminate: id => {
      const c = N().get(id);
      U.drawer('Terminate <b>' + c.id + '</b>', `
        <div class="dw-meta">${U.esc(c.party)} · ${U.esc(c.notice)}</div>
        ${U.field('Reason', U.select(['Performance below the floor', 'Non-payment', 'At the party’s request', 'Compliance or licence lapsed'], 'Performance below the floor'))}
        ${U.field('Effective', U.radio(['End of notice period', 'Immediately — for cause'], 'End of notice period', 'stub'))}
        ${U.note('Live orders are not abandoned.', 'Termination stops new offers. Anything already accepted runs to completion and settles on the old terms.', D().PAL.tang)}`,
        { footer: U.btn('Terminate contract', { kind: 'danger', act: 'ncDoTerminate', arg: c.id }) });
    },
    ncDoTerminate: id => {
      const c = N().get(id);
      c.state = 'Terminated'; c.end = 'Terminated today';
      U.closeDrawer(); U.toast(c.id + ' terminated — ' + c.party + ' receives no further offers'); R();
    },
    ncNew: () => U.drawer('Draft a contract', `
      <div class="dw-meta">A contract can only be drafted against a verified account.</div>
      ${U.field('Party', U.select(D().CLIENTS.filter(c => c.state === 'Active').map(c => c.name), D().CLIENTS[0].name))}
      ${U.field('Role in the Network', U.radio(['Supply only', 'Demand only', 'Supply and demand'], 'Supply only', 'stub'))}
      ${U.field('Commission when they carry', U.input('8% of gross on orders they carry'))}
      ${U.field('Rate when they send work in', U.input('Network rate card'))}
      ${U.field('Payment terms', U.select(['Net 15', 'Net 30', 'Prepaid wallet'], 'Net 15'))}
      ${U.field('SLA policy', U.select(['Platform default — 15 / 45 min', 'Named exception in this contract'], 'Platform default — 15 / 45 min'))}`,
      { footer: U.btn('Save as draft', { kind: 'primary', act: 'stub', arg: 'Draft saved — send it when the terms are agreed' }) })
  });
})();
