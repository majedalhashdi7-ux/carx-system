'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'loading';
export interface Toast { id: number; type: ToastType; message: string; }

// ── Toast Container ────────────────────────────────────
export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-6 z-[999] flex flex-col gap-3 pointer-events-none" dir="rtl">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -80, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm font-bold shadow-2xl min-w-[280px] max-w-[380px] ${
              t.type === 'success' ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' :
              t.type === 'error'   ? 'bg-red-950 border-red-500/40 text-red-300' :
              t.type === 'info'    ? 'bg-blue-950 border-blue-500/40 text-blue-300' :
                                     'bg-zinc-900 border-white/10 text-white/60'
            }`}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {t.type === 'error'   && <AlertCircle className="w-5 h-5 shrink-0" />}
            {t.type === 'loading' && <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />}
            <span className="flex-1 text-[13px] leading-tight">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="opacity-40 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; dot: string }> = {
    live:     { label: 'مباشر الآن', cls: 'bg-red-500/15 text-red-400 border-red-500/30',   dot: 'bg-red-400 animate-pulse' },
    upcoming: { label: 'قادم',       cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' },
    ended:    { label: 'منتهي',      cls: 'bg-white/5 text-white/30 border-white/10',        dot: 'bg-white/20' },
  };
  const s = cfg[status] || cfg['upcoming'];
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
