import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Coins,
  CreditCard,
  Smartphone,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  FileText,
  MessageSquare,
  ChevronRight,
  Clock,
  UserCheck,
  LogOut
} from 'lucide-react';
import { formatCurrency, formatBusinessDateDisplay, getBusinessDateIST } from '../utils/formatters';
import { calculateReconciliationForDate } from '../store/pmsStore';
import GSTSettingsModal from './GSTSettingsModal';
import EndOfDayReportModal from './EndOfDayReportModal';

export default function DailyCollectionsReport({
  invoices = [],
  bookings = {},
  rooms = [],
  expenses = [],
  shiftLogs = [],
  auditLogs = [],
  stats = {},
  currentBusinessDay,
  onGetReconciliationForDate,
  gstConfig = {},
  onUpdateGST,
  onUpdateGstConfig,
  property = {},
  onOpenGSTSettings
}) {
  const todayStr = currentBusinessDay || getBusinessDateIST();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showGstModal, setShowGstModal] = useState(false);
  const [showEodModal, setShowEodModal] = useState(false);
  const handleSaveGST = onUpdateGST || onUpdateGstConfig;

  // Calculate reconciliation metrics for the selected business date
  const reconciliation = useMemo(() => {
    if (typeof onGetReconciliationForDate === 'function') {
      return onGetReconciliationForDate(selectedDate);
    }
    return calculateReconciliationForDate(selectedDate, {
      invoices,
      bookings,
      rooms,
      expenses,
      shiftLogs,
      auditLogs
    });
  }, [selectedDate, invoices, bookings, rooms, expenses, shiftLogs, auditLogs, onGetReconciliationForDate]);

  const isToday = selectedDate === todayStr;

  // Date selection helpers
  const handleSelectToday = () => setSelectedDate(todayStr);
  const handleSelectYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(getBusinessDateIST(d));
  };

  const handleExportCSV = () => {
    const activeInvoices = reconciliation.invoices || [];
    const headers = 'Invoice No,Room,Guest Name,Phone,Nights,Room Charge,GST Amount,Total,Payment Mode,Settled At\n';
    const rows = activeInvoices.map(inv => (
      `"${inv.id}","${inv.room_number}","${inv.guest_name}","${inv.guest_phone || ''}","${inv.nights}","${inv.room_charge}","${inv.gst_amount}","${inv.total}","${inv.payment_mode}","${inv.paid_at}"`
    )).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `taj_residency_collections_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsAppOwner = () => {
    const ownerWhatsApp = '918590650154';
    const hotelName = property?.name || 'Taj Residency';
    const text = `🏛️ *${hotelName.toUpperCase()} — DAILY CLOSING SUMMARY*
📅 *Business Date:* ${formatBusinessDateDisplay(selectedDate)} (${selectedDate})

💰 *COLLECTIONS TODAY:*
• 💵 Cash in Drawer: ₹${reconciliation.cashCollections.toLocaleString('en-IN')}
• 📱 UPI / QR: ₹${reconciliation.upiCollections.toLocaleString('en-IN')}
• 💳 Card / POS: ₹${reconciliation.cardCollections.toLocaleString('en-IN')}
• *Total Collections:* *₹${reconciliation.totalCollections.toLocaleString('en-IN')}*

📊 *KEY COUNTER METRICS:*
• Occupancy: *${reconciliation.occupancyPct}%*
• Check-ins Today: *${reconciliation.checkInsCount}*
• Check-outs Settled: *${reconciliation.checkOutsCount}*
• GST Collected (12%): *₹${reconciliation.gstTotal.toLocaleString('en-IN')}*

_Automated End-of-Day Tally • Taj Residency PMS_`;

    const url = `https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Business Date Controls */}
      <div className="bg-panel border border-brass-soft/40 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-brass/20 text-brass text-[10px] font-mono font-bold uppercase tracking-wider border border-brass/30">
              REVENUE & DAILY RECONCILIATION
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-ink text-slate-300 text-[10px] font-mono border border-brass-soft/20 flex items-center gap-1">
              <Clock className="w-3 h-3 text-brass" />
              <span>Midnight IST Rollover: Active</span>
            </span>
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
            Daily Collections & Settlement Report
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {property.name} &bull; Official Business Day Register &bull; Cash, UPI & Card Split
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowEodModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink border border-brass text-brass hover:bg-brass hover:text-ink text-xs font-mono font-bold transition-all shadow-md active:scale-95"
            title="Open printable EOD report with paper invoice styling"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Full EOD Report</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsAppOwner}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-ink text-xs font-mono font-bold transition-all shadow-md active:scale-95"
            title="Dispatch EOD summary to Owner WhatsApp (+91 8590650154)"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-ink" />
            <span>WhatsApp Owner</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panel-raised border border-signal-green/40 text-signal-green hover:bg-signal-green hover:text-ink text-xs font-mono font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panel-raised border border-brass-soft/40 hover:border-brass text-white text-xs font-mono font-bold transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-brass" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Date Picker Bar: Scoping by Business Day */}
      <div className="bg-panel border border-brass-soft/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brass" />
            <span>BUSINESS DAY:</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSelectToday}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                isToday
                  ? 'bg-brass text-ink shadow'
                  : 'bg-ink text-slate-300 hover:text-white border border-brass-soft/30'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={handleSelectYesterday}
              className="px-3 py-1 rounded-lg bg-ink text-slate-300 hover:text-white border border-brass-soft/30 font-mono text-xs font-bold transition-all"
            >
              Yesterday
            </button>
          </div>

          {/* Native HTML5 Date Picker for Historical Day Querying */}
          <div className="flex items-center gap-1.5 bg-ink border border-brass-soft/40 rounded-lg px-2.5 py-1">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>Active View: <strong className="text-brass">{formatBusinessDateDisplay(selectedDate)}</strong></span>
          <button
            type="button"
            onClick={() => setShowGstModal(true)}
            className="text-brass hover:underline flex items-center gap-1"
          >
            <Percent className="w-3 h-3" />
            <span>GST Slabs</span>
          </button>
        </div>
      </div>

      {/* Financial Settlement Cards for Selected Business Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
        <div className="bg-panel border border-brass-soft/40 rounded-xl p-4 space-y-1 shadow-md">
          <span className="text-[10px] uppercase text-slate-400 font-bold block">
            {isToday ? 'Today Collections (Total)' : `Collections on ${selectedDate}`}
          </span>
          <div className="text-2xl font-bold text-brass font-display">
            {formatCurrency(reconciliation.totalCollections)}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-brass-soft/10">
            <span>Settled: {reconciliation.invoices.length} Folios</span>
            <span>Advances: {reconciliation.advanceBookings.length}</span>
          </div>
        </div>

        <div className="bg-panel border border-brass-soft/30 rounded-xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-slate-400 font-bold">Cash in Drawer</span>
            <Coins className="w-4 h-4 text-signal-green" />
          </div>
          <div className="text-2xl font-bold text-signal-green font-display">
            {formatCurrency(reconciliation.cashCollections)}
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-brass-soft/10 flex items-center justify-between">
            <span>Net Drawer: {formatCurrency(reconciliation.netCashInDrawer)}</span>
            <span>Expenses: {formatCurrency(reconciliation.totalExpenses)}</span>
          </div>
        </div>

        <div className="bg-panel border border-brass-soft/30 rounded-xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-slate-400 font-bold">UPI / QR Collections</span>
            <Smartphone className="w-4 h-4 text-brass" />
          </div>
          <div className="text-2xl font-bold text-white font-display">
            {formatCurrency(reconciliation.upiCollections)}
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-brass-soft/10">
            Direct Bank Credit (Instant)
          </div>
        </div>

        <div className="bg-panel border border-brass-soft/30 rounded-xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-slate-400 font-bold">Card POS Swiped</span>
            <CreditCard className="w-4 h-4 text-signal-amber" />
          </div>
          <div className="text-2xl font-bold text-white font-display">
            {formatCurrency(reconciliation.cardCollections)}
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-brass-soft/10">
            HDFC / PineLabs Terminal
          </div>
        </div>
      </div>

      {/* Operational Highlights for Selected Day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-panel border border-brass-soft/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ink border border-brass-soft/30 flex items-center justify-center text-brass">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">CHECK-INS TODAY</span>
            <span className="font-bold text-white text-sm">{reconciliation.checkInsCount} Guests</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-panel border border-brass-soft/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ink border border-brass-soft/30 flex items-center justify-center text-rose-400">
            <LogOut className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">CHECK-OUTS BILLED</span>
            <span className="font-bold text-white text-sm">{reconciliation.checkOutsCount} Rooms</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-panel border border-brass-soft/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ink border border-brass-soft/30 flex items-center justify-center text-signal-green">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">ACTIVE OCCUPANCY</span>
            <span className="font-bold text-white text-sm">{reconciliation.occupancyPct}%</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-panel border border-brass-soft/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ink border border-brass-soft/30 flex items-center justify-center text-brass">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">GST TAX COLLECTED</span>
            <span className="font-bold text-white text-sm">{formatCurrency(reconciliation.gstTotal)}</span>
          </div>
        </div>
      </div>

      {/* Itemized Invoices Table for Selected Business Day */}
      <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
            <span>Settled Checkout Invoices</span>
            <span className="px-2 py-0.5 rounded bg-ink text-brass text-xs font-mono font-bold border border-brass-soft/30">
              {reconciliation.invoices.length} Bills
            </span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Showing records for: <strong className="text-white">{selectedDate}</strong>
          </span>
        </div>

        <div className="bg-ink rounded-xl border border-brass-soft/30 overflow-hidden font-mono text-xs">
          {reconciliation.invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-sans font-medium text-slate-300">
                No checkout invoices settled on {formatBusinessDateDisplay(selectedDate)}.
              </p>
              <p className="text-[11px] text-slate-500">
                Select another date using the date picker above to review past records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {reconciliation.invoices.map((inv, idx) => (
                    <tr key={inv.id || idx} className="hover:bg-panel/40 transition-colors">
                      <td className="p-3 font-bold text-brass">{inv.id}</td>
                      <td className="p-3 font-bold text-white">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{String(inv.room_number || '').includes(',') ? `Rooms ${inv.room_number}` : `Room ${inv.room_number}`}</span>
                          {inv.is_day_use && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-mono font-bold">
                              ⚡ Fresh-Up ({inv.group_size || 1} Pax)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-sans font-medium text-slate-200">{inv.guest_name}</div>
                        <div className="text-[11px] text-slate-400">{inv.guest_phone || '—'}</div>
                      </td>
                      <td className="p-3 text-center text-slate-300">{inv.nights}</td>
                      <td className="p-3 text-right text-slate-300">{formatCurrency(inv.room_charge)}</td>
                      <td className="p-3 text-right text-slate-400">{formatCurrency(inv.gst_amount)}</td>
                      <td className="p-3 text-right font-bold text-white">{formatCurrency(inv.total)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.payment_mode === 'Cash'
                            ? 'bg-signal-green/20 text-signal-green border border-signal-green/30'
                            : (inv.payment_mode === 'UPI' ? 'bg-brass/20 text-brass border border-brass/30' : 'bg-panel-raised text-slate-200 border border-slate-600')
                        }`}>
                          {inv.payment_mode}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400 text-[11px]">
                        {(inv.paid_at || '').slice(11, 16) || inv.paid_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* End of Day Printable Report Modal */}
      {showEodModal && (
        <EndOfDayReportModal
          isOpen={showEodModal}
          onClose={() => setShowEodModal(false)}
          reportData={reconciliation}
          property={property}
          ownerEmail="mshahir911@gmail.com"
          ownerWhatsApp="8590650154"
        />
      )}

      {/* GST Configuration Modal */}
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
