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
  SEED_HEATMAP_DATA,
  DEFAULT_FRESH_UP_TIERS,
  getFreshUpRatePerPerson
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
  parseBookingFromSupabase,
  subscribeToSupabaseRealtime,
  migrateLegacyLocalStorageToSupabase,
  getOfflineQueue,
  flushOfflineQueue,
  testSupabaseConnection
} from '../services/supabaseService.js';
import { realtimeRelay } from '../services/realtimeRelay.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { getBusinessDateIST } from '../utils/formatters.js';
import { calculateCheckoutBilling } from '../utils/billing.js';

const LOCAL_FALLBACK_CACHE_KEY = 'taj_residency_pms_v7_pg_cache';

/**
 * Calculates complete end-of-day reconciliation for a specific business date (YYYY-MM-DD)
 */
export function calculateReconciliationForDate(dateStr, {
  invoices = [],
  bookings = {},
  rooms = [],
  expenses = [],
  shiftLogs = [],
  auditLogs = []
}) {
  const targetDate = (dateStr || getBusinessDateIST()).slice(0, 10);
  
  // 1. Invoices settled on targetDate
  const dateInvoices = (invoices || []).filter(inv => (inv.paid_at || '').slice(0, 10) === targetDate);
  
  // 2. Advances received on targetDate
  const allBookings = Object.values(bookings || {});
  const dateBookingsWithAdvance = allBookings.filter(b => {
    const createdDate = (b.created_at || b.check_in_date || '').slice(0, 10);
    return createdDate === targetDate && Number(b.advance_paid) > 0;
  });

  let cashCollections = 0;
  let upiCollections = 0;
  let cardCollections = 0;
  let totalBilledNights = 0;
  let grossRoomCharge = 0;
  let discountTotal = 0;
  let gstTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;

  // Tally settled balances from invoices
  dateInvoices.forEach(inv => {
    const settled = Number(inv.balance_settled !== undefined ? inv.balance_settled : inv.total) || 0;
    const mode = (inv.payment_mode || 'UPI').toLowerCase();
    if (mode.includes('cash')) {
      cashCollections += settled;
    } else if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe') || mode.includes('qr')) {
      upiCollections += settled;
    } else {
      cardCollections += settled;
    }

    grossRoomCharge += Number(inv.gross_room_charge || inv.room_charge || 0);
    discountTotal += Number(inv.discount_amount || 0);
    gstTotal += Number(inv.gst_amount || 0);
    cgstTotal += Number(inv.cgst_amount || 0);
    sgstTotal += Number(inv.sgst_amount || 0);
    totalBilledNights += Number(inv.nights || 1);
  });

  // Tally advance deposits received today
  dateBookingsWithAdvance.forEach(b => {
    const adv = Number(b.advance_paid || 0);
    const mode = (b.payment_mode || 'UPI').toLowerCase();
    if (mode.includes('cash')) {
      cashCollections += adv;
    } else if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe') || mode.includes('qr')) {
      upiCollections += adv;
    } else {
      cardCollections += adv;
    }
  });

  const totalCollections = cashCollections + upiCollections + cardCollections;

  // 3. Operational Counts on targetDate
  const checkInsCount = allBookings.filter(b => (b.check_in_date || '').slice(0, 10) === targetDate).length;
  const checkOutsCount = dateInvoices.length;
  const totalRooms = rooms.length || 11;
  const occupiedOnDate = allBookings.filter(b => {
    const checkIn = (b.check_in_date || '').slice(0, 10);
    const checkOut = (b.check_out_date || '').slice(0, 10);
    return checkIn <= targetDate && checkOut >= targetDate && b.status !== 'cancelled';
  }).length;
  const occupancyPct = Math.min(100, Math.round((occupiedOnDate / totalRooms) * 100));

  // 4. Shift Logs on targetDate
  const dateShiftLogs = (shiftLogs || []).filter(s => (s.date || '').slice(0, 10) === targetDate);
  const totalDiscrepancy = dateShiftLogs.reduce((sum, s) => sum + Number(s.discrepancy || 0), 0);

  // 5. Audit Flags on targetDate
  const dateAuditLogs = (auditLogs || []).filter(a => (a.timestamp || '').slice(0, 10) === targetDate);

  // 6. Expenses on targetDate
  const dateExpenses = (expenses || []).filter(e => (e.date || '').slice(0, 10) === targetDate);
  const totalExpenses = dateExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return {
    date: targetDate,
    totalCollections,
    cashCollections,
    upiCollections,
    cardCollections,
    grossRoomCharge,
    discountTotal,
    gstTotal,
    cgstTotal,
    sgstTotal,
    totalBilledNights,
    checkInsCount,
    checkOutsCount,
    occupancyPct,
    occupiedRoomsCount: occupiedOnDate,
    totalRooms,
    invoices: dateInvoices,
    advanceBookings: dateBookingsWithAdvance,
    shiftLogs: dateShiftLogs,
    totalDiscrepancy,
    auditLogs: dateAuditLogs,
    expenses: dateExpenses,
    totalExpenses,
    netCashInDrawer: cashCollections - totalExpenses
  };
}

export function usePMSStore() {
  const getInitialData = () => ({
    currentStaffId: 'staff-rec-01',
    viewMode: 'app',
    activePropertyId: 'taj-residency-calicut',
    staffList: STAFF_CREDENTIALS,
    properties: SEED_PROPERTIES,
    roomTypes: ROOM_TYPES,
    gstConfig: DEFAULT_GST_CONFIG,
    freshUpTiers: DEFAULT_FRESH_UP_TIERS,
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
          gstConfig: parsed.gstConfig && typeof parsed.gstConfig === 'object' ? parsed.gstConfig : DEFAULT_GST_CONFIG,
          freshUpTiers: Array.isArray(parsed.freshUpTiers) ? parsed.freshUpTiers : DEFAULT_FRESH_UP_TIERS
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
    status: 'connecting',
    relayConnected: false,
    lastEventAt: null,
    connectedDevicesCount: 2
  });

  // Current Business Day in Indian Standard Time (IST, UTC+5:30)
  const [currentBusinessDay, setCurrentBusinessDay] = useState(() => getBusinessDateIST());

  // Midnight IST Rollover Timer: checks every 30 seconds if date has flipped past 12:00 AM IST
  useEffect(() => {
    const timer = setInterval(() => {
      const latestDate = getBusinessDateIST();
      if (latestDate !== currentBusinessDay) {
        console.log(`[PMS Store] 🌙 Midnight IST Rollover: ${currentBusinessDay} -> ${latestDate}`);
        setCurrentBusinessDay(latestDate);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [currentBusinessDay]);

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
        const updatedRooms = (prev.rooms || []).map(r => {
          if (r.id === newRecord.id) {
            return {
              ...r,
              ...newRecord,
              // Preserve client-only/extended day-use fields if not in postgres
              is_day_use: newRecord.is_day_use !== undefined ? newRecord.is_day_use : r.is_day_use,
              day_use_end_time: newRecord.day_use_end_time !== undefined ? newRecord.day_use_end_time : r.day_use_end_time,
              group_size: newRecord.group_size !== undefined ? newRecord.group_size : r.group_size,
              linked_room_numbers: newRecord.linked_room_numbers !== undefined ? newRecord.linked_room_numbers : r.linked_room_numbers
            };
          }
          return r;
        });
        return { ...prev, rooms: updatedRooms };
      }

      if (table === 'bookings') {
        if (eventType === 'DELETE') {
          const nextBookings = { ...(prev.bookings || {}) };
          delete nextBookings[oldRecord?.id || newRecord?.id];
          return { ...prev, bookings: nextBookings };
        }
        if (newRecord) {
          const parsed = parseBookingFromSupabase(newRecord);
          const existing = (prev.bookings || {})[parsed.id] || {};
          return {
            ...prev,
            bookings: {
              ...(prev.bookings || {}),
              [parsed.id]: {
                ...existing,
                ...parsed
              }
            }
          };
        }
      }

      if (table === 'guests' && newRecord) {
        const exists = (prev.guests || []).some(g => g.id === newRecord.id);
        const nextGuests = exists
          ? prev.guests.map(g => (g.id === newRecord.id ? { ...g, ...newRecord } : g))
          : [newRecord, ...(prev.guests || [])];

        let nextSelfCheckins = prev.selfCheckins || [];
        if (newRecord.notes && typeof newRecord.notes === 'string' && newRecord.notes.startsWith('SELF_CHECKIN_PENDING:')) {
          try {
            const parsed = JSON.parse(newRecord.notes.replace('SELF_CHECKIN_PENDING:', ''));
            if (parsed && parsed.id) {
              const checkinItem = {
                ...parsed,
                id_proof_photo_url: newRecord.id_proof_photo_url || parsed.id_proof_photo_url,
                id_proof_back_photo_url: newRecord.id_proof_back_photo_url || parsed.id_proof_back_photo_url
              };
              nextSelfCheckins = [
                checkinItem,
                ...nextSelfCheckins.filter(s => s.id !== checkinItem.id)
              ];
            }
          } catch (e) {}
        } else if (newRecord.notes && typeof newRecord.notes === 'string' && newRecord.notes.startsWith('SELF_CHECKIN_APPROVED:')) {
          const guestCheckinId = newRecord.id?.replace('gst-', '');
          nextSelfCheckins = nextSelfCheckins.map(s => s.id === guestCheckinId ? { ...s, status: 'approved' } : s);
        }

        return { ...prev, guests: nextGuests, selfCheckins: nextSelfCheckins };
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
      // 0. Clean up any invalid schema attributes in offline queue
      try {
        const raw = localStorage.getItem('taj_offline_write_queue');
        if (raw) {
          const q = JSON.parse(raw);
          const cleaned = q.filter(item => {
            if (item.table === 'rooms' && (item.payload?.day_use_end_time || item.payload?.is_day_use)) return false;
            if (item.table === 'bookings' && (item.payload?.assigned_room_ids || item.payload?.duration_hours)) return false;
            return true;
          });
          if (cleaned.length !== q.length) {
            localStorage.setItem('taj_offline_write_queue', JSON.stringify(cleaned));
          }
        }
      } catch (e) {}

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

  // Handle incoming Realtime Relay mutation deltas (< 150ms cross-browser / cross-device)
  const handleIncomingRelayMutation = useCallback((mutation) => {
    setState(prev => {
      switch (mutation.type) {
        case 'BOOKING_CREATED': {
          const { booking, room, rooms, guest } = mutation;
          const updatedRoomsList = Array.isArray(rooms) ? rooms : (room ? [room] : []);
          const nextRooms = (prev.rooms || []).map(r => {
            const match = updatedRoomsList.find(ur => ur.id === r.id);
            return match ? { ...r, ...match } : r;
          });
          const nextBookings = { ...(prev.bookings || {}), [booking.id]: booking };
          const guestExists = (prev.guests || []).some(g => g.id === guest?.id);
          const nextGuests = guestExists
            ? (prev.guests || []).map(g => g.id === guest.id ? { ...g, ...guest } : g)
            : (guest ? [guest, ...(prev.guests || [])] : prev.guests);
          return {
            ...prev,
            rooms: nextRooms,
            bookings: nextBookings,
            guests: nextGuests
          };
        }

        case 'RESERVATION_CHECKED_IN': {
          const { booking, room, guest } = mutation;
          const nextRooms = (prev.rooms || []).map(r => r.id === room?.id ? { ...r, ...room } : r);
          const nextBookings = { ...(prev.bookings || {}), [booking.id]: booking };
          const nextGuests = guest
            ? (prev.guests || []).map(g => g.id === guest.id ? { ...g, ...guest } : g)
            : prev.guests;
          return {
            ...prev,
            rooms: nextRooms,
            bookings: nextBookings,
            guests: nextGuests
          };
        }

        case 'CHECKOUT_BILLED': {
          const { invoice, booking, room } = mutation;
          const nextRooms = (prev.rooms || []).map(r => r.id === room?.id ? { ...r, ...room } : r);
          const nextBookings = { ...(prev.bookings || {}), [booking.id]: booking };
          const nextInvoices = invoice ? [invoice, ...(prev.invoices || []).filter(i => i.id !== invoice.id)] : prev.invoices;
          return {
            ...prev,
            rooms: nextRooms,
            bookings: nextBookings,
            invoices: nextInvoices
          };
        }

        case 'ROOM_STATUS': {
          const { roomId, status, roomUpdates } = mutation;
          const nextRooms = (prev.rooms || []).map(r => {
            if (r.id === roomId) {
              return { ...r, status, ...(roomUpdates || {}) };
            }
            return r;
          });
          return { ...prev, rooms: nextRooms };
        }

        case 'STAY_EXTENDED': {
          const { bookingId, nights, checkOutDate } = mutation;
          const currentBooking = (prev.bookings || {})[bookingId];
          if (!currentBooking) return prev;
          return {
            ...prev,
            bookings: {
              ...(prev.bookings || {}),
              [bookingId]: {
                ...currentBooking,
                nights,
                check_out_date: checkOutDate
              }
            }
          };
        }

        case 'EXPENSE_LOGGED': {
          const { expense } = mutation;
          return {
            ...prev,
            expenses: [expense, ...(prev.expenses || []).filter(e => e.id !== expense.id)]
          };
        }

        case 'SHIFT_CLOSED': {
          const { shiftRecord } = mutation;
          return {
            ...prev,
            shiftLogs: [shiftRecord, ...(prev.shiftLogs || []).filter(s => s.id !== shiftRecord.id)]
          };
        }

        case 'GUEST_UPDATED': {
          const { guest } = mutation;
          const nextGuests = (prev.guests || []).map(g => g.id === guest?.id ? { ...g, ...guest } : g);
          return { ...prev, guests: nextGuests };
        }

        case 'FRESH_UP_TIERS_UPDATE': {
          if (Array.isArray(mutation.tiers)) {
            return { ...prev, freshUpTiers: mutation.tiers };
          }
          return prev;
        }

        case 'SNAPSHOT_SYNC': {
          if (mutation.rooms && Array.isArray(mutation.rooms)) {
            return {
              ...prev,
              rooms: mutation.rooms,
              bookings: mutation.bookings || prev.bookings,
              guests: mutation.guests || prev.guests,
              invoices: mutation.invoices || prev.invoices
            };
          }
          return prev;
        }

        case 'SELF_CHECKIN_SUBMITTED': {
          const { selfCheckin } = mutation;
          if (!selfCheckin) return prev;
          const exists = (prev.selfCheckins || []).some(s => s.id === selfCheckin.id);
          if (exists) return prev;
          return {
            ...prev,
            selfCheckins: [selfCheckin, ...(prev.selfCheckins || [])]
          };
        }

        case 'SELF_CHECKIN_STATUS_UPDATED': {
          const { selfCheckinId, status, room_number, rejection_reason, amount_due, payment_status, upi_id } = mutation;
          return {
            ...prev,
            selfCheckins: (prev.selfCheckins || []).map(sc => {
              if (sc.id === selfCheckinId) {
                return {
                  ...sc,
                  status: status || sc.status,
                  room_number: room_number || sc.room_number,
                  rejection_reason: rejection_reason || sc.rejection_reason,
                  amount_due: amount_due !== undefined ? amount_due : sc.amount_due,
                  payment_status: payment_status || sc.payment_status,
                  upi_id: upi_id || sc.upi_id
                };
              }
              return sc;
            })
          };
        }

        case 'SELF_CHECKIN_PAYMENT_SUBMITTED': {
          const { selfCheckinId } = mutation;
          return {
            ...prev,
            selfCheckins: (prev.selfCheckins || []).map(sc => {
              if (sc.id === selfCheckinId) {
                return {
                  ...sc,
                  payment_status: 'payment_submitted'
                };
              }
              return sc;
            })
          };
        }

        default:
          return prev;
      }
    });
  }, []);

  // Initialize Realtime Relay Bus
  useEffect(() => {
    realtimeRelay.init(
      handleIncomingRelayMutation,
      (relayStatus) => {
        setRealtimeStatus(prev => ({
          ...prev,
          relayConnected: relayStatus.status === 'connected',
          lastEventAt: relayStatus.timestamp
        }));
      }
    );
  }, [handleIncomingRelayMutation]);

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
      realtimeRelay.broadcastMutation({
        type: 'GUEST_UPDATED',
        guest: updatedGuest
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
    setState(prev => {
      const updatedProperties = (prev.properties || SEED_PROPERTIES).map(p => {
        if (p.id === prev.activePropertyId) {
          return {
            ...p,
            gst_number: newConfig.gstNumber !== undefined ? newConfig.gstNumber : p.gst_number,
            upi_id: newConfig.upiId !== undefined ? newConfig.upiId : p.upi_id
          };
        }
        return p;
      });

      return {
        ...prev,
        properties: updatedProperties,
        gstConfig: { ...prev.gstConfig, ...newConfig }
      };
    });

    logAudit(
      'PROPERTY_SETTINGS_UPDATED',
      'Owner Settings',
      `Updated GSTIN (${newConfig.gstNumber || 'None'}) and Owner UPI VPA (${newConfig.upiId || 'None'})`
    );
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

  // 6. Create New Booking (Walk-In or Fresh-Up with Optional Multi-Room Allocation)
  const createBooking = ({
    roomId,
    assignedRoomIds = [],
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
    created_by_staff_name,
    bookingType = 'overnight',
    durationHours = 24,
    groupSize = 1,
    freshUpDiscountAmount = 0,
    freshUpDiscountReason = '',
    customRateApplied = null
  }) => {
    const targetRoomIds = Array.isArray(assignedRoomIds) && assignedRoomIds.length > 0
      ? assignedRoomIds
      : [roomId];

    const targetRooms = (state.rooms || SEED_ROOMS).filter(r => targetRoomIds.includes(r.id));
    const linkedRoomNumbers = targetRooms.map(r => r.room_number);
    const primaryRoom = targetRooms[0] || (state.rooms || SEED_ROOMS).find(r => r.id === roomId);
    if (!primaryRoom) return;

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

    const rateLookup = getRateForRoom(primaryRoom.room_type_id, acOrNonAc, checkInDate);
    const isDayUse = bookingType === 'day_use';
    let rateApplied = rateLookup.rate;
    if (isDayUse) {
      if (customRateApplied !== null && customRateApplied !== undefined) {
        rateApplied = Number(customRateApplied);
      } else {
        const perPerson = getFreshUpRatePerPerson(groupSize, state.freshUpTiers || DEFAULT_FRESH_UP_TIERS);
        rateApplied = perPerson * Math.max(1, Number(groupSize) || 1);
      }
    }

    const bookingId = `bk-${primaryRoom.room_number}-${Date.now().toString().slice(-4)}`;
    const wifiCode = generateWiFiCode(primaryRoom.room_number);

    const newBooking = {
      id: bookingId,
      property_id: state.activePropertyId,
      room_id: primaryRoom.id,
      assigned_room_ids: targetRoomIds,
      linked_room_numbers: linkedRoomNumbers,
      guest_id: guestId,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      nights: isDayUse ? 0 : nights,
      booking_type: isDayUse ? 'day_use' : 'overnight',
      duration_hours: isDayUse ? Number(durationHours) : null,
      group_size: isDayUse ? Number(groupSize) : 1,
      discount_amount: Number(freshUpDiscountAmount || 0),
      discount_reason: freshUpDiscountReason || '',
      ac_or_non_ac: acOrNonAc,
      rate_applied: rateApplied,
      is_seasonal_rate: isDayUse ? false : rateLookup.isOverridden,
      seasonal_name: isDayUse ? 'Fresh-Up / Day-Use Slabs' : rateLookup.overrideName,
      status: isPreBooking ? 'confirmed' : 'checked_in',
      advance_paid: Number(advancePaid || 0),
      payment_mode: paymentMode || 'Cash',
      wifi_code: wifiCode,
      created_by_staff_name: authorStaff,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const nextRoomStatus = isPreBooking ? 'reserved' : 'occupied';
    const updatedRooms = targetRooms.map(r => ({
      ...r,
      status: nextRoomStatus,
      current_booking_id: bookingId,
      wifi_voucher_code: wifiCode,
      is_day_use: isDayUse,
      day_use_end_time: isDayUse ? checkOutDate : null,
      group_size: isDayUse ? Number(groupSize) : null,
      last_guest_name: guestName,
      linked_room_numbers: linkedRoomNumbers
    }));

    const auditEntry = logAudit(
      'BOOKING_CREATED',
      `Room ${linkedRoomNumbers.join(', ')}`,
      `${isDayUse ? '⚡ Fresh-Up' : 'Stay'} Guest ${guestName} (${linkedRoomNumbers.length} Rooms • ${groupSize} Pax • ₹${rateApplied}). Adv ₹${advancePaid} via ${paymentMode}. Staff: ${authorStaff}.`
    );

    // Synchronous write to Supabase: save guest first to satisfy PostgreSQL foreign key constraint
    saveGuestToSupabase(guestToSave)
      .then(() => {
        return Promise.all([
          ...updatedRooms.map(r => saveRoomToSupabase(r)),
          saveBookingToSupabase(newBooking)
        ]);
      })
      .then(() => {
        setOfflineQueueCount(getOfflineQueue().length);
      })
      .catch(err => {
        console.warn('[Supabase Sync] Booking write error:', err);
      });

    // Realtime broadcast to all other open browsers/devices in < 150ms
    realtimeRelay.broadcastMutation({
      type: 'BOOKING_CREATED',
      booking: newBooking,
      rooms: updatedRooms,
      room: updatedRooms[0],
      guest: guestToSave
    });

    setState(prev => ({
      ...prev,
      guests: updatedGuests,
      bookings: {
        ...(prev.bookings || {}),
        [bookingId]: newBooking
      },
      rooms: (prev.rooms || []).map(r => {
        const matchingUpdated = updatedRooms.find(ur => ur.id === r.id);
        return matchingUpdated ? matchingUpdated : r;
      }),
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

    realtimeRelay.broadcastMutation({
      type: 'STAY_EXTENDED',
      bookingId: booking.id,
      nights: newNights,
      checkOutDate: newCheckOutStr
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

    Promise.all([
      saveBookingToSupabase(updatedBooking),
      saveRoomToSupabase(updatedRoom),
      updatedGuestToSave ? saveGuestToSupabase(updatedGuestToSave) : Promise.resolve()
    ]).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    realtimeRelay.broadcastMutation({
      type: 'RESERVATION_CHECKED_IN',
      booking: updatedBooking,
      room: updatedRoom,
      guest: updatedGuestToSave
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
    const isDayUse = booking.booking_type === 'day_use';
    let nights = 1;
    let grossRoomCharge = 0;

    if (isDayUse) {
      nights = 0;
      grossRoomCharge = Number(booking.rate_applied || 0);
    } else {
      const billingInfo = calculateCheckoutBilling({
        checkInDate: booking.check_in_date,
        plannedNights: booking.nights || 1,
        checkoutTimestamp: new Date()
      });
      nights = Math.max(booking.nights || 1, billingInfo.billableNights);
      grossRoomCharge = booking.rate_applied * nights;
    }

    const finalDiscount = Number(discountAmount !== undefined ? discountAmount : (booking.discount_amount || 0));
    const finalReason = discountReason || booking.discount_reason || (finalDiscount > 0 ? 'Fresh-Up Concession / Courtesy' : '');
    const taxableRoomCharge = Math.max(0, grossRoomCharge - finalDiscount);
    const gstCalc = calculateGST(taxableRoomCharge > 0 ? (taxableRoomCharge / (nights || 1)) : 0, nights || 1);

    const grandTotal = taxableRoomCharge + gstCalc.gstAmount;
    const balanceSettled = Math.max(0, grandTotal - (booking.advance_paid || 0));

    const invoiceId = `INV-${new Date().getFullYear()}-${room.room_number}-${Math.floor(1000 + Math.random() * 9000)}`;
    const billerStaff = billed_by_staff_name || currentStaff?.name || 'Receptionist';

    const allRoomNumbers = (booking.linked_room_numbers && booking.linked_room_numbers.length > 0)
      ? booking.linked_room_numbers.join(', ')
      : room.room_number;

    const newInvoice = {
      id: invoiceId,
      property_id: state.activePropertyId,
      booking_id: booking.id,
      room_number: allRoomNumbers,
      assigned_rooms_count: booking.linked_room_numbers?.length || 1,
      linked_room_numbers: booking.linked_room_numbers || [room.room_number],
      guest_name: guest?.name || 'Guest',
      guest_phone: guest?.phone || '',
      nights,
      is_day_use: isDayUse,
      duration_hours: booking.duration_hours || 2,
      group_size: booking.group_size || 1,
      rate_applied: booking.rate_applied,
      ac_or_non_ac: booking.ac_or_non_ac,
      gross_room_charge: grossRoomCharge,
      discount_amount: finalDiscount,
      discount_type: discountType || 'flat',
      discount_reason: finalReason || 'Counter Courtesy / Special Discount',
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

    const assignedIds = Array.isArray(booking.assigned_room_ids) && booking.assigned_room_ids.length > 0
      ? booking.assigned_room_ids
      : [roomId];

    const updatedRooms = (state.rooms || []).map(r => {
      if (assignedIds.includes(r.id)) {
        return {
          ...r,
          status: 'dirty',
          current_booking_id: null,
          is_day_use: false,
          day_use_end_time: null,
          group_size: null,
          linked_room_numbers: [],
          last_guest_name: guest?.name || 'Guest',
          checked_out_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return r;
    });

    const updatedBooking = {
      ...booking,
      status: 'checked_out',
      actual_checkout_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const auditEntry = logAudit(
      'CHECKOUT_PROCESSED',
      `Room ${booking.linked_room_numbers?.join(', ') || room.room_number}`,
      `Invoice #${invoiceId} settled for ₹${grandTotal} (${paymentMode}). Discount: ₹${finalDiscount}. Handled by: ${billerStaff}`
    );

    Promise.all([
      saveInvoiceToSupabase(newInvoice),
      saveBookingToSupabase(updatedBooking),
      ...updatedRooms.filter(r => assignedIds.includes(r.id)).map(r => saveRoomToSupabase(r)),
      guest ? saveGuestToSupabase({ ...guest, total_stays: (guest.total_stays || 1) + 1, lifetime_spend: (guest.lifetime_spend || 0) + grandTotal }) : Promise.resolve()
    ]).then(() => {
      setOfflineQueueCount(getOfflineQueue().length);
    });

    realtimeRelay.broadcastMutation({
      type: 'CHECKOUT_BILLED',
      invoice: newInvoice,
      booking: updatedBooking,
      rooms: updatedRooms.filter(r => assignedIds.includes(r.id)),
      room: updatedRooms.find(r => r.id === roomId)
    });

    setState(prev => ({
      ...prev,
      rooms: updatedRooms,
      bookings: {
        ...(prev.bookings || {}),
        [booking.id]: updatedBooking
      },
      invoices: [newInvoice, ...(prev.invoices || []).filter(i => i.id !== invoiceId)],
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

    realtimeRelay.broadcastMutation({
      type: 'ROOM_STATUS',
      roomId,
      status: nextStatus,
      roomUpdates: {
        housekeeper_assigned: staffName,
        inspected_by: updatedRoom.inspected_by
      }
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

    realtimeRelay.broadcastMutation({
      type: 'SHIFT_CLOSED',
      shiftRecord
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

    realtimeRelay.broadcastMutation({
      type: 'EXPENSE_LOGGED',
      expense: newExpense
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

    // High-speed cross-device broadcast (< 200ms) to front desk reception terminal
    realtimeRelay.broadcastMutation({
      type: 'SELF_CHECKIN_SUBMITTED',
      selfCheckin: newRecord
    });

    // Authoritative persistence to guests table in Supabase PostgreSQL (triggers postgres_changes on all staff phones)
    saveGuestToSupabase({
      id: 'gst-' + newRecord.id,
      property_id: newRecord.property_id || state.activePropertyId || 'taj-residency-calicut',
      name: newRecord.guest_name,
      phone: newRecord.phone,
      address: newRecord.address || '',
      id_proof_type: newRecord.id_proof_type || 'Aadhaar Card',
      id_proof_number: newRecord.id_proof_number || '',
      id_proof_photo_url: newRecord.id_proof_photo_url || '',
      id_proof_back_photo_url: newRecord.id_proof_back_photo_url || '',
      notes: 'SELF_CHECKIN_PENDING:' + JSON.stringify({
        id: newRecord.id,
        property_id: newRecord.property_id,
        guest_name: newRecord.guest_name,
        phone: newRecord.phone,
        address: newRecord.address,
        id_proof_type: newRecord.id_proof_type,
        id_proof_number: newRecord.id_proof_number,
        group_size: newRecord.group_size,
        booking_type: newRecord.booking_type,
        duration_hours: newRecord.duration_hours,
        eta: newRecord.eta,
        submitted_at: newRecord.submitted_at,
        status: newRecord.status
      })
    }).catch(err => console.warn('[PMS Store] Supabase pending guest save notice:', err));

    // Also attempt write to self_checkins table if configured
    try {
      if (supabase && typeof supabase.from === 'function') {
        supabase.from('self_checkins').insert({
          id: newRecord.id,
          property_id: newRecord.property_id,
          guest_name: newRecord.guest_name,
          phone: newRecord.phone,
          address: newRecord.address,
          id_proof_type: newRecord.id_proof_type,
          id_proof_number: newRecord.id_proof_number,
          id_proof_photo_url: newRecord.id_proof_photo_url,
          status: newRecord.status
        }).then(() => {}).catch(() => {});
      }
    } catch (e) {}

    return newRecord;
  };

  const approveSelfCheckin = (checkinId, options = {}) => {
    const checkin = (state.selfCheckins || []).find(sc => sc.id === checkinId);
    if (!checkin) return null;

    const {
      roomId,
      rateApplied,
      acOrNonAc = 'AC',
      advancePaid = 0,
      paymentMode = 'Cash',
      bookingType = checkin.booking_type || 'overnight',
      durationHours = checkin.duration_hours || 2,
      groupSize = checkin.group_size || 1
    } = options;

    const targetRoomId = roomId || (scopedRooms.find(r => r.status === 'vacant' || r.status === 'ready')?.id);
    const assignedRoom = (state.rooms || []).find(r => r.id === targetRoomId);
    if (!assignedRoom) {
      console.warn('[PMS Store] Cannot approve self-checkin: No vacant room selected or available.');
      return null;
    }

    const checkInTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let checkOutTime = '';
    if (bookingType === 'day_use') {
      const departure = new Date(Date.now() + (Number(durationHours) || 2) * 3600 * 1000);
      checkOutTime = departure.toISOString().replace('T', ' ').slice(0, 16);
    } else {
      const tomorrowNoon = new Date();
      tomorrowNoon.setDate(tomorrowNoon.getDate() + 1);
      tomorrowNoon.setHours(12, 0, 0, 0);
      checkOutTime = tomorrowNoon.toISOString().replace('T', ' ').slice(0, 16);
    }

    // Call authoritative createBooking to set room to 'occupied' across all devices and PostgreSQL
    const createdBooking = createBooking({
      roomId: assignedRoom.id,
      assignedRoomIds: [assignedRoom.id],
      guestName: checkin.guest_name,
      phone: checkin.phone,
      address: checkin.address || 'Kozhikode, Kerala',
      idType: checkin.id_proof_type || 'Aadhaar Card',
      idNumber: checkin.id_proof_number || 'VERIFIED',
      idPhotoUrl: checkin.id_proof_photo_url || '',
      idPhotoBackUrl: checkin.id_proof_back_photo_url || '',
      checkInDate: checkInTime,
      checkOutDate: checkOutTime,
      nights: bookingType === 'day_use' ? 0 : 1,
      bookingType,
      durationHours: Number(durationHours) || 2,
      groupSize: Number(groupSize) || 1,
      rateApplied: Number(rateApplied) || (assignedRoom.room_type_id === 'deluxe' ? 2000 : 1500),
      acOrNonAc: acOrNonAc || 'AC',
      advancePaid: Number(advancePaid) || 0,
      paymentMode: paymentMode || 'Cash',
      isSeasonalRate: false,
      seasonalName: null,
      notes: `Pre-arrival QR Check-In (${checkin.id}) approved by ${currentStaff?.name || 'Reception'}.`
    });

    const finalAmountDue = Number(rateApplied) || (assignedRoom.room_type_id === 'deluxe' ? 2000 : 1500);
    const ownerUpi = activeProperty?.upi_id || state.gstConfig?.upiId || '';
    const initialPaymentStatus = advancePaid > 0 ? 'paid' : (ownerUpi ? 'pending_upi_payment' : 'pending_desk_payment');

    // Update self-check-in queue record to 'approved'
    setState(prev => ({
      ...prev,
      selfCheckins: (prev.selfCheckins || []).map(sc => {
        if (sc.id === checkinId) {
          return {
            ...sc,
            status: 'approved',
            room_number: assignedRoom.room_number,
            booking_id: createdBooking?.id,
            amount_due: finalAmountDue,
            payment_status: initialPaymentStatus,
            upi_id: ownerUpi,
            approved_at: new Date().toISOString(),
            approved_by: currentStaff?.name || 'Receptionist'
          };
        }
        return sc;
      })
    }));

    // Update guest note in Supabase to sync across devices
    saveGuestToSupabase({
      id: 'gst-' + checkinId,
      property_id: state.activePropertyId,
      notes: `SELF_CHECKIN_APPROVED:Room ${assignedRoom.room_number}:Due ₹${finalAmountDue}:${initialPaymentStatus}`
    }).catch(() => {});

    // Broadcast status update to guest's phone in real-time
    realtimeRelay.broadcastMutation({
      type: 'SELF_CHECKIN_STATUS_UPDATED',
      selfCheckinId: checkinId,
      status: 'approved',
      room_number: assignedRoom.room_number,
      bookingId: createdBooking?.id,
      amount_due: finalAmountDue,
      payment_status: initialPaymentStatus,
      upi_id: ownerUpi
    });

    logAudit(
      'SELF_CHECKIN_APPROVED',
      `Room ${assignedRoom.room_number}`,
      `Self check-in for ${checkin.guest_name} approved and assigned to Room ${assignedRoom.room_number}. Amount Due: ₹${finalAmountDue} (${initialPaymentStatus}).`
    );

    return createdBooking;
  };

  const confirmSelfCheckinPayment = (checkinId, options = {}) => {
    const { paymentMode = 'UPI', amountPaid } = options;

    let confirmedAmount = amountPaid;
    let targetBookingId = null;
    let guestName = 'Guest';
    let roomNumber = '';

    setState(prev => {
      const checkin = (prev.selfCheckins || []).find(sc => sc.id === checkinId);
      if (checkin) {
        targetBookingId = checkin.booking_id;
        guestName = checkin.guest_name;
        roomNumber = checkin.room_number;
        if (!confirmedAmount) confirmedAmount = checkin.amount_due || 1500;
      }

      const updatedCheckins = (prev.selfCheckins || []).map(sc => {
        if (sc.id === checkinId) {
          return {
            ...sc,
            payment_status: 'paid',
            advance_paid: confirmedAmount,
            payment_mode: paymentMode,
            payment_confirmed_at: new Date().toISOString(),
            payment_confirmed_by: currentStaff?.name || 'Receptionist'
          };
        }
        return sc;
      });

      // Also update the live booking in store to record advance payment
      let updatedBookings = prev.bookings;
      if (targetBookingId && prev.bookings?.[targetBookingId]) {
        updatedBookings = {
          ...prev.bookings,
          [targetBookingId]: {
            ...prev.bookings[targetBookingId],
            advance_paid: confirmedAmount,
            payment_mode: paymentMode
          }
        };
      }

      return {
        ...prev,
        selfCheckins: updatedCheckins,
        bookings: updatedBookings
      };
    });

    // Broadcast payment confirmation to guest phone in real time
    realtimeRelay.broadcastMutation({
      type: 'SELF_CHECKIN_STATUS_UPDATED',
      selfCheckinId: checkinId,
      status: 'approved',
      payment_status: 'paid',
      amount_paid: confirmedAmount,
      room_number: roomNumber
    });

    // Update guest note in Supabase
    saveGuestToSupabase({
      id: 'gst-' + checkinId,
      property_id: state.activePropertyId,
      notes: `SELF_CHECKIN_APPROVED:Room ${roomNumber}:Paid ₹${confirmedAmount}:paid`
    }).catch(() => {});

    logAudit(
      'SELF_CHECKIN_PAYMENT_VERIFIED',
      `Room ${roomNumber || 'Pre-Checkin'}`,
      `Receptionist ${currentStaff?.name || 'Staff'} visually confirmed ₹${confirmedAmount} UPI payment from ${guestName}.`
    );
  };

  const notifySelfCheckinPaymentSubmitted = (checkinId) => {
    setState(prev => ({
      ...prev,
      selfCheckins: (prev.selfCheckins || []).map(sc => {
        if (sc.id === checkinId) {
          return {
            ...sc,
            payment_status: 'payment_submitted'
          };
        }
        return sc;
      })
    }));

    // Broadcast to front desk reception terminal
    realtimeRelay.broadcastMutation({
      type: 'SELF_CHECKIN_PAYMENT_SUBMITTED',
      selfCheckinId: checkinId
    });
  };

  const rejectSelfCheckin = (checkinId, reason = 'Additional verification required at counter', status = 'rejected') => {
    setState(prev => ({
      ...prev,
      selfCheckins: (prev.selfCheckins || []).map(sc => {
        if (sc.id === checkinId) {
          return {
            ...sc,
            status,
            rejection_reason: reason,
            rejected_at: new Date().toISOString(),
            rejected_by: currentStaff?.name || 'Receptionist'
          };
        }
        return sc;
      })
    }));

    // Update guest note in Supabase to sync across devices
    saveGuestToSupabase({
      id: 'gst-' + checkinId,
      property_id: state.activePropertyId,
      notes: `SELF_CHECKIN_REJECTED:${reason}`
    }).catch(() => {});

    // Broadcast status update to guest's phone so screen reflects note
    realtimeRelay.broadcastMutation({
      type: 'SELF_CHECKIN_STATUS_UPDATED',
      selfCheckinId: checkinId,
      status,
      rejection_reason: reason
    });

    logAudit(
      'SELF_CHECKIN_REJECTED',
      `Pre-checkin ${checkinId}`,
      `Self check-in ${status === 'needs_info' ? 'marked Needs Info' : 'rejected'}: "${reason}" by ${currentStaff?.name || 'Receptionist'}.`
    );
  };

  const confirmSelfCheckin = approveSelfCheckin;

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

  // Scope Collections strictly to Current Business Day in IST
  const todayReconciliation = calculateReconciliationForDate(currentBusinessDay, {
    invoices: scopedInvoices,
    bookings: state.bookings,
    rooms: scopedRooms,
    expenses: scopedExpenses,
    shiftLogs: scopedShiftLogs,
    auditLogs: scopedAuditLogs
  });

  const totalRevenueToday = todayReconciliation.totalCollections;
  const cashRevenue = todayReconciliation.cashCollections;
  const upiRevenue = todayReconciliation.upiCollections;
  const cardRevenue = todayReconciliation.cardCollections;
  const totalBilledNights = todayReconciliation.totalBilledNights;

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
    todayCheckIns: todayReconciliation.checkInsCount,
    todayCheckOuts: todayReconciliation.checkOutsCount,
    todayGstCollected: todayReconciliation.gstTotal,
    todayConcessions: todayReconciliation.discountTotal,
    todayReconciliation,
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
    currentBusinessDay,
    todayReconciliation,
    syncStatus: {
      status: realtimeStatus.relayConnected || realtimeStatus.status === 'connected' ? 'connected' : (realtimeStatus.status === 'offline' ? 'offline' : 'connecting'),
      channel: realtimeStatus.status === 'connected' ? 'postgres_changes (supabase)' : 'realtime_bus (active)',
      lastSyncedAt: realtimeStatus.lastEventAt,
      connectedDevicesCount: realtimeStatus.connectedDevicesCount,
      offlineQueueCount
    },
    offlineQueueCount,
    isSupabaseConfigured,
    actions: {
      syncAllStateNow: () => {
        realtimeRelay.broadcastMutation({
          type: 'SNAPSHOT_SYNC',
          rooms: state.rooms,
          bookings: state.bookings,
          guests: state.guests,
          invoices: state.invoices
        });
      },
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
      getReconciliationForDate: (dateStr) => calculateReconciliationForDate(dateStr, {
        invoices: scopedInvoices,
        bookings: state.bookings,
        rooms: scopedRooms,
        expenses: scopedExpenses,
        shiftLogs: scopedShiftLogs,
        auditLogs: scopedAuditLogs
      }),
      updateFreshUpTiers: (newTiers) => {
        setState(prev => ({
          ...prev,
          freshUpTiers: newTiers
        }));
        try {
          localStorage.setItem('taj_fresh_up_tiers', JSON.stringify(newTiers));
        } catch (e) {}
        realtimeRelay.broadcastMutation({
          type: 'FRESH_UP_TIERS_UPDATE',
          tiers: newTiers
        });
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
      approveSelfCheckin,
      rejectSelfCheckin,
      confirmSelfCheckin,
      confirmSelfCheckinPayment,
      notifySelfCheckinPaymentSubmitted,
      updateGuestIdProof,
      updateGSTConfig,
      logAudit
    }
  };
}
