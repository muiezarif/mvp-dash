/* Dash Freelancer App — Rakan Al Zahrani, independent driver on Dash Network. */
window.FRL = (function () {
  const PAL = { peach:'#FFCC99', tang:'#FCA38B', lemon:'#FFEE50', lav:'#C0D2FF', flax:'#E5E57C', vodka:'#BDB9EF' };

  const ME = {
    name:'Rakan Al Zahrani', first:'Rakan', phone:'+966 51 445 7730', nid:'1099xxxx28',
    city:'Riyadh', area:'Al Yasmin', joined:'6 May 2026',
    vehicle:{ plate:'RYD 7302', type:'Motorcycle', model:'Suzuki Burgman', year:2022 },
    kpi:{ deliveries:1130, completion:96, avgMin:32, cancel:1.9, today:11, accepted:78 },
    docs:[{ k:'National ID', exp:'08 Jul 2028', s:'Verified' },
          { k:'Driving license', exp:'11 Jan 2027', s:'Verified' },
          { k:'Vehicle registration', exp:'20 Dec 2026', s:'Verified' },
          { k:'Vehicle insurance', exp:'20 Dec 2026', s:'Verified' }],
    app:{ version:'2.8.0', device:'Galaxy S21' }
  };

  /* Dash sets the commercial terms; the freelancer controls everything operational */
  const TERMS = {
    share: 0.80,                 // freelancer keeps 80%
    dashFee: 0.20,
    minWithdraw: 100,
    payout: 'Instant to bank, or Sunday batch',
    offerWindow: 20,             // seconds to decide
    gap: 6,                      // seconds between offers while online and free
    maxConcurrent: 1,            // one job at a time — offers pause while delivering
    skipPenalty: 'None — skipping never affects your score',
    onlineControl: 'Fully yours — no shifts, no dispatcher',
    chatScope: 'Dash Support only',
    podRequired: true,
    reattempt: true, maxReattempt: 2, autoReturn: true,
    navApps: ['Google Maps', 'Apple Maps', 'Waze']
  };

  const FLOW = ['Accepted','To pickup','At pickup','Picked up','To delivery','At delivery','Delivered'];
  const NEXT = { 'Accepted':'To pickup','To pickup':'At pickup','At pickup':'Picked up',
                 'Picked up':'To delivery','To delivery':'At delivery','At delivery':'Delivered' };
  const CTA = { 'Accepted':'Start — head to pickup','To pickup':'I have arrived at pickup',
                'At pickup':'Confirm pickup','Picked up':'Start delivery',
                'To delivery':'I have arrived','At delivery':'Complete delivery' };

  /* Offers arrive from Dash Network while online — on demand only, never scheduled */
  const OFFERS = [
    { id:'DX-41102', pay:24.50, gross:30.63, km:3.2, min:14, toPickup:1.4,
      merchant:'Kanz Market', branch:'Kanz Market — Hittin', pickAddr:'Hittin, Riyadh',
      dropAddr:'Al Yasmin, block 4', cust:'Layla A.', cod:0, items:'2 bags · 6.2 kg',
      pod:['Photo'], instr:'Call on arrival, gate code 4471' },
    { id:'DX-41119', pay:18.00, gross:22.50, km:2.1, min:11, toPickup:0.8,
      merchant:'Shawarmer', branch:'Shawarmer — Al Yasmin', pickAddr:'Al Yasmin, Riyadh',
      dropAddr:'Hittin, block 12', cust:'Hassan M.', cod:48, items:'1 bag · 1.9 kg',
      pod:['Photo'], instr:'Collect SAR 48 in cash.' },
    { id:'DX-41134', pay:31.00, gross:38.75, km:6.8, min:24, toPickup:2.6,
      merchant:'Almasa Foods', branch:'Almasa — Al Sahafah', pickAddr:'Al Sahafah, Riyadh',
      dropAddr:'Olaya, Tahlia St', cust:'Reem S.', cod:0, items:'3 boxes · 11.0 kg',
      pod:['Photo','Signature'], instr:'Leave with reception.' },
    { id:'DX-41147', pay:16.50, gross:20.63, km:1.6, min:9, toPickup:0.5,
      merchant:'Tamra Pharmacy', branch:'Tamra — Al Malqa', pickAddr:'Al Malqa, Riyadh',
      dropAddr:'Al Malqa, Anas Ibn Malik Rd', cust:'Faisal K.', cod:0, items:'Chilled · 0.8 kg',
      pod:['Photo','OTP'], instr:'Chilled — do not leave it in the top box.' },
    { id:'DX-41158', pay:27.50, gross:34.38, km:5.4, min:19, toPickup:1.9,
      merchant:'Bayt Market', branch:'Bayt Market — Hittin', pickAddr:'Hittin, Riyadh',
      dropAddr:'Al Sahafah, block 3', cust:'Layla A.', cod:95, items:'2 boxes · 7.4 kg',
      pod:['Photo','OTP'], instr:'Collect SAR 95 in cash.' }
  ];

  const ORDERS = [];

  const HISTORY = [
    { id:'DX-41088', d:'Today 15:52', merchant:'Nuqta', status:'Delivered', pay:21.00, cod:60, min:26 },
    { id:'DX-41060', d:'Today 15:12', merchant:'Kanz Market', status:'Delivered', pay:22.50, cod:0, min:29 },
    { id:'DX-41042', d:'Today 14:20', merchant:'Chopped', status:'Delivered', pay:19.00, cod:45, min:31 },
    { id:'DX-41020', d:'Today 13:08', merchant:'Almasa Foods', status:'Delivered', pay:26.00, cod:0, min:38 },
    { id:'DX-40998', d:'Today 11:54', merchant:'Tamra Pharmacy', status:'Delivered', pay:20.50, cod:0, min:24 },
    { id:'DX-40977', d:'Today 10:31', merchant:'Nuqta', status:'Returned', pay:9.50, cod:0, min:47 },
    { id:'DX-40951', d:'Today 09:22', merchant:'Kanz Market', status:'Delivered', pay:23.00, cod:80, min:27 },
    { id:'DX-40930', d:'Yesterday 21:40', merchant:'Shawarmer', status:'Delivered', pay:18.00, cod:0, min:22 },
    { id:'DX-40912', d:'Yesterday 20:15', merchant:'Chopped', status:'Skipped', pay:0, cod:0, min:0 },
    { id:'DX-40890', d:'Yesterday 19:02', merchant:'Almasa Foods', status:'Delivered', pay:24.50, cod:110, min:34 },
    { id:'DX-40871', d:'Yesterday 17:44', merchant:'Bayt Market', status:'Delivered', pay:21.00, cod:0, min:30 }
  ];

  const WALLET = {
    available: 418, pending: 48, cod: 60, lifetime: 24880,
    bank:'Al Rajhi ••4471', period:'Week of 24–30 August',
    tx: [
      { d:'Today 15:44', t:'COD collected — DX-41088', a:-60, k:'cod' },
      { d:'Today 15:12', t:'Delivery — DX-41060', a:22.50, k:'earn', gross:28.13, fee:5.63 },
      { d:'Today 14:20', t:'Delivery — DX-41042', a:19.00, k:'earn', gross:23.75, fee:4.75 },
      { d:'Today 13:08', t:'Delivery — DX-41020', a:26.00, k:'earn', gross:32.50, fee:6.50 },
      { d:'Today 10:31', t:'Return leg — DX-40977', a:9.50, k:'earn', gross:11.88, fee:2.38 },
      { d:'Today 09:44', t:'Cash handed at Dash point — Al Yasmin', a:180, k:'handover' },
      { d:'Yesterday', t:'Withdrawal to Al Rajhi ••4471', a:-600, k:'payout' }
    ]
  };

  const CHAT = [
    { who:'them', n:'Dash Support', t:'Hello Rakan — we see DX-40977 was returned. Anything we should record?', at:'15:20' },
    { who:'me', t:'Customer was unreachable, I waited 12 minutes and tried twice.', at:'15:22' },
    { who:'them', n:'Dash Support', t:'Noted. The return leg has been paid at SAR 9.50 — it is already in your wallet.', at:'15:24' }
  ];

  const NOTIFS = [
    { k:'Order', t:'DX-41088 delivered — SAR 21.00 in your wallet', d:'2 min ago', sev:'med', link:'wallet' },
    { k:'Offer', t:'You skipped SAR 19.00 · Chopped → Al Malqa', d:'22 min ago', sev:'low', link:'history' },
    { k:'Wallet', t:'SAR 22.50 available — DX-41060 settled', d:'36 min ago', sev:'low', link:'wallet' },
    { k:'Support', t:'Dash Support replied about DX-40977', d:'1 h ago', sev:'med', link:'chat' },
    { k:'Cash', t:'SAR 60 cash on you — hand it in at any Dash point', d:'1 h ago', sev:'med', link:'wallet' },
    { k:'Account', t:'Your documents are verified until Dec 2026', d:'3 days ago', sev:'low', link:'profile' }
  ];

  const ISSUES = [
    { id:'IC-3126', order:'DX-41088', reason:'Wrong address or customer changed location', note:'Customer moved the pin two blocks after I collected',
      at:'Yesterday 20:14', state:'Resolved', owner:'Dash Support · Reem', reply:'New address confirmed and the fare adjusted for the extra 2.1 km', closed:'Yesterday 20:26' }
  ];

  const REASONS = {
    issue: ['Customer unavailable or cannot contact customer', 'Merchant delay or order not ready',
            'Wrong address or customer changed location', 'Vehicle problem or accident',
            'Order or item issue', 'COD or payment issue', 'Other'],
    cancel: ['Order not ready at pickup', 'Merchant cancelled', 'Wrong or incomplete address', 'Vehicle problem', 'I can no longer make the time'],
    fail: ['Customer unreachable', 'Nobody at the address', 'Customer refused delivery', 'Address could not be found', 'Customer had no cash for COD']
  };

  const SIGNUP = [
    { t:'Your details', s:'Name, mobile number, city', done:true },
    { t:'National ID', s:'Front and back, clear photo', done:true },
    { t:'Driving license', s:'Valid, not expiring within 30 days', done:true },
    { t:'Vehicle documents', s:'Registration and insurance', done:true },
    { t:'Dash review', s:'Usually within one business day', done:true, note:'Approved 6 May 2026' },
    { t:'Go online', s:'You decide when — no shifts', done:true }
  ];

  return { PAL, ME, TERMS, FLOW, NEXT, CTA, OFFERS, ORDERS, HISTORY, WALLET, CHAT, NOTIFS, REASONS, ISSUES, SIGNUP,
           order: id => ORDERS.find(o => o.id === id) };
})();
