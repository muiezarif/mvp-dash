/* Dash 3PL — commercial layer: Merchant profiles (09), Contracts (10),
   Dash Network (12), Marketplace (13), Overflow */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.TPL;
  window.STATE = window.STATE || {};

  const srcPill = s => {
    const c = { Marketplace: D().PAL.vodka, Network: D().PAL.lav, Direct: D().PAL.peach }[s];
    return `<span class="src"><i style="background:${c}"></i>${s === 'Network' ? 'Dash Network' : s}</span>`;
  };

  /* ---------------- 09 Merchant profiles ---------------- */
  SCREENS['merchants'] = {
    title: 'Merchants', epic: 'Epics 09 · 10',
    render() {
      const d = D();
      const comm = d.MERCHANTS.filter(m => m.rel === 'Commercial');
      const auto = d.MERCHANTS.filter(m => m.rel === 'Auto generated');
      const reqs = d.MERCHANTS.filter(m => m.rel === 'Request');
      return U.page('Merchants', 'Two kinds of merchant, and the difference matters',
        U.btn('Marketplace listing', { act: 'go', arg: '/marketplace' }) + U.btn('Export CSV', { act: 'export', arg: 'merchants' })) +
        U.mode('rw', 'Merchants you won through the Marketplace are a real commercial relationship — you set their pricing and terms. Network merchants are read-only profiles built from order data.') + `
        <div class="kpis k-4">
          ${U.kpi('Commercial merchants', comm.length, 'Your contracts, your pricing', d.PAL.vodka)}
          ${U.kpi('Network merchants', auto.length, 'No contract — Dash prices these', d.PAL.lav)}
          ${U.kpi('Pending requests', reqs.length, 'Waiting on your decision', d.PAL.lemon)}
          ${U.kpi('Revenue this month', U.money(d.MERCHANTS.reduce((s, m) => s + m.revenue, 0)), 'Across all merchants', d.PAL.peach)}
        </div>
        ${reqs.length ? U.note(U.esc(reqs[0].name) + ' asked to connect.',
          `${reqs[0].volume} orders a day across ${reqs[0].branches} branches. Approving starts a commercial relationship you price yourself. `
          + U.btn('Review the request', { kind: 'primary', act: 'go', arg: '/marketplace' }), d.PAL.lemon) : ''}
        ${U.panel('Commercial — acquired through your listing', U.table(
          [{ t: 'Merchant' }, { t: 'Since' }, { t: 'Branches', num: true }, { t: 'Orders/day', num: true }, { t: 'Orders', num: true },
           { t: 'On time', w: '120px' }, { t: 'Revenue', num: true }, { t: 'Pricing' }, { t: 'Terms' }, { t: 'Contract' }],
          comm.map(m => ({ act: 'go', arg: '/merchants/' + m.id, cells: [
            `<b>${U.esc(m.name)}</b>`, U.esc(m.since), m.branches, m.volume, m.orders,
            `${m.onTime}% ${U.bar(m.onTime, m.onTime >= 92 ? d.PAL.lav : d.PAL.tang)}`, U.money(m.revenue),
            U.esc(m.contract.pricing), m.contract.terms,
            U.tag(m.contract.status, m.contract.status === 'Active' ? '#1f8a4c' : d.PAL.peach, { solid: m.contract.status !== 'Active' })] }))), { pad: false })}
        ${U.panel('Auto generated — from Dash Network order data', U.table(
          [{ t: 'Merchant' }, { t: 'Orders', num: true }, { t: 'On time', w: '120px' }, { t: 'Avg', num: true },
           { t: 'Cancellation', num: true }, { t: 'Revenue', num: true }, { t: 'Contract' }],
          auto.map(m => ({ act: 'go', arg: '/merchants/' + m.id, cells: [
            `<b>${U.esc(m.name)}</b><em class="sub">No relationship — Network routing only</em>`, m.orders,
            `${m.onTime}% ${U.bar(m.onTime, m.onTime >= 92 ? d.PAL.lav : d.PAL.tang)}`, m.avgMin + 'm',
            m.cancel + '%', U.money(m.revenue), '<em class="sub">None — Dash prices it</em>'] }))), { pad: false })}
        ${U.note('Why the split exists.', 'A Network merchant may not know your name — Dash routed their order to you. If you want them as a real customer, win them through the Marketplace and price them yourself.', d.PAL.vodka)}`;
    }
  };

  /* ---------------- Merchant detail + contract ---------------- */
  SCREENS['merchant'] = {
    title: 'Merchant', epic: 'Epics 09 · 10',
    render(id) {
      const d = D(), m = d.merchant(id);
      if (!m) return U.page('Merchant not found', '');
      const orders = d.ORDERS.filter(o => o.merchant === m.id);
      const commercial = m.rel === 'Commercial';
      return U.page(m.name, `${m.rel} · ${m.kind === 'Network' ? 'Dash Network origin' : 'Marketplace'}${commercial ? ' · since ' + m.since : ''}`,
        (commercial ? U.btn('Edit contract', { kind: 'primary', act: 'editContract', arg: m.id }) + U.btn('Disconnect', { kind: 'danger', act: 'disconnectMerchant', arg: m.id }) :
         m.rel === 'Request' ? U.btn('Approve', { kind: 'primary', act: 'approveRequest', arg: m.id }) + U.btn('Reject with reason', { act: 'rejectRequest', arg: m.id }) : '') +
        U.btn('Back to merchants', { act: 'go', arg: '/merchants' })) +
        (commercial
          ? U.mode('rw', 'A real commercial relationship. Pricing, terms and dates below are yours to set — Dash does not intervene.')
          : m.rel === 'Request'
            ? U.mode('rw', 'A pending request. Approve to start a commercial relationship, or reject with a reason they will see.')
            : U.mode('ro', 'Auto generated from order data. You have no contract with this merchant and cannot create one here — Dash Network sets the price.')) + `
        <div class="kpis k-4">
          ${U.kpi('Orders', m.orders || 0, m.orders ? 'Through Dash' : 'None yet', d.PAL.lav)}
          ${U.kpi('On time', (m.onTime || 0) + '%', m.orders ? 'Your average 92%' : '—', d.PAL.flax)}
          ${U.kpi('Avg delivery', (m.avgMin || 0) + '<span class="of">min</span>', m.orders ? 'Your average 36 min' : '—', d.PAL.vodka)}
          ${U.kpi('Revenue', U.money(m.revenue), commercial ? 'Your contract price' : m.rel === 'Request' ? 'Nothing yet' : 'Dash pricing, less 8%', d.PAL.peach)}
        </div>
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Profile', U.defs([
              ['Merchant', U.esc(m.name)],
              ['Relationship', U.tag(m.rel, commercial ? d.PAL.vodka : m.rel === 'Request' ? d.PAL.lemon : d.PAL.lav)],
              ['Origin', m.kind === 'Network' ? 'Dash Network routing' : 'Your Marketplace listing'],
              ['Branches', m.branches], ['Average volume', m.volume + ' orders / day'],
              ['Connected since', m.since === '—' ? '<em class="sub">Not connected</em>' : U.esc(m.since)],
              ['Cancellation rate', (m.cancel || 0) + '%'],
              ['About', U.esc(m.note)]
            ]))}
            ${commercial ? U.panel('Contract', U.defs([
              ['Pricing', U.esc(m.contract.pricing)],
              ['Payment terms', m.contract.terms],
              ['Monthly minimum', U.esc(m.contract.minMonthly)],
              ['Start date', m.contract.start],
              ['End date', m.contract.end],
              ['Status', U.tag(m.contract.status, m.contract.status === 'Active' ? '#1f8a4c' : d.PAL.peach, { solid: m.contract.status !== 'Active' })]
            ]), { right: U.btn('Edit contract', { act: 'editContract', arg: m.id }) }) : ''}
            ${m.contract && m.contract.status === 'Expiring' ? U.note('This contract expires ' + m.contract.end + '.',
              'Renew it or renegotiate before then. If it lapses, their orders stop reaching you as Marketplace work — they would have to find you through Dash Network instead. '
              + U.btn('Renew', { kind: 'primary', act: 'renewContract', arg: m.id }), d.PAL.tang) : ''}
            ${orders.length ? U.panel('Order history', U.table(
              [{ t: 'Order' }, { t: 'Source' }, { t: 'Zone' }, { t: 'Driver' }, { t: 'Status' }, { t: 'Revenue', num: true }, { t: 'Created' }],
              orders.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
                `<b>${o.id}</b>`, srcPill(o.source), o.zone,
                o.driver ? U.esc(d.driver(o.driver).name) : '—', U.statusTag(o.status),
                o.revenue ? U.money(o.revenue) : '—', o.created] }))), { pad: false }) : ''}
          </div>
          <div class="stack">
            ${m.rel === 'Request' ? U.panel('Their public profile', `
              ${U.defs([['Business', U.esc(m.name)], ['Branches', m.branches], ['Volume', m.volume + ' orders / day'],
                        ['Zones needed', 'Zone Central, Zone East'], ['Requested', '27 August 2026']])}
              ${U.note('Judge the volume against your capacity.', 'Approving commits you to their orders under whatever pricing you agree afterwards.', d.PAL.lemon)}
              <div class="btnrow">${U.btn('Approve', { kind: 'primary', act: 'approveRequest', arg: m.id })}${U.btn('Reject', { act: 'rejectRequest', arg: m.id })}</div>`) : ''}
            ${commercial ? U.panel('Revenue trend', `
              <div class="wk">${d.REPORTS.week.map(w => `<div class="wk-c">
                <span class="wk-b" style="height:${Math.round(w.rev * (m.revenue / 14000)) / 90 * 100}%;background:${d.PAL.vodka}"></span>
                <span class="wk-l">${w.d}</span></div>`).join('')}</div>
              ${U.defs([['This month', U.money(m.revenue)], ['Per order', U.money(m.revenue / (m.orders || 1))],
                        ['Commission to Dash', U.money(0) + ' <em class="sub">Marketplace orders are yours</em>']])}`) : ''}
            ${!commercial && m.rel !== 'Request' ? U.panel('Want them as a real customer?', `
              ${U.note('Network orders are anonymous business.', 'Dash chose you for these. To build a direct relationship with ' + U.esc(m.name) + ', keep your listing sharp and let them find you.', d.PAL.lav)}
              <div class="btnrow">${U.btn('Improve my listing', { kind: 'primary', act: 'go', arg: '/marketplace' })}</div>`) : ''}
          </div>
        </div>`;
    }
  };

  /* ---------------- 12 Dash Network ---------------- */
  SCREENS['network'] = {
    title: 'Dash Network', epic: 'Epic 12',
    render() {
      const d = D(), n = d.NETWORK;
      const card = (role, st, on, act, blurb, colour, stats) => `
        <div class="rolecard" style="--rc:${colour}">
          <div class="rc-h">
            <div><div class="rc-r">${role}</div><div class="rc-s">${U.tag(st.state, st.state === 'Active' ? '#1f8a4c' : st.state === 'Pending' ? d.PAL.lemon : '#c9c9c9', { solid: st.state !== 'Active' })}</div></div>
            ${st.state === 'Active' ? U.toggle(on, act, '', on ? 'Participating' : 'Paused') : U.btn('Request to join', { kind: 'primary', act: act + 'Join' })}
          </div>
          <p class="rc-b">${blurb}</p>
          ${U.defs(stats)}
          ${st.state === 'Active' ? `<div class="btnrow">${U.btn(on ? 'Pause this role' : 'Resume', { act: act })}${U.btn('Withdraw', { kind: 'danger', act: 'netWithdraw', arg: role })}</div>` : ''}
        </div>`;
      return U.page('Dash Network', 'Two roles, requested and controlled separately',
        U.btn('Overflow orders', { act: 'go', arg: '/overflow' })) +
        U.mode('rw', 'Joining, pausing and withdrawing are entirely your decision. Each role is a separate request to Dash and a separate switch.') + `
        ${U.note('Supply and Demand are independent.', 'Pausing one never touches the other. Withdrawing from one leaves the other running.', d.PAL.vodka)}
        <div class="cols c-1-1">
          ${card('Supply — receive orders', n.supply, n.supply.on, 'netSupply',
            'Orders from merchants across Dash arrive flagged as Network orders. You pull them into ' + U.esc(d.BIZ.ownSystem) + ' over the API and fulfil them exactly like your own work.',
            d.PAL.lav, [['Joined', U.esc(n.supply.joined)], ['Received this month', n.supply.received],
              ['Acceptance rate', n.supply.accepted + '%'], ['Completion rate', n.supply.completed + '%'],
              ['Declined', n.supply.declined + ' <em class="sub">no penalty</em>'],
              ['Zones offered', U.esc(n.supply.zones)], ['Revenue', U.money(n.supply.revenue) + ' <em class="sub">less 8% commission</em>']])}
          ${card('Demand — send overflow', n.demand, n.demand.on, 'netDemand',
            'Anything you cannot carry goes out into Dash Network. Another fleet, another 3PL or a freelancer delivers it — and you keep the merchant.',
            d.PAL.peach, [['Joined', U.esc(n.demand.joined)], ['Sent this month', n.demand.sent],
              ['Fulfilment rate', n.demand.fulfilled + '%'], ['Avg time to accept', U.esc(n.demand.avgAccept)],
              ['Cost', U.money(n.demand.cost) + ' <em class="sub">what you paid others</em>']])}
        </div>
        <div class="cols c-2-1">
          ${U.panel('How a Network order reaches your system', `<div class="steps">
            ${[['Dash offers it', 'Filtered on your coverage and capabilities, ranked on your performance'],
               ['order.created fires', 'Your endpoint receives it — nothing to watch in this dashboard'],
               ['You accept or decline', 'In your own system, or here on the order page'],
               ['You fulfil it', 'Your dispatch, your driver, your route — Dash sees nothing of it'],
               ['You push statuses back', 'order.picked_up, order.delivered with proof'],
               ['Dash pays you', 'Less 8% commission, on the next payout run']].map(([t, s], i) =>
              `<div class="stp done"><span class="stp-n">${i + 1}</span><div><b>${t}</b><em>${s}</em></div></div>`).join('')}
          </div>`, { pad: false })}
          ${U.panel('Participation states', `<div class="states">
            ${[['Not joined', 'You have never requested this role', false],
               ['Pending', 'Dash is reviewing your coverage, capacity and performance', false],
               ['Active', 'Orders flow in this direction', true],
               ['Paused', 'You paused it — nothing new arrives or leaves', false],
               ['Suspended', 'Dash paused it, with a reason on the record', false],
               ['Withdrawn', 'You left the role and would need to reapply', false]].map(([s, b, on]) =>
              `<div class="st ${on ? 'on' : ''}"><b>${s}</b><em>${b}</em></div>`).join('')}
          </div>`, { pad: false })}
        </div>`;
    }
  };

  /* ---------------- Overflow (Demand role detail) ---------------- */
  SCREENS['overflow'] = {
    title: 'Overflow', epic: 'Epic 12',
    render() {
      const d = D();
      const back = d.OVERFLOW.filter(o => o.status !== 'Fulfilled');
      return U.page('Overflow orders', 'What you sent back out into Dash Network as Demand',
        U.btn('Network roles', { act: 'go', arg: '/network' }) + U.btn('Export CSV', { act: 'export', arg: 'overflow' })) +
        U.mode('rw', 'You decide what leaves. Push it from ' + U.esc(d.BIZ.ownSystem) + ' over the API, and Dash finds someone else to carry it.') + `
        <div class="kpis k-4">
          ${U.kpi('Sent this month', d.NETWORK.demand.sent, 'Orders you could not carry', d.PAL.peach)}
          ${U.kpi('Fulfilled', d.NETWORK.demand.fulfilled + '%', 'By someone else on Dash', d.PAL.flax)}
          ${U.kpi('Came back to you', back.length, 'Nobody took them', d.PAL.tang)}
          ${U.kpi('Cost', U.money(d.NETWORK.demand.cost), 'What you paid the network', d.PAL.lav)}
        </div>
        ${back.length ? U.note(back.length + ' order came back to you.',
          U.esc(back[0].id) + ' — ' + U.esc(back[0].reason) + '. Nobody in the network accepted it, so it is yours again. Nothing disappears silently.', d.PAL.tang) : ''}
        ${U.panel('', U.table(
          [{ t: 'Order' }, { t: 'Merchant' }, { t: 'Zone' }, { t: 'Sent' }, { t: 'Why you sent it' }, { t: 'Outcome' }, { t: 'Fulfilled by' }, { t: 'Cost to you', num: true }],
          d.OVERFLOW.map(o => ({ cells: [
            `<b>${o.id}</b>`, U.esc(o.merchant), o.zone, o.sent, U.esc(o.reason),
            U.tag(o.status, o.status === 'Fulfilled' ? '#1f8a4c' : d.PAL.tang, { solid: o.status !== 'Fulfilled' }),
            o.by === '—' ? '<em class="sub">—</em>' : U.esc(o.by),
            o.cost ? U.money(o.cost) : '—'] }))), { pad: false })}
        ${U.note('You keep the merchant either way.', 'The merchant sees their order delivered. They are still your customer, on your contract, at your price — you simply paid the network to carry it.', d.PAL.peach)}`;
    }
  };

  /* ---------------- 13 3PL Marketplace ---------------- */
  SCREENS['marketplace'] = {
    title: 'Marketplace', epic: 'Epic 13',
    render() {
      const d = D(), l = d.LISTING;
      const reqs = d.MERCHANTS.filter(m => m.rel === 'Request');
      const conn = d.MERCHANTS.filter(m => m.rel === 'Commercial');
      return U.page('3PL Marketplace', 'Your listing, the merchants who ask to connect, and the pricing you set with each',
        U.btn(l.listed ? 'Unlist' : 'List', { kind: l.listed ? 'danger' : 'primary', act: 'toggleListing' }) +
        U.btn('Submit for Dash approval', { act: 'submitListing' })) +
        U.mode('rw', 'This is the commercial half of Dash 3PL — the part you fully control. Everything here is yours to edit.') + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Listing profile', `
              <div class="grid2">
                ${U.field('Company name', U.input(d.BIZ.name))}
                ${U.field('Website', U.input(d.BIZ.site))}
                ${U.field('Contact', U.input(d.BIZ.email))}
                ${U.field('Listing status', U.tag(l.status, l.status === 'Live' ? '#1f8a4c' : d.PAL.lemon, { solid: l.status !== 'Live' }) +
                  ` <em class="sub">${l.status === 'Live' ? 'Visible to every merchant on Dash' : 'Not visible until Dash approves it'}</em>`)}
              </div>
              ${U.field('About', `<textarea class="in" rows="2">${U.esc(d.BIZ.desc)}</textarea>`)}
              <div class="grid2">
                ${U.field('Coverage areas', `<div class="chips">${['Zone East','Zone South','Zone Central','Zone North','Zone West'].map(z =>
                  `<button type="button" class="chip ${l.zones.indexOf(z) >= 0 ? 'on' : ''}" data-act="lsZone" data-arg="${z}">${z}</button>`).join('')}</div>`,
                  'Merchants filter on this. Claiming a zone you cannot serve costs you performance.')}
                ${U.field('Vehicle types', `<div class="chips">${['Motorcycle','Car','Van','Refrigerated'].map(v =>
                  `<button type="button" class="chip ${l.vehicles.indexOf(v) >= 0 ? 'on' : ''}" data-act="lsVeh" data-arg="${v}">${v}</button>`).join('')}</div>`)}
              </div>
              ${U.field('Service capabilities', `<div class="chips">${['Same day','Scheduled','Chilled','Bulk','Returns','Cash on delivery'].map(c =>
                `<button type="button" class="chip ${l.caps.indexOf(c) >= 0 ? 'on' : ''}" data-act="lsCap" data-arg="${c}">${c}</button>`).join('')}</div>`)}`)}
            ${U.panel('Indicative pricing shown on the listing', `
              <div class="grid2">
                ${U.field('Model', U.select(['Flat per order, zone-capped', 'Base + per km', 'Zone tiered'], l.pricing.model))}
                ${U.field('Base or flat rate', U.input(l.pricing.base))}
                ${U.field('Bulk surcharge', U.input(l.pricing.bulk))}
                ${U.field('Minimum order', U.input(l.pricing.min))}
              </div>
              ${U.note('Indicative only.', 'Merchants see this range while browsing. The real terms are a contract you build with each merchant after you approve them.', d.PAL.vodka)}`)}
            ${U.panel('Incoming connection requests · ' + reqs.length, U.table(
              [{ t: 'Merchant' }, { t: 'Branches', num: true }, { t: 'Orders/day', num: true }, { t: 'Zones needed' }, { t: 'Requested' }, { t: '', w: '220px' }],
              reqs.map(m => ({ cells: [
                `<b>${U.esc(m.name)}</b>`, m.branches, m.volume, 'Zone Central, Zone East', '27 Aug 2026',
                `<div class="rowact">${U.btn('View profile', { act: 'go', arg: '/merchants/' + m.id })}${U.btn('Approve', { kind: 'primary', act: 'approveRequest', arg: m.id })}${U.btn('Reject', { act: 'rejectRequest', arg: m.id })}</div>`] }))), { pad: false })}
            ${U.panel('Connected merchants and their pricing contracts', U.table(
              [{ t: 'Merchant' }, { t: 'Since' }, { t: 'Orders/day', num: true }, { t: 'Contract pricing' }, { t: 'Terms' }, { t: 'Minimum' }, { t: 'Status' }, { t: '', w: '200px' }],
              conn.map(m => ({ cells: [
                `<b>${U.esc(m.name)}</b>`, U.esc(m.since), m.volume, U.esc(m.contract.pricing), m.contract.terms, U.esc(m.contract.minMonthly),
                U.tag(m.contract.status, m.contract.status === 'Active' ? '#1f8a4c' : d.PAL.peach, { solid: m.contract.status !== 'Active' }),
                `<div class="rowact">${U.btn('Edit contract', { act: 'editContract', arg: m.id })}${U.btn('Disconnect', { kind: 'danger', act: 'disconnectMerchant', arg: m.id })}</div>`] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('How merchants see you', `
              <div class="listing">
                <div class="ls-h"><div><b>${U.esc(d.BIZ.name)}</b><em>${U.esc(d.BIZ.city)} · ${U.esc(d.BIZ.fleet)}</em></div>${U.tag('Verified', '#000', { solid: true })}</div>
                <div class="ls-m">${U.defs([
                  ['On time', `92% ${U.bar(92, d.PAL.vodka)}`],
                  ['Accept rate', `81% ${U.bar(81, d.PAL.lav)}`],
                  ['Avg pickup', '16 min']])}</div>
                <div class="ls-c">${l.caps.concat([l.zones.length + ' zones']).map(t => U.tag(t, '#E3E3E3', { solid: true })).join(' ')}</div>
                <div class="ls-p">From <b>${U.esc(l.pricing.base)}</b> flat, zone-capped</div>
                <div class="ls-b">Request to connect</div>
              </div>
              <div class="fld-h">Performance figures come from delivered Dash orders. You cannot edit them.</div>`)}
            ${U.panel('Listing control', `${U.defs([
              ['Status', U.tag(l.status, l.status === 'Live' ? '#1f8a4c' : d.PAL.lemon, { solid: l.status !== 'Live' })],
              ['Submitted', U.esc(l.submitted)], ['Approved by Dash', U.esc(l.approved)],
              ['Visibility', l.listed ? 'Listed — appears in merchant search' : 'Unlisted — hidden, connections stay'],
              ['Profile views', l.views + ' this month'], ['Requests received', l.requests + ' this month']
            ])}${U.note('Unlisting keeps your merchants.', 'Existing contracts and their orders continue. You simply stop appearing in the directory.', d.PAL.peach)}`)}
          </div>
        </div>`;
    }
  };
})();
