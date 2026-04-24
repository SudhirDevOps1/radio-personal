import { useState } from 'react';
import { X, Settings, Key, Trash2, Moon, Sun, ExternalLink } from 'lucide-react';
import type { SearchProvider } from '@/types';

interface Props {
    darkMode: boolean;
    provider: SearchProvider;
    apiKey: string;
    onClose: () => void;
    onToggleDarkMode: () => void;
    onSaveProvider: (p: SearchProvider) => void;
    onSaveApiKey: (k: string) => void;
    onClearOfflineCache: () => void;
    onClearSearchCache: () => void;
}

const SHORTCUTS = [
    ['Space / K', 'Play / Pause'],
    ['N', 'Next Song'],
    ['P', 'Previous Song'],
    ['M', 'Mute / Unmute'],
    ['S', 'Toggle Shuffle'],
    ['R', 'Cycle Repeat Mode'],
    ['↑ / ↓', 'Volume ±10%'],
    ['Shift + → / ←', 'Seek ±10s'],
    ['F', 'Toggle Favorite'],
];

export default function SettingsModal({
    darkMode, provider, apiKey,
    onClose, onToggleDarkMode, onSaveProvider,
    onSaveApiKey, onClearOfflineCache, onClearSearchCache,
}: Props) {
    const [tempKey, setTempKey] = useState(apiKey);

    const card = darkMode
        ? 'bg-slate-900/98 border-white/10 text-white'
        : 'bg-white/98 border-gray-200 text-gray-900';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className={`${card} border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-violet-400" />
                        Settings
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Theme */}
                    <div>
                        <label className="block text-sm font-semibold mb-3">🎨 Appearance</label>
                        <button
                            onClick={onToggleDarkMode}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all ${darkMode
                                    ? 'bg-white/5 border-white/10 hover:border-violet-500/50'
                                    : 'bg-gray-50 border-gray-200 hover:border-violet-400'
                                }`}
                        >
                            {darkMode ? <Moon className="w-5 h-5 text-violet-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                            <span className="font-medium">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                            <span className="ml-auto text-xs text-gray-400">Click to toggle</span>
                        </button>
                    </div>

                    {/* Provider */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">🔌 Search Provider</label>
                        <p className="text-xs text-gray-400 mb-3">
                            Choose your preferred search API. Piped and Invidious are free. YouTube requires API key.
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {(['piped', 'invidious', 'youtube'] as SearchProvider[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => onSaveProvider(p)}
                                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${provider === p
                                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                                            : darkMode
                                                ? 'bg-white/8 hover:bg-white/15 border border-white/10'
                                                : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <Key className="w-4 h-4 text-violet-400" />
                            YouTube API Key (Optional)
                        </label>
                        <input
                            type="password"
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            placeholder="AIza..."
                            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors ${darkMode
                                    ? 'bg-white/8 border-white/15 focus:border-violet-500 placeholder-white/30'
                                    : 'bg-gray-50 border-gray-200 focus:border-violet-500 placeholder-gray-400'
                                }`}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <a
                                href="https://console.cloud.google.com/apis/credentials"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-violet-400 hover:underline flex items-center gap-1"
                            >
                                Get free API key <ExternalLink className="w-3 h-3" />
                            </a>
                            {apiKey && <span className="text-xs text-green-400">✓ Key configured</span>}
                        </div>
                        <button
                            onClick={() => onSaveApiKey(tempKey)}
                            className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            Save API Key
                        </button>
                    </div>

                    {/* Cache Actions */}
                    <div>
                        <label className="block text-sm font-semibold mb-3">🗑️ Cache Management</label>
                        <div className="space-y-2">
                            <button
                                onClick={onClearOfflineCache}
                                className="w-full flex items-center gap-3 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear Offline Songs Cache
                            </button>
                            <button
                                onClick={onClearSearchCache}
                                className="w-full flex items-center gap-3 py-2.5 px-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 rounded-xl font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear Search Cache
                            </button>
                        </div>
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div>
                        <label className="block text-sm font-semibold mb-3">⌨️ Keyboard Shortcuts</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {SHORTCUTS.map(([key, action]) => (
                                <div key={key} className={`p-2 rounded-lg text-xs flex items-center gap-2 ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <kbd className="font-mono bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">{key}</kbd>
                                    <span className="text-gray-400">{action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
