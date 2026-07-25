import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TeamMember, Department, Gender } from '../types';
import { Users, User, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert, Mail, AlertTriangle } from 'lucide-react';

export const RegistrationPage: React.FC = () => {
  const { loginTeamSession, setActiveTab, showAlert, settings } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    teamId: string;
    teamName: string;
    leaderEmail: string;
    team: any;
  } | null>(null);

  // Step 1 State: Team Name
  const [teamName, setTeamName] = useState('');

  // Step 2 State: Leader Details
  const [leader, setLeader] = useState<TeamMember>({
    id: 'leader',
    fullName: '',
    gender: 'Male',
    enrollmentNo: '',
    semester: '5',
    department: 'IT',
    mobile: '',
    email: '',
    isLeader: true,
  });

  // Step 3 State: 5 Team Members
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 'm1', fullName: '', gender: 'Female', enrollmentNo: '', semester: '5', department: 'IT', mobile: '', email: '' },
    { id: 'm2', fullName: '', gender: 'Male', enrollmentNo: '', semester: '5', department: 'CSE', mobile: '', email: '' },
    { id: 'm3', fullName: '', gender: 'Male', enrollmentNo: '', semester: '5', department: 'CE', mobile: '', email: '' },
    { id: 'm4', fullName: '', gender: 'Male', enrollmentNo: '', semester: '3', department: 'IT', mobile: '', email: '' },
    { id: 'm5', fullName: '', gender: 'Male', enrollmentNo: '', semester: '3', department: 'CSE', mobile: '', email: '' },
  ]);

  const updateMember = (index: number, field: keyof TeamMember, value: any) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const addMemberRow = () => {
    if (members.length >= 5) {
      showAlert('Maximum Members Reached', 'A team can have a maximum of 5 members in addition to the Team Leader (6 total).', 'info');
      return;
    }
    setMembers([
      ...members,
      {
        id: `m${Date.now()}`,
        fullName: '',
        gender: 'Male',
        enrollmentNo: '',
        semester: '5',
        department: 'IT',
        mobile: '',
        email: '',
      },
    ]);
  };

  const removeMemberRow = (index: number) => {
    if (members.length <= 2) {
      showAlert('Minimum Required', 'You must have at least 2 members added here (plus leader) to form a complete 6-member team.', 'info');
      return;
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  // Step 1 Next Handler
  const handleStep1Next = async () => {
    const trimmed = teamName.trim();
    if (!trimmed) {
      showAlert('Team Name Required', 'Please enter a unique name for your team.');
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 200) {
      showAlert('Invalid Team Name', 'Team name must be between 3 and 200 characters long.');
      return;
    }
    const lower = trimmed.toLowerCase();
    if (lower.includes('vsitr') || lower.includes('vidush somany') || lower.includes('vidushsomany')) {
      showAlert(
        'Invalid Team Name',
        'Team name must NOT contain the institute name ("VSITR" or "Vidush Somany") per Rule 5.'
      );
      return;
    }
    try {
      const res = await api.checkTeamName(trimmed);
      if (res.exists) {
        showAlert('Team Already Exists', 'team already exist');
        return;
      }
      setStep(2);
    } catch (err: any) {
      showAlert('Check Failed', err.message || 'Could not verify if team name exists.');
    }
  };

  // Step 2 Next Handler
  const handleStep2Next = () => {
    if (!leader.fullName || !leader.enrollmentNo || !leader.mobile || !leader.email) {
      showAlert('Team Leader Information Incomplete', 'Please fill in all details for the Team Leader.');
      return;
    }
    if (leader.mobile.trim().length !== 10) {
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim())) {
      return;
    }
    setStep(3);
  };

  // Final Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client pre-checks
    if (members.length !== 5) {
      showAlert(
        'Registration Incomplete',
        'Each team must consist of exactly 6 members, including the Team Leader.'
      );
      return;
    }

    // Duplicate member name check removed per user request

    const allMembers = [leader, ...members];
    const allMobiles = allMembers.map(m => m.mobile.trim());
    if (new Set(allMobiles).size !== allMobiles.length) {
      showAlert('Duplicate Mobile Number', 'A mobile number has been entered more than once. Each team member must have a unique mobile number.');
      return;
    }

    const allEmails = allMembers.map(m => m.email.trim().toLowerCase());
    if (new Set(allEmails).size !== allEmails.length) {
      showAlert('Duplicate Email Address', 'An email address has been entered more than once. Each team member must have a unique email address.');
      return;
    }

    if (leader.mobile.trim().length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim())) {
      return;
    }

    for (const m of members) {
      if (m.mobile.trim().length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await api.registerTeam({
        teamName: teamName.trim(),
        leader,
        members,
      });

      if (res.success) {
        loginTeamSession(res.team);
        showAlert(
          'Registration Successful!',
          `Your Team ID is: ${res.team.id}\n\nPlease note this down. You have been redirected to your Team Portal to complete the mentor assignment.`,
          'success'
        );
        setActiveTab('portal');
      }
    } catch (err: any) {
      showAlert('Registration Failed', err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // On Success Close & Auto Login
  const handleSuccessClose = () => {
    if (successData?.team) {
      loginTeamSession(successData.team);
      setActiveTab('home');
    }
  };

  return (
    <div className="min-h-[80vh] py-10 px-4 max-w-4xl mx-auto">
      
      {/* Registration Header */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-[#C1272D] border border-red-100 text-xs font-extrabold uppercase tracking-widest mb-3 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-[#C1272D] animate-pulse" />
          PHASE 1: TEAM REGISTRATION
        </div>
        <div className="max-w-2xl mx-auto border border-slate-200 bg-white rounded-3xl p-6 sm:p-8 text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B]" />
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Register Your Team
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 font-medium">
            Form a 6-member team with at least 1 female student from VSITR (IT, CSE, CE departments).
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 max-w-md mx-auto px-4">
        <div className="relative flex items-center justify-between">
          {/* Track line passing right through the center of 40px (h-10) circles (top-5) */}
          <div className="absolute top-5 left-12 right-12 h-1 bg-slate-200 -translate-y-1/2 z-0 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] transition-all duration-300"
              style={{
                width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
              }}
            />
          </div>

          {/* Step 1 Circle */}
          <div className="relative z-10 flex flex-col items-center w-24">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-xs transition-all ${
                step >= 1
                  ? 'bg-[#C1272D] text-white border-[#C1272D] ring-4 ring-red-100'
                  : 'bg-white text-slate-400 border-slate-300'
              }`}
            >
              1
            </div>
            <span className={`text-xs font-bold mt-2 ${step >= 1 ? 'text-[#1B3F8B]' : 'text-slate-500'}`}>Team Name</span>
          </div>

          {/* Step 2 Circle */}
          <div className="relative z-10 flex flex-col items-center w-24">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-xs transition-all ${
                step >= 2
                  ? 'bg-[#1B3F8B] text-white border-[#1B3F8B] ring-4 ring-blue-100'
                  : 'bg-white text-slate-400 border-slate-300'
              }`}
            >
              2
            </div>
            <span className={`text-xs font-bold mt-2 ${step >= 2 ? 'text-[#1B3F8B]' : 'text-slate-500'}`}>Leader</span>
          </div>

          {/* Step 3 Circle */}
          <div className="relative z-10 flex flex-col items-center w-24">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-xs transition-all ${
                step >= 3
                  ? 'bg-amber-600 text-white border-amber-600 ring-4 ring-amber-100'
                  : 'bg-white text-slate-400 border-slate-300'
              }`}
            >
              3
            </div>
            <span className={`text-xs font-bold mt-2 ${step >= 3 ? 'text-[#1B3F8B]' : 'text-slate-500'}`}>Members</span>
          </div>
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-10 border border-slate-200 shadow-xl relative">
        <form onSubmit={(e) => { e.preventDefault(); if (step === 3) handleSubmit(e); }}>
          
          {/* STEP 1: TEAM NAME */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#C1272D]" />
                  Step 1: Choose Your Team Name
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your team name will be displayed on all official leaderboards and certificates.
                </p>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  Team Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Knights, Quantum Hackers, CyberForce"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C1272D] text-slate-900 font-semibold text-base shadow-xs"
                />
                <p className="text-xs text-slate-500 mt-2">
                  ⚠ Rule 5 Reminder: Must be unique across VSITR and must NOT contain institute name ("VSITR" or "Vidush Somany").
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] shadow-md hover:opacity-95 transition"
                >
                  Continue to Team Leader Details
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TEAM LEADER */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-[#1B3F8B]" />
                  Step 2: Team Leader Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  The Team Leader is the sole contact person for official SIH 2026 email communications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name (First - Middle - Last) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sorathiya Jenish Pravinbhai"
                    value={leader.fullName}
                    onChange={(e) => setLeader({ ...leader, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1B3F8B] outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={leader.gender}
                    onChange={(e) => setLeader({ ...leader, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1B3F8B] outline-none bg-white font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Enrollment Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enrollment Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24BEIT54026"
                    value={leader.enrollmentNo}
                    onChange={(e) => setLeader({ ...leader, enrollmentNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1B3F8B] outline-none font-mono"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={leader.department}
                    onChange={(e) => setLeader({ ...leader, department: e.target.value as Department })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1B3F8B] outline-none bg-white font-medium"
                  >
                    <option value="IT">IT (Information Technology)</option>
                    <option value="CSE">CSE (Computer Science &amp; Engg)</option>
                    <option value="CE">CE (Computer Engineering)</option>
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semester <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={leader.semester}
                    onChange={(e) => setLeader({ ...leader, semester: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1B3F8B] outline-none bg-white font-medium"
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8'].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (10 digits) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={leader.mobile}
                    onChange={(e) => setLeader({ ...leader, mobile: e.target.value.replace(/\D/g, '') })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 outline-none font-mono ${
                      leader.mobile && leader.mobile.length !== 10
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-[#1B3F8B]'
                    }`}
                  />
                  {leader.mobile && leader.mobile.length !== 10 && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">
                      Invalid phone number. Must be exactly 10 digits.
                    </p>
                  )}
                </div>

                {/* College / Personal Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email ID (Personal / College) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. leader.personal@gmail.com"
                    value={leader.email}
                    onChange={(e) => setLeader({ ...leader, email: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 outline-none ${
                      leader.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim())
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-[#1B3F8B]'
                    }`}
                  />
                  {leader.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim()) && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">
                      Invalid email address.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleStep2Next}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] shadow-md hover:opacity-95 transition"
                >
                  Continue to Members (5 Members)
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 5 TEAM MEMBERS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-600" />
                    Step 3: Team Members Details (5 Members)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Team Leader + {members.length} Members = {members.length + 1} Total. Must have at least 1 female participant.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border">
                    Total: {members.length + 1} / 6
                  </span>
                </div>
              </div>

              {/* Members Inputs List */}
              <div className="space-y-5">
                {members.map((member, idx) => (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs relative group hover:border-[#1B3F8B]/40 transition"
                  >
                    {/* Member Card Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-[#1B3F8B]/10 text-[#1B3F8B] font-black text-xs flex items-center justify-center">
                          {idx + 2}
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Member #{idx + 2} Information
                        </span>
                        {member.gender === 'Female' && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                            Female
                          </span>
                        )}
                      </div>

                      {/* No Remove Button (Fixed Team Size of 6) */}
                    </div>

                    {/* Member Grid Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5">
                      {/* Full Name */}
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="First Name - Middle - Surname"
                          value={member.fullName}
                          onChange={(e) => updateMember(idx, 'fullName', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1B3F8B] outline-none font-medium bg-slate-50/50 focus:bg-white"
                        />
                      </div>

                      {/* Gender */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Gender <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={member.gender}
                          onChange={(e) => updateMember(idx, 'gender', e.target.value as Gender)}
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-[#1B3F8B] outline-none font-bold ${
                            member.gender === 'Female'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-slate-50/50 text-slate-800 border-slate-200'
                          }`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female (Mandatory Check)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Enrollment No */}
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Enrollment No <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 24BEIT54026"
                          value={member.enrollmentNo}
                          onChange={(e) => updateMember(idx, 'enrollmentNo', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-[#1B3F8B] outline-none font-bold bg-slate-50/50 focus:bg-white"
                        />
                      </div>

                      {/* Department */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Department <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={member.department}
                          onChange={(e) => updateMember(idx, 'department', e.target.value as Department)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1B3F8B] outline-none font-bold bg-slate-50/50 focus:bg-white"
                        >
                          <option value="IT">IT</option>
                          <option value="CSE">CSE</option>
                          <option value="CE">CE</option>
                        </select>
                      </div>

                      {/* Semester */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Semester <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={member.semester}
                          onChange={(e) => updateMember(idx, 'semester', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1B3F8B] outline-none font-bold bg-slate-50/50 focus:bg-white"
                        >
                          {['1', '2', '3', '4', '5', '6', '7', '8'].map((s) => (
                            <option key={s} value={s}>
                              Sem {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mobile Number */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Mobile (10 digits) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={member.mobile}
                          onChange={(e) => updateMember(idx, 'mobile', e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono focus:ring-2 outline-none font-bold bg-slate-50/50 focus:bg-white ${
                            member.mobile && member.mobile.length !== 10
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-200 focus:ring-[#1B3F8B]'
                          }`}
                        />
                        {member.mobile && member.mobile.length !== 10 && (
                          <p className="text-[10px] text-red-600 mt-1 font-semibold">
                            Invalid phone number.
                          </p>
                        )}
                      </div>

                      {/* Email Address */}
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Email ID (Personal / College) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. member.personal@gmail.com"
                          value={member.email}
                          onChange={(e) => updateMember(idx, 'email', e.target.value)}
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 outline-none font-medium bg-slate-50/50 focus:bg-white ${
                            member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-200 focus:ring-[#1B3F8B]'
                          }`}
                        />
                        {member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim()) && (
                          <p className="text-[10px] text-red-600 mt-1 font-semibold">
                            Invalid email address.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-extrabold text-base text-white bg-gradient-to-r from-[#C1272D] via-[#8B235E] to-[#1B3F8B] shadow-lg shadow-red-900/20 hover:opacity-95 transition transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Validating &amp; Registering...
                    </span>
                  ) : (
                    <>
                      Submit Team Registration
                      <CheckCircle2 className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>

      {/* REGISTRATION SUCCESS MODAL OVERLAY (Section 3.2) */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in zoom-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4">
            
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h2 className="text-xl font-black text-slate-900">
                Registration Successful!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your team has been registered for Internal SIH 2026.
              </p>
            </div>

            {/* Registration ID Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center relative">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                TEAM / REGISTRATION ID
              </span>
              <span className="text-2xl font-mono font-black text-[#1B3F8B] tracking-wider block mt-0.5">
                {successData.teamId}
              </span>
              <span className="text-xs font-bold text-slate-700 block mt-0.5">
                "{successData.teamName}"
              </span>
            </div>

            {/* Small info cards */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 flex items-start gap-2">
                <Mail className="h-4 w-4 text-[#1B3F8B] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">
                  Confirmation sent to <strong className="font-bold">{successData.leaderEmail}</strong>. Check inbox regularly.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">
                  Status: <strong className="font-bold text-amber-950">Pending Mentor Details</strong> (Phase 2). Submit mentor info anytime from Team Portal.
                </p>
              </div>
            </div>

            <button
              onClick={handleSuccessClose}
              className="w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-800 hover:opacity-95 shadow-md transition transform active:scale-95"
            >
              Enter Team Portal
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
