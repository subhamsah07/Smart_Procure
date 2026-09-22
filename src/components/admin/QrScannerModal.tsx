import React from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  QrCode,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Search,
  RefreshCw,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
  assignedState?: string;
  quickTokens?: string[];
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Farmer QR Pass',
  subtitle = 'Mandi Gate Intake & Verification Scanner',
  assignedState,
  quickTokens = [],
}) => {
  const [mode, setMode] = React.useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [manualCode, setManualCode] = React.useState('');
  const [scanSuccessText, setScanSuccessText] = React.useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const isScanningRef = React.useRef<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    setScanSuccessText(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Camera API is not supported in this browser window or iframe. You can upload a QR image or enter the token manually.'
        );
        setMode('manual');
        return;
      }

      // Stop existing if any
      stopCamera();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
      } catch {
        // Fallback without constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        isScanningRef.current = true;
        scanLoop();
      }
    } catch (err: any) {
      console.warn('Camera stream request failed:', err);
      setCameraError(
        'Camera access was denied or device has no active video source. Use Image Upload or Manual Token.'
      );
      setCameraActive(false);
      isScanningRef.current = false;
    }
  };

  // Stop camera
  const stopCamera = () => {
    isScanningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Continuous frame scanning loop using canvas & jsQR
  const scanLoop = () => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        const maxDim = 640;
        let w = video.videoWidth;
        let h = video.videoHeight;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && code.data.trim().length > 0) {
          triggerSuccess(code.data);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanLoop);
  };

  const triggerSuccess = (decoded: string) => {
    stopCamera();
    setScanSuccessText(decoded);

    // Audio / vibrate feedback if supported
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch {}

    setTimeout(() => {
      onScanSuccess(decoded);
      onClose();
    }, 450);
  };

  // Handle uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          setIsProcessingFile(false);
          if (code && code.data) {
            triggerSuccess(code.data);
          } else {
            setCameraError('No valid QR code was detected in the uploaded image. Please try another photo or enter manually.');
          }
        } else {
          setIsProcessingFile(false);
          setCameraError('Image processing error.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle manual submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    triggerSuccess(manualCode.trim());
  };

  React.useEffect(() => {
    if (isOpen) {
      setScanSuccessText(null);
      setCameraError(null);
      if (mode === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {subtitle} {assignedState ? `(${assignedState})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls: Camera / Upload / Manual */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-900 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('camera');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition ${
              mode === 'camera'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode('upload');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition ${
              mode === 'upload'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode('manual');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition ${
              mode === 'manual'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Manual Input</span>
          </button>
        </div>

        {/* Error Notification */}
        {cameraError && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{cameraError}</span>
              {mode === 'camera' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="underline font-semibold hover:text-amber-950 inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Camera Access
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Preview */}
        {scanSuccessText && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">QR Scanned Successfully!</p>
              <p className="font-mono text-[11px] truncate max-w-xs">{scanSuccessText}</p>
            </div>
          </div>
        )}

        {/* Mode 1: Live Camera View */}
        {mode === 'camera' && !scanSuccessText && (
          <div className="space-y-3">
            <div className="relative w-full aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Crosshair Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-52 h-52 border-2 border-emerald-400/80 rounded-2xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]">
                  {/* Laser line animation */}
                  <div className="absolute top-2 left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" />
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                    Align QR Inside Box
                  </span>
                </div>
              </div>

              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-xs">Initializing camera feed...</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-center text-slate-500">
              Hold the physical booking slip or smartphone QR code steady within the viewfinder.
            </p>
          </div>
        )}

        {/* Mode 2: Upload Image */}
        {mode === 'upload' && !scanSuccessText && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50 dark:bg-neutral-900/50 hover:bg-emerald-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Click to upload QR code photo or pass screenshot
              </p>
              <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, or WEBP images up to 10MB</p>
              {isProcessingFile && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-600 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing image for QR matrix...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode 3: Manual Input */}
        {mode === 'manual' && !scanSuccessText && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                Enter 6-Digit PIN, Farmer Token, or QR Identifier:
              </label>
              <input
                type="text"
                required
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. 481920 (6-digit PIN) or KA9M5X (Token)"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Admin Bypass Access:</span> You can verify the farmer using their 6-digit verification PIN, their 6-character token, or the raw QR identifier.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition disabled:opacity-50"
              >
                Verify & Surpass QR
              </button>
            </div>
          </form>
        )}

        {/* Quick Simulation / Test Tokens */}
        {quickTokens.length > 0 && !scanSuccessText && (
          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Quick Test with Active Queue Tokens</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickTokens.map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => triggerSuccess(tok)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-900 hover:bg-emerald-100 hover:text-emerald-900 text-[11px] font-mono font-bold text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800 transition cursor-pointer"
                >
                  {tok}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
