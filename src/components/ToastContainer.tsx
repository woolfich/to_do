import { useUIStore } from '../stores/uiStore';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[60] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm animate-slide-up
            ${toast.type === 'success' ? 'bg-emerald-500/95 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-500/95 text-white' : ''}
            ${toast.type === 'info' ? 'bg-gray-800/95 dark:bg-gray-700/95 text-white' : ''}
          `}
        >
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction?.();
                removeToast(toast.id);
              }}
              className="px-3 py-1 rounded-lg bg-white/20 text-sm font-medium hover:bg-white/30 transition-colors"
            >
              {toast.undoLabel || 'Отменить'}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Закрыть"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
