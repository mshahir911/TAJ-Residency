import React from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  Percent,
  IndianRupee,
  Users,
  Layers,
  ArrowUpRight,
  Sparkles,
  Flame,
  ShieldCheck,
  Tag,
  Wallet
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function OwnerAnalyticsDashboard({
  stats,
  property,
  heatmapData = [],
  seasonalOverrides = [],
  onOpenOverrides,
  onOpenExpenses,
  onOpenOnboarding
}) {
  // Helper for heatmap cell color intensity
  const getCellColor = (val) => {
    if (val >= 95) return 'bg-brass text-ink font-bold shadow-md shadow-brass/20';
    if (val >= 80) return 'bg-signal-green text-ink font-bold shadow-md shadow-signal-green/20';
    if (val >= 65) return 'bg-signal-amber text-ink font-bold';
    if (val >= 50) return 'bg-slate-700 text-slate-100';
    return 'bg-panel-raised text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-panel border border-brass-soft/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brass/20 text-brass text-[10px] font-mono font-bold uppercase tracking-wider border border-brass/30 flex items-center gap-1">
              <Award className="w-3 h-3" />
              OWNER EXECUTIVE INTELLIGENCE & METRICS
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white mt-1">
            {property.name} Financial Performance
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time RevPAR, average daily rates, occupancy heatmaps, and dynamic yield management.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={onOpenOverrides}
            className="px-3.5 py-2 rounded-xl bg-panel-raised border border-brass-soft/50 text-brass hover:border-brass font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Seasonal Rates ({seasonalOverrides.length})</span>
          </button>

          <button
            onClick={onOpenExpenses}
            className="px-3.5 py-2 rounded-xl bg-brass text-ink font-bold transition-all flex items-center gap-1.5 hover:brightness-110 shadow-lg shadow-brass/20"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Monthly P&L Ledger</span>
          </button>
        </div>
      </div>

      {/* 4 Headline Metrics (Fraunces & JetBrains Mono) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. ADR */}
        <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden group hover:border-brass/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Average Daily Rate (ADR)</span>
            <span className="p-1 rounded-md bg-brass/10 text-brass">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-brass">
            {formatCurrency(stats.adr)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-brass-soft/15">
            <span>Per Paid Room Night</span>
            <span className="text-signal-green font-bold flex items-center">
              +14.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 2. RevPAR */}
        <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden group hover:border-brass/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>RevPAR (Yield / Room)</span>
            <span className="p-1 rounded-md bg-signal-green/10 text-signal-green">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-signal-green">
            {formatCurrency(stats.revPar)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-brass-soft/15">
            <span>Total Rev / Inventory ({stats.totalRooms} Rms)</span>
            <span className="text-signal-green font-bold">Strong</span>
          </div>
        </div>

        {/* 3. Occupancy Velocity */}
        <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden group hover:border-brass/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Occupancy Velocity</span>
            <span className="p-1 rounded-md bg-signal-amber/10 text-signal-amber">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl text-white">
              {stats.occupancyPct}%
            </span>
            <span className="text-xs font-mono text-slate-400">Today</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-brass-soft/15">
            <span>Week: <strong className="text-slate-200">{stats.occupancyWeekPct}%</strong></span>
            <span>Month: <strong className="text-slate-200">{stats.occupancyMonthPct}%</strong></span>
          </div>
        </div>

        {/* 4. Repeat Guest Loyalty */}
        <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden group hover:border-brass/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Repeat Guest Ratio</span>
            <span className="p-1 rounded-md bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-blue-400">
            {stats.repeatGuestPct}%
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-brass-soft/15">
            <span>Returning Customer Base</span>
            <span className="text-brass font-bold">High Loyalty</span>
          </div>
        </div>
      </div>

      {/* 7-Day x 4-Week Day-of-Week Occupancy Heatmap */}
      <div className="bg-panel border border-brass-soft/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-brass" />
              <h3 className="font-display font-bold text-lg text-white">
                Day-of-Week × 4-Week Occupancy Heatmap
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Identifies peak weekend compression and weekday troughs to guide dynamic seasonal pricing.
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <span>Low (40%)</span>
            <span className="w-3.5 h-3.5 rounded bg-panel-raised"></span>
            <span className="w-3.5 h-3.5 rounded bg-slate-700"></span>
            <span className="w-3.5 h-3.5 rounded bg-signal-amber"></span>
            <span className="w-3.5 h-3.5 rounded bg-signal-green"></span>
            <span className="w-3.5 h-3.5 rounded bg-brass"></span>
            <span>Peak (100%)</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="bg-ink p-4 rounded-xl border border-brass-soft/30 overflow-x-auto">
          <table className="w-full text-center font-mono text-xs">
            <thead>
              <tr className="text-[11px] uppercase text-slate-400 border-b border-brass-soft/20">
                <th className="p-2.5 text-left">Day of Week</th>
                <th className="p-2.5">Week 1 (Past)</th>
                <th className="p-2.5">Week 2</th>
                <th className="p-2.5">Week 3</th>
                <th className="p-2.5">Week 4 (Current)</th>
                <th className="p-2.5 text-right">Avg Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brass-soft/10">
              {heatmapData.map(row => {
                const avg = Math.round((row.w1 + row.w2 + row.w3 + row.w4) / 4);
                return (
                  <tr key={row.day} className="hover:bg-panel/50 transition-colors">
                    <td className="p-2.5 text-left font-bold text-white">{row.day}</td>
                    <td className="p-2.5">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs ${getCellColor(row.w1)}`}>
                        {row.w1}%
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs ${getCellColor(row.w2)}`}>
                        {row.w2}%
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs ${getCellColor(row.w3)}`}>
                        {row.w3}%
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs ${getCellColor(row.w4)}`}>
                        {row.w4}%
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-brass">{avg}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
