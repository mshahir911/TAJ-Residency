// Real Staff Profiles, Roles, PINs & Multi-Property Models for Taj Residency PMS

export const STAFF_CREDENTIALS = [
  {
    id: 'staff-owner-01',
    name: 'Muhammed Shahir',
    username: 'owner',
    aliases: ['owner', 'shahir', 'admin', '1001', 'shahir@tajresidency.com'],
    gender: 'male',
    role: 'owner',
    roleLabel: 'Hotel Owner / GM',
    title: 'Executive Owner & General Manager',
    email: 'shahir@tajresidency.com',
    phone: '+91 94950 11000',
    pin: '1001',
    password: '123',
    rawPassword: 'shahir@taj2026',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    shift: 'Executive Oversight (24x7)',
    allowedTabs: ['grid', 'collections', 'guests', 'analytics', 'pl', 'overrides', 'staff', 'audit', 'onboarding', 'housekeeping'],
    canEditRates: true,
    canViewAudit: true,
    canViewFinance: true,
    canManageStaff: true,
    canManageShift: true,
    canAccessHousekeeping: true,
    is_active: true,
    permissionsNote: 'Full access to Room Grid, Collections, Guests, Analytics (ADR/RevPAR), P&L Ledger, Rate Overrides, Staff Admin & Audit.'
  },
  {
    id: 'staff-rec-01',
    name: 'Anoop Nair',
    username: 'anoop',
    aliases: ['anoop', 'day', 'reception', '2001', 'anoop.reception@tajresidency.com'],
    gender: 'male',
    role: 'receptionist',
    roleLabel: 'Receptionist (Day Shift)',
    title: 'Front Desk Lead — Day Shift',
    email: 'anoop.reception@tajresidency.com',
    phone: '+91 98470 12001',
    pin: '2001',
    password: '123',
    rawPassword: 'anoop@taj2026',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    shift: 'Day Shift (06:00 - 14:00 IST)',
    allowedTabs: ['grid', 'collections', 'guests', 'self-checkin', 'shift', 'housekeeping'],
    canEditRates: false,
    canViewAudit: false,
    canViewFinance: false,
    canManageStaff: false,
    canManageShift: true,
    canAccessHousekeeping: true,
    is_active: true,
    permissionsNote: 'Desk Operations: Room Grid, Walk-in Check-in, Daily Collections, Guest Directory, WiFi vouchers, QR self-checkin, Shift Handover. No Analytics or Rate-Table editing.'
  },
  {
    id: 'staff-rec-02',
    name: 'Suresh Babu',
    username: 'suresh',
    aliases: ['suresh', 'night', '2002', 'suresh.reception@tajresidency.com'],
    gender: 'male',
    role: 'receptionist',
    roleLabel: 'Receptionist (Night Shift)',
    title: 'Night Desk Manager — Evening & Night Shift',
    email: 'suresh.reception@tajresidency.com',
    phone: '+91 98470 12002',
    pin: '2002',
    password: '123',
    rawPassword: 'suresh@taj2026',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    shift: 'Evening / Night Shift (14:00 - 22:00 / 22:00 - 06:00 IST)',
    allowedTabs: ['grid', 'collections', 'guests', 'self-checkin', 'shift', 'housekeeping'],
    canEditRates: false,
    canViewAudit: false,
    canViewFinance: false,
    canManageStaff: false,
    canManageShift: true,
    canAccessHousekeeping: true,
    is_active: true,
    permissionsNote: 'Night Desk Operations: Late check-ins, Room Grid, Daily Collections, Guest Directory, Shift Handover cash tally, WhatsApp invoices.'
  },
  {
    id: 'staff-hk-01',
    name: 'Meera Thomas',
    username: 'meera',
    aliases: ['meera', 'hk', 'housekeeping', '3001', 'meera.hk@tajresidency.com'],
    gender: 'female',
    role: 'housekeeping',
    roleLabel: 'Housekeeping (Lady Staff)',
    title: 'Head of Housekeeping & Linen Turnover',
    email: 'meera.hk@tajresidency.com',
    phone: '+91 98470 13001',
    pin: '3001',
    password: '123',
    rawPassword: 'meera@taj2026',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    shift: 'Linen Turnover & Sanitization (Day & Evening)',
    allowedTabs: ['housekeeping'],
    canEditRates: false,
    canViewAudit: false,
    canViewFinance: false,
    canManageStaff: false,
    canManageShift: false,
    canAccessHousekeeping: true,
    is_active: true,
    permissionsNote: 'Housekeeping Turnover Board ONLY. Single-tap room status cycle (Dirty -> Cleaning -> Clean -> Ready). All desk and financial tabs hidden.'
  }
];

export const STAFF_ROLES = {
  owner: {
    role: 'owner',
    label: 'Hotel Owner / GM',
    description: 'Complete operational and financial control, rate overrides, P&L, staff administration, and multi-property onboarding.',
    badgeClass: 'bg-brass text-ink font-bold',
    canEditRates: true,
    canViewAudit: true,
    canViewFinance: true,
    canManageStaff: true,
    canManageShift: true,
    canAccessHousekeeping: true
  },
  receptionist: {
    role: 'receptionist',
    label: 'Front Desk Receptionist',
    description: 'Counter operations: 15s walk-ins, folio invoicing, cash drawer reconciliation, guest directory & WiFi passes.',
    badgeClass: 'bg-signal-green text-ink font-bold',
    canEditRates: false,
    canViewAudit: false,
    canViewFinance: false,
    canManageStaff: false,
    canManageShift: true,
    canAccessHousekeeping: true
  },
  housekeeping: {
    role: 'housekeeping',
    label: 'Housekeeping Staff',
    description: 'Dedicated 1-tap turnover screen for room linen changes, sanitization cycles, and inspection ready flags.',
    badgeClass: 'bg-blue-500 text-white font-bold',
    canEditRates: false,
    canViewAudit: false,
    canViewFinance: false,
    canManageStaff: false,
    canManageShift: false,
    canAccessHousekeeping: true
  }
};

export const SEED_PROPERTIES = [
  {
    id: 'taj-residency-calicut',
    name: 'Taj Residency',
    subtitle: 'Adivaram, Kozhikode • Kerala',
    address: 'NH 766, Adivaram, Kozhikode, Kerala 673586',
    gst_number: '32AABCT9988Q1Z4',
    phone: '+91 99617 01414',
    whatsapp: '+91 99617 01414',
    email: 'frontdesk@tajresidency.com',
    wifiSSID: 'TajResidency_Adivaram',
    total_rooms: 11,
    city: 'Adivaram, Kozhikode',
    state: 'Kerala'
  },
  {
    id: 'malabar-heritage-wayanad',
    name: 'Malabar Heritage',
    subtitle: 'Plantation Retreat & Suites • Lakkidi, Wayanad',
    address: 'National Highway 766, Lakkidi Viewpoint, Wayanad, Kerala 673576',
    gst_number: '32AABCM1122P1Z9',
    phone: '+91 94950 22000',
    whatsapp: '+91 94950 22000',
    email: 'stay@malabarheritage.com',
    wifiSSID: 'MalabarHeritage_Resort',
    total_rooms: 8,
    city: 'Wayanad',
    state: 'Kerala'
  }
];

export const DEFAULT_GST_CONFIG = {
  sacCode: '996311',
  slabThreshold: 7500,
  standardRate: 12,
  luxuryRate: 18,
  legalEntity: 'Taj Residency Tourist Home Pvt Ltd',
  jurisdiction: 'Kozhikode, Kerala (State 32)'
};

export const ROOM_TYPES = {
  deluxe: {
    id: 'deluxe',
    name: 'Deluxe Room',
    ac_rate: 2000,
    non_ac_rate: 1500,
    description: 'Premium spacious room with balcony, 43" Smart TV, workstation, and luxury bath amenities.'
  },
  classic: {
    id: 'classic',
    name: 'Classic Room',
    ac_rate: 1500,
    non_ac_rate: 1000,
    description: 'Comfortable executive room with orthopaedic queen bed, high-speed WiFi, and 24/7 hot water.'
  }
};

export const DELUXE_ROOM_NUMBERS = ['201', '206', '301', '305'];
export const ALL_ROOM_NUMBERS = ['201', '202', '203', '204', '205', '206', '301', '302', '303', '304', '305'];

export const SEED_ROOMS = ALL_ROOM_NUMBERS.map(num => ({
  id: `room-${num}`,
  property_id: 'taj-residency-calicut',
  room_number: num,
  floor: num.startsWith('2') ? 2 : 3,
  room_type_id: DELUXE_ROOM_NUMBERS.includes(num) ? 'deluxe' : 'classic',
  status: num === '201' ? 'occupied' : (num === '203' ? 'occupied' : (num === '204' ? 'reserved' : (num === '205' ? 'dirty' : (num === '302' ? 'occupied' : (num === '304' ? 'occupied' : 'vacant'))))),
  current_booking_id: num === '201' ? 'bk-201-01' : (num === '203' ? 'bk-203-01' : (num === '204' ? 'bk-204-01' : (num === '302' ? 'bk-302-01' : (num === '304' ? 'bk-304-01' : null)))),
  wifi_voucher_code: num === '201' ? 'TR-WIFI-201-98A2' : (num === '203' ? 'TR-WIFI-203-44K1' : (num === '302' ? 'TR-WIFI-302-77L9' : (num === '304' ? 'TR-WIFI-304-51X2' : null))),
  housekeeper_assigned: num === '205' ? 'Meera Thomas' : null,
  inspected_by: num === '202' ? 'Meera Thomas' : null
}));

export const SEED_GUESTS = [
  {
    id: 'gst-01',
    property_id: 'taj-residency-calicut',
    name: 'Dr. Vivek Menon',
    phone: '+91 98470 11223',
    address: 'Medical College Junction, Kozhikode, Kerala',
    id_proof_type: 'Aadhaar Card',
    id_proof_number: 'XXXX-XXXX-4812',
    id_proof_photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
    id_proof_back_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
    id_verified_at: '2026-08-01 10:15',
    id_verified_by_staff: 'Anoop Nair',
    notes: 'Senior consultant visiting Baby Memorial Hospital. Prefers quiet top-floor AC room.',
    total_stays: 4,
    lifetime_spend: 18480
  },
  {
    id: 'gst-02',
    property_id: 'taj-residency-calicut',
    name: 'Arjun K.',
    phone: '+91 98460 77889',
    address: 'Panampilly Nagar, Kochi, Kerala',
    id_proof_type: 'Driving License',
    id_proof_number: 'KL-07-2019-00441',
    id_proof_photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    id_proof_back_photo_url: '',
    id_verified_at: '2026-08-05 14:20',
    id_verified_by_staff: 'Anoop Nair',
    notes: 'Spice trader traveling between Wayanad & Calicut port.',
    total_stays: 2,
    lifetime_spend: 4480
  },
  {
    id: 'gst-03',
    property_id: 'taj-residency-calicut',
    name: 'Rohan & Ananya Varma',
    phone: '+91 97440 33445',
    address: 'Indiranagar 100ft Road, Bangalore, Karnataka',
    id_proof_type: 'Passport',
    id_proof_number: 'Z-5541908',
    id_proof_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    id_proof_back_photo_url: '',
    id_verified_at: '2026-08-07 19:30',
    id_verified_by_staff: 'Anoop Nair',
    notes: 'Wedding guests arriving late tonight from Bangalore.',
    total_stays: 1,
    lifetime_spend: 3360
  }
];

export const SEED_BOOKINGS = {
  'bk-201-01': {
    id: 'bk-201-01',
    property_id: 'taj-residency-calicut',
    room_id: 'room-201',
    guest_id: 'gst-01',
    check_in_date: '2026-08-08 14:00',
    check_out_date: '2026-08-10 11:00',
    nights: 2,
    ac_or_non_ac: 'AC',
    rate_applied: 2000,
    is_seasonal_rate: false,
    seasonal_name: null,
    status: 'checked_in',
    advance_paid: 2000,
    payment_mode: 'UPI',
    wifi_code: 'TR-WIFI-201-98A2',
    created_by_staff_name: 'Anoop Nair',
    created_at: '2026-08-08 14:15'
  },
  'bk-203-01': {
    id: 'bk-203-01',
    property_id: 'taj-residency-calicut',
    room_id: 'room-203',
    guest_id: 'gst-02',
    check_in_date: '2026-08-08 16:30',
    check_out_date: '2026-08-09 11:00',
    nights: 1,
    ac_or_non_ac: 'AC',
    rate_applied: 1500,
    is_seasonal_rate: false,
    seasonal_name: null,
    status: 'checked_in',
    advance_paid: 1680,
    payment_mode: 'Cash',
    wifi_code: 'TR-WIFI-203-44K1',
    created_by_staff_name: 'Anoop Nair',
    created_at: '2026-08-08 16:35'
  },
  'bk-204-01': {
    id: 'bk-204-01',
    property_id: 'taj-residency-calicut',
    room_id: 'room-204',
    guest_id: 'gst-03',
    check_in_date: '2026-08-08 22:30',
    check_out_date: '2026-08-10 11:00',
    nights: 2,
    ac_or_non_ac: 'AC',
    rate_applied: 1500,
    is_seasonal_rate: false,
    seasonal_name: null,
    status: 'confirmed',
    advance_paid: 1500,
    payment_mode: 'UPI',
    wifi_code: 'TR-WIFI-204-71M9',
    created_by_staff_name: 'Anoop Nair',
    created_at: '2026-08-08 11:00'
  },
  'bk-302-01': {
    id: 'bk-302-01',
    property_id: 'taj-residency-calicut',
    room_id: 'room-302',
    guest_id: 'gst-01',
    check_in_date: '2026-08-07 15:00',
    check_out_date: '2026-08-09 11:00',
    nights: 2,
    ac_or_non_ac: 'Non-AC',
    rate_applied: 1000,
    is_seasonal_rate: false,
    seasonal_name: null,
    status: 'checked_in',
    advance_paid: 1000,
    payment_mode: 'UPI',
    wifi_code: 'TR-WIFI-302-77L9',
    created_by_staff_name: 'Suresh Babu',
    created_at: '2026-08-07 15:10'
  },
  'bk-304-01': {
    id: 'bk-304-01',
    property_id: 'taj-residency-calicut',
    room_id: 'room-304',
    guest_id: 'gst-02',
    check_in_date: '2026-08-08 12:00',
    check_out_date: '2026-08-09 11:00',
    nights: 1,
    ac_or_non_ac: 'AC',
    rate_applied: 1500,
    is_seasonal_rate: false,
    seasonal_name: null,
    status: 'checked_in',
    advance_paid: 1500,
    payment_mode: 'Card',
    wifi_code: 'TR-WIFI-304-51X2',
    created_by_staff_name: 'Anoop Nair',
    created_at: '2026-08-08 12:05'
  }
};

export const SEED_INVOICES = [
  {
    id: 'INV-2026-301-1092',
    property_id: 'taj-residency-calicut',
    booking_id: 'bk-settled-01',
    room_number: '301',
    guest_name: 'Nikhil Chandran',
    guest_phone: '+91 94471 22334',
    nights: 2,
    rate_applied: 2000,
    ac_or_non_ac: 'AC',
    room_charge: 4000,
    gst_rate: 12,
    gst_amount: 480,
    cgst_amount: 240,
    sgst_amount: 240,
    advance_paid: 2000,
    total: 4480,
    balance_settled: 2480,
    payment_mode: 'UPI',
    billed_by_staff_name: 'Anoop Nair',
    paid_at: '2026-08-08 10:45'
  },
  {
    id: 'INV-2026-206-1093',
    property_id: 'taj-residency-calicut',
    booking_id: 'bk-settled-02',
    room_number: '206',
    guest_name: 'K. S. Nambiar',
    guest_phone: '+91 98950 55667',
    nights: 1,
    rate_applied: 2000,
    ac_or_non_ac: 'AC',
    room_charge: 2000,
    gst_rate: 12,
    gst_amount: 240,
    cgst_amount: 120,
    sgst_amount: 120,
    advance_paid: 1000,
    total: 2240,
    balance_settled: 1240,
    payment_mode: 'Card',
    billed_by_staff_name: 'Anoop Nair',
    paid_at: '2026-08-08 11:20'
  },
  {
    id: 'INV-2026-303-1094',
    property_id: 'taj-residency-calicut',
    booking_id: 'bk-settled-03',
    room_number: '303',
    guest_name: 'Deepak V. S.',
    guest_phone: '+91 94460 88990',
    nights: 3,
    rate_applied: 1000,
    ac_or_non_ac: 'Non-AC',
    room_charge: 3000,
    gst_rate: 12,
    gst_amount: 360,
    cgst_amount: 180,
    sgst_amount: 180,
    advance_paid: 0,
    total: 3360,
    balance_settled: 3360,
    payment_mode: 'UPI',
    billed_by_staff_name: 'Anoop Nair',
    paid_at: '2026-08-08 12:10'
  }
];

export const SEED_EXPENSES = [
  {
    id: 'exp-01',
    property_id: 'taj-residency-calicut',
    category: 'salary',
    category_label: 'Staff Salary & Wages',
    amount: 54000,
    date: '2026-08-01',
    vendor: 'Reception & HK Team (Anoop, Suresh, Meera)',
    notes: 'Monthly salaries settled via bank transfer',
    logged_by: 'Muhammed Shahir'
  },
  {
    id: 'exp-02',
    property_id: 'taj-residency-calicut',
    category: 'electricity',
    category_label: 'KSEB Commercial Power',
    amount: 18450,
    date: '2026-08-03',
    vendor: 'Kerala State Electricity Board (KSEB)',
    notes: 'AC power consumption for 11 rooms + lobby',
    logged_by: 'Muhammed Shahir'
  },
  {
    id: 'exp-03',
    property_id: 'taj-residency-calicut',
    category: 'laundry',
    category_label: 'Linen & Dry Cleaning',
    amount: 6200,
    date: '2026-08-05',
    vendor: 'Calicut Steam Laundry Works',
    notes: 'Duvet covers, bedsheets, bath towels turnover',
    logged_by: 'Anoop Nair'
  },
  {
    id: 'exp-04',
    property_id: 'taj-residency-calicut',
    category: 'maintenance',
    category_label: 'AC Servicing & Plumbing',
    amount: 3800,
    date: '2026-08-06',
    vendor: 'Voltas Authorised Service Center',
    notes: 'Gas refill and coil cleaning for Room 301 & 305 ACs',
    logged_by: 'Suresh Babu'
  },
  {
    id: 'exp-05',
    property_id: 'taj-residency-calicut',
    category: 'toiletries',
    category_label: 'Guest Amenities & Water',
    amount: 4100,
    date: '2026-08-07',
    vendor: 'Bisleri & Mysore Sandal Wholesale',
    notes: 'Packaged drinking water bottles and soaps',
    logged_by: 'Meera Thomas'
  }
];

export const SEED_SEASONAL_OVERRIDES = [
  {
    id: 'ovr-onam-2026',
    property_id: 'taj-residency-calicut',
    name: 'Onam Tourism Surge (Kerala Grand Festival)',
    start_date: '2026-08-25',
    end_date: '2026-09-05',
    room_type_id: 'deluxe',
    override_ac_rate: 2800,
    override_non_ac_rate: 2000,
    reason: 'Heavy tourist inflow for Onam celebrations in Kozhikode & Wayanad.',
    is_active: true
  },
  {
    id: 'ovr-beypore-fest',
    property_id: 'taj-residency-calicut',
    name: 'Beypore International Water Fest Surge',
    start_date: '2026-12-20',
    end_date: '2027-01-05',
    room_type_id: 'classic',
    override_ac_rate: 2000,
    override_non_ac_rate: 1400,
    reason: 'Peak winter tourism and water fest rush.',
    is_active: true
  }
];

export const SEED_HEATMAP_DATA = [
  { day: 'Mon', week1: 65, week2: 72, week3: 60, week4: 80 },
  { day: 'Tue', week1: 55, week2: 60, week3: 70, week4: 75 },
  { day: 'Wed', week1: 70, week2: 80, week3: 65, week4: 85 },
  { day: 'Thu', week1: 85, week2: 90, week3: 88, week4: 92 },
  { day: 'Fri', week1: 95, week2: 100, week3: 92, week4: 100 },
  { day: 'Sat', week1: 100, week2: 100, week3: 100, week4: 100 },
  { day: 'Sun', week1: 90, week2: 85, week3: 90, week4: 95 }
];

export const SEED_SHIFT_LOGS = [
  {
    id: 'shf-01',
    property_id: 'taj-residency-calicut',
    shift_name: 'Night Shift (22:00 - 06:00)',
    staff_name: 'Suresh Babu',
    date: '2026-08-08 06:00',
    cash_in_drawer: 2240,
    physical_cash_confirmed: 2240,
    discrepancy: 0,
    rooms_checked_in: 2,
    rooms_checked_out: 0,
    handover_notes: 'Dr. Vivek Menon checked in Room 201. Advance ₹2,000 paid via UPI. Cash drawer verified at ₹2,240.'
  }
];

export const SEED_AUDIT_LOGS = [
  {
    id: 'aud-01',
    property_id: 'taj-residency-calicut',
    timestamp: '2026-08-08 14:15:20',
    staff_role: 'Receptionist',
    staff_name: 'Anoop Nair',
    action: 'CHECK_IN_FAST',
    target: 'Room 201',
    details: 'Checked in Dr. Vivek Menon (+91 98470 11223). Advance ₹2,000 via UPI. WiFi voucher TR-WIFI-201-98A2 generated.'
  },
  {
    id: 'aud-02',
    property_id: 'taj-residency-calicut',
    timestamp: '2026-08-08 12:10:45',
    staff_role: 'Receptionist',
    staff_name: 'Anoop Nair',
    action: 'CHECKOUT_BILLED',
    target: 'Room 303',
    details: 'Folio INV-2026-303-1094 settled. Total ₹3,360 via UPI. Room 303 transitioned to DIRTY.'
  },
  {
    id: 'aud-03',
    property_id: 'taj-residency-calicut',
    timestamp: '2026-08-08 12:45:10',
    staff_role: 'Housekeeping',
    staff_name: 'Meera Thomas',
    action: 'ROOM_STATUS_CYCLE',
    target: 'Room 303',
    details: 'Status advanced from DIRTY -> CLEANING -> CLEAN. Fresh linens and towels placed.'
  },
  {
    id: 'aud-04',
    property_id: 'taj-residency-calicut',
    timestamp: '2026-08-08 10:00:00',
    staff_role: 'Owner',
    staff_name: 'Muhammed Shahir',
    action: 'SEASONAL_OVERRIDE_SET',
    target: 'Onam 2026',
    details: 'Activated Onam Festival surge pricing (₹2,800 AC Deluxe) for Aug 25 - Sep 05.'
  }
];

export const SEED_SELF_CHECKINS = [
  {
    id: 'self-01',
    property_id: 'taj-residency-calicut',
    booking_id: 'bk-204-01',
    room_number: '204',
    guest_name: 'Rohan Varma',
    phone: '+91 97440 33445',
    id_proof_type: 'Passport',
    id_proof_number: 'Z-5541908',
    id_proof_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    address: 'Indiranagar, Bangalore',
    eta: 'Tonight 22:30',
    digital_signature_captured: true,
    submitted_at: '2026-08-08 18:20',
    status: 'pending_reception_confirmation'
  }
];
