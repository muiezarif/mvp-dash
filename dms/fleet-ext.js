/* Dash DMS — driver ⇄ shift/group/zone membership, driver payout account (IBAN), settlement ledger by counterparty */
(function () {
  const D = () => window.DMS, U = () => window.UI, R = () => window.RENDER && window.RENDER();
  window.STATE = window.STATE || {};
  STATE.settleTab = STATE.settleTab || 'Overview';

  /* ---------- payout accounts ---------- */
  const BANKS = ['Al Rajhi Bank', 'Saudi National Bank', 'Riyad Bank', 'Alinma Bank', 'Saudi Awwal Bank'];
  D().DRIVERS.forEach((x, i) => {
    if (x.payout) return;
    const n = String(4471 + i * 1373).slice(-4);
    const kk = String(10 + (31 + i * 7) % 89).padStart(2, '0');
    const digits = ['8000', '1000', '2000', '0500', '4500'][i % 5] + '0000' + '6080' + String(1021 + i * 37).padStart(4, '0') + n;
    x.payout = { method: 'IBAN', iban: ('SA' + kk + digits).match(/.{4}/g).join(' '),
      bank: BANKS[i % 5], holder: x.name, state: x.id === 'd8' ? 'Pending check' : 'Verified', added: x.app.invited };
  });
  const mask = iban => 'SA•• •••• •••• ' + iban.replace(/\s/g, '').slice(-4);
  const payState = p => U().tag(p.state, p.state === 'Verified' ? '#1f8a4c' : D().PAL.lemon, { solid: p.state !== 'Verified' });
  const net = x => x.wallet.earned - x.wallet.payouts - x.wallet.deductions - x.wallet.cod;

  window.PAYOUT = {
    mask, net,
    row: x => mask(x.payout.iban) + ' <em class="sub">' + x.payout.bank + '</em> ' + payState(x.payout),
    panel: x => {
      const p = x.payout, n = net(x);
      return U().panel('Payout account', `<div class="cols c-1-1">
        ${U().defs([
          ['Paid to', '<b>Bank transfer · IBAN</b>'],
          ['IBAN', '<span style="font-family:var(--mono)">' + p.iban + '</span>'],
          ['Bank', p.bank], ['Account holder', U().esc(p.holder)],
          ['Check', payState(p) + (p.state === 'Verified' ? ' <em class="sub">name matches National ID</em>' : ' <em class="sub">payouts held until the name check clears</em>')],
          ['Next payout', x.contract.terms + ' · ' + (n > 0 ? U().money(n) : 'nothing due')]])}
        <div class="paym">
          <div class="paym-o on"><b>IBAN</b><em>Default. Every payout goes by bank transfer to the account on the left.</em>${U().tag('Active', '#1f8a4c')}</div>
          <div class="paym-o off"><b>Dash wallet</b><em>Driver holds earnings in the Dash Driver App and withdraws when they want.</em>${U().tag('Not available yet', '#c9c9c9')}</div>
        </div></div>`,
        { right: U().btn('Change IBAN', { act: 'payEdit', arg: x.id }) + (n > 0 && p.state === 'Verified' ? U().btn('Pay now', { kind: 'primary', act: 'payNow', arg: x.id }) : '') });
    }
  };

  /* ---------- membership ---------- */
  const KIND = {
    shift: { list: () => D().SHIFTS, key: 'drivers', label: s => s.name + ' shift', sub: s => s.window, cur: x => D().SHIFTS.find(s => s.id === x.shift) },
    group: { list: () => D().GROUPS, key: 'drivers', label: g => g.name, sub: g => g.by, cur: x => D().GROUPS.find(g => g.id === x.group) },
    zone: { list: () => D().ZONES, key: 'drivers', label: z => z.code + ' — ' + z.name.split('— ')[1], sub: z => z.districts.join(', '), cur: x => D().zone(x.zone) }
  };
  function move(kind, did, tid) {
    const K = KIND[kind], x = D().driver(did);
    K.list().forEach(t => { t[K.key] = t[K.key].filter(id => id !== did); });
    const t = K.list().find(t => t.id === tid);
    t[K.key].push(did); x[kind] = tid;
  }
  function memDrawer(kind, tid) {
    const K = KIND[kind], t = K.list().find(t => t.id === tid), d = D(), esc = U().esc;
    const ins = t.drivers.map(d.driver), outs = d.DRIVERS.filter(x => !t.drivers.includes(x.id));
    const note = { shift: 'A driver works one shift. Adding moves them off their current one.', group: 'A driver belongs to one group, so reports never double-count. Adding moves them.', zone: 'A driver has one home zone. Adding moves them; assignment can still pull them into adjacent zones.' }[kind];
    U().drawer('Drivers — <b>' + esc(K.label(t)) + '</b>', `
      <div class="dw-meta">${esc(K.sub(t))} · ${ins.length} driver${ins.length === 1 ? '' : 's'}</div>
      <div class="sub-h">On this ${kind}</div>
      <div class="members">${ins.map(x => `<div class="mem">${U().avatar(x.name)}<span style="flex:1">${esc(x.name)}<em>${d.zone(x.zone).code} · ${x.status}</em></span><a class="btn" href="#/drivers/${x.id}">Profile</a></div>`).join('') || '<div class="empty">Nobody yet.</div>'}</div>
      <div class="sub-h" style="margin-top:14px">Add drivers</div>
      <div class="members">${outs.map(x => `<div class="mem">${U().avatar(x.name)}<span style="flex:1">${esc(x.name)}<em>Now: ${esc(K.cur(x) ? K.label(K.cur(x)) : 'none')}</em></span>${U().btn('Add', { kind: 'primary', act: 'memAdd', arg: kind + '|' + tid + '|' + x.id })}</div>`).join('') || '<div class="empty">Every driver is already here.</div>'}</div>
      ${U().note('One at a time.', note, d.PAL.lav)}`);
  }
  function assignDrawer(did) {
    const x = D().driver(did), esc = U().esc;
    const sel = kind => { const K = KIND[kind]; return `<select class="in" data-drva="${kind}">${K.list().map(t => `<option value="${t.id}" ${x[kind] === t.id ? 'selected' : ''}>${esc(K.label(t))}</option>`).join('')}</select>`; };
    U().drawer('Shift, group and zone — <b>' + esc(x.name) + '</b>', `
      <div class="dw-meta">Changes apply from the next order. The driver app updates on next sync.</div>
      ${U().field('Shift', sel('shift'), 'Auto online follows the shift window if it’s switched on')}
      ${U().field('Group', sel('group'))}
      ${U().field('Home zone', sel('zone'))}`,
      { footer: U().btn('Save', { kind: 'primary', act: 'drvAssignSave', arg: did }) });
  }

  /* ---------- settlement ledger ---------- */
  const TABS = ['Overview', 'Merchants', 'Drivers', 'Dash Network', 'Per-order records'];
  const MER = () => D().MERCHANTS.filter(m => m.status === 'Connected').map((m, i) => {
    const fees = Math.round(m.volume * 7 * 15.8 + i * 113), cod = [3120, 0, 1480, 640, 920][i % 5];
    const paid = [0.62, 1, 0.4, 0.85, 0.7][i % 5] * (fees - cod);
    const owe = +(fees - cod - paid).toFixed(2), overdue = i === 2 ? +(owe * 0.6).toFixed(2) : 0;
    return { m, fees, cod, paid: +paid.toFixed(2), owe, overdue, terms: m.contract ? m.contract.terms : 'Net 15',
      due: ['7 Sep', '—', '29 Aug', '10 Sep', '12 Sep'][i % 5] };
  });
  const NET = [
    { p: 'SP-2026-W36', r: '1 – 7 Sep', inN: 46, inA: 1104.0, outN: 12, outA: 312.6, state: 'Accruing' },
    { p: 'SP-2026-W35', r: '25 – 31 Aug', inN: 71, inA: 1712.4, outN: 18, outA: 468.0, state: 'Ready' },
    { p: 'SP-2026-W34', r: '18 – 24 Aug', inN: 22, inA: 528.0, outN: 41, outA: 1066.0, state: 'Ready' },
    { p: 'SP-2026-W33', r: '11 – 17 Aug', inN: 64, inA: 1536.0, outN: 15, outA: 390.0, state: 'Settled' }
  ];
  const G = '#1f8a4c', T = () => D().PAL.tang;
  const dir = v => v >= 0 ? U().tag('Owes you', G) : U().tag('You owe', T(), { solid: true });
  const amt = v => `<b style="color:${v >= 0 ? G : '#b0432a'}">${U().money(Math.abs(v))}</b>`;

  function totals() {
    const mer = MER(), drv = D().DRIVERS, open = NET.filter(n => n.state !== 'Settled');
    const netBal = open.reduce((s, n) => s + n.inA - n.outA, 0);
    return {
      merOwe: mer.reduce((s, r) => s + Math.max(r.owe, 0), 0), merN: mer.filter(r => r.owe > 0).length,
      merOverdue: mer.reduce((s, r) => s + r.overdue, 0),
      drvOwe: drv.reduce((s, x) => s + Math.max(net(x), 0), 0), drvN: drv.filter(x => net(x) > 0).length,
      cashHeld: drv.reduce((s, x) => s + Math.max(-net(x), 0), 0), cashN: drv.filter(x => net(x) < 0).length,
      netIn: open.reduce((s, n) => s + n.inA, 0), netOut: open.reduce((s, n) => s + n.outA, 0), netBal
    };
  }

  function side(title, total, color, rows) {
    return `<section class="ldg-s" style="--lc:${color}">
      <div class="ldg-k">${title}</div><div class="ldg-v">${U().money(total)}</div>
      ${rows.map(([l, s, v, tab]) => `<button type="button" class="ldg-r" data-act="ledTab" data-arg="${tab}"><span><b>${l}</b><em>${s}</em></span><span class="ldg-a">${U().money(v)}</span></button>`).join('')}
    </section>`;
  }

  function overview() {
    const t = totals(), inSum = t.merOwe + t.cashHeld + Math.max(t.netBal, 0), outSum = t.drvOwe + Math.max(-t.netBal, 0), pos = inSum - outSum;
    return `<div class="ldg-dual">
      ${side('Owed to you', inSum, G, [
        ['Merchants', t.merN + ' merchants · delivery fees less COD you hold for them' + (t.merOverdue ? ' · ' + U().money(t.merOverdue) + ' overdue' : ''), t.merOwe, 'Merchants'],
        ['Drivers holding cash', t.cashN + ' driver' + (t.cashN === 1 ? '' : 's') + ' · COD not yet handed over, more than they’re owed', t.cashHeld, 'Drivers']]
        .concat(t.netBal >= 0 ? [['Dash Network', 'Net of orders you carried and overflow you sent', t.netBal, 'Dash Network']] : []))}
      ${side('You owe', outSum, '#b0432a', [
        ['Drivers', t.drvN + ' drivers · earnings less payouts, deductions and cash they hold', t.drvOwe, 'Drivers']]
        .concat(t.netBal < 0 ? [['Dash Network', 'Net of overflow you sent and orders you carried', -t.netBal, 'Dash Network']] : []))}
    </div>
    <div class="ldg-net"><span>Net position, open periods</span><b style="color:${pos >= 0 ? G : '#b0432a'}">${pos >= 0 ? '+' : '−'} ${U().money(Math.abs(pos))}</b><em>${pos >= 0 ? 'More is coming in than going out' : 'More is going out than coming in'}</em></div>
    ${U().panel('Who, which way, when', U().table(
      [{ t: 'Counterparty' }, { t: 'Type' }, { t: 'Direction' }, { t: 'Amount', num: true }, { t: 'Due' }],
      MER().filter(r => r.owe > 0).map(r => ({ act: 'ledTab', arg: 'Merchants', cells: [U().esc(r.m.name), 'Merchant', dir(r.owe), amt(r.owe), r.overdue ? '<em class="warn">Overdue · ' + r.due + '</em>' : r.due] }))
      .concat(D().DRIVERS.filter(x => net(x) !== 0).map(x => ({ act: 'ledTab', arg: 'Drivers', cells: [U().esc(x.name), 'Driver', dir(-net(x)), amt(-net(x)), net(x) > 0 ? x.contract.terms : 'Next handover'] })))
      .concat([{ act: 'ledTab', arg: 'Dash Network', cells: ['Dash', 'Dash Network', dir(t.netBal), amt(t.netBal), 'Statement 3 Sep'] }])), { pad: false })}`;
  }

  function merchants() {
    const rows = MER(), t = totals();
    return `<div class="kpis k-4">
        ${U().kpi('Merchants owe you', U().money(t.merOwe), t.merN + ' with a balance', '#1f8a4c')}
        ${U().kpi('Overdue', U().money(t.merOverdue), 'Past payment terms', D().PAL.tang)}
        ${U().kpi('Delivery fees this period', U().money(rows.reduce((s, r) => s + r.fees, 0)), 'Invoiced to merchants', D().PAL.lav)}
        ${U().kpi('COD you hold for them', U().money(rows.reduce((s, r) => s + r.cod, 0)), 'Netted off their invoice', D().PAL.peach)}
      </div>
      ${U().panel('Merchant balances', U().table(
        [{ t: 'Merchant' }, { t: 'Delivery fees', num: true }, { t: 'Less COD held', num: true }, { t: 'Paid', num: true }, { t: 'They owe you', num: true }, { t: 'Terms' }, { t: 'Due' }, { t: 'State' }, { t: '', w: '170px' }],
        rows.map(r => ({ cells: [
          `<a href="#/merchants/${r.m.id}"><b>${U().esc(r.m.name)}</b></a><em class="sub">${r.m.kind}</em>`,
          U().money(r.fees), r.cod ? '− ' + U().money(r.cod) : '—', U().money(r.paid), r.owe > 0 ? amt(r.owe) : '—', r.terms,
          r.overdue ? '<em class="warn">' + r.due + '</em>' : r.due,
          r.owe <= 0 ? U().tag('Paid up', G) : r.overdue ? U().tag('Overdue', D().PAL.tang, { solid: true }) : U().tag('Open', D().PAL.lemon, { solid: true }),
          '<div class="rowact">' + (r.owe > 0 ? U().btn(r.overdue ? 'Chase' : 'Send reminder', { act: 'stub', arg: 'Reminder sent to ' + r.m.name }) : '') + U().btn('Statement', { act: 'export', arg: r.m.name + ' statement' }) + '</div>'] }))), { pad: false })}
      ${U().note('One direction.', 'Merchants pay you for delivery. Cash your drivers collected on their orders belongs to them, so it comes off the invoice before you chase the balance.', D().PAL.lav)}`;
  }

  function drivers() {
    const d = D(), t = totals();
    return `<div class="kpis k-4">
        ${U().kpi('You owe drivers', U().money(t.drvOwe), t.drvN + ' drivers due a payout', D().PAL.tang)}
        ${U().kpi('Drivers owe you', U().money(t.cashHeld), 'Cash held above what they’re owed', '#1f8a4c')}
        ${U().kpi('Paid out this period', U().money(d.DRIVERS.reduce((s, x) => s + x.wallet.payouts, 0)), 'By bank transfer', D().PAL.lav)}
        ${U().kpi('Payouts on hold', d.DRIVERS.filter(x => x.payout.state !== 'Verified').length, 'IBAN name check pending', D().PAL.lemon)}
      </div>
      ${U().panel('Driver balances', U().table(
        [{ t: 'Driver' }, { t: 'Earned', num: true }, { t: 'Paid', num: true }, { t: 'Deductions', num: true }, { t: 'Cash held', num: true }, { t: 'Balance', num: true }, { t: 'Direction' }, { t: 'Paid to' }, { t: '', w: '150px' }],
        d.DRIVERS.map(x => { const n = net(x); return { cells: [
          `<a href="#/drivers/${x.id}"><b>${U().esc(x.name)}</b></a><em class="sub">${x.contract.model} · ${x.contract.terms}</em>`,
          U().money(x.wallet.earned), U().money(x.wallet.payouts), x.wallet.deductions ? '− ' + U().money(x.wallet.deductions) : '—',
          x.wallet.cod ? '− ' + U().money(x.wallet.cod) : '—', n ? amt(-n) : '—',
          n > 0 ? U().tag('You owe', D().PAL.tang, { solid: true }) : n < 0 ? U().tag('Owes you', G) : U().tag('Settled', '#c9c9c9'),
          '<span style="font-family:var(--mono);font-size:11px">' + mask(x.payout.iban) + '</span>' + (x.payout.state !== 'Verified' ? ' ' + U().tag('On hold', D().PAL.lemon, { solid: true }) : ''),
          '<div class="rowact">' + (n > 0 ? U().btn('Pay', { kind: x.payout.state === 'Verified' ? 'primary' : '', act: 'payNow', arg: x.id }) : n < 0 ? U().btn('Handover', { act: 'handover', arg: x.id }) : '') + '</div>'] }; })), { pad: false,
        right: U().btn('Pay all due', { kind: 'primary', act: 'payAll' }) })}
      ${U().note('Paid to the driver’s IBAN.', 'Every payout goes by bank transfer to the IBAN on the driver profile. A Dash wallet the driver can withdraw from will be offered later.', D().PAL.lav)}`;
  }

  function network() {
    const t = totals();
    return `<div class="ldg-dual">
        <section class="ldg-s" style="--lc:${G}"><div class="ldg-k">Dash owes you · supply</div><div class="ldg-v">${U().money(t.netIn)}</div>
          <p class="ldg-p">Orders other fleets and merchants sent through Dash that your drivers carried. Network rate card, less 8% commission.</p></section>
        <section class="ldg-s" style="--lc:#b0432a"><div class="ldg-k">You owe Dash · demand</div><div class="ldg-v">${U().money(t.netOut)}</div>
          <p class="ldg-p">Overflow you pushed into the Network. You are the customer for those deliveries, on the Network rate card.</p></section>
      </div>
      <div class="ldg-net"><span>Net with Dash, open periods</span><b style="color:${t.netBal >= 0 ? G : '#b0432a'}">${t.netBal >= 0 ? '+' : '−'} ${U().money(Math.abs(t.netBal))}</b><em>${t.netBal >= 0 ? 'Dash pays you the difference' : 'You pay Dash the difference'} — the two directions net before money moves</em></div>
      ${U().panel('By period', U().table(
        [{ t: 'Period' }, { t: 'Range' }, { t: 'Orders received', num: true }, { t: 'Dash owes you', num: true }, { t: 'Orders sent', num: true }, { t: 'You owe Dash', num: true }, { t: 'Net', num: true }, { t: 'Who pays' }, { t: 'State' }],
        NET.map(n => { const b = n.inA - n.outA; return { cells: [`<b>${n.p}</b>`, n.r, n.inN, U().money(n.inA), n.outN, U().money(n.outA), amt(b),
          b >= 0 ? 'Dash pays you' : 'You pay Dash', U().tag(n.state, n.state === 'Settled' ? G : n.state === 'Ready' ? D().PAL.lav : D().PAL.lemon, { solid: n.state !== 'Settled' })] }; })), { pad: false })}
      ${U().note('Week 34 ran the other way.', 'RYD-W was paused for two days, so you sent more overflow than you carried and owed Dash for that week.', D().PAL.peach)}`;
  }

  window.LEDGER = {
    tabs: tab => U().tabs(TABS, tab, 'ledTab'),
    body: tab => tab === 'Merchants' ? merchants() : tab === 'Drivers' ? drivers() : tab === 'Dash Network' ? network() : overview()
  };

  /* ---------- actions ---------- */
  window.ACT = Object.assign(window.ACT || {}, {
    memPick: a => { const [k, id] = a.split('|'); memDrawer(k, id); },
    memAdd: a => { const [k, tid, did] = a.split('|'), K = KIND[k], t = K.list().find(t => t.id === tid);
      move(k, did, tid); U().toast(D().driver(did).name + ' added to ' + K.label(t)); R(); memDrawer(k, tid); },
    drvAssign: id => assignDrawer(id),
    drvAssignSave: id => {
      document.querySelectorAll('[data-drva]').forEach(s => { if (D().driver(id)[s.dataset.drva] !== s.value) move(s.dataset.drva, id, s.value); });
      U().closeDrawer(); U().toast('Shift, group and zone updated for ' + D().driver(id).name); R();
    },
    payEdit: id => {
      const x = D().driver(id);
      U().drawer('Payout account — <b>' + U().esc(x.name) + '</b>', `
        <div class="dw-meta">Earnings are paid by bank transfer to this IBAN.</div>
        ${U().field('IBAN', `<input class="in" id="pay-iban" value="${x.payout.iban}" style="font-family:var(--mono)">`, 'Saudi IBAN, 24 characters starting SA')}
        ${U().field('Bank', U().select(BANKS, x.payout.bank, {}))}
        ${U().field('Account holder', U().input(x.name, ''), 'Must match the name on the National ID')}
        ${U().note('Payouts pause for one check.', 'Changing the IBAN holds the next payout until Dash confirms the account holder matches the driver. Usually under an hour.', D().PAL.lemon)}`,
        { footer: U().btn('Save IBAN', { kind: 'primary', act: 'paySave', arg: id }) });
    },
    paySave: id => {
      const x = D().driver(id), v = (document.getElementById('pay-iban') || {}).value || '';
      if (!/^SA\d{2}[\d ]{20,}$/i.test(v.replace(/\s+/g, ' ').trim())) return U().toast('That doesn’t look like a Saudi IBAN');
      x.payout.iban = v.toUpperCase().trim(); x.payout.state = 'Pending check';
      U().closeDrawer(); U().toast('IBAN saved — next payout holds until the name check clears'); R();
    },
    payNow: id => {
      const x = D().driver(id), n = net(x);
      if (x.payout.state !== 'Verified') return U().toast('Payout held — ' + x.name + '’s IBAN is still being checked');
      if (n <= 0) return U().toast('Nothing due to ' + x.name);
      x.wallet.payouts += n; x.wallet.tx.unshift({ d: 'Today', t: 'Payout to IBAN ' + mask(x.payout.iban), a: -n });
      U().toast(U().money(n) + ' sent to ' + x.name + ' · ' + mask(x.payout.iban)); R();
    },
    payAll: () => {
      const due = D().DRIVERS.filter(x => net(x) > 0 && x.payout.state === 'Verified'), held = D().DRIVERS.filter(x => net(x) > 0 && x.payout.state !== 'Verified');
      let s = 0; due.forEach(x => { const n = net(x); s += n; x.wallet.payouts += n; x.wallet.tx.unshift({ d: 'Today', t: 'Payout to IBAN ' + mask(x.payout.iban), a: -n }); });
      U().toast(U().money(s) + ' paid to ' + due.length + ' drivers' + (held.length ? ' · ' + held.length + ' held for IBAN check' : '')); R();
    },
    ledTab: t => { STATE.settleTab = t; R(); }
  });
})();
