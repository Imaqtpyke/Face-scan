/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  Sun, 
  ShieldAlert, 
  Play, 
  History, 
  Camera,
  Check,
  Sparkles
} from "lucide-react";

interface TipsModalProps {
  onClose: (dontShowAgain: boolean) => void;
}

export default function TipsModal({ onClose }: TipsModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      {/* Container with intro animation */}
      <div className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Banner with Glowing Header */}
        <div className="p-6 pb-4 border-b border-white/5 bg-gradient-to-r from-brand-cyan/20 to-transparent flex items-center gap-3">
          <div className="p-2 bg-brand-cyan/20 rounded-xl text-brand-cyan shadow-sm">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-white tracking-tight">
              Face Scan Guide
            </h2>
            <p className="text-xs text-slate-400">System Checklist</p>
          </div>
        </div>

        {/* Content & Tips List */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Tip 1 */}
          <div className="flex gap-3 leading-relaxed">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-cyan border border-white/5">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">1. Good Lighting</p>
              <p className="text-xs text-slate-400">Position yourself in a well-lit area. Avoid harsh backlights or strong shadows across your face.</p>
            </div>
          </div>

          {/* Tip 2 */}
          <div className="flex gap-3 leading-relaxed">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-cyan border border-white/5">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">2. Camera Angle</p>
              <p className="text-xs text-slate-400">Hold the camera at eye level, capturing the full face structure directly.</p>
            </div>
          </div>

          {/* Tip 3 */}
          <div className="flex gap-3 leading-relaxed">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-cyan border border-white/5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">3. No Obstructions</p>
              <p className="text-xs text-slate-400">Ensure eyes, nose, and mouth are clear of eyeglasses, masks, or heavy hair blockages.</p>
            </div>
          </div>

          {/* Tip 4 */}
          <div className="flex gap-3 leading-relaxed">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-cyan border border-white/5">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-cyan">4. Photo Variety</p>
              <p className="text-xs text-slate-400">For enrollment, tilt your head slightly in different directions under good illumination to formulate a comprehensive dataset.</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-1">Face data stays on your device only</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 border-t border-white/5 bg-white/[0.02]">
          {/* Custom styled checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none py-4">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={() => setDontShowAgain(!dontShowAgain)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                dontShowAgain 
                  ? "bg-brand-cyan border-brand-cyan text-brand-bg font-bold" 
                  : "bg-white/5 border-white/20 text-transparent"
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">Do not show again</span>
          </label>

          {/* Got it action button */}
          <button
            onClick={() => onClose(dontShowAgain)}
            className="w-full py-3 bg-brand-cyan text-brand-bg font-display font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95 text-sm uppercase tracking-wider hover:bg-cyan-400"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}
