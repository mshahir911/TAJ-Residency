import React, { useState } from 'react';
import {
  X,
  Lock,
  Key,
  ShieldCheck,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function LoginModal({
  isOpen,
  onClose,
  staffList = [],
  currentStaff,
  onQuickSwitchStaff,
  onLoginStaff,
  property
}) {
  const [inputIdentifier, setInputIdentifier] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleManualLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const res = onLoginStaff(inputIdentifier, inputPin);
    if (res.success) {
      setSuccessMessage(`Welcome back, ${res.staff.name}!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMessage(res.message || 'Invalid Email / Phone or PIN.');
    }
  };

  const handleQuickSwitch = (staff) => {
    onQuickSwitchStaff(staff.id);
    setSuccessMessage(`Active staff switched to ${staff.name} (${staff.roleLabel})`);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass font-display font-bold text-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg leading-none">
                Staff Authentication & Shift Access Portal
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {property.name} • Role-based access for Receptionists, Lady Housekeeper & Owner
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

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {successMessage && (
            <div className="p-3 rounded-xl bg-signal-green/20 border border-signal-green/40 text-signal-green font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-signal-red/20 border border-signal-red/40 text-signal-red font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section: 1-Tap Quick Demo Credentials & Roles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-brass font-mono text-[11px] uppercase font-bold border-b border-brass-soft/20 pb-1">
              <span>Official Staff Profiles & Assigned Shifts ({staffList.length})</span>
              <span className="text-slate-400 font-normal">Click any card to log in directly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {staffList.map(staff => {
                const isActive = staff.id === currentStaff?.id;
                return (
                  <div
                    key={staff.id}
                    onClick={() => handleQuickSwitch(staff)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none ${
                      isActive
                        ? 'bg-ink border-brass shadow-lg shadow-brass/10 ring-1 ring-brass'
                        : 'bg-panel border-brass-soft/30 hover:border-brass/60 hover:bg-panel-raised'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={staff.avatar}
                        alt={staff.name}
                        className="w-11 h-11 rounded-xl object-cover border border-brass-soft shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-white text-sm truncate">
                            {staff.name}
                          </h4>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded bg-signal-green text-ink font-mono font-bold text-[9px]">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] font-mono font-bold uppercase block mt-0.5 ${
                          staff.role === 'owner' ? 'text-brass' : (staff.role === 'housekeeping' ? 'text-blue-400' : 'text-signal-green')
                        }`}>
                          {staff.roleLabel}
                        </span>

                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="truncate">{staff.shift}</span>
                        </div>
                      </div>
                    </div>

                    {/* Permissions note */}
                    <div className="p-2 bg-ink/70 rounded-lg border border-brass-soft/20 text-[10px] text-slate-300 font-sans leading-tight">
                      {staff.permissionsNote}
                    </div>

                    {/* Credentials pill */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-brass-soft/10 pt-1.5">
                      <span>Login PIN: <strong className="text-brass">{staff.pin}</strong></span>
                      <span>Password: <strong className="text-slate-300">{staff.password}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Manual PIN / Password Login Form */}
          <form onSubmit={handleManualLogin} className="bg-ink p-4 rounded-xl border border-brass-soft/30 space-y-3 font-sans">
            <div className="text-[11px] font-mono text-slate-300 uppercase font-bold border-b border-brass-soft/20 pb-1">
              Manual Staff Sign-In with 4-Digit PIN or Password
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">
                  Staff Email or Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. meera.hk@tajresidency.com or +91..."
                  value={inputIdentifier}
                  onChange={(e) => setInputIdentifier(e.target.value)}
                  className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-brass"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">
                  4-Digit Security PIN / Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter 4-digit PIN (e.g. 1001 / 2001 / 3001)"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:border-brass"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 active:scale-95 transition-all flex items-center justify-center gap-2 font-mono"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Authenticate & Open Scoped Shift</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
