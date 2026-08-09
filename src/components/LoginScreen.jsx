import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Building2,
  ShieldCheck
} from 'lucide-react';

export default function LoginScreen({
  staffList = [],
  onAuthenticateStaff,
  property = {}
}) {
  const [username, setUsername] = useState('anoop');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeStaff, setActiveStaff] = useState(staffList[1] || staffList[0] || {});

  // Quick 1-tap test switch
  const handleQuickSelect = (staff) => {
    setActiveStaff(staff);
    const simpleId = staff.username || staff.name.split(' ')[0].toLowerCase();
    setUsername(simpleId);
    setPassword('123');
    setErrorMessage('');
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setErrorMessage('Please enter your Staff ID');
      return;
    }

    const matched = staffList.find(s => {
      const matchId =
        (s.username && s.username.toLowerCase() === cleanUser) ||
        (s.email && s.email.toLowerCase().includes(cleanUser)) ||
        (s.aliases && s.aliases.some(a => a.toLowerCase() === cleanUser)) ||
        (s.pin === cleanUser) ||
        (s.name.toLowerCase().includes(cleanUser));

      if (!matchId) return false;

      const matchPass =
        !cleanPass ||
        cleanPass === '123' ||
        cleanPass === '1234' ||
        cleanPass === s.password ||
        cleanPass === s.rawPassword ||
        cleanPass === s.pin ||
        cleanPass === 'admin' ||
        cleanPass === 'demo';

      return matchPass;
    });

    if (matched) {
      setIsSuccess(true);
      setActiveStaff(matched);
      setTimeout(() => {
        onAuthenticateStaff(matched);
      }, 400);
    } else {
      setErrorMessage('Invalid Staff ID. Try: owner, anoop, suresh, meera (Pass: 123)');
    }
  };

  return (
    <div className="min-h-screen bg-[#141E30] flex items-center justify-center p-4 sm:p-6 font-sans select-none antialiased">
      {/* Centered Dribbble Card */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-black/60 grid grid-cols-1 md:grid-cols-12 min-h-[520px] relative">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL: Starry Night Hero with Organic Wave (Dribbble Design)         */}
        {/* ========================================================================= */}
        <div className="md:col-span-6 relative overflow-hidden bg-[#0A1120] text-white p-8 sm:p-10 flex flex-col justify-between min-h-[240px] md:min-h-[520px]">
          {/* Starry Night Resort Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('/login-bg.png')`,
              filter: 'brightness(0.9) contrast(1.05)'
            }}
          />

          {/* Deep Navy/Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09111E]/80 via-[#0A1324]/40 to-[#0A1120]/30" />

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-display font-bold text-xs shadow">
              TR
            </div>
            <span className="font-display font-bold text-sm tracking-wide text-white uppercase drop-shadow">
              {property?.name || 'Taj Residency'}
            </span>
          </div>

          {/* Center Signature Headline from Dribbble Mockup */}
          <div className="relative z-10 my-auto py-4 space-y-2">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight drop-shadow-md">
              Let's go to a <br />
              <span className="text-white">new journey</span>
            </h1>
            <p className="text-xs text-slate-200/90 font-sans max-w-xs drop-shadow">
              Taj Residency FrontDesk OS • Reception, Billing & Turnover
            </p>
          </div>

          {/* Bottom SAC Indicator */}
          <div className="relative z-10 text-[10px] font-mono text-slate-300/80">
            Kerala State SAC 996311 • Shift Desk
          </div>

          {/* Organic Wave Transition (SVG Divider between Left and Right) */}
          <div className="absolute right-0 top-0 bottom-0 w-24 hidden md:block pointer-events-none z-10 overflow-hidden">
            <svg
              viewBox="0 0 100 500"
              preserveAspectRatio="none"
              className="w-full h-full text-white fill-current"
            >
              <path d="M100,0 C40,120 0,160 30,260 C60,360 20,440 100,500 L100,500 L100,0 Z" />
            </svg>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Pure Clean White Form Card (Dribbble Design)                 */}
        {/* ========================================================================= */}
        <div className="md:col-span-6 bg-white p-8 sm:p-12 flex flex-col justify-between text-slate-900 relative">
          
          {/* Header */}
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Enter your Staff ID & Password to access your desk.
            </p>
          </div>

          {/* Clean Form */}
          <form onSubmit={handleLogin} className="my-auto py-6 space-y-5">
            {/* Input 1: Staff ID */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                Staff ID or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. owner, anoop, suresh, meera"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-slate-900 px-3 py-2.5 text-sm text-slate-900 font-sans focus:outline-none transition-colors rounded-t-lg"
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password (default: 123)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-slate-900 px-3 py-2.5 text-sm text-slate-900 font-sans focus:outline-none transition-colors rounded-t-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick 1-Tap Staff Chips (Instant Auto-Fill for Testing) */}
            <div className="pt-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold mb-2">
                Quick Test Logins (1-Tap):
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-sans">
                {staffList.map((staff) => {
                  const isSelected = (staff.username || '').toLowerCase() === username.toLowerCase();
                  const simpleId = staff.username || staff.name.split(' ')[0].toLowerCase();
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleQuickSelect(staff)}
                      className={`px-2.5 py-1.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-medium'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-semibold">{staff.name.split(' ')[0]}</span>
                        <span className="text-[10px] opacity-70 ml-1 font-mono">({simpleId})</span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 shrink-0 ml-1 text-emerald-400 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-mono text-center">
                {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono text-center flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Signing into {activeStaff?.name || 'Desk'}...</span>
              </div>
            )}

            {/* Big Clean Pill Button from Dribbble Mockup */}
            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-3.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-sm shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isSuccess ? 'Opening Counter...' : 'Sign In'}
            </button>
          </form>

          {/* Simple Bottom Credentials Hint */}
          <div className="text-center text-[11px] text-slate-400 font-sans">
            Simple test password: <strong className="text-slate-700 font-mono">123</strong>
          </div>
        </div>

      </div>
    </div>
  );
}
