/* Dash Merchant — Leaflet map. Real Riyadh, branches + live orders + driver positions. */
window.MAP = (function () {
  let map = null, layers = {}, sim = null, markers = {};
  const RIYADH = [24.7700, 46.6600];

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

  const liveOrders = () => MER.ORDERS.filter(o => !['Delivered','Cancelled','Returned'].includes(o.status));

  function build(id, opt = {}) {
    destroy();
    const el = document.getElementById(id);
    if (!el || !window.L) return;
    map = L.map(el, { zoomControl: true, attributionControl: true, preferCanvas: true }).setView(RIYADH, 11);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri, © OpenStreetMap contributors', maxZoom: 16 }).addTo(map);

    layers.branches = L.layerGroup().addTo(map);
    layers.orders = L.layerGroup().addTo(map);
    layers.drivers = L.layerGroup().addTo(map);

    (opt.branches || MER.BRANCHES).forEach(b => {
      const m = L.marker(b.pos, { icon: icon(MER.PAL.peach, b.code) }).addTo(layers.branches)
        .bindTooltip(`<b>${b.name}</b><br>${b.hours} · ${b.orders} live<br>on time ${b.onTime}% · avg ${b.avgMin} min`, { direction: 'top' });
      L.circle(b.pos, { radius: 1400, color: '#000', weight: 1, opacity: .3, fillColor: MER.PAL.peach, fillOpacity: .07 }).addTo(layers.branches);
      markers['b_' + b.id] = m;
    });

    (opt.orders || liveOrders()).forEach(o => {
      const g = L.layerGroup().addTo(layers.orders);
      markers['o_' + o.id] = g;
      L.marker(o.drop, { icon: icon(MER.PAL.vodka, 'D') }).addTo(g)
        .bindTooltip(`<b>${o.id}</b> drop-off<br>${MER.customer(o.customer).name}<br>ETA ${o.eta}`, { direction: 'top' });
      if (opt.routes !== false) L.polyline([o.pickup, o.drop], {
        color: o.status === 'Awaiting provider' ? MER.PAL.tang : '#000',
        weight: 1.4, opacity: .55, dashArray: o.status === 'Awaiting provider' ? '5,5' : '2,6' }).addTo(g);
      if (o.driver) {
        const mid = [(o.pickup[0] + o.drop[0]) / 2, (o.pickup[1] + o.drop[1]) / 2];
        const initials = o.driver.replace(/\(.*\)/, '').trim().split(' ').map(w => w[0]).slice(0, 2).join('');
        const dm = L.marker(mid, { icon: icon('#FFEE50', initials, true) }).addTo(layers.drivers)
          .bindTooltip(`<b>${o.driver}</b><br>${MER.prov(o.provider).name} · ${o.vehicle}<br>${o.id} · ${o.status}`, { direction: 'top' });
        dm.__home = mid.slice(); dm.__t = Math.random() * 6.28;
        markers['d_' + o.id] = dm;
      }
    });

    setTimeout(() => map && map.invalidateSize(), 60);
    setTimeout(() => map && map.invalidateSize(), 320);
    if (opt.fit && opt.fit.length) {
      const b2 = L.latLngBounds([]); opt.fit.forEach(p => b2.extend(p));
      if (b2.isValid()) map.fitBounds(b2.pad(0.35));
    }
    sim = setInterval(() => {
      Object.keys(markers).forEach(k => {
        if (!k.startsWith('d_')) return;
        const m = markers[k]; m.__t += 0.08;
        m.setLatLng([m.__home[0] + Math.sin(m.__t) * 0.0032, m.__home[1] + Math.cos(m.__t * .9) * 0.0042]);
      });
    }, 1400);
  }

  function toggleLayer(name, on) { const l = layers[name]; if (!l || !map) return; on ? l.addTo(map) : map.removeLayer(l); }
  function focusOrder(id) {
    const o = MER.order(id); if (!o || !map) return;
    map.fitBounds(L.latLngBounds([o.pickup, o.drop]).pad(0.6));
    const g = markers['o_' + id]; if (g) g.eachLayer(l => l.openTooltip && l.getLatLng && l.openTooltip());
  }
  function focusBranch(id) {
    const b = MER.branch(id); if (!b || !map) return;
    map.setView(b.pos, 14, { animate: true });
    const m = markers['b_' + id]; if (m) m.openTooltip();
  }
  function filterBranch(code) {
    if (code === 'All branches') { map.setView(RIYADH, 11); return; }
    const b = MER.BRANCHES.find(x => code.startsWith(x.code) || code === x.name);
    if (b) focusBranch(b.id);
  }

  return { build, destroy, toggleLayer, focusOrder, focusBranch, filterBranch, focusDriver: focusOrder, filterZone: filterBranch };
})();
