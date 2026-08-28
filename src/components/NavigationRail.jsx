import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  UserPlus,
  FileSpreadsheet,
  Users,
  Sparkles,
  ShieldCheck,
  QrCode,
  Wallet,
  Clock,
  Search,
  TrendingUp,
  Tag,
  Building2,
  Lock,
  LogOut,
  Percent,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import TajLogo from './TajLogo';
import { getInitialTheme, toggleTheme } from '../utils/theme';

export default function NavigationRail({
  activeTab,
  setActiveTab,
  onOpenWalkIn,
  onOpenSearch,
  onOpenStaffAdmin,
  onOpenGSTSettings,
  onOpenFreshUpTiers,
  onSignOut,
  dirtyCount,
  property,
  currentStaff,
  currentRole = 'desk',
  isCollapsed = false
}) {
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
  let navItems = [];

  if (currentRole === 'housekeeping') {
    navItems = [
      { id: 'housekeeping', label: 'Housekeeping Board', icon: Sparkles, shortcut: 'H' }
    ];
  } else if (currentRole === 'owner') {
    navItems = [
      { id: 'grid', label: 'Room Grid', icon: LayoutGrid, shortcut: 'G' },
      { id: 'collections', label: 'Daily Collections', icon: FileSpreadsheet, shortcut: 'D' },
      { id: 'guests', label: 'Guest Directory & CRM', icon: Users, shortcut: 'U' },
      { id: 'analytics', label: 'Owner Analytics & Yield', icon: TrendingUp, shortcut: 'O' },
      { id: 'pl', label: 'Monthly P&L & Expenses', icon: Wallet, shortcut: 'P' },
      { id: 'gst', label: 'GST & Payment Settings', icon: Percent, shortcut: 'T' },
      { id: 'overrides', label: 'Seasonal Rate Overrides', icon: Tag, shortcut: 'R' },
      { id: 'freshup', label: 'Fresh-Up Group Slabs', icon: Zap, shortcut: 'F' },
      { id: 'staff', label: 'Staff Admin & PINs', icon: Users, shortcut: 'S' },
      { id: 'audit', label: 'Operations Audit Trail', icon: ShieldCheck, shortcut: 'A' },
      { id: 'onboarding', label: 'Property Setup Wizard', icon: Building2, shortcut: 'W' }
    ];
  } else {
    // Receptionist (Anoop Nair / Suresh Babu)
    navItems = [
      { id: 'grid', label: 'Room Grid', icon: LayoutGrid, shortcut: 'G' },
      { id: 'collections', label: 'Daily Collections', icon: FileSpreadsheet, shortcut: 'D' },
      { id: 'guests', label: 'Guest Directory & CRM', icon: Users, shortcut: 'U' },
      { id: 'self-checkin', label: 'QR Self-Checkin Queue', icon: QrCode, shortcut: 'Q' },
      { id: 'shift', label: 'Shift Handover & Cash', icon: Wallet, shortcut: 'S' },
      { id: 'housekeeping', label: 'Housekeeping Board', icon: Sparkles, shortcut: 'H' }
    ];
  }

  return (
    <aside className="w-64 bg-ink border-r border-brass-soft/30 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Top Brand & Navigation */}
      <div>
        <div className="p-4 pb-3 border-b border-brass-soft/20 flex items-center gap-3">
          <TajLogo size={38} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-bold text-white text-sm tracking-wide leading-tight truncate">
                {property.name.toUpperCase()}
              </h1>
              <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-brass/15 text-brass border border-brass/30">
                PMS
              </span>
            </div>
            <p className="text-[10px] text-[#C9A24B] font-mono tracking-tight truncate font-semibold">
              ADIVARAM • 9961701414
            </p>
          </div>
        </div>

        {/* Quick Search Action */}
        {currentRole !== 'housekeeping' && (
          <div className="p-3">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-panel border border-brass-soft/30 text-slate-400 hover:text-white hover:border-brass/50 transition-all text-xs group"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-brass group-hover:scale-110 transition-transform" />
                <span>Search phone, guest...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-panel-raised border border-brass-soft/40 text-[10px] font-mono text-brass">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="px-2 space-y-1 mt-1">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            {currentRole === 'owner' 
              ? 'Owner Oversight & Finance' 
              : (currentRole === 'housekeeping' ? 'Mobile Room Cleaning' : 'Front Desk Counter Shift')}
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'staff') {
                    onOpenStaffAdmin();
                  } else if (item.id === 'gst') {
                    onOpenGSTSettings();
                  } else if (item.id === 'freshup') {
                    if (typeof onOpenFreshUpTiers === 'function') onOpenFreshUpTiers();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-panel-raised text-white border border-brass/40 shadow-lg shadow-brass/5 font-semibold'
                    : 'text-slate-300 hover:bg-panel hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-brass' : 'text-slate-400 group-hover:text-brass'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <kbd
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-opacity ${
                    isActive
                      ? 'bg-brass/20 text-brass border border-brass/30'
                      : 'opacity-40 group-hover:opacity-100 text-slate-400'
                  }`}
                >
                  {item.shortcut}
                </kbd>
              </button>
            );
          })}
        </nav>

        {/* Rapid Walk-in CTA (Desk & Owner) */}
        {currentRole !== 'housekeeping' && (
          <div className="px-3 mt-4">
            <button
              onClick={onOpenWalkIn}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-brass text-ink font-semibold text-xs shadow-lg shadow-brass/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Fast Walk-In (15s)</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Logged-in Staff Bar & Sign Out */}
      <div className="p-3 border-t border-brass-soft/20 bg-panel/70 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={currentStaff?.avatar}
              alt={currentStaff?.name}
              className="w-8 h-8 rounded-lg object-cover border border-brass-soft shrink-0"
            />
            <div className="min-w-0">
              <div className="font-bold text-white text-xs truncate leading-tight">
                {currentStaff?.name}
              </div>
              <div className={`text-[9px] font-mono uppercase font-bold truncate ${
                currentRole === 'owner' ? 'text-brass' : (currentRole === 'housekeeping' ? 'text-blue-400' : 'text-signal-green')
              }`}>
                {currentStaff?.roleLabel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-1.5 rounded-lg bg-ink hover:bg-panel text-slate-400 hover:text-brass border border-brass-soft/30 transition-all active:scale-95"
              title={theme === 'dark' ? "Switch to White Theme" : "Switch to Dark Theme"}
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-brass" />
              ) : (
                <Sun className="w-4 h-4 text-signal-amber" />
              )}
            </button>

            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg bg-ink hover:bg-signal-red/20 text-slate-400 hover:text-signal-red border border-brass-soft/30 transition-colors active:scale-95"
              title="Lock Counter / Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dirty Rooms Counter */}
        <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-ink border border-brass-soft/20 text-slate-400">
          <span>Housekeeping:</span>
          <span className={`font-bold ${dirtyCount > 0 ? 'text-signal-red' : 'text-signal-green'}`}>
            {dirtyCount} Dirty Rooms
          </span>
        </div>
      </div>
    </aside>
  );
}
