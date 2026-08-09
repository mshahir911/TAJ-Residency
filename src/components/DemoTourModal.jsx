import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Bed,
  Receipt,
  Smartphone,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

export default function DemoTourModal({
  isOpen,
  onClose,
  onResetDemo
}) {
  if (!isOpen) return null;

  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Bed,
      tag: '01. COUNTER ROOM GRID',
      title: 'The Room Grid is your digital counter rack',
      desc: 'Instead of flipping paper ledger pages, all 11 rooms sit in front of you. Green is ready for walk-ins, red is occupied, amber is reserved, and gray needs cleaning.',
      tip: 'Try tapping any vacant room card (like Room 202) to create a 15-second walk-in.'
    },
    {
      icon: Receipt,
      tag: '02. BILLING & GST INVOICES',
      title: '1-Click GST Tax Invoices & WhatsApp sharing',
      desc: 'When a guest checks out, tap "Check Out & Bill". The system auto-calculates nights × tariff, adds GST (12% or 18%), deducts advances, and produces an off-white paper invoice with your GSTIN.',
      tip: 'Tap "Preview Paper Invoice" to see the print-ready receipt or click "Share via WhatsApp".'
    },
    {
      icon: Smartphone,
      tag: '03. MOBILE HOUSEKEEPING',
      title: 'Cleaning staff update rooms on their Android phones',
      desc: 'The moment a guest checks out, the room turns DIRTY. Your cleaners tap their phone when the room is clean, and the front desk board updates in real time.',
      tip: 'Switch staff role to "Housekeeping" in the top bar to test the 1-tap mobile cleaner board.'
    },
    {
      icon: TrendingUp,
      tag: '04. OWNER INTELLIGENCE & CASH',
      title: 'Know your daily cash and monthly profit instantly',
      desc: 'Track cash in drawer, UPI collections, RevPAR yield, ADR, and occupancy heatmaps without ever opening a spreadsheet or guessing if your shift staff balanced the till.',
      tip: 'Switch staff role to "Owner" to view the Analytics Dashboard and Monthly P&L Ledger.'
    }
  ];

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/80 p-6 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-brass-soft/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brass text-ink font-bold flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase text-brass font-bold block">
                {slide.tag}
              </span>
              <h3 className="font-display font-bold text-white text-base leading-tight">
                {slide.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 font-sans text-xs">
          <p className="text-slate-300 leading-relaxed">
            {slide.desc}
          </p>

          <div className="p-3 bg-ink rounded-xl border border-brass-soft/30 font-mono text-[11px] text-brass space-y-1">
            <span className="text-[9px] uppercase text-slate-400 block font-bold">Interactive Try-Me Hint:</span>
            <span>💡 {slide.tip}</span>
          </div>
        </div>

        {/* Slide Tracker & Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-brass-soft/20 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlide === i ? 'bg-brass w-6' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide(currentSlide - 1)}
                className="py-1.5 px-3 rounded-lg bg-panel border border-brass-soft text-slate-300 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="py-1.5 px-3 rounded-lg bg-brass text-ink font-bold hover:brightness-110 flex items-center gap-1 shadow-md shadow-brass/20"
              >
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="py-1.5 px-4 rounded-lg bg-signal-green text-ink font-bold hover:brightness-110 flex items-center gap-1.5 shadow-md shadow-signal-green/20"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Start Exploring</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
