import { Github, Heart, ExternalLink, Globe } from 'lucide-react';

interface FooterProps {
    darkMode: boolean;
}

export default function Footer({ darkMode }: FooterProps) {
    return (
        <footer className="mt-10 pb-6 text-center space-y-4">
            {/* ── Social Links ──────────────────────────────── */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
                <a
                    href="https://github.com/wherewhere/PrivMITLab-Music-Radio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95 border ${
                        darkMode
                            ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10'
                            : 'bg-white/60 border-gray-200 text-gray-500 hover:text-gray-900 hover:border-violet-400 hover:bg-violet-50'
                    }`}
                >
                    <Github className="w-3.5 h-3.5" />
                    @wherewhere
                </a>

                <a
                    href="https://radio-personal.pages.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95 border ${
                        darkMode
                            ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-pink-500/50 hover:bg-pink-500/10'
                            : 'bg-white/60 border-gray-200 text-gray-500 hover:text-gray-900 hover:border-pink-400 hover:bg-pink-50'
                    }`}
                >
                    <Globe className="w-3.5 h-3.5" />
                    Live App
                </a>

                <a
                    href="https://github.com/wherewhere"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95 border ${
                        darkMode
                            ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10'
                            : 'bg-white/60 border-gray-200 text-gray-500 hover:text-gray-900 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Sudhir Kumar
                </a>
            </div>

            {/* ── Credit Line ───────────────────────────────── */}
            <p className={`text-[11px] flex items-center justify-center gap-1 ${
                darkMode ? 'text-white/25' : 'text-gray-400'
            }`}>
                Made with <Heart className="w-3 h-3 text-pink-400 fill-pink-400" /> by <span className="font-semibold">Sudhir Kumar</span> · © 2025
            </p>
        </footer>
    );
}
