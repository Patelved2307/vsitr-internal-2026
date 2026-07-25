import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Upload, ArrowLeft, CheckCircle2, ExternalLink, AlertCircle, Loader2, FileText } from 'lucide-react';

export const PptSubmissionPage: React.FC = () => {
  const { team, isTeamLoggedIn, setActiveTab, settings, showAlert } = useAuth();

  const [teamId, setTeamId] = useState(team?.id || '');
  const [teamName, setTeamName] = useState(team?.teamName || '');
  const [leaderName, setLeaderName] = useState(team?.leader?.fullName || '');
  const [leaderEmail, setLeaderEmail] = useState(team?.leader?.email || '');
  const [fileUrl, setFileUrl] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isOpen = settings.pptSubmissionOpen ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId.trim() || !teamName.trim() || !leaderName.trim() || !leaderEmail.trim() || !fileUrl.trim()) {
      showAlert('Missing Fields', 'Please fill in all required fields.', 'error');
      return;
    }
    try { new URL(fileUrl); } catch { showAlert('Invalid URL', 'Please enter a valid shareable link.', 'error'); return; }
    try {
      setIsSubmitting(true);
      await api.submitPpt({ teamId, teamName, leaderName, leaderEmail, fileUrl, note });
      setSubmitted(true);
    } catch (err: any) {
      showAlert('Submission Failed', err.message || 'Could not submit PPT. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-emerald-100"><CheckCircle2 className="h-12 w-12 text-emerald-600" /></div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">PPT Submitted!</h2>
            <p className="text-sm text-slate-500">Your presentation has been submitted successfully for team <span className="font-bold text-slate-800">{teamId}</span>. The organizing committee will review it and contact you via the team leader email.</p>
          </div>
          <button onClick={() => setActiveTab('home')} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] hover:opacity-95 transition shadow-md">
            <ArrowLeft className="h-4 w-4" />Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] px-4 py-10 max-w-2xl mx-auto">
      <button onClick={() => setActiveTab('home')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-6 transition">
        <ArrowLeft className="h-3.5 w-3.5" />Back to Home
      </button>
      <div className="rounded-3xl bg-white border border-slate-200 shadow-md overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#1B3F8B] to-[#C1272D]" />
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#1B3F8B]"><Upload className="h-6 w-6" /></div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">PPT Submission</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Internal SIH 2026 — Pitch Deck Upload</span>
            </div>
          </div>
          {settings.pptSubmissionStatus && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 font-semibold leading-relaxed">{settings.pptSubmissionStatus}</p>
            </div>
          )}
          {!isOpen ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="p-4 rounded-full bg-slate-100"><FileText className="h-8 w-8 text-slate-400" /></div>
              <div>
                <p className="text-sm font-bold text-slate-700">PPT Submission is Currently Closed</p>
                <p className="text-xs text-slate-400 mt-1">The admin will open submissions when the time comes. Check back later.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-800 font-semibold leading-relaxed"><span className="font-black">How to submit:</span> Upload your PPT to Google Drive or OneDrive, set sharing to "Anyone with the link can view", and paste the shareable link below.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Team ID <span className="text-red-500">*</span></label>
                <input type="text" value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="e.g. SIH2026-001" readOnly={isTeamLoggedIn} className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 transition ${isTeamLoggedIn ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900'}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Team Name <span className="text-red-500">*</span></label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Your team name" readOnly={isTeamLoggedIn} className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 transition ${isTeamLoggedIn ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900'}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Team Leader Name <span className="text-red-500">*</span></label>
                <input type="text" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} placeholder="Full name of team leader" readOnly={isTeamLoggedIn} className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 transition ${isTeamLoggedIn ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900'}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Team Leader Email <span className="text-red-500">*</span></label>
                <input type="email" value={leaderEmail} onChange={(e) => setLeaderEmail(e.target.value)} placeholder="leader@vsitr.ac.in" readOnly={isTeamLoggedIn} className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 transition ${isTeamLoggedIn ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900'}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">PPT Shareable Link <span className="text-red-500">*</span></label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 transition" required />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Make sure sharing is set to "Anyone with the link can view" on Google Drive / OneDrive.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Additional Note <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any additional information for the organizing committee..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 transition resize-none" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-[#1B3F8B] to-[#C1272D] hover:opacity-95 active:scale-[0.99] transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>) : (<><Upload className="h-4 w-4" />Submit PPT</>)}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
