/* Dash DMS — new fleet operator onboarding and the locked verification status page.
   Until Dash verifies the company the DMS never renders: the operator only sees this. */
window.ONB = (function () {
  const U = () => window.UI;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const STEPS = ['Your account', 'Verify email', 'Company details', 'Fleet and coverage', 'Documents', 'Review and submit'];
  const DOCS = [
    ['cr', 'Commercial registration', 'Current CR from the Ministry of Commerce'],
    ['vat', 'VAT certificate', 'ZATCA registration certificate'],
    ['tga', 'Transport licence', 'Transport General Authority licence for last-mile delivery'],
    ['ins', 'Fleet insurance', 'Third-party cover for every vehicle you will put on the road'],
    ['bank', 'Bank letter', 'IBAN letter in the legal name — Dash pays your network earnings here']
  ];
  const FILES = { cr: 'CR_TayarExpress_2026.pdf', vat: 'ZATCA_VAT_certificate.pdf', tga: 'TGA_lastmile_licence.pdf', ins: 'Tawuniya_fleet_policy.pdf', bank: 'IBAN_letter_AlRajhi.pdf' };
  const OPTS = {
    cities: ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah'],
    veh: ['Motorbike', 'Car', 'Van', 'Refrigerated van'],
    drv: ['Employees', 'Contractors', 'Freelancers'],
    net: ['Supply — receive orders from Dash', 'Demand — send overflow to Dash']
  };
  const S = {
    mode: 'flow', step: 0, status: 'review', terms: false, code: '',
    f: { name: 'Khalid Al Shammari', email: 'ops@tayarexpress.sa', phone: '+966 54 771 0832', pass: '············',
         legal: 'Tayar Express Logistics Co.', trade: 'Tayar Express', cr: '1010 7734 52', vat: '3108 2290 4410 003',
         city: 'Riyadh', hq: 'Al Olaya, Riyadh 12244', site: 'tayarexpress.sa', tgano: 'TGA-LM-2026-08817', size: '50 – 200 drivers' },
    multi: { cities: ['Riyadh'], veh: ['Motorbike', 'Car'], drv: ['Employees', 'Contractors'], net: ['Supply — receive orders from Dash'] },
    docs: { cr: null, vat: null, tga: null, ins: null, bank: null },
    fixed: {}, mine: [], draft: ''
  };
  const REQS = [
    { k: 'cr', t: 'Commercial registration', why: 'The scan is cut off at the bottom, so the CR number and expiry date can’t be read. Rescan the full page.' },
    { k: 'ins', t: 'Fleet insurance', why: 'The policy lists 38 vehicles. You declared 50 – 200 drivers. Upload the full schedule, or lower the fleet size for now.' }
  ];
  const STATES = {
    review: { c: '#FFEE50', tag: 'In review', eb: 'Verification · in review', t: 'We’re reviewing your company',
      p: 'Dash’s onboarding team is checking your commercial registration, transport licence, insurance and bank letter against the details you entered. Most fleets are decided within one working day, and we email you the moment it’s done.' },
    details: { c: '#FFCC99', tag: 'Details requested', eb: 'Verification · action needed', t: 'Dash needs a few more details',
      p: 'Two items need your attention before the review can continue. Fix them below and send them back. The request goes straight back into the queue; you don’t start over.' },
    rejected: { c: '#FCA38B', tag: 'Not verified', eb: 'Verification · declined', t: 'We couldn’t verify this fleet',
      p: 'The transport licence you uploaded covers passenger transport, not last-mile delivery. Dash can only onboard fleets licensed for goods delivery. Nothing has been charged.' },
    approved: { c: '#1f8a4c', tag: 'Verified', eb: 'Verification · complete', t: 'You’re verified',
      p: 'Tayar Express is verified. Your DMS is open: add drivers and vehicles, draw your zones, then switch on Dash Network supply.' }
  };
  let host = null;

  const inp = (k, ph, type) => `<input class="in" data-onbk="${k}" type="${type || 'text'}" value="${esc(S.f[k])}" placeholder="${esc(ph || '')}">`;
  const sel = (k, opts) => `<select class="in" data-onbk="${k}">${opts.map(o => `<option ${o === S.f[k] ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  const chips = k => `<div class="chips">${OPTS[k].map(o => `<button type="button" class="chip ${S.multi[k].includes(o) ? 'on' : ''}" data-act="onbChip" data-arg="${k}|${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
  const brand = () => `<div class="onb-brand"><img src="assets/dash-logo-white.png" alt="Dash" width="606" height="242"><i></i><em>DMS</em></div>`;

  function body() {
    const F = U().field, f = S.f;
    switch (S.step) {
      case 0: return `<div class="onb-g">
          ${F('Full name', inp('name'))}${F('Work email', inp('email', '', 'email'), 'This becomes the owner login. Dispatchers and finance are invited after verification.')}
          ${F('Mobile', inp('phone'))}${F('Password', inp('pass', '', 'password'), 'At least 10 characters')}</div>`;
      case 1: return `<p class="onb-d" style="margin-bottom:14px">We sent a six digit code to <b>${esc(f.email)}</b>. It expires in 10 minutes.</p>
          ${F('Verification code', `<input class="in onb-code" data-onbc="1" inputmode="numeric" maxlength="6" placeholder="000000" value="${esc(S.code)}">`, 'Any six digits work in this prototype.')}
          <div class="onb-alt">Nothing arrived? <a href="#" data-act="onbResend">Send it again</a></div>`;
      case 2: return `<div class="onb-g">
          ${F('Legal name', inp('legal'), 'Exactly as on the commercial registration')}${F('Trade name', inp('trade'), 'What merchants see in the 3PL Marketplace')}
          ${F('CR number', inp('cr'))}${F('VAT number', inp('vat'))}
          ${F('Transport licence number', inp('tgano'), 'Issued by the Transport General Authority')}${F('City', sel('city', OPTS.cities))}
          ${F('Head office address', inp('hq'))}${F('Website', inp('site'))}</div>`;
      case 3: return `<div class="onb-g">
          ${F('Fleet size', sel('size', ['Under 20 drivers', '20 – 50 drivers', '50 – 200 drivers', 'Over 200 drivers']))}<span></span></div>
          ${F('Cities you deliver in', chips('cities'))}
          ${F('Vehicle types', chips('veh'))}
          ${F('Who drives for you', chips('drv'), 'Freelancers come through Dash; employees and contractors are your own records.')}
          ${F('Dash Network', chips('net'), 'Optional. Dash approves each role separately after you’re verified.')}`;
      case 4: return `<div class="onb-list">${DOCS.map(([k, t, d]) => `<div class="onb-doc">
            <div><b>${t}</b><em>${d}</em>${S.docs[k] ? `<span class="fn">✓ ${esc(S.docs[k])}</span>` : '<span class="rq">Required · PDF or image, up to 10 MB</span>'}</div>
            ${U().btn(S.docs[k] ? 'Replace' : 'Upload', { kind: S.docs[k] ? '' : 'primary', act: 'onbUp', arg: k })}</div>`).join('')}</div>`;
      case 5: {
        const edit = s => `<a href="#" data-act="onbGo" data-arg="${s}" style="font-size:11px;color:var(--ink)">Edit</a>`;
        return `${U().panel('Account', U().defs([['Owner', esc(f.name)], ['Email', esc(f.email)], ['Mobile', esc(f.phone)]]), { right: edit(0) })}
          ${U().panel('Company', U().defs([['Legal name', esc(f.legal)], ['Trade name', esc(f.trade)], ['CR', esc(f.cr)], ['VAT', esc(f.vat)], ['Transport licence', esc(f.tgano)], ['Head office', esc(f.hq) + ' · ' + esc(f.city)]]), { right: edit(2) })}
          ${U().panel('Fleet and coverage', U().defs([['Fleet size', esc(f.size)], ['Cities', S.multi.cities.join(', ') || '<em class="warn">None</em>'], ['Vehicles', S.multi.veh.join(', ') || '<em class="warn">None</em>'], ['Drivers', S.multi.drv.join(', ') || '—'], ['Dash Network', S.multi.net.map(x => x.split(' — ')[0]).join(', ') || 'Not now']]), { right: edit(3) })}
          ${U().panel('Documents', U().defs(DOCS.map(([k, t]) => [t, S.docs[k] ? esc(S.docs[k]) : '<em class="warn">Missing</em>'])), { right: edit(4) })}
          <div style="margin-top:4px">${U().toggle(S.terms, 'onbTerms', '', 'I confirm these details are accurate and accept the Dash Fleet Terms')}</div>`;
      }
    }
  }

  const DESC = [
    'Start with the person who owns the account. You can add dispatchers, finance and drivers after verification.',
    'One step to prove the email is yours.',
    'Dash checks these against the Ministry of Commerce, ZATCA and the Transport General Authority, so they need to match your documents.',
    'Tell us where you deliver and with what. You can change all of this later.',
    'Five documents. Dash reviews them by hand; nothing is shared outside the onboarding team.',
    'Check everything once. After you submit, the DMS stays locked until Dash verifies the company.'
  ];

  function flowView() {
    const last = S.step === STEPS.length - 1;
    return `<aside class="onb-l">${brand()}
        <h1 class="onb-h">Bring your<br><span>fleet</span><br>to Dash.</h1>
        <p class="onb-sub">Six short steps. Dash verifies the company before your DMS opens, usually within one working day.</p>
        <ol class="onb-steps">${STEPS.map((s, i) => `<li class="${i < S.step ? 'done' : i === S.step ? 'on' : ''}" ${i < S.step ? `data-act="onbGo" data-arg="${i}"` : ''}>
          <i>${i < S.step ? '✓' : i + 1}</i>${s}</li>`).join('')}
          <li class="lock"><i>·</i>Dash verifies you</li></ol>
        <div class="onb-foot">Questions before you start?<br><a href="mailto:fleets@dash.sa">fleets@dash.sa</a></div></aside>
      <main class="onb-r"><div class="onb-card">
        <div class="onb-eb">Step ${S.step + 1} of ${STEPS.length}</div>
        <h2 class="onb-t">${STEPS[S.step]}</h2>
        ${S.step === 1 ? '' : `<p class="onb-d">${DESC[S.step]}</p>`}
        ${body()}
        <div class="onb-act">
          ${S.step > 0 ? U().btn('Back', { act: 'onbBack' }) : ''}<span class="onb-sp"></span>
          ${U().btn(last ? 'Submit for verification' : 'Continue', { kind: 'primary', act: last ? 'onbSubmit' : 'onbNext' })}
        </div>
        ${S.step === 0 ? `<div class="onb-alt">${S.fromApp ? 'Previewing from the DMS.' : 'Already on Dash?'} <a href="#" data-act="onbSignin">${S.fromApp ? 'Close preview' : 'Sign in'}</a></div>` : ''}
      </div></main>`;
  }

  function timeline() {
    const st = S.status;
    const rows = [['Submitted', '27 Aug 2026 · 11:40', 'done'],
      ['Picked up by Dash onboarding', st === 'review' ? 'Yousef Al Ghamdi · reviewing now' : '27 Aug 2026 · 13:15', st === 'review' ? 'on' : 'done']];
    if (st === 'details') rows.push(['More details requested', '28 Aug 2026 · 09:30 · waiting on you', 'on']);
    rows.push(st === 'approved' ? ['Verified', '28 Aug 2026 · 16:05', 'done']
      : st === 'rejected' ? ['Declined', '28 Aug 2026 · 10:12', 'bad'] : ['Decision', 'Usually within one working day', 'wait']);
    rows.push(['Fleet setup', st === 'approved' ? 'Add drivers, vehicles and zones' : 'Opens after verification', st === 'approved' ? 'on' : 'wait']);
    return `<div class="steps">${rows.map(([t, s, c], i) => `<div class="stp ${c}"><span class="stp-n">${c === 'done' ? '✓' : c === 'bad' ? '×' : i + 1}</span><div><b>${t}</b><em>${s}</em></div></div>`).join('')}</div>`;
  }

  function msgs() {
    const base = [{ w: 'Dash onboarding', t: '27 Aug · 13:15', m: 'Thanks, we’ve picked up your request. We’ll come back within one working day.' }];
    if (S.status === 'details') base.push({ w: 'Yousef · Dash onboarding', t: '28 Aug · 09:30', m: 'Two things: the CR scan is cut off, and the insurance schedule covers fewer vehicles than your fleet size. Details above.' });
    if (S.status === 'rejected') base.push({ w: 'Yousef · Dash onboarding', t: '28 Aug · 10:12', m: 'Licence TGA-LM-2026-08817 is registered for passenger transport. Once the goods delivery activity is added, reapply and we’ll fast-track it.' });
    if (S.status === 'approved') base.push({ w: 'Yousef · Dash onboarding', t: '28 Aug · 16:05', m: 'All checked. Welcome to Dash — your network supply request is next in line.' });
    return base.concat(S.mine).map(x => `<div class="onb-msg ${x.me ? 'me' : ''}"><b>${esc(x.w)}</b><time>${esc(x.t)}</time><p>${esc(x.m)}</p></div>`).join('');
  }

  function stateBlock() {
    const B = U().btn, st = S.status;
    if (st === 'details') {
      const left = REQS.filter(r => !S.fixed[r.k]).length;
      return U().panel('What Dash asked for', REQS.map(r => `<div class="onb-req">
          <div><b style="font-size:12.5px">${r.t}</b><p style="margin:4px 0 0;font-size:12px;color:var(--dim);line-height:1.55">${r.why}</p>
            ${S.fixed[r.k] ? `<span class="fn" style="font:500 10.5px var(--mono);color:#1f8a4c;display:block;margin-top:6px">✓ ${esc(S.fixed[r.k])} · ready to send</span>` : ''}</div>
          ${B(S.fixed[r.k] ? 'Replace' : 'Upload new file', { kind: S.fixed[r.k] ? '' : 'primary', act: 'onbFix', arg: r.k })}</div>`).join('') +
        `<div style="padding:12px 13px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${B('Send back to Dash', { kind: 'primary', act: left ? 'onbNeed' : 'onbResubmit' })}
          <span class="fld-h" style="margin:0">${left ? left + ' of ' + REQS.length + ' still to upload' : 'Both items ready.'}</span></div>`, { pad: false });
    }
    if (st === 'rejected') return U().panel('What you can do', U().defs([
        ['Reason', 'Transport licence is for passenger transport, not goods delivery'],
        ['Fix it', 'Add the last-mile delivery activity with the TGA, then reapply. Your other documents are kept.'],
        ['Disagree', 'Reply to the onboarding team below or call us. A second reviewer looks at every appeal.'],
        ['Charged', 'Nothing']
      ]) + `<div class="btnrow">${B('Correct details and reapply', { kind: 'primary', act: 'onbGo', arg: '2' })}${B('Call onboarding', { act: 'stub', arg: 'Calling +966 11 555 0177' })}</div>`);
    if (st === 'approved') return U().panel('Next', `<div class="btnrow big" style="margin-top:0">${B('Open the DMS', { kind: 'primary', act: 'onbDash' })}</div>
        <div class="fld-h">In this prototype the DMS opens on the Rehla Fleet demo account.</div>`);
    return U().panel('While you wait', U().defs([
        ['Expected by', 'Tomorrow, 28 Aug, before 17:00'],
        ['We’ll tell you', 'By email to ' + esc(S.f.email) + ' and SMS to ' + esc(S.f.phone)],
        ['Need to change something', 'Withdraw the request, edit and resubmit. Your place in the queue resets.']
      ]) + `<div class="btnrow">${B('Withdraw and edit', { act: 'onbGo', arg: '2' })}</div>`);
  }

  function statusView() {
    const s = STATES[S.status], f = S.f, B = U().btn;
    const dstate = k => S.status === 'approved' ? ['Accepted', '#1f8a4c'] : S.status === 'details' && REQS.some(r => r.k === k)
      ? (S.fixed[k] ? ['Replaced · not sent', '#FFEE50'] : ['Needs replacing', '#FCA38B']) : S.status === 'rejected' && k === 'tga' ? ['Rejected', '#FCA38B'] : ['In review', '#C0D2FF'];
    return `<header class="onb-top">${brand()}<span class="who">${esc(f.trade)}<em>Request FV-2026-0231</em></span>
        <span class="onb-sp"></span>${U().tag(s.tag, s.c, { solid: true })}${B(S.fromApp ? 'Close preview' : 'Sign out', { act: 'onbSignin' })}</header>
      <div class="onb-body"><div class="onb-wrap">
        <section class="onb-hero" style="--hc:${s.c}">
          <div class="onb-eb">${s.eb}</div><h1 class="onb-t">${s.t}</h1><p>${s.p}</p>
          <div class="onb-meta"><span>Company <b>${esc(f.legal)}</b></span><span>Submitted <b>27 Aug 2026</b></span><span>Reviewer <b>Yousef Al Ghamdi</b></span></div>
        </section>
        <div class="cols c-2-1">
          <div class="stack">
            ${stateBlock()}
            ${U().panel('Progress', timeline(), { pad: false })}
            ${U().panel('Messages with Dash', msgs() + `<div style="padding:12px 13px">
              <textarea class="in onb-ta" data-onbm="1" placeholder="Write to the onboarding team…">${esc(S.draft)}</textarea>
              <div class="btnrow" style="margin-top:8px">${B('Send message', { kind: 'primary', act: 'onbMsg' })}</div></div>`, { pad: false })}
          </div>
          <div class="stack">
            ${U().panel('Contact us', U().defs([
              ['Message', 'Use the thread on this page · replies within 2 working hours'],
              ['Email', '<a href="mailto:fleets@dash.sa" style="color:var(--ink)">fleets@dash.sa</a>'],
              ['Phone', '+966 11 555 0177 · Sun–Thu 09:00–18:00']
            ]) + `<div class="btnrow">${B('Book a call', { act: 'stub', arg: 'Call booked for tomorrow 10:00' })}${B('Help centre', { act: 'stub', arg: 'Opens the fleet onboarding help articles' })}</div>`)}
            ${U().panel('Your submission', U().defs([
              ['Legal name', esc(f.legal)], ['CR', esc(f.cr)], ['Transport licence', esc(f.tgano)],
              ['Fleet', esc(f.size) + ' · ' + S.multi.veh.join(', ')], ['Cities', S.multi.cities.join(', ')]
            ]) + `<div class="sub-h" style="margin-top:12px;font:500 9px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--faint)">Documents</div>` +
              U().defs(DOCS.map(([k, t]) => { const [l, c] = dstate(k); return [t, U().tag(l, c, { solid: c !== '#1f8a4c' })]; })))}
            ${S.status === 'approved' ? '' : U().panel('Locked until you’re verified', `<ul class="onb-lock">${['Control tower and dispatch', 'Adding drivers and vehicles', 'Merchant connections', 'Dash Network supply and demand', '3PL Marketplace listing', 'Driver payouts'].map(x => `<li><span>${x}</span><em class="sub">Locked</em></li>`).join('')}</ul>`, { pad: false })}
          </div>
        </div>
        <div class="onb-demo"><span>Prototype · preview a review outcome</span>${Object.keys(STATES).map(k =>
          `<button type="button" class="chip ${S.status === k ? 'on' : ''}" data-act="onbState" data-arg="${k}">${STATES[k].tag}</button>`).join('')}</div>
      </div></div>`;
  }

  function paint(top) {
    if (!host) return;
    host.className = 'onb' + (S.mode === 'status' ? ' st' : '');
    host.innerHTML = S.mode === 'status' ? statusView() : flowView();
    if (top) { host.scrollTop = 0; host.querySelectorAll('.onb-r,.onb-body').forEach(e => e.scrollTop = 0); }
  }
  function mount() {
    document.body.classList.add('onboarding');
    if (!host) { host = document.createElement('div'); document.body.appendChild(host); }
    paint(true);
  }
  function close() { if (host) { host.remove(); host = null; } document.body.classList.remove('onboarding'); }
  const open = step => { S.mode = 'flow'; S.step = step || 0; mount(); };
  const status = st => { S.mode = 'status'; if (st) S.status = st; mount(); };
  const toast = m => U().toast(m);

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.onbk) S.f[t.dataset.onbk] = t.value;
    else if (t.dataset.onbc) S.code = t.value.replace(/\D/g, '');
    else if (t.dataset.onbm) S.draft = t.value;
  });
  document.addEventListener('change', e => { const t = e.target; if (t.dataset.onbk) S.f[t.dataset.onbk] = t.value; });

  window.ACT = Object.assign(window.ACT || {}, {
    onbNext: () => {
      if (S.step === 1 && !/^\d{6}$/.test(S.code)) return toast('Enter the six digit code from the email');
      if (S.step === 3 && (!S.multi.cities.length || !S.multi.veh.length)) return toast('Pick at least one city and one vehicle type');
      if (S.step === 4 && DOCS.some(([k]) => !S.docs[k])) return toast('Upload all five documents to continue');
      S.step++; paint(true);
    },
    onbBack: () => { S.step = Math.max(0, S.step - 1); paint(true); },
    onbGo: a => { S.mode = 'flow'; S.step = +a; paint(true); },
    onbResend: () => toast('New code sent to ' + S.f.email),
    onbChip: a => { const [k, v] = a.split('|'), l = S.multi[k], i = l.indexOf(v); i < 0 ? l.push(v) : l.splice(i, 1); paint(); },
    onbUp: k => { S.docs[k] = FILES[k]; paint(); },
    onbTerms: () => { S.terms = !S.terms; paint(); },
    onbSubmit: () => {
      if (!S.terms) return toast('Confirm the details and accept the terms first');
      if (DOCS.some(([k]) => !S.docs[k])) return toast('A document is missing — go back to Documents');
      S.mode = 'status'; S.status = 'review'; S.fixed = {}; paint(true);
      toast('Submitted. Dash will review it within one working day');
    },
    onbState: k => { S.status = k; paint(); },
    onbFix: k => { S.fixed[k] = k === 'cr' ? 'CR_TayarExpress_fullpage.pdf' : 'Tawuniya_fleet_schedule_full.pdf'; paint(); },
    onbNeed: () => toast('Upload both requested files first'),
    onbResubmit: () => {
      S.status = 'review'; S.mine.push({ w: 'You', t: 'Just now', m: 'Uploaded a full-page CR scan and the complete insurance schedule.', me: true });
      paint(true); toast('Sent back to Dash — the review continues');
    },
    onbMsg: () => {
      if (!S.draft.trim()) return toast('Write a message first');
      S.mine.push({ w: 'You', t: 'Just now', m: S.draft.trim(), me: true }); S.draft = ''; paint(); toast('Message sent to the onboarding team');
    },
    onbSignin: () => { close(); if (S.fromApp) { S.fromApp = false; return; } if (window.AUTH) AUTH.show(); },
    onbDash: () => { close(); if (S.fromApp) { S.fromApp = false; return; } if (window.AUTH) AUTH.enterAs(); UI.toast('Verified — welcome to Dash DMS'); },
    onbPreview: a => { S.fromApp = true; a === 'flow' ? open(0) : status('review'); }
  });

  return { open, status, close };
})();
