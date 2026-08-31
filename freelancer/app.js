/* Dash Freelancer App — screens + interaction */
(function () {
  const T = () => FRL.TERMS, M = () => FRL.ME;
  const S = window.ST = {
    screen: 'home', arg: null, online: true, tab: 'orders',
    histFilter: 'All', chat: FRL.CHAT.slice(), notifRead: false,
    navApp: 'Google Maps', pod: {}, wd: null,
    offer: null, secs: 0, wait: 4, queue: FRL.OFFERS.slice(), seen: 0, skipped: 0, missed: 0
  };
  const money = n => 'SAR ' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const now = () => { const d = new Date(); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };
  const tag = (t, c, solid) => `<span class="tag ${solid ? 'solid' : ''}" style="--tc:${c || 'var(--line)'}">${esc(t)}</span>`;
  const live = () => FRL.ORDERS.filter(o => !['Delivered','Cancelled','Returned'].includes(o.status));
  const active = live;
  const busy = () => live().length >= T().maxConcurrent;
  const current = () => active().find(o => o.status !== 'Accepted') || active()[0];
  const unread = () => S.notifRead ? 0 : FRL.NOTIFS.filter(n => n.sev !== 'low').length;

  const statusColor = s => ({ 'Accepted':FRL.PAL.lemon,'To pickup':FRL.PAL.peach,'At pickup':FRL.PAL.peach,
    'Picked up':FRL.PAL.lav,'To delivery':FRL.PAL.lav,'At delivery':FRL.PAL.vodka,
    'Delivered':'#7BD389','Cancelled':FRL.PAL.tang,'Returned':FRL.PAL.tang,'Skipped':'#6E6E6E' }[s] || FRL.PAL.lemon);

  const sb = () => `<div class="sb"><span>15:48</span>
    <span class="sb-r">${S.online ? 'ONLINE' : 'OFFLINE'} · 5G <span class="bat"><i></i></span></span></div>`;

  const hdr = (title, kick, opt = {}) => `<div class="hdr">
    ${opt.back ? `<button class="back" data-a="back">←</button>` : ''}
    <div style="flex:1;min-width:0">${kick ? `<span class="kick">${esc(kick)}</span>` : ''}<h1>${esc(title)}</h1></div>
    ${opt.act || ''}</div>`;

  const tabbar = () => {
    const items = [['orders','Orders','t-orders'],['map','Map','t-map'],['wallet','Wallet','t-wallet'],['chat','Support','t-chat'],['more','More','t-more']];
    return `<nav class="tabbar">${items.map(([k, l, c]) =>
      `<button class="tb ${c} ${S.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}"><i></i><span>${l}</span></button>`).join('')}</nav>`;
  };

  const onbar = () => `<div class="onbar ${S.online ? 'on' : 'off'}">
    <button class="osw" data-a="online"><i></i></button>
    <div style="flex:1">
      <b>${S.online ? 'You are online' : 'You are offline'}</b>
      <em>${S.online ? (busy() ? 'Delivering — offers resume when you finish' : 'Listening for offers nearby') : 'No offers will reach you'}</em>
    </div>
    <span class="lock">Your call</span></div>`;

  const oc = (o, isCur) => `<button class="oc ${isCur ? 'now' : ''}" data-a="order" data-v="${o.id}">
    <div class="oc-h"><b>${o.id}</b>
      <span style="display:flex;gap:5px">${tag(o.tag, o.tag === 'Scheduled' ? FRL.PAL.vodka : FRL.PAL.lemon)}${tag(o.status, statusColor(o.status), true)}</span></div>
    <div class="oc-b">
      <div class="oc-r"><div class="oc-l"><i style="background:${FRL.PAL.peach}"></i><s></s></div>
        <div class="oc-t"><b>${esc(o.branch)}</b><em>${esc(o.pickAddr)}</em></div></div>
      <div class="oc-r"><div class="oc-l"><i style="background:${FRL.PAL.vodka}"></i></div>
        <div class="oc-t"><b>${esc(o.dropAddr)}</b><em>${esc(o.cust)}</em></div></div>
    </div>
    <div class="oc-f">
      <span>${o.km} km · ${o.slot ? 'Slot ' + o.slot.replace('Today ', '') : 'ETA ' + o.eta}</span>
      <span>${o.cod ? 'COD <b>' + money(o.cod) + '</b> · ' : ''}<b>${money(o.pay)}</b></span></div>
  </button>`;

  const SC = {};

  /* 01 onboarding */
  SC.signup = () => `${sb()}
    ${hdr('Get approved', 'Dash Freelancer · self signup')}
    <div class="body">
      <div class="note" style="--nc:#7BD389"><b>Approved on 6 May 2026.</b> Dash reviewed your documents once. Nothing here needs a company or an invitation.</div>
      <div class="sec" style="margin-top:6px">Steps</div>
      <div class="card">${FRL.SIGNUP.map((s, i) => `<div class="stp ${s.done ? 'done' : ''}">
        <span class="stp-n">${s.done ? '✓' : i + 1}</span>
        <div><b>${esc(s.t)}</b><em>${esc(s.note || s.s)}</em></div></div>`).join('')}</div>
      <div class="sec">Your documents</div>
      <div class="card">${M().docs.map(d => `<div class="tx">
        <div><b>${esc(d.k)}</b><em>Valid until ${esc(d.exp)}</em></div>
        <s>${tag(d.s, '#7BD389')}</s></div>`).join('')}</div>
      <div class="note"><b>If Dash rejects something</b> you are told which document and why, and you can re-upload straight away. Until you are approved you can look around, but no offers arrive.</div>
      <button class="btn pri" data-a="go" data-v="offer">Continue to offers</button>
    </div>
    ${tabbar()}`;

  /* 03 + 05 home — online state and the current job */
  SC.home = () => {
    const a = active(), cur = current();
    return `${sb()}
      ${hdr('Today', M().first + ' · independent', { act: `<div class="hact">
        <button class="btn sm" data-a="go" data-v="notifications">${unread() ? '● ' + unread() : 'Alerts'}</button></div>` })}
      <div class="body">
        ${onbar()}
        ${S.online ? (busy()
          ? `<div class="note" style="--nc:var(--lav)"><b>One job at a time.</b> New offers hold until you finish ${cur ? cur.id : 'this delivery'} — so you are never juggling two customers.</div>`
          : `<div class="radar">
              <span class="rd-r"></span><span class="rd-r d2"></span><span class="rd-r d3"></span>
              <span class="rd-c"></span>
              <div class="rd-t">Listening for offers</div>
              <div class="rd-s">${esc(M().area)}, ${esc(M().city)} · next offer in ${S.wait}s</div>
            </div>
            <div class="note"><b>Offers arrive on their own.</b> Dash Network sends them to the nearest free drivers. You see the fare first, then accept or skip.</div>`)
          : `<div class="radar off">
              <span class="rd-c"></span>
              <div class="rd-t">You are offline</div>
              <div class="rd-s">Go online to start receiving offers</div>
            </div>`}
        <div class="grid2">
          <div class="kpi"><em>Delivered today</em><b>${M().kpi.today}</b><span>Your own pace</span></div>
          <div class="kpi"><em>Earned today</em><b>131<span style="font:500 11px var(--mono);color:var(--faint)"> SAR</span></b><span>After the Dash fee</span></div>
        </div>
        <div class="grid2">
          <div class="kpi"><em>Offers seen</em><b>${S.seen + 9}</b><span>${S.skipped + 2} skipped · ${S.missed} expired</span></div>
          <div class="kpi"><em>Cash on you</em><b>${FRL.WALLET.cod}<span style="font:500 11px var(--mono);color:var(--faint)"> SAR</span></b><span>${FRL.WALLET.cod ? 'Hand in at a Dash point' : 'Nothing outstanding'}</span></div>
        </div>

        <div class="sec">Current job <span class="faint">${a.length} of ${T().maxConcurrent}</span></div>
        ${a.length ? a.map(o => oc(o, o === cur)).join('') : '<div class="empty">Nothing in your hands right now</div>'}
        <div class="note"><b>No shifts and no schedule.</b> Every job here is on demand — you took it because the fare suited you at that moment.</div>
      </div>
      ${tabbar()}`;
  };

  /* 06 order interaction */
  SC.order = id => {
    const o = FRL.order(id); if (!o) return SC.home();
    const i = FRL.FLOW.indexOf(o.status), done = ['Delivered','Cancelled','Returned'].includes(o.status);
    const inRange = o.status === 'At pickup' || o.status === 'At delivery';
    const locked = o.tag === 'Scheduled';
    return `${sb()}
      ${hdr(o.id, esc(o.merchant) + ' · ' + o.tag, { back: true, act:
        `<div class="hact"><button class="btn sm" data-a="sheet" data-v="waybill|${o.id}">Waybill</button></div>` })}
      <div class="body">
        <div class="flow">${FRL.FLOW.map((s, k) => `<i class="fl ${k < i ? 'done' : ''} ${k === i ? 'now' : ''}"></i>`).join('')}</div>
        <div class="flowlab"><span>Accepted</span><b>${esc(o.status)}</b><span>Delivered</span></div>
        ${done ? `<div class="note" style="--nc:${statusColor(o.status)}"><b>${o.status}.</b> ${esc(o.log[o.log.length-1].e)} — ${esc(o.log[o.log.length-1].s || 'no note')}</div>` : ''}
        ${o.instr ? `<div class="note" style="--nc:var(--tang)"><b>Special instructions.</b> ${esc(o.instr)}</div>` : ''}

        <div class="card">
          <div class="oc-r"><div class="oc-l"><i style="background:${FRL.PAL.peach}"></i><s></s></div>
            <div class="oc-t"><b>${esc(o.branch)}</b><em>${esc(o.pickAddr)}</em></div></div>
          <div class="oc-r" style="margin-top:6px"><div class="oc-l"><i style="background:${FRL.PAL.vodka}"></i></div>
            <div class="oc-t"><b>${esc(o.dropAddr)}</b><em>${esc(o.cust)} · ${esc(o.custPhone)}</em></div></div>
          <div class="btnrow">
            <button class="btn sm" data-a="go" data-v="map">Navigate</button>
            <button class="btn sm" data-a="toast" data-v="Calling ${esc(o.cust)}…">Call customer</button>
            <button class="btn sm" data-a="go" data-v="chat">Support</button>
          </div>
        </div>

        <div class="sec">Your fare</div>
        <div class="card">
          <div class="breakdown"><span class="dim">Merchant pays Dash</span><b>${money(o.gross)}</b></div>
          <div class="breakdown"><span class="dim">Dash fee — ${Math.round(T().dashFee * 100)}%</span><b class="warn">− ${money(o.gross - o.pay)}</b></div>
          <div class="breakdown tot"><span>You keep</span><b>${money(o.pay)}</b></div>
        </div>

        <div class="sec">Order</div>
        <div class="card"><dl class="defs">
          <div><dt>Items</dt><dd>${esc(o.items)}</dd></div>
          <div><dt>Distance</dt><dd>${o.km} km</dd></div>
          <div><dt>${o.slot ? 'Slot' : 'ETA'}</dt><dd>${esc(o.slot || o.eta)}</dd></div>
          <div><dt>Cash to collect</dt><dd>${o.cod ? '<b>' + money(o.cod) + '</b>' : 'Cash free'}</dd></div>
          <div><dt>Proof required</dt><dd>${o.pod.map(p => tag(p, FRL.PAL.flax)).join(' ')}</dd></div>
        </dl></div>

        <div class="sec">History</div>
        <div class="card"><div class="timeline">${o.log.map(l =>
          `<div class="tl"><span class="tl-t">${l.t}</span><span class="tl-e"><b>${esc(l.e)}</b>${l.s ? `<em>${esc(l.s)}</em>` : ''}</span></div>`).join('')}</div></div>

        ${!done ? `
          <div class="sec">Update status</div>
          ${locked ? `<div class="slide locked"><span class="slide-l">Opens ${esc(o.dist)}</span></div>`
            : `<button class="slide" data-a="advance" data-v="${o.id}">
                <span class="slide-k">→</span><span class="slide-sh"></span>
                <span class="slide-l">${esc(FRL.CTA[o.status] || 'Continue')}</span></button>`}
          <div class="mono" style="margin-top:8px">${inRange ? esc(o.dist) + ' — you can update.' : 'Status updates open when you reach the address.'}</div>
          <div class="btnrow">
            <button class="btn dan" data-a="sheet" data-v="fail|${o.id}">Cannot deliver</button>
            <button class="btn dan" data-a="sheet" data-v="cancel|${o.id}">Cancel</button>
          </div>` : ''}
      </div>
      ${tabbar()}`;
  };

  /* 07 navigation */
  SC.map = () => {
    const o = current();
    return `${sb()}
      ${hdr('Navigation', o ? o.id + ' · ' + o.status : 'No active order', { back: true })}
      <div class="map"><div id="fmap"></div>
        <div class="mapchip">${o ? esc(o.dist) : 'Nothing to navigate to'}</div>
        ${o ? `<div class="mapcard">
          <div class="row"><b style="font-size:13.5px">${esc(o.status === 'Picked up' || o.status.includes('delivery') ? o.dropAddr : o.branch)}</b>
            <span class="mono">${o.km} km · ${o.eta}</span></div>
          <div class="mono" style="margin-top:4px">${o.status === 'Picked up' || o.status.includes('delivery') ? 'Drop-off · ' + esc(o.cust) : 'Pickup · ' + esc(o.merchant)}</div>
          <div class="navpick">${T().navApps.map(a =>
            `<button class="${S.navApp === a ? 'on' : ''}" data-a="navapp" data-v="${a}">${a}</button>`).join('')}</div>
          <div class="btnrow"><button class="btn pri" data-a="toast" data-v="Opening ${esc(S.navApp)}…">Start in ${esc(S.navApp)}</button></div>
        </div>` : ''}
      </div>
      ${tabbar()}`;
  };

  /* 09 wallet */
  SC.wallet = () => {
    const w = FRL.WALLET;
    return `${sb()}
      ${hdr('Wallet', w.period)}
      <div class="body">
        <div class="card" style="border-color:rgba(255,238,80,.4)">
          <span class="mono">Available to withdraw</span>
          <div class="big" style="margin:4px 0 2px">${money(w.available)}</div>
          <span class="mono">${esc(w.payout)} · ${esc(w.bank)}</span>
          <div class="hr"></div>
          <div class="row"><span class="dim" style="font-size:12.5px">Pending — clears on delivery</span><b>${money(w.pending)}</b></div>
          <div class="row" style="margin-top:6px"><span class="dim" style="font-size:12.5px">Cash you are holding</span><b class="warn">${money(w.cod)}</b></div>
          <div class="row" style="margin-top:6px"><span class="dim" style="font-size:12.5px">Earned with Dash</span><b>${money(w.lifetime)}</b></div>
          <button class="btn pri" style="margin-top:12px" data-a="sheet" data-v="withdraw|">Withdraw ${money(w.available)}</button>
          <div class="mono" style="margin-top:7px">Minimum withdrawal ${money(T().minWithdraw)}</div>
        </div>
        ${w.cod ? `<div class="note" style="--nc:var(--peach)"><b>${money(w.cod)} cash on you.</b> Collected on DX-41088. Hand it in at a Dash point and it clears from your wallet.</div>` : ''}

        <div class="sec">How your fare is split</div>
        <div class="card">
          <div class="ring">
            <span class="ring-c" style="--p:${T().share * 100}"><s>${Math.round(T().share * 100)}%</s></span>
            <div><b style="font-size:13px">You keep ${Math.round(T().share * 100)}% of every fare</b>
              <div class="mono" style="margin-top:4px">Dash keeps ${Math.round(T().dashFee * 100)}% — routing, payments, support</div></div>
          </div>
          <div class="hr"></div>
          <div class="mono">There is no negotiation and no surprise deduction. Every offer already shows your share.</div>
        </div>

        <div class="sec">Transactions</div>
        <div class="card">${w.tx.map(t => `<div class="tx">
          <div><b>${esc(t.t)}</b><em>${esc(t.d)}${t.gross ? ' · ' + money(t.gross) + ' gross, fee ' + money(t.fee) : ' · ' + t.k}</em></div>
          <s class="${t.a > 0 ? 'pos' : 'neg'}">${t.a > 0 ? '+' : '−'} ${money(Math.abs(t.a))}</s></div>`).join('')}</div>
      </div>
      ${tabbar()}`;
  };

  /* 08 support chat */
  SC.chat = () => `${sb()}
    ${hdr('Dash Support', T().chatScope)}
    <div class="body">
      <div class="note"><b>Dash Support only.</b> There is no dispatcher above you — Dash handles disputes, fares and account questions.</div>
      <div class="chat">${S.chat.map(c => `<div class="cm ${c.who}">
        ${c.who === 'them' ? `<span class="cn">${esc(c.n)}</span>` : ''}${esc(c.t)}<em>${esc(c.at)}</em></div>`).join('')}</div>
    </div>
    <div class="chatbar"><input id="msg" placeholder="Message Dash Support…"><button data-a="send">Send</button></div>
    ${tabbar()}`;

  /* 10 history */
  SC.history = () => {
    const f = S.histFilter;
    const rows = FRL.HISTORY.filter(h => f === 'All' || h.status === f);
    const del = FRL.HISTORY.filter(h => h.status === 'Delivered');
    return `${sb()}
      ${hdr('Order history', rows.length + ' orders', { back: true })}
      <div class="body">
        <div class="filters">${['All','Delivered','Returned','Skipped'].map(k =>
          `<button class="chip ${f === k ? 'on' : ''}" data-a="hist" data-v="${k}">${k}</button>`).join('')}</div>
        <div class="grid2">
          <div class="kpi"><em>Delivered</em><b>${del.length}</b><span>Last two days</span></div>
          <div class="kpi"><em>Skipped</em><b>${FRL.HISTORY.filter(h => h.status === 'Skipped').length}</b><span>Costs you nothing</span></div>
        </div>
        <div class="sec">Orders</div>
        ${rows.map(h => `<button class="oc" data-a="toast" data-v="${h.id} — ${h.status}${h.min ? ', ' + h.min + ' min' : ''}">
          <div class="oc-h"><b>${h.id}</b>${tag(h.status, statusColor(h.status), h.status !== 'Delivered')}</div>
          <div class="oc-f"><span>${esc(h.merchant)} · ${esc(h.d)}</span><span>${h.min ? h.min + ' min · ' : ''}<b>${money(h.pay)}</b></span></div>
        </button>`).join('') || '<div class="empty">Nothing in this filter</div>'}
        <div class="note"><b>Skipped offers are recorded, not penalised.</b> They sit here so you can see what you passed on and what it paid.</div>
      </div>
      ${tabbar()}`;
  };

  /* 11 profile */
  SC.profile = () => {
    const k = M().kpi, v = M().vehicle;
    return `${sb()}
      ${hdr(M().name, 'Independent · ' + M().city + ' · joined ' + M().joined, { back: true })}
      <div class="body">
        <div class="grid2">
          <div class="kpi"><em>Total deliveries</em><b>${k.deliveries.toLocaleString()}</b><span>With Dash</span></div>
          <div class="kpi"><em>Completion</em><b>${k.completion}%</b><span class="bar"><i style="width:${k.completion}%;background:var(--lav)"></i></span></div>
          <div class="kpi"><em>Avg delivery</em><b>${k.avgMin}<span style="font:500 11px var(--mono);color:var(--faint)"> min</span></b><span>Network avg 34</span></div>
          <div class="kpi"><em>Acceptance</em><b>${k.accepted}%</b><span>Never affects your offers</span></div>
        </div>
        <div class="note"><b>Acceptance is shown, not scored.</b> Dash offers by proximity and availability — declining does not push you down a list.</div>

        <div class="sec">Personal</div>
        <div class="card"><dl class="defs">
          <div><dt>Name</dt><dd>${esc(M().name)}</dd></div>
          <div><dt>Mobile</dt><dd>${esc(M().phone)}</dd></div>
          <div><dt>National ID</dt><dd>${esc(M().nid)}</dd></div>
          <div><dt>Area</dt><dd>${esc(M().area)}, ${esc(M().city)}</dd></div>
        </dl>
        <div class="btnrow"><button class="btn sm" data-a="toast" data-v="Edit your details and re-submit to Dash">Edit details</button></div></div>

        <div class="sec">Vehicle</div>
        <div class="card"><dl class="defs">
          <div><dt>Plate</dt><dd>${esc(v.plate)}</dd></div>
          <div><dt>Type</dt><dd>${esc(v.type)}</dd></div>
          <div><dt>Model</dt><dd>${esc(v.model)} · ${v.year}</dd></div>
        </dl></div>

        <div class="sec">Documents <span class="faint">Verified by Dash</span></div>
        <div class="card">${M().docs.map(d => `<div class="tx">
          <div><b>${esc(d.k)}</b><em>Valid until ${esc(d.exp)}</em></div><s>${tag(d.s, '#7BD389')}</s></div>`).join('')}</div>

        <div class="sec">App</div>
        <div class="card"><dl class="defs">
          <div><dt>Version</dt><dd>${esc(M().app.version)}</dd></div>
          <div><dt>Device</dt><dd>${esc(M().app.device)}</dd></div>
        </dl>
        <div class="btnrow"><button class="btn" data-a="toast" data-v="Reset link sent to +966 51 445 7730">Reset password</button>
        <button class="btn dan" data-a="go" data-v="signup">Sign out</button></div></div>
      </div>
      ${tabbar()}`;
  };

  /* 12 notifications */
  SC.notifications = () => `${sb()}
    ${hdr('Notifications', unread() ? unread() + ' need attention' : 'All caught up', { back: true, act:
      `<div class="hact"><button class="btn sm" data-a="readall">Mark read</button></div>` })}
    <div class="body">
      ${FRL.NOTIFS.map(n => `<button class="nt s-${S.notifRead ? 'low' : n.sev}" data-a="notif" data-v="${esc(n.link)}">
        <div><em>${esc(n.k)}</em><span>${esc(n.t)}</span></div><s>${esc(n.d)}</s></button>`).join('')}
    </div>
    ${tabbar()}`;

  SC.more = () => `${sb()}
    ${hdr('More', M().name + ' · independent')}
    <div class="body">
      ${onbar()}
      <div class="sec">Your work</div>
      ${[['history','Order history','Delivered, returned and skipped'],
         ['profile','Profile and documents','Details, vehicle, KPIs'],
         ['wallet','Wallet and withdrawals','Balance, fare split, transactions'],
         ['notifications','Notifications', unread() ? unread() + ' unread' : 'All caught up'],
         ['chat','Dash Support','Fares, disputes, account'],
         ['signup','Approval and documents','How you got verified']].map(([k, t, s]) =>
        `<button class="oc" data-a="go" data-v="${k}"><div class="oc-h"><b>${t}</b><span class="mono">→</span></div>
          <div class="oc-f"><span>${s}</span><span></span></div></button>`).join('')}
      <div class="sec">Your terms with Dash</div>
      <div class="card"><dl class="defs">
        <div><dt>Your share</dt><dd>${Math.round(T().share * 100)}% of every fare</dd></div>
        <div><dt>Going online</dt><dd>${esc(T().onlineControl)}</dd></div>
        <div><dt>Offers</dt><dd>By proximity · ${T().offerWindow}s to decide · one job at a time</dd></div>
        <div><dt>Skipping</dt><dd>${esc(T().skipPenalty)}</dd></div>
        <div><dt>Withdrawals</dt><dd>${esc(T().payout)} · min ${money(T().minWithdraw)}</dd></div>
        <div><dt>Support</dt><dd>${esc(T().chatScope)}</dd></div>
      </dl></div>
      <div class="note"><b>No company above you.</b> No shifts, no dispatcher, no roster. The only rules are the ones on this page.</div>
    </div>
    ${tabbar()}`;

  /* ---------- sheets ---------- */
  const SH = {
    waybill: id => { const o = FRL.order(id); return { t: 'Waybill', b: `
      <div class="waybill"><div class="wb-h"><b>DASH NETWORK</b><span>${o.id}</span></div>
        <div class="wb-b">
          <div><em>From</em>${esc(o.branch)}</div><div><em>To</em>${esc(o.dropAddr)}</div>
          <div><em>Customer</em>${esc(o.cust)} · ${esc(o.custPhone)}</div>
          <div><em>Items</em>${esc(o.items)}</div><div><em>COD</em>${o.cod ? money(o.cod) : 'Cash free'}</div>
          <div><em>Proof</em>${o.pod.join(', ')}</div><div><em>Driver</em>${esc(M().name)} · ${esc(M().vehicle.plate)}</div>
        </div><div class="wb-c">▌▐▌▌▐▐▌▐▌▌▐▌▐▐▌▌▐▌▐▌▐▐▌▌▐▐▌▐▌▌▐</div></div>
      <button class="btn" style="margin-top:12px" data-a="toast" data-v="Waybill saved to your phone">Save a copy</button>` }; },

    pod: id => { const o = FRL.order(id), got = S.pod[id] || {}; return { t: 'Proof of delivery', b: `
      <div class="mono" style="margin-bottom:12px">This order needs ${o.pod.join(' + ')}.</div>
      ${o.pod.includes('Photo') ? `<div class="sec" style="margin-top:0">Photo at the door</div>
        <button class="capture ${got.photo ? 'shot' : ''}" data-a="pod" data-v="${id}|photo" style="width:100%;border-width:1px">
          ${got.photo ? '✓ PHOTO CAPTURED' : '◎ TAP TO TAKE THE PHOTO'}</button>` : ''}
      ${o.pod.includes('OTP') ? `<div class="sec">Code from the customer</div>
        <div class="otp">${[0,1,2,3].map(k => `<i class="${got.otp ? 'f' : ''}">${got.otp ? '2946'[k] : ''}</i>`).join('')}</div>
        <button class="btn" data-a="pod" data-v="${id}|otp">${got.otp ? 'Code accepted' : 'Enter the code'}</button>` : ''}
      ${o.pod.includes('Signature') ? `<div class="sec">Signature</div>
        <button class="sig ${got.sig ? 'done' : ''}" style="width:100%;background:none;color:inherit" data-a="pod" data-v="${id}|sig">
          ${got.sig ? '✓ SIGNED' : 'SIGN HERE'}</button>` : ''}
      <div class="hr"></div>
      ${o.cod ? `<div class="note" style="--nc:var(--peach)"><b>Collect ${money(o.cod)} in cash.</b> It is held against your wallet until you hand it in.</div>` : ''}
      <button class="btn pri" data-a="deliver" data-v="${id}">Complete delivery · earn ${money(o.pay)}</button>` }; },

    cancel: id => ({ t: 'Cancel order', b: `
      <div class="mono" style="margin-bottom:12px">Pick a reason. Dash records it and the merchant is told.</div>
      <div class="pick">${FRL.REASONS.cancel.map(r => `<button data-a="docancel" data-v="${id}|${esc(r)}">${esc(r)}</button>`).join('')}</div>` }),

    fail: id => ({ t: 'Cannot deliver', b: `
      <div class="mono" style="margin-bottom:12px">You may try again ${T().maxReattempt} times, then it returns to the merchant and the return leg is paid.</div>
      <div class="pick">${FRL.REASONS.fail.map(r => `<button data-a="dofail" data-v="${id}|${esc(r)}">${esc(r)}</button>`).join('')}</div>` }),

    withdraw: () => { const w = FRL.WALLET; return { t: 'Withdraw', b: `
      <div class="mono" style="margin-bottom:12px">Available ${money(w.available)} · minimum ${money(T().minWithdraw)}</div>
      <div class="pick">
        <button data-a="dowithdraw" data-v="${w.available}">All of it — ${money(w.available)}</button>
        <button data-a="dowithdraw" data-v="200">${money(200)}</button>
        <button data-a="dowithdraw" data-v="100">${money(100)}</button>
      </div>
      <div class="hr"></div>
      <dl class="defs">
        <div><dt>To</dt><dd>${esc(w.bank)}</dd></div>
        <div><dt>Instant fee</dt><dd>SAR 2.00 · free on Sunday batch</dd></div>
        <div><dt>Arrives</dt><dd>Within minutes</dd></div>
      </dl>` }; }
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
    const oh = document.createElement('div'); oh.id = 'ovlhost'; app.appendChild(oh);
    paintOffer();
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

  /* ---------- the offer loop ---------- */
  function offerCard() {
    const o = S.offer; if (!o) return '';
    const pct = Math.max(0, S.secs / T().offerWindow * 100);
    return `<div class="ovl open" id="ovl"><div class="ovl-b">
      <div class="ovl-h"><em>New offer · Dash Network</em><em>${S.secs}s</em></div>
      <div class="offer">
        <div class="offer-h"><em>You earn</em><em>${esc(o.merchant)}</em></div>
        <div class="offer-pay">${money(o.pay).replace('SAR ', '')}<small>SAR</small></div>
        <div class="offer-meta">${o.km} km · ${o.min} min · ${o.cod ? 'COD ' + money(o.cod) : 'cash free'}</div>
        <span class="timer ${S.secs <= 7 ? 'low' : ''}"><i style="width:${pct}%"></i></span>
        <div class="offer-r"><i style="background:${FRL.PAL.peach}"></i>
          <div><b>${esc(o.branch)}</b><em>${o.toPickup} km from you · ${esc(o.pickAddr)}</em></div></div>
        <div class="offer-r"><i style="background:${FRL.PAL.vodka}"></i>
          <div><b>${esc(o.dropAddr)}</b><em>${esc(o.cust)} · ${esc(o.items)}</em></div></div>
        <div class="offer-a">
          <button class="acc" data-a="accept">Accept · ${money(o.pay)}</button>
          <button class="skp" data-a="skip">Skip</button>
        </div>
      </div>
      <div class="ovl-f">
        <div class="breakdown"><span class="dim">Merchant pays Dash</span><b>${money(o.gross)}</b></div>
        <div class="breakdown"><span class="dim">Dash fee — ${Math.round(T().dashFee * 100)}%</span><b class="warn">− ${money(o.gross - o.pay)}</b></div>
        <div class="breakdown tot"><span>You keep</span><b>${money(o.pay)}</b></div>
        <div class="mono" style="margin-top:9px;text-align:center">${esc(T().skipPenalty)}</div>
      </div>
    </div></div>`;
  }

  function paintOffer() {
    const host = document.getElementById('ovlhost'); if (!host) return;
    if (!S.offer) { host.innerHTML = ''; return; }
    const cur = host.querySelector('#ovl');
    if (!cur) { host.innerHTML = offerCard(); return; }
    const bar = cur.querySelector('.timer i');
    if (bar) bar.style.width = (S.secs / T().offerWindow * 100) + '%';
    cur.querySelector('.timer').classList.toggle('low', S.secs <= 7);
    cur.querySelectorAll('.ovl-h em')[1].textContent = S.secs + 's';
  }

  function nextOffer() {
    if (!S.queue.length) S.queue = FRL.OFFERS.slice();
    S.offer = S.queue.shift();
    S.secs = T().offerWindow; S.seen += 1;
    paintOffer();
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
  }

  setInterval(() => {
    if (S.offer) {
      S.secs -= 1;
      if (S.secs <= 0) {
        S.offer = null; S.missed += 1; S.wait = T().gap;
        paintOffer(); render();
        toast('Offer expired — it went to another driver. Nothing lost.');
      } else paintOffer();
      return;
    }
    if (!S.online || busy()) return;
    S.wait -= 1;
    if (S.wait <= 0) { S.wait = T().gap; nextOffer(); }
    else if (S.screen === 'home') {
      const el = document.querySelector('.rd-s');
      if (el) el.textContent = M().area + ', ' + M().city + ' · next offer in ' + S.wait + 's';
    }
  }, 1000);

  /* ---------- map ---------- */
  let map = null, sim = null;
  function mountMap() {
    if (sim) { clearInterval(sim); sim = null; }
    if (map) { map.remove(); map = null; }
    const el = document.getElementById('fmap'); if (!el || !window.L) return;
    const pick = [24.8480, 46.6390], drop = [24.8601, 46.6222];
    map = L.map(el, { zoomControl: false, attributionControl: true }).setView([24.8540, 46.6300], 14);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri, © OpenStreetMap contributors', maxZoom: 16 }).addTo(map);
    const icon = (c, l, big) => L.divIcon({ className: 'mk', html:
      `<span style="width:${big?26:18}px;height:${big?26:18}px;background:${c};border:1.5px solid #000;display:flex;align-items:center;justify-content:center;font:600 ${big?10:8}px ui-monospace,Menlo,monospace;color:#000">${l}</span>`,
      iconSize: [big?26:18, big?26:18], iconAnchor: [big?13:9, big?13:9] });
    L.marker(pick, { icon: icon(FRL.PAL.peach, 'P') }).addTo(map).bindTooltip('Pickup — Nuqta, Al Yasmin');
    L.marker(drop, { icon: icon(FRL.PAL.vodka, 'D') }).addTo(map).bindTooltip('Drop-off — Tahlia annex');
    L.polyline([pick, [24.8530, 46.6340], [24.8578, 46.6260], drop], { color: '#FFEE50', weight: 3, opacity: .9 }).addTo(map);
    const me = L.marker([24.8530, 46.6340], { icon: icon('#FFEE50', 'RZ', true) }).addTo(map).bindTooltip('You');
    let t = 0;
    sim = setInterval(() => { t += 0.06; me.setLatLng([24.8530 + Math.abs(Math.sin(t)) * 0.0026, 46.6340 - Math.abs(Math.sin(t)) * 0.0032]); }, 1200);
    setTimeout(() => map && map.invalidateSize(), 80);
  }

  /* ---------- actions ---------- */
  const A = {
    go: v => { if (v === 'offer') { if (!S.offer) { if (!S.online) return toast('Go online to receive offers.'); nextOffer(); return; } return paintOffer(); }
      S.screen = v; S.arg = null; S.tab = ['map','wallet','chat','more'].includes(v) ? v : (v === 'home' ? 'orders' : S.tab); render(); },
    tab: v => { S.tab = v; S.screen = v === 'orders' ? 'home' : v; S.arg = null; render(); },
    back: () => { S.screen = S.tab === 'orders' ? 'home' : S.tab; S.arg = null; render(); },
    order: v => { S.screen = 'order'; S.arg = v; S.tab = 'orders'; render(); },
    online: () => {
      S.online = !S.online;
      if (!S.online && S.offer) { S.offer = null; paintOffer(); }
      if (S.online) S.wait = 3;
      render(); toast(S.online ? 'Online — offers will start arriving' : 'Offline. Nothing new will arrive.');
    },
    navapp: v => { S.navApp = v; render(); },
    hist: v => { S.histFilter = v; render(); },
    readall: () => { S.notifRead = true; render(); toast('All notifications marked read'); },
    notif: v => { if (v.startsWith('order:')) return A.order(v.split(':')[1]); A.go(v); },
    sheet: v => { const [k, a] = v.split('|'); openSheet(k, a); },
    closesheet: closeSheet,
    toast: v => toast(v),
    send: () => {
      const i = document.getElementById('msg'); if (!i || !i.value.trim()) return;
      S.chat.push({ who: 'me', t: i.value.trim(), at: now() }); render();
      setTimeout(() => { S.chat.push({ who: 'them', n: 'Dash Support', t: 'Thanks Rakan — we have logged that.', at: now() }); render();
        const b = document.querySelector('.body'); if (b) b.scrollTop = b.scrollHeight; }, 1100);
      const b = document.querySelector('.body'); if (b) b.scrollTop = b.scrollHeight;
    },

    accept: () => {
      const o = S.offer; if (!o) return;
      FRL.ORDERS.unshift({ id:o.id, tag:'On demand', status:'Accepted', prio:'Normal',
        merchant:o.merchant, branch:o.branch, pickAddr:o.pickAddr, cust:o.cust, custPhone:'+966 50 220 1188',
        dropAddr:o.dropAddr, km:o.km, eta:'16:32', slot:null, cod:o.cod, pay:o.pay, gross:o.gross,
        items:o.items, pod:o.pod.slice(), instr:o.instr, dist:'Pickup is ' + o.toPickup + ' km away',
        log:[{ t:now(), e:'Offer accepted by you', s:money(o.pay) + ' · ' + o.km + ' km' }] });
      S.offer = null; paintOffer();
      S.screen = 'order'; S.arg = o.id; S.tab = 'orders'; render();
      toast('Accepted — ' + money(o.pay) + '. Head to ' + o.branch.split(' — ')[0] + '.');
    },
    skip: () => {
      const o = S.offer; if (!o) return;
      FRL.HISTORY.unshift({ id:o.id, d:'Today ' + now(), merchant:o.merchant, status:'Skipped', pay:0, cod:0, min:0 });
      S.offer = null; S.skipped += 1; S.wait = T().gap;
      paintOffer(); render();
      toast('Skipped ' + money(o.pay) + ' — no penalty, no effect on future offers.');
    },

    advance: id => {
      const o = FRL.order(id);
      if (o.status === 'At delivery') return openSheet('pod', id);
      const nxt = FRL.NEXT[o.status]; if (!nxt) return;
      o.status = nxt;
      o.log.push({ t: now(), e: nxt, s: nxt === 'At pickup' || nxt === 'At delivery' ? 'Geofence confirmed' : 'Timestamped · merchant notified' });
      if (nxt === 'At delivery') o.dist = 'You are 30 m from the drop-off';
      render(); toast(id + ' — ' + nxt);
    },
    pod: v => {
      const [id, k] = v.split('|');
      S.pod[id] = Object.assign({}, S.pod[id], { [k]: true });
      openSheet('pod', id);
      toast(k === 'photo' ? 'Photo captured' : k === 'otp' ? 'Code 2946 accepted' : 'Signature captured');
    },
    deliver: id => {
      const o = FRL.order(id), got = S.pod[id] || {};
      const need = o.pod.map(p => p === 'Photo' ? 'photo' : p === 'OTP' ? 'otp' : 'sig');
      if (T().podRequired && need.some(k => !got[k])) { toast('Proof is required — ' + o.pod.join(' + ') + ' before you can finish.'); return; }
      o.status = 'Delivered';
      o.log.push({ t: now(), e: 'Delivered', s: 'Proof: ' + o.pod.join(', ') + (o.cod ? ' · COD ' + money(o.cod) + ' collected' : '') });
      FRL.WALLET.tx.unshift({ d: 'Today ' + now(), t: 'Delivery — ' + id, a: o.pay, k: 'earn', gross: o.gross, fee: +(o.gross - o.pay).toFixed(2) });
      FRL.WALLET.available += o.pay; FRL.WALLET.lifetime += o.pay;
      if (o.cod) { FRL.WALLET.cod += o.cod; FRL.WALLET.tx.unshift({ d: 'Today ' + now(), t: 'COD collected — ' + id, a: -o.cod, k: 'cod' }); }
      M().kpi.today += 1;
      closeSheet(); S.screen = 'home'; S.tab = 'orders'; S.wait = 4; render();
      toast(id + ' delivered · ' + money(o.pay) + ' available now');
    },
    docancel: v => {
      const [id, r] = v.split('|'), o = FRL.order(id);
      o.status = 'Cancelled'; o.log.push({ t: now(), e: 'Cancelled by you', s: 'Reason: ' + r });
      closeSheet(); S.screen = 'home'; render(); toast(id + ' cancelled — ' + r.toLowerCase());
    },
    dofail: v => {
      const [id, r] = v.split('|'), o = FRL.order(id);
      o.attempts = (o.attempts || 0) + 1;
      if (T().reattempt && o.attempts < T().maxReattempt) {
        o.log.push({ t: now(), e: 'Failed attempt ' + o.attempts + ' of ' + T().maxReattempt, s: 'Reason: ' + r });
        closeSheet(); render(); toast('Attempt ' + o.attempts + ' recorded — ' + (T().maxReattempt - o.attempts) + ' left');
      } else {
        o.status = 'Returned';
        o.log.push({ t: now(), e: 'Returned to merchant', s: 'Reason: ' + r + ' · return leg paid' });
        const leg = +(o.pay * 0.4).toFixed(2);
        FRL.WALLET.tx.unshift({ d: 'Today ' + now(), t: 'Return leg — ' + id, a: leg, k: 'earn', gross: +(leg / T().share).toFixed(2), fee: +(leg / T().share - leg).toFixed(2) });
        FRL.WALLET.available += leg;
        closeSheet(); S.screen = 'home'; render(); toast(id + ' returned · return leg ' + money(leg) + ' paid');
      }
    },
    dowithdraw: v => {
      const amt = Math.min(+v, FRL.WALLET.available);
      FRL.WALLET.available -= amt;
      FRL.WALLET.tx.unshift({ d: 'Today ' + now(), t: 'Withdrawal to ' + FRL.WALLET.bank, a: -amt, k: 'payout' });
      closeSheet(); render(); toast(money(amt) + ' sent to ' + FRL.WALLET.bank);
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
