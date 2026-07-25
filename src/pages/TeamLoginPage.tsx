import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { KeyRound, ArrowRight, Sparkles } from 'lucide-react';

export const TeamLoginPage: React.FC = () => {
  const { loginTeamSession, setActiveTab, showAlert } = useAuth();

  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId.trim() || !teamName.trim() || !leaderEmail.trim()) {
      showAlert('Fields Required', 'Please enter your Team ID, Team Name, and Team Leader Email.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.loginTeam({
        teamId: teamId.trim(),
        teamName: teamName.trim(),
        leaderEmail: leaderEmail.trim(),
      });

      if (res.success && res.team) {
        loginTeamSession(res.team);
        setActiveTab('portal');
      }
    } catch (err: any) {
      showAlert(
        'Login Failed',
        err.message || 'The details you entered do not match our records. Please check your Team ID, Team Name, and Team Leader Email and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B] z-10" />

        {/* LEFT COLUMN: FORM */}
        <div className="p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1B3F8B] mb-3 shadow-xs">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              Team Portal Login
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
              Access your team status, official WhatsApp group link, and Phase 2 mentor submission portal.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 mt-6">
              {/* Team ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team ID / Registration ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SIH2026-001"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#1B3F8B] outline-none uppercase font-bold"
                />
              </div>

              {/* Team Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your registered team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1B3F8B] outline-none font-medium"
                />
              </div>

              {/* Team Leader Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team Leader Email ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. leader.personal@gmail.com"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1B3F8B] outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-800 hover:opacity-95 shadow-md transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    Login to Team Portal
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Haven't registered your team yet?{' '}
            <button
              onClick={() => setActiveTab('register')}
              className="font-bold text-[#C1272D] hover:underline"
            >
              Register Team
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN ONLY: IMAGE & OVERLAY BADGE */}
        <div className="relative hidden md:block bg-slate-900 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80"
            alt="VSITR Team Collaboration"
            className="absolute inset-0 w-full h-full object-cover opacity-50 filter contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-8 flex flex-col justify-end text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 border border-white/20 text-xs font-bold w-fit mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>VSITR KSV Student Hackathon</span>
            </div>
            <h3 className="text-xl font-black text-white leading-tight">
              Internal SIH 2026 Team Workspace
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Track registration status, download official pitch templates, communicate with faculty mentors, and join the student WhatsApp coordination group.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
