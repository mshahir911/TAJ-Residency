import React from 'react';
import {
  Bed,
  CheckCircle2,
  Receipt,
  Sparkles,
  Smartphone,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  IndianRupee,
  Building2,
  Clock,
  QrCode,
  Wifi,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function LandingPage({ onLaunchDemo, onResetDemo, onOpenTour }) {
  return (
    <div className="min-h-screen bg-ink text-slate-100 selection:bg-brass selection:text-ink font-sans">
      {/* Top Marketing Navigation */}
      <header className="border-b border-brass-soft/30 bg-panel/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-panel-raised border border-brass flex items-center justify-center shadow-lg shadow-brass/20 text-brass font-display font-bold text-lg">
              OS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-white text-lg tracking-wide">
                  FRONTDESK OS
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brass/20 text-brass font-bold border border-brass/30">
                  Property OS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                The Simple Counter & Booking System for Tourist Homes (5–30 Rooms)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <a
              href="#pricing"
              className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-panel transition-colors hidden sm:inline-block"
            >
              Pricing (from ₹999/mo)
            </a>
            <button
              onClick={onLaunchDemo}
              className="px-4 py-2 rounded-xl bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>See It Live (Interactive Demo)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION: Sentence + Angled Animated Room Grid Keycard Tiles */}
      <section className="px-6 pt-16 pb-20 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass/15 border border-brass/30 text-brass text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BUILT FOR INDEPENDENT TOURIST HOMES & LODGES (5–30 ROOMS)</span>
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-6xl text-white tracking-tight leading-[1.12]">
            Replace the handwritten register with a clean, fast front desk board.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-sans max-w-2xl mx-auto leading-relaxed">
            A night-desk counter system that lets you book walk-ins in 15 seconds, print GST receipts, track cash in drawer, and manage room turnover on your phone.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 font-mono text-xs">
            <button
              onClick={onLaunchDemo}
              className="px-6 py-3.5 rounded-xl bg-brass text-ink font-bold text-sm hover:brightness-110 shadow-xl shadow-brass/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Try Live Demo (No Signup Required)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onResetDemo}
              className="px-5 py-3.5 rounded-xl bg-panel border border-brass-soft/40 hover:border-brass text-slate-200 hover:text-white transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-brass" />
              <span>Reset Realistic Seed Data</span>
            </button>
          </div>
        </div>

        {/* Angled Hero Visual: Interactive 3D Perspective of Keycard Tiles */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent z-10 pointer-events-none"></div>
          
          <div
            className="p-6 bg-panel/70 border border-brass/40 rounded-3xl shadow-2xl shadow-black/90 backdrop-blur-md transform transition-all duration-500 hover:rotate-0"
            style={{ transform: 'perspective(1200px) rotateX(12deg) scale(0.98)' }}
          >
            <div className="flex items-center justify-between mb-4 border-b border-brass-soft/20 pb-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-signal-green pulse-green"></span>
                <span className="text-white font-bold">FrontDesk OS • Counter Room Rack</span>
              </div>
              <div className="text-slate-400 text-[11px] hidden sm:block">
                Live 11-Room Board • Touch Any Card to Book or Bill
              </div>
            </div>

            {/* 4 Representative Keycards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-sans">
              {/* Room 201 - Occupied */}
              <div className="keycard-card status-occupied p-3.5 rounded-xl border border-signal-red/40 bg-ink min-h-[170px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-display font-bold text-2xl text-white">201</span>
                    <span className="px-1.5 py-0.5 rounded bg-signal-red/20 text-signal-red text-[9px] font-mono font-bold">OCCUPIED</span>
                  </div>
                  <div className="text-[10px] font-mono text-brass mt-1">Deluxe AC (₹2,000)</div>
                  <div className="mt-2 text-xs font-semibold text-white truncate">Dr. Vivek Menon</div>
                </div>
                <div className="barcode-texture rounded mt-2"></div>
              </div>

              {/* Room 202 - Vacant */}
              <div className="keycard-card status-vacant p-3.5 rounded-xl border border-signal-green/40 bg-ink min-h-[170px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-display font-bold text-2xl text-white">202</span>
                    <span className="px-1.5 py-0.5 rounded bg-signal-green/20 text-signal-green text-[9px] font-mono font-bold">VACANT</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">Classic AC (₹1,500)</div>
                  <div className="mt-3 text-[11px] text-signal-green font-mono font-bold">+ 15s Walk-in</div>
                </div>
                <div className="barcode-texture rounded mt-2"></div>
              </div>

              {/* Room 204 - Reserved */}
              <div className="keycard-card status-reserved p-3.5 rounded-xl border border-signal-amber/40 bg-ink min-h-[170px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-display font-bold text-2xl text-white">204</span>
                    <span className="px-1.5 py-0.5 rounded bg-signal-amber/20 text-signal-amber text-[9px] font-mono font-bold">RESERVED</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">Classic Non-AC</div>
                  <div className="mt-2 text-xs font-semibold text-white truncate">Rohan Varma (Adv: ₹1.5k)</div>
                </div>
                <div className="barcode-texture rounded mt-2"></div>
              </div>

              {/* Room 205 - Dirty */}
              <div className="keycard-card status-dirty p-3.5 rounded-xl border border-slate-700 bg-ink min-h-[170px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-display font-bold text-2xl text-white">205</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[9px] font-mono font-bold">CLEANING</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">Classic Room</div>
                  <div className="mt-2 text-[11px] text-slate-300 font-mono">Babu (HK) Assigned</div>
                </div>
                <div className="barcode-texture rounded mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM / SOLUTION: Handwritten Paper Book vs. FrontDesk OS */}
      <section className="px-6 py-20 bg-panel border-y border-brass-soft/30">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Why tourist home owners are putting away the paper register.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              The daily ledger notebook worked for decades, but it breaks down on busy weekends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way: Paper Ledger */}
            <div className="bg-ink p-7 rounded-2xl border border-signal-red/30 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 text-signal-red font-mono text-xs font-bold uppercase">
                <span className="w-3 h-3 rounded-full bg-signal-red/20 border border-signal-red flex items-center justify-center text-[9px]">✕</span>
                <span>The Handwritten Ledger (The Old Way)</span>
              </div>

              <h3 className="font-display font-bold text-xl text-white">
                Crossed-out tariffs, lost phone numbers, and missing cash tallies.
              </h3>

              <ul className="space-y-3 font-sans text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-signal-red font-bold font-mono">✕</span>
                  <span><strong>No repeat guest recognition:</strong> A regular customer who stayed 5 times has to fill out the paper form from scratch every single visit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-red font-bold font-mono">✕</span>
                  <span><strong>Manual GST calculation mistakes:</strong> Receptionists calculating 12% vs 18% tax on calculators when guests are in a rush.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-red font-bold font-mono">✕</span>
                  <span><strong>Shouting across corridors to cleaners:</strong> Receptionists constantly asking "Is Room 205 ready yet?" during peak check-in.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-red font-bold font-mono">✕</span>
                  <span><strong>Unaccounted cash drawers at shift change:</strong> No timestamped audit trail when night and morning staff swap shifts.</span>
                </li>
              </ul>
            </div>

            {/* The New Way: FrontDesk OS */}
            <div className="bg-ink p-7 rounded-2xl border border-signal-green/40 space-y-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2.5 text-signal-green font-mono text-xs font-bold uppercase">
                <CheckCircle2 className="w-4 h-4 text-signal-green" />
                <span>FrontDesk OS (The New Counter Ledger)</span>
              </div>

              <h3 className="font-display font-bold text-xl text-white">
                15-second walk-ins, auto GST invoices, and 1-tap mobile turnover.
              </h3>

              <ul className="space-y-3 font-sans text-xs text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="text-signal-green font-bold font-mono">✓</span>
                  <span><strong>Auto-lookup by phone:</strong> Type 10 digits and instantly recognize returning guests, their ID proof, and loyalty badge.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-green font-bold font-mono">✓</span>
                  <span><strong>1-Click paper invoice & WhatsApp receipt:</strong> Official Kerala GSTIN invoice generated instantly with zero math.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-green font-bold font-mono">✓</span>
                  <span><strong>1-Tap mobile cleaner board:</strong> Cleaners tap their phone when a room is clean. The front desk updates in real time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-green font-bold font-mono">✓</span>
                  <span><strong>Shift cash handover log:</strong> Outgoing staff count drawer cash with automatic discrepancy calculation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE WALKTHROUGH: 4 Concrete Pillars */}
      <section className="px-6 py-20 max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
            Built strictly around how your reception counter works.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            No complicated enterprise menus. Every button has a clear purpose.
          </p>
        </div>

        {/* Feature 1: The Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase bg-brass/20 text-brass px-2 py-0.5 rounded font-bold">
              01. FRONT DESK ROOM GRID
            </span>
            <h3 className="font-display font-bold text-2xl text-white">
              The physical room rack on your screen.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              See which rooms are vacant, occupied, reserved, or dirty at a single glance. Tap any keycard to book a walk-in in 15 seconds or bill checkout without opening complex menus.
            </p>
          </div>

          <div className="p-5 bg-panel border border-brass-soft/40 rounded-2xl shadow-xl font-mono text-xs space-y-2">
            <div className="text-brass font-bold text-sm">Keycard Grid Highlights:</div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div>• Live color pulses: Green (Vacant), Red (Occupied), Amber (Reserved), Gray (Dirty)</div>
              <div>• Instant AC vs Non-AC toggle with automatic rate lookup from rate table</div>
              <div>• Returning guest recognition by phone number with auto-prefill</div>
            </div>
          </div>
        </div>

        {/* Feature 2: Invoicing & Billing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="p-5 bg-panel border border-brass-soft/40 rounded-2xl shadow-xl font-mono text-xs space-y-2 order-2 md:order-1">
            <div className="text-signal-green font-bold text-sm">Paper Palette GST Invoice (#F2EFE6):</div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div>• Exact CGST (6%) and SGST (6%) itemization based on ₹7,500 slab</div>
              <div>• Deduction of advance deposits collected via UPI or Cash</div>
              <div>• 1-Click WhatsApp invoice link sent directly to guest phone</div>
            </div>
          </div>

          <div className="space-y-3 order-1 md:order-2">
            <span className="text-[10px] font-mono uppercase bg-signal-green/20 text-signal-green px-2 py-0.5 rounded font-bold">
              02. BILLING & TAX INVOICING
            </span>
            <h3 className="font-display font-bold text-2xl text-white">
              Print official GST bills in under 30 seconds.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              No more manual arithmetic. Calculates room nights × tariff + GST, deducts advance payment, and prints a crisp off-white invoice with your GSTIN and QR code seal.
            </p>
          </div>
        </div>

        {/* Feature 3: Housekeeping Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">
              03. MOBILE HOUSEKEEPING
            </span>
            <h3 className="font-display font-bold text-2xl text-white">
              Big touch buttons for your cleaning staff.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Cleaners get a simplified mobile screen on their Android phone. They tap once when linen is changed, and the front desk room card immediately turns green.
            </p>
          </div>

          <div className="p-5 bg-panel border border-brass-soft/40 rounded-2xl shadow-xl font-mono text-xs space-y-2">
            <div className="text-blue-400 font-bold text-sm">Turnover Flow:</div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div>• Auto-flags room DIRTY the moment a guest checks out</div>
              <div>• 1-Tap progression: Dirty → Cleaning → Clean → Ready</div>
              <div>• Zero phone calls needed between reception and cleaners</div>
            </div>
          </div>
        </div>

        {/* Feature 4: Owner Analytics & P&L */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="p-5 bg-panel border border-brass-soft/40 rounded-2xl shadow-xl font-mono text-xs space-y-2 order-2 md:order-1">
            <div className="text-brass font-bold text-sm">Owner Intelligence:</div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div>• Real-time ADR (Average Daily Rate) and RevPAR yield</div>
              <div>• 7-Day × 4-Week day-of-week occupancy heatmap</div>
              <div>• Simple monthly P&L (Billed Revenue − Staff/Power/Linen Expenses)</div>
            </div>
          </div>

          <div className="space-y-3 order-1 md:order-2">
            <span className="text-[10px] font-mono uppercase bg-brass/20 text-brass px-2 py-0.5 rounded font-bold">
              04. OWNER DECISION SUPPORT
            </span>
            <h3 className="font-display font-bold text-2xl text-white">
              Know today's cash and monthly profit without Excel.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Log utility bills, staff wages, and linen purchases. The system computes your net operating income and shows which days of the week have peak demand for seasonal price surges.
            </p>
          </div>
        </div>
      </section>

      {/* 4. PRICING SECTION: Flat Tiers by Room Count */}
      <section id="pricing" className="px-6 py-20 bg-panel border-t border-brass-soft/30">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="text-[10px] font-mono uppercase bg-brass/20 text-brass px-2.5 py-0.5 rounded-full inline-block font-bold">
              TRANSPARENT PRICING
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Simple flat pricing based on your room count.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              No commissions per booking. No setup fees. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
            {/* Tier 1: Starter */}
            <div className="bg-ink p-7 rounded-2xl border border-brass-soft/30 flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Tourist Home Starter</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-bold text-4xl text-white">₹999</span>
                  <span className="text-xs font-mono text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-300">
                  Ideal for small budget tourist homes and lodges with up to 10 rooms.
                </p>

                <div className="pt-3 border-t border-brass-soft/20 space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex items-center gap-2">✓ Up to 10 Rooms</div>
                  <div className="flex items-center gap-2">✓ 15s Walk-in & Booking Book</div>
                  <div className="flex items-center gap-2">✓ GST Invoicing & WhatsApp Receipt</div>
                  <div className="flex items-center gap-2">✓ Daily Collections Split (Cash/UPI)</div>
                </div>
              </div>

              <button
                onClick={onLaunchDemo}
                className="w-full py-2.5 rounded-xl bg-panel-raised border border-brass-soft hover:border-brass text-slate-200 font-bold text-xs font-mono"
              >
                Try Starter Demo
              </button>
            </div>

            {/* Tier 2: Standard (Most Popular) */}
            <div className="bg-ink p-7 rounded-2xl border-2 border-brass flex flex-col justify-between space-y-6 shadow-2xl relative">
              <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-brass text-ink font-mono font-bold text-[10px] uppercase shadow-md">
                MOST POPULAR
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase text-brass font-bold">Standard Property</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-bold text-4xl text-brass">₹1,999</span>
                  <span className="text-xs font-mono text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-300">
                  For mid-size hotels and family lodges managing up to 25 rooms.
                </p>

                <div className="pt-3 border-t border-brass-soft/20 space-y-2 text-xs text-slate-200 font-mono">
                  <div className="flex items-center gap-2 text-brass font-bold">✓ Up to 25 Rooms</div>
                  <div className="flex items-center gap-2">✓ Mobile Housekeeping 1-Tap Board</div>
                  <div className="flex items-center gap-2">✓ Shift Handover Cash Reconciliation</div>
                  <div className="flex items-center gap-2">✓ Room-Tied WiFi Voucher Generator</div>
                  <div className="flex items-center gap-2">✓ QR Guest Self Check-In Form</div>
                  <div className="flex items-center gap-2">✓ Owner Analytics (ADR, RevPAR, P&L)</div>
                </div>
              </div>

              <button
                onClick={onLaunchDemo}
                className="w-full py-3 rounded-xl bg-brass text-ink font-bold text-xs font-mono hover:brightness-110 shadow-lg shadow-brass/20"
              >
                Launch Standard Demo
              </button>
            </div>

            {/* Tier 3: Grand */}
            <div className="bg-ink p-7 rounded-2xl border border-brass-soft/30 flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Grand / Multi-Property</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-bold text-4xl text-white">₹3,499</span>
                  <span className="text-xs font-mono text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-300">
                  For larger properties (25+ rooms) or operators running multiple hotels.
                </p>

                <div className="pt-3 border-t border-brass-soft/20 space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex items-center gap-2">✓ Unlimited Rooms</div>
                  <div className="flex items-center gap-2">✓ Multi-Property Switcher</div>
                  <div className="flex items-center gap-2">✓ Dynamic Seasonal Surge Overrides</div>
                  <div className="flex items-center gap-2">✓ Owner Operations Audit Register</div>
                  <div className="flex items-center gap-2">✓ WhatsApp Support & Staff Training</div>
                </div>
              </div>

              <button
                onClick={onLaunchDemo}
                className="w-full py-2.5 rounded-xl bg-panel-raised border border-brass-soft hover:border-brass text-slate-200 font-bold text-xs font-mono"
              >
                Try Multi-Property Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DEMO CTA & BOTTOM FOOTER */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto space-y-6">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
          Experience the counter PMS in action right now.
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 font-mono max-w-xl mx-auto">
          Explore the 11-room grid, book a guest, bill a checkout, and print a sample invoice. Reset the demo data anytime with one click.
        </p>

        <div className="flex flex-wrap justify-center gap-3 font-mono text-xs">
          <button
            onClick={onLaunchDemo}
            className="px-6 py-3.5 rounded-xl bg-brass text-ink font-bold text-sm hover:brightness-110 shadow-xl shadow-brass/25 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Open Live PMS App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-12 border-t border-brass-soft/20 text-slate-500 font-mono text-[11px] flex flex-wrap items-center justify-between gap-4">
          <div>© 2026 FrontDesk OS • Built for Indian Tourist Homes & Lodges</div>
          <div>Kerala GST Ready (SAC 996311) • Local-First Offline Resilient</div>
        </div>
      </section>
    </div>
  );
}
