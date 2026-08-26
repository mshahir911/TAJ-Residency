import React, { useState, useEffect } from 'react';
import {
  Bed,
  Moon,
  Sun,
  Clock,
  Wifi,
  Coins,
  Receipt,
  UserPlus,
  Building2,
  Lock,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { getInitialTheme, toggleTheme } from '../utils/theme';
import PropertySwitcher from './PropertySwitcher';

export default function TopHeader({
  property,
  properties = [],
  activePropertyId,
  onSwitchProperty,
  onOpenOnboarding,
  onOpenDatabaseModal,
  isOnline = true,
  syncStatus = {},
  stats,
  onOpenWalkIn,
  onOpenShiftHandover,
  currentShift = {},
  currentRole = 'receptionist'
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [theme, setTheme] = useState(getInitialTheme);

  // Sync theme changes
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

  // Live real-time clock ticking every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const todayDate = currentDateTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const nowTime = currentDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const cashAmount = formatCurrency(stats?.cashRevenue || 15680);

  return (
    <header className="bg-panel/85 backdrop-blur-xl border-b border-brass-soft/30 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 select-none sticky top-0 z-30 shadow-md">
      {/* Left: Property Switcher & Night Desk Badge */}
      <div className="flex items-center gap-2 min-w-0">
        <PropertySwitcher
          properties={properties}
          activePropertyId={activePropertyId}
          onSwitchProperty={onSwitchProperty}
          onOpenOnboarding={onOpenOnboarding}
        />
      </div>

      {/* Center: Live Desk Clock & Night Auditor Banner (Large Desktop >=1024px) */}
      <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink border border-brass-soft/30 shadow-inner">
          {theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-brass animate-pulse" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-signal-amber animate-spin-slow" />
          )}
          <span className="text-brass font-bold tracking-wider">{nowTime}</span>
          <span className="text-slate-400">• {todayDate}</span>
        </div>
      </div>

      {/* Right: Theme Toggle, Cash in Drawer, Online Sync & Walk-in */}
      <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs shrink-0">
        {/* Luxury Theme Switcher Button */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-ink border border-brass-soft/40 hover:border-brass text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 shrink-0 group"
          title={theme === 'dark' ? "Switch to White Theme (Day Mode)" : "Switch to Dark Theme (Night Desk Mode)"}
          aria-label="Toggle dark and white theme"
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-brass transition-transform group-hover:-rotate-12" />
              <span className="text-[11px] font-bold text-brass hidden md:inline">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-signal-amber transition-transform group-hover:rotate-45" />
              <span className="text-[11px] font-bold text-signal-amber hidden md:inline">White</span>
            </>
          )}
        </button>

        {/* Cash in Drawer Pill — Guaranteed non-clipping with tabular nums */}
        <button
          onClick={onOpenShiftHandover}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-ink border border-brass-soft/40 hover:border-brass text-left transition-all shrink-0 active:scale-95"
          title="Click to view Shift Handover & Drawer Cash"
        >
          <Coins className="w-3.5 h-3.5 text-signal-green shrink-0" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 hidden sm:inline leading-none">CASH:</span>
            <span className="text-signal-green font-bold text-xs sm:text-sm leading-none whitespace-nowrap">
              {cashAmount}
            </span>
          </div>
        </button>

        {/* Sync Status Badge / Dot with Real-Time Cross-Device indicator */}
        <button
          type="button"
          onClick={onOpenDatabaseModal}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-ink border border-brass-soft/30 hover:border-brass text-slate-300 hover:text-white shrink-0 transition-colors"
          title={syncStatus?.status === 'connected' ? `Real-Time Cloud Synced (${syncStatus?.connectedDevicesCount || 1} devices linked)` : 'Click to configure real-time cloud sync across desk & phone'}
        >
          <span className={`w-2 h-2 rounded-full ${syncStatus?.status === 'connected' ? 'bg-signal-green shadow-sm shadow-signal-green animate-pulse' : (isOnline ? 'bg-signal-green' : 'bg-signal-amber')}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
            {syncStatus?.status === 'connected' ? 'CLOUD SYNC' : (isOnline ? 'ONLINE' : 'LOCAL')}
          </span>
        </button>

        {/* Walk-in Button (Desktop only here, mobile has bottom bar trigger) */}
        {currentRole !== 'housekeeping' && (
          <button
            onClick={onOpenWalkIn}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brass text-ink font-bold text-xs shadow-md shadow-brass/20 hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Walk-In</span>
          </button>
        )}
      </div>
    </header>
  );
}
