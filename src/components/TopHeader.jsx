import React, { useState, useEffect } from 'react';
import {
  Bed,
  Moon,
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
import PropertySwitcher from './PropertySwitcher';

export default function TopHeader({
  property,
  properties = [],
  activePropertyId,
  onSwitchProperty,
  onOpenOnboarding,
  isOnline,
  stats,
  onOpenWalkIn,
  onOpenShiftHandover,
  currentShift,
  currentRole
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

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
    <header className="bg-panel border-b border-brass-soft/30 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 select-none sticky top-0 z-30 shadow-md">
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
          <Moon className="w-3.5 h-3.5 text-brass animate-pulse" />
          <span className="text-brass font-bold tracking-wider">{nowTime}</span>
          <span className="text-slate-400">• {todayDate}</span>
        </div>
      </div>

      {/* Right: Cash in Drawer, Online Sync, Shift Handover CTA & Walk-in */}
      <div className="flex items-center gap-2 font-mono text-xs shrink-0">
        {/* Cash in Drawer Pill — Guaranteed non-clipping with tabular nums */}
        <button
          onClick={onOpenShiftHandover}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-ink border border-brass-soft/40 hover:border-brass text-left transition-all shrink-0"
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

        {/* Sync Status Badge / Dot */}
        <div
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-ink border border-brass-soft/30 shrink-0"
          title={isOnline ? 'System is Online & Synced' : 'Offline / Local storage active'}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-signal-green pulse-green' : 'bg-signal-amber'}`} />
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider hidden sm:inline">
            {isOnline ? 'ONLINE' : 'LOCAL'}
          </span>
        </div>

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
