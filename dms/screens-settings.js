/* Dash DMS — Zones (11), Merchants (12), Assignment settings (10), Driver app settings (09) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.DMS;
  window.STATE = window.STATE || {};
  STATE.assign = STATE.assign || {
    mode: 'Auto', rule: 'Radius based', radius: 3.0, capacity: 4, priority: 'High first', schedMin: 20,
    geofenceStrict: true, groupScope: false, fallbackNetwork: true
  };
  STATE.appSet = STATE.appSet || {
    cancelReason: true, distance: 150, podRequired: true, accept: 'Auto accept',
    reattempt: true, maxReattempt: 2, autoReturn: true, failReason: true,
    trackEnabled: true, trackShare: 'Automatically', trackExpiry: '2 hours after delivery'
  };

  /* ---------------- 11 Geofencing ---------------- */
  SCREENS['zones'] = {
    title: 'Zones', epic: 'Epic 11',
    render() {
      const d = D();
      return U.page('Zones and geofencing', 'Drawn on the map, not typed into a form — drivers, orders and reports all read them',
        U.btn('Draw new zone', { kind: 'primary', act: 'stub', arg: 'Zone drawing tool — click to place vertices' }) + U.btn('Export CSV', { act: 'export', arg: 'zones' })) + `
        <div class="maplayout">
          <div class="mapwrap tall"><div id="zmap"></div>
            <div class="maplegend">${d.ZONES.map(z => `<span>${U.dot(z.color)}${z.code}${z.status === 'Paused' ? ' (paused)' : ''}</span>`).join('')}</div>
          </div>
          <div class="mapside">
            ${d.ZONES.map(z => U.panel(z.code + ' — ' + z.name.split('— ')[1], `
              ${U.defs([
                ['Status', U.tag(z.status, z.status === 'Active' ? '#1f8a4c' : d.PAL.peach, { solid: z.status !== 'Active' })],
                ['Assigned drivers', z.drivers.map(id => `<a href="#/drivers/${id}">${U.esc(d.driver(id).name.split(' ')[0])}</a>`).join(', ')],
                ['Live orders', z.orders],
                ['On time', `${z.onTime}% ${U.bar(z.onTime, z.color)}`],
                ['Avg pickup', z.avgPickup + ' min']
              ])}
              <div class="btnrow">${U.btn('Focus', { act: 'focusZone', arg: z.id })}${U.btn(z.status === 'Active' ? 'Pause zone' : 'Resume zone', { act: 'toggleZone', arg: z.id })}${U.btn('Edit shape', { act: 'stub', arg: 'Drag vertices to reshape ' + z.code })}</div>`)).join('')}
          </div>
        </div>
        ${U.panel('Zone reporting', U.table(
          [{ t: 'Zone' }, { t: 'Orders this week', num: true }, { t: 'On time', w: '140px' }, { t: 'Avg pickup', num: true }, { t: 'Drivers', num: true }, { t: 'Orders per driver', num: true }, { t: 'Status' }],
          d.ZONES.map(z => ({ cells: [
            U.dot(z.color) + U.esc(z.name), z.orders * 7,
            `${z.onTime}% ${U.bar(z.onTime, z.color)}`, z.avgPickup + 'm', z.drivers.length,
            Math.round(z.orders * 7 / z.drivers.length),
            U.tag(z.status, z.status === 'Active' ? '#1f8a4c' : d.PAL.peach)] }))), { pad: false })}
        ${U.note('A paused zone stops assignment, not tracking.', 'Orders already out finish normally; new orders in RYD-W queue or fall to Dash Network if the overflow fallback is on in assignment settings.', d.PAL.peach)}`;
    },
    mount() { MAP.build('zmap', { routes: false }); }
  };

  /* ---------------- 12 Merchants ---------------- */
  SCREENS['merchants'] = {
    title: 'Merchants', epic: 'Epic 12',
    render() {
      const d = D();
      return U.page('Merchants', 'Dash merchants sync automatically; external merchants are your own records',
        U.btn('Add external merchant', { kind: 'primary', act: 'stub', arg: 'Create external merchant' }) + U.btn('Export CSV', { act: 'export', arg: 'merchants' })) + `
        <div class="kpis k-4">
          ${U.kpi('Connected merchants', d.MERCHANTS.filter(m => m.status === 'Connected').length, `${d.MERCHANTS.filter(m => m.kind === 'Dash Merchant').length} Dash · ${d.MERCHANTS.filter(m => m.kind === 'External Merchant').length} external`, d.PAL.peach)}
          ${U.kpi('Daily volume', d.MERCHANTS.reduce((s, m) => s + (m.status === 'Connected' ? m.volume : 0), 0), 'Orders per day, combined', d.PAL.lav)}
          ${U.kpi('Pending requests', d.MERCHANTS.filter(m => m.status !== 'Connected').length, 'From the 3PL Marketplace', d.PAL.vodka)}
          ${U.kpi('Contracts expiring', d.MERCHANTS.filter(m => m.contract && m.contract.status === 'Expiring').length, 'Within 90 days', d.PAL.tang)}
        </div>
        ${U.panel('', U.table(
          [{ t: 'Merchant' }, { t: 'Kind' }, { t: 'Integration' }, { t: 'Branches', num: true }, { t: 'Orders/day', num: true },
           { t: 'Connected since' }, { t: 'Pricing' }, { t: 'Terms' }, { t: 'Contract' }, { t: '', w: '170px' }],
          d.MERCHANTS.map(m => ({ act: 'go', arg: '/merchants/' + m.id, cells: [
            `<b>${U.esc(m.name)}</b>`,
            U.tag(m.kind, m.kind === 'Dash Merchant' ? d.PAL.peach : d.PAL.flax),
            m.integration, m.branches, m.volume, m.since,
            m.contract ? U.esc(m.contract.pricing) : '<em class="sub">Not set</em>',
            m.contract ? m.contract.terms : '—',
            m.contract ? U.tag(m.contract.status, m.contract.status === 'Active' ? '#1f8a4c' : d.PAL.peach, { solid: m.contract.status !== 'Active' }) : U.tag('Pending', d.PAL.vodka, { solid: true }),
            m.status === 'Connected'
              ? `<div class="rowact">${U.btn('Contract', { act: 'go', arg: '/merchants/' + m.id })}${U.btn('Disconnect', { kind: 'danger', act: 'disconnect', arg: m.id })}</div>`
              : `<div class="rowact">${U.btn('Approve', { kind: 'primary', act: 'approveMerchant', arg: m.id })}${U.btn('Reject', { act: 'stub', arg: 'Reject with reason' })}</div>`] }))), { pad: false })}
        ${U.note('Auto-synced versus API versus manual.', 'A Dash merchant’s orders arrive without any integration work. An external merchant connects over your API keys, or a dispatcher types their orders in — the order model is identical in all three cases.', d.PAL.peach)}`;
    }
  };

  SCREENS['merchant'] = {
    title: 'Merchant', epic: 'Epic 12',
    render(id) {
      const d = D(), m = d.merchant(id);
      if (!m) return U.page('Merchant not found', '');
      const orders = d.ORDERS.filter(o => o.merchant === m.id);
      return U.page(m.name, `${m.kind} · ${m.integration} · ${m.branches} branches · connected ${m.since}`,
        U.btn('Edit contract', { kind: 'primary', act: 'stub', arg: 'Contract editor' }) +
        U.btn('Disconnect', { kind: 'danger', act: 'disconnect', arg: m.id }) +
        U.btn('Back to merchants', { act: 'go', arg: '/merchants' })) + `
        <div class="cols c-1-1">
          ${U.panel('Business', U.defs([
            ['Name', U.esc(m.name)], ['Kind', m.kind], ['Integration', m.integration],
            ['Branches', m.branches], ['Average volume', m.volume + ' orders / day'],
            ['Status', U.tag(m.status, m.status === 'Connected' ? '#1f8a4c' : d.PAL.vodka)]
          ]))}
          ${U.panel('Contract', m.contract ? U.defs([
            ['Pricing and rates', U.esc(m.contract.pricing)], ['Payment terms', m.contract.terms],
            ['Start date', m.contract.start], ['End date', m.contract.end],
            ['Status', U.tag(m.contract.status, m.contract.status === 'Active' ? '#1f8a4c' : d.PAL.peach, { solid: m.contract.status !== 'Active' })]
          ]) : '<div class="empty">No contract yet — approve the connection request first.</div>')}
        </div>
        ${U.panel('Order history', U.table(
          [{ t: 'Order' }, { t: 'Branch' }, { t: 'Zone' }, { t: 'Source' }, { t: 'Status' }, { t: 'Price', num: true }, { t: 'Created' }],
          orders.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
            `<b>${o.id}</b>`, U.esc(o.branch), d.zone(o.zone).code,
            U.tag(o.source, o.source === 'Dash Network' ? d.PAL.lav : o.source === 'Marketplace' ? d.PAL.vodka : d.PAL.peach),
            U.statusTag(o.status), o.price ? U.money(o.price) : '—', o.created] }))), { pad: false })}`;
    }
  };

  /* ---------------- 10 Order assignment settings ---------------- */
  SCREENS['assignment'] = {
    title: 'Assignment', epic: 'Epic 10',
    render() {
      const d = D(), a = STATE.assign;
      return U.page('Order assignment', 'How an order finds a driver — the one setting page dispatch actually depends on',
        U.btn('Save changes', { kind: 'primary', act: 'saveAssign' })) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Mode', `
              ${U.field('Assignment', U.radio(['Manual', 'Auto'], a.mode, 'asMode'),
                a.mode === 'Auto' ? 'Dash picks the driver the moment the order lands. Dispatchers can still override from the control tower.' : 'Every order waits in the control tower queue until a dispatcher assigns it.')}`)}
            ${U.panel('Rule', `
              ${U.field('Primary rule', U.radio(['Radius based', 'Geofence based', 'Capacity based', 'Priority based'], a.rule, 'asRule'))}
              <div class="rulebody">
                ${a.rule === 'Radius based' ? `
                  ${U.field('Search radius', `<div class="slider"><input class="rng" type="range" min="1" max="8" step="0.5" value="${a.radius}" data-act="asRadius"><b>${a.radius.toFixed(1)} km</b></div>`,
                    'The nearest available driver inside the radius takes it. Widen it in quiet hours, tighten it when the fleet is dense.')}
                  <div class="radiusviz"><span class="rv-c"></span>
                    ${[1.4, 2.3, 3.6, 5.1].map((km, i) => `<span class="rv-d ${km <= a.radius ? 'in' : ''}" style="--x:${20 + i * 20}%;--y:${30 + (i % 2) * 34}%">${km} km</span>`).join('')}
                    <span class="rv-r" style="width:${a.radius / 8 * 90}%;height:${a.radius / 8 * 90}%"></span>
                    <span class="rv-l">${['Faisal', 'Turki', 'Yousef', 'Nawaf'].filter((_, i) => [1.4, 2.3, 3.6, 5.1][i] <= a.radius).length} drivers in range</span>
                  </div>` : ''}
                ${a.rule === 'Geofence based' ? `
                  ${U.field('Strict geofence', U.toggle(a.geofenceStrict, 'asGeo', '', 'Only drivers assigned to the order’s zone'),
                    a.geofenceStrict ? 'RYD-W is paused, so orders there queue until you resume it or the network fallback picks them up.' : 'Drivers from adjacent zones can be pulled in when the home zone is short.')}
                  <div class="zonebars">${d.ZONES.map(z => `<div class="zb"><span>${U.dot(z.color)}${z.code}</span>${U.bar(z.drivers.length / 3 * 100, z.color)}<em>${z.drivers.length} drivers · ${z.orders} live</em></div>`).join('')}</div>` : ''}
                ${a.rule === 'Capacity based' ? `
                  ${U.field('Max concurrent orders per driver', `<div class="slider"><input class="rng" type="range" min="1" max="8" value="${a.capacity}" data-act="asCap"><b>${a.capacity}</b></div>`,
                    'Batching raises throughput and lowers on-time rate. Vans usually carry more than bikes.')}
                  <div class="zonebars">${d.DRIVERS.slice(0, 5).map(x => { const n = d.ORDERS.filter(o => o.driver === x.id && !['Delivered','Cancelled','Returned'].includes(o.status)).length;
                    return `<div class="zb"><span>${U.esc(x.name.split(' ')[0])}</span>${U.bar(n / a.capacity * 100, n >= a.capacity ? d.PAL.tang : d.PAL.lav)}<em>${n} of ${a.capacity}</em></div>`; }).join('')}</div>` : ''}
                ${a.rule === 'Priority based' ? `
                  ${U.field('Order', U.radio(['High first', 'Oldest first', 'Nearest first'], a.priority, 'asPrio'),
                    'Applies inside the queue. High-priority orders still respect the radius and capacity limits.')}` : ''}
              </div>`)}
            ${U.panel('Scheduled orders', `
              ${U.field('Assign a driver', `<div class="slider"><input class="rng" type="range" min="5" max="90" step="5" value="${a.schedMin}" data-act="asSched"><b>${a.schedMin} min before the slot</b></div>`,
                'Too early locks a driver out of on-demand work; too late risks no one being free. 20 minutes suits a bike fleet.')}
              <div class="timeline">
                <span class="tl-b"></span>
                <span class="tl-m" style="left:${100 - a.schedMin / 90 * 100}%">assign</span>
                <span class="tl-e">18:30 slot</span>
              </div>`)}
          </div>
          <div class="stack">
            ${U.panel('Overflow fallback', `
              ${U.field('When nothing fits', U.toggle(a.fallbackNetwork, 'asFallback', '', 'Send to Dash Network as Demand'),
                a.fallbackNetwork ? 'Nothing sits unassigned for more than 5 minutes — Dash routes it to another fleet, a 3PL or a freelancer, and you keep the merchant.' : 'Orders stay in the queue until a dispatcher acts. Nothing leaves your fleet.')}
              ${U.defs([['Demand role', U.tag('Active', '#1f8a4c')], ['Sent this week', '18 orders'], ['Fulfilled by network', '17 of 18']])}
              <div class="btnrow">${U.btn('Network settings', { act: 'go', arg: '/network' })}</div>`)}
            ${U.panel('Rule scope', `
              ${U.field('Restrict by driver group', U.toggle(a.groupScope, 'asGroup', '', 'Match vehicle type to order size'),
                'Bulk orders go to Vans &amp; bulk only. Without it, a bike can be offered an 18 kg order and will decline it.')}`)}
            ${U.panel('What this means right now', `
              <div class="sim">
                ${d.ORDERS.filter(o => o.status === 'Assigning').map(o => {
                  const ok = a.mode === 'Auto' && (a.rule !== 'Geofence based' || d.zone(o.zone).status === 'Active');
                  return `<div class="sim-r ${ok ? 'ok' : 'no'}">
                    <b>${o.id}</b>
                    <span>${ok ? 'Auto-assigns to ' + U.esc(d.DRIVERS.filter(x => x.zone === o.zone && x.online)[0]?.name || 'nearest driver') : a.mode === 'Manual' ? 'Waits for a dispatcher' : 'Zone paused — ' + (a.fallbackNetwork ? 'goes to Dash Network' : 'stays in queue')}</span>
                  </div>`;
                }).join('')}
              </div>
              <div class="fld-h">Live preview against the current queue. Change a rule above and this updates.</div>`)}
          </div>
        </div>`;
    }
  };

  /* ---------------- 09 Driver app settings ---------------- */
  SCREENS['app-settings'] = {
    title: 'Driver app', epic: 'Epic 09',
    render() {
      const d = D(), s = STATE.appSet;
      return U.page('Driver app settings', 'What your drivers can and cannot do in the app',
        U.btn('Save changes', { kind: 'primary', act: 'saveApp' })) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Status updates', `
              ${U.field('Allowed distance to update status', `<div class="slider"><input class="rng" type="range" min="50" max="500" step="25" value="${s.distance}" data-act="apDist"><b>${s.distance} m</b></div>`,
                'A driver cannot mark At pickup or Delivered from further away than this. Tight values catch fraud; loose values help in malls and compounds.')}
              ${U.field('Proof of delivery required', U.toggle(s.podRequired, 'apPod', '', 'Block Delivered without proof'))}
              ${U.field('Cancellation reason required', U.toggle(s.cancelReason, 'apCancel', '', 'Driver must pick a reason'))}
              ${U.field('Order acceptance', U.radio(['Auto accept', 'Manual accept'], s.accept, 'apAccept'),
                s.accept === 'Auto accept' ? 'Assigned orders appear as accepted. Faster, but a driver mid-delivery can be surprised.' : 'The driver has 30 seconds to accept before the order is re-offered.')}`)}
            ${U.panel('Failed deliveries', `
              ${U.field('Allow reattempt', U.toggle(s.reattempt, 'apRe', '', 'Driver can try again'))}
              ${s.reattempt ? U.field('Maximum reattempts', U.radio(['1', '2', '3'], String(s.maxReattempt), 'apMax')) : ''}
              ${U.field('Auto return to merchant', U.toggle(s.autoReturn, 'apReturn', '', 'After the last attempt fails'),
                'DX-40866 followed exactly this path today: one failed attempt, then an automatic return.')}
              ${U.field('Require failure reason', U.toggle(s.failReason, 'apFail', '', 'Reason recorded on the order'))}`)}
            ${U.panel('Tracking link', `
              ${U.field('Enable per order', U.toggle(s.trackEnabled, 'apTrack', '', 'Generate a tracking link'))}
              ${U.field('Share with merchant', U.radio(['Automatically', 'Manually'], s.trackShare, 'apShare'))}
              ${U.field('Link expiry', U.select(['1 hour after delivery', '2 hours after delivery', '24 hours after delivery', 'Never expires'], s.trackExpiry, { act: 'apExpiry' }))}`)}
          </div>
          <div class="stack">
            ${U.panel('Live preview', `
              <div class="phone">
                <div class="ph-top"><span>9:41</span><span>ON JOB</span></div>
                <div class="ph-b">
                  <div class="ph-l">Dash Driver App</div>
                  <div class="ph-t">DX-40918</div>
                  <div class="ph-card">
                    <div class="ph-h"><span>Picked up</span><span>4.1 km</span></div>
                    <div class="ph-r"><i style="background:${d.PAL.peach}"></i><div><b>Almasa — Al Malaz</b><em>Collected 15:36</em></div></div>
                    <div class="ph-r"><i style="background:${d.PAL.vodka}"></i><div><b>Al Malaz, King Abdullah Rd</b><em>ETA 15:58</em></div></div>
                  </div>
                  <div class="ph-note-b">${s.distance <= 150 ? `Within ${s.distance} m of the address to mark delivered` : `Anywhere within ${s.distance} m counts as arrival`}</div>
                  <div class="ph-cta">${s.accept === 'Manual accept' ? 'Accept — 30s' : 'Slide to deliver'}</div>
                  <div class="ph-f"><span>${s.podRequired ? 'Proof required: Photo, OTP' : 'Proof optional'}</span><span>COD SAR 120</span></div>
                  ${s.reattempt ? `<div class="ph-alt">Failed? Reattempt ${s.maxReattempt}× ${s.autoReturn ? '· then auto-return' : ''}</div>` : `<div class="ph-alt">No reattempt — ${s.autoReturn ? 'returns immediately' : 'dispatcher decides'}</div>`}
                </div>
              </div>`)}
            ${U.note('These settings are per account, not per driver.', 'A stricter distance or a required proof applies to every driver in the fleet the next time their app syncs.', d.PAL.lemon)}
          </div>
        </div>`;
    }
  };
})();
