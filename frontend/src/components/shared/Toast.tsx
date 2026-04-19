import { useState, useCallback, useRef, useEffect } from "react";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

let toastCount = 0;
let globalShowToast: ((msg: string, type: ToastType) => void) | null = null;

// Hook para usar em qualquer componente
export function useToast() {
  const showToast = useCallback((msg: string, type: ToastType = "success") => {
    if (globalShowToast) globalShowToast(msg, type);
  }, []);
  return { showToast };
}

// Componente raiz — montar uma vez no App ou Layout
export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    // Inicia animação de saída
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback(
    (msg: string, type: ToastType = "success") => {
      const id = ++toastCount;
      setToasts((prev) => [...prev, { id, message: msg, type, exiting: false }]);
      const t = setTimeout(() => remove(id), 2500);
      timeoutsRef.current.set(id, t);
    },
    [remove]
  );

  useEffect(() => {
    globalShowToast = showToast;
    return () => { globalShowToast = null; };
  }, [showToast]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 8,
            background: toast.type === "error" ? "#e24b4a" : "#1a3a5c",
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
            minWidth: 220,
            maxWidth: 380,
            opacity: toast.exiting ? 0 : 1,
            transform: toast.exiting ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            animation: toast.exiting ? "none" : "toastIn 0.25s ease",
            pointerEvents: "auto",
          }}
        >
          {toast.type === "success" ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
