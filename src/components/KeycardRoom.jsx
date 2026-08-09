import React from 'react';
import {
  Bed,
  CheckCircle2,
  AlertCircle,
  Receipt,
  UserPlus,
  Clock,
  Sparkles,
  Phone,
  Calendar,
  Fan,
  Wind,
  Wifi,
  Key,
  Plus
} from 'lucide-react';
import { ROOM_TYPES } from '../types/data';
import { formatCurrency } from '../utils/formatters';

export default function KeycardRoom({
  room,
  booking,
  guest,
  onNewBooking,
  onCheckout,
  onMarkClean,
  onOpenWiFi,
  onExtendStay,
  index
}) {
  const roomType = (ROOM_TYPES && ROOM_TYPES[room.room_type_id]) || ROOM_TYPES?.deluxe || { name: 'Room', ac_rate: 2000, non_ac_rate: 1500 };
  const isVacant = room.status === 'vacant' || room.status === 'ready';
  const isOccupied = room.status === 'occupied';
  const isReserved = room.status === 'reserved';
  const isDirty = room.status === 'dirty';
  const isCleaning = room.status === 'cleaning';
  const isClean = room.status === 'clean';

  let statusClass = 'status-vacant';
  let statusColor = 'text-signal-green';
  let statusLabel = 'Vacant';
  let pulseDot = 'bg-signal-green pulse-green';

  if (isOccupied) {
    statusClass = 'status-occupied';
    statusColor = 'text-signal-red';
    statusLabel = 'Occupied';
    pulseDot = 'bg-signal-red pulse-red';
  } else if (isReserved) {
    statusClass = 'status-reserved';
    statusColor = 'text-signal-amber';
    statusLabel = 'Reserved';
    pulseDot = 'bg-signal-amber pulse-amber';
  } else if (isDirty) {
    statusClass = 'status-dirty';
    statusColor = 'text-signal-red';
    statusLabel = 'Dirty';
    pulseDot = 'bg-signal-red';
  } else if (isCleaning) {
    statusClass = 'status-reserved';
    statusColor = 'text-signal-amber';
    statusLabel = 'Cleaning';
    pulseDot = 'bg-signal-amber pulse-amber';
  } else if (isClean) {
    statusClass = 'status-vacant';
    statusColor = 'text-blue-400';
    statusLabel = 'Cleaned';
    pulseDot = 'bg-blue-400';
  }

  return (
    <div
      style={{ animationDelay: `${(index || 0) * 30}ms` }}
      className={`keycard-card stagger-fade-in ${statusClass} group select-none p-3 sm:p-4 flex flex-col justify-between transition-all`}
    >
      {/* Top Strip: Keycard Header & High-Contrast Typography */}
      <div>
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-brass-soft font-semibold block leading-none mb-1">
              KEYCARD PASS
            </span>
            {/* High visual contrast: Room number in Fraunces bold wins the eye instantly */}
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-none">
                {room.room_number}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono font-medium">
                F{room.floor}
              </span>
            </div>
          </div>

          {/* Status Pill Badge — Guaranteed complete word */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 rounded-full bg-ink/90 border border-brass-soft/40 shrink-0">
            <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shrink-0 ${pulseDot}`} />
            <span className={`text-[9px] sm:text-[10px] uppercase font-mono font-bold whitespace-nowrap ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Room Type & Base Tariffs */}
        <div className="mt-2 text-xs border-b border-brass-soft/20 pb-1.5">
          <div className="font-display font-semibold text-slate-300 text-xs sm:text-sm truncate">
            {roomType.name}
          </div>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] font-mono text-slate-400 mt-0.5">
            <span className="flex items-center gap-0.5 text-brass font-bold whitespace-nowrap">
              <Wind className="w-2.5 sm:w-3 h-2.5 sm:h-3 shrink-0" /> AC: ₹{roomType.ac_rate}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-0.5 text-slate-300 whitespace-nowrap">
              <Fan className="w-2.5 sm:w-3 h-2.5 sm:h-3 shrink-0" /> Non-AC: ₹{roomType.non_ac_rate}
            </span>
          </div>
        </div>

        {/* Dynamic Center Context based on Status */}
        <div className="my-2 min-h-[75px] sm:min-h-[85px] flex flex-col justify-center">
          
          {/* 1. OCCUPIED CARD */}
          {isOccupied && booking && (
            <div className="bg-ink/80 rounded-xl p-2 sm:p-2.5 border border-brass-soft/30 space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-brass uppercase font-bold">
                <span>In-House Guest</span>
                <span className="px-1 py-0.2 rounded bg-brass/20 text-brass text-[9px]">
                  {booking.ac_or_non_ac}
                </span>
              </div>
              <div className="font-bold text-white text-xs sm:text-sm truncate">
                {guest?.name || room.last_guest_name || 'In-House Guest'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 truncate">
                <Phone className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-brass shrink-0" />
                <span className="truncate">{guest?.phone || '+91 98470 11223'}</span>
              </div>

              {/* Stay Days & WiFi Pass */}
              <div className="flex items-center justify-between pt-1 border-t border-brass-soft/20 text-[9px] sm:text-[10px]">
                <span className="text-slate-400 truncate">
                  Stay: <strong className="text-white">{booking.nights || 1} Night</strong>
                </span>
                {room.wifi_voucher_code && (
                  <button
                    type="button"
                    onClick={() => onOpenWiFi && onOpenWiFi(room, booking)}
                    className="text-brass hover:underline flex items-center gap-0.5 shrink-0 font-bold"
                  >
                    <Wifi className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                    <span>WiFi</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. RESERVED CARD */}
          {isReserved && (
            <div className="bg-signal-amber/10 rounded-xl p-2 sm:p-2.5 border border-signal-amber/30 space-y-0.5 font-mono text-xs">
              <div className="text-[9px] sm:text-[10px] text-signal-amber uppercase font-bold">
                Due In Tonight
              </div>
              <div className="font-bold text-white text-xs sm:text-sm truncate">
                Rohan & Ananya Varma
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                Adv: ₹1,500 (UPI)
              </div>
            </div>
          )}

          {/* 3. VACANT CARD */}
          {isVacant && (
            <div className="py-1 sm:py-2 text-center space-y-0.5">
              <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-signal-green/15 border border-signal-green/40 mx-auto flex items-center justify-center text-signal-green shadow-inner">
                <Bed className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </div>
              <div className="text-[11px] sm:text-xs text-signal-green font-mono font-bold tracking-wide">
                Available Keys
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400">
                Fresh linen • 15s check-in
              </div>
            </div>
          )}

          {/* 4. DIRTY / CLEANING / CLEAN */}
          {(isDirty || isCleaning || isClean) && (
            <div className="py-1 space-y-1">
              <div className="bg-slate-800/80 rounded-lg p-1.5 sm:p-2 border border-slate-700 text-[10px] sm:text-[11px]">
                <div className="text-slate-400 text-[9px] font-mono uppercase font-bold">Housekeeping</div>
                <div className="font-medium text-slate-200 text-[10px] sm:text-xs leading-tight">
                  {isDirty ? 'Needs Sanitization' : (isCleaning ? 'Cleaning In Progress' : 'Cleaned & Ready')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="mt-1.5 pt-1.5 border-t border-brass-soft/20">
        
        {/* Vacant: Gold/Yellow Walk-In button */}
        {isVacant && (
          <button
            type="button"
            onClick={() => onNewBooking(room)}
            className="w-full py-2 px-2 sm:px-3 rounded-xl bg-[#C9A24B] hover:bg-[#E5B855] text-[#070B11] font-display font-black text-[11px] sm:text-xs tracking-wider active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1 cursor-pointer border border-brass-soft ring-1 ring-brass/40"
            style={{
              backgroundColor: '#C9A24B',
              color: '#070B11',
              fontWeight: '900',
              boxShadow: '0 4px 12px rgba(201, 162, 75, 0.35)'
            }}
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[3] text-[#070B11] shrink-0" />
            <span className="font-black uppercase tracking-tight text-[#070B11] whitespace-nowrap text-[10px] sm:text-xs">
              Walk-In Check-In
            </span>
          </button>
        )}

        {/* Occupied: Solid Emerald Check Out & Bill */}
        {isOccupied && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onCheckout(room)}
              className="w-full py-2 px-2 sm:px-3 rounded-xl bg-[#3FCF8E] hover:bg-[#4EEDA5] text-[#070B11] font-display font-black text-[11px] sm:text-xs tracking-wider active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1 cursor-pointer border border-signal-green ring-1 ring-signal-green/50 uppercase"
              style={{
                backgroundColor: '#3FCF8E',
                color: '#070B11',
                fontWeight: '900',
                boxShadow: '0 4px 12px rgba(63, 207, 142, 0.35)'
              }}
            >
              <Receipt className="w-3.5 h-3.5 stroke-[3] text-[#070B11] shrink-0" />
              <span className="font-black tracking-tight text-[#070B11] truncate">
                Check Out & Bill
              </span>
            </button>

            {/* Quick 1-Tap Stay Extension */}
            {onExtendStay && (
              <button
                type="button"
                onClick={() => onExtendStay(room.id, 1)}
                className="w-full py-1 px-1.5 rounded-lg bg-ink hover:bg-panel text-brass border border-brass-soft/40 hover:border-brass font-mono text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                title="Extend guest stay by 1 Day"
              >
                <span>Extend 1 Day</span>
              </button>
            )}
          </div>
        )}

        {isReserved && (
          <button
            type="button"
            onClick={() => onNewBooking(room)}
            className="w-full py-2 px-2 rounded-xl bg-signal-amber text-ink font-bold text-[11px] sm:text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-signal-amber/20 flex items-center justify-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="truncate">Check In Guest</span>
          </button>
        )}

        {(isDirty || isCleaning || isClean) && (
          <button
            type="button"
            onClick={() => onMarkClean(room)}
            className="w-full py-2 px-2 rounded-xl bg-slate-700 hover:bg-signal-green hover:text-ink text-slate-200 font-bold text-[11px] sm:text-xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Advance ({statusLabel})</span>
          </button>
        )}

        {/* Decorative Keycard Barcode Texture Strip */}
        <div className="barcode-texture mt-1.5 rounded-sm" title="Keycard Barcode" />
      </div>
    </div>
  );
}
