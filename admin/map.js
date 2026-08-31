/* Dash Admin — platform live map. Every active order, coloured by source,
   shaped by intervention scope, clustered by zone until you zoom in. */
window.MAP = (function () {
  let map = null, layers = {}, sim = null, markers = {}, set = [], zoomFn = null;
  const RIYADH = [24.7550, 46.6700];
  const POS = {
    'Zone North': [[24.8232,46.6089],[24.8471,46.6338]],
    'Zone East':  [[24.6749,46.7362],[24.6612,46.7488]],
    'Zone Central':[[24.6944,46.6853],[24.7062,46.6741]],
    'Zone South': [[24.8480,46.6390],[24.8601,46.6222]],
    'Zone West':  [[24.8103,46.6420],[24.8256,46.6688]]
  };
  const CLUSTER_ZOOM = 12;

  function destroy() {
    if (sim) { clearInterval(sim); sim = null; }
    if (map) { if (zoomFn) map.off('zoomend', zoomFn); map.remove(); map = null; }
    layers = {}; markers = {}; set = []; zoomFn = null;
  }

  /* Dash Network orders are square — Dash can act on them. Direct and Marketplace
     are round: observation only. The shape says it before the click does. */
  function icon(color, label, big, dash) {
    const s = big ? 26 : 18;
    return L.divIcon({ className: 'mk', html:
      `<span style="width:${s}px;height:${s}px;background:${color};border:1.5px solid #000;${dash ? '' : 'border-radius:50%;'}display:flex;align-items:center;justify-content:center;font:600 ${big ? 9 : 8}px ui-monospace,Menlo,monospace;color:#000;box-shadow:0 1px 4px rgba(0,0,0,.35)">${label || ''}</span>`,
      iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
  }
  function clusterIcon(n, dashN) {
    const s = n > 6 ? 40 : 34;
    return L.divIcon({ className: 'mk', html:
      `<span style="width:${s}px;height:${s}px;background:#0B0B0B;color:#fff;border:1.5px solid #000;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,.4)">
         <b style="font:400 ${n > 6 ? 17 : 15}px 'Bebas Neue',Impact,sans-serif;letter-spacing:.04em">${n}</b>
         ${dashN ? `<em style="font-style:normal;font:600 7px ui-monospace,Menlo,monospace;color:${ADM.PAL.vodka}">${dashN} DASH</em>` : ''}
       </span>`,
      iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
  }
  const live = () => ADM.ORDERS.filter(o => !['Delivered','Cancelled','Returned'].includes(o.status));
  const posFor = (o, k) => {
    const p = POS[o.zone] || POS['Zone Central'], j = (k % 5) * 0.0021;
    return [[p[0][0] + j, p[0][1] - j], [p[1][0] + j, p[1][1] - j]];
  };

  function drawPins() {
    layers.orders.clearLayers(); layers.stuck.clearLayers(); markers = {};
    set.forEach((o, k) => {
      const [pick, drop] = posFor(o, k);
      const dash = o.scope === 'dash';
      const col = o.stuck ? ADM.PAL.tang
        : o.source === 'Network' ? ADM.PAL.vodka : o.source === 'Marketplace' ? ADM.PAL.lav : ADM.PAL.peach;
      const g = L.layerGroup().addTo(o.stuck ? layers.stuck : layers.orders);
      markers['o_' + o.id] = g;
      L.marker(drop, { icon: icon(col, o.stuck ? '!' : dash ? 'N' : 'D', !!o.stuck, dash) }).addTo(g)
        .bindTooltip(`<b>${o.id}</b> · ${o.status}<br>${o.merchant} → ${o.customer}<br>${o.source === 'Network' ? 'Dash Network' : o.source} · ${o.provider}<br><b>${dash ? 'Dash can act' : 'Owner intervenes'}</b>${o.stuck ? '<br><b>Stuck ' + o.stuck + ' min</b>' : ''}`, { direction: 'top' });
      L.marker(pick, { icon: icon('#fff', 'P') }).addTo(g)
        .bindTooltip(`<b>${o.id}</b> pickup · ${o.merchant}`, { direction: 'top' });
      L.polyline([pick, drop], { color: o.stuck ? ADM.PAL.tang : '#000', weight: 1.4, opacity: .5,
        dashArray: o.provider === '—' ? '5,5' : '2,6' }).addTo(g);
    });
  }

  /* At platform scale thousands of pins are unusable. Below CLUSTER_ZOOM we
     collapse to one marker per zone; zooming in resolves them. */
  function drawClusters() {
    layers.orders.clearLayers(); layers.stuck.clearLayers(); markers = {};
    const byZone = {};
    set.forEach(o => { (byZone[o.zone] = byZone[o.zone] || []).push(o); });
    Object.keys(byZone).forEach(z => {
      const list = byZone[z], p = (POS[z] || POS['Zone Central'])[1];
      const dashN = list.filter(o => o.scope === 'dash').length;
      const stuckN = list.filter(o => o.stuck).length;
      L.marker(p, { icon: clusterIcon(list.length, dashN) }).addTo(layers.orders)
        .bindTooltip(`<b>${z}</b><br>${list.length} active · ${dashN} Dash can act${stuckN ? '<br><b>' + stuckN + ' stuck</b>' : ''}<br><em>Zoom in to resolve</em>`, { direction: 'top' })
        .on('click', () => map.setView(p, CLUSTER_ZOOM + 1));
    });
  }
  const redraw = () => { if (!map) return; map.getZoom() >= CLUSTER_ZOOM ? drawPins() : drawClusters(); };

  function build(id, opt = {}) {
    destroy();
    const el = document.getElementById(id);
    if (!el || !window.L) return;
    map = L.map(el, { zoomControl: true, attributionControl: true, preferCanvas: true }).setView(RIYADH, 11);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, © OpenStreetMap contributors', maxZoom: 16 }).addTo(map);
    layers.orders = L.layerGroup().addTo(map);
    layers.stuck = L.layerGroup().addTo(map);

    set = opt.orders || live();
    redraw();
    zoomFn = redraw;
    map.on('zoomend', zoomFn);

    setTimeout(() => map && map.invalidateSize(), 60);
    setTimeout(() => map && map.invalidateSize(), 320);
    if (opt.fitZones && opt.fitZones.length) {
      const b = L.latLngBounds([]);
      opt.fitZones.forEach(z => (POS[z] || []).forEach(p => b.extend(p)));
      if (b.isValid()) setTimeout(() => map && map.fitBounds(b.pad(0.5)), 340);
    }
  }
  function toggleLayer(n, on) { const l = layers[n]; if (!l || !map) return; on ? l.addTo(map) : map.removeLayer(l); }
  function focusOrder(id) {
    const o = ADM.order(id); if (!o || !map) return;
    const pos = POS[o.zone] || POS['Zone Central'];
    map.setView(pos[1], Math.max(map.getZoom(), CLUSTER_ZOOM + 1));
    setTimeout(() => {
      map.fitBounds(L.latLngBounds(pos).pad(0.7));
      const g = markers['o_' + id]; if (g) g.eachLayer(l => l.openTooltip && l.getLatLng && l.openTooltip());
    }, 240);
  }
  return { build, destroy, toggleLayer, focusOrder };
})();
