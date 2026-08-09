import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Bed,
  Phone,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  rooms,
  onOpenFolio,
  onWalkIn
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const results = rooms.filter(room => {
    if (!query) return true;
    const q = query.toLowerCase();
    const roomNum = (room.room_number || '').toLowerCase();
    const floor = (room.floor || '').toLowerCase();
    const status = (room.status || '').toLowerCase();

    return roomNum.includes(q) || floor.includes(q) || status.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 modal-overlay animate-in fade-in duration-150">
      <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 bg-ink border-b border-brass-soft/30 flex items-center gap-3">
          <Search className="w-5 h-5 text-brass shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search by room number (e.g. 201, 305), floor, or status..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-white text-sm placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="px-2 py-0.5 rounded bg-panel border border-brass-soft text-[10px] font-mono text-brass">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1 text-xs">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono">
              No matching rooms found for "{query}".
            </div>
          ) : (
            results.map(room => (
              <div
                key={room.id}
                onClick={() => {
                  if (room.status === 'occupied' || room.status === 'reserved') {
                    onOpenFolio(room);
                  } else {
                    onWalkIn(room);
                  }
                  onClose();
                }}
                className="p-3 rounded-xl bg-panel hover:bg-panel-raised border border-brass-soft/20 hover:border-brass transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ink border border-brass-soft flex items-center justify-center font-display font-bold text-base text-brass group-hover:scale-105 transition-transform">
                    {room.room_number}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        Room {room.room_number} ({room.floor})
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                          room.status === 'occupied'
                            ? 'bg-signal-red/20 text-signal-red'
                            : room.status === 'vacant'
                            ? 'bg-signal-green/20 text-signal-green'
                            : 'bg-signal-amber/20 text-signal-amber'
                        }`}
                      >
                        {room.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Type: {room.room_type_id.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brass group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
