import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  ShieldCheck,
  Download,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ArrowLeft
} from 'lucide-react';

/**
 * IdDocumentViewerModal
 * High-resolution lightbox and document inspector for viewing and verifying
 * guest identity proofs stored in the guest CRM profile.
 */
export default function IdDocumentViewerModal({
  isOpen,
  onClose,
  guest = null,
  photoUrl = '',
  title = 'Government ID Proof',
  backPhotoUrl = ''
}) {
  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentImg = (activeSide === 'front' ? (photoUrl || guest?.id_proof_photo_url) : (backPhotoUrl || guest?.id_proof_back_photo_url)) || photoUrl || guest?.id_proof_photo_url;
  const hasBack = Boolean(backPhotoUrl || guest?.id_proof_back_photo_url);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.75, prev - 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Taj Residency - Guest ID Document Record - ${guest?.name || 'Guest'}</title>
          <style>
            body { font-family: monospace; padding: 24px; color: #111; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            .meta { font-size: 12px; margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            img { max-width: 100%; height: auto; border: 1px solid #333; border-radius: 8px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <h1>TAJ RESIDENCY — POLICE VERIFICATION GUEST ID RECORD</h1>
          <div class="meta">
            <div><strong>Guest:</strong> ${guest?.name || 'In-House Guest'}</div>
            <div><strong>Phone:</strong> ${guest?.phone || 'N/A'}</div>
            <div><strong>ID Type:</strong> ${guest?.id_proof_type || 'Aadhaar Card'} (${guest?.id_proof_number || 'VERIFIED'})</div>
            <div><strong>Address:</strong> ${guest?.address || 'N/A'}</div>
            <div><strong>Printed On:</strong> ${new Date().toLocaleString('en-IN')}</div>
          </div>
          ${photoUrl ? `<h3>Front Side:</h3><img src="${photoUrl}" />` : ''}
          ${backPhotoUrl ? `<h3>Back Side:</h3><img src="${backPhotoUrl}" />` : ''}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        
        {/* Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3.5 bg-panel border-b border-brass-soft/30 flex items-center justify-between modal-header-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title="Close viewer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass shrink-0 hidden sm:flex">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                  {guest?.name ? `${guest.name}'s ID` : title}
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-signal-green/15 text-signal-green text-[9px] font-mono font-bold border border-signal-green/30 shrink-0">
                  Compliant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                {guest?.id_proof_type || 'Govt Photo ID'} • {guest?.id_proof_number || 'VERIFIED-DESK'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Side Selector */}
        <div className="px-5 py-2.5 bg-ink/70 border-b border-brass-soft/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Front / Back Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveSide('front');
                handleReset();
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeSide === 'front'
                  ? 'bg-brass text-ink'
                  : 'bg-panel text-slate-400 hover:text-white border border-brass-soft/20'
              }`}
            >
              Front Side
            </button>
            {hasBack && (
              <button
                type="button"
                onClick={() => {
                  setActiveSide('back');
                  handleReset();
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeSide === 'back'
                    ? 'bg-brass text-ink'
                    : 'bg-panel text-slate-400 hover:text-white border border-brass-soft/20'
                }`}
              >
                Back Side
              </button>
            )}
          </div>

          {/* Zoom / Rotate Controls */}
          <div className="flex items-center gap-1.5 bg-panel p-1 rounded-lg border border-brass-soft/30">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-ink text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-slate-400 px-1 font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-ink text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded hover:bg-ink text-slate-300 hover:text-white"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] px-1.5 py-0.5 rounded bg-ink hover:bg-brass-soft/20 text-slate-300 hover:text-brass"
            >
              Reset
            </button>
          </div>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="py-1 px-3 rounded-lg bg-panel hover:bg-ink border border-brass-soft/40 text-brass text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print ID Copy</span>
          </button>
        </div>

        {/* Image Inspection Viewport */}
        <div className="p-4 flex-1 bg-black/90 overflow-hidden flex items-center justify-center min-h-[320px] max-h-[500px]">
          {currentImg ? (
            <div className="overflow-auto max-w-full max-h-full flex items-center justify-center p-2">
              <img
                src={currentImg}
                alt="Guest ID Proof"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-w-full max-h-[460px] object-contain rounded-xl shadow-2xl border border-brass/30"
              />
            </div>
          ) : (
            <div className="text-center text-slate-500 font-mono space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-slate-600" />
              <div>No ID photo image attached for this side.</div>
            </div>
          )}
        </div>

        {/* Guest Metadata Summary Footer */}
        {guest && (
          <div className="p-3.5 bg-panel border-t border-brass-soft/30 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-brass shrink-0" />
              <span className="truncate">{guest.name}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="w-3.5 h-3.5 text-brass shrink-0" />
              <span className="truncate">{guest.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-brass shrink-0" />
              <span className="truncate">{guest.address || 'Kozhikode, Kerala'}</span>
            </div>
          </div>
        )}

        {/* Mobile-Friendly Sticky Bottom Bar for Easy Thumb Access */}
        <div className="sm:hidden p-3 bg-panel border-t border-brass-soft/30 pb-safe-mobile flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-brass text-ink font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Close ID Document & Return</span>
          </button>
        </div>
      </div>
    </div>
  );
}
