/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Image, 
  ShieldAlert, 
  Check, 
  X,
  Plus,
  Pencil
} from "lucide-react";
import { getPersons, deletePerson, EnrolledPerson } from "../lib/indexedDb";

export default function Persons() {
  const [persons, setPersons] = useState<EnrolledPerson[]>([]);
  const [personToDelete, setPersonToDelete] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadPersons();
    
    // Read state from navigate
    if (location.state && (location.state as any).toastMessage) {
      setToastMessage((location.state as any).toastMessage);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      
      // Clear navigation state from window history so we don't repeat the toast on load
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadPersons = async () => {
    try {
      const data = await getPersons();
      setPersons(data);
    } catch (e) {
      console.error("Failed to load persons from IndexedDB", e);
    }
  };

  const handleDeleteTrigger = (id?: number) => {
    if (id !== undefined) {
      setPersonToDelete(id);
    }
  };

  const handleConfirmDelete = async () => {
    if (personToDelete !== null) {
      try {
        await deletePerson(personToDelete);
        setPersonToDelete(null);
        setToastMessage("Person deleted successfully");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
        loadPersons();
      } catch (e) {
        console.error("Error deleting person", e);
      }
    }
  };

  const handleCancelDelete = () => {
    setPersonToDelete(null);
  };

  const maxPersonsReached = persons.length >= 10;

  return (
    <div className="flex flex-col flex-1 px-6 pt-8 pb-32 animate-in fade-in duration-300 relative min-h-[80vh]">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-[#0a0f1e] px-4.5 py-3 rounded-full font-display font-semibold text-xs tracking-wide shadow-2xl flex items-center gap-2 border border-emerald-400 select-none animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 stroke-[3px]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {personToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 select-none">
              <div className="p-2.5 bg-red-500/20 rounded-2xl text-red-400 flex-shrink-0 border border-red-500/20">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-display font-black text-white leading-tight">
                  Remove Registered Person
                </h3>
                <p className="text-[11px] text-slate-400">Database Action Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6 select-none">
              Are you sure you want to delete this person and all their biometric template signatures? This action is irreversible.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 font-display font-bold rounded-2xl text-xs transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-brand-bg font-display font-black rounded-2xl text-xs transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Row with Clear/Stats */}
      <div className="flex justify-between items-start mb-6 select-none">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white">
            Registered Persons
          </h1>
          <p className={`text-xs mt-1.5 font-semibold ${maxPersonsReached ? "text-amber-400" : "text-brand-cyan"}`}>
            {persons.length} / 10 registered
          </p>
        </div>
      </div>

      {/* Main Persons Content */}
      <div className="flex-1 flex flex-col">
        {persons.length === 0 ? (
          /* Empty state message */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto select-none">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-display font-bold text-white leading-snug">
              No Persons Registered Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-[245px] mt-1.5 leading-relaxed">
              Tap the button below to enroll a new person with local photos.
            </p>
          </div>
        ) : (
          /* List of registered persons */
          <div className="space-y-3.5 overflow-y-auto max-h-[60vh] no-scrollbar pb-16">
            {persons.map((person) => (
              <div 
                key={person.id}
                className="glass-panel hover:glass-panel-highlight rounded-2xl p-4 transition-all duration-200 flex items-center justify-between gap-3.5 relative overflow-hidden group border border-white/5 w-full"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Initials Avatar Bubble with custom colors from save */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${person.avatarColor || 'from-cyan-500 to-blue-600'} flex items-center justify-center font-display font-bold text-white text-sm shadow-md flex-shrink-0 group-hover:scale-105 transition-transform select-none`}>
                    {person.avatarIconText}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate pr-2" title={person.name}>
                      {person.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                      <Image className="w-3.5 h-3.5" />
                      <span>{person.photoCount} photos enrolled</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/persons/edit/${person.id}`)}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-cyan hover:bg-white/5 transition-all duration-200 z-10 cursor-pointer flex-shrink-0"
                    title="Edit person signature"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteTrigger(person.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all duration-200 z-10 cursor-pointer flex-shrink-0"
                    title="Delete person"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating fixed "+ Add Person" action button styled elegantly at bottom */}
      <div className="absolute bottom-24 left-6 right-6 z-30">
        {maxPersonsReached ? (
          <div className="w-full py-4 bg-slate-800/50 border border-white/5 rounded-2xl text-center select-none">
            <span className="text-xs font-display font-bold text-slate-500 uppercase tracking-wider">
              Maximum 10 persons reached
            </span>
          </div>
        ) : (
          <button
            onClick={() => navigate("/persons/add")}
            className="w-full py-4 bg-brand-cyan hover:bg-cyan-400 text-brand-bg font-display font-black rounded-2xl transition-all duration-200 active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/20 cursor-pointer border border-cyan-400/25"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            Add Person
          </button>
        )}
      </div>

    </div>
  );
}
