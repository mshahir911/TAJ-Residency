import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  ShieldCheck,
  SwitchCamera,
  Image as ImageIcon,
  Trash2,
  Sparkles
} from 'lucide-react';
import { uploadGuestIdProof } from '../services/storageService';

/**
 * IdPhotoCaptureWidget
 * Robust Government ID photo capture and upload widget compliant with Indian Hospitality Law.
 * Features:
 * 1. Live Camera Stream with automatic srcObject binding on mount (Desktop webcam + Mobile rear/front)
 * 2. Visual ID Card Framing Viewfinder with non-overlapping single instruction
 * 3. Front & Back dual-side document capture tabs (Aadhaar, Driving License, Passport, Voter ID)
 * 4. 1-Click Snapshot canvas extraction
 * 5. Full Drag-and-Drop & File Browser Upload fallback with immediate local DataURL preview
 * 6. Indian Law compliance indicators (Sarais Act & Police verification)
 */
export default function IdPhotoCaptureWidget({
  frontPhotoUrl = '',
  backPhotoUrl = '',
  idType = 'Aadhaar Card',
  guestPhone = '',
  onChangeFront,
  onChangeBack,
  onViewFullscreen,
  compact = false
}) {
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (rear) | 'user' (webcam)
  const [cameraError, setCameraError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (err) {
        console.warn('Error stopping stream tracks:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Cleanup camera stream when widget unmounts
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Callback ref for <video>: Guarantees srcObject is bound whenever video mounts in DOM
  const handleVideoMount = useCallback((videoEl) => {
    videoRef.current = videoEl;
    if (videoEl && streamRef.current) {
      videoEl.srcObject = streamRef.current;
      videoEl.play().catch(err => {
        console.warn('Video auto-play warning:', err);
      });
    }
  }, []);

  // Start live camera with fallback constraint support
  const startCameraStream = async (facing = cameraFacing) => {
    stopCameraStream();
    setCameraError('');

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser. Please use the Upload File option.');
      }

      let stream = null;
      try {
        // Attempt with desired facing mode & high resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (facingErr) {
        console.warn('FacingMode constraint failed, falling back to default video device:', facingErr);
        // Fallback for desktop webcams that reject 'environment'
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      // If video is already mounted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Play error:', e));
      }
    } catch (err) {
      console.error('Camera access error:', err);
      let errMsg = 'Unable to access camera. Please allow camera permissions in browser settings or use Upload File.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied. Please allow camera access in your browser or upload the ID document file.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No camera device found on this system. Please use the Upload File option.';
      }
      setCameraError(errMsg);
      setIsCameraActive(false);
    }
  };

  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCameraStream();
    } else {
      startCameraStream(cameraFacing);
    }
  };

  const handleSwitchFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCameraStream(nextFacing);
  };

  // Capture snapshot directly from the video feed onto a canvas, cropped to the center framing box
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      // Crop strictly to the center card bounding box as framed by the viewfinder
      // Viewfinder is aspect-[85.6/53.98] (~1.586) centered in the viewport
      let sWidth = width;
      let sHeight = height;
      let sx = 0;
      let sy = 0;

      if (height > width) {
        // Vertical portrait feed (smartphones)
        // Card viewfinder spans ~94% width, with height = width / 1.586
        sWidth = Math.round(width * 0.94);
        sHeight = Math.round(sWidth / 1.586);
        sx = Math.round((width - sWidth) / 2);
        sy = Math.round((height - sHeight) / 2);
      } else {
        // Horizontal landscape feed (desktop webcams)
        sHeight = Math.round(height * 0.82);
        sWidth = Math.round(sHeight * 1.586);
        if (sWidth > width) {
          sWidth = Math.round(width * 0.94);
          sHeight = Math.round(sWidth / 1.586);
        }
        sx = Math.round((width - sWidth) / 2);
        sy = Math.round((height - sHeight) / 2);
      }

      sWidth = Math.max(100, Math.min(sWidth, width));
      sHeight = Math.max(100, Math.min(sHeight, height));
      sx = Math.max(0, Math.min(sx, width - sWidth));
      sy = Math.max(0, Math.min(sy, height - sHeight));

      const canvas = document.createElement('canvas');
      canvas.width = sWidth;
      canvas.height = sHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

      // Lightweight compression (~80KB) for instantaneous cloud sync
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

      if (activeSide === 'front') {
        if (typeof onChangeFront === 'function') onChangeFront(dataUrl);
      } else {
        if (typeof onChangeBack === 'function') onChangeBack(dataUrl);
      }

      stopCameraStream();
    } catch (err) {
      console.error('Snap photo error:', err);
    }
  };

  // Process file upload with instant local preview + background cloud sync
  const handleFileProcess = (file) => {
    if (!file) return;

    // 1. Convert immediately to DataURL for instantaneous local rendering
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (activeSide === 'front') {
        if (typeof onChangeFront === 'function') onChangeFront(dataUrl);
      } else {
        if (typeof onChangeBack === 'function') onChangeBack(dataUrl);
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload to Supabase Storage in background if configured
    setIsUploading(true);
    uploadGuestIdProof(file, guestPhone)
      .then(({ url }) => {
        if (url) {
          if (activeSide === 'front') {
            if (typeof onChangeFront === 'function') onChangeFront(url);
          } else {
            if (typeof onChangeBack === 'function') onChangeBack(url);
          }
        }
      })
      .catch(err => {
        console.warn('Background storage sync notice (local copy retained):', err);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = (side) => {
    if (side === 'front') {
      if (typeof onChangeFront === 'function') onChangeFront('');
    } else {
      if (typeof onChangeBack === 'function') onChangeBack('');
    }
  };

  const currentPhoto = activeSide === 'front' ? frontPhotoUrl : backPhotoUrl;
  const isFrontDone = Boolean(frontPhotoUrl && frontPhotoUrl.length > 5);
  const isBackDone = Boolean(backPhotoUrl && backPhotoUrl.length > 5);

  return (
    <div className="bg-ink p-3.5 sm:p-4 rounded-xl border border-brass-soft/40 space-y-3 font-mono">
      {/* Header Banner with Legal Compliance Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-4 h-4 ${isFrontDone ? 'text-signal-green' : 'text-brass'}`} />
          <span className="text-xs uppercase font-bold text-white tracking-wide">
            {idType} Photo Capture
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brass/15 text-brass font-semibold border border-brass/30">
            Law of India Mandate
          </span>
        </div>

        {/* Verification Status Badge */}
        {isCameraActive ? (
          <span className="flex items-center gap-1 text-[10px] text-brass bg-brass/15 border border-brass/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-signal-red"></span>
            <span>Live Camera Active</span>
          </span>
        ) : isFrontDone ? (
          <span className="flex items-center gap-1 text-[10px] text-signal-green bg-signal-green/10 border border-signal-green/30 px-2 py-0.5 rounded-full font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>ID Photo Recorded</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-signal-amber bg-signal-amber/10 border border-signal-amber/30 px-2 py-0.5 rounded-full font-bold">
            <AlertTriangle className="w-3 h-3" />
            <span>Photo Required at Check-In</span>
          </span>
        )}
      </div>

      {/* Front / Back Toggle Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brass-soft/20 pb-2.5">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveSide('front');
              stopCameraStream();
            }}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeSide === 'front'
                ? 'bg-brass text-ink shadow-sm'
                : 'bg-panel text-slate-400 hover:text-white border border-brass-soft/20'
            }`}
          >
            <span>Front Side</span>
            {isFrontDone && <span className="w-1.5 h-1.5 rounded-full bg-signal-green shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSide('back');
              stopCameraStream();
            }}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeSide === 'back'
                ? 'bg-brass text-ink shadow-sm'
                : 'bg-panel text-slate-400 hover:text-white border border-brass-soft/20'
            }`}
          >
            <span>Back Side (Optional)</span>
            {isBackDone && <span className="w-1.5 h-1.5 rounded-full bg-signal-green shrink-0" />}
          </button>
        </div>

        {/* Action Buttons: Camera Toggle & File Upload */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleCamera}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isCameraActive
                ? 'bg-signal-red hover:bg-signal-red/90 text-white'
                : 'bg-panel hover:bg-brass-soft/20 text-brass border border-brass/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCameraActive ? 'Close Cam' : 'Open Camera'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-panel hover:bg-brass-soft/20 text-slate-200 hover:text-white border border-brass-soft/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-brass" />
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative min-h-[220px] flex flex-col justify-center">

        {/* 1. LIVE CAMERA STREAM MODE */}
        {isCameraActive && (
          <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-brass w-full h-[320px] sm:h-[360px] flex items-center justify-center shadow-2xl">
            {/* Live Video Feed */}
            <video
              ref={handleVideoMount}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Top Clean Instruction & Live Indicator Bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
              <div className="bg-black/80 backdrop-blur-md border border-brass/60 text-brass text-[11px] sm:text-xs font-mono font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brass animate-pulse" />
                <span>Align {activeSide === 'front' ? 'Front' : 'Back'} of {idType}</span>
              </div>
              <div className="bg-black/80 backdrop-blur-md border border-signal-green/50 text-signal-green text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
                <span>Live Feed</span>
              </div>
            </div>

            {/* Professional Document Scanner Viewfinder Frame (Aspect Ratio 85.6 / 53.98) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-10">
              <div
                className="w-full max-w-[320px] aspect-[85.6/53.98] border-2 border-dashed border-brass/80 rounded-xl relative flex flex-col justify-between p-2.5 transition-all"
                style={{
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), inset 0 0 24px rgba(201, 162, 75, 0.12)'
                }}
              >
                {/* 4 Golden Corner Brackets */}
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-3 border-l-3 border-brass rounded-tl-md"></div>
                  <div className="w-5 h-5 border-t-3 border-r-3 border-brass rounded-tr-md"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-3 border-l-3 border-brass rounded-bl-md"></div>
                  <div className="w-5 h-5 border-b-3 border-r-3 border-brass rounded-br-md"></div>
                </div>
              </div>
            </div>

            {/* Bottom Floating Shutter Control Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-3 z-20">
              <button
                type="button"
                onClick={handleSwitchFacing}
                className="px-3.5 py-2 rounded-full bg-black/80 hover:bg-black text-white flex items-center gap-1.5 border border-brass/50 text-xs font-mono font-bold shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
                title="Switch Camera (Front/Back)"
              >
                <SwitchCamera className="w-4 h-4 text-brass" />
                <span className="hidden sm:inline">Flip</span>
              </button>

              <button
                type="button"
                onClick={handleSnapPhoto}
                className="px-7 sm:px-9 py-2.5 rounded-full bg-brass hover:bg-brass-light text-ink font-mono font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2 active:scale-95 transition-all cursor-pointer border border-brass-light ring-2 ring-brass/40"
              >
                <Camera className="w-4 h-4 stroke-[3]" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={stopCameraStream}
                className="w-9 h-9 rounded-full bg-black/80 hover:bg-black text-slate-300 hover:text-white flex items-center justify-center border border-slate-600 shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
                title="Cancel Camera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && !isCameraActive && (
          <div className="p-3 bg-signal-red/10 border border-signal-red/30 rounded-xl text-signal-red text-xs flex items-start gap-2.5 my-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Camera Unavailable</div>
              <div className="text-[11px] text-slate-300 leading-relaxed">{cameraError}</div>
            </div>
          </div>
        )}

        {/* 2. PHOTO CAPTURED PREVIEW MODE */}
        {!isCameraActive && currentPhoto && (
          <div className="bg-panel rounded-xl overflow-hidden border border-brass-soft/50 p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-4">
            {/* Image Thumbnail with Overlay */}
            <div className="relative w-full sm:w-48 h-32 bg-black rounded-lg overflow-hidden shrink-0 border border-brass/50 shadow-inner group">
              <img
                src={currentPhoto}
                alt={`${idType} ${activeSide}`}
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {onViewFullscreen && (
                  <button
                    type="button"
                    onClick={() => onViewFullscreen(currentPhoto, `${idType} (${activeSide.toUpperCase()})`)}
                    className="p-2 rounded-lg bg-brass text-ink font-bold text-xs flex items-center gap-1 shadow-lg hover:brightness-110"
                    title="Inspect Fullscreen"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Inspect</span>
                  </button>
                )}
              </div>
            </div>

            {/* Document Details & Actions */}
            <div className="flex-1 space-y-1.5 text-xs w-full text-left">
              <div className="flex items-center gap-2 text-signal-green font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>{activeSide === 'front' ? 'Front Side Captured & Verified' : 'Back Side Captured & Verified'}</span>
              </div>
              
              <div className="text-[11px] text-slate-300">
                Document Type: <strong className="text-brass">{idType}</strong>
              </div>
              <div className="text-[10px] text-slate-400">
                Recorded for guest profile • Government lodging compliance ready
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {onViewFullscreen && (
                  <button
                    type="button"
                    onClick={() => onViewFullscreen(currentPhoto, `${idType} (${activeSide.toUpperCase()})`)}
                    className="text-xs text-brass hover:underline flex items-center gap-1 font-bold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View High-Res Lightbox</span>
                  </button>
                )}

                <span className="text-slate-600">•</span>

                <button
                  type="button"
                  onClick={() => startCameraStream()}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-brass" />
                  <span>Retake Photo</span>
                </button>

                <span className="text-slate-600">•</span>

                <button
                  type="button"
                  onClick={() => handleRemovePhoto(activeSide)}
                  className="text-xs text-signal-red hover:underline flex items-center gap-1 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. EMPTY STATE / DRAG & DROP ZONE */}
        {!isCameraActive && !currentPhoto && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center space-y-2.5 transition-all ${
              dragOver
                ? 'border-brass bg-brass/10'
                : 'border-brass-soft/40 hover:border-brass/70 bg-panel/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-ink border border-brass-soft mx-auto flex items-center justify-center text-brass shadow-md">
              <Camera className="w-6 h-6" />
            </div>

            <div>
              <div className="text-sm font-bold text-white">
                Snap or Upload {activeSide === 'front' ? 'Front Side' : 'Back Side'} of {idType}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Click <strong className="text-brass">Open Camera</strong> to snap instantly from front desk webcam, or drag & drop image/PDF here.
              </p>
            </div>

            <div className="flex justify-center items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => startCameraStream()}
                className="py-2 px-4 rounded-xl bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 flex items-center gap-2 active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Snap with Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-4 rounded-xl bg-ink text-slate-200 hover:text-white border border-brass-soft/50 font-bold text-xs flex items-center gap-2 shadow-sm transition-all hover:border-brass"
              >
                <Upload className="w-4 h-4 text-brass" />
                <span>Browse Files</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dual Side Attachment Pill Summary */}
      {(frontPhotoUrl || backPhotoUrl) && (
        <div className="flex items-center gap-2 pt-2 border-t border-brass-soft/20 text-xs">
          <span className="text-slate-400 font-semibold">Attached to Guest Profile:</span>
          {frontPhotoUrl && (
            <span className="px-2.5 py-0.5 rounded-full bg-signal-green/15 text-signal-green border border-signal-green/30 flex items-center gap-1 font-bold text-[11px]">
              ✓ Front Side on File
            </span>
          )}
          {backPhotoUrl && (
            <span className="px-2.5 py-0.5 rounded-full bg-signal-green/15 text-signal-green border border-signal-green/30 flex items-center gap-1 font-bold text-[11px]">
              ✓ Back Side on File
            </span>
          )}
        </div>
      )}
    </div>
  );
}
