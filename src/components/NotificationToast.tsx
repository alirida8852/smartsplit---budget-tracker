import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { ToastMessage } from "../types";

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function NotificationToast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void; key?: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const config = {
    success: {
      bg: "bg-zinc-900/95 border-emerald-500/30 text-zinc-100",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      bar: "bg-emerald-500",
    },
    error: {
      bg: "bg-zinc-900/95 border-red-500/30 text-zinc-100",
      icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
      bar: "bg-red-500",
    },
    info: {
      bg: "bg-zinc-900/95 border-amber-500/30 text-zinc-100",
      icon: <Info className="w-5 h-5 text-amber-400 shrink-0" />,
      bar: "bg-amber-400",
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex flex-col overflow-hidden rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 animate-fade-in ${config.bg}`}
    >
      <div className="flex items-start justify-between p-4 gap-3">
        <div className="flex gap-3">
          {config.icon}
          <p className="text-sm font-medium tracking-wide">{toast.text}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-0.5 w-full bg-zinc-800">
        <div className={`h-full ${config.bar} animate-shrink-progress`} style={{ animationDuration: "4000ms", animationTimingFunction: "linear" }} />
      </div>
    </div>
  );
}
