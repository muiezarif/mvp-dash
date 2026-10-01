/* Dash Merchant — new-merchant onboarding and the locked verification status page.
   Until Dash verifies the business the dashboard never renders: the merchant only sees this. */
window.ONB = (function () {
  const U = () => window.UI;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const STEPS = ['Your account', 'Verify email', 'Business details', 'Branches', 'Documents', 'Review and submit'];
  const DOCS = [
    ['cr', 'Commercial registration', 'Current CR from the Ministry of Commerce'],
    ['vat', 'VAT certificate', 'ZATCA registration certificate'],
    ['mun', 'Municipality licence', 'Balady licence for your head office'],
    ['bank', 'Bank letter', 'IBAN letter in the legal name — settlements are paid here']
  ];
  const S = {
    mode: 'flow', step: 0, status: 'review', terms: false, code: '',
    f: { name: 'Huda Al Qahtani', email: 'ops@tamrapharmacy.sa', phone: '+966 55 310 2290', pass: '············',
         legal: 'Tamra Trading Est.', trade: 'Tamra Pharmacy', cat: 'Pharmacy', cr: '1010 6621 04', vat: '3112 0458 7700 003',
         city: 'Riyadh', hq: 'Al Nakheel, Riyadh 12382', site: 'tamrapharmacy.sa', vol: '30 – 100 orders a day' },
    branches: [{ n: 'Tamra — Al Nakheel', d: 'Al Nakheel', h: '08:00 – 00:00' }, { n: 'Tamra — Al Rawdah', d: 'Al Rawdah', h: '08:00 – 23:00' }],
    docs: { cr: null, vat: null, mun: null, bank: null },
    fixed: {}, mine: [], draft: ''
  };
  const REQS = [
    { k: 'mun', t: 'Municipality licence', why: 'The licence you uploaded expired on 3 March 2026. Upload the renewed licence from Balady.' },
    { k: 'bank', t: 'Bank letter', why: 'The account holder on the letter reads “Tamra Pharmacy”. It must match the legal name, Tamra Trading Est.' }
  ];
  const STATES = {
    review: { c: '#FFEE50', tag: 'In review', eb: 'Verification · in review', t: 'We’re reviewing your request',
      p: 'Dash’s onboarding team is checking your commercial registration, VAT certificate, licence and bank letter against the details you entered. Most requests are decided within one working day, and we email you the moment it’s done.' },
    details: { c: '#FFCC99', tag: 'Details requested', eb: 'Verification · action needed', t: 'Dash needs a few more details',
      p: 'Two items need your attention before the review can continue. Fix them below and send them back. The request goes straight back into the queue; you don’t start over.' },
    rejected: { c: '#FCA38B', tag: 'Not verified', eb: 'Verification · declined', t: 'We couldn’t verify this business',
      p: 'The commercial registration number doesn’t match the legal name held by the Ministry of Commerce. Nothing has been charged. Correct the details and apply again, or contact us if you think this is a mistake.' },
    approved: { c: '#1f8a4c', tag: 'Verified', eb: 'Verification · complete', t: 'You’re verified',
      p: 'Tamra Pharmacy is verified. Your dashboard is open: connect a storefront, set your dispatch rules and send your first order.' }
  };
  let host = null;

  const inp = (k, ph, type) => `<input class="in" data-onbk="${k}" type="${type || 'text'}" value="${esc(S.f[k])}" placeholder="${esc(ph || '')}">`;
  const sel = (k, opts) => `<select class="in" data-onbk="${k}">${opts.map(o => `<option ${o === S.f[k] ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  const brand = () => `<div class="onb-brand"><img src="assets/dash-logo-white.png" alt="Dash" width="606" height="242"><i></i><em>MERCHANT</em></div>`;

  function body() {
    const F = U().field, f = S.f;
    switch (S.step) {
      case 0: return `<div class="onb-g">
          ${F('Full name', inp('name'))}${F('Work email', inp('email', '', 'email'), 'This becomes the owner login. Teammates are invited after verification.')}
          ${F('Mobile', inp('phone'))}${F('Password', inp('pass', '', 'password'), 'At least 10 characters')}</div>`;
      case 1: return `<p class="onb-d" style="margin-bottom:14px">We sent a six digit code to <b>${esc(f.email)}</b>. It expires in 10 minutes.</p>
          ${F('Verification code', `<input class="in onb-code" data-onbc="1" inputmode="numeric" maxlength="6" placeholder="000000" value="${esc(S.code)}">`, 'Any six digits work in this prototype.')}
          <div class="onb-alt">Nothing arrived? <a href="#" data-act="onbResend">Send it again</a></div>`;
      case 2: return `<div class="onb-g">
          ${F('Legal name', inp('legal'), 'Exactly as on the commercial registration')}${F('Trade name', inp('trade'), 'What customers see on tracking links')}
          ${F('Category', sel('cat', ['Grocery', 'Pharmacy', 'Restaurant', 'Fashion', 'Electronics', 'Other']))}${F('Expected volume', sel('vol', ['Under 30 orders a day', '30 – 100 orders a day', '100 – 500 orders a day', 'Over 500 orders a day']))}
          ${F('CR number', inp('cr'))}${F('VAT number', inp('vat'))}
          ${F('City', sel('city', ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah']))}${F('Head office address', inp('hq'))}
          ${F('Website', inp('site'))}</div>`;
      case 3: return `<div class="onb-list">${S.branches.map((b, i) => `<div class="onb-row">
            ${F('Branch name', `<input class="in" data-onbb="${i}|n" value="${esc(b.n)}">`)}
            ${F('District', `<input class="in" data-onbb="${i}|d" value="${esc(b.d)}">`)}
            ${F('Hours', `<input class="in" data-onbb="${i}|h" value="${esc(b.h)}">`)}
            <div class="fld">${S.branches.length > 1 ? U().btn('Remove', { kind: 'danger', act: 'onbDelBranch', arg: String(i) }) : ''}</div></div>`).join('')}</div>
          <div class="btnrow">${U().btn('Add another branch', { act: 'onbAddBranch' })}</div>
          <div class="fld-h" style="margin-top:10px">Map pins, managers and per-day hours can be set once you’re verified.</div>`;
      case 4: return `<div class="onb-list">${DOCS.map(([k, t, d]) => `<div class="onb-doc">
            <div><b>${t}</b><em>${d}</em>${S.docs[k] ? `<span class="fn">✓ ${esc(S.docs[k])}</span>` : '<span class="rq">Required · PDF or image, up to 10 MB</span>'}</div>
            ${U().btn(S.docs[k] ? 'Replace' : 'Upload', { kind: S.docs[k] ? '' : 'primary', act: 'onbUp', arg: k })}</div>`).join('')}</div>`;
      case 5: {
        const edit = s => `<a href="#" data-act="onbGo" data-arg="${s}" style="font-size:11px;color:var(--ink)">Edit</a>`;
        return `${U().panel('Account', U().defs([['Owner', esc(f.name)], ['Email', esc(f.email)], ['Mobile', esc(f.phone)]]), { right: edit(0) })}
          ${U().panel('Business', U().defs([['Legal name', esc(f.legal)], ['Trade name', esc(f.trade)], ['Category', esc(f.cat)], ['CR', esc(f.cr)], ['VAT', esc(f.vat)], ['Head office', esc(f.hq) + ' · ' + esc(f.city)], ['Volume', esc(f.vol)]]), { right: edit(2) })}
          ${U().panel('Branches', U().defs(S.branches.map(b => [b.n, esc(b.d) + ' · ' + esc(b.h)])), { right: edit(3) })}
          ${U().panel('Documents', U().defs(DOCS.map(([k, t]) => [t, S.docs[k] ? esc(S.docs[k]) : '<em class="warn">Missing</em>'])), { right: edit(4) })}
          <div style="margin-top:4px">${U().toggle(S.terms, 'onbTerms', '', 'I confirm these details are accurate and accept the Dash Merchant Terms')}</div>`;
      }
    }
  }

  const DESC = [
    'Start with the person who owns the account. You can add teammates and branch managers after verification.',
    'One step to prove the email is yours.',
    'Dash checks these against the Ministry of Commerce and ZATCA records, so they need to match your documents.',
    'Add the locations orders are picked up from. You need at least one.',
    'Four documents. Dash reviews them by hand; nothing is shared outside the onboarding team.',
    'Check everything once. After you submit, the dashboard stays locked until Dash verifies the business.'
  ];

  function flowView() {
    const last = S.step === STEPS.length - 1;
    return `<aside class="onb-l">${brand()}
        <h1 class="onb-h">Open a<br><span>merchant</span><br>account.</h1>
        <p class="onb-sub">Six short steps. Dash verifies the business before your dashboard opens, usually within one working day.</p>
        <ol class="onb-steps">${STEPS.map((s, i) => `<li class="${i < S.step ? 'done' : i === S.step ? 'on' : ''}" ${i < S.step ? `data-act="onbGo" data-arg="${i}"` : ''}>
          <i>${i < S.step ? '✓' : i + 1}</i>${s}</li>`).join('')}
          <li class="lock"><i>·</i>Dash verifies you</li></ol>
        <div class="onb-foot">Questions before you start?<br><a href="mailto:onboarding@dash.sa">onboarding@dash.sa</a></div></aside>
      <main class="onb-r"><div class="onb-card">
        <div class="onb-eb">Step ${S.step + 1} of ${STEPS.length}</div>
        <h2 class="onb-t">${STEPS[S.step]}</h2>
        ${S.step === 1 ? '' : `<p class="onb-d">${DESC[S.step]}</p>`}
        ${body()}
        <div class="onb-act">
          ${S.step > 0 ? U().btn('Back', { act: 'onbBack' }) : ''}<span class="onb-sp"></span>
          ${U().btn(last ? 'Submit for verification' : 'Continue', { kind: 'primary', act: last ? 'onbSubmit' : 'onbNext' })}
        </div>
        ${S.step === 0 ? `<div class="onb-alt">${S.fromApp ? 'Previewing from the dashboard.' : 'Already on Dash?'} <a href="#" data-act="onbSignin">${S.fromApp ? 'Close preview' : 'Sign in'}</a></div>` : ''}
      </div></main>`;
  }

  function timeline() {
    const st = S.status;
    const rows = [['Submitted', '29 Aug 2026 · 14:10', 'done'],
      ['Picked up by Dash onboarding', st === 'review' ? 'Reem Al Shehri · reviewing now' : '29 Aug 2026 · 16:02', st === 'review' ? 'on' : 'done']];
    if (st === 'details') rows.push(['More details requested', '30 Aug 2026 · 10:20 · waiting on you', 'on']);
    rows.push(st === 'approved' ? ['Verified', '30 Aug 2026 · 15:48', 'done']
      : st === 'rejected' ? ['Declined', '30 Aug 2026 · 11:05', 'bad'] : ['Decision', 'Usually within one working day', 'wait']);
    return `<div class="steps">${rows.map(([t, s, c], i) => `<div class="stp ${c}"><span class="stp-n">${c === 'done' ? '✓' : c === 'bad' ? '×' : i + 1}</span><div><b>${t}</b><em>${s}</em></div></div>`).join('')}</div>`;
  }

  function msgs() {
    const base = [{ w: 'Dash onboarding', t: '29 Aug · 16:02', m: 'Thanks, we’ve picked up your request. We’ll come back within one working day.' }];
    if (S.status === 'details') base.push({ w: 'Reem · Dash onboarding', t: '30 Aug · 10:20', m: 'Two documents need replacing: the municipality licence has expired and the bank letter is in the trade name. Details above.' });
    if (S.status === 'rejected') base.push({ w: 'Reem · Dash onboarding', t: '30 Aug · 11:05', m: 'CR 1010 6621 04 is registered to a different legal entity. If you have a second CR for Tamra Trading Est., reapply with that one.' });
    if (S.status === 'approved') base.push({ w: 'Reem · Dash onboarding', t: '30 Aug · 15:48', m: 'All checked. Welcome to Dash.' });
    return base.concat(S.mine).map(x => `<div class="onb-msg ${x.me ? 'me' : ''}"><b>${esc(x.w)}</b><time>${esc(x.t)}</time><p>${esc(x.m)}</p></div>`).join('');
  }

  function stateBlock() {
    const B = U().btn, st = S.status;
    if (st === 'details') {
      const ok = REQS.every(r => S.fixed[r.k]);
      return U().panel('What Dash asked for', REQS.map(r => `<div class="onb-req">
          <div><b style="font-size:12.5px">${r.t}</b><p style="margin:4px 0 0;font-size:12px;color:var(--dim);line-height:1.55">${r.why}</p>
            ${S.fixed[r.k] ? `<span class="fn" style="font:500 10.5px var(--mono);color:#1f8a4c;display:block;margin-top:6px">✓ ${esc(S.fixed[r.k])} · ready to send</span>` : ''}</div>
          ${B(S.fixed[r.k] ? 'Replace' : 'Upload new file', { kind: S.fixed[r.k] ? '' : 'primary', act: 'onbFix', arg: r.k })}</div>`).join('') +
        `<div style="padding:12px 13px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${B('Send back to Dash', { kind: 'primary', act: ok ? 'onbResubmit' : 'onbNeed' })}
          <span class="fld-h" style="margin:0">${ok ? 'Both items ready.' : REQS.filter(r => !S.fixed[r.k]).length + ' of 2 still to upload'}</span></div>`, { pad: false });
    }
    if (st === 'rejected') return U().panel('What you can do', U().defs([
        ['Reason', 'CR number does not match the legal name on record'],
        ['Fix it', 'Correct the CR number or legal name, then reapply. Your documents are kept.'],
        ['Disagree', 'Reply to the onboarding team below or call us. A second reviewer looks at every appeal.'],
        ['Charged', 'Nothing']
      ]) + `<div class="btnrow">${B('Correct details and reapply', { kind: 'primary', act: 'onbGo', arg: '2' })}${B('Call onboarding', { act: 'stub', arg: 'Calling +966 11 555 0142' })}</div>`);
    if (st === 'approved') return U().panel('Next', `<div class="btnrow big" style="margin-top:0">${B('Open dashboard', { kind: 'primary', act: 'onbDash' })}</div>
        <div class="fld-h">In this prototype the dashboard opens on the Kanz Market demo account.</div>`);
    return U().panel('While you wait', U().defs([
        ['Expected by', 'Tomorrow, 30 Aug, before 17:00'],
        ['We’ll tell you', 'By email to ' + esc(S.f.email) + ' and SMS to ' + esc(S.f.phone)],
        ['Need to change something', 'Withdraw the request, edit and resubmit. Your place in the queue resets.']
      ]) + `<div class="btnrow">${B('Withdraw and edit', { act: 'onbGo', arg: '2' })}</div>`);
  }

  function statusView() {
    const s = STATES[S.status], f = S.f, B = U().btn;
    const dstate = k => S.status === 'approved' ? ['Accepted', '#1f8a4c'] : S.status === 'details' && REQS.some(r => r.k === k)
      ? (S.fixed[k] ? ['Replaced · not sent', '#FFEE50'] : ['Needs replacing', '#FCA38B']) : S.status === 'rejected' && k === 'cr' ? ['Rejected', '#FCA38B'] : ['In review', '#C0D2FF'];
    return `<header class="onb-top">${brand()}<span class="who">${esc(f.trade)}<em>Request DV-2026-0418</em></span>
        <span class="onb-sp"></span>${U().tag(s.tag, s.c, { solid: true })}${B(exitLabel(), { act: 'onbSignin' })}</header>
      <div class="onb-body"><div class="onb-wrap">
        <section class="onb-hero" style="--hc:${s.c}">
          <div class="onb-eb">${s.eb}</div><h1 class="onb-t">${s.t}</h1><p>${s.p}</p>
          <div class="onb-meta"><span>Business <b>${esc(f.legal)}</b></span><span>Submitted <b>29 Aug 2026</b></span><span>Reviewer <b>Reem Al Shehri</b></span></div>
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
              ['Email', '<a href="mailto:onboarding@dash.sa" style="color:var(--ink)">onboarding@dash.sa</a>'],
              ['Phone', '+966 11 555 0142 · Sun–Thu 09:00–18:00']
            ]) + `<div class="btnrow">${B('Book a call', { act: 'stub', arg: 'Call booked for tomorrow 10:00' })}${B('Help centre', { act: 'stub', arg: 'Opens the onboarding help articles' })}</div>`)}
            ${U().panel('Your submission', U().defs([
              ['Legal name', esc(f.legal)], ['CR', esc(f.cr)], ['VAT', esc(f.vat)], ['Branches', S.branches.length + ' · ' + S.branches.map(b => esc(b.d)).join(', ')]
            ]) + `<div class="sub-h" style="margin-top:12px;font:500 9px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--faint)">Documents</div>` +
              U().defs(DOCS.map(([k, t]) => { const [l, c] = dstate(k); return [t, U().tag(l, c, { solid: c !== '#1f8a4c' })]; })))}
            ${S.status === 'approved' ? '' : U().panel('Locked until you’re verified', `<ul class="onb-lock">${['Dashboard and control tower', 'Creating orders', 'Plugins and the Dash API', '3PL Marketplace', 'Inviting your team'].map(x => `<li><span>${x}</span><em class="sub">Locked</em></li>`).join('')}</ul>`, { pad: false })}
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
  const exitLabel = () => S.fromApp ? 'Close preview' : 'Sign out';
  const status = st => { S.mode = 'status'; if (st) S.status = st; mount(); };
  const toast = m => U().toast(m);

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.onbk) S.f[t.dataset.onbk] = t.value;
    else if (t.dataset.onbb) { const [i, k] = t.dataset.onbb.split('|'); S.branches[+i][k] = t.value; }
    else if (t.dataset.onbc) S.code = t.value.replace(/\D/g, '');
    else if (t.dataset.onbm) S.draft = t.value;
  });
  document.addEventListener('change', e => { const t = e.target; if (t.dataset.onbk) S.f[t.dataset.onbk] = t.value; });

  window.ACT = Object.assign(window.ACT || {}, {
    onbNext: () => {
      if (S.step === 1 && !/^\d{6}$/.test(S.code)) return toast('Enter the six digit code from the email');
      if (S.step === 3 && !S.branches.some(b => b.n.trim())) return toast('Add at least one branch');
      if (S.step === 4 && DOCS.some(([k]) => !S.docs[k])) return toast('Upload all four documents to continue');
      S.step++; paint(true);
    },
    onbBack: () => { S.step = Math.max(0, S.step - 1); paint(true); },
    onbGo: a => { S.mode = 'flow'; S.step = +a; paint(true); },
    onbResend: () => toast('New code sent to ' + S.f.email),
    onbUp: k => { S.docs[k] = { cr: 'CR_TamraTrading_2026.pdf', vat: 'ZATCA_VAT_certificate.pdf', mun: 'Balady_licence.pdf', bank: 'IBAN_letter_SNB.pdf' }[k]; paint(); },
    onbAddBranch: () => { S.branches.push({ n: '', d: '', h: '08:00 – 23:00' }); paint(); },
    onbDelBranch: i => { S.branches.splice(+i, 1); paint(); },
    onbTerms: () => { S.terms = !S.terms; paint(); },
    onbSubmit: () => {
      if (!S.terms) return toast('Confirm the details and accept the terms first');
      if (DOCS.some(([k]) => !S.docs[k])) return toast('A document is missing — go back to Documents');
      S.mode = 'status'; S.status = 'review'; S.fixed = {}; paint(true);
      toast('Submitted. Dash will review it within one working day');
    },
    onbState: k => { S.status = k; paint(); },
    onbFix: k => { S.fixed[k] = k === 'mun' ? 'Balady_licence_renewed_2026.pdf' : 'IBAN_letter_TamraTradingEst.pdf'; paint(); },
    onbNeed: () => toast('Upload both requested files first'),
    onbResubmit: () => {
      S.status = 'review'; S.mine.push({ w: 'You', t: 'Just now', m: 'Uploaded the renewed licence and a corrected bank letter.', me: true });
      paint(true); toast('Sent back to Dash — the review continues');
    },
    onbMsg: () => {
      if (!S.draft.trim()) return toast('Write a message first');
      S.mine.push({ w: 'You', t: 'Just now', m: S.draft.trim(), me: true }); S.draft = ''; paint(); toast('Message sent to the onboarding team');
    },
    onbSignin: () => { close(); if (S.fromApp) { S.fromApp = false; return; } if (window.AUTH) AUTH.show(); },
    onbDash: () => { close(); if (S.fromApp) { S.fromApp = false; return; } if (window.AUTH) AUTH.enterAs(); UI.toast('Verified — welcome to your dashboard'); },
    onbPreview: a => { S.fromApp = true; a === 'flow' ? open(0) : status('review'); }
  });

  return { open, status, close };
})();
