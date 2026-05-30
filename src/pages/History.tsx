/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Trash2, 
  History, 
  Calendar,
  ArrowRight,
  ShieldAlert,
  Check,
  X
} from "lucide-react";
import { ScanResult } from "../types";

interface HistoryPageProps {
  history: ScanResult[];
  onClearHistory: () => void;
  onDeleteLog: (id: string) => void;
}

export default function HistoryPage({ history, onClearHistory, onDeleteLog }: HistoryPageProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleClearTrigger = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmClear = () => {
    onClearHistory();
    setShowConfirmModal(false);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2800);
  };

  const handleCancelClear = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="flex flex-col flex-1 px-6 pt-8 pb-32 animate-in fade-in duration-300 relative min-h-[80vh]">
      
      {/* Toast Notification for logs cleared */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-[#0a0f1e] px-4.5 py-3 rounded-full font-display font-semibold text-xs tracking-wide shadow-2xl flex items-center gap-2 border border-emerald-400 select-none animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 stroke-[3px]" />
          <span>Logs cleared</span>
        </div>
      )}

      {/* Custom Confirmation Modal for Clear Logs */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 select-none">
              <div className="p-2.5 bg-red-500/20 rounded-2xl text-red-400 flex-shrink-0 animate-pulse border border-red-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-display font-black text-white leading-tight">
                  Clear All Scan Logs
                </h3>
                <p className="text-[11px] text-slate-400">Database Action Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6 select-none">
              This cannot be undone. Are you sure you want to permanently delete all scan records?
            </p>

            <div className="flex gap-3">
              {/* Cancel Button */}
              <button
                onClick={handleCancelClear}
                className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 font-display font-bold rounded-2xl text-xs transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmClear}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-brand-bg font-display font-black rounded-2xl text-xs transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Row with Clear Button */}
      <div className="flex justify-between items-center mb-6 select-none">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white">
            Logs History
          </h1>
        </div>

        {/* Clear History Button Trigger */}
        {history.length > 0 && (
          <button
            onClick={handleClearTrigger}
            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-500/20 active:scale-95 transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {history.length === 0 ? (
          /* Empty state message */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto select-none">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-base font-display font-bold text-white leading-snug">
              No Scan Logs Captured
            </h3>
            <p className="text-xs text-slate-400 max-w-[245px] mt-1.5 leading-relaxed">
              Scan dynamic face matches in real-time to start logging directory records here.
            </p>
            
            <Link
              to="/"
              className="mt-6 px-6 py-2.5 bg-brand-cyan/15 hover:bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan hover:text-white rounded-xl transition-all duration-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
            >
              <span>Back to Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          /* Scrollable Log Card List as an infinite feed - with scrollbar hidden, full width cards, vertical padding */
          <div className="space-y-3.5 overflow-y-auto max-h-[72vh] no-scrollbar pb-32">
            {history.map((item) => {
              const isHighPower = item.confidence >= 80;
              return (
                <div 
                  key={item.id}
                  className="glass-panel hover:glass-panel-highlight rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 relative overflow-hidden group border border-white/5 w-full"
                >
                  {/* Initials Avatar Bubble representing person's metadata */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.avatarColor} flex items-center justify-center font-display font-bold text-white text-sm shadow-md flex-shrink-0 group-hover:scale-105 transition-transform select-none`}>
                    {item.avatarIconText}
                  </div>

                  {/* Text details - supporting ellipsis for long names */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-1">
                      <h3 className="text-sm font-bold text-white truncate pr-2" title={item.name}>
                        {item.name}
                      </h3>
                      {/* Interactive indicator color code for confidence state */}
                      <span className={`text-[11px] font-mono font-bold flex-shrink-0 ${
                        isHighPower ? "text-emerald-400" : "text-amber-400"
                      }`}>
                        {item.confidence}%
                      </span>
                    </div>

                    {/* Meta Indicators and Timestamps */}
                    <div className="flex justify-between items-center mt-1 select-none text-[10px]">
                      <div className="flex items-center gap-1 text-slate-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.timestamp}</span>
                      </div>
                      <span className="text-slate-500 text-[9px] truncate max-w-[110px]" title={item.role}>
                        {item.role}
                      </span>
                    </div>
                  </div>

                  {/* Small Trash/Delete button for individual entry deletion */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteLog(item.id);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all duration-200 z-10 cursor-pointer self-center"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
