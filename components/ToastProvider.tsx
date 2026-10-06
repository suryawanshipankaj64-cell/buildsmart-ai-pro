'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
              t.type === 'success'
                ? 'border-signal-teal/40 bg-navy-900/95 text-paper'
                : t.type === 'error'
                ? 'border-signal-coral/40 bg-navy-900/95 text-paper'
                : 'border-blueprint-line bg-navy-900/95 text-paper'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-signal-teal shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle size={18} className="text-signal-coral shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info size={18} className="text-signal-amber shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs font-medium leading-relaxed">{t.message}</div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-signal-slate hover:text-paper transition-colors shrink-0 p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (m: string) => console.log('Toast:', m),
      success: (m: string) => console.log('Toast Success:', m),
      error: (m: string) => console.log('Toast Error:', m),
      info: (m: string) => console.log('Toast Info:', m),
    };
  }
  return context;
}
