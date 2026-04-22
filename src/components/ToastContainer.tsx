import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast } from '@/types';

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="w-4 h-4" />,
  error: <XCircle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
};

const colors = {
  success: 'bg-green-500/90 border-green-400/50',
  error: 'bg-red-500/90 border-red-400/50',
  info: 'bg-blue-500/90 border-blue-400/50',
  warning: 'bg-amber-500/90 border-amber-400/50',
};

export default function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 max-w-xs w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md text-white text-sm shadow-xl pointer-events-auto ${colors[t.type]}`}
          style={{ animation: 'slideInRight 0.3s ease' }}
        >
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-70 hover:opacity-100">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
