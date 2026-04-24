import { memo, useCallback, useMemo, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast } from '@/types';

interface Props {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

const ICONS = {
    success: <CheckCircle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
};

const COLORS = {
    success: 'bg-green-500/90 border-green-400/50',
    error: 'bg-red-500/90 border-red-400/50',
    info: 'bg-blue-500/90 border-blue-400/50',
    warning: 'bg-amber-500/90 border-amber-400/50',
};

// ─── Memoized Individual Toast ──────────────────────────────────────────────
const ToastItem = memo(function ToastItem({
    toast,
    onRemove,
}: {
    toast: Toast;
    onRemove: (id: string) => void;
}) {
    const [exiting, setExiting] = useState(false);

    const handleClose = useCallback(() => {
        setExiting(true);
        // Wait for exit animation before removing
        setTimeout(() => onRemove(toast.id), 200);
    }, [onRemove, toast.id]);

    return (
        <div
            role="alert"
            aria-label={toast.message}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md text-white text-sm shadow-xl pointer-events-auto transition-all duration-200 ${COLORS[toast.type]} ${exiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                }`}
            style={!exiting ? { animation: 'slideInRight 0.3s ease' } : undefined}
        >
            {ICONS[toast.type]}
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={handleClose}
                aria-label={`Close notification`}
                className="opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-sm p-0.5 transition-opacity"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
});

// ─── Main Container ─────────────────────────────────────────────────────────
export default function ToastContainer({ toasts, onRemove }: Props) {
    const content = useMemo(() => {
        if (toasts.length === 0) return null;
        return toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={onRemove} />
        ));
    }, [toasts, onRemove]);

    return (
        <div
            aria-live="polite"
            aria-atomic="false"
            className="fixed top-20 right-4 z-[100] space-y-2 max-w-xs w-full pointer-events-none"
        >
            {content}
        </div>
    );
}
