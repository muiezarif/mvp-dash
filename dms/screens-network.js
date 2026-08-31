/* Dash DMS — Dash Network (18), 3PL Marketplace (19), Reports (20) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.DMS;
  window.STATE = window.STATE || {};
  STATE.net = STATE.net || { supply: 'Active', demand: 'Active', supplyOn: true, demandOn: true };
  STATE.listing = STATE.listing || { status: 'Live', listed: true };
  STATE.reportTab = STATE.reportTab || 'Orders';

  /* ---------------- 18 Dash Network ---------------- */
  SCREENS['network'] = {
    title: 'Dash Network', epic: 'Epic 18',
    render() {
      const d = D(), n = STATE.net;
      const roleCard = (role, state, on, act, blurb, colour, stats) => `
        <div class="rolecard" style="--rc:${colour}">
          <div class="rc-h">
            <div><div class="rc-r">${role}</div><div class="rc-s">${U.tag(state, state === 'Active' ? '#1f8a4c' : state === 'Pending' ? d.PAL.lemon : '#c9c9c9', { solid: state !== 'Active' })}</div></div>
            ${state === 'Active' ? U.toggle(on, act, '', on ? 'Participating' : 'Paused') : U.btn('Request to join', { kind: 'primary', act: act + 'Join' })}
          </div>
          <p class="rc-b">${blurb}</p>
          ${U.defs(stats)}
          <div class="btnrow">${state === 'Active' ? U.btn('Pause this role', { act: act }) + U.btn('Withdraw', { kind: 'danger', act: 'netWithdraw', arg: role }) : ''}</div>
        </div>`;

      return U.page('Dash Network', 'Two roles, requested and controlled separately',
        U.btn('Network settings', { act: 'go', arg: '/assignment' })) + `
        ${U.note('Supply and Demand are independent.', 'Each is its own request to Dash and its own switch here. Pausing one never touches the other, and withdrawing from one leaves the other running.', d.PAL.vodka)}
        <div class="cols c-1-1">
          ${roleCard('Supply — take orders', n.supply, n.supplyOn, 'netSupply',
            'Orders from merchants across Dash arrive flagged as Network orders. You assign them to your own drivers exactly like your own work — same queue, same rules, same driver app.',
            d.PAL.lav, [['Joined', '12 March 2026'], ['Orders received this week', '46'], ['Acceptance rate', '92%'], ['Completion rate', '96%'], ['Zones offered', 'RYD-N, RYD-C, RYD-S']])}
          ${roleCard('Demand — send overflow', n.demand, n.demandOn, 'netDemand',
            'Anything your fleet cannot carry goes into the network on creation, or automatically through the overflow fallback. You keep the merchant, the pricing and the tracking.',
            d.PAL.peach, [['Joined', '2 August 2026'], ['Orders sent this week', '18'], ['Fulfilment rate', '94%'], ['Avg time to accept', '1.4 min'], ['Fallback', STATE.assign.fallbackNetwork ? 'On — after 5 min unassigned' : 'Off']])}
        </div>
        <div class="cols c-2-1">
          ${U.panel('Network orders in and out', U.table(
            [{ t: 'Order' }, { t: 'Direction' }, { t: 'Merchant' }, { t: 'Zone' }, { t: 'Fulfilled by' }, { t: 'Status' }, { t: 'Created' }],
            [
              { cells: ['<b>DX-40907</b>', U.tag('In · Supply', d.PAL.lav), 'Almasa Foods', 'RYD-W', 'Your fleet — queued', U.statusTag('Assigning'), '14:58'] },
              { cells: ['<b>DX-40795</b>', U.tag('In · Supply', d.PAL.lav), 'Nuqta', 'RYD-C', 'Turki Al Dosari', U.statusTag('Delivered'), '12:20'] },
              { cells: ['<b>DX-40761</b>', U.tag('Out · Demand', d.PAL.peach), 'Kanz Market', 'RYD-E', 'Sahel Logistics (3PL)', U.statusTag('Delivered'), '11:04'] },
              { cells: ['<b>DX-40744</b>', U.tag('Out · Demand', d.PAL.peach), 'Shawarmer', 'RYD-E', 'Freelancer · Dash', U.statusTag('Delivered'), '10:37'] },
              { cells: ['<b>DX-40712</b>', U.tag('Out · Demand', d.PAL.peach), 'Tamra Pharmacy', 'RYD-W', 'Rehla — returned to you', U.statusTag('Returned'), '09:52'] }
            ]), { pad: false })}
          ${U.panel('Participation states', `
            <div class="states">
              ${[['Not joined', 'You have never requested this role', false],
                 ['Pending', 'Dash is reviewing coverage, capacity and your performance', false],
                 ['Active', 'Orders flow in this direction', true],
                 ['Paused', 'You paused it — nothing new arrives or leaves', false],
                 ['Suspended', 'Dash paused it, with a reason on the record', false],
                 ['Withdrawn', 'You left the role and would need to reapply', false]].map(([s, b, on]) =>
                `<div class="st ${on ? 'on' : ''}"><b>${s}</b><em>${b}</em></div>`).join('')}
            </div>`, { pad: false })}
        </div>`;
    }
  };

  /* ---------------- 19 3PL Marketplace ---------------- */
  SCREENS['marketplace'] = {
    title: '3PL Marketplace', epic: 'Epic 19',
    render() {
      const d = D(), l = STATE.listing;
      const requests = d.MERCHANTS.filter(m => m.status !== 'Connected');
      return U.page('3PL Marketplace', 'Your listing, the merchants who ask to connect, and the pricing you set with each',
        U.btn(l.listed ? 'Unlist' : 'List', { kind: l.listed ? 'danger' : 'primary', act: 'toggleListing' }) +
        U.btn('Submit for Dash approval', { act: 'submitListing' })) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Listing profile', `
              <div class="grid2">
                ${U.field('Company name', U.input('Rehla Fleet'))}
                ${U.field('Website', U.input('rehla.sa'))}
                ${U.field('Contact', U.input('ops@rehla.sa'))}
                ${U.field('Listing status', U.tag(l.status, l.status === 'Live' ? '#1f8a4c' : l.status === 'Pending' ? d.PAL.lemon : d.PAL.peach, { solid: l.status !== 'Live' }) +
                  ` <em class="sub">${l.status === 'Live' ? 'Visible to every Dash merchant' : 'Not visible yet'}</em>`)}
              </div>
              ${U.field('About', `<textarea class="in" rows="2">240 drivers across Riyadh. Bikes for food and pharmacy, cars and vans for grocery and bulk. Same-day and scheduled, chilled on request.</textarea>`)}
              <div class="grid2">
                ${U.field('Coverage areas', `<div class="chips">${d.ZONES.map(z => `<button type="button" class="chip on" data-act="stub" data-arg="Toggle ${z.code}">${z.code} ${z.name.split('— ')[1]}</button>`).join('')}</div>`)}
                ${U.field('Vehicle types', `<div class="chips">${['Motorcycle', 'Car', 'Van', 'Refrigerated'].map((v, i) => `<button type="button" class="chip ${i < 3 ? 'on' : ''}" data-act="stub" data-arg="Toggle ${v}">${v}</button>`).join('')}</div>`)}
              </div>
              ${U.field('Service capabilities', `<div class="chips">${['Same day', 'Scheduled', 'Chilled', 'Cash on delivery', 'Bulk', 'Returns'].map((v, i) => `<button type="button" class="chip ${i !== 5 ? 'on' : ''}" data-act="stub" data-arg="Toggle ${v}">${v}</button>`).join('')}</div>`)}`)}
            ${U.panel('Indicative pricing shown on the listing', `
              <div class="grid2">
                ${U.field('Model', U.select(['Base + per km', 'Flat per order', 'Zone tiered'], 'Base + per km'))}
                ${U.field('Base fare', U.input('SAR 14.00'))}
                ${U.field('Per km', U.input('SAR 1.20'))}
                ${U.field('Minimum order', U.input('SAR 16.00'))}
              </div>
              ${U.note('Indicative only.', 'Merchants see this range while browsing. Real terms are a contract you build with each merchant after you approve them.', d.PAL.vodka)}`)}
            ${U.panel('Incoming connection requests · ' + requests.length, U.table(
              [{ t: 'Merchant' }, { t: 'Integration' }, { t: 'Branches', num: true }, { t: 'Orders/day', num: true }, { t: 'Zones needed' }, { t: '', w: '200px' }],
              requests.map(m => ({ cells: [
                `<b>${U.esc(m.name)}</b>`, m.integration, m.branches, m.volume, 'RYD-C, RYD-E',
                `<div class="rowact">${U.btn('Approve', { kind: 'primary', act: 'approveMerchant', arg: m.id })}${U.btn('Reject with reason', { act: 'stub', arg: 'Rejection reason recorded and sent' })}</div>`] }))), { pad: false })}
            ${U.panel('Connected merchants and their pricing contracts', U.table(
              [{ t: 'Merchant' }, { t: 'Since' }, { t: 'Orders/day', num: true }, { t: 'Contract pricing' }, { t: 'Terms' }, { t: 'Status' }, { t: '', w: '180px' }],
              d.MERCHANTS.filter(m => m.status === 'Connected').map(m => ({ cells: [
                `<b>${U.esc(m.name)}</b>`, m.since, m.volume, U.esc(m.contract.pricing), m.contract.terms,
                U.tag(m.contract.status, m.contract.status === 'Active' ? '#1f8a4c' : d.PAL.peach, { solid: m.contract.status !== 'Active' }),
                `<div class="rowact">${U.btn('Build pricing', { act: 'go', arg: '/merchants/' + m.id })}${U.btn('Disconnect', { kind: 'danger', act: 'disconnect', arg: m.id })}</div>`] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('How merchants see you', `
              <div class="listing">
                <div class="ls-h"><div><b>Rehla Fleet</b><em>Riyadh · 240 drivers</em></div>${U.tag('Verified', '#000', { solid: true })}</div>
                <div class="ls-m">${U.defs([['On time', `96% ${U.bar(96, d.PAL.vodka)}`], ['Accept rate', `88% ${U.bar(88, d.PAL.lav)}`], ['Avg pickup', '11 min']])}</div>
                <div class="ls-c">${['Same day', 'Chilled', 'Cash on delivery', '5 zones'].map(t => U.tag(t, '#E3E3E3', { solid: true })).join(' ')}</div>
                <div class="ls-p">From <b>SAR 14.00</b> + SAR 1.20 / km</div>
                <div class="ls-b">Request to connect</div>
              </div>
              <div class="fld-h">Performance figures come from delivered orders on Dash. You cannot edit them.</div>`)}
            ${U.panel('Listing control', `
              ${U.defs([['Status', U.tag(l.status, l.status === 'Live' ? '#1f8a4c' : d.PAL.lemon, { solid: l.status !== 'Live' })],
                        ['Submitted', '4 August 2026'], ['Approved by Dash', '6 August 2026'],
                        ['Visibility', l.listed ? 'Listed — appears in search' : 'Unlisted — hidden, connections stay'],
                        ['Profile views', '312 this month'], ['Requests received', '9 this month']])}
              ${U.note('Unlisting keeps your merchants.', 'Existing connections and their orders continue. You simply stop appearing in the directory.', d.PAL.peach)}`)}
          </div>
        </div>`;
    }
  };

  /* ---------------- 20 Reports and analytics ---------------- */
  SCREENS['reports'] = {
    title: 'Reports', epic: 'Epic 20',
    render() {
      const d = D(), tab = STATE.reportTab;
      const week = d.REPORTS.week;

      const orders = `
        ${U.panel('Orders by day', `
          <div class="wk big">${week.map(w => `<div class="wk-c"><span class="wk-b" style="height:${w.orders / 280 * 100}%;background:${w.onTime < 93 ? d.PAL.tang : d.PAL.lav}"></span><span class="wk-l">${w.d}</span><span class="wk-v">${w.orders}</span></div>`).join('')}</div>`)}
        <div class="cols c-1-1">
          ${U.panel('By merchant', U.table([{ t: 'Merchant' }, { t: 'Orders', num: true }, { t: 'On time', w: '130px' }, { t: 'Avg', num: true }, { t: 'Revenue', num: true }],
            d.MERCHANTS.filter(m => m.status === 'Connected').map(m => ({ cells: [U.esc(m.name), m.volume * 7,
              `${90 + (m.volume % 8)}% ${U.bar(90 + (m.volume % 8), d.PAL.lav)}`, (28 + m.volume % 9) + 'm', U.money(m.volume * 7 * 14.6)] }))), { pad: false })}
          ${U.panel('By status', U.table([{ t: 'Status' }, { t: 'Orders', num: true }, { t: 'Share', w: '160px' }],
            [['Delivered', 1284, 92], ['Returned', 46, 3.3], ['Cancelled', 38, 2.7], ['In progress', 28, 2.0]].map(([s, n, p]) => ({
              cells: [U.statusTag(s === 'In progress' ? 'To delivery' : s).replace('To delivery', 'In progress'), n.toLocaleString(), `${p}% ${U.bar(p, d.STATUS[s] ? d.STATUS[s].c : d.PAL.lav)}`] }))), { pad: false })}
        </div>`;

      const drivers = U.panel('Driver performance', U.table(
        [{ t: 'Driver' }, { t: 'Zone' }, { t: 'Orders', num: true }, { t: 'Completion', w: '120px' }, { t: 'Avg', num: true }, { t: 'Cancel', num: true }, { t: 'Earnings', num: true }, { t: 'Target' }],
        d.DRIVERS.map(x => ({ act: 'go', arg: '/drivers/' + x.id, cells: [
          `<div class="who sm">${U.avatar(x.name)}<span>${U.esc(x.name)}</span></div>`, d.zone(x.zone).code,
          Math.round(x.deliveries / 26), `${x.completion}% ${U.bar(x.completion, x.completion >= 95 ? d.PAL.lav : d.PAL.peach)}`,
          x.avgMin + 'm', x.cancel + '%', U.money(x.wallet.earned),
          U.tag(x.completion >= 95 ? 'Met' : 'Below', x.completion >= 95 ? '#1f8a4c' : d.PAL.tang, { solid: x.completion < 95 })] }))), { pad: false });

      const times = `
        ${U.panel('Delivery time distribution', `
          <div class="hist">${[[ '<20m', 148 ], ['20–30m', 402], ['30–40m', 516], ['40–50m', 214], ['50–60m', 62], ['60m+', 24]].map(([l, n]) =>
            `<div class="hs"><span class="hs-b" style="height:${n / 520 * 100}%;background:${l === '60m+' ? d.PAL.tang : d.PAL.vodka}"></span><span class="hs-l">${l}</span><span class="hs-v">${n}</span></div>`).join('')}</div>
          <div class="legend">Median 34 min · target 35 min · 86 orders over 50 min came from RYD-W while it was short-staffed</div>`)}
        ${U.panel('Pickup versus delivery time by zone', U.table(
          [{ t: 'Zone' }, { t: 'Avg pickup', num: true }, { t: 'Avg delivery', num: true }, { t: 'Total', num: true }, { t: 'On time', w: '140px' }],
          d.ZONES.map(z => ({ cells: [U.dot(z.color) + U.esc(z.name), z.avgPickup + 'm', (z.avgPickup + 18) + 'm', (z.avgPickup * 2 + 18) + 'm',
            `${z.onTime}% ${U.bar(z.onTime, z.color)}`] }))), { pad: false })}`;

      const cod = `
        <div class="kpis k-4">
          ${U.kpi('COD collected today', U.money(4820), '38 orders', d.PAL.peach)}
          ${U.kpi('Handed over', U.money(3165), '5 drivers reconciled', d.PAL.flax)}
          ${U.kpi('Outstanding', U.money(d.DRIVERS.reduce((s, x) => s + x.wallet.cod, 0)), 'Held by 5 drivers', d.PAL.tang)}
          ${U.kpi('Variance', U.money(0), 'Nothing unaccounted for', '#1f8a4c')}
        </div>
        ${U.panel('Cash reconciliation by driver', U.table(
          [{ t: 'Driver' }, { t: 'Orders with COD', num: true }, { t: 'Collected', num: true }, { t: 'Handed over', num: true }, { t: 'Outstanding', num: true }, { t: '', w: '160px' }],
          d.DRIVERS.filter(x => x.wallet.cod || x.wallet.payouts).map(x => ({ cells: [
            U.esc(x.name), x.wallet.cod ? 2 : 0, U.money(x.wallet.cod + 320), U.money(320), x.wallet.cod ? `<b>${U.money(x.wallet.cod)}</b>` : U.money(0),
            x.wallet.cod ? U.btn('Record handover', { act: 'handover', arg: x.id }) : '<em class="sub">Clear</em>'] }))), { pad: false })}`;

      const zones = U.panel('Zone report', U.table(
        [{ t: 'Zone' }, { t: 'Orders', num: true }, { t: 'Drivers', num: true }, { t: 'Orders per driver', num: true }, { t: 'On time', w: '140px' }, { t: 'Avg pickup', num: true }, { t: 'Status' }],
        d.ZONES.map(z => ({ cells: [U.dot(z.color) + U.esc(z.name), z.orders * 7, z.drivers.length,
          Math.round(z.orders * 7 / z.drivers.length), `${z.onTime}% ${U.bar(z.onTime, z.color)}`, z.avgPickup + 'm',
          U.tag(z.status, z.status === 'Active' ? '#1f8a4c' : d.PAL.peach)] }))), { pad: false });

      return U.page('Reports and analytics', 'Every report filters by date, merchant, status, zone and driver',
        U.btn('Export CSV', { kind: 'primary', act: 'export', arg: 'report' }) + U.btn('Export PDF', { act: 'export', arg: 'report-pdf' }) + U.btn('Schedule', { act: 'scheduleReport' })) + `
        ${U.filters([
          `<span class="f-l">Range</span>` + U.select(['Today', 'Last 7 days', 'Last 30 days', 'This month', 'Custom…'], 'Last 7 days', { act: 'stub' }),
          `<span class="f-l">Merchant</span>` + U.select(['All merchants', ...d.MERCHANTS.map(m => m.name)], 'All merchants', { act: 'stub' }),
          `<span class="f-l">Zone</span>` + U.select(['All zones', ...d.ZONES.map(z => z.code)], 'All zones', { act: 'stub' }),
          `<span class="f-l">Driver</span>` + U.select(['All drivers', ...d.DRIVERS.map(x => x.name)], 'All drivers', { act: 'stub' }),
          `<span class="f-sp"></span><span class="f-c">1,396 orders in range</span>`
        ])}
        ${U.tabs(['Orders', 'Drivers', 'Delivery time', 'COD and cash', 'Zones'], tab, 'reportTab')}
        ${tab === 'Drivers' ? drivers : tab === 'Delivery time' ? times : tab === 'COD and cash' ? cod : tab === 'Zones' ? zones : orders}
        ${U.panel('Scheduled reports', U.table(
          [{ t: 'Report' }, { t: 'Recipients' }, { t: 'Schedule' }, { t: 'Format' }, { t: '', w: '150px' }],
          d.REPORTS.scheduled.map(s => ({ cells: [U.esc(s.n), U.esc(s.to), s.when, s.fmt,
            `<div class="rowact">${U.btn('Edit', { act: 'stub', arg: 'Edit schedule' })}${U.btn('Pause', { act: 'stub', arg: 'Schedule paused' })}</div>`] }))), { pad: false })}`;
    }
  };
})();
