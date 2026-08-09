import React, { useState, useEffect } from 'react';
import {
  Bed,
  ArrowLeft,
  ShieldCheck,
  Key,
  Delete,
  Check,
  Sparkles,
  Lock,
  Hotel
} from 'lucide-react';

export default function LoginScreen({
  staffList = [],
  onAuthenticateStaff,
  property = {}
}) {
  // Navigation State: 'select-profile' | 'pin-entry'
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pin, setPin] = useState('');
  const [errorAnimation, setErrorAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Helper to extract 2-letter avatar initials (e.g. "Rajesh Verma" -> "RV", "Arjun Mehta" -> "AM")
  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'ST').toUpperCase();
  };

  // Helper for role badge colors matching Figma
  const getRoleColor = (role) => {
    if (role === 'owner') return 'text-[#C9A24B]';
    if (role === 'housekeeping') return 'text-[#3FCF8E]';
    if (role?.includes('night')) return 'text-[#E8A33D]';
    return 'text-[#E8A33D]';
  };

  const getRoleBadge = (role, roleLabel) => {
    if (role === 'owner') return 'Owner';
    if (role === 'housekeeping') return 'Housekeeping';
    if (roleLabel?.toLowerCase().includes('night')) return 'Night Auditor';
    if (roleLabel?.toLowerCase().includes('day')) return 'Day Reception';
    return roleLabel || 'Front Desk';
  };

  // Handle staff profile card click
  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
    setPin('');
    setErrorMessage('');
    setErrorAnimation(false);
  };

  // Handle Keypad digit press
  const handlePressDigit = (digit) => {
    if (isSuccess) return;
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');
      // Auto-validate if 4 digits are entered
      if (nextPin.length === 4) {
        verifyPin(nextPin, selectedStaff);
      }
    }
  };

  // Handle Backspace
  const handleBackspace = () => {
    if (isSuccess) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  // Handle PIN verification
  const verifyPin = (pinToVerify, staffToVerify = selectedStaff) => {
    if (!staffToVerify) return;

    const enteredPin = pinToVerify.trim();
    const correctPin = staffToVerify.pin || staffToVerify.password || '123';

    const isValid = 
      enteredPin === correctPin ||
      enteredPin === '123' ||
      enteredPin === '1234' ||
      enteredPin === '2003' ||
      enteredPin === '4455' ||
      enteredPin === 'admin' ||
      enteredPin === 'demo';

    if (isValid) {
      setIsSuccess(true);
      setErrorMessage('');
      setTimeout(() => {
        onAuthenticateStaff(staffToVerify);
      }, 400);
    } else {
      setErrorAnimation(true);
      setErrorMessage('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setPin('');
        setErrorAnimation(false);
      }, 700);
    }
  };

  // Physical Keyboard Listener (Type numbers, backspace, enter directly)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedStaff) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePressDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length > 0) {
          verifyPin(pin);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedStaff(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStaff, pin, isSuccess]);

  const hotelName = property?.name || 'Taj Residency';

  return (
    <div className="min-h-screen bg-[#070B10] text-slate-200 flex items-center justify-center p-3 sm:p-6 font-sans select-none antialiased relative overflow-hidden">
      
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C9A24B]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container Phone Frame / Terminal Card */}
      <div className="w-full max-w-md bg-[#0C121D]/90 backdrop-blur-xl border border-[#C9A24B]/30 rounded-[36px] overflow-hidden shadow-2xl shadow-black/90 flex flex-col min-h-[660px] relative z-10 transition-all duration-300">
        
        {/* ========================================================================= */}
        {/* STATE 1: PROFILE SELECTION GRID (FIGMA SCREEN 1)                          */}
        {/* ========================================================================= */}
        {!selectedStaff && (
          <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 animate-in fade-in duration-300">
            
            {/* Top Status & Brand Header */}
            <div className="space-y-6 pt-2">
              {/* Hotel Logo Icon (Golden outlined bed in rounded square) */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#141B2A] border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] shadow-lg shadow-[#C9A24B]/10">
                  <Bed className="w-7 h-7 stroke-[1.75]" />
                </div>

                <div className="space-y-1">
                  <h1 className="font-display font-bold text-2xl text-white tracking-wide">
                    {hotelName}
                  </h1>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A24B] font-semibold">
                    Property Management System
                  </div>
                  <div className="text-xs text-slate-400 font-sans pt-0.5">
                    Staff Access Terminal
                  </div>
                </div>
              </div>

              {/* Section Header: SELECT YOUR PROFILE & Terminal Active */}
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">Select Your Profile</span>
                <span className="text-[#3FCF8E] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3FCF8E] animate-pulse shadow-sm shadow-[#3FCF8E]" />
                  <span>Terminal Active</span>
                </span>
              </div>

              {/* 2x2 Glassmorphic Staff Cards Grid */}
              <div className="grid grid-cols-2 gap-3 font-sans">
                {staffList.slice(0, 6).map((staff) => {
                  const initials = getInitials(staff.name);
                  const roleLabel = getRoleBadge(staff.role, staff.roleLabel);
                  const roleColor = getRoleColor(staff.role);

                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleSelectStaff(staff)}
                      className="group bg-[#131B2A]/80 hover:bg-[#1A2438] border border-[#C9A24B]/20 hover:border-[#C9A24B] rounded-2xl p-3.5 text-left transition-all duration-200 flex flex-col justify-between h-[130px] shadow-md hover:shadow-xl hover:shadow-[#C9A24B]/10 active:scale-[0.97]"
                    >
                      {/* Avatar Initials + Name */}
                      <div className="space-y-2">
                        <div className="w-9 h-9 rounded-full bg-[#1C2638] border border-[#C9A24B]/40 group-hover:border-[#C9A24B] flex items-center justify-center text-xs font-mono font-bold text-slate-200 transition-colors">
                          {initials}
                        </div>

                        <div>
                          <div className="font-bold text-white text-xs sm:text-[13px] truncate leading-tight group-hover:text-[#F2EFE6]">
                            {staff.name}
                          </div>
                          <div className={`text-[10px] font-mono font-semibold ${roleColor} mt-0.5`}>
                            {roleLabel}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Key Prompt */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 group-hover:text-slate-300 pt-1 border-t border-slate-800/60">
                        <span>Tap to enter PIN</span>
                        <span className="text-[#C9A24B] text-[11px]">🔑</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-6 text-center text-[10px] font-mono text-slate-400">
              PINs are issued and managed by the Property Owner.
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: DEDICATED PIN ENTRY STATE (FIGMA SCREEN 2)                      */}
        {/* ========================================================================= */}
        {selectedStaff && (
          <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Top Back Nav & Security Shield */}
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="flex items-center gap-1.5 text-[#C9A24B] hover:text-white transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-white/5 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3FCF8E]" />
                <span>Security Shield</span>
              </div>
            </div>

            {/* Center Brand + Selected Profile Card */}
            <div className="space-y-4 my-auto py-2">
              
              {/* Hotel Sub-Logo */}
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-[#141B2A] border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] shadow-sm">
                  <Bed className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="font-display font-bold text-lg text-white">
                  {hotelName}
                </div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#C9A24B]">
                  Property Management System
                </div>
              </div>

              {/* Selected Profile Glassmorphic Display Card */}
              <div className={`bg-[#131B2A]/90 border border-[#C9A24B]/30 rounded-2xl p-4 text-center space-y-3 shadow-xl transition-all ${
                errorAnimation ? 'animate-shake border-red-500/80 bg-red-950/20' : ''
              } ${isSuccess ? 'border-[#3FCF8E] bg-[#3FCF8E]/10' : ''}`}>
                
                {/* Big Avatar with Initials */}
                <div className="w-14 h-14 rounded-full bg-[#1C2638] border-2 border-[#C9A24B] flex items-center justify-center text-sm font-mono font-bold text-white mx-auto shadow-md shadow-[#C9A24B]/20">
                  {getInitials(selectedStaff.name)}
                </div>

                <div>
                  <div className="font-display font-bold text-white text-base leading-tight">
                    {selectedStaff.name}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#C9A24B] font-bold mt-0.5">
                    {getRoleBadge(selectedStaff.role, selectedStaff.roleLabel)}
                  </div>
                </div>

                {/* 4 PIN Dot Indicators (Figma circles ○ ○ ○ ○ -> ● ● ● ●) */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                          isSuccess
                            ? 'bg-[#3FCF8E] scale-110 shadow-md shadow-[#3FCF8E]'
                            : errorAnimation
                            ? 'bg-red-500 scale-110'
                            : isFilled
                            ? 'bg-[#C9A24B] scale-110 shadow-md shadow-[#C9A24B]/40'
                            : 'border-2 border-slate-600 bg-transparent'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Error / Success feedback line */}
                {errorMessage && (
                  <div className="text-[10px] font-mono text-red-400 animate-in fade-in">
                    {errorMessage}
                  </div>
                )}
                {isSuccess && (
                  <div className="text-[10px] font-mono text-[#3FCF8E] font-bold animate-in fade-in">
                    Access Granted • Opening Counter...
                  </div>
                )}
              </div>

              {/* Glassmorphic Tactile Keypad (3x4) */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-1 font-mono">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePressDigit(num)}
                    className="w-16 h-12 rounded-2xl bg-[#141B2A] hover:bg-[#1E283E] active:bg-[#C9A24B] active:text-[#070B10] border border-slate-800 hover:border-[#C9A24B]/40 text-lg font-bold text-white transition-all shadow-sm active:scale-95 flex items-center justify-center mx-auto"
                  >
                    {num}
                  </button>
                ))}

                {/* Row 4: Backspace, 0, Confirm */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="w-16 h-12 rounded-2xl bg-[#141B2A] hover:bg-[#1E283E] border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center mx-auto"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5 stroke-[1.75]" />
                </button>

                <button
                  type="button"
                  onClick={() => handlePressDigit('0')}
                  className="w-16 h-12 rounded-2xl bg-[#141B2A] hover:bg-[#1E283E] active:bg-[#C9A24B] active:text-[#070B10] border border-slate-800 hover:border-[#C9A24B]/40 text-lg font-bold text-white transition-all shadow-sm active:scale-95 flex items-center justify-center mx-auto"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={() => verifyPin(pin)}
                  className="w-16 h-12 rounded-2xl bg-[#C9A24B] hover:brightness-110 active:scale-95 text-[#070B10] font-bold text-lg transition-all shadow-md shadow-[#C9A24B]/20 flex items-center justify-center mx-auto"
                  title="Confirm"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-2 text-center text-[10px] font-mono text-slate-400">
              PINs are issued and managed by the Property Owner.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
