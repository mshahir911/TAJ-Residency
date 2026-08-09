import React from 'react';
import { ShieldCheck, UserCheck, Sparkles, Key, Lock, User, Clock, ChevronRight } from 'lucide-react';
import { STAFF_ROLES } from '../types/data';

export default function RoleSelector({
  currentStaff,
  onOpenLoginModal
}) {
  return (
    <div className="bg-ink border-b border-brass-soft/30 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      {/* Left: Active Staff Badge */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono uppercase text-brass-soft font-bold tracking-wider hidden sm:inline">
          LOGGED IN STAFF:
        </span>

        <div className="flex items-center gap-2 bg-panel-raised px-3 py-1 rounded-xl border border-brass-soft/40 shadow-sm">
          <img
            src={currentStaff?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={currentStaff?.name}
            className="w-5 h-5 rounded-full object-cover border border-brass-soft"
          />
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-bold text-white text-xs">{currentStaff?.name}</span>
            <span className="text-slate-400">•</span>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
              currentStaff?.role === 'owner'
                ? 'bg-brass/20 text-brass'
                : (currentStaff?.role === 'housekeeping' ? 'bg-blue-500/20 text-blue-400' : 'bg-signal-green/20 text-signal-green')
            }`}>
              {currentStaff?.roleLabel || currentStaff?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Shift Hours & Switch Account Button */}
      <div className="flex items-center gap-3 font-mono text-[11px]">
        <div className="text-slate-400 hidden md:flex items-center gap-1">
          <Clock className="w-3 h-3 text-brass" />
          <span>{currentStaff?.shift}</span>
        </div>

        <button
          onClick={onOpenLoginModal}
          className="px-3 py-1 rounded-lg bg-panel border border-brass-soft/50 hover:border-brass text-brass font-bold hover:bg-ink transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Lock className="w-3 h-3" />
          <span>Switch Staff / PIN Login</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
