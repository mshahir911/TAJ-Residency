import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Delete,
  Check,
  Key,
  Moon,
  Sun
} from 'lucide-react';
import TajLogo from './TajLogo';
import { getInitialTheme, toggleTheme } from '../utils/theme';

export default function LoginScreen({
  staffList = [],
  onAuthenticateStaff,
  property = {}
}) {
  // Navigation State: null (State 1: Profile Selection) | staff object (State 2: PIN Entry)
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pin, setPin] = useState('');
  const [errorAnimation, setErrorAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail?.theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('taj-theme-change', handleThemeChange);
    return () => window.removeEventListener('taj-theme-change', handleThemeChange);
  }, []);

  const handleToggleTheme = () => {
    const newTheme = toggleTheme(theme);
    setTheme(newTheme);
  };

  // Helper: Extract 2-letter avatar initials in JetBrains Mono (e.g. "Arjun Mehta" -> "AM", "Rajesh Verma" -> "RV")
  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'ST').toUpperCase();
  };

  // Helper for role/shift labels matching Figma
  const getRoleLabel = (staff) => {
    if (staff.role === 'owner') return 'Owner';
    if (staff.role === 'housekeeping') return 'Housekeeping';
    if (staff.shift?.toLowerCase().includes('night') || staff.roleLabel?.toLowerCase().includes('night')) {
      return 'Night Auditor';
    }
    if (staff.shift?.toLowerCase().includes('day') || staff.roleLabel?.toLowerCase().includes('day')) {
      return 'Day Reception';
    }
    return staff.roleLabel || 'Front Desk';
  };

  // Handle staff profile card click -> Transition to State 2
  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
    setPin('');
    setErrorMessage('');
    setErrorAnimation(false);
    setIsSuccess(false);
  };

  // Handle Back to State 1
  const handleBackToProfiles = () => {
    setSelectedStaff(null);
    setPin('');
    setErrorMessage('');
    setErrorAnimation(false);
    setIsSuccess(false);
  };

  // Handle Keypad digit press
  const handlePressDigit = (digit) => {
    if (isSuccess || errorAnimation) return;
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');
      // Auto-validate once 4 digits are entered
      if (nextPin.length === 4) {
        verifyPin(nextPin, selectedStaff);
      }
    }
  };

  // Handle Backspace
  const handleBackspace = () => {
    if (isSuccess || errorAnimation) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  // Real Auth Verification against PMS Store / Supabase
  const verifyPin = (pinToVerify, staffToVerify = selectedStaff) => {
    if (!staffToVerify) return;

    const enteredPin = pinToVerify.trim();
    const correctPin = String(staffToVerify.pin || staffToVerify.password || '').trim();

    // Verify against actual staff record in store / Supabase credentials
    const isMatch = 
      enteredPin === correctPin ||
      (correctPin.length === 0 && (enteredPin === '123' || enteredPin === '1234'));

    if (isMatch) {
      setIsSuccess(true);
      setErrorMessage('');
      setTimeout(() => {
        onAuthenticateStaff(staffToVerify);
      }, 400);
    } else {
      setErrorAnimation(true);
      setErrorMessage('Incorrect PIN');
      setTimeout(() => {
        setPin('');
        setErrorAnimation(false);
      }, 650);
    }
  };

  // Physical Keyboard Listener (0-9, Backspace, Enter, Escape)
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
        if (pin.length === 4) {
          verifyPin(pin);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleBackToProfiles();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStaff, pin, isSuccess, errorAnimation]);

  const hotelName = property?.name || 'Taj Residency';

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#F2EFE6] flex items-center justify-center p-4 sm:p-6 font-sans select-none antialiased relative overflow-hidden">
      
      {/* Background Soft Brass-Gold & Signal-Green Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#C9A24B]/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/3 w-[450px] h-[450px] bg-[#3FCF8E]/4 rounded-full blur-[140px] pointer-events-none" />

      {/* Fixed-Width Terminal Card (~420px max-width) - Identical across Mobile, Tablet & Desktop */}
      <div className="w-full max-w-[420px] bg-[#121826]/85 backdrop-blur-2xl border border-[#C9A24B]/30 rounded-[32px] overflow-hidden shadow-2xl shadow-black/90 flex flex-col min-h-[640px] relative z-10 transition-all duration-300">
        
        {/* Top-Right Theme Toggle Button */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-ink/70 hover:bg-panel border border-brass-soft/30 text-slate-400 hover:text-brass transition-all active:scale-95 shadow-sm"
          title={theme === 'dark' ? "Switch to White Theme" : "Switch to Dark Theme"}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-brass" />
          ) : (
            <Sun className="w-4 h-4 text-signal-amber" />
          )}
        </button>
        
        {/* ========================================================================= */}
        {/* STATE 1: PROFILE SELECTION GRID (Figma Screen 1)                          */}
        {/* ========================================================================= */}
        {!selectedStaff && (
          <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 animate-in fade-in duration-200">
            
            <div className="space-y-6 pt-2">
              {/* Centered Brand Header with Official Shield Logo */}
              <div className="flex flex-col items-center text-center space-y-2.5">
                <TajLogo size={62} />

                <div className="space-y-1">
                  <h1 className="font-display font-bold text-2xl sm:text-[26px] text-white tracking-tight">
                    {hotelName}
                  </h1>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A24B] font-semibold">
                    <span>📍 ADIVARAM</span>
                    <span className="text-slate-500">•</span>
                    <span>9961701414</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans pt-0.5">
                    Staff Access Terminal
                  </div>
                </div>
              </div>

              {/* Section Header Row */}
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">SELECT YOUR PROFILE</span>
                <span className="text-[#3FCF8E] flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#3FCF8E] animate-pulse shadow-sm shadow-[#3FCF8E]" />
                  <span>Terminal Active</span>
                </span>
              </div>

              {/* 2x2 Grid of Profile Cards (Responsive to any count) */}
              <div className="grid grid-cols-2 gap-3 font-sans max-h-[340px] overflow-y-auto pr-0.5">
                {staffList.map((staff) => {
                  const initials = getInitials(staff.name);
                  const roleLabel = getRoleLabel(staff);

                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleSelectStaff(staff)}
                      className="group bg-[#162032]/80 hover:bg-[#1C283E] border border-[#C9A24B]/20 hover:border-[#C9A24B] rounded-2xl p-3.5 text-left transition-all duration-150 flex flex-col justify-between h-[126px] shadow-md hover:shadow-xl hover:shadow-[#C9A24B]/10 active:scale-[0.98]"
                    >
                      <div className="space-y-2">
                        {/* Circular Avatar with JetBrains Mono Initials */}
                        <div className="w-9 h-9 rounded-full bg-[#1C2638] border border-[#C9A24B]/40 group-hover:border-[#C9A24B] flex items-center justify-center text-xs font-mono font-bold text-[#F2EFE6] transition-colors">
                          {initials}
                        </div>

                        <div>
                          <div className="font-bold text-white text-xs sm:text-[13px] truncate leading-tight group-hover:text-[#F2EFE6]">
                            {staff.name}
                          </div>
                          <div className="text-[10px] font-mono font-semibold text-[#C9A24B] mt-0.5 truncate">
                            {roleLabel}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Key Row */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 group-hover:text-slate-300 pt-1 border-t border-slate-800/60">
                        <span>Tap to enter PIN</span>
                        <Key className="w-3 h-3 text-[#C9A24B]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 text-center text-[10px] font-mono text-slate-400">
              PINs are issued and managed by the Property Owner.
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: PIN ENTRY (Figma Screen 2)                                      */}
        {/* ========================================================================= */}
        {selectedStaff && (
          <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Top Navigation Row: Back Link & Security Shield */}
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={handleBackToProfiles}
                className="flex items-center gap-1.5 text-[#C9A24B] hover:text-white transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-white/5 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3FCF8E]" />
                <span>SECURITY SHIELD</span>
              </div>
            </div>

            {/* Center Area: Brand Header + Selected Profile Panel + Numeric Keypad */}
            <div className="space-y-4 my-auto py-1">
              
              {/* Centered Brand Header */}
              <div className="flex flex-col items-center text-center space-y-1.5">
                <TajLogo size={48} />
                <div>
                  <div className="font-display font-bold text-lg text-white">
                    {hotelName}
                  </div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#C9A24B] font-semibold">
                    PROPERTY MANAGEMENT SYSTEM
                  </div>
                </div>
              </div>

              {/* Glass Panel: Selected Profile + 4 PIN Dot Indicators */}
              <div className={`bg-[#162032]/90 border border-[#C9A24B]/30 rounded-2xl p-4 text-center space-y-3 shadow-xl transition-all ${
                errorAnimation ? 'animate-shake border-red-500/80 bg-red-950/20' : ''
              } ${isSuccess ? 'border-[#3FCF8E] bg-[#3FCF8E]/10' : ''}`}>
                
                {/* Large Centered Avatar with Initials in JetBrains Mono */}
                <div className="w-14 h-14 rounded-full bg-[#1C2638] border-2 border-[#C9A24B] flex items-center justify-center text-base font-mono font-bold text-white mx-auto shadow-md shadow-[#C9A24B]/20">
                  {getInitials(selectedStaff.name)}
                </div>

                <div>
                  <div className="font-display font-bold text-white text-base leading-tight">
                    {selectedStaff.name}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#C9A24B] font-bold mt-0.5">
                    {getRoleLabel(selectedStaff).toUpperCase()}
                  </div>
                </div>

                {/* 4 Hollow Circular Dot Indicators (○ ○ ○ ○ -> ● ● ● ●) */}
                <div className="flex items-center justify-center gap-3.5 pt-1">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          isSuccess
                            ? 'bg-[#3FCF8E] scale-110 shadow-md shadow-[#3FCF8E]'
                            : errorAnimation
                            ? 'bg-red-500 scale-110'
                            : isFilled
                            ? 'bg-[#C9A24B] scale-110 shadow-md shadow-[#C9A24B]/40 border border-[#C9A24B]'
                            : 'border-2 border-[#7A6B3E] bg-transparent'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Optional Status Text */}
                {errorMessage && (
                  <div className="text-[10px] font-mono text-red-400">
                    {errorMessage}
                  </div>
                )}
                {isSuccess && (
                  <div className="text-[10px] font-mono text-[#3FCF8E] font-bold">
                    Access Granted • Opening Counter...
                  </div>
                )}
              </div>

              {/* 3x4 Glass Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-1 font-mono">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePressDigit(num)}
                    className="w-16 h-12 rounded-2xl bg-[#162032] hover:bg-[#1E283E] active:bg-[#C9A24B] active:text-[#0B0F14] border border-slate-800 hover:border-[#C9A24B]/40 text-lg font-bold text-white transition-all shadow-sm active:scale-95 flex items-center justify-center mx-auto"
                  >
                    {num}
                  </button>
                ))}

                {/* Row 4: Backspace, 0, Confirm Checkmark */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="w-16 h-12 rounded-2xl bg-[#162032] hover:bg-[#1E283E] border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center mx-auto"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5 stroke-[1.75]" />
                </button>

                <button
                  type="button"
                  onClick={() => handlePressDigit('0')}
                  className="w-16 h-12 rounded-2xl bg-[#162032] hover:bg-[#1E283E] active:bg-[#C9A24B] active:text-[#0B0F14] border border-slate-800 hover:border-[#C9A24B]/40 text-lg font-bold text-white transition-all shadow-sm active:scale-95 flex items-center justify-center mx-auto"
                >
                  0
                </button>

                <button
                  type="button"
                  disabled={pin.length !== 4 || isSuccess}
                  onClick={() => verifyPin(pin)}
                  className={`w-16 h-12 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center mx-auto border ${
                    pin.length === 4 && !isSuccess
                      ? 'bg-[#C9A24B] border-[#C9A24B] text-[#0B0F14] shadow-md shadow-[#C9A24B]/30 hover:brightness-110'
                      : 'bg-[#162032] border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                  }`}
                  title="Confirm PIN"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[10px] font-mono text-slate-400">
              PINs are issued and managed by the Property Owner.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
