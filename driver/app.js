/* Dash Driver App — screens + interaction */
(function () {
  const P = () => DRV.POLICY, M = () => DRV.ME;
  const S = window.ST = {
    screen: 'login', arg: null, online: true, tab: 'orders',
    histFilter: 'All', chat: DRV.CHAT.slice(), notifRead: false,
    navApp: 'Google Maps', pod: {}, sheet: null
  };
  const money = n => 'SAR ' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const now = () => { const d = new Date(); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };
  const tag = (t, c, solid) => `<span class="tag ${solid ? 'solid' : ''}" style="--tc:${c || 'var(--line)'}">${esc(t)}</span>`;
  const active = () => DRV.ORDERS.filter(o => o.tag === 'On demand' && !['Delivered','Cancelled','Returned'].includes(o.status));
  const upcoming = () => DRV.ORDERS.filter(o => o.tag === 'Scheduled' && !['Delivered','Cancelled','Returned'].includes(o.status));
  const current = () => active().find(o => o.status !== 'Accepted') || active()[0];
  const unread = () => S.notifRead ? 0 : DRV.NOTIFS.filter(n => n.sev !== 'low').length;
  const issuesFor = id => DRV.ISSUES.filter(x => x.order === id);
  const openIssues = () => DRV.ISSUES.filter(x => x.state !== 'Resolved');

  const statusColor = s => ({ 'Accepted':DRV.PAL.lemon,'To pickup':DRV.PAL.peach,'At pickup':DRV.PAL.peach,
    'Picked up':DRV.PAL.lav,'To delivery':DRV.PAL.lav,'At delivery':DRV.PAL.vodka,
    'Delivered':'#7BD389','Cancelled':DRV.PAL.tang,'Returned':DRV.PAL.tang }[s] || DRV.PAL.lemon);

  /* ---------- chrome ---------- */
  const sb = () => `<div class="sb"><span>15:48</span>
    <span class="sb-r">${S.online ? 'ONLINE' : 'OFFLINE'} · 5G <span class="bat"><i></i></span></span></div>`;

  const hdr = (title, kick, opt = {}) => `<div class="hdr">
    ${opt.back ? `<button class="back" data-a="back">←</button>` : ''}
    <div style="flex:1;min-width:0">${kick ? `<span class="kick">${esc(kick)}</span>` : ''}<h1>${esc(title)}</h1></div>
    ${opt.act || ''}</div>`;

  const tabbar = () => {
    const items = [['orders','Orders','t-orders'],['map','Map','t-map'],['wallet','Wallet','t-wallet'],['chat','Chat','t-chat'],['more','More','t-more']];
    return `<nav class="tabbar">${items.map(([k, l, c]) =>
      `<button class="tb ${c} ${S.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}"><i></i>${k === 'chat' && !S.chatRead ? '' : ''}<span>${l}</span></button>`).join('')}</nav>`;
  };

  const onbar = () => `<div class="onbar ${S.online ? 'on' : 'off'}">
    <button class="osw" data-a="online"><i></i></button>
    <div style="flex:1">
      <b>${S.online ? 'You are online' : 'You are offline'}</b>
      <em>${P().autoOnline ? M().shift.name + ' shift · ' + M().shift.window : 'Manual — you control this'}</em>
    </div>
    ${P().autoOnline ? '<span class="lock">Shift set</span>' : ''}</div>`;

  /* ---------- screens ---------- */
  const SC = {};

  const oc = (o, isCur) => `<button class="oc ${isCur ? 'now' : ''}" data-a="order" data-v="${o.id}">
    <div class="oc-h">
      <b>${o.id}</b>
      <span style="display:flex;gap:5px">
        ${o.prio === 'High' ? tag('Priority', DRV.PAL.tang, true) : ''}
        ${tag(o.tag, o.tag === 'Scheduled' ? DRV.PAL.vodka : DRV.PAL.lemon)}
        ${tag(o.status, statusColor(o.status), true)}
      </span>
    </div>
    <div class="oc-b">
      <div class="oc-r"><div class="oc-l"><i style="background:${DRV.PAL.peach}"></i><s></s></div>
        <div class="oc-t"><b>${esc(o.branch)}</b><em>${esc(o.pickAddr)}</em></div></div>
      <div class="oc-r"><div class="oc-l"><i style="background:${DRV.PAL.vodka}"></i></div>
        <div class="oc-t"><b>${esc(o.dropAddr)}</b><em>${esc(o.cust)}</em></div></div>
    </div>
    <div class="oc-f">
      <span>${o.km} km · ${o.slot ? 'Slot ' + o.slot.replace('Today ', '') : 'ETA ' + o.eta}</span>
      <span>${o.cod ? 'COD <b>' + money(o.cod) + '</b>' : 'Cash free'} · <b>${money(o.pay)}</b></span>
    </div>
  </button>`;

  SC.login = () => `${sb()}
    <div class="login">
      <div class="lw"><b>DASH</b><i></i></div>
      <h2>Driver app</h2>
      <p>Rehla Fleet gave you these credentials. There is no signup here — your dispatcher creates the account.</p>
      <label class="fld"><span>Mobile number or National ID</span><input value="+966 50 118 4402"></label>
      <label class="fld"><span>Password from SMS</span><input type="password" value="••••••"></label>
      <button class="btn pri" data-a="go" data-v="home">Log in</button>
      <div class="btnrow"><button class="btn" data-a="toast" data-v="A new code has been sent to +966 50 118 4402">Resend code</button></div>
      <div class="foot">Trouble logging in? Your dispatcher can reset the credentials from Dash DMS — they arrive by SMS.</div>
    </div>`;

  SC.home = () => {
    const now_ = active(), up = upcoming(), cur = current();
    return `${sb()}
      ${hdr('Today', 'Faisal · ' + M().company, { act: `<div class="hact">
        <button class="btn sm" data-a="go" data-v="notifications">${unread() ? '● ' + unread() : 'Alerts'}</button></div>` })}
      <div class="body">
        ${onbar()}
        ${!S.online ? `<div class="note" style="--nc:var(--tang)"><b>You are offline.</b> No new orders will reach you. Orders already in your hands stay yours.</div>` : ''}
        <div class="grid2">
          <div class="kpi"><em>Delivered today</em><b>${M().kpi.today}</b><span>Target 17 · shift ends 15:30</span></div>
          <div class="kpi"><em>Earned today</em><b>133<span style="font:500 11px var(--mono);color:var(--faint)"> SAR</span></b><span>${M().contract.rate}</span></div>
        </div>
        ${DRV.WALLET.cod ? `<div class="note" style="--nc:var(--peach)"><b>${money(DRV.WALLET.cod)} cash on you.</b> Hand it to the office at the end of the shift — it shows in your wallet until you do.</div>` : ''}

        <div class="sec">Now <span class="faint">${now_.length} active</span></div>
        ${now_.length ? now_.map(o => oc(o, o === cur)).join('') : '<div class="empty">Nothing active right now</div>'}

        <div class="sec">Upcoming <span class="faint">${up.length} scheduled</span></div>
        ${up.length ? up.map(o => oc(o)).join('') : '<div class="empty">No scheduled orders</div>'}

        <div class="note"><b>Scheduled orders unlock before the slot.</b> You can see the details now, but the status flow opens 20 minutes before the pickup time your office set.</div>
      </div>
      ${tabbar()}`;
  };

SC.order = id => {
    const o = DRV.order(id); if (!o) return SC.home();
    const i = DRV.FLOW.indexOf(o.status), done = ['Delivered','Cancelled','Returned'].includes(o.status);
    const inRange = o.status === 'At pickup' || o.status === 'At delivery';
    const locked = o.tag === 'Scheduled';
    return `${sb()}
      ${hdr(o.id, esc(o.merchant) + ' · ' + o.tag, { back: true, act:
        `<div class="hact"><button class="btn sm" data-a="sheet" data-v="waybill|${o.id}">Waybill</button></div>` })}
      <div class="body">
        <div class="flow">${DRV.FLOW.map((s, k) => `<i class="fl ${k < i ? 'done' : ''} ${k === i ? 'now' : ''}"></i>`).join('')}</div>
        <div class="flowlab"><span>Accepted</span><b>${esc(o.status)}</b><span>Delivered</span></div>

        ${done ? `<div class="note" style="--nc:${statusColor(o.status)}"><b>${o.status}.</b> ${esc(o.log[o.log.length-1].e)} — ${esc(o.log[o.log.length-1].s || 'no note')}</div>` : ''}
        ${issuesFor(id).map(x => `<div class="issue ${x.state === 'Resolved' ? 'closed' : 'open'}">
          <div class="issue-h"><b>${x.state === 'Resolved' ? 'Your issue was resolved' : 'Your issue is with the office'}</b>
            ${tag(x.state, x.state === 'Resolved' ? '#7BD389' : DRV.PAL.lemon, true)}</div>
          <em>${esc(x.reason)} · reported ${esc(x.at)}</em>
          <span>${x.state === 'Resolved' ? esc(x.reply) + ' — ' + esc(x.owner)
            : x.owner ? esc(x.owner) + ' picked this up and is working on it' : 'Waiting for a dispatcher to pick it up'}</span>
          <button class="btn sm" data-a="go" data-v="issues">See my issues</button></div>`).join('')}
        ${o.instr ? `<div class="note" style="--nc:var(--tang)"><b>Special instructions.</b> ${esc(o.instr)}</div>` : ''}

        <div class="card">
          <div class="oc-r"><div class="oc-l"><i style="background:${DRV.PAL.peach}"></i><s></s></div>
            <div class="oc-t"><b>${esc(o.branch)}</b><em>${esc(o.pickAddr)}</em></div></div>
          <div class="oc-r" style="margin-top:6px"><div class="oc-l"><i style="background:${DRV.PAL.vodka}"></i></div>
            <div class="oc-t"><b>${esc(o.dropAddr)}</b><em>${esc(o.cust)} · ${esc(o.custPhone)}</em></div></div>
          <div class="btnrow">
            <button class="btn sm" data-a="go" data-v="map">Navigate</button>
            <button class="btn sm" data-a="toast" data-v="Calling ${esc(o.cust)}…">Call customer</button>
            <button class="btn sm" data-a="go" data-v="chat">Dispatcher</button>
          </div>
        </div>

        <div class="sec">Order</div>
        <div class="card"><dl class="defs">
          <div><dt>Items</dt><dd>${esc(o.items)}</dd></div>
          <div><dt>Distance</dt><dd>${o.km} km</dd></div>
          <div><dt>${o.slot ? 'Slot' : 'ETA'}</dt><dd>${esc(o.slot || o.eta)}</dd></div>
          <div><dt>Cash to collect</dt><dd>${o.cod ? '<b>' + money(o.cod) + '</b>' : 'Cash free'}</dd></div>
          <div><dt>You earn</dt><dd>${money(o.pay)}</dd></div>
          <div><dt>Proof required</dt><dd>${o.pod.map(p => tag(p, DRV.PAL.flax)).join(' ')}</dd></div>
        </dl></div>

        <div class="sec">History</div>
        <div class="card"><div class="timeline">${o.log.map(l =>
          `<div class="tl"><span class="tl-t">${l.t}</span><span class="tl-e"><b>${esc(l.e)}</b>${l.s ? `<em>${esc(l.s)}</em>` : ''}</span></div>`).join('')}</div></div>

        ${!done ? `
          <div class="sec">Update status</div>
          ${locked ? `<div class="slide locked"><span class="slide-l">Opens ${esc(o.dist)}</span></div>`
            : `<button class="slide" data-a="advance" data-v="${o.id}">
                <span class="slide-k">→</span><span class="slide-sh"></span>
                <span class="slide-l">${esc(DRV.CTA[o.status] || 'Continue')}</span></button>`}
          <div class="mono" style="margin-top:8px">${inRange
            ? `Within ${P().distance} m — you can update. ${esc(o.dist)}.`
            : `Your office allows status updates within ${P().distance} m of the address.`}</div>
        <div class="sec">Something wrong?</div>
          <button class="btn help" data-a="sheet" data-v="issue|${o.id}">Report an issue — keep the order</button>
          <div class="mono" style="margin-top:8px">Tell the office what is holding you up. The order stays yours and a dispatcher picks it up.</div>
          <div class="sec">End this order</div>
          <div class="btnrow">
            <button class="btn dan" data-a="sheet" data-v="fail|${o.id}">Cannot deliver</button>
            <button class="btn dan" data-a="sheet" data-v="cancel|${o.id}">Cancel order</button>
          </div>
          <div class="mono" style="margin-top:8px">These two finish the order. Neither can be undone from the app.</div>` : ''}
      </div>
      ${tabbar()}`;
  };

  SC.issues = () => {
    const open = openIssues(), closed = DRV.ISSUES.filter(x => x.state === 'Resolved');
    const row = x => `<div class="issue ${x.state === 'Resolved' ? 'closed' : 'open'}">
      <div class="issue-h"><b>${esc(x.id)} · ${esc(x.order)}</b>
        ${tag(x.state, x.state === 'Resolved' ? '#7BD389' : x.state === 'Acknowledged' ? DRV.PAL.lav : DRV.PAL.lemon, true)}</div>
      <em>${esc(x.reason)}</em>
      <span>${esc(x.note || '—')}</span>
      <span class="mono">Reported ${esc(x.at)}${x.owner ? ' · ' + esc(x.owner) : ' · unclaimed'}</span>
      ${x.reply ? `<span><b>Office:</b> ${esc(x.reply)} · ${esc(x.closed)}</span>` : ''}
      <button class="btn sm" data-a="order" data-v="${x.order}">Open the order</button></div>`;
    return `${sb()}
      ${hdr('My issues', open.length ? open.length + ' still open' : 'Nothing open', { back: true })}
      <div class="body">
        <div class="note"><b>Reporting an issue is asking for help.</b> The order stays yours while the office works on it. You will see the answer here.</div>
        <div class="sec">Open <span class="faint">${open.length}</span></div>
        ${open.length ? open.map(row).join('') : '<div class="empty">Nothing open right now</div>'}
        <div class="sec">Closed <span class="faint">${closed.length}</span></div>
        ${closed.length ? closed.map(row).join('') : '<div class="empty">Nothing closed yet</div>'}
      </div>
      ${tabbar()}`;
  };

  SC.map = () => {
    const o = current();
    return `${sb()}
      ${hdr('Navigation', o ? o.id + ' · ' + o.status : 'No active order', { back: true })}
      <div class="map"><div id="dmap"></div>
        <div class="mapchip">${o ? esc(o.dist) : 'Nothing to navigate to'}</div>
        ${o ? `<div class="mapcard">
          <div class="row"><b style="font-size:13.5px">${esc(o.status === 'Picked up' || o.status.includes('delivery') ? o.dropAddr : o.branch)}</b>
            <span class="mono">${o.km} km · ${o.eta}</span></div>
          <div class="mono" style="margin-top:4px">${o.status === 'Picked up' || o.status.includes('delivery') ? 'Drop-off · ' + esc(o.cust) : 'Pickup · ' + esc(o.merchant)}</div>
          <div class="navpick">${P().navApps.map(a =>
            `<button class="${S.navApp === a ? 'on' : ''}" data-a="navapp" data-v="${a}">${a}</button>`).join('')}</div>
          <div class="btnrow"><button class="btn pri" data-a="toast" data-v="Opening ${esc(S.navApp)}…">Start in ${esc(S.navApp)}</button></div>
        </div>` : ''}
      </div>
      ${tabbar()}`;
  };

  SC.wallet = () => {
    const w = DRV.WALLET;
    return `${sb()}
      ${hdr('Wallet', w.period)}
      <div class="body">
        <div class="card" style="border-color:rgba(255,238,80,.4)">
          <span class="mono">Available balance</span>
          <div class="big" style="margin:4px 0 2px">${money(w.balance)}</div>
          <span class="mono">Paid weekly on Sunday to ••4471</span>
          <div class="hr"></div>
          <div class="row"><span class="dim" style="font-size:12.5px">Pending this week</span><b>${money(w.pending)}</b></div>
          <div class="row" style="margin-top:6px"><span class="dim" style="font-size:12.5px">Paid out this period</span><b>${money(w.paid)}</b></div>
          <div class="row" style="margin-top:6px"><span class="dim" style="font-size:12.5px">Deductions</span><b class="warn">− ${money(w.deductions)}</b></div>
        </div>
        ${w.cod ? `<div class="note" style="--nc:var(--peach)"><b>${money(w.cod)} cash on you.</b> Collected on DX-40918. It leaves your wallet when the office records the handover.</div>` : ''}

        <div class="sec">Contract</div>
        <div class="card"><dl class="defs">
          <div><dt>Model</dt><dd>${esc(M().contract.model)}</dd></div>
          <div><dt>Rate</dt><dd>${esc(M().contract.rate)}</dd></div>
          <div><dt>Paid</dt><dd>${esc(M().contract.terms)}</dd></div>
          <div><dt>Target</dt><dd>${esc(M().contract.target)}</dd></div>
          <div><dt>Bonus</dt><dd>${esc(M().contract.incentive)}</dd></div>
        </dl>
        <div class="hr"></div>
        <span class="mono">Weekly target — ${w.target.done} of ${w.target.of}</span>
        <span class="bar"><i style="width:${w.target.done / w.target.of * 100}%;background:var(--lemon)"></i></span>
        <div class="mono" style="margin-top:6px">24 more for the SAR 150 bonus · 4 days left</div></div>

        <div class="sec">Transactions</div>
        <div class="card">${w.tx.map(t => `<div class="tx">
          <div><b>${esc(t.t)}</b><em>${esc(t.d)} · ${t.k}</em></div>
          <s class="${t.a > 0 ? 'pos' : 'neg'}">${t.a > 0 ? '+' : '−'} ${money(Math.abs(t.a))}</s></div>`).join('')}</div>
        <div class="note"><b>Your office sets the rate.</b> The app shows what you earned and what you are holding — it never negotiates.</div>
      </div>
      ${tabbar()}`;
  };

  SC.chat = () => `${sb()}
    ${hdr('Dispatcher', 'Mishal · Rehla Fleet · ' + P().chatScope)}
    <div class="body">
      <div class="note"><b>Dispatcher only.</b> You cannot message the merchant or the customer from here — call the customer from the order instead.</div>
      <div class="chat">${S.chat.map(c => `<div class="cm ${c.who}">
        ${c.who === 'them' ? `<span class="cn">${esc(c.n)}</span>` : ''}${esc(c.t)}<em>${esc(c.at)}</em></div>`).join('')}</div>
    </div>
    <div class="chatbar"><input id="msg" placeholder="Message Mishal…"><button data-a="send">Send</button></div>
    ${tabbar()}`;

  SC.history = () => {
    const f = S.histFilter;
    const rows = DRV.HISTORY.filter(h => f === 'All' || h.status === f);
    const del = DRV.HISTORY.filter(h => h.status === 'Delivered');
    return `${sb()}
      ${hdr('Order history', rows.length + ' orders', { back: true })}
      <div class="body">
        <div class="filters">${['All','Delivered','Returned','Cancelled'].map(k =>
          `<button class="chip ${f === k ? 'on' : ''}" data-a="hist" data-v="${k}">${k}</button>`).join('')}</div>
        <div class="grid2">
          <div class="kpi"><em>Delivered</em><b>${del.length}</b><span>Last two days</span></div>
          <div class="kpi"><em>Earned</em><b>${DRV.HISTORY.reduce((s, h) => s + h.pay, 0).toFixed(0)}<span style="font:500 11px var(--mono);color:var(--faint)"> SAR</span></b><span>Before deductions</span></div>
        </div>
        <div class="sec">Orders</div>
        ${rows.map(h => `<button class="oc" data-a="toast" data-v="${h.id} — ${h.status}, ${h.min} min, proof: ${h.pod}">
          <div class="oc-h"><b>${h.id}</b>${tag(h.status, statusColor(h.status), h.status !== 'Delivered')}</div>
          <div class="oc-f"><span>${esc(h.merchant)} · ${esc(h.d)}</span><span>${h.min ? h.min + ' min · ' : ''}<b>${money(h.pay)}</b></span></div>
        </button>`).join('') || '<div class="empty">Nothing in this filter</div>'}
      </div>
      ${tabbar()}`;
  };

  SC.profile = () => {
    const k = M().kpi, v = M().vehicle;
    return `${sb()}
      ${hdr(M().name, M().company + ' · ' + M().zone, { back: true })}
      <div class="body">
        <div class="grid2">
          <div class="kpi"><em>Total deliveries</em><b>${k.deliveries.toLocaleString()}</b><span>Lifetime</span></div>
          <div class="kpi"><em>Completion</em><b>${k.completion}%</b><span class="bar"><i style="width:${k.completion}%;background:var(--lav)"></i></span></div>
          <div class="kpi"><em>Avg delivery</em><b>${k.avgMin}<span style="font:500 11px var(--mono);color:var(--faint)"> min</span></b><span>Fleet avg 33</span></div>
          <div class="kpi"><em>Cancellation</em><b>${k.cancel}%</b><span>Fleet avg 2.1%</span></div>
        </div>

        <div class="sec">Personal <span class="faint">Read only</span></div>
        <div class="card"><dl class="defs">
          <div><dt>Name</dt><dd>${esc(M().name)}</dd></div>
          <div><dt>Mobile</dt><dd>${esc(M().phone)}</dd></div>
          <div><dt>National ID</dt><dd>${esc(M().nid)}</dd></div>
          <div><dt>Zone</dt><dd>${esc(M().zone)}</dd></div>
          <div><dt>Group</dt><dd>${esc(M().group)}</dd></div>
          <div><dt>Shift</dt><dd>${esc(M().shift.name)} · ${esc(M().shift.window)}</dd></div>
        </dl></div>

        <div class="sec">Vehicle <span class="faint">Read only</span></div>
        <div class="card"><dl class="defs">
          <div><dt>Plate</dt><dd>${esc(v.plate)}</dd></div>
          <div><dt>Type</dt><dd>${esc(v.type)}</dd></div>
          <div><dt>Model</dt><dd>${esc(v.model)} · ${v.year}</dd></div>
        </dl></div>

        <div class="sec">Documents</div>
        <div class="card">${M().docs.map(d => `<div class="tx">
          <div><b>${esc(d.k)}</b><em>Expires ${esc(d.exp)}</em></div>
          <s>${tag(d.s, d.s === 'Valid' ? '#7BD389' : DRV.PAL.tang, d.s !== 'Valid')}</s></div>`).join('')}</div>
        <div class="note" style="--nc:var(--tang)"><b>Insurance expires 12 Sep.</b> Send the new copy to the office — the app stops accepting status updates once a document lapses.</div>

        <div class="sec">App</div>
        <div class="card"><dl class="defs">
          <div><dt>Version</dt><dd>${esc(M().app.version)}</dd></div>
          <div><dt>Device</dt><dd>${esc(M().app.device)}</dd></div>
          <div><dt>Language</dt><dd>English · set by your office</dd></div>
        </dl>
        <div class="btnrow"><button class="btn" data-a="toast" data-v="Ask your dispatcher to reset your credentials">Reset password</button>
        <button class="btn dan" data-a="go" data-v="login">Log out</button></div></div>
      </div>
      ${tabbar()}`;
  };

  SC.notifications = () => `${sb()}
    ${hdr('Notifications', unread() ? unread() + ' need attention' : 'All caught up', { back: true, act:
      `<div class="hact"><button class="btn sm" data-a="readall">Mark read</button></div>` })}
    <div class="body">
      ${DRV.NOTIFS.map(n => `<button class="nt s-${S.notifRead ? 'low' : n.sev}" data-a="notif" data-v="${esc(n.link)}">
        <div><em>${esc(n.k)}</em><span>${esc(n.t)}</span></div><s>${esc(n.d)}</s></button>`).join('')}
    </div>
    ${tabbar()}`;

  SC.more = () => `${sb()}
    ${hdr('More', M().name + ' · ' + M().company)}
    <div class="body">
      ${onbar()}
      <div class="sec">Your work</div>
      ${[['history','Order history','Everything you have delivered'],
         ['profile','Profile and documents','Personal info, vehicle, KPIs'],
         ['wallet','Wallet','Balance, contract, transactions'],
         ['issues','My issues', openIssues().length ? openIssues().length + ' open with the office' : 'Nothing open'],
         ['notifications','Notifications', unread() ? unread() + ' unread' : 'All caught up'],
         ['chat','Dispatcher chat','Mishal · Rehla Fleet']].map(([k, t, s]) =>
        `<button class="oc" data-a="go" data-v="${k}"><div class="oc-h"><b>${t}</b><span class="mono">→</span></div>
          <div class="oc-f"><span>${s}</span><span></span></div></button>`).join('')}
      <div class="sec">Set by your office</div>
      <div class="card"><dl class="defs">
        <div><dt>Online control</dt><dd>${P().autoOnline ? 'Shift-driven' : 'Manual'}</dd></div>
        <div><dt>Status distance</dt><dd>Within ${P().distance} m</dd></div>
        <div><dt>Order acceptance</dt><dd>${esc(P().accept)}</dd></div>
        <div><dt>Proof of delivery</dt><dd>${P().podRequired ? 'Required' : 'Optional'}</dd></div>
        <div><dt>Reattempts</dt><dd>${P().reattempt ? P().maxReattempt + ' allowed, then auto-return' : 'Not allowed'}</dd></div>
        <div><dt>Chat</dt><dd>${esc(P().chatScope)}</dd></div>
      </dl></div>
      <div class="note"><b>You cannot change these.</b> They come from Dash DMS. Ask your dispatcher if something is blocking you.</div>
    </div>
    ${tabbar()}`;

  /* ---------- sheets ---------- */
  const SH = {
    waybill: id => { const o = DRV.order(id); return { t: 'Waybill', b: `
      <div class="waybill"><div class="wb-h"><b>REHLA FLEET</b><span>${o.id}</span></div>
        <div class="wb-b">
          <div><em>From</em>${esc(o.branch)}</div><div><em>To</em>${esc(o.dropAddr)}</div>
          <div><em>Customer</em>${esc(o.cust)} · ${esc(o.custPhone)}</div>
          <div><em>Items</em>${esc(o.items)}</div><div><em>COD</em>${o.cod ? money(o.cod) : 'Cash free'}</div>
          <div><em>Proof</em>${o.pod.join(', ')}</div><div><em>Driver</em>${esc(M().name)} · ${esc(M().vehicle.plate)}</div>
        </div><div class="wb-c">▌▐▌▌▐▐▌▐▌▌▐▌▐▐▌▌▐▌▐▌▐▐▌▌▐▐▌▐▌▌▐</div></div>
      <button class="btn" style="margin-top:12px" data-a="toast" data-v="Waybill saved to your phone">Save a copy</button>` }; },

    pod: id => { const o = DRV.order(id), got = S.pod[id] || {}; return { t: 'Proof of delivery', b: `
      <div class="mono" style="margin-bottom:12px">Your office requires ${o.pod.join(' + ')} on this order.</div>
      ${o.pod.includes('Photo') ? `<div class="sec" style="margin-top:0">Photo at the door</div>
        <button class="capture ${got.photo ? 'shot' : ''}" data-a="pod" data-v="${id}|photo" style="width:100%;border-width:1px">
          ${got.photo ? '✓ PHOTO CAPTURED' : '◎ TAP TO TAKE THE PHOTO'}</button>` : ''}
      ${o.pod.includes('OTP') ? `<div class="sec">Code from the customer</div>
        <div class="otp">${[0,1,2,3].map(k => `<i class="${got.otp ? 'f' : ''}">${got.otp ? '4718'[k] : ''}</i>`).join('')}</div>
        <button class="btn" data-a="pod" data-v="${id}|otp">${got.otp ? 'Code accepted' : 'Enter the code'}</button>` : ''}
      ${o.pod.includes('Signature') ? `<div class="sec">Signature</div>
        <button class="sig ${got.sig ? 'done' : ''}" style="width:100%;background:none;color:inherit" data-a="pod" data-v="${id}|sig">
          ${got.sig ? '✓ SIGNED' : 'SIGN HERE'}</button>` : ''}
      <div class="hr"></div>
      ${o.cod ? `<div class="note" style="--nc:var(--peach)"><b>Collect ${money(o.cod)} in cash.</b> It is added to what you owe the office.</div>` : ''}
      <button class="btn pri" data-a="deliver" data-v="${id}">Complete delivery</button>
      <div class="mono" style="margin-top:8px;text-align:center">${esc(o.dist)} · within ${P().distance} m</div>` }; },

    issue: id => { const o = DRV.order(id); return { t: 'Report an issue', b: `
      <div class="note"><b>The order stays yours.</b> This tells the office something is wrong so a dispatcher can help. It does not cancel or fail ${esc(id)}.</div>
      <div class="mono" style="margin:12px 0 8px">${esc(o.status)} · ${esc(o.merchant)} · ${esc(o.dropAddr)}</div>
      <div class="sec" style="margin-top:0">What is happening?</div>
      <div class="pick help">${DRV.REASONS.issue.map(r =>
        `<button data-a="doissue" data-v="${id}|${esc(r)}">${esc(r)}</button>`).join('')}</div>` }; },

    cancel: id => ({ t: 'Cancel order', b: `
      <div class="note" style="--nc:var(--tang)"><b>This ends the order.</b> If you just need help, close this and report an issue instead.</div>
      <div class="mono" style="margin-bottom:12px">Your office requires a reason. It goes on the order and your dispatcher is notified.</div>
      <div class="pick">${DRV.REASONS.cancel.map(r =>
        `<button data-a="docancel" data-v="${id}|${esc(r)}">${esc(r)}</button>`).join('')}</div>` }),

    fail: id => ({ t: 'Cannot deliver', b: `
      <div class="note" style="--nc:var(--tang)"><b>This ends the delivery attempt.</b> Reporting an issue keeps the order alive if you are only stuck.</div>
      <div class="mono" style="margin-bottom:12px">Pick what happened. ${P().reattempt
        ? 'You may try again ' + P().maxReattempt + ' times' + (P().autoReturn ? ', then it returns to the merchant.' : '.')
        : 'The order returns to the merchant.'}</div>
      <div class="pick">${DRV.REASONS.fail.map(r =>
        `<button data-a="dofail" data-v="${id}|${esc(r)}">${esc(r)}</button>`).join('')}</div>` }),

    accept: id => { const o = DRV.order(id); return { t: 'New order', b: `
      <div class="row"><b class="med">${money(o.pay)}</b>${tag(o.tag, DRV.PAL.lemon, true)}</div>
      <div class="mono" style="margin:6px 0 12px">${o.km} km · ${esc(o.merchant)} · ${o.cod ? 'COD ' + money(o.cod) : 'cash free'}</div>
      <div class="note"><b>${esc(P().accept)}.</b> Your office set this — assigned orders are already accepted for you.</div>
      <button class="btn pri" data-a="closesheet">Got it</button>` }; }
  };

  /* ---------- render ---------- */
  function render() {
    const app = document.getElementById('screen');
    const f = SC[S.screen] || SC.home;
    app.innerHTML = `<div class="notch"></div>` + f(S.arg);
    const t = document.createElement('div'); t.id = 'toast'; app.appendChild(t);
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'sheet';
    sh.innerHTML = `<div class="sh-scrim" data-a="closesheet"></div><aside class="sh">
      <header class="sh-h"><b id="sh-t"></b><button data-a="closesheet">Close</button></header>
      <div class="sh-b" id="sh-b"></div></aside>`;
    app.appendChild(sh);
    if (S.screen === 'map') setTimeout(mountMap, 40);
    document.querySelectorAll('.deskmenu .dm').forEach(b =>
      b.classList.toggle('on', b.getAttribute('data-v') === S.screen));
  }

  function toast(m) {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function openSheet(key, arg) {
    const s = SH[key]; if (!s) return;
    const o = s(arg), sh = document.getElementById('sheet');
    sh.querySelector('#sh-t').textContent = o.t;
    sh.querySelector('#sh-b').innerHTML = o.b;
    requestAnimationFrame(() => sh.classList.add('open'));
  }
  const closeSheet = () => { const s = document.getElementById('sheet'); if (s) s.classList.remove('open'); };

  /* ---------- map ---------- */
  let map = null, sim = null;
  function mountMap() {
    if (sim) { clearInterval(sim); sim = null; }
    if (map) { map.remove(); map = null; }
    const el = document.getElementById('dmap'); if (!el || !window.L) return;
    const o = current();
    const pick = [24.6771, 46.7318], drop = [24.6640, 46.7541];
    map = L.map(el, { zoomControl: false, attributionControl: true }).setView([24.6705, 46.7430], 14);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri, © OpenStreetMap contributors', maxZoom: 16 }).addTo(map);
    const icon = (c, l, big) => L.divIcon({ className: 'mk', html:
      `<span style="width:${big?26:18}px;height:${big?26:18}px;background:${c};border:1.5px solid #000;display:flex;align-items:center;justify-content:center;font:600 ${big?10:8}px ui-monospace,Menlo,monospace;color:#000">${l}</span>`,
      iconSize: [big?26:18, big?26:18], iconAnchor: [big?13:9, big?13:9] });
    L.marker(pick, { icon: icon(DRV.PAL.peach, 'P') }).addTo(map).bindTooltip('Pickup — Almasa, Al Malaz');
    L.marker(drop, { icon: icon(DRV.PAL.vodka, 'D') }).addTo(map).bindTooltip('Drop-off — Al Malaz block 7');
    L.polyline([pick, [24.6712, 46.7402], [24.6668, 46.7488], drop], { color: '#FFEE50', weight: 3, opacity: .9 }).addTo(map);
    const me = L.marker([24.6712, 46.7402], { icon: icon('#FFEE50', 'FA', true) }).addTo(map).bindTooltip('You');
    let t = 0;
    sim = setInterval(() => { t += 0.06; me.setLatLng([24.6712 - Math.sin(t) * 0.0018, 46.7402 + Math.abs(Math.sin(t)) * 0.0036]); }, 1200);
    setTimeout(() => map && map.invalidateSize(), 80);
  }

  /* ---------- actions ---------- */
  const A = {
    go: v => { S.screen = v; S.arg = null; S.tab = ['orders','map','wallet','chat','more'].includes(v) ? v : (v === 'home' ? 'orders' : S.tab); render(); },
    tab: v => { S.tab = v; S.screen = v === 'orders' ? 'home' : v; S.arg = null; render(); },
    back: () => { S.screen = S.tab === 'orders' ? 'home' : S.tab; S.arg = null; render(); },
    order: v => { S.screen = 'order'; S.arg = v; S.tab = 'orders'; render(); },
    online: () => {
      if (P().autoOnline && S.online) { toast('Your ' + M().shift.name + ' shift keeps you online until ' + M().shift.window.split(' – ')[1] + '. Ask your dispatcher to change it.'); return; }
      S.online = !S.online; render(); toast(S.online ? 'You are online — orders can reach you' : 'You are offline');
    },
    navapp: v => { S.navApp = v; render(); },
    hist: v => { S.histFilter = v; render(); },
    readall: () => { S.notifRead = true; render(); toast('All notifications marked read'); },
    notif: v => {
      if (v.startsWith('order:')) { A.order(v.split(':')[1]); return; }
      A.go(v === 'home' ? 'home' : v);
    },
    sheet: v => { const [k, a] = v.split('|'); openSheet(k, a); },
    closesheet: closeSheet,
    toast: v => toast(v),
    send: () => {
      const i = document.getElementById('msg'); if (!i || !i.value.trim()) return;
      S.chat.push({ who: 'me', t: i.value.trim(), at: now() }); render();
      setTimeout(() => { S.chat.push({ who: 'them', n: 'Mishal · Dispatcher', t: 'Noted — thanks.', at: now() }); render();
        const b = document.querySelector('.body'); if (b) b.scrollTop = b.scrollHeight; }, 1100);
      const b = document.querySelector('.body'); if (b) b.scrollTop = b.scrollHeight;
    },

    advance: id => {
      const o = DRV.order(id);
      if (o.status === 'At delivery') { openSheet('pod', id); return; }
      const nxt = DRV.NEXT[o.status];
      if (!nxt) return;
      o.status = nxt;
      o.log.push({ t: now(), e: nxt, s: nxt === 'At pickup' || nxt === 'At delivery' ? 'Geofence confirmed · within ' + P().distance + ' m' : 'Timestamped · office notified' });
      if (nxt === 'At delivery') o.dist = 'You are 40 m from the drop-off';
      render(); toast(id + ' — ' + nxt + '. Your office and the merchant were notified.');
    },
    pod: v => {
      const [id, k] = v.split('|');
      S.pod[id] = Object.assign({}, S.pod[id], { [k]: true });
      openSheet('pod', id);
      toast(k === 'photo' ? 'Photo captured' : k === 'otp' ? 'Code 4718 accepted' : 'Signature captured');
    },
    deliver: id => {
      const o = DRV.order(id), got = S.pod[id] || {};
      const need = o.pod.map(p => p === 'Photo' ? 'photo' : p === 'OTP' ? 'otp' : 'sig');
      if (P().podRequired && need.some(k => !got[k])) { toast('Proof is required — ' + o.pod.join(' + ') + ' before you can finish.'); return; }
      o.status = 'Delivered';
      o.log.push({ t: now(), e: 'Delivered', s: 'Proof: ' + o.pod.join(', ') + (o.cod ? ' · COD ' + money(o.cod) + ' collected' : '') });
      DRV.WALLET.tx.unshift({ d: 'Today ' + now(), t: 'Delivery earnings — ' + id, a: o.pay, k: 'earn' });
      DRV.WALLET.pending += o.pay; DRV.WALLET.balance += o.pay;
      if (o.cod) { DRV.WALLET.cod += o.cod; DRV.WALLET.tx.unshift({ d: 'Today ' + now(), t: 'COD collected — ' + id, a: -o.cod, k: 'cod' }); }
      M().kpi.today += 1;
      closeSheet(); S.screen = 'home'; S.tab = 'orders'; render();
      toast(id + ' delivered · ' + money(o.pay) + ' added to your wallet');
    },
    doissue: v => {
      const [id, r] = v.split('|'), o = DRV.order(id);
      const idx = 'IC-' + (3141 + DRV.ISSUES.length);
      DRV.ISSUES.unshift({ id: idx, order: id, reason: r, note: 'Reported from the driver app at ' + o.status.toLowerCase(),
        at: 'Today ' + now(), state: 'Open', owner: null, reply: null, closed: null });
      o.log.push({ t: now(), e: 'Issue reported — ' + idx, s: r + ' · order still open' });
      closeSheet(); S.screen = 'order'; S.arg = id; render();
      toast(idx + ' sent to the office — ' + id + ' is still yours');
      setTimeout(() => {
        const x = DRV.ISSUES.find(k => k.id === idx); if (!x || x.state !== 'Open') return;
        x.state = 'Acknowledged'; x.owner = 'Mishal · Dispatcher';
        DRV.NOTIFS.unshift({ k: 'Issue picked up', t: idx + ' — Mishal is working on it', d: 'just now', sev: 'high', link: 'issues' });
        S.notifRead = false; render(); toast('Mishal picked up ' + idx);
      }, 3200);
    },
    docancel: v => {
      const [id, r] = v.split('|'), o = DRV.order(id);
      o.status = 'Cancelled'; o.log.push({ t: now(), e: 'Cancelled by driver', s: 'Reason: ' + r });
      closeSheet(); S.screen = 'home'; render(); toast(id + ' cancelled — ' + r.toLowerCase());
    },
    dofail: v => {
      const [id, r] = v.split('|'), o = DRV.order(id);
      o.attempts = (o.attempts || 0) + 1;
      if (P().reattempt && o.attempts < P().maxReattempt) {
        o.log.push({ t: now(), e: 'Failed attempt ' + o.attempts + ' of ' + P().maxReattempt, s: 'Reason: ' + r });
        closeSheet(); render(); toast('Attempt ' + o.attempts + ' recorded — try again, ' + (P().maxReattempt - o.attempts) + ' left');
      } else {
        o.status = 'Returned';
        o.log.push({ t: now(), e: 'Returned to merchant', s: 'Reason: ' + r + ' · auto-return after ' + o.attempts + ' attempts' });
        closeSheet(); S.screen = 'home'; render(); toast(id + ' returned to the merchant');
      }
    }
  };

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-a]'); if (!t) return;
    e.preventDefault();
    const a = t.getAttribute('data-a'), v = t.getAttribute('data-v');
    if (A[a]) A[a](v, t);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'msg') A.send(); });

  window.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
