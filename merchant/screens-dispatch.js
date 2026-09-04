/* Dash Merchant — Dispatch configuration (10), 3PL Marketplace (11), Integrations (12), Public profile (04) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.MER;
  window.STATE = window.STATE || {};

  /* ---------------- 10 Dispatch configuration ---------------- */
  SCREENS['dispatch'] = {
    title: 'Dispatch', epic: 'Epic 10',
    render() {
      const d = D(), s = d.DISPATCH;
      const modes = ['Dash Network only', 'Specific 3PL', 'Manual assignment', 'Pool of connected 3PLs'];
      const needsFallback = s.mode !== 'Dash Network only';
      const fbOptions = ['Fall back to Dash Network', 'Fall back to next in pool', 'Fail back to me'];
      const connected = d.PROVIDERS.filter(p => p.status === 'Connected');

      const sim = o => {
        if (s.mode === 'Dash Network only') return { ok: true, t: 'Dash Network routes it — nothing for you to decide' };
        if (s.mode === 'Manual assignment') return { ok: false, t: 'Waits in the control tower until someone assigns it' };
        if (s.mode === 'Specific 3PL') return { ok: true, t: s.specific + ' gets it; if they decline — ' + s.fallback.toLowerCase() };
        const first = d.prov(s.poolOrder[0]);
        return { ok: true, t: (s.poolBehaviour === 'Let Dash optimise' ? 'Dash picks the best of your ' + s.poolOrder.length + ' providers' : first.name + ' first, then ' + s.poolOrder.slice(1).map(x => d.prov(x).name).join(', ')) };
      };

      return U.page('Dispatch configuration', 'Merchant wide by default — and a branch can carry its own rule where its neighbourhood needs one',
        U.btn('Save changes', { kind: 'primary', act: 'saveDispatch' })) + `
        ${U.note('Default on signup is Dash Network only.', 'Zero configuration: Dash finds a fleet, a 3PL or a freelancer for every order. Everything below is an opt-in for merchants who want to steer it. The rules on this page apply to all four branches unless a branch overrides them.', d.PAL.vodka)}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Mode', `
              <div class="modegrid">
                ${modes.map(m => `<button type="button" class="mode ${s.mode === m ? 'on' : ''}" data-act="dsMode" data-arg="${m}">
                  <b>${m}</b><em>${{
                    'Dash Network only':'Dash routes everything. No providers to manage.',
                    'Specific 3PL':'One provider takes all your orders.',
                    'Manual assignment':'You choose a provider on every single order.',
                    'Pool of connected 3PLs':'Several providers, tried in an order you control. May include Dash Network.'
                  }[m]}</em></button>`).join('')}
              </div>`)}

            ${s.mode === 'Specific 3PL' ? U.panel('Which provider', `
              ${U.field('Provider', U.select(connected.map(p => p.name), s.specific, { act: 'dsSpecific' }),
                'Everything goes here first. ' + U.esc(s.specific) + ' covers ' + U.esc((connected.find(p => p.name === s.specific) || connected[0]).zones) + '.')}
              ${U.note('One provider is a single point of failure.', 'On a busy Thursday ' + U.esc(s.specific) + ' declined 12% of offers. Your fallback is what saves those orders.', d.PAL.peach)}`) : ''}

            ${s.mode === 'Pool of connected 3PLs' ? U.panel('Your pool', `
              ${U.field('Pool behaviour', U.radio(['Priority order I set', 'Let Dash optimise'], s.poolBehaviour, 'dsBehaviour'),
                s.poolBehaviour === 'Let Dash optimise' ? 'Dash picks per order on coverage, acceptance and pickup speed — usually faster, less predictable cost.' : 'Tried strictly top to bottom. Predictable, but a slow first choice slows everything.')}
              <div class="pool">
                ${s.poolOrder.map((pid, i) => { const p = d.prov(pid);
                  return `<div class="pl ${s.poolBehaviour === 'Let Dash optimise' ? 'flat' : ''}">
                    <span class="pl-n">${s.poolBehaviour === 'Let Dash optimise' ? '·' : i + 1}</span>
                    <span class="av">${p.logo}</span>
                    <div class="pl-b"><b>${U.esc(p.name)}</b><em>${U.esc(p.zones)} · on time ${p.onTime}% · accepts ${p.accept}% · pickup ${p.avgPickup}m · ${U.esc(p.price)}</em></div>
                    <div class="pl-a">
                      ${s.poolBehaviour === 'Priority order I set' ? U.btn('↑', { act: 'dsUp', arg: pid }) + U.btn('↓', { act: 'dsDown', arg: pid }) : ''}
                      ${U.btn('Remove', { act: 'dsRemove', arg: pid })}
                    </div></div>`; }).join('')}
              </div>
              ${connected.filter(p => s.poolOrder.indexOf(p.id) < 0).length ? `
                <div class="sub-h">Connected but not in the pool</div>
                <div class="pool">${connected.filter(p => s.poolOrder.indexOf(p.id) < 0).map(p => `
                  <div class="pl flat"><span class="pl-n">·</span><span class="av">${p.logo}</span>
                    <div class="pl-b"><b>${U.esc(p.name)}</b><em>${U.esc(p.zones)} · ${U.esc(p.price)}</em></div>
                    <div class="pl-a">${U.btn('Add to pool', { kind: 'primary', act: 'dsAdd', arg: p.id })}</div></div>`).join('')}</div>` : ''}
              <div class="btnrow">${U.btn('Find more providers', { act: 'go', arg: '/marketplace' })}</div>`) : ''}

            ${s.mode === 'Manual assignment' ? U.panel('Manual assignment', `
              ${U.note('Every order waits for a human.', 'Nothing dispatches on its own. Your control tower queue becomes the bottleneck — sensible for low volume or high-value goods, painful at 90 orders a day.', d.PAL.tang)}
              ${U.defs([['Who can assign', 'Admin and Operations roles'], ['Where', 'Control tower and the order page'], ['Reminder', 'Alert after 5 minutes unassigned']])}`) : ''}

            ${U.panel('Fallback' + (needsFallback ? '' : ' — not needed'), needsFallback ? `
              ${U.field('When nobody takes the order', U.radio(fbOptions, s.fallback, 'dsFallback'), {
                'Fall back to Dash Network':'The safety net. Dash finds anyone available — another fleet, a 3PL or a freelancer.',
                'Fall back to next in pool':'Keeps it inside your chosen providers. If they all decline, it comes back to you.',
                'Fail back to me':'The order returns to your control tower and waits. Nothing moves until you act.'
              }[s.fallback])}
              ${U.field('Trigger after', `<div class="slider"><input class="rng" type="range" min="1" max="15" value="${s.fallbackAfter}" data-act="dsAfter"><b>${s.fallbackAfter} min</b></div>`,
                'Short is safer for food; longer gives your preferred provider a real chance.')}
              <div class="chain">
                <span class="ch">${s.mode === 'Specific 3PL' ? U.esc(s.specific) : U.esc(d.prov(s.poolOrder[0] || 'p0').name)}</span>
                <span class="ch-a">→</span>
                ${s.fallback === 'Fall back to next in pool' && s.poolOrder.length > 1
                  ? s.poolOrder.slice(1).map(p => `<span class="ch">${U.esc(d.prov(p).name)}</span><span class="ch-a">→</span>`).join('')
                  : ''}
                <span class="ch ${s.fallback === 'Fail back to me' ? 'end' : 'safe'}">${s.fallback === 'Fall back to Dash Network' ? 'Dash Network' : s.fallback === 'Fail back to me' ? 'Back to you' : 'Back to you'}</span>
              </div>
              ${U.note('No silent dead ends.', 'Whatever you pick, an order can never quietly stop moving — the last step in that chain always notifies you.', d.PAL.lemon)}`
              : U.note('Dash Network is the fallback.', 'With Network-only dispatch there is nothing to fall back from — Dash keeps trying until someone takes it.', d.PAL.vodka))}

            ${U.panel('Per branch', `
              ${U.note('Global first, branch second.', 'Every branch starts on the rules above. Give a branch its own rule only where the neighbourhood, the hours or the price make the merchant-wide rule wrong — two of four here do.', d.PAL.lav)}
              ${U.table(
                [{ t: 'Branch' }, { t: 'District' }, { t: 'Rule in force' }, { t: 'If nobody takes it' }, { t: 'Set by' }, { t: '', w: '210px' }],
                d.BRANCHES.map(b => { const r = d.dispatchFor(b.id); return { cells: [
                  '<b>' + U.esc(b.name) + '</b><em class="sub"> ' + b.code + '</em>', U.esc(b.district),
                  r.own
                    ? U.tag('Branch rule', d.PAL.lemon, { solid: true }) + ' ' + U.select(modes, r.mode, { act: 'dsBranchMode', arg: b.id }) +
                      (r.mode === 'Specific 3PL' ? ' ' + U.select(connected.map(p => p.name), r.specific, { act: 'dsBranchProv', arg: b.id }) : '') +
                      (r.why ? '<em class="sub">' + U.esc(r.why) + '</em>' : '')
                    : '<em class="sub">Follows the merchant default — ' + U.esc(s.mode.toLowerCase()) + '</em>',
                  r.mode === 'Dash Network only' ? '<em class="sub">Dash keeps trying</em>'
                    : U.esc(r.fallback.toLowerCase()) + '<em class="sub"> after ' + r.fallbackAfter + ' min</em>',
                  '<em class="sub">' + U.esc(r.own ? r.by : 'Merchant default') + '</em>',
                  '<div class="rowact">' + (r.own
                    ? U.btn('Reset to default', { act: 'dsBranchReset', arg: b.id })
                    : U.btn('Give it its own rule', { act: 'dsBranchAdd', arg: b.id })) + '</div>'
                ] }; }))}`, { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('What happens to today’s orders', `<div class="sim">
              ${(() => { const seen = {}; return d.ORDERS.filter(o => ['Awaiting provider','Assigned'].includes(o.status)).concat(d.ORDERS)
                .filter(o => seen[o.id] ? false : (seen[o.id] = true)).slice(0, 4).map(o => {
                const r = sim(o);
                return `<div class="sim-r ${r.ok ? 'ok' : 'no'}"><b>${o.id}</b><span>${U.esc(r.t)}</span></div>`; }).join(''); })()}
            </div><div class="fld-h">Live preview against your current orders. Change a rule and this updates.</div>`)}
            ${U.panel('Current rule, in one line', `
              <div class="rulesum">${U.esc(s.mode)}${s.mode === 'Specific 3PL' ? ' — ' + U.esc(s.specific) : ''}${s.mode === 'Pool of connected 3PLs' ? ' — ' + s.poolOrder.length + ' providers, ' + U.esc(s.poolBehaviour.toLowerCase()) : ''}${needsFallback ? ', then ' + U.esc(s.fallback.toLowerCase()) + ' after ' + s.fallbackAfter + ' min' : ''}.</div>`)}
            ${U.panel('Effect this week', U.defs([
              ['Orders dispatched', '1,396'],
              ['First choice took it', '1,142 · 82%'],
              ['Fallback engaged', '198 · 14%'],
              ['Came back to you', '56 · 4%'],
              ['Avg time to a provider', '1.4 min']
            ]))}
          </div>
        </div>`;
    }
  };

  /* ---------------- 11 3PL Marketplace ---------------- */
  SCREENS['marketplace'] = {
    title: '3PL Marketplace', epic: 'Epic 11',
    render() {
      const d = D();
      STATE.mf = STATE.mf || { cov: 'All coverage', svc: 'All services', veh: 'All vehicles', q: '' };
      const f = STATE.mf;
      const rows = d.PROVIDERS.filter(p =>
        (f.cov === 'All coverage' || p.zones.includes(f.cov.split(' ')[0]) || p.zones.startsWith('All')) &&
        (f.svc === 'All services' || p.caps.includes(f.svc)) &&
        (f.veh === 'All vehicles' || p.vehicles.toLowerCase().includes(f.veh.toLowerCase().replace(/s$/, ''))) &&
        (!f.q || p.name.toLowerCase().includes(f.q.toLowerCase())));
      const connected = d.PROVIDERS.filter(p => p.status === 'Connected');
      const requested = d.PROVIDERS.filter(p => p.status === 'Requested');

      return U.page('3PL Marketplace', 'Browse delivery companies, ask to connect, and manage who you already work with',
        U.btn('Dispatch rules', { act: 'go', arg: '/dispatch' })) + `
        <div class="kpis k-4">
          ${U.kpi('Connected', connected.length, 'Available to your dispatch rules', d.PAL.vodka)}
          ${U.kpi('Requests pending', requested.length, 'Waiting for the provider to approve', d.PAL.lemon)}
          ${U.kpi('In your pool', d.DISPATCH.poolOrder.length, 'Actually receiving orders', d.PAL.lav)}
          ${U.kpi('Listings available', d.PROVIDERS.filter(p => p.status === 'Available').length, 'Vetted by Dash', d.PAL.flax)}
        </div>
        ${requested.length ? U.note('Waiting on ' + U.esc(requested[0].name) + '.',
          'A connection is mutual — you ask, they approve, then you agree pricing. ' + U.btn('Cancel request', { act: 'cancelRequest', arg: requested[0].id }), d.PAL.lemon) : ''}
        ${U.filters([
          U.input(f.q, 'Search providers…', { act: 'mfQ' }),
          `<span class="f-l">Coverage</span>` + U.select(['All coverage', 'RYD-N', 'RYD-C', 'RYD-E', 'RYD-S', 'RYD-W'], f.cov, { act: 'mfF', arg: 'cov' }),
          `<span class="f-l">Service</span>` + U.select(['All services', 'Same day', 'Scheduled', 'Chilled', 'Cash on delivery', 'Bulk', 'Returns'], f.svc, { act: 'mfF', arg: 'svc' }),
          `<span class="f-l">Vehicle</span>` + U.select(['All vehicles', 'Bikes', 'Cars', 'Vans', 'Refrigerated'], f.veh, { act: 'mfF', arg: 'veh' }),
          `<span class="f-sp"></span><span class="f-c">${rows.length} of ${d.PROVIDERS.length}</span>`
        ])}
        <div class="cols c-3">
          ${rows.map(p => `
            <section class="panel provcard">
              <div class="pc-h">
                <span class="av lg">${p.logo}</span>
                <div><b>${U.esc(p.name)}</b><em>${p.kind} · ${U.esc(p.zones)}</em></div>
                ${U.tag(p.status, p.status === 'Connected' ? '#1f8a4c' : p.status === 'Requested' ? d.PAL.lemon : d.PAL.lav, { solid: p.status !== 'Connected' })}
              </div>
              <div class="pc-m">
                <div><em>On time</em><b>${p.onTime}%</b>${U.bar(p.onTime, d.PAL.vodka)}</div>
                <div><em>Accepts</em><b>${p.accept}%</b>${U.bar(p.accept, d.PAL.lav)}</div>
                <div><em>Pickup</em><b>${p.avgPickup}m</b>${U.bar(100 - p.avgPickup * 4, d.PAL.peach)}</div>
              </div>
              <div class="pc-c">${p.caps.map(c => U.tag(c, '#E3E3E3', { solid: true })).join(' ')}</div>
              <div class="pc-p">${U.esc(p.price)}<em class="sub">${U.esc(p.vehicles)}</em></div>
              <div class="pc-n">${U.esc(p.note)}</div>
              <div class="pc-a">
                ${U.btn('View profile', { act: 'go', arg: '/marketplace/' + p.id })}
                ${p.status === 'Available' ? U.btn('Request to connect', { kind: 'primary', act: 'requestProvider', arg: p.id })
                  : p.status === 'Requested' ? U.btn('Cancel request', { act: 'cancelRequest', arg: p.id })
                  : p.id === 'p0' ? U.btn('Always available', { act: 'stub', arg: 'Dash Network cannot be disconnected — it is the fallback' })
                  : U.btn('Disconnect', { kind: 'danger', act: 'disconnectProvider', arg: p.id })}
              </div>
            </section>`).join('')}
        </div>
        ${U.panel('My connected providers', U.table(
          [{ t: 'Provider' }, { t: 'Kind' }, { t: 'Coverage' }, { t: 'Connected since' }, { t: 'Pricing' }, { t: 'On time', w: '120px' }, { t: 'In pool' }, { t: '', w: '190px' }],
          connected.map(p => ({ cells: [
            `<b>${U.esc(p.name)}</b>`, p.kind, U.esc(p.zones), U.esc(p.since), U.esc(p.price),
            `${p.onTime}% ${U.bar(p.onTime, d.PAL.vodka)}`,
            d.DISPATCH.poolOrder.indexOf(p.id) >= 0 ? U.tag('Position ' + (d.DISPATCH.poolOrder.indexOf(p.id) + 1), d.PAL.lemon, { solid: true }) : '<em class="sub">Not in pool</em>',
            `<div class="rowact">${U.btn('Profile', { act: 'go', arg: '/marketplace/' + p.id })}${p.id !== 'p0' ? U.btn('Disconnect', { kind: 'danger', act: 'disconnectProvider', arg: p.id }) : ''}</div>`] }))), { pad: false })}`;
    }
  };

  SCREENS['provider'] = {
    title: 'Provider', epic: 'Epic 11',
    render(id) {
      const d = D(), p = d.prov(id);
      if (!p) return U.page('Provider not found', '');
      const orders = d.ORDERS.filter(o => o.provider === p.id);
      return U.page(p.name, `${p.kind} · ${p.zones} · ${p.vehicles}`,
        (p.status === 'Available' ? U.btn('Request to connect', { kind: 'primary', act: 'requestProvider', arg: p.id })
          : p.status === 'Requested' ? U.btn('Cancel request', { act: 'cancelRequest', arg: p.id })
          : p.id === 'p0' ? '' : U.btn('Disconnect', { kind: 'danger', act: 'disconnectProvider', arg: p.id })) +
        U.btn('Back to marketplace', { act: 'go', arg: '/marketplace' })) + `
        <div class="kpis k-4">
          ${U.kpi('On time', p.onTime + '%', 'Measured by Dash on delivered orders', d.PAL.vodka)}
          ${U.kpi('Acceptance', p.accept + '%', 'How often they take an offer', d.PAL.lav)}
          ${U.kpi('Avg pickup', p.avgPickup + '<span class="of">min</span>', 'From offer to collection', d.PAL.peach)}
          ${U.kpi('Your orders', orders.length ? orders.length : 0, p.status === 'Connected' ? 'This dataset' : 'Not connected yet', d.PAL.flax)}
        </div>
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Profile', U.defs([
              ['Company', U.esc(p.name)], ['Kind', p.kind], ['Coverage areas', U.esc(p.zones)],
              ['Vehicle types', U.esc(p.vehicles)],
              ['Service capabilities', p.caps.map(c => U.tag(c, d.PAL.flax)).join(' ')],
              ['Indicative pricing', U.esc(p.price)],
              ['Status', U.tag(p.status, p.status === 'Connected' ? '#1f8a4c' : p.status === 'Requested' ? d.PAL.lemon : d.PAL.lav, { solid: p.status !== 'Connected' })],
              ['Connected since', p.since === '—' ? '<em class="sub">Not connected</em>' : U.esc(p.since)],
              ['About', U.esc(p.note)]
            ]))}
            ${orders.length ? U.panel('Orders they handled', U.table(
              [{ t: 'Order' }, { t: 'Branch' }, { t: 'Driver' }, { t: 'Status' }, { t: 'Charge', num: true }],
              orders.map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
                `<b>${o.id}</b>`, d.branch(o.branch).code, o.driver ? U.esc(o.driver) : '—',
                U.statusTag(o.status), o.charge ? U.money(o.charge) : '—'] }))), { pad: false }) : ''}
          </div>
          <div class="stack">
            ${p.status === 'Available' ? U.panel('How connecting works', `<div class="steps">
              ${[['You request', 'They see your public profile — volume, branches, coverage'],
                 ['They approve', 'Or decline with a reason. Nothing is automatic'],
                 ['You agree pricing', 'A contract between the two of you, not with Dash'],
                 ['Add to your pool', 'Only then do they start receiving your orders']].map(([t, s], i) =>
                `<div class="stp"><span class="stp-n">${i + 1}</span><div><b>${t}</b><em>${s}</em></div></div>`).join('')}
            </div>`, { pad: false }) : ''}
            ${p.status === 'Connected' && p.id !== 'p0' ? U.panel('Pricing contract', `
              ${U.defs([['Agreed pricing', U.esc(p.price)], ['Payment terms', 'Net 15'], ['Reviewed', 'Every 12 months'],
                        ['In your pool', d.DISPATCH.poolOrder.indexOf(p.id) >= 0 ? 'Position ' + (d.DISPATCH.poolOrder.indexOf(p.id) + 1) : 'Not in pool']])}
              <div class="btnrow">${U.btn('Dispatch rules', { act: 'go', arg: '/dispatch' })}${U.btn('Report a problem', { act: 'go', arg: '/support' })}</div>`) : ''}
            ${U.panel('Your public profile', `
              ${U.note('They see you too.', 'Before approving, a provider reviews your name, logo, branches, coverage and average volume. ' + U.btn('Edit yours', { act: 'go', arg: '/profile' }), d.PAL.peach)}`)}
          </div>
        </div>`;
    }
  };

  /* ---------------- 12 Integrations ---------------- */
  SCREENS['integrations'] = {
    title: 'Integrations', epic: 'Epic 12',
    render() {
      const d = D();
      const conn = d.INTEGRATIONS.filter(i => i.status === 'Connected');
      const bad = conn.filter(i => i.health === 'Degraded');
      return U.page('Integrations', 'How orders get into Dash — a connector, your own API, or typed in',
        U.btn('Developer settings', { act: 'go', arg: '/developer' })) + `
        <div class="kpis k-4">
          ${U.kpi('Connected sources', conn.length, 'Feeding orders right now', d.PAL.lav)}
          ${U.kpi('Orders this month', d.INTEGRATIONS.reduce((s, i) => s + i.orders, 0).toLocaleString(), 'Across all sources', d.PAL.peach)}
          ${U.kpi('Healthy', conn.filter(i => i.health === 'Healthy').length, 'Syncing normally', d.PAL.flax)}
          ${U.kpi('Needs attention', bad.length, bad.length ? U.esc(bad[0].n) + ' is failing' : 'All clear', d.PAL.tang)}
        </div>
        ${bad.length ? U.note(U.esc(bad[0].n) + ' is degraded.', U.esc(bad[0].note) + ' Orders may be arriving late or not at all. ' + U.btn('View logs', { act: 'go', arg: '/developer' }), d.PAL.tang) : ''}
        ${U.note('Connectors are built and released by Dash.', 'You install one; you do not maintain it. When a platform changes its API, Dash ships the fix.', d.PAL.vodka)}
        <div class="cols c-3">
          ${d.INTEGRATIONS.map(i => `
            <section class="panel provcard">
              <div class="pc-h">
                <span class="av lg">${U.esc(i.n.slice(0, 2).toUpperCase())}</span>
                <div><b>${U.esc(i.n)}</b><em>${i.kind}</em></div>
                ${U.tag(i.status, i.status === 'Connected' ? '#1f8a4c' : i.status === 'Always on' ? d.PAL.flax : d.PAL.lav, { solid: i.status !== 'Connected' })}
              </div>
              <div style="padding:0 13px 4px">${U.defs([
                ['Orders this month', i.orders.toLocaleString()],
                ['Last sync', U.esc(i.synced)],
                ['Health', i.health === '—' ? '<em class="sub">—</em>' : U.tag(i.health, i.health === 'Healthy' ? '#1f8a4c' : d.PAL.tang, { solid: i.health !== 'Healthy' })]
              ])}</div>
              <div class="pc-n">${U.esc(i.note)}</div>
              <div class="pc-a">
                ${i.status === 'Connected' ? U.btn('Sync settings', { act: 'syncSettings', arg: i.id }) + U.btn('Disconnect', { kind: 'danger', act: 'disconnectInt', arg: i.id })
                  : i.status === 'Available' ? U.btn('Connect', { kind: 'primary', act: 'connectInt', arg: i.id })
                  : U.btn('Create an order', { act: 'go', arg: '/create-order' })}
              </div>
            </section>`).join('')}
        </div>
        ${U.panel('Connection health', U.table(
          [{ t: 'Source' }, { t: 'Connection' }, { t: 'State' }, { t: 'Last successful sync' }, { t: 'Orders that failed to arrive', num: true },
           { t: 'What went wrong' }, { t: 'Dash → you' }, { t: '', w: '190px' }],
          MDEEP.CONNS.map(c => ({ cells: [
            '<b>' + U.esc(c.n) + '</b>', c.k,
            U.tag(c.s, c.s === 'Connected' ? '#1f8a4c' : c.s === 'Error' ? d.PAL.tang : '#c9c9c9', { solid: c.s === 'Error' }),
            c.last, c.fails || '—',
            c.err ? '<em class="warn">' + U.esc(c.err) + '</em>' : '<em class="sub">Nothing</em>',
            U.esc(c.hook),
            '<div class="rowact">' + (c.s === 'Error'
              ? U.btn('Reconnect ' + c.n, { kind: 'primary', act: 'stub', arg: 'Reconnect ' + c.n + ' — the ' + c.fails + ' held orders are reprocessed automatically' })
              : c.s === 'Not connected' ? U.btn('Connect', { act: 'stub', arg: 'Connect ' + c.n })
              : U.btn('Test', { act: 'stub', arg: 'Test call to ' + c.n + ' — 200 OK' })) + '</div>'] }))),
          { pad: false, right: '<span class="ph-note">Is it working, and if not, since when</span>' })}
        ${U.panel('Orders that did not arrive', U.table(
          [{ t: 'Time' }, { t: 'Source' }, { t: 'External ID' }, { t: 'Your reference' }, { t: 'What went wrong' }, { t: '', w: '150px' }],
          MDEEP.FAILED.map(f => ({ cells: [f.t, U.esc(f.c), '<code>' + f.x + '</code>', '<code>' + U.esc(f.ref) + '</code>',
            '<em class="warn">' + U.esc(f.e) + '</em>',
            '<div class="rowact">' + U.btn('Retry', { act: 'stub', arg: f.x + ' reprocessed' }) + '</div>'] }))),
          { pad: false, right: '<span class="ph-note">These are real orders your customers placed — they are not in Dash yet</span>' })}
        ${U.panel('Sync activity', U.table(
          [{ t: 'Time' }, { t: 'Source' }, { t: 'Event' }, { t: 'Result' }, { t: 'Order' }],
          [['15:44:02', 'Salla', 'Order created', '201', 'DX-41074'],
           ['15:41:18', 'Salla', 'Order created', '201', 'DX-41077'],
           ['15:33:40', 'Shopify', 'Order created', '201', 'DX-41055'],
           ['15:20:11', 'Kanz ERP', 'Order created', '500 · retry 3', '—'],
           ['15:04:52', 'Kanz ERP', 'Order created', '201', 'DX-41068'],
           ['14:58:03', 'Manual entry', 'Order created', '201', 'DX-41061']]
            .map(([t, s, e, r, o]) => ({ cells: [t, U.esc(s), e,
              U.tag(r, r.startsWith('2') ? '#1f8a4c' : d.PAL.tang, { solid: !r.startsWith('2') }),
              o === '—' ? '<em class="sub">—</em>' : `<a href="#/orders/${o}">${o}</a>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 04 Public profile ---------------- */
  SCREENS['profile'] = {
    title: 'Public profile', epic: 'Epic 04',
    render() {
      const d = D();
      return U.page('Public profile', 'What a 3PL sees when you ask to connect',
        U.btn('Save changes', { kind: 'primary', act: 'stub', arg: 'Public profile saved' })) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Business', `
              <div class="grid2">
                ${U.field('Business name', U.input(d.BIZ.name))}
                ${U.field('Website', U.input(d.BIZ.site))}
                ${U.field('Category', U.select(['Grocery and convenience', 'Restaurant', 'Pharmacy', 'Online shop', 'Other retail'], d.BIZ.kind))}
                ${U.field('Average order volume', U.input(d.BIZ.volume), 'Providers filter on this — understating it costs you good partners')}
              </div>
              ${U.field('Description', `<textarea class="in" rows="3">${U.esc(d.BIZ.desc)}</textarea>`)}
              ${U.field('Logo', `<div style="display:flex;gap:12px;align-items:center">
                <span class="av lg" style="width:52px;height:52px;font-size:17px">KM</span>
                ${U.btn('Replace logo', { act: 'stub', arg: 'Upload a square PNG or SVG' })}</div>`)}`)}
            ${U.panel('Branches and coverage shown publicly', U.table(
              [{ t: 'Branch' }, { t: 'Area' }, { t: 'Hours' }, { t: 'Visible' }],
              d.BRANCHES.map(b => ({ cells: [U.esc(b.name), U.esc(b.addr), U.esc(b.hours), U.toggle(true, 'stub', b.id)] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Preview — how providers see you', `
              <div class="listing">
                <div class="ls-h"><div><b>${U.esc(d.BIZ.name)}</b><em>${U.esc(d.BIZ.kind)} · ${d.BRANCHES.length} branches</em></div>${U.tag('Verified', '#000', { solid: true })}</div>
                <div class="ls-m">${U.defs([['Volume', U.esc(d.BIZ.volume)], ['City', U.esc(d.BIZ.city)], ['On Dash since', U.esc(d.BIZ.verified)]])}</div>
                <div class="ls-c">${d.BRANCHES.map(b => U.tag(b.name.split('— ')[1], '#E3E3E3', { solid: true })).join(' ')}</div>
                <div class="ls-p">${U.esc(d.BIZ.desc)}</div>
                <div class="ls-b">Approve connection</div>
              </div>
              <div class="fld-h">Your delivery volume and branch count come from your account — you cannot edit those.</div>`)}
            ${U.note('This is not a consumer page.', 'Your customers never see it. It exists so a 3PL can judge whether your volume and areas suit them.', d.PAL.peach)}
          </div>
        </div>`;
    }
  };
})();
