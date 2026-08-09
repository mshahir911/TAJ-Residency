import React from 'react';
import { X, Wifi, Printer, Share2, ShieldCheck, Key, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function WiFiVoucherModal({
  isOpen,
  onClose,
  room,
  booking,
  property
}) {
  if (!isOpen || !room) return null;

  const wifiCode = room.wifi_voucher_code || `TR-WIFI-${room.room_number}-77X9`;
  const ssid = property?.wifiSSID || 'TajResidency_Guest_5G';
  const expiresAt = booking?.check_out_date || 'Checkout Date (11:00 AM)';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const msg = `🏛️ *${property?.name || 'Taj Residency'} — COMPLIMENTARY HIGH-SPEED WIFI PASS*
_Room ${room.room_number}_

📶 *Network (SSID):* ${ssid}
🔑 *Voucher Passcode:* \`${wifiCode}\`
⏳ *Valid Until:* ${expiresAt}

_Connect to the network and enter the passcode above for uninterrupted browsing._`;

    const cleanPhone = (booking?.phone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/80 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brass text-ink font-bold flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-base leading-none">
                Room {room.room_number} WiFi Voucher
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Auto-expiring guest access pass
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Voucher Pass Card */}
        <div className="p-6 space-y-4 text-center">
          <div className="bg-ink p-5 rounded-2xl border border-brass/40 shadow-inner space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase border-b border-brass-soft/20 pb-1.5">
              <span>High Speed 5G Pass</span>
              <span className="text-signal-green font-bold">ACTIVE</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Wi-Fi Network (SSID)</span>
              <div className="font-bold text-white text-base mt-0.5">{ssid}</div>
            </div>

            <div className="p-3 bg-panel-raised rounded-xl border border-brass space-y-1">
              <span className="text-[9px] uppercase font-mono text-brass font-bold block">Room Voucher Passcode</span>
              <div className="font-mono font-bold text-2xl text-brass tracking-wider select-all">
                {wifiCode}
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 flex justify-between pt-1">
              <span>Assigned Room: <strong className="text-white">{room.room_number}</strong></span>
              <span>Expires: <strong className="text-slate-300">{expiresAt}</strong></span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-panel border border-brass-soft text-slate-200 hover:text-white hover:border-brass font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-brass" />
              <span>Print Pass</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-signal-green text-ink font-bold transition-all flex items-center justify-center gap-1.5 hover:brightness-110 shadow-md shadow-signal-green/20"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
