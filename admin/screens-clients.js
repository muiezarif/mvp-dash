/* Dash Admin — Marketplace module (product 07, epics 10 · 11),
   Client management (04), Verification (05), Freelancers (06), Customer directory (12) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.ADM;
  window.STATE = window.STATE || {};
  STATE.cf = STATE.cf || { type: 'All types', state: 'All states', product: 'All products', q: '' };

  const lState = s => ({ 'Live':'#1f8a4c', 'Pending review':D().PAL.lemon, 'Suspended':D().PAL.tang, 'Draft':'#C9C9C9' }[s] || '#9A9A9A');

  /* ---------------- Marketplace 10 · 11 ---------------- */
  SCREENS['marketplace'] = {
    title: 'Marketplace', epic: 'Marketplace 10 · 11',
    render() {
      const d = D();
      const pending = d.LISTINGS.filter(l => l.state === 'Pending review');
      const live = d.LISTINGS.filter(l => l.state === 'Live');
      return U.page('3PL Marketplace', 'Dash hosts and reviews the listings. Providers approve their own merchants',
        U.btn('Marketplace monitoring', { act: 'go', arg: '/marketplace-monitor' })) + `
        ${U.mode('dash', 'Our half of the Marketplace: approve, suspend, feature and rank listings. Once a merchant and a provider connect, the commercial relationship is theirs — orders flow direct and the Network is not involved.')}
        <div class="kpis k-4">
          ${U.kpi('Live listings', live.length, 'Visible to 164 merchants', '#1f8a4c')}
          ${U.kpi('Awaiting review', pending.length, 'Oldest 2 days', d.PAL.lemon)}
          ${U.kpi('Suspended', d.LISTINGS.filter(l => l.state === 'Suspended').length, 'Below performance floor', d.PAL.tang)}
          ${U.kpi('Active connections', d.CONNECTIONS.filter(c => c.state === 'Connected').length, d.CONNECTIONS.filter(c => c.state.startsWith('Pending')).length + ' awaiting the provider', d.PAL.lav)}
        </div>
        ${pending.length ? U.note(U.esc(pending[0].provider) + ' submitted a listing.',
          `${U.esc(pending[0].zones)} · ${U.esc(pending[0].caps)} · ${U.esc(pending[0].pricing)}. `
          + U.btn('Review it', { kind: 'primary', act: 'go', arg: '/marketplace/' + pending[0].id }), d.PAL.lemon) : ''}
        ${U.panel('All listings', U.table(
          [{ t: 'Provider' }, { t: 'State' }, { t: 'Coverage' }, { t: 'Capabilities' }, { t: 'Indicative pricing' },
           { t: 'On time', w: '110px' }, { t: 'Views', num: true }, { t: 'Requests', num: true }, { t: 'Connected', num: true },
           { t: 'Rank', num: true }, { t: 'Featured' }, { t: '', w: '250px' }],
          d.LISTINGS.map(l => ({ cells: [
            `<div class="who sm"><span class="av">${l.logo}</span><span>${U.esc(l.provider)}</span></div>`,
            U.tag(l.state, lState(l.state), { solid: l.state !== 'Live' }),
            U.esc(l.zones), U.esc(l.caps), U.esc(l.pricing),
            l.onTime ? `${l.onTime}% ${U.bar(l.onTime, l.onTime >= 90 ? d.PAL.vodka : d.PAL.tang)}` : '—',
            l.views, l.requests, l.connected, l.rank,
            l.featured ? U.tag('Featured', d.PAL.lemon, { solid: true }) : '—',
            `<div class="rowact">${U.btn('Open', { act: 'go', arg: '/marketplace/' + l.id })}${
              l.state === 'Pending review' ? U.btn('Approve', { kind: 'primary', act: 'approveListing', arg: l.id }) + U.btn('Reject', { act: 'rejectListing', arg: l.id })
              : l.state === 'Live' ? U.btn(l.featured ? 'Unfeature' : 'Feature', { act: 'featureListing', arg: l.id }) + U.btn('Suspend', { kind: 'danger', act: 'suspendListing', arg: l.id })
              : l.state === 'Suspended' ? U.btn('Reinstate', { kind: 'primary', act: 'reinstateListing', arg: l.id })
              : '<em class="sub">Not submitted</em>'}</div>`] }))), { pad: false, right: `<span class="ph-note">Marketplace 10 · 11</span>` })}
        ${U.panel('Ranking — what merchants see first', `
          <div class="pool">
            ${[...d.LISTINGS].filter(l => l.state === 'Live').sort((a, b) => a.rank - b.rank).map((l, i) => `
              <div class="pl"><span class="pl-n">${i + 1}</span><span class="av">${l.logo}</span>
                <div class="pl-b"><b>${U.esc(l.provider)}</b><em>on time ${l.onTime}% · accepts ${l.accept}% · ${l.requests} requests · ${l.views} views${l.featured ? ' · FEATURED' : ''}</em></div>
                <div class="pl-a">${U.btn('↑', { act: 'rankUp', arg: l.id })}${U.btn('↓', { act: 'rankDown', arg: l.id })}${U.btn(l.featured ? 'Unfeature' : 'Feature', { act: 'featureListing', arg: l.id })}</div>
              </div>`).join('')}
          </div>
          ${U.note('Ranking is editorial, and that is a responsibility.', 'Default order is by measured performance. Overriding it — or featuring a listing — puts Dash’s thumb on a commercial outcome, so every change is written to the audit log.', d.PAL.peach)}`)}`;
    }
  };

  SCREENS['listing'] = {
    title: 'Listing', epic: 'Marketplace 10',
    render(id) {
      const d = D(), l = d.listing(id);
      if (!l) return U.page('Listing not found', '');
      const conns = d.CONNECTIONS.filter(c => c.provider === l.provider);
      return U.page(l.provider, `Marketplace listing · submitted ${U.esc(l.submitted)}${l.approved !== '—' ? ' · approved ' + U.esc(l.approved) : ''}`,
        (l.state === 'Pending review' ? U.btn('Approve listing', { kind: 'primary', act: 'approveListing', arg: l.id }) + U.btn('Reject with reason', { act: 'rejectListing', arg: l.id })
          : l.state === 'Live' ? U.btn(l.featured ? 'Remove feature' : 'Feature this listing', { act: 'featureListing', arg: l.id }) + U.btn('Suspend listing', { kind: 'danger', act: 'suspendListing', arg: l.id })
          : l.state === 'Suspended' ? U.btn('Reinstate', { kind: 'primary', act: 'reinstateListing', arg: l.id }) : '') +
        U.btn('Client profile', { act: 'clientByName', arg: l.provider }) +
        U.btn('Back to Marketplace', { act: 'go', arg: '/marketplace' })) +
        U.mode('dash', 'Approving, suspending, featuring and ranking are ours. The listing content itself is written by the provider — we can reject it, not edit it.') + `
        ${l.state === 'Suspended' ? U.note('Suspended.', U.esc(l.note) + ' Existing connections keep working; the listing simply stops appearing in search.', d.PAL.tang) : ''}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('What the provider submitted', U.defs([
              ['Provider', U.esc(l.provider)],
              ['State', U.tag(l.state, lState(l.state), { solid: l.state !== 'Live' })],
              ['Coverage areas', U.esc(l.zones)],
              ['Vehicle types', U.esc(l.vehicles)],
              ['Service capabilities', U.esc(l.caps)],
              ['Indicative pricing', U.esc(l.pricing) + ' <em class="sub">real terms are set per merchant after connecting</em>'],
              ['Submitted', U.esc(l.submitted)], ['Approved', U.esc(l.approved)],
              ['Note', U.esc(l.note) || '—']
            ]))}
            ${U.panel('Measured performance — we supply these, not them', U.defs([
              ['On time', l.onTime ? `${l.onTime}% ${U.bar(l.onTime, l.onTime >= 90 ? d.PAL.vodka : d.PAL.tang)}` : '<em class="sub">No delivery history</em>'],
              ['Acceptance', l.accept ? `${l.accept}% ${U.bar(l.accept, d.PAL.lav)}` : '<em class="sub">No history</em>'],
              ['Profile views', l.views + ' this month'],
              ['Connection requests', l.requests + ' this month'],
              ['Connected merchants', l.connected],
              ['Rank', '#' + l.rank + (l.featured ? ' · featured' : '')]
            ]) + U.note('Providers cannot edit these figures.', 'They come from delivered orders on Dash. A listing that claims 98% and delivers 78% is exactly what the suspension rule is for.', d.PAL.vodka))}
            ${conns.length ? U.panel('Merchant connections through this listing', U.table(
              [{ t: 'Merchant' }, { t: 'State' }, { t: 'Since' }, { t: 'Orders', num: true }, { t: 'Their pricing contract' }],
              conns.map(c => ({ cells: [U.esc(c.merchant),
                U.tag(c.state, c.state === 'Connected' ? '#1f8a4c' : c.state === 'Suspended' ? d.PAL.tang : d.PAL.lemon, { solid: c.state !== 'Connected' }),
                U.esc(c.since), c.orders, U.esc(c.pricing)] }))), { pad: false }) : ''}
          </div>
          <div class="stack">
            ${U.panel('How it appears to merchants', `
              <div class="listing">
                <div class="ls-h"><div><b>${U.esc(l.provider)}</b><em>${U.esc(l.zones)}</em></div>
                  ${l.featured ? U.tag('Featured', d.PAL.lemon, { solid: true }) : U.tag('Verified', '#000', { solid: true })}</div>
                <div class="ls-m">${U.defs([
                  ['On time', l.onTime ? `${l.onTime}% ${U.bar(l.onTime, d.PAL.vodka)}` : 'New provider'],
                  ['Accept rate', l.accept ? `${l.accept}%` : '—'],
                  ['Rank', '#' + l.rank]])}</div>
                <div class="ls-c">${l.caps.split(', ').map(c => U.tag(c, '#E3E3E3', { solid: true })).join(' ')}</div>
                <div class="ls-p">${U.esc(l.pricing)}</div>
                <div class="ls-b">${l.state === 'Live' ? 'Request to connect' : 'Not visible'}</div>
              </div>`)}
            ${U.panel('Suspension rule', U.defs([
              ['Trigger', 'On time below 80% over 100 orders, or two upheld merchant complaints'],
              ['Effect', 'Listing hidden from search; existing connections continue'],
              ['Network roles', 'Suspended separately — a bad listing is not always bad supply'],
              ['Appeal', 'Through a support ticket, reviewed by Operations']
            ]))}
          </div>
        </div>`;
    }
  };

  SCREENS['marketplace-monitor'] = {
    title: 'Marketplace monitor', epic: 'Marketplace 11',
    render() {
      const d = D();
      const conn = d.CONNECTIONS.filter(c => c.state === 'Connected');
      return U.page('Marketplace monitoring', 'Connections and the volume flowing through them',
        U.btn('Back to Marketplace', { act: 'go', arg: '/marketplace' })) + `
        <div class="kpis k-4">
          ${U.kpi('Connections', conn.length, d.CONNECTIONS.filter(c => c.state.startsWith('Pending')).length + ' pending the provider', d.PAL.lav)}
          ${U.kpi('Marketplace orders', d.PLATFORM.bySource[1].orders.toLocaleString(), d.PLATFORM.bySource[1].share + '% of all platform volume', d.PAL.vodka)}
          ${U.kpi('Avg per connection', Math.round(conn.reduce((s, c) => s + c.orders, 0) / conn.length), 'Orders this month', d.PAL.peach)}
          ${U.kpi('Dash revenue from these', U.money(0), 'None — Dash takes no margin on Marketplace', '#9A9A9A')}
        </div>
        ${U.note('Marketplace orders earn Dash nothing per order.', 'They are billed merchant to provider on their own contract. Dash earns the subscription that lets them list and connect — which is why listing quality matters more here than volume.', d.PAL.vodka)}
        ${U.panel('All connections', U.table(
          [{ t: 'Merchant' }, { t: 'Provider' }, { t: 'State' }, { t: 'Since' }, { t: 'Orders this month', num: true }, { t: 'Their pricing' }],
          d.CONNECTIONS.map(c => ({ cells: [
            `<b>${U.esc(c.merchant)}</b>`, U.esc(c.provider),
            U.tag(c.state, c.state === 'Connected' ? '#1f8a4c' : c.state === 'Suspended' ? d.PAL.tang : d.PAL.lemon, { solid: c.state !== 'Connected' }),
            U.esc(c.since), c.orders, U.esc(c.pricing)] }))), { pad: false })}
        ${U.panel('Volume by provider', `<div class="zonebars">
          ${d.LISTINGS.filter(l => l.connected).map(l => {
            const vol = d.CONNECTIONS.filter(c => c.provider === l.provider).reduce((s, c) => s + c.orders, 0);
            return `<div class="zb"><span>${U.esc(l.provider)}</span>${U.bar(vol / 900 * 100, d.PAL.lav)}<em>${vol} orders · ${l.connected} merchants</em></div>`;
          }).join('')}</div>`)}`;
    }
  };

  /* ---------------- 04 Client management ---------------- */
  SCREENS['clients'] = {
    title: 'Clients', epic: 'Epic 04',
    render() {
      const d = D(), f = STATE.cf;
      const rows = d.CLIENTS.filter(c =>
        (f.type === 'All types' || c.type === f.type) &&
        (f.state === 'All states' || c.state === f.state) &&
        (f.product === 'All products' || c.product === f.product) &&
        (!f.q || (c.name + ' ' + c.legal + ' ' + c.contact).toLowerCase().includes(f.q.toLowerCase())));
      const bad = d.CLIENTS.filter(c => ['Degraded','Failing'].includes(c.health));
      return U.page('Client management', 'One profile per entity on the platform, whichever product they live in',
        U.btn('Verification queue', { act: 'go', arg: '/verification' }) + U.btn('Export CSV', { act: 'export', arg: 'clients' })) + `
        <div class="kpis k-4">
          ${U.kpi('Active clients', d.CLIENTS.filter(c => c.state === 'Active').length + 187, '164 merchants · 19 DMS · 12 3PL', d.PAL.lav)}
          ${U.kpi('Pending verification', d.CLIENTS.filter(c => c.state === 'Pending verification').length + 3, 'Read-only until cleared', d.PAL.lemon)}
          ${U.kpi('Suspended', d.CLIENTS.filter(c => c.state === 'Suspended').length, 'Performance or payment', d.PAL.tang)}
          ${U.kpi('Integration problems', bad.length, 'Orders may be going missing', d.PAL.peach)}
        </div>
        ${bad.length ? U.note(bad.length + ' clients have failing integrations.',
          bad.map(c => `<b>${U.esc(c.name)}</b> — ${U.esc(c.note)}`).join(' · ') + ' Connection health is the quietest way to lose a client’s trust.', d.PAL.tang) : ''}
        ${U.filters([
          U.input(f.q, 'Search client, legal name or contact…', { act: 'cfQ' }),
          `<span class="f-l">Type</span>` + U.select(['All types', 'Merchant', 'DMS client', '3PL'], f.type, { act: 'cfF', arg: 'type' }),
          `<span class="f-l">State</span>` + U.select(['All states', 'Active', 'Pending verification', 'Suspended'], f.state, { act: 'cfF', arg: 'state' }),
          `<span class="f-l">Product</span>` + U.select(['All products', 'Dash Merchant', 'Dash DMS', 'Dash 3PL'], f.product, { act: 'cfF', arg: 'product' }),
          `<span class="f-sp"></span><span class="f-c">${rows.length} of ${d.CLIENTS.length} shown</span>`,
          U.btn('Reset', { act: 'cfReset' })
        ])}
        ${U.panel('', U.table(
          [{ t: 'Client' }, { t: 'Type' }, { t: 'Product' }, { t: 'State' }, { t: 'Plan' }, { t: 'Integration' }, { t: 'Health' },
           { t: 'Orders', num: true }, { t: 'On time', w: '110px' }, { t: 'Network' }, { t: 'Marketplace' }, { t: 'Wallet', num: true }],
          rows.map(c => ({ act: 'go', arg: '/clients/' + c.id, cells: [
            `<div class="who sm"><span class="av">${c.logo}</span><span>${U.esc(c.name)}<em>${U.esc(c.legal)}</em></span></div>`,
            U.tag(c.type, c.type === 'Merchant' ? d.PAL.peach : c.type === '3PL' ? d.PAL.vodka : d.PAL.lav),
            U.esc(c.product),
            U.tag(c.state, c.state === 'Active' ? '#1f8a4c' : c.state === 'Suspended' ? d.PAL.tang : d.PAL.lemon, { solid: c.state !== 'Active' }),
            U.esc(c.plan), U.esc(c.integration),
            c.health === '—' ? '<em class="sub">—</em>' : U.tag(c.health, c.health === 'Healthy' ? '#1f8a4c' : d.PAL.tang, { solid: c.health !== 'Healthy' }),
            c.orders.toLocaleString(), c.onTime ? `${c.onTime}% ${U.bar(c.onTime, d.PAL.lav)}` : '—',
            c.net.supply === 'n/a' ? U.tag('Demand only', d.PAL.peach) : `${U.tag('S: ' + c.net.supply.split(' ')[0], c.net.supply === 'Active' ? '#1f8a4c' : '#C9C9C9')} ${U.tag('D: ' + c.net.demand.split(' ')[0], c.net.demand.startsWith('Active') ? '#1f8a4c' : '#C9C9C9')}`,
            `${c.market.role} · ${c.market.connected}`,
            c.wallet < 0 ? `<b class="warn">${U.money(c.wallet)}</b>` : U.money(c.wallet)] }))), { pad: false })}`;
    }
  };

  SCREENS['client'] = {
    title: 'Client', epic: 'Epic 04',
    render(id) {
      const d = D(), c = d.client(id);
      if (!c) return U.page('Client not found', '');
      const orders = d.ORDERS.filter(o => o.merchant === c.name || o.provider === c.name);
      const tickets = d.TICKETS.filter(t => t.from === c.name);
      return U.page(c.name, `${c.type} · ${U.esc(c.legal)} · ${U.esc(c.city)} · ${U.esc(c.contact)}`,
        (c.state === 'Active' ? U.btn('Suspend account', { kind: 'danger', act: 'suspendClient', arg: c.id })
          : c.state === 'Suspended' ? U.btn('Reactivate account', { kind: 'primary', act: 'reactivateClient', arg: c.id })
          : U.btn('Open verification', { kind: 'primary', act: 'go', arg: '/verification' })) +
        U.btn('Impersonate — read only', { act: 'stub', arg: 'Opens their dashboard in a read-only session, logged in the audit trail' }) +
        U.btn('Back to clients', { act: 'go', arg: '/clients' })) +
        U.mode('dash', 'Account state, plan and suspension are ours. Their operational data — orders, drivers, contracts — belongs to them; we read it, we do not edit it.') + `
        ${c.state === 'Suspended' ? U.note('Suspended.', U.esc(c.note), d.PAL.tang) : c.note ? U.note('Note.', U.esc(c.note), d.PAL.peach) : ''}
        <div class="kpis k-4">
          ${U.kpi('Orders this month', c.orders.toLocaleString(), c.volume + ' per day', d.PAL.peach)}
          ${U.kpi('On time', (c.onTime || 0) + '%', 'Platform average 94%', d.PAL.lav)}
          ${U.kpi(c.type === 'Merchant' ? 'Spend this month' : 'Billed this month', U.money(c.spend), 'Plan ' + U.money(c.fee) + ' / month', d.PAL.flax)}
          ${U.kpi('Wallet', U.money(c.wallet), c.wallet < 0 ? 'Negative — owed to Dash' : c.wallet < 1000 ? 'Low' : 'Healthy', c.wallet < 0 ? d.PAL.tang : d.PAL.vodka)}
        </div>
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Account', U.defs([
              ['Trade name', U.esc(c.name)], ['Legal name', U.esc(c.legal)],
              ['Type', U.tag(c.type, c.type === 'Merchant' ? d.PAL.peach : c.type === '3PL' ? d.PAL.vodka : d.PAL.lav)],
              ['Product', U.esc(c.product)],
              ['CR number', U.esc(c.cr)], ['VAT number', U.esc(c.vat)],
              ['Contact', U.esc(c.contact)], ['City', U.esc(c.city)],
              ['Verified', c.verified === '—' ? U.tag('Not verified', d.PAL.lemon, { solid: true }) : U.esc(c.verified)],
              ['State', U.tag(c.state, c.state === 'Active' ? '#1f8a4c' : c.state === 'Suspended' ? d.PAL.tang : d.PAL.lemon, { solid: c.state !== 'Active' })]
            ]))}
            ${U.panel('Subscription', U.defs([
              ['Plan', U.esc(c.plan)], ['Monthly fee', U.money(c.fee)],
              ['Billing', 'Net 15, invoiced on the 1st'],
              ['Wallet balance', c.wallet < 0 ? `<b class="warn">${U.money(c.wallet)}</b>` : U.money(c.wallet)],
              [c.type === 'Merchant' ? 'Branches' : 'Fleet or zones', c.branches || '—']
            ]), { right: U.btn('Change plan', { act: 'stub', arg: 'Plan change — takes effect next invoice' }) })}
            ${U.panel('Integration and connection health', `
              ${U.defs([
                ['Method', U.esc(c.integration)],
                ['Connected', c.integrations.length ? c.integrations.map(i => U.tag(i, d.PAL.lav)).join(' ') : '<em class="sub">Nothing connected</em>'],
                ['Health', c.health === '—' ? '<em class="sub">No integration yet</em>' : U.tag(c.health, c.health === 'Healthy' ? '#1f8a4c' : d.PAL.tang, { solid: c.health !== 'Healthy' })]
              ])}
              ${c.health !== 'Healthy' && c.health !== '—' ? U.note('This is how clients quietly lose orders.', U.esc(c.note) + ' They may not have noticed yet — a failing webhook looks like a quiet day.', d.PAL.tang) : ''}`)}
            ${orders.length ? U.panel('Recent orders', U.table(
              [{ t: 'Order' }, { t: 'Role' }, { t: 'Source' }, { t: 'Status' }, { t: 'Zone' }, { t: 'Scope' }],
              orders.map(o => ({ act: 'go', arg: '/control-tower/' + o.id, cells: [
                `<b>${o.id}</b>`, o.merchant === c.name ? 'Sender' : 'Provider',
                U.tag(o.source === 'Network' ? 'Dash Network' : o.source, o.source === 'Network' ? d.PAL.vodka : d.PAL.lav),
                U.statusTag(o.status), o.zone, U.scope(o.scope)] }))), { pad: false }) : ''}
          </div>
          <div class="stack">
            ${U.panel('Network participation', `${U.defs([
              ['Supply role', c.net.supply === 'n/a' ? '<em class="sub">Not applicable — merchants only send</em>' : U.tag(c.net.supply, c.net.supply === 'Active' ? '#1f8a4c' : d.PAL.tang, { solid: c.net.supply !== 'Active' })],
              ['Demand role', U.tag(c.net.demand.split(' ')[0], c.net.demand.startsWith('Active') ? '#1f8a4c' : '#C9C9C9', { solid: !c.net.demand.startsWith('Active') }) + (c.net.demand.includes('automatic') ? ' <em class="sub">Automatic on verification</em>' : '')]
            ])}<div class="btnrow">${U.btn('Network participants', { act: 'go', arg: '/network' })}</div>`)}
            ${U.panel('Marketplace participation', `${U.defs([
              ['Role', c.market.role + (c.market.role === 'Provider' ? ' — lists and approves merchants' : ' — browses and requests')],
              ['Connections', c.market.connected],
              ['Open requests', c.market.requests]
            ])}<div class="btnrow">${U.btn('Marketplace', { act: 'go', arg: '/marketplace' })}</div>`)}
            ${tickets.length ? U.panel('Their open tickets', U.table(
              [{ t: 'Ticket' }, { t: 'Subject' }, { t: 'Status' }],
              tickets.map(t => ({ act: 'go', arg: '/support', cells: [`<b>${t.id}</b>`, U.esc(t.t),
                U.tag(t.s, t.s === 'Resolved' ? '#1f8a4c' : d.PAL.lemon, { solid: t.s !== 'Resolved' })] }))), { pad: false }) : ''}
            ${U.panel('Suspension', U.defs([
              ['What stops', 'Creating orders, Network roles, Marketplace visibility'],
              ['What continues', 'Login, viewing history, settling invoices'],
              ['Orders in flight', 'Finish normally — we never strand a customer'],
              ['Reversible', 'Yes, instantly, once the reason is resolved']
            ]))}
          </div>
        </div>`;
    }
  };

  /* ---------------- 05 Verification ---------------- */
  SCREENS['verification'] = {
    title: 'Verification', epic: 'Epic 05',
    render() {
      const d = D();
      const ready = d.VERIFY.filter(v => v.state === 'Ready to verify');
      const blocked = d.VERIFY.filter(v => v.state === 'Blocked');
      return U.page('Client verification', 'Nothing real happens on a client account until we clear it',
        U.btn('Client list', { act: 'go', arg: '/clients' })) +
        U.mode('dash', 'Verification is Dash’s gate. A client can log in, look around and configure settings while unverified — they cannot create records, join the Network, or touch the Marketplace.') + `
        <div class="kpis k-4">
          ${U.kpi('In the queue', d.VERIFY.length, 'Oldest 4 days', d.PAL.lemon)}
          ${U.kpi('Ready to verify', ready.length, 'Documents all clean', '#1f8a4c')}
          ${U.kpi('Blocked', blocked.length, 'Client must resubmit', d.PAL.tang)}
          ${U.kpi('Unassigned', d.VERIFY.filter(v => v.assignee === 'Unassigned').length, 'Nobody is looking at it', d.PAL.peach)}
        </div>
        ${blocked.length ? U.note(U.esc(blocked[0].client) + ' is blocked.', U.esc(blocked[0].note) + ' A blocked verification also blocks their Network join request. ' + U.btn('Join requests', { act: 'go', arg: '/network-requests' }), d.PAL.tang) : ''}
        <div class="cols c-2-1">
          <div class="stack">
            ${d.VERIFY.map(v => `
              <div class="req">
                <div class="req-h">
                  <span class="av lg">${U.esc(v.client.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span>
                  <div style="flex:1;min-width:0"><b>${U.esc(v.client)}</b>
                    <div class="mono" style="font:500 10px ui-monospace,Menlo,monospace;color:#9A9A9A;letter-spacing:.06em">${v.type} · submitted ${U.esc(v.submitted)} · waiting ${U.esc(v.waiting)} · ${U.esc(v.assignee)}</div></div>
                  ${U.tag(v.state, v.state === 'Ready to verify' ? '#1f8a4c' : v.state === 'Blocked' ? d.PAL.tang : v.state === 'New' ? d.PAL.lav : d.PAL.lemon, { solid: v.state !== 'Ready to verify' })}
                </div>
                <div class="req-b">
                  ${U.table([{ t: 'Document' }, { t: 'Status' }, { t: '', w: '130px' }],
                    v.docs.map(doc => ({ cells: [doc.k,
                      U.tag(doc.s, doc.s === 'Accepted' ? '#1f8a4c' : doc.s === 'Pending review' ? d.PAL.lemon : d.PAL.tang, { solid: doc.s !== 'Accepted' }),
                      `<div class="rowact">${U.btn('View', { act: 'stub', arg: 'Document viewer — ' + doc.k })}</div>`] })), { hover: false })}
                  ${v.note ? `<div class="fld-h" style="margin-top:9px">${U.esc(v.note)}</div>` : ''}
                </div>
                <div class="req-a">
                  ${v.state === 'Blocked'
                    ? U.btn('Request resubmission', { kind: 'primary', act: 'requestResubmit', arg: v.id }) + `<span class="fld-h" style="margin:0;align-self:center">Cannot verify with an expired document</span>`
                    : U.btn('Verify client', { kind: 'primary', act: 'verifyClient', arg: v.id }) + U.btn('Reject with reason', { act: 'rejectVerify', arg: v.id })}
                  ${v.assignee === 'Unassigned' ? U.btn('Assign to me', { act: 'assignVerify', arg: v.id }) : ''}
                </div>
              </div>`).join('')}
          </div>
          <div class="stack">
            ${U.panel('What unverified means', `<div class="states">
              ${[['Can log in', 'Yes — and configure every setting', true],
                 ['Can browse', 'Yes — the whole product is visible', true],
                 ['Can create records', 'No — no orders, drivers, branches or merchants', false],
                 ['Can join Dash Network', 'No — a role request is blocked', false],
                 ['Can use the Marketplace', 'No — cannot list, cannot connect', false]].map(([w, s, ok]) =>
                `<div class="st ${ok ? 'on' : ''}"><b>${w}</b><em>${s}</em></div>`).join('')}
            </div>`, { pad: false })}
            ${U.panel('Rejection', U.defs([
              ['They see', 'The reason we write, in plain words, on their onboarding page'],
              ['They keep', 'Login, settings, their team invitations'],
              ['Resubmission', 'Unlimited — a corrected document re-enters this queue'],
              ['Never', 'A silent rejection. If we block someone, they know why.']
            ]))}
          </div>
        </div>`;
    }
  };

  /* ---------------- 06 Freelancer management ---------------- */
  SCREENS['freelancers'] = {
    title: 'Freelancers', epic: 'Epic 06',
    render() {
      const d = D();
      const pending = d.FREELANCERS.filter(f => f.state === 'Pending approval');
      const expiring = d.FREELANCERS.filter(f => f.docs.some(x => x.s === 'Expiring'));
      const expired = d.FREELANCERS.filter(f => f.docs.some(x => x.s === 'Expired'));
      return U.page('Freelancer management', 'Individual drivers. Approving one adds supply to the Network automatically',
        U.btn('Payouts', { act: 'go', arg: '/payouts' })) +
        U.mode('dash', 'Freelancers have no company above them, so Dash is their whole administration: onboarding, documents, suspension and payouts.') + `
        <div class="kpis k-4">
          ${U.kpi('Active freelancers', 412, 'Automatic Network supply', d.PAL.lav)}
          ${U.kpi('Awaiting approval', pending.length, 'Oldest 2 days', d.PAL.lemon)}
          ${U.kpi('Documents expiring', expiring.length, 'Within 30 days — flagged', d.PAL.peach)}
          ${U.kpi('Auto suspended', expired.length, 'A document lapsed', d.PAL.tang)}
        </div>
        ${U.note('Document expiry is automated, deliberately.',
          'A sweep runs every morning at 06:00. At 30 days the freelancer is flagged and emailed; on the expiry date the account auto-suspends and they stop receiving offers. Nobody has to remember — and nobody drives on an expired licence.', d.PAL.lemon)}
        ${pending.length ? U.note(pending.length + ' onboarding requests waiting.',
          pending.map(f => `<b>${U.esc(f.name)}</b> — ${U.esc(f.note || 'documents complete')}`).join(' · '), d.PAL.lav) : ''}
        ${U.panel('', U.table(
          [{ t: 'Freelancer' }, { t: 'Vehicle' }, { t: 'State' }, { t: 'Approved' }, { t: 'Orders', num: true },
           { t: 'Completion', w: '110px' }, { t: 'Accept', num: true }, { t: 'Cancel', num: true }, { t: 'Documents' }, { t: 'Wallet', num: true }, { t: '', w: '230px' }],
          d.FREELANCERS.map(f => {
            const worst = f.docs.some(x => x.s === 'Expired') ? 'Expired' : f.docs.some(x => x.s === 'Expiring') ? 'Expiring' : f.docs.some(x => x.s === 'Missing') ? 'Missing' : 'Valid';
            return { act: 'go', arg: '/freelancers/' + f.id, cells: [
              `<div class="who sm">${U.avatar(f.name)}<span>${U.esc(f.name)}<em>${U.esc(f.phone)}</em></span></div>`,
              U.esc(f.vehicle),
              U.tag(f.state, f.state === 'Active' ? '#1f8a4c' : f.state === 'Suspended' ? d.PAL.tang : d.PAL.lemon, { solid: f.state !== 'Active' }),
              U.esc(f.approved), f.orders.toLocaleString(),
              f.completion ? `${f.completion}% ${U.bar(f.completion, f.completion >= 95 ? d.PAL.lav : d.PAL.tang)}` : '—',
              f.accept ? f.accept + '%' : '—', f.cancel ? f.cancel + '%' : '—',
              U.tag(worst, worst === 'Valid' ? '#1f8a4c' : worst === 'Expiring' ? d.PAL.peach : d.PAL.tang, { solid: worst !== 'Valid' }),
              U.money(f.wallet),
              `<div class="rowact">${
                f.state === 'Pending approval'
                  ? (worst === 'Missing' ? U.btn('Chase documents', { act: 'chaseDocs', arg: f.id }) : U.btn('Approve', { kind: 'primary', act: 'approveFreelancer', arg: f.id })) + U.btn('Reject', { act: 'rejectFreelancer', arg: f.id })
                  : f.state === 'Suspended' ? U.btn('Reinstate', { kind: 'primary', act: 'reinstateFreelancer', arg: f.id })
                  : U.btn('Suspend', { kind: 'danger', act: 'suspendFreelancer', arg: f.id })}</div>`] };
          })), { pad: false })}`;
    }
  };

  SCREENS['freelancer'] = {
    title: 'Freelancer', epic: 'Epic 06',
    render(id) {
      const d = D(), f = d.freelancer(id);
      if (!f) return U.page('Freelancer not found', '');
      const wd = d.REVENUE.withdrawals.filter(w => w.who === f.name);
      return U.page(f.name, `${U.esc(f.phone)} · ${U.esc(f.vehicle)} · ${U.esc(f.city)}${f.approved !== '—' ? ' · approved ' + U.esc(f.approved) : ''}`,
        (f.state === 'Pending approval'
          ? U.btn('Approve and activate', { kind: 'primary', act: 'approveFreelancer', arg: f.id }) + U.btn('Reject with reason', { act: 'rejectFreelancer', arg: f.id })
          : f.state === 'Suspended' ? U.btn('Reinstate', { kind: 'primary', act: 'reinstateFreelancer', arg: f.id })
          : U.btn('Suspend', { kind: 'danger', act: 'suspendFreelancer', arg: f.id })) +
        U.btn('Back to freelancers', { act: 'go', arg: '/freelancers' })) + `
        ${f.state === 'Suspended' ? U.note('Suspended.', U.esc(f.note), d.PAL.tang) : f.note ? U.note('Note.', U.esc(f.note), d.PAL.peach) : ''}
        <div class="kpis k-4">
          ${U.kpi('Orders delivered', f.orders.toLocaleString(), f.approved === '—' ? 'Not started' : 'Since ' + f.approved, d.PAL.lav)}
          ${U.kpi('Completion', (f.completion || 0) + '%', 'Pool average 95%', d.PAL.flax)}
          ${U.kpi('Acceptance', (f.accept || 0) + '%', 'Shown to them, never scored', d.PAL.vodka)}
          ${U.kpi('Wallet', U.money(f.wallet), wd.length ? 'Withdrawal requested' : 'Nothing pending', d.PAL.peach)}
        </div>
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Documents', U.table(
              [{ t: 'Document' }, { t: 'Expires' }, { t: 'Status' }, { t: '', w: '160px' }],
              f.docs.map(x => ({ cells: [x.k, U.esc(x.exp),
                U.tag(x.s, ['Valid','Accepted'].includes(x.s) ? '#1f8a4c' : x.s === 'Expiring' ? d.PAL.peach : d.PAL.tang, { solid: !['Valid','Accepted'].includes(x.s) }),
                `<div class="rowact">${U.btn('View', { act: 'stub', arg: 'Document viewer — ' + x.k })}${U.btn('Request new', { act: 'stub', arg: 'Resubmission requested by SMS' })}</div>`] }))),
              { pad: false, right: U.btn('Run expiry check', { act: 'expirySweep' }) })}
            ${U.panel('Performance', `
              ${U.defs([['Orders', f.orders.toLocaleString()], ['Completion rate', (f.completion || 0) + '%'],
                        ['Acceptance rate', (f.accept || 0) + '% <em class="sub">declining never affects their offers</em>'],
                        ['Cancellation rate', (f.cancel || 0) + '%'], ['State', U.tag(f.state, f.state === 'Active' ? '#1f8a4c' : f.state === 'Suspended' ? d.PAL.tang : d.PAL.lemon, { solid: f.state !== 'Active' })]])}
              ${f.orders ? `<div class="sub-h">Deliveries, last 7 days</div>${U.spark([12, 16, 14, 18, 21, 9, 15], d.PAL.lav, 46)}` : ''}`)}
            ${wd.length ? U.panel('Withdrawal requests', U.table(
              [{ t: 'Amount', num: true }, { t: 'Requested' }, { t: 'Method' }, { t: 'State' }, { t: 'Flag' }, { t: '', w: '170px' }],
              wd.map(w => ({ cells: [U.money(w.amount), U.esc(w.requested), U.esc(w.method),
                U.tag(w.state, w.state === 'Pending' ? d.PAL.lemon : d.PAL.tang, { solid: true }),
                w.flag ? U.esc(w.flag) : '<em class="sub">—</em>',
                `<div class="rowact">${w.state === 'Pending' ? U.btn('Approve', { kind: 'primary', act: 'approveWithdrawal', arg: w.id }) : U.btn('Review', { act: 'go', arg: '/payouts' })}</div>`] }))), { pad: false }) : ''}
          </div>
          <div class="stack">
            ${U.panel('Automatic rules', `<div class="steps">
              ${[['30 days before expiry', 'Flagged here, emailed and pushed to their app'],
                 ['7 days before', 'Reminder repeated daily'],
                 ['On expiry', 'Account auto-suspends — no more offers reach them'],
                 ['On resubmission', 'Back into the approval queue, usually cleared same day'],
                 ['While suspended', 'Withdrawals are held, not cancelled']].map(([t, s], i) =>
                `<div class="stp done"><span class="stp-n">${i + 1}</span><div><b>${t}</b><em>${s}</em></div></div>`).join('')}
            </div>`, { pad: false })}
            ${U.panel('Network supply', U.defs([
              ['Role', 'Supply only — freelancers never send orders'],
              ['Joined', f.state === 'Active' ? 'Automatically on approval' : 'Not participating'],
              ['Category switch', 'Freelancers as a category can be turned off in the Network module'],
              ['Offers', f.state === 'Active' ? 'By proximity, with a 20-second window' : 'None while suspended']
            ]))}
          </div>
        </div>`;
    }
  };

  /* ---------------- 12 Unified customer directory ---------------- */
  SCREENS['customers'] = {
    title: 'Customers', epic: 'Epic 12',
    render() {
      const d = D();
      const flagged = d.CUSTOMERS.filter(c => c.flagged);
      return U.page('Customer directory', 'One profile per person, across every merchant on the platform',
        U.btn('Export CSV', { act: 'export', arg: 'customers' })) +
        U.mode('dash', 'Only Dash sees this joined view. A merchant sees their own history with a customer; support needs all of it to settle an escalation.') + `
        <div class="kpis k-4">
          ${U.kpi('Customer profiles', '48,204', 'Keyed by phone number', d.PAL.lav)}
          ${U.kpi('Flagged', flagged.length + 186, 'Across one or more merchants', d.PAL.tang)}
          ${U.kpi('Multi-merchant', '61%', 'Order from two or more merchants', d.PAL.vodka)}
          ${U.kpi('Platform success rate', '95%', 'Delivered first attempt', d.PAL.flax)}
        </div>
        ${flagged.length ? U.note(U.esc(flagged[0].name) + ' is flagged by three merchants independently.',
          U.esc(flagged[0].note) + ' No single merchant could see that pattern — this joined view is the only place it shows.', d.PAL.tang) : ''}
        ${U.panel('', U.table(
          [{ t: 'Customer' }, { t: 'Phone' }, { t: 'Orders platform wide', num: true }, { t: 'Success', w: '130px' },
           { t: 'Merchants' }, { t: 'Last order' }, { t: 'Flag' }, { t: 'Support note' }],
          d.CUSTOMERS.map(c => ({ cells: [
            `<div class="who sm">${U.avatar(c.name)}<span>${U.esc(c.name)}</span></div>`, U.esc(c.phone), c.orders,
            `${c.success}% ${U.bar(c.success, c.success < 85 ? d.PAL.tang : d.PAL.lav)}`,
            c.merchants.map(m => `${U.esc(m.m)} <em class="sub">${m.n} · ${m.s}%</em>`).join(' '),
            U.esc(c.last),
            c.flagged ? U.tag('Flagged', d.PAL.tang, { solid: true }) : '—',
            c.note ? U.esc(c.note) : '<em class="sub">—</em>'] }))), { pad: false })}
        ${U.panel('Why the joined view matters', U.defs([
          ['A merchant sees', 'Only their own orders with a customer — 12 orders, 83% success'],
          ['Dash sees', 'All 34 across three merchants — 74% success, four refusals in one month'],
          ['Support uses it', 'To judge whether a merchant complaint about a provider is really about the customer'],
          ['We never', 'Share one merchant’s history with another. The joined view is internal only.']
        ]))}`;
    }
  };
})();
