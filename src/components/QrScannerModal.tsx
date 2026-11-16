import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';
import { Person, Household } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: Person[];
  households: Household[];
  onPatientFound: (person: Person) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  persons,
  households,
  onPatientFound,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage(null);
    setScannedResult(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
          setIsScanning(true);
          requestAnimationFrame(scanFrame);
        }
      } else {
        setErrorMessage('กล้องไม่รองรับบนเบราว์เซอร์นี้ กรุณาใช้โหมดทดสอบจำลอง (Demo Scan)');
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMessage('ไม่สามารถเข้าถึงกล้องได้: ' + (err.message || 'โปรดอนุญาตสิทธิ์การใช้กล้อง'));
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Native BarcodeDetector check if available
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          barcodeDetector
            .detect(canvas)
            .then((detected: any[]) => {
              if (detected.length > 0) {
                const rawValue = detected[0].rawValue;
                handleCodeDetected(rawValue);
              }
            })
            .catch((err: any) => {
              // Ignore silent detection errors
            });
        }
      }
    }
    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  const handleCodeDetected = (code: string) => {
    setScannedResult(code);
    stopCamera();

    // Match code against person id or citizenId
    const found = persons.find(
      (p) => p.id === code || p.citizenId === code || `${p.firstName} ${p.lastName}`.includes(code)
    );

    if (found) {
      setTimeout(() => {
        onClose();
        onPatientFound(found);
      }, 600);
    } else {
      setErrorMessage(`ไม่พบข้อมูลประชากรที่ตรงกับ QR Code: "${code}"`);
    }
  };

  const handleSimulateScan = (person: Person) => {
    handleCodeDetected(person.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-200" />
            <h3 className="text-base font-bold">สแกน QR Code ประชาชน / ผู้ป่วย</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 text-center">
            วาง QR Code หรือบัตรประจำตัวประชาชนของ อสม. ให้อยู่ในกรอบกล้องเพื่อดึงข้อมูลสุขภาพทันที
          </p>

          {/* Camera Viewfinder */}
          <div className="relative w-full h-72 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-emerald-500/50 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Laser Animation Overlay */}
            {isScanning && !scannedResult && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-48 border-2 border-emerald-400 rounded-xl relative overflow-hidden shadow-2xl">
                  <div className="absolute w-full h-1 bg-emerald-400 animate-bounce shadow-[0_0_12px_#34d399]"></div>
                </div>
                <span className="text-xs text-white bg-slate-900/80 px-3 py-1 rounded-full mt-4 font-medium">
                  กำลังสแกนกล้อง...
                </span>
              </div>
            )}

            {scannedResult && (
              <div className="absolute inset-0 bg-emerald-900/90 flex flex-col items-center justify-center text-white p-4 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                <span className="text-sm font-bold">สแกนสำเร็จ!</span>
                <span className="text-xs text-emerald-200 font-mono mt-1">{scannedResult}</span>
              </div>
            )}

            {errorMessage && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-4 text-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                <span className="text-xs font-semibold text-rose-300">{errorMessage}</span>
                <button
                  onClick={startCamera}
                  className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            )}
          </div>

          {/* Demo / Simulate Quick Scan section */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              ⚡ จำลองการสแกน QR Code (Demo / Quick Test):
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50">
              {persons.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSimulateScan(p)}
                  className="pt-1.5 pb-1.5 px-2 flex items-center justify-between hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-800 text-xs">
                      {p.title}{p.firstName} {p.lastName}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">
                      CID: {p.citizenId}
                    </span>
                  </div>
                  <button className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded">
                    จำลองสแกน
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
