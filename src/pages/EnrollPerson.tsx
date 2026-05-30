/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  FolderOpen, 
  Upload, 
  Trash2, 
  Loader2, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import * as faceapi from "@vladmandic/face-api";
import { savePerson, getPersons, getPerson, updatePerson, EnrolledPerson } from "../lib/indexedDb";

const GRADIENTS = [
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-purple-600",
  "from-fuchsia-500 to-pink-600",
  "from-emerald-400 to-teal-600",
  "from-violet-500 to-indigo-600",
  "from-yellow-400 to-orange-500",
  "from-rose-500 to-red-600",
  "from-pink-400 to-rose-500",
  "from-teal-400 to-cyan-600",
  "from-blue-500 to-fuchsia-600"
];

// Helper to calculate initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "??";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EnrollPerson() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
  const [existingPerson, setExistingPerson] = useState<EnrolledPerson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [errorWarning, setErrorWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load existing user metadata for Edit mode
  useEffect(() => {
    if (isEdit && id) {
      async function fetchPerson() {
        try {
          const p = await getPerson(Number(id));
          if (p) {
            setExistingPerson(p);
            setName(p.name);
          } else {
            setErrorWarning("Selected person record not found.");
          }
        } catch (err) {
          console.error("Error loading person for edit:", err);
          setErrorWarning("Failed to load person record.");
        }
      }
      fetchPerson();
    }
  }, [isEdit, id]);

  // Clean up ObjectURLs on unmount to prevent leaks
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFilesAdded = (addedFiles: FileList | null) => {
    if (!addedFiles) return;

    // Filter image files only (jpg, jpeg, png, webp)
    const validFiles = Array.from(addedFiles).filter(file => {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();
      const isImg = type.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp");
      return isImg;
    });

    if (validFiles.length === 0) return;

    // Folder identification autofill: if we got webkitRelativePath, parse directory name
    const firstRelPath = validFiles[0].webkitRelativePath;
    if (firstRelPath) {
      const pathSegments = firstRelPath.split("/");
      if (pathSegments.length > 1 && !name) {
        // Autofill folder name
        const folderName = pathSegments[0].replace(/[-_]/g, " ");
        setName(folderName);
      }
    }

    // Limit to max 20 photos
    const currentFiles = [...files, ...validFiles];
    const limitedFiles = currentFiles.slice(0, 20);

    setFiles(limitedFiles);

    // Create preview objects
    const newPreviews = limitedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Check if under 10 valid images after filtering
    if (limitedFiles.length < 10) {
      setErrorWarning("At least 10 photos are required for enrollment (Current: " + limitedFiles.length + ")");
    } else {
      setErrorWarning(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke removed object URL
    URL.revokeObjectURL(previews[index]);

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);

    // Update failed indices with index shifts
    setFailedIndices(prev => 
      prev
        .filter(i => i !== index)
        .map(i => (i > index ? i - 1 : i))
    );

    if (updatedFiles.length < 10) {
      setErrorWarning("At least 10 photos are required for enrollment (Current: " + updatedFiles.length + ")");
    } else {
      setErrorWarning(null);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorWarning(null);
    setFailedIndices([]);

    // Validations
    if (!name.trim()) {
      setErrorWarning("Person's name is required.");
      return;
    }
    if (files.length < 10) {
      setErrorWarning("Minimum 10 photos required (loaded: " + files.length + ").");
      return;
    }
    if (files.length > 20) {
      setErrorWarning("Maximum 20 photos allowed.");
      return;
    }

    try {
      // 1. Verify we didn't exceed 10 registered persons limit (Skip if editing)
      if (!isEdit) {
        const existingList = await getPersons();
        if (existingList.length >= 10) {
          setErrorWarning("Maximum 10 persons reached. You must delete an existing entry first.");
          return;
        }
      }

      setIsLoading(true);
      setLoadProgress(0);
      setProgressText("Loading AI models...");

      // 2. Load face-api.js networks
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      const extractedDescriptors: number[][] = [];
      const tempFailedIndices: number[] = [];
      
      // 3. Sequential async loop extraction with 100ms pauses to yield UI thread
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pct = Math.round(((i) / files.length) * 100);
        setLoadProgress(pct);
        setProgressText(`Analyzing photo ${i + 1} of ${files.length}...`);

        // Give UI chance to breathe and animate
        await new Promise(r => setTimeout(r, 100));

        // Load file to HTML Image Element
        const imgElement = document.createElement("img");
        const objectUrl = URL.createObjectURL(file);
        imgElement.src = objectUrl;

        await new Promise((resolve) => {
          imgElement.onload = resolve;
          imgElement.onerror = resolve; // Continue on failure
        });

        try {
          const detection = await faceapi.detectSingleFace(
            imgElement,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

          if (detection) {
            extractedDescriptors.push(Array.from(detection.descriptor));
          } else {
            console.warn(`No face detected in photo index ${i}`);
            tempFailedIndices.push(i);
          }
        } catch (err) {
          console.error(`Error analyzing photo index ${i}`, err);
          tempFailedIndices.push(i);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      }

      setFailedIndices(tempFailedIndices);
      setLoadProgress(100);

      // 4. Validate output descriptors
      if (extractedDescriptors.length < 10) {
        setIsLoading(false);
        setErrorWarning("Not enough valid face photos. Please upload at least 10 photos with a clearly visible face.");
        return;
      }

      setProgressText("Compiling template signatures...");
      await new Promise(r => setTimeout(r, 300));

      // 5. Average the descriptors
      const dimension = 128;
      const averagedSignature = new Array(dimension).fill(0);
      for (let d = 0; d < dimension; d++) {
        let sum = 0;
        for (let i = 0; i < extractedDescriptors.length; i++) {
          sum += extractedDescriptors[i][d];
        }
        averagedSignature[d] = sum / extractedDescriptors.length;
      }

      if (isEdit && existingPerson) {
        // Overwrite existing biometric record
        await updatePerson({
          ...existingPerson,
          faceSignature: averagedSignature,
          photoCount: extractedDescriptors.length
        });
        setIsLoading(false);
        navigate("/persons", { state: { toastMessage: "Face signature updated successfully" } });
      } else {
        // 6. Set gorgeous metadata for new profile slot
        const initials = getInitials(name);
        const asciiSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const colorIndex = asciiSum % GRADIENTS.length;
        const avatarColor = GRADIENTS[colorIndex];

        // Standard randomized secure levels
        const roles = ["Biometric Directory ID", "Enrolled Subject", "Corporate ID Member", "Internal Operations Link"];
        const departments = ["General Staff", "Administrative Access", "Device Directory", "Operations Team"];
        const levels = ["L1 Basic", "L2 Tier C", "L3 Verified", "L4 Active"];

        const personRole = roles[asciiSum % roles.length];
        const personDept = departments[asciiSum % departments.length];
        const personLevel = levels[asciiSum % levels.length];

        // Save new!
        await savePerson({
          name: name.trim(),
          faceSignature: averagedSignature,
          photoCount: extractedDescriptors.length,
          avatarColor,
          avatarIconText: initials,
          role: personRole,
          department: personDept,
          accessLevel: personLevel
        });

        setIsLoading(false);
        navigate("/persons");
      }
    } catch (e) {
      console.error("Failed to enroll person", e);
      setIsLoading(false);
      setErrorWarning("An error occurred during biometric analysis: " + String(e));
    }
  };

  // Helper inputs triggers
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerFolderInput = () => {
    folderInputRef.current?.click();
  };

  const photoCountBadge = `${files.length} / 20 photos`;

  return (
    <div className="flex flex-col flex-1 px-6 pt-8 pb-32 animate-in fade-in duration-300 relative min-h-[80vh]">
      
      {/* Loading Extraction Progress Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#0a0f1e]/95 backdrop-blur-xl select-none">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-8 border border-white/10 text-center flex flex-col items-center">
            
            <div className="relative mb-6">
              <div className="absolute inset-[-10px] rounded-full border border-dashed border-brand-cyan/25 animate-spin" style={{ animationDuration: "12s" }} />
              <div className="w-16 h-16 rounded-2xl bg-brand-cyan/15 flex items-center justify-center text-brand-cyan shadow-lg shadow-cyan-900/10">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <h3 className="text-lg font-display font-black text-white leading-tight">
              Biometric Enrollment
            </h3>
            <p className="text-[11px] text-brand-cyan uppercase font-mono tracking-wider mt-1">
              Analyzing Face Topology
            </p>

            <span className="text-2xl font-mono font-extrabold text-white mt-5">
              {loadProgress}%
            </span>

            {/* Progress track */}
            <div className="w-full h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden mt-3 mb-4">
              <div 
                className="h-full bg-gradient-to-r from-brand-cyan to-teal-400 shadow-[0_0_8px_#00d4ff] transition-all duration-300 ease-out"
                style={{ width: `${loadProgress}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 select-all max-w-[240px] truncate">
              {progressText}
            </p>
          </div>
        </div>
      )}

      {/* Top Back Nav Row */}
      <div className="flex items-center gap-3 mb-6 select-none">
        <button
          onClick={() => navigate("/persons")}
          type="button"
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-brand-cyan/40 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-extrabold text-white leading-none">
            {isEdit ? "Re-enroll Subject" : "Enroll Subject"}
          </h1>
          <p className="text-[11px] text-slate-400 mt-1">
            {isEdit ? "Update on-device face template" : "Device Biometrics Registry"}
          </p>
        </div>
      </div>

      <form onSubmit={handleEnroll} className="flex-1 flex flex-col justify-between">
        
        <div className="space-y-5">
          {/* Validation Banner Block */}
          {errorWarning && (
            <div className="p-3.5 bg-red-500/15 border border-red-500/25 rounded-2xl text-red-400 text-xs flex gap-2.5 items-start select-none animate-shake">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <p className="leading-normal">{errorWarning}</p>
            </div>
          )}

          {/* Name Input Field */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-2">
            <label className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
              Subject Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorWarning && e.target.value.trim()) setErrorWarning(null);
              }}
              placeholder="e.g. Dr. Sarah Jenkins"
              disabled={isLoading || isEdit}
              className={`w-full px-4 py-3.5 border rounded-xl font-display text-sm font-semibold outline-none transition-all focus:ring-1 focus:ring-brand-cyan/30 ${
                isEdit 
                  ? "bg-white/[0.02] border-white/5 text-slate-400 cursor-not-allowed select-none" 
                  : "bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 hover:border-brand-cyan/40 focus:border-brand-cyan focus:bg-white/[0.07]"
              }`}
            />
            {isEdit && existingPerson && (
              <p className="text-[10px] text-brand-cyan/85 font-mono mt-1">
                Currently: {existingPerson.photoCount} photos enrolled
              </p>
            )}
          </div>

          {/* Photo Import Options Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center select-none">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400">
                  Biometric Face Set [10-20]
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Accepts JPEG, PNG, WEBP files</p>
              </div>
              <span className={`text-xs font-mono font-black ${
                files.length >= 10 && files.length <= 20 ? "text-emerald-400" : "text-amber-400"
              }`}>
                {photoCountBadge}
              </span>
            </div>

            {/* Dual Selection Targets Panel */}
            <div className="grid grid-cols-2 gap-3">
              {/* Single Files Picker */}
              <button
                type="button"
                onClick={triggerFileInput}
                className="py-4.5 border border-dashed border-white/10 hover:border-brand-cyan/50 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-400 hover:text-white active:scale-[0.98] cursor-pointer"
              >
                <Upload className="w-5 h-5 text-brand-cyan" />
                <span className="text-xs font-display font-semibold">Select Files</span>
              </button>

              {/* Directory Folder Picker */}
              <button
                type="button"
                onClick={triggerFolderInput}
                className="py-4.5 border border-dashed border-white/10 hover:border-brand-cyan/50 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-400 hover:text-white active:scale-[0.98] cursor-pointer"
              >
                <FolderOpen className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-display font-semibold">Upload Folder</span>
              </button>
            </div>

            {/* Hidden Input Files element supports multiple */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFilesAdded(e.target.files)}
              accept=".jpg,.jpeg,.png,.webp,image/*"
              multiple
              className="hidden"
            />

            {/* Hidden Input WebkitDirectory folder support */}
            <input
              type="file"
              ref={folderInputRef}
              onChange={(e) => handleFilesAdded(e.target.files)}
              accept=".jpg,.jpeg,.png,.webp,image/*"
              {...{ webkitdirectory: "", directory: "", multiple: true } as any}
              className="hidden"
            />

            {/* Grid Thumbnail Preview Board */}
            {previews.length > 0 && (
              <div className="pt-2">
                <div className="grid grid-cols-5 gap-2 max-h-[140px] overflow-y-auto no-scrollbar pr-1">
                  {previews.map((url, i) => {
                    const isFailed = failedIndices.includes(i);
                    return (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-lg overflow-hidden border relative group bg-black/40 shadow-inner transition-all duration-200 ${
                          isFailed ? "border-amber-500/60 ring-1 ring-amber-500/20" : "border-white/10"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        
                        {/* No face found badge overlay */}
                        {isFailed && (
                          <div className="absolute inset-x-0 bottom-0 bg-amber-600/90 text-[8px] font-mono font-medium tracking-wide text-white py-0.5 text-center select-none z-10">
                            No face found
                          </div>
                        )}

                        {/* Delete Overlay button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute inset-0 bg-red-600/80 items-center justify-center text-white p-1 select-none flex opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trigger Enrollment Button */}
        <div className="pt-8 pb-4">
          <button
            type="submit"
            disabled={files.length < 10 || !name.trim()}
            className={`w-full py-4 text-brand-bg font-display font-black rounded-2xl transition-all duration-200 active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2 border shadow-lg ${
              files.length >= 10 && name.trim()
                ? "bg-brand-cyan hover:bg-cyan-400 border-cyan-400/25 shadow-cyan-950/20 cursor-pointer"
                : "bg-slate-800 border-white/5 text-slate-500 cursor-not-allowed"
            }`}
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            {isEdit ? "Update Signature" : "Enroll Person"}
          </button>
        </div>

      </form>
    </div>
  );
}
