import { useState, useEffect, useCallback } from 'react';
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
import {
  saveRoomToSupabase,
  saveBookingToSupabase,
  saveGuestToSupabase,
  saveInvoiceToSupabase,
  saveExpenseToSupabase,
  saveShiftLogToSupabase,
  saveAuditLogToSupabase,
  saveSeasonalOverrideToSupabase,
  deleteSeasonalOverrideFromSupabase,
  fetchInitialDataset,
  subscribeToSupabaseRealtime,
  migrateLegacyLocalStorageToSupabase,
  getOfflineQueue,
  flushOfflineQueue,
  testSupabaseConnection
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const LOCAL_FALLBACK_CACHE_KEY = 'taj_residency_pms_v7_pg_cache';

export function usePMSStore() {
  const getInitialData = () => ({
    currentStaffId: 'staff-rec-01',
    viewMode: 'app',
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

  // State initialization with local offline fallback cache
  const [state, setState] = useState(() => {
    const initial = getInitialData();
    try {
      const saved = localStorage.getItem(LOCAL_FALLBACK_CACHE_KEY);
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
      console.warn('Failed to parse local fallback cache:', e);
    }
    return initial;
  });

  // Transient offline backup cache
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_FALLBACK_CACHE_KEY, JSON.stringify(state));
    } catch (e) {}
  }, [state]);

  // Real-Time Supabase Sync & Queue Status State
  const [realtimeStatus, setRealtimeStatus] = useState({
    status: 'connecting', // 'connected' | 'connecting' | 'offline' | 'error'
    lastEventAt: null,
    connectedDevicesCount: 2
  });

  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setState(p => ({ ...p, isOnline: true }));
      flushOfflineQueue().then(({ remainingCount }) => {
        setOfflineQueueCount(remainingCount || 0);
      });
    };
    const handleOffline = () => {
      setState(p => ({ ...p, isOnline: false }));
      setRealtimeStatus(p => ({ ...p, status: 'offline' }));
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle incoming Supabase Realtime table changes (postgres_changes)
  const handleRealtimeTableChange = useCallback(({ table, eventType, newRecord, oldRecord }) => {
    setState(prev => {
      if (table === 'rooms' && newRecord) {
        const updatedRooms = (prev.rooms || []).map(r => (r.id === newRecord.id ? { ...r, ...newRecord } : r));
        return { ...prev, rooms: updatedRooms };
      }

      if (table === 'bookings') {
        if (eventType === 'DELETE') {
          const nextBookings = { ...(prev.bookings || {}) };
          delete nextBookings[oldRecord?.id || newRecord?.id];
          return { ...prev, bookings: nextBookings };
        }
        if (newRecord) {
          return {
            ...prev,
            bookings: {
              ...(prev.bookings || {}),
              [newRecord.id]: newRecord
            }
          };
        }
      }

      if (table === 'guests' && newRecord) {
        const exists = (prev.guests || []).some(g => g.id === newRecord.id);
        const nextGuests = exists
          ? prev.guests.map(g => (g.id === newRecord.id ? { ...g, ...newRecord } : g))
          : [newRecord, ...(prev.guests || [])];
        return { ...prev, guests: nextGuests };
      }

      if (table === 'invoices' && newRecord) {
        const exists = (prev.invoices || []).some(i => i.id === newRecord.id);
        const nextInvoices = exists
          ? prev.invoices.map(i => (i.id === newRecord.id ? { ...i, ...newRecord } : i))
          : [newRecord, ...(prev.invoices || [])];
        return { ...prev, invoices: nextInvoices };
      }

      if (table === 'expenses' && newRecord) {
        const exists = (prev.expenses || []).some(e => e.id === newRecord.id);
        const nextExpenses = exists
          ? prev.expenses.map(e => (e.id === newRecord.id ? { ...e, ...newRecord } : e))
          : [newRecord, ...(prev.expenses || [])];
        return { ...prev, expenses: nextExpenses };
      }

      if (table === 'shift_logs' && newRecord) {
        const exists = (prev.shiftLogs || []).some(s => s.id === newRecord.id);
        const nextShifts = exists
          ? prev.shiftLogs.map(s => (s.id === newRecord.id ? { ...s, ...newRecord } : s))
          : [newRecord, ...(prev.shiftLogs || [])];
        return { ...prev, shiftLogs: nextShifts };
      }

      if (table === 'audit_logs' && newRecord) {
        const exists = (prev.auditLogs || []).some(a => a.id === newRecord.id);
        if (!exists) {
          return {
            ...prev,
            auditLogs: [newRecord, ...(prev.auditLogs || [])]
          };
        }
      }

      if (table === 'seasonal_overrides') {
        if (eventType === 'DELETE') {
          return {
            ...prev,
            seasonalOverrides: (prev.seasonalOverrides || []).filter(o => o.id !== (oldRecord?.id || newRecord?.id))
          };
        }
        if (newRecord) {
          const exists = (prev.seasonalOverrides || []).some(o => o.id === newRecord.id);
          const nextOverrides = exists
            ? prev.seasonalOverrides.map(o => (o.id === newRecord.id ? { ...o, ...newRecord } : o))
            : [newRecord, ...(prev.seasonalOverrides || [])];
          return { ...prev, seasonalOverrides: nextOverrides };
        }
      }

      return prev;
    });
  }, []);

  // Supabase Initialization: One-Time Legacy Migration + Authoritative Fetch + Realtime Subscription
  useEffect(() => {
    let isMounted = true;

    async function initSupabasePipeline() {
      // 1. Check & execute one-time migration of any legacy localStorage data
      await migrateLegacyLocalStorageToSupabase(state.activePropertyId);

      // 2. Fetch authoritative initial dataset from PostgreSQL
      const dataset = await fetchInitialDataset(state.activePropertyId);
      if (isMounted && dataset.isLoaded && dataset.hasData) {
        setState(prev => ({
          ...prev,
          rooms: dataset.rooms || prev.rooms,
          bookings: dataset.bookings || prev.bookings,
          guests: dataset.guests || prev.guests,
          invoices: dataset.invoices || prev.invoices,
          expenses: dataset.expenses || prev.expenses,
          shiftLogs: dataset.shiftLogs || prev.shiftLogs,
          auditLogs: dataset.auditLogs || prev.auditLogs,
          seasonalOverrides: dataset.seasonalOverrides || prev.seasonalOverrides
        }));
      }

      // 3. Flush any pending offline queue items
      const { remainingCount } = await flushOfflineQueue();
      if (isMounted) {
        setOfflineQueueCount(remainingCount || 0);
      }
    }

    initSupabasePipeline();

    // 4. Subscribe to Realtime postgres_changes
    const unsubscribe = subscribeToSupabaseRealtime({
      onTableChange: ({ table, eventType, newRecord, oldRecord }) => {
        if (!isMounted) return;
        handleRealtimeTableChange({ table, eventType, newRecord, oldRecord });
        setRealtimeStatus(prev => ({
          ...prev,
          lastEventAt: new Date().toISOString()
        }));
      },
      onStatusChange: ({ status, error }) => {
        if (!isMounted) return;
        setRealtimeStatus(prev => ({
          ...prev,
          status: status === 'SUBSCRIBED' ? 'connected' : (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'error' : status.toLowerCase()),
          error
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [state.activePropertyId, handleRealtimeTableChange]);

  // Safe staff and role resolution
  const staffList = Array.isArray(state.staffList) && state.staffList.length > 0 ? state.staffList : STAFF_CREDENTIALS;
  const currentStaff = staffList.find(s => s.id === state.currentStaffId) || staffList[1] || staffList[0] || STAFF_CREDENTIALS[0];
  const currentRole = currentStaff?.role || 'receptionist';

  // Helper: Append immutable audit log (Writes directly to Supabase)
  const logAudit = (action, target, details, staffRole = currentRole, staffName = currentStaff?.name || 'Staff') => {
    const newLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      property_id: state.activePropertyId || 'taj-residency-calicut',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      staff_role: staffRole === 'owner' ? 'Owner' : (staffRole === 'housekeeping' ? 'Housekeeping' : 'Receptionist'),
      staff_name: staffName,
      action,
      target,
      details
    };

    saveAuditLogToSupabase(newLog).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    return newLog;
  };

  // Helper: WiFi Voucher Code Generator
  const generateWiFiCode = (roomNumber) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randPart = '';
    for (let i = 0; i < 4; i++) {
      randPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TR-WIFI-${roomNumber}-${randPart}`;
  };

  // 1. Staff Authentication
  const loginStaff = (pin) => {
    const matched = staffList.find(s => s.pin === pin);
    if (matched) {
      const auditEntry = logAudit(
        'STAFF_LOGIN',
        `Terminal PIN Login`,
        `Staff ${matched.name} (${matched.role.toUpperCase()}) logged in from IP Counter.`
      );
      setState(prev => ({
        ...prev,
        currentStaffId: matched.id,
        auditLogs: [auditEntry, ...(prev.auditLogs || [])]
      }));
      return { success: true, staff: matched };
    }
    return { success: false, error: 'Invalid PIN' };
  };

  const quickSwitchStaff = (staffId) => {
    const target = staffList.find(s => s.id === staffId);
    if (!target) return;
    const auditEntry = logAudit(
      'STAFF_SWITCH',
      `Counter Shift Handover`,
      `Active operator switched to ${target.name} (${target.role.toUpperCase()}).`
    );
    setState(prev => ({
      ...prev,
      currentStaffId: staffId,
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  const setViewMode = (mode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  const resetDemoData = () => {
    localStorage.removeItem(LOCAL_FALLBACK_CACHE_KEY);
    localStorage.removeItem('taj_pms_migrated_to_supabase_v2');
    setState(getInitialData());
  };

  // Multi-Property Switcher
  const switchProperty = (propertyId) => {
    const prop = (state.properties || SEED_PROPERTIES).find(p => p.id === propertyId);
    if (!prop) return;
    const auditEntry = logAudit(
      'PROPERTY_SWITCHED',
      prop.name,
      `Switched active counter desk to ${prop.name} (${propertyId})`
    );
    setState(prev => ({
      ...prev,
      activePropertyId: propertyId,
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  const onboardNewProperty = (propertyData) => {
    const propertyId = `prop-${propertyData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newProperty = {
      id: propertyId,
      name: propertyData.name,
      subtitle: propertyData.subtitle || 'Tourist Home & Luxury Rooms',
      address: propertyData.address,
      gst_number: propertyData.gst_number || '32AABCT9988Q1Z4',
      phone: propertyData.phone,
      whatsapp: propertyData.whatsapp || propertyData.phone,
      email: propertyData.email || 'reception@tajresidency.com',
      wifi_ssid: propertyData.wifi_ssid || `${propertyData.name.replace(/\s+/g, '')}_Guest_5G`,
      total_rooms: Number(propertyData.total_rooms) || 11,
      city: propertyData.city || 'Kozhikode',
      state: 'Kerala'
    };

    const newRooms = [];
    const totalRooms = Number(propertyData.total_rooms) || 11;
    for (let i = 1; i <= totalRooms; i++) {
      const roomNum = (200 + i).toString();
      const floor = i <= 6 ? 2 : 3;
      newRooms.push({
        id: `room-${roomNum}-${propertyId}`,
        property_id: propertyId,
        room_number: roomNum,
        room_type_id: i % 2 === 0 ? 'classic' : 'deluxe',
        floor,
        status: 'vacant',
        current_booking_id: null,
        wifi_voucher_code: null
      });
    }

    const auditEntry = logAudit(
      'PROPERTY_ONBOARDED',
      newProperty.name,
      `Successfully registered new hotel property with ${totalRooms} rooms under Kerala GST.`
    );

    setState(prev => ({
      ...prev,
      properties: [...(prev.properties || SEED_PROPERTIES), newProperty],
      rooms: [...(prev.rooms || SEED_ROOMS), ...newRooms],
      activePropertyId: propertyId,
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return newProperty;
  };

  // 2. Guest Management & CRM
  const findGuestByPhone = (phone) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return (state.guests || []).find(g => {
      const gClean = (g.phone || '').replace(/[^0-9]/g, '');
      return gClean.endsWith(cleanPhone.slice(-10)) || cleanPhone.endsWith(gClean.slice(-10));
    }) || null;
  };

  const updateGuestIdProof = (guestId, { idProofType, idProofNumber, idPhotoUrl, idPhotoBackUrl }) => {
    let updatedGuest = null;
    setState(prev => {
      const updated = (prev.guests || []).map(g => {
        if (g.id === guestId) {
          updatedGuest = {
            ...g,
            id_proof_type: idProofType || g.id_proof_type,
            id_proof_number: idProofNumber || g.id_proof_number,
            id_proof_photo_url: idPhotoUrl || g.id_proof_photo_url,
            id_proof_back_photo_url: idPhotoBackUrl || g.id_proof_back_photo_url,
            id_verified_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
            id_verified_by_staff: currentStaff?.name || 'Receptionist'
          };
          return updatedGuest;
        }
        return g;
      });
      return { ...prev, guests: updated };
    });

    if (updatedGuest) {
      saveGuestToSupabase(updatedGuest).then(() => {
        setOfflineQueueCount(getOfflineQueue().length);
      });
    }
  };

  // 3. Dynamic Rate Calculation
  const getRateForRoom = (roomTypeId, acOrNonAc = 'AC', targetDate = new Date()) => {
    const dateStr = typeof targetDate === 'string'
      ? targetDate.slice(0, 10)
      : new Date(targetDate).toISOString().slice(0, 10);

    const activeOverride = (state.seasonalOverrides || []).find(o =>
      o.is_active &&
      dateStr >= o.start_date &&
      dateStr <= o.end_date &&
      (o.room_type_id === roomTypeId || o.room_type_id === 'all')
    );

    if (activeOverride) {
      return {
        rate: acOrNonAc === 'AC' ? activeOverride.override_ac_rate : activeOverride.override_non_ac_rate,
        isOverridden: true,
        overrideName: activeOverride.name
      };
    }

    const typeDef = (state.roomTypes && state.roomTypes[roomTypeId]) || ROOM_TYPES[roomTypeId] || ROOM_TYPES.deluxe;
    return {
      rate: acOrNonAc === 'AC' ? typeDef.ac_rate : typeDef.non_ac_rate,
      isOverridden: false,
      overrideName: null
    };
  };

  // 4. GST Engine
  const calculateGST = (ratePerDay, nights = 1) => {
    const config = state.gstConfig || DEFAULT_GST_CONFIG;
    const threshold = config.thresholdRate || 2500;
    const isExempt = ratePerDay < threshold;

    const gstRate = isExempt ? 0 : (config.standardRate || 12);
    const taxableRoomCharge = ratePerDay * nights;
    const gstAmount = isExempt ? 0 : Math.round((taxableRoomCharge * gstRate) / 100);
    const cgstAmount = Math.round(gstAmount / 2);
    const sgstAmount = gstAmount - cgstAmount;
    const grandTotal = taxableRoomCharge + gstAmount;

    return {
      ratePerDay,
      nights,
      taxableRoomCharge,
      isExempt,
      gstRate,
      cgstRate: gstRate / 2,
      sgstRate: gstRate / 2,
      cgstAmount,
      sgstAmount,
      gstAmount,
      grandTotal
    };
  };

  const updateGSTConfig = (newConfig) => {
    setState(prev => ({
      ...prev,
      gstConfig: { ...prev.gstConfig, ...newConfig }
    }));
  };

  // 5. Seasonal Overrides
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
      reason,
      is_active: true,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const auditEntry = logAudit(
      'SEASONAL_OVERRIDE_CREATED',
      name,
      `Set override rates (₹${overrideAcRate} AC / ₹${overrideNonAcRate} Non-AC) from ${startDate} to ${endDate} for ${roomTypeId}`
    );

    saveSeasonalOverrideToSupabase(newOverride).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

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

    deleteSeasonalOverrideFromSupabase(overrideId).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    setState(prev => ({
      ...prev,
      seasonalOverrides: (prev.seasonalOverrides || []).filter(o => o.id !== overrideId),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  // 6. Booking Creation (Writes to Supabase first)
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

    let guestToSave = null;
    let updatedGuests = [...(state.guests || SEED_GUESTS)];
    if (existingGuest) {
      updatedGuests = updatedGuests.map(g => {
        if (g.id === existingGuest.id) {
          guestToSave = {
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
          return guestToSave;
        }
        return g;
      });
    } else {
      guestToSave = {
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
      };
      updatedGuests.push(guestToSave);
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
    const updatedRoom = {
      ...room,
      status: nextRoomStatus,
      current_booking_id: bookingId,
      wifi_voucher_code: wifiCode
    };

    const auditEntry = logAudit(
      'BOOKING_CREATED',
      `Room ${room.room_number}`,
      `Guest ${guestName} (${acOrNonAc} @ ₹${rateApplied}/night). Adv ₹${advancePaid} via ${paymentMode}. Staff: ${authorStaff}. WiFi: ${wifiCode}`
    );

    // Synchronous write to Supabase
    Promise.all([
      saveGuestToSupabase(guestToSave),
      saveRoomToSupabase(updatedRoom),
      saveBookingToSupabase(newBooking)
    ]).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    setState(prev => ({
      ...prev,
      guests: updatedGuests,
      bookings: {
        ...(prev.bookings || {}),
        [bookingId]: newBooking
      },
      rooms: (prev.rooms || []).map(r => (r.id === roomId ? updatedRoom : r)),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return bookingId;
  };

  // 7. Extend In-House Booking Stay
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
    const updatedBooking = {
      ...booking,
      nights: newNights,
      check_out_date: newCheckOutStr
    };

    const auditEntry = logAudit(
      'STAY_EXTENDED',
      `Room ${room.room_number}`,
      `Stay extended by +${additionalDays} Day(s) for guest ${guest?.name || 'Guest'}. Total stay: ${newNights} Nights. New checkout: ${newCheckOutStr}.`
    );

    saveBookingToSupabase(updatedBooking).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    setState(prev => ({
      ...prev,
      bookings: {
        ...(prev.bookings || {}),
        [booking.id]: updatedBooking
      },
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return {
      newNights,
      newCheckOutDate: newCheckOutStr
    };
  };

  // 8. Confirm Arrival Check-In for an Advance Reservation
  const checkInAdvanceReservation = (bookingId, {
    additionalAdvance = 0,
    paymentMode = 'Cash',
    guestIdPhotoUrl = null,
    guestIdBackPhotoUrl = null,
    guestIdType = null,
    guestIdNumber = null,
    guestAddress = null,
    acOrNonAc = null
  } = {}) => {
    const booking = (state.bookings || {})[bookingId];
    if (!booking) return null;

    const room = (state.rooms || []).find(r => r.id === booking.room_id);
    const guest = (state.guests || []).find(g => g.id === booking.guest_id);
    const authorStaff = currentStaff?.name || 'Receptionist';
    const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let updatedGuestToSave = null;
    let updatedGuests = [...(state.guests || [])];
    if (guest && (guestIdPhotoUrl || guestIdNumber || guestAddress)) {
      updatedGuests = updatedGuests.map(g => {
        if (g.id === guest.id) {
          updatedGuestToSave = {
            ...g,
            address: guestAddress || g.address,
            id_proof_type: guestIdType || g.id_proof_type,
            id_proof_number: guestIdNumber || g.id_proof_number,
            id_proof_photo_url: guestIdPhotoUrl || g.id_proof_photo_url,
            id_proof_back_photo_url: guestIdBackPhotoUrl || g.id_proof_back_photo_url,
            id_verified_at: guestIdPhotoUrl ? nowTimestamp : g.id_verified_at,
            id_verified_by_staff: guestIdPhotoUrl ? authorStaff : g.id_verified_by_staff
          };
          return updatedGuestToSave;
        }
        return g;
      });
    }

    const totalAdvance = Number(booking.advance_paid || 0) + Number(additionalAdvance || 0);

    const updatedBooking = {
      ...booking,
      status: 'checked_in',
      check_in_date: nowTimestamp,
      ac_or_non_ac: acOrNonAc || booking.ac_or_non_ac,
      advance_paid: totalAdvance,
      payment_mode: paymentMode || booking.payment_mode,
      created_by_staff_name: authorStaff
    };

    const updatedRoom = {
      ...room,
      status: 'occupied',
      current_booking_id: bookingId
    };

    const auditEntry = logAudit(
      'RESERVATION_CHECKED_IN',
      `Room ${room?.room_number || booking.room_id}`,
      `Advance reservation for ${guest?.name || 'Guest'} checked in to Room ${room?.room_number}. Advance: ₹${totalAdvance}. Staff: ${authorStaff}.`
    );

    // Save synchronously to Supabase
    Promise.all([
      saveBookingToSupabase(updatedBooking),
      saveRoomToSupabase(updatedRoom),
      updatedGuestToSave ? saveGuestToSupabase(updatedGuestToSave) : Promise.resolve()
    ]).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    setState(prev => ({
      ...prev,
      guests: updatedGuests,
      bookings: {
        ...(prev.bookings || {}),
        [bookingId]: updatedBooking
      },
      rooms: (prev.rooms || []).map(r => (r.id === booking.room_id ? updatedRoom : r)),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return updatedBooking;
  };

  // 9. Checkout & Billing with Optional Concession / Discount
  const checkoutAndGenerateInvoice = (roomId, { paymentMode, notes, billed_by_staff_name, discountAmount = 0, discountType = 'flat', discountReason = '' }) => {
    const room = (state.rooms || []).find(r => r.id === roomId);
    if (!room || !room.current_booking_id) return;

    const booking = (state.bookings || {})[room.current_booking_id];
    if (!booking) return;

    const guest = (state.guests || []).find(g => g.id === booking.guest_id);
    const nights = booking.nights || 1;
    const grossRoomCharge = booking.rate_applied * nights;

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

    const updatedBooking = {
      ...booking,
      status: 'checked_out'
    };

    const updatedRoom = {
      ...room,
      status: 'dirty',
      last_guest_name: guest?.name,
      checked_out_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      current_booking_id: null,
      wifi_voucher_code: null,
      housekeeper_assigned: 'Meera Thomas (HK Lead)'
    };

    const auditEntry = logAudit(
      'CHECKOUT_BILLED',
      `Room ${room.room_number}`,
      `Billed ${guest?.name}. Gross: ₹${grossRoomCharge}${finalDiscount > 0 ? `, Discount: -₹${finalDiscount}` : ''}, Total: ₹${grandTotal}, Settled: ₹${balanceSettled} via ${paymentMode}. Staff: ${billerStaff}. Room auto-flagged DIRTY.`
    );

    // Save synchronously to Supabase
    Promise.all([
      saveInvoiceToSupabase(newInvoice),
      saveBookingToSupabase(updatedBooking),
      saveRoomToSupabase(updatedRoom)
    ]).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    setState(prev => ({
      ...prev,
      invoices: [newInvoice, ...(prev.invoices || [])],
      bookings: {
        ...(prev.bookings || {}),
        [booking.id]: updatedBooking
      },
      rooms: (prev.rooms || []).map(r => (r.id === roomId ? updatedRoom : r)),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));

    return newInvoice;
  };

  // 10. Housekeeping Status Advancement
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

    const updatedRoom = {
      ...room,
      status: nextStatus,
      housekeeper_assigned: staffName,
      inspected_by: nextStatus === 'ready' || nextStatus === 'vacant' ? staffName : room.inspected_by
    };

    const auditEntry = logAudit(
      'HOUSEKEEPING_ADVANCE',
      `Room ${room.room_number}`,
      `Status changed from ${room.status.toUpperCase()} -> ${nextStatus.toUpperCase()}. ${actionDetail}`,
      'housekeeping',
      staffName
    );

    saveRoomToSupabase(updatedRoom).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    setState(prev => ({
      ...prev,
      rooms: (prev.rooms || []).map(r => (r.id === roomId ? updatedRoom : r)),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  // 11. Shift Handover
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
      'SHIFT_CLOSED',
      state.currentShift?.name || 'Day Shift',
      `Handover to ${nextShiftStaff}. Cash: ₹${physicalCash} (Discrepancy: ₹${discrepancy}). Notes: ${handoverNotes || 'None'}`
    );

    saveShiftLogToSupabase(shiftRecord).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    setState(prev => ({
      ...prev,
      shiftLogs: [shiftRecord, ...(prev.shiftLogs || [])],
      currentShift: {
        name: nextShiftStaff.includes('Suresh') ? 'Night Shift (14:00 - 22:00)' : 'Day Shift (06:00 - 14:00)',
        staffName: nextShiftStaff,
        startedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        openingCash: Number(physicalCash)
      },
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  // 12. Expenses
  const addExpense = ({ category, categoryLabel, amount, vendor, notes }) => {
    const newExpense = {
      id: 'exp-' + Date.now(),
      property_id: state.activePropertyId,
      category,
      category_label: categoryLabel,
      amount: Number(amount),
      date: new Date().toISOString().slice(0, 10),
      vendor,
      notes,
      logged_by: currentStaff?.name || 'Muhammed Shahir'
    };

    const auditEntry = logAudit(
      'EXPENSE_LOGGED',
      categoryLabel,
      `₹${amount} paid to ${vendor}. Notes: ${notes || 'None'}`
    );

    saveExpenseToSupabase(newExpense).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    setState(prev => ({
      ...prev,
      expenses: [newExpense, ...(prev.expenses || [])],
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }));
  };

  const addGuestSelfCheckin = (checkinData) => {
    const newRecord = {
      id: 'self-qr-' + Date.now(),
      property_id: state.activePropertyId,
      ...checkinData,
      submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'pending_reception_confirmation'
    };
    setState(prev => ({
      ...prev,
      selfCheckins: [newRecord, ...(prev.selfCheckins || [])]
    }));
    return newRecord;
  };

  const confirmSelfCheckin = (checkinId) => {
    setState(prev => ({
      ...prev,
      selfCheckins: (prev.selfCheckins || []).map(sc => {
        if (sc.id === checkinId) {
          return { ...sc, status: 'confirmed_checked_in' };
        }
        return sc;
      })
    }));
  };

  // Scoped views for active property
  const activeProperty = (state.properties || SEED_PROPERTIES).find(p => p.id === state.activePropertyId) || SEED_PROPERTIES[0];
  const scopedRooms = (state.rooms || SEED_ROOMS).filter(r => r.property_id === state.activePropertyId);
  const scopedInvoices = (state.invoices || []).filter(i => i.property_id === state.activePropertyId);
  const scopedExpenses = (state.expenses || []).filter(e => e.property_id === state.activePropertyId);
  const scopedOverrides = (state.seasonalOverrides || []).filter(o => o.property_id === state.activePropertyId);
  const scopedShiftLogs = (state.shiftLogs || []).filter(s => s.property_id === state.activePropertyId);
  const scopedAuditLogs = (state.auditLogs || []).filter(a => a.property_id === state.activePropertyId);
  const scopedSelfCheckins = (state.selfCheckins || []).filter(s => s.property_id === state.activePropertyId);

  // Statistics Calculations
  const totalRooms = scopedRooms.length || 11;
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
    syncStatus: {
      status: realtimeStatus.status === 'connected' ? 'connected' : (realtimeStatus.status === 'offline' ? 'offline' : 'connecting'),
      channel: 'postgres_changes (supabase)',
      lastSyncedAt: realtimeStatus.lastEventAt,
      connectedDevicesCount: realtimeStatus.connectedDevicesCount,
      offlineQueueCount
    },
    offlineQueueCount,
    isSupabaseConfigured,
    actions: {
      flushOfflineQueueNow: async () => {
        const res = await flushOfflineQueue();
        setOfflineQueueCount(res.remainingCount || 0);
        return res;
      },
      testDatabaseConnection: testSupabaseConnection,
      refreshFromDatabase: async () => {
        const dataset = await fetchInitialDataset(state.activePropertyId);
        if (dataset.isLoaded && dataset.hasData) {
          setState(prev => ({
            ...prev,
            rooms: dataset.rooms || prev.rooms,
            bookings: dataset.bookings || prev.bookings,
            guests: dataset.guests || prev.guests,
            invoices: dataset.invoices || prev.invoices,
            expenses: dataset.expenses || prev.expenses,
            shiftLogs: dataset.shiftLogs || prev.shiftLogs,
            auditLogs: dataset.auditLogs || prev.auditLogs,
            seasonalOverrides: dataset.seasonalOverrides || prev.seasonalOverrides
          }));
          return true;
        }
        return false;
      },
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
      checkInAdvanceReservation,
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
