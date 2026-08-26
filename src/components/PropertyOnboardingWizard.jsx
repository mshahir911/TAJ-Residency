import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  BedDouble,
  Users,
  ShieldCheck,
  Check,
  Wifi,
  Layers
} from 'lucide-react';

export default function PropertyOnboardingWizard({
  isOpen,
  onClose,
  onCompleteOnboarding
}) {
  const [step, setStep] = useState(1);

  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (step > 1) {
          setStep(prev => prev - 1);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  // Step 1: Property Profile
  const [name, setName] = useState('Malabar Heritage Tourist Home');
  const [subtitle, setSubtitle] = useState('Heritage Plantation Stay & Eco Cottages • Wayanad');
  const [city, setCity] = useState('Sultan Bathery, Wayanad');
  const [propState, setPropState] = useState('Kerala');
  const [address, setAddress] = useState('NH-766, Forest Gate, Sultan Bathery, Wayanad - 673592');
  const [gstNumber, setGstNumber] = useState('32AABCM1122K1Z9');
  const [phone, setPhone] = useState('+91 4936 220 800');
  const [whatsapp, setWhatsapp] = useState('+919495000002');
  const [email, setEmail] = useState('stay@malabarheritage.com');
  const [wifiSSID, setWifiSSID] = useState('MalabarHeritage_Guest');

  // Step 2: Room Types & Tariffs
  const [roomTypes, setRoomTypes] = useState([
    { name: 'Heritage Suite', ac_rate: 3500, non_ac_rate: 2800, description: 'Wood-paneled master suite' },
    { name: 'Plantation Cottage', ac_rate: 2500, non_ac_rate: 1800, description: 'Eco cottage with valley view' }
  ]);

  // Step 3: Room Inventory
  const [rooms, setRooms] = useState([
    { room_number: '101', floor: 1, type_idx: 0 },
    { room_number: '102', floor: 1, type_idx: 0 },
    { room_number: '103', floor: 1, type_idx: 1 },
    { room_number: '104', floor: 1, type_idx: 1 },
    { room_number: '201', floor: 2, type_idx: 1 },
    { room_number: '202', floor: 2, type_idx: 1 },
    { room_number: '203', floor: 2, type_idx: 0 },
    { room_number: '204', floor: 2, type_idx: 0 }
  ]);

  // Step 4: Staff Invites
  const [staff, setStaff] = useState([
    { name: 'Praveen K.', phone: '+91 94470 12345', role: 'Receptionist' },
    { name: 'Sajeev (HK)', phone: '+91 98470 54321', role: 'Housekeeping' }
  ]);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleFinish = () => {
    onCompleteOnboarding({
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
      roomTypesList: roomTypes,
      roomsList: rooms,
      staffList: staff
    });
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        {/* Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 p-3 sm:p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between pt-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (step > 1) setStep(prev => prev - 1);
                else onClose();
              }}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title={step > 1 ? "Previous step" : "Close wizard"}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brass text-ink font-bold flex items-center justify-center shrink-0 hidden sm:flex">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                Property Setup Wizard
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Step {step} of 4 • Multi-Property Engine
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

        {/* Step Progress Tracker */}
        <div className="px-5 pt-3 bg-panel/50 border-b border-brass-soft/20 grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
          {[
            { num: 1, label: '1. Profile & GST' },
            { num: 2, label: '2. Rate Table' },
            { num: 3, label: '3. Rooms (8-20)' },
            { num: 4, label: '4. Staff Invites' }
          ].map(s => (
            <div
              key={s.num}
              className={`pb-2 border-b-2 font-bold transition-all ${
                step === s.num
                  ? 'border-brass text-brass'
                  : (step > s.num ? 'border-signal-green text-signal-green' : 'border-transparent text-slate-500')
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {isSuccess ? (
            <div className="p-8 text-center bg-ink rounded-xl border border-signal-green space-y-2">
              <CheckCircle2 className="w-12 h-12 text-signal-green mx-auto" />
              <h3 className="font-display font-bold text-xl text-white">
                {name} Onboarded Successfully!
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Switched active context to new property. Staff invited via WhatsApp/SMS.
              </p>
            </div>
          ) : (
            <>
              {/* STEP 1: PROPERTY PROFILE */}
              {step === 1 && (
                <div className="space-y-3 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">Hotel / Property Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">City & Destination *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block">Property Full Address *</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">GSTIN (32-Kerala) *</label>
                      <input
                        type="text"
                        required
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">Phone / Counter *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">Guest WiFi SSID</label>
                      <input
                        type="text"
                        value={wifiSSID}
                        onChange={(e) => setWifiSSID(e.target.value)}
                        className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ROOM TYPES & TARIFFS */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-mono text-brass uppercase font-bold">
                    Define Base Room Types & AC / Non-AC Rates
                  </div>

                  <div className="space-y-2">
                    {roomTypes.map((rt, i) => (
                      <div key={i} className="p-3 bg-ink rounded-xl border border-brass-soft/30 grid grid-cols-3 gap-3 items-center">
                        <div>
                          <label className="text-[9px] font-mono uppercase text-slate-400 block">Type Name</label>
                          <input
                            type="text"
                            value={rt.name}
                            onChange={(e) => {
                              const updated = [...roomTypes];
                              updated[i].name = e.target.value;
                              setRoomTypes(updated);
                            }}
                            className="w-full bg-panel border border-brass-soft/40 rounded px-2 py-1 text-white font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono uppercase text-slate-400 block">AC Rate (₹)</label>
                          <input
                            type="number"
                            value={rt.ac_rate}
                            onChange={(e) => {
                              const updated = [...roomTypes];
                              updated[i].ac_rate = Number(e.target.value);
                              setRoomTypes(updated);
                            }}
                            className="w-full bg-panel border border-brass-soft/40 rounded px-2 py-1 text-signal-green font-mono font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono uppercase text-slate-400 block">Non-AC Rate (₹)</label>
                          <input
                            type="number"
                            value={rt.non_ac_rate}
                            onChange={(e) => {
                              const updated = [...roomTypes];
                              updated[i].non_ac_rate = Number(e.target.value);
                              setRoomTypes(updated);
                            }}
                            className="w-full bg-panel border border-brass-soft/40 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setRoomTypes([...roomTypes, { name: 'Executive Room', ac_rate: 2200, non_ac_rate: 1600 }])}
                    className="py-1.5 px-3 rounded-lg bg-panel border border-brass-soft text-brass font-mono text-[11px] hover:border-brass flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Room Type</span>
                  </button>
                </div>
              )}

              {/* STEP 3: ROOM INVENTORY */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-brass uppercase font-bold">Configure Rooms ({rooms.length} Total Inventory)</span>
                    <button
                      onClick={() => setRooms([...rooms, { room_number: `${rooms.length + 101}`, floor: 2, type_idx: 0 }])}
                      className="px-2.5 py-1 rounded bg-brass text-ink font-bold text-[10px]"
                    >
                      Add Room
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 bg-ink rounded-xl border border-brass-soft/30">
                    {rooms.map((r, i) => (
                      <div key={i} className="p-2 bg-panel rounded-lg border border-brass-soft/30 text-center space-y-1">
                        <span className="font-display font-bold text-white text-base block">
                          {r.room_number}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400">
                          Floor {r.floor} • {roomTypes[r.type_idx]?.name || 'Standard'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: STAFF INVITES */}
              {step === 4 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-mono text-brass uppercase font-bold">
                    Invite Front Desk & Housekeeping Staff
                  </div>

                  <div className="space-y-2">
                    {staff.map((s, i) => (
                      <div key={i} className="p-3 bg-ink rounded-xl border border-brass-soft/30 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-white">{s.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{s.phone}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-brass/20 text-brass text-[10px] font-mono font-bold">
                          {s.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-panel rounded-lg border border-brass-soft/20 text-[11px] font-mono text-slate-300">
                    ✓ Instant onboarding SMS with unique login token sent on completion.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        {!isSuccess && (
          <div className="p-4 bg-panel border-t border-brass-soft/30 flex justify-between items-center">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="py-2 px-4 rounded-xl bg-panel-raised border border-brass-soft text-slate-300 font-mono text-xs hover:text-white flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-panel-raised border border-brass-soft text-slate-400 font-mono text-xs hover:text-white flex items-center gap-1.5 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="py-2 px-5 rounded-xl bg-brass text-ink font-bold text-xs hover:brightness-110 font-mono flex items-center gap-1.5 shadow-md shadow-brass/20"
              >
                <span>Continue Step {step + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="py-2 px-6 rounded-xl bg-signal-green text-ink font-bold text-xs hover:brightness-110 font-mono flex items-center gap-2 shadow-lg shadow-signal-green/20"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Complete Setup & Launch Hotel</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
