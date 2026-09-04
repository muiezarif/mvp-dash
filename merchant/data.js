/* Dash Merchant — Kanz Market. Grocery, 4 branches, Riyadh. Shares the Dash world. */
window.MER = (function () {
  const PAL = { peach:'#FFCC99', tang:'#FCA38B', lemon:'#FFEE50', lav:'#C0D2FF', flax:'#E5E57C', vodka:'#BDB9EF' };

  const BIZ = {
    legal:'Kanz Trading Company', name:'Kanz Market', kind:'Grocery and convenience',
    cr:'1010xxxx78', vat:'3004xxxxxx0003', site:'kanzmarket.sa', email:'ops@kanzmarket.sa',
    city:'Riyadh', hq:'Hittin, Riyadh 13512', volume:'90 orders / day', verified:'12 Aug 2024',
    plan:'Retail Growth', desc:'Neighbourhood grocery with four branches across north Riyadh. Chilled and ambient, same-day and scheduled.'
  };

  const CITIES = ['Riyadh'];

  const BRANCHES = [
    { id:'b1', name:'Kanz — Hittin', code:'HTN', city:'Riyadh', district:'Hittin', addr:'Hittin, Riyadh', pos:[24.8232,46.6089],
      hours:'07:00 – 23:00', mgr:'Yasser Al Otaibi', orders:34, onTime:96, avgMin:31, spend:4980, status:'Open' },
    { id:'b2', name:'Kanz — Al Yasmin', code:'YSM', city:'Riyadh', district:'Al Yasmin', addr:'Al Yasmin, block 4, Riyadh', pos:[24.8480,46.6390],
      hours:'07:00 – 00:00', mgr:'Nada Al Harbi', orders:26, onTime:93, avgMin:34, spend:3810, status:'Open' },
    { id:'b3', name:'Kanz — Olaya', code:'OLY', city:'Riyadh', district:'Olaya', addr:'Olaya, Tahlia St, Riyadh', pos:[24.6944,46.6853],
      hours:'08:00 – 23:00', mgr:'Omar Sabri', orders:19, onTime:91, avgMin:37, spend:2740, status:'Open' },
    { id:'b4', name:'Kanz — Al Malqa', code:'MLQ', city:'Riyadh', district:'Al Malqa', addr:'Al Malqa, Anas Ibn Malik Rd, Riyadh', pos:[24.8205,46.6102],
      hours:'09:00 – 22:00', mgr:'Rana Al Zahrani', orders:11, onTime:88, avgMin:41, spend:1620, status:'Reduced hours' }
  ];

  /* Connected 3PLs and Dash Network as a provider */
  const PROVIDERS = [
    { id:'p0', name:'Dash Network', kind:'Network', logo:'DN', zones:'All Riyadh', onTime:95, accept:99, avgPickup:12,
      price:'SAR 13.50 base + SAR 1.10/km', since:'12 Aug 2024', status:'Connected', vehicles:'Bikes, cars, vans, freelancers',
      caps:['Same day','Scheduled','Chilled','Cash on delivery','Returns'], note:'Dash routes to whoever fits. No contract to negotiate.' },
    { id:'p1', name:'Rehla Fleet', kind:'3PL', logo:'RF', zones:'RYD-N, RYD-C, RYD-S', onTime:96, accept:88, avgPickup:11,
      price:'SAR 14.00 base + SAR 1.20/km', since:'29 Aug 2026', status:'Connected', vehicles:'Bikes, cars, vans',
      caps:['Same day','Chilled','Cash on delivery'], note:'240 drivers. Strongest in the north.' },
    { id:'p2', name:'Sahel Logistics', kind:'3PL', logo:'SL', zones:'RYD-E, RYD-S', onTime:92, accept:81, avgPickup:16,
      price:'SAR 12.50 flat, zone-capped', since:'3 Feb 2026', status:'Connected', vehicles:'Cars, vans',
      caps:['Same day','Bulk','Returns'], note:'Cheapest for bulk east of the ring road.' },
    { id:'p3', name:'Nuqta Express', kind:'3PL', logo:'NX', zones:'RYD-C, RYD-W', onTime:89, accept:76, avgPickup:19,
      price:'SAR 11.00 flat', since:'—', status:'Available', vehicles:'Bikes',
      caps:['Same day'], note:'Bikes only. Small parcels under 5 kg.' },
    { id:'p4', name:'Tayar Delivery', kind:'3PL', logo:'TD', zones:'All Riyadh, Jeddah', onTime:94, accept:85, avgPickup:14,
      price:'SAR 15.00 base + SAR 0.90/km', since:'—', status:'Requested', vehicles:'Bikes, cars, refrigerated',
      caps:['Same day','Scheduled','Chilled','Returns'], note:'Requested 27 Aug — awaiting their approval.' },
    { id:'p5', name:'Barq Riyadh', kind:'3PL', logo:'BR', zones:'RYD-N', onTime:97, accept:90, avgPickup:9,
      price:'SAR 17.00 base + SAR 1.40/km', since:'—', status:'Available', vehicles:'Bikes, cars',
      caps:['Same day','Chilled','Cash on delivery'], note:'Fastest pickup in the north, priced accordingly.' }
  ];

  /* Epic 10 — dispatch configuration. Merchant wide first; a branch may carry its own rule. */
  const DISPATCH = {
    mode: 'Pool of connected 3PLs',   // 'Dash Network only' | 'Specific 3PL' | 'Manual assignment' | 'Pool of connected 3PLs'
    specific: 'Rehla Fleet',
    poolOrder: ['p1','p0','p2'],
    poolBehaviour: 'Priority order I set',  // or 'Let Dash optimise'
    fallback: 'Fall back to Dash Network',  // 'Fall back to next in pool' | 'Fail back to me'
    fallbackAfter: 5,
    /* branch id → its own rule. A branch missing here follows the merchant default. */
    branchRules: {
      b3: { mode:'Specific 3PL', specific:'Sahel Logistics', fallback:'Fall back to Dash Network', fallbackAfter:4,
            why:'Olaya sits inside Sahel’s cheapest zone', by:'Omar Sabri · 18 Aug 2026' },
      b4: { mode:'Dash Network only', fallback:'Fall back to Dash Network', fallbackAfter:5,
            why:'Reduced hours — nobody on site to steer a provider', by:'Rana Al Zahrani · 2 Sep 2026' }
    }
  };

  /* The rule an order from this branch is actually dispatched by. */
  function dispatchFor(bid) {
    const r = DISPATCH.branchRules[bid];
    return Object.assign({}, DISPATCH, r || {}, { own: !!r, src: r ? 'Branch rule' : 'Merchant default' });
  }

  const INTEGRATIONS = [
    { id:'i1', n:'Salla', kind:'Platform connector', status:'Connected', synced:'12 s ago', orders:1284, health:'Healthy',
      note:'Orders arrive the moment a customer checks out.' },
    { id:'i2', n:'Shopify', kind:'Platform connector', status:'Connected', synced:'40 s ago', orders:612, health:'Healthy',
      note:'Second storefront — Kanz Pantry.' },
    { id:'i3', n:'Zid', kind:'Platform connector', status:'Available', synced:'—', orders:0, health:'—', note:'Not connected.' },
    { id:'i4', n:'Taker', kind:'Platform connector', status:'Available', synced:'—', orders:0, health:'—', note:'Not connected.' },
    { id:'i5', n:'Kanz ERP', kind:'API integration', status:'Connected', synced:'2 min ago', orders:428, health:'Degraded',
      note:'3 webhook retries in the last hour — check your endpoint.' },
    { id:'i6', n:'Manual entry', kind:'Dashboard', status:'Always on', synced:'—', orders:96, health:'Healthy',
      note:'Phone orders and walk-ins typed in by staff.' }
  ];

  const CUSTOMERS = [
    { id:'c1', name:'Layla A.', phone:'+966 50 220 1188', email:'layla@example.com', orders:34, success:97, spend:642, flagged:false,
      addrs:['Al Yasmin, block 4 — home','Olaya, Tahlia St — office'], note:'', last:'Today 15:41' },
    { id:'c2', name:'Hassan M.', phone:'+966 55 771 4420', email:'hassan@example.com', orders:12, success:83, spend:214, flagged:true,
      addrs:['Al Malaz, King Abdullah Rd'], note:'Two refused deliveries — call before dispatch.', last:'Today 15:12' },
    { id:'c3', name:'Reem S.', phone:'+966 53 118 9902', email:'reem@example.com', orders:61, success:99, spend:1188, flagged:false,
      addrs:['Olaya, Tahlia St — leave with reception'], note:'Leave with reception.', last:'Today 15:04' },
    { id:'c4', name:'Faisal K.', phone:'+966 58 993 3315', email:'faisal@example.com', orders:8, success:88, spend:142, flagged:false,
      addrs:['Al Malqa, Anas Ibn Malik Rd'], note:'', last:'Yesterday 19:22' },
    { id:'c5', name:'Nouf B.', phone:'+966 51 664 7712', email:'nouf@example.com', orders:23, success:95, spend:410, flagged:false,
      addrs:['Hittin, block 12'], note:'Prefers evening slots.', last:'Yesterday 18:04' }
  ];

  const STATUS = {
    'Awaiting provider':{ c:PAL.lemon, step:0 },
    'Assigned':         { c:PAL.lemon, step:1 },
    'To pickup':        { c:PAL.peach, step:2 },
    'Picked up':        { c:PAL.lav,   step:3 },
    'To delivery':      { c:PAL.lav,   step:4 },
    'At delivery':      { c:PAL.vodka, step:5 },
    'Delivered':        { c:'#1f8a4c', step:6 },
    'Cancelled':        { c:PAL.tang,  step:-1 },
    'Returned':         { c:PAL.tang,  step:-1 }
  };
  const FLOW = ['Assigned','To pickup','Picked up','To delivery','At delivery','Delivered'];

  const ORDERS = [
    { id:'DX-41090', ref:'ERP-4408', elapsed:'68m', late:true, branch:'b3', customer:'c3', status:'To delivery', type:'On demand',
      source:'Kanz ERP', provider:'p2', driver:'Saad Al Amri', driverPhone:'+966 54 108 9932', vehicle:'Motorcycle RYD 8125',
      created:'14:40', eta:'15:35', cod:0, charge:17.00, items:'1 bag · 2.0 kg', pod:['Photo'],
      instr:'', pickup:[24.6944,46.6853], drop:[24.7101,46.6690], prio:'Normal',
      log:[{ t:'14:40', e:'Order received', s:'API · Kanz ERP' },
           { t:'14:42', e:'Accepted by Sahel Logistics', s:'Saad Al Amri' },
           { t:'15:03', e:'Picked up', s:'' },
           { t:'15:11', e:'To delivery', s:'ETA 15:35' }] },
    { id:'DX-41085', ref:'SALLA-8845', elapsed:'53m', failed:true, branch:'b1', customer:'c4', status:'At delivery', type:'On demand',
      source:'Salla', provider:'p1', driver:'Faisal Al Harbi', driverPhone:'+966 50 118 4402', vehicle:'Motorcycle RYD 4821',
      created:'14:55', eta:'15:44', cod:0, charge:18.00, items:'1 bag · 1.6 kg', pod:['Photo'],
      instr:'Third floor, no lift.', pickup:[24.8232,46.6089], drop:[24.8340,46.6011], prio:'Normal',
      log:[{ t:'14:55', e:'Order received', s:'Salla connector · Kanz — Hittin' },
           { t:'14:57', e:'Accepted by Rehla Fleet', s:'Faisal Al Harbi' },
           { t:'15:29', e:'At delivery', s:'Geofence confirmed' },
           { t:'15:41', e:'Delivery failed — nobody answered', s:'Awaiting your decision · reattempt or return' }] },
    { id:'DX-41080', ref:'SHOP-2206', elapsed:'32m', stuck:22, branch:'b2', customer:'c5', status:'Assigned', type:'On demand',
      source:'Shopify', provider:'p1', driver:null, driverPhone:null, vehicle:null,
      created:'15:16', eta:'16:00', cod:0, charge:19.00, items:'2 bags · 4.2 kg', pod:['Photo'],
      instr:'', pickup:[24.8480,46.6390], drop:[24.8390,46.6520], prio:'Normal',
      log:[{ t:'15:16', e:'Order received', s:'Shopify connector · Kanz Pantry' },
           { t:'15:17', e:'Accepted by Rehla Fleet', s:'Driver to be named' },
           { t:'15:17', e:'No update since', s:'22 min without a status change' }] },
    { id:'DX-41077', ref:'SALLA-8841', elapsed:'7m', branch:'b1', customer:'c1', status:'To delivery', type:'On demand',
      source:'Salla', provider:'p1', driver:'Faisal Al Harbi', driverPhone:'+966 50 118 4402', vehicle:'Motorcycle RYD 4821',
      created:'15:41', eta:'16:12', cod:0, charge:18.40, items:'2 bags · 6.2 kg', pod:['Photo'],
      instr:'Call on arrival, gate code 4471', pickup:[24.8232,46.6089], drop:[24.8471,46.6338], prio:'Normal',
      log:[{ t:'15:41', e:'Order received', s:'Salla connector · Kanz — Hittin' },
           { t:'15:41', e:'Sent to provider pool', s:'Priority order: Rehla Fleet → Dash Network → Sahel' },
           { t:'15:42', e:'Accepted by Rehla Fleet', s:'Driver Faisal Al Harbi · 1.8 km away' },
           { t:'15:58', e:'Picked up', s:'' },
           { t:'16:03', e:'To delivery', s:'' }] },
    { id:'DX-41074', ref:'SALLA-8839', elapsed:'4m', fellThrough:'Rehla Fleet', branch:'b2', customer:'c2', status:'Awaiting provider', type:'On demand',
      source:'Salla', provider:null, driver:null, driverPhone:null, vehicle:null,
      created:'15:44', eta:'16:28', cod:64, charge:16.00, items:'1 bag · 2.1 kg', pod:['Photo','OTP'],
      instr:'Customer flagged — confirm before dispatch.', pickup:[24.8480,46.6390], drop:[24.8601,46.6222], prio:'High',
      log:[{ t:'15:44', e:'Order received', s:'Salla connector · Kanz — Al Yasmin' },
           { t:'15:44', e:'Offered to Rehla Fleet', s:'No driver in radius' },
           { t:'15:46', e:'Offered to Dash Network', s:'Routing — 6 candidates' }] },
    { id:'DX-41068', ref:'ERP-4402', elapsed:'44m', branch:'b3', customer:'c3', status:'At delivery', type:'On demand',
      source:'Kanz ERP', provider:'p0', driver:'Rakan Al Zahrani (freelancer)', driverPhone:'+966 51 445 7730', vehicle:'Motorcycle RYD 7302',
      created:'15:04', eta:'15:52', cod:0, charge:19.50, items:'1 bag · 1.8 kg', pod:['Photo'],
      instr:'Leave with reception.', pickup:[24.6944,46.6853], drop:[24.7062,46.6741], prio:'Normal',
      log:[{ t:'15:04', e:'Order received', s:'API · Kanz ERP' },
           { t:'15:05', e:'Sent to Dash Network', s:'Rehla declined — fallback engaged' },
           { t:'15:07', e:'Accepted by a Dash freelancer', s:'Rakan Al Zahrani' },
           { t:'15:22', e:'Picked up', s:'' },
           { t:'15:47', e:'At delivery', s:'Geofence confirmed' }] },
    { id:'DX-41061', ref:'MANUAL-311', elapsed:'50m', assignAt:'18:10', branch:'b1', customer:'c4', status:'Assigned', type:'Scheduled',
      source:'Manual entry', provider:'p2', driver:'Bandar Al Otaibi', driverPhone:'+966 56 771 3390', vehicle:'Van RYD 9930',
      created:'14:58', eta:'18:30', cod:0, charge:26.00, items:'4 boxes · 18.0 kg', pod:['Photo','Signature'],
      instr:'Van required. Reception closes 19:00.', pickup:[24.8232,46.6089], drop:[24.8352,46.6270], prio:'Normal',
      log:[{ t:'14:58', e:'Order created', s:'Manual entry · Yasser Al Otaibi' },
           { t:'14:59', e:'Assigned to Sahel Logistics', s:'Bulk — only provider with vans free' },
           { t:'18:10', e:'Driver assigned', s:'Bandar Al Otaibi · scheduled 20 min before' }] },
    { id:'DX-41055', ref:'SHOP-2201', elapsed:'15m', branch:'b2', customer:'c5', status:'Picked up', type:'On demand',
      source:'Shopify', provider:'p1', driver:'Nawaf Al Ghamdi', driverPhone:'+966 57 889 2201', vehicle:'Car RYD 1178',
      created:'15:33', eta:'16:05', cod:150, charge:20.50, items:'2 bags · 5.0 kg', pod:['Photo'],
      instr:'', pickup:[24.8480,46.6390], drop:[24.8601,46.6222], prio:'Normal',
      log:[{ t:'15:33', e:'Order received', s:'Shopify connector · Kanz Pantry' },
           { t:'15:34', e:'Accepted by Rehla Fleet', s:'Nawaf Al Ghamdi · 2.4 km' },
           { t:'15:51', e:'Picked up', s:'COD SAR 150 to collect' }] },
    { id:'DX-41042', ref:'SALLA-8831', branch:'b4', customer:'c1', status:'Delivered', type:'On demand',
      source:'Salla', provider:'p1', driver:'Faisal Al Harbi', driverPhone:'+966 50 118 4402', vehicle:'Motorcycle RYD 4821',
      created:'14:51', eta:'15:40', cod:0, charge:18.00, items:'1 bag · 2.4 kg', pod:['Photo'],
      instr:'', pickup:[24.8205,46.6102], drop:[24.8118,46.6208], prio:'Normal',
      log:[{ t:'14:51', e:'Order received', s:'Salla connector · Kanz — Al Malqa' },
           { t:'14:52', e:'Accepted by Rehla Fleet', s:'Faisal Al Harbi' },
           { t:'15:08', e:'Picked up', s:'' },
           { t:'15:36', e:'Delivered', s:'Photo captured · 4 min early' }] },
    { id:'DX-41020', ref:'ERP-4388', branch:'b3', customer:'c3', status:'Delivered', type:'On demand',
      source:'Kanz ERP', provider:'p0', driver:'Turki Al Dosari', driverPhone:'+966 50 663 8821', vehicle:'Car RYD 3387',
      created:'13:10', eta:'13:55', cod:0, charge:17.50, items:'1 box · 4.1 kg', pod:['Photo'],
      instr:'', pickup:[24.6944,46.6853], drop:[24.7062,46.6741], prio:'Normal',
      log:[{ t:'13:10', e:'Order received', s:'API · Kanz ERP' },
           { t:'13:11', e:'Accepted via Dash Network', s:'Rehla Fleet driver' },
           { t:'13:49', e:'Delivered', s:'Photo captured' }] },
    { id:'DX-40998', ref:'SALLA-8820', branch:'b1', customer:'c2', status:'Returned', type:'On demand',
      source:'Salla', provider:'p2', driver:'Saad Al Amri', driverPhone:'+966 54 108 9932', vehicle:'Motorcycle RYD 8125',
      created:'12:44', eta:'13:20', cod:48, charge:16.00, items:'1 bag · 1.9 kg', pod:['Photo'],
      instr:'', pickup:[24.8232,46.6089], drop:[24.8071,46.6035], prio:'Normal',
      log:[{ t:'12:44', e:'Order received', s:'Salla connector' },
           { t:'12:45', e:'Accepted by Sahel Logistics', s:'' },
           { t:'13:14', e:'Failed — customer unreachable', s:'Reattempt 1 of 2' },
           { t:'13:38', e:'Returned to Kanz — Hittin', s:'Auto-return · you were not charged for delivery' }] },
    { id:'DX-40977', ref:'MANUAL-308', branch:'b4', customer:'c4', status:'Cancelled', type:'On demand',
      source:'Manual entry', provider:null, driver:null, driverPhone:null, vehicle:null,
      created:'11:52', eta:'—', cod:0, charge:0, items:'Chilled · 0.8 kg', pod:['Photo'],
      instr:'', pickup:[24.8205,46.6102], drop:[24.8290,46.6180], prio:'Normal',
      log:[{ t:'11:52', e:'Order created', s:'Manual entry · Rana Al Zahrani' },
           { t:'11:58', e:'Cancelled by you', s:'Reason: item out of stock · no charge' }] },
    { id:'DX-40951', ref:'SHOP-2194', branch:'b2', customer:'c5', status:'Delivered', type:'Scheduled',
      source:'Shopify', provider:'p0', driver:'Rakan Al Zahrani (freelancer)', driverPhone:'+966 51 445 7730', vehicle:'Motorcycle RYD 7302',
      created:'09:22', eta:'11:00', cod:80, charge:23.00, items:'2 bags · 4.6 kg', pod:['Photo','OTP'],
      instr:'', pickup:[24.8480,46.6390], drop:[24.8601,46.6222], prio:'Normal',
      log:[{ t:'09:22', e:'Order received', s:'Shopify connector' },
           { t:'10:40', e:'Assigned via Dash Network', s:'Scheduled · 20 min before slot' },
           { t:'10:56', e:'Delivered', s:'Photo and code captured · COD SAR 80' }] }
  ];

  const WALLET = {
    balance: 3420, autoTop:'SAR 4,000 when below SAR 800', lastTop:'22 Aug · SAR 6,000',
    monthSpend: 21860, monthOrders: 1396, avgOrder: 15.66,
    tx: [
      { d:'Today 15:42', t:'Delivery — DX-41077 · Rehla Fleet', a:-18.40 },
      { d:'Today 15:34', t:'Delivery — DX-41055 · Rehla Fleet', a:-20.50 },
      { d:'Today 15:07', t:'Delivery — DX-41068 · Dash Network', a:-19.50 },
      { d:'Today 13:38', t:'Return — DX-40998 · not charged', a:0 },
      { d:'22 Aug', t:'Wallet top-up', a:6000 },
      { d:'1 Aug', t:'Retail Growth subscription', a:-1400 }
    ],
    invoices: [
      { id:'INV-2026-08', period:'August 2026', amount:23260, status:'Open' },
      { id:'INV-2026-07', period:'July 2026', amount:21480, status:'Paid' },
      { id:'INV-2026-06', period:'June 2026', amount:19940, status:'Paid' }
    ]
  };

  const PLANS = [
    { n:'Retail Starter', p:400, cap:'1 branch · 300 orders/mo', feats:['Dash Network dispatch','Manual and connector orders','Email support'] },
    { n:'Retail Growth', p:1400, cap:'5 branches · 3,000 orders/mo', feats:['Everything in Starter','3PL Marketplace and pools','API and webhooks','Control tower','Priority support'] },
    { n:'Retail Scale', p:null, cap:'Unlimited', feats:['Everything in Growth','Dedicated routing tuning','SLA and account manager'] }
  ];

  const NOTIFS = [
    { k:'Order', t:'DX-41074 has had no provider for 4 minutes — customer is flagged', d:'2 min ago', sev:'high', link:'#/control-tower' },
    { k:'Integration', t:'Kanz ERP webhook retried 3 times — your endpoint returned 500', d:'18 min ago', sev:'high', link:'#/integrations' },
    { k:'Provider', t:'Tayar Delivery has not answered your connection request', d:'2 days ago', sev:'med', link:'#/marketplace' },
    { k:'Branch', t:'Kanz — Al Malqa is on reduced hours and running 41 min average', d:'1 h ago', sev:'med', link:'#/branches' },
    { k:'Wallet', t:'Balance SAR 3,420 — auto top-up at SAR 800', d:'3 h ago', sev:'low', link:'#/billing' },
    { k:'Return', t:'DX-40998 returned to Hittin — you were not charged', d:'2 h ago', sev:'med', link:'#/orders/DX-40998' },
    { k:'System', t:'Salla connector updated — order notes now sync', d:'26 Aug', sev:'low', link:'#/integrations' }
  ];

  const AUDIT = [
    { t:'15:44', u:'Salla connector', r:'System', a:'Created order', o:'DX-41074', ip:'—' },
    { t:'15:20', u:'Sara Al Fahad', r:'Admin', a:'Changed dispatch mode', o:'Specific 3PL → Pool of connected 3PLs', ip:'188.55.x.x' },
    { t:'15:02', u:'Sara Al Fahad', r:'Admin', a:'Reordered provider pool', o:'Rehla → Dash Network → Sahel', ip:'188.55.x.x' },
    { t:'14:58', u:'Yasser Al Otaibi', r:'Branch Manager', a:'Created order', o:'DX-41061 · Hittin', ip:'94.98.x.x' },
    { t:'13:40', u:'Noura Al Saleh', r:'Finance', a:'Exported spending report', o:'Aug 1–29 · CSV', ip:'94.98.x.x' },
    { t:'11:58', u:'Rana Al Zahrani', r:'Branch Manager', a:'Cancelled order', o:'DX-40977 · out of stock', ip:'94.98.x.x' },
    { t:'09:15', u:'Sara Al Fahad', r:'Admin', a:'Requested connection', o:'Tayar Delivery', ip:'188.55.x.x' },
    { t:'08:40', u:'Sara Al Fahad', r:'Admin', a:'Rotated API key', o:'dsh_live_2b09', ip:'188.55.x.x' }
  ];

  const TICKETS = [
    { id:'TK-3312', s:'Open', p:'High', t:'Sahel returned DX-40998 without calling the customer', link:'DX-40998', opened:'Today 14:02', last:'Dash replied 14:40', kind:'Report a 3PL' },
    { id:'TK-3305', s:'Pending', p:'Normal', t:'Salla orders missing the delivery note field', link:'Salla', opened:'Yesterday', last:'Awaiting Dash', kind:'Technical' },
    { id:'TK-3288', s:'Resolved', p:'Normal', t:'Charged twice for DX-40640', link:'Billing', opened:'24 Aug', last:'Refunded 25 Aug', kind:'Billing' }
  ];

  const REPORTS = {
    week: [
      { d:'Sun', orders:186, onTime:95, avg:33, spend:2910 },
      { d:'Mon', orders:204, onTime:96, avg:31, spend:3190 },
      { d:'Tue', orders:191, onTime:94, avg:34, spend:2990 },
      { d:'Wed', orders:228, onTime:92, avg:36, spend:3570 },
      { d:'Thu', orders:266, onTime:90, avg:38, spend:4160 },
      { d:'Fri', orders:172, onTime:97, avg:29, spend:2690 },
      { d:'Sat', orders:213, onTime:96, avg:32, spend:3350 }
    ],
    scheduled: [
      { n:'Daily order summary', to:'ops@kanzmarket.sa', when:'Every day 23:45', fmt:'PDF' },
      { n:'Weekly branch performance', to:'sara@kanzmarket.sa', when:'Sunday 08:00', fmt:'CSV' },
      { n:'Monthly spending', to:'finance@kanzmarket.sa', when:'1st of the month', fmt:'PDF' },
      { n:'SLA performance and missed promises', to:'sara@kanzmarket.sa', when:'Sunday 08:00', fmt:'Excel' },
      { n:'Failures and root cause', to:'ops@kanzmarket.sa', when:'Sunday 08:00', fmt:'PDF' },
      { n:'Settlement and reconciliation', to:'finance@kanzmarket.sa', when:'Monday 07:00', fmt:'Excel' }
    ]
  };

  return { PAL, BIZ, CITIES, BRANCHES, PROVIDERS, DISPATCH, INTEGRATIONS, CUSTOMERS, STATUS, FLOW, ORDERS,
           WALLET, PLANS, NOTIFS, AUDIT, TICKETS, REPORTS,
           dispatchFor,
           branch: id => BRANCHES.find(b => b.id === id),
           prov: id => PROVIDERS.find(p => p.id === id),
           customer: id => CUSTOMERS.find(c => c.id === id),
           order: id => ORDERS.find(o => o.id === id) };
})();
