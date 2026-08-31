/* Dash DMS — Drivers (05), Vehicles (06), Groups (07), Shifts (08) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.DMS;
  window.STATE = window.STATE || {};
  STATE.driverTab = STATE.driverTab || 'Overview';
  STATE.driverFilter = STATE.driverFilter || { status: 'All statuses', zone: 'All zones', q: '' };

  const sc = s => ({ 'On job': DMS.PAL.lav, 'Idle': DMS.PAL.flax, 'Break': DMS.PAL.peach, 'Offline': '#c9c9c9' }[s]);
  const expSoon = doc => doc.s === 'Expiring';

  /* ---------------- 05 Drivers ---------------- */
  SCREENS['drivers'] = {
    title: 'Drivers', epic: 'Epic 05',
    render() {
      const d = D(), f = STATE.driverFilter;
      const rows = d.DRIVERS.filter(x =>
        (f.status === 'All statuses' || x.status === f.status) &&
        (f.zone === 'All zones' || f.zone.startsWith(d.zone(x.zone).code)) &&
        (!f.q || x.name.toLowerCase().includes(f.q.toLowerCase())));
      const expiring = d.DRIVERS.filter(x => x.docs.some(expSoon));

      return U.page('Drivers', 'Profiles, documents, performance, contracts, wallets and app access',
        U.btn('Add driver', { kind: 'primary', act: 'addDriver' }) + U.btn('Invite to app', { act: 'inviteDriver' }) + U.btn('Export CSV', { act: 'export', arg: 'drivers' })) + `
        <div class="kpis k-4">
          ${U.kpi('Drivers', d.DRIVERS.length, `${d.DRIVERS.filter(x => x.online).length} online now`, d.PAL.lav)}
          ${U.kpi('Avg completion', Math.round(d.DRIVERS.reduce((s, x) => s + x.completion, 0) / d.DRIVERS.length) + '%', 'Target 95%', d.PAL.flax)}
          ${U.kpi('Documents expiring', expiring.length, 'Within 60 days — blocks app access', d.PAL.tang)}
          ${U.kpi('COD held', U.money(d.DRIVERS.reduce((s, x) => s + x.wallet.cod, 0)), 'Across 5 drivers', d.PAL.peach)}
        </div>
        ${expiring.length ? U.note('Document expiry alerts.', expiring.map(x => `<a href="#/drivers/${x.id}">${U.esc(x.name)}</a>`).join(', ') + ' have documents expiring within 60 days. The driver app blocks status updates once a document lapses.', d.PAL.tang) : ''}
        ${U.filters([
          U.input(f.q, 'Search driver…', { act: 'drvQ' }),
          `<span class="f-l">Status</span>` + U.select(['All statuses', 'On job', 'Idle', 'Break', 'Offline'], f.status, { act: 'drvF', arg: 'status' }),
          `<span class="f-l">Zone</span>` + U.select(['All zones', ...d.ZONES.map(z => z.code)], f.zone, { act: 'drvF', arg: 'zone' }),
          `<span class="f-sp"></span><span class="f-c">${rows.length} of ${d.DRIVERS.length}</span>`
        ])}
        ${U.panel('', U.table(
          [{ t: 'Driver' }, { t: 'Status' }, { t: 'Zone' }, { t: 'Group' }, { t: 'Shift' }, { t: 'Vehicle' },
           { t: 'Deliveries', num: true }, { t: 'Completion', w: '110px' }, { t: 'Avg', num: true }, { t: 'Cancel', num: true },
           { t: 'Contract' }, { t: 'Docs' }, { t: 'COD', num: true }],
          rows.map(x => ({ act: 'go', arg: '/drivers/' + x.id, cells: [
            `<div class="who">${U.avatar(x.name)}<span>${U.esc(x.name)}<em>${U.esc(x.phone)}</em></span></div>`,
            U.tag(x.status, sc(x.status)), d.zone(x.zone).code,
            U.esc(d.GROUPS.find(g => g.id === x.group).name), d.SHIFTS.find(s => s.id === x.shift).name,
            d.vehicle(x.vehicle).plate + `<em class="sub">${d.vehicle(x.vehicle).type}</em>`,
            x.deliveries.toLocaleString(), `${x.completion}% ${U.bar(x.completion, d.PAL.lav)}`, x.avgMin + 'm', x.cancel + '%',
            U.tag(x.contract.status, x.contract.status === 'Active' ? '#1f8a4c' : d.PAL.peach),
            x.docs.some(expSoon) ? U.tag('Expiring', d.PAL.tang, { solid: true }) : U.tag('Valid', d.PAL.flax),
            x.wallet.cod ? U.money(x.wallet.cod) : '—'] }))), { pad: false })}`;
    }
  };

  /* ---------------- Driver profile ---------------- */
  SCREENS['driver'] = {
    title: 'Driver', epic: 'Epic 05',
    render(id) {
      const d = D(), x = d.driver(id);
      if (!x) return U.page('Driver not found', '');
      const tab = STATE.driverTab, v = d.vehicle(x.vehicle);
      const orders = d.ORDERS.filter(o => o.driver === x.id);

      const overview = `
        <div class="cols c-1-1">
          ${U.panel('Personal information', U.defs([
            ['Full name', U.esc(x.name)], ['Phone', U.esc(x.phone)], ['National ID', U.esc(x.nid)],
            ['Zone', U.dot(d.zone(x.zone).color) + d.zone(x.zone).name],
            ['Group', U.esc(d.GROUPS.find(g => g.id === x.group).name)],
            ['Shift', d.SHIFTS.find(s => s.id === x.shift).name + ' · ' + d.SHIFTS.find(s => s.id === x.shift).window],
            ['Vehicle', `<a href="#/vehicles">${v.plate} — ${v.model}</a>`],
            ['Availability', U.tag(x.status, sc(x.status)) + (x.online ? ` <em class="sub">online since ${x.since}</em>` : ' <em class="sub">offline</em>')]
          ]))}
          ${U.panel('Performance', `
            <div class="kpis k-2 tight">
              ${U.kpi('Total deliveries', x.deliveries.toLocaleString(), 'Lifetime', d.PAL.lav)}
              ${U.kpi('Completion rate', x.completion + '%', 'Target 95%', d.PAL.flax)}
              ${U.kpi('Avg delivery time', x.avgMin + '<span class="of">min</span>', 'Fleet avg 33 min', d.PAL.vodka)}
              ${U.kpi('Cancellation rate', x.cancel + '%', 'Fleet avg 2.1%', d.PAL.tang)}
            </div>
            <div class="sub-h">Deliveries, last 7 days</div>
            ${U.spark([12, 16, 14, 18, 21, 9, 15], d.PAL.lav, 46)}`)}
        </div>
        ${U.panel('Documents', U.table(
          [{ t: 'Document' }, { t: 'Expires' }, { t: 'Status' }, { t: '', w: '160px' }],
          x.docs.map(doc => ({ cells: [doc.k, doc.exp,
            U.tag(doc.s, doc.s === 'Valid' ? '#1f8a4c' : d.PAL.tang, { solid: doc.s !== 'Valid' }),
            `<div class="rowact">${U.btn('Replace', { act: 'stub', arg: 'Upload a new ' + doc.k })}${U.btn('View', { act: 'stub', arg: 'Document viewer' })}</div>`] }))), { pad: false })}
        ${U.panel('Recent orders', U.table(
          [{ t: 'Order' }, { t: 'Merchant' }, { t: 'Status' }, { t: 'COD', num: true }, { t: 'Created' }],
          orders.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
            `<b>${o.id}</b>`, U.esc(d.merchant(o.merchant).name), U.statusTag(o.status), o.cod ? U.money(o.cod) : '—', o.created] }))), { pad: false })}`;

      const contract = `
        ${U.panel('Contract', U.defs([
          ['Payment model', x.contract.model], ['Rate', x.contract.rate], ['Payment terms', x.contract.terms],
          ['Targets', x.contract.target], ['Incentives and bonuses', x.contract.incentive],
          ['Start date', x.contract.start], ['End date', x.contract.end],
          ['Status', U.tag(x.contract.status, x.contract.status === 'Active' ? '#1f8a4c' : d.PAL.peach, { solid: x.contract.status !== 'Active' })]
        ]), { right: U.btn('Edit contract', { act: 'stub', arg: 'Contract editor' }) + U.btn('End contract', { kind: 'danger', act: 'stub', arg: 'End contract' }) })}
        ${U.panel('Target progress this period', `
          <div class="targets">
            <div class="tgt"><span>Deliveries — 96 of 120</span>${U.bar(80, d.PAL.lav)}<em>80% · 4 days left</em></div>
            <div class="tgt"><span>Completion rate — ${x.completion}% of 95%</span>${U.bar(x.completion, x.completion >= 95 ? '#1f8a4c' : d.PAL.tang)}<em>${x.completion >= 95 ? 'Target met' : 'Below target'}</em></div>
            <div class="tgt"><span>Incentive — ${U.esc(x.contract.incentive)}</span>${U.bar(64, d.PAL.lemon)}<em>96 of 150 deliveries</em></div>
          </div>`)}
        ${U.note('Contract drives payout, not dispatch.', 'Assignment never reads the contract — a salaried and a per-order driver are treated identically by the routing rules.', d.PAL.lav)}`;

      const wallet = `
        <div class="kpis k-4">
          ${U.kpi('Earned this period', U.money(x.wallet.earned), x.contract.model, d.PAL.flax)}
          ${U.kpi('Paid out', U.money(x.wallet.payouts), x.contract.terms, d.PAL.lav)}
          ${U.kpi('Deductions', U.money(x.wallet.deductions), 'Penalties and adjustments', d.PAL.tang)}
          ${U.kpi('COD to hand over', U.money(x.wallet.cod), x.wallet.cod ? 'Pending handover' : 'Nothing outstanding', d.PAL.peach)}
        </div>
        ${x.wallet.cod ? U.note('Cash handover due.', `${U.esc(x.name)} is holding ${U.money(x.wallet.cod)} collected on delivery. ` + U.btn('Record handover', { kind: 'primary', act: 'handover', arg: x.id }), d.PAL.peach) : ''}
        ${U.panel('Wallet transactions', U.table(
          [{ t: 'Date' }, { t: 'Transaction' }, { t: 'Amount', num: true }],
          x.wallet.tx.map(t => ({ cells: [t.d, U.esc(t.t),
            `<b style="color:${t.a < 0 ? '#b0432a' : '#1f8a4c'}">${t.a < 0 ? '−' : '+'} ${U.money(Math.abs(t.a))}</b>`] }))), { pad: false })}`;

      const app = `
        ${U.panel('App access', U.defs([
          ['Invited', x.app.invited], ['Last seen', x.app.lastSeen], ['App version', x.app.version], ['Device', x.app.device],
          ['Access', U.tag(x.app.active ? 'Active' : 'Deactivated', x.app.active ? '#1f8a4c' : '#c9c9c9', { solid: !x.app.active })]
        ]), { right: U.btn('Reset credentials', { act: 'resetCreds', arg: x.id }) + U.btn(x.app.active ? 'Deactivate' : 'Activate', { kind: x.app.active ? 'danger' : 'primary', act: 'toggleAccess', arg: x.id }) })}
        ${U.panel('What this driver sees', `
          <div class="cols c-1-1">
            ${U.defs([
              ['Login', 'Mobile number or National ID — credentials by SMS, no self signup'],
              ['Online / offline', d.SHIFTS.find(s => s.id === x.shift).auto ? 'Automatic from the ' + d.SHIFTS.find(s => s.id === x.shift).name + ' shift' : 'Manual toggle by the driver'],
              ['Status updates', 'Allowed within 150 m of the pickup or drop-off'],
              ['Proof of delivery', 'Required — ' + (orders[0] ? orders[0].pod.join(', ') : 'Photo')],
              ['Cancellation', 'Reason required'],
              ['Chat', 'Dispatcher only — no merchant or customer contact']
            ])}
            <div class="phone">
              <div class="ph-top"><span>9:41</span><span>${x.status.toUpperCase()}</span></div>
              <div class="ph-b">
                <div class="ph-l">Dash Driver App</div>
                <div class="ph-t">Order ${orders.length ? '2 of ' + orders.length : '0 of 0'}</div>
                ${orders[0] ? `<div class="ph-card">
                  <div class="ph-h"><span>${orders[0].id}</span><span style="color:${d.PAL.lav}">${orders[0].status}</span></div>
                  <div class="ph-r"><i style="background:${d.PAL.peach}"></i><div><b>${U.esc(orders[0].branch)}</b><em>Pickup</em></div></div>
                  <div class="ph-r"><i style="background:${d.PAL.vodka}"></i><div><b>${U.esc(d.customer(orders[0].customer).addr)}</b><em>ETA ${orders[0].eta}</em></div></div>
                </div>
                <div class="ph-cta">Slide to update status</div>
                <div class="ph-f"><span>Proof: ${orders[0].pod.join(', ')}</span><span>COD ${orders[0].cod ? U.money(orders[0].cod) : '0.00'}</span></div>` : '<div class="ph-empty">No active orders</div>'}
              </div>
            </div>
          </div>`)}`;

      return U.page(x.name, `${U.esc(x.phone)} · ${d.zone(x.zone).code} · ${v.type} ${v.plate}`,
        U.btn('Chat', { act: 'chat', arg: x.id }) + U.btn('Set status', { act: 'driverStatus', arg: x.id }) +
        U.btn('Assign order', { act: 'stub', arg: 'Pick an order to assign' }) + U.btn('Back to drivers', { act: 'go', arg: '/drivers' })) +
        U.tabs(['Overview', 'Contract', 'Wallet', 'App access'], tab, 'driverTab') +
        (tab === 'Contract' ? contract : tab === 'Wallet' ? wallet : tab === 'App access' ? app : overview);
    }
  };

  /* ---------------- 06 Vehicles ---------------- */
  SCREENS['vehicles'] = {
    title: 'Vehicles', epic: 'Epic 06',
    render() {
      const d = D();
      const exp = d.VEHICLES.filter(v => v.reg < '2026-10-01' || v.ins < '2026-10-01');
      return U.page('Vehicles', 'Fleet register, documents and driver assignment',
        U.btn('Add vehicle', { kind: 'primary', act: 'stub', arg: 'Add vehicle' }) + U.btn('Export CSV', { act: 'export', arg: 'vehicles' })) + `
        <div class="kpis k-4">
          ${U.kpi('Vehicles', d.VEHICLES.length, `${d.VEHICLES.filter(v => v.status === 'In use').length} in use`, d.PAL.lav)}
          ${U.kpi('Available', d.VEHICLES.filter(v => v.status === 'Available').length, 'Unassigned, ready', d.PAL.flax)}
          ${U.kpi('Maintenance', d.VEHICLES.filter(v => v.status === 'Maintenance').length, 'Out of service', d.PAL.peach)}
          ${U.kpi('Documents expiring', exp.length, 'Registration or insurance within 60 days', d.PAL.tang)}
        </div>
        ${exp.length ? U.note('Vehicle document expiry.', `${exp.length} vehicles have registration or insurance expiring within 60 days. Assignment keeps working, but Dash flags them daily until replaced.`, d.PAL.tang) : ''}
        ${U.panel('', U.table(
          [{ t: 'Plate' }, { t: 'Type' }, { t: 'Model' }, { t: 'Year', num: true }, { t: 'Assigned driver' },
           { t: 'Registration' }, { t: 'Insurance' }, { t: 'Status' }, { t: '', w: '150px' }],
          d.VEHICLES.map(v => ({ cells: [
            `<b>${v.plate}</b>`, v.type, v.model, v.year,
            v.driver ? `<a href="#/drivers/${v.driver}">${U.esc(d.driver(v.driver).name)}</a>` : '<em class="sub">Unassigned</em>',
            v.reg + (v.reg < '2026-10-01' ? ' ' + U.tag('Soon', d.PAL.tang, { solid: true }) : ''),
            v.ins + (v.ins < '2026-10-01' ? ' ' + U.tag('Soon', d.PAL.tang, { solid: true }) : ''),
            U.tag(v.status, v.status === 'In use' ? d.PAL.lav : v.status === 'Available' ? d.PAL.flax : d.PAL.peach),
            `<div class="rowact">${U.btn(v.driver ? 'Reassign' : 'Assign', { act: 'stub', arg: 'Assign vehicle to driver' })}${U.btn('Docs', { act: 'stub', arg: 'Vehicle documents' })}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 07 Driver groups ---------------- */
  SCREENS['groups'] = {
    title: 'Driver groups', epic: 'Epic 07',
    render() {
      const d = D();
      return U.page('Driver groups', 'Group by zone, shift or vehicle type — then report on the group',
        U.btn('Create group', { kind: 'primary', act: 'stub', arg: 'Create group' })) + `
        <div class="cols c-3">
          ${d.GROUPS.map(g => U.panel(g.name, `
            ${U.defs([['Grouped by', g.by], ['Coverage', g.zone], ['Drivers', g.drivers.length],
                      ['Orders this week', g.orders], ['On time', `${g.onTime}% ${U.bar(g.onTime, g.onTime >= 95 ? d.PAL.lav : d.PAL.peach)}`]])}
            <div class="sub-h">Members</div>
            <div class="members">${g.drivers.map(id => `<a class="mem" href="#/drivers/${id}">${U.avatar(d.driver(id).name)}<span>${U.esc(d.driver(id).name)}<em>${d.zone(d.driver(id).zone).code} · ${d.driver(id).completion}%</em></span></a>`).join('')}</div>
            <div class="btnrow">${U.btn('Add driver', { act: 'stub', arg: 'Add driver to group' })}${U.btn('Group report', { act: 'go', arg: '/reports' })}</div>`)).join('')}
        </div>
        ${U.note('Groups are a reporting and assignment lens.', 'A driver belongs to exactly one group, so group reports never double-count. Assignment rules can be scoped to a group — for example, bulk orders only to Vans &amp; bulk.', d.PAL.lav)}`;
    }
  };

  /* ---------------- 08 Shifts ---------------- */
  SCREENS['shifts'] = {
    title: 'Shifts', epic: 'Epic 08',
    render() {
      const d = D();
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return U.page('Shifts', 'Windows, rosters and whether the driver app goes online by itself',
        U.btn('Create shift', { kind: 'primary', act: 'stub', arg: 'Create shift' })) + `
        ${U.panel('Coverage across the day', `
          <div class="gantt">
            <div class="gantt-h">${hours.filter(h => h % 3 === 0).map(h => `<span>${String(h).padStart(2, '0')}:00</span>`).join('')}</div>
            ${d.SHIFTS.map((s, i) => {
              const [a, b] = s.window.split(' – ').map(t => parseInt(t) + (+t.split(':')[1]) / 60);
              const col = [d.PAL.lav, d.PAL.flax, d.PAL.vodka][i];
              const label = s.drivers.length + ' driver' + (s.drivers.length === 1 ? '' : 's');
              const wraps = b <= a;
              const segs = wraps
                ? [{ l: a / 24 * 100, w: (24 - a) / 24 * 100, t: label }, { l: 0, w: b / 24 * 100, t: '' }]
                : [{ l: a / 24 * 100, w: (b - a) / 24 * 100, t: label }];
              return `<div class="gantt-r"><span class="gantt-l">${s.name}</span>
                <span class="gantt-t">${segs.map(g => `<i style="left:${g.l}%;width:${g.w}%;background:${col}">${g.t}</i>`).join('')}</span></div>`;
            }).join('')}
          </div>`)}
        ${U.panel('', U.table(
          [{ t: 'Shift' }, { t: 'Window' }, { t: 'Drivers', num: true }, { t: 'Auto online' }, { t: 'Orders this week', num: true }, { t: 'On time', w: '130px' }, { t: '', w: '190px' }],
          d.SHIFTS.map(s => ({ cells: [
            `<b>${s.name}</b>`, s.window, s.drivers.length,
            U.toggle(s.auto, 'shiftAuto', s.id),
            s.orders, `${s.onTime}% ${U.bar(s.onTime, s.onTime >= 95 ? d.PAL.lav : d.PAL.peach)}`,
            `<div class="rowact">${U.btn('Roster', { act: 'shiftRoster', arg: s.id })}${U.btn('Report', { act: 'go', arg: '/reports' })}</div>`] }))), { pad: false })}
        ${U.note('Auto online links the shift to the driver app.', 'With it on, a driver goes online when their shift starts and offline when it ends — the manual toggle in the app is disabled. Night shift is manual because cover is on call.', d.PAL.lav)}`;
    }
  };
})();
