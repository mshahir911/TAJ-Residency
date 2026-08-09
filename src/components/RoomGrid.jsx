import React, { useState } from 'react';
import KeycardRoom from './KeycardRoom';
import {
  Layers,
  BedDouble,
  TrendingUp,
  Coins,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Percent,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function RoomGrid({
  rooms = [],
  bookings = {},
  guests = [],
  stats = {},
  onNewBooking,
  onCheckout,
  onMarkClean,
  onOpenWiFi,
  onExtendStay
}) {
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const floors = ['all', '2', '3'];
  const statuses = [
    { id: 'all', label: 'All 11 Rooms', count: rooms.length },
    { id: 'vacant', label: 'Vacant', count: stats.vacantRooms },
    { id: 'occupied', label: 'Occupied', count: stats.occupiedRooms },
    { id: 'reserved', label: 'Reserved', count: stats.reservedRooms },
    { id: 'dirty', label: 'Turnover / HK', count: stats.dirtyRooms }
  ];

  const filteredRooms = rooms.filter(r => {
    if (selectedFloor !== 'all' && r.floor !== Number(selectedFloor)) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'vacant' && !(r.status === 'vacant' || r.status === 'ready')) return false;
      if (statusFilter === 'dirty' && !(r.status === 'dirty' || r.status === 'cleaning' || r.status === 'clean')) return false;
      if (statusFilter !== 'vacant' && statusFilter !== 'dirty' && r.status !== statusFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metric Hierarchy Strip: 1 Dominant Hero Revenue Card + 3 Secondary Cards */}
      {/* 2x2 grid on mobile & tablet, 4-column row on wide desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* HERO METRIC 1: Today Total Revenue (Noticeably 1.5x larger, Soft Brass Glow & Blur Elevation) */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 hero-stat-card rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-brass font-semibold">
              Today Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-brass/20 border border-brass/40 flex items-center justify-center text-brass font-bold font-mono text-sm shadow-sm">
              ₹
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight leading-none whitespace-nowrap">
              {formatCurrency(stats.totalRevenueToday)}
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-300 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-green" />
              <span>Invoices & Advances Settled</span>
            </div>
          </div>
        </div>

        {/* SECONDARY CARD 2: Total Occupancy % */}
        <div className="secondary-stat-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-400">
              Occupancy
            </span>
            <div className="w-7 h-7 rounded-lg bg-panel-raised border border-brass-soft/30 flex items-center justify-center text-slate-300">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-display font-bold text-white leading-none">
              {stats.occupancyPct}%
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
              {stats.occupiedRooms + stats.reservedRooms} of {stats.totalRooms} Booked
            </div>
          </div>
        </div>

        {/* SECONDARY CARD 3: Available Keys */}
        <div className="secondary-stat-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-400">
              Available Keys
            </span>
            <div className="w-7 h-7 rounded-lg bg-signal-green/10 border border-signal-green/30 flex items-center justify-center text-signal-green">
              <BedDouble className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-display font-bold text-signal-green leading-none">
              {stats.vacantRooms} Vacant
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
              {stats.dirtyRooms > 0 ? `${stats.dirtyRooms} Need HK` : 'All Clean'}
            </div>
          </div>
        </div>

        {/* SECONDARY CARD 4: Daily Collections Breakdown */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 secondary-stat-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-400">
              Payment Split
            </span>
            <div className="w-7 h-7 rounded-lg bg-panel-raised border border-brass-soft/30 flex items-center justify-center text-signal-green">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-2 space-y-0.5 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cash:</span>
              <span className="text-signal-green font-bold whitespace-nowrap">{formatCurrency(stats.cashRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">UPI/Card:</span>
              <span className="text-brass font-bold whitespace-nowrap">{formatCurrency(stats.upiRevenue + stats.cardRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip: Floor Tabs & Status Filters (Unambiguous Filled Brass Active State) */}
      <div className="bg-panel/90 border border-brass-soft/30 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 shadow-md select-none">
        
        {/* Floor Selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Layers className="w-3 h-3 text-brass" /> Floor:
          </span>
          {floors.map(floor => {
            const isFloorSelected = selectedFloor === floor;
            return (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono transition-all shrink-0 ${
                  isFloorSelected
                    ? 'bg-brass text-ink font-bold shadow-md shadow-brass/20'
                    : 'bg-panel-raised text-slate-300 hover:text-white border border-brass-soft/20'
                }`}
              >
                {floor === 'all' ? 'All Floors' : `Floor ${floor}`}
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills with Unambiguous Filled Brass Active State */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map(s => {
            const isSelected = statusFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'filter-btn-active font-bold'
                    : 'filter-btn-inactive'
                }`}
              >
                <span>{s.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-ink/30 text-ink' : 'bg-ink text-slate-300'
                  }`}
                >
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Signature Keycard Grid — Responsive 2-column on phone, 3 on tablet, 4 on desktop */}
      <div className="room-grid-container">
        {filteredRooms.map((room, idx) => {
          const booking = room.current_booking_id ? bookings[room.current_booking_id] : null;
          const guest = booking ? guests.find(g => g.id === booking.guest_id) : null;

          return (
            <KeycardRoom
              key={room.id}
              room={room}
              booking={booking}
              guest={guest}
              index={idx}
              onNewBooking={onNewBooking}
              onCheckout={onCheckout}
              onMarkClean={onMarkClean}
              onOpenWiFi={onOpenWiFi}
              onExtendStay={onExtendStay}
            />
          );
        })}
      </div>
    </div>
  );
}
