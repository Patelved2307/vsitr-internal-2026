import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle2, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';

export const MentorPendingCard: React.FC = () => {
  const { team, isTeamLoggedIn, setActiveTab } = useAuth();

  if (!isTeamLoggedIn || !team) return null;

  const isPending = team.status === 'pending_mentor';

  return (
    <div className="w-full my-6">
      {isPending ? (
        /* Pending State: Glass card with Amber/Orange gradient left indicator */
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-5 sm:p-6 shadow-lg border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-orange-500" />
          <div className="flex items-start gap-3.5 pl-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Phase 2 Pending
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  {team.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1.5 tracking-tight">
                Mentor Details Pending — Action Required
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                Team <span className="font-bold text-slate-900">"{team.teamName}"</span> is registered! Please complete Phase 2 by submitting your official faculty mentor details to confirm final entry.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('mentor')}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-500/10 transition transform active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Add Mentor Details
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Completed State: Glass card with Green gradient left indicator */
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-5 sm:p-6 shadow-lg border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-600" />
          <div className="flex items-start gap-3.5 pl-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Fully Registered
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  {team.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1.5 tracking-tight">
                Registration Complete
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 mt-1.5">
                <span className="inline-flex items-center flex-wrap gap-1.5 text-emerald-700 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Team Registration ✔
                </span>
                <span className="inline-flex items-center flex-wrap gap-1.5 text-emerald-700 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Mentor Details ✔ ({team.mentor?.prefix} {team.mentor?.fullName})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('portal')}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-[#1B3F8B] to-blue-800 hover:from-blue-700 hover:to-indigo-800 shadow-md shadow-blue-900/10 transition transform active:scale-95"
          >
            Go to Team Portal
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
