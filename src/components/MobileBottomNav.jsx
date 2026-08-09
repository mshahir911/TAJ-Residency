import React, { useState } from 'react';
import {
  LayoutGrid,
  FileSpreadsheet,
  Users,
  MoreHorizontal,
  UserPlus,
  Sparkles,
  Wallet,
  QrCode,
  Search,
  TrendingUp,
  Tag,
  ShieldCheck,
  Building2,
  Lock,
  LogOut,
  X,
  ChevronRight
} from 'lucide-react';

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  onOpenWalkIn,
  onOpenSearch,
  onOpenStaffAdmin,
  onSignOut,
  dirtyCount = 0,
  property = {},
  currentStaff = {},
  currentRole = 'desk'
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Housekeeping role has a simpler set of bottom tabs
  if (currentRole === 'housekeeping') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-panel/95 backdrop-blur-md border-t border-brass-soft/30 px-4 py-2 flex items-center justify-between pb-safe shadow-2xl">
        <button
          onClick={() => setActiveTab('housekeeping')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'housekeeping'
              ? 'text-brass font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-tight">HK Board</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1 bg-ink/80 rounded-xl border border-brass-soft/30">
          <img
            src={currentStaff?.avatar}
            alt={currentStaff?.name}
            className="w-6 h-6 rounded-lg object-cover border border-brass-soft"
          />
          <span className="text-xs text-white font-medium truncate max-w-[90px]">
            {currentStaff?.name}
          </span>
          <button
            onClick={onSignOut}
            className="p-1 rounded-lg text-slate-400 hover:text-signal-red hover:bg-signal-red/15 transition-colors ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Primary 4 tabs for desk and owner
  const mainTabs = [
    { id: 'grid', label: 'Room Grid', icon: LayoutGrid },
    { id: 'collections', label: 'Collections', icon: FileSpreadsheet },
    { id: 'guests', label: 'Guests', icon: Users }
  ];

  return (
    <>
      {/* Fixed Bottom Tab Bar */}
      <nav
        id="mobile-bottom-navigation"
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E1420]/95 backdrop-blur-lg border-t border-brass-soft/30 px-3 py-2 flex items-center justify-around pb-safe shadow-2xl select-none"
      >
        {/* Tab 1: Room Grid */}
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'grid'
              ? 'text-brass font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <LayoutGrid className="w-5 h-5" />
            {activeTab === 'grid' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brass shadow-sm shadow-brass" />
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">Grid</span>
        </button>

        {/* Tab 2: Collections */}
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'collections'
              ? 'text-brass font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <FileSpreadsheet className="w-5 h-5" />
            {activeTab === 'collections' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brass shadow-sm shadow-brass" />
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">Collections</span>
        </button>

        {/* Center Prominent Fast Walk-In Button */}
        <div className="flex-1 flex justify-center -mt-4">
          <button
            onClick={onOpenWalkIn}
            className="w-12 h-12 rounded-2xl bg-brass text-ink flex items-center justify-center shadow-lg shadow-brass/30 hover:brightness-110 active:scale-95 transition-all border border-brass-soft ring-2 ring-ink"
            title="Fast Walk-In (15s)"
          >
            <UserPlus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Guests CRM */}
        <button
          onClick={() => setActiveTab('guests')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'guests'
              ? 'text-brass font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {activeTab === 'guests' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brass shadow-sm shadow-brass" />
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">Guests</span>
        </button>

        {/* Tab 4: More Drawer Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            isMoreOpen || (activeTab !== 'grid' && activeTab !== 'collections' && activeTab !== 'guests')
              ? 'text-brass font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {dirtyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-signal-red pulse-red" />
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">More</span>
        </button>
      </nav>

      {/* Slide-Up "More" Bottom Sheet Drawer */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-fade-in select-none">
          <div
            className="w-full bg-[#121826] border-t border-brass/30 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl animate-slide-up"
            style={{
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(201, 162, 75, 0.15)'
            }}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-brass-soft/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-panel-raised border border-brass flex items-center justify-center">
                  <span className="font-display font-bold text-brass text-sm">TR</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-sm">
                    {property?.name || 'Taj Residency'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {currentStaff?.name} • {currentStaff?.roleLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-slate-400 hover:text-white border border-brass-soft/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search in Sheet */}
            <button
              onClick={() => {
                setIsMoreOpen(false);
                onOpenSearch();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-ink border border-brass-soft/30 text-slate-300 text-xs hover:border-brass transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-brass" />
                <span>Search guest phone, folio, room...</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-panel-raised text-[10px] font-mono text-brass border border-brass-soft/40">
                ⌘K
              </kbd>
            </button>

            {/* Drawer Options List */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1">
                Desk Operations
              </div>

              {/* Housekeeping Board */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  setActiveTab('housekeeping');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  activeTab === 'housekeeping'
                    ? 'bg-panel-raised text-white border-brass'
                    : 'bg-ink/70 text-slate-300 border-brass-soft/20 hover:border-brass-soft/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Housekeeping Board</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {dirtyCount > 0 ? `${dirtyCount} Dirty Rooms Pending` : 'All 11 Rooms Clean'}
                    </div>
                  </div>
                </div>
                {dirtyCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-signal-red/20 text-signal-red font-mono text-xs font-bold">
                    {dirtyCount}
                  </span>
                )}
              </button>

              {/* Shift Handover */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  setActiveTab('shift');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-ink/70 text-slate-300 border border-brass-soft/20 hover:border-brass-soft/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-signal-green/10 border border-signal-green/30 flex items-center justify-center text-signal-green">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Shift Handover & Drawer Cash</div>
                    <div className="text-[10px] text-slate-400 font-mono">Reconcile cash & notes</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* QR Self Check-in Queue */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  setActiveTab('self-checkin');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-ink/70 text-slate-300 border border-brass-soft/20 hover:border-brass-soft/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brass/10 border border-brass/30 flex items-center justify-center text-brass">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">QR Self-Checkin Queue</div>
                    <div className="text-[10px] text-slate-400 font-mono">Instant digital check-in</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Owner-Specific Items */}
              {currentRole === 'owner' && (
                <>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 pt-2">
                    Owner Oversight
                  </div>

                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      setActiveTab('analytics');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      activeTab === 'analytics'
                        ? 'bg-panel-raised text-white border-brass'
                        : 'bg-ink/70 text-slate-300 border-brass-soft/20 hover:border-brass-soft/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brass/10 border border-brass/30 flex items-center justify-center text-brass">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Owner Analytics & Yield</div>
                        <div className="text-[10px] text-slate-400 font-mono">Heatmaps & RevPAR</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      setActiveTab('pl');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      activeTab === 'pl'
                        ? 'bg-panel-raised text-white border-brass'
                        : 'bg-ink/70 text-slate-300 border-brass-soft/20 hover:border-brass-soft/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-signal-green/10 border border-signal-green/30 flex items-center justify-center text-signal-green">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Monthly P&L & Expenses</div>
                        <div className="text-[10px] text-slate-400 font-mono">Ledger & profit margins</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      setActiveTab('overrides');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-ink/70 text-slate-300 border border-brass-soft/20 hover:border-brass-soft/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-signal-amber/10 border border-signal-amber/30 flex items-center justify-center text-signal-amber">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Seasonal Rate Overrides</div>
                        <div className="text-[10px] text-slate-400 font-mono">Dynamic peak tariffs</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenStaffAdmin();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-ink/70 text-slate-300 border border-brass-soft/20 hover:border-brass-soft/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-panel-raised border border-brass-soft/30 flex items-center justify-center text-slate-300">
                        <Lock className="w-4 h-4 text-brass" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Staff Admin & PINs</div>
                        <div className="text-[10px] text-slate-400 font-mono">Security access control</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      setActiveTab('audit');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      activeTab === 'audit'
                        ? 'bg-panel-raised text-white border-brass'
                        : 'bg-ink/70 text-slate-300 border-brass-soft/20 hover:border-brass-soft/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-panel-raised border border-brass-soft/30 flex items-center justify-center text-slate-300">
                        <ShieldCheck className="w-4 h-4 text-brass" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Operations Audit Trail</div>
                        <div className="text-[10px] text-slate-400 font-mono">Audit logs & bill events</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Actions: Sign Out */}
            <div className="pt-3 border-t border-brass-soft/20">
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-signal-red/15 text-signal-red border border-signal-red/30 hover:bg-signal-red/25 font-bold text-xs transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Lock Counter & Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
