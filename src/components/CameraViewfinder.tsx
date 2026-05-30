/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CameraOff, AlertTriangle, RefreshCw, SwitchCamera, Loader2 } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";
import { ScanStatus } from "../pages/Home";
import { getPersons, EnrolledPerson } from "../lib/indexedDb";
import { ScanResult } from "../types";

interface CameraViewfinderProps {
  status: ScanStatus;
  onStatusChange: (status: ScanStatus) => void;
  onDetected: (detectedScan: ScanResult) => void;
}

export default function CameraViewfinder({ status, onStatusChange, onDetected }: CameraViewfinderProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraState, setCameraState] = useState<"loading" | "active" | "denied" | "unsupported">("loading");
  const [key, setKey] = useState(0); // Trigger stream restart

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [enrolledPersons, setEnrolledPersons] = useState<EnrolledPerson[]>([]);

  // Detection cycle state refs
  const matchStartTimeRef = useRef<number | null>(null);
  const lastFaceSeenTimeRef = useRef<number>(Date.now());
  const isScanningRef = useRef<boolean>(true);

  // 1. Initial Load: face-api.js networks and IndexedDB Persons
  useEffect(() => {
    let active = true;

    async function loadResources() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        
        const dbPersons = await getPersons();
        
        if (active) {
          setEnrolledPersons(dbPersons);
          setModelsLoaded(true);
        }
      } catch (err) {
        console.error("Failed loading model files or database profiles", err);
      }
    }

    loadResources();

    return () => {
      active = false;
    };
  }, []);

  // 2. Camera Access Setup
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function startCamera() {
      if (modelsLoaded && enrolledPersons.length === 0) {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        return;
      }

      setCameraState("loading");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState("unsupported");
        return;
      }

      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

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
        console.warn("Camera access denied or unavailable:", err);
        setCameraState("denied");
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [key, facingMode, modelsLoaded, enrolledPersons.length]);

  // 3. Continuous 200ms Face Detection & Biometric Verification Frame Loop
  useEffect(() => {
    if (cameraState !== "active" || !modelsLoaded || !videoRef.current || enrolledPersons.length === 0) return;

    isScanningRef.current = true;
    matchStartTimeRef.current = null;
    lastFaceSeenTimeRef.current = Date.now();

    const runFrameCycle = async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || !isScanningRef.current) return;

      try {
        // Detect single face or multiple faces
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const faceCount = detections.length;

        if (faceCount === 0) {
          // Reset match start time since no face is in view
          matchStartTimeRef.current = null;

          const noFaceDuration = Date.now() - lastFaceSeenTimeRef.current;
          if (noFaceDuration >= 5000) {
            onStatusChange("noface_timeout");
          } else {
            onStatusChange("scanning");
          }
        } else if (faceCount > 1) {
          // Multiple faces -> pause calculations completely, request single face focus
          lastFaceSeenTimeRef.current = Date.now();
          matchStartTimeRef.current = null;
          onStatusChange("multiple");
        } else {
          // Exactly 1 face in the frame! Reset 5s idle clock instantly
          lastFaceSeenTimeRef.current = Date.now();

          const face = detections[0];
          const descriptor = face.descriptor;

          if (enrolledPersons.length === 0) {
            // No registered people in database -> unrecognized
            matchStartTimeRef.current = null;
            onStatusChange("unrecognized");
          } else {
            // Find the best Euclidean distance match against local template embeddings
            let bestMatch: EnrolledPerson | null = null;
            let minDistance = 999.0;

            for (const person of enrolledPersons) {
              const storedEmbedding = new Float32Array(person.faceSignature);
              const dist = faceapi.euclideanDistance(descriptor, storedEmbedding);
              if (dist < minDistance) {
                minDistance = dist;
                bestMatch = person;
              }
            }

            // Convert distance to biometric confidence % formula:
            const confidence = Math.max(0, (1 - minDistance) * 100);

            if (minDistance < 0.6) {
              // Math says person is identified, but we only trigger next screen if confidence >= 80% (distance <= 0.2)
              if (confidence >= 80 && bestMatch) {
                // Confidence meets the high-standards threshold! Start/maintain debounce timer
                if (matchStartTimeRef.current === null) {
                  matchStartTimeRef.current = Date.now();
                } else {
                  const duration = Date.now() - matchStartTimeRef.current;
                  if (duration >= 450) {
                    // Debounce criteria (400-500ms) satisfied consistently!
                    isScanningRef.current = false;
                    onStatusChange("confirmed"); // flash green state

                    const matchedSubject = bestMatch;
                    const finalConfidence = Math.round(confidence);

                    // Allow solid green visual brackets to glow for exactly 200ms before navigating
                    setTimeout(() => {
                      onDetected({
                        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        name: matchedSubject.name,
                        role: matchedSubject.role || "Biometric Directory ID",
                        department: matchedSubject.department || "On-Device Directory",
                        accessLevel: matchedSubject.accessLevel || "L3 Verified",
                        confidence: finalConfidence,
                        timestamp: new Date().toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        }),
                        faceSignature: "F-SIG-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
                        avatarColor: matchedSubject.avatarColor,
                        avatarIconText: matchedSubject.avatarIconText
                      });
                    }, 200);
                  }
                }
              } else {
                // Match exists but has insufficient confidence (< 80%), or no profile matches
                matchStartTimeRef.current = null;
                onStatusChange("unrecognized");
              }
            } else {
              // Too high distance -> unrecognized face
              matchStartTimeRef.current = null;
              onStatusChange("unrecognized");
            }
          }
        }
      } catch (err) {
        console.warn("Error processing viewfinder detection frame:", err);
      }
    };

    const intervalTimer = setInterval(runFrameCycle, 200);
    return () => {
      clearInterval(intervalTimer);
    };
  }, [cameraState, modelsLoaded, enrolledPersons, onStatusChange, onDetected]);

  const toggleCamera = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setKey(prev => prev + 1);
  };

  // Compute borders/brackets styling colors
  const getBracketClass = () => {
    switch (status) {
      case "unrecognized":
        return "border-amber-500 text-amber-500 shadow-lg";
      case "confirmed":
        return "border-emerald-500 text-emerald-500 shadow-[0_0_15px_#10b981]";
      case "scanning":
      case "multiple":
      case "noface_timeout":
      default:
        return "border-brand-cyan/35 text-brand-cyan/40 animate-pulse";
    }
  };

  const bracketColorClass = getBracketClass();

  if (modelsLoaded && enrolledPersons.length === 0) {
    const staticBracketClass = "border-slate-800 text-slate-800/80";
    return (
      <div className="relative w-full aspect-[4/5] max-h-[380px] bg-[#0c1428] rounded-3xl overflow-hidden border-2 border-slate-900 shadow-black/80 flex flex-col items-center justify-center p-6 text-center select-none">
        {/* Visual background structural tech grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* The 4 structural HUD viewfinder corners - Static & Dimmed */}
        <div className="absolute inset-4 border border-transparent pointer-events-none">
          <div className={`absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] ${staticBracketClass}`} />
          <div className={`absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] ${staticBracketClass}`} />
          <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] ${staticBracketClass}`} />
          <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] ${staticBracketClass}`} />
        </div>

        {/* Center content */}
        <div className="z-10 flex flex-col items-center max-w-[280px]">
          <div className="p-3 bg-slate-900/50 rounded-2xl text-slate-600 mb-4 border border-slate-800/50">
            <CameraOff className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-300 font-sans font-medium leading-relaxed">
            No persons registered. Go to the Persons tab to enroll someone first.
          </p>
          <button
            type="button"
            onClick={() => navigate("/persons")}
            className="mt-6 px-5 py-2.5 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 hover:border-brand-cyan/60 text-xs font-display font-medium uppercase tracking-wider text-brand-cyan rounded-xl transition-all duration-200 shadow-lg active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            Go to Persons →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/5] max-h-[380px] bg-[#0c1428] rounded-3xl overflow-hidden border-2 border-brand-cyan/40 shadow-[0_0_20px_rgba(0,212,255,0.15)] shadow-black/80 flex flex-col items-center justify-center">
      {/* Visual background structural tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Video stream rendering output layer */}
      {cameraState === "active" && modelsLoaded && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "transform scale-x-[-1]" : ""}`}
        />
      )}

      {/* Interactive hud grid overlays */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none z-10 select-none">
        
        {/* The 4 structural HUD viewfinder corners */}
        <div className="absolute inset-4 border border-transparent pointer-events-none transition-all duration-300">
          <div className={`absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] transition-all duration-300 ${bracketColorClass}`} />
          <div className={`absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] transition-all duration-300 ${bracketColorClass}`} />
          <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] transition-all duration-300 ${bracketColorClass}`} />
          <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] transition-all duration-300 ${bracketColorClass}`} />
        </div>

        {/* Floating toggle lens anchor */}
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

      {/* Success biometric flash trigger */}
      {status === "confirmed" && (
        <div className="absolute inset-0 bg-emerald-500/20 z-30 pointer-events-none mix-blend-screen animate-fade-out" />
      )}

      {/* Initializing / Loading Neural Networks Overlay */}
      {cameraState === "active" && !modelsLoaded && (
        <div className="absolute inset-0 bg-[#0a0f1e]/98 flex flex-col items-center justify-center p-6 text-center z-15">
          <div className="p-3 bg-brand-cyan/15 rounded-2xl text-brand-cyan mb-3 animate-[pulse_1.5s_infinite]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-sm font-display font-bold text-white tracking-wide uppercase">
            Loading Neural Processor
          </h3>
          <p className="text-xs text-slate-400 max-w-[240px] mt-1 leading-relaxed">
            Initializing face geometry and feature matching databases offline...
          </p>
        </div>
      )}

      {/* Access Denied / Permission Prompt Area */}
      {cameraState !== "active" && (
        <div className="absolute inset-0 bg-[#0a0f1e]/98 flex flex-col items-center justify-center p-6 text-center z-15">
          <div className="p-3 bg-brand-cyan/15 rounded-2xl text-brand-cyan mb-3">
            {cameraState === "loading" ? (
              <RefreshCw className="w-8 h-8 animate-spin text-brand-cyan" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            )}
          </div>
          
          <h3 className="text-sm font-display font-bold text-white tracking-wide uppercase">
            {cameraState === "loading" ? "Initializing..." : "Camera Access Required"}
          </h3>
          <p className="text-xs text-slate-400 max-w-[240px] mt-1 leading-relaxed">
            {cameraState === "loading" 
              ? "Accessing video capture device..." 
              : "Face scanner requires camera permissions. Please grant permission to continue."}
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
