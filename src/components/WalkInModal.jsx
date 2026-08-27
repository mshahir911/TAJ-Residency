import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  CreditCard,
  Percent,
  Calendar,
  Phone,
  FileText,
  Sparkles,
  Wind,
  Fan,
  Check,
  Building2,
  Camera,
  Search,
  Clock,
  Plus,
  Minus,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  User,
  Coins,
  ChevronDown,
  ChevronUp,
  UserPlus,
  CheckCircle2,
  Key,
  BadgeCheck,
  Zap,
  Users,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOM_TYPES, DEFAULT_GST_CONFIG, DEFAULT_FRESH_UP_TIERS, getFreshUpRatePerPerson } from '../types/data';
import { formatCurrency } from '../utils/formatters';
import { formatDeadlineDisplay } from '../utils/billing';
import IdPhotoCaptureWidget from './IdPhotoCaptureWidget';

export default function WalkInModal({
  isOpen,
  onClose,
  rooms = [],
  guests = [],
  bookings = {},
  selectedRoom: propSelectedRoom,
  preselectedRoom,
  preselectedGuest = null,
  preselectedReservation = null,
  freshUpTiers = DEFAULT_FRESH_UP_TIERS,
  onSaveBooking,
  onCheckInReservation,
  onSubmit,
  onLookupPhone,
  onFindGuestByPhone,
  getRateForRoom,
  calculateGST,
  onCalculateGST,
  onViewIdPhoto
}) {
  const vacantRooms = rooms.filter(r => r.status === 'vacant' || r.status === 'ready' || r.status === 'reserved');
  const targetInitial = propSelectedRoom || preselectedRoom || vacantRooms[0] || rooms[0] || { id: 'room-202', room_number: '202', room_type_id: 'classic' };

  const [roomId, setRoomId] = useState(targetInitial?.id || '');
  const [selectedRoomIds, setSelectedRoomIds] = useState(() => [targetInitial?.id || 'room-202']);
  const selectedRoom = rooms.find(r => r.id === (selectedRoomIds[0] || roomId)) || targetInitial;
  const roomType = (ROOM_TYPES && ROOM_TYPES[selectedRoom?.room_type_id]) || ROOM_TYPES?.deluxe || { name: 'Standard Room', ac_rate: 2000, non_ac_rate: 1500 };

  // Keep synced if preselected room changes
  useEffect(() => {
    if (propSelectedRoom?.id) {
      setRoomId(propSelectedRoom.id);
      setSelectedRoomIds([propSelectedRoom.id]);
    } else if (preselectedRoom?.id) {
      setRoomId(preselectedRoom.id);
      setSelectedRoomIds([preselectedRoom.id]);
    }
  }, [propSelectedRoom, preselectedRoom]);

  // Multi-room assignment handlers for fresh-up groups
  const handleToggleRoom = (rId) => {
    setSelectedRoomIds(prev => {
      if (prev.includes(rId)) {
        if (prev.length <= 1) return prev; // Always keep at least 1 room
        return prev.filter(id => id !== rId);
      } else {
        return [...prev, rId];
      }
    });
    setRoomId(rId);
  };

  const handleQuickAssignRoomCount = (count) => {
    const available = vacantRooms.slice(0, count).map(r => r.id);
    if (available.length > 0) {
      setSelectedRoomIds(available);
      setRoomId(available[0]);
    }
  };

  // 1. Advance Reservation Detection
  // Check if room or preselected booking has an active advance reservation
  const activeReservation = preselectedReservation || Object.values(bookings || {}).find(b =>
    b.room_id === (selectedRoom?.id || roomId) && (b.status === 'confirmed' || selectedRoom?.status === 'reserved')
  ) || null;

  const isReservationArrival = Boolean(activeReservation);

  // Matched reservation guest
  const resGuest = preselectedGuest || (activeReservation ? guests.find(g => 
    g.id === activeReservation.guest_id || 
    (g.phone && activeReservation.guest_phone && g.phone.replace(/[^0-9]/g, '').slice(-10) === activeReservation.guest_phone.replace(/[^0-9]/g, '').slice(-10))
  ) : null);

  // Booking details & Climate
  const [bookingType, setBookingType] = useState('overnight'); // 'overnight' | 'day_use'
  const [freshUpHours, setFreshUpHours] = useState(2);
  const [isCustomHours, setIsCustomHours] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [isCustomGroup, setIsCustomGroup] = useState(false);
  const [freshUpDiscountType, setFreshUpDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [freshUpDiscountValue, setFreshUpDiscountValue] = useState(0);
  const [freshUpDiscountReason, setFreshUpDiscountReason] = useState('');

  const [acOrNonAc, setAcOrNonAc] = useState(activeReservation?.ac_or_non_ac || 'AC');
  const [isPreBooking, setIsPreBooking] = useState(false);

  // Day-based duration selection
  const [stayDays, setStayDays] = useState(activeReservation?.nights || 1);
  const [isCustomDays, setIsCustomDays] = useState(false);

  const [advancePaid, setAdvancePaid] = useState(activeReservation?.advance_paid || 1000);
  const [additionalAdvance, setAdditionalAdvance] = useState(0);
  const [paymentMode, setPaymentMode] = useState(activeReservation?.payment_mode || 'Cash');

  // Guest details
  const [phone, setPhone] = useState(resGuest?.phone || preselectedGuest?.phone || activeReservation?.guest_phone || '');
  const [name, setName] = useState(resGuest?.name || preselectedGuest?.name || activeReservation?.guest_name || '');
  const [address, setAddress] = useState(resGuest?.address || preselectedGuest?.address || activeReservation?.guest_address || '');
  const [idType, setIdType] = useState(resGuest?.id_proof_type || preselectedGuest?.id_proof_type || 'Aadhaar Card');
  const [idNumber, setIdNumber] = useState(resGuest?.id_proof_number || preselectedGuest?.id_proof_number || '');
  const [idPhotoUrl, setIdPhotoUrl] = useState(resGuest?.id_proof_photo_url || preselectedGuest?.id_proof_photo_url || '');
  const [idPhotoBackUrl, setIdPhotoBackUrl] = useState(resGuest?.id_proof_back_photo_url || preselectedGuest?.id_proof_back_photo_url || '');
  const [notes, setNotes] = useState(activeReservation?.notes || preselectedGuest?.notes || '');
  const [returningGuestFound, setReturningGuestFound] = useState(resGuest || preselectedGuest || null);
  const [searchGuestInput, setSearchGuestInput] = useState('');
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isAllInOne, setIsAllInOne] = useState(false);

  // Synchronize when activeReservation or resGuest changes
  useEffect(() => {
    if (activeReservation) {
      if (activeReservation.ac_or_non_ac) setAcOrNonAc(activeReservation.ac_or_non_ac);
      if (activeReservation.nights) setStayDays(activeReservation.nights);
      if (activeReservation.advance_paid) setAdvancePaid(activeReservation.advance_paid);
      if (activeReservation.payment_mode) setPaymentMode(activeReservation.payment_mode);
      if (resGuest) {
        setReturningGuestFound(resGuest);
        setName(resGuest.name || activeReservation.guest_name || '');
        setPhone(resGuest.phone || activeReservation.guest_phone || '');
        setAddress(resGuest.address || activeReservation.guest_address || '');
        setIdType(resGuest.id_proof_type || 'Aadhaar Card');
        setIdNumber(resGuest.id_proof_number || '');
        setIdPhotoUrl(resGuest.id_proof_photo_url || '');
        setIdPhotoBackUrl(resGuest.id_proof_back_photo_url || '');
      } else if (activeReservation.guest_name) {
        setName(activeReservation.guest_name);
        setPhone(activeReservation.guest_phone || '');
      }
    }
  }, [activeReservation, resGuest]);

  const phoneLookup = onLookupPhone || onFindGuestByPhone;

  // Has Permanent Government ID on file
  const hasVerifiedId = Boolean(
    idPhotoUrl ||
    idNumber ||
    resGuest?.id_proof_photo_url ||
    resGuest?.id_proof_number ||
    returningGuestFound?.id_proof_photo_url ||
    returningGuestFound?.id_proof_number
  );

  const isFastTrack = Boolean(returningGuestFound) && !isReservationArrival;

  // Dynamic step structure based on arrival mode:
  // 1. Advance Reservation Arrival:
  //    - If ID verified on file: EXACTLY 1 STEP (Arrival & Keycard Allocation)
  //    - If ID not yet verified: 2 STEPS (Step 1: ID Capture ➔ Step 2: Arrival & Payment)
  // 2. Returning Guest Walk-In:
  //    - 2 STEPS (Step 1: Room & Duration ➔ Step 2: Payment & Keys)
  // 3. New Guest Walk-In:
  //    - 4 STEPS (Room ➔ Info ➔ ID Capture ➔ Payment)
  let stepsList = [];
  if (isReservationArrival) {
    if (hasVerifiedId) {
      stepsList = [{ num: 1, label: 'Arrival & Keycards', icon: Coins }];
    } else {
      stepsList = [
        { num: 1, label: 'ID Verification', icon: Camera },
        { num: 2, label: 'Arrival & Keycards', icon: Coins }
      ];
    }
  } else if (isFastTrack) {
    stepsList = [
      { num: 1, label: 'Stay & Room', icon: Calendar },
      { num: 2, label: 'Payment & Keys', icon: Coins }
    ];
  } else {
    stepsList = [
      { num: 1, label: 'Stay & Room', icon: Calendar },
      { num: 2, label: 'Guest Info', icon: User },
      { num: 3, label: 'ID Capture', icon: Camera },
      { num: 4, label: 'Payment & Keys', icon: Coins }
    ];
  }

  const totalSteps = stepsList.length;

  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (step > 1 && !isAllInOne) {
          handlePrevStep();
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, isAllInOne, onClose]);

  // Handle guest data selection
  const applyGuestData = (guest) => {
    if (!guest) return;
    setReturningGuestFound(guest);
    setName(guest.name || '');
    setPhone(guest.phone || '');
    setAddress(guest.address || '');
    setIdType(guest.id_proof_type || 'Aadhaar Card');
    setIdNumber(guest.id_proof_number || '');
    setIdPhotoUrl(guest.id_proof_photo_url || '');
    setIdPhotoBackUrl(guest.id_proof_back_photo_url || '');
    setNotes(guest.notes || 'Returning guest');
  };

  const handleClearReturningGuest = () => {
    setReturningGuestFound(null);
    setName('');
    setPhone('');
    setAddress('');
    setIdNumber('');
    setIdPhotoUrl('');
    setIdPhotoBackUrl('');
    setSearchGuestInput('');
    setStep(1);
  };

  // Phone lookup effect
  useEffect(() => {
    if (phone && phone.length >= 8 && typeof phoneLookup === 'function' && !isReservationArrival) {
      const match = phoneLookup(phone);
      if (match) {
        applyGuestData(match);
      }
    }
  }, [phone, phoneLookup, isReservationArrival]);

  // Live Rate Calculation
  const rateResult = typeof getRateForRoom === 'function' 
    ? getRateForRoom(selectedRoom?.room_type_id, acOrNonAc) 
    : (acOrNonAc === 'AC' ? roomType.ac_rate : roomType.non_ac_rate);
    
  const nightlyRate = activeReservation?.rate_applied || (typeof rateResult === 'object' && rateResult !== null 
    ? (rateResult.rate || 2000) 
    : (Number(rateResult) || 2000));

  const totalNights = Math.max(1, Number(stayDays) || 1);

  // Fresh-Up Rate Calculation
  const isDayUse = bookingType === 'day_use';
  const effectiveGroupSize = Math.max(1, Number(groupSize) || 1);
  const perPersonRate = getFreshUpRatePerPerson(effectiveGroupSize, freshUpTiers);
  const grossFreshUpTotal = perPersonRate * effectiveGroupSize;

  let freshUpDiscountAmount = 0;
  if (freshUpDiscountType === 'percent') {
    freshUpDiscountAmount = Math.round((grossFreshUpTotal * (Number(freshUpDiscountValue) || 0)) / 100);
  } else {
    freshUpDiscountAmount = Math.min(grossFreshUpTotal, Math.max(0, Number(freshUpDiscountValue) || 0));
  }
  const taxableFreshUpTotal = Math.max(0, grossFreshUpTotal - freshUpDiscountAmount);

  // Auto-align default advance paid with calculated daily tariff for new walk-ins
  useEffect(() => {
    if (!isReservationArrival) {
      if (isDayUse) {
        setAdvancePaid(taxableFreshUpTotal);
      } else if (nightlyRate > 0) {
        setAdvancePaid(nightlyRate * totalNights);
      }
    }
  }, [nightlyRate, isReservationArrival, isDayUse, taxableFreshUpTotal, totalNights]);

  // GST Calculation
  const gstFn = calculateGST || onCalculateGST;
  const gstCalc = isDayUse
    ? {
        taxableRoomCharge: taxableFreshUpTotal,
        gstRate: taxableFreshUpTotal >= 2500 ? 12 : 0,
        cgstRate: taxableFreshUpTotal >= 2500 ? 6 : 0,
        sgstRate: taxableFreshUpTotal >= 2500 ? 6 : 0,
        gstAmount: taxableFreshUpTotal >= 2500 ? Math.round(taxableFreshUpTotal * 0.12) : 0,
        grandTotal: taxableFreshUpTotal >= 2500 ? Math.round(taxableFreshUpTotal * 1.12) : taxableFreshUpTotal
      }
    : (typeof gstFn === 'function'
        ? gstFn(nightlyRate, totalNights)
        : {
            taxableRoomCharge: nightlyRate * totalNights,
            gstRate: nightlyRate >= 2500 ? 12 : 0,
            cgstRate: nightlyRate >= 2500 ? 6 : 0,
            sgstRate: nightlyRate >= 2500 ? 6 : 0,
            gstAmount: nightlyRate >= 2500 ? Math.round(nightlyRate * totalNights * 0.12) : 0,
            grandTotal: nightlyRate >= 2500 ? Math.round(nightlyRate * totalNights * 1.12) : nightlyRate * totalNights
          });

  const validateStep = (currentStep) => {
    if (isReservationArrival) {
      if (!hasVerifiedId && currentStep === 1) {
        // ID capture step
        if (!idNumber && !idPhotoUrl) {
          alert('Please enter or capture guest ID proof for security compliance');
          return false;
        }
      }
      return true;
    }

    if (isFastTrack) {
      if (currentStep === 1 && !roomId) {
        alert('Please select a room for check-in');
        return false;
      }
      return true;
    }

    if (currentStep === 1 && !roomId) {
      alert('Please select a room for check-in');
      return false;
    } else if (currentStep === 2) {
      if (!phone || phone.trim().length < 8) {
        alert('Please enter a valid guest mobile number');
        return false;
      }
      if (!name || name.trim().length < 2) {
        alert('Please enter the guest full name');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = (e) => {
    e?.preventDefault();
    if (validateStep(step)) {
      setStep(prev => Math.min(totalSteps, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!name || !phone) {
      alert('Please fill guest name and mobile number');
      return;
    }

    try {
      confetti({
        particleCount: 50,
        spread: 65,
        colors: ['#C9A24B', '#3FCF8E', '#FFFFFF']
      });
    } catch (err) {}

    // Case 1: Advance Reservation Arrival Check-In
    if (isReservationArrival && activeReservation) {
      if (typeof onCheckInReservation === 'function') {
        onCheckInReservation(activeReservation.id, {
          additionalAdvance: Number(additionalAdvance || 0),
          paymentMode,
          guestIdPhotoUrl: idPhotoUrl,
          guestIdBackPhotoUrl: idPhotoBackUrl,
          guestIdType: idType,
          guestIdNumber: idNumber,
          guestAddress: address,
          acOrNonAc
        });
      }
      onClose();
      return;
    }

    // Case 2: Standard Walk-In or Pre-Booking (Hotel Standard Noon 12:00 PM Deadline or Fresh-Up Hours)
    const now = new Date();
    const checkInStr = now.toISOString().replace('T', ' ').slice(0, 16);
    let checkOutStr = '';

    if (isDayUse) {
      const checkOutDateObj = new Date(now.getTime() + freshUpHours * 60 * 60 * 1000);
      checkOutStr = checkOutDateObj.toISOString().replace('T', ' ').slice(0, 16);
    } else {
      const checkOutDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() + totalNights, 12, 0, 0);
      checkOutStr = `${checkOutDateObj.toLocaleDateString('en-CA')} 12:00`;
    }

    const saveFn = onSaveBooking || onSubmit;
    const finalRoomIds = isDayUse && selectedRoomIds.length > 0 ? selectedRoomIds : [selectedRoom?.id || roomId];
    if (typeof saveFn === 'function') {
      saveFn({
        roomId: finalRoomIds[0],
        assignedRoomIds: finalRoomIds,
        guestName: name,
        guestPhone: phone,
        guestAddress: address,
        guestIdType: idType,
        guestIdNumber: idNumber || 'VERIFIED-DESK',
        guestIdPhotoUrl: idPhotoUrl,
        guestIdBackPhotoUrl: idPhotoBackUrl,
        guestNotes: notes,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        nights: isDayUse ? 0 : totalNights,
        acOrNonAc,
        advancePaid: Number(advancePaid || 0),
        paymentMode,
        isPreBooking,
        bookingType,
        durationHours: isDayUse ? freshUpHours : (totalNights * 24),
        groupSize: isDayUse ? effectiveGroupSize : 1,
        freshUpDiscountAmount,
        freshUpDiscountReason,
        customRateApplied: isDayUse ? taxableFreshUpTotal : null
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        
        {/* Modal Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3.5 bg-panel border-b border-brass-soft/30 flex items-center justify-between modal-header-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (step > 1 && !isAllInOne) {
                  handlePrevStep();
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title={step > 1 && !isAllInOne ? "Go back to previous step" : "Close modal"}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="text-xs">{step > 1 && !isAllInOne ? 'Back' : 'Close'}</span>
            </button>

            <div className="w-8 h-8 rounded-lg bg-brass text-ink font-bold flex items-center justify-center font-display text-base shadow-md shadow-brass/20 shrink-0 hidden sm:flex">
              {isReservationArrival ? 'AR' : 'TR'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-display font-bold text-white text-base sm:text-lg leading-tight truncate">
                  {isReservationArrival
                    ? `🛎️ Arrival Check-In: Room ${selectedRoom?.room_number}`
                    : (isPreBooking ? 'Advance Reservation' : (isFastTrack ? '⚡ Express Walk-In' : 'Walk-In Check-In'))}
                </h2>
                {isReservationArrival && (
                  <span className="px-1.5 py-0.5 rounded bg-signal-amber text-ink text-[9px] font-mono font-bold shrink-0">
                    PRE-BOOKED
                  </span>
                )}
                {isFastTrack && !isReservationArrival && (
                  <span className="px-1.5 py-0.5 rounded bg-signal-green/20 text-signal-green text-[9px] font-mono font-bold border border-signal-green/30 shrink-0">
                    RETURNING GUEST
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Room {selectedRoom?.room_number || '202'} &bull; {totalSteps === 1 ? 'Instant Keycard Allocation' : `Step ${step} of ${totalSteps}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isReservationArrival && (
              <div className="bg-ink p-0.5 sm:p-1 rounded-lg border border-brass-soft/40 flex text-[10px] font-mono shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPreBooking(false)}
                  className={`px-2 sm:px-2.5 py-1 rounded transition-all font-bold ${
                    !isPreBooking ? 'bg-brass text-ink shadow' : 'text-slate-400'
                  }`}
                >
                  Walk-In
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreBooking(true)}
                  className={`px-2 sm:px-2.5 py-1 rounded transition-all font-bold ${
                    isPreBooking ? 'bg-signal-amber text-ink shadow' : 'text-slate-400'
                  }`}
                >
                  Advance
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 transition-colors shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Indicator Header */}
        {!isAllInOne && totalSteps > 1 && (
          <div className="shrink-0 bg-ink/80 border-b border-brass-soft/20 px-3 sm:px-4 py-2 flex items-center justify-between text-xs font-mono select-none overflow-x-auto">
            {stepsList.map((s, idx) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.num < step || validateStep(step)) {
                        setStep(s.num);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all shrink-0 ${
                      isActive
                        ? 'bg-brass text-ink font-bold shadow-sm'
                        : isPast
                        ? 'text-signal-green hover:bg-panel'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-ink text-brass' : (isPast ? 'bg-signal-green/20 text-signal-green' : 'bg-panel-raised text-slate-400')
                    }`}>
                      {isPast ? '✓' : s.num}
                    </span>
                    <span className="text-[11px]">{s.label}</span>
                  </button>
                  {idx < stepsList.length - 1 && (
                    <span className="text-slate-600 px-1">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Form Container */}
        <form
          id="walkin-booking-form"
          onSubmit={step === totalSteps || isAllInOne ? handleSubmit : handleNextStep}
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-5 space-y-4 text-xs">
          
            {/* SPECIAL CASE A: ADVANCE RESERVATION ARRIVAL CHECK-IN */}
            {isReservationArrival && (
              <div className="space-y-4 animate-in fade-in">
                {/* Highlighted Reservation Banner */}
                <div className="p-4 bg-signal-amber/10 border-2 border-signal-amber/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-signal-amber text-ink font-bold font-display flex items-center justify-center text-sm shadow-md">
                        {name ? name.slice(0, 2).toUpperCase() : 'AR'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm sm:text-base">{name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-signal-amber text-ink font-mono font-bold text-[9px]">
                            RESERVED ROOM {selectedRoom?.room_number}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-signal-amber mt-0.5">
                          📞 {phone} &bull; {address || 'Address on file'}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-signal-green hidden sm:inline">
                      {hasVerifiedId ? '✓ ID Verified' : '⚠️ ID Photo Needed'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-signal-amber/20 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-400 text-[10px] block">CLIMATE & DURATION:</span>
                      <span className="text-white font-bold">{acOrNonAc} &bull; {totalNights} {totalNights === 1 ? 'Day' : 'Days'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">ADVANCE ON FILE:</span>
                      <span className="text-signal-green font-bold">{formatCurrency(advancePaid)} ({paymentMode})</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 text-[10px] block">GOVERNMENT ID:</span>
                      <span className="text-brass font-bold truncate block">
                        {hasVerifiedId ? `${idType} (${idNumber || 'Verified'})` : 'Please scan below'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-step 1 for Reservation: ID Capture if missing */}
                {(!hasVerifiedId && step === 1) && (
                  <div className="p-4 bg-ink rounded-xl border border-brass-soft/40 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-brass text-[11px] font-mono font-bold">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-brass" />
                        <span>Fast Government ID Scan (Police Records)</span>
                      </span>
                      <span className="text-slate-400 font-sans text-[10px]">Name & Phone are already linked</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ID Document Type</label>
                        <select
                          value={idType}
                          onChange={(e) => setIdType(e.target.value)}
                          className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs"
                        >
                          <option>Aadhaar Card</option>
                          <option>Driving License</option>
                          <option>Passport</option>
                          <option>Voter ID</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ID Document Number</label>
                        <input
                          type="text"
                          placeholder="e.g. XXXX-XXXX-4812"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <IdPhotoCaptureWidget
                      frontPhotoUrl={idPhotoUrl}
                      backPhotoUrl={idPhotoBackUrl}
                      idType={idType}
                      guestPhone={phone}
                      onChangeFront={(url) => setIdPhotoUrl(url)}
                      onChangeBack={(url) => setIdPhotoBackUrl(url)}
                    />
                  </div>
                )}

                {/* Sub-step 2 for Reservation: Payment Confirmation & Keys */}
                {(hasVerifiedId || step === 2) && (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Stay Tariff & Balance Calculation */}
                    <div className="bg-ink p-4 rounded-xl border border-brass-soft/40 space-y-3 font-mono">
                      <div className="flex items-center justify-between text-brass text-[11px] uppercase font-bold border-b border-brass-soft/20 pb-1.5">
                        <span>Stay Calculation & Credited Advance</span>
                        <span>Room {selectedRoom?.room_number}</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Room Tariff ({totalNights} Days @ {formatCurrency(nightlyRate)}):</span>
                          <span>{formatCurrency(gstCalc.taxableRoomCharge)}</span>
                        </div>
                        {gstCalc.gstAmount > 0 && (
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Kerala GST ({gstCalc.gstRate}%):</span>
                            <span>{formatCurrency(gstCalc.gstAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-white font-bold border-t border-brass-soft/20 pt-1.5">
                          <span>Grand Total:</span>
                          <span>{formatCurrency(gstCalc.grandTotal)}</span>
                        </div>
                        <div className="flex justify-between text-signal-green font-bold">
                          <span>Advance Already Received:</span>
                          <span>- {formatCurrency(advancePaid)} ({paymentMode})</span>
                        </div>
                        <div className="flex justify-between text-signal-amber font-bold text-sm border-t border-brass-soft/20 pt-1.5">
                          <span>Balance Payable at Checkout:</span>
                          <span>{formatCurrency(Math.max(0, gstCalc.grandTotal - Number(advancePaid || 0) - Number(additionalAdvance || 0)))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Advance at Counter (Optional) */}
                    <div className="bg-panel p-4 rounded-xl border border-brass-soft/30 space-y-2 font-mono">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase text-slate-400 font-semibold">
                          Collect Additional Advance at Counter (Optional)
                        </label>
                        <span className="text-[10px] text-slate-400">Default: ₹0</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <span className="text-slate-400 absolute left-3 top-2 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={additionalAdvance}
                            onChange={(e) => setAdditionalAdvance(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full bg-ink border border-brass-soft rounded-lg pl-8 pr-3 py-1.5 text-white font-bold text-sm focus:outline-none focus:border-brass"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {['Cash', 'UPI', 'Card'].map(mode => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setPaymentMode(mode)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all text-center ${
                                paymentMode === mode
                                  ? 'bg-brass text-ink border-brass shadow'
                                  : 'bg-ink text-slate-400 border-brass-soft/30 hover:text-white'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NORMAL WALK-IN FLOW (NOT AN ADVANCE RESERVATION) */}
            {!isReservationArrival && (
              <>
                {/* STEP 1: STAY DURATION & ROOM SELECTION */}
                {(isAllInOne || step === 1) && (
                  <div className="space-y-4 animate-in fade-in">

                    {/* Top Segmented Booking Type Control: Overnight vs Fresh-Up */}
                    <div className="bg-ink p-1 rounded-xl border border-brass-soft/40 grid grid-cols-2 gap-1 font-mono text-xs shadow-inner">
                      <button
                        type="button"
                        onClick={() => setBookingType('overnight')}
                        className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                          bookingType === 'overnight'
                            ? 'bg-brass text-ink shadow-md font-extrabold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>🌙 Overnight Stay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingType('day_use')}
                        className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                          bookingType === 'day_use'
                            ? 'bg-amber-400 text-ink shadow-md font-extrabold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-ink" />
                        <span>⚡ Fresh-Up / Day Use</span>
                      </button>
                    </div>

                    {/* Returning Guest Quick Search Bar */}
                    <div className="p-3 bg-panel rounded-xl border border-brass-soft/30 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-brass uppercase font-bold flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5" />
                          <span>Returning Guest Recognition</span>
                        </span>
                        {isFastTrack && (
                          <button
                            type="button"
                            onClick={handleClearReturningGuest}
                            className="text-slate-400 hover:text-white text-[10px] underline"
                          >
                            Reset to New Guest
                          </button>
                        )}
                      </div>

                      {!isFastTrack ? (
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-brass absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Type phone number or guest name (e.g. 9847123456)..."
                            value={searchGuestInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSearchGuestInput(val);
                              if (val.length >= 4 && typeof phoneLookup === 'function') {
                                const match = phoneLookup(val);
                                if (match) applyGuestData(match);
                              }
                            }}
                            className="w-full bg-ink border border-brass-soft rounded-lg pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-brass placeholder-slate-500"
                          />
                        </div>
                      ) : (
                        /* Returning Guest Recognized Badge */
                        <div className="p-3 bg-brass/10 border border-brass rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-brass text-ink font-bold font-display flex items-center justify-center text-sm shrink-0">
                              {returningGuestFound.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs sm:text-sm truncate">
                                  {returningGuestFound.name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-signal-green text-ink font-mono font-bold text-[9px] shrink-0">
                                  ✓ ID ON FILE
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-brass mt-0.5 truncate">
                                📞 {returningGuestFound.phone} &bull; {returningGuestFound.total_stays || 1} Past Stays &bull; {returningGuestFound.id_proof_type || 'Aadhaar'} ({returningGuestFound.id_proof_number || 'VERIFIED'})
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleClearReturningGuest}
                            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-panel border border-brass-soft/30 shrink-0"
                            title="Clear and register as new guest"
                          >
                            ✕ Clear
                          </button>
                        </div>
                      )}

                      {isFastTrack && (
                        <div className="text-[10px] font-mono text-signal-green flex items-center gap-1.5 pt-0.5">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>Fast-Track Active: Guest info & ID capture skipped. Proceed directly to Amount step!</span>
                        </div>
                      )}
                    </div>

                    {/* Room Selection & Climate: Multi-Room for Fresh-Up Groups OR Single Room for Overnight */}
                    {isDayUse ? (
                      <div className="bg-ink p-4 rounded-xl border border-amber-500/40 space-y-3 font-mono text-xs animate-in fade-in">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brass-soft/20 pb-2">
                          <div>
                            <span className="text-[10px] uppercase text-amber-300 font-bold block">
                              Assign Rooms for Fresh-Up Group ({selectedRoomIds.length} Rooms Selected)
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              {effectiveGroupSize >= 15
                                ? '🚌 Tour Bus Group: 3–4 rooms recommended'
                                : effectiveGroupSize >= 6
                                ? '🚐 Medium Group: 2 rooms recommended'
                                : 'Solo / Small Group: 1 room sufficient'}
                            </span>
                          </div>

                          {/* Quick Count Shortcuts */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Quick Assign:</span>
                            {[1, 2, 3, 4].map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleQuickAssignRoomCount(num)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                  selectedRoomIds.length === num
                                    ? 'bg-amber-400 text-ink border-amber-400'
                                    : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass'
                                }`}
                              >
                                {num} {num === 1 ? 'Room' : 'Rooms'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Vacant Rooms Multi-Select Chips */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 uppercase block font-semibold">
                            Tap Rooms to Assign to this Group:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {vacantRooms.map(r => {
                              const isSelected = selectedRoomIds.includes(r.id);
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => handleToggleRoom(r.id)}
                                  className={`p-2 rounded-xl border text-left font-mono transition-all flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-amber-400 text-ink border-amber-400 shadow-md font-bold'
                                      : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass-soft'
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs font-black">Room {r.room_number}</div>
                                    <div className={`text-[9px] ${isSelected ? 'text-ink/80' : 'text-slate-400'}`}>
                                      F{r.floor} &bull; {r.room_type_id === 'deluxe' ? 'Deluxe' : 'Classic'}
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isSelected ? 'bg-ink text-amber-300' : 'bg-ink/60 text-slate-400'
                                  }`}>
                                    {isSelected ? '✓ Added' : '+ Add'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Allocation Banner */}
                        <div className="p-2.5 rounded-lg bg-panel border border-amber-500/30 flex items-center justify-between text-[11px] text-amber-200">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              Allocated <strong>{selectedRoomIds.length} Rooms</strong> (
                              {rooms.filter(r => selectedRoomIds.includes(r.id)).map(r => `Room ${r.room_number}`).join(', ') || 'None'}
                              ) for {effectiveGroupSize} Pax
                            </span>
                          </span>
                          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider shrink-0">
                            Total: {formatCurrency(taxableFreshUpTotal)}
                          </span>
                        </div>

                        {/* Climate Toggle */}
                        <div className="pt-2 border-t border-brass-soft/20 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] font-mono text-slate-300">Climate Option:</span>
                          <div className="flex items-center gap-2 font-mono">
                            <button
                              type="button"
                              onClick={() => setAcOrNonAc('AC')}
                              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                acOrNonAc === 'AC'
                                  ? 'bg-brass text-ink border-brass shadow'
                                  : 'bg-panel text-slate-400 border-brass-soft/40 hover:text-white'
                              }`}
                            >
                              <Wind className="w-3.5 h-3.5" />
                              <span>AC ({formatCurrency(roomType.ac_rate)})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAcOrNonAc('Non-AC')}
                              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                acOrNonAc === 'Non-AC'
                                  ? 'bg-brass text-ink border-brass shadow'
                                  : 'bg-panel text-slate-400 border-brass-soft/40 hover:text-white'
                              }`}
                            >
                              <Fan className="w-3.5 h-3.5" />
                              <span>Non-AC ({formatCurrency(roomType.non_ac_rate)})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-ink p-4 rounded-xl border border-brass-soft/40 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                              Select Room
                            </label>
                            <select
                              value={roomId}
                              onChange={(e) => {
                                setRoomId(e.target.value);
                                setSelectedRoomIds([e.target.value]);
                              }}
                              className="bg-panel border border-brass-soft rounded-lg px-3 py-1.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-brass"
                            >
                              {vacantRooms.map(r => (
                                <option key={r.id} value={r.id}>
                                  Room {r.room_number} (Floor {r.floor} &bull; {r.status.toUpperCase()})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1 text-right">
                            <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                              Daily Tariff
                            </span>
                            <div className="text-xl font-bold font-mono text-brass">
                              {formatCurrency(nightlyRate)} <span className="text-xs text-slate-400 font-normal">/ day</span>
                            </div>
                          </div>
                        </div>

                        {/* Climate Toggle */}
                        <div className="pt-2 border-t border-brass-soft/20 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] font-mono text-slate-300">Climate Type:</span>
                          <div className="flex items-center gap-2 font-mono">
                            <button
                              type="button"
                              onClick={() => setAcOrNonAc('AC')}
                              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                acOrNonAc === 'AC'
                                  ? 'bg-brass text-ink border-brass shadow'
                                  : 'bg-panel text-slate-400 border-brass-soft/40 hover:text-white'
                              }`}
                            >
                              <Wind className="w-3.5 h-3.5" />
                              <span>AC ({formatCurrency(roomType.ac_rate)})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAcOrNonAc('Non-AC')}
                              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                acOrNonAc === 'Non-AC'
                                  ? 'bg-brass text-ink border-brass shadow'
                                  : 'bg-panel text-slate-400 border-brass-soft/40 hover:text-white'
                              }`}
                            >
                              <Fan className="w-3.5 h-3.5" />
                              <span>Non-AC ({formatCurrency(roomType.non_ac_rate)})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Day-Based Stay Duration Selection OR Fresh-Up Group Configuration */}
                    {!isDayUse ? (
                      <div className="bg-ink p-4 rounded-xl border border-brass-soft/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                            Stay Duration & Days
                          </label>
                          <span className="text-xs font-mono font-bold text-brass">
                            {totalNights} {totalNights === 1 ? 'Day (24 hrs)' : 'Days'}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                          {[1, 2, 3].map(days => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => {
                                setStayDays(days);
                                setIsCustomDays(false);
                              }}
                              className={`py-2 px-1 rounded-xl border font-bold transition-all text-center ${
                                stayDays === days && !isCustomDays
                                  ? 'bg-brass text-ink border-brass shadow-md shadow-brass/20'
                                  : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass-soft'
                              }`}
                            >
                              <div>{days} {days === 1 ? 'Day' : 'Days'}</div>
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setIsCustomDays(true)}
                            className={`py-2 px-1 rounded-xl border font-bold transition-all text-center ${
                              isCustomDays
                                ? 'bg-brass text-ink border-brass shadow-md shadow-brass/20'
                                : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass-soft'
                            }`}
                          >
                            <div>Custom</div>
                          </button>
                        </div>

                        {isCustomDays && (
                          <div className="pt-2 flex items-center justify-between bg-panel p-2.5 rounded-lg border border-brass-soft/30 animate-in fade-in">
                            <span className="text-[11px] font-mono text-slate-300">Enter Number of Days:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setStayDays(p => Math.max(1, p - 1))}
                                className="w-7 h-7 rounded-lg bg-ink hover:bg-brass hover:text-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={stayDays}
                                onChange={(e) => setStayDays(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 bg-ink border border-brass-soft rounded-lg py-1 text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-brass"
                              />
                              <span className="text-xs font-mono text-slate-400">Days</span>
                              <button
                                type="button"
                                onClick={() => setStayDays(p => p + 1)}
                                className="w-7 h-7 rounded-lg bg-ink hover:bg-brass hover:text-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Noon-to-Noon Standard Checkout Notice */}
                        {(() => {
                          const now = new Date();
                          const checkoutDue = new Date(now.getFullYear(), now.getMonth(), now.getDate() + totalNights, 12, 0, 0);
                          return (
                            <div className="mt-2 p-2 rounded-lg bg-panel border border-brass-soft/30 flex items-center justify-between text-[10px] font-mono text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-brass" />
                                <span>Checkout due: <strong className="text-white font-semibold">{formatDeadlineDisplay(checkoutDue)}</strong></span>
                              </span>
                              <span className="text-[9px] text-brass uppercase font-bold tracking-wider">
                                12:00 PM Standard
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* FRESH-UP CONFIGURATION: HOURS, GROUP SIZE & TIERED PRICING */
                      <div className="bg-ink p-4 rounded-xl border border-amber-500/40 space-y-4 font-mono text-xs animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-brass-soft/20 pb-2">
                          <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase text-[11px]">
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span>Fresh-Up Stay & Group Tier Rates</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                            ₹{perPersonRate} / person
                          </span>
                        </div>

                        {/* 1. Hour Duration Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase text-slate-400 font-semibold">
                              Fresh-Up Duration (Hours)
                            </label>
                            <span className="text-white font-bold">{freshUpHours} {freshUpHours === 1 ? 'Hour' : 'Hours'}</span>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5">
                            {[1, 2, 3, 4].map(hrs => (
                              <button
                                key={hrs}
                                type="button"
                                onClick={() => {
                                  setFreshUpHours(hrs);
                                  setIsCustomHours(false);
                                }}
                                className={`py-2 px-1 rounded-xl border font-bold transition-all text-center ${
                                  freshUpHours === hrs && !isCustomHours
                                    ? 'bg-amber-400 text-ink border-amber-400 shadow-md'
                                    : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass-soft'
                                }`}
                              >
                                <div>{hrs} {hrs === 1 ? 'Hr' : 'Hrs'}</div>
                              </button>
                            ))}

                            <button
                              type="button"
                              onClick={() => setIsCustomHours(true)}
                              className={`py-2 px-1 rounded-xl border font-bold transition-all text-center ${
                                isCustomHours
                                  ? 'bg-amber-400 text-ink border-amber-400 shadow-md'
                                  : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass-soft'
                              }`}
                            >
                              <div>Custom</div>
                            </button>
                          </div>

                          {isCustomHours && (
                            <div className="pt-2 flex items-center justify-between bg-panel p-2.5 rounded-lg border border-brass-soft/30">
                              <span className="text-[11px] text-slate-300">Enter Number of Hours:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFreshUpHours(h => Math.max(1, h - 1))}
                                  className="w-7 h-7 rounded-lg bg-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={freshUpHours}
                                  onChange={(e) => setFreshUpHours(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-14 bg-ink border border-brass-soft rounded-lg py-1 text-center font-bold text-white text-sm"
                                />
                                <span className="text-slate-400">Hrs</span>
                                <button
                                  type="button"
                                  onClick={() => setFreshUpHours(h => h + 1)}
                                  className="w-7 h-7 rounded-lg bg-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Group Size Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase text-slate-400 font-semibold flex items-center gap-1">
                              <Users className="w-3 h-3 text-brass" />
                              <span>Group Size (Number of Persons)</span>
                            </label>
                            <span className="text-white font-bold">{effectiveGroupSize} Pax</span>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5">
                            {[1, 2, 4, 8, 15].map(pax => (
                              <button
                                key={pax}
                                type="button"
                                onClick={() => {
                                  setGroupSize(pax);
                                  setIsCustomGroup(false);
                                }}
                                className={`py-2 px-1 rounded-xl border font-bold transition-all text-center ${
                                  groupSize === pax && !isCustomGroup
                                    ? 'bg-amber-400 text-ink border-amber-400 shadow-md'
                                    : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass-soft'
                                }`}
                              >
                                <div className="text-xs">{pax} Pax</div>
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center justify-between bg-panel p-2.5 rounded-lg border border-brass-soft/30">
                            <span className="text-[11px] text-slate-300">Exact Headcount / Custom Pax:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setGroupSize(g => Math.max(1, g - 1))}
                                className="w-7 h-7 rounded-lg bg-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={groupSize}
                                onChange={(e) => setGroupSize(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 bg-ink border border-brass-soft rounded-lg py-1 text-center font-bold text-white text-sm"
                              />
                              <span className="text-slate-400">Pax</span>
                              <button
                                type="button"
                                onClick={() => setGroupSize(g => g + 1)}
                                className="w-7 h-7 rounded-lg bg-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 3. Dedicated Fresh-Up Discount Section */}
                        <div className="p-3 bg-panel rounded-xl border border-brass-soft/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase text-brass font-bold flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5" />
                              <span>Fresh-Up Concession / Discount</span>
                            </span>
                            {freshUpDiscountAmount > 0 && (
                              <span className="text-signal-green font-bold text-[11px]">
                                - {formatCurrency(freshUpDiscountAmount)} Discount Applied
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <button
                                  type="button"
                                  onClick={() => setFreshUpDiscountType('flat')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    freshUpDiscountType === 'flat' ? 'bg-brass text-ink' : 'bg-ink text-slate-400'
                                  }`}
                                >
                                  Flat ₹
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFreshUpDiscountType('percent')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    freshUpDiscountType === 'percent' ? 'bg-brass text-ink' : 'bg-ink text-slate-400'
                                  }`}
                                >
                                  % Off
                                </button>
                              </div>
                              <input
                                type="number"
                                min="0"
                                placeholder={freshUpDiscountType === 'flat' ? 'Amount in ₹' : 'Percentage %'}
                                value={freshUpDiscountValue || ''}
                                onChange={(e) => setFreshUpDiscountValue(Math.max(0, Number(e.target.value) || 0))}
                                className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1 text-white font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 uppercase block mb-1">Discount Reason:</label>
                              <input
                                type="text"
                                placeholder="e.g. Tour Guide Free / Group Deal"
                                value={freshUpDiscountReason}
                                onChange={(e) => setFreshUpDiscountReason(e.target.value)}
                                className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1 text-white text-xs placeholder-slate-500"
                              />
                            </div>
                          </div>

                          {/* Quick Discount Presets */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[9.5px] text-slate-400">Quick:</span>
                            {[
                              { label: '₹50 Off', val: 50, type: 'flat' },
                              { label: '₹100 Off', val: 100, type: 'flat' },
                              { label: '10% Off', val: 10, type: 'percent' },
                              { label: `Free 1 Pax (-₹${perPersonRate})`, val: perPersonRate, type: 'flat', reason: 'Tour Leader Complimentary' }
                            ].map((chip, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setFreshUpDiscountType(chip.type);
                                  setFreshUpDiscountValue(chip.val);
                                  if (chip.reason) setFreshUpDiscountReason(chip.reason);
                                }}
                                className="px-2 py-0.5 rounded bg-ink hover:bg-brass-soft/30 border border-brass-soft/30 text-[9.5px] text-slate-300 hover:text-white"
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 4. Live Fresh-Up Calculation Summary */}
                        <div className="p-2.5 rounded-lg bg-panel border border-brass-soft/30 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Gross Tariff ({effectiveGroupSize} Pax @ ₹{perPersonRate}/person):</span>
                            <span className="font-bold text-white">{formatCurrency(grossFreshUpTotal)}</span>
                          </div>
                          {freshUpDiscountAmount > 0 && (
                            <div className="flex items-center justify-between text-signal-green">
                              <span>Concession / Discount ({freshUpDiscountReason || 'Counter'}):</span>
                              <span className="font-bold">- {formatCurrency(freshUpDiscountAmount)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-brass-soft/20 text-white font-bold">
                            <span>Net Room Charge:</span>
                            <span className="text-amber-400 text-sm">{formatCurrency(taxableFreshUpTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-amber-300/90 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Departure Deadline:</span>
                            </span>
                            <strong className="text-white">
                              Today, {new Date(Date.now() + freshUpHours * 60 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </strong>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2 (NEW GUEST ONLY): GUEST RECORDS & PROFILE */}
                {(!isFastTrack && (isAllInOne || step === 2)) && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-brass uppercase font-bold flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>New Guest Information</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                          Mobile Number *
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="tel"
                            required
                            placeholder="+91 98470 11223"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-ink border border-brass-soft rounded-lg pl-9 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brass"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                          Guest Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                          Residential Address / City
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Calicut, Kerala"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 (NEW GUEST ONLY): ID CAPTURE & COMPLIANCE */}
                {(!isFastTrack && (isAllInOne || step === 3)) && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-brass uppercase font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-signal-green" />
                        <span>Government ID Capture (Police Compliance)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">
                        Saved once &bull; Auto-linked forever
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ID Document Type</label>
                        <select
                          value={idType}
                          onChange={(e) => setIdType(e.target.value)}
                          className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                        >
                          <option>Aadhaar Card</option>
                          <option>Driving License</option>
                          <option>Passport</option>
                          <option>Voter ID</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ID Document Number</label>
                        <input
                          type="text"
                          placeholder="e.g. XXXX-XXXX-4812"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                        />
                      </div>
                    </div>

                    <IdPhotoCaptureWidget
                      frontPhotoUrl={idPhotoUrl}
                      backPhotoUrl={idPhotoBackUrl}
                      idType={idType}
                      guestPhone={phone}
                      onChangeFront={(url) => setIdPhotoUrl(url)}
                      onChangeBack={(url) => setIdPhotoBackUrl(url)}
                    />
                  </div>
                )}

                {/* STEP 2 (FOR FAST-TRACK) OR STEP 4 (FOR NEW GUEST): PAYMENT & KEYS */}
                {(isAllInOne || (isFastTrack ? step === 2 : step === 4)) && (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Fast-Track Guest Recap Header */}
                    {isFastTrack && (
                      <div className="p-3 bg-panel rounded-xl border border-brass-soft/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-brass text-ink font-bold font-display flex items-center justify-center text-xs">
                              {name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs">{name}</span>
                                <span className="px-1.5 py-0.2 rounded bg-signal-green text-ink font-mono font-bold text-[9px]">
                                  ✓ ID VERIFIED
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                📞 {phone} &bull; {idType} ({idNumber || 'On File'})
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsEditDetailsOpen(prev => !prev)}
                            className="text-[10px] font-mono text-brass hover:text-white flex items-center gap-1 bg-ink px-2 py-1 rounded border border-brass-soft/30"
                          >
                            <span>{isEditDetailsOpen ? 'Hide Edit' : '✎ Edit Info'}</span>
                            {isEditDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>

                        {isEditDetailsOpen && (
                          <div className="pt-2 border-t border-brass-soft/20 grid grid-cols-2 gap-2 text-[11px] font-mono animate-in fade-in">
                            <div>
                              <label className="text-[9px] text-slate-400 block">Name</label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-ink border border-brass-soft/40 rounded px-2 py-1 text-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block">Phone</label>
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-ink border border-brass-soft/40 rounded px-2 py-1 text-white text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tariff & Payment Breakdown */}
                    <div className="bg-ink p-4 rounded-xl border border-brass-soft/40 space-y-3">
                      <div className="flex items-center justify-between text-brass text-[11px] uppercase font-mono font-bold border-b border-brass-soft/20 pb-1.5">
                        <span>Stay Charges & GST Breakdown</span>
                        <span>{totalNights} {totalNights === 1 ? 'Day' : 'Days'} Stay</span>
                      </div>

                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Room Tariff ({totalNights} x {formatCurrency(nightlyRate)}):</span>
                          <span>{formatCurrency(gstCalc.taxableRoomCharge)}</span>
                        </div>
                        {gstCalc.gstAmount > 0 ? (
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Kerala GST ({gstCalc.gstRate}%):</span>
                            <span>{formatCurrency(gstCalc.gstAmount)}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-signal-green text-[11px]">
                            <span>GST Exemption (&lt; ₹2,500/day):</span>
                            <span>₹0.00 (0% GST)</span>
                          </div>
                        )}
                        <div className="flex justify-between text-brass text-base font-bold border-t border-brass-soft/20 pt-2">
                          <span>Grand Total:</span>
                          <span>{formatCurrency(gstCalc.grandTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Advance Amount & Payment Mode */}
                    <div className="bg-panel p-4 rounded-xl border border-brass-soft/40 space-y-3">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                        Advance Paid at Check-In Counter *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                        <div className="relative">
                          <span className="text-slate-400 absolute left-3 top-2.5 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            max={gstCalc.grandTotal * 2}
                            value={advancePaid}
                            onChange={(e) => setAdvancePaid(e.target.value)}
                            className="w-full bg-ink border border-brass-soft rounded-lg pl-8 pr-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-brass"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {['Cash', 'UPI', 'Card'].map(mode => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setPaymentMode(mode)}
                              className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all text-center ${
                                paymentMode === mode
                                  ? 'bg-brass text-ink border-brass shadow'
                                  : 'bg-ink text-slate-400 border-brass-soft/30 hover:text-white'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                        <span>Balance Due at Checkout:</span>
                        <span className="font-bold text-signal-amber">
                          {formatCurrency(Math.max(0, gstCalc.grandTotal - Number(advancePaid || 0)))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Pinned Bottom Action Bar */}
          <div className="shrink-0 px-3 sm:px-4 py-3 bg-panel border-t border-brass-soft/30 pb-safe-mobile flex items-center justify-between gap-3 shadow-xl z-20">
            {/* Left Button: Cancel or Back Step */}
            {!isAllInOne && step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-2.5 px-4 rounded-xl bg-ink hover:bg-panel border border-brass-soft/40 text-slate-200 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-ink hover:bg-panel border border-brass-soft/30 text-slate-400 hover:text-white font-mono text-xs font-bold transition-all active:scale-95 shrink-0"
              >
                Cancel
              </button>
            )}

            {/* Right Button */}
            {!isAllInOne && step < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-2.5 px-5 sm:px-6 rounded-xl bg-brass text-ink font-bold text-xs font-mono hover:brightness-110 shadow-lg shadow-brass/20 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span>Continue to {stepsList[step].label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="py-2.5 px-5 sm:px-6 rounded-xl bg-signal-green text-ink font-bold text-xs font-mono hover:brightness-110 shadow-xl shadow-signal-green/20 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="truncate">
                  {isReservationArrival
                    ? `✓ Confirm Arrival & Hand Over Keys (Room ${selectedRoom?.room_number})`
                    : (isPreBooking ? 'Confirm Reservation' : `Check In (Rm ${selectedRoom?.room_number || '202'} &bull; ₹${advancePaid})`)}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
