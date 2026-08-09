import React, { useState } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  Share2,
  Clock,
  User,
  Shield,
  FileText,
  Upload,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function GuestSelfCheckinModal({
  isOpen,
  onClose,
  selfCheckins = [],
  onConfirmSelfCheckin,
  onAddSelfCheckin,
  rooms = [],
  property
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'guest-portal' | 'qr-code'
  
  // Simulated Guest Self-Form State
  const [guestName, setGuestName] = useState('Vivek Krishna');
  const [phone, setPhone] = useState('+91 94470 99881');
  const [address, setAddress] = useState('Panampilly Nagar, Kochi, Kerala');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('XXXX-XXXX-4512');
  const [eta, setEta] = useState('Tonight 21:30 IST');
  const [selectedRoom, setSelectedRoom] = useState('room-202');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const portalUrl = `https://tajresidency.in/checkin/qr-fast-pass`;

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    onAddSelfCheckin({
      guest_name: guestName,
      phone,
      address,
      id_proof_type: idType,
      id_proof_number: idNumber,
      eta,
      room_number: '202'
    });
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setActiveTab('queue');
    }, 1500);
  };

  const vacantRooms = rooms.filter(r => r.status === 'vacant' || r.status === 'ready');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg leading-none">
                Guest Self-Registration QR Portal
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Pre-fill ID proof & digital signature before reaching front desk
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

        {/* Tab Headers */}
        <div className="px-5 pt-3 bg-panel/50 border-b border-brass-soft/20 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Incoming Pre-Filled Queue ({selfCheckins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guest-portal')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'guest-portal'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Simulate Mobile Guest Form</span>
          </button>

          <button
            onClick={() => setActiveTab('qr-code')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'qr-code'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Print Counter Stand QR</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 1. RECEPTIONIST QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                <span>Self-submitted registrations awaiting desk confirmation:</span>
                <span className="text-brass">{selfCheckins.length} Active</span>
              </div>

              {selfCheckins.length === 0 ? (
                <div className="p-8 text-center bg-ink rounded-xl border border-brass-soft/20 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-signal-green mx-auto" />
                  <div className="font-bold text-white">No Pending Self-Registrations</div>
                  <p className="text-[11px] font-mono">
                    Guests can scan the QR code at the counter or via WhatsApp to submit details.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selfCheckins.map(item => (
                    <div
                      key={item.id}
                      className="bg-ink p-4 rounded-xl border border-brass-soft/30 space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-mono uppercase bg-brass/20 text-brass px-1.5 py-0.5 rounded font-bold">
                            PRE-FILLED VIA MOBILE QR
                          </span>
                          <h3 className="font-display font-bold text-white text-base mt-1">
                            {item.guest_name}
                          </h3>
                          <div className="font-mono text-[11px] text-slate-300">
                            {item.phone} • ETA: {item.eta}
                          </div>
                        </div>

                        <span className="px-2 py-1 rounded bg-signal-green/15 text-signal-green text-[10px] font-mono font-bold border border-signal-green/30">
                          ✓ Digital Signature Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-panel p-2.5 rounded-lg border border-brass-soft/20">
                        <div>ID Proof: <strong className="text-slate-200">{item.id_proof_type} ({item.id_proof_number})</strong></div>
                        <div>Address: <strong className="text-slate-200">{item.address}</strong></div>
                      </div>

                      {/* 1-Click Confirmation to Room */}
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          value={selectedRoom}
                          onChange={(e) => setSelectedRoom(e.target.value)}
                          className="bg-panel-raised border border-brass-soft rounded-lg px-2.5 py-2 text-white font-mono text-xs flex-1"
                        >
                          {vacantRooms.map(r => (
                            <option key={r.id} value={r.id}>
                              Assign Room {r.room_number} (Floor {r.floor}) — VACANT
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => onConfirmSelfCheckin(item.id, selectedRoom)}
                          className="py-2 px-4 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-md shadow-brass/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>1-Click Check In (No Re-typing)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. GUEST MOBILE FORM SIMULATOR */}
          {activeTab === 'guest-portal' && (
            <div className="space-y-4">
              {submittedMessage ? (
                <div className="p-8 text-center bg-ink rounded-xl border border-signal-green space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-signal-green mx-auto" />
                  <h3 className="font-display font-bold text-lg text-white">
                    Registration Submitted Successfully!
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Sent to Taj Residency Front Desk queue.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleGuestSubmit} className="space-y-3 bg-ink p-4 rounded-xl border border-brass-soft/30">
                  <div className="text-[11px] font-mono text-brass uppercase font-bold border-b border-brass-soft/20 pb-1">
                    Mobile Fast Check-In (Guest View)
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">WhatsApp / Phone *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block">Permanent Address *</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">ID Proof Document *</label>
                      <select
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                        className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Voter ID">Voter ID</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">ID Number / Reference *</label>
                      <input
                        type="text"
                        required
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-panel rounded-lg border border-brass-soft/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Upload className="w-4 h-4 text-brass" />
                      <span>ID Photo Document: <strong className="text-signal-green">aadhaar_front.jpg (Attached)</strong></span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Captured ✓</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Submit Pre-Arrival Registration to Desk</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 3. COUNTER STAND QR */}
          {activeTab === 'qr-code' && (
            <div className="space-y-4 text-center">
              <div className="bg-paper text-paper-ink p-6 rounded-2xl border-2 border-brass max-w-sm mx-auto shadow-2xl space-y-4">
                <div>
                  <div className="font-display font-bold text-xl uppercase tracking-wider">
                    {property.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600">
                    EXPRESS SELF CHECK-IN
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl shadow-inner inline-block">
                  <QRCodeSVG
                    value={portalUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-bold">Scan with Camera or WhatsApp</div>
                  <p className="text-[10px] text-slate-600 font-mono">
                    Pre-fill Aadhaar / Passport & walk straight to your room key.
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="py-2 px-4 rounded-xl bg-panel border border-brass-soft text-white font-mono text-xs hover:border-brass"
                >
                  Print Counter Stand
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
