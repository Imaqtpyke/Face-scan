/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ScanResult, REGISTERED_PERSONS } from "./types";
import Home from "./pages/Home";
import Result from "./pages/Result";
import HistoryPage from "./pages/History";
import TipsModal from "./components/TipsModal";
import BottomNav from "./components/BottomNav";

function AppContent() {
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
