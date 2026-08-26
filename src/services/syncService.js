/**
 * Taj Residency FrontDesk OS — Real-Time Cross-Device Synchronization Engine
 * 
 * Provides instantaneous 2-way synchronization between Reception Desk Laptops,
 * Owner Mobile Phones, and Housekeeping Tablets using Server-Sent Events (SSE)
 * relay and native Browser BroadcastChannels.
 */

const SYNC_TOPIC = 'taj_residency_pms_sync_live_adivaram';
const SSE_URL = `https://ntfy.sh/${SYNC_TOPIC}/sse`;
const PUBLISH_URL = `https://ntfy.sh/${SYNC_TOPIC}`;
const POLL_URL = `https://ntfy.sh/${SYNC_TOPIC}/json?poll=1`;
const LOCAL_BROADCAST_NAME = 'taj_pms_local_channel';

// Unique Device ID for this browser session to avoid echoing back our own broadcasts
const DEVICE_ID = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

class SyncService {
  constructor() {
    this.eventSource = null;
    this.localBroadcast = null;
    this.onStateChangeCallback = null;
    this.onStatusChangeCallback = null;
    this.status = 'connecting'; // 'connected' | 'syncing' | 'local' | 'error'
    this.lastSyncedAt = null;
    this.connectedDevicesCount = 2; // desk + phone
    this.lastBroadcastTimestamp = 0;

    // Initialize local tab BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcast = new BroadcastChannel(LOCAL_BROADCAST_NAME);
        this.localBroadcast.onmessage = (event) => {
          if (event.data && event.data.senderId !== DEVICE_ID) {
            this.handleIncomingPayload(event.data, 'local_broadcast');
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel disabled:', e);
      }
    }
  }

  /**
   * Initialize real-time synchronization listener
   */
  init(onRemoteStateReceived, onStatusChange) {
    this.onStateChangeCallback = onRemoteStateReceived;
    this.onStatusChangeCallback = onStatusChange;

    if (typeof window === 'undefined') return;

    this.connectSSE();
    this.pullLatestState();
  }

  /**
   * Connect to real-time Server-Sent Events (SSE) stream
   */
  connectSSE() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.updateStatus('syncing');
      this.eventSource = new EventSource(SSE_URL);

      this.eventSource.onopen = () => {
        this.updateStatus('connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data);
          // ntfy wraps messages in an envelope
          if (envelope && envelope.event === 'message') {
            // Check if there's an attachment URL (for large state payloads)
            if (envelope.attachment && envelope.attachment.url) {
              this.fetchAttachmentPayload(envelope.attachment.url);
            } else if (envelope.message) {
              const payload = JSON.parse(envelope.message);
              this.handleIncomingPayload(payload, 'cloud_sse');
            }
          }
        } catch (e) {
          // non-json message or heartbeat, safe to ignore
        }
      };

      this.eventSource.onerror = () => {
        this.updateStatus('reconnecting');
        // SSE automatically reconnects, but fallback to retry after 5s
        setTimeout(() => {
          if (this.status !== 'connected') {
            this.connectSSE();
          }
        }, 5000);
      };
    } catch (err) {
      console.warn('SSE connection exception:', err);
      this.updateStatus('local');
    }
  }

  /**
   * Fetch payload when uploaded as an attachment
   */
  async fetchAttachmentPayload(url) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const payload = await res.json();
        this.handleIncomingPayload(payload, 'cloud_sse_attachment');
      }
    } catch (e) {
      console.warn('Failed to fetch attachment sync payload:', e);
    }
  }

  /**
   * Pull the latest state on startup or manual refresh
   */
  async pullLatestState() {
    try {
      const res = await fetch(POLL_URL);
      if (!res.ok) return null;
      const text = await res.text();
      const lines = text.trim().split('\n');
      
      // Look at the latest message
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const item = JSON.parse(lines[i]);
          if (item.attachment && item.attachment.url) {
            const fileRes = await fetch(item.attachment.url);
            if (fileRes.ok) {
              const payload = await fileRes.json();
              if (payload && payload.senderId !== DEVICE_ID && payload.state) {
                this.handleIncomingPayload(payload, 'cloud_poll');
                return payload.state;
              }
            }
          } else if (item.message) {
            const payload = JSON.parse(item.message);
            if (payload && payload.senderId !== DEVICE_ID && payload.state) {
              this.handleIncomingPayload(payload, 'cloud_poll');
              return payload.state;
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Cloud poll check error:', e);
    }
    return null;
  }

  /**
   * Broadcast state changes to all other connected devices (Laptop <-> Mobile)
   */
  broadcast(state, actionName = 'UPDATE') {
    if (!state) return;

    // Rate-limit rapid micro-updates to at most once per 350ms
    const now = Date.now();
    if (now - this.lastBroadcastTimestamp < 350) {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.broadcast(state, actionName), 350);
      return;
    }
    this.lastBroadcastTimestamp = now;

    const payload = {
      senderId: DEVICE_ID,
      timestamp: now,
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

    // 2. Broadcast to other devices over Cloud HTTP POST
    try {
      fetch(PUBLISH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Title': `PMS: ${actionName}`,
          'Priority': 'default'
        },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.warn('Cloud publish error:', err);
      });
    } catch (e) {
      console.warn('Broadcast send exception:', e);
    }

    this.lastSyncedAt = new Date();
    this.updateStatus('connected');
  }

  /**
   * Handle incoming remote state payload
   */
  handleIncomingPayload(payload, source) {
    if (!payload || !payload.state || payload.senderId === DEVICE_ID) return;

    this.lastSyncedAt = new Date(payload.timestamp || Date.now());

    if (typeof this.onStateChangeCallback === 'function') {
      this.onStateChangeCallback(payload.state, payload.actionName, source);
    }

    this.updateStatus('connected');
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
        deviceId: DEVICE_ID,
        topic: SYNC_TOPIC
      });
    }
  }

  getDeviceId() {
    return DEVICE_ID;
  }
}

export const syncService = new SyncService();
