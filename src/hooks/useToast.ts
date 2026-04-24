import { useState, useCallback, useRef, useEffect } from 'react';
import type { Toast } from '@/types';

const MAX_TOASTS = 5;

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const counterRef = useRef(0);

    // 🧹 Cleanup all active timers on unmount
    useEffect(() => {
        const map = timersRef.current;
        return () => {
            map.forEach((timer) => clearTimeout(timer));
            map.clear();
        };
    }, []);

    const removeToast = useCallback((id: string) => {
        // Clear the specific timer if manually dismissed early
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, type: Toast['type'] = 'info', duration = 3000) => {
            const id = `toast_${++counterRef.current}`;

            setToasts((prev) => {
                const next = [...prev, { id, message, type }];

                // If over limit, remove the OLDEST and clear its timer
                if (next.length > MAX_TOASTS) {
                    const removed = next.shift();
                    if (removed) {
                        const oldTimer = timersRef.current.get(removed.id);
                        if (oldTimer) {
                            clearTimeout(oldTimer);
                            timersRef.current.delete(removed.id);
                        }
                    }
                }
                return next;
            });

            // Set auto-dismiss timer
            const timer = setTimeout(() => {
                timersRef.current.delete(id);
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);

            timersRef.current.set(id, timer);
        },
        [],
    );

    const clearAllToasts = useCallback(() => {
        timersRef.current.forEach((timer) => clearTimeout(timer));
        timersRef.current.clear();
        setToasts([]);
    }, []);

    return { toasts, addToast, removeToast, clearAllToasts };
}
