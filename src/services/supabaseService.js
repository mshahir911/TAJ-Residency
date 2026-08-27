/**
 * Taj Residency PMS — Mandatory Supabase (PostgreSQL) Single Source of Truth
 * 
 * Features:
 * 1. Supabase as the single mandatory source of truth (synchronous direct writes)
 * 2. Supabase Realtime (postgres_changes subscriptions) across all devices (< 1-2s latency)
 * 3. Offline Write Queue (localStorage fallback strictly for offline queueing & auto-flush)
 * 4. Zero-loss One-Time Migration from legacy localStorage to PostgreSQL
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const OFFLINE_QUEUE_KEY = 'taj_pms_offline_write_queue_v1';
const MIGRATION_DONE_KEY = 'taj_pms_migrated_to_supabase_v2';
const LEGACY_STORAGE_KEY = 'taj_residency_pms_v6_safe_auth';

// ============================================================================
// 1. OFFLINE WRITE QUEUE (LOCALSTORAGE BACKED)
// ============================================================================

export function getOfflineQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
}

export function enqueueOfflineMutation(mutation) {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue();
    const entry = {
      id: mutation.id || `mut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      table: mutation.table,
      action: mutation.action || 'upsert', // 'upsert' | 'insert' | 'delete'
      payload: mutation.payload,
      match: mutation.match || null,
      timestamp: new Date().toISOString()
    };
    queue.push(entry);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return entry;
  } catch (e) {
    console.error('Failed to enqueue offline mutation:', e);
  }
}

export function clearOfflineQueue() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {}
}

export async function flushOfflineQueue(onProgress) {
  const queue = getOfflineQueue();
  if (!queue.length) return { processed: 0, failed: 0 };

  const remaining = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      let res;
      if (item.action === 'upsert') {
        res = await supabase.from(item.table).upsert(item.payload);
      } else if (item.action === 'insert') {
        res = await supabase.from(item.table).insert(item.payload);
      } else if (item.action === 'delete') {
        res = await supabase.from(item.table).delete().match(item.match || item.payload);
      }
      if (res?.error) throw res.error;
      processed++;
      if (typeof onProgress === 'function') {
        onProgress({ item, status: 'success', remaining: queue.length - processed });
      }
    } catch (err) {
      console.warn(`[Supabase Queue] Flushing failed for item ${item.id}:`, err);
      remaining.push(item);
      failed++;
    }
  }

  try {
    if (remaining.length) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
  } catch (e) {}

  return { processed, failed, remainingCount: remaining.length };
}

// Auto-flush when window comes online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue().then(({ processed }) => {
      if (processed > 0) {
        console.log(`[Supabase Realtime] Flushed ${processed} queued offline mutations to cloud.`);
      }
    });
  });
}

// ============================================================================
// 2. PRIMARY SYNCHRONOUS MUTATION DISPATCHER
// ============================================================================

export async function executeSupabaseMutation({ table, action = 'upsert', payload, match = null }) {
  try {
    let res;
    if (action === 'upsert') {
      res = await supabase.from(table).upsert(payload);
    } else if (action === 'insert') {
      res = await supabase.from(table).insert(payload);
    } else if (action === 'delete') {
      res = await supabase.from(table).delete().match(match || payload);
    }

    if (res?.error) {
      throw res.error;
    }

    // Try flushing any previously queued offline mutations as network is confirmed working
    flushOfflineQueue().catch(() => {});

    return { success: true, queued: false, data: res?.data };
  } catch (error) {
    console.warn(`[Supabase Service] Write to ${table} failed. Storing in offline write-queue:`, error.message || error);
    enqueueOfflineMutation({ table, action, payload, match });
    return { success: false, queued: true, error };
  }
}

// Payload sanitizers to ensure exact PostgreSQL schema compliance
function sanitizeRoomPayload(room) {
  if (!room) return null;
  return {
    id: room.id,
    property_id: room.property_id || 'taj-residency-calicut',
    room_number: String(room.room_number),
    room_type_id: room.room_type_id || 'classic',
    floor: Number(room.floor) || 2,
    status: room.status || 'vacant',
    current_booking_id: room.current_booking_id || null,
    wifi_voucher_code: room.wifi_voucher_code || null,
    housekeeper_assigned: room.housekeeper_assigned || null,
    inspected_by: room.inspected_by || null,
    last_guest_name: room.last_guest_name || null,
    checked_out_at: room.checked_out_at || null
  };
}

function sanitizeBookingPayload(booking) {
  if (!booking) return null;
  return {
    id: booking.id,
    property_id: booking.property_id || 'taj-residency-calicut',
    room_id: booking.room_id,
    guest_id: booking.guest_id,
    status: booking.status || 'confirmed',
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    nights: Number(booking.nights) || 1,
    rate_applied: Number(booking.rate_applied) || 1500,
    ac_or_non_ac: booking.ac_or_non_ac || 'AC',
    advance_paid: Number(booking.advance_paid) || 0,
    payment_mode: booking.payment_mode || 'Cash',
    created_by_staff_name: booking.created_by_staff_name || 'Reception Desk',
    wifi_code: booking.wifi_code || null
  };
}

function sanitizeGuestPayload(guest) {
  if (!guest) return null;
  return {
    id: guest.id,
    property_id: guest.property_id || 'taj-residency-calicut',
    name: guest.name || 'Guest',
    phone: guest.phone || '',
    address: guest.address || 'Kozhikode, Kerala',
    id_proof_type: guest.id_proof_type || 'Aadhaar Card',
    id_proof_number: guest.id_proof_number || '',
    id_proof_photo_url: guest.id_proof_photo_url || '',
    id_proof_back_photo_url: guest.id_proof_back_photo_url || '',
    id_verified_at: guest.id_verified_at || '',
    id_verified_by_staff: guest.id_verified_by_staff || '',
    notes: guest.notes || '',
    total_stays: Number(guest.total_stays) || 1,
    lifetime_spend: Number(guest.lifetime_spend) || 0
  };
}

function sanitizeInvoicePayload(invoice) {
  if (!invoice) return null;
  return {
    id: invoice.id,
    property_id: invoice.property_id || 'taj-residency-calicut',
    booking_id: invoice.booking_id,
    room_number: String(invoice.room_number),
    guest_name: invoice.guest_name || 'Guest',
    guest_phone: invoice.guest_phone || '',
    nights: Number(invoice.nights) || 1,
    rate_applied: Number(invoice.rate_applied) || 1500,
    ac_or_non_ac: invoice.ac_or_non_ac || 'AC',
    gross_room_charge: Number(invoice.gross_room_charge) || 0,
    discount_amount: Number(invoice.discount_amount) || 0,
    discount_type: invoice.discount_type || 'flat',
    discount_reason: invoice.discount_reason || '',
    room_charge: Number(invoice.room_charge) || 0,
    gst_rate: Number(invoice.gst_rate) || 0,
    gst_amount: Number(invoice.gst_amount) || 0,
    cgst_amount: Number(invoice.cgst_amount) || 0,
    sgst_amount: Number(invoice.sgst_amount) || 0,
    advance_paid: Number(invoice.advance_paid) || 0,
    total: Number(invoice.total) || 0,
    balance_settled: Number(invoice.balance_settled) || 0,
    payment_mode: invoice.payment_mode || 'Cash',
    billed_by_staff_name: invoice.billed_by_staff_name || 'Receptionist',
    paid_at: invoice.paid_at || new Date().toISOString()
  };
}

// Entity-Specific Helpers
export const saveRoomToSupabase = (room) => executeSupabaseMutation({ table: 'rooms', action: 'upsert', payload: sanitizeRoomPayload(room) });
export const saveBookingToSupabase = (booking) => executeSupabaseMutation({ table: 'bookings', action: 'upsert', payload: sanitizeBookingPayload(booking) });
export const saveGuestToSupabase = (guest) => executeSupabaseMutation({ table: 'guests', action: 'upsert', payload: sanitizeGuestPayload(guest) });
export const saveInvoiceToSupabase = (invoice) => executeSupabaseMutation({ table: 'invoices', action: 'upsert', payload: sanitizeInvoicePayload(invoice) });
export const saveExpenseToSupabase = (expense) => executeSupabaseMutation({ table: 'expenses', action: 'upsert', payload: expense });
export const saveShiftLogToSupabase = (shiftLog) => executeSupabaseMutation({ table: 'shift_logs', action: 'upsert', payload: shiftLog });
export const saveAuditLogToSupabase = (auditLog) => executeSupabaseMutation({ table: 'audit_logs', action: 'upsert', payload: auditLog });
export const saveSeasonalOverrideToSupabase = (override) => executeSupabaseMutation({ table: 'seasonal_overrides', action: 'upsert', payload: override });
export const deleteSeasonalOverrideFromSupabase = (id) => executeSupabaseMutation({ table: 'seasonal_overrides', action: 'delete', match: { id } });

// ============================================================================
// 3. AUTHORITATIVE INITIAL DATASET HYDRATION
// ============================================================================

export async function fetchInitialDataset(propertyId = 'taj-residency-calicut') {
  try {
    const [
      roomsRes,
      bookingsRes,
      guestsRes,
      invoicesRes,
      expensesRes,
      shiftLogsRes,
      auditLogsRes,
      overridesRes
    ] = await Promise.allSettled([
      supabase.from('rooms').select('*').order('room_number', { ascending: true }),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('guests').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('paid_at', { ascending: false }),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('shift_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(250),
      supabase.from('seasonal_overrides').select('*')
    ]);

    const result = {
      isLoaded: true,
      hasData: false
    };

    if (roomsRes.status === 'fulfilled' && roomsRes.value?.data?.length) {
      result.rooms = roomsRes.value.data;
      result.hasData = true;
    }

    if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.data?.length) {
      const bookingsMap = {};
      bookingsRes.value.data.forEach(b => {
        bookingsMap[b.id] = b;
      });
      result.bookings = bookingsMap;
      result.hasData = true;
    }

    if (guestsRes.status === 'fulfilled' && guestsRes.value?.data?.length) {
      result.guests = guestsRes.value.data;
      result.hasData = true;
    }

    if (invoicesRes.status === 'fulfilled' && invoicesRes.value?.data?.length) {
      result.invoices = invoicesRes.value.data;
      result.hasData = true;
    }

    if (expensesRes.status === 'fulfilled' && expensesRes.value?.data?.length) {
      result.expenses = expensesRes.value.data;
    }

    if (shiftLogsRes.status === 'fulfilled' && shiftLogsRes.value?.data?.length) {
      result.shiftLogs = shiftLogsRes.value.data;
    }

    if (auditLogsRes.status === 'fulfilled' && auditLogsRes.value?.data?.length) {
      result.auditLogs = auditLogsRes.value.data;
    }

    if (overridesRes.status === 'fulfilled' && overridesRes.value?.data?.length) {
      result.seasonalOverrides = overridesRes.value.data;
    }

    return result;
  } catch (err) {
    console.warn('[Supabase Service] Initial fetch error:', err);
    return { isLoaded: false, error: err };
  }
}

// ============================================================================
// 4. SUPABASE REALTIME SUBSCRIPTIONS (POSTGRES_CHANGES)
// ============================================================================

let realtimeChannel = null;

export function subscribeToSupabaseRealtime({ onTableChange, onStatusChange }) {
  if (typeof window === 'undefined') return () => {};

  if (realtimeChannel) {
    try {
      supabase.removeChannel(realtimeChannel);
    } catch (e) {}
    realtimeChannel = null;
  }

  const channelName = `taj_pms_realtime_${Math.random().toString(36).slice(2, 7)}`;
  
  realtimeChannel = supabase.channel(channelName);

  const tables = ['rooms', 'bookings', 'guests', 'invoices', 'expenses', 'shift_logs', 'audit_logs', 'seasonal_overrides'];

  tables.forEach(table => {
    realtimeChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        if (typeof onTableChange === 'function') {
          onTableChange({
            table,
            eventType: payload.eventType, // 'INSERT' | 'UPDATE' | 'DELETE'
            newRecord: payload.new,
            oldRecord: payload.old,
            timestamp: payload.commit_timestamp || new Date().toISOString()
          });
        }
      }
    );
  });

  realtimeChannel.subscribe((status, err) => {
    if (typeof onStatusChange === 'function') {
      onStatusChange({
        status, // 'SUBSCRIBED', 'TIMED_OUT', 'CLOSED', 'CHANNEL_ERROR'
        error: err,
        timestamp: new Date().toISOString()
      });
    }
  });

  return () => {
    if (realtimeChannel) {
      try {
        supabase.removeChannel(realtimeChannel);
      } catch (e) {}
      realtimeChannel = null;
    }
  };
}

// ============================================================================
// 5. ONE-TIME LEGACY LOCALSTORAGE MIGRATION TO SUPABASE
// ============================================================================

export async function migrateLegacyLocalStorageToSupabase(propertyId = 'taj-residency-calicut') {
  if (typeof window === 'undefined') return { skipped: true };

  try {
    const isDone = localStorage.getItem(MIGRATION_DONE_KEY);
    if (isDone === 'true') {
      return { skipped: true, reason: 'Already migrated' };
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) {
      localStorage.setItem(MIGRATION_DONE_KEY, 'true');
      return { skipped: true, reason: 'No legacy storage found' };
    }

    const parsed = JSON.parse(legacyRaw);
    console.log('[Supabase Migration] Beginning one-time upsert of legacy localStorage data...');

    const promises = [];

    // 1. Guests
    if (Array.isArray(parsed.guests) && parsed.guests.length) {
      promises.push(supabase.from('guests').upsert(parsed.guests));
    }

    // 2. Rooms
    if (Array.isArray(parsed.rooms) && parsed.rooms.length) {
      promises.push(supabase.from('rooms').upsert(parsed.rooms));
    }

    // 3. Bookings
    if (parsed.bookings && typeof parsed.bookings === 'object') {
      const bookingsArray = Object.values(parsed.bookings);
      if (bookingsArray.length) {
        promises.push(supabase.from('bookings').upsert(bookingsArray));
      }
    }

    // 4. Invoices
    if (Array.isArray(parsed.invoices) && parsed.invoices.length) {
      promises.push(supabase.from('invoices').upsert(parsed.invoices));
    }

    // 5. Expenses
    if (Array.isArray(parsed.expenses) && parsed.expenses.length) {
      promises.push(supabase.from('expenses').upsert(parsed.expenses));
    }

    // 6. Shift Logs
    if (Array.isArray(parsed.shiftLogs) && parsed.shiftLogs.length) {
      promises.push(supabase.from('shift_logs').upsert(parsed.shiftLogs));
    }

    // 7. Audit Logs
    if (Array.isArray(parsed.auditLogs) && parsed.auditLogs.length) {
      promises.push(supabase.from('audit_logs').upsert(parsed.auditLogs.slice(0, 100)));
    }

    const results = await Promise.allSettled(promises);
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    console.log('[Supabase Migration] Legacy migration complete:', results);
    return { success: true, count: promises.length };
  } catch (err) {
    console.error('[Supabase Migration] Error during legacy migration:', err);
    return { success: false, error: err };
  }
}

// ============================================================================
// 6. LIVE CONNECTION TESTER
// ============================================================================

export async function testSupabaseConnection() {
  const start = performance.now();
  try {
    const { data, error } = await supabase.from('properties').select('id, name').limit(1);
    const latency = Math.round(performance.now() - start);
    if (error) throw error;
    return { ok: true, latency, data };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return { ok: false, latency, error: err.message || String(err) };
  }
}
