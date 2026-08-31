/* Dash DMS — Onboarding (01), Auth (02), Account settings (03), Roles (21),
   Notifications (22), Billing (23), Developer (24), Support (25), Audit (26) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.DMS;
  window.STATE = window.STATE || {};
  STATE.acct = STATE.acct || { lang: 'English', tz: 'Asia/Riyadh (GMT+3)', cur: 'SAR — Saudi Riyal' };
  STATE.notifPrefs = STATE.notifPrefs || { order: true, driver: true, docs: true, cash: true, system: false };

  /* ---------------- 01 Onboarding and verification ---------------- */
  SCREENS['onboarding'] = {
    title: 'Verification', epic: 'Epic 01',
    render() {
      const d = D();
      const steps = [
        ['Account created', 'Self signup with a work email', true],
        ['Business profile', 'Legal name, CR number, logo, head office address', true],
        ['Documents submitted', 'Commercial registration, VAT certificate, owner ID', true],
        ['Dash review', 'Verified 6 August 2026 by Dash Operations', true],
        ['Fleet setup wizard', '10 drivers, 11 vehicles, 5 zones, 3 shifts', true],
        ['Network and Marketplace', 'Supply and Demand approved · listing live', true]
      ];
      return U.page('Onboarding and verification', 'Rehla Fleet · verified account',
        U.btn('Download verification letter', { act: 'stub', arg: 'PDF letter' })) + `
        ${U.note('Verified — full access.', 'Before verification an account can log in, look around and configure settings, but cannot create records, join Dash Network or use the Marketplace.', '#1f8a4c')}
        ${U.panel('Progress', `<div class="steps">${steps.map(([t, s, done], i) => `
          <div class="stp ${done ? 'done' : ''}"><span class="stp-n">${done ? '✓' : i + 1}</span>
            <div><b>${t}</b><em>${s}</em></div></div>`).join('')}</div>`, { pad: false })}
        <div class="cols c-1-1">
          ${U.panel('Business profile', U.defs([
            ['Legal name', 'Rehla Logistics Company'], ['Trade name', 'Rehla Fleet'],
            ['CR number', '1010xxxx41'], ['VAT number', '3005xxxxxx0003'],
            ['Head office', 'Al Malqa, Riyadh 13521'], ['Fleet size', '240 drivers · 5 zones'],
            ['Account state', U.tag('Verified', '#1f8a4c')]
          ]), { right: U.btn('Edit profile', { act: 'stub', arg: 'Edit business profile' }) })}
          ${U.panel('Documents', U.table(
            [{ t: 'Document' }, { t: 'Uploaded' }, { t: 'Status' }],
            [['Commercial registration', '2 August 2026', 'Accepted'], ['VAT certificate', '2 August 2026', 'Accepted'],
             ['Owner national ID', '2 August 2026', 'Accepted'], ['Fleet insurance summary', '3 August 2026', 'Accepted']]
              .map(([k, u, s]) => ({ cells: [k, u, U.tag(s, '#1f8a4c')] }))), { pad: false })}
        </div>
        ${U.panel('If Dash rejects a submission', `${U.defs([
          ['What you see', 'The reason Dash recorded, in plain words, on this page'],
          ['What still works', 'Login, browsing, settings, inviting your team'],
          ['What is blocked', 'Creating drivers, vehicles, merchants and orders; Dash Network; the Marketplace'],
          ['Resubmission', 'Unlimited — upload a corrected document and the queue picks it up again']
        ])}`)}`;
    }
  };

  /* ---------------- 02 Authentication and sessions ---------------- */
  SCREENS['security'] = {
    title: 'Security', epic: 'Epic 02',
    render() {
      return U.page('Authentication and sessions', 'Login, two factor and where your account is signed in',
        U.btn('Sign out everywhere', { kind: 'danger', act: 'stub', arg: 'All other sessions revoked' })) + `
        <div class="cols c-1-1">
          ${U.panel('Login', `
            ${U.field('Email', U.input('sara@rehla.sa'))}
            ${U.field('Password', U.input('••••••••••', '', { type: 'password' }), 'Last changed 14 July 2026')}
            <div class="btnrow">${U.btn('Change password', { act: 'stub', arg: 'Password change email sent' })}${U.btn('Send reset link', { act: 'stub', arg: 'Reset link sent to sara@rehla.sa' })}</div>`)}
          ${U.panel('Two factor authentication', `
            ${U.field('Status', U.toggle(true, 'stub', '', 'Enabled — authenticator app'))}
            ${U.defs([['Method', 'Time-based one-time code'], ['Backup codes', '8 of 10 unused'], ['Enforced for', 'Admin and Finance roles']])}
            <div class="btnrow">${U.btn('Regenerate backup codes', { act: 'stub', arg: 'New backup codes generated' })}</div>`)}
        </div>
        ${U.panel('Active sessions', U.table(
          [{ t: 'Device' }, { t: 'Location' }, { t: 'IP' }, { t: 'Last active' }, { t: '', w: '130px' }],
          [['Chrome · macOS (this device)', 'Riyadh, SA', '188.55.x.x', 'Now'],
           ['Safari · iPhone', 'Riyadh, SA', '188.55.x.x', '2 h ago'],
           ['Chrome · Windows', 'Jeddah, SA', '94.98.x.x', 'Yesterday']]
            .map(([d1, l, ip, t], i) => ({ cells: [d1, l, ip, t, i === 0 ? '<em class="sub">Current</em>' : U.btn('Revoke', { act: 'stub', arg: 'Session revoked' })] }))), { pad: false })}`;
    }
  };

  /* ---------------- 03 Account settings ---------------- */
  SCREENS['account'] = {
    title: 'Account', epic: 'Epic 03',
    render() {
      const a = STATE.acct;
      return U.page('Account settings', 'Language, timezone and currency for the whole account') + `
        <div class="cols c-1-1">
          ${U.panel('Preferences', `
            ${U.field('Language', U.select(['English', 'العربية'], a.lang, { act: 'acctLang' }), 'Applies to the dashboard and to the driver app')}
            ${U.field('Timezone', U.select(['Asia/Riyadh (GMT+3)', 'Asia/Dubai (GMT+4)', 'UTC'], a.tz, { act: 'acctTz' }), 'Shift windows, scheduled orders and reports all read this')}
            ${U.field('Currency', U.select(['SAR — Saudi Riyal', 'AED — UAE Dirham', 'USD — US Dollar'], a.cur, { act: 'acctCur' }), 'Contracts, wallets and invoices')}
            <div class="btnrow">${U.btn('Save', { kind: 'primary', act: 'saveAcct' })}</div>`)}
          ${U.panel('What changes where', U.defs([
            ['Driver app', 'Language follows the account unless a driver overrides it on their phone'],
            ['Scheduled orders', 'Slot times are stored in UTC and shown in your timezone'],
            ['Reports', 'Day boundaries follow the account timezone, not the server'],
            ['Invoices', 'Issued in the account currency; Dash bills you in SAR']
          ]))}
        </div>`;
    }
  };

  /* ---------------- 21 Roles and permissions ---------------- */
  SCREENS['roles'] = {
    title: 'Roles', epic: 'Epic 21',
    render() {
      const areas = ['Dashboard', 'Orders', 'Control tower', 'Drivers', 'Contracts and wallets', 'Merchants', 'Zones and settings', 'Network and Marketplace', 'Reports', 'Billing', 'Developer', 'Audit log'];
      const roles = {
        'Admin': areas.map(() => 'Full'),
        'Dispatcher': ['View', 'Full', 'Full', 'View', 'None', 'View', 'None', 'None', 'View', 'None', 'None', 'None'],
        'Finance': ['View', 'View', 'None', 'View', 'Full', 'View', 'None', 'None', 'Full', 'Full', 'None', 'View'],
        'Fleet supervisor': ['View', 'View', 'Full', 'Full', 'View', 'None', 'View', 'None', 'View', 'None', 'None', 'None']
      };
      const cls = v => v === 'Full' ? 'p-full' : v === 'View' ? 'p-view' : 'p-none';
      return U.page('Roles and permissions', 'Four roles cover a fleet office; add custom roles when they do not',
        U.btn('Create custom role', { kind: 'primary', act: 'stub', arg: 'Custom role builder' }) + U.btn('Invite team member', { act: 'stub', arg: 'Invitation sent' })) + `
        ${U.panel('Permission matrix', `<div class="tw"><table class="tbl matrix">
          <thead><tr><th>Area</th>${Object.keys(roles).map(r => `<th>${r}</th>`).join('')}</tr></thead>
          <tbody>${areas.map((a, i) => `<tr><td><b>${a}</b></td>${Object.keys(roles).map(r => `<td class="${cls(roles[r][i])}">${roles[r][i]}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`, { pad: false })}
        ${U.panel('Team', U.table(
          [{ t: 'Member' }, { t: 'Email' }, { t: 'Role' }, { t: 'Two factor' }, { t: 'Last active' }, { t: '', w: '160px' }],
          [['Sara Al Fahad', 'sara@rehla.sa', 'Admin', true, 'Now'],
           ['Mishal Al Harbi', 'mishal@rehla.sa', 'Dispatcher', true, '4 min ago'],
           ['Noura Al Saleh', 'noura@rehla.sa', 'Finance', true, '2 h ago'],
           ['Ziad Al Anazi', 'ziad@rehla.sa', 'Fleet supervisor', false, 'Yesterday']]
            .map(([n, e, r, f, t]) => ({ cells: [
              `<div class="who sm">${U.avatar(n)}<span>${U.esc(n)}</span></div>`, e, U.tag(r, D().PAL.lav),
              f ? U.tag('On', '#1f8a4c') : U.tag('Off', D().PAL.tang, { solid: true }), t,
              `<div class="rowact">${U.btn('Change role', { act: 'stub', arg: 'Role changed' })}${U.btn('Remove', { kind: 'danger', act: 'stub', arg: 'Member removed' })}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 22 Notifications ---------------- */
  SCREENS['notifications'] = {
    title: 'Notifications', epic: 'Epic 22',
    render() {
      const d = D(), p = STATE.notifPrefs;
      return U.page('Notifications', 'Everything the system wants you to know, and what you want to be told about',
        U.btn('Mark all read', { act: 'stub', arg: 'All notifications marked read' })) + `
        <div class="cols c-2-1">
          ${U.panel('Inbox', `<div class="alerts">${d.NOTIFS.map(n => `
            <a class="alert s-${n.sev}" href="${n.link}">
              <span class="alert-k">${n.k}</span><span class="alert-t">${U.esc(n.t)}</span><span class="alert-d">${n.d}</span>
            </a>`).join('')}</div>`, { pad: false })}
          ${U.panel('Preferences', `
            ${U.field('Order updates', U.toggle(p.order, 'npOrder', '', 'Assigned, delayed, failed, returned'))}
            ${U.field('Driver alerts', U.toggle(p.driver, 'npDriver', '', 'Offline mid-shift, long break, stuck status'))}
            ${U.field('Document expiry', U.toggle(p.docs, 'npDocs', '', 'Driver and vehicle documents, 60 days out'))}
            ${U.field('Cash handover', U.toggle(p.cash, 'npCash', '', 'COD held above SAR 500 or older than a day'))}
            ${U.field('System messages', U.toggle(p.system, 'npSystem', '', 'Releases, maintenance windows, API changes'))}
            ${U.note('Severity drives delivery.', 'High-severity items also go to the dispatcher on shift by SMS. Everything else stays in this inbox.', d.PAL.lemon)}`)}
        </div>`;
    }
  };

  /* ---------------- 23 Subscription and billing ---------------- */
  SCREENS['billing'] = {
    title: 'Billing', epic: 'Epic 23',
    render() {
      const d = D();
      return U.page('Subscription and billing', 'Your plan with Dash, your wallet, and your invoices',
        U.btn('Top up wallet', { kind: 'primary', act: 'topUp' }) + U.btn('Manage payment method', { act: 'stub', arg: 'Payment methods' })) + `
        <div class="kpis k-4">
          ${U.kpi('Current plan', 'Fleet Pro', 'Up to 250 drivers', d.PAL.lav)}
          ${U.kpi('Monthly fee', U.money(2400), 'Billed 1st, Net 15', d.PAL.flax)}
          ${U.kpi('Wallet balance', U.money(1840), 'Covers network and API overage', d.PAL.peach)}
          ${U.kpi('This month', U.money(3126), 'Plan + 1,396 orders', d.PAL.vodka)}
        </div>
        ${U.note('Low balance alert at SAR 500.', 'If the wallet empties, Dash Network participation pauses first — your own fleet keeps running.', d.PAL.peach)}
        <div class="cols c-1-1">
          ${U.panel('Plans', `<div class="plans">
            ${[['Fleet Starter', 900, '25 drivers', ['Dispatch and live map', 'One zone', 'Email support']],
               ['Fleet Pro', 2400, '250 drivers', ['Everything in Starter', 'Unlimited zones and shifts', 'Dash Network + Marketplace', 'API and webhooks', 'Priority support']],
               ['Fleet Enterprise', null, 'Unlimited', ['Everything in Pro', 'Dedicated routing tuning', 'SLA and account manager']]]
              .map(([n, p, cap, feats]) => `
                <div class="plan ${n === 'Fleet Pro' ? 'on' : ''}">
                  <div class="pl-h"><b>${n}</b>${n === 'Fleet Pro' ? U.tag('Current', '#000', { solid: true }) : ''}</div>
                  <div class="pl-p">${p ? U.money(p) + '<em>/month</em>' : 'Talk to Dash'}</div>
                  <div class="pl-c">${cap}</div>
                  <ul>${feats.map(f => `<li>${f}</li>`).join('')}</ul>
                  ${n === 'Fleet Pro' ? '' : U.btn(p && p > 2400 ? 'Upgrade' : 'Downgrade', { act: 'stub', arg: 'Plan change requested' })}
                </div>`).join('')}
          </div>`, { pad: false })}
          <div class="stack">
            ${U.panel('Wallet', `${U.defs([['Balance', U.money(1840)], ['Auto top-up', 'SAR 2,000 when below SAR 500'], ['Last top-up', '14 August · SAR 3,000']])}
              <div class="sub-h">Transactions</div>
              ${U.table([{ t: 'Date' }, { t: 'Item' }, { t: 'Amount', num: true }],
                [['29 Aug', 'Network order fees · 18 orders', -216], ['27 Aug', 'API overage · 40k calls', -80],
                 ['14 Aug', 'Wallet top-up', 3000], ['1 Aug', 'Fleet Pro subscription', -2400]]
                  .map(([dt, it, a]) => ({ cells: [dt, it, `<b style="color:${a < 0 ? '#b0432a' : '#1f8a4c'}">${a < 0 ? '−' : '+'} ${U.money(Math.abs(a))}</b>`] })))}`, { pad: false })}
            ${U.panel('Invoices', U.table([{ t: 'Invoice' }, { t: 'Period' }, { t: 'Amount', num: true }, { t: 'Status' }, { t: '', w: '110px' }],
              [['INV-2026-08', 'August 2026', 3126, 'Open'], ['INV-2026-07', 'July 2026', 2984, 'Paid'], ['INV-2026-06', 'June 2026', 2712, 'Paid']]
                .map(([i, p, a, s]) => ({ cells: [`<b>${i}</b>`, p, U.money(a),
                  U.tag(s, s === 'Paid' ? '#1f8a4c' : d.PAL.lemon, { solid: s !== 'Paid' }),
                  U.btn('PDF', { act: 'stub', arg: 'Invoice downloaded' })] }))), { pad: false })}
          </div>
        </div>`;
    }
  };

  /* ---------------- 24 Developer settings ---------------- */
  SCREENS['developer'] = {
    title: 'Developer', epic: 'Epic 24',
    render() {
      const d = D();
      return U.page('Developer settings', 'Keys, webhooks and logs — documentation lives in the public Developer Portal',
        U.btn('Generate key', { kind: 'primary', act: 'genKey' }) + U.btn('Open documentation', { act: 'stub', arg: 'Opens the Dash Developer Portal' })) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('API keys', U.table(
              [{ t: 'Label' }, { t: 'Key' }, { t: 'Scope' }, { t: 'Created' }, { t: 'Last used' }, { t: '', w: '150px' }],
              [['Production — ERP', 'dsh_live_4f21••••', 'Orders, drivers, webhooks', '6 Aug 2026', '2 min ago'],
               ['Production — WMS', 'dsh_live_9c07••••', 'Orders read only', '12 Aug 2026', '1 h ago'],
               ['Sandbox', 'dsh_test_1a55••••', 'All, test data', '6 Aug 2026', 'Yesterday']]
                .map(([l, k, s, c, u]) => ({ cells: [`<b>${l}</b>`, `<code>${k}</code>`, s, c, u,
                  `<div class="rowact">${U.btn('Rotate', { act: 'stub', arg: 'Key rotated — old key valid 24 h' })}${U.btn('Revoke', { kind: 'danger', act: 'stub', arg: 'Key revoked' })}</div>`] }))), { pad: false })}
            ${U.panel('Webhooks', `
              ${U.field('Endpoint', U.input('https://erp.rehla.sa/hooks/dash'))}
              ${U.field('Events', `<div class="chips">${['order.created', 'order.assigned', 'order.picked_up', 'order.delivered', 'order.failed', 'order.returned', 'driver.status'].map((e, i) => `<button type="button" class="chip ${i < 6 ? 'on' : ''}" data-act="stub" data-arg="Toggle ${e}">${e}</button>`).join('')}</div>`)}
              ${U.field('Signing secret', U.input('whsec_8f3a••••••', '', { type: 'password' }), 'Verify every payload against this before trusting it')}
              <div class="btnrow">${U.btn('Send test event', { act: 'stub', arg: 'Test event delivered — 200 OK in 84 ms' })}${U.btn('Save', { kind: 'primary', act: 'stub', arg: 'Webhook saved' })}</div>`)}
            ${U.panel('Recent API and webhook logs', U.table(
              [{ t: 'Time' }, { t: 'Direction' }, { t: 'Event or endpoint' }, { t: 'Status' }, { t: 'Latency', num: true }],
              [['15:47:22', 'In', 'POST /v1/orders', '201', '112 ms'],
               ['15:47:23', 'Out', 'order.created → erp.rehla.sa', '200', '84 ms'],
               ['15:44:02', 'In', 'GET /v1/drivers?status=online', '200', '38 ms'],
               ['15:36:51', 'Out', 'order.picked_up → erp.rehla.sa', '200', '91 ms'],
               ['15:12:40', 'Out', 'order.assigned → erp.rehla.sa', '500', 'retry 3'],
               ['15:04:11', 'In', 'POST /v1/orders', '422', '22 ms']]
                .map(([t, dir, e, s, l]) => ({ cells: [t, U.tag(dir, dir === 'In' ? d.PAL.lav : d.PAL.peach), `<code>${e}</code>`,
                  U.tag(s, s.startsWith('2') ? '#1f8a4c' : d.PAL.tang, { solid: !s.startsWith('2') }), l] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Usage', `${U.defs([['Calls this month', '412,880'], ['Included', '400,000'], ['Overage', '12,880 · SAR 80'], ['Rate limit', '120 requests / minute'], ['Error rate', '0.3%']])}
              <div class="sub-h">Calls per day</div>${U.spark([12, 14, 13, 16, 19, 11, 15], d.PAL.lav, 44)}`)}
            ${U.panel('Sandbox', `${U.field('Sandbox mode', U.toggle(false, 'stub', '', 'Deferred — coming with the Developer Portal sandbox'))}
              ${U.note('Test keys work today.', 'A full sandbox mirror of the dashboard with simulated drivers is a later milestone; the test key already accepts orders and fires webhooks.', d.PAL.vodka)}`)}
          </div>
        </div>`;
    }
  };

  /* ---------------- 25 Support and tickets ---------------- */
  SCREENS['support'] = {
    title: 'Support', epic: 'Epic 25',
    render() {
      const d = D();
      return U.page('Support', 'Tickets to Dash, linked to the order or driver they are about',
        U.btn('Submit ticket', { kind: 'primary', act: 'newTicket' })) + `
        <div class="cols c-2-1">
          ${U.panel('Your tickets', U.table(
            [{ t: 'Ticket' }, { t: 'Subject' }, { t: 'Linked to' }, { t: 'Priority' }, { t: 'Status' }, { t: 'Opened' }, { t: 'Last update' }],
            d.TICKETS.map(t => ({ cells: [`<b>${t.id}</b>`, U.esc(t.t), `<code>${U.esc(t.link)}</code>`,
              U.tag(t.p, t.p === 'High' ? d.PAL.tang : d.PAL.lav),
              U.tag(t.s, t.s === 'Resolved' ? '#1f8a4c' : t.s === 'Open' ? d.PAL.lemon : d.PAL.peach, { solid: t.s !== 'Resolved' }),
              t.opened, U.esc(t.last)] }))), { pad: false })}
          ${U.panel('Submit a ticket', `
            ${U.field('Subject', U.input('', 'Network order arrived outside our coverage'))}
            ${U.field('Link to', U.select(['Nothing specific', ...d.ORDERS.slice(0, 5).map(o => o.id), ...d.DRIVERS.slice(0, 3).map(x => x.name)], 'Nothing specific'), 'Attaching an order gives Dash the full routing trace')}
            ${U.field('Priority', U.radio(['Normal', 'High'], 'Normal', 'stub'))}
            ${U.field('Description', `<textarea class="in" rows="4" placeholder="What happened, and what you expected instead."></textarea>`)}
            <div class="btnrow">${U.btn('Send to Dash', { kind: 'primary', act: 'newTicket' })}</div>
            ${U.note('Response times.', 'High priority is answered within 1 hour on Fleet Pro. Normal within one business day.', d.PAL.lemon)}`)}
        </div>`;
    }
  };

  /* ---------------- 26 Audit log ---------------- */
  SCREENS['audit'] = {
    title: 'Audit log', epic: 'Epic 26',
    render() {
      const d = D();
      return U.page('Audit log', 'Every action in the account — who did what, when, and from where',
        U.btn('Export log', { kind: 'primary', act: 'export', arg: 'audit' })) + `
        ${U.filters([
          U.input('', 'Search action or record…', { act: 'stub' }),
          `<span class="f-l">User</span>` + U.select(['All users', 'Sara Al Fahad', 'Mishal (Dispatcher)', 'Noura (Finance)', 'System'], 'All users', { act: 'stub' }),
          `<span class="f-l">Action type</span>` + U.select(['All actions', 'Created', 'Changed', 'Cancelled', 'Exported', 'Paused'], 'All actions', { act: 'stub' }),
          `<span class="f-l">Range</span>` + U.select(['Today', 'Last 7 days', 'Last 30 days'], 'Today', { act: 'stub' }),
          `<span class="f-sp"></span><span class="f-c">${d.AUDIT.length} entries today</span>`
        ])}
        ${U.panel('', U.table(
          [{ t: 'Time' }, { t: 'User' }, { t: 'Role' }, { t: 'Action' }, { t: 'Record' }, { t: 'IP' }],
          d.AUDIT.map(a => ({ cells: [a.t, U.esc(a.u), a.r === '—' ? '<em class="sub">—</em>' : U.tag(a.r, d.PAL.lav),
            `<b>${U.esc(a.a)}</b>`, `<code>${U.esc(a.o)}</code>`, a.ip] }))), { pad: false })}
        ${U.note('The audit log is append-only.', 'Nobody, including an Admin, can edit or delete an entry. Exports are themselves logged.', d.PAL.lav)}`;
    }
  };
})();
