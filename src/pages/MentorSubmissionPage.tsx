import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MentorPrefix, Department } from '../types';
import { GraduationCap, CheckCircle2, ArrowRight, UserCheck, Search, ShieldCheck } from 'lucide-react';

export const MentorSubmissionPage: React.FC = () => {
  const { team, isTeamLoggedIn, refreshTeamSession, setActiveTab, showAlert, loginTeamSession } = useAuth();

  const [teamIdInput, setTeamIdInput] = useState(team?.id || '');
  const [verifiedTeam, setVerifiedTeam] = useState<any>(team || null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [prefix, setPrefix] = useState<MentorPrefix>('Dr.');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<Department>('IT');
  const [institute, setInstitute] = useState('KSV Kadi');
  const [officeAddress, setOfficeAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (team) {
      setVerifiedTeam(team);
      setTeamIdInput(team.id);
    }
  }, [team]);

  const handleVerifyId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamIdInput.trim()) {
      showAlert('Team ID Required', 'Please enter your Registration ID (e.g. SIH2026-001).');
      return;
    }

    try {
      setIsVerifying(true);
      const res = await api.verifyTeam(teamIdInput.trim());
      if (res.success && res.team) {
        setVerifiedTeam(res.team);
      }
    } catch (err: any) {
      setVerifiedTeam(null);
      showAlert('Verification Failed', 'Registration ID not found.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitMentor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verifiedTeam?.id) {
      showAlert('Team ID Error', 'Please verify a valid Registration ID first.');
      return;
    }

    if (!fullName.trim() || !contactNumber.trim() || !email.trim() || !officeAddress.trim()) {
      showAlert('All Fields Required', 'Please fill in all mentor contact and office details.');
      return;
    }

    if (!/^\d{10}$/.test(contactNumber.trim())) {
      showAlert('Invalid Mobile Number', 'Please enter a valid 10-digit contact number for the mentor.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitMentor({
        teamId: verifiedTeam.id,
        mentor: {
          prefix,
          fullName: fullName.trim(),
          contactNumber: contactNumber.trim(),
          email: email.trim(),
          department,
          institute,
          officeAddress: officeAddress.trim(),
        },
      });

      if (res.success) {
        setIsSubmittedSuccess(true);
        if (res.team) {
          loginTeamSession(res.team);
        }
      }
    } catch (err: any) {
      showAlert('Submission Failed', err.message || 'Failed to submit mentor details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-10 px-4 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
          Phase 2: Mentor Details Submission
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          Faculty Mentor Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
          Link your official faculty mentor to confirm your Internal SIH 2026 team registration.
        </p>
      </div>

      {isSubmittedSuccess ? (
        /* SUCCESS SCREEN (Section 6.3) */
        <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-2xl text-center space-y-4 animate-in zoom-in duration-300">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900">
            ✅ Mentor Details Submitted Successfully
          </h2>

          <p className="text-sm font-semibold text-slate-700 max-w-md mx-auto">
            Thank you. Your SIH Internal Hackathon registration is now <span className="text-emerald-700 font-extrabold underline">fully completed</span>.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed text-left max-w-lg mx-auto">
            All future communication — screening schedules, problem statements, presentation dates, and selection updates — will be shared directly with the Team Leader via registered college email.
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('portal')}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-800 shadow-md hover:opacity-95 transition"
            >
              Go to Team Portal
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className="px-6 py-3 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      ) : (
        /* MENTOR FORM & VERIFICATION */
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          
          {/* Step 1: Verification */}
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Search className="h-4 w-4 text-[#1B3F8B]" />
              1. Verify Your Team ID
            </h2>

            <form onSubmit={handleVerifyId} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Enter Registration ID (e.g. SIH2026-001)"
                value={teamIdInput}
                onChange={(e) => setTeamIdInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-[#1B3F8B] outline-none"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-800 hover:opacity-95 transition"
              >
                {isVerifying ? 'Verifying...' : 'Verify Team'}
              </button>
            </form>

            {verifiedTeam && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Team Verified: <strong className="font-bold">"{verifiedTeam.teamName}"</strong> ({verifiedTeam.id}) — Leader: {verifiedTeam.leader?.fullName}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Mentor Form */}
          {verifiedTeam && (
            <form onSubmit={handleSubmitMentor} className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-amber-600" />
                2. Enter Faculty Mentor Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Prefix */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Title / Prefix *
                  </label>
                  <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value as MentorPrefix)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none bg-white"
                  >
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Ph.D.">Ph.D.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                  </select>
                </div>

                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mentor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parita Shah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none font-medium"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono outline-none"
                  />
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mentor.it@ksv.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none bg-white"
                  >
                    <option value="IT">IT</option>
                    <option value="CSE">CSE</option>
                    <option value="CE">CE</option>
                  </select>
                </div>

                {/* Institute */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institute *
                  </label>
                  <select
                    value={institute}
                    onChange={(e) => setInstitute(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none bg-white"
                  >
                    <option value="KSV Kadi">KSV Kadi (VSITR)</option>
                    <option value="KSV Gandhinagar">KSV Gandhinagar</option>
                  </select>
                </div>

                {/* Office Address */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Office / Cabin Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Cabin 204, IT Department, VSITR Block A, Kadi Campus"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:opacity-95 shadow-md transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Submitting Mentor Details...' : 'Submit Mentor Details & Complete Registration'}
                </button>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
};
