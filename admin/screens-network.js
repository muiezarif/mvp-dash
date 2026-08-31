/* Dash Network module — product 06, configured and monitored inside Dash Admin.
   Master control (01), Join requests (02), Demand (03), Supply (04),
   Participation control (05), States (06), Monitoring (07), Order source (08),
   Routing engine (09), Zones and dispatching (10) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.ADM;
  window.STATE = window.STATE || {};

  const stateColor = s => ({ 'Active':'#1f8a4c', 'Pending':D().PAL.lemon, 'Paused':D().PAL.peach,
    'Suspended':D().PAL.tang, 'Withdrawn':'#9A9A9A', 'Not joined':'#C9C9C9', 'Blocked':D().PAL.tang,
    'Approved':'#1f8a4c', 'Automatic':D().PAL.lav }[s] || '#9A9A9A');

  /* ---------------- 01 · 05 · 06 Master control and participation ---------------- */
  SCREENS['network'] = {
    title: 'Dash Network', epic: 'Network 01 · 05 · 06 · Admin 08',
    render() {
      const d = D(), n = d.NETWORK;
      return U.page('Dash Network', 'The routing engine. Not a dashboard anyone logs into — it is configured here',
        U.btn('Join requests', { act: 'go', arg: '/network-requests' }) + U.btn('Monitor', { act: 'go', arg: '/network-monitor' }) +
        U.btn('Routing engine', { act: 'go', arg: '/routing' })) + `
        ${U.mode('dash', 'Dash Network is a Dash-owned engine, so everything on this page is ours to set. Participants control their own switch; we control theirs, their category, and the whole network.')}
        <div class="master ${n.master ? 'on' : 'off'}">
          <button class="master-s" data-act="netMaster"><i></i></button>
          <div style="flex:1">
            <div class="master-t">${n.master ? 'Dash Network is on' : 'Dash Network is off'}</div>
            <div class="master-w">${n.master
              ? 'Orders that need routing go to the engine. Turning this off does not break anything — every order falls back to direct routing, and merchants deliver through the providers they already chose.'
              : 'The engine is off. All orders are falling back to direct routing: merchants with no provider of their own have nowhere to send work, and 6,262 orders a month lose their safety net.'}</div>
          </div>
          <div style="text-align:right;flex:none">
            <div class="mono" style="font:500 10px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:${n.master ? '#8a8a8a' : '#9A9A9A'}">In the network now</div>
            <div class="master-t" style="font-size:34px">${n.monitor.inNetwork}</div>
          </div>
        </div>
        ${!n.master ? U.note('Fallback is in effect.', 'Nothing is queued or lost — orders simply route direct. Merchants whose only supply was the network will see orders sit unassigned.', d.PAL.tang) : ''}

        ${U.panel('Participation by category', `
          <div class="catgrid">
            ${Object.entries(n.categories).map(([cat, c]) => `
              <div class="cat">
                <div class="cat-h"><div><b>${cat}</b><div class="mono" style="font:500 9.5px ui-monospace,Menlo,monospace;color:#9A9A9A;letter-spacing:.08em;margin-top:2px">${c.role.toUpperCase()}${c.auto ? ' · AUTOMATIC' : ' · BY REQUEST'}</div></div>
                  ${U.toggle(c.on && n.master, 'netCat', cat)}</div>
                <div class="cat-n">${c.count}</div>
                <div class="cat-w">${U.esc(c.note)}</div>
              </div>`).join('')}
          </div>
          <div class="fld-h" style="margin-top:10px">Turning a category off stops every participant in it, whatever their own switch says. Merchants and freelancers join automatically — DMS clients and 3PLs must be approved per role.</div>`,
          { right: `<span class="ph-note">Network 05</span>` })}

        <div class="cols c-1-1">
          ${U.panel('Demand participants — who sends orders in', U.table(
            [{ t: 'Participant' }, { t: 'Category' }, { t: 'Joined' }, { t: 'Sent', num: true }, { t: 'Fulfilment', w: '120px' }, { t: 'State' }, { t: '', w: '150px' }],
            n.demand.map(p => ({ cells: [
              `<b>${U.esc(p.name)}</b>${p.auto ? '<em class="sub">Automatic on verification</em>' : ''}`,
              p.cat, U.esc(p.joined), p.sent.toLocaleString(),
              `${p.fulfilled}% ${U.bar(p.fulfilled, d.PAL.peach)}`,
              U.tag(p.state, stateColor(p.state), { solid: p.state !== 'Active' }),
              `<div class="rowact">${p.state === 'Active'
                ? U.btn('Pause', { act: 'netPause', arg: 'demand|' + p.id }) + U.btn('Suspend', { kind: 'danger', act: 'netSuspend', arg: 'demand|' + p.id })
                : U.btn('Reactivate', { kind: 'primary', act: 'netResume', arg: 'demand|' + p.id })}</div>`] }))),
            { pad: false, right: `<span class="ph-note">Network 03</span>` })}
          ${U.panel('Supply participants — who receives orders', U.table(
            [{ t: 'Participant' }, { t: 'Category' }, { t: 'Received', num: true }, { t: 'Accept', w: '100px' }, { t: 'Complete', w: '100px' }, { t: 'State' }, { t: '', w: '150px' }],
            n.supply.map(p => ({ cells: [
              `<b>${U.esc(p.name)}</b><em class="sub">${p.joined === '—' ? 'Pool — automatic' : 'Joined ' + p.joined}</em>`,
              p.cat, p.received.toLocaleString(),
              p.accept ? `${p.accept}% ${U.bar(p.accept, p.accept >= 75 ? d.PAL.lav : d.PAL.tang)}` : '—',
              p.complete ? `${p.complete}% ${U.bar(p.complete, p.complete >= 90 ? d.PAL.vodka : d.PAL.tang)}` : '—',
              U.tag(p.state, stateColor(p.state), { solid: p.state !== 'Active' }),
              `<div class="rowact">${p.state === 'Active'
                ? U.btn('Pause', { act: 'netPause', arg: 'supply|' + p.id }) + U.btn('Suspend', { kind: 'danger', act: 'netSuspend', arg: 'supply|' + p.id })
                : p.state === 'Pending' ? U.btn('Review', { act: 'go', arg: '/network-requests' })
                : p.state === 'Not joined' ? '<em class="sub">—</em>'
                : U.btn('Reactivate', { kind: 'primary', act: 'netResume', arg: 'supply|' + p.id })}</div>`] }))),
            { pad: false, right: `<span class="ph-note">Network 04</span>` })}
        </div>

        ${U.panel('Participation states', `
          <div class="states">
            ${[['Not joined', 'Never requested this role. Nothing to do.', 'Participant'],
               ['Pending', 'Requested — sitting in the join queue for us to review.', 'Dash decides'],
               ['Active', 'Orders flow in this direction.', 'Both'],
               ['Paused', 'The participant paused themselves. We do not override it.', 'Participant'],
               ['Suspended', 'We paused them, with a reason on the record. They cannot undo it.', 'Dash only'],
               ['Withdrawn', 'They left the role. Rejoining means a fresh request.', 'Participant']].map(([s, why, who]) =>
              `<div class="st"><b>${U.tag(s, stateColor(s), { solid: s !== 'Active' })} <span style="font-weight:400;color:#6B6B6B;font-size:11.5px;margin-left:6px">${who}</span></b><em>${why}</em></div>`).join('')}
          </div>`, { pad: false, right: `<span class="ph-note">Network 06</span>` })}

        ${U.panel('Order source — a first-class attribute', `
          <div class="zonebars">${d.PLATFORM.bySource.map(s => `
            <div class="zb"><span>${U.tag(s.s, s.s === 'Dash Network' ? d.PAL.vodka : s.s === 'Marketplace' ? d.PAL.lav : d.PAL.peach)}</span>
              ${U.bar(s.share, s.s === 'Dash Network' ? d.PAL.vodka : s.s === 'Marketplace' ? d.PAL.lav : d.PAL.peach)}
              <em>${s.orders.toLocaleString()} · ${s.share}%</em></div>`).join('')}</div>
          <div style="margin-top:12px">${U.defs([
            ['Set', 'At creation, never changed afterwards'],
            ['Visible in', 'Dash Merchant, Dash DMS and Dash 3PL — filterable in all three'],
            ['Drives reconciliation', 'Direct and Marketplace bill merchant to provider. Network bills through Dash, and Dash takes a margin.'],
            ['Which is why', 'It also decides who may intervene in the global control tower.']
          ])}</div>`, { right: `<span class="ph-note">Network 08</span>` })}`;
    }
  };

  /* ---------------- 02 Join requests ---------------- */
  SCREENS['network-requests'] = {
    title: 'Join requests', epic: 'Network 02',
    render() {
      const d = D(), n = d.NETWORK;
      STATE.rf = STATE.rf || { type: 'All types', role: 'All roles' };
      const f = STATE.rf;
      const rows = n.requests.filter(r =>
        (f.type === 'All types' || r.type === f.type) &&
        (f.role === 'All roles' || r.role === f.role));
      const pending = n.requests.filter(r => ['Pending','Blocked'].includes(r.state));
      return U.page('Network join requests', 'Each role is its own request — approving Supply says nothing about Demand',
        U.btn('Back to Network', { act: 'go', arg: '/network' })) + `
        <div class="kpis k-4">
          ${U.kpi('Awaiting review', pending.length, 'Oldest 4 days', d.PAL.lemon)}
          ${U.kpi('Blocked', n.requests.filter(r => r.state === 'Blocked').length, 'Verification not cleared', d.PAL.tang)}
          ${U.kpi('Approved this month', 6, '2 rejected', '#1f8a4c')}
          ${U.kpi('Automatic', n.requests.filter(r => r.state === 'Automatic').length, 'Merchants and freelancers', d.PAL.lav)}
        </div>
        ${U.filters([
          `<span class="f-l">Participant type</span>` + U.select(['All types', 'DMS', '3PL', 'Merchant'], f.type, { act: 'rfF', arg: 'type' }),
          `<span class="f-l">Role requested</span>` + U.select(['All roles', 'Supply', 'Demand'], f.role, { act: 'rfF', arg: 'role' }),
          `<span class="f-sp"></span><span class="f-c">${rows.length} of ${n.requests.length}</span>`
        ])}
        <div class="cols c-2-1">
          <div class="stack">
            ${rows.map(r => `
              <div class="req">
                <div class="req-h">
                  <span class="av lg">${U.esc(r.who.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span>
                  <div style="flex:1;min-width:0"><b>${U.esc(r.who)}</b>
                    <div class="mono" style="font:500 10px ui-monospace,Menlo,monospace;color:#9A9A9A;letter-spacing:.06em">${r.type} · requested ${U.esc(r.when)} · ${U.esc(r.assignee)}</div></div>
                  ${U.tag(r.role, r.role === 'Supply' ? d.PAL.lav : d.PAL.peach, { solid: true })}
                  ${U.tag(r.state, stateColor(r.state), { solid: r.state !== 'Approved' })}
                </div>
                <div class="req-b">${U.defs([
                  ['Coverage claimed', U.esc(r.coverage)],
                  ['Capacity', U.esc(r.capacity)],
                  ['Performance history on Dash', U.esc(r.history)],
                  ['Note', U.esc(r.note)]
                ])}</div>
                <div class="req-a">
                  ${r.state === 'Pending'
                    ? U.btn('Approve ' + r.role, { kind: 'primary', act: 'approveReq', arg: r.id }) + U.btn('Reject with reason', { act: 'rejectReq', arg: r.id })
                    : r.state === 'Blocked'
                      ? U.btn('Open verification', { kind: 'primary', act: 'go', arg: '/verification' }) + `<span class="fld-h" style="margin:0;align-self:center">Cannot approve a role before verification clears</span>`
                      : r.state === 'Approved'
                        ? U.btn('Revoke this role', { kind: 'danger', act: 'revokeRole', arg: r.id })
                        : `<span class="fld-h" style="margin:0">Merchants receive Demand on verification — there is nothing to approve.</span>`}
                  ${U.btn('Client profile', { act: 'clientByName', arg: r.who })}
                </div>
              </div>`).join('') || '<div class="empty">No requests match those filters.</div>'}
          </div>
          <div class="stack">
            ${U.panel('What we look at', `<div class="steps">
              ${[['Verification', 'Must be cleared first. A blocked verification blocks the role.'],
                 ['Coverage', 'Do the zones they claim actually have demand we cannot serve?'],
                 ['Capacity', 'Enough drivers to matter, and the right vehicle types.'],
                 ['History on Dash', 'For an existing client, their real acceptance and completion rates. For a new one, nothing — and that is the risk.'],
                 ['One role at a time', 'A strong Supply record makes a later Demand request easy. It never grants it automatically.']].map(([t, s], i) =>
                `<div class="stp done"><span class="stp-n">${i + 1}</span><div><b>${t}</b><em>${s}</em></div></div>`).join('')}
            </div>`, { pad: false })}
            ${U.panel('Approval history', U.table(
              [{ t: 'Participant' }, { t: 'Role' }, { t: 'Outcome' }, { t: 'By' }],
              [['Rehla Fleet', 'Demand', 'Approved', 'Dana'], ['Rehla Fleet', 'Supply', 'Approved', 'Khalid'],
               ['Sahel Logistics', 'Supply', 'Approved', 'Khalid'], ['Sahel Logistics', 'Demand', 'Approved', 'Dana'],
               ['Nuqta Express', 'Supply', 'Suspended', 'Dana'], ['Hzbr Logistics', 'Supply', 'Rejected', 'Khalid']]
                .map(([w, r, o, b]) => ({ cells: [U.esc(w), U.tag(r, r === 'Supply' ? d.PAL.lav : d.PAL.peach),
                  U.tag(o, o === 'Approved' ? '#1f8a4c' : d.PAL.tang, { solid: o !== 'Approved' }), b] }))), { pad: false })}
          </div>
        </div>`;
    }
  };

  /* ---------------- 07 Monitoring ---------------- */
  SCREENS['network-monitor'] = {
    title: 'Network monitor', epic: 'Network 07',
    render() {
      const d = D(), n = d.NETWORK, m = n.monitor;
      const activeSupply = n.supply.filter(s => s.state === 'Active');
      const activeDemand = n.demand.filter(s => s.state === 'Active');
      const crit = m.zones.filter(z => z.state !== 'Healthy');
      return U.page('Network monitoring', 'Is there enough supply where the demand is, right now',
        U.btn('Control tower', { act: 'go', arg: '/control-tower' }) + U.btn('Back to Network', { act: 'go', arg: '/network' })) + `
        <div class="kpis k-4">
          ${U.kpi('Orders in the network', m.inNetwork, 'Being routed or in flight', d.PAL.vodka)}
          ${U.kpi('Stuck', m.stuck, 'No movement past threshold', d.PAL.tang)}
          ${U.kpi('Unfulfilled', m.unfulfilled, 'Nobody took it — returned to sender', d.PAL.tang)}
          ${U.kpi('Active supply nodes', activeSupply.length + ' / ' + n.supply.length, activeDemand.length + ' demand participants', d.PAL.lav)}
        </div>
        ${crit.length ? U.note(crit.filter(z => z.state === 'Critical').length + ' zone critical, ' + crit.filter(z => z.state !== 'Critical').length + ' short.',
          crit.map(z => `<b>${U.esc(z.z.split(' — ')[0])}</b> ${z.demand} demand against ${z.supply} supply`).join(' · ')
          + '. Zone West has no depot from any active node — the honest fix is an incentive, not more routing. '
          + U.btn('Draft an announcement', { kind: 'primary', act: 'go', arg: '/announcements' }), d.PAL.tang) : ''}
        <div class="cols c-2-1">
          ${U.panel('Supply and demand balance by zone', `
            <div style="padding:2px 0">${m.zones.map(z => `
              <div class="bal">
                <span><b>${U.esc(z.z.split(' — ')[0])}</b><em class="sub">${U.esc(z.z.split(' — ')[1] || '')}</em></span>
                <span class="bal-t">
                  <i class="bal-d" style="width:${z.demand / 45 * 100}%"></i>
                  <i class="bal-s" style="width:${z.supply / 45 * 100}%"></i>
                </span>
                <span class="bal-n">${U.tag(z.state, z.state === 'Healthy' ? '#1f8a4c' : z.state === 'Critical' ? d.PAL.tang : d.PAL.peach, { solid: z.state !== 'Healthy' })}</span>
              </div>`).join('')}</div>
            <div class="legend">${U.dot(d.PAL.peach)}Demand — orders wanting a provider ${U.dot(d.PAL.lav)}Supply — capacity available</div>
            <div class="fld-h">Bars are drawn on the same scale, so a wider peach bar than blue means unmet demand in that zone.</div>`)}
          ${U.panel('Active counts by category', `
            <div class="catgrid" style="grid-template-columns:1fr 1fr">
              ${Object.entries(n.categories).map(([cat, c]) => `
                <div class="cat"><div class="cat-h"><b>${cat}</b>${U.tag(c.role, c.role === 'Supply' ? d.PAL.lav : c.role === 'Demand' ? d.PAL.peach : d.PAL.vodka)}</div>
                  <div class="cat-n">${c.on ? c.count : 0}</div>
                  <div class="cat-w">${c.on ? 'Participating' : 'Category switched off'}</div></div>`).join('')}
            </div>`, { pad: false })}
        </div>
        ${U.panel('Stuck and unfulfilled orders', U.table(
          [{ t: 'Order' }, { t: 'Client' }, { t: 'Source' }, { t: 'Provider' }, { t: 'Zone' }, { t: 'Stuck', num: true }, { t: 'Last event' }, { t: 'Scope' }, { t: '', w: '190px' }],
          d.ORDERS.filter(o => o.stuck > 0).map(o => ({ cells: [
            `<b>${o.id}</b>`, U.esc(o.merchant), U.tag(o.source === 'Network' ? 'Dash Network' : o.source, o.source === 'Network' ? d.PAL.vodka : d.PAL.lav),
            o.provider === '—' ? '<em class="warn">None</em>' : U.esc(o.provider), o.zone,
            `<b class="warn">${o.stuck}m</b>`, U.esc(o.log[o.log.length - 1].e), U.scope(o.scope),
            `<div class="rowact">${U.btn('Open', { act: 'go', arg: '/control-tower/' + o.id })}${
              o.scope === 'dash' ? U.btn('Reassign', { kind: 'primary', act: 'reassign', arg: o.id }) : U.btn('Escalate', { act: 'escalateOwner', arg: o.id })}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 09 · 10 Routing engine, zones ---------------- */
  SCREENS['routing'] = {
    title: 'Routing engine', epic: 'Network 09 · 10',
    render() {
      const d = D(), r = d.NETWORK.routing;
      return U.page('Routing engine', 'What decides which supply node receives which order',
        U.btn('Save changes', { kind: 'primary', act: 'saveRouting' }) + U.btn('Back to Network', { act: 'go', arg: '/network' })) + `
        ${U.mode('dash', 'The engine is Dash infrastructure. Participants can only accept or decline what it offers them.')}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Modes', `
              <div class="modegrid">
                <button type="button" class="mode ${r.mode === 'Direct' ? 'on' : ''}" data-act="rtMode" data-arg="Direct">
                  <b>Direct</b><em>The merchant picked a specific 3PL. Honour it — the engine does not second-guess a commercial choice.</em></button>
                <button type="button" class="mode ${r.mode === 'Auto' ? 'on' : ''}" data-act="rtMode" data-arg="Auto">
                  <b>Auto</b><em>No provider named. The engine selects the best available supply on coverage, capability and performance.</em></button>
              </div>
              <div class="fld-h" style="margin-top:10px">Both modes coexist per order — this switch sets what happens when a merchant has expressed no preference.</div>
              ${U.field('Honour a named provider even when they are slower', U.toggle(r.directHonoured, 'rtDirect', '', 'Always respect a direct choice'),
                r.directHonoured ? 'A merchant who names Sahel gets Sahel, even when Rehla would be faster. Their contract, their call.' : 'The engine may override a named provider when performance is poor — this breaks the merchant’s expectation and should stay off.')}`)}
            ${U.panel('How Auto picks a node', `<div class="steps">
              ${r.steps.map((s, i) => `<div class="stp done"><span class="stp-n">${i + 1}</span><div><b>${U.esc(s.split(' — ')[0])}</b><em>${U.esc(s.split(' — ')[1] || '')}</em></div></div>`).join('')}
            </div>`, { pad: false })}
            ${U.panel('Order types', `
              <div class="cols c-1-1" style="gap:0">
                ${U.defs([['On demand', 'Routed the moment it arrives'], ['Why', 'Nothing is gained by waiting — the nearest free node wins']])}
                ${U.defs([['Scheduled', 'Routed close to the delivery time'], ['Why', 'Locking a node hours early costs it on-demand work and helps nobody']])}
              </div>
              ${U.field('Route a scheduled order', `<div class="slider"><input class="rng" type="range" min="5" max="90" step="5" value="${r.schedLead}" data-act="rtSched"><b>${r.schedLead} min before the slot</b></div>`,
                'Too early and supply sits idle; too late and nobody is free. 20 minutes suits a bike-heavy network.')}
              <div class="timeline">
                <span class="tl-b"></span>
                <span class="tl-m" style="left:${100 - r.schedLead / 90 * 100}%">route</span>
                <span class="tl-e">delivery slot</span>
              </div>`)}
            ${U.panel('Zones and dispatching', `
              ${U.defs([
                ['Zone definition', 'Platform level — drawn once, used by every product'],
                ['Used for', 'Supply matching, coverage claims on Marketplace listings, and zone reporting'],
                ['Client zones', 'A DMS client draws its own operational zones inside Dash DMS. Those are theirs; these are the platform’s.'],
                ['Dispatching rules', 'Which node is offered first inside a zone, and the decline window']
              ])}
              ${U.note('Scope defined, internals pending.', 'Routing internals and platform zone geometry are specified in a dedicated session. What is settled: the inputs above, the fall-through order, and that nothing dead-ends.', d.PAL.lemon)}`,
              { right: `<span class="ph-note">Network 10</span>` })}
          </div>
          <div class="stack">
            ${U.panel('Live routing trace', `<div class="log">
              ${[['15:48', 'DX-41102 · Auto', 'Coverage filter → 9 nodes'],
                 ['15:48', '', 'Capability filter → 5 nodes (bike, cash free)'],
                 ['15:48', '', 'Ranked on Zone South performance'],
                 ['15:48', '', 'Offered to freelancer pool · 5 drivers within 3 km'],
                 ['15:49', '', 'Accepted by Rakan Al Zahrani'],
                 ['15:46', 'DX-41094 · Auto', 'Offered to Sahel Logistics · decline window 4 min'],
                 ['15:44', 'DX-41074 · Direct', 'Merchant named Rehla Fleet — honoured'],
                 ['15:44', '', 'Rehla declined — no driver in radius'],
                 ['15:46', '', 'Fell through to Auto · 6 candidates']].map(([t, e, s]) =>
                `<div class="lg"><span class="lg-t">${t}</span><span class="lg-e">${e ? `<b>${e}</b>` : ''}<em>${s}</em></span></div>`).join('')}
            </div>`, { pad: false })}
            ${U.panel('Fall-through guarantee', `
              <div class="chain">
                <span class="ch">Named provider</span><span class="ch-a">→</span>
                <span class="ch">Ranked nodes</span><span class="ch-a">→</span>
                <span class="ch safe">Back to sender, notified</span>
              </div>
              ${U.note('No silent dead ends.', 'If every node declines, the order returns to whoever sent it with a reason. DX-40940 followed exactly this path today — four declines, then back to Sahel.', d.PAL.lemon)}`)}
            ${U.panel('Engine health', U.defs([
              ['Routed today', '1,842'],
              ['Avg time to a node', '1.4 min'],
              ['First-offer acceptance', '68%'],
              ['Fell through to sender', '0.4%'],
              ['Decline window', '4 min for 3PLs · 20 s for freelancers']
            ]))}
          </div>
        </div>`;
    }
  };
})();
