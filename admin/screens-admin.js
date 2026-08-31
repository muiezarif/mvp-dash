/* Dash Admin — Billing and revenue (10), Payouts and settlement (10b),
   Support (11), Announcements (13), Reports (14), Team (15), Settings (16), Audit (17), Notifications */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.ADM;
  window.STATE = window.STATE || {};
  STATE.bt = STATE.bt || 'Revenue';
  STATE.tf = STATE.tf || { status: 'All statuses', product: 'All products', assignee: 'All assignees' };

  /* ---------------- 10 Billing and revenue ---------------- */
  SCREENS['billing'] = {
    title: 'Billing', epic: 'Epic 10',
    render() {
      const d = D(), r = d.REVENUE, tab = STATE.bt;

      const revenue = `
        <div class="kpis k-4">
          ${U.kpi('Monthly recurring revenue', U.money(r.mrr), 'Subscriptions and commission', d.PAL.flax)}
          ${U.kpi('Subscriptions', U.money(r.subs), Math.round(r.subs / r.mrr * 100) + '% of MRR · 195 clients', d.PAL.lav)}
          ${U.kpi('Network commission', U.money(r.commission), Math.round(r.commission / r.mrr * 100) + '% of MRR', d.PAL.vodka)}
          ${U.kpi('Other', U.money(r.other), 'Overage, setup, custom work', d.PAL.peach)}
        </div>
        ${U.panel('Where the money comes from', `
          <div class="zonebars">
            ${[['Subscriptions', r.subs, d.PAL.lav, 'Fixed monthly fee per client, per product'],
               ['Network commission', r.commission, d.PAL.vodka, '8% margin on orders the engine routed'],
               ['Other', r.other, d.PAL.peach, 'API overage and one-off work']].map(([n, v, c, why]) =>
              `<div class="zb"><span>${n}</span>${U.bar(v / r.mrr * 100, c)}<em>${U.money(v)} · ${U.esc(why)}</em></div>`).join('')}
          </div>
          ${U.note('Marketplace orders earn nothing per order.', 'They are billed merchant to provider on a contract Dash never sees the money for. The Marketplace pays for itself through the subscriptions that unlock it — 14,610 orders a month at zero direct margin, and that is by design.', d.PAL.vodka)}`)}
        ${U.panel('Plans across all three products', U.table(
          [{ t: 'Plan' }, { t: 'Product' }, { t: 'Monthly', num: true }, { t: 'Included' }, { t: 'Clients', num: true }, { t: 'Revenue', num: true }, { t: '', w: '110px' }],
          d.PLANS.map(p => ({ cells: [`<b>${U.esc(p.n)}</b>`, U.tag(p.product, p.product === 'Merchant' ? d.PAL.peach : p.product === 'DMS' ? d.PAL.lav : d.PAL.vodka),
            p.p === null ? '<em class="sub">Custom</em>' : p.p === 0 ? 'Free' : U.money(p.p), U.esc(p.cap), p.clients,
            p.p ? U.money(p.p * p.clients) : '<em class="sub">—</em>',
            `<div class="rowact">${U.btn('Edit', { act: 'stub', arg: 'Plan editor — price, caps and features' })}</div>`] }))), { pad: false })}
        ${U.panel('Client invoices', U.table(
          [{ t: 'Invoice' }, { t: 'Client' }, { t: 'Amount', num: true }, { t: 'Due' }, { t: 'Status' }, { t: '', w: '170px' }],
          r.invoices.map(i => ({ cells: [`<b>${i.id}</b>`, U.esc(i.client), U.money(i.amount), U.esc(i.due),
            U.tag(i.status, i.status === 'Paid' ? '#1f8a4c' : i.status === 'Overdue' ? d.PAL.tang : d.PAL.lemon, { solid: i.status !== 'Paid' }),
            `<div class="rowact">${U.btn('PDF', { act: 'stub', arg: 'Invoice downloaded' })}${i.status === 'Overdue' ? U.btn('Chase', { kind: 'danger', act: 'stub', arg: 'Reminder sent, escalated to Finance' }) : ''}</div>`] }))), { pad: false })}`;

      const settlement = `
        <div class="kpis k-4">
          ${U.kpi('Network orders', r.networkOrders.toLocaleString(), 'Routed by the engine this month', d.PAL.vodka)}
          ${U.kpi('Charged to senders', U.money(r.networkGross), 'What merchants and clients paid', d.PAL.peach)}
          ${U.kpi('Paid to supply', U.money(r.networkPayout), 'What carriers received', d.PAL.lav)}
          ${U.kpi('Dash margin', U.money(r.margin), r.marginPct + '% — the whole Network business', '#1f8a4c')}
        </div>
        ${U.note('Only Network orders settle through Dash.', 'Direct and Marketplace orders are billed between the two parties — Dash records them for reconciliation but never touches the money. That is why order source is a first-class attribute.', d.PAL.vodka)}
        ${U.panel('Settlement by supply node', U.table(
          [{ t: 'Supply node' }, { t: 'Type' }, { t: 'Orders', num: true }, { t: 'Charged to sender', num: true }, { t: 'Paid to node', num: true }, { t: 'Dash margin', num: true }, { t: 'Rate', num: true }],
          r.settlement.map(s => ({ cells: [`<b>${U.esc(s.node)}</b>`, U.esc(s.type), s.orders.toLocaleString(),
            U.money(s.gross), U.money(s.payout), `<b>${U.money(s.margin)}</b>`, Math.round(s.margin / s.gross * 100) + '%'] }))), { pad: false })}
        ${U.panel('Why freelancers carry a wider margin', U.defs([
          ['Freelancer pool', '20% — Dash provides their entire administration: onboarding, documents, payouts, support'],
          ['3PLs and DMS clients', '8% — they run their own operation and pay a subscription on top'],
          ['Which means', 'The pool is both the cheapest supply to reach and the most profitable to route to'],
          ['And the risk', 'Over-routing to freelancers starves the 3PLs whose subscriptions we also depend on']
        ]))}`;

      const disputes = `
        <div class="kpis k-4">
          ${U.kpi('Open disputes', r.disputes.filter(x => x.state === 'Open').length, 'Between two parties on the platform', d.PAL.tang)}
          ${U.kpi('Value under dispute', U.money(r.disputes.filter(x => x.state === 'Open').reduce((s, x) => s + x.amount, 0)), 'Small amounts, large trust cost', d.PAL.peach)}
          ${U.kpi('Resolved this month', r.disputes.filter(x => x.state === 'Resolved').length, 'Median 2 days', '#1f8a4c')}
          ${U.kpi('Held withdrawals', r.withdrawals.filter(w => w.state !== 'Pending').length, 'Suspended or negative wallet', d.PAL.lemon)}
        </div>
        ${U.note('Dash arbitrates because Dash holds both records.', 'A merchant says the driver never called; the provider says they did. Dash has the status history from both systems, so the argument is settled here rather than between them.', d.PAL.lav)}
        ${U.panel('Disputes', U.table(
          [{ t: 'Dispute' }, { t: 'Order' }, { t: 'Between' }, { t: 'Amount', num: true }, { t: 'What is contested' }, { t: 'Raised' }, { t: 'State' }, { t: '', w: '210px' }],
          r.disputes.map(x => ({ cells: [`<b>${x.id.toUpperCase()}</b>`,
            `<a href="#/control-tower/${x.order}">${x.order}</a>`, U.esc(x.between), U.money(x.amount), U.esc(x.about), U.esc(x.raised),
            U.tag(x.state, x.state === 'Resolved' ? '#1f8a4c' : d.PAL.tang, { solid: x.state !== 'Resolved' }),
            `<div class="rowact">${x.state === 'Open'
              ? U.btn('Rule for sender', { act: 'ruleDispute', arg: x.id + '|sender' }) + U.btn('Rule for carrier', { act: 'ruleDispute', arg: x.id + '|carrier' })
              : '<em class="sub">Closed</em>'}</div>`] }))), { pad: false })}`;

      return U.page('Billing and revenue', 'What Dash earns, what Dash owes, and what is being argued over',
        U.btn('Payouts', { kind: 'primary', act: 'go', arg: '/payouts' }) + U.btn('Export CSV', { act: 'export', arg: 'revenue' })) +
        U.mode('dash', 'Plans, pricing, commission rates and dispute rulings are all ours to set.') + `
        ${U.tabs(['Revenue', 'Network settlement', 'Disputes'], tab, 'billTab')}
        ${tab === 'Network settlement' ? settlement : tab === 'Disputes' ? disputes : revenue}`;
    }
  };

  /* ---------------- Payouts ---------------- */
  SCREENS['payouts'] = {
    title: 'Payouts', epic: 'Epic 10',
    render() {
      const d = D(), w = d.REVENUE.withdrawals;
      const pending = w.filter(x => x.state === 'Pending');
      const held = w.filter(x => x.state !== 'Pending');
      return U.page('Payouts and withdrawals', 'Money leaving Dash — to freelancers and to provider companies',
        U.btn('Approve all clean requests', { kind: 'primary', act: 'approveAllWithdrawals' }) + U.btn('Back to billing', { act: 'go', arg: '/billing' })) + `
        <div class="kpis k-4">
          ${U.kpi('Pending requests', pending.length, U.money(pending.reduce((s, x) => s + x.amount, 0)) + ' in total', d.PAL.lemon)}
          ${U.kpi('Held or blocked', held.length, 'Flagged before release', d.PAL.tang)}
          ${U.kpi('Paid this month', U.money(90712), '4,594 payouts', '#1f8a4c')}
          ${U.kpi('Next scheduled run', 'Sunday', 'Weekly, 08:00', d.PAL.lav)}
        </div>
        ${held.length ? U.note(held.length + ' withdrawals are not going out.',
          held.map(x => `<b>${U.esc(x.who)}</b> — ${U.esc(x.flag)}`).join(' · ') + '. Held money is never cancelled; it waits until the reason clears.', d.PAL.tang) : ''}
        ${U.panel('', U.table(
          [{ t: 'Requester' }, { t: 'Type' }, { t: 'Amount', num: true }, { t: 'Requested' }, { t: 'Method' }, { t: 'State' }, { t: 'Flag' }, { t: '', w: '230px' }],
          w.map(x => ({ cells: [`<b>${U.esc(x.who)}</b>`,
            U.tag(x.type, x.type === 'Freelancer' ? d.PAL.lav : d.PAL.vodka),
            x.amount ? U.money(x.amount) : '<em class="sub">—</em>', U.esc(x.requested), U.esc(x.method),
            U.tag(x.state, x.state === 'Pending' ? d.PAL.lemon : x.state === 'Held' ? d.PAL.peach : d.PAL.tang, { solid: true }),
            x.flag ? U.esc(x.flag) : '<em class="sub">Clean</em>',
            `<div class="rowact">${x.state === 'Pending'
              ? U.btn('Approve', { kind: 'primary', act: 'approveWithdrawal', arg: x.id }) + U.btn('Hold', { act: 'holdWithdrawal', arg: x.id })
              : x.state === 'Held' ? U.btn('Release', { kind: 'primary', act: 'approveWithdrawal', arg: x.id })
              : '<em class="sub">Cannot pay a negative wallet</em>'}</div>`] }))), { pad: false })}
        ${U.panel('Rules', U.defs([
          ['Suspended account', 'Withdrawal is held, not cancelled — it releases the moment they are reinstated'],
          ['Negative wallet', 'Blocked. Nuqta owes Dash SAR 320 before anything is paid out.'],
          ['Documents expiring', 'Flagged but payable — an expiring licence is not a reason to withhold earned money'],
          ['Disputed orders', 'The disputed amount is withheld; the rest of the balance is released']
        ]))}`;
    }
  };

  /* ---------------- 11 Support ---------------- */
  SCREENS['support'] = {
    title: 'Support', epic: 'Epic 11',
    render() {
      const d = D(), f = STATE.tf;
      const rows = d.TICKETS.filter(t =>
        (f.status === 'All statuses' || t.s === f.status) &&
        (f.product === 'All products' || t.product === f.product) &&
        (f.assignee === 'All assignees' || t.assignee === f.assignee));
      const open = d.TICKETS.filter(t => t.s === 'Open');
      return U.page('Support — Dash Hub', 'Every ticket from every product, in one queue',
        U.btn('Export CSV', { act: 'export', arg: 'tickets' })) +
        U.mode('dash', 'Tickets arrive from Dash Merchant, Dash DMS, Dash 3PL and the Freelancer App. Support sees the whole record from both sides, which is why disputes land here.') + `
        <div class="kpis k-4">
          ${U.kpi('Open', open.length, open.filter(t => t.p === 'High').length + ' high priority', d.PAL.lemon)}
          ${U.kpi('Unassigned', d.TICKETS.filter(t => t.assignee === 'Unassigned').length, 'Nobody has picked it up', d.PAL.tang)}
          ${U.kpi('Pending client', d.TICKETS.filter(t => t.s === 'Pending').length, 'Waiting on them, not us', d.PAL.peach)}
          ${U.kpi('Resolved this month', 84, 'Median 6 h', '#1f8a4c')}
        </div>
        ${U.note('Two tickets, one incident.',
          'TK-3312 (Kanz says Sahel returned an order without calling) and TK-4420 (Sahel disputes the return charge) are the same order, DX-40998, from both sides. Support reads both, sees the customer is flagged platform-wide, and rules once. '
          + U.btn('Open DX-40998', { kind: 'primary', act: 'go', arg: '/control-tower/DX-40998' }), d.PAL.lav)}
        ${U.filters([
          `<span class="f-l">Status</span>` + U.select(['All statuses', 'Open', 'Pending', 'Resolved'], f.status, { act: 'tfF', arg: 'status' }),
          `<span class="f-l">Product</span>` + U.select(['All products', ...[...new Set(d.TICKETS.map(t => t.product))]], f.product, { act: 'tfF', arg: 'product' }),
          `<span class="f-l">Assignee</span>` + U.select(['All assignees', ...[...new Set(d.TICKETS.map(t => t.assignee))]], f.assignee, { act: 'tfF', arg: 'assignee' }),
          `<span class="f-sp"></span><span class="f-c">${rows.length} of ${d.TICKETS.length}</span>`
        ])}
        ${U.panel('', U.table(
          [{ t: 'Ticket' }, { t: 'From' }, { t: 'Product' }, { t: 'Kind' }, { t: 'Subject' }, { t: 'Linked' },
           { t: 'Priority' }, { t: 'Status' }, { t: 'Assignee' }, { t: 'Opened' }, { t: 'Last update' }, { t: '', w: '190px' }],
          rows.map(t => ({ cells: [`<b>${t.id}</b>`, U.esc(t.from), U.esc(t.product), U.esc(t.kind), U.esc(t.t),
            t.link.startsWith('DX') ? `<a href="#/control-tower/${t.link}">${t.link}</a>` : `<code>${U.esc(t.link)}</code>`,
            U.tag(t.p, t.p === 'High' ? d.PAL.tang : d.PAL.lav),
            U.tag(t.s, t.s === 'Resolved' ? '#1f8a4c' : t.s === 'Open' ? d.PAL.lemon : d.PAL.peach, { solid: t.s !== 'Resolved' }),
            t.assignee === 'Unassigned' ? '<em class="warn">Unassigned</em>' : U.esc(t.assignee),
            U.esc(t.opened), U.esc(t.last),
            `<div class="rowact">${t.s !== 'Resolved'
              ? (t.assignee === 'Unassigned' ? U.btn('Assign to me', { kind: 'primary', act: 'assignTicket', arg: t.id }) : U.btn('Reply', { act: 'stub', arg: 'Reply composer' })) + U.btn('Resolve', { act: 'resolveTicket', arg: t.id })
              : '<em class="sub">Closed</em>'}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 13 Announcements ---------------- */
  SCREENS['announcements'] = {
    title: 'Announcements', epic: 'Epic 13',
    render() {
      const d = D();
      return U.page('Announcements', 'Platform messages to clients — maintenance, policy, releases',
        U.btn('New announcement', { kind: 'primary', act: 'newAnnouncement' })) +
        U.mode('dash', 'Dash speaks to its clients here. Never to their customers — that boundary holds across every product.') + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Sent and drafted', U.table(
              [{ t: 'Announcement' }, { t: 'Kind' }, { t: 'Audience' }, { t: 'Reach', num: true }, { t: 'Sent' }, { t: 'State' }, { t: '', w: '170px' }],
              d.ANNOUNCEMENTS.map(a => ({ cells: [`<b>${U.esc(a.t)}</b><em class="sub">${U.esc(a.body)}</em>`,
                U.tag(a.kind, a.kind === 'Maintenance' ? d.PAL.peach : a.kind === 'Policy' ? d.PAL.lav : a.kind === 'Release' ? d.PAL.vodka : d.PAL.lemon),
                U.esc(a.audience), a.reach, U.esc(a.sent),
                U.tag(a.state, a.state === 'Sent' ? '#1f8a4c' : d.PAL.lemon, { solid: a.state !== 'Sent' }),
                `<div class="rowact">${a.state === 'Draft' ? U.btn('Send now', { kind: 'primary', act: 'sendAnnouncement', arg: a.id }) + U.btn('Edit', { act: 'stub', arg: 'Announcement editor' }) : U.btn('View', { act: 'stub', arg: 'Delivery report' })}</div>`] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Compose', `
              ${U.field('Kind', U.select(['Maintenance', 'Policy', 'Release', 'Notice'], 'Notice'))}
              ${U.field('Audience', U.select(['All clients', 'Merchants only', '3PLs and DMS clients', 'Freelancers', 'Supply nodes · Zone West', 'Merchants on Salla'], 'All clients'),
                'Audience is resolved when you send, so a client verified tomorrow will not receive today’s message')}
              ${U.field('Title', U.input('', 'Zone West supply shortage — pricing incentive'))}
              ${U.field('Body', `<textarea class="in" rows="4" placeholder="Plain words. Clients read these in a hurry."></textarea>`)}
              ${U.field('Channels', `<div class="chips"><button type="button" class="chip on" data-act="stub" data-arg="Dashboard banner">Dashboard banner</button><button type="button" class="chip on" data-act="stub" data-arg="Email">Email</button><button type="button" class="chip" data-act="stub" data-arg="Push">Push</button></div>`)}
              <div class="btnrow">${U.btn('Send', { kind: 'primary', act: 'newAnnouncement' })}${U.btn('Save draft', { act: 'stub', arg: 'Saved as a draft' })}</div>`)}
          </div>
        </div>`;
    }
  };

  /* ---------------- 14 Reports ---------------- */
  SCREENS['reports'] = {
    title: 'Reports', epic: 'Epic 14',
    render() {
      const d = D(), p = d.PLATFORM;
      return U.page('Platform reports', 'Cross-product analytics and scheduled exports',
        U.btn('Export CSV', { kind: 'primary', act: 'export', arg: 'platform-report' }) + U.btn('Export PDF', { act: 'export', arg: 'platform-pdf' }) +
        U.btn('Schedule', { act: 'scheduleReport' })) + `
        ${U.filters([
          `<span class="f-l">Range</span>` + U.select(['Today', 'Last 7 days', 'Last 30 days', 'This month', 'This year'], 'Last 30 days', { act: 'stub' }),
          `<span class="f-l">Product</span>` + U.select(['All products', 'Dash Merchant', 'Dash DMS', 'Dash 3PL'], 'All products', { act: 'stub' }),
          `<span class="f-l">Source</span>` + U.select(['All sources', 'Direct', 'Marketplace', 'Dash Network'], 'All sources', { act: 'stub' }),
          `<span class="f-l">Zone</span>` + U.select(['All zones', ...d.NETWORK.monitor.zones.map(z => z.z.split(' — ')[0])], 'All zones', { act: 'stub' }),
          `<span class="f-sp"></span><span class="f-c">52,180 orders in range</span>`
        ])}
        <div class="kpis k-4">
          ${U.kpi('Orders', p.orders.month.toLocaleString(), '+6.7% on July', d.PAL.peach)}
          ${U.kpi('Clients', 195, '+17 this month', d.PAL.lav)}
          ${U.kpi('Platform on-time', '94%', 'Target 95%', d.PAL.flax)}
          ${U.kpi('Revenue', U.money(d.REVENUE.mrr), '+8.2% on July', '#1f8a4c')}
        </div>
        <div class="cols c-1-1">
          ${U.panel('Growth — clients and orders', `
            <div class="wk big">${p.growth.map(g => `<div class="wk-c">
              <span class="wk-b" style="height:${g.orders / 56000 * 100}%;background:${d.PAL.lav}"></span>
              <span class="wk-l">${g.m}</span><span class="wk-v">${g.clients}</span></div>`).join('')}</div>
            <div class="legend">Bars are orders; the figure above each is client count that month</div>`)}
          ${U.panel('Volume by product', U.table(
            [{ t: 'Product' }, { t: 'Orders', num: true }, { t: 'Share', w: '150px' }, { t: 'Clients', num: true }],
            p.byProduct.map(x => ({ cells: [U.esc(x.p), x.orders.toLocaleString(), `${x.share}% ${U.bar(x.share, d.PAL.peach)}`, x.clients] }))), { pad: false })}
        </div>
        <div class="cols c-1-1">
          ${U.panel('Volume by source', U.table(
            [{ t: 'Source' }, { t: 'Orders', num: true }, { t: 'Share', w: '150px' }, { t: 'Dash margin' }],
            p.bySource.map(x => ({ cells: [U.tag(x.s, x.s === 'Dash Network' ? d.PAL.vodka : x.s === 'Marketplace' ? d.PAL.lav : d.PAL.peach),
              x.orders.toLocaleString(), `${x.share}% ${U.bar(x.share, d.PAL.vodka)}`,
              x.s === 'Dash Network' ? U.money(d.REVENUE.margin) : '<em class="sub">None — billed party to party</em>'] }))), { pad: false })}
          ${U.panel('Performance by zone', U.table(
            [{ t: 'Zone' }, { t: 'Demand', num: true }, { t: 'Supply', num: true }, { t: 'Balance' }],
            d.NETWORK.monitor.zones.map(z => ({ cells: [U.esc(z.z), z.demand, z.supply,
              U.tag(z.state, z.state === 'Healthy' ? '#1f8a4c' : z.state === 'Critical' ? d.PAL.tang : d.PAL.peach, { solid: z.state !== 'Healthy' })] }))), { pad: false })}
        </div>
        ${U.panel('Scheduled reports', U.table(
          [{ t: 'Report' }, { t: 'Recipients' }, { t: 'Schedule' }, { t: 'Format' }, { t: '', w: '150px' }],
          [['Daily platform summary', 'ops@dash.sa', 'Every day 23:45', 'PDF'],
           ['Weekly network health', 'dana@dash.sa, khalid@dash.sa', 'Sunday 08:00', 'PDF'],
           ['Monthly revenue and settlement', 'finance@dash.sa', '1st of the month', 'CSV'],
           ['Client growth', 'board@dash.sa', '1st of the month', 'PDF']]
            .map(([n, to, when, fmt]) => ({ cells: [U.esc(n), U.esc(to), U.esc(when), fmt,
              `<div class="rowact">${U.btn('Edit', { act: 'stub', arg: 'Edit schedule' })}${U.btn('Pause', { act: 'stub', arg: 'Schedule paused' })}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 15 Team management ---------------- */
  SCREENS['team'] = {
    title: 'Team', epic: 'Epic 15',
    render() {
      const d = D(), m = d.ROLE_MATRIX;
      const cls = v => v === 'Full' ? 'p-full' : v === 'None' ? 'p-none' : 'p-view';
      return U.page('Team and permissions', 'Internal Dash staff — not clients',
        U.btn('Invite team member', { kind: 'primary', act: 'stub', arg: 'Invitation sent' }) + U.btn('Create custom role', { act: 'stub', arg: 'Custom role builder' })) +
        U.mode('dash', 'These are Dash employees. Client team management lives inside each client’s own product.') + `
        ${U.note('Only Super Admin can touch the destructive controls.', 'Suspending a client, ruling a dispute, changing commission, or turning off Dash Network. Operations can run the network day to day but cannot switch it off.', d.PAL.tang)}
        ${U.panel('Permission matrix', `<div class="tw"><table class="tbl matrix">
          <thead><tr><th>Area</th>${Object.keys(m.roles).map(r => `<th>${r}</th>`).join('')}</tr></thead>
          <tbody>${m.areas.map((a, i) => `<tr><td><b>${a}</b></td>${Object.keys(m.roles).map(r => `<td class="${cls(m.roles[r][i])}">${m.roles[r][i]}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`, { pad: false })}
        ${U.panel('Team', U.table(
          [{ t: 'Member' }, { t: 'Email' }, { t: 'Role' }, { t: 'Two factor' }, { t: 'Joined' }, { t: 'Last active' }, { t: '', w: '170px' }],
          d.TEAM.map(t => ({ cells: [
            `<div class="who sm">${U.avatar(t.name)}<span>${U.esc(t.name)}</span></div>`, U.esc(t.email),
            U.tag(t.role, t.role === 'Super Admin' ? d.PAL.tang : d.PAL.lav, { solid: t.role === 'Super Admin' }),
            t.tfa ? U.tag('On', '#1f8a4c') : U.tag('Off', d.PAL.tang, { solid: true }),
            U.esc(t.joined), U.esc(t.last),
            `<div class="rowact">${U.btn('Change role', { act: 'stub', arg: 'Role changed' })}${t.id === 't1' ? '<em class="sub">You</em>' : U.btn('Remove', { kind: 'danger', act: 'stub', arg: 'Member removed' })}</div>`] }))), { pad: false })}
        ${d.TEAM.some(t => !t.tfa) ? U.note('One member has two factor off.',
          U.esc(d.TEAM.find(t => !t.tfa).name) + ' holds a Support role with access to the customer directory. Two factor should be mandatory for anyone who can read customer data.', d.PAL.tang) : ''}`;
    }
  };

  /* ---------------- 16 System settings ---------------- */
  SCREENS['settings'] = {
    title: 'System settings', epic: 'Epic 16',
    render() {
      const d = D(), s = d.SETTINGS;
      return U.page('System settings', 'Platform-wide configuration — order statuses, notification templates, languages',
        U.btn('Save changes', { kind: 'primary', act: 'stub', arg: 'Settings saved platform wide' })) +
        U.mode('dash', 'Changing anything here changes it in every product at once. An order status added here appears in Merchant, DMS and 3PL immediately.') + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('Order status definitions', U.table(
              [{ t: 'Status' }, { t: 'Who sets it' }, { t: 'Can move to' }, { t: '', w: '110px' }],
              s.statuses.map(x => ({ cells: [U.statusTag(x.s), U.esc(x.who), U.esc(x.next),
                `<div class="rowact">${U.btn('Edit', { act: 'stub', arg: 'Status editor — transitions and permissions' })}</div>`] }))),
              { pad: false, right: U.btn('Add status', { act: 'stub', arg: 'New status — define who sets it and what follows' }) })}
            ${U.note('Statuses are a shared contract.', 'Every product, the API and both driver apps agree on this list. Adding one is a platform change, not a cosmetic one — which is why it lives here and not in any single product.', d.PAL.lemon)}
            ${U.panel('Notification templates', U.table(
              [{ t: 'Template' }, { t: 'Channels' }, { t: 'Sent to' }, { t: 'Enabled' }, { t: '', w: '110px' }],
              s.templates.map(t => ({ cells: [`<b>${U.esc(t.n)}</b>`, U.esc(t.ch), U.esc(t.to),
                U.toggle(t.on, 'stub', ''),
                `<div class="rowact">${U.btn('Edit', { act: 'stub', arg: 'Template editor — wording per language' })}</div>`] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Languages and currencies', `
              ${U.field('Supported languages', `<div class="chips">${s.langs.map(l => `<button type="button" class="chip on" data-act="stub" data-arg="${l}">${l}</button>`).join('')}<button type="button" class="chip" data-act="stub" data-arg="Add a language">+ Add</button></div>`,
                'Every client picks their own from this list')}
              ${U.field('Supported currencies', `<div class="chips">${s.currencies.map(c => `<button type="button" class="chip ${c.startsWith('SAR') ? 'on' : ''}" data-act="stub" data-arg="${c}">${c.split(' —')[0]}</button>`).join('')}</div>`,
                'Dash settles in SAR regardless — this is display and invoicing only')}
              ${U.field('Platform default timezone', U.select(['Asia/Riyadh (GMT+3)', 'UTC'], 'Asia/Riyadh (GMT+3)'))}`)}
            ${U.panel('Platform zones', `${U.defs([
              ['Defined here', 'Five zones covering Riyadh'],
              ['Used by', 'Network routing, Marketplace coverage claims, all zone reporting'],
              ['Not the same as', 'A DMS client’s own operational zones, which they draw themselves'],
              ['Geometry', 'Specified in the routing session — scoped, not yet drawn']
            ])}<div class="btnrow">${U.btn('Routing engine', { act: 'go', arg: '/routing' })}</div>`)}
            ${U.panel('Developer Portal', `${U.defs([
              ['Status', U.tag('Deferred', d.PAL.lemon, { solid: true })],
              ['Today', 'API keys and webhooks are configured inside each client product'],
              ['Planned', 'Public documentation, sandbox with simulated drivers, key self-service'],
              ['Owner', 'Dash — a separate product surface, not part of Admin']
            ])}`)}
          </div>
        </div>`;
    }
  };

  /* ---------------- 17 Audit log ---------------- */
  SCREENS['audit'] = {
    title: 'Audit log', epic: 'Epic 17',
    render() {
      const d = D();
      return U.page('Audit log', 'Every internal action — including the ones the engine took by itself',
        U.btn('Export log', { kind: 'primary', act: 'export', arg: 'audit' })) + `
        ${U.filters([
          U.input('', 'Search action or record…', { act: 'stub' }),
          `<span class="f-l">Actor</span>` + U.select(['All actors', ...d.TEAM.map(t => t.name), 'Dash Network', 'System'], 'All actors', { act: 'stub' }),
          `<span class="f-l">Role</span>` + U.select(['All roles', 'Super Admin', 'Operations', 'Finance', 'Support', 'System'], 'All roles', { act: 'stub' }),
          `<span class="f-l">Range</span>` + U.select(['Today', 'Last 7 days', 'Last 30 days'], 'Today', { act: 'stub' }),
          `<span class="f-sp"></span><span class="f-c">${d.AUDIT.length} entries today</span>`
        ])}
        ${U.panel('', U.table(
          [{ t: 'Time' }, { t: 'Actor' }, { t: 'Role' }, { t: 'Action' }, { t: 'Record' }, { t: 'IP' }],
          d.AUDIT.map(a => ({ cells: [a.t, U.esc(a.u),
            a.r === 'System' ? '<em class="sub">System</em>' : U.tag(a.r, a.r === 'Super Admin' ? d.PAL.tang : d.PAL.lav, { solid: a.r === 'Super Admin' }),
            `<b>${U.esc(a.a)}</b>`, `<code>${U.esc(a.o)}</code>`, a.ip] }))), { pad: false })}
        ${U.note('Admin actions carry the most weight on the platform.',
          'Suspending a client, featuring a listing, ruling a dispute, changing a commission rate — each one moves someone’s money or reputation. The log is append-only and nobody, including a Super Admin, can edit it.', d.PAL.tang)}`;
    }
  };

  /* ---------------- Notifications ---------------- */
  SCREENS['notifications'] = {
    title: 'Notifications', epic: 'Epics 03 · 13',
    render() {
      const d = D();
      return U.page('Internal notifications', 'What the platform is telling the operations team',
        U.btn('Mark all read', { act: 'stub', arg: 'All marked read' })) + `
        <div class="cols c-2-1">
          ${U.panel('Inbox', `<div class="alerts">${d.NOTIFS.map(n => `
            <a class="alert s-${n.sev}" href="${n.link}"><span class="alert-k">${n.k}</span>
              <span class="alert-t">${U.esc(n.t)}</span><span class="alert-d">${n.d}</span></a>`).join('')}</div>`, { pad: false })}
          ${U.panel('Routing', `${U.defs([
            ['Escalations and stuck orders', 'Operations'],
            ['Verification and join requests', 'Operations'],
            ['Payouts, disputes, overdue invoices', 'Finance'],
            ['Tickets', 'Support'],
            ['Network critical — a zone with no supply', 'Operations and Super Admin'],
            ['Nothing here goes to clients', 'Client-facing messages go through Announcements']
          ])}<div class="btnrow">${U.btn('Announcements', { act: 'go', arg: '/announcements' })}</div>`)}
        </div>`;
    }
  };
})();
