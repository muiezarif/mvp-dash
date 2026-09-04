/* Dash Merchant — Onboarding (01), Auth (02), Account (03), Reports (13), Billing (14),
   Roles (15), Developer (16), Notifications (17), Support (19), Audit (20) */
window.SCREENS = window.SCREENS || {};
(function () {
  const U = UI, D = () => window.MER;
  window.STATE = window.STATE || {};
  STATE.rt = STATE.rt || 'Orders';
  STATE.acct = STATE.acct || { lang: 'English', tz: 'Asia/Riyadh (GMT+3)', cur: 'SAR — Saudi Riyal' };
  STATE.np = STATE.np || { order: true, alerts: true, provider: true, billing: true, system: false };

  /* ---------------- 01 Onboarding ---------------- */
  SCREENS['onboarding'] = {
    title: 'Verification', epic: 'Epic 01',
    render() {
      const d = D();
      const steps = [
        ['Account created', 'Self signup with a work email', true],
        ['Business profile', 'Legal name, CR number, logo, head office', true],
        ['Documents submitted', 'Commercial registration, VAT certificate, owner ID', true],
        ['Dash review', 'Verified 12 August 2024', true],
        ['Setup wizard', '4 branches, Salla connector, dispatch defaults', true],
        ['First order sent', 'DX-10044 · 12 August 2024', true]
      ];
      return U.page('Onboarding and verification', `${d.BIZ.legal} · verified account`,
        U.btn('Download verification letter', { act: 'stub', arg: 'PDF letter downloaded' })) + `
        ${U.note('Verified — full access.', 'Before verification an account is read-only: you can log in, configure settings and invite your team, but you cannot create orders, connect a 3PL or use the API.', '#1f8a4c')}
        ${U.panel('Progress', `<div class="steps">${steps.map(([t, s, done], i) => `
          <div class="stp ${done ? 'done' : ''}"><span class="stp-n">${done ? '✓' : i + 1}</span>
            <div><b>${t}</b><em>${s}</em></div></div>`).join('')}</div>`, { pad: false })}
        <div class="cols c-1-1">
          ${U.panel('Business information', U.defs([
            ['Legal name', U.esc(d.BIZ.legal)], ['Trade name', U.esc(d.BIZ.name)],
            ['Category', U.esc(d.BIZ.kind)], ['CR number', U.esc(d.BIZ.cr)], ['VAT number', U.esc(d.BIZ.vat)],
            ['Head office', U.esc(d.BIZ.hq)], ['Website', U.esc(d.BIZ.site)],
            ['Account state', U.tag('Verified', '#1f8a4c')]
          ]), { right: U.btn('Edit', { act: 'stub', arg: 'Edit business information' }) })}
          ${U.panel('Documents', U.table(
            [{ t: 'Document' }, { t: 'Uploaded' }, { t: 'Status' }],
            [['Commercial registration', '8 Aug 2024', 'Accepted'], ['VAT certificate', '8 Aug 2024', 'Accepted'],
             ['Owner national ID', '8 Aug 2024', 'Accepted'], ['Municipality licence', '9 Aug 2024', 'Accepted']]
              .map(([k, u, s]) => ({ cells: [k, u, U.tag(s, '#1f8a4c')] }))), { pad: false })}
        </div>
        ${U.panel('If Dash rejects a submission', U.defs([
          ['What you see', 'The reason Dash recorded, in plain words, on this page'],
          ['What still works', 'Login, browsing, settings, inviting your team'],
          ['What is blocked', 'Creating orders, 3PL connections, the API, the Marketplace'],
          ['Resubmission', 'Unlimited — upload a corrected document and the queue picks it up again']
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
            ${U.field('Email', U.input('sara@kanzmarket.sa'))}
            ${U.field('Password', U.input('••••••••••', '', { type: 'password' }), 'Last changed 2 July 2026')}
            <div class="btnrow">${U.btn('Change password', { act: 'stub', arg: 'Password change email sent' })}${U.btn('Send reset link', { act: 'stub', arg: 'Reset link sent to sara@kanzmarket.sa' })}</div>`)}
          ${U.panel('Two factor authentication', `
            ${U.field('Status', U.toggle(true, 'stub', '', 'Enabled — authenticator app'))}
            ${U.defs([['Method', 'Time-based one-time code'], ['Backup codes', '9 of 10 unused'], ['Enforced for', 'Admin and Finance roles']])}
            <div class="btnrow">${U.btn('Regenerate backup codes', { act: 'stub', arg: 'New backup codes generated' })}</div>`)}
        </div>
        ${U.panel('Active sessions', U.table(
          [{ t: 'Device' }, { t: 'Location' }, { t: 'IP' }, { t: 'Last active' }, { t: '', w: '130px' }],
          [['Chrome · macOS (this device)', 'Riyadh, SA', '188.55.x.x', 'Now'],
           ['Safari · iPad', 'Riyadh, SA', '188.55.x.x', '3 h ago'],
           ['Chrome · Windows — Hittin branch', 'Riyadh, SA', '94.98.x.x', 'Yesterday']]
            .map(([dv, l, ip, t], i) => ({ cells: [dv, l, ip, t, i === 0 ? '<em class="sub">Current</em>' : U.btn('Revoke', { act: 'stub', arg: 'Session revoked' })] }))), { pad: false })}`;
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
            ${U.field('Language', U.select(['English', 'العربية'], a.lang, { act: 'acctLang' }), 'Applies to the dashboard and to emails Dash sends you')}
            ${U.field('Timezone', U.select(['Asia/Riyadh (GMT+3)', 'Asia/Dubai (GMT+4)', 'UTC'], a.tz, { act: 'acctTz' }), 'Branch hours, scheduled slots and report day boundaries read this')}
            ${U.field('Currency', U.select(['SAR — Saudi Riyal', 'AED — UAE Dirham', 'USD — US Dollar'], a.cur, { act: 'acctCur' }), 'Charges, wallet and invoices')}
            <div class="btnrow">${U.btn('Save', { kind: 'primary', act: 'saveAcct' })}</div>`)}
          ${U.panel('What changes where', U.defs([
            ['Scheduled orders', 'Slots are stored in UTC and shown in your timezone'],
            ['Branch hours', 'Interpreted in the account timezone'],
            ['Reports', 'Day boundaries follow this timezone, not the server'],
            ['Invoices', 'Issued in the account currency; Dash bills you in SAR'],
            ['Your customers', 'Never see these settings — Dash does not contact them']
          ]))}
        </div>`;
    }
  };

  /* ---------------- 13 Reports ---------------- */
  SCREENS['reports'] = {
    title: 'Reports', epic: 'Epic 13',
    render() {
      const d = D(), tab = STATE.rt, week = d.REPORTS.week;

      const orders = `
        ${U.panel('Orders by day', `<div class="wk big">${week.map(w => `<div class="wk-c">
          <span class="wk-b" style="height:${w.orders / 280 * 100}%;background:${w.onTime < 93 ? d.PAL.tang : d.PAL.peach}"></span>
          <span class="wk-l">${w.d}</span><span class="wk-v">${w.orders}</span></div>`).join('')}</div>`)}
        <div class="cols c-1-1">
          ${U.panel('By branch', U.table([{ t: 'Branch' }, { t: 'Orders', num: true }, { t: 'On time', w: '130px' }, { t: 'Avg', num: true }, { t: 'Spend', num: true }],
            d.BRANCHES.map(b => ({ cells: [U.esc(b.name), b.orders * 7,
              `${b.onTime}% ${U.bar(b.onTime, b.onTime >= 93 ? d.PAL.peach : d.PAL.tang)}`, b.avgMin + 'm', U.money(b.spend * 7)] }))), { pad: false })}
          ${U.panel('By status', U.table([{ t: 'Status' }, { t: 'Orders', num: true }, { t: 'Share', w: '160px' }],
            [['Delivered', 1284, 92], ['Returned', 46, 3.3], ['Cancelled', 38, 2.7], ['In progress', 28, 2.0]].map(([s, n, p]) => ({
              cells: [s === 'In progress' ? U.tag('In progress', d.PAL.lav) : U.statusTag(s), n.toLocaleString(),
                `${p}% ${U.bar(p, d.STATUS[s] ? d.STATUS[s].c : d.PAL.lav)}`] }))), { pad: false })}
        </div>`;

      const perf = `
        ${U.panel('Delivery performance by provider', U.table(
          [{ t: 'Provider' }, { t: 'Orders', num: true }, { t: 'On time', w: '130px' }, { t: 'Avg delivery', num: true }, { t: 'Avg pickup', num: true }, { t: 'Failed', num: true }, { t: 'Cost per order', num: true }],
          d.PROVIDERS.filter(p => p.status === 'Connected').map(p => ({ act: 'go', arg: '/marketplace/' + p.id, cells: [
            `<b>${U.esc(p.name)}</b>`, { p0: 412, p1: 786, p2: 198 }[p.id],
            `${p.onTime}% ${U.bar(p.onTime, p.onTime >= 93 ? d.PAL.vodka : d.PAL.tang)}`,
            (p.avgPickup + 20) + 'm', p.avgPickup + 'm',
            { p0: 14, p1: 22, p2: 10 }[p.id], U.money({ p0: 15.58, p1: 15.62, p2: 15.96 }[p.id])] }))), { pad: false })}
        ${U.panel('Delivery time distribution', `
          <div class="hist">${[['<20m', 148], ['20–30m', 402], ['30–40m', 516], ['40–50m', 214], ['50–60m', 62], ['60m+', 24]].map(([l, n]) =>
            `<div class="hs"><span class="hs-b" style="height:${n / 520 * 100}%;background:${l === '60m+' ? d.PAL.tang : d.PAL.vodka}"></span>
              <span class="hs-l">${l}</span><span class="hs-v">${n}</span></div>`).join('')}</div>
          <div class="legend">Median 34 min · the 60m+ tail is almost entirely Al Malqa on reduced hours</div>`)}`;

      const spend = `
        <div class="kpis k-4">
          ${U.kpi('Spend this month', U.money(d.WALLET.monthSpend), d.WALLET.monthOrders.toLocaleString() + ' orders', d.PAL.lav)}
          ${U.kpi('Cost per order', U.money(d.WALLET.avgOrder), 'Last month ' + U.money(15.94), d.PAL.peach)}
          ${U.kpi('Cheapest provider', 'Dash Network', U.money(15.58) + ' per order', d.PAL.flax)}
          ${U.kpi('Not charged', U.money(736), '46 returns and cancellations', '#1f8a4c')}
        </div>
        ${U.panel('Spend by day', `<div class="wk big">${week.map(w => `<div class="wk-c">
          <span class="wk-b" style="height:${w.spend / 4300 * 100}%;background:${d.PAL.lav}"></span>
          <span class="wk-l">${w.d}</span><span class="wk-v">${(w.spend / 1000).toFixed(1)}k</span></div>`).join('')}</div>`)}
        ${U.panel('Spend by branch and provider', U.table(
          [{ t: 'Branch' }, { t: 'Dash Network', num: true }, { t: 'Rehla Fleet', num: true }, { t: 'Sahel Logistics', num: true }, { t: 'Total', num: true }, { t: 'Per order', num: true }],
          d.BRANCHES.map(b => { const t = b.spend * 7, a = Math.round(t * .3), r = Math.round(t * .52), s = t - a - r;
            return { cells: [U.esc(b.name), U.money(a), U.money(r), U.money(s), `<b>${U.money(t)}</b>`, U.money(t / (b.orders * 7))] }; })), { pad: false })}`;

      const cod = `
        <div class="kpis k-4">
          ${U.kpi('COD collected today', U.money(374), '3 orders', d.PAL.peach)}
          ${U.kpi('Settled to you', U.money(224), 'By provider, next business day', d.PAL.flax)}
          ${U.kpi('Outstanding', U.money(150), 'Held by drivers on the road', d.PAL.tang)}
          ${U.kpi('Variance', U.money(0), 'Nothing unaccounted for', '#1f8a4c')}
        </div>
        ${U.panel('Cash on delivery by order', U.table(
          [{ t: 'Order' }, { t: 'Branch' }, { t: 'Provider' }, { t: 'Amount', num: true }, { t: 'Status' }, { t: 'Settlement' }],
          d.ORDERS.filter(o => o.cod).map(o => ({ act: 'go', arg: '/orders/' + o.id, cells: [
            `<b>${o.id}</b>`, d.branch(o.branch).code, o.provider ? U.esc(d.prov(o.provider).name) : '<em class="warn">Waiting</em>',
            U.money(o.cod), U.statusTag(o.status),
            o.status === 'Delivered' ? U.tag('Settled', '#1f8a4c') : o.status === 'Returned' ? U.tag('Not collected', d.PAL.tang, { solid: true }) : U.tag('On the road', d.PAL.lemon, { solid: true })] }))), { pad: false })}
        ${U.note('Dash does not hold your cash.', 'The driver collects it and their provider settles with you directly. Dash records the amount so both sides can reconcile.', d.PAL.peach)}`;

      const slaRep = `
        <div class="kpis k-4">
          ${U.kpi('Promise met', '95.9%', '1,339 of 1,396 orders', '#1f8a4c')}
          ${U.kpi('Promise missed', '57', '4.1% of orders in range', d.PAL.tang)}
          ${U.kpi('Average miss', '14 min', 'Past the promised delivery time', d.PAL.peach)}
          ${U.kpi('Credited back to you', U.money(26.4), 'Automatic credits for missed promises', d.PAL.lav)}
        </div>
        <div class="cols c-1-1">
          ${U.panel('On time by branch', U.table([{ t: 'Branch' }, { t: 'Promise' }, { t: 'Orders', num: true }, { t: 'On time', w: '140px' }, { t: 'Missed', num: true }],
            d.BRANCHES.map(b => ({ cells: [U.esc(b.name), b.code === 'KZ-03' ? '60 min · exception' : '45 min', b.orders * 7,
              b.onTime + '% ' + U.bar(b.onTime, b.onTime >= 95 ? '#1f8a4c' : d.PAL.peach),
              Math.round(b.orders * 7 * (100 - b.onTime) / 100)] }))), { pad: false })}
          ${U.panel('Why the promise was missed', `<div class="blist">${[['Provider took too long to assign', 44],
            ['Your branch was not ready', 26], ['Traffic and distance', 18], ['Failed first attempt', 12]]
            .map(([k, v]) => '<div class="bl"><span>' + k + '</span>' + U.bar(v, d.PAL.tang) + '<b>' + v + '%</b></div>').join('')}</div>
            <div class="legend">Two of these four are yours to fix, and both sit inside your branches.</div>`, { pad: false })}
        </div>
        ${U.panel('Orders that missed the promise', U.table(
          [{ t: 'Order' }, { t: 'Branch' }, { t: 'Fulfilled by' }, { t: 'Promised' }, { t: 'Missed by' }, { t: 'Credit', num: true }],
          d.ORDERS.filter(o => MDEEP.sla(o).state === 'Late').map(o => { const s = MDEEP.sla(o), st = MDEEP.settle(o);
            return { act: 'mTrace', arg: o.id, cells: ['<b>' + o.id + '</b>', d.branch(o.branch).code,
              o.provider ? U.esc(d.prov(o.provider).name) : '<em class="warn">Waiting</em>',
              s.promisedDelivery, '<b style="color:#b0432a">' + MDEEP.dur(Math.max(1, s.over)) + '</b>',
              st.adj < 0 ? '<b style="color:#1f8a4c">−' + U.money(Math.abs(st.adj)) + '</b>' : '—'] }; })), { pad: false,
          right: '<span class="ph-note">Read against the promise on your delivery account</span>' })}`;

      const rootRep = `
        <div class="kpis k-4">
          ${U.kpi('Failed deliveries', '46', '3.3% of orders in range', d.PAL.tang)}
          ${U.kpi('Returned to you', '28', 'Not charged for delivery', d.PAL.peach)}
          ${U.kpi('Escalations you raised', '14', '11 resolved by Dash', d.PAL.lav)}
          ${U.kpi('Caused inside your branches', '38%', 'Not ready, wrong details, no stock', d.PAL.flax)}
        </div>
        <div class="cols c-1-1">
          ${U.panel('Root cause of failures', `<div class="blist">${[['Customer unavailable', 34], ['Your branch not ready', 26],
            ['Wrong or changed address', 18], ['No provider available', 12], ['Vehicle problem', 6], ['Item issue', 4]]
            .map(([k, v]) => '<div class="bl"><span>' + k + '</span>' + U.bar(v, d.PAL.vodka) + '<b>' + v + '%</b></div>').join('')}</div>`, { pad: false })}
          ${U.panel('Escalations and how they closed', U.table([{ t: 'Order' }, { t: 'Reason' }, { t: 'State' }, { t: 'How Dash closed it' }],
            Object.keys(MDEEP.ESCALATIONS).flatMap(id => MDEEP.ESCALATIONS[id].map(e => ({ act: 'mTrace', arg: id, cells: [
              '<b>' + id + '</b>', U.esc(e.reason),
              U.tag(e.state, e.state === 'Resolved' ? '#1f8a4c' : d.PAL.lav, { solid: e.state !== 'Resolved' }),
              U.esc(e.reply || '—')] })))), { pad: false })}
        </div>
        ${U.panel('Failures by branch', U.table([{ t: 'Branch' }, { t: 'Failed', num: true }, { t: 'Returned', num: true },
          { t: 'Caused by the branch', num: true }, { t: 'Most common cause' }],
          d.BRANCHES.map((b, i) => ({ cells: [U.esc(b.name), 14 - i * 2, 9 - i, [6, 4, 3, 1][i] || 1,
            ['Order not ready when the driver arrived', 'Customer unavailable', 'Wrong address on the order', 'Customer unavailable'][i] || 'Customer unavailable'] }))), { pad: false })}`;

      const settleRep = `
        <div class="kpis k-4">
          ${U.kpi('Charges in range', U.money(2814), '148 delivered orders', d.PAL.lav)}
          ${U.kpi('Credits', U.money(-26.4), 'Missed promises, automatic', '#1f8a4c')}
          ${U.kpi('COD credited', U.money(940), 'Netted off your statement', d.PAL.peach)}
          ${U.kpi('Amount due', U.money(2787.6), 'SP-2026-W35 · due 7 Sep', d.PAL.flax)}
        </div>
        ${U.panel('Reconciliation by statement period', U.table(
          [{ t: 'Cycle' }, { t: 'Range' }, { t: 'Orders', num: true }, { t: 'Charges', num: true }, { t: 'Credits', num: true },
           { t: 'COD credited', num: true }, { t: 'Due', num: true }, { t: 'State' }],
          MDEEP.PERIODS.map(p => ({ act: 'mStatement', arg: p.id, cells: ['<b>' + p.id + '</b>', p.label, p.orders,
            U.money(p.charges), '<b style="color:#1f8a4c">' + U.money(p.credits) + '</b>', U.money(p.cod),
            '<b>' + U.money(+(p.charges + p.credits).toFixed(2)) + '</b>',
            U.tag(p.state, MDEEP.SETTLE_STATE[p.state], { solid: p.state !== 'Settled' })] }))), { pad: false })}
        ${U.panel('Spend by provider against what you were promised', U.table(
          [{ t: 'Provider' }, { t: 'Orders', num: true }, { t: 'Charges', num: true }, { t: 'Per order', num: true }, { t: 'On time', w: '130px' }, { t: 'Credits owed to you', num: true }],
          d.PROVIDERS.filter(p => p.status === 'Connected').map(p => { const n = { p0: 412, p1: 786, p2: 198 }[p.id], c = n * 15.6;
            return { cells: ['<b>' + U.esc(p.name) + '</b>', n, U.money(c), U.money(c / n),
              p.onTime + '% ' + U.bar(p.onTime, p.onTime >= 93 ? d.PAL.vodka : d.PAL.tang),
              '<b style="color:#1f8a4c">−' + U.money(Math.round((100 - p.onTime) * n * .0044 * 100) / 100) + '</b>'] }; })), { pad: false,
          right: '<span class="ph-note">A provider that misses more costs you less — and delivers worse</span>' })}
        ${U.note('These are the same numbers your provider sees.', 'Dash holds one record per order. Your statement and their payable are two views of it, so a disagreement is about the record, not about whose spreadsheet is right.', d.PAL.vodka)}`;

      return U.page('Reports and analytics', 'Filter by date, branch, provider and status — then export or schedule it',
        U.btn('Export CSV', { kind: 'primary', act: 'export', arg: 'report' }) + U.btn('Export PDF', { act: 'export', arg: 'report-pdf' }) +
        U.btn('Schedule by email', { act: 'scheduleReport' })) + `
        ${U.filters([
          `<span class="f-l">Range</span>` + U.select(['Today', 'Last 7 days', 'Last 30 days', 'This month', 'Custom…'], 'Last 7 days', { act: 'stub' }),
          `<span class="f-l">Branch</span>` + U.select(['All branches', ...d.BRANCHES.map(b => b.name)], 'All branches', { act: 'stub' }),
          `<span class="f-l">Provider</span>` + U.select(['All providers', ...d.PROVIDERS.filter(p => p.status === 'Connected').map(p => p.name)], 'All providers', { act: 'stub' }),
          `<span class="f-l">Status</span>` + U.select(['All statuses', ...Object.keys(d.STATUS)], 'All statuses', { act: 'stub' }),
          `<span class="f-sp"></span><span class="f-c">1,396 orders in range</span>`
        ])}
        ${U.tabs(['Orders', 'Delivery performance', 'SLA performance', 'Failures and root cause', 'Settlement', 'Spending', 'Cash on delivery'], tab, 'reportTab')}
        ${tab === 'Delivery performance' ? perf : tab === 'SLA performance' ? slaRep :
          tab === 'Failures and root cause' ? rootRep : tab === 'Settlement' ? settleRep :
          tab === 'Spending' ? spend : tab === 'Cash on delivery' ? cod : orders}
        ${U.panel('Scheduled reports', U.table(
          [{ t: 'Report' }, { t: 'Recipients' }, { t: 'Schedule' }, { t: 'Format' }, { t: '', w: '150px' }],
          d.REPORTS.scheduled.map(s => ({ cells: [U.esc(s.n), U.esc(s.to), U.esc(s.when), s.fmt,
            `<div class="rowact">${U.btn('Edit', { act: 'stub', arg: 'Edit schedule' })}${U.btn('Pause', { act: 'stub', arg: 'Schedule paused' })}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 14 Subscription and billing ---------------- */
  SCREENS['billing'] = {
    title: 'Billing', epic: 'Epic 14',
    render() {
      const d = D(), w = d.WALLET;
      return U.page('Subscription and billing', 'Your plan, your wallet, and what Dash charged you',
        U.btn('Top up wallet', { kind: 'primary', act: 'topUp' }) + U.btn('Payment methods', { act: 'stub', arg: 'Cards and bank transfer' })) + `
        <div class="kpis k-4">
          ${U.kpi('Current plan', d.BIZ.plan, '5 branches · 3,000 orders/mo', d.PAL.lav)}
          ${U.kpi('Monthly fee', U.money(1400), 'Billed 1st, Net 15', d.PAL.flax)}
          ${U.kpi('Wallet balance', U.money(w.balance), 'Delivery charges come from here', d.PAL.peach)}
          ${U.kpi('This month', U.money(w.monthSpend + 1400), 'Plan + ' + w.monthOrders.toLocaleString() + ' deliveries', d.PAL.vodka)}
        </div>
        ${w.balance < 5000 ? U.note('Low balance alert set at SAR 800.', 'Auto top-up is on: ' + U.esc(w.autoTop) + '. If the wallet empties, new orders stop dispatching — your existing orders finish normally.', d.PAL.peach) : ''}
        <div class="cols c-1-1">
          ${U.panel('Plans', `<div class="plans">
            ${d.PLANS.map(p => `<div class="plan ${p.n === d.BIZ.plan ? 'on' : ''}">
              <div class="pl-h"><b>${p.n}</b>${p.n === d.BIZ.plan ? U.tag('Current', '#000', { solid: true }) : ''}</div>
              <div class="pl-p">${p.p ? U.money(p.p) + '<em>/month</em>' : 'Talk to Dash'}</div>
              <div class="pl-c">${p.cap}</div>
              <ul>${p.feats.map(f => `<li>${f}</li>`).join('')}</ul>
              ${p.n === d.BIZ.plan ? '' : U.btn(p.p && p.p > 1400 || !p.p ? 'Upgrade' : 'Downgrade', { act: 'changePlan', arg: p.n })}
            </div>`).join('')}
          </div>`, { pad: false })}
          <div class="stack">
            ${U.panel('Wallet', `${U.defs([['Balance', U.money(w.balance)], ['Auto top-up', U.esc(w.autoTop)], ['Last top-up', U.esc(w.lastTop)], ['Low balance alert', 'Email and dashboard at SAR 800']])}
              <div class="sub-h">Transactions</div>
              ${U.table([{ t: 'Date' }, { t: 'Item' }, { t: 'Amount', num: true }],
                w.tx.map(t => ({ cells: [U.esc(t.d), U.esc(t.t),
                  t.a === 0 ? '<em class="sub">No charge</em>' : `<b style="color:${t.a < 0 ? '#b0432a' : '#1f8a4c'}">${t.a < 0 ? '−' : '+'} ${U.money(Math.abs(t.a))}</b>`] })))}`, { pad: false })}
            ${U.panel('Invoices', U.table([{ t: 'Invoice' }, { t: 'Period' }, { t: 'Amount', num: true }, { t: 'Status' }, { t: '', w: '110px' }],
              w.invoices.map(i => ({ cells: [`<b>${i.id}</b>`, U.esc(i.period), U.money(i.amount),
                U.tag(i.status, i.status === 'Paid' ? '#1f8a4c' : d.PAL.lemon, { solid: i.status !== 'Paid' }),
                U.btn('PDF', { act: 'stub', arg: 'Invoice downloaded' })] }))), { pad: false })}
          </div>
        </div>`;
    }
  };

  /* ---------------- 15 Roles and permissions ---------------- */
  SCREENS['roles'] = {
    title: 'Roles', epic: 'Epic 15',
    render() {
      const areas = ['Dashboard', 'Orders', 'Control tower', 'Live map', 'Branches', 'Customers', 'Dispatch config', 'Marketplace', 'Integrations', 'Reports', 'Billing', 'Developer', 'Audit log'];
      const roles = {
        'Admin': areas.map(() => 'Full'),
        'Branch Manager': ['Own branch', 'Own branch', 'Own branch', 'Own branch', 'Own branch', 'Own branch', 'None', 'None', 'None', 'Own branch', 'None', 'None', 'None'],
        'Operations': ['View', 'Full', 'Full', 'Full', 'View', 'Full', 'View', 'View', 'View', 'View', 'None', 'None', 'None'],
        'Finance': ['View', 'View', 'None', 'None', 'View', 'None', 'None', 'View', 'None', 'Full', 'Full', 'None', 'View']
      };
      const cls = v => v === 'Full' ? 'p-full' : v === 'None' ? 'p-none' : 'p-view';
      return U.page('Roles and permissions', 'Four roles cover a multi-branch retailer; add custom roles when they do not',
        U.btn('Create custom role', { kind: 'primary', act: 'stub', arg: 'Custom role builder' }) + U.btn('Invite team member', { act: 'stub', arg: 'Invitation sent' })) + `
        ${U.note('Branch Manager is scoped, not restricted.', 'They see the full product — but only their own branch’s orders, customers and numbers. Nothing from the other three branches appears anywhere.', UI.esc ? MER.PAL.vodka : '#BDB9EF')}
        ${U.panel('Permission matrix', `<div class="tw"><table class="tbl matrix">
          <thead><tr><th>Area</th>${Object.keys(roles).map(r => `<th>${r}</th>`).join('')}</tr></thead>
          <tbody>${areas.map((a, i) => `<tr><td><b>${a}</b></td>${Object.keys(roles).map(r => `<td class="${cls(roles[r][i])}">${roles[r][i]}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`, { pad: false })}
        ${U.panel('Team', U.table(
          [{ t: 'Member' }, { t: 'Email' }, { t: 'Role' }, { t: 'Scope' }, { t: 'Two factor' }, { t: 'Last active' }, { t: '', w: '160px' }],
          [['Sara Al Fahad', 'sara@kanzmarket.sa', 'Admin', 'All branches', true, 'Now'],
           ['Yasser Al Otaibi', 'yasser@kanzmarket.sa', 'Branch Manager', 'Kanz — Hittin', true, '12 min ago'],
           ['Nada Al Harbi', 'nada@kanzmarket.sa', 'Branch Manager', 'Kanz — Al Yasmin', false, '40 min ago'],
           ['Mishal Al Qassim', 'mishal@kanzmarket.sa', 'Operations', 'All branches', true, '4 min ago'],
           ['Noura Al Saleh', 'noura@kanzmarket.sa', 'Finance', 'All branches', true, '2 h ago']]
            .map(([n, e, r, sc, f, t]) => ({ cells: [
              `<div class="who sm">${U.avatar(n)}<span>${U.esc(n)}</span></div>`, e,
              U.tag(r, MER.PAL.lav), U.esc(sc),
              f ? U.tag('On', '#1f8a4c') : U.tag('Off', MER.PAL.tang, { solid: true }), t,
              `<div class="rowact">${U.btn('Change role', { act: 'stub', arg: 'Role changed' })}${U.btn('Remove', { kind: 'danger', act: 'stub', arg: 'Member removed' })}</div>`] }))), { pad: false })}`;
    }
  };

  /* ---------------- 16 Developer settings ---------------- */
  SCREENS['developer'] = {
    title: 'Developer', epic: 'Epic 16',
    render() {
      const d = D();
      return U.page('Developer settings', 'Keys, webhooks and logs. Documentation lives in the public Developer Portal',
        U.btn('Generate key', { kind: 'primary', act: 'genKey' }) + U.btn('Open documentation', { act: 'stub', arg: 'Opens the Dash Developer Portal' })) + `
        <div class="cols c-2-1">
          <div class="stack">
            ${U.panel('API keys', U.table(
              [{ t: 'Label' }, { t: 'Key' }, { t: 'Scope' }, { t: 'Created' }, { t: 'Last used' }, { t: '', w: '150px' }],
              [['Production — Kanz ERP', 'dsh_live_2b09••••', 'Orders, webhooks', '12 Aug 2024', '2 min ago'],
               ['Production — POS', 'dsh_live_7f31••••', 'Orders read only', '4 Mar 2026', '1 h ago'],
               ['Sandbox', 'dsh_test_9a12••••', 'All, test data', '12 Aug 2024', 'Yesterday']]
                .map(([l, k, s, c, u]) => ({ cells: [`<b>${l}</b>`, `<code>${k}</code>`, s, c, u,
                  `<div class="rowact">${U.btn('Rotate', { act: 'stub', arg: 'Key rotated — old key valid 24 h' })}${U.btn('Revoke', { kind: 'danger', act: 'stub', arg: 'Key revoked' })}</div>`] }))), { pad: false })}
            ${U.panel('Webhooks', `
              ${U.field('Endpoint', U.input('https://erp.kanzmarket.sa/hooks/dash'))}
              ${U.field('Events', `<div class="chips">${['order.created', 'order.assigned', 'order.picked_up', 'order.delivered', 'order.failed', 'order.returned', 'order.cancelled'].map((e, i) => `<button type="button" class="chip ${i < 6 ? 'on' : ''}" data-act="stub" data-arg="Toggle ${e}">${e}</button>`).join('')}</div>`)}
              ${U.field('Signing secret', U.input('whsec_3d81••••••', '', { type: 'password' }), 'Verify every payload against this before trusting it')}
              <div class="btnrow">${U.btn('Send test event', { act: 'stub', arg: 'Test event delivered — 200 OK in 78 ms' })}${U.btn('Save', { kind: 'primary', act: 'stub', arg: 'Webhook saved' })}</div>
              ${U.note('Your endpoint is currently failing.', 'order.assigned has retried 3 times with a 500. Dash keeps retrying for 24 hours with backoff.', d.PAL.tang)}`)}
            ${U.panel('API and webhook logs', U.table(
              [{ t: 'Time' }, { t: 'Direction' }, { t: 'Event or endpoint' }, { t: 'Status' }, { t: 'Latency', num: true }],
              [['15:44:02', 'In', 'POST /v1/orders', '201', '104 ms'],
               ['15:44:03', 'Out', 'order.created → erp.kanzmarket.sa', '200', '78 ms'],
               ['15:42:10', 'Out', 'order.assigned → erp.kanzmarket.sa', '500', 'retry 3'],
               ['15:41:18', 'In', 'POST /v1/orders', '201', '96 ms'],
               ['15:20:11', 'In', 'POST /v1/orders', '500', '22 ms'],
               ['15:04:52', 'In', 'GET /v1/orders?status=active', '200', '34 ms']]
                .map(([t, dir, e, s, l]) => ({ cells: [t, U.tag(dir, dir === 'In' ? d.PAL.lav : d.PAL.peach), `<code>${e}</code>`,
                  U.tag(s, s.startsWith('2') ? '#1f8a4c' : d.PAL.tang, { solid: !s.startsWith('2') }), l] }))), { pad: false })}
          </div>
          <div class="stack">
            ${U.panel('Usage', `${U.defs([['Calls this month', '186,420'], ['Included', '200,000'], ['Overage', 'None'], ['Rate limit', '120 requests / minute'], ['Error rate', '0.6%']])}
              <div class="sub-h">Calls per day</div>${U.spark([9, 11, 10, 13, 16, 8, 12], d.PAL.lav, 44)}`)}
            ${U.panel('Sandbox', `${U.field('Sandbox mode', U.toggle(false, 'stub', '', 'Deferred — coming with the Developer Portal'))}
              ${U.note('Test keys work today.', 'A full sandbox with simulated drivers is a later milestone; the test key already accepts orders and fires webhooks.', d.PAL.vodka)}`)}
          </div>
        </div>`;
    }
  };

  /* ---------------- 17 Notifications ---------------- */
  SCREENS['notifications'] = {
    title: 'Notifications', epic: 'Epic 17',
    render() {
      const d = D(), p = STATE.np;
      return U.page('Notifications', 'Everything the system wants you to know, and what you want to be told about',
        U.btn('Mark all read', { act: 'stub', arg: 'All notifications marked read' })) + `
        <div class="cols c-2-1">
          ${U.panel('Inbox', `<div class="alerts">${d.NOTIFS.map(n => `
            <a class="alert s-${n.sev}" href="${n.link}"><span class="alert-k">${n.k}</span>
              <span class="alert-t">${U.esc(n.t)}</span><span class="alert-d">${n.d}</span></a>`).join('')}</div>`, { pad: false })}
          ${U.panel('Preferences', `
            ${U.field('Order updates', U.toggle(p.order, 'npOrder', '', 'Assigned, delayed, failed, returned'))}
            ${U.field('Alerts and warnings', U.toggle(p.alerts, 'npAlerts', '', 'Stuck orders, integration failures'))}
            ${U.field('Provider activity', U.toggle(p.provider, 'npProvider', '', 'Connection approved, declined or disconnected'))}
            ${U.field('Billing', U.toggle(p.billing, 'npBilling', '', 'Low balance, invoices, plan changes'))}
            ${U.field('System messages', U.toggle(p.system, 'npSystem', '', 'Releases, maintenance, connector updates'))}
            ${U.note('High severity also goes by email.', 'A stuck order or a failing integration reaches whoever holds the Operations role, not just this inbox.', d.PAL.lemon)}`)}
        </div>`;
    }
  };

  /* ---------------- 19 Support and tickets ---------------- */
  SCREENS['support'] = {
    title: 'Support', epic: 'Epic 19',
    render() {
      const d = D();
      return U.page('Support', 'Tickets to Dash Hub, linked to the order or provider they are about',
        U.btn('Submit ticket', { kind: 'primary', act: 'newTicket' })) + `
        <div class="cols c-2-1">
          ${U.panel('Your tickets', U.table(
            [{ t: 'Ticket' }, { t: 'Kind' }, { t: 'Subject' }, { t: 'Linked to' }, { t: 'Priority' }, { t: 'Status' }, { t: 'Opened' }, { t: 'Last update' }],
            d.TICKETS.map(t => ({ cells: [`<b>${t.id}</b>`, U.esc(t.kind), U.esc(t.t), `<code>${U.esc(t.link)}</code>`,
              U.tag(t.p, t.p === 'High' ? d.PAL.tang : d.PAL.lav),
              U.tag(t.s, t.s === 'Resolved' ? '#1f8a4c' : t.s === 'Open' ? d.PAL.lemon : d.PAL.peach, { solid: t.s !== 'Resolved' }),
              U.esc(t.opened), U.esc(t.last)] }))), { pad: false })}
          ${U.panel('Submit a ticket', `
            ${U.field('What is this about', U.select(['Escalate an order', 'Report a 3PL', 'Billing question', 'Technical or integration', 'Something else'], 'Escalate an order'), 'Escalating an order gives Dash the full routing trace automatically')}
            ${U.field('Subject', U.input('', 'Provider returned an order without calling'))}
            ${U.field('Link to', U.select(['Nothing specific', ...d.ORDERS.slice(0, 6).map(o => o.id), ...d.PROVIDERS.filter(p => p.status === 'Connected').map(p => p.name)], 'Nothing specific'))}
            ${U.field('Priority', U.radio(['Normal', 'High'], 'Normal', 'stub'))}
            ${U.field('Description', `<textarea class="in" rows="4" placeholder="What happened, and what you expected instead."></textarea>`)}
            <div class="btnrow">${U.btn('Send to Dash', { kind: 'primary', act: 'newTicket' })}</div>
            ${U.note('Response times on Retail Growth.', 'High priority within 1 hour. Normal within one business day. Order escalations are always treated as high.', d.PAL.lemon)}`)}
        </div>`;
    }
  };

  /* ---------------- 20 Audit log ---------------- */
  SCREENS['audit'] = {
    title: 'Audit log', epic: 'Epic 20',
    render() {
      const d = D();
      return U.page('Audit log', 'Every action in the account — who did what, when, and from where',
        U.btn('Export log', { kind: 'primary', act: 'export', arg: 'audit' })) + `
        ${U.filters([
          U.input('', 'Search action or record…', { act: 'stub' }),
          `<span class="f-l">User</span>` + U.select(['All users', 'Sara Al Fahad', 'Yasser Al Otaibi', 'Rana Al Zahrani', 'Noura Al Saleh', 'System'], 'All users', { act: 'stub' }),
          `<span class="f-l">Action type</span>` + U.select(['All actions', 'Created', 'Changed', 'Cancelled', 'Exported', 'Requested'], 'All actions', { act: 'stub' }),
          `<span class="f-l">Range</span>` + U.select(['Today', 'Last 7 days', 'Last 30 days'], 'Today', { act: 'stub' }),
          `<span class="f-sp"></span><span class="f-c">${d.AUDIT.length} entries today</span>`
        ])}
        ${U.panel('', U.table(
          [{ t: 'Time' }, { t: 'User' }, { t: 'Role' }, { t: 'Action' }, { t: 'Record' }, { t: 'IP' }],
          d.AUDIT.map(a => ({ cells: [a.t, U.esc(a.u), a.r === 'System' ? '<em class="sub">System</em>' : U.tag(a.r, d.PAL.lav),
            `<b>${U.esc(a.a)}</b>`, `<code>${U.esc(a.o)}</code>`, a.ip] }))), { pad: false })}
        ${U.note('The audit log is append-only.', 'Nobody, including an Admin, can edit or delete an entry. Exports are themselves logged.', d.PAL.lav)}`;
    }
  };
})();
