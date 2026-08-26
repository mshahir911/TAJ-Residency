import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Coins,
  CreditCard,
  Smartphone,
  TrendingUp,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import GSTSettingsModal from './GSTSettingsModal';

export default function DailyCollectionsReport({
  invoices = [],
  stats = {},
  gstConfig = {},
  onUpdateGST,
  onUpdateGstConfig,
  property = {},
  onOpenGSTSettings
}) {
  const [showGstModal, setShowGstModal] = useState(false);
  const handleSaveGST = onUpdateGST || onUpdateGstConfig;

  const handleExportCSV = () => {
    const headers = 'Invoice No,Room,Guest Name,Phone,Nights,Room Charge,GST Amount,Total,Payment Mode,Settled At\n';
    const rows = invoices.map(inv => (
      `"${inv.id}","${inv.room_number}","${inv.guest_name}","${inv.guest_phone || ''}","${inv.nights}","${inv.room_charge}","${inv.gst_amount}","${inv.total}","${inv.payment_mode}","${inv.paid_at}"`
    )).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `taj_residency_collections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-panel border border-brass-soft/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brass/20 text-brass text-[10px] font-mono font-bold uppercase tracking-wider border border-brass/30">
              REVENUE & DAILY RECONCILIATION
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            Daily Collections & Settlement Report
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {property.name} • Night Auditor Register • Real-time Cash, UPI & Card Split
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGstModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-panel-raised border border-brass-soft/40 text-slate-200 hover:border-brass text-xs font-mono font-semibold transition-all"
          >
            <Percent className="w-3.5 h-3.5 text-brass" />
            <span>Configure GST Slabs</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-panel-raised border border-signal-green/40 text-signal-green hover:bg-signal-green hover:text-ink text-xs font-mono font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Revenue Split Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
        <div className="bg-panel border border-brass-soft/30 rounded-xl p-4 space-y-1 shadow-md">
          <span className="text-[10px] uppercase text-slate-400">Gross Day Revenue</span>
          <div className="text-2xl font-bold text-brass font-display">
            {formatCurrency(stats.totalRevenueToday)}
          </div>
          <div className="text-[10px] text-slate-400">Total Checkouts: {invoices.length}</div>
        </div>

        <div className="bg-panel border border-brass-soft/30 rounded-xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-slate-400">Cash in Drawer</span>
            <Coins className="w-3.5 h-3.5 text-signal-green" />
          </div>
          <div className="text-2xl font-bold text-signal-green font-display">
            {formatCurrency(stats.cashRevenue)}
          </div>
          <div className="text-[10px] text-slate-400">Desk Handover Tally</div>
        </div>

        <div className="bg-panel border border-brass-soft/30 rounded-xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-slate-400">UPI / QR Collections</span>
            <Smartphone className="w-3.5 h-3.5 text-brass" />
          </div>
          <div className="text-2xl font-bold text-white font-display">
            {formatCurrency(stats.upiRevenue)}
          </div>
          <div className="text-[10px] text-slate-400">GPay / PhonePe Batch</div>
        </div>

        <div className="bg-panel border border-brass-soft/30 rounded-xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-slate-400">Card POS Swiped</span>
            <CreditCard className="w-3.5 h-3.5 text-signal-amber" />
          </div>
          <div className="text-2xl font-bold text-white font-display">
            {formatCurrency(stats.cardRevenue)}
          </div>
          <div className="text-[10px] text-slate-400">HDFC Terminal Slip</div>
        </div>
      </div>

      {/* Itemized Invoices Table */}
      <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 space-y-3">
        <h3 className="font-display font-bold text-white text-base">
          Settled Checkout Invoices Register
        </h3>

        <div className="bg-ink rounded-xl border border-brass-soft/30 overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-panel-raised text-[10px] uppercase text-slate-400 border-b border-brass-soft/20">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Room</th>
                <th className="p-3">Guest Details</th>
                <th className="p-3 text-center">Nights</th>
                <th className="p-3 text-right">Room Tariff</th>
                <th className="p-3 text-right">GST Tax</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-center">Payment Mode</th>
                <th className="p-3 text-right">Settled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brass-soft/10">
              {invoices.map((inv, idx) => (
                <tr key={inv.id || idx} className="hover:bg-panel/40 transition-colors">
                  <td className="p-3 font-bold text-brass">{inv.id}</td>
                  <td className="p-3 font-bold text-white">Room {inv.room_number}</td>
                  <td className="p-3">
                    <div className="font-sans font-medium text-slate-200">{inv.guest_name}</div>
                    <div className="text-[11px] text-slate-400">{inv.guest_phone || '—'}</div>
                  </td>
                  <td className="p-3 text-center text-slate-300">{inv.nights}</td>
                  <td className="p-3 text-right text-slate-300">{formatCurrency(inv.room_charge)}</td>
                  <td className="p-3 text-right text-slate-400">{formatCurrency(inv.gst_amount)}</td>
                  <td className="p-3 text-right font-bold text-white">{formatCurrency(inv.total)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.payment_mode === 'Cash'
                        ? 'bg-signal-green/20 text-signal-green'
                        : (inv.payment_mode === 'UPI' ? 'bg-brass/20 text-brass' : 'bg-panel-raised text-slate-200')
                      }`}>
                      {inv.payment_mode}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-400 text-[11px]">{inv.paid_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-featured GST Configuration Modal */}
      <GSTSettingsModal
        isOpen={showGstModal}
        onClose={() => setShowGstModal(false)}
        gstConfig={gstConfig}
        property={property}
        onSaveGSTSettings={handleSaveGST}
      />
    </div>
  );
}
