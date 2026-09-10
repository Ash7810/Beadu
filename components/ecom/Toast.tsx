"use client";

import { useEcomStore } from "@/store/ecomStore";

export function Toast() {
  const { toasts, removeToast } = useEcomStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:top-6 md:top-auto md:bottom-6 md:right-6 z-[100] flex flex-col gap-2 max-w-sm w-full mx-auto sm:mx-0 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-xl rounded-2xl p-3 sm:p-4 flex items-center gap-3 animate-in slide-in-from-top md:slide-in-from-bottom duration-200"
        >
          <div className="w-7 h-7 rounded-full bg-[#792c14]/10 text-[#792c14] flex items-center justify-center flex-shrink-0 font-bold text-xs ring-1 ring-[#792c14]/20">
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-stone-900 truncate">{toast.title}</h4>
            <p className="text-[11px] text-stone-500 truncate">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-stone-400 hover:text-stone-700 text-xs p-1 rounded-md transition-colors"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
