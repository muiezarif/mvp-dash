/* Dash DMS — Orders (15), Order detail, Order creation (14), Customers (13) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.DMS;
  window.STATE = window.STATE || {};
  STATE.orderFilter = STATE.orderFilter || { status: 'All statuses', source: 'All sources', zone: 'All zones', type: 'All types', sla: 'All SLA states', q: '' };

  /* ---------------- 15 Orders ---------------- */
  SCREENS['orders'] = {
    title: 'Orders', epic: 'Epic 15',
    render() {
      const d = D(), f = STATE.orderFilter;
      let rows = d.ORDERS.filter(o =>
        (f.status === 'All statuses' || o.status === f.status) &&
        (f.source === 'All sources' || o.source === f.source) &&
        (f.type === 'All types' || o.type === f.type) &&
        (f.zone === 'All zones' || f.zone.startsWith(d.zone(o.zone).code)) &&
        (f.sla === 'All SLA states' || DEEP.sla(o).state === f.sla) &&
        (!f.q || (o.id + ' ' + d.merchant(o.merchant).name + ' ' + d.customer(o.customer).name).toLowerCase().includes(f.q.toLowerCase())));

      const bySource = s => d.ORDERS.filter(o => o.source === s).length;

      return U.page('Orders', 'Every order, whatever its source — filterable and reportable',
        U.btn('Create order', { kind: 'primary', act: 'go', arg: '/create-order' }) + U.btn('Export CSV', { act: 'export', arg: 'orders' })) + `
        <div class="kpis k-4">
          ${U.kpi('Direct — own merchants', bySource('Direct'), 'Merchants you contracted yourself', d.PAL.peach)}
          ${U.kpi('Marketplace', bySource('Marketplace'), 'Connected through your Dash listing', d.PAL.vodka)}
          ${U.kpi('Dash Network', bySource('Dash Network'), 'Routed to you as Supply', d.PAL.lav)}
          ${U.kpi('Scheduled', d.ORDERS.filter(o => o.type === 'Scheduled').length, 'Assigned 20 min before the slot', d.PAL.flax)}
        </div>
        ${U.filters([
          U.input(f.q, 'Search order, merchant or customer…', { act: 'ordQ' }),
          `<span class="f-l">Status</span>` + U.select(['All statuses', ...Object.keys(d.STATUS)], f.status, { act: 'ordF', arg: 'status' }),
          `<span class="f-l">Source</span>` + U.select(['All sources', 'Direct', 'Marketplace', 'Dash Network'], f.source, { act: 'ordF', arg: 'source' }),
          `<span class="f-l">Type</span>` + U.select(['All types', 'On demand', 'Scheduled'], f.type, { act: 'ordF', arg: 'type' }),
          `<span class="f-l">Zone</span>` + U.select(['All zones', ...d.ZONES.map(z => z.code)], f.zone, { act: 'ordF', arg: 'zone' }),
          `<span class="f-l">SLA</span>` + U.select(['All SLA states', 'On time', 'At risk', 'Late'], f.sla, { act: 'ordF', arg: 'sla' }),
          `<span class="f-sp"></span><span class="f-c">${rows.length} of ${d.ORDERS.length}</span>`,
          U.btn('Reset', { act: 'ordReset' })
        ])}
        ${U.panel('', U.table(
          [{ t: 'Order' }, { t: 'Merchant' }, { t: 'Customer' }, { t: 'Zone' }, { t: 'Type' }, { t: 'Source' }, { t: 'Driver' },
           { t: 'Status' }, { t: 'SLA' }, { t: 'COD', num: true }, { t: 'Price', num: true }, { t: 'Created' }, { t: 'ETA' }],
          rows.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
            `<b>${o.id}</b>`,
            U.esc(d.merchant(o.merchant).name) + `<em class="sub">${U.esc(o.branch)}</em>`,
            U.esc(d.customer(o.customer).name) + (d.customer(o.customer).flagged ? ' ' + U.tag('Flagged', d.PAL.tang, { solid: true }) : ''),
            d.zone(o.zone).code, o.type,
            U.tag(o.source, o.source === 'Dash Network' ? d.PAL.lav : o.source === 'Marketplace' ? d.PAL.vodka : d.PAL.peach),
            o.driver ? U.esc(d.driver(o.driver).name) : '<em class="warn">Unassigned</em>',
            U.statusTag(o.status), DEEP.slaTag(DEEP.sla(o).state), o.cod ? U.money(o.cod) : '—', o.price ? U.money(o.price) : '—', o.created, o.eta
          ] }))), { pad: false })}`;
    }
  };

  /* ---------------- Order detail ---------------- */
  SCREENS['order'] = {
    title: 'Order', epic: 'Epics 15 · 17',
    render(id) {
      const d = D(), o = d.order(id);
      if (!o) return U.page('Order not found', 'No order with reference ' + U.esc(id));
      const m = d.merchant(o.merchant), c = d.customer(o.customer), z = d.zone(o.zone), dr = o.driver ? d.driver(o.driver) : null;
      const step = d.STATUS[o.status].step;
      const sl = DEEP.sla(o), st = DEEP.settle(o), cs = DEEP.casesFor(o.id);

      return U.page(o.id, `${U.esc(m.name)} · ${U.esc(o.branch)} · created ${o.created}`,
        (o.status === 'Assigning' ? U.btn('Assign driver', { kind: 'primary', act: 'assign', arg: o.id }) : U.btn('Reassign driver', { act: 'assign', arg: o.id })) +
        U.btn('Waybill', { act: 'waybill', arg: o.id }) + U.btn('Escalate', { act: 'escalate', arg: o.id }) +
        U.btn('Cancel order', { kind: 'danger', act: 'cancelOrder', arg: o.id }) + U.btn('Back to orders', { act: 'go', arg: '/orders' })) + `
        <div class="flowbar">
          ${d.FLOW.map((s, i) => `<div class="fb ${step >= i + 1 ? 'done' : ''} ${step === i + 1 ? 'now' : ''}">
            <span class="fb-d"></span><span class="fb-l">${s}</span>
            <span class="fb-t">${(o.log.find(l => l.e.toLowerCase().startsWith(s.toLowerCase())) || {}).t || (step >= i + 1 ? '' : '—')}</span></div>`).join('')}
        </div>
        ${step < 0 ? U.note(o.status === 'Cancelled' ? 'Order cancelled.' : 'Order returned to merchant.',
            o.log[o.log.length - 1].e + ' — ' + (o.log[o.log.length - 1].s || 'no reason recorded'), d.PAL.tang) : ''}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Order', U.defs([
              ['Status', U.statusTag(o.status)],
              ['SLA state', DEEP.slaTag(sl.state) + ' <em class="sub">promised pickup ' + sl.promisedPickup + ' · delivery ' + sl.promisedDelivery +
                ' · ' + sl.src + '</em>'],
              ['Ageing', DEEP.dur(sl.age) + (sl.state === 'Late' ? ' <em class="warn">· ' + DEEP.dur(sl.over) + ' past the promise</em>' :
                DEEP.DONE.includes(o.status) ? '' : ' <em class="sub">· ' + DEEP.dur(sl.left) + ' left</em>')],
              ['Type', o.type + (o.type === 'Scheduled' ? ' · slot ' + o.eta : '')],
              ['Source', U.tag(o.source, o.source === 'Dash Network' ? d.PAL.lav : o.source === 'Marketplace' ? d.PAL.vodka : d.PAL.peach) +
                ' <em class="sub">' + (o.source === 'Direct' ? 'Your own merchant' : o.source === 'Marketplace' ? 'Merchant connected via your Dash listing' : 'Routed to you by Dash Network as Supply') + '</em>'],
              ['Priority', o.prio],
              ['Zone', U.dot(z.color) + z.name],
              ['Items', o.items],
              ['Cash on delivery', o.cod ? U.money(o.cod) + ' <em class="sub">driver collects</em>' : 'Cash free'],
              ['Proof of delivery', o.pod.map(p => U.tag(p, d.PAL.flax)).join(' ')],
              ['Price', o.price ? U.money(o.price) + ' <em class="sub">per ' + U.esc(m.name) + ' contract</em>' : '—'],
              ['Special instructions', o.instr ? U.esc(o.instr) : '—']
            ]))}
            ${U.panel('Route', `<div class="route">
              <div class="rt"><span class="rt-d" style="background:${d.PAL.peach}"></span>
                <div><b>Pickup — ${U.esc(o.branch)}</b><em>${o.pickup[0].toFixed(4)}, ${o.pickup[1].toFixed(4)}</em></div></div>
              <div class="rt-line"></div>
              <div class="rt"><span class="rt-d" style="background:${d.PAL.vodka}"></span>
                <div><b>Drop-off — ${U.esc(c.addr)}</b><em>${U.esc(c.name)} · ${U.esc(c.phone)}</em></div></div>
            </div><div class="minimap" id="omap"></div>`, { pad: false })}
            ${U.panel('Order trace', DEEP.traceHTML(o), { pad: false,
              right: '<span class="ph-note">Every status change, offer, intervention and manual action, in order</span>' })}
            ${U.panel('Offer attempts and assignment history', `
              ${(o.offers || []).length ? `<div class="offers">${o.offers.map((f, i) => `
                <div class="of o-${f.out.toLowerCase().replace(/\s/g, '')}"><span class="of-n">${i + 1}</span>
                  <div><b>${U.esc(d.driver(f.d).name)}</b><em>${U.esc(f.sub)}</em></div>
                  <span class="of-o">${f.out}</span><span class="of-t">${f.t}</span></div>`).join('')}</div>`
                : U.note('No offer has gone out yet.', 'The router found nothing eligible — dispatch diagnostics shows which check each candidate failed.', d.PAL.peach)}
              ${(o.assigns || []).length ? U.table([{ t: 'Time' }, { t: 'From' }, { t: 'To' }, { t: 'Changed by' }, { t: 'Reason' }],
                o.assigns.map(a => ({ cells: [a.t, U.esc(d.driver(a.from).name), U.esc(d.driver(a.to).name), U.esc(a.actor), U.esc(a.why)] }))) : ''}
              <div class="btnrow">${U.btn('Dispatch diagnostics', { kind: 'primary', act: 'diag', arg: o.id })}${U.btn('Open the trace drawer', { act: 'trace', arg: o.id })}</div>`)}
          </div>
          <div class="stack">
            ${U.panel('Cases raised', cs.length ? `<div class="mlist">${cs.map(c => `
              <button type="button" class="ml ${c.state === 'Resolved' ? '' : 'warn'}" data-act="caseOpen" data-arg="${c.id}">
                <span class="ml-h"><b>${c.id} · ${U.esc(c.type)}</b>${U.tag(c.state, c.state === 'Resolved' ? '#1f8a4c' : c.state === 'Acknowledged' ? d.PAL.lav : d.PAL.lemon, { solid: c.state !== 'Resolved' })}</span>
                <span class="ml-s">${U.esc(c.reason)} · ${c.owner ? U.esc(c.owner) : 'unclaimed'}</span></button>`).join('')}</div>`
              : '<div class="empty">No case has been raised on this order.</div>',
              { pad: cs.length ? false : true, right: U.btn('Raise a case', { act: 'caseNew', arg: o.id }) })}
            ${U.panel('Settlement', U.defs([
              ['State', U.tag(st.state, DEEP.SETTLE_STATE[st.state], { solid: st.state !== 'Settled' })],
              ['Rate applied', U.money(st.gross) + ' <em class="sub">' + st.base + ' base + ' + st.km + ' km</em>'],
              ['Merchant receivable', '<b>' + U.money(st.receivable) + '</b>'],
              ['Driver payable', st.driverPay ? U.money(st.driverPay) : '—'],
              ['Supply payable', st.tplPay ? U.money(st.tplPay) + ' <em class="sub">' + st.supply + '</em>' : '—'],
              ['COD', st.cod ? U.money(st.cod) + ' <em class="sub">' + st.codState + '</em>' : 'Cash free'],
              ['Period', st.period]]) +
              '<div class="btnrow">' + U.btn('Open the settlement record', { act: 'settleOrder', arg: o.id }) + '</div>')}
            ${U.panel('Driver', dr ? `
              <div class="who lg">${U.avatar(dr.name)}<span><b>${U.esc(dr.name)}</b><em>${U.esc(dr.phone)} · ${d.vehicle(dr.vehicle).type} ${d.vehicle(dr.vehicle).plate}</em></span></div>
              ${U.defs([['Status', U.tag(dr.status, d.PAL.lav)], ['Completion', dr.completion + '%'], ['Avg delivery', dr.avgMin + ' min'], ['Zone', d.zone(dr.zone).code]])}
              <div class="btnrow">${U.btn('Chat with driver', { act: 'chat', arg: dr.id })}${U.btn('Open profile', { act: 'go', arg: '/drivers/' + dr.id })}</div>`
              : `<div class="empty">No driver assigned. ${U.btn('Assign now', { kind: 'primary', act: 'assign', arg: o.id })}</div>`)}
            ${U.panel('Merchant', U.defs([
              ['Name', `<a href="#/merchants/${m.id}">${U.esc(m.name)}</a>`],
              ['Kind', m.kind], ['Integration', m.integration], ['Branch', U.esc(o.branch)],
              ['Contract', m.contract ? U.esc(m.contract.pricing) : '—']]))}
            ${U.panel('Customer', U.defs([
              ['Name', `<a href="#/customers">${U.esc(c.name)}</a>` + (c.flagged ? ' ' + U.tag('Flagged', d.PAL.tang, { solid: true }) : '')],
              ['Phone', U.esc(c.phone)], ['Orders', c.orders], ['Success rate', c.success + '%'],
              ['Note', c.note ? U.esc(c.note) : '—']]))}
            ${U.panel('Tracking link', `${U.defs([['Link', '<code>dash.link/t/' + o.id.toLowerCase() + '</code>'], ['Shared with merchant', 'Automatically on assignment'], ['Expires', '2 h after delivery']])}
              <div class="btnrow">${U.btn('Copy link', { act: 'copyLink', arg: o.id })}${U.btn('Resend to merchant', { act: 'resend', arg: o.id })}</div>`)}
          </div>
        </div>`;
    },
    mount(id) { MAP.build('omap', { routes: true }); const o = D().order(id); if (o) setTimeout(() => MAP.focusOrder(o.id), 220); }
  };

  /* ---------------- 14 Order creation ---------------- */
  SCREENS['create-order'] = {
    title: 'Create order', epic: 'Epic 14',
    render() {
      const d = D();
      STATE.newOrder = STATE.newOrder || { type: 'On demand', merchant: d.MERCHANTS[0].name, prio: 'Normal', pod: ['Photo'], cod: '', route: 'Own fleet' };
      const n = STATE.newOrder;
      const est = 14 + (n.type === 'Scheduled' ? 4 : 0) + (n.prio === 'High' ? 3 : 0) + (n.pod.length - 1) * 1.5;

      return U.page('Create order', 'Manual entry — same order model as the API and the connectors',
        U.btn('Cancel', { act: 'go', arg: '/orders' })) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Type and merchant', `
              <div class="grid2">
                ${U.field('Order type', U.radio(['On demand', 'Scheduled'], n.type, 'noType'), n.type === 'Scheduled' ? 'A driver is assigned 20 minutes before the slot' : 'Deliver as soon as a driver is free')}
                ${n.type === 'Scheduled' ? U.field('Delivery slot', U.input('2026-08-29T18:30', '', { type: 'datetime-local' })) : U.field('Requested pickup', U.input('As soon as possible', '', {}))}
                ${U.field('Merchant', U.select(d.MERCHANTS.filter(m => m.status === 'Connected').map(m => m.name), n.merchant, { act: 'noMerchant' }), 'Dash merchants sync automatically; external merchants are your own records')}
                ${U.field('Branch', U.select(['Kanz — Hittin', 'Kanz — Al Yasmin', 'Kanz — Olaya', 'Kanz — Al Malqa'], 'Kanz — Hittin'))}
              </div>`)}
            ${U.panel('Addresses', `
              <div class="grid2">
                ${U.field('Pickup address', U.input('Kanz Market, Hittin, Riyadh'), 'Falls inside RYD-N Al Malqa')}
                ${U.field('Delivery address', U.input('Al Yasmin, block 4, Riyadh'), 'Falls inside RYD-S Al Yasmin')}
              </div>
              <div class="minimap" id="cmap"></div>`)}
            ${U.panel('Customer', `
              <div class="grid2">
                ${U.field('Search or create', U.select(['Layla A. · +966 50 220 1188', 'Hassan M. · +966 55 771 4420', 'Reem S. · +966 53 118 9902', '+ New customer'], 'Layla A. · +966 50 220 1188'), 'One customer profile across the whole ecosystem, keyed by phone')}
                ${U.field('Phone', U.input('+966 50 220 1188'))}
              </div>`)}
            ${U.panel('Order details', `
              <div class="grid2">
                ${U.field('Items', U.input('2 bags'))}
                ${U.field('Weight', U.input('6.2 kg'))}
                ${U.field('Size', U.select(['Small', 'Medium', 'Large', 'Bulk — van required'], 'Medium'))}
                ${U.field('Priority', U.radio(['Normal', 'High'], n.prio, 'noPrio'), 'High priority jumps the assignment queue')}
                ${U.field('Cash on delivery', U.input(n.cod, 'SAR 0.00', { act: 'noCod' }), 'Shown to the driver; tracked in their wallet until handover')}
                ${U.field('Proof of delivery', `<div class="chips">${['Photo', 'Signature', 'OTP'].map(p => `<button type="button" class="chip ${n.pod.includes(p) ? 'on' : ''}" data-act="noPod" data-arg="${p}">${p}</button>`).join('')}</div>`, 'Driver app enforces whatever you require here')}
              </div>
              ${U.field('Special instructions', `<textarea class="in" rows="2" placeholder="Call on arrival, gate code 4471">Call on arrival, gate code 4471</textarea>`)}`)}
          </div>
          <div class="stack">
            ${U.panel('Routing', `
              ${U.field('Fulfil with', U.radio(['Own fleet', 'Dash Network'], n.route, 'noRoute'),
                n.route === 'Own fleet' ? 'Assignment follows your rules — radius, geofence, capacity, priority' : 'Sent into Dash Network as Demand; you track it without fulfilling it')}
              ${n.route === 'Own fleet' ? `<div class="candidates">
                <div class="sub-h">Candidates right now</div>
                ${d.DRIVERS.filter(x => x.online && x.status !== 'Break').slice(0, 4).map((x, i) => `
                  <div class="cand"><span class="cand-n">${i + 1}</span>
                    <div><b>${U.esc(x.name)}</b><em>${d.zone(x.zone).code} · ${d.vehicle(x.vehicle).type} · ${(1.4 + i * 0.9).toFixed(1)} km · ${x.completion}%</em></div>
                    ${i === 0 ? U.tag('Best match', d.PAL.lemon, { solid: true }) : ''}</div>`).join('')}
              </div>` : U.note('Sent to Dash Network', 'Dash routes it to another fleet, a 3PL or a freelancer. You keep the merchant and the tracking.', d.PAL.vodka)}`)}
            ${U.panel('Price estimate', `
              <div class="est"><span>Base — ${U.esc(n.merchant)} contract</span><b>${U.money(14)}</b></div>
              <div class="est"><span>Distance 4.1 km × SAR 1.20</span><b>${U.money(4.92)}</b></div>
              ${n.prio === 'High' ? `<div class="est"><span>Priority handling</span><b>${U.money(3)}</b></div>` : ''}
              ${n.type === 'Scheduled' ? `<div class="est"><span>Scheduled slot</span><b>${U.money(4)}</b></div>` : ''}
              ${n.pod.length > 1 ? `<div class="est"><span>Extra proof of delivery</span><b>${U.money((n.pod.length - 1) * 1.5)}</b></div>` : ''}
              <div class="est tot"><span>Estimated charge</span><b>${U.money(est + 4.92)}</b></div>
              <div class="fld-h">Final price is confirmed on delivery against the merchant contract.</div>`)}
            ${U.panel('Waybill', `<div class="waybill">
              <div class="wb-h"><b>REHLA FLEET</b><span>DX-NEW</span></div>
              <div class="wb-b"><div><em>From</em>Kanz Market — Hittin</div><div><em>To</em>Al Yasmin, block 4</div><div><em>COD</em>${n.cod ? U.money(n.cod) : 'Cash free'}</div><div><em>Proof</em>${n.pod.join(', ')}</div></div>
              <div class="wb-c">▌▐▌▌▐▐▌▐▌▌▐▌▐▐▌▌▐▌▐▌▐▐▌▌▐</div>
            </div>${U.btn('Print waybill', { act: 'waybill', arg: 'new' })}`)}
            <div class="btnrow big">
              ${U.btn('Create and assign', { kind: 'primary', act: 'createOrder' })}
              ${U.btn('Create unassigned', { act: 'createOrderQ' })}
            </div>
          </div>
        </div>`;
    },
    mount() { MAP.build('cmap', { routes: false }); }
  };

  /* ---------------- 13 Customers ---------------- */
  SCREENS['customers'] = {
    title: 'Customers', epic: 'Epic 13',
    render() {
      const d = D();
      return U.page('Customers', 'One profile per person across the ecosystem, keyed by phone or email',
        U.btn('Export CSV', { act: 'export', arg: 'customers' })) + `
        <div class="kpis k-4">
          ${U.kpi('Customer profiles', d.CUSTOMERS.length + 2412, 'Shared across merchants', d.PAL.lav)}
          ${U.kpi('Flagged', d.CUSTOMERS.filter(c => c.flagged).length, 'Refused or unreachable repeatedly', d.PAL.tang)}
          ${U.kpi('Avg success rate', Math.round(d.CUSTOMERS.reduce((s, c) => s + c.success, 0) / d.CUSTOMERS.length) + '%', 'Delivered on first attempt', d.PAL.flax)}
          ${U.kpi('Repeat customers', '68%', 'Two or more orders in 90 days', d.PAL.vodka)}
        </div>
        ${U.panel('', U.table(
          [{ t: 'Customer' }, { t: 'Phone' }, { t: 'Default address' }, { t: 'Orders', num: true }, { t: 'Success', w: '120px' }, { t: 'Flag' }, { t: 'Note' }],
          d.CUSTOMERS.map(c => ({ cells: [
            `<div class="who sm">${U.avatar(c.name)}<span>${U.esc(c.name)}</span></div>`, U.esc(c.phone), U.esc(c.addr), c.orders,
            `${c.success}% ${U.bar(c.success, c.success < 90 ? d.PAL.tang : d.PAL.lav)}`,
            c.flagged ? U.tag('Flagged', d.PAL.tang, { solid: true }) : '—',
            c.note ? U.esc(c.note) : '<em class="sub">—</em>'] }))), { pad: false })}
        ${U.note('Order history per merchant.', 'A customer profile shows orders per merchant, so a flag raised by one merchant is visible to your dispatchers without exposing another merchant’s data.', d.PAL.lav)}`;
    }
  };
})();
