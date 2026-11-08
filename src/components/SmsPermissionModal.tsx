import React from 'react';
import { MessageSquare, ShieldCheck, Zap, Lock, CheckCircle2, X } from 'lucide-react';

interface SmsPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDecline: () => void;
}

export const SmsPermissionModal: React.FC<SmsPermissionModalProps> = ({
  isOpen,
  onAllow,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Card */}
        <div className="p-6 bg-gradient-to-br from-[#1b1340] to-indigo-950 text-white relative">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 text-[#d4ff3f] flex items-center justify-center shadow-md mb-3 border border-white/10">
            <MessageSquare className="w-6 h-6" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 inline-block mb-1">
            One-Time Setup
          </span>
          <h3 className="text-lg font-black tracking-tight text-white">
            Enable Automatic Bank &amp; UPI Tracking?
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Automatically capture your debit transactions from Kotak, SBI, HDFC, ICICI, Axis, Paytm, and Google Pay with zero manual typing.
          </p>
        </div>

        {/* Benefits list */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold">Silent Auto-Fetch In Background</strong>
                <span className="text-slate-500 text-[11px] leading-normal">
                  Permission is asked only once. Afterwards, the app auto-fetches your debit notifications on launch.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold">100% On-Device &amp; Private</strong>
                <span className="text-slate-500 text-[11px] leading-normal">
                  No SMS ever leaves your phone or laptop. Processed purely in local SQLite memory with zero cloud telemetry.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold">Debit Alerts Only</strong>
                <span className="text-slate-500 text-[11px] leading-normal">
                  Only transaction amounts and merchants are extracted. Personal messages and OTPs are strictly ignored.
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={onAllow}
              className="w-full py-3 bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-[#d4ff3f]" />
              <span>Allow Permission &amp; Auto-Fetch</span>
            </button>

            <button
              onClick={onDecline}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold text-center transition-colors"
            >
              Skip (Manual Entry Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
