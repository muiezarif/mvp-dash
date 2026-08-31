/* Dash 3PL — Onboarding (01), Auth (02), Account (03), Analytics (11),
   Roles (14), Notifications (15), Billing (16), Developer (17), Support (18), Audit (19) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.TPL;
  window.STATE = window.STATE || {};
  STATE.rt = STATE.rt || 'Performance';
  STATE.acct = STATE.acct || { lang: 'English', tz: 'Asia/Riyadh (GMT+3)', cur: 'SAR — Saudi Riyal' };
  STATE.np = STATE.np || { incoming: true, status: true, overflow: true, commercial: true, system: false };

  /* ---------------- 01 Onboarding ---------------- */
  SCREENS['onboarding'] = {
    title: 'Verification', epic: 'Epic 01',
    render() {
      const d = D();
      const steps = [
        ['Account created', 'Self signup with a work email', true],
        ['Business profile', 'Legal name, CR number, logo, head office', true],
        ['Documents submitted', 'Commercial registration, VAT certificate, fleet insurance', true],
        ['Dash review', 'Verified 3 February 2026', true],
        ['API integration', 'Sahel OMS connected · webhooks live', true],
        ['Network and Marketplace', 'Supply and Demand approved · listing live', true]
      ];
      return U.page('Onboarding and verification', `${d.BIZ.legal} · verified provider`,
        U.btn('Download verification letter', { act: 'stub', arg: 'PDF letter downloaded' })) +
        U.mode('ro', 'Dash owns verification. You submit documents and see the outcome; you cannot mark yourself verified.') + `
        ${U.note('Verified — full access.', 'Before verification an account is read-only: you can log in and configure settings, but records, Dash Network and the Marketplace are all gated.', '#1f8a4c')}
        ${U.panel('Progress', `<div class="steps">${steps.map(([t, s, done], i) => `
          <div class="stp ${done ? 'done' : ''}"><span class="stp-n">${done ? '✓' : i + 1}</span>
            <div><b>${t}</b><em>${s}</em></div></div>`).join('')}</div>`, { pad: false })}
        <div class="cols c-1-1">
          ${U.panel('Business information', U.defs([
            ['Legal name', U.esc(d.BIZ.legal)], ['Trade name', U.esc(d.BIZ.name)],
            ['Category', U.esc(d.BIZ.kind)], ['CR number', U.esc(d.BIZ.cr)], ['VAT number', U.esc(d.BIZ.vat)],
            ['Head office', U.esc(d.BIZ.hq)], ['Fleet', U.esc(d.BIZ.fleet)],
            ['Own system', U.esc(d.BIZ.ownSystem)],
            ['Account state', U.tag('Verified', '#1f8a4c')]
          ]), { right: U.btn('Edit', { act: 'stub', arg: 'Edit business information' }) })}
          ${U.panel('Documents', U.table(
            [{ t: 'Document' }, { t: 'Uploaded' }, { t: 'Status' }],
            [['Commercial registration', '26 Jan 2026', 'Accepted'], ['VAT certificate', '26 Jan 2026', 'Accepted'],
             ['Fleet insurance summary', '27 Jan 2026', 'Accepted'], ['Owner national ID', '26 Jan 2026', 'Accepted']]
              .map(([k, u, s]) => ({ cells: [k, u, U.tag(s, '#1f8a4c')] }))), { pad: false })}
        </div>
        ${U.panel('What verification gates', U.defs([
          ['Records', 'Merchant, driver and customer profiles stay empty until verified'],
          ['Dash Network', 'You cannot request Supply or Demand'],
          ['Marketplace', 'No listing, so no merchants can find you'],
          ['If rejected', 'The reason is shown here in plain words and you can resubmit — unlimited attempts']
        ]))}`;
    }
  };

  /* ---------------- 02 Authentication ---------------- */
  SCREENS['security'] = {
    title: 'Authentication', epic: 'Epic 02',
    render() {
      return U.page('Authentication and sessions', 'Login, two factor and where your account is signed in',
        U.btn('Sign out everywhere', { kind: 'danger', act: 'stub', arg: 'All other sessions revoked' })) + `
        <div class="cols c-1-1">
          ${U.panel('Login', `
            ${U.field('Email', U.input('faisal@sahel-logistics.sa'))}
            ${U.field('Password', U.input('••••••••••', '', { type: 'password' }), 'Last changed 18 June 2026')}
            <div class="btnrow">${U.btn('Change password', { act: 'stub', arg: 'Password change email sent' })}${U.btn('Send reset link', { act: 'stub', arg: 'Reset link sent' })}</div>`)}
          ${U.panel('Two factor authentication', `
            ${U.field('Status', U.toggle(true, 'stub', '', 'Enabled — authenticator app'))}
            ${U.defs([['Method', 'Time-based one-time code'], ['Backup codes', '10 of 10 unused'], ['Enforced for', 'Admin and Finance roles']])}
            <div class="btnrow">${U.btn('Regenerate backup codes', { act: 'stub', arg: 'New backup codes generated' })}</div>`)}
        </div>
        ${U.panel('Active sessions', U.table(
          [{ t: 'Device' }, { t: 'Location' }, { t: 'IP' }, { t: 'Last active' }, { t: '', w: '130px' }],
          [['Chrome · macOS (this device)', 'Riyadh, SA', '188.55.x.x', 'Now'],
           ['Chrome · Windows — dispatch desk', 'Riyadh, SA', '94.98.x.x', '20 min ago'],
           ['Safari · iPhone', 'Riyadh, SA', '188.55.x.x', 'Yesterday']]
            .map(([dv, l, ip, t], i) => ({ cells: [dv, l, ip, t, i === 0 ? '<em class="sub">Current</em>' : U.btn('Revoke', { act: 'stub', arg: 'Session revoked' })] }))), { pad: false })}`;
    }
  };

  /* ---------------- 03 Account settings ---------------- */
  SCREENS['account'] = {
    title: 'Account', epic: 'Epic 03',
    render() {
      const a = STATE.acct, d = D();
      return U.page('Account settings', 'Language, timezone and currency for this Dash account') + `
        <div class="cols c-1-1">
          ${U.panel('Preferences', `
            ${U.field('Language', U.select(['English', 'العربية'], a.lang, { act: 'acctLang' }), 'Applies to this dashboard and to emails Dash sends you')}
            ${U.field('Timezone', U.select(['Asia/Riyadh (GMT+3)', 'Asia/Dubai (GMT+4)', 'UTC'], a.tz, { act: 'acctTz' }), 'Scheduled slots and report day boundaries read this')}
            ${U.field('Currency', U.select(['SAR — Saudi Riyal', 'AED — UAE Dirham', 'USD — US Dollar'], a.cur, { act: 'acctCur' }), 'Revenue, contracts and invoices')}
            <div class="btnrow">${U.btn('Save', { kind: 'primary', act: 'saveAcct' })}</div>`)}
          ${U.panel('What this does not change', U.defs([
            ['Your own system', U.esc(d.BIZ.ownSystem) + ' has its own settings — Dash cannot reach them'],
            ['Your drivers', 'Driver app language is set by whoever runs their app, not here'],
            ['API payloads', 'Timestamps are always ISO 8601 UTC regardless of this setting'],
            ['Merchant contracts', 'Prices are stored in the currency they were agreed in']
          ]))}
        </div>`;
    }
  };

  /* ---------------- 11 Performance and analytics ---------------- */
  SCREENS['analytics'] = {
    title: 'Analytics', epic: 'Epic 11', ro: true,
    render() {
      const d = D(), tab = STATE.rt, week = d.REPORTS.week;

      const perf = `
        <div class="kpis k-4">
          ${U.kpi('Completion rate', '93%', 'Target 95%', d.PAL.lav)}
          ${U.kpi('Avg delivery time', '36<span class="of">min</span>', 'Network average 34 min', d.PAL.vodka)}
          ${U.kpi('Cancellation rate', '2.3%', 'Includes declines', d.PAL.tang)}
          ${U.kpi('Acceptance rate', '81%', 'Of orders Dash offered you', d.PAL.flax)}
        </div>
        ${U.panel('Orders and on-time rate by day', `<div class="wk big">${week.map(w => `<div class="wk-c">
          <span class="wk-b" style="height:${w.orders / 70 * 100}%;background:${w.onTime < 92 ? d.PAL.tang : d.PAL.lav}"></span>
          <span class="wk-l">${w.d}</span><span class="wk-v">${w.orders}</span></div>`).join('')}</div>
          <div class="legend">${U.dot(d.PAL.lav)}92%+ ${U.dot(d.PAL.tang)}Below · Thursday peak is where you lose on-time performance</div>`)}
        ${U.panel('Delivery time distribution', `
          <div class="hist">${[['<20m', 42], ['20–30m', 186], ['30–40m', 312], ['40–50m', 224], ['50–60m', 118], ['60m+', 32]].map(([l, n]) =>
            `<div class="hs"><span class="hs-b" style="height:${n / 320 * 100}%;background:${l === '60m+' ? d.PAL.tang : d.PAL.vodka}"></span>
              <span class="hs-l">${l}</span><span class="hs-v">${n}</span></div>`).join('')}</div>
          <div class="legend">Median 36 min · vans skew this — your bulk work is slower by design</div>`)}`;

      const rev = `
        <div class="kpis k-4">
          ${U.kpi('Revenue this month', U.money(d.BILLING.earnedMonth), '914 Dash orders', d.PAL.peach)}
          ${U.kpi('Marketplace revenue', U.money(12820), 'Your contracts · no commission', d.PAL.vodka)}
          ${U.kpi('Network revenue', U.money(d.NETWORK.supply.revenue), 'Less 8% Dash commission', d.PAL.lav)}
          ${U.kpi('Revenue per order', U.money(15.50), 'Last month ' + U.money(15.12), d.PAL.flax)}
        </div>
        ${U.panel('Revenue by day', `<div class="wk big">${week.map(w => `<div class="wk-c">
          <span class="wk-b" style="height:${w.rev / 1100 * 100}%;background:${d.PAL.peach}"></span>
          <span class="wk-l">${w.d}</span><span class="wk-v">${w.rev}</span></div>`).join('')}</div>`)}
        ${U.panel('Revenue by merchant', U.table(
          [{ t: 'Merchant' }, { t: 'Relationship' }, { t: 'Orders', num: true }, { t: 'Revenue', num: true }, { t: 'Per order', num: true }, { t: 'Commission', num: true }, { t: 'Net', num: true }],
          d.MERCHANTS.filter(m => m.orders).map(m => {
            const comm = m.rel === 'Commercial' ? 0 : m.revenue * d.BILLING.commission;
            return { act: 'go', arg: '/merchants/' + m.id, cells: [
              `<b>${U.esc(m.name)}</b>`, U.tag(m.rel, m.rel === 'Commercial' ? d.PAL.vodka : d.PAL.lav),
              m.orders, U.money(m.revenue), U.money(m.revenue / m.orders),
              comm ? '− ' + U.money(comm) : '<em class="sub">None</em>', `<b>${U.money(m.revenue - comm)}</b>`] };
          })), { pad: false })}`;

      const zones = `
        ${U.panel('Performance by zone', U.table(
          [{ t: 'Zone' }, { t: 'Orders', num: true }, { t: 'On time', w: '140px' }, { t: 'Avg delivery', num: true }, { t: 'Revenue', num: true }, { t: 'Per order', num: true }],
          d.REPORTS.zones.map(z => ({ cells: [
            `<b>${z.z}</b>`, z.orders, `${z.onTime}% ${U.bar(z.onTime, z.onTime >= 92 ? d.PAL.lav : d.PAL.tang)}`,
            z.avg + 'm', U.money(z.rev), U.money(z.rev / z.orders)] }))), { pad: false })}
        ${U.note('Zone West is costing you.', '14 orders, 82% on time, 48 minutes average — you have no depot there. Either drop it from your listing coverage or route it straight to overflow.', d.PAL.tang)}`;

      const over = `
        <div class="kpis k-4">
          ${U.kpi('Overflow sent', d.NETWORK.demand.sent, 'Orders you could not carry', d.PAL.peach)}
          ${U.kpi('Fulfilled by others', d.NETWORK.demand.fulfilled + '%', 'Delivered without you', d.PAL.flax)}
          ${U.kpi('Cost', U.money(d.NETWORK.demand.cost), 'Paid to the network', d.PAL.tang)}
          ${U.kpi('Revenue protected', U.money(1240), 'Merchants you kept by not refusing', '#1f8a4c')}
        </div>
        ${U.panel('Overflow sent and fulfilled', U.table(
          [{ t: 'Order' }, { t: 'Merchant' }, { t: 'Zone' }, { t: 'Reason' }, { t: 'Outcome' }, { t: 'Fulfilled by' }, { t: 'Cost', num: true }],
          d.OVERFLOW.map(o => ({ cells: [`<b>${o.id}</b>`, U.esc(o.merchant), o.zone, U.esc(o.reason),
            U.tag(o.status, o.status === 'Fulfilled' ? '#1f8a4c' : d.PAL.tang, { solid: o.status !== 'Fulfilled' }),
            o.by === '—' ? '<em class="sub">—</em>' : U.esc(o.by), o.cost ? U.money(o.cost) : '—'] }))), { pad: false })}
        ${U.note('Overflow is cheaper than losing a merchant.', 'You paid ' + U.money(d.NETWORK.demand.cost) + ' this month to have work carried for you, and kept contracts worth far more.', d.PAL.peach)}`;

      return U.page('Performance and analytics', 'Dash orders only — filter, export, or have it emailed',
        U.btn('Export CSV', { kind: 'primary', act: 'export', arg: 'report' }) + U.btn('Export PDF', { act: 'export', arg: 'report-pdf' }) +
        U.btn('Schedule by email', { act: 'scheduleReport' })) +
        U.mode('ro', 'Figures come from delivered Dash orders. Your own business is not counted here — ' + U.esc(d.BIZ.ownSystem) + ' has the full picture.') + `
        ${U.filters([
          `<span class="f-l">Range</span>` + U.select(['Today', 'Last 7 days', 'Last 30 days', 'This month', 'Custom…'], 'Last 7 days', { act: 'stub' }),
          `<span class="f-l">Merchant</span>` + U.select(['All merchants', ...d.MERCHANTS.filter(m => m.orders).map(m => m.name)], 'All merchants', { act: 'stub' }),
          `<span class="f-l">Zone</span>` + U.select(['All zones', ...d.REPORTS.zones.map(z => z.z)], 'All zones', { act: 'stub' }),
          `<span class="f-l">Source</span>` + U.select(['All sources', 'Marketplace', 'Dash Network', 'Direct'], 'All sources', { act: 'stub' }),
          `<span class="f-sp"></span><span class="f-c">914 orders in range</span>`
        ])}
        ${U.tabs(['Performance', 'Revenue', 'Zones', 'Overflow'], tab, 'reportTab')}
        ${tab === 'Revenue' ? rev : tab === 'Zones' ? zones : tab === 'Overflow' ? over : perf}
        ${U.panel('Scheduled reports', U.table(
          [{ t: 'Report' }, { t: 'Recipients' }, { t: 'Schedule' }, { t: 'Format' }, { t: '', w: '150px' }],
          d.REPORTS.scheduled.map(s => ({ cells: [U.esc(s.n), U.esc(s.to), U.esc(s.when), s.fmt,
            `<div class="rowact">${U.btn('Edit', { act: 'stub', arg: 'Edit schedule' })}${U.btn('Pause', { act: 'stub', arg: 'Schedule paused' })}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 14 Roles ---------------- */
  SCREENS['roles'] = {
    title: 'Roles', epic: 'Epic 14',
    render() {
      const areas = ['Dashboard', 'Orders', 'Live map', 'Driver profiles', 'Customer profiles', 'Merchants', 'Contracts', 'Marketplace', 'Dash Network', 'Analytics', 'Billing', 'Developer', 'Audit log'];
      const roles = {
        'Admin': areas.map(() => 'Full'),
        'Operations': ['View', 'View', 'View', 'View', 'View', 'View', 'None', 'None', 'None', 'View', 'None', 'None', 'None'],
        'Finance': ['View', 'View', 'None', 'None', 'None', 'View', 'Full', 'None', 'None', 'Full', 'Full', 'None', 'View']
      };
      const cls = v => v === 'Full' ? 'p-full' : v === 'None' ? 'p-none' : 'p-view';
      return U.page('Roles and permissions', 'Three roles cover a provider office; add custom roles when they do not',
        U.btn('Create custom role', { kind: 'primary', act: 'stub', arg: 'Custom role builder' }) + U.btn('Invite team member', { act: 'stub', arg: 'Invitation sent' })) + `
        ${U.note('Almost everything is View by design.', 'Dash 3PL is a read-only window, so Operations sees a lot and changes nothing. The only Full permissions that matter are Contracts, Marketplace and Network — the commercial layer.', D().PAL.vodka)}
        ${U.panel('Permission matrix', `<div class="tw"><table class="tbl matrix">
          <thead><tr><th>Area</th>${Object.keys(roles).map(r => `<th>${r}</th>`).join('')}</tr></thead>
          <tbody>${areas.map((a, i) => `<tr><td><b>${a}</b></td>${Object.keys(roles).map(r => `<td class="${cls(roles[r][i])}">${roles[r][i]}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`, { pad: false })}
        ${U.panel('Team', U.table(
          [{ t: 'Member' }, { t: 'Email' }, { t: 'Role' }, { t: 'Two factor' }, { t: 'Last active' }, { t: '', w: '160px' }],
          [['Faisal Al Mutairi', 'faisal@sahel-logistics.sa', 'Admin', true, 'Now'],
           ['Omar Bakr', 'omar@sahel-logistics.sa', 'Operations', true, '20 min ago'],
           ['Huda Al Nasser', 'huda@sahel-logistics.sa', 'Finance', true, '2 h ago'],
           ['Saleh Al Dawsari', 'saleh@sahel-logistics.sa', 'Operations', false, 'Yesterday']]
            .map(([n, e, r, f, t]) => ({ cells: [
              `<div class="who sm">${U.avatar(n)}<span>${U.esc(n)}</span></div>`, e, U.tag(r, D().PAL.lav),
              f ? U.tag('On', '#1f8a4c') : U.tag('Off', D().PAL.tang, { solid: true }), t,
              `<div class="rowact">${U.btn('Change role', { act: 'stub', arg: 'Role changed' })}${U.btn('Remove', { kind: 'danger', act: 'stub', arg: 'Member removed' })}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 15 Notifications ---------------- */
  SCREENS['notifications'] = {
    title: 'Notifications', epic: 'Epic 15',
    render() {
      const d = D(), p = STATE.np;
      return U.page('Notifications', 'What Dash tells you, and what you want to hear about',
        U.btn('Mark all read', { act: 'stub', arg: 'All notifications marked read' })) + `
        <div class="cols c-2-1">
          ${U.panel('Inbox', `<div class="alerts">${d.NOTIFS.map(n => `
            <a class="alert s-${n.sev}" href="${n.link}"><span class="alert-k">${n.k}</span>
              <span class="alert-t">${U.esc(n.t)}</span><span class="alert-d">${n.d}</span></a>`).join('')}</div>`, { pad: false })}
          ${U.panel('Preferences', `
            ${U.field('Incoming order alerts', U.toggle(p.incoming, 'npIncoming', '', 'A Network order is offered to you'))}
            ${U.field('Order status updates', U.toggle(p.status, 'npStatus', '', 'Delivered, returned, cancelled by the merchant'))}
            ${U.field('Overflow updates', U.toggle(p.overflow, 'npOverflow', '', 'Your overflow was taken, or came back'))}
            ${U.field('Commercial', U.toggle(p.commercial, 'npCommercial', '', 'Connection requests, contract expiry, disputes'))}
            ${U.field('System messages', U.toggle(p.system, 'npSystem', '', 'API changes, maintenance, releases'))}
            ${U.note('Incoming order alerts also go to your API.', 'The webhook is the reliable path — this inbox is for humans watching the dashboard.', d.PAL.lemon)}`)}
        </div>`;
    }
  };

  /* ---------------- 16 Subscription and billing ---------------- */
  SCREENS['billing'] = {
    title: 'Billing', epic: 'Epic 16',
    render() {
      const d = D(), b = d.BILLING;
      return U.page('Billing, earnings and payouts', 'What Dash pays you, and what Dash charges you',
        U.btn('Withdraw now', { kind: 'primary', act: 'withdraw' }) + U.btn('Payment methods', { act: 'stub', arg: 'Bank accounts and cards' })) + `
        <div class="kpis k-4">
          ${U.kpi('Earned this month', U.money(b.earnedMonth), '914 Dash orders', d.PAL.peach)}
          ${U.kpi('Next payout', U.money(2740), U.esc(b.payoutNext) + ' → ' + U.esc(b.payoutMethod), d.PAL.flax)}
          ${U.kpi('Current plan', U.esc(b.plan), U.money(b.fee) + ' / month', d.PAL.lav)}
          ${U.kpi('Wallet balance', U.money(b.balance), 'Covers overflow and commission', d.PAL.vodka)}
        </div>
        ${b.balance < 2000 ? U.note('Low balance alert set at SAR 400.', 'Auto top-up is on: ' + U.esc(b.autoTop) + '. If the wallet empties, your Demand role pauses first — Supply keeps running, so you keep earning.', d.PAL.peach) : ''}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('How the money works', `
              <div class="oms">
                <div class="oms-c dash"><b>Marketplace orders</b>
                  <em>Your contract, your price. Dash takes no commission. ${U.money(12820)} this month.</em></div>
                <div class="oms-a">·</div>
                <div class="oms-c"><b>Dash Network orders</b>
                  <em>Dash sets the price and keeps ${Math.round(b.commission * 100)}%. ${U.money(d.NETWORK.supply.revenue)} gross this month.</em></div>
              </div>
              <div style="margin-top:12px">${U.defs([
                ['Gross revenue', U.money(b.earnedMonth)],
                ['Dash commission', '− ' + U.money(d.NETWORK.supply.revenue * b.commission) + ' <em class="sub">Network orders only</em>'],
                ['Overflow you paid for', '− ' + U.money(d.NETWORK.demand.cost)],
                ['Subscription', '− ' + U.money(b.fee)],
                ['Net to you', `<b>${U.money(b.earnedMonth - d.NETWORK.supply.revenue * b.commission - d.NETWORK.demand.cost - b.fee)}</b>`]
              ])}</div>`)}
            ${U.panel('Plans', `<div class="plans">
              ${d.PLANS.map(p => `<div class="plan ${p.n === b.plan ? 'on' : ''}">
                <div class="pl-h"><b>${p.n}</b>${p.n === b.plan ? U.tag('Current', '#000', { solid: true }) : ''}</div>
                <div class="pl-p">${p.p === 0 ? 'Free' : p.p ? U.money(p.p) + '<em>/month</em>' : 'Talk to Dash'}</div>
                <div class="pl-c">${p.cap}</div>
                <ul>${p.feats.map(f => `<li>${f}</li>`).join('')}</ul>
                ${p.n === b.plan ? '' : U.btn(p.p === 0 ? 'Downgrade' : 'Upgrade', { act: 'changePlan', arg: p.n })}
              </div>`).join('')}</div>`, { pad: false })}
            ${U.panel('Invoices', U.table(
              [{ t: 'Invoice' }, { t: 'Period' }, { t: 'Amount', num: true }, { t: 'What it covers' }, { t: 'Status' }, { t: '', w: '110px' }],
              b.invoices.map(i => ({ cells: [`<b>${i.id}</b>`, U.esc(i.period), U.money(i.amount),
                i.note ? U.esc(i.note) : '<em class="sub">Subscription + commission</em>',
                U.tag(i.status, i.status === 'Paid' ? '#1f8a4c' : d.PAL.lemon, { solid: i.status !== 'Paid' }),
                U.btn('PDF', { act: 'stub', arg: 'Invoice downloaded' })] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Wallet', `${U.defs([
              ['Balance', U.money(b.balance)], ['Auto top-up', U.esc(b.autoTop)],
              ['Low balance alert', 'Email and dashboard at SAR 400'],
              ['Payout method', U.esc(b.payoutMethod)], ['Payout schedule', 'Weekly, Sunday']
            ])}
            <div class="btnrow">${U.btn('Top up', { act: 'topUp' })}${U.btn('Withdraw', { kind: 'primary', act: 'withdraw' })}</div>`)}
            ${U.panel('Transactions', U.table([{ t: 'Date' }, { t: 'Item' }, { t: 'Amount', num: true }],
              b.tx.map(t => ({ cells: [U.esc(t.d), U.esc(t.t),
                `<b style="color:${t.a < 0 ? '#b0432a' : '#1f8a4c'}">${t.a < 0 ? '−' : '+'} ${U.money(Math.abs(t.a))}</b>`] }))), { pad: false })}
          </div>
        </div>`;
    }
  };

  /* ---------------- 17 Developer settings ---------------- */
  SCREENS['developer'] = {
    title: 'Developer', epic: 'Epic 17',
    render() {
      const d = D();
      return U.page('Developer settings', 'The API is how you actually work — this dashboard is only the window',
        U.btn('Generate key', { kind: 'primary', act: 'genKey' }) + U.btn('Open documentation', { act: 'stub', arg: 'Opens the Dash Developer Portal' })) +
        U.mode('rw', 'For a 3PL the integration is the product. Orders in, statuses out, all machine to machine.') + `
        ${U.note(U.esc(d.BIZ.ownSystem) + ' is connected.', 'Orders pull in on order.created, and your OMS posts statuses back. Nobody at Sahel opens this dashboard to work an order.', '#1f8a4c')}
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('API keys', U.table(
              [{ t: 'Label' }, { t: 'Key' }, { t: 'Scope' }, { t: 'Created' }, { t: 'Last used' }, { t: '', w: '150px' }],
              [['Production — Sahel OMS', 'dsh_live_8e44••••', 'Orders, statuses, webhooks', '3 Feb 2026', '12 s ago'],
               ['Production — overflow push', 'dsh_live_1c93••••', 'Network demand', '20 Jul 2026', '14:02'],
               ['Sandbox', 'dsh_test_6b21••••', 'All, test data', '3 Feb 2026', 'Yesterday']]
                .map(([l, k, s, c, u]) => ({ cells: [`<b>${l}</b>`, `<code>${k}</code>`, s, c, u,
                  `<div class="rowact">${U.btn('Rotate', { act: 'stub', arg: 'Key rotated — old key valid 24 h' })}${U.btn('Revoke', { kind: 'danger', act: 'stub', arg: 'Key revoked' })}</div>`] }))), { pad: false })}
            ${U.panel('Webhooks', `
              ${U.field('Endpoint', U.input('https://oms.sahel-logistics.sa/dash/hooks'))}
              ${U.field('Events you receive', `<div class="chips">${['order.created', 'order.offered', 'order.cancelled_by_merchant', 'overflow.accepted', 'overflow.returned'].map(e =>
                `<button type="button" class="chip on" data-act="stub" data-arg="Toggle ${e}">${e}</button>`).join('')}</div>`)}
              ${U.field('Events you post back', `<div class="chips">${['order.accepted', 'order.declined', 'order.picked_up', 'order.delivered', 'order.failed'].map(e =>
                `<button type="button" class="chip on" data-act="stub" data-arg="${e} is posted by your OMS">${e}</button>`).join('')}</div>`,
                'These are calls your system makes to Dash — the dashboard only mirrors the result.')}
              ${U.field('Signing secret', U.input('whsec_5a19••••••', '', { type: 'password' }))}
              <div class="btnrow">${U.btn('Send test event', { act: 'stub', arg: 'Test event delivered — 200 OK in 62 ms' })}${U.btn('Save', { kind: 'primary', act: 'stub', arg: 'Webhook saved' })}</div>`)}
            ${U.panel('API and webhook logs', U.table(
              [{ t: 'Time' }, { t: 'Direction' }, { t: 'Event or endpoint' }, { t: 'Status' }, { t: 'Latency', num: true }],
              [['15:46:02', 'Out', 'order.offered → oms.sahel-logistics.sa', '200', '62 ms'],
               ['15:52:11', 'In', 'POST /v1/orders/DX-41088/status', '200', '48 ms'],
               ['15:44:30', 'In', 'POST /v1/orders/DX-41088/status', '200', '51 ms'],
               ['14:02:08', 'In', 'POST /v1/network/demand', '201', '88 ms'],
               ['11:55:44', 'In', 'POST /v1/orders/DX-40977/decline', '200', '39 ms'],
               ['10:31:02', 'Out', 'order.created → oms.sahel-logistics.sa', '500', 'retry 2']]
                .map(([t, dir, e, s, l]) => ({ cells: [t, U.tag(dir, dir === 'In' ? d.PAL.lav : d.PAL.peach), `<code>${e}</code>`,
                  U.tag(s, s.startsWith('2') ? '#1f8a4c' : d.PAL.tang, { solid: !s.startsWith('2') }), l] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Usage', `${U.defs([['Calls this month', '284,110'], ['Included', '300,000'], ['Overage', 'None'],
              ['Rate limit', '120 requests / minute'], ['Error rate', '0.4%']])}
              <div class="sub-h">Calls per day</div>${U.spark([14, 16, 15, 19, 22, 12, 17], d.PAL.lav, 44)}`)}
            ${U.panel('Sandbox', `${U.field('Sandbox mode', U.toggle(false, 'stub', '', 'Deferred — coming with the Developer Portal'))}
              ${U.note('Test keys work today.', 'A full sandbox with simulated merchants and orders is a later milestone.', d.PAL.vodka)}`)}
          </div>
        </div>`;
    }
  };

  /* ---------------- 18 Support ---------------- */
  SCREENS['support'] = {
    title: 'Support', epic: 'Epic 18',
    render() {
      const d = D();
      return U.page('Support', 'Tickets to Dash Hub, linked to the order they are about',
        U.btn('Submit ticket', { kind: 'primary', act: 'newTicket' })) + `
        <div class="cols c-2-1">
          ${U.panel('Your tickets', U.table(
            [{ t: 'Ticket' }, { t: 'Kind' }, { t: 'Subject' }, { t: 'Linked to' }, { t: 'Priority' }, { t: 'Status' }, { t: 'Opened' }, { t: 'Last update' }],
            d.TICKETS.map(t => ({ cells: [`<b>${t.id}</b>`, U.esc(t.kind), U.esc(t.t), `<code>${U.esc(t.link)}</code>`,
              U.tag(t.p, t.p === 'High' ? d.PAL.tang : d.PAL.lav),
              U.tag(t.s, t.s === 'Resolved' ? '#1f8a4c' : t.s === 'Open' ? d.PAL.lemon : d.PAL.peach, { solid: t.s !== 'Resolved' }),
              U.esc(t.opened), U.esc(t.last)] }))), { pad: false })}
          ${U.panel('Submit a ticket', `
            ${U.field('What is this about', U.select(['Dispute a charge or a return', 'Merchant behaviour', 'Order or routing problem', 'Technical or API', 'Billing question', 'Something else'], 'Dispute a charge or a return'))}
            ${U.field('Subject', U.input('', 'Return leg charge disputed by the merchant'))}
            ${U.field('Link to', U.select(['Nothing specific', ...d.ORDERS.slice(0, 6).map(o => o.id), ...d.MERCHANTS.filter(m => m.orders).map(m => m.name)], 'Nothing specific'),
              'Attaching an order gives Dash the full routing trace and both sides of the status history')}
            ${U.field('Priority', U.radio(['Normal', 'High'], 'Normal', 'stub'))}
            ${U.field('Description', `<textarea class="in" rows="4" placeholder="What happened, and what you expected instead."></textarea>`)}
            <div class="btnrow">${U.btn('Send to Dash Hub', { kind: 'primary', act: 'newTicket' })}</div>
            ${U.note('Disputes go through Dash, not the merchant.', 'Dash holds both sides of the record — your status history and theirs — which is why the argument is settled here.', d.PAL.lemon)}`)}
        </div>`;
    }
  };

  /* ---------------- 19 Audit log ---------------- */
  SCREENS['audit'] = {
    title: 'Audit log', epic: 'Epic 19',
    render() {
      const d = D();
      return U.page('Audit log', 'Every action on this account — including the ones your own system took',
        U.btn('Export log', { kind: 'primary', act: 'export', arg: 'audit' })) + `
        ${U.filters([
          U.input('', 'Search action or record…', { act: 'stub' }),
          `<span class="f-l">User</span>` + U.select(['All users', 'Faisal Al Mutairi', 'Omar Bakr', 'Huda Al Nasser', 'Sahel OMS', 'Dash Network'], 'All users', { act: 'stub' }),
          `<span class="f-l">Action type</span>` + U.select(['All actions', 'Viewed', 'Updated', 'Declined', 'Exported', 'Flagged'], 'All actions', { act: 'stub' }),
          `<span class="f-l">Range</span>` + U.select(['Today', 'Last 7 days', 'Last 30 days'], 'Today', { act: 'stub' }),
          `<span class="f-sp"></span><span class="f-c">${d.AUDIT.length} entries today</span>`
        ])}
        ${U.panel('', U.table(
          [{ t: 'Time' }, { t: 'Actor' }, { t: 'Role' }, { t: 'Action' }, { t: 'Record' }, { t: 'IP' }],
          d.AUDIT.map(a => ({ cells: [a.t, U.esc(a.u), a.r === 'System' ? '<em class="sub">System</em>' : U.tag(a.r, d.PAL.lav),
            `<b>${U.esc(a.a)}</b>`, `<code>${U.esc(a.o)}</code>`, a.ip] }))), { pad: false })}
        ${U.note('Your OMS appears here as an actor.', 'API calls are logged alongside human actions, so a declined order shows whether a person or your system decided it. The log is append-only — nobody can edit it.', d.PAL.lav)}`;
    }
  };
})();
