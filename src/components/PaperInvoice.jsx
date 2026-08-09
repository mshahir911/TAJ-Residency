import React from 'react';
import { X, Printer, ShieldCheck, Download, Tag } from 'lucide-react';
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
  property
}) {
  if (!isOpen || !room) return null;

  const invoiceNo = invoice?.id || `TR/INV/${room.room_number}/${Math.floor(1000 + Math.random() * 9000)}`;
  const invoiceDate = invoice?.paid_at || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

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
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white text-[#11161D] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl my-6 flex flex-col font-sans">
        {/* Screen Top Controls (Excluded during Print) */}
        <div className="p-3 bg-panel border-b border-brass-soft/30 flex items-center justify-between no-print text-white">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-signal-green"></span>
            <span>Paper Palette GST Invoice Preview (#F2EFE6)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-panel-raised hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="p-8 sm:p-12 space-y-6 bg-[#F2EFE6] paper-surface" id="printable-tax-invoice">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#11161D] pb-5">
            <div>
              <div className="flex items-center gap-3">
                <TajLogo size={46} />
                <div>
                  <h1 className="font-display font-bold text-2xl tracking-wide uppercase text-[#0B0F14]">
                    {property?.name || 'Taj Residency'}
                  </h1>
                  <p className="text-xs text-[#7A6B3E] font-semibold">
                    📍 Adivaram, Kozhikode • Tel: +91 99617 01414
                  </p>
                </div>
              </div>

              <div className="mt-3 text-xs font-mono space-y-0.5 text-slate-700">
                <div>GSTIN: <span className="font-bold text-black">{property?.gst_number || '32AABCT9988Q1Z4'}</span> | State: Kerala (32)</div>
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
                <div><span className="text-slate-500">Room:</span> <span className="font-bold">{room.room_number} ({booking?.ac_or_non_ac || 'AC'})</span></div>
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
              <div><span className="text-slate-500">Check-Out:</span> {booking?.check_out_date || '2026-08-09 11:00'}</div>
              <div><span className="text-slate-500">Total Duration:</span> {nights} Day(s)</div>
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
                <td className="p-2 text-slate-600">996311</td>
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
      </div>
    </div>
  );
}
