"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircleIcon } from "./icons";

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 70px)" }}
        >
          <div className="material-sheet animate-toast-in flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg">
            <CheckCircleIcon size={18} className="text-green" />
            <span className="text-[15px] font-medium">{message}</span>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
