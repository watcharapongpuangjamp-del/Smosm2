import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles } from 'lucide-react';

import { motion } from 'framer-motion';

export const PWAUpdateBanner: React.FC = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string, r: ServiceWorkerRegistration | undefined) {
      if (r) {
        // Check for updates every hour
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error: unknown) {
      console.error('PWA service worker registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-20 right-4 z-50 max-w-sm w-full bg-emerald-700 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-600 rounded-xl text-emerald-200 shrink-0 mt-0.5 shadow-sm">
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
        </div>
        <div>
          <p className="font-bold text-sm text-white">ตรวจพบเวอร์ชันใหม่!</p>
          <p className="text-xs text-emerald-100 mt-0.5 leading-relaxed">
            ระบบมีฟีเจอร์และการปรับปรุงใหม่พร้อมใช้งานแล้ว กรุณาอัปเดตเพื่อรับประสบการณ์ที่ดีที่สุด
          </p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => updateServiceWorker(true)}
        className="px-3.5 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-50 transition shrink-0 flex items-center gap-1.5 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>อัปเดต</span>
      </motion.button>
    </motion.div>
  );
};
