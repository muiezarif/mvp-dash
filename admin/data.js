/* Dash Admin — internal control plane. Every entity here is the same entity
   that appears in Dash Merchant, Dash DMS, Dash 3PL, the Driver App and the Freelancer App. */
window.ADM = (function () {
  const PAL = { peach:'#FFCC99', tang:'#FCA38B', lemon:'#FFEE50', lav:'#C0D2FF', flax:'#E5E57C', vodka:'#BDB9EF' };

  const ME = { name:'Dana Al Rasheed', role:'Super Admin', email:'dana@dash.sa', since:'2 Jan 2024' };

  const TEAM = [
    { id:'t1', name:'Dana Al Rasheed', email:'dana@dash.sa', role:'Super Admin', tfa:true, last:'Now', joined:'2 Jan 2024' },
    { id:'t2', name:'Khalid Al Subaie', email:'khalid@dash.sa', role:'Operations', tfa:true, last:'4 min ago', joined:'14 Mar 2024' },
    { id:'t3', name:'Mona Al Harbi', email:'mona@dash.sa', role:'Operations', tfa:true, last:'22 min ago', joined:'1 Sep 2024' },
    { id:'t4', name:'Ziyad Al Amoudi', email:'ziyad@dash.sa', role:'Finance', tfa:true, last:'2 h ago', joined:'6 Jun 2024' },
    { id:'t5', name:'Hessa Al Otaibi', email:'hessa@dash.sa', role:'Support', tfa:false, last:'12 min ago', joined:'19 Feb 2026' },
    { id:'t6', name:'Rayan Al Faisal', email:'rayan@dash.sa', role:'Support', tfa:true, last:'Yesterday', joined:'3 Aug 2026' }
  ];

  const ROLE_MATRIX = {
    areas: ['Platform dashboard','Clients','Verification','Freelancers','Global control tower','Dash Network','Marketplace','Billing and revenue','Payouts','Support','Customer directory','Announcements','Reports','System settings','Team management','Audit log'],
    roles: {
      'Super Admin':  ['Full','Full','Full','Full','Full','Full','Full','Full','Full','Full','Full','Full','Full','Full','Full','Full'],
      'Operations':   ['View','View','Full','Full','Full','Full','Full','None','None','View','View','None','View','None','None','None'],
      'Finance':      ['View','View','None','None','View','View','None','Full','Full','View','None','None','Full','None','None','View'],
      'Support':      ['View','View','None','View','View','None','None','None','None','Full','Full','View','None','None','None','None']
    }
  };

  /* ---------- CLIENTS: the same accounts that exist in the other products ---------- */
  const CLIENTS = [
    { id:'cl1', name:'Kanz Market', type:'Merchant', product:'Dash Merchant', logo:'KM',
      legal:'Kanz Trading Company', cr:'1010xxxx78', vat:'3004xxxxxx0003', city:'Riyadh', contact:'ops@kanzmarket.sa',
      verified:'12 Aug 2024', state:'Active', plan:'Retail Growth', fee:1400,
      integration:'Connector', integrations:['Salla','Shopify','API','Manual'], health:'Degraded',
      branches:4, volume:90, orders:1396, onTime:94, spend:21860, wallet:3420,
      net:{ supply:'n/a', demand:'Active — automatic' }, market:{ role:'Buyer', connected:3, requests:1 },
      note:'Their ERP webhook is failing — 3 retries in the last hour.' },
    { id:'cl2', name:'Rehla Fleet', type:'DMS client', product:'Dash DMS', logo:'RF',
      legal:'Rehla Logistics Company', cr:'1010xxxx41', vat:'3005xxxxxx0003', city:'Riyadh', contact:'ops@rehla.sa',
      verified:'6 Aug 2026', state:'Active', plan:'Fleet Pro', fee:2400,
      integration:'API', integrations:['API','Manual'], health:'Healthy',
      branches:5, volume:186, orders:1396, onTime:96, spend:3126, wallet:1840,
      net:{ supply:'Active', demand:'Active' }, market:{ role:'Provider', connected:2, requests:3 },
      note:'240 drivers. Strongest supply node in the north. Runs both Network roles.' },
    { id:'cl3', name:'Sahel Logistics', type:'3PL', product:'Dash 3PL', logo:'SL',
      legal:'Sahel Logistics Company', cr:'1010xxxx92', vat:'3007xxxxxx0003', city:'Riyadh', contact:'ops@sahel-logistics.sa',
      verified:'3 Feb 2026', state:'Active', plan:'Provider Standard', fee:600,
      integration:'API', integrations:['API'], health:'Healthy',
      branches:0, volume:44, orders:914, onTime:92, spend:1734, wallet:1240,
      net:{ supply:'Active', demand:'Active' }, market:{ role:'Provider', connected:3, requests:1 },
      note:'Runs Sahel OMS v4. Cars and vans, east and south.' },
    { id:'cl4', name:'Almasa Foods', type:'Merchant', product:'Dash Merchant', logo:'AF',
      legal:'Almasa Food Industries', cr:'1010xxxx15', vat:'3002xxxxxx0003', city:'Riyadh', contact:'logistics@almasa.sa',
      verified:'2 May 2023', state:'Active', plan:'Retail Scale', fee:3800,
      integration:'API', integrations:['API','Manual'], health:'Healthy',
      branches:12, volume:310, orders:4820, onTime:95, spend:71400, wallet:12800,
      net:{ supply:'n/a', demand:'Active — automatic' }, market:{ role:'Buyer', connected:4, requests:0 },
      note:'Largest merchant on the platform by volume.' },
    { id:'cl5', name:'Barq Riyadh', type:'3PL', product:'Dash 3PL', logo:'BR',
      legal:'Barq Delivery Est.', cr:'1010xxxx60', vat:'3009xxxxxx0003', city:'Riyadh', contact:'hello@barq.sa',
      verified:'—', state:'Pending verification', plan:'Provider Basic', fee:0,
      integration:'None yet', integrations:[], health:'—',
      branches:0, volume:0, orders:0, onTime:0, spend:0, wallet:0,
      net:{ supply:'Not joined', demand:'Not joined' }, market:{ role:'Provider', connected:0, requests:0 },
      note:'Submitted documents 27 Aug. Municipality licence is unreadable.' },
    { id:'cl6', name:'Tamra Pharmacy', type:'Merchant', product:'Dash Merchant', logo:'TP',
      legal:'Tamra Medical Trading', cr:'1010xxxx33', vat:'3006xxxxxx0003', city:'Riyadh', contact:'ops@tamra.sa',
      verified:'27 Feb 2026', state:'Active', plan:'Retail Starter', fee:400,
      integration:'Connector', integrations:['Salla'], health:'Healthy',
      branches:3, volume:52, orders:612, onTime:91, spend:9840, wallet:640,
      net:{ supply:'n/a', demand:'Active — automatic' }, market:{ role:'Buyer', connected:2, requests:0 },
      note:'Chilled pharmacy deliveries. Low wallet — watch it.' },
    { id:'cl7', name:'Nuqta Express', type:'3PL', product:'Dash 3PL', logo:'NX',
      legal:'Nuqta Express Company', cr:'1010xxxx07', vat:'3008xxxxxx0003', city:'Riyadh', contact:'ops@nuqta.sa',
      verified:'19 Jan 2026', state:'Suspended', plan:'Provider Standard', fee:600,
      integration:'API', integrations:['API'], health:'Failing',
      branches:0, volume:0, orders:288, onTime:78, spend:1200, wallet:-320,
      net:{ supply:'Suspended', demand:'Not joined' }, market:{ role:'Provider', connected:1, requests:0 },
      note:'Suspended 24 Aug: on-time fell to 78% and wallet went negative. Two merchant complaints.' },
    { id:'cl8', name:'Chopped', type:'Merchant', product:'Dash Merchant', logo:'CH',
      legal:'Chopped Restaurants Company', cr:'1010xxxx88', vat:'3003xxxxxx0003', city:'Riyadh', contact:'ops@chopped.sa',
      verified:'19 Jan 2025', state:'Active', plan:'Retail Growth', fee:1400,
      integration:'API', integrations:['API'], health:'Healthy',
      branches:6, volume:140, orders:2140, onTime:93, spend:32100, wallet:5400,
      net:{ supply:'n/a', demand:'Active — automatic' }, market:{ role:'Buyer', connected:2, requests:0 },
      note:'' }
  ];

  /* A merchant client's own sites. Admin reads them — the client owns them. */
  const BR_D = ['Hittin','Al Yasmin','Olaya','Al Malqa','Al Nakheel','Al Sahafah','Qurtubah','Al Aqiq','Al Rabi','Al Wadi','Al Ghadir','Al Izdihar'];
  const BR_M = ['Yasser Al Otaibi','Nada Al Harbi','Omar Sabri','Rana Al Zahrani','Faisal Al Amri','Huda Al Qahtani'];
  CLIENTS.forEach((c, ci) => {
    c.branchList = Array.from({ length: c.branches || 0 }, (_, i) => {
      const dist = BR_D[(i + ci * 3) % BR_D.length];
      return {
        code: dist.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
        name: c.name + ' — ' + dist,
        district: dist,
        zone: ['Zone North','Zone Central','Zone East','Zone South','Zone West'][(i + ci) % 5],
        hours: i % 3 === 2 ? '09:00 – 22:00' : '07:00 – 23:00',
        mgr: BR_M[(i + ci) % BR_M.length],
        orders: Math.max(3, Math.round((c.volume || 0) / (c.branches || 1)) + ((i * 5 + ci * 7) % 9) - 4),
        onTime: 88 + ((i * 3 + ci * 5) % 10),
        status: c.state !== 'Active' ? 'Not live yet' : (i === 3 ? 'Reduced hours' : 'Open')
      };
    });
  });

  /* ---------- VERIFICATION QUEUE (Epic 05) ---------- */
  const VERIFY = [
    { id:'v1', client:'Barq Riyadh', type:'3PL', submitted:'27 Aug 2026', waiting:'3 days', assignee:'Khalid Al Subaie',
      docs:[{ k:'Commercial registration', s:'Accepted' }, { k:'VAT certificate', s:'Accepted' },
            { k:'Owner national ID', s:'Accepted' }, { k:'Municipality licence', s:'Unreadable' },
            { k:'Fleet insurance', s:'Pending review' }],
      state:'Under review', note:'Municipality licence scan is cut off at the bottom. Everything else is clean.' },
    { id:'v2', client:'Bayt Market', type:'Merchant', submitted:'28 Aug 2026', waiting:'2 days', assignee:'Mona Al Harbi',
      docs:[{ k:'Commercial registration', s:'Accepted' }, { k:'VAT certificate', s:'Accepted' }, { k:'Owner national ID', s:'Accepted' }],
      state:'Ready to verify', note:'All documents check out. 28 orders/day, two branches in Zone Central.' },
    { id:'v3', client:'Tayar Delivery', type:'3PL', submitted:'26 Aug 2026', waiting:'4 days', assignee:'Khalid Al Subaie',
      docs:[{ k:'Commercial registration', s:'Accepted' }, { k:'VAT certificate', s:'Expired' },
            { k:'Owner national ID', s:'Accepted' }, { k:'Fleet insurance', s:'Accepted' }],
      state:'Blocked', note:'VAT certificate expired in June. They must file before we can verify.' },
    { id:'v4', client:'Hzbr Grocery', type:'Merchant', submitted:'29 Aug 2026', waiting:'1 day', assignee:'Unassigned',
      docs:[{ k:'Commercial registration', s:'Pending review' }, { k:'VAT certificate', s:'Pending review' }, { k:'Owner national ID', s:'Pending review' }],
      state:'New', note:'' }
  ];

  /* ---------- FREELANCERS (Epic 06) ---------- */
  const FREELANCERS = [
    { id:'f1', name:'Rakan Al Zahrani', phone:'+966 51 445 7730', city:'Riyadh', vehicle:'Motorcycle · RYD 7302',
      state:'Active', approved:'6 May 2026', orders:1130, completion:96, accept:78, cancel:1.9,
      docs:[{ k:'National ID', exp:'08 Jul 2028', s:'Valid' }, { k:'Driving license', exp:'11 Jan 2027', s:'Valid' },
            { k:'Vehicle registration', exp:'20 Dec 2026', s:'Valid' }, { k:'Vehicle insurance', exp:'20 Dec 2026', s:'Valid' }],
      wallet:418, note:'' },
    { id:'f2', name:'Meshal Al Qahtani', phone:'+966 55 220 8841', city:'Riyadh', vehicle:'Motorcycle · RYD 2214',
      state:'Active', approved:'2 Mar 2026', orders:1840, completion:97, accept:84, cancel:1.2,
      docs:[{ k:'National ID', exp:'14 Apr 2030', s:'Valid' }, { k:'Driving license', exp:'22 Sep 2026', s:'Expiring' },
            { k:'Vehicle registration', exp:'30 Nov 2026', s:'Valid' }, { k:'Vehicle insurance', exp:'22 Sep 2026', s:'Expiring' }],
      wallet:1240, note:'Two documents expire within 30 days. Auto-flag fires at 30 days, auto-suspend at expiry.' },
    { id:'f3', name:'Hamad Al Suwaidi', phone:'+966 58 110 3390', city:'Riyadh', vehicle:'Car · RYD 6688',
      state:'Suspended', approved:'18 Nov 2025', orders:610, completion:88, accept:62, cancel:6.4,
      docs:[{ k:'National ID', exp:'02 Feb 2031', s:'Valid' }, { k:'Driving license', exp:'12 Aug 2026', s:'Expired' },
            { k:'Vehicle registration', exp:'12 Aug 2026', s:'Expired' }, { k:'Vehicle insurance', exp:'12 Aug 2026', s:'Expired' }],
      wallet:86, note:'Auto-suspended 12 Aug when the licence lapsed. Waiting on a resubmission.' },
    { id:'f4', name:'Ibrahim Al Dosari', phone:'+966 53 774 1102', city:'Riyadh', vehicle:'Motorcycle · RYD 9041',
      state:'Pending approval', approved:'—', orders:0, completion:0, accept:0, cancel:0,
      docs:[{ k:'National ID', exp:'19 Jun 2029', s:'Accepted' }, { k:'Driving license', exp:'04 Mar 2028', s:'Accepted' },
            { k:'Vehicle registration', exp:'15 Jan 2027', s:'Accepted' }, { k:'Vehicle insurance', exp:'—', s:'Missing' }],
      wallet:0, note:'Vehicle insurance never uploaded. Told them 28 Aug.' },
    { id:'f5', name:'Waleed Al Mutairi', phone:'+966 50 998 2276', city:'Riyadh', vehicle:'Motorcycle · RYD 3357',
      state:'Pending approval', approved:'—', orders:0, completion:0, accept:0, cancel:0,
      docs:[{ k:'National ID', exp:'30 Oct 2032', s:'Accepted' }, { k:'Driving license', exp:'08 Dec 2027', s:'Accepted' },
            { k:'Vehicle registration', exp:'21 May 2027', s:'Accepted' }, { k:'Vehicle insurance', exp:'21 May 2027', s:'Accepted' }],
      wallet:0, note:'Everything in order. Ready to approve.' }
  ];

  /* ---------- DASH NETWORK (product 06, lives here) ---------- */
  const NETWORK = {
    master: true,
    categories: {
      'Merchants':   { role:'Demand', auto:true,  on:true, count:186, note:'Automatic — no request needed. Every verified merchant can send.' },
      'DMS clients': { role:'Both',   auto:false, on:true, count:14,  note:'Approved per role. Overflow out, spare capacity in.' },
      '3PLs':        { role:'Both',   auto:false, on:true, count:9,   note:'Approved per role.' },
      'Freelancers': { role:'Supply', auto:true,  on:true, count:412, note:'Automatic on onboarding approval.' }
    },
    demand: [
      { id:'nd1', name:'Kanz Market', cat:'Merchants', state:'Active', joined:'12 Aug 2024', sent:1396, fulfilled:96, auto:true },
      { id:'nd2', name:'Almasa Foods', cat:'Merchants', state:'Active', joined:'2 May 2023', sent:4820, fulfilled:97, auto:true },
      { id:'nd3', name:'Rehla Fleet', cat:'DMS clients', state:'Active', joined:'2 Aug 2026', sent:198, fulfilled:94, auto:false },
      { id:'nd4', name:'Sahel Logistics', cat:'3PLs', state:'Active', joined:'20 Jul 2026', sent:48, fulfilled:94, auto:false },
      { id:'nd5', name:'Tamra Pharmacy', cat:'Merchants', state:'Active', joined:'27 Feb 2026', sent:612, fulfilled:92, auto:true },
      { id:'nd6', name:'Chopped', cat:'Merchants', state:'Paused', joined:'19 Jan 2025', sent:2140, fulfilled:95, auto:true }
    ],
    supply: [
      { id:'ns1', name:'Rehla Fleet', cat:'DMS clients', state:'Active', joined:'12 Mar 2026', received:1840, accept:92, complete:96 },
      { id:'ns2', name:'Sahel Logistics', cat:'3PLs', state:'Active', joined:'3 Feb 2026', received:186, accept:81, complete:93 },
      { id:'ns3', name:'Freelancer pool', cat:'Freelancers', state:'Active', joined:'—', received:4120, accept:74, complete:95 },
      { id:'ns4', name:'Nuqta Express', cat:'3PLs', state:'Suspended', joined:'19 Jan 2026', received:288, accept:66, complete:78 },
      { id:'ns5', name:'Barq Riyadh', cat:'3PLs', state:'Pending', joined:'—', received:0, accept:0, complete:0 },
      { id:'ns6', name:'Tayar Delivery', cat:'3PLs', state:'Not joined', joined:'—', received:0, accept:0, complete:0 }
    ],
    requests: [
      { id:'r1', who:'Barq Riyadh', type:'3PL', role:'Supply', when:'28 Aug 2026', coverage:'Zone North', capacity:'40 drivers · bikes and cars',
        history:'New client — verified 3 days ago, no delivery history on Dash yet.', state:'Pending', assignee:'Khalid Al Subaie',
        note:'No performance history. Approving is a bet on their claimed coverage.' },
      { id:'r2', who:'Rehla Fleet', type:'DMS', role:'Demand', when:'2 Aug 2026', coverage:'Zone North, Central, South', capacity:'240 drivers',
        history:'On time 96%, acceptance 92% over 1,840 Network orders as Supply.', state:'Approved', assignee:'Dana Al Rasheed',
        note:'Approved 2 Aug. Strong Supply record made the Demand request easy.' },
      { id:'r3', who:'Tayar Delivery', type:'3PL', role:'Supply', when:'26 Aug 2026', coverage:'All Riyadh, Jeddah', capacity:'120 drivers · refrigerated',
        history:'Not verified yet — VAT certificate expired.', state:'Blocked', assignee:'Khalid Al Subaie',
        note:'Cannot approve a Network role before verification clears.' },
      { id:'r4', who:'Almasa Foods', type:'Merchant', role:'Demand', when:'2 May 2023', coverage:'12 branches, Riyadh', capacity:'310 orders/day',
        history:'On time 95% over 4,820 orders.', state:'Automatic', assignee:'—',
        note:'Merchants do not request Demand — it is granted on verification.' }
    ],
    monitor: {
      inNetwork: 42, stuck: 3, unfulfilled: 1,
      zones: [
        { z:'Zone North — Al Malqa', demand:34, supply:22, state:'Short' },
        { z:'Zone East — Al Malaz', demand:21, supply:28, state:'Healthy' },
        { z:'Zone Central — Olaya', demand:41, supply:39, state:'Tight' },
        { z:'Zone West — Al Sahafah', demand:12, supply:4, state:'Critical' },
        { z:'Zone South — Al Yasmin', demand:19, supply:24, state:'Healthy' }
      ]
    },
    routing: {
      mode:'Auto', directHonoured:true, schedLead:20,
      steps:['Filter on coverage — who actually serves the pickup and the drop-off',
             'Filter on capability — vehicle type, chilled, bulk, cash on delivery',
             'Rank on performance in that zone — acceptance, pickup speed, on-time',
             'Offer out in rank order, with a decline window',
             'Fall through to the next node; nothing dead-ends'],
      pending:'Routing internals and platform zone definitions are scoped but not yet specified.'
    }
  };

  /* ---------- MARKETPLACE (product 07 admin half) ---------- */
  const LISTINGS = [
    { id:'l1', provider:'Rehla Fleet', logo:'RF', state:'Live', submitted:'4 Aug 2026', approved:'6 Aug 2026',
      zones:'Zone North, Central, South', vehicles:'Bikes, cars, vans', caps:'Same day, chilled, cash on delivery',
      pricing:'From SAR 14.00 + SAR 1.20/km', views:812, requests:9, connected:2, featured:true, rank:1,
      onTime:96, accept:88, note:'Best performing listing. Featured on the merchant browse page.' },
    { id:'l2', provider:'Sahel Logistics', logo:'SL', state:'Live', submitted:'28 Jan 2026', approved:'3 Feb 2026',
      zones:'Zone East, South, Central', vehicles:'Cars, vans, refrigerated', caps:'Same day, scheduled, bulk, returns, cash on delivery',
      pricing:'From SAR 12.50 flat', views:284, requests:6, connected:3, featured:false, rank:2,
      onTime:92, accept:81, note:'' },
    { id:'l3', provider:'Nuqta Express', logo:'NX', state:'Suspended', submitted:'12 Jan 2026', approved:'19 Jan 2026',
      zones:'Zone Central, West', vehicles:'Bikes', caps:'Same day',
      pricing:'From SAR 11.00 flat', views:96, requests:2, connected:1, featured:false, rank:4,
      onTime:78, accept:66, note:'Suspended 24 Aug — on-time below 80% and two merchant complaints.' },
    { id:'l4', provider:'Barq Riyadh', logo:'BR', state:'Pending review', submitted:'28 Aug 2026', approved:'—',
      zones:'Zone North', vehicles:'Bikes, cars', caps:'Same day, chilled, cash on delivery',
      pricing:'From SAR 17.00 + SAR 1.40/km', views:0, requests:0, connected:0, featured:false, rank:5,
      onTime:0, accept:0, note:'First submission. Coverage claim is narrow but the pricing is honest.' },
    { id:'l5', provider:'Tayar Delivery', logo:'TD', state:'Draft', submitted:'—', approved:'—',
      zones:'All Riyadh, Jeddah', vehicles:'Bikes, cars, refrigerated', caps:'Same day, scheduled, chilled, returns',
      pricing:'From SAR 15.00 + SAR 0.90/km', views:0, requests:0, connected:0, featured:false, rank:6,
      onTime:0, accept:0, note:'Not submitted — their verification is blocked.' }
  ];

  const CONNECTIONS = [
    { merchant:'Kanz Market', provider:'Rehla Fleet', state:'Connected', since:'29 Aug 2026', orders:198, pricing:'SAR 14.00 + 1.20/km' },
    { merchant:'Kanz Market', provider:'Sahel Logistics', state:'Connected', since:'3 Feb 2026', orders:198, pricing:'SAR 12.50 flat' },
    { merchant:'Almasa Foods', provider:'Sahel Logistics', state:'Connected', since:'14 Apr 2026', orders:512, pricing:'SAR 11.80 flat' },
    { merchant:'Tamra Pharmacy', provider:'Sahel Logistics', state:'Connected', since:'8 Jun 2026', orders:104, pricing:'SAR 14.00 + 1.00/km' },
    { merchant:'Bayt Market', provider:'Sahel Logistics', state:'Pending provider', since:'27 Aug 2026', orders:0, pricing:'—' },
    { merchant:'Kanz Market', provider:'Tayar Delivery', state:'Pending provider', since:'27 Aug 2026', orders:0, pricing:'—' },
    { merchant:'Chopped', provider:'Nuqta Express', state:'Suspended', since:'2 Feb 2026', orders:64, pricing:'SAR 11.00 flat' }
  ];

  /* ---------- GLOBAL CONTROL TOWER (Epic 07) ---------- */
  const STATUS = {
    'Awaiting provider':{ c:PAL.lemon }, 'Routing':{ c:PAL.lemon }, 'Assigned':{ c:PAL.lemon },
    'Picked up':{ c:PAL.lav }, 'In transit':{ c:PAL.lav }, 'At delivery':{ c:PAL.vodka },
    'Delivered':{ c:'#1f8a4c' }, 'Cancelled':{ c:PAL.tang }, 'Returned':{ c:PAL.tang }, 'Stuck':{ c:PAL.tang }
  };

  const CITIES = ['Riyadh'];
  const ZONE_GEO = { 'Zone North':['Riyadh','Al Malqa'], 'Zone East':['Riyadh','Al Naseem'],
    'Zone Central':['Riyadh','Olaya'], 'Zone West':['Riyadh','Al Yasmin'], 'Zone South':['Riyadh','Al Aziziyah'] };

  const ORDERS = [
    { id:'DX-41108', merchant:'Chopped', product:'Freelancer App', type:'On demand', elapsed:'11m', offline:'Rakan Al Zahrani', source:'Network', provider:'Freelancer pool',
      status:'In transit', zone:'Zone Central', created:'15:37', eta:'16:14', value:19.80, cod:0,
      customer:'Nouf B.', scope:'dash', stuck:0,
      log:[{ t:'15:37', e:'Routed to freelancer pool', s:'3 drivers within 2 km' },
           { t:'15:38', e:'Accepted by Rakan Al Zahrani', s:'' },
           { t:'15:52', e:'Driver app went offline', s:'No location for 11 min — Dash owns this order' }] },
    { id:'DX-41105', merchant:'Tamra Pharmacy', product:'Dash Merchant', type:'On demand', elapsed:'21m', failed:true, source:'Network', provider:'Rehla Fleet',
      status:'At delivery', zone:'Zone North', created:'15:12', eta:'15:47', value:23.40, cod:0,
      customer:'Layla A.', scope:'dash', stuck:0,
      log:[{ t:'15:12', e:'Routed to Rehla Fleet', s:'Chilled — refrigerated vehicle' },
           { t:'15:41', e:'At delivery', s:'Geofence confirmed' },
           { t:'15:44', e:'Delivery failed — nobody answered', s:'Awaiting a Dash decision · reattempt or return' }] },
    { id:'DX-41074', merchant:'Kanz Market', product:'Dash Merchant', type:'On demand', elapsed:'4m', source:'Direct', provider:'—',
      status:'Awaiting provider', zone:'Zone South', created:'15:44', eta:'16:28', value:16.00, cod:64,
      customer:'Hassan M.', scope:'owner', stuck:4,
      log:[{ t:'15:44', e:'Order created', s:'Salla connector · Kanz — Al Yasmin' },
           { t:'15:44', e:'Offered to Rehla Fleet', s:'No driver in radius' },
           { t:'15:46', e:'Offered to Dash Network', s:'Routing — 6 candidates' }] },
    { id:'DX-41094', merchant:'Shawarmer', product:'Dash 3PL', type:'On demand', elapsed:'2m', noResponse:true, source:'Network', provider:'Sahel Logistics',
      status:'Routing', zone:'Zone East', created:'15:46', eta:'16:30', value:16.80, cod:48,
      customer:'Faisal K.', scope:'dash', stuck:0,
      log:[{ t:'15:46', e:'Routed to Sahel Logistics', s:'Supply role · decline window 4 min' }] },
    { id:'DX-41077', merchant:'Kanz Market', product:'Dash Merchant', type:'On demand', elapsed:'7m', source:'Marketplace', provider:'Rehla Fleet',
      status:'In transit', zone:'Zone North', created:'15:41', eta:'16:12', value:18.40, cod:0,
      customer:'Layla A.', scope:'owner', stuck:0,
      log:[{ t:'15:41', e:'Order created', s:'Salla connector' },
           { t:'15:42', e:'Accepted by Rehla Fleet', s:'Faisal Al Harbi' },
           { t:'16:03', e:'In transit', s:'' }] },
    { id:'DX-41102', merchant:'Kanz Market', product:'Freelancer App', type:'On demand', elapsed:'0m', source:'Network', provider:'Freelancer pool',
      status:'Assigned', zone:'Zone South', created:'15:48', eta:'16:32', value:30.63, cod:0,
      customer:'Layla A.', scope:'dash', stuck:0,
      log:[{ t:'15:48', e:'Routed to freelancer pool', s:'5 drivers within 3 km' },
           { t:'15:49', e:'Accepted by Rakan Al Zahrani', s:'SAR 24.50 to the driver' }] },
    { id:'DX-40907', merchant:'Almasa Foods', product:'Dash DMS', type:'Scheduled', elapsed:'50m', assignAt:'18:10', source:'Network', provider:'Rehla Fleet',
      status:'Stuck', zone:'Zone West', created:'14:58', eta:'18:30', value:24.00, cod:0,
      customer:'Layla A.', scope:'dash', stuck:52,
      log:[{ t:'14:58', e:'Routed to Rehla Fleet', s:'Supply role · Zone West' },
           { t:'14:58', e:'Queued for scheduled assignment', s:'Assign at 18:10' },
           { t:'15:50', e:'No supply in Zone West', s:'Zone paused by Rehla · 52 min without movement' }] },
    { id:'DX-41088', merchant:'Almasa Foods', product:'Dash 3PL', type:'On demand', elapsed:'17m', late:true, source:'Marketplace', provider:'Sahel Logistics',
      status:'In transit', zone:'Zone East', created:'15:31', eta:'16:09', value:21.00, cod:60,
      customer:'Reem S.', scope:'owner', stuck:0,
      log:[{ t:'15:31', e:'Order created', s:'Marketplace · Almasa Foods' },
           { t:'15:52', e:'In transit', s:'Majed Al Shammari' }] },
    { id:'DX-41061', merchant:'Kanz Market', product:'Dash 3PL', type:'Scheduled', elapsed:'50m', source:'Marketplace', provider:'Sahel Logistics',
      status:'Assigned', zone:'Zone North', created:'14:58', eta:'18:30', value:26.00, cod:0,
      customer:'Faisal K.', scope:'owner', stuck:0,
      log:[{ t:'14:59', e:'Order received', s:'Marketplace' }, { t:'18:10', e:'Driver assigned', s:'Bandar Al Otaibi' }] },
    { id:'DX-40998', merchant:'Kanz Market', product:'Dash 3PL', type:'On demand', elapsed:'—', source:'Marketplace', provider:'Sahel Logistics',
      status:'Returned', zone:'Zone North', created:'12:44', eta:'13:20', value:8.00, cod:48,
      customer:'Hassan M.', scope:'owner', stuck:0,
      log:[{ t:'13:14', e:'Failed — customer unreachable', s:'Reattempt 1 of 2' },
           { t:'13:38', e:'Returned to merchant', s:'Return leg charged at 50% — disputed' }] },
    { id:'DX-40940', merchant:'Almasa Foods', product:'Dash 3PL', type:'On demand', elapsed:'6h 18m', source:'Network', provider:'—',
      status:'Stuck', zone:'Zone East', created:'09:31', eta:'—', value:0, cod:0,
      customer:'Reem S.', scope:'dash', stuck:378,
      log:[{ t:'09:31', e:'Pushed by Sahel Logistics as overflow', s:'Peak — all drivers on job' },
           { t:'09:31', e:'Offered to 4 supply nodes', s:'All declined' },
           { t:'10:12', e:'Returned to Sahel Logistics', s:'Nobody in the network took it' }] },
    { id:'DX-41055', merchant:'Kanz Market', product:'Dash Merchant', type:'On demand', elapsed:'15m', source:'Marketplace', provider:'Rehla Fleet',
      status:'Picked up', zone:'Zone South', created:'15:33', eta:'16:05', value:20.50, cod:150,
      customer:'Nouf B.', scope:'owner', stuck:0,
      log:[{ t:'15:34', e:'Accepted by Rehla Fleet', s:'Nawaf Al Ghamdi' }, { t:'15:51', e:'Picked up', s:'COD SAR 150' }] }
  ];

  /* ---------- BILLING AND REVENUE (Epic 10) ---------- */
  const PLANS = [
    { n:'Retail Starter', product:'Merchant', p:400, cap:'1 branch · 300 orders/mo', clients:38 },
    { n:'Retail Growth', product:'Merchant', p:1400, cap:'5 branches · 3,000 orders/mo', clients:112 },
    { n:'Retail Scale', product:'Merchant', p:3800, cap:'Unlimited', clients:14 },
    { n:'Fleet Starter', product:'DMS', p:900, cap:'25 drivers', clients:6 },
    { n:'Fleet Pro', product:'DMS', p:2400, cap:'250 drivers', clients:11 },
    { n:'Fleet Enterprise', product:'DMS', p:null, cap:'Unlimited · custom', clients:2 },
    { n:'Provider Basic', product:'3PL', p:0, cap:'Network only', clients:4 },
    { n:'Provider Standard', product:'3PL', p:600, cap:'Network + Marketplace', clients:7 },
    { n:'Provider Plus', product:'3PL', p:null, cap:'Unlimited · custom', clients:1 }
  ];

  const REVENUE = {
    mrr: 284600, subs: 196400, commission: 74800, other: 13400,
    networkOrders: 6420, networkGross: 98600, networkPayout: 90712, margin: 7888, marginPct: 8,
    invoices: [
      { id:'INV-2026-08-KM', client:'Kanz Market', amount:23260, status:'Open', due:'15 Sep 2026' },
      { id:'INV-2026-08-RF', client:'Rehla Fleet', amount:3126, status:'Open', due:'15 Sep 2026' },
      { id:'INV-2026-08-SL', client:'Sahel Logistics', amount:1734, status:'Open', due:'15 Sep 2026' },
      { id:'INV-2026-08-AF', client:'Almasa Foods', amount:71400, status:'Paid', due:'15 Sep 2026' },
      { id:'INV-2026-08-NX', client:'Nuqta Express', amount:1200, status:'Overdue', due:'15 Aug 2026' },
      { id:'INV-2026-08-TP', client:'Tamra Pharmacy', amount:9840, status:'Open', due:'15 Sep 2026' }
    ],
    settlement: [
      { node:'Rehla Fleet', type:'DMS client', orders:1840, gross:28640, payout:26349, margin:2291 },
      { node:'Sahel Logistics', type:'3PL', orders:186, gross:2980, payout:2742, margin:238 },
      { node:'Freelancer pool', type:'Freelancers', orders:4120, gross:64420, payout:51536, margin:12884 },
      { node:'Nuqta Express', type:'3PL', orders:288, gross:2560, payout:2355, margin:205 }
    ],
    withdrawals: [
      { id:'w1', who:'Rakan Al Zahrani', type:'Freelancer', amount:418, requested:'Today 15:20', method:'Al Rajhi ••4471', state:'Pending', flag:'' },
      { id:'w2', who:'Meshal Al Qahtani', type:'Freelancer', amount:1240, requested:'Today 14:02', method:'SNB ••8812', state:'Pending', flag:'Documents expiring in 23 days' },
      { id:'w3', who:'Hamad Al Suwaidi', type:'Freelancer', amount:86, requested:'Yesterday', method:'Al Rajhi ••2201', state:'Held', flag:'Account suspended — expired licence' },
      { id:'w4', who:'Sahel Logistics', type:'3PL', amount:2740, requested:'Today 13:40', method:'Al Rajhi ••8820', state:'Pending', flag:'' },
      { id:'w5', who:'Nuqta Express', type:'3PL', amount:0, requested:'—', method:'—', state:'Blocked', flag:'Wallet negative — SAR 320 owed to Dash' }
    ],
    disputes: [
      { id:'d1', order:'DX-40998', between:'Kanz Market vs Sahel Logistics', amount:8.00, about:'Return leg charged after one failed attempt', state:'Open', raised:'Today 14:10' },
      { id:'d2', order:'DX-40640', between:'Sahel Logistics vs Dash', amount:112.00, about:'Commission charged twice in July', state:'Resolved', raised:'22 Aug' },
      { id:'d3', order:'DX-40912', between:'Chopped vs Nuqta Express', amount:11.00, about:'Order marked delivered but never arrived', state:'Open', raised:'27 Aug' }
    ]
  };

  /* ---------- SUPPORT (Epic 11) ---------- */
  const TICKETS = [
    { id:'TK-4420', from:'Sahel Logistics', product:'Dash 3PL', kind:'Dispute', p:'High', s:'Open',
      t:'Kanz disputes the return leg charge on DX-40998', link:'DX-40998', assignee:'Hessa Al Otaibi', opened:'Today 14:10', last:'Dash replied 14:52' },
    { id:'TK-3312', from:'Kanz Market', product:'Dash Merchant', kind:'Report a 3PL', p:'High', s:'Open',
      t:'Sahel returned DX-40998 without calling the customer', link:'DX-40998', assignee:'Hessa Al Otaibi', opened:'Today 14:02', last:'Awaiting Sahel' },
    { id:'TK-2210', from:'Rehla Fleet', product:'Dash DMS', kind:'Routing', p:'High', s:'Open',
      t:'Network order arrived outside our coverage', link:'DX-40907', assignee:'Khalid Al Subaie', opened:'Today 15:02', last:'Investigating' },
    { id:'TK-4412', from:'Sahel Logistics', product:'Dash 3PL', kind:'Technical', p:'Normal', s:'Pending',
      t:'order.assigned webhook not firing for scheduled orders', link:'API', assignee:'Rayan Al Faisal', opened:'Yesterday', last:'Awaiting their logs' },
    { id:'TK-3305', from:'Kanz Market', product:'Dash Merchant', kind:'Technical', p:'Normal', s:'Pending',
      t:'Salla orders missing the delivery note field', link:'Salla', assignee:'Rayan Al Faisal', opened:'Yesterday', last:'Fix in review' },
    { id:'TK-4398', from:'Sahel Logistics', product:'Dash 3PL', kind:'Billing', p:'Normal', s:'Resolved',
      t:'Commission charged twice in July invoice', link:'Billing', assignee:'Ziyad Al Amoudi', opened:'22 Aug', last:'Credited 24 Aug' },
    { id:'TK-5001', from:'Rakan Al Zahrani', product:'Freelancer App', kind:'Payout', p:'Normal', s:'Open',
      t:'Withdrawal has not arrived after two days', link:'w1', assignee:'Unassigned', opened:'Today 15:22', last:'—' }
  ];

  /* ---------- UNIFIED CUSTOMER DIRECTORY (Epic 12) ---------- */
  const CUSTOMERS = [
    { id:'uc1', name:'Layla A.', phone:'+966 50 220 1188', orders:96, success:97, flagged:false,
      merchants:[{ m:'Kanz Market', n:34, s:97 }, { m:'Tamra Pharmacy', n:22, s:95 }, { m:'Almasa Foods', n:40, s:98 }],
      note:'', last:'Today 15:48' },
    { id:'uc2', name:'Hassan M.', phone:'+966 55 771 4420', orders:34, success:74, flagged:true,
      merchants:[{ m:'Kanz Market', n:12, s:83 }, { m:'Chopped', n:14, s:71 }, { m:'Shawarmer', n:8, s:62 }],
      note:'Flagged by three merchants independently. Refused four deliveries in August. Support has escalated twice.', last:'Today 15:44' },
    { id:'uc3', name:'Reem S.', phone:'+966 53 118 9902', orders:142, success:99, flagged:false,
      merchants:[{ m:'Almasa Foods', n:61, s:99 }, { m:'Nuqta', n:38, s:99 }, { m:'Tamra Pharmacy', n:43, s:98 }],
      note:'Highest volume customer on the platform.', last:'Today 15:31' },
    { id:'uc4', name:'Faisal K.', phone:'+966 58 993 3315', orders:22, success:85, flagged:false,
      merchants:[{ m:'Shawarmer', n:8, s:88 }, { m:'Kanz Market', n:14, s:83 }],
      note:'', last:'Today 15:46' },
    { id:'uc5', name:'Nouf B.', phone:'+966 51 664 7712', orders:41, success:95, flagged:false,
      merchants:[{ m:'Kanz Market', n:23, s:95 }, { m:'Chopped', n:18, s:94 }],
      note:'Prefers evening slots.', last:'Today 15:33' }
  ];

  /* ---------- ANNOUNCEMENTS (Epic 13) ---------- */
  const ANNOUNCEMENTS = [
    { id:'a1', t:'Scheduled maintenance — 2 September, 02:00–04:00', kind:'Maintenance', audience:'All clients',
      sent:'28 Aug 2026', reach:196, state:'Sent', body:'Dash Network routing will pause for two hours. Orders already assigned continue normally.' },
    { id:'a2', t:'Return leg charging policy clarified', kind:'Policy', audience:'3PLs and DMS clients',
      sent:'26 Aug 2026', reach:23, state:'Sent', body:'A return leg is charged at 50% only after the reattempt allowance is exhausted.' },
    { id:'a3', t:'Salla connector update — order notes now sync', kind:'Release', audience:'Merchants on Salla',
      sent:'26 Aug 2026', reach:74, state:'Sent', body:'Customer notes entered at checkout now travel onto the Dash order.' },
    { id:'a4', t:'Zone West supply shortage — pricing incentive', kind:'Notice', audience:'Supply nodes · Zone West',
      sent:'—', reach:9, state:'Draft', body:'A temporary uplift applies to Zone West deliveries from 1 September.' }
  ];

  /* ---------- PLATFORM ANALYTICS (Epics 03, 14) ---------- */
  const PLATFORM = {
    orders: { today: 1842, week: 12406, month: 52180, active: 42 },
    byProduct: [
      { p:'Dash Merchant', orders:34120, share:65, clients:164 },
      { p:'Dash DMS', orders:11480, share:22, clients:19 },
      { p:'Dash 3PL', orders:6580, share:13, clients:12 }
    ],
    bySource: [
      { s:'Direct', orders:31308, share:60, note:'Merchant to their own provider' },
      { s:'Marketplace', orders:14610, share:28, note:'Connected through a listing' },
      { s:'Dash Network', orders:6262, share:12, note:'Routed by the engine' }
    ],
    byIntegration: [
      { i:'Connector — Salla', n:74 }, { i:'Connector — Shopify', n:38 },
      { i:'Connector — Zid', n:19 }, { i:'Connector — Taker', n:12 },
      { i:'API', n:41 }, { i:'Manual only', n:8 }
    ],
    health: [
      { i:'Salla', clients:74, state:'Healthy', errors:0.2 },
      { i:'Shopify', clients:38, state:'Healthy', errors:0.4 },
      { i:'Zid', clients:19, state:'Degraded', errors:3.8 },
      { i:'Taker', clients:12, state:'Healthy', errors:0.6 },
      { i:'Direct API', clients:41, state:'Degraded', errors:2.1 }
    ],
    growth: [
      { m:'Mar', clients:118, orders:32400 }, { m:'Apr', clients:132, orders:36800 },
      { m:'May', clients:148, orders:41200 }, { m:'Jun', clients:161, orders:44600 },
      { m:'Jul', clients:178, orders:48900 }, { m:'Aug', clients:195, orders:52180 }
    ]
  };

  const NOTIFS = [
    { k:'Escalation', t:'DX-40940 unfulfilled for 6 h — Sahel overflow nobody took', d:'2 min ago', sev:'high', link:'#/control-tower' },
    { k:'Network', t:'Zone West is critical — 12 demand against 4 supply', d:'8 min ago', sev:'high', link:'#/network-monitor' },
    { k:'Verification', t:'Tayar Delivery blocked — VAT certificate expired', d:'26 min ago', sev:'high', link:'#/verification' },
    { k:'Payout', t:'Withdrawal held — Hamad Al Suwaidi is suspended', d:'1 h ago', sev:'med', link:'#/payouts' },
    { k:'Listing', t:'Barq Riyadh submitted a Marketplace listing', d:'2 h ago', sev:'med', link:'#/marketplace' },
    { k:'Billing', t:'Nuqta Express invoice overdue 15 days · wallet negative', d:'3 h ago', sev:'med', link:'#/billing' },
    { k:'Integration', t:'Zid connector error rate 3.8% across 19 clients', d:'5 h ago', sev:'med', link:'#/' },
    { k:'System', t:'Freelancer document expiry sweep completed — 2 flagged', d:'Today 06:00', sev:'low', link:'#/freelancers' }
  ];

  const AUDIT = [
    { t:'15:48', u:'Dash Network', r:'System', a:'Routed order', o:'DX-41102 → freelancer pool', ip:'—' },
    { t:'15:20', u:'Khalid Al Subaie', r:'Operations', a:'Paused participant', o:'Chopped · Demand role', ip:'188.55.x.x' },
    { t:'14:52', u:'Hessa Al Otaibi', r:'Support', a:'Replied to ticket', o:'TK-4420', ip:'94.98.x.x' },
    { t:'14:10', u:'Dana Al Rasheed', r:'Super Admin', a:'Suspended listing', o:'Nuqta Express', ip:'188.55.x.x' },
    { t:'13:40', u:'Ziyad Al Amoudi', r:'Finance', a:'Exported settlement report', o:'Aug 1–29 · CSV', ip:'94.98.x.x' },
    { t:'12:02', u:'Mona Al Harbi', r:'Operations', a:'Verified client', o:'Bayt Market', ip:'94.98.x.x' },
    { t:'11:30', u:'Dana Al Rasheed', r:'Super Admin', a:'Changed routing lead time', o:'Scheduled 15 min → 20 min', ip:'188.55.x.x' },
    { t:'10:14', u:'Khalid Al Subaie', r:'Operations', a:'Approved Network role', o:'Rehla Fleet · Demand', ip:'188.55.x.x' },
    { t:'06:00', u:'System', r:'System', a:'Document expiry sweep', o:'2 freelancers flagged, 0 suspended', ip:'—' }
  ];

  const SETTINGS = {
    statuses: [
      { s:'Awaiting provider', who:'Set by Dash on creation', next:'Routing, Cancelled' },
      { s:'Routing', who:'Set by the Network engine', next:'Assigned, Awaiting provider' },
      { s:'Assigned', who:'Set by the provider', next:'Picked up, Cancelled' },
      { s:'Picked up', who:'Set by the driver', next:'In transit' },
      { s:'In transit', who:'Set by the driver', next:'At delivery' },
      { s:'At delivery', who:'Set by geofence', next:'Delivered, Returned' },
      { s:'Delivered', who:'Set by the driver with proof', next:'Terminal' },
      { s:'Returned', who:'Set by rule after reattempts', next:'Terminal' },
      { s:'Cancelled', who:'Set by merchant or Dash', next:'Terminal' }
    ],
    templates: [
      { n:'Order assigned', ch:'Push, webhook', to:'Merchant, driver', on:true },
      { n:'Order delayed', ch:'Email, dashboard', to:'Merchant, provider', on:true },
      { n:'Document expiring', ch:'Email, push', to:'Freelancer, DMS client', on:true },
      { n:'Wallet low', ch:'Email, dashboard', to:'Client admin', on:true },
      { n:'Listing approved', ch:'Email', to:'Provider', on:true },
      { n:'Network role suspended', ch:'Email, dashboard', to:'Participant', on:true }
    ],
    langs: ['English', 'العربية'],
    currencies: ['SAR — Saudi Riyal', 'AED — UAE Dirham', 'USD — US Dollar']
  };

  return { PAL, CITIES, ZONE_GEO, ME, TEAM, ROLE_MATRIX, CLIENTS, VERIFY, FREELANCERS, NETWORK, LISTINGS, CONNECTIONS,
           STATUS, ORDERS, PLANS, REVENUE, TICKETS, CUSTOMERS, ANNOUNCEMENTS, PLATFORM, NOTIFS, AUDIT, SETTINGS,
           client: id => CLIENTS.find(c => c.id === id),
           order: id => ORDERS.find(o => o.id === id),
           freelancer: id => FREELANCERS.find(f => f.id === id),
           listing: id => LISTINGS.find(l => l.id === id),
           customer: id => CUSTOMERS.find(c => c.id === id),
           verify: id => VERIFY.find(v => v.id === id),
           request: id => NETWORK.requests.find(r => r.id === id) };
})();
