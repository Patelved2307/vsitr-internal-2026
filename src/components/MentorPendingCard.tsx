import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle2, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';

export const MentorPendingCard: React.FC = () => {
  const { team, isTeamLoggedIn, setActiveTab } = useAuth();

  if (!isTeamLoggedIn || !team) return null;

  const isPending = team.status === 'pending_mentor';

  return (
    <div className="max-w-4xl mx-auto px-4 my-6">
      {isPending ? (
        /* Pending State: Light card with Amber/Orange gradient left border */
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-md border border-amber-200 border-l-8 border-l-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Phase 2 Pending
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  {team.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                Mentor Details Pending — Action Required
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Team <span className="font-bold text-slate-900">"{team.teamName}"</span> is registered! Please complete Phase 2 by submitting your official faculty mentor details to confirm final entry.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('mentor')}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:opacity-95 shadow-md transition transform active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Add Mentor Details
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Completed State: Light card with Green gradient left border */
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-md border border-emerald-200 border-l-8 border-l-emerald-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Fully Registered
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  {team.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                Registration Complete
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 mt-1">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> Team Registration ✔
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> Mentor Details ✔ ({team.mentor?.prefix} {team.mentor?.fullName})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('portal')}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-800 hover:opacity-95 shadow-md transition"
          >
            Go to Team Portal
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
