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
  ArrowLeft,
  QrCode,
  Smartphone,
  ExternalLink,
  Check,
  CreditCard,
  IndianRupee,
  Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import IdPhotoCaptureWidget from './IdPhotoCaptureWidget';
import { realtimeRelay } from '../services/realtimeRelay';

export default function PublicSelfCheckinPage({
  property,
  onAddSelfCheckin,
  onPaymentSubmitted,
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
  const [copiedUpi, setCopiedUpi] = useState(false);

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
            status: mutation.status || prev?.status,
            room_number: mutation.room_number || prev?.room_number,
            amount_due: mutation.amount_due !== undefined ? mutation.amount_due : prev?.amount_due,
            payment_status: mutation.payment_status || prev?.payment_status,
            upi_id: mutation.upi_id || prev?.upi_id,
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

  const handleGuestClaimPaid = () => {
    if (!activeCheckinId) return;
    const updated = {
      ...(liveCheckinRecord || {}),
      payment_status: 'payment_submitted'
    };
    setLiveCheckinRecord(updated);
    try {
      sessionStorage.setItem('taj_guest_active_self_checkin_record', JSON.stringify(updated));
    } catch (e) {}

    if (typeof onPaymentSubmitted === 'function') {
      onPaymentSubmitted(activeCheckinId);
    }
  };

  const handleCopyUpi = (vpa) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(vpa).then(() => {
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2000);
      });
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

  // Compute dynamic UPI parameters if approved
  const isApproved = liveCheckinRecord?.status === 'approved';
  const roomNumber = liveCheckinRecord?.room_number || '202';
  const amountDue = Number(liveCheckinRecord?.amount_due) || 1500;
  const ownerUpi = liveCheckinRecord?.upi_id || property?.upi_id || '';
  const paymentStatus = liveCheckinRecord?.payment_status || 'pending_upi_payment';
  const isPaid = paymentStatus === 'paid';
  const isPaymentSubmitted = paymentStatus === 'payment_submitted';

  // Dynamic UPI Deep Link URL
  const upiDeepLink = ownerUpi
    ? `upi://pay?pa=${encodeURIComponent(ownerUpi)}&pn=${encodeURIComponent(hotelName)}&am=${amountDue}&cu=INR&tn=${encodeURIComponent(`Room${roomNumber} ${hotelName}`)}`
    : '';

  return (
    <div
      className="public-self-checkin-view min-h-screen font-sans flex flex-col selection:bg-[#C9A24B] selection:text-black"
      style={{ backgroundColor: '#0A0D12', color: '#E2E8F0' }}
    >
      {/* Top Luxury Banner */}
      <header
        className="border-b px-4 py-3 sticky top-0 z-30 shadow-lg"
        style={{ backgroundColor: '#11161D', borderColor: 'rgba(201, 162, 75, 0.35)' }}
      >
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg border flex items-center justify-center font-serif font-bold text-sm"
              style={{ backgroundColor: 'rgba(201, 162, 75, 0.15)', borderColor: '#C9A24B', color: '#C9A24B' }}
            >
              TR
            </div>
            <div>
              <h1
                className="font-serif font-bold text-sm tracking-wide uppercase"
                style={{ color: '#FFFFFF' }}
              >
                {hotelName}
              </h1>
              <p
                className="text-[10px] font-mono truncate max-w-[200px] sm:max-w-none"
                style={{ color: '#94A3B8' }}
              >
                Express Digital Self Check-In
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold inline-flex items-center gap-1.5 border"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#34D399' }}
            >
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
            <div
              className="p-4 rounded-2xl border shadow-md"
              style={{ backgroundColor: '#141A23', borderColor: 'rgba(201, 162, 75, 0.35)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-xl shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(201, 162, 75, 0.15)', color: '#C9A24B' }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    className="font-serif font-bold text-base"
                    style={{ color: '#FFFFFF' }}
                  >
                    Welcome to Taj Residency
                  </h2>
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: '#CBD5E1' }}
                  >
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
              <div
                className="p-4 rounded-2xl border space-y-3 shadow-sm"
                style={{ backgroundColor: '#141A23', borderColor: 'rgba(255, 255, 255, 0.12)' }}
              >
                <div
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono"
                  style={{ color: '#C9A24B' }}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>1. Guest Information</span>
                </div>

                <div className="space-y-1">
                  <label
                    className="text-[10.5px] font-mono uppercase block font-semibold"
                    style={{ color: '#CBD5E1' }}
                  >
                    Full Name (As per Govt ID) <span style={{ color: '#C9A24B' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Vivek Krishna Menon"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all border"
                    style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      className="text-[10.5px] font-mono uppercase block font-semibold"
                      style={{ color: '#CBD5E1' }}
                    >
                      Mobile Phone Number <span style={{ color: '#C9A24B' }}>*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98470 12345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl pl-8 pr-3 py-2 font-mono text-xs outline-none transition-all border"
                        style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      className="text-[10.5px] font-mono uppercase block font-semibold"
                      style={{ color: '#CBD5E1' }}
                    >
                      Total Guests (Pax)
                    </label>
                    <select
                      value={groupSize}
                      onChange={(e) => setGroupSize(Number(e.target.value))}
                      className="w-full rounded-xl px-3 py-2 text-xs outline-none transition-all border"
                      style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
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
                  <label
                    className="text-[10.5px] font-mono uppercase block font-semibold"
                    style={{ color: '#CBD5E1' }}
                  >
                    Permanent Address / City
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Bangalore, Karnataka / Cochin, Kerala"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl pl-8 pr-3 py-2 text-xs outline-none transition-all border"
                      style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Stay Type (Overnight Stay vs Fresh-Up) */}
              <div
                className="p-4 rounded-2xl border space-y-3 shadow-sm"
                style={{ backgroundColor: '#141A23', borderColor: 'rgba(255, 255, 255, 0.12)' }}
              >
                <div
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono"
                  style={{ color: '#C9A24B' }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>2. Stay Duration & Type</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBookingType('overnight')}
                    className="p-3 rounded-xl border text-left transition-all cursor-pointer"
                    style={{
                      backgroundColor: bookingType === 'overnight' ? 'rgba(201, 162, 75, 0.15)' : '#0A0D12',
                      borderColor: bookingType === 'overnight' ? '#C9A24B' : 'rgba(255,255,255,0.12)'
                    }}
                  >
                    <div className="font-bold text-xs" style={{ color: '#FFFFFF' }}>Overnight Stay</div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: '#94A3B8' }}>12:00 PM Noon Basis</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingType('day_use')}
                    className="p-3 rounded-xl border text-left transition-all cursor-pointer"
                    style={{
                      backgroundColor: bookingType === 'day_use' ? 'rgba(245, 158, 11, 0.15)' : '#0A0D12',
                      borderColor: bookingType === 'day_use' ? '#F59E0B' : 'rgba(255,255,255,0.12)'
                    }}
                  >
                    <div className="font-bold text-xs flex items-center gap-1" style={{ color: '#FBBF24' }}>
                      <span>⚡ Fresh-Up / Day Use</span>
                    </div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: '#94A3B8' }}>Short hours to freshen up</div>
                  </button>
                </div>

                {bookingType === 'day_use' && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#CBD5E1' }}>Fresh-Up Duration:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setDurationHours(h)}
                          className="px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                          style={{
                            backgroundColor: durationHours === h ? '#F59E0B' : '#0A0D12',
                            color: durationHours === h ? '#0B0F14' : '#CBD5E1',
                            border: '1px solid rgba(255,255,255,0.15)'
                          }}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Government ID Verification */}
              <div
                className="p-4 rounded-2xl border space-y-3 shadow-sm"
                style={{ backgroundColor: '#141A23', borderColor: 'rgba(255, 255, 255, 0.12)' }}
              >
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider font-mono">
                  <div className="flex items-center gap-2" style={{ color: '#C9A24B' }}>
                    <Shield className="w-3.5 h-3.5" />
                    <span>3. Identity Verification</span>
                  </div>
                  <span className="text-[9px] font-normal normal-case" style={{ color: '#94A3B8' }}>
                    Sarais Act Compliant
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      className="text-[10.5px] font-mono uppercase block font-semibold"
                      style={{ color: '#CBD5E1' }}
                    >
                      ID Document Type <span style={{ color: '#C9A24B' }}>*</span>
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-xs outline-none transition-all border"
                      style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      className="text-[10.5px] font-mono uppercase block font-semibold"
                      style={{ color: '#CBD5E1' }}
                    >
                      ID Document Number <span style={{ color: '#C9A24B' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1234 5678 9012"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 font-mono text-xs outline-none transition-all uppercase border"
                      style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
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
            {isApproved ? (
              /* Approved: VIP Keycard & UPI Self-Payment Screen */
              <div
                className="p-5 sm:p-6 rounded-3xl border-2 shadow-2xl text-center space-y-4"
                style={{
                  backgroundColor: '#141A23',
                  borderColor: isPaid ? 'rgba(16, 185, 129, 0.5)' : 'rgba(201, 162, 75, 0.5)'
                }}
              >
                {/* Header Status Badge */}
                <div className="flex items-center justify-center">
                  {isPaid ? (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-mono font-bold inline-flex items-center gap-1.5 border"
                      style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#34D399' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ CHECK-IN & PAYMENT VERIFIED</span>
                    </span>
                  ) : (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-mono font-bold inline-flex items-center gap-1.5 border"
                      style={{ backgroundColor: 'rgba(201, 162, 75, 0.2)', borderColor: 'rgba(201, 162, 75, 0.35)', color: '#C9A24B' }}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>ROOM ASSIGNED • SETTLE BILL VIA UPI</span>
                    </span>
                  )}
                </div>

                <div>
                  <h2
                    className="font-serif font-bold text-2xl"
                    style={{ color: '#FFFFFF' }}
                  >
                    Welcome, {liveCheckinRecord?.guest_name || guestName}!
                  </h2>
                  <p
                    className="text-xs mt-1"
                    style={{ color: '#CBD5E1' }}
                  >
                    Your room has been assigned by {hotelName} Front Desk.
                  </p>
                </div>

                {/* Assigned Room & Bill Amount Showcase */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3.5 rounded-2xl border text-center space-y-1"
                    style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(201, 162, 75, 0.35)' }}
                  >
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider block font-semibold"
                      style={{ color: '#94A3B8' }}
                    >
                      Assigned Room
                    </span>
                    <div
                      className="text-3xl font-serif font-extrabold tracking-tight"
                      style={{ color: '#C9A24B' }}
                    >
                      Room {roomNumber}
                    </div>
                  </div>

                  <div
                    className="p-3.5 rounded-2xl border text-center space-y-1"
                    style={{
                      backgroundColor: '#0A0D12',
                      borderColor: isPaid ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'
                    }}
                  >
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider block font-semibold"
                      style={{ color: '#94A3B8' }}
                    >
                      {isPaid ? 'Amount Paid' : 'Total Tariff Due'}
                    </span>
                    <div
                      className="text-3xl font-serif font-extrabold tracking-tight"
                      style={{ color: isPaid ? '#34D399' : '#FBBF24' }}
                    >
                      ₹{amountDue}
                    </div>
                  </div>
                </div>

                {/* UPI Self-Payment Section (Active if not marked paid yet) */}
                {!isPaid ? (
                  <div
                    className="p-4 rounded-2xl border space-y-3.5 text-center"
                    style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(201, 162, 75, 0.35)' }}
                  >
                    {ownerUpi ? (
                      <>
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: '#C9A24B' }}>
                            <Smartphone className="w-4 h-4" />
                            <span>Instant UPI Self-Payment</span>
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: '#34D399' }}>
                            Zero Desk Wait
                          </span>
                        </div>

                        {/* Dynamic Freshly Generated QR Code */}
                        <div className="p-3 bg-white rounded-2xl inline-block shadow-lg border border-brass/40 mx-auto">
                          <QRCodeSVG
                            value={upiDeepLink}
                            size={160}
                            level="M"
                            includeMargin={false}
                          />
                        </div>

                        <div className="space-y-1 text-center">
                          <div className="font-mono text-xs font-bold text-white">
                            Scan with GPay / PhonePe / Paytm / Any UPI App
                          </div>
                          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono" style={{ color: '#CBD5E1' }}>
                            <span>Payee VPA:</span>
                            <strong className="text-brass select-all">{ownerUpi}</strong>
                            <button
                              type="button"
                              onClick={() => handleCopyUpi(ownerUpi)}
                              className="p-1 hover:text-white transition-colors"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Direct Pay Deep Link Button */}
                        <a
                          href={upiDeepLink}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#DFBF76] text-[#0B0F14] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer block"
                        >
                          <CreditCard className="w-4 h-4 stroke-[2.5]" />
                          <span>Pay ₹{amountDue} via UPI App (GPay / PhonePe / Paytm)</span>
                        </a>

                        {/* I Have Paid Confirmation Button */}
                        {isPaymentSubmitted ? (
                          <div
                            className="p-3 rounded-xl border text-xs font-mono space-y-1 text-center"
                            style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#FDE68A' }}
                          >
                            <div className="font-bold flex items-center justify-center gap-1.5 text-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>Payment Submitted to Desk</span>
                            </div>
                            <p className="text-[10.5px] text-slate-300">
                              Waiting for front desk receptionist to verify in their UPI app and issue keycard pass...
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleGuestClaimPaid}
                            className="w-full py-2.5 rounded-xl border text-xs font-mono font-semibold transition-all hover:bg-panel cursor-pointer"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: '#CBD5E1' }}
                          >
                            ⚡ I have completed this UPI payment &rarr;
                          </button>
                        )}
                      </>
                    ) : (
                      /* If Owner UPI is not configured yet */
                      <div className="space-y-2 py-2">
                        <div className="text-xs font-bold" style={{ color: '#FFFFFF' }}>
                          Settlement at Reception Desk
                        </div>
                        <p className="text-xs text-slate-400">
                          Please settle ₹{amountDue} at the counter via Cash, UPI QR stand, or Card.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Paid Confirmation Stamp & Keycard Pickup */
                  <div
                    className="p-4 rounded-2xl border text-center space-y-2.5"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Payment of ₹{amountDue} Confirmed by Desk</span>
                    </div>
                    <p className="text-xs" style={{ color: '#CBD5E1' }}>
                      Your digital payment has been verified. Free high-speed WiFi is activated.
                    </p>
                    <div
                      className="text-xs flex items-center justify-center gap-2 font-medium pt-1"
                      style={{ color: '#34D399' }}
                    >
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Network: {property?.wifiSSID || 'TajResidency_Guest'}</span>
                    </div>
                  </div>
                )}

                <div
                  className="p-3 rounded-xl border text-xs leading-relaxed"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#E2E8F0' }}
                >
                  🏛️ Please show this screen at the front desk counter to collect your electronic keycard for <strong>Room {roomNumber}</strong>.
                </div>

                <button
                  type="button"
                  onClick={handleResetNewCheckin}
                  className="w-full py-2.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer"
                  style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(255,255,255,0.15)', color: '#CBD5E1' }}
                >
                  Start Another Guest Registration
                </button>
              </div>
            ) : liveCheckinRecord?.status === 'needs_info' || liveCheckinRecord?.status === 'rejected' ? (
              /* Needs Info or Rejected Screen */
              <div
                className="p-6 rounded-3xl border-2 shadow-2xl text-center space-y-5"
                style={{ backgroundColor: '#141A23', borderColor: 'rgba(245, 158, 11, 0.5)' }}
              >
                <div
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B' }}
                >
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-mono font-bold inline-block border"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#FBBF24' }}
                  >
                    {liveCheckinRecord?.status === 'rejected' ? 'REVISE REGISTRATION' : 'ATTENTION NEEDED'}
                  </span>
                  <h2
                    className="font-serif font-bold text-xl mt-3"
                    style={{ color: '#FFFFFF' }}
                  >
                    Front Desk Note
                  </h2>
                  <p
                    className="text-xs mt-1"
                    style={{ color: '#CBD5E1' }}
                  >
                    The receptionist requested an update before confirming your room key.
                  </p>
                </div>

                <div
                  className="p-4 rounded-2xl border text-xs leading-relaxed text-left space-y-1"
                  style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#FDE68A' }}
                >
                  <span
                    className="text-[10px] uppercase font-mono font-bold block"
                    style={{ color: '#F59E0B' }}
                  >
                    Message from Reception:
                  </span>
                  <p className="italic font-medium">
                    "{liveCheckinRecord?.rejection_reason || 'Please provide your physical ID document at the counter for manual verification.'}"
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleEditSubmission}
                    className="w-full py-3 rounded-xl bg-[#C9A24B] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#C9A24B]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Update ID Photo / Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetNewCheckin}
                    className="w-full py-2.5 rounded-xl bg-transparent text-xs font-mono cursor-pointer"
                    style={{ color: '#94A3B8' }}
                  >
                    Cancel & Start New
                  </button>
                </div>
              </div>
            ) : (
              /* Pending Confirmation State */
              <div
                className="p-6 rounded-3xl border shadow-2xl text-center space-y-5"
                style={{ backgroundColor: '#141A23', borderColor: 'rgba(201, 162, 75, 0.45)' }}
              >
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: 'rgba(201, 162, 75, 0.25)' }}
                  ></div>
                  <div
                    className="w-16 h-16 rounded-2xl border flex items-center justify-center relative"
                    style={{ backgroundColor: 'rgba(201, 162, 75, 0.2)', borderColor: 'rgba(201, 162, 75, 0.4)', color: '#C9A24B' }}
                  >
                    <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                </div>

                <div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-mono font-bold inline-block border"
                    style={{ backgroundColor: 'rgba(201, 162, 75, 0.2)', borderColor: 'rgba(201, 162, 75, 0.35)', color: '#C9A24B' }}
                  >
                    VERIFICATION IN PROGRESS
                  </span>
                  <h2
                    className="font-serif font-bold text-2xl mt-3"
                    style={{ color: '#FFFFFF' }}
                  >
                    Registration Submitted
                  </h2>
                  <p
                    className="text-xs mt-1.5 max-w-sm mx-auto leading-relaxed"
                    style={{ color: '#CBD5E1' }}
                  >
                    Thank you, <strong style={{ color: '#FFFFFF' }}>{liveCheckinRecord?.guest_name || guestName}</strong>! Reception has received your details and is verifying your Government ID.
                  </p>
                </div>

                <div
                  className="p-4 rounded-2xl border text-left text-xs space-y-2.5 font-mono"
                  style={{ backgroundColor: '#0A0D12', borderColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span style={{ color: '#94A3B8' }}>Queue Reference:</span>
                    <span className="font-bold" style={{ color: '#C9A24B' }}>{liveCheckinRecord?.id || activeCheckinId}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span style={{ color: '#94A3B8' }}>Document:</span>
                    <span className="font-semibold" style={{ color: '#FFFFFF' }}>{idType} ({idNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#94A3B8' }}>Status:</span>
                    <span className="font-semibold flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>Awaiting Front Desk Approval</span>
                    </span>
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl border text-[11px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1' }}
                >
                  ⚡ This screen updates automatically as soon as the receptionist assigns your room & rate.
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleEditSubmission}
                    className="text-xs font-mono underline underline-offset-4 cursor-pointer"
                    style={{ color: '#CBD5E1' }}
                  >
                    Edit Submitted Details
                  </button>
                  <span style={{ color: '#64748B' }}>&bull;</span>
                  <button
                    type="button"
                    onClick={handleResetNewCheckin}
                    className="text-xs font-mono cursor-pointer"
                    style={{ color: '#F87171' }}
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
            className="text-[11px] font-mono transition-colors cursor-pointer"
            style={{ color: '#94A3B8' }}
          >
            Hotel Staff? Access Reception Desk Terminal &rarr;
          </button>
        </div>
      </main>
    </div>
  );
}
