/**
 * Taj Residency PMS — High-Speed Realtime Cross-Device Sync Bus
 * 
 * Provides sub-second (< 200ms) synchronization across different browsers
 * (Chrome, Safari, Firefox) and devices (Laptop, iPhone, Android, Tablet)
 * via an active SSE event bus and local BroadcastChannel.
 */

const BUS_TOPIC = 'taj_residency_pms_live_sync_bus_adivaram';
const SSE_URL = `https://ntfy.sh/${BUS_TOPIC}/sse`;
const PUBLISH_URL = `https://ntfy.sh/${BUS_TOPIC}`;
const POLL_URL = `https://ntfy.sh/${BUS_TOPIC}/json?poll=1`;
const LOCAL_BUS_NAME = 'taj_pms_cross_tab_bus';

export const SESSION_DEVICE_ID = 'dev_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);

class RealtimeRelayBus {
  constructor() {
    this.eventSource = null;
    this.localBroadcast = null;
    this.onMutationCallback = null;
    this.onStatusCallback = null;
    this.status = 'connecting'; // 'connected' | 'syncing' | 'offline'
    this.lastEventTimestamp = 0;
    this.isInitialized = false;

    // 1. Cross-Tab Local BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcast = new BroadcastChannel(LOCAL_BUS_NAME);
        this.localBroadcast.onmessage = (event) => {
          if (event.data && event.data.senderId !== SESSION_DEVICE_ID) {
            this.handleIncomingPayload(event.data, 'local_broadcast');
          }
        };
      } catch (e) {
        console.warn('[RealtimeBus] BroadcastChannel disabled:', e);
      }
    }
  }

  init(onMutation, onStatus) {
    this.onMutationCallback = onMutation;
    this.onStatusCallback = onStatus;

    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.connectSSE();
    this.pollLatestState();
  }

  connectSSE() {
    if (typeof window === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.updateStatus('connecting');
      this.eventSource = new EventSource(SSE_URL);

      this.eventSource.onopen = () => {
        this.updateStatus('connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data);
          if (envelope && envelope.event === 'message') {
            if (envelope.attachment && envelope.attachment.url) {
              fetch(envelope.attachment.url)
                .then(r => r.json())
                .then(payload => {
                  if (payload && payload.senderId !== SESSION_DEVICE_ID) {
                    this.handleIncomingPayload(payload, 'sse_attachment');
                  }
                })
                .catch(err => console.warn('[RealtimeBus] Attachment parse error:', err));
            } else if (envelope.message) {
              try {
                const payload = JSON.parse(envelope.message);
                if (payload && payload.senderId !== SESSION_DEVICE_ID) {
                  this.handleIncomingPayload(payload, 'sse_cloud');
                }
              } catch (e) {}
            }
          }
        } catch (e) {
          // Non-JSON or heartbeat ping
        }
      };

      this.eventSource.onerror = () => {
        this.updateStatus('reconnecting');
      };
    } catch (err) {
      console.warn('[RealtimeBus] SSE connection error:', err);
      this.updateStatus('error');
    }
  }

  updateStatus(status) {
    this.status = status;
    if (typeof this.onStatusCallback === 'function') {
      this.onStatusCallback({
        status,
        deviceId: SESSION_DEVICE_ID,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleIncomingPayload(payload, source) {
    if (!payload || !payload.type) return;

    // Ignore duplicate or older messages
    if (payload.timestamp && payload.timestamp <= this.lastEventTimestamp) {
      return;
    }
    this.lastEventTimestamp = payload.timestamp || Date.now();

    if (typeof this.onMutationCallback === 'function') {
      this.onMutationCallback(payload, source);
    }
  }

  /**
   * Broadcast a mutation delta (< 1KB) to all connected devices in real time
   */
  broadcastMutation(mutation) {
    if (typeof window === 'undefined') return;

    const payload = {
      senderId: SESSION_DEVICE_ID,
      timestamp: Date.now(),
      ...mutation
    };

    // 1. Send via local BroadcastChannel (0ms latency for same-browser tabs)
    try {
      if (this.localBroadcast) {
        this.localBroadcast.postMessage(payload);
      }
    } catch (e) {}

    // 2. Send via fast HTTP POST to ntfy.sh SSE relay (< 150ms for cross-browser & mobile)
    let relayPayload = payload;
    if (mutation.type === 'SELF_CHECKIN_SUBMITTED' && mutation.selfCheckin) {
      const sc = mutation.selfCheckin;
      relayPayload = {
        ...payload,
        selfCheckin: {
          id: sc.id,
          property_id: sc.property_id,
          guest_name: sc.guest_name,
          phone: sc.phone,
          address: sc.address,
          id_proof_type: sc.id_proof_type,
          id_proof_number: sc.id_proof_number,
          group_size: sc.group_size,
          booking_type: sc.booking_type,
          duration_hours: sc.duration_hours,
          eta: sc.eta,
          submitted_at: sc.submitted_at,
          status: sc.status,
          id_proof_photo_url: sc.id_proof_photo_url?.startsWith('http') ? sc.id_proof_photo_url : '',
          id_proof_back_photo_url: sc.id_proof_back_photo_url?.startsWith('http') ? sc.id_proof_back_photo_url : ''
        }
      };
    }

    const jsonStr = JSON.stringify(relayPayload);
    fetch(PUBLISH_URL, {
      method: 'POST',
      headers: {
        'Title': `PMS: ${mutation.type || 'MUTATION'}`,
        'Priority': 'urgent'
      },
      body: jsonStr
    }).catch(err => {
      console.warn('[RealtimeBus] Broadcast failed:', err);
    });
  }

  /**
   * Poll latest message on boot to ensure fresh devices receive recent updates
   */
  async pollLatestState() {
    if (typeof window === 'undefined') return;

    try {
      const res = await fetch(POLL_URL);
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;

      const lines = text.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const envelope = JSON.parse(lines[i]);
          if (envelope.event === 'message' && envelope.message) {
            const payload = JSON.parse(envelope.message);
            if (payload && payload.senderId !== SESSION_DEVICE_ID) {
              this.handleIncomingPayload(payload, 'initial_poll');
              break;
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[RealtimeBus] Startup poll failed:', err);
    }
  }
}

export const realtimeRelay = new RealtimeRelayBus();
