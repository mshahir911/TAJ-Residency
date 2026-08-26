import { useState, useEffect } from 'react';
import {
  STAFF_CREDENTIALS,
  SEED_PROPERTIES,
  STAFF_ROLES,
  DEFAULT_GST_CONFIG,
  ROOM_TYPES,
  SEED_ROOMS,
  SEED_GUESTS,
  SEED_BOOKINGS,
  SEED_INVOICES,
  SEED_SHIFT_LOGS,
  SEED_AUDIT_LOGS,
  SEED_SELF_CHECKINS,
  SEED_EXPENSES,
  SEED_SEASONAL_OVERRIDES,
  SEED_HEATMAP_DATA
} from '../types/data';
import { syncService } from '../services/syncService';

const STORAGE_KEY = 'taj_residency_pms_v6_safe_auth';

export function usePMSStore() {
  const getInitialData = () => ({
    currentStaffId: 'staff-rec-01', // Default to Anoop Nair (Day Shift Receptionist)
    viewMode: 'app', // 'app' | 'marketing'
    activePropertyId: 'taj-residency-calicut',
    staffList: STAFF_CREDENTIALS,
    properties: SEED_PROPERTIES,
    roomTypes: ROOM_TYPES,
    gstConfig: DEFAULT_GST_CONFIG,
    rooms: SEED_ROOMS,
    guests: SEED_GUESTS,
    bookings: SEED_BOOKINGS,
    invoices: SEED_INVOICES,
    expenses: SEED_EXPENSES,
    seasonalOverrides: SEED_SEASONAL_OVERRIDES,
    heatmapData: SEED_HEATMAP_DATA,
    shiftLogs: SEED_SHIFT_LOGS,
    auditLogs: SEED_AUDIT_LOGS,
    selfCheckins: SEED_SELF_CHECKINS,
    currentShift: {
      name: 'Day Shift (06:00 - 14:00)',
      staffName: 'Anoop Nair',
      startedAt: '2026-08-08 06:00',
      openingCash: 2240
    },
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  });

  const [state, setState] = useState(() => {
    const initial = getInitialData();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initial,
          ...parsed,
          staffList: Array.isArray(parsed.staffList) && parsed.staffList.length > 0 ? parsed.staffList : STAFF_CREDENTIALS,
          properties: Array.isArray(parsed.properties) && parsed.properties.length > 0 ? parsed.properties : SEED_PROPERTIES,
          rooms: Array.isArray(parsed.rooms) && parsed.rooms.length > 0 ? parsed.rooms : SEED_ROOMS,
          guests: Array.isArray(parsed.guests) ? parsed.guests : SEED_GUESTS,
          bookings: parsed.bookings && typeof parsed.bookings === 'object' ? parsed.bookings : SEED_BOOKINGS,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : SEED_INVOICES,
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : SEED_EXPENSES,
          seasonalOverrides: Array.isArray(parsed.seasonalOverrides) ? parsed.seasonalOverrides : SEED_SEASONAL_OVERRIDES,
          shiftLogs: Array.isArray(parsed.shiftLogs) ? parsed.shiftLogs : SEED_SHIFT_LOGS,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : SEED_AUDIT_LOGS,
          selfCheckins: Array.isArray(parsed.selfCheckins) ? parsed.selfCheckins : SEED_SELF_CHECKINS,
          roomTypes: parsed.roomTypes && typeof parsed.roomTypes === 'object' ? parsed.roomTypes : ROOM_TYPES,
          gstConfig: parsed.gstConfig && typeof parsed.gstConfig === 'object' ? parsed.gstConfig : DEFAULT_GST_CONFIG
        };
      }
    } catch (e) {
      console.warn('Failed to parse local storage state:', e);
    }
    return initial;
  });

  // Local-first persistent write & cross-device broadcast
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      syncService.broadcast(state, 'STATE_UPDATE');
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [state]);

  // Real-Time Cross-Device Synchronization Listener (Desk <-> Mobile)
  const [syncStatus, setSyncStatus] = useState({
    status: 'local',
    lastSyncedAt: null,
    connectedDevicesCount: 1,
    deviceId: syncService.getDeviceId()
  });

  useEffect(() => {
    syncService.init(
      (remoteState, actionName, source) => {
        setState(prev => ({
          ...prev,
          ...remoteState,
          currentStaffId: prev.currentStaffId,
          viewMode: prev.viewMode
        }));
      },
      (statusInfo) => {
        setSyncStatus(statusInfo);
      }
    );
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setState(p => ({ ...p, isOnline: true }));
    const handleOffline = () => setState(p => ({ ...p, isOnline: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Safe staff and role resolution
  const staffList = Array.isArray(state.staffList) && state.staffList.length > 0 ? state.staffList : STAFF_CREDENTIALS;
  const currentStaff = staffList.find(s => s.id === state.currentStaffId) || staffList[1] || staffList[0] || STAFF_CREDENTIALS[0];
  const currentRole = currentStaff?.role || 'receptionist';

  // Helper: Append immutable audit log
  const logAudit = (action, target, details, staffRole = currentRole, staffName = currentStaff?.name || 'Staff') => {
    const newLog = {
      id: 'aud-' + Date.now(),
      property_id: state.activePropertyId || 'taj-residency-calicut',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      staff_role: staffRole === 'owner' ? 'Owner' : (staffRole === 'housekeeping' ? 'Housekeeping' : 'Receptionist'),
      staff_name: staffName,
      action,
      target,
      details
    };
    return newLog;
  };

  // Staff Authentication & Switcher Actions
  const loginStaff = (identifier, pinOrPass) => {
    const cleanId = (identifier || '').toLowerCase().trim();
    const cleanPass = (pinOrPass || '').trim();

    const matched = staffList.find(s => {
      const matchId =
        (s.username && s.username.toLowerCase() === cleanId) ||
        (s.id && s.id.toLowerCase() === cleanId) ||
        (s.email && s.email.toLowerCase() === cleanId) ||
        (s.aliases && s.aliases.some(a => a.toLowerCase() === cleanId)) ||
        (s.phone && s.phone.replace(/[^0-9]/g, '').includes(cleanId.replace(/[^0-9]/g, ''))) ||
        (s.pin === cleanId) ||
        (s.name && s.name.toLowerCase().includes(cleanId));

      if (!matchId) return false;
      if (!cleanPass) return true; // Direct 1-tap demo test pass

      const matchPass =
        s.password === cleanPass ||
        s.rawPassword === cleanPass ||
        s.pin === cleanPass ||
        cleanPass === '123' ||
        cleanPass === '1234' ||
        cleanPass === 'admin' ||
        cleanPass === 'demo';

      return matchPass;
    });

    if (matched) {
      const auditEntry = logAudit(
        'STAFF_LOGIN',
        matched.name,
        `Signed in as ${matched.name} (${matched.roleLabel}). Session authenticated.`
      );

      setState(prev => ({
        ...prev,
        currentStaffId: matched.id,
        currentShift: matched.role === 'receptionist' ? {
          ...prev.currentShift,
          staffName: matched.name,
          name: matched.shift
        } : prev.currentShift,
        auditLogs: [auditEntry, ...(prev.auditLogs || [])]
      }));
      return { success: true, staff: matched };
    }
    return { success: false, message: 'Invalid Staff ID or Password. Try simple test ID (owner, anoop, suresh, meera) with pass: 123' };
  };

  const quickSwitchStaff = (staffId) => {
    const targetStaff = staffList.find(s => s.id === staffId);
    if (!targetStaff) return;

    const auditEntry = logAudit(
      'STAFF_LOGIN',
      targetStaff.name,
      `Switched session to ${targetStaff.name} (${targetStaff.roleLabel}). Access scoped to ${targetStaff.role.toUpperCase()}.`
    );

    setState(prev => ({
      ...prev,
      currentStaffId: staffId,
      currentShift: targetStaff.role === 'receptionist' ? {
        ...prev.currentShift,
        staffName: targetStaff.name,
        name: targetStaff.shift
      } : prev.currentShift,
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  // 1-Click Reset Demo Data
  const resetDemoData = () => {
    const fresh = getInitialData();
    fresh.viewMode = 'app';
    setState(fresh);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
  };

  const setViewMode = (mode) => {
    setState(prev => ({
      ...prev,
      viewMode: mode
    }));
  };

  // Active property lookup
  const propertiesList = Array.isArray(state.properties) && state.properties.length > 0 ? state.properties : SEED_PROPERTIES;
  const activeProperty = propertiesList.find(p => p.id === state.activePropertyId) || propertiesList[0] || SEED_PROPERTIES[0];

  // Property-scoped entities
  const scopedRooms = (state.rooms || SEED_ROOMS).filter(r => r.property_id === state.activePropertyId);
  const scopedInvoices = (state.invoices || SEED_INVOICES).filter(i => i.property_id === state.activePropertyId);
  const scopedExpenses = (state.expenses || SEED_EXPENSES).filter(e => e.property_id === state.activePropertyId);
  const scopedOverrides = (state.seasonalOverrides || SEED_SEASONAL_OVERRIDES).filter(o => o.property_id === state.activePropertyId);
  const scopedShiftLogs = (state.shiftLogs || SEED_SHIFT_LOGS).filter(s => (s.property_id || state.activePropertyId) === state.activePropertyId);
  const scopedAuditLogs = (state.auditLogs || SEED_AUDIT_LOGS).filter(a => (a.property_id || state.activePropertyId) === state.activePropertyId);
  const scopedSelfCheckins = (state.selfCheckins || SEED_SELF_CHECKINS).filter(c => (c.property_id || state.activePropertyId) === state.activePropertyId);

  // Helper: Generate WiFi Voucher code for a room
  const generateWiFiCode = (roomNumber) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = activeProperty.name?.includes('Malabar') ? 'MH' : 'TR';
    return `${prefix}-WIFI-${roomNumber}-${rand}`;
  };

  // Helper: Look up guest by phone number
  const findGuestByPhone = (phone) => {
    if (!phone || phone.length < 5) return null;
    const cleanQuery = phone.replace(/[^0-9]/g, '');
    return (state.guests || SEED_GUESTS).find(g => {
      const cleanGPhone = (g.phone || '').replace(/[^0-9]/g, '');
      return cleanGPhone.includes(cleanQuery) || cleanGPhone.slice(-10) === cleanQuery.slice(-10);
    }) || null;
  };

  // Helper: Dynamic Rate lookup with Seasonal Override check
  const getRateForRoom = (roomTypeId, acOrNonAc, checkInDate = new Date().toISOString().slice(0, 10)) => {
    const roomType = (state.roomTypes && state.roomTypes[roomTypeId]) || ROOM_TYPES.deluxe || { ac_rate: 2000, non_ac_rate: 1500 };

    const checkDateStr = (checkInDate || '').slice(0, 10);
    const activeOverride = scopedOverrides.find(ovr => {
      if (!ovr.is_active || ovr.room_type_id !== roomTypeId) return false;
      return checkDateStr >= ovr.start_date && checkDateStr <= ovr.end_date;
    });

    if (activeOverride) {
      const overrideRate = acOrNonAc === 'AC' ? activeOverride.override_ac_rate : activeOverride.override_non_ac_rate;
      return {
        rate: overrideRate,
        isOverridden: true,
        overrideName: activeOverride.name,
        baseRate: acOrNonAc === 'AC' ? roomType.ac_rate : roomType.non_ac_rate
      };
    }

    const baseRate = acOrNonAc === 'AC' ? roomType.ac_rate : roomType.non_ac_rate;
    return {
      rate: baseRate,
      isOverridden: false,
      overrideName: null,
      baseRate
    };
  };

  // Helper: Calculate GST for a tariff
  const calculateGST = (ratePerNight, nights = 1) => {
    const totalRoomCharge = ratePerNight * nights;
    const gstConf = state.gstConfig || DEFAULT_GST_CONFIG;
    const gstRate = ratePerNight > gstConf.slabThreshold
      ? gstConf.luxuryRate
      : gstConf.standardRate;
    const gstAmount = Math.round((totalRoomCharge * gstRate) / 100);
    return {
      gstRate,
      cgstRate: gstRate / 2,
      sgstRate: gstRate / 2,
      cgstAmount: Math.round(gstAmount / 2),
      sgstAmount: Math.round(gstAmount / 2),
      gstAmount,
      totalRoomCharge,
      grandTotal: totalRoomCharge + gstAmount
    };
  };

  // ACTIONS

  // 1. Switch Property
  const switchProperty = (propertyId) => {
    setState(prev => ({
      ...prev,
      activePropertyId: propertyId
    }));
  };

  // 2. Onboard New Property
  const onboardNewProperty = ({
    name,
    subtitle,
    city,
    state: propState,
    address,
    gstNumber,
    phone,
    whatsapp,
    email,
    wifiSSID,
    roomTypesList,
    roomsList,
    staffList: newStaffList
  }) => {
    const newPropId = `prop-${Date.now().toString().slice(-6)}`;

    const newProperty = {
      id: newPropId,
      name,
      subtitle: subtitle || `${name} • ${city}, ${propState}`,
      address,
      gst_number: gstNumber || '32AABCT0000Z1Z1',
      phone: phone || '+91 94950 00000',
      whatsapp: whatsapp || phone || '+91 94950 00000',
      email: email || 'frontdesk@hotel.com',
      wifiSSID: wifiSSID || `${name.replace(/\s+/g, '')}_Guest`,
      total_rooms: roomsList.length,
      city,
      state: propState
    };

    const newRoomTypes = { ...state.roomTypes };
    roomTypesList.forEach((rt, idx) => {
      const rtId = `rt-${newPropId}-${idx + 1}`;
      newRoomTypes[rtId] = {
        id: rtId,
        property_id: newPropId,
        name: rt.name,
        ac_rate: Number(rt.ac_rate) || 2000,
        non_ac_rate: Number(rt.non_ac_rate) || 1500,
        description: rt.description || 'Modern furnished guest room'
      };
    });

    const newRooms = roomsList.map((r, i) => {
      const matchedRtId = Object.keys(newRoomTypes).find(k => newRoomTypes[k].property_id === newPropId) || 'deluxe';
      return {
        id: `room-${newPropId}-${r.room_number}`,
        property_id: newPropId,
        room_number: r.room_number,
        room_type_id: r.room_type_id || matchedRtId,
        floor: Number(r.floor) || 1,
        status: 'vacant',
        current_booking_id: null,
        wifi_voucher_code: null
      };
    });

    const auditEntry = {
      id: 'aud-' + Date.now(),
      property_id: newPropId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      staff_role: 'Owner',
      staff_name: currentStaff?.name || 'Owner',
      action: 'PROPERTY_ONBOARDED',
      target: name,
      details: `Self-onboarded ${name} with ${newRooms.length} rooms, ${roomTypesList.length} room types, and ${newStaffList?.length || 0} staff invites.`
    };

    setState(prev => ({
      ...prev,
      properties: [...(prev.properties || []), newProperty],
      roomTypes: newRoomTypes,
      rooms: [...(prev.rooms || []), ...newRooms],
      activePropertyId: newPropId,
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return newPropId;
  };

  // 3. Add Expense
  const addExpense = ({ category, categoryLabel, amount, date, vendor, notes }) => {
    const expenseId = 'exp-' + Date.now();
    const newExpense = {
      id: expenseId,
      property_id: state.activePropertyId,
      category: category || 'other',
      category_label: categoryLabel || 'Operational Expense',
      amount: Number(amount) || 0,
      date: date || new Date().toISOString().slice(0, 10),
      vendor: vendor || 'Local Vendor',
      notes: notes || 'Front desk logged expense',
      logged_by: currentStaff?.name || 'Owner'
    };

    const auditEntry = logAudit(
      'EXPENSE_LOGGED',
      `${categoryLabel} (₹${amount})`,
      `Logged expense of ₹${amount} under ${category} to ${vendor}. Notes: ${notes}`
    );

    setState(prev => ({
      ...prev,
      expenses: [newExpense, ...(prev.expenses || [])],
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return expenseId;
  };

  // 4. Seasonal Overrides
  const addSeasonalOverride = ({ name, startDate, endDate, roomTypeId, overrideAcRate, overrideNonAcRate, reason }) => {
    const overrideId = 'ovr-' + Date.now();
    const newOverride = {
      id: overrideId,
      property_id: state.activePropertyId,
      name,
      start_date: startDate,
      end_date: endDate,
      room_type_id: roomTypeId,
      override_ac_rate: Number(overrideAcRate),
      override_non_ac_rate: Number(overrideNonAcRate),
      reason: reason || 'Seasonal festival adjustment',
      is_active: true
    };

    const auditEntry = logAudit(
      'SEASONAL_OVERRIDE_CREATED',
      name,
      `Set override rates (₹${overrideAcRate} AC / ₹${overrideNonAcRate} Non-AC) from ${startDate} to ${endDate} for ${roomTypeId}`
    );

    setState(prev => ({
      ...prev,
      seasonalOverrides: [newOverride, ...(prev.seasonalOverrides || [])],
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return overrideId;
  };

  const deleteSeasonalOverride = (overrideId) => {
    const ovr = (state.seasonalOverrides || []).find(o => o.id === overrideId);
    const auditEntry = logAudit(
      'SEASONAL_OVERRIDE_DELETED',
      ovr?.name || 'Override Rule',
      `Deleted seasonal override ${overrideId}`
    );

    setState(prev => ({
      ...prev,
      seasonalOverrides: (prev.seasonalOverrides || []).filter(o => o.id !== overrideId),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  // 5. Booking Creation
  const createBooking = ({
    roomId,
    guestName,
    guestPhone,
    guestAddress,
    guestIdType,
    guestIdNumber,
    guestIdPhotoUrl,
    guestIdBackPhotoUrl,
    guestNotes,
    checkInDate,
    checkOutDate,
    acOrNonAc,
    advancePaid,
    paymentMode,
    isPreBooking,
    created_by_staff_name
  }) => {
    const room = (state.rooms || SEED_ROOMS).find(r => r.id === roomId);
    if (!room) return;

    const authorStaff = created_by_staff_name || currentStaff?.name || 'Receptionist';
    const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let existingGuest = findGuestByPhone(guestPhone);
    let guestId = existingGuest ? existingGuest.id : `gst-${Date.now()}`;

    let updatedGuests = [...(state.guests || SEED_GUESTS)];
    if (existingGuest) {
      updatedGuests = updatedGuests.map(g => {
        if (g.id === existingGuest.id) {
          return {
            ...g,
            name: guestName || g.name,
            address: guestAddress || g.address,
            id_proof_type: guestIdType || g.id_proof_type,
            id_proof_number: guestIdNumber || g.id_proof_number,
            id_proof_photo_url: guestIdPhotoUrl || g.id_proof_photo_url,
            id_proof_back_photo_url: guestIdBackPhotoUrl || g.id_proof_back_photo_url,
            id_verified_at: guestIdPhotoUrl ? nowTimestamp : (g.id_verified_at || nowTimestamp),
            id_verified_by_staff: authorStaff,
            notes: guestNotes || g.notes,
            total_stays: (g.total_stays || 1) + 1
          };
        }
        return g;
      });
    } else {
      updatedGuests.push({
        id: guestId,
        property_id: state.activePropertyId,
        name: guestName,
        phone: guestPhone,
        address: guestAddress || 'Kozhikode, Kerala',
        id_proof_type: guestIdType || 'Aadhaar Card',
        id_proof_number: guestIdNumber || 'VERIFIED-DESK',
        id_proof_photo_url: guestIdPhotoUrl || '',
        id_proof_back_photo_url: guestIdBackPhotoUrl || '',
        id_verified_at: guestIdPhotoUrl ? nowTimestamp : '',
        id_verified_by_staff: guestIdPhotoUrl ? authorStaff : '',
        notes: guestNotes || 'Walk-in Guest',
        total_stays: 1,
        lifetime_spend: 0
      });
    }

    const nights = Math.max(1, Math.ceil(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    )) || 1;

    const rateLookup = getRateForRoom(room.room_type_id, acOrNonAc, checkInDate);
    const rateApplied = rateLookup.rate;
    const bookingId = `bk-${room.room_number}-${Date.now().toString().slice(-4)}`;
    const wifiCode = generateWiFiCode(room.room_number);

    const newBooking = {
      id: bookingId,
      property_id: state.activePropertyId,
      room_id: roomId,
      guest_id: guestId,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      nights,
      ac_or_non_ac: acOrNonAc,
      rate_applied: rateApplied,
      is_seasonal_rate: rateLookup.isOverridden,
      seasonal_name: rateLookup.overrideName,
      status: isPreBooking ? 'confirmed' : 'checked_in',
      advance_paid: Number(advancePaid || 0),
      payment_mode: paymentMode || 'Cash',
      wifi_code: wifiCode,
      created_by_staff_name: authorStaff,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const nextRoomStatus = isPreBooking ? 'reserved' : 'occupied';

    const auditEntry = logAudit(
      'BOOKING_CREATED',
      `Room ${room.room_number}`,
      `Guest ${guestName} (${acOrNonAc} @ ₹${rateApplied}/night). Adv ₹${advancePaid} via ${paymentMode}. Staff: ${authorStaff}. WiFi: ${wifiCode}`
    );

    setState(prev => ({
      ...prev,
      guests: updatedGuests,
      bookings: {
        ...(prev.bookings || {}),
        [bookingId]: newBooking
      },
      rooms: (prev.rooms || []).map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: nextRoomStatus,
            current_booking_id: bookingId,
            wifi_voucher_code: wifiCode
          };
        }
        return r;
      }),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return bookingId;
  };

  // 5b. Extend In-House Booking Stay (+1 Day / +2 Days)
  const extendBookingStay = (roomId, additionalDays = 1) => {
    const room = (state.rooms || []).find(r => r.id === roomId);
    if (!room || !room.current_booking_id) return null;

    const booking = (state.bookings || {})[room.current_booking_id];
    if (!booking) return null;

    const currentNights = Number(booking.nights || 1);
    const newNights = currentNights + Number(additionalDays);

    const checkInDateObj = new Date(booking.check_in_date || new Date());
    const newCheckOutDateObj = new Date(checkInDateObj.getTime() + newNights * 24 * 60 * 60 * 1000);
    const newCheckOutStr = newCheckOutDateObj.toISOString().replace('T', ' ').slice(0, 16);

    const guest = (state.guests || []).find(g => g.id === booking.guest_id);
    const auditEntry = logAudit(
      'STAY_EXTENDED',
      `Room ${room.room_number}`,
      `Stay extended by +${additionalDays} Day(s) for guest ${guest?.name || 'Guest'}. Total stay: ${newNights} Nights. New checkout: ${newCheckOutStr}.`
    );

    setState(prev => ({
      ...prev,
      bookings: {
        ...(prev.bookings || {}),
        [booking.id]: {
          ...booking,
          nights: newNights,
          check_out_date: newCheckOutStr
        }
      },
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return {
      newNights,
      newCheckOutDate: newCheckOutStr
    };
  };

  // 6. Checkout & Billing with Optional Concession / Discount
  const checkoutAndGenerateInvoice = (roomId, { paymentMode, notes, billed_by_staff_name, discountAmount = 0, discountType = 'flat', discountReason = '' }) => {
    const room = (state.rooms || []).find(r => r.id === roomId);
    if (!room || !room.current_booking_id) return;

    const booking = (state.bookings || {})[room.current_booking_id];
    if (!booking) return;

    const guest = (state.guests || []).find(g => g.id === booking.guest_id);
    const nights = booking.nights || 1;
    const grossRoomCharge = booking.rate_applied * nights;

    // Calculate final discount
    const finalDiscount = Number(discountAmount) || 0;
    const taxableRoomCharge = Math.max(0, grossRoomCharge - finalDiscount);
    const gstCalc = calculateGST(taxableRoomCharge > 0 ? (taxableRoomCharge / nights) : 0, nights);

    const grandTotal = taxableRoomCharge + gstCalc.gstAmount;
    const balanceSettled = Math.max(0, grandTotal - (booking.advance_paid || 0));

    const invoiceId = `INV-${new Date().getFullYear()}-${room.room_number}-${Math.floor(1000 + Math.random() * 9000)}`;
    const billerStaff = billed_by_staff_name || currentStaff?.name || 'Receptionist';

    const newInvoice = {
      id: invoiceId,
      property_id: state.activePropertyId,
      booking_id: booking.id,
      room_number: room.room_number,
      guest_name: guest?.name || 'Guest',
      guest_phone: guest?.phone || '',
      nights,
      rate_applied: booking.rate_applied,
      ac_or_non_ac: booking.ac_or_non_ac,
      gross_room_charge: grossRoomCharge,
      discount_amount: finalDiscount,
      discount_type: discountType,
      discount_reason: discountReason || 'Counter Courtesy / Special Discount',
      room_charge: taxableRoomCharge,
      gst_rate: gstCalc.gstRate,
      gst_amount: gstCalc.gstAmount,
      cgst_amount: gstCalc.cgstAmount,
      sgst_amount: gstCalc.sgstAmount,
      advance_paid: booking.advance_paid || 0,
      total: grandTotal,
      balance_settled: balanceSettled,
      payment_mode: paymentMode || 'UPI',
      billed_by_staff_name: billerStaff,
      paid_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const auditEntry = logAudit(
      'CHECKOUT_BILLED',
      `Room ${room.room_number}`,
      `Billed ${guest?.name}. Gross: ₹${grossRoomCharge}${finalDiscount > 0 ? `, Discount: -₹${finalDiscount} (${discountReason || 'Courtesy'})` : ''}, Total: ₹${grandTotal}, Settled: ₹${balanceSettled} via ${paymentMode}. Staff: ${billerStaff}. Room auto-flagged DIRTY.`
    );

    setState(prev => ({
      ...prev,
      invoices: [newInvoice, ...(prev.invoices || [])],
      bookings: {
        ...(prev.bookings || {}),
        [booking.id]: {
          ...booking,
          status: 'checked_out',
          invoice_id: invoiceId
        }
      },
      rooms: (prev.rooms || []).map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: 'dirty',
            last_guest_name: guest?.name,
            checked_out_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
            current_booking_id: null,
            wifi_voucher_code: null,
            housekeeper_assigned: 'Meera Thomas (HK Lead)'
          };
        }
        return r;
      }),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return newInvoice;
  };

  // 7. Housekeeping Status Advancement (Lady Staff Meera Thomas)
  const advanceHousekeepingStatus = (roomId, staffName = 'Meera Thomas') => {
    const room = (state.rooms || []).find(r => r.id === roomId);
    if (!room) return;

    let nextStatus = 'vacant';
    let actionDetail = '';

    if (room.status === 'dirty') {
      nextStatus = 'cleaning';
      actionDetail = `Started cleaning and linen change. Housekeeper: ${staffName}`;
    } else if (room.status === 'cleaning') {
      nextStatus = 'clean';
      actionDetail = `Sanitization complete. Room clean, awaiting final inspection.`;
    } else if (room.status === 'clean') {
      nextStatus = 'ready';
      actionDetail = `Inspected and verified ready for next guest check-in.`;
    } else if (room.status === 'ready') {
      nextStatus = 'vacant';
      actionDetail = `Marked active vacant on reception board.`;
    }

    const auditEntry = logAudit(
      'HOUSEKEEPING_ADVANCE',
      `Room ${room.room_number}`,
      `Status changed from ${room.status.toUpperCase()} -> ${nextStatus.toUpperCase()}. ${actionDetail}`,
      'housekeeping',
      staffName
    );

    setState(prev => ({
      ...prev,
      rooms: (prev.rooms || []).map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: nextStatus,
            housekeeper_assigned: staffName,
            inspected_by: nextStatus === 'ready' || nextStatus === 'vacant' ? staffName : r.inspected_by
          };
        }
        return r;
      }),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  // 8. Shift Handover (Anoop Nair -> Suresh Babu)
  const closeShiftHandover = ({ physicalCash, handoverNotes, nextShiftStaff = 'Suresh Babu' }) => {
    const cashDrawerExpected = stats.cashRevenue || state.currentShift?.openingCash || 2240;
    const discrepancy = Number(physicalCash) - Number(cashDrawerExpected);

    const shiftRecord = {
      id: 'shf-' + Date.now(),
      property_id: state.activePropertyId,
      shift_name: state.currentShift?.name || 'Day Shift',
      staff_name: currentStaff?.name || 'Anoop Nair',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      cash_in_drawer: cashDrawerExpected,
      physical_cash_confirmed: Number(physicalCash),
      discrepancy,
      rooms_checked_in: Object.values(state.bookings || {}).filter(b => b.property_id === state.activePropertyId && b.status === 'checked_in').length,
      rooms_checked_out: scopedInvoices.length,
      handover_notes: handoverNotes
    };

    const auditEntry = logAudit(
      'SHIFT_HANDOVER',
      'Shift Register',
      `Shift closed by ${currentStaff?.name}. Cash counted: ₹${physicalCash} (Discrepancy: ₹${discrepancy}). Handed to ${nextShiftStaff}. Notes: "${handoverNotes}"`
    );

    setState(prev => ({
      ...prev,
      shiftLogs: [shiftRecord, ...(prev.shiftLogs || [])],
      currentShift: {
        name: prev.currentShift?.name?.includes('Day') ? 'Evening Shift (14:00 - 22:00)' : 'Day Shift (06:00 - 14:00)',
        staffName: nextShiftStaff,
        startedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        openingCash: Number(physicalCash)
      },
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  // 9. QR Self-Checkin
  const addGuestSelfCheckin = (selfCheckinData) => {
    const newEntry = {
      id: 'self-qr-' + Date.now(),
      property_id: state.activePropertyId,
      booking_id: selfCheckinData.booking_id || null,
      room_number: selfCheckinData.room_number || '204',
      guest_name: selfCheckinData.guest_name,
      phone: selfCheckinData.phone,
      id_proof_type: selfCheckinData.id_proof_type || 'Aadhaar Card',
      id_proof_number: selfCheckinData.id_proof_number || 'VERIFIED-ONLINE',
      id_proof_photo_url: selfCheckinData.id_proof_photo_url || '',
      address: selfCheckinData.address || 'Bangalore',
      eta: selfCheckinData.eta || 'Tonight 22:00',
      digital_signature_captured: true,
      submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'pending_reception_confirmation'
    };

    const auditEntry = logAudit(
      'GUEST_SELF_CHECKIN',
      `Self Registration`,
      `Guest ${selfCheckinData.guest_name} submitted pre-arrival ID on mobile QR portal.`
    );

    setState(prev => ({
      ...prev,
      selfCheckins: [newEntry, ...(prev.selfCheckins || [])],
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  const confirmSelfCheckin = (selfCheckinId, targetRoomId) => {
    const selfItem = (state.selfCheckins || []).find(c => c.id === selfCheckinId);
    if (!selfItem) return;

    createBooking({
      roomId: targetRoomId,
      guestName: selfItem.guest_name,
      guestPhone: selfItem.phone,
      guestAddress: selfItem.address,
      guestIdType: selfItem.id_proof_type,
      guestIdNumber: selfItem.id_proof_number,
      guestIdPhotoUrl: selfItem.id_proof_photo_url,
      guestNotes: `Self-registered via Mobile QR. ETA: ${selfItem.eta}`,
      checkInDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      checkOutDate: '2026-08-10 11:00',
      acOrNonAc: 'AC',
      advancePaid: 1500,
      paymentMode: 'UPI',
      isPreBooking: false
    });

    setState(prev => ({
      ...prev,
      selfCheckins: (prev.selfCheckins || []).filter(c => c.id !== selfCheckinId)
    }));
  };

  // 9b. Update Guest ID Proof (Front/Back/Type/Number) directly from Directory or Inspection
  const updateGuestIdProof = (guestId, {
    idType,
    idNumber,
    idPhotoUrl,
    idPhotoBackUrl,
    staffName
  }) => {
    const authorStaff = staffName || currentStaff?.name || 'Receptionist';
    const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let targetGuestName = 'Guest';
    const updatedGuests = (state.guests || SEED_GUESTS).map(g => {
      if (g.id === guestId) {
        targetGuestName = g.name;
        return {
          ...g,
          id_proof_type: idType !== undefined ? idType : g.id_proof_type,
          id_proof_number: idNumber !== undefined ? idNumber : g.id_proof_number,
          id_proof_photo_url: idPhotoUrl !== undefined ? idPhotoUrl : g.id_proof_photo_url,
          id_proof_back_photo_url: idPhotoBackUrl !== undefined ? idPhotoBackUrl : g.id_proof_back_photo_url,
          id_verified_at: nowTimestamp,
          id_verified_by_staff: authorStaff
        };
      }
      return g;
    });

    const auditEntry = logAudit(
      'GUEST_ID_UPDATED',
      `Guest ${targetGuestName}`,
      `ID Proof updated (${idType || 'Govt ID'}). Front photo: ${idPhotoUrl ? 'Attached' : 'Unchanged'}, Back: ${idPhotoBackUrl ? 'Attached' : 'None'}. Verified by ${authorStaff}.`
    );

    setState(prev => ({
      ...prev,
      guests: updatedGuests,
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  // 10. GST Config & Property Tax Identity
  const updateGSTConfig = (newConfig) => {
    const cleanGSTIN = newConfig.gstNumber !== undefined ? newConfig.gstNumber.trim().toUpperCase() : null;
    const auditDetails = `Owner updated GST settings: GSTIN=${cleanGSTIN || 'Unchanged'}, Standard=${newConfig.standardRate || 12}%, Luxury=${newConfig.luxuryRate || 18}%, Threshold=₹${newConfig.slabThreshold || 7500}`;

    const auditEntry = logAudit(
      'GST_CONFIG_UPDATE',
      'Tax Settings',
      auditDetails
    );

    setState(prev => {
      const updatedProperties = (prev.properties || []).map(p => {
        if (p.id === prev.activePropertyId) {
          return {
            ...p,
            gst_number: cleanGSTIN !== null ? cleanGSTIN : p.gst_number,
            legal_entity: newConfig.legalEntity || p.legal_entity || p.name
          };
        }
        return p;
      });

      return {
        ...prev,
        properties: updatedProperties,
        gstConfig: {
          ...(prev.gstConfig || DEFAULT_GST_CONFIG),
          ...newConfig,
          gstNumber: cleanGSTIN !== null ? cleanGSTIN : (prev.gstConfig?.gstNumber || prev.property?.gst_number || '')
        },
        auditLogs: [auditEntry, ...(prev.auditLogs || [])]
      };
    });
  };

  // Stats Computations
  const totalRooms = scopedRooms.length || 1;
  const vacantRooms = scopedRooms.filter(r => r.status === 'vacant' || r.status === 'ready').length;
  const occupiedRooms = scopedRooms.filter(r => r.status === 'occupied').length;
  const reservedRooms = scopedRooms.filter(r => r.status === 'reserved').length;
  const dirtyRooms = scopedRooms.filter(r => r.status === 'dirty' || r.status === 'cleaning' || r.status === 'clean').length;

  const occupancyPct = Math.round(((occupiedRooms + reservedRooms) / totalRooms) * 100);
  const occupancyWeekPct = Math.min(100, Math.round(occupancyPct * 1.12));
  const occupancyMonthPct = Math.min(100, Math.round(occupancyPct * 0.94));

  let totalRevenueToday = 0;
  let cashRevenue = 0;
  let upiRevenue = 0;
  let cardRevenue = 0;
  let totalBilledNights = 0;

  scopedInvoices.forEach(inv => {
    totalRevenueToday += (inv.total || 0);
    totalBilledNights += (inv.nights || 1);
    const mode = (inv.payment_mode || '').toLowerCase();
    if (mode.includes('cash')) {
      cashRevenue += (inv.total || 0);
    } else if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe')) {
      upiRevenue += (inv.total || 0);
    } else {
      cardRevenue += (inv.total || 0);
    }
  });

  const adr = totalBilledNights > 0 ? Math.round(totalRevenueToday / totalBilledNights) : 1850;
  const revPar = Math.round(totalRevenueToday / totalRooms);

  const propertyBookings = Object.values(state.bookings || {}).filter(b => b.property_id === state.activePropertyId);
  const repeatBookingsCount = propertyBookings.filter(b => {
    const g = (state.guests || []).find(gst => gst.id === b.guest_id);
    return g && g.total_stays > 1;
  }).length;
  const repeatGuestPct = propertyBookings.length > 0
    ? Math.round((repeatBookingsCount / propertyBookings.length) * 100)
    : 45;

  let totalExpenses = 0;
  const expenseByCategory = {};
  scopedExpenses.forEach(exp => {
    totalExpenses += (exp.amount || 0);
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
  });

  const netOperatingProfit = totalRevenueToday - totalExpenses;
  const profitMarginPct = totalRevenueToday > 0
    ? Math.round((netOperatingProfit / totalRevenueToday) * 100)
    : 0;

  const stats = {
    totalRooms,
    vacantRooms,
    occupiedRooms,
    reservedRooms,
    dirtyRooms,
    occupancyPct,
    occupancyWeekPct,
    occupancyMonthPct,
    totalRevenueToday,
    cashRevenue,
    upiRevenue,
    cardRevenue,
    adr,
    revPar,
    repeatGuestPct,
    totalExpenses,
    netOperatingProfit,
    profitMarginPct,
    expenseByCategory
  };

  return {
    ...state,
    staffList,
    currentStaff,
    currentRole,
    property: activeProperty,
    rooms: scopedRooms,
    invoices: scopedInvoices,
    expenses: scopedExpenses,
    seasonalOverrides: scopedOverrides,
    shiftLogs: scopedShiftLogs,
    auditLogs: scopedAuditLogs,
    selfCheckins: scopedSelfCheckins,
    roleConfig: STAFF_ROLES[currentRole] || STAFF_ROLES.receptionist,
    stats,
    syncStatus,
    actions: {
      forceSyncNow: () => syncService.broadcast(state, 'MANUAL_SYNC'),
      loginStaff,
      quickSwitchStaff,
      setViewMode,
      resetDemoData,
      switchProperty,
      onboardNewProperty,
      addExpense,
      addSeasonalOverride,
      deleteSeasonalOverride,
      findGuestByPhone,
      getRateForRoom,
      calculateGST,
      createBooking,
      extendBookingStay,
      checkoutAndGenerateInvoice,
      advanceHousekeepingStatus,
      closeShiftHandover,
      addGuestSelfCheckin,
      confirmSelfCheckin,
      updateGuestIdProof,
      updateGSTConfig,
      logAudit
    }
  };
}
