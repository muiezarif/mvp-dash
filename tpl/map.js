/* Dash 3PL — Leaflet map. Read-only view of Dash orders. */
window.MAP = (function () {
  let map = null, layers = {}, sim = null, markers = {};
  const RIYADH = [24.7300, 46.7000];

  function destroy() {
    if (sim) { clearInterval(sim); sim = null; }
    if (map) { map.remove(); map = null; }
    layers = {}; markers = {};
  }
  function icon(color, label, big) {
    const s = big ? 26 : 18;
    return L.divIcon({ className: 'mk', html:
      `<span style="width:${s}px;height:${s}px;background:${color};border:1.5px solid #000;display:flex;align-items:center;justify-content:center;font:600 ${big ? 9 : 8}px ui-monospace,Menlo,monospace;color:#000;box-shadow:0 1px 4px rgba(0,0,0,.35)">${label || ''}</span>`,
      iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
  }
  const liveOrders = () => TPL.ORDERS.filter(o => ['Received','Accepted','Picked up','In transit'].includes(o.status));

  function build(id, opt = {}) {
    destroy();
    const el = document.getElementById(id);
    if (!el || !window.L) return;
    map = L.map(el, { zoomControl: true, attributionControl: true, preferCanvas: true }).setView(RIYADH, 11);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri, © OpenStreetMap contributors', maxZoom: 16 }).addTo(map);
    layers.orders = L.layerGroup().addTo(map);
    layers.drivers = L.layerGroup().addTo(map);

    const set = opt.only ? TPL.ORDERS.filter(o => o.id === opt.only) : (opt.orders || liveOrders());
    set.forEach(o => {
      const g = L.layerGroup().addTo(layers.orders);
      markers['o_' + o.id] = g;
      const src = { Marketplace: TPL.PAL.vodka, Network: TPL.PAL.lav, Direct: TPL.PAL.peach }[o.source];
      L.marker(o.pickup, { icon: icon(src, 'P') }).addTo(g)
        .bindTooltip(`<b>${o.id}</b> pickup<br>${TPL.merchant(o.merchant).name} · ${o.source}`, { direction: 'top' });
      L.marker(o.drop, { icon: icon(TPL.PAL.vodka, 'D') }).addTo(g)
        .bindTooltip(`<b>${o.id}</b> drop-off<br>${o.addr}<br>ETA ${o.eta}`, { direction: 'top' });
      L.polyline([o.pickup, o.drop], { color: o.status === 'Received' ? TPL.PAL.tang : '#000',
        weight: 1.5, opacity: .55, dashArray: o.status === 'Received' ? '5,5' : '2,6' }).addTo(g);
      if (o.driver) {
        const dr = TPL.driver(o.driver);
        const mid = [(o.pickup[0] + o.drop[0]) / 2, (o.pickup[1] + o.drop[1]) / 2];
        const dm = L.marker(mid, { icon: icon('#FFEE50', dr.name.split(' ').map(w => w[0]).slice(0, 2).join(''), true) })
          .addTo(layers.drivers)
          .bindTooltip(`<b>${dr.name}</b><br>${dr.vehicle}<br>${o.id} · ${o.status}`, { direction: 'top' });
        dm.__home = mid.slice(); dm.__t = Math.random() * 6.28;
        markers['d_' + o.id] = dm;
      }
    });
    setTimeout(() => map && map.invalidateSize(), 60);
    setTimeout(() => map && map.invalidateSize(), 320);
    if (opt.only) setTimeout(() => focusOrder(opt.only), 360);
    if (opt.fit && opt.fit.length) {
      const bb = L.latLngBounds([]); opt.fit.forEach(p => bb.extend(p));
      if (bb.isValid()) map.fitBounds(bb.pad(0.35));
    }
    sim = setInterval(() => {
      Object.keys(markers).forEach(k => {
        if (!k.startsWith('d_')) return;
        const m = markers[k]; m.__t += 0.08;
        m.setLatLng([m.__home[0] + Math.sin(m.__t) * 0.0030, m.__home[1] + Math.cos(m.__t * .9) * 0.0040]);
      });
    }, 1400);
  }
  function toggleLayer(n, on) { const l = layers[n]; if (!l || !map) return; on ? l.addTo(map) : map.removeLayer(l); }
  function focusOrder(id) {
    const o = TPL.order(id); if (!o || !map) return;
    map.fitBounds(L.latLngBounds([o.pickup, o.drop]).pad(0.6));
    const g = markers['o_' + id]; if (g) g.eachLayer(l => l.openTooltip && l.getLatLng && l.openTooltip());
  }
  return { build, destroy, toggleLayer, focusOrder };
})();
