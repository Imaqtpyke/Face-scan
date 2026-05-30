/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import * as faceapi from "@vladmandic/face-api";
import { Loader2, AlertTriangle } from "lucide-react";
import { ScanResult, REGISTERED_PERSONS } from "./types";
import Home from "./pages/Home";
import Result from "./pages/Result";
import HistoryPage from "./pages/History";
import Persons from "./pages/Persons";
import EnrollPerson from "./pages/EnrollPerson";
import TipsModal from "./components/TipsModal";
import BottomNav from "./components/BottomNav";

function AppContent() {
  const [modelLoaderState, setModelLoaderState] = useState<"loading" | "success" | "error">("loading");
  const [showTips, setShowTips] = useState<boolean>(false);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Load state from localStorage on construct
  useEffect(() => {
    // 1. Check if tips should display
    const hideTipsFlag = localStorage.getItem("faceScan_hideTips");
    if (!hideTipsFlag) {
      setShowTips(true);
    }

    // 2. Load scan history (pre-populate 2 aesthetic items for a live presentation if empty)
    const storedHistory = localStorage.getItem("faceScan_history");
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Error parsing history logs", e);
      }
    } else {
      // Pre-populate 2 beautiful scans for gorgeous demo out of the box
      const demoLog1: ScanResult = {
        id: "demo-1",
        name: "Yuki Tanaka",
        role: "Chief DevOps Evangelist",
        department: "Global Deployment Ops",
        accessLevel: "L3 Tier B",
        confidence: 91,
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        faceSignature: "F-SIG-331Y",
        avatarColor: "from-yellow-400 to-orange-500",
        avatarIconText: "YT"
      };

      const demoLog2: ScanResult = {
        id: "demo-2",
        name: "Marcus Chen",
        role: "Senior Security Engineer",
        department: "Cyber Defense Group",
        accessLevel: "L4 Tier B",
        confidence: 96,
        timestamp: new Date(Date.now() - 3600000 * 5).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        faceSignature: "F-SIG-112B",
        avatarColor: "from-indigo-500 to-purple-600",
        avatarIconText: "MC"
      };

      const demoHistory = [demoLog1, demoLog2];
      setHistory(demoHistory);
      localStorage.setItem("faceScan_history", JSON.stringify(demoHistory));
    }

    // 3. Load face-api biometric engine models globally
    async function initBiometrics() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        setModelLoaderState("success");
      } catch (err) {
        console.error("Failed loading biometric model files:", err);
        setModelLoaderState("error");
      }
    }
    initBiometrics();
  }, []);

  // Dismiss modal handler
  const handleCloseTips = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem("faceScan_hideTips", "true");
    }
    setShowTips(false);
  };

  // Open tips modal on demand
  const handleOpenTips = () => {
    setShowTips(true);
  };

  // Callback triggered when Home page identifies a high confidence match
  const handleFaceDetected = (detectedScan: ScanResult) => {
    setLastScan(detectedScan);
    navigate("/result");
  };

  // Defer saving until the user clicks "Save to History" on Result Page
  const handleSaveToHistory = (scan: ScanResult) => {
    const updatedHistory = [scan, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("faceScan_history", JSON.stringify(updatedHistory));
    setLastScan(null);
    navigate("/");
  };

  // Clear log history callback - actual cleaning
  const handleClearHistoryState = () => {
    setHistory([]);
    localStorage.removeItem("faceScan_history");
  };

  // Delete individual log entry
  const handleDeleteLog = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("faceScan_history", JSON.stringify(updatedHistory));
  };

  if (modelLoaderState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080d1a] px-6 select-none relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-cyan/5 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-xs font-display font-medium text-emerald-400 uppercase tracking-widest">
              Biometric Engine
            </span>
          </div>
          
          <h1 className="text-4xl font-display font-black tracking-tight text-white mb-2">
            FACE<span className="text-brand-cyan">SCAN</span>
          </h1>
          
          <p className="text-sm text-slate-300 font-medium mt-4">
            Initializing biometric engine...
          </p>

          <div className="w-56 h-1 bg-slate-900 border border-white/5 rounded-full overflow-hidden mt-6 relative">
            <div className="absolute top-0 bottom-0 left-0 bg-brand-cyan shadow-[0_0_10px_#00d4ff] rounded-full animate-pulse w-full duration-1000" />
          </div>

          <Loader2 className="w-8 h-8 animate-spin text-brand-cyan mt-6" />
        </div>
      </div>
    );
  }

  if (modelLoaderState === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080d1a] px-6 select-none relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center text-center max-w-[280px]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
          <h2 className="text-lg font-display font-bold text-white mb-2 uppercase tracking-wide">
            Engine Failure
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Failed to load biometric models. Please restart the app.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 hover:border-brand-cyan/60 rounded-xl text-xs font-display font-bold tracking-wider text-brand-cyan transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container flex flex-col shadow-2xl relative min-h-screen">
      
      {/* Absolute floating Tips Overlay */}
      {showTips && <TipsModal onClose={handleCloseTips} />}

      {/* Pages Container with consistent navigation bottom rail */}
      <div className="flex flex-col flex-1 pb-16">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                onDetected={handleFaceDetected} 
                onOpenTips={handleOpenTips} 
              />
            } 
          />
          <Route 
            path="/result" 
            element={
              <Result 
                lastScan={lastScan}
                onSave={handleSaveToHistory}
                onScanAgain={() => {
                  setLastScan(null);
                  navigate("/");
                }}
              />
            } 
          />
          <Route 
            path="/history" 
            element={
              <HistoryPage 
                history={history} 
                onClearHistory={handleClearHistoryState} 
                onDeleteLog={handleDeleteLog}
              />
            } 
          />
          <Route 
            path="/persons" 
            element={<Persons />} 
          />
          <Route 
            path="/persons/add" 
            element={<EnrollPerson />} 
          />
          <Route 
            path="/persons/edit/:id" 
            element={<EnrollPerson />} 
          />
        </Routes>
      </div>

      {/* Shared bottom navigation menu docks persistently at app shell floor */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
