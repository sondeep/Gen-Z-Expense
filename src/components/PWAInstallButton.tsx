import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA on phone, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop install flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm shadow-violet-500/20 transition-all active:scale-95 cursor-pointer"
        title="Install GenZ Expense directly to your home screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow or generic mobile helper
  return (
    <>
      <button
        onClick={() => setShowIOSGuide(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/50 transition-all active:scale-95 cursor-pointer"
        title="How to install on Phone"
      >
        <Smartphone className="w-3.5 h-3.5 text-violet-400" />
        <span className="hidden sm:inline">Install on Phone</span>
        <span className="sm:hidden">Install</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Install on Your Phone</h3>
                  <p className="text-[11px] text-zinc-400">100% Offline & Native App Experience</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/40">
                <p className="font-medium text-white flex items-center gap-1.5 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  On iPhone (Safari):
                </p>
                <p className="text-zinc-400 leading-relaxed pl-6">
                  Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> <strong>Share</strong> button at bottom, scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/40">
                <p className="font-medium text-white flex items-center gap-1.5 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  On Android (Chrome):
                </p>
                <p className="text-zinc-400 leading-relaxed pl-6">
                  Tap the <strong>three dots (⋮)</strong> menu in Chrome, then tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Once added, it launches instantly from your home screen with zero internet required!
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
