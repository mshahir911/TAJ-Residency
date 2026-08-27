import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Shield,
  FileText,
  Sparkles,
  ChevronRight,
  RefreshCw,
  XCircle,
  Key,
  Wifi,
  ArrowLeft
} from 'lucide-react';
import IdPhotoCaptureWidget from './IdPhotoCaptureWidget';
import { realtimeRelay } from '../services/realtimeRelay';

export default function PublicSelfCheckinPage({
  property,
  onAddSelfCheckin,
  onNavigateToStaffLogin
}) {
  const hotelName = property?.name || 'Taj Residency';
  const hotelAddress = property?.address || 'Beach Road, Mananchira, Kozhikode, Kerala';

  // Form inputs
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [frontPhotoUrl, setFrontPhotoUrl] = useState('');
  const [backPhotoUrl, setBackPhotoUrl] = useState('');
  const [groupSize, setGroupSize] = useState(1);
  const [bookingType, setBookingType] = useState('overnight'); // 'overnight' | 'day_use'
  const [durationHours, setDurationHours] = useState(2);
  const [eta, setEta] = useState('Immediate / Standing at Counter');
  const [specialRequests, setSpecialRequests] = useState('');

  // UI state: 'form' | 'submitted'
  const [stage, setStage] = useState('form');
  const [activeCheckinId, setActiveCheckinId] = useState(null);
  const [liveCheckinRecord, setLiveCheckinRecord] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore active submission from session storage if user refreshed
  useEffect(() => {
    try {
      const savedId = sessionStorage.getItem('taj_guest_active_self_checkin_id');
      const savedData = sessionStorage.getItem('taj_guest_active_self_checkin_record');
      if (savedId) {
        setActiveCheckinId(savedId);
        if (savedData) {
          setLiveCheckinRecord(JSON.parse(savedData));
        }
        setStage('submitted');
      }
    } catch (e) {}
  }, []);

  // Listen for realtime approval or status changes from receptionist
  useEffect(() => {
    if (!activeCheckinId) return;

    const handleMutation = (mutation) => {
      if (mutation.type === 'SELF_CHECKIN_STATUS_UPDATED' && mutation.selfCheckinId === activeCheckinId) {
        setLiveCheckinRecord(prev => {
          const updated = {
            ...(prev || {}),
            status: mutation.status,
            room_number: mutation.room_number || prev?.room_number,
            rejection_reason: mutation.rejection_reason || mutation.notes || prev?.rejection_reason
          };
          try {
            sessionStorage.setItem('taj_guest_active_self_checkin_record', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    };

    const unsubscribe = realtimeRelay.init(handleMutation, () => {});
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeCheckinId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!guestName.trim()) {
      setFormError('Please enter your full name as per Government ID.');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      setFormError('Please provide a valid 10-digit mobile phone number.');
      return;
    }
    if (!idNumber.trim()) {
      setFormError('Please enter your ID document number / reference.');
      return;
    }
    if (!frontPhotoUrl) {
      setFormError('Please take or upload a photo of your ID document (Front side).');
      return;
    }

    setIsSubmitting(true);

    const checkinPayload = {
      guest_name: guestName.trim(),
      phone: phone.trim(),
      address: address.trim() || 'Kozhikode, Kerala',
      id_proof_type: idType,
      id_proof_number: idNumber.trim().toUpperCase(),
      id_proof_photo_url: frontPhotoUrl,
      id_proof_back_photo_url: backPhotoUrl,
      group_size: Number(groupSize) || 1,
      booking_type: bookingType,
      duration_hours: bookingType === 'day_use' ? Number(durationHours) || 2 : null,
      eta,
      special_requests: specialRequests,
      digital_signature_captured: true
    };

    try {
      const createdRecord = onAddSelfCheckin(checkinPayload);
      setActiveCheckinId(createdRecord.id);
      setLiveCheckinRecord(createdRecord);
      try {
        sessionStorage.setItem('taj_guest_active_self_checkin_id', createdRecord.id);
        sessionStorage.setItem('taj_guest_active_self_checkin_record', JSON.stringify(createdRecord));
      } catch (e) {}
      setStage('submitted');
    } catch (err) {
      setFormError('An error occurred submitting your registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmission = () => {
    setStage('form');
  };

  const handleResetNewCheckin = () => {
    try {
      sessionStorage.removeItem('taj_guest_active_self_checkin_id');
      sessionStorage.removeItem('taj_guest_active_self_checkin_record');
    } catch (e) {}
    setActiveCheckinId(null);
    setLiveCheckinRecord(null);
    setGuestName('');
    setPhone('');
    setAddress('');
    setIdNumber('');
    setFrontPhotoUrl('');
    setBackPhotoUrl('');
    setStage('form');
  };

  return (
    <div className="min-h-screen bg-[#0A0D12] text-slate-200 font-sans flex flex-col selection:bg-[#C9A24B] selection:text-black">
      {/* Top Luxury Banner */}
      <header className="bg-[#11161D] border-b border-[#C9A24B]/30 px-4 py-3 sticky top-0 z-30 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A24B]/15 border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] font-serif font-bold text-sm">
              TR
            </div>
            <div>
              <h1 className="font-serif font-bold text-white text-sm tracking-wide uppercase">
                {hotelName}
              </h1>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-none">
                Express Digital Self Check-In
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Fast Desk Pass</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {stage === 'form' ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Welcome Greeting */}
            <div className="bg-[#141A23] p-4 rounded-2xl border border-[#C9A24B]/30 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#C9A24B]/10 text-[#C9A24B] shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-white text-base">
                    Welcome to Taj Residency
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Pre-fill your Government ID verification to skip reception paperwork and walk straight to your room keycard.
                  </p>
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Guest Personal Details */}
              <div className="bg-[#141A23] p-4 rounded-2xl border border-white/10 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C9A24B] uppercase tracking-wider font-mono">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Guest Information</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-mono uppercase text-slate-400 block font-semibold">
                    Full Name (As per Govt ID) <span className="text-[#C9A24B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Vivek Krishna Menon"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-[#0A0D12] border border-white/15 focus:border-[#C9A24B] rounded-xl px-3 py-2 text-white text-sm outline-none transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono uppercase text-slate-400 block font-semibold">
                      Mobile Phone Number <span className="text-[#C9A24B]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98470 12345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#0A0D12] border border-white/15 focus:border-[#C9A24B] rounded-xl pl-8 pr-3 py-2 text-white font-mono text-xs outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono uppercase text-slate-400 block font-semibold">
                      Total Guests (Pax)
                    </label>
                    <select
                      value={groupSize}
                      onChange={(e) => setGroupSize(Number(e.target.value))}
                      className="w-full bg-[#0A0D12] border border-white/15 focus:border-[#C9A24B] rounded-xl px-3 py-2 text-white text-xs outline-none transition-all"
                    >
                      <option value="1">1 Person (Solo Traveler)</option>
                      <option value="2">2 Persons (Couple / Twin)</option>
                      <option value="3">3 Persons (Triple Occupancy)</option>
                      <option value="4">4 Persons (Family Suite)</option>
                      <option value="6">6+ Persons (Group Stay)</option>
                      <option value="15">15+ Persons (Tour Bus / Delegation)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-mono uppercase text-slate-400 block font-semibold">
                    Permanent Address / City
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Bangalore, Karnataka / Cochin, Kerala"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#0A0D12] border border-white/15 focus:border-[#C9A24B] rounded-xl pl-8 pr-3 py-2 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Stay Type (Overnight Stay vs Fresh-Up) */}
              <div className="bg-[#141A23] p-4 rounded-2xl border border-white/10 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C9A24B] uppercase tracking-wider font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>2. Stay Duration & Type</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingType('overnight')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bookingType === 'overnight'
                        ? 'bg-[#C9A24B]/15 border-[#C9A24B] text-white shadow-md'
                        : 'bg-[#0A0D12] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">Overnight Stay</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">12:00 PM Noon Basis</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingType('day_use')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bookingType === 'day_use'
                        ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                        : 'bg-[#0A0D12] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-amber-300">
                      <span>⚡ Fresh-Up / Day Use</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Short hours to freshen up</div>
                  </button>
                </div>

                {bookingType === 'day_use' && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-300">Fresh-Up Duration:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setDurationHours(h)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            durationHours === h
                              ? 'bg-amber-400 text-black'
                              : 'bg-[#0A0D12] text-slate-400 border border-white/10'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Government ID Verification */}
              <div className="bg-[#141A23] p-4 rounded-2xl border border-white/10 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-[#C9A24B] uppercase tracking-wider font-mono">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    <span>3. Identity Verification</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-normal normal-case">
                    Sarais Act Compliant
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono uppercase text-slate-400 block font-semibold">
                      ID Document Type <span className="text-[#C9A24B]">*</span>
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full bg-[#0A0D12] border border-white/15 focus:border-[#C9A24B] rounded-xl px-3 py-2 text-white text-xs outline-none transition-all"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono uppercase text-slate-400 block font-semibold">
                      ID Document Number <span className="text-[#C9A24B]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1234 5678 9012"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full bg-[#0A0D12] border border-white/15 focus:border-[#C9A24B] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none transition-all uppercase placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Dual-Side ID Document Capture Component */}
                <div className="pt-2">
                  <IdPhotoCaptureWidget
                    frontPhotoUrl={frontPhotoUrl}
                    backPhotoUrl={backPhotoUrl}
                    idType={idType}
                    guestPhone={phone}
                    onChangeFront={(url) => setFrontPhotoUrl(url)}
                    onChangeBack={(url) => setBackPhotoUrl(url)}
                    compact={true}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#DFBF76] text-[#0B0F14] font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-[#C9A24B]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Submit Express Registration to Counter</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Live Verification / Approved State */
          <div className="space-y-5 animate-in fade-in duration-300 flex-1 flex flex-col justify-center">
            {liveCheckinRecord?.status === 'approved' ? (
              /* Approved: VIP Keycard Screen */
              <div className="bg-[#141A23] p-6 rounded-3xl border-2 border-emerald-500/50 shadow-2xl text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <Key className="w-8 h-8" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold inline-block">
                    ✓ CHECK-IN APPROVED
                  </span>
                  <h2 className="font-serif font-bold text-white text-2xl mt-3">
                    Welcome, {liveCheckinRecord?.guest_name}!
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Your registration has been verified by the reception desk.
                  </p>
                </div>

                <div className="bg-[#0A0D12] p-5 rounded-2xl border border-emerald-500/30 space-y-3">
                  <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                    Your Assigned Accommodation
                  </span>
                  <div className="text-4xl font-serif font-extrabold text-[#C9A24B] tracking-tight">
                    Room {liveCheckinRecord?.room_number || '202'}
                  </div>
                  <div className="text-xs text-slate-300 flex items-center justify-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Free High-Speed WiFi Activated</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300 leading-relaxed">
                  🏛️ Please show this screen to the reception desk staff to collect your physical electronic room keycard.
                </div>

                <button
                  type="button"
                  onClick={handleResetNewCheckin}
                  className="w-full py-2.5 rounded-xl bg-panel hover:bg-ink text-slate-400 hover:text-white border border-white/10 text-xs font-mono font-semibold transition-all"
                >
                  Start Another Guest Registration
                </button>
              </div>
            ) : liveCheckinRecord?.status === 'needs_info' || liveCheckinRecord?.status === 'rejected' ? (
              /* Needs Info or Rejected Screen */
              <div className="bg-[#141A23] p-6 rounded-3xl border-2 border-amber-500/50 shadow-2xl text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold inline-block">
                    {liveCheckinRecord?.status === 'rejected' ? 'REVISE REGISTRATION' : 'ATTENTION NEEDED'}
                  </span>
                  <h2 className="font-serif font-bold text-white text-xl mt-3">
                    Front Desk Note
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    The receptionist requested an update before confirming your room key.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A0D12] border border-amber-500/30 text-xs text-amber-200 leading-relaxed text-left space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400/80 block">
                    Message from Reception:
                  </span>
                  <p className="italic">
                    "{liveCheckinRecord?.rejection_reason || 'Please provide your physical ID document at the counter for manual verification.'}"
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleEditSubmission}
                    className="w-full py-3 rounded-xl bg-[#C9A24B] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#C9A24B]/20 flex items-center justify-center gap-2"
                  >
                    <span>Update ID Photo / Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetNewCheckin}
                    className="w-full py-2.5 rounded-xl bg-transparent text-slate-400 hover:text-white text-xs font-mono"
                  >
                    Cancel & Start New
                  </button>
                </div>
              </div>
            ) : (
              /* Pending Confirmation State */
              <div className="bg-[#141A23] p-6 rounded-3xl border border-[#C9A24B]/40 shadow-2xl text-center space-y-5">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#C9A24B]/20 animate-ping opacity-75"></div>
                  <div className="w-16 h-16 rounded-2xl bg-[#C9A24B]/20 border border-[#C9A24B]/40 text-[#C9A24B] flex items-center justify-center relative">
                    <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/30 text-xs font-mono font-bold inline-block">
                    VERIFICATION IN PROGRESS
                  </span>
                  <h2 className="font-serif font-bold text-white text-xl mt-3">
                    Registration Submitted
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                    Thank you, <strong className="text-white">{liveCheckinRecord?.guest_name || guestName}</strong>! Reception has received your details and is verifying your Government ID.
                  </p>
                </div>

                <div className="bg-[#0A0D12] p-4 rounded-2xl border border-white/10 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-500">Queue Reference:</span>
                    <span className="font-bold text-[#C9A24B]">{liveCheckinRecord?.id || activeCheckinId}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-500">Document:</span>
                    <span className="text-white">{idType} ({idNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>Awaiting Front Desk Approval</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-slate-400">
                  ⚡ This screen updates automatically as soon as the receptionist assigns your room.
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleEditSubmission}
                    className="text-xs font-mono text-slate-400 hover:text-white underline underline-offset-4"
                  >
                    Edit Submitted Details
                  </button>
                  <span className="text-slate-600">&bull;</span>
                  <button
                    type="button"
                    onClick={handleResetNewCheckin}
                    className="text-xs font-mono text-rose-400/80 hover:text-rose-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discreet Link for Hotel Staff to Access Reception PIN Login */}
        <div className="mt-8 text-center pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onNavigateToStaffLogin}
            className="text-[11px] text-slate-500 hover:text-slate-300 font-mono transition-colors cursor-pointer"
          >
            Hotel Staff? Access Reception Desk Terminal &rarr;
          </button>
        </div>
      </main>
    </div>
  );
}
