/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertTriangle, RefreshCw, SwitchCamera } from "lucide-react";
import { ScanStatus } from "../pages/Home";

interface CameraViewfinderProps {
  status: ScanStatus;
}

export default function CameraViewfinder({ status }: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraState, setCameraState] = useState<"loading" | "active" | "denied" | "unsupported">("loading");
  const [key, setKey] = useState(0); // Trigger stream restart

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function startCamera() {
      setCameraState("loading");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState("unsupported");
        return;
      }

      try {
        // Stop any old stream to avoid multiple device locks
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        // Call getUserMedia with the exact requested layout
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: false
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        setCameraState("active");
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable, showing friendly permissions feedback:", err);
        setCameraState("denied");
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [key, facingMode]);

  const toggleCamera = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setKey(prev => prev + 1);
  };

  // Determine the bracket color theme based on the real-time biometric state
  const getBracketClass = () => {
    switch (status) {
      case "unrecognized":
        return "border-amber-500 text-amber-500 shadow-lg"; // soft amber
      case "confirmed":
        return "border-emerald-500 text-emerald-500 shadow-[0_0_15px_#10b981]"; // flash solid green
      case "scanning":
      case "multiple":
      case "noface_timeout":
      default:
        return "border-brand-cyan/35 text-brand-cyan/40 animate-pulse"; // dimmed blinking cyan
    }
  };

  const bracketColorClass = getBracketClass();

  return (
    <div className="relative w-full aspect-[4/5] max-h-[380px] bg-[#0c1428] rounded-3xl overflow-hidden border-2 border-brand-cyan/40 shadow-[0_0_20px_rgba(0,212,255,0.15)] shadow-black/80 flex flex-col items-center justify-center">
      {/* Background cyber grid layout for tech aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Camera Live Stream */}
      {cameraState === "active" && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "transform scale-x-[-1]" : ""}`}
        />
      )}

      {/* Cyber Vision Overlays / Handset Brackets */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none z-10 select-none">
        
        {/* The 4 dynamic corner bracket markers at the edges of the viewfinder */}
        <div className="absolute inset-4 border border-transparent pointer-events-none transition-all duration-300">
          {/* Top-Left Corner */}
          <div className={`absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] transition-all duration-300 ${bracketColorClass}`} />
          {/* Top-Right Corner */}
          <div className={`absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] transition-all duration-300 ${bracketColorClass}`} />
          {/* Bottom-Left Corner */}
          <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] transition-all duration-300 ${bracketColorClass}`} />
          {/* Bottom-Right Corner */}
          <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] transition-all duration-300 ${bracketColorClass}`} />
        </div>

        {/* Camera front/back toggle button positioned in the bottom-right corner of the viewfinder */}
        <div className="absolute bottom-4 right-4 pointer-events-auto z-20">
          <button
            type="button"
            onClick={toggleCamera}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 hover:border-brand-cyan/50 hover:text-brand-cyan transition-all duration-200 backdrop-blur-md shadow-lg outline-none active:scale-95 flex items-center justify-center cursor-pointer"
            title="Switch front/back camera"
          >
            <SwitchCamera className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Green overlay flash when matched perfectly */}
      {status === "confirmed" && (
        <div className="absolute inset-0 bg-emerald-500/20 z-30 pointer-events-none mix-blend-screen animate-fade-out" />
      )}

      {/* Simulator / Access Denied States */}
      {cameraState !== "active" && (
        <div className="absolute inset-0 bg-brand-bg/95 flex flex-col items-center justify-center p-6 text-center z-15">
          <div className="p-3 bg-brand-cyan/15 rounded-2xl text-brand-cyan mb-3">
            {cameraState === "loading" ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            )}
          </div>
          
          <h3 className="text-sm font-display font-bold text-white tracking-wide uppercase">
            {cameraState === "loading" ? "Initializing..." : "Camera Access Required"}
          </h3>
          <p className="text-xs text-slate-400 max-w-[240px] mt-1 leading-relaxed">
            {cameraState === "loading" 
              ? "Accessing camera sensors..." 
              : "Camera access required. Please allow camera permission."}
          </p>
          
          {cameraState === "denied" && (
            <button
              onClick={() => setKey(prev => prev + 1)}
              className="mt-4 px-4 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[11px] font-display font-semibold tracking-wide text-white rounded-lg flex items-center gap-1.5 pointer-events-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Grant Permission
            </button>
          )}
        </div>
      )}
    </div>
  );
}
