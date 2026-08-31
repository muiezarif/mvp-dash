/* Dash — shared sign-in gate. Each product sets window.AUTH_CFG before loading this.
   Permission decides scope: the email resolves the account, the org and the branches.
   There is no workspace picker anywhere — if a person can see two branches, they see both. */
(function () {
  const C = window.AUTH_CFG;
  if (!C) return;
  const KEY = 'dash-auth-' + C.key;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let step = 'signin', email = C.accounts[0].email, err = '', host = null;

  const find = v => C.accounts.find(a => a.email.toLowerCase() === String(v).trim().toLowerCase());

  function left() {
    return '<div class="auth-l">' +
      '<div class="auth-brand">DASH<i></i><em>' + C.product + '</em></div>' +
      '<h1 class="auth-h">' + C.head + '</h1>' +
      '<p class="auth-sub">' + C.sub + '</p>' +
      '<div class="auth-facts">' + C.facts.map(f =>
        '<div class="auth-fact"><b>' + f[0] + '</b><span>' + f[1] + '</span></div>').join('') + '</div>' +
      '<div class="auth-foot">' + C.foot + '</div>' +
    '</div>';
  }

  function who(a) {
    if (!a) return '';
    return '<div class="auth-who"><span class="rs">Resolved from your email</span>' +
      '<b>' + esc(a.name) + '</b>' +
      '<dl>' + a.scope.map(s => '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>').join('') + '</dl></div>';
  }

  function form() {
    const a = find(email);
    const blocked = a && a.state !== 'ok';
    return '<div class="auth-card">' +
      '<div class="auth-eyebrow">' + C.eyebrow + '</div>' +
      '<h2 class="auth-t">' + C.title + '</h2>' +
      '<p class="auth-d">' + C.desc + '</p>' +
      (err ? '<div class="auth-err">' + err + '</div>' : '') +
      '<div class="auth-f"><label for="au-e">Work email</label>' +
        '<input class="auth-in' + (err && !a ? ' bad' : '') + '" id="au-e" type="email" value="' + esc(email) + '" autocomplete="username" spellcheck="false">' +
        '<div class="auth-hint">' + C.emailHint + '</div></div>' +
      who(a) +
      '<div class="auth-f"><label for="au-p">Password</label>' +
        '<input class="auth-in" id="au-p" type="password" value="············" autocomplete="current-password"></div>' +
      '<div class="auth-row"><label class="auth-chk"><input type="checkbox" checked> Keep me signed in</label>' +
        '<a class="auth-link" href="#" id="au-forgot">Forgot password</a></div>' +
      '<button class="auth-btn" id="au-go">' + (blocked ? 'Continue' : C.cta) + '</button>' +
      (C.sso ? '<div class="auth-or">or</div><button class="auth-btn ghost" id="au-sso">' + C.sso + '</button>' : '') +
      demo() + '</div>';
  }

  function twofa() {
    const a = find(email);
    return '<div class="auth-card">' +
      '<div class="auth-eyebrow">Step 2 of 2</div>' +
      '<h2 class="auth-t">Two factor</h2>' +
      '<p class="auth-d">Six digit code from your authenticator app. Mandatory for every Dash staff account — ' +
        'anyone who can read customer data across all clients has to carry it.</p>' +
      (err ? '<div class="auth-err">' + err + '</div>' : '') +
      '<div class="auth-f"><label for="au-c">Authentication code</label>' +
        '<div class="auth-code"><input class="auth-in' + (err ? ' bad' : '') + '" id="au-c" inputmode="numeric" maxlength="6" placeholder="000000"></div>' +
        '<div class="auth-hint">Signing in as ' + esc(a ? a.name : email) + ' · ' + esc(a ? a.role : '') + '. Any six digits work in this prototype.</div></div>' +
      '<button class="auth-btn" id="au-verify">Verify and enter</button>' +
      '<button class="auth-back" id="au-back">← Back to sign in</button></div>';
  }

  function blockedCard() {
    const a = find(email), s = C.states[a.state];
    return '<div class="auth-card">' +
      '<div class="auth-eyebrow">' + s.eyebrow + '</div>' +
      '<h2 class="auth-t">' + s.title + '</h2>' +
      '<div class="auth-state ' + s.tone + '"><b>' + esc(a.name) + '</b><p>' + s.body + '</p>' +
        (s.list ? '<ul>' + s.list.map(x => '<li>' + x + '</li>').join('') + '</ul>' : '') + '</div>' +
      (s.enter ? '<button class="auth-btn" id="au-enter">' + s.enter + '</button>' : '') +
      '<button class="auth-btn ghost" id="au-back2">Use a different account</button>' +
      '<div class="auth-note">' + s.note + '</div></div>';
  }

  function demo() {
    return '<div class="auth-demo"><span>Prototype — pick an account state</span>' +
      '<div class="auth-demo-b">' + C.accounts.map(a =>
        '<button type="button" data-em="' + esc(a.email) + '"' +
          (a.email.toLowerCase() === email.toLowerCase() ? ' class="on"' : '') + '>' + esc(a.label) + '</button>').join('') +
      '</div><div class="auth-note">Passwords are not checked here. Every account resolves its own organisation, ' +
      'role and scope from the email — the same way permission works in the real product.</div></div>';
  }

  function paint() {
    host.innerHTML = left() + '<div class="auth-r">' +
      (step === '2fa' ? twofa() : step === 'blocked' ? blockedCard() : form()) + '</div>';
    const q = id => host.querySelector('#' + id);
    const e = q('au-e');
    if (e) {
      e.addEventListener('input', () => { email = e.value; err = ''; repaintKeepFocus(); });
      e.addEventListener('keydown', ev => { if (ev.key === 'Enter') submit(); });
    }
    const p = q('au-p');
    if (p) p.addEventListener('keydown', ev => { if (ev.key === 'Enter') submit(); });
    if (q('au-go')) q('au-go').addEventListener('click', submit);
    if (q('au-sso')) q('au-sso').addEventListener('click', () => { err = ''; submit(); });
    if (q('au-forgot')) q('au-forgot').addEventListener('click', ev => {
      ev.preventDefault(); err = 'A reset link is on its way to ' + esc(email) + '. It expires in 30 minutes.'; paint();
    });
    const c = q('au-c');
    if (c) { c.focus(); c.addEventListener('keydown', ev => { if (ev.key === 'Enter') verify(); }); }
    if (q('au-verify')) q('au-verify').addEventListener('click', verify);
    if (q('au-back')) q('au-back').addEventListener('click', () => { step = 'signin'; err = ''; paint(); });
    if (q('au-back2')) q('au-back2').addEventListener('click', () => { step = 'signin'; err = ''; paint(); });
    if (q('au-enter')) q('au-enter').addEventListener('click', enter);
    host.querySelectorAll('.auth-demo-b button').forEach(b =>
      b.addEventListener('click', () => { email = b.getAttribute('data-em'); err = ''; step = 'signin'; paint(); }));
  }

  /* keep the caret while the resolved-identity panel appears and disappears */
  function repaintKeepFocus() {
    const el = host.querySelector('#au-e'), pos = el ? el.selectionStart : null;
    paint();
    const el2 = host.querySelector('#au-e');
    if (el2 && pos !== null) { el2.focus(); el2.setSelectionRange(pos, pos); }
  }

  function submit() {
    const a = find(email);
    if (!a) { err = 'We do not recognise that email. Access is granted by your organisation, not by signing up here.'; paint(); return; }
    if (a.state !== 'ok') { step = 'blocked'; err = ''; paint(); return; }
    if (C.twofa) { step = '2fa'; err = ''; paint(); return; }
    enter();
  }
  function verify() {
    const v = (host.querySelector('#au-c') || {}).value || '';
    if (!/^\d{6}$/.test(v.trim())) { err = 'Six digits, from the app on your phone.'; paint(); return; }
    enter();
  }

  function enter() {
    const a = find(email) || C.accounts[0];
    try { sessionStorage.setItem(KEY, a.email); } catch (x) {}
    host.remove(); host = null;
    document.body.classList.remove('authing');
    stamp(a);
    if (window.RENDER) window.RENDER();
  }

  /* signed-in identity in the top bar, with the way back out */
  function stamp(a) {
    const top = document.querySelector('.top');
    if (!top || top.querySelector('.au-out')) return;
    const w = document.createElement('button');
    w.type = 'button'; w.className = 'au-out';
    w.innerHTML = '<em>' + esc(a.name.split(' · ')[0]) + '</em> Sign out';
    w.style.cssText = 'margin-left:12px;border:1px solid var(--line,#E4E2DD);background:#fff;padding:4px 9px;' +
      'font:600 9px ui-monospace,Menlo,monospace;letter-spacing:.11em;text-transform:uppercase;color:#6E6E6E;cursor:pointer';
    w.querySelector('em').style.cssText = 'font-style:normal;color:#0B0B0B;margin-right:7px;text-transform:none;letter-spacing:0;font:500 11px Archivo,system-ui,sans-serif';
    w.addEventListener('click', () => {
      try { sessionStorage.removeItem(KEY); } catch (x) {}
      w.remove(); step = 'signin'; err = ''; mount();
    });
    const live = top.querySelector('.top-live');
    live ? top.insertBefore(w, live) : top.appendChild(w);
  }

  function mount() {
    document.body.classList.add('authing');
    host = document.createElement('div');
    host.className = 'auth';
    document.body.appendChild(host);
    paint();
  }

  function boot() {
    let saved = null;
    try { saved = sessionStorage.getItem(KEY); } catch (x) {}
    const a = saved && find(saved);
    if (a && a.state === 'ok') { stamp(a); return; }
    mount();
  }
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
