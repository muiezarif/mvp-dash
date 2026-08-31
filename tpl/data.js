/* Dash 3PL — Sahel Logistics. External delivery company running its own system.
   Dash is a window: read only everywhere except the commercial layer. */
window.TPL = (function () {
  const PAL = { peach:'#FFCC99', tang:'#FCA38B', lemon:'#FFEE50', lav:'#C0D2FF', flax:'#E5E57C', vodka:'#BDB9EF' };

  const BIZ = {
    legal:'Sahel Logistics Company', name:'Sahel Logistics', kind:'Third party logistics',
    cr:'1010xxxx92', vat:'3007xxxxxx0003', site:'sahel-logistics.sa', email:'ops@sahel-logistics.sa',
    city:'Riyadh', hq:'Al Malaz, Riyadh 11564', fleet:'180 drivers · cars and vans',
    verified:'3 Feb 2026', plan:'Provider Standard',
    ownSystem:'Sahel OMS v4', desc:'Cars and vans across east and south Riyadh. Bulk, same-day and returns. Cheapest per kilo east of the ring road.'
  };

  /* Everything here arrived from Dash. Sahel fulfils it in their own OMS. */
  const SOURCES = { Direct:'Direct', Marketplace:'Marketplace', Network:'Dash Network' };

  const CITIES = ['Riyadh'];
  const ZONE_GEO = {"Zone North":["Riyadh","Al Malqa"],"Zone East":["Riyadh","Al Naseem"],"Zone Central":["Riyadh","Olaya"],"Zone West":["Riyadh","Al Yasmin"],"Zone South":["Riyadh","Al Aziziyah"]};

  const MERCHANTS = [
    { id:'m1', name:'Kanz Market', logo:'KM', kind:'Marketplace', rel:'Commercial', since:'3 Feb 2026',
      branches:4, volume:26, orders:198, onTime:92, avgMin:36, revenue:3160, cancel:2.4,
      contract:{ pricing:'SAR 12.50 flat, zone-capped', terms:'Net 30', start:'2026-02-03', end:'2027-02-02', status:'Active', minMonthly:'SAR 8,000' },
      note:'Acquired through your Marketplace listing. You set the pricing with them directly.' },
    { id:'m2', name:'Almasa Foods', logo:'AF', kind:'Marketplace', rel:'Commercial', since:'14 Apr 2026',
      branches:12, volume:74, orders:512, onTime:94, avgMin:33, revenue:8240, cancel:1.8,
      contract:{ pricing:'SAR 11.80 flat + SAR 3.00 bulk surcharge', terms:'Net 15', start:'2026-04-14', end:'2027-04-13', status:'Active', minMonthly:'SAR 20,000' },
      note:'Your largest merchant. Bulk grocery runs, mostly Zone East.' },
    { id:'m3', name:'Tamra Pharmacy', logo:'TP', kind:'Marketplace', rel:'Commercial', since:'8 Jun 2026',
      branches:3, volume:14, orders:104, onTime:89, avgMin:39, revenue:1420, cancel:3.6,
      contract:{ pricing:'SAR 14.00 base + SAR 1.00/km', terms:'Net 15', start:'2026-06-08', end:'2026-12-07', status:'Expiring', minMonthly:'None' },
      note:'Contract expires in 100 days. Chilled handling is priced separately.' },
    { id:'m4', name:'Shawarmer', logo:'SH', kind:'Network', rel:'Auto generated', since:'—',
      branches:1, volume:9, orders:62, onTime:91, avgMin:31, revenue:840, cancel:2.1,
      contract:null,
      note:'You have no contract with them. These orders reached you through Dash Network — Dash prices them, not you.' },
    { id:'m5', name:'Nuqta', logo:'NQ', kind:'Network', rel:'Auto generated', since:'—',
      branches:2, volume:5, orders:38, onTime:88, avgMin:42, revenue:510, cancel:4.2,
      contract:null,
      note:'Network origin. Profile built entirely from order data.' },
    { id:'m6', name:'Bayt Market', logo:'BM', kind:'Marketplace', rel:'Request', since:'—',
      branches:2, volume:28, orders:0, onTime:0, avgMin:0, revenue:0, cancel:0,
      contract:null,
      note:'Asked to connect 27 August. Review their profile, then approve or reject with a reason.' }
  ];

  /* Auto-generated from order data — Sahel's own drivers, seen through Dash */
  const DRIVERS = [
    { id:'d1', name:'Majed Al Shammari', phone:'+966 59 337 4410', vehicle:'Van · RYD 5590',
      orders:142, completion:97, avgMin:38, cancel:1.1, late:4, flagged:false, first:'3 Feb 2026', last:'Today 15:31' },
    { id:'d2', name:'Ahmed Salem', phone:'+966 58 224 6612', vehicle:'Car · RYD 6612',
      orders:96, completion:90, avgMin:33, cancel:4.2, late:11, flagged:true, first:'14 Apr 2026', last:'Today 15:44',
      flagNote:'Three unexplained returns in August. Raised with your operations team on 26 Aug.' },
    { id:'d3', name:'Saad Al Amri', phone:'+966 54 108 9932', vehicle:'Car · RYD 8125',
      orders:78, completion:92, avgMin:36, cancel:2.8, late:7, flagged:false, first:'8 Jun 2026', last:'Today 14:12' },
    { id:'d4', name:'Bandar Al Otaibi', phone:'+966 56 771 3390', vehicle:'Van · RYD 9930',
      orders:164, completion:98, avgMin:41, cancel:0.9, late:3, flagged:false, first:'3 Feb 2026', last:'Today 15:02' },
    { id:'d5', name:'Turki Al Dosari', phone:'+966 50 663 8821', vehicle:'Car · RYD 3387',
      orders:58, completion:96, avgMin:30, cancel:1.7, late:2, flagged:false, first:'20 Jul 2026', last:'Yesterday 22:40' }
  ];

  const CUSTOMERS = [
    { id:'c1', name:'Layla A.', phone:'+966 50 220 1188', orders:22, success:97, flagged:false, merchants:'Kanz Market, Tamra', last:'Today 15:41', note:'' },
    { id:'c2', name:'Hassan M.', phone:'+966 55 771 4420', orders:9, success:78, flagged:true, merchants:'Kanz Market', last:'Today 13:38', note:'Two refused deliveries and one unreachable. Kanz flags them too.' },
    { id:'c3', name:'Reem S.', phone:'+966 53 118 9902', orders:41, success:99, flagged:false, merchants:'Almasa Foods, Nuqta', last:'Today 15:04', note:'' },
    { id:'c4', name:'Faisal K.', phone:'+966 58 993 3315', orders:6, success:83, flagged:false, merchants:'Shawarmer', last:'Yesterday 19:22', note:'' }
  ];

  const STATUS = {
    'Received':     { c:PAL.lemon, step:0 },
    'Accepted':     { c:PAL.lemon, step:1 },
    'Picked up':    { c:PAL.lav,   step:2 },
    'In transit':   { c:PAL.lav,   step:3 },
    'Delivered':    { c:'#1f8a4c', step:4 },
    'Cancelled':    { c:PAL.tang,  step:-1 },
    'Returned':     { c:PAL.tang,  step:-1 },
    'Declined':     { c:PAL.tang,  step:-1 }
  };
  const FLOW = ['Accepted','Picked up','In transit','Delivered'];

  const ORDERS = [
    { id:'DX-41099', ref:'SAHEL-77216', elapsed:'71m', late:true, merchant:'m3', customer:'c1', source:'Direct', status:'In transit',
      type:'On demand', driver:'d2', created:'14:37', eta:'15:30', cod:0, revenue:22.50, items:'2 boxes · 7.4 kg',
      pod:['Photo'], zone:'Zone Central', instr:'',
      pickup:[24.6944,46.6853], drop:[24.7101,46.6690], addr:'Olaya, tower 4',
      log:[{ t:'14:37', e:'Order received', s:'Direct contract · Tamra Pharmacy' },
           { t:'14:39', e:'Accepted in Sahel OMS', s:'Nasser Al Qahtani' },
           { t:'15:02', e:'Picked up', s:'' },
           { t:'15:09', e:'In transit', s:'ETA 15:30 — now overdue' }] },
    { id:'DX-41096', ref:'SAHEL-77214', elapsed:'38m', stuck:26, merchant:'m2', customer:'c2', source:'Marketplace', status:'Picked up',
      type:'On demand', driver:'d3', created:'15:10', eta:'15:55', cod:75, revenue:20.00, items:'1 bag · 2.8 kg',
      pod:['Photo','OTP'], zone:'Zone East', instr:'Collect SAR 75 in cash.',
      pickup:[24.8480,46.6390], drop:[24.8390,46.6520], addr:'Al Naseem, block 7',
      log:[{ t:'15:10', e:'Order received', s:'Marketplace contract · Almasa Foods' },
           { t:'15:12', e:'Accepted in Sahel OMS', s:'Turki Al Dosari' },
           { t:'15:22', e:'Picked up', s:'No status pushed since' }] },
    { id:'DX-41092', ref:'—', elapsed:'6m', noResponse:true, merchant:'m5', customer:'c3', source:'Network', status:'Received',
      type:'On demand', driver:null, created:'15:42', eta:'16:25', cod:0, revenue:15.40, items:'1 bag · 1.4 kg',
      pod:['Photo'], zone:'Zone West', instr:'',
      pickup:[24.8188,46.6151], drop:[24.8299,46.5977], addr:'Al Yasmin, gate 2',
      log:[{ t:'15:42', e:'Offered by Dash Network', s:'Supply role · 4 min to accept' },
           { t:'15:46', e:'Response window closed', s:'Not accepted in your system — Dash is rerouting' }] },
    { id:'DX-41061', ref:'SAHEL-77201', elapsed:'50m', assignAt:'18:10', merchant:'m1', customer:'c4', source:'Marketplace', status:'Accepted',
      type:'Scheduled', driver:'d4', created:'14:58', eta:'18:30', cod:0, revenue:26.00, items:'4 boxes · 18.0 kg',
      pod:['Photo','Signature'], zone:'Zone North', instr:'Van required. Reception closes 19:00.',
      pickup:[24.8232,46.6089], drop:[24.8352,46.6270], addr:'Hittin, block 9',
      log:[{ t:'14:59', e:'Order received from Dash', s:'Marketplace · Kanz Market' },
           { t:'14:59', e:'Pulled into Sahel OMS', s:'API · order.created webhook' },
           { t:'18:10', e:'Accepted · driver assigned in your system', s:'Bandar Al Otaibi · van' }] },
    { id:'DX-41088', ref:'SAHEL-77208', elapsed:'17m', merchant:'m2', customer:'c3', source:'Marketplace', status:'In transit',
      type:'On demand', driver:'d1', created:'15:31', eta:'16:09', cod:60, revenue:21.00, items:'1 bag · 2.2 kg',
      pod:['Photo','OTP'], zone:'Zone East', instr:'Collect SAR 60 in cash.',
      pickup:[24.6749,46.7362], drop:[24.6612,46.7488], addr:'Al Malaz, block 7',
      log:[{ t:'15:31', e:'Order received from Dash', s:'Marketplace · Almasa Foods' },
           { t:'15:32', e:'Accepted in Sahel OMS', s:'Majed Al Shammari' },
           { t:'15:44', e:'Picked up', s:'COD SAR 60 to collect' },
           { t:'15:52', e:'In transit', s:'Status pushed to Dash via API' }] },
    { id:'DX-41094', ref:'SAHEL-77212', elapsed:'2m', merchant:'m4', customer:'c4', source:'Network', status:'Received',
      type:'On demand', driver:null, created:'15:46', eta:'16:30', cod:48, revenue:16.80, items:'1 bag · 1.9 kg',
      pod:['Photo'], zone:'Zone East', instr:'',
      pickup:[24.8188,46.6151], drop:[24.8299,46.5977], addr:'Al Malqa, block 3',
      log:[{ t:'15:46', e:'Offered by Dash Network', s:'Supply role · you have 4 min to accept' }] },
    { id:'DX-41068', ref:'SAHEL-77205', merchant:'m3', customer:'c3', source:'Marketplace', status:'Delivered',
      type:'On demand', driver:'d3', created:'15:04', eta:'15:52', cod:0, revenue:19.50, items:'Chilled · 1.2 kg',
      pod:['Photo','OTP'], zone:'Zone Central', instr:'Chilled — do not leave in the vehicle.',
      pickup:[24.6944,46.6853], drop:[24.7062,46.6741], addr:'Olaya, Tahlia St',
      log:[{ t:'15:04', e:'Order received from Dash', s:'Marketplace · Tamra Pharmacy' },
           { t:'15:05', e:'Accepted in Sahel OMS', s:'Saad Al Amri' },
           { t:'15:22', e:'Picked up', s:'' },
           { t:'15:47', e:'Delivered', s:'Photo and code captured · pushed to Dash' }] },
    { id:'DX-41055', ref:'SAHEL-77199', merchant:'m2', customer:'c1', source:'Marketplace', status:'Delivered',
      type:'On demand', driver:'d1', created:'13:33', eta:'14:05', cod:150, revenue:20.50, items:'2 bags · 5.0 kg',
      pod:['Photo'], zone:'Zone East', instr:'',
      pickup:[24.6749,46.7362], drop:[24.6612,46.7488], addr:'Al Malaz, King Abdullah Rd',
      log:[{ t:'13:33', e:'Order received from Dash', s:'Marketplace · Almasa Foods' },
           { t:'13:34', e:'Accepted in Sahel OMS', s:'Majed Al Shammari' },
           { t:'13:58', e:'Delivered', s:'COD SAR 150 collected' }] },
    { id:'DX-41020', ref:'SAHEL-77188', merchant:'m5', customer:'c3', source:'Network', status:'Delivered',
      type:'On demand', driver:'d5', created:'13:10', eta:'13:55', cod:0, revenue:17.50, items:'1 box · 4.1 kg',
      pod:['Photo'], zone:'Zone Central', instr:'',
      pickup:[24.6944,46.6853], drop:[24.7062,46.6741], addr:'Olaya, Tahlia St',
      log:[{ t:'13:10', e:'Offered by Dash Network', s:'Supply role' },
           { t:'13:11', e:'Accepted in Sahel OMS', s:'Turki Al Dosari' },
           { t:'13:49', e:'Delivered', s:'' }] },
    { id:'DX-40998', ref:'SAHEL-77180', merchant:'m1', customer:'c2', source:'Marketplace', status:'Returned',
      type:'On demand', driver:'d2', created:'12:44', eta:'13:20', cod:48, revenue:8.00, items:'1 bag · 1.9 kg',
      pod:['Photo'], zone:'Zone North', instr:'',
      pickup:[24.8232,46.6089], drop:[24.8071,46.6035], addr:'Al Malqa, Anas Ibn Malik Rd',
      log:[{ t:'12:44', e:'Order received from Dash', s:'Marketplace · Kanz Market' },
           { t:'12:45', e:'Accepted in Sahel OMS', s:'Ahmed Salem' },
           { t:'13:14', e:'Failed — customer unreachable', s:'Reattempt 1 of 2' },
           { t:'13:38', e:'Returned to merchant', s:'Return leg charged at 50% · Kanz raised a ticket' }] },
    { id:'DX-40977', ref:'—', merchant:'m4', customer:'c4', source:'Network', status:'Declined',
      type:'On demand', driver:null, created:'11:52', eta:'—', cod:0, revenue:0, items:'Chilled · 0.8 kg',
      pod:['Photo'], zone:'Zone West', instr:'',
      pickup:[24.8205,46.6102], drop:[24.8290,46.6180], addr:'Al Malqa',
      log:[{ t:'11:52', e:'Offered by Dash Network', s:'Supply role' },
           { t:'11:55', e:'Declined by you', s:'Reason: no refrigerated vehicle available · no penalty' }] },
    { id:'DX-40951', ref:'SAHEL-77171', merchant:'m2', customer:'c1', source:'Marketplace', status:'Delivered',
      type:'Scheduled', driver:'d4', created:'09:22', eta:'11:00', cod:80, revenue:23.00, items:'2 bags · 4.6 kg',
      pod:['Photo','OTP'], zone:'Zone East', instr:'',
      pickup:[24.6749,46.7362], drop:[24.6612,46.7488], addr:'Al Malaz, block 12',
      log:[{ t:'09:22', e:'Order received from Dash', s:'Marketplace · Almasa Foods' },
           { t:'10:40', e:'Accepted in Sahel OMS', s:'Scheduled · 20 min before slot' },
           { t:'10:56', e:'Delivered', s:'COD SAR 80 collected' }] },
    { id:'DX-40912', ref:'SAHEL-77164', merchant:'m1', customer:'c2', source:'Direct', status:'Cancelled',
      type:'On demand', driver:null, created:'08:40', eta:'—', cod:0, revenue:0, items:'1 bag · 2.0 kg',
      pod:['Photo'], zone:'Zone North', instr:'',
      pickup:[24.8232,46.6089], drop:[24.8071,46.6035], addr:'Al Malqa',
      log:[{ t:'08:40', e:'Order received from Dash', s:'Direct · Kanz Market' },
           { t:'08:46', e:'Cancelled by merchant', s:'Reason: out of stock · not charged' }] }
  ];

  /* Overflow Sahel pushes back out — Demand role */
  const OVERFLOW = [
    { id:'DX-41031', merchant:'Almasa Foods', zone:'Zone West', sent:'14:02', reason:'No van free until 17:00',
      status:'Fulfilled', by:'Rehla Fleet', cost:14.60 },
    { id:'DX-41009', merchant:'Kanz Market', zone:'Zone West', sent:'12:18', reason:'Outside our coverage',
      status:'Fulfilled', by:'Dash freelancer', cost:13.20 },
    { id:'DX-40986', merchant:'Tamra Pharmacy', zone:'Zone North', sent:'11:04', reason:'Chilled, no refrigerated vehicle',
      status:'Fulfilled', by:'Rehla Fleet', cost:18.40 },
    { id:'DX-40940', merchant:'Almasa Foods', zone:'Zone East', sent:'09:31', reason:'Peak — all drivers on job',
      status:'Returned to you', by:'—', cost:0 }
  ];

  const NETWORK = {
    supply:{ state:'Active', on:true, joined:'3 Feb 2026', received:186, accepted:92, completed:96, declined:14,
             zones:'Zone East, Zone South, Zone Central', revenue:2980 },
    demand:{ state:'Active', on:true, joined:'20 Jul 2026', sent:48, fulfilled:94, avgAccept:'1.6 min', cost:684 }
  };

  const LISTING = {
    status:'Live', listed:true, submitted:'28 Jan 2026', approved:'3 Feb 2026', views:284, requests:6,
    zones:['Zone East','Zone South','Zone Central'],
    vehicles:['Car','Van','Refrigerated'],
    caps:['Same day','Scheduled','Bulk','Returns','Cash on delivery'],
    pricing:{ model:'Flat per order, zone-capped', base:'SAR 12.50', bulk:'+ SAR 3.00', min:'SAR 12.50' }
  };

  const BILLING = {
    plan:'Provider Standard', fee:600, balance:1240, autoTop:'SAR 2,000 when below SAR 400',
    earnedMonth:14170, payoutNext:'Sunday 30 August', payoutMethod:'Al Rajhi ••8820', commission:0.08,
    tx: [
      { d:'Today 15:52', t:'Order revenue — DX-41068 · Tamra', a:19.50 },
      { d:'Today 13:58', t:'Order revenue — DX-41055 · Almasa', a:20.50 },
      { d:'Today 13:49', t:'Network order revenue — DX-41020', a:17.50 },
      { d:'Today 13:38', t:'Return leg — DX-40998 (50%)', a:8.00 },
      { d:'Today 14:02', t:'Overflow cost — DX-41031 to Rehla', a:-14.60 },
      { d:'1 Aug', t:'Provider Standard subscription', a:-600 },
      { d:'24 Aug', t:'Payout to Al Rajhi ••8820', a:-11400 }
    ],
    invoices: [
      { id:'INV-2026-08', period:'August 2026', amount:1734, status:'Open', note:'Subscription + Dash commission on Network orders' },
      { id:'INV-2026-07', period:'July 2026', amount:1612, status:'Paid', note:'' },
      { id:'INV-2026-06', period:'June 2026', amount:1488, status:'Paid', note:'' }
    ]
  };

  const PLANS = [
    { n:'Provider Basic', p:0, cap:'Network orders only', feats:['Receive Dash Network orders','Read-only dashboard','8% Dash commission','Email support'] },
    { n:'Provider Standard', p:600, cap:'Network + Marketplace', feats:['Everything in Basic','Marketplace listing','Merchant contracts','API and webhooks','Analytics and exports','Priority support'] },
    { n:'Provider Plus', p:null, cap:'Unlimited', feats:['Everything in Standard','Lower commission tiers','Dedicated integration support','SLA and account manager'] }
  ];

  const NOTIFS = [
    { k:'Incoming order', t:'DX-41094 offered by Dash Network — 4 min to accept', d:'2 min ago', sev:'high', link:'#/orders/DX-41094' },
    { k:'Connection', t:'Bayt Market asked to connect — 28 orders/day, Zone Central', d:'2 days ago', sev:'high', link:'#/marketplace' },
    { k:'Overflow', t:'DX-40940 came back to you — nobody in the network took it', d:'6 h ago', sev:'med', link:'#/overflow' },
    { k:'Ticket', t:'Kanz Market raised a ticket about DX-40998', d:'2 h ago', sev:'med', link:'#/support' },
    { k:'Contract', t:'Tamra Pharmacy contract expires 7 December', d:'yesterday', sev:'med', link:'#/merchants/m3' },
    { k:'Driver', t:'Ahmed Salem — 3 unexplained returns this month', d:'3 days ago', sev:'med', link:'#/drivers/d2' },
    { k:'System', t:'order.declined webhook added to the API', d:'26 Aug', sev:'low', link:'#/developer' }
  ];

  const AUDIT = [
    { t:'15:46', u:'Dash Network', r:'System', a:'Offered order', o:'DX-41094', ip:'—' },
    { t:'15:20', u:'Faisal Al Mutairi', r:'Admin', a:'Updated contract pricing', o:'Almasa Foods · +SAR 3.00 bulk', ip:'188.55.x.x' },
    { t:'14:02', u:'Sahel OMS', r:'System', a:'Pushed order to Dash Network', o:'DX-41031 · overflow', ip:'—' },
    { t:'13:40', u:'Huda Al Nasser', r:'Finance', a:'Exported revenue report', o:'Aug 1–29 · CSV', ip:'94.98.x.x' },
    { t:'11:55', u:'Sahel OMS', r:'System', a:'Declined network order', o:'DX-40977 · no refrigerated vehicle', ip:'—' },
    { t:'10:12', u:'Faisal Al Mutairi', r:'Admin', a:'Flagged driver', o:'Ahmed Salem', ip:'188.55.x.x' },
    { t:'09:15', u:'Faisal Al Mutairi', r:'Admin', a:'Updated listing', o:'Added refrigerated vehicles', ip:'188.55.x.x' },
    { t:'08:40', u:'Omar Bakr', r:'Operations', a:'Viewed order', o:'DX-40912', ip:'94.98.x.x' }
  ];

  const TICKETS = [
    { id:'TK-4420', s:'Open', p:'High', t:'Kanz disputes the return leg charge on DX-40998', link:'DX-40998', opened:'Today 14:10', last:'Dash replied 14:52', kind:'Dispute' },
    { id:'TK-4412', s:'Pending', p:'Normal', t:'order.assigned webhook not firing for scheduled orders', link:'API', opened:'Yesterday', last:'Awaiting our logs', kind:'Technical' },
    { id:'TK-4398', s:'Resolved', p:'Normal', t:'Commission charged twice in July invoice', link:'Billing', opened:'22 Aug', last:'Credited 24 Aug', kind:'Billing' }
  ];

  const REPORTS = {
    week: [
      { d:'Sun', orders:42, onTime:93, avg:35, rev:672 },
      { d:'Mon', orders:48, onTime:94, avg:34, rev:768 },
      { d:'Tue', orders:44, onTime:92, avg:36, rev:704 },
      { d:'Wed', orders:56, onTime:90, avg:38, rev:896 },
      { d:'Thu', orders:64, onTime:88, avg:41, rev:1024 },
      { d:'Fri', orders:38, onTime:96, avg:31, rev:608 },
      { d:'Sat', orders:50, onTime:94, avg:33, rev:800 }
    ],
    zones: [
      { z:'Zone East', orders:412, onTime:94, avg:33, rev:6580 },
      { z:'Zone South', orders:246, onTime:92, avg:36, rev:3910 },
      { z:'Zone Central', orders:198, onTime:90, avg:38, rev:3140 },
      { z:'Zone North', orders:44, onTime:87, avg:44, rev:700 },
      { z:'Zone West', orders:14, onTime:82, avg:48, rev:224 }
    ],
    scheduled: [
      { n:'Daily Dash order summary', to:'ops@sahel-logistics.sa', when:'Every day 23:45', fmt:'PDF' },
      { n:'Weekly merchant performance', to:'faisal@sahel-logistics.sa', when:'Sunday 08:00', fmt:'CSV' },
      { n:'Monthly revenue and commission', to:'finance@sahel-logistics.sa', when:'1st of the month', fmt:'PDF' }
    ]
  };

  return { PAL, CITIES, ZONE_GEO, BIZ, SOURCES, MERCHANTS, DRIVERS, CUSTOMERS, STATUS, FLOW, ORDERS, OVERFLOW,
           NETWORK, LISTING, BILLING, PLANS, NOTIFS, AUDIT, TICKETS, REPORTS,
           merchant: id => MERCHANTS.find(m => m.id === id),
           driver: id => DRIVERS.find(d => d.id === id),
           customer: id => CUSTOMERS.find(c => c.id === id),
           order: id => ORDERS.find(o => o.id === id) };
})();
