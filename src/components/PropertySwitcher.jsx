import React, { useState } from 'react';
import { Building2, ChevronDown, Plus, Check, MapPin, Sparkles } from 'lucide-react';
import TajLogo from './TajLogo';

export default function PropertySwitcher({
  properties = [],
  activePropertyId,
  onSwitchProperty,
  onOpenOnboarding
}) {
  const [isOpen, setIsOpen] = useState(false);

  const activeProp = properties.find(p => p.id === activePropertyId) || properties[0] || {};

  return (
    <div className="relative inline-block z-50 text-left">
      {/* Property Switcher Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-panel-raised border border-brass-soft/40 hover:border-brass text-left transition-all shadow-md group active:scale-[0.99]"
      >
        <TajLogo size={32} />

        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-white text-xs truncate max-w-[160px] sm:max-w-[220px]">
              {activeProp.name || 'Taj Residency'}
            </span>
            <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-brass/20 text-brass font-bold shrink-0">
              {activeProp.city || 'Adivaram'}
            </span>
          </div>
          <p className="text-[10px] text-[#C9A24B] font-mono truncate max-w-[180px] font-semibold">
            📍 Adivaram • 9961701414
          </p>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-brass transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-brass' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu & Backdrop */}
      {isOpen && (
        <>
          {/* Global click-outside backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating Dropdown anchored right below the button */}
          <div
            className="absolute top-full left-0 mt-2 w-80 sm:w-88 z-50 bg-panel-raised border border-brass/70 rounded-2xl p-2.5 shadow-2xl shadow-black/95 space-y-2 animate-in fade-in zoom-in-95 duration-150"
            style={{ minWidth: '320px' }}
          >
            <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-brass font-bold flex justify-between items-center border-b border-brass-soft/30">
              <span>Managed Properties ({properties.length})</span>
              <span className="text-signal-green px-1.5 py-0.2 rounded bg-signal-green/15 text-[9px]">Multi-Tenant</span>
            </div>

            {/* List of Properties */}
            <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
              {properties.map(p => {
                const isSelected = p.id === activePropertyId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSwitchProperty(p.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-ink border border-brass text-white shadow-md'
                        : 'hover:bg-panel border border-brass-soft/20 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-xs text-white truncate">
                          {p.name}
                        </span>
                        <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-brass/20 text-brass">
                          {p.total_rooms || 11} Rms
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-2.5 h-2.5 text-brass shrink-0" />
                        <span className="truncate">{p.city || p.address}</span>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-brass text-ink flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-brass/30">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 hover:text-brass shrink-0 mt-1">
                        Switch →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Onboard New Hotel CTA */}
            <div className="pt-2 border-t border-brass-soft/30">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenOnboarding();
                }}
                className="w-full py-2 px-3 rounded-xl bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 active:scale-95 transition-all flex items-center justify-center gap-2 font-mono"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Onboard New Hotel (Setup Wizard)</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
