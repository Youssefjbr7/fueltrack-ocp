'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

const toastConfig = {
  success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
};

let toastFn: (toast: Omit<Toast, 'id'>) => void = () => {};

export function toast(params: Omit<Toast, 'id'>) {
  toastFn(params);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastFn = (params) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(t => [...t, { ...params, id }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-fade-in ${config.bg}`}
          >
            <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">{toast.title}</p>
              {toast.message && <p className="text-xs text-muted-foreground mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
