import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Layers,
  Calendar,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function ExpensePnLView({
  expenses = [],
  stats,
  onAddExpense,
  property
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState('supplies');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const categories = [
    { id: 'salary', label: 'Staff Salaries & Wages' },
    { id: 'utilities', label: 'Electricity (KSEB) & Water' },
    { id: 'supplies', label: 'Linen, Soaps & Cleaning Supplies' },
    { id: 'repairs', label: 'AC & Plumbing Maintenance' },
    { id: 'maintenance', label: 'Civil & Painting Works' },
    { id: 'other', label: 'Miscellaneous & Tea/Snacks' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const catObj = categories.find(c => c.id === category);
    onAddExpense({
      category,
      categoryLabel: catObj?.label || 'Expense',
      amount: Number(amount),
      date,
      vendor,
      notes
    });
    setAmount('');
    setVendor('');
    setNotes('');
    setIsAddOpen(false);
  };

  const netProfit = stats.netOperatingProfit;
  const isProfitable = netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-panel border border-brass-soft/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brass/20 text-brass text-[10px] font-mono font-bold uppercase tracking-wider border border-brass/30 flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              FINANCIAL AUDIT & P&L LEDGER
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white mt-1">
            Monthly Profit & Loss (P&L) Statement
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {property.name} • Net operating income, categorical cost centers, and expense logging.
          </p>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 active:scale-95 transition-all flex items-center gap-2 font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Log Expense</span>
        </button>
      </div>

      {/* P&L Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl space-y-1">
          <div className="text-[11px] font-mono uppercase text-slate-400">Total Billed Revenue</div>
          <div className="font-display font-bold text-3xl text-brass">
            {formatCurrency(stats.totalRevenueToday)}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Room Tariffs + GST Invoiced
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl space-y-1">
          <div className="text-[11px] font-mono uppercase text-slate-400">Total Operating Expenses</div>
          <div className="font-display font-bold text-3xl text-signal-red">
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Salaries, Utilities, Linen & Repairs
          </div>
        </div>

        {/* Net Operating Profit EBITDA */}
        <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl space-y-1">
          <div className="text-[11px] font-mono uppercase text-slate-400">Net Operating Profit (EBITDA)</div>
          <div className={`font-display font-bold text-3xl ${isProfitable ? 'text-signal-green' : 'text-signal-red'}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Operating Margin:</span>
            <strong className={isProfitable ? 'text-signal-green' : 'text-signal-red'}>
              {stats.profitMarginPct}% Margin
            </strong>
          </div>
        </div>
      </div>

      {/* Quick Add Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
          <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/80 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-brass-soft/30 pb-3">
              <h3 className="font-display font-bold text-lg text-white">
                Log Operational Expense
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-2 text-white font-mono text-xs"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-2 text-white font-mono font-bold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Vendor / Payee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calicut Linen Mart / KSEB"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Notes / Bill Reference</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Purchase of 40 fresh bath towels"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-ink border border-brass-soft/40 rounded-lg p-2.5 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Expense to Ledger</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Itemized Expense Ledger Table */}
      <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 uppercase font-bold">Itemized Expense History ({expenses.length})</span>
          <span className="text-brass">Scraped to Property Ledger</span>
        </div>

        <div className="bg-ink rounded-xl border border-brass-soft/30 overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-panel-raised text-[10px] uppercase text-slate-400 border-b border-brass-soft/20">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Vendor / Payee</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brass-soft/10">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-panel/40 transition-colors">
                  <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{exp.date}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-panel-raised text-[10px] text-brass font-bold border border-brass-soft/30">
                      {exp.category_label || exp.category}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-white">{exp.vendor}</td>
                  <td className="p-3 text-slate-300 font-sans text-xs">{exp.notes}</td>
                  <td className="p-3 text-right font-bold text-signal-red">
                    - {formatCurrency(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
