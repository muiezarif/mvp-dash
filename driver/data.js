/* Dash Driver App — Faisal Al Harbi, Rehla Fleet. Shares the DMS world. */
window.DRV = (function () {
  const PAL = { peach:'#FFCC99', tang:'#FCA38B', lemon:'#FFEE50', lav:'#C0D2FF', flax:'#E5E57C', vodka:'#BDB9EF' };

  const ME = {
    name:'Faisal Al Harbi', first:'Faisal', phone:'+966 50 118 4402', nid:'1094xxxx21',
    company:'Rehla Fleet', zone:'RYD-N — Al Malqa', group:'Bikes — North & Central',
    shift:{ name:'Morning', window:'07:30 – 15:30', auto:true },
    vehicle:{ plate:'RYD 4821', type:'Motorcycle', model:'Honda PCX 150', year:2022 },
    kpi:{ deliveries:1842, completion:97, avgMin:31, cancel:1.4, today:14, streak:6 },
    docs:[{ k:'Driving license', exp:'18 Apr 2027', s:'Valid' },
          { k:'Vehicle insurance', exp:'12 Sep 2026', s:'Expiring' },
          { k:'National ID', exp:'02 Jan 2029', s:'Valid' }],
    contract:{ model:'Per order', rate:'SAR 9.50 per order', terms:'Weekly, Sunday',
               target:'120 deliveries / week', incentive:'SAR 150 at 150 deliveries' },
    app:{ version:'3.4.1', device:'iPhone 13' }
  };

  /* DMS-set policy — the driver cannot change these */
  const POLICY = {
    distance: 150,                 // metres allowed to update status
    podRequired: true,
    accept: 'Auto accept',
    cancelReason: true,
    failReason: true,
    reattempt: true, maxReattempt: 2, autoReturn: true,
    autoOnline: true,              // shift-driven
    chatScope: 'Dispatcher only',
    navApps: ['Google Maps', 'Apple Maps', 'Waze']
  };

  const FLOW = ['Accepted','To pickup','At pickup','Picked up','To delivery','At delivery','Delivered'];
  const NEXT = { 'Accepted':'To pickup','To pickup':'At pickup','At pickup':'Picked up',
                 'Picked up':'To delivery','To delivery':'At delivery','At delivery':'Delivered' };
  const CTA = { 'Accepted':'Start — head to pickup','To pickup':'I have arrived at pickup',
                'At pickup':'Confirm pickup','Picked up':'Start delivery',
                'To delivery':'I have arrived','At delivery':'Complete delivery' };

  const ORDERS = [
    { id:'DX-40918', tag:'On demand', status:'Picked up', prio:'High',
      merchant:'Almasa Foods', branch:'Almasa — Al Malaz', pickAddr:'King Abdullah Rd, Al Malaz',
      cust:'Hassan M.', custPhone:'+966 55 771 4420', dropAddr:'Al Malaz, block 7, flat 12',
      km:4.1, eta:'15:58', slot:null, cod:120, pay:9.50, items:'1 box · 3.4 kg',
      pod:['Photo','OTP'], instr:'Customer flagged — confirm on the phone before you leave the shop.',
      dist:'You are 40 m from the drop-off',
      log:[{ t:'15:13', e:'Assigned to you', s:'Auto · radius 3 km' },
           { t:'15:14', e:'Accepted', s:'Auto accept is on' },
           { t:'15:29', e:'At pickup', s:'Geofence confirmed' },
           { t:'15:36', e:'Picked up', s:'COD SAR 120 to collect' }] },
    { id:'DX-40890', tag:'On demand', status:'Accepted', prio:'Normal',
      merchant:'Chopped', branch:'Chopped — Al Malqa', pickAddr:'Anas Ibn Malik Rd, Al Malqa',
      cust:'Faisal K.', custPhone:'+966 58 993 3315', dropAddr:'Al Malqa, Anas Ibn Malik Rd',
      km:1.8, eta:'16:24', slot:null, cod:0, pay:9.50, items:'1 bag · 2.4 kg',
      pod:['Photo'], instr:'', dist:'Pickup is 1.8 km away',
      log:[{ t:'15:47', e:'Assigned to you', s:'Auto · radius 1.8 km' },
           { t:'15:47', e:'Accepted', s:'Auto accept is on' }] },
    { id:'DX-40874', tag:'Scheduled', status:'Accepted', prio:'Normal',
      merchant:'Kanz Market', branch:'Kanz — Hittin', pickAddr:'Hittin, Riyadh',
      cust:'Reem S.', custPhone:'+966 53 118 9902', dropAddr:'Olaya, Tahlia St — leave with reception',
      km:6.4, eta:'18:30', slot:'Today 18:30', cod:0, pay:12.00, items:'4 boxes · 18.0 kg',
      pod:['Photo','Signature'], instr:'Van required for the return leg. Reception closes 19:00.',
      dist:'Scheduled — starts at 18:10',
      log:[{ t:'14:10', e:'Scheduled order assigned', s:'Slot 18:30 · assign 20 min before' }] },
    { id:'DX-40852', tag:'Scheduled', status:'Accepted', prio:'Normal',
      merchant:'Tamra Pharmacy', branch:'Tamra — Al Malqa', pickAddr:'Al Malqa, Riyadh',
      cust:'Layla A.', custPhone:'+966 50 220 1188', dropAddr:'Al Yasmin, block 4',
      km:3.2, eta:'19:15', slot:'Today 19:15', cod:0, pay:9.50, items:'Chilled · 0.8 kg',
      pod:['Photo','OTP'], instr:'Chilled — do not leave it in the top box.',
      dist:'Scheduled — starts at 18:55',
      log:[{ t:'15:02', e:'Scheduled order assigned', s:'Slot 19:15' }] }
  ];

  const HISTORY = [
    { id:'DX-40881', d:'Today 14:56', merchant:'Almasa Foods', status:'Delivered', pay:9.50, cod:95, min:36, pod:'Photo' },
    { id:'DX-40866', d:'Today 13:38', merchant:'Shawarmer', status:'Returned', pay:4.75, cod:0, min:54, pod:'—' },
    { id:'DX-40844', d:'Today 12:20', merchant:'Kanz Market', status:'Delivered', pay:9.50, cod:0, min:28, pod:'Photo' },
    { id:'DX-40820', d:'Today 11:14', merchant:'Chopped', status:'Delivered', pay:9.50, cod:60, min:31, pod:'Photo' },
    { id:'DX-40802', d:'Today 10:02', merchant:'Tamra Pharmacy', status:'Delivered', pay:9.50, cod:0, min:24, pod:'Photo, OTP' },
    { id:'DX-40781', d:'Today 09:12', merchant:'Almasa Foods', status:'Delivered', pay:9.50, cod:0, min:33, pod:'Photo' },
    { id:'DX-40760', d:'Yesterday 22:40', merchant:'Kanz Market', status:'Delivered', pay:9.50, cod:140, min:29, pod:'Photo, Signature' },
    { id:'DX-40744', d:'Yesterday 21:02', merchant:'Chopped', status:'Cancelled', pay:0, cod:0, min:0, pod:'—' },
    { id:'DX-40722', d:'Yesterday 19:31', merchant:'Almasa Foods', status:'Delivered', pay:9.50, cod:0, min:35, pod:'Photo' },
    { id:'DX-40701', d:'Yesterday 18:04', merchant:'Tamra Pharmacy', status:'Delivered', pay:9.50, cod:75, min:26, pod:'Photo' }
  ];

  const WALLET = {
    balance: 460, pending: 133, paid: 3600, deductions: 120, cod: 120,
    period:'Week of 24–30 August', target:{ done:96, of:120 },
    tx: [
      { d:'Today 15:36', t:'COD collected — DX-40918', a:-120, k:'cod' },
      { d:'Today 14:56', t:'Delivery earnings — DX-40881', a:9.50, k:'earn' },
      { d:'Today 13:38', t:'Return leg — DX-40866', a:4.75, k:'earn' },
      { d:'Today 12:20', t:'Delivery earnings — DX-40844', a:9.50, k:'earn' },
      { d:'Today 09:44', t:'Cash handed to office', a:340, k:'handover' },
      { d:'Yesterday', t:'Late pickup penalty — DX-40744', a:-20, k:'deduct' },
      { d:'25 Aug', t:'Weekly payout to bank ••4471', a:-1200, k:'payout' }
    ]
  };

  const CHAT = [
    { who:'them', n:'Mishal · Dispatcher', t:'Traffic on Northern Ring — how are you doing on DX-40918?', at:'15:41' },
    { who:'me', t:'Running about 6 minutes behind. Almost at the block.', at:'15:42' },
    { who:'them', n:'Mishal · Dispatcher', t:'Understood. Customer is flagged — call before you arrive, and collect the SAR 120.', at:'15:43' },
    { who:'me', t:'Will do.', at:'15:43' }
  ];

  const NOTIFS = [
    { k:'New order', t:'DX-40890 assigned to you — Chopped, Al Malqa', d:'1 min ago', sev:'high', link:'order:DX-40890' },
    { k:'Chat', t:'Mishal: call the customer before you arrive', d:'5 min ago', sev:'high', link:'chat' },
    { k:'Order', t:'DX-40918 marked Picked up — COD SAR 120 to collect', d:'12 min ago', sev:'med', link:'order:DX-40918' },
    { k:'Wallet', t:'SAR 9.50 added for DX-40881', d:'52 min ago', sev:'low', link:'wallet' },
    { k:'Document', t:'Your vehicle insurance expires 12 Sep — send the new copy to the office', d:'1 h ago', sev:'med', link:'profile' },
    { k:'Shift', t:'Morning shift starts 07:30 — you go online automatically', d:'Today 07:28', sev:'low', link:'home' },
    { k:'System', t:'App updated to 3.4.1 — faster proof of delivery upload', d:'26 Aug', sev:'low', link:'profile' }
  ];

  const ISSUES = [
    { id:'IC-3129', order:'DX-40874', reason:'Merchant delay or order not ready', note:'Counter said ten more minutes', at:'Yesterday 18:22',
      state:'Resolved', owner:'Mishal · Dispatcher', reply:'Merchant confirmed ready — collected at 18:41', closed:'Yesterday 18:39' }
  ];

  const REASONS = {
    issue: ['Customer unavailable or cannot contact customer', 'Merchant delay or order not ready',
            'Wrong address or customer changed location', 'Vehicle problem or accident',
            'Order or item issue', 'COD or payment issue', 'Other'],
    cancel: ['Merchant cancelled', 'Wrong or incomplete address', 'Customer refused the order', 'Vehicle problem', 'Order not ready at pickup'],
    fail: ['Customer unreachable', 'Nobody at the address', 'Customer refused delivery', 'Address could not be found', 'Customer had no cash for COD']
  };

  return { PAL, ME, POLICY, FLOW, NEXT, CTA, ORDERS, HISTORY, WALLET, CHAT, NOTIFS, REASONS, ISSUES,
           order: id => ORDERS.find(o => o.id === id) };
})();
