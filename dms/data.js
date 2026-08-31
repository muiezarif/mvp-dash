/* Dash DMS — demo data. Rehla Fleet, Riyadh. Real coordinates. */
window.DMS = (function () {
  const PAL = { peach:'#FFCC99', tang:'#FCA38B', lemon:'#FFEE50', lav:'#C0D2FF', flax:'#E5E57C', vodka:'#BDB9EF' };

  /* Riyadh districts — real approximate centres */
  const ZONES = [
    { id:'z1', name:'Zone North — Al Malqa', code:'RYD-N', city:'Riyadh', districts:["Al Malqa","Hittin","Al Aqiq"], color:PAL.lav, centre:[24.8214,46.6136],
      poly:[[24.8480,46.5810],[24.8520,46.6480],[24.8000,46.6580],[24.7930,46.5900]],
      drivers:['d1','d4','d7'], orders:34, onTime:96, avgPickup:11, status:'Active' },
    { id:'z2', name:'Zone East — Al Malaz', code:'RYD-E', city:'Riyadh', districts:["Al Malaz","Al Rawabi","Al Naseem"], color:PAL.peach, centre:[24.6725,46.7350],
      poly:[[24.7020,46.7020],[24.7080,46.7720],[24.6480,46.7800],[24.6420,46.7100]],
      drivers:['d2','d5'], orders:21, onTime:91, avgPickup:14, status:'Active' },
    { id:'z3', name:'Zone Central — Olaya', code:'RYD-C', city:'Riyadh', districts:["Olaya","Al Sulaymaniyah","King Fahd"], color:PAL.vodka, centre:[24.6944,46.6853],
      poly:[[24.7180,46.6600],[24.7220,46.7080],[24.6700,46.7140],[24.6660,46.6660]],
      drivers:['d3','d6'], orders:41, onTime:94, avgPickup:12, status:'Active' },
    { id:'z4', name:'Zone West — Al Sahafah', code:'RYD-W', city:'Riyadh', districts:["Al Sahafah","Al Nakheel","Al Wadi"], color:PAL.flax, centre:[24.8100,46.6420],
      poly:[[24.8300,46.6220],[24.8340,46.6700],[24.7900,46.6760],[24.7860,46.6280]],
      drivers:['d8'], orders:12, onTime:88, avgPickup:17, status:'Paused' },
    { id:'z5', name:'Zone South — Al Yasmin', code:'RYD-S', city:'Riyadh', districts:["Al Yasmin","Al Narjis","Al Arid"], color:PAL.tang, centre:[24.8480,46.6390],
      poly:[[24.8700,46.6120],[24.8740,46.6700],[24.8300,46.6760],[24.8260,46.6180]],
      drivers:['d9','d10'], orders:19, onTime:93, avgPickup:13, status:'Active' }
  ];

  const CITIES = ['Riyadh'];

  const VEHICLES = [
    { id:'v1', plate:'RYD 4821', type:'Motorcycle', model:'Honda PCX 150', year:2022, driver:'d1', reg:'2026-11-04', ins:'2026-09-12', status:'In use' },
    { id:'v2', plate:'RYD 7719', type:'Car', model:'Toyota Yaris', year:2021, driver:'d2', reg:'2026-08-30', ins:'2026-09-02', status:'In use' },
    { id:'v3', plate:'RYD 2044', type:'Car', model:'Hyundai Accent', year:2023, driver:'d3', reg:'2027-02-18', ins:'2026-12-01', status:'In use' },
    { id:'v4', plate:'RYD 9930', type:'Van', model:'Toyota Hiace', year:2020, driver:'d4', reg:'2026-09-08', ins:'2026-09-05', status:'In use' },
    { id:'v5', plate:'RYD 6612', type:'Motorcycle', model:'Yamaha NMAX', year:2023, driver:'d5', reg:'2027-01-22', ins:'2027-01-22', status:'In use' },
    { id:'v6', plate:'RYD 3387', type:'Car', model:'Kia Pegas', year:2022, driver:'d6', reg:'2026-10-15', ins:'2026-11-30', status:'In use' },
    { id:'v7', plate:'RYD 8125', type:'Motorcycle', model:'Honda PCX 150', year:2021, driver:'d7', reg:'2026-09-01', ins:'2026-09-19', status:'In use' },
    { id:'v8', plate:'RYD 5590', type:'Van', model:'Ford Transit', year:2019, driver:'d8', reg:'2026-09-03', ins:'2026-10-08', status:'Maintenance' },
    { id:'v9', plate:'RYD 1178', type:'Car', model:'Nissan Sunny', year:2023, driver:'d9', reg:'2027-03-11', ins:'2027-03-11', status:'In use' },
    { id:'v10',plate:'RYD 7302', type:'Motorcycle', model:'Suzuki Burgman', year:2022, driver:'d10',reg:'2026-12-20', ins:'2026-12-20', status:'In use' },
    { id:'v11',plate:'RYD 4406', type:'Car', model:'Toyota Corolla', year:2024, driver:null, reg:'2028-01-09', ins:'2028-01-09', status:'Available' }
  ];

  const DRIVERS = [
    { id:'d1', name:'Faisal Al Harbi', phone:'+966 50 118 4402', nid:'1094xxxx21', zone:'z1', group:'g1', shift:'s1', vehicle:'v1',
      status:'On job', online:true, since:'07:58', pos:[24.8190,46.6120], deliveries:1842, completion:97, avgMin:31, cancel:1.4,
      contract:{ model:'Per order', rate:'SAR 9.50 / order', terms:'Weekly, Sunday', target:'120 deliveries / week · 95% completion',
                 incentive:'SAR 150 bonus at 150 deliveries', start:'2024-03-01', end:'2026-12-31', status:'Active' },
      wallet:{ earned:4180, payouts:3600, deductions:120, cod:340, tx:[
        { d:'Aug 29', t:'Per-order earnings · 14 orders', a:133 },
        { d:'Aug 28', t:'COD collected — pending handover', a:-340 },
        { d:'Aug 28', t:'Per-order earnings · 16 orders', a:152 },
        { d:'Aug 27', t:'Deduction — late pickup penalty', a:-20 },
        { d:'Aug 25', t:'Weekly payout to bank', a:-1200 }] },
      docs:[{ k:'Driving license', exp:'2027-04-18', s:'Valid' },{ k:'Vehicle insurance', exp:'2026-09-12', s:'Expiring' },{ k:'National ID', exp:'2029-01-02', s:'Valid' }],
      app:{ invited:'2024-03-01', lastSeen:'2 min ago', version:'3.4.1', device:'iPhone 13', active:true } },
    { id:'d2', name:'Omar Nasser', phone:'+966 55 402 7781', nid:'1077xxxx08', zone:'z2', group:'g2', shift:'s1', vehicle:'v2',
      status:'On job', online:true, since:'08:02', pos:[24.6780,46.7290], deliveries:1420, completion:95, avgMin:34, cancel:2.1,
      contract:{ model:'Salary', rate:'SAR 4,200 / month', terms:'Monthly, 27th', target:'400 deliveries / month',
                 incentive:'SAR 300 at 450 deliveries', start:'2023-11-15', end:'2026-11-14', status:'Active' },
      wallet:{ earned:4200, payouts:4200, deductions:0, cod:120, tx:[
        { d:'Aug 29', t:'COD collected — pending handover', a:-120 },
        { d:'Jul 27', t:'Monthly salary', a:-4200 }] },
      docs:[{ k:'Driving license', exp:'2026-09-30', s:'Expiring' },{ k:'Vehicle insurance', exp:'2026-09-02', s:'Expiring' },{ k:'National ID', exp:'2031-06-11', s:'Valid' }],
      app:{ invited:'2023-11-15', lastSeen:'just now', version:'3.4.1', device:'Galaxy A54', active:true } },
    { id:'d3', name:'Yousef Al Qahtani', phone:'+966 53 990 1145', nid:'1102xxxx77', zone:'z3', group:'g1', shift:'s2', vehicle:'v3',
      status:'Idle', online:true, since:'13:45', pos:[24.6930,46.6890], deliveries:980, completion:93, avgMin:29, cancel:3.0,
      contract:{ model:'Per order', rate:'SAR 8.75 / order', terms:'Weekly, Sunday', target:'100 deliveries / week',
                 incentive:'None', start:'2025-01-08', end:'2026-12-31', status:'Active' },
      wallet:{ earned:2310, payouts:2100, deductions:60, cod:0, tx:[
        { d:'Aug 29', t:'Per-order earnings · 9 orders', a:79 },
        { d:'Aug 26', t:'Deduction — proof of delivery missing', a:-60 }] },
      docs:[{ k:'Driving license', exp:'2028-02-05', s:'Valid' },{ k:'Vehicle insurance', exp:'2026-12-01', s:'Valid' },{ k:'National ID', exp:'2030-08-19', s:'Valid' }],
      app:{ invited:'2025-01-08', lastSeen:'6 min ago', version:'3.3.9', device:'iPhone 12', active:true } },
    { id:'d4', name:'Bandar Al Otaibi', phone:'+966 56 771 3390', nid:'1066xxxx54', zone:'z1', group:'g3', shift:'s1', vehicle:'v4',
      status:'On job', online:true, since:'07:40', pos:[24.8320,46.6300], deliveries:2110, completion:98, avgMin:38, cancel:0.9,
      contract:{ model:'Salary', rate:'SAR 5,100 / month', terms:'Monthly, 27th', target:'380 deliveries / month',
                 incentive:'SAR 400 at 430 deliveries', start:'2022-06-01', end:'2027-05-31', status:'Active' },
      wallet:{ earned:5100, payouts:5100, deductions:0, cod:780, tx:[
        { d:'Aug 29', t:'COD collected — pending handover', a:-780 },
        { d:'Jul 27', t:'Monthly salary', a:-5100 }] },
      docs:[{ k:'Driving license', exp:'2027-07-14', s:'Valid' },{ k:'Vehicle registration', exp:'2026-09-08', s:'Expiring' },{ k:'National ID', exp:'2028-03-22', s:'Valid' }],
      app:{ invited:'2022-06-01', lastSeen:'1 min ago', version:'3.4.1', device:'Galaxy S22', active:true } },
    { id:'d5', name:'Ahmed Salem', phone:'+966 58 224 6612', nid:'1121xxxx39', zone:'z2', group:'g2', shift:'s2', vehicle:'v5',
      status:'Idle', online:true, since:'14:10', pos:[24.6640,46.7480], deliveries:640, completion:90, avgMin:33, cancel:4.2,
      contract:{ model:'Per order', rate:'SAR 8.50 / order', terms:'Weekly, Sunday', target:'90 deliveries / week',
                 incentive:'None', start:'2025-06-20', end:'2026-12-31', status:'Active' },
      wallet:{ earned:1490, payouts:1200, deductions:40, cod:95, tx:[
        { d:'Aug 29', t:'Per-order earnings · 7 orders', a:60 },
        { d:'Aug 29', t:'COD collected — pending handover', a:-95 }] },
      docs:[{ k:'Driving license', exp:'2026-10-02', s:'Valid' },{ k:'Vehicle insurance', exp:'2027-01-22', s:'Valid' },{ k:'National ID', exp:'2032-05-30', s:'Valid' }],
      app:{ invited:'2025-06-20', lastSeen:'12 min ago', version:'3.4.0', device:'Redmi Note 12', active:true } },
    { id:'d6', name:'Turki Al Dosari', phone:'+966 50 663 8821', nid:'1088xxxx16', zone:'z3', group:'g1', shift:'s1', vehicle:'v6',
      status:'On job', online:true, since:'08:15', pos:[24.7060,46.6740], deliveries:1305, completion:96, avgMin:30, cancel:1.7,
      contract:{ model:'Per order', rate:'SAR 9.00 / order', terms:'Weekly, Sunday', target:'110 deliveries / week',
                 incentive:'SAR 120 at 140 deliveries', start:'2024-09-02', end:'2026-12-31', status:'Active' },
      wallet:{ earned:3020, payouts:2700, deductions:0, cod:210, tx:[
        { d:'Aug 29', t:'Per-order earnings · 12 orders', a:108 },
        { d:'Aug 29', t:'COD collected — pending handover', a:-210 }] },
      docs:[{ k:'Driving license', exp:'2027-11-28', s:'Valid' },{ k:'Vehicle insurance', exp:'2026-11-30', s:'Valid' },{ k:'National ID', exp:'2029-09-04', s:'Valid' }],
      app:{ invited:'2024-09-02', lastSeen:'3 min ago', version:'3.4.1', device:'iPhone 14', active:true } },
    { id:'d7', name:'Saad Al Amri', phone:'+966 54 108 9932', nid:'1113xxxx62', zone:'z1', group:'g3', shift:'s2', vehicle:'v7',
      status:'Break', online:true, since:'15:02', pos:[24.8060,46.6020], deliveries:770, completion:92, avgMin:36, cancel:2.8,
      contract:{ model:'Per order', rate:'SAR 8.75 / order', terms:'Weekly, Sunday', target:'95 deliveries / week',
                 incentive:'None', start:'2025-04-11', end:'2026-12-31', status:'Active' },
      wallet:{ earned:1780, payouts:1500, deductions:20, cod:0, tx:[{ d:'Aug 29', t:'Per-order earnings · 8 orders', a:70 }] },
      docs:[{ k:'Driving license', exp:'2026-09-19', s:'Expiring' },{ k:'Vehicle insurance', exp:'2026-09-19', s:'Expiring' },{ k:'National ID', exp:'2030-12-15', s:'Valid' }],
      app:{ invited:'2025-04-11', lastSeen:'8 min ago', version:'3.4.1', device:'Galaxy A34', active:true } },
    { id:'d8', name:'Majed Al Shammari', phone:'+966 59 337 4410', nid:'1055xxxx83', zone:'z4', group:'g3', shift:'s3', vehicle:'v8',
      status:'Offline', online:false, since:'—', pos:[24.8090,46.6480], deliveries:2440, completion:97, avgMin:41, cancel:1.1,
      contract:{ model:'Salary', rate:'SAR 5,600 / month', terms:'Monthly, 27th', target:'360 deliveries / month',
                 incentive:'SAR 500 at 420 deliveries', start:'2021-02-14', end:'2027-02-13', status:'Active' },
      wallet:{ earned:5600, payouts:5600, deductions:0, cod:0, tx:[{ d:'Jul 27', t:'Monthly salary', a:-5600 }] },
      docs:[{ k:'Driving license', exp:'2027-05-06', s:'Valid' },{ k:'Vehicle registration', exp:'2026-09-03', s:'Expiring' },{ k:'National ID', exp:'2027-10-29', s:'Valid' }],
      app:{ invited:'2021-02-14', lastSeen:'yesterday', version:'3.3.9', device:'iPhone 11', active:true } },
    { id:'d9', name:'Nawaf Al Ghamdi', phone:'+966 57 889 2201', nid:'1130xxxx45', zone:'z5', group:'g2', shift:'s1', vehicle:'v9',
      status:'On job', online:true, since:'07:52', pos:[24.8520,46.6300], deliveries:520, completion:94, avgMin:28, cancel:2.4,
      contract:{ model:'Per order', rate:'SAR 9.25 / order', terms:'Weekly, Sunday', target:'105 deliveries / week',
                 incentive:'SAR 100 at 130 deliveries', start:'2025-09-15', end:'2026-12-31', status:'Active' },
      wallet:{ earned:1210, payouts:900, deductions:0, cod:150, tx:[
        { d:'Aug 29', t:'Per-order earnings · 11 orders', a:102 },
        { d:'Aug 29', t:'COD collected — pending handover', a:-150 }] },
      docs:[{ k:'Driving license', exp:'2029-03-30', s:'Valid' },{ k:'Vehicle insurance', exp:'2027-03-11', s:'Valid' },{ k:'National ID', exp:'2033-01-17', s:'Valid' }],
      app:{ invited:'2025-09-15', lastSeen:'just now', version:'3.4.1', device:'iPhone 15', active:true } },
    { id:'d10', name:'Rakan Al Zahrani', phone:'+966 51 445 7730', nid:'1099xxxx28', zone:'z5', group:'g1', shift:'s2', vehicle:'v10',
      status:'Idle', online:true, since:'14:00', pos:[24.8410,46.6600], deliveries:1130, completion:96, avgMin:32, cancel:1.9,
      contract:{ model:'Per order', rate:'SAR 9.00 / order', terms:'Weekly, Sunday', target:'110 deliveries / week',
                 incentive:'SAR 120 at 140 deliveries', start:'2024-05-06', end:'2026-12-31', status:'Expiring' },
      wallet:{ earned:2640, payouts:2400, deductions:0, cod:60, tx:[
        { d:'Aug 29', t:'Per-order earnings · 10 orders', a:90 },
        { d:'Aug 29', t:'COD collected — pending handover', a:-60 }] },
      docs:[{ k:'Driving license', exp:'2027-01-11', s:'Valid' },{ k:'Vehicle insurance', exp:'2026-12-20', s:'Valid' },{ k:'National ID', exp:'2028-07-08', s:'Valid' }],
      app:{ invited:'2024-05-06', lastSeen:'5 min ago', version:'3.4.1', device:'Galaxy S21', active:true } }
  ];

  const GROUPS = [
    { id:'g1', name:'Bikes — North & Central', by:'Vehicle type', drivers:['d1','d3','d6','d10'], zone:'Mixed', orders:96, onTime:95 },
    { id:'g2', name:'East corridor', by:'Zone', drivers:['d2','d5','d9'], zone:'RYD-E / RYD-S', orders:58, onTime:92 },
    { id:'g3', name:'Vans & bulk', by:'Vehicle type', drivers:['d4','d7','d8'], zone:'Mixed', orders:34, onTime:97 }
  ];

  const SHIFTS = [
    { id:'s1', name:'Morning', window:'07:30 – 15:30', drivers:['d1','d2','d4','d6','d9'], auto:true, orders:112, onTime:96 },
    { id:'s2', name:'Evening', window:'15:30 – 23:30', drivers:['d3','d5','d7','d10'], auto:true, orders:84, onTime:93 },
    { id:'s3', name:'Night', window:'23:30 – 07:30', drivers:['d8'], auto:false, orders:19, onTime:90 }
  ];

  const MERCHANTS = [
    { id:'m1', name:'Kanz Market', kind:'Dash Merchant', integration:'Auto-synced', branches:4, volume:90, since:'2024-08-12', status:'Connected',
      contract:{ pricing:'SAR 14.00 base + SAR 1.20/km', terms:'Net 15', start:'2024-08-12', end:'2026-08-11', status:'Active' } },
    { id:'m2', name:'Almasa Foods', kind:'Dash Merchant', integration:'Auto-synced', branches:12, volume:310, since:'2023-05-02', status:'Connected',
      contract:{ pricing:'SAR 12.50 flat, zone-capped', terms:'Net 30', start:'2023-05-02', end:'2026-05-01', status:'Active' } },
    { id:'m3', name:'Chopped', kind:'External Merchant', integration:'API', branches:6, volume:140, since:'2025-01-19', status:'Connected',
      contract:{ pricing:'SAR 15.00 base + SAR 1.00/km', terms:'Net 15', start:'2025-01-19', end:'2026-01-18', status:'Expiring' } },
    { id:'m4', name:'Shawarmer — Hittin', kind:'External Merchant', integration:'Manual', branches:1, volume:35, since:'2025-11-03', status:'Connected',
      contract:{ pricing:'SAR 13.00 flat', terms:'Prepaid wallet', start:'2025-11-03', end:'2026-11-02', status:'Active' } },
    { id:'m5', name:'Tamra Pharmacy', kind:'Dash Merchant', integration:'Auto-synced', branches:3, volume:52, since:'2026-02-27', status:'Connected',
      contract:{ pricing:'SAR 16.00 base, chilled +SAR 4', terms:'Net 15', start:'2026-02-27', end:'2027-02-26', status:'Active' } },
    { id:'m6', name:'Bayt Market', kind:'External Merchant', integration:'API', branches:2, volume:28, since:'—', status:'Pending request',
      contract:null }
  ];

  const CUSTOMERS = [
    { id:'c1', name:'Layla A.', phone:'+966 50 220 1188', orders:34, success:97, flagged:false, addr:'Al Yasmin, block 4', note:'' },
    { id:'c2', name:'Hassan M.', phone:'+966 55 771 4420', orders:12, success:83, flagged:true, addr:'Al Malaz, King Abdullah Rd', note:'Two refused deliveries — call before dispatch' },
    { id:'c3', name:'Reem S.', phone:'+966 53 118 9902', orders:61, success:99, flagged:false, addr:'Olaya, Tahlia St', note:'Leave with reception' },
    { id:'c4', name:'Faisal K.', phone:'+966 58 993 3315', orders:8, success:88, flagged:false, addr:'Al Malqa, Anas Ibn Malik Rd', note:'' }
  ];

  const STATUS = {
    'Assigning':   { c:PAL.lemon,  step:0 },
    'Accepted':    { c:PAL.lemon,  step:1 },
    'To pickup':   { c:PAL.peach,  step:2 },
    'At pickup':   { c:PAL.peach,  step:3 },
    'Picked up':   { c:PAL.lav,    step:4 },
    'To delivery': { c:PAL.lav,    step:5 },
    'At delivery': { c:PAL.vodka,  step:6 },
    'Delivered':   { c:'#1f8a4c',  step:7 },
    'Cancelled':   { c:PAL.tang,   step:-1 },
    'Returned':    { c:PAL.tang,   step:-1 }
  };
  const FLOW = ['Accepted','To pickup','At pickup','Picked up','To delivery','At delivery','Delivered'];

  const ORDERS = [
    { id:'DX-40921', elapsed:'7m', merchant:'m1', branch:'Kanz — Hittin', customer:'c1', zone:'z1', driver:null, status:'Assigning',
      type:'On demand', source:'Direct', cod:0, price:18.4, created:'15:41', eta:'16:12', prio:'Normal',
      pickup:[24.8232,46.6089], drop:[24.8471,46.6338], items:'2 bags · 6.2 kg', pod:['Photo'], instr:'Call on arrival, gate code 4471',
      log:[{ t:'15:41', e:'Order created', s:'Kanz Market · connector' },{ t:'15:41', e:'Routing to own fleet', s:'3 candidates in RYD-N' }] },
    { id:'DX-40918', elapsed:'36m', late:true, merchant:'m2', branch:'Almasa — Al Malaz', customer:'c2', zone:'z2', driver:'d2', status:'Picked up',
      type:'On demand', source:'Direct', cod:120, price:22.0, created:'15:12', eta:'15:58', prio:'High',
      pickup:[24.6771,46.7318], drop:[24.6640,46.7541], items:'1 box · 3.4 kg', pod:['Photo','OTP'], instr:'Customer flagged — confirm before leaving',
      log:[{ t:'15:12', e:'Order created', s:'Almasa Foods · connector' },{ t:'15:13', e:'Assigned to Omar Nasser', s:'Auto · radius 3 km' },{ t:'15:29', e:'At pickup', s:'Geofence confirmed' },{ t:'15:36', e:'Picked up', s:'COD SAR 120 to collect' }] },
    { id:'DX-40915', elapsed:'44m', merchant:'m3', branch:'Chopped — Olaya', customer:'c3', zone:'z3', driver:'d6', status:'To delivery',
      type:'On demand', source:'Marketplace', cod:0, price:19.5, created:'15:04', eta:'15:49', prio:'Normal',
      pickup:[24.6944,46.6853], drop:[24.7062,46.6741], items:'1 bag · 1.8 kg', pod:['Photo'], instr:'Leave with reception',
      log:[{ t:'15:04', e:'Order created', s:'Chopped · API' },{ t:'15:05', e:'Assigned to Turki Al Dosari', s:'Auto · geofence RYD-C' },{ t:'15:18', e:'Picked up', s:'' },{ t:'15:33', e:'To delivery', s:'' }] },
    { id:'DX-40911', elapsed:'4m', offered:'d1', merchant:'m4', branch:'Shawarmer — Hittin', customer:'c4', zone:'z1', driver:null, status:'Assigning',
      type:'On demand', source:'Direct', cod:64, price:16.0, created:'15:44', eta:'16:20', prio:'Normal',
      pickup:[24.8188,46.6151], drop:[24.8299,46.5977], items:'1 bag · 2.1 kg', pod:['Photo'], instr:'',
      log:[{ t:'15:44', e:'Order created', s:'Manual entry · dispatcher' },{ t:'15:44', e:'No driver within radius', s:'Overflow candidate' }] },
    { id:'DX-40907', elapsed:'50m', assignAt:'18:10', merchant:'m2', branch:'Almasa — Al Sahafah', customer:'c1', zone:'z4', driver:null, status:'Assigning',
      type:'Scheduled', source:'Dash Network', cod:0, price:24.0, created:'14:58', eta:'18:30', prio:'Normal',
      pickup:[24.8103,46.6420], drop:[24.8256,46.6688], items:'3 boxes · 11.0 kg', pod:['Photo','Signature'], instr:'Scheduled 18:30 — assign 20 min before',
      log:[{ t:'14:58', e:'Received from Dash Network', s:'Supply role · RYD-W' },{ t:'14:58', e:'Queued for scheduled assignment', s:'Assign at 18:10' }] },
    { id:'DX-40902', elapsed:'15m', merchant:'m1', branch:'Kanz — Al Yasmin', customer:'c1', zone:'z5', driver:'d9', status:'To pickup',
      type:'On demand', source:'Direct', cod:150, price:20.5, created:'15:33', eta:'16:05', prio:'Normal',
      pickup:[24.8480,46.6390], drop:[24.8601,46.6222], items:'2 bags · 5.0 kg', pod:['Photo'], instr:'',
      log:[{ t:'15:33', e:'Order created', s:'Kanz Market · connector' },{ t:'15:34', e:'Assigned to Nawaf Al Ghamdi', s:'Auto · radius 2.4 km' }] },
    { id:'DX-40898', elapsed:'1m', merchant:'m5', branch:'Tamra — Olaya', customer:'c3', zone:'z3', driver:'d3', status:'Accepted',
      type:'On demand', source:'Direct', cod:0, price:21.0, created:'15:47', eta:'16:24', prio:'High',
      pickup:[24.6902,46.6871], drop:[24.6988,46.7042], items:'Chilled · 1.2 kg', pod:['Photo','OTP'], instr:'Chilled — do not leave in vehicle',
      log:[{ t:'15:47', e:'Order created', s:'Tamra Pharmacy · connector' },{ t:'15:47', e:'Assigned to Yousef Al Qahtani', s:'Auto · priority high' },{ t:'15:48', e:'Accepted', s:'' }] },
    { id:'DX-40890', elapsed:'57m', stuck:17, merchant:'m3', branch:'Chopped — Al Malqa', customer:'c4', zone:'z1', driver:'d1', status:'At delivery',
      type:'On demand', source:'Marketplace', cod:0, price:18.0, created:'14:51', eta:'15:40', prio:'Normal',
      pickup:[24.8205,46.6102], drop:[24.8118,46.6208], items:'1 bag · 2.4 kg', pod:['Photo'], instr:'',
      log:[{ t:'14:51', e:'Order created', s:'Chopped · API' },{ t:'14:52', e:'Assigned to Faisal Al Harbi', s:'Auto · radius 1.8 km' },{ t:'15:08', e:'Picked up', s:'' },{ t:'15:31', e:'At delivery', s:'Geofence confirmed' }] },
    { id:'DX-40881', merchant:'m2', branch:'Almasa — Al Malaz', customer:'c2', zone:'z2', driver:'d5', status:'Delivered',
      type:'On demand', source:'Direct', cod:95, price:17.5, created:'14:20', eta:'14:59', prio:'Normal',
      pickup:[24.6749,46.7362], drop:[24.6612,46.7488], items:'1 box · 4.1 kg', pod:['Photo'], instr:'',
      log:[{ t:'14:20', e:'Order created', s:'Almasa Foods · connector' },{ t:'14:21', e:'Assigned to Ahmed Salem', s:'Auto' },{ t:'14:38', e:'Picked up', s:'COD SAR 95' },{ t:'14:56', e:'Delivered', s:'Photo captured · 3 min early' }] },
    { id:'DX-40874', merchant:'m1', branch:'Kanz — Hittin', customer:'c3', zone:'z1', driver:'d4', status:'Delivered',
      type:'Scheduled', source:'Direct', cod:0, price:26.0, created:'13:10', eta:'14:30', prio:'Normal',
      pickup:[24.8232,46.6089], drop:[24.8352,46.6270], items:'4 boxes · 18.0 kg', pod:['Photo','Signature'], instr:'Van required',
      log:[{ t:'13:10', e:'Order created', s:'Kanz Market · connector' },{ t:'14:10', e:'Assigned to Bandar Al Otaibi', s:'Scheduled · 20 min before' },{ t:'14:22', e:'Picked up', s:'' },{ t:'14:28', e:'Delivered', s:'Signature captured' }] },
    { id:'DX-40866', merchant:'m4', branch:'Shawarmer — Hittin', customer:'c2', zone:'z1', driver:'d7', status:'Returned',
      type:'On demand', source:'Direct', cod:48, price:16.0, created:'12:44', eta:'13:20', prio:'Normal',
      pickup:[24.8188,46.6151], drop:[24.8071,46.6035], items:'1 bag · 1.9 kg', pod:['Photo'], instr:'',
      log:[{ t:'12:44', e:'Order created', s:'Manual entry · dispatcher' },{ t:'12:45', e:'Assigned to Saad Al Amri', s:'Auto' },{ t:'13:02', e:'At delivery', s:'' },{ t:'13:14', e:'Failed — customer unreachable', s:'Reattempt 1 of 2' },{ t:'13:38', e:'Returned to merchant', s:'Auto-return rule' }] },
    { id:'DX-40852', merchant:'m5', branch:'Tamra — Al Malqa', customer:'c1', zone:'z1', driver:'d1', status:'Cancelled',
      type:'On demand', source:'Direct', cod:0, price:0, created:'11:52', eta:'—', prio:'Normal',
      pickup:[24.8205,46.6102], drop:[24.8290,46.6180], items:'Chilled · 0.8 kg', pod:['Photo'], instr:'',
      log:[{ t:'11:52', e:'Order created', s:'Tamra Pharmacy · connector' },{ t:'11:58', e:'Cancelled by merchant', s:'Reason: out of stock' }] }
  ];

  const NOTIFS = [
    { k:'Driver alert', t:'Zone East is 2 drivers short for the next hour', d:'2 min ago', sev:'high', link:'#/control-tower' },
    { k:'Order', t:'DX-40911 has no driver within radius — 4 min in queue', d:'4 min ago', sev:'high', link:'#/control-tower' },
    { k:'Document', t:'Omar Nasser — driving license expires in 32 days', d:'1 h ago', sev:'med', link:'#/drivers/d2' },
    { k:'Cash', t:'Bandar Al Otaibi holds SAR 780 in COD — handover due', d:'2 h ago', sev:'med', link:'#/drivers/d4' },
    { k:'Contract', t:'Chopped contract expires 18 Jan — renew or renegotiate', d:'yesterday', sev:'med', link:'#/merchants/m3' },
    { k:'Network', t:'Demand role approved by Dash — you can now send overflow', d:'2 days ago', sev:'low', link:'#/network' },
    { k:'System', t:'API key dsh_live_4f21 rotated by Sara (Admin)', d:'3 days ago', sev:'low', link:'#/developer' }
  ];

  const AUDIT = [
    { t:'15:44', u:'Sara Al Fahad', r:'Admin', a:'Created order', o:'DX-40911', ip:'188.55.x.x' },
    { t:'15:38', u:'Mishal (Dispatcher)', r:'Dispatcher', a:'Reassigned driver', o:'DX-40890 · d7 → d1', ip:'188.55.x.x' },
    { t:'15:20', u:'Sara Al Fahad', r:'Admin', a:'Changed assignment rule', o:'Radius 2.5 km → 3.0 km', ip:'188.55.x.x' },
    { t:'14:58', u:'System', r:'—', a:'Received network order', o:'DX-40907 · Supply', ip:'—' },
    { t:'14:31', u:'Noura (Finance)', r:'Finance', a:'Exported COD report', o:'Aug 1–29 · CSV', ip:'94.98.x.x' },
    { t:'13:02', u:'Sara Al Fahad', r:'Admin', a:'Paused zone', o:'RYD-W Al Sahafah', ip:'188.55.x.x' },
    { t:'11:40', u:'Mishal (Dispatcher)', r:'Dispatcher', a:'Cancelled order', o:'DX-40852 · merchant request', ip:'188.55.x.x' },
    { t:'09:15', u:'Sara Al Fahad', r:'Admin', a:'Invited driver to app', o:'Nawaf Al Ghamdi', ip:'188.55.x.x' }
  ];

  const TICKETS = [
    { id:'TK-2210', s:'Open', p:'High', t:'Network order arrived outside our coverage', link:'DX-40907', opened:'Today 15:02', last:'Dash replied 15:22' },
    { id:'TK-2204', s:'Pending', p:'Normal', t:'Webhook order.delivered retried 4 times', link:'API', opened:'Yesterday', last:'Awaiting our logs' },
    { id:'TK-2188', s:'Resolved', p:'Normal', t:'Driver app stuck on At pickup', link:'Faisal Al Harbi', opened:'26 Aug', last:'Fixed in 3.4.1' }
  ];

  const REPORTS = {
    week: [
      { d:'Sun', orders:186, onTime:95, avg:33 },
      { d:'Mon', orders:204, onTime:96, avg:31 },
      { d:'Tue', orders:191, onTime:94, avg:34 },
      { d:'Wed', orders:228, onTime:92, avg:36 },
      { d:'Thu', orders:266, onTime:90, avg:38 },
      { d:'Fri', orders:172, onTime:97, avg:29 },
      { d:'Sat', orders:213, onTime:96, avg:32 }
    ],
    scheduled: [
      { n:'Daily order summary', to:'ops@rehla.sa', when:'Every day 23:45', fmt:'PDF' },
      { n:'Weekly driver performance', to:'sara@rehla.sa', when:'Sunday 08:00', fmt:'CSV' },
      { n:'COD reconciliation', to:'finance@rehla.sa', when:'Daily 22:00', fmt:'CSV' }
    ]
  };

  return { PAL, CITIES, ZONES, DRIVERS, VEHICLES, GROUPS, SHIFTS, MERCHANTS, CUSTOMERS, ORDERS, STATUS, FLOW,
           NOTIFS, AUDIT, TICKETS, REPORTS,
           driver: id => DRIVERS.find(d => d.id === id),
           zone: id => ZONES.find(z => z.id === id),
           merchant: id => MERCHANTS.find(m => m.id === id),
           customer: id => CUSTOMERS.find(c => c.id === id),
           vehicle: id => VEHICLES.find(v => v.id === id),
           order: id => ORDERS.find(o => o.id === id) };
})();
