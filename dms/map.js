/* Dash DMS — Leaflet map layer. Real Riyadh geography, OpenStreetMap tiles. */
window.MAP = (function () {
  let map = null, layers = {}, sim = null, markers = {}, opts = {};
  const RIYADH = [24.7550, 46.6700];

  function destroy() {
    if (sim) { clearInterval(sim); sim = null; }
    if (map) { map.remove(); map = null; }
    layers = {}; markers = {};
  }

  function icon(color, label, big) {
    const s = big ? 26 : 18;
    return L.divIcon({
      className: 'mk',
      html: `<span style="width:${s}px;height:${s}px;background:${color};border:1.5px solid #000;display:flex;align-items:center;justify-content:center;font:600 ${big ? 10 : 8}px ui-monospace,Menlo,monospace;color:#000;box-shadow:0 1px 4px rgba(0,0,0,.35)">${label || ''}</span>`,
      iconSize: [s, s], iconAnchor: [s / 2, s / 2]
    });
  }

  function build(id, o) {
    destroy();
    opts = o || {};
    const el = document.getElementById(id);
    if (!el || !window.L) return;
    map = L.map(el, { zoomControl: true, attributionControl: true, preferCanvas: true }).setView(RIYADH, 11);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, © OpenStreetMap contributors', maxZoom: 16
    }).addTo(map);

    layers.zones = L.layerGroup().addTo(map);
    layers.orders = L.layerGroup().addTo(map);
    layers.drivers = L.layerGroup().addTo(map);

    (opts.zones || DMS.ZONES).forEach(z => {
      L.polygon(z.poly, {
        color: '#000', weight: 1, opacity: .55, fillColor: z.color,
        fillOpacity: z.status === 'Paused' ? .1 : .28, dashArray: z.status === 'Paused' ? '4,4' : null
      }).addTo(layers.zones).bindTooltip(
        `<b>${z.name}</b><br>${z.code} · ${z.orders} live · on time ${z.onTime}%${z.status === 'Paused' ? '<br><b>Paused</b>' : ''}`,
        { direction: 'top' });
    });

    const live = opts.orders || DMS.ORDERS.filter(x => !['Delivered', 'Cancelled', 'Returned'].includes(x.status));
    live.forEach(o => {
      const g = L.layerGroup().addTo(layers.orders);
      markers['o_' + o.id] = g;
      L.marker(o.pickup, { icon: icon(DMS.PAL.peach, 'P') }).addTo(g)
        .bindTooltip(`<b>${o.id}</b> pickup<br>${DMS.esc ? '' : ''}${o.branch}`, { direction: 'top' });
      L.marker(o.drop, { icon: icon(DMS.PAL.vodka, 'D') }).addTo(g)
        .bindTooltip(`<b>${o.id}</b> drop-off<br>${DMS.customer(o.customer).addr}`, { direction: 'top' });
      if (opts.routes) L.polyline([o.pickup, o.drop], {
        color: o.status === 'Assigning' ? DMS.PAL.tang : '#000',
        weight: 1.4, opacity: .55, dashArray: o.status === 'Assigning' ? '5,5' : '2,6'
      }).addTo(g);
    });

    (opts.drivers || DMS.DRIVERS.filter(d => d.online)).forEach(d => {
      const m = L.marker(d.pos, { icon: icon('#FFEE50', d.name.split(' ')[0][0] + d.name.split(' ')[1][0], true) })
        .addTo(layers.drivers)
        .bindTooltip(`<b>${d.name}</b><br>${d.status} · ${DMS.vehicle(d.vehicle).type}<br>${DMS.zone(d.zone).code} · online since ${d.since}`, { direction: 'top' });
      m.__home = d.pos.slice(); m.__t = Math.random() * 6.28;
      markers['d_' + d.id] = m;
    });

    setTimeout(() => map && map.invalidateSize(), 60);
    setTimeout(() => map && map.invalidateSize(), 320);
    if (opts.fit && opts.fit.length) {
      const b = L.latLngBounds([]); opts.fit.forEach(p => b.extend(p));
      if (b.isValid()) map.fitBounds(b.pad(0.35));
    }

    sim = setInterval(() => {
      Object.keys(markers).forEach(k => {
        if (!k.startsWith('d_')) return;
        const m = markers[k];
        m.__t += 0.08 + Math.random() * 0.03;
        const lat = m.__home[0] + Math.sin(m.__t) * 0.0045 + Math.cos(m.__t * .7) * 0.0022;
        const lng = m.__home[1] + Math.cos(m.__t * .9) * 0.0058 + Math.sin(m.__t * .5) * 0.0026;
        m.setLatLng([lat, lng]);
      });
    }, 1400);
  }

  function toggleLayer(name, on) {
    const l = layers[name]; if (!l || !map) return;
    on ? l.addTo(map) : map.removeLayer(l);
  }

  function focusOrder(id) {
    const o = DMS.order(id); if (!o || !map) return;
    map.fitBounds(L.latLngBounds([o.pickup, o.drop]).pad(0.55));
    const g = markers['o_' + id];
    if (g) g.eachLayer(l => l.openTooltip && l.getLatLng && l.openTooltip());
  }
  function focusDriver(id) {
    const m = markers['d_' + id]; if (!m || !map) return;
    map.setView(m.getLatLng(), 14, { animate: true }); m.openTooltip();
  }
  function filterZone(code) {
    if (!map) return;
    layers.zones.clearLayers();
    DMS.ZONES.filter(z => code === 'All zones' || code.startsWith(z.code)).forEach(z => {
      L.polygon(z.poly, { color: '#000', weight: 1, opacity: .55, fillColor: z.color, fillOpacity: .28 })
        .addTo(layers.zones).bindTooltip(`<b>${z.name}</b>`, { direction: 'top' });
    });
    const z = DMS.ZONES.find(x => code.startsWith(x.code));
    if (z) map.setView(z.centre, 13); else map.setView(RIYADH, 11);
  }

  return { build, destroy, toggleLayer, focusOrder, focusDriver, filterZone };
})();
