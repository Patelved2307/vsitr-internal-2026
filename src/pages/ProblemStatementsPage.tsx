import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProblemStatement } from '../types';
import { BookOpen, AlertTriangle, Check, AlertCircle } from 'lucide-react';

// Helper: render SDG field with each SDG on its own line
const renderSdg = (sdg: string) => {
  if (!sdg) return <span className="text-slate-400">—</span>;
  // Split on ", SDG" to break multiple SDGs into separate lines
  const parts = sdg.split(/,\s*(?=SDG)/i);
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => (
        <span key={i} className="block">{part.trim()}</span>
      ))}
    </span>
  );
};

export const ProblemStatementsPage: React.FC = () => {
  const { setActiveTab, isTeamLoggedIn, team, refreshTeamSession } = useAuth();
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal selection states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPsForConfirmation, setSelectedPsForConfirmation] = useState<ProblemStatement | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProblemStatements = async () => {
      try {
        setIsLoading(true);
        const data = await api.getProblemStatements();
        if (data.success) {
          setProblemStatements(data.problemStatements || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load problem statements.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblemStatements();
  }, []);

  const handleInitiateSelection = (ps: ProblemStatement) => {
    setSelectedPsForConfirmation(ps);
    setShowConfirmModal(true);
  };

  const handleConfirmSelection = async (ps: ProblemStatement) => {
    if (!team) return;
    try {
      setIsSubmitting(true);
      const res = await api.selectProblemStatement({
        teamId: team.id,
        psId: ps.id,
        psTitle: ps.title
      });
      if (res.success) {
        await refreshTeamSession();
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to select problem statement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Page Title & Subtitle */}
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
          Problem Statements
        </h1>
        <p className="text-sm text-slate-500 font-semibold leading-relaxed">
          Choose an institute-released problem statement to work on for the Internal Smart India Hackathon 2026. Teams should coordinate and lock their selection through their dashboard.
        </p>
      </div>

      {/* PS List View */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-16 w-full bg-slate-100 animate-pulse rounded-2xl" />
          <div className="h-48 w-full bg-slate-100 animate-pulse rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3 bg-red-50 rounded-3xl border border-red-200 max-w-md mx-auto">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">Failed to load problem statements</h3>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : problemStatements.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No problem statements found</h3>
          <p className="text-xs text-slate-500">There are no problem statements active at this moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* ⚠️ Important Note */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-700 leading-relaxed">
              <span className="font-black">Important:</span> Once a Problem Statement is selected, <span className="underline underline-offset-2">no modifications will be allowed</span>. Please review the details carefully before confirming your selection.
            </p>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-slate-800 text-sm border-collapse bg-white">
              <thead>
                <tr className="bg-[#1B3F8B] text-white uppercase font-extrabold text-xs border-b border-slate-300">
                  <th className="py-4 px-4 border-r border-[#1B3F8B]/20 w-24 text-center">PSID</th>
                  <th className="py-4 px-5 border-r border-[#1B3F8B]/20 min-w-[320px] text-center">Proposed Problem Statement</th>
                  <th className="py-4 px-5 border-r border-[#1B3F8B]/20 min-w-[160px] text-center">SDG</th>
                  <th className="py-4 px-5 border-r border-[#1B3F8B]/20 min-w-[180px] text-center">Theme</th>
                  <th className="py-4 px-5 border-r border-[#1B3F8B]/20 min-w-[160px] text-center">Category</th>
                  <th className="py-4 px-5 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {problemStatements.map((ps, idx) => {
                  const isSelectedByThisTeam = team?.selectedPsId === ps.id;
                  const isEven = idx % 2 === 1;
                  return (
                    <tr 
                      key={ps.id} 
                      className={`transition duration-150 ${isEven ? 'bg-slate-50/50' : 'bg-white'} hover:bg-blue-50/10`}
                    >
                      <td className="py-5 px-4 border-r border-slate-200 text-center font-bold text-slate-800 text-sm align-top">
                        {ps.id}
                      </td>
                      <td className="py-5 px-5 border-r border-slate-200 space-y-1.5 text-slate-800 text-sm align-top">
                        <strong className="font-bold block leading-snug text-slate-900 text-sm">
                          {ps.title}
                        </strong>
                        <p className="text-slate-500 text-sm leading-relaxed font-normal">
                          {ps.description}
                        </p>
                      </td>
                      <td className="py-5 px-5 border-r border-slate-200 text-slate-700 text-xs leading-normal align-top">
                        {renderSdg(ps.sdg || '')}
                      </td>
                      <td className="py-5 px-5 border-r border-slate-200 text-slate-700 text-xs leading-normal align-top">
                        {ps.theme || '—'}
                      </td>
                      <td className="py-5 px-5 border-r border-slate-200 text-slate-700 text-xs align-top">
                        {ps.category}
                      </td>
                      <td className="py-5 px-5 text-center align-top">
                        {isSelectedByThisTeam ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs uppercase tracking-wider">
                            <Check className="h-3.5 w-3.5" /> Selected
                          </span>
                        ) : isTeamLoggedIn ? (
                          <button
                            onClick={() => handleInitiateSelection(ps)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-[#1B3F8B] hover:bg-indigo-900 text-white rounded-xl font-bold text-xs transition duration-150 transform active:scale-95 shadow-md shadow-blue-900/10 cursor-pointer"
                          >
                            Select
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('login')}
                            className="inline-flex items-center justify-center px-3 py-2 border border-[#1B3F8B] text-[#1B3F8B] bg-white hover:bg-blue-50/30 rounded-xl font-bold text-xs transition duration-150 transform active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            Login to Select
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPsForConfirmation && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 shadow-2xl overflow-hidden transform animate-in scale-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#1B3F8B] px-7 py-5 text-white">
              <h3 className="text-lg font-black tracking-tight">Confirm Problem Statement Selection</h3>
              <p className="text-xs text-blue-200 mt-1">
                Please review the details below before confirming.
              </p>
            </div>

            <div className="p-7 space-y-5">

              {/* ⚠️ Warning Note */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-red-700 leading-relaxed">
                  <span className="font-black">Warning:</span> Once confirmed, this selection <span className="underline underline-offset-2">cannot be changed or modified</span>.
                </p>
              </div>

              {/* PS Details Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black font-mono text-[#1B3F8B] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                    PSID: {selectedPsForConfirmation.id}
                  </span>
                  {selectedPsForConfirmation.category && (
                    <span className="text-[11px] font-bold text-slate-600 uppercase border border-slate-200 bg-white px-2.5 py-1 rounded-lg">
                      {selectedPsForConfirmation.category}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-slate-900 leading-snug">
                  {selectedPsForConfirmation.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedPsForConfirmation.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {selectedPsForConfirmation.sdg && (
                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">SDG</p>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{selectedPsForConfirmation.sdg}</p>
                    </div>
                  )}
                  {selectedPsForConfirmation.theme && (
                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Theme</p>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{selectedPsForConfirmation.theme}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition duration-150 transform active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmSelection(selectedPsForConfirmation)}
                  className="px-6 py-2.5 rounded-xl font-black text-sm text-white bg-[#1B3F8B] hover:bg-indigo-900 transition duration-150 transform active:scale-95 shadow-md shadow-blue-900/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm & Select'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center space-y-6 transform animate-in scale-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600">
              <Check className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">PS Selected Successfully!</h3>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">
                Your problem statement has been locked. Stay tuned for updates on PPT submission and the Internal Round.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-left">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-amber-800 leading-relaxed">
                This selection is now final and <span className="underline underline-offset-2">cannot be modified</span>.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('portal');
                }}
                className="w-full py-3 rounded-xl font-black text-white bg-[#1B3F8B] hover:bg-indigo-900 transition duration-150 transform active:scale-95 shadow-md shadow-blue-900/10 cursor-pointer"
              >
                Go to Team Portal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
