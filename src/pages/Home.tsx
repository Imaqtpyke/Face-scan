/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { HelpCircle, Globe } from "lucide-react";
import CameraViewfinder from "../components/CameraViewfinder";
import { getPersons } from "../lib/indexedDb";
import { ScanResult } from "../types";

interface HomeProps {
  onDetected: (detectedScan: ScanResult) => void;
  onOpenTips: () => void;
}

export type ScanStatus = "scanning" | "unrecognized" | "multiple" | "noface_timeout" | "confirmed";

export default function Home({ onDetected, onOpenTips }: HomeProps) {
  const [status, setStatus] = useState<ScanStatus>("scanning");
  const [personsCount, setPersonsCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const list = await getPersons();
        setPersonsCount(list.length);
      } catch (err) {
        console.error("Failed fetching persons count:", err);
      }
    }
    fetchCount();
  }, []);

  const getStatusMessage = () => {
    switch (status) {
      case "scanning":
        return "Scanning...";
      case "unrecognized":
        return "Unrecognized — try adjusting your position";
      case "multiple":
        return "Only 1 face at a time";
      case "noface_timeout":
        return "No face detected. Try again.";
      case "confirmed":
        return "Verifying secure match...";
      default:
        return "Scanning...";
    }
  };

  return (
    <div className="flex flex-col flex-1 px-6 pt-8 pb-32 animate-in fade-in duration-300">
      
      {/* Title & Help Header */}
      <div className="flex justify-between items-start mb-6 select-none">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-xs font-display font-medium text-emerald-400 tracking-wide">
              Live Biometrics
            </span>
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white">
            FACE<span className="text-brand-cyan">SCAN</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Identify registered persons instantly
          </p>
          
          {personsCount !== null && (
            <div className="mt-3 inline-flex">
              {personsCount === 0 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-red-500/10 text-red-400 border border-red-500/20">
                  No persons registered
                </span>
              ) : personsCount >= 10 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                  10 / 10 — Full
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-white/[0.04] text-slate-300 border border-white/10">
                  {personsCount} / 10 persons registered
                </span>
              )}
            </div>
          )}
        </div>

        {/* Display Tips Button */}
        <button
          onClick={onOpenTips}
          className="p-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-brand-cyan/40 transition-all duration-200 text-slate-400 hover:text-white active:scale-95 flex items-center justify-center cursor-pointer shadow-md shadow-black/25"
          title="Show scan tips"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewfinder Section */}
      <div className="flex-1 flex flex-col justify-center items-center my-auto">
        <CameraViewfinder 
          status={status} 
          onStatusChange={setStatus} 
          onDetected={onDetected} 
        />
        
        {/* Dynamic real-time biometric state feedback */}
        <div className="mt-5 text-center min-h-[44px]">
          <span className={`text-xs font-mono font-bold tracking-wide uppercase px-4 py-1.5 rounded-full border transition-all duration-200 ${
            status === "unrecognized" 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
              : status === "multiple"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : status === "noface_timeout"
              ? "bg-slate-500/10 text-slate-400 border-white/5"
              : status === "confirmed"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              : "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20 animate-pulse"
          }`}>
            {getStatusMessage()}
          </span>
        </div>

        {/* Subtle Static Works Offline Badge */}
        <div className="mt-8 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] text-slate-400 select-none">
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span>Biometric database matches local device · Works offline</span>
        </div>
      </div>
      
    </div>
  );
}
