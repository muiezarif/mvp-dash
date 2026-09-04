/* Dash Merchant — Orders (08), Order detail, Create order, Customers (18) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.MER;
  window.STATE = window.STATE || {};
  STATE.of = STATE.of || { status: 'All statuses', branch: 'All branches', source: 'All sources', type: 'All types', provider: 'All providers', sla: 'All SLA states', q: '' };

  /* ---------------- 08 Orders ---------------- */
  SCREENS['orders'] = {
    title: 'Orders', epic: 'Epic 08',
    render() {
      const d = D(), f = STATE.of;
      const rows = d.ORDERS.filter(o =>
        (f.status === 'All statuses' || o.status === f.status) &&
        (f.branch === 'All branches' || f.branch.startsWith(d.branch(o.branch).code)) &&
        (f.source === 'All sources' || o.source === f.source) &&
        (f.type === 'All types' || o.type === f.type) &&
        (f.provider === 'All providers' || (o.provider && d.prov(o.provider).name === f.provider)) &&
        (f.sla === 'All SLA states' || MDEEP.sla(o).state === f.sla) &&
        (!f.q || (o.id + ' ' + o.ref + ' ' + d.customer(o.customer).name).toLowerCase().includes(f.q.toLowerCase())));
      return U.page('Orders', 'Every order from every source, whoever delivered it',
        U.btn('Create order', { kind: 'primary', act: 'go', arg: '/create-order' }) +
        U.btn('Export CSV', { act: 'export', arg: 'orders' }) + U.btn('Export PDF', { act: 'export', arg: 'orders-pdf' })) + `
        <div class="kpis k-4">
          ${U.kpi('On demand', d.ORDERS.filter(o => o.type === 'On demand').length, 'Delivered as soon as possible', d.PAL.lemon)}
          ${U.kpi('Scheduled', d.ORDERS.filter(o => o.type === 'Scheduled').length, 'Provider assigned before the slot', d.PAL.vodka)}
          ${U.kpi('With cash on delivery', d.ORDERS.filter(o => o.cod).length, U.money(d.ORDERS.reduce((s, o) => s + o.cod, 0)) + ' to be collected', d.PAL.peach)}
          ${U.kpi('Returned', d.ORDERS.filter(o => o.status === 'Returned').length, 'Not charged for delivery', d.PAL.tang)}
        </div>
        ${U.filters([
          U.input(f.q, 'Search order, reference or customer…', { act: 'ofQ' }),
          `<span class="f-l">Status</span>` + U.select(['All statuses', ...Object.keys(d.STATUS)], f.status, { act: 'ofF', arg: 'status' }),
          `<span class="f-l">Branch</span>` + U.select(['All branches', ...d.BRANCHES.map(b => b.code)], f.branch, { act: 'ofF', arg: 'branch' }),
          `<span class="f-l">Source</span>` + U.select(['All sources', 'Salla', 'Shopify', 'Kanz ERP', 'Manual entry'], f.source, { act: 'ofF', arg: 'source' }),
          `<span class="f-l">Provider</span>` + U.select(['All providers', ...d.PROVIDERS.filter(p => p.status === 'Connected').map(p => p.name)], f.provider, { act: 'ofF', arg: 'provider' }),
          `<span class="f-l">Type</span>` + U.select(['All types', 'On demand', 'Scheduled'], f.type, { act: 'ofF', arg: 'type' }),
          `<span class="f-l">SLA</span>` + U.select(['All SLA states', 'On time', 'At risk', 'Late'], f.sla, { act: 'ofF', arg: 'sla' }),
          `<span class="f-sp"></span><span class="f-c">${rows.length} of ${d.ORDERS.length}</span>`,
          U.btn('Reset', { act: 'ofReset' })
        ])}
        ${U.panel('', U.table(
          [{ t: 'Order' }, { t: 'Reference' }, { t: 'Branch' }, { t: 'Customer' }, { t: 'Type' }, { t: 'Source' },
           { t: 'Provider' }, { t: 'Driver' }, { t: 'Status' }, { t: 'SLA' }, { t: 'COD', num: true }, { t: 'Charge', num: true }, { t: 'Created' }, { t: 'ETA' }],
          rows.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
            `<b>${o.id}</b>`, `<code>${U.esc(o.ref)}</code>`, d.branch(o.branch).code,
            U.esc(d.customer(o.customer).name) + (d.customer(o.customer).flagged ? ' ' + U.tag('Flagged', d.PAL.tang, { solid: true }) : ''),
            o.type, U.tag(o.source, o.source === 'Manual entry' ? d.PAL.flax : d.PAL.lav),
            o.provider ? U.esc(d.prov(o.provider).name) : '<em class="warn">Waiting</em>',
            o.driver ? U.esc(o.driver) : '—', U.statusTag(o.status), MDEEP.slaTag(MDEEP.sla(o).state),
            o.cod ? U.money(o.cod) : '—', o.charge ? U.money(o.charge) : '—', o.created, o.eta] }))), { pad: false })}`;
    }
  };

  /* ---------------- Order detail ---------------- */
  SCREENS['order'] = {
    title: 'Order', epic: 'Epics 08 · 09',
    render(id) {
      const d = D(), o = d.order(id);
      if (!o) return U.page('Order not found', 'No order with reference ' + U.esc(id));
      const b = d.branch(o.branch), c = d.customer(o.customer), p = o.provider ? d.prov(o.provider) : null;
      const step = d.STATUS[o.status].step;
      return U.page(o.id, `${U.esc(b.name)} → ${U.esc(c.name)} · ${U.esc(o.source)} · created ${o.created}`,
        (o.status === 'Awaiting provider' ? U.btn('Assign provider', { kind: 'primary', act: 'assignProvider', arg: o.id })
          : U.btn('Reassign provider', { act: 'assignProvider', arg: o.id })) +
        U.btn('Waybill', { act: 'waybill', arg: o.id }) + U.btn('Escalate to Dash', { act: 'escalate', arg: o.id }) +
        U.btn('Cancel order', { kind: 'danger', act: 'cancelOrder', arg: o.id }) + U.btn('Back to orders', { act: 'go', arg: '/orders' })) + `
        <div class="flowbar" style="grid-template-columns:repeat(6,1fr)">
          ${d.FLOW.map((s, i) => `<div class="fb ${step >= i + 1 ? 'done' : ''} ${step === i + 1 ? 'now' : ''}">
            <span class="fb-d"></span><span class="fb-l">${s}</span>
            <span class="fb-t">${(o.log.find(l => l.e.toLowerCase().startsWith(s.toLowerCase())) || {}).t || (step >= i + 1 ? '' : '—')}</span></div>`).join('')}
        </div>
        ${step < 0 ? U.note(o.status === 'Cancelled' ? 'Order cancelled.' : 'Order returned to the branch.',
          U.esc(o.log[o.log.length - 1].e) + ' — ' + U.esc(o.log[o.log.length - 1].s || 'no reason recorded'), d.PAL.tang) : ''}
        ${o.status === 'Awaiting provider' ? U.note('No provider yet.',
          `Your pool is being worked through in order. Fallback to Dash Network fires after ${d.dispatchFor(o.branch).fallbackAfter} minutes ` +
          `(${U.esc(d.dispatchFor(o.branch).src.toLowerCase())} for ${U.esc(b.code)}). ` +
          U.btn('Send to Dash Network now', { kind: 'primary', act: 'toNetwork', arg: o.id }), d.PAL.lemon) : ''}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Order', U.defs([
              ['Status', U.statusTag(o.status)],
              ['Delivery promise', MDEEP.slaTag(MDEEP.sla(o).state) + ' <em class="sub">pickup by ' + MDEEP.sla(o).promisedPickup +
                ' · delivery by ' + MDEEP.sla(o).promisedDelivery + ' · ' + MDEEP.sla(o).src + '</em>'],
              ['Ageing', MDEEP.dur(MDEEP.sla(o).age) + (MDEEP.sla(o).state === 'Late'
                ? ' <em class="warn">· ' + MDEEP.dur(MDEEP.sla(o).over) + ' past the promise</em>'
                : MDEEP.DONE.includes(o.status) ? '' : ' <em class="sub">· ' + MDEEP.dur(MDEEP.sla(o).left) + ' left</em>')],
              ['Your reference', `<code>${U.esc(o.ref)}</code>`],
              ['Type', o.type + (o.type === 'Scheduled' ? ' · slot ' + o.eta : '')],
              ['Source', U.tag(o.source, o.source === 'Manual entry' ? d.PAL.flax : d.PAL.lav) +
                ' <em class="sub">' + (o.source === 'Manual entry' ? 'Typed in by branch staff' : o.source === 'Kanz ERP' ? 'Pushed over your API key' : 'Platform connector') + '</em>'],
              ['Branch', `<a href="#/branches/${b.id}">${U.esc(b.name)}</a>`],
              ['Priority', o.prio],
              ['Items', U.esc(o.items)],
              ['Cash on delivery', o.cod ? U.money(o.cod) + ' <em class="sub">the driver collects it and the provider settles with you</em>' : 'Cash free'],
              ['Proof of delivery', o.pod.map(x => U.tag(x, d.PAL.flax)).join(' ')],
              ['Delivery charge', o.charge ? U.money(o.charge) + ' <em class="sub">per ' + (p ? U.esc(p.name) : 'provider') + ' pricing</em>' : 'Not charged'],
              ['Special instructions', o.instr ? U.esc(o.instr) : '—']
            ]))}
            ${U.panel('Route', `<div class="route">
              <div class="rt"><span class="rt-d" style="background:${d.PAL.peach}"></span>
                <div><b>Pickup — ${U.esc(b.name)}</b><em>${U.esc(b.addr)}</em></div></div>
              <div class="rt-line"></div>
              <div class="rt"><span class="rt-d" style="background:${d.PAL.vodka}"></span>
                <div><b>Drop-off — ${U.esc(c.addrs[0])}</b><em>${U.esc(c.name)} · ${U.esc(c.phone)}</em></div></div>
            </div><div class="minimap"><div class="lf" id="omap"></div></div>`, { pad: false })}
            ${U.panel('Order trace', MDEEP.traceHTML(o) +
              '<div class="fld-h" style="padding:9px 12px;border-top:1px solid var(--line2);margin:0">' +
              'Status changes, who is fulfilling, delays and your escalations. Which drivers were offered the order stays with your provider — you do not dispatch.' +
              '</div>', { pad: false, right: U.btn('Open the trace drawer', { act: 'mTrace', arg: o.id }) })}
          </div>
          <div class="stack">
            ${U.panel('Delivery charge', U.defs([
              ['State', U.tag(MDEEP.settle(o).state, MDEEP.SETTLE_STATE[MDEEP.settle(o).state], { solid: MDEEP.settle(o).state !== 'Settled' })],
              ['Rate applied', U.money(MDEEP.settle(o).gross) + ' <em class="sub">' + MDEEP.settle(o).base + ' base + ' + MDEEP.settle(o).km + ' km</em>'],
              ['Adjustments', MDEEP.settle(o).adj ? (MDEEP.settle(o).adj < 0 ? '−' : '+') + U.money(Math.abs(MDEEP.settle(o).adj)) : 'None'],
              ['You owe', '<b>' + U.money(MDEEP.settle(o).due) + '</b>'],
              ['Statement period', MDEEP.settle(o).period]]) +
              '<div class="btnrow">' + U.btn('Open the charge record', { act: 'mSettle', arg: o.id }) + '</div>')}
            ${U.panel('Provider and driver', p ? `
              <div class="who lg"><span class="av">${p.logo}</span><span><b>${U.esc(p.name)}</b><em>${p.kind} · on time ${p.onTime}%</em></span></div>
              ${U.defs([
                ['Driver', o.driver ? U.esc(o.driver) : '<em class="sub">Not yet assigned</em>'],
                ['Vehicle', o.vehicle ? U.esc(o.vehicle) : '—'],
                ['Contact', o.driverPhone ? U.esc(o.driverPhone) : '—'],
                ['Pricing', U.esc(p.price)]
              ])}
              ${U.note('You do not manage this driver.', 'They belong to ' + U.esc(p.name) + '. Escalate through Dash rather than calling their office.', d.PAL.vodka)}
              <div class="btnrow">${U.btn('Escalate to Dash', { act: 'escalate', arg: o.id })}${U.btn('Provider profile', { act: 'go', arg: '/marketplace/' + p.id })}</div>`
              : `<div class="empty">No provider yet. ${U.btn('Assign now', { kind: 'primary', act: 'assignProvider', arg: o.id })}</div>`)}
            ${U.panel('Customer', U.defs([
              ['Name', `<a href="#/customers/${c.id}">${U.esc(c.name)}</a>` + (c.flagged ? ' ' + U.tag('Flagged', d.PAL.tang, { solid: true }) : '')],
              ['Phone', U.esc(c.phone)], ['Orders with you', c.orders], ['Success rate', c.success + '%'],
              ['Note', c.note ? U.esc(c.note) : '—']
            ]))}
            ${U.panel('Tracking link', `${U.defs([
              ['Link', `<code>dash.link/t/${o.id.toLowerCase()}</code>`],
              ['Shared with', 'Your customer — you send it, not Dash'],
              ['Expires', '2 h after delivery']])}
              <div class="btnrow">${U.btn('Copy link', { act: 'copyLink', arg: o.id })}${U.btn('Send to customer', { act: 'sendLink', arg: o.id })}</div>
              ${U.note('Dash never contacts your customer.', 'Dash updates you; you decide what your customer hears and when.', d.PAL.peach)}`)}
            ${o.status === 'Delivered' ? U.panel('Proof of delivery', `
              <div style="border:1px solid var(--line);aspect-ratio:4/3;position:relative;background:repeating-linear-gradient(135deg,#F4F4F2 0 6px,#fff 6px 12px)">
                <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:500 9px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#7f7f7f;text-align:center">Driver photo<br>at the door</span></div>
              <div style="margin-top:12px">${U.defs([['Captured', o.log[o.log.length - 1].t], ['Types', o.pod.join(', ')], ['By', U.esc(o.driver || '—')]])}</div>
              <div class="btnrow">${U.btn('Download', { act: 'stub', arg: 'Proof downloaded' })}</div>`) : ''}
          </div>
        </div>`;
    },
    mount(id) { MAP.build('omap', { routes: true }); setTimeout(() => MAP.focusOrder(id), 220); }
  };

  /* ---------------- Create order ---------------- */
  SCREENS['create-order'] = {
    title: 'Create order', epic: 'Epic 08',
    render() {
      const d = D();
      STATE.no = STATE.no || { type: 'On demand', branch: d.BRANCHES[0].name, prio: 'Normal', pod: ['Photo'], cod: '', route: 'Use my dispatch rules', prov: 'Rehla Fleet' };
      const n = STATE.no;
      const bds = d.dispatchFor((d.BRANCHES.find(b => b.name === n.branch) || d.BRANCHES[0]).id);
      const base = 13.5, km = 4.1, perKm = 1.2;
      const extras = (n.prio === 'High' ? 3 : 0) + (n.type === 'Scheduled' ? 4 : 0) + (n.pod.length - 1) * 1.5;
      return U.page('Create order', 'Manual entry — the same order model the connectors and the API produce',
        U.btn('Cancel', { act: 'go', arg: '/orders' })) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Branch and timing', `
              <div class="grid2">
                ${U.field('Pickup branch', U.select(d.BRANCHES.map(b => b.name), n.branch, { act: 'noBranch' }), 'Hours: ' + U.esc((d.BRANCHES.find(b => b.name === n.branch) || d.BRANCHES[0]).hours))}
                ${U.field('Order type', U.radio(['On demand', 'Scheduled'], n.type, 'noType'), n.type === 'Scheduled' ? 'A provider is locked in 20 minutes before the slot' : 'Dispatched the moment you save it')}
                ${n.type === 'Scheduled' ? U.field('Delivery slot', U.input('2026-08-29T18:30', '', { type: 'datetime-local' })) : U.field('Requested pickup', U.input('As soon as possible'))}
                ${U.field('Priority', U.radio(['Normal', 'High'], n.prio, 'noPrio'), 'High priority is offered to providers first')}
              </div>`)}
            ${U.panel('Customer', `
              <div class="grid2">
                ${U.field('Search or create', U.select([...d.CUSTOMERS.map(c => c.name + ' · ' + c.phone), '+ New customer'], d.CUSTOMERS[0].name + ' · ' + d.CUSTOMERS[0].phone), 'One profile per phone number across all your branches')}
                ${U.field('Phone', U.input('+966 50 220 1188'))}
                ${U.field('Delivery address', U.select(d.CUSTOMERS[0].addrs.concat(['+ New address']), d.CUSTOMERS[0].addrs[0]))}
                ${U.field('Address notes', U.input('Gate code 4471'))}
              </div>
              <div class="minimap"><div class="lf" id="cmap"></div></div>`)}
            ${U.panel('Order contents', `
              <div class="grid2">
                ${U.field('Items', U.input('2 bags'))}
                ${U.field('Weight', U.input('6.2 kg'))}
                ${U.field('Size', U.select(['Small', 'Medium', 'Large', 'Bulk — van required'], 'Medium'))}
                ${U.field('Temperature', U.select(['Ambient', 'Chilled', 'Frozen'], 'Ambient'), 'Chilled narrows which providers can take it')}
                ${U.field('Cash on delivery', U.input(n.cod, 'SAR 0.00', { act: 'noCod' }), 'The driver collects it; the provider settles with you')}
                ${U.field('Proof of delivery', `<div class="chips">${['Photo', 'Signature', 'OTP'].map(p => `<button type="button" class="chip ${n.pod.includes(p) ? 'on' : ''}" data-act="noPod" data-arg="${p}">${p}</button>`).join('')}</div>`, 'The driver app enforces whatever you require')}
              </div>
              ${U.field('Special instructions', `<textarea class="in" rows="2">Call on arrival, gate code 4471</textarea>`)}`)}
          </div>
          <div class="stack">
            ${U.panel('Who delivers this', `
              ${U.field('Dispatch', U.radio(['Use my dispatch rules', 'Pick a provider'], n.route, 'noRoute'),
                n.route === 'Use my dispatch rules' ? bds.src + ' for this branch: ' + U.esc(bds.mode) + (bds.mode === 'Specific 3PL' ? ' · ' + U.esc(bds.specific) : '') + ' — ' + U.esc(bds.fallback.toLowerCase()) : 'Overrides your rules for this one order')}
              ${n.route === 'Pick a provider'
                ? U.field('Provider', U.select(d.PROVIDERS.filter(p => p.status === 'Connected').map(p => p.name), n.prov, { act: 'noProv' }))
                : `<div class="candidates"><div class="sub-h">Your pool, in order</div>
                  ${bds.poolOrder.map((pid, i) => { const p = d.prov(pid);
                    return `<div class="cand"><span class="cand-n">${i + 1}</span>
                      <div><b>${U.esc(p.name)}</b><em>${U.esc(p.zones)} · on time ${p.onTime}% · accepts ${p.accept}% · ${U.esc(p.price)}</em></div>
                      ${i === 0 ? U.tag('Tried first', d.PAL.lemon, { solid: true }) : ''}</div>`; }).join('')}
                  <div class="fld-h">If none of them take it: ${U.esc(bds.fallback.toLowerCase())} after ${bds.fallbackAfter} minutes.</div></div>`}
              <div class="btnrow">${U.btn('Change dispatch rules', { act: 'go', arg: '/dispatch' })}</div>`)}
            ${U.panel('What this will cost you', `
              <div class="est"><span>Base — ${U.esc(n.route === 'Pick a provider' ? n.prov : d.prov(bds.poolOrder[0]).name)}</span><b>${U.money(base)}</b></div>
              <div class="est"><span>Distance ${km} km × ${U.money(perKm)}</span><b>${U.money(km * perKm)}</b></div>
              ${n.prio === 'High' ? `<div class="est"><span>Priority handling</span><b>${U.money(3)}</b></div>` : ''}
              ${n.type === 'Scheduled' ? `<div class="est"><span>Scheduled slot</span><b>${U.money(4)}</b></div>` : ''}
              ${n.pod.length > 1 ? `<div class="est"><span>Extra proof of delivery</span><b>${U.money((n.pod.length - 1) * 1.5)}</b></div>` : ''}
              <div class="est tot"><span>Estimated charge</span><b>${U.money(base + km * perKm + extras)}</b></div>
              <div class="fld-h">Taken from your wallet on delivery. Returns are not charged.</div>`)}
            ${U.panel('Waybill', `<div class="waybill">
              <div class="wb-h"><b>KANZ MARKET</b><span>DX-NEW</span></div>
              <div class="wb-b"><div><em>From</em>${U.esc(n.branch)}</div><div><em>To</em>${U.esc(d.CUSTOMERS[0].addrs[0])}</div>
                <div><em>COD</em>${n.cod ? U.money(n.cod) : 'Cash free'}</div><div><em>Proof</em>${n.pod.join(', ')}</div></div>
              <div class="wb-c">▌▐▌▌▐▐▌▐▌▌▐▌▐▐▌▌▐▌▐▌▐▐▌▌▐</div></div>
              ${U.btn('Print waybill', { act: 'waybill', arg: 'new' })}`)}
            <div class="btnrow big">
              ${U.btn('Create and dispatch', { kind: 'primary', act: 'createOrder' })}
              ${U.btn('Save as draft', { act: 'stub', arg: 'Saved as a draft — not dispatched' })}
            </div>
          </div>
        </div>`;
    },
    mount() { MAP.build('cmap', { routes: false }); }
  };

  /* ---------------- 18 Customer directory ---------------- */
  SCREENS['customers'] = {
    title: 'Customers', epic: 'Epic 18',
    render() {
      const d = D();
      return U.page('Customer directory', 'One profile per person across all your branches',
        U.btn('Add customer', { kind: 'primary', act: 'stub', arg: 'Create a customer profile' }) + U.btn('Export CSV', { act: 'export', arg: 'customers' })) + `
        <div class="kpis k-4">
          ${U.kpi('Profiles', d.CUSTOMERS.length + 2407, 'Shared across your branches', d.PAL.lav)}
          ${U.kpi('Flagged', d.CUSTOMERS.filter(c => c.flagged).length, 'Refused or unreachable repeatedly', d.PAL.tang)}
          ${U.kpi('Avg success rate', Math.round(d.CUSTOMERS.reduce((s, c) => s + c.success, 0) / d.CUSTOMERS.length) + '%', 'Delivered first attempt', d.PAL.flax)}
          ${U.kpi('Repeat rate', '68%', 'Two or more orders in 90 days', d.PAL.vodka)}
        </div>
        ${U.panel('', U.table(
          [{ t: 'Customer' }, { t: 'Phone' }, { t: 'Email' }, { t: 'Addresses', num: true }, { t: 'Orders', num: true },
           { t: 'Success', w: '120px' }, { t: 'Spend', num: true }, { t: 'Last order' }, { t: 'Flag' }, { t: 'Note' }],
          d.CUSTOMERS.map(c => ({ act: 'go', arg: '/customers/' + c.id, cells: [
            `<div class="who sm">${U.avatar(c.name)}<span>${U.esc(c.name)}</span></div>`, U.esc(c.phone), U.esc(c.email),
            c.addrs.length, c.orders, `${c.success}% ${U.bar(c.success, c.success < 90 ? d.PAL.tang : d.PAL.lav)}`,
            U.money(c.spend), U.esc(c.last),
            c.flagged ? U.tag('Flagged', d.PAL.tang, { solid: true }) : '—',
            c.note ? U.esc(c.note) : '<em class="sub">—</em>'] }))), { pad: false })}
        ${U.note('Flags are yours, not the provider’s.', 'A flag you raise shows to your own staff and travels on the order as an instruction — it is never shown to the customer.', d.PAL.lav)}`;
    }
  };

  SCREENS['customer'] = {
    title: 'Customer', epic: 'Epic 18',
    render(id) {
      const d = D(), c = d.customer(id);
      if (!c) return U.page('Customer not found', '');
      const orders = d.ORDERS.filter(o => o.customer === c.id);
      return U.page(c.name, `${U.esc(c.phone)} · ${c.orders} orders · ${U.money(c.spend)} lifetime`,
        U.btn('Create order for them', { kind: 'primary', act: 'go', arg: '/create-order' }) +
        U.btn(c.flagged ? 'Remove flag' : 'Flag customer', { kind: c.flagged ? '' : 'danger', act: 'toggleFlag', arg: c.id }) +
        U.btn('Back to customers', { act: 'go', arg: '/customers' })) + `
        ${c.flagged ? U.note('This customer is flagged.', U.esc(c.note) + ' The note is attached to every new order as a driver instruction.', d.PAL.tang) : ''}
        <div class="cols c-1-1">
          ${U.panel('Profile', U.defs([
            ['Name', U.esc(c.name)], ['Phone', U.esc(c.phone)], ['Email', U.esc(c.email)],
            ['Orders', c.orders], ['Lifetime spend', U.money(c.spend)],
            ['Delivery success', `${c.success}% ${U.bar(c.success, c.success < 90 ? d.PAL.tang : d.PAL.lav)}`],
            ['Last order', U.esc(c.last)],
            ['Note', c.note ? U.esc(c.note) : '—']
          ]), { right: U.btn('Edit note', { act: 'stub', arg: 'Notes are visible to your staff and to drivers as instructions' }) })}
          ${U.panel('Addresses', `${c.addrs.map(a => `<div class="tx" style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line2)">
            <div><b style="font-size:12.5px">${U.esc(a.split(' — ')[0])}</b><em class="sub">${U.esc(a.split(' — ')[1] || 'No label')}</em></div>
            ${U.btn('Set default', { act: 'stub', arg: 'Default address changed' })}</div>`).join('')}
            <div class="btnrow">${U.btn('Add address', { act: 'stub', arg: 'Add a delivery address' })}</div>`)}
        </div>
        ${U.panel('Order history', U.table(
          [{ t: 'Order' }, { t: 'Branch' }, { t: 'Provider' }, { t: 'Status' }, { t: 'Charge', num: true }, { t: 'Created' }],
          orders.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
            `<b>${o.id}</b>`, d.branch(o.branch).code,
            o.provider ? U.esc(d.prov(o.provider).name) : '<em class="warn">Waiting</em>',
            U.statusTag(o.status), o.charge ? U.money(o.charge) : '—', o.created] }))), { pad: false })}`;
    }
  };
})();
