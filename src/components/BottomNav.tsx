/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useLocation } from "react-router-dom";
import { Home, History } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isHomeActive = currentPath === "/" || currentPath === "/result";
  const isHistoryActive = currentPath === "/history";

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-[#0a0f1e]/85 backdrop-blur-xl border-t border-white/10 z-40 max-w-[480px] mx-auto">
      <div className="flex justify-around items-center">
        {/* Home Link */}
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-all duration-200 group relative ${
            isHomeActive ? "text-brand-cyan" : "text-slate-400 hover:text-white"
          }`}
        >
          <Home className="w-5.5 h-5.5 group-active:scale-95 transition-transform" />
          <span className="text-[10px] font-display font-medium uppercase tracking-wider">
            Home
          </span>
          {isHomeActive && (
            <span className="absolute -bottom-1 w-8 h-1 bg-brand-cyan rounded-full shadow-[0_0_8px_#00d4ff]" />
          )}
        </Link>

        {/* History Link */}
        <Link 
          to="/history" 
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-all duration-200 group relative ${
            isHistoryActive ? "text-brand-cyan" : "text-slate-400 hover:text-white"
          }`}
        >
          <History className="w-5.5 h-5.5 group-active:scale-95 transition-transform" />
          <span className="text-[10px] font-display font-medium uppercase tracking-wider">
            History
          </span>
          {isHistoryActive && (
            <span className="absolute -bottom-1 w-8 h-1 bg-brand-cyan rounded-full shadow-[0_0_8px_#00d4ff]" />
          )}
        </Link>
      </div>
    </div>
  );
}
