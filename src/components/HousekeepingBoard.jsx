import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Check,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BedDouble
} from 'lucide-react';
import { ROOM_TYPES } from '../types/data';

export default function HousekeepingBoard({
  rooms,
  onAdvanceStatus,
  staffName = 'Housekeeping Staff'
}) {
  const [selectedFloor, setSelectedFloor] = useState('all');

  const filteredRooms = rooms.filter(r => {
    if (selectedFloor !== 'all' && r.floor !== Number(selectedFloor)) return false;
    return true;
  });

  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;
  const cleaningCount = rooms.filter(r => r.status === 'cleaning').length;
  const cleanCount = rooms.filter(r => r.status === 'clean').length;
  const readyCount = rooms.filter(r => r.status === 'ready' || r.status === 'vacant').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'dirty':
        return { label: 'DIRTY / NEED LINEN', bg: 'bg-signal-red/20', text: 'text-signal-red', nextLabel: 'Start Cleaning →', border: 'border-signal-red' };
      case 'cleaning':
        return { label: 'CLEANING IN PROGRESS', bg: 'bg-signal-amber/20', text: 'text-signal-amber', nextLabel: 'Mark Cleaned →', border: 'border-signal-amber' };
      case 'clean':
        return { label: 'CLEANED (AWAITING INSPECTION)', bg: 'bg-blue-500/20', text: 'text-blue-400', nextLabel: 'Inspect & Ready →', border: 'border-blue-500' };
      case 'ready':
        return { label: 'READY FOR CHECK-IN', bg: 'bg-signal-green/20', text: 'text-signal-green', nextLabel: 'Mark Active Vacant ✓', border: 'border-signal-green' };
      case 'occupied':
        return { label: 'OCCUPIED (GUEST IN-HOUSE)', bg: 'bg-panel-raised', text: 'text-slate-400', nextLabel: 'Guest In Room', border: 'border-slate-700' };
      case 'reserved':
        return { label: 'RESERVED (ARRIVING TODAY)', bg: 'bg-signal-amber/15', text: 'text-signal-amber', nextLabel: 'Guest Arriving', border: 'border-signal-amber/40' };
      default:
        return { label: 'VACANT / READY', bg: 'bg-signal-green/20', text: 'text-signal-green', nextLabel: 'All Set ✓', border: 'border-signal-green' };
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Mobile-Friendly Top Banner */}
      <div className="bg-panel border border-brass-soft/40 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-green pulse-green"></span>
            <h2 className="font-display font-bold text-xl text-white">
              Housekeeping Board (1-Tap Mobile UI)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Designed for front-line mobile staff. Tap a room card to advance its cleaning stage.
          </p>
        </div>

        {/* Status Counters Strip */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-signal-red/20 text-signal-red border border-signal-red/30 font-bold">
            {dirtyCount} Dirty
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-signal-amber/20 text-signal-amber border border-signal-amber/30 font-bold">
            {cleaningCount} Cleaning
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-signal-green/20 text-signal-green border border-signal-green/30 font-bold">
            {readyCount} Ready
          </span>
        </div>
      </div>

      {/* Floor Filter Tabs (Large touch targets) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', '2', '3'].map(floor => (
          <button
            key={floor}
            onClick={() => setSelectedFloor(floor)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              selectedFloor === floor
                ? 'bg-brass text-ink shadow-lg shadow-brass/20'
                : 'bg-panel border border-brass-soft/40 text-slate-300 hover:text-white'
            }`}
          >
            {floor === 'all' ? 'All Floors (11 Rooms)' : `Floor ${floor}`}
          </button>
        ))}
      </div>

      {/* 1-Tap Large Room Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredRooms.map(room => {
          const badge = getStatusBadge(room.status);
          const isActionable = ['dirty', 'cleaning', 'clean', 'ready'].includes(room.status);

          return (
            <div
              key={room.id}
              className={`bg-panel-raised border ${badge.border} rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3 transition-transform active:scale-[0.98] select-none`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                      FLOOR {room.floor} • {ROOM_TYPES[room.room_type_id]?.name.toUpperCase()}
                    </span>
                    <h3 className="font-display font-bold text-4xl text-white mt-0.5">
                      {room.room_number}
                    </h3>
                  </div>

                  <span className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>

                {room.last_guest_name && (
                  <div className="mt-2 text-[11px] font-mono text-slate-400 bg-ink p-2 rounded-lg border border-brass-soft/20">
                    Checked out: <span className="text-slate-200">{room.last_guest_name}</span> at {room.checked_out_at || '10:30'}
                  </div>
                )}
              </div>

              {/* Huge 1-Tap Action Button */}
              {isActionable ? (
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(room.id, staffName)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                    room.status === 'dirty'
                      ? 'bg-signal-red text-white hover:brightness-110'
                      : room.status === 'cleaning'
                      ? 'bg-signal-amber text-ink hover:brightness-110'
                      : room.status === 'clean'
                      ? 'bg-blue-500 text-white hover:brightness-110'
                      : 'bg-signal-green text-ink hover:brightness-110'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{badge.nextLabel}</span>
                </button>
              ) : (
                <div className="py-2.5 px-3 rounded-xl bg-ink border border-brass-soft/20 text-center text-xs font-mono text-slate-400">
                  {room.status === 'occupied' ? '🔒 Guest In-House' : (room.status === 'reserved' ? '⏳ Reserved Guest Due' : '✓ Ready for Check-in')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
