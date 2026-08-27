import React, { useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  MessageSquare,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Smartphone,
  Coins,
  ShieldCheck,
  Building2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatCurrency, formatBusinessDateDisplay } from '../utils/formatters';
import TajLogo from './TajLogo';

export default function EndOfDayReportModal({
  isOpen,
  onClose,
  reportData,
  property = {},
  ownerEmail = 'mshahir911@gmail.com',
  ownerWhatsApp = '8590650154'
}) {
  // ESC key listener for modal back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.classList.add('has-open-invoice');
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.classList.remove('has-open-invoice');
      document.body.classList.remove('is-printing-invoice');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !reportData) return null;

  const {
    date,
    totalCollections = 0,
    cashCollections = 0,
    upiCollections = 0,
    cardCollections = 0,
    grossRoomCharge = 0,
    discountTotal = 0,
    gstTotal = 0,
    cgstTotal = 0,
    sgstTotal = 0,
    checkInsCount = 0,
    checkOutsCount = 0,
    occupancyPct = 0,
    totalRooms = 11,
    invoices = [],
    shiftLogs = [],
    totalDiscrepancy = 0,
    auditLogs = [],
    expenses = [],
    totalExpenses = 0,
    netCashInDrawer = 0
  } = reportData;

  const displayDate = formatBusinessDateDisplay(date);
  const hotelName = property?.name || 'Taj Residency';
  const gstin = property?.gst_number || '32AABCT9988Q1Z4';

  const handlePrint = () => {
    document.body.classList.add('is-printing-invoice');
    const cleanup = () => {
      document.body.classList.remove('is-printing-invoice');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 2000);
  };

  const handleDownloadHTML = () => {
    const reportElement = document.getElementById('printable-eod-report');
    const reportHtml = reportElement ? reportElement.outerHTML : '';
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EOD Reconciliation Report - ${date} - ${hotelName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #F4F6F9;
      color: #11161D;
      margin: 0;
      padding: 24px;
    }
    .report-wrapper {
      max-width: 820px;
      margin: 0 auto;
      background: #F2EFE6;
      border: 1px solid #D5D0C2;
      border-radius: 12px;
      padding: 36px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .report-wrapper { border: none; box-shadow: none; padding: 0; background: #fff; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="report-wrapper">
    ${reportHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Taj_Residency_EOD_Report_${date}.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = (ownerWhatsApp || '8590650154').replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    const text = `🏛️ *${hotelName.toUpperCase()} — DAILY CLOSING & EOD AUDIT REPORT*
📅 *Business Date:* ${displayDate} (${date})

💰 *FINANCIAL COLLECTIONS:*
• Gross Tariff: ₹${grossRoomCharge.toLocaleString('en-IN')}
${discountTotal > 0 ? `• Concessions/Discounts: -₹${discountTotal.toLocaleString('en-IN')}\n` : ''}• GST Collected (12%): ₹${gstTotal.toLocaleString('en-IN')}
• *Total Collections Today:* *₹${totalCollections.toLocaleString('en-IN')}*

💳 *PAYMENT MODE BREAKDOWN:*
• 💵 Cash: ₹${cashCollections.toLocaleString('en-IN')}
• 📱 UPI / GPay: ₹${upiCollections.toLocaleString('en-IN')}
• 💳 Card / Bank: ₹${cardCollections.toLocaleString('en-IN')}

🏨 *OCCUPANCY & COUNTER STATS:*
• Check-ins Today: *${checkInsCount}*
• Check-outs Billed: *${checkOutsCount}*
• Active Occupancy: *${occupancyPct}%* (${totalRooms} Rooms Inventory)
${totalExpenses > 0 ? `• Operational Expenses: ₹${totalExpenses.toLocaleString('en-IN')}\n` : ''}${totalDiscrepancy !== 0 ? `⚠️ Cash Drawer Discrepancy: ₹${totalDiscrepancy}\n` : '✅ Cash Drawer Tally: Exact Match\n'}
GSTIN: ${gstin} | SAC: 996311
_Automated Midnight Audit Summary • Taj Residency FrontDesk OS_`;

    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const subject = `[EOD REPORT] ${hotelName} — Daily Closing ${date}`;
    const body = `End-of-Day Audit Report for ${displayDate} (${date})\n\nTotal Collections: Rs. ${totalCollections}\nCash: Rs. ${cashCollections}\nUPI: Rs. ${upiCollections}\nCard: Rs. ${cardCollections}\n\nCheck-ins: ${checkInsCount}\nCheck-outs: ${checkOutsCount}\nOccupancy: ${occupancyPct}%\n\nPlease view the attached HTML summary in the PMS.\n\nTaj Residency FrontDesk OS`;
    window.open(`mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay invoice-modal-overlay flex flex-col items-center justify-start p-2 sm:p-6 backdrop-blur-md bg-black/85 animate-in fade-in duration-200">
      <div className="bg-[#F2EFE6] text-[#11161D] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-2 sm:my-6 flex flex-col font-sans border border-[#D5D0C2] relative invoice-modal-card">
        
        {/* Sticky Top Action Bar */}
        <div className="sticky top-0 z-30 p-3 sm:p-4 bg-[#0E1420]/95 backdrop-blur-xl border-b border-brass/40 flex items-center justify-between no-print text-white shadow-xl gap-2 flex-wrap rounded-t-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-panel hover:bg-ink text-brass hover:text-white border border-brass-soft/50 font-mono text-xs font-bold transition-all shrink-0 active:scale-95 shadow"
              title="Return to Collections view"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
            <div className="min-w-0">
              <span className="text-white font-bold text-xs sm:text-sm font-display block truncate">
                End-of-Day Reconciliation
              </span>
              <span className="text-[10px] text-brass font-mono block">
                {displayDate} &bull; Official Closing Report
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-panel hover:bg-ink border border-brass-soft/40 hover:border-brass text-slate-200 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0"
              title="Print EOD Report"
            >
              <Printer className="w-3.5 h-3.5 text-brass" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHTML}
              className="px-3 py-1.5 rounded-xl bg-panel hover:bg-ink border border-brass-soft/40 hover:border-brass text-slate-200 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0"
              title="Download HTML File"
            >
              <Download className="w-3.5 h-3.5 text-signal-green" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-ink font-mono font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
              title={`WhatsApp to Owner (${ownerWhatsApp})`}
            >
              <MessageSquare className="w-3.5 h-3.5 fill-ink" />
              <span>WhatsApp Owner</span>
            </button>

            <button
              type="button"
              onClick={handleShareEmail}
              className="px-3 py-1.5 rounded-xl bg-brass text-ink font-mono font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
              title={`Email to ${ownerEmail}`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Email Owner</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/40 transition-colors shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Document (Styled with PaperInvoice Palette) */}
        <div id="printable-eod-report" className="p-4 sm:p-8 bg-[#F2EFE6] text-[#11161D] font-sans space-y-6">
          
          {/* Header */}
          <div className="border-b-2 border-[#11161D] pb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TajLogo className="w-8 h-8 text-[#C9A24B]" />
                <h1 className="font-display font-black text-2xl tracking-tight text-[#11161D] uppercase">
                  {hotelName}
                </h1>
              </div>
              <p className="text-xs text-[#555] font-mono">
                {property?.address || 'NH 766, Adivaram, Kozhikode, Kerala 673586'}
              </p>
              <p className="text-[11px] text-[#555] font-mono">
                GSTIN: <span className="font-bold text-[#11161D]">{gstin}</span> &bull; SAC Code: <span className="font-bold text-[#11161D]">996311</span> (Hotel Accommodation)
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="px-3 py-1 rounded bg-[#11161D] text-[#C9A24B] font-mono font-bold text-xs uppercase tracking-widest inline-block">
                END-OF-DAY AUDIT REPORT
              </span>
              <div className="font-mono text-xs text-[#11161D]">
                Business Date: <span className="font-bold text-base block">{displayDate}</span>
              </div>
              <p className="text-[10px] text-[#777] font-mono">
                Generated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST
              </p>
            </div>
          </div>

          {/* Key Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#D5D0C2] shadow-sm">
              <span className="text-[10px] font-mono uppercase text-[#777] font-bold block">TOTAL SETTLED REVENUE</span>
              <span className="font-display font-extrabold text-xl sm:text-2xl text-[#11161D] block mt-0.5">
                {formatCurrency(totalCollections)}
              </span>
              <span className="text-[10px] font-mono text-[#2E7D32] font-semibold block mt-0.5">
                {invoices.length} Bills Settled
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#D5D0C2] shadow-sm">
              <span className="text-[10px] font-mono uppercase text-[#777] font-bold block">OCCUPANCY RATE</span>
              <span className="font-display font-extrabold text-xl sm:text-2xl text-[#11161D] block mt-0.5">
                {occupancyPct}%
              </span>
              <span className="text-[10px] font-mono text-[#777] block mt-0.5">
                {totalRooms} Total Rooms
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#D5D0C2] shadow-sm">
              <span className="text-[10px] font-mono uppercase text-[#777] font-bold block">CHECK-INS / OUTS</span>
              <span className="font-display font-extrabold text-xl sm:text-2xl text-[#11161D] block mt-0.5">
                {checkInsCount} / {checkOutsCount}
              </span>
              <span className="text-[10px] font-mono text-[#777] block mt-0.5">
                Front Desk Volume
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#D5D0C2] shadow-sm">
              <span className="text-[10px] font-mono uppercase text-[#777] font-bold block">GST COLLECTED (12%)</span>
              <span className="font-display font-extrabold text-xl sm:text-2xl text-[#11161D] block mt-0.5">
                {formatCurrency(gstTotal)}
              </span>
              <span className="text-[10px] font-mono text-[#777] block mt-0.5">
                CGST + SGST (Kerala 32)
              </span>
            </div>
          </div>

          {/* Two-Column Financial & Cash Reconciliation Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Payment Mode Distribution */}
            <div className="p-4 rounded-xl bg-white border border-[#D5D0C2] space-y-3">
              <h3 className="font-display font-bold text-sm text-[#11161D] border-b border-[#E5E0D2] pb-2 flex items-center justify-between">
                <span>Collections by Payment Mode</span>
                <span className="font-mono text-xs font-normal text-[#666]">Settled Today</span>
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-[#FAF8F5]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Coins className="w-4 h-4 text-[#C9A24B]" />
                    <span>Physical Cash</span>
                  </span>
                  <span className="font-bold text-[#11161D]">{formatCurrency(cashCollections)}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#FAF8F5]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Smartphone className="w-4 h-4 text-[#2E7D32]" />
                    <span>UPI / GPay / QR</span>
                  </span>
                  <span className="font-bold text-[#11161D]">{formatCurrency(upiCollections)}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#FAF8F5]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CreditCard className="w-4 h-4 text-[#1565C0]" />
                    <span>Card / POS / Transfer</span>
                  </span>
                  <span className="font-bold text-[#11161D]">{formatCurrency(cardCollections)}</span>
                </div>

                <div className="pt-2 border-t border-[#D5D0C2] flex items-center justify-between font-bold text-sm">
                  <span>TOTAL NET COLLECTIONS:</span>
                  <span className="text-[#C9A24B]">{formatCurrency(totalCollections)}</span>
                </div>
              </div>
            </div>

            {/* GST Tax & Concession Ledger */}
            <div className="p-4 rounded-xl bg-white border border-[#D5D0C2] space-y-3">
              <h3 className="font-display font-bold text-sm text-[#11161D] border-b border-[#E5E0D2] pb-2 flex items-center justify-between">
                <span>Tax Ledger & Concessions</span>
                <span className="font-mono text-xs font-normal text-[#666]">Kerala GST Compliance</span>
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#666]">Gross Room Tariff:</span>
                  <span className="font-bold text-[#11161D]">{formatCurrency(grossRoomCharge)}</span>
                </div>

                {discountTotal > 0 && (
                  <div className="flex items-center justify-between text-[#D32F2F]">
                    <span>Special Discounts / Concessions:</span>
                    <span className="font-bold">- {formatCurrency(discountTotal)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#666]">Taxable Room Value:</span>
                  <span className="font-bold text-[#11161D]">{formatCurrency(Math.max(0, grossRoomCharge - discountTotal))}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#666]">CGST (6% Central GST):</span>
                  <span className="text-[#11161D]">{formatCurrency(cgstTotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#666]">SGST (6% Kerala State GST):</span>
                  <span className="text-[#11161D]">{formatCurrency(sgstTotal)}</span>
                </div>

                <div className="pt-2 border-t border-[#D5D0C2] flex items-center justify-between font-bold text-sm">
                  <span>TOTAL TAX COLLECTED:</span>
                  <span className="text-[#2E7D32]">{formatCurrency(gstTotal)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Cash Drawer & Shift Handover Reconciliation */}
          <div className="p-4 rounded-xl bg-white border border-[#D5D0C2] space-y-2.5">
            <h3 className="font-display font-bold text-sm text-[#11161D] flex items-center justify-between">
              <span>Cash Drawer & Shift Handover Status</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                totalDiscrepancy === 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
              }`}>
                {totalDiscrepancy === 0 ? '✓ EXACT CASH DRAWER TALLY' : `⚠️ DISCREPANCY: ${formatCurrency(totalDiscrepancy)}`}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
              <div>
                <span className="text-[#777] block text-[10px]">CASH COLLECTED:</span>
                <span className="font-bold text-[#11161D]">{formatCurrency(cashCollections)}</span>
              </div>
              <div>
                <span className="text-[#777] block text-[10px]">OPERATIONAL EXPENSES:</span>
                <span className="font-bold text-[#D32F2F]">- {formatCurrency(totalExpenses)}</span>
              </div>
              <div>
                <span className="text-[#777] block text-[10px]">NET CASH IN DRAWER:</span>
                <span className="font-bold text-[#2E7D32]">{formatCurrency(netCashInDrawer)}</span>
              </div>
              <div>
                <span className="text-[#777] block text-[10px]">SHIFTS LOGGED:</span>
                <span className="font-bold text-[#11161D]">{shiftLogs.length || 1} Shifts</span>
              </div>
            </div>
          </div>

          {/* Itemized Settlement Table */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm text-[#11161D]">
              Itemized Settlements on {date} ({invoices.length} Invoices)
            </h3>

            {invoices.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-[#D5D0C2] text-center text-xs font-mono text-[#777]">
                No check-out settlements recorded on this business date.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#D5D0C2] bg-white">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#FAF8F5] border-b border-[#D5D0C2] text-[#666]">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Room</th>
                      <th className="p-2.5">Guest Name</th>
                      <th className="p-2.5">Nights</th>
                      <th className="p-2.5">Mode</th>
                      <th className="p-2.5 text-right">Taxable</th>
                      <th className="p-2.5 text-right">GST</th>
                      <th className="p-2.5 text-right">Total Settled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D2]">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-[#FAF8F5]">
                        <td className="p-2.5 font-bold text-[#11161D]">{inv.id}</td>
                        <td className="p-2.5 font-bold text-[#C9A24B]">Room {inv.room_number}</td>
                        <td className="p-2.5">{inv.guest_name}</td>
                        <td className="p-2.5">{inv.nights} N</td>
                        <td className="p-2.5 uppercase font-bold text-[10px]">{inv.payment_mode}</td>
                        <td className="p-2.5 text-right">{formatCurrency(inv.room_charge)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(inv.gst_amount)}</td>
                        <td className="p-2.5 text-right font-bold text-[#11161D]">{formatCurrency(inv.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer & Signoff */}
          <div className="pt-4 border-t-2 border-[#11161D] flex flex-wrap items-center justify-between text-xs font-mono text-[#555] gap-4">
            <div>
              <p className="font-bold text-[#11161D]">Taj Residency Management System</p>
              <p className="text-[10px]">Owner: Muhammed Shahir ({ownerEmail} &bull; +91 {ownerWhatsApp})</p>
              <p className="text-[10px]">Certified authentic end-of-day register. Retain for tax audit.</p>
            </div>

            <div className="text-right">
              <div className="h-10 border-b border-[#555] w-48 mb-1"></div>
              <p className="text-[10px] uppercase font-bold text-[#11161D]">Authorized Front Desk Manager Signoff</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
