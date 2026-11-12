import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        title="ติดตั้งแอปพลิเคชันบนอุปกรณ์ของคุณ"
      >
        <Download className="w-3.5 h-3.5" />
        <span>ติดตั้งแอป (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
          title="วิธีติดตั้งบน iOS"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>ติดตั้งบน iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  ติดตั้งบน iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside leading-relaxed">
                <li>
                  เปิดเบราว์เซอร์ <strong>Safari</strong> ในอุปกรณ์ของคุณ
                </li>
                <li>
                  แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเครื่องมือด้านล่าง
                </li>
                <li>
                  เลื่อนลงมาและเลือกเมนู <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
                </li>
                <li>
                  แตะ <strong>เพิ่ม (Add)</strong> ที่มุมขวาบนเพื่อเสร็จสิ้น
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Always show a quick install guide or button even if beforeinstallprompt hasn't fired yet for manual prompt or user awareness
  return (
    <button
      onClick={() => {
        alert('คุณสามารถติดตั้งแอปนี้ได้จากเมนูของเบราว์เซอร์ (เช่น "ติดตั้งแอป" หรือ "Add to Home screen") เพื่อใช้งานแบบออฟไลน์');
      }}
      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
      title="คำแนะนำการติดตั้ง PWA"
    >
      <Download className="w-3.5 h-3.5 text-emerald-600" />
      <span>วิธีติดตั้ง PWA</span>
    </button>
  );
};
