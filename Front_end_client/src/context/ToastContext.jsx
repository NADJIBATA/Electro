import { createContext, useCallback, useContext, useState } from "react";
import { IoCheckmarkCircle, IoAlertCircle, IoClose } from "react-icons/io5";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md bg-ink px-4 py-3 text-white shadow-lg"
            role="status"
          >
            {t.type === "error" ? (
              <IoAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-star" aria-hidden />
            ) : (
              <IoCheckmarkCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
            )}
            <p className="flex-1 text-sm">{t.message}</p>
            <button
              className="text-white/70 hover:text-white"
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
              aria-label="Fermer"
            >
              <IoClose />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
