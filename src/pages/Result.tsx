/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Check, RefreshCw } from "lucide-react";
import { ScanResult } from "../types";

interface ResultProps {
  lastScan: ScanResult | null;
  onSave: (scan: ScanResult) => void;
  onScanAgain: () => void;
}

export default function Result({ lastScan, onSave, onScanAgain }: ResultProps) {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (!lastScan) return;

    // Trigger progressive animation of confidence bar
    const timer = setTimeout(() => {
      setBarWidth(lastScan.confidence);
    }, 100);

    return () => clearTimeout(timer);
  }, [lastScan]);

  if (!lastScan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center select-none">
        <h2 className="text-white text-base font-bold">No Match Loaded</h2>
        <button 
          onClick={onScanAgain}
          className="mt-4 px-4 py-2 bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan rounded-xl text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isConfirmed = lastScan.confidence >= 80;

  return (
    <div className="flex flex-col flex-1 px-6 pt-8 pb-32 animate-in fade-in duration-500">
      
      {/* Page Title */}
      <div className="mb-6 select-none">
        <span className="text-[10px] font-mono tracking-[0.2em] text-slate-400 opacity-60 uppercase font-bold">
          Scan Resolution
        </span>
        <h1 className="text-2xl font-display font-extrabold text-white mt-1">
          Analysis Result
        </h1>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* Primary Glassmorphism Target Card */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden shadow-2xl border border-white/15">
          
          {/* Circular Photo / Avatar Placeholder with initials above the name */}
          <div className="flex flex-col items-center justify-center mt-3 mb-5 select-none">
            <div className="relative">
              {/* Outer thin circular glowing edge */}
              <div className="absolute inset-[-6px] rounded-full border border-dashed border-brand-cyan/30 animate-[spin_24s_linear_infinite]" />
              
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${lastScan.avatarColor} flex items-center justify-center text-white font-display font-black text-3xl shadow-2xl border-2 border-white/10 relative overflow-hidden`}>
                <span className="relative z-10">{lastScan.avatarIconText}</span>
                <div className="absolute inset-0 bg-black/10 opacity-30" />
              </div>
              
              {/* Floating verified status spot */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-xl text-white border ${
                isConfirmed 
                  ? 'bg-emerald-500 border-emerald-400' 
                  : 'bg-amber-500 border-amber-400'
              }`}>
                {isConfirmed ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              </span>
            </div>
          </div>

          {/* Subject Details - Large Bold White Name */}
          <div className="text-center space-y-1.5 mb-6">
            <h2 className="text-2xl font-display font-black tracking-tight text-white leading-tight">
              {lastScan.name}
            </h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              {lastScan.role} · {lastScan.department}
            </p>
          </div>

          {/* Confidence Meter - Styled strictly with coloring requested: green >= 80%, amber 60-79% */}
          <div className="space-y-2.5 mb-6">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
                Match Confidence
              </span>
              <span className={`text-lg font-mono font-black ${
                isConfirmed ? "text-emerald-400" : "text-amber-400"
              }`}>
                {lastScan.confidence}%
              </span>
            </div>
            
            {/* Custom styled progress bar */}
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isConfirmed 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                    : "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          {/* Access level information and timestamp */}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-1.5 text-slate-400 text-xs select-none">
            <div className="flex justify-between">
              <span>Security Access Level</span>
              <span className="font-mono text-white/90 font-bold">{lastScan.accessLevel}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Identified At</span>
              <span className="font-mono text-white/90">{lastScan.timestamp}</span>
            </div>
          </div>

        </div>

        {/* Dynamic Action Buttons inside result view block */}
        <div className="flex flex-col gap-3">
          {/* Main Option 1: Save to History */}
          <button
            onClick={() => onSave(lastScan)}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-brand-bg font-display font-black rounded-2xl transition-all duration-200 active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer border border-emerald-400/20"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            Save to History
          </button>

          {/* Main Option 2: Scan Again (no save) */}
          <button
            onClick={onScanAgain}
            className="w-full py-4 glass-panel hover:glass-panel-highlight text-slate-400 hover:text-white font-display font-bold rounded-2xl transition-all duration-200 active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 cursor-pointer shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Scan Again
          </button>
        </div>
      </div>

    </div>
  );
}
