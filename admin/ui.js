/* Dash DMS — dense light UI kit + helpers */
window.UI = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

  const page = (title, sub, actions) => `
    <div class="page-head">
      <div><h1>${esc(title)}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ''}</div>
      ${actions ? `<div class="page-act">${actions}</div>` : ''}
    </div>`;

  const btn = (label, opt = {}) =>
    `<button class="btn ${opt.kind || ''}" ${opt.act ? `data-act="${opt.act}"` : ''} ${opt.arg ? `data-arg="${esc(opt.arg)}"` : ''} type="button">${label}</button>`;

  const tag = (label, color, opt = {}) =>
    `<span class="tag" style="${color ? `--tc:${color};` : ''}${opt.solid ? 'background:var(--tc);color:#000;border-color:transparent;' : ''}">${esc(label)}</span>`;

  const statusTag = s => {
    const m = ADM.STATUS[s] || { c: '#9a9a9a' };
    return `<span class="tag" style="--tc:${m.c};background:${m.c};color:${s === 'Delivered' ? '#fff' : '#000'};border-color:transparent">${esc(s)}</span>`;
  };

  /* intervention scope — the organising idea of Dash Admin */
  const mode = (kind, why) =>
    `<div class="modebar ${kind}"><span class="mb-t">${kind === 'ro' ? 'Read only' : kind === 'owner' ? 'The owner intervenes' : 'Dash controls this'}</span><span class="mb-w">${why}</span></div>`;

  const scope = s => s === 'dash'
    ? `<span class="scope dash">Dash controls</span>`
    : `<span class="scope owner">Owner intervenes</span>`;

  const kpi = (label, value, foot, accent) => `
    <div class="kpi" ${accent ? `style="--ka:${accent}"` : ''}>
      <div class="kpi-l">${esc(label)}</div>
      <div class="kpi-v">${value}</div>
      ${foot ? `<div class="kpi-f">${foot}</div>` : ''}
    </div>`;

  const panel = (title, body, opt = {}) => `
    <section class="panel ${opt.flush ? 'flush' : ''}">
      ${title ? `<header class="panel-h"><span>${esc(title)}</span>${opt.right || ''}</header>` : ''}
      <div class="panel-b ${opt.pad === false ? 'nopad' : ''}">${body}</div>
    </section>`;

  const table = (cols, rows, opt = {}) => `
    <div class="tw"><table class="tbl ${opt.hover === false ? '' : 'hov'}">
      <thead><tr>${cols.map(c => `<th ${c.w ? `style="width:${c.w}"` : ''} ${c.num ? 'class="num"' : ''}>${esc(c.t)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr ${r.act ? `data-act="${r.act}" data-arg="${esc(r.arg)}" class="clk"` : ''}>${r.cells.map((c, i) => `<td ${cols[i] && cols[i].num ? 'class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>${rows.length ? '' : '<div class="empty">Nothing here yet.</div>'}</div>`;

  const bar = (pct, color) =>
    `<span class="bar"><i style="width:${Math.max(0, Math.min(100, pct))}%;background:${color || '#000'}"></i></span>`;

  const toggle = (on, act, arg, label) => `
    <label class="tg ${on ? 'on' : ''}" data-act="${act}" ${arg ? `data-arg="${esc(arg)}"` : ''}>
      <span class="tg-s"><i></i></span>${label ? `<span class="tg-l">${esc(label)}</span>` : ''}
    </label>`;

  const field = (label, control, hint) => `
    <label class="fld"><span class="fld-l">${esc(label)}</span>${control}${hint ? `<span class="fld-h">${hint}</span>` : ''}</label>`;

  const input = (val, ph, opt = {}) =>
    `<input class="in" type="${opt.type || 'text'}" value="${esc(val || '')}" placeholder="${esc(ph || '')}" ${opt.act ? `data-act="${opt.act}"` : ''} ${opt.arg ? `data-arg="${esc(opt.arg)}"` : ''}>`;

  const select = (options, val, opt = {}) =>
    `<select class="in" ${opt.act ? `data-act="${opt.act}"` : ''} ${opt.arg ? `data-arg="${esc(opt.arg)}"` : ''}>${options.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;

  const radio = (options, val, act, arg) => `
    <div class="seg">${options.map(o => `<button type="button" class="seg-b ${o === val ? 'on' : ''}" data-act="${act}" data-arg="${esc((arg ? arg + '|' : '') + o)}">${esc(o)}</button>`).join('')}</div>`;

  const tabs = (items, active, act) => `
    <div class="tabs">${items.map(i => `<button type="button" class="tab ${i === active ? 'on' : ''}" data-act="${act}" data-arg="${esc(i)}">${esc(i)}</button>`).join('')}</div>`;

  const defs = rows => `
    <dl class="defs">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

  const note = (title, body, color) =>
    `<div class="note" style="--nc:${color || ADM.PAL.lemon}"><b>${esc(title)}</b> ${body}</div>`;

  const spark = (vals, color, h) => {
    const max = Math.max(...vals);
    return `<span class="spark" style="height:${h || 34}px">${vals.map(v => `<i style="height:${Math.round(v / max * 100)}%;background:${color || '#000'}"></i>`).join('')}</span>`;
  };

  const avatar = name => {
    const i = name.split(' ').map(w => w[0]).slice(0, 2).join('');
    return `<span class="av">${esc(i)}</span>`;
  };

  const dot = color => `<span class="dot" style="background:${color}"></span>`;

  const money = n => 'SAR ' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filters = list => `<div class="filters">${list.join('')}</div>`;

  const toast = msg => {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  };

  const drawer = (title, body, opt = {}) => {
    let d = document.getElementById('drawer');
    if (!d) {
      d = document.createElement('div'); d.id = 'drawer';
      d.innerHTML = '<div class="dw-scrim" data-act="closeDrawer"></div><aside class="dw"><header class="dw-h"><span id="dw-t"></span><button class="btn" data-act="closeDrawer" type="button">Close</button></header><div class="dw-b" id="dw-b"></div><footer class="dw-f" id="dw-f"></footer></aside>';
      document.body.appendChild(d);
    }
    d.querySelector('#dw-t').innerHTML = title;
    d.querySelector('#dw-b').innerHTML = body;
    d.querySelector('#dw-f').innerHTML = opt.footer || '';
    d.querySelector('#dw-f').style.display = opt.footer ? 'flex' : 'none';
    requestAnimationFrame(() => d.classList.add('open'));
  };
  const closeDrawer = () => { const d = document.getElementById('drawer'); if (d) d.classList.remove('open'); };

  return { esc, page, btn, tag, statusTag, mode, scope, kpi, panel, table, bar, toggle, field, input, select, radio, tabs,
           defs, note, spark, avatar, dot, money, filters, toast, drawer, closeDrawer };
})();
