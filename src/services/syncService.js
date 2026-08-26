/**
 * Taj Residency FrontDesk OS — Real-Time Cross-Device Synchronization Engine
 * 
 * Provides instantaneous 2-way synchronization between Reception Desk Laptops,
 * Owner Mobile Phones, and Housekeeping Tablets using Supabase Realtime WebSockets
 * and native Browser BroadcastChannels.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const SYNC_CHANNEL_NAME = 'taj_pms_sync_channel';
const BROADCAST_EVENT = 'PMS_STATE_SYNC';
const LOCAL_BROADCAST_NAME = 'taj_pms_local_channel';

// Unique Device ID for this browser session to avoid echoing back our own broadcasts
const DEVICE_ID = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

class SyncService {
  constructor() {
    this.channel = null;
    this.localBroadcast = null;
    this.onStateChangeCallback = null;
    this.onStatusChangeCallback = null;
    this.status = 'local'; // 'connected' | 'syncing' | 'local' | 'error'
    this.lastSyncedAt = null;
    this.connectedDevicesCount = 1;

    // Initialize local tab BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcast = new BroadcastChannel(LOCAL_BROADCAST_NAME);
        this.localBroadcast.onmessage = (event) => {
          if (event.data && event.data.senderId !== DEVICE_ID) {
            this.handleIncomingState(event.data, 'local_broadcast');
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or disabled:', e);
      }
    }
  }

  /**
   * Initialize real-time synchronization listener
   */
  init(onRemoteStateReceived, onStatusChange) {
    this.onStateChangeCallback = onRemoteStateReceived;
    this.onStatusChangeCallback = onStatusChange;

    if (!isSupabaseConfigured || !supabase) {
      this.updateStatus('local');
      return;
    }

    try {
      this.updateStatus('syncing');

      // Create Supabase Realtime WebSocket channel
      this.channel = supabase.channel(SYNC_CHANNEL_NAME, {
        config: {
          broadcast: { self: false, ack: true },
          presence: { key: DEVICE_ID }
        }
      });

      // Listen for remote PMS state updates
      this.channel.on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
        if (payload && payload.senderId !== DEVICE_ID) {
          this.handleIncomingState(payload, 'supabase_realtime');
        }
      });

      // Presence tracking for connected devices
      this.channel.on('presence', { event: 'sync' }, () => {
        const presenceState = this.channel.presenceState();
        this.connectedDevicesCount = Object.keys(presenceState).length || 1;
        this.notifyStatus();
      });

      // Subscribe to channel
      this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.updateStatus('connected');
          await this.channel.track({
            online_at: new Date().toISOString(),
            device_id: DEVICE_ID,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.updateStatus('local');
        }
      });
    } catch (err) {
      console.warn('Supabase Realtime initialization warning:', err);
      this.updateStatus('local');
    }
  }

  /**
   * Broadcast state changes to all other connected devices (Laptop <-> Mobile)
   */
  broadcast(state, actionName = 'UPDATE') {
    if (!state) return;

    const payload = {
      senderId: DEVICE_ID,
      timestamp: Date.now(),
      actionName,
      state: {
        rooms: state.rooms,
        bookings: state.bookings,
        guests: state.guests,
        invoices: state.invoices,
        expenses: state.expenses,
        seasonalOverrides: state.seasonalOverrides,
        shiftLogs: state.shiftLogs,
        auditLogs: state.auditLogs,
        selfCheckins: state.selfCheckins,
        activePropertyId: state.activePropertyId
      }
    };

    // 1. Broadcast to other tabs on same machine
    if (this.localBroadcast) {
      try {
        this.localBroadcast.postMessage(payload);
      } catch (e) {}
    }

    // 2. Broadcast to other devices over Supabase Realtime
    if (this.channel && this.status === 'connected') {
      try {
        this.channel.send({
          type: 'broadcast',
          event: BROADCAST_EVENT,
          payload
        }).catch(err => {
          console.warn('Broadcast send error:', err);
        });
      } catch (e) {
        console.warn('Channel send exception:', e);
      }
    }

    this.lastSyncedAt = new Date();
  }

  /**
   * Handle incoming remote state payload
   */
  handleIncomingState(payload, source) {
    if (!payload || !payload.state) return;

    this.lastSyncedAt = new Date(payload.timestamp || Date.now());

    if (typeof this.onStateChangeCallback === 'function') {
      this.onStateChangeCallback(payload.state, payload.actionName, source);
    }
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    this.notifyStatus();
  }

  notifyStatus() {
    if (typeof this.onStatusChangeCallback === 'function') {
      this.onStatusChangeCallback({
        status: this.status,
        lastSyncedAt: this.lastSyncedAt,
        connectedDevicesCount: this.connectedDevicesCount,
        deviceId: DEVICE_ID
      });
    }
  }

  getDeviceId() {
    return DEVICE_ID;
  }
}

export const syncService = new SyncService();
