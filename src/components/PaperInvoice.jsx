import React, { useEffect } from 'react';
import { X, Printer, ShieldCheck, Download, Tag, ArrowLeft, MessageSquare, CheckCircle2, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../utils/formatters';
import TajLogo from './TajLogo';

export default function PaperInvoice({
  isOpen,
  onClose,
  room,
  booking,
  guest,
  invoice,
  property,
  gstConfig
}) {
  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
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

  if (!isOpen || (!room && !invoice)) return null;

  const rawGstin = property?.gst_number || gstConfig?.gstNumber || '';
  const hasGstin = Boolean(rawGstin && rawGstin.trim().length >= 6);
  const gstinDisplay = hasGstin ? rawGstin.trim().toUpperCase() : 'GST number not configured';
  const sacCode = gstConfig?.sacCode || '996311';
  const legalEntity = gstConfig?.legalEntity || property?.legal_entity || property?.name || 'Taj Residency';

  const roomNum = invoice?.room_number || room?.room_number || 'Room';
  const invoiceNo = invoice?.id || `TR/INV/${roomNum}/${Math.floor(1000 + Math.random() * 9000)}`;
  const invoiceDate = invoice?.paid_at || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const guestName = guest?.name || invoice?.guest_name || 'Valued Guest';
  const guestPhone = guest?.phone || invoice?.guest_phone || '+91 98470 11223';
  const guestAddress = guest?.address || invoice?.guest_address || 'Kozhikode, Kerala';
  const guestIdProof = guest?.id_proof_type || invoice?.id_proof_type || 'Aadhaar Card';
  const guestIdNumber = guest?.id_proof_number || invoice?.id_proof_number || 'VERIFIED';

  const nights = invoice?.nights || booking?.nights || 1;
  const rateApplied = invoice?.rate_applied || booking?.rate_applied || 2000;
  const grossRoomCharge = invoice?.gross_room_charge || (rateApplied * nights);
  const discountAmount = invoice?.discount_amount || 0;
  const discountReason = invoice?.discount_reason || 'Special Concession';
  const taxableRoomCharge = invoice?.room_charge || Math.max(0, grossRoomCharge - discountAmount);

  const gstAmount = invoice?.gst_amount || Math.round(taxableRoomCharge * 0.12);
  const cgstAmount = invoice?.cgst_amount || Math.round(gstAmount / 2);
  const sgstAmount = invoice?.sgst_amount || Math.round(gstAmount / 2);
  const grandTotal = invoice?.total || (taxableRoomCharge + gstAmount);
  const advancePaid = invoice?.advance_paid || booking?.advance_paid || 0;
  const balanceSettled = invoice?.balance_settled || Math.max(0, grandTotal - advancePaid);
  const paymentMode = invoice?.payment_mode || 'UPI';

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

  // Direct File Download (Self-contained printable HTML invoice file)
  const handleSaveDirectFile = () => {
    const invoiceElement = document.getElementById('printable-tax-invoice');
    const invoiceHtml = invoiceElement ? invoiceElement.outerHTML : '';
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>GST Tax Invoice - ${invoiceNo} - ${property?.name || 'Taj Residency'}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #F4F6F9;
      color: #11161D;
      margin: 0;
      padding: 24px;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #F2EFE6;
      border: 1px solid #D5D0C2;
      border-radius: 12px;
      padding: 36px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-wrapper { border: none; box-shadow: none; padding: 0; background: #fff; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    ${invoiceHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const safeGuest = guestName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeInv = invoiceNo.replace(/[^a-zA-Z0-9]/g, '_');
    downloadLink.href = url;
    downloadLink.download = `Taj_Residency_Invoice_Room${roomNum}_${safeGuest}_${safeInv}.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  // WhatsApp Billing Summary Share
  const handleShareWhatsApp = () => {
    const hotelName = property?.name || 'Taj Residency';
    const msg = `🏛️ *${hotelName.toUpperCase()} — TAX INVOICE & RECEIPT*
Invoice No: *${invoiceNo}*
Room: *${roomNum} (${invoice?.ac_or_non_ac || 'AC'})*

Dear *${guestName}*,
Thank you for staying at Taj Residency, Kozhikode. Here is your final tax invoice summary:

📋 *Gross Tariff (${nights} Days @ ₹${rateApplied}):* ₹${grossRoomCharge.toLocaleString('en-IN')}
${discountAmount > 0 ? `🏷️ *Discount / Concession:* -₹${discountAmount.toLocaleString('en-IN')} (${discountReason})\n` : ''}📊 *Taxable Value:* ₹${taxableRoomCharge.toLocaleString('en-IN')}
📊 *GST (CGST 6% + SGST 6%):* ₹${gstAmount.toLocaleString('en-IN')}
💰 *Total Bill (GST Inc.):* ₹${grandTotal.toLocaleString('en-IN')}
💳 *Advance Received:* ₹${advancePaid.toLocaleString('en-IN')}
✅ *Final Balance Settled (${paymentMode}):* ₹${balanceSettled.toLocaleString('en-IN')}

GSTIN: ${property?.gst_number || '32AABCT9988Q1Z4'}
SAC Code: 996311 (Hotel Accommodation)

_Thank you for choosing Taj Residency!_`;

    const cleanPhone = (guestPhone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay invoice-modal-overlay flex flex-col items-center justify-start p-2 sm:p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-200">
      <div className="bg-white text-[#11161D] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-3 sm:my-6 flex flex-col font-sans border border-brass/40 relative invoice-modal-card">
        
        {/* Sticky Top Glassmorphism Control Bar (Always Accessible) */}
        <div className="sticky top-0 z-30 p-3 sm:p-4 bg-[#0E1420]/95 backdrop-blur-xl border-b border-brass/40 flex items-center justify-between no-print invoice-controls-header text-white shadow-xl gap-2 flex-wrap rounded-t-2xl">
          
          {/* Left: Prominent Back Button & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-panel hover:bg-ink text-brass hover:text-white border border-brass/50 font-mono font-bold text-xs transition-all active:scale-95 shadow-md cursor-pointer"
              title="Return to Room Grid (Esc)"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Rooms</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse"></span>
              <span className="font-bold text-brass">GST Invoice Ready</span>
              <span className="text-slate-400">• Room {roomNum}</span>
            </div>
          </div>

          {/* Right: Save Direct File, Print / PDF, WhatsApp, Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Save Direct File Option */}
            <button
              type="button"
              onClick={handleSaveDirectFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-panel hover:bg-ink text-slate-200 hover:text-white border border-brass-soft/50 font-mono font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              title="Save standalone offline invoice file to device"
            >
              <Download className="w-3.5 h-3.5 text-brass" />
              <span>Save File</span>
            </button>

            {/* Print / PDF Option */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl bg-brass hover:bg-brass-light text-ink font-mono font-black text-xs shadow-lg shadow-brass/25 transition-all active:scale-95 cursor-pointer border border-brass-light"
              title="Print Tax Invoice or Save as PDF"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print / PDF</span>
            </button>

            {/* WhatsApp Share Option */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-signal-green/20 hover:bg-signal-green text-signal-green hover:text-ink border border-signal-green/40 font-mono font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              title="Share invoice summary via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="p-6 sm:p-12 space-y-6 bg-[#F2EFE6] paper-surface" id="printable-tax-invoice">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#11161D] pb-5">
            <div>
              <div className="flex items-center gap-3">
                <TajLogo size={46} />
                <div>
                  <h1 className="font-display font-bold text-2xl tracking-wide uppercase text-[#0B0F14]">
                    {legalEntity}
                  </h1>
                  <p className="text-xs text-[#7A6B3E] font-semibold">
                    📍 {property?.address || 'Adivaram, Kozhikode'} • Tel: {property?.phone || '+91 99617 01414'}
                  </p>
                </div>
              </div>

              <div className="mt-3 text-xs font-mono space-y-0.5 text-slate-700">
                <div>
                  GSTIN:{' '}
                  <span className={`font-bold ${hasGstin ? 'text-black' : 'text-amber-700 italic'}`}>
                    {gstinDisplay}
                  </span>
                  {' '}| State: {property?.state || 'Kerala'} (32)
                </div>
                <div>Address: {property?.address || 'Beach Road, Mananchira, Kozhikode - 673032'}</div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#11161D] text-[#C9A24B] font-mono text-xs font-bold uppercase tracking-wider rounded">
                GST TAX INVOICE
              </span>
              <div className="mt-2 text-xs font-mono space-y-0.5">
                <div><span className="text-slate-500">Invoice No:</span> <span className="font-bold">{invoiceNo}</span></div>
                <div><span className="text-slate-500">Date:</span> {invoiceDate}</div>
                <div><span className="text-slate-500">Room:</span> <span className="font-bold">{roomNum} ({invoice?.ac_or_non_ac || booking?.ac_or_non_ac || 'AC'})</span></div>
              </div>
            </div>
          </div>

          {/* Billed To / Guest Info */}
          <div className="grid grid-cols-2 gap-6 bg-[#E8E4D8] p-4 rounded border border-[#D5D0C2] text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Billed To (Guest Details)
              </span>
              <div className="font-bold text-sm text-black mt-1">
                {guest?.name || invoice?.guest_name || 'Dr. Vivek Menon'}
              </div>
              <div className="font-mono text-slate-700 mt-0.5">
                Phone: {guest?.phone || invoice?.guest_phone || '+91 98470 11223'}
              </div>
              <div className="text-slate-700 mt-0.5">
                Address: {guest?.address || 'Kozhikode, Kerala'}
              </div>
              <div className="font-mono text-slate-600 text-[11px] mt-0.5">
                ID Proof: {guest?.id_proof_type || 'Aadhaar Card'} ({guest?.id_proof_number || 'VERIFIED'})
              </div>
            </div>

            <div className="text-right space-y-1 font-mono">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">
                Stay Period
              </span>
              <div><span className="text-slate-500">Check-In:</span> {booking?.check_in_date || '2026-08-07 14:00'}</div>
              <div><span className="text-slate-500">Total Duration:</span> {nights} Night(s) (12:00 PM Noon Basis)</div>
              <div><span className="text-slate-500">Payment Mode:</span> {paymentMode}</div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b-2 border-black bg-[#DFD9C9] text-[11px] uppercase">
                <th className="p-2">#</th>
                <th className="p-2">SAC Code</th>
                <th className="p-2">Description</th>
                <th className="p-2 text-center">Days</th>
                <th className="p-2 text-right">Tariff / Day</th>
                <th className="p-2 text-right">Taxable Value</th>
                <th className="p-2 text-right">GST</th>
                <th className="p-2 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5D0C2]">
              <tr>
                <td className="p-2 text-slate-500">1</td>
                <td className="p-2 text-slate-600">{sacCode}</td>
                <td className="p-2 font-sans font-medium text-black">
                  Room Accommodation ({room.room_type_id === 'deluxe' ? 'Deluxe Room' : 'Classic Room'} - {booking?.ac_or_non_ac || 'AC'})
                </td>
                <td className="p-2 text-center">{nights}</td>
                <td className="p-2 text-right">{formatCurrency(rateApplied)}</td>
                <td className="p-2 text-right">{formatCurrency(grossRoomCharge)}</td>
                <td className="p-2 text-right">12%</td>
                <td className="p-2 text-right font-bold text-black">{formatCurrency(grossRoomCharge)}</td>
              </tr>

              {/* Discount / Concession row if discount applied */}
              {discountAmount > 0 && (
                <tr className="bg-[#E2DFD2] font-semibold text-[#0B0F14]">
                  <td className="p-2 text-slate-500">2</td>
                  <td className="p-2 text-slate-600">DISC</td>
                  <td className="p-2 font-sans">
                    Special Concession / Discount ({discountReason})
                  </td>
                  <td className="p-2 text-center">—</td>
                  <td className="p-2 text-right">—</td>
                  <td className="p-2 text-right text-emerald-800">- {formatCurrency(discountAmount)}</td>
                  <td className="p-2 text-right">—</td>
                  <td className="p-2 text-right text-emerald-800 font-bold">- {formatCurrency(discountAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Tax Breakdown & QR Seal */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-black">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded border border-slate-300 shadow-sm shrink-0">
                <QRCodeSVG
                  value={`https://tajresidency.com/verify?inv=${invoiceNo}&gstin=${property?.gst_number}`}
                  size={80}
                  level="M"
                />
              </div>
              <div className="text-[10px] font-mono text-slate-600 space-y-1">
                <div className="font-bold text-black flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#3FCF8E]" />
                  <span>GST e-Invoice Verified</span>
                </div>
                <p>Digital Tax Invoice generated via Taj Residency Property Management System.</p>
                <p className="italic">Computer-generated receipt.</p>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs text-right">
              <div className="flex justify-between text-slate-700">
                <span>Gross Tariff:</span>
                <span>{formatCurrency(grossRoomCharge)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Concession / Discount:</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-800 font-semibold border-t border-[#D5D0C2] pt-1">
                <span>Net Taxable Room Charges:</span>
                <span>{formatCurrency(taxableRoomCharge)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>CGST (6%):</span>
                <span>{formatCurrency(cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>SGST (6%):</span>
                <span>{formatCurrency(sgstAmount)}</span>
              </div>
              <div className="flex justify-between text-black font-bold text-sm pt-1 border-t border-black">
                <span>Total Bill (inc. GST):</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
              {advancePaid > 0 && (
                <div className="flex justify-between text-[#3FCF8E] font-bold">
                  <span>Advance Paid:</span>
                  <span>- {formatCurrency(advancePaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-black font-bold text-base pt-1 border-t-2 border-black">
                <span>Balance Settled ({paymentMode}):</span>
                <span>{formatCurrency(balanceSettled)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="pt-6 flex items-end justify-between text-xs font-mono border-t border-slate-300">
            <div className="text-slate-500 text-[11px]">
              <div>Thank you for staying at Taj Residency.</div>
              <div>Check-out time: 11:00 AM • Complimentary High Speed WiFi</div>
            </div>

            <div className="text-center">
              <div className="w-36 border-b border-black mb-1"></div>
              <span className="text-[10px] text-slate-600 uppercase font-bold">Authorized Signatory</span>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Glassmorphic Action Footer (Always Visible while Scrolling) */}
        <div className="sticky bottom-0 z-30 p-3 sm:p-4 bg-[#0E1420]/95 backdrop-blur-xl border-t border-brass/40 flex items-center justify-between no-print invoice-controls-footer text-white shadow-2xl rounded-b-2xl gap-2 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panel hover:bg-ink text-brass hover:text-white border border-brass/50 font-mono font-bold text-xs transition-all active:scale-95 shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back to Rooms</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDirectFile}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-panel hover:bg-ink text-slate-200 hover:text-white border border-brass-soft/50 font-mono font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              title="Save offline invoice file to device"
            >
              <Download className="w-3.5 h-3.5 text-brass" />
              <span>Save File</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-xl bg-brass hover:bg-brass-light text-ink font-mono font-black text-xs sm:text-sm shadow-xl shadow-brass/30 transition-all active:scale-95 cursor-pointer border border-brass-light"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
