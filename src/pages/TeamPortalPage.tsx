import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserCheck, ShieldCheck, UserPlus, ExternalLink, Headset, Users, GraduationCap, AlertTriangle, ArrowRight, Edit3, X, Save, Check, User } from 'lucide-react';

export const TeamPortalPage: React.FC = () => {
  const { team, isTeamLoggedIn, setActiveTab, settings, clubCoordinators, loginTeamSession, showAlert, refreshTeamSession } = useAuth();

  useEffect(() => {
    if (isTeamLoggedIn) {
      refreshTeamSession();
    }
  }, []);

  // Edit Modals State
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [isEditingMentor, setIsEditingMentor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for editing members
  const [editLeader, setEditLeader] = useState<any>(null);
  const [editMembers, setEditMembers] = useState<any[]>([]);

  // Form State for editing mentor
  const [editMentor, setEditMentor] = useState<any>({
    prefix: 'Prof.',
    fullName: '',
    contactNumber: '',
    email: '',
    department: 'IT',
    institute: 'VSITR',
    officeAddress: '',
  });

  if (!isTeamLoggedIn || !team) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-red-100 text-[#C1272D] mb-3">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          Session Expired or Not Logged In
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Please log in with your Team ID and Leader Email to view your Team Portal.
        </p>
        <button
          onClick={() => setActiveTab('login')}
          className="mt-4 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-800 shadow-md"
        >
          Go to Team Login
        </button>
      </div>
    );
  }

  const allMembers = [team.leader, ...team.members];
  const isPendingMentor = team.status === 'pending_mentor';

  // Open Members Edit Modal
  const openEditMembers = () => {
    setEditLeader({ ...team.leader });
    setEditMembers(team.members.map((m) => ({ ...m })));
    setIsEditingMembers(true);
  };

  // Open Mentor Edit Modal
  const openEditMentor = () => {
    if (team.mentor) {
      setEditMentor({ ...team.mentor });
    } else {
      setEditMentor({
        prefix: 'Prof.',
        fullName: '',
        contactNumber: '',
        email: '',
        department: team.leader.department || 'IT',
        institute: 'VSITR',
        officeAddress: 'VSITR Campus',
      });
    }
    setIsEditingMentor(true);
  };

  // Save Member Edits
  const handleSaveMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editLeader.mobile.trim().length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editLeader.email.trim())) {
      return;
    }
    for (const m of editMembers) {
      if (m.mobile.trim().length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
        return;
      }
    }
    setIsSaving(true);
    try {
      const res = await api.updateTeamSelf({
        teamId: team.id,
        teamName: team.teamName,
        leaderEmail: team.leader.email,
        leader: editLeader,
        members: editMembers,
      });

      if (res.team) {
        loginTeamSession(res.team);
        showAlert('Team Updated', 'Team member details updated successfully!', 'success');
        setIsEditingMembers(false);
      }
    } catch (err: any) {
      showAlert('Update Failed', err.message || 'Could not update team member details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Mentor Edits
  const handleSaveMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editMentor.contactNumber.trim().length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editMentor.email.trim())) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.updateTeamSelf({
        teamId: team.id,
        teamName: team.teamName,
        leaderEmail: team.leader.email,
        mentor: editMentor,
      });

      if (res.team) {
        loginTeamSession(res.team);
        showAlert('Mentor Details Saved', 'Faculty mentor details saved successfully!', 'success');
        setIsEditingMentor(false);
      }
    } catch (err: any) {
      showAlert('Save Failed', err.message || 'Could not save mentor details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* 5.1 TEAM ID SUMMARY BANNER */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-mono font-black bg-slate-100 text-slate-800 border border-slate-200">
                {team.id}
              </span>
              
              {isPendingMentor ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Pending Mentor Details
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Registration Completed
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Team "{team.teamName}"
            </h1>

            <p className="text-xs text-slate-500">
              Registered on: <span className="font-semibold text-slate-700">{new Date(team.createdAt).toLocaleString('en-IN')}</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openEditMembers}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#1B3F8B]" />
              Edit Team Members
            </button>

            {isPendingMentor ? (
              <button
                onClick={openEditMentor}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 shadow-md transition transform active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
                Add Mentor Details
              </button>
            ) : (
              <button
                onClick={openEditMentor}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
              >
                <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                Edit Mentor Info
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5.4 JOIN WHATSAPP GROUP CARD */}
      <div className="p-0.5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-700 shadow-lg">
        <div className="bg-white rounded-[22px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Official Communication Channel
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Join Official SIH 2026 WhatsApp Group
            </h3>
            <p className="text-xs text-slate-600">
              All real-time updates, screening calls, presentation schedules, and reminders will be shared here.
            </p>
          </div>

          <a
            href="https://chat.whatsapp.com/EfS0SSUc9aX4DJUhfrpD2U"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition"
          >
            Join WhatsApp Group
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* 5.2 TEAM MEMBER DETAILS TABLE / CARDS */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#C1272D]" />
            <h2 className="text-lg font-bold text-slate-900">
              Team Composition (6 Members)
            </h2>
          </div>
          <button
            onClick={openEditMembers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-[#1B3F8B] bg-blue-50 hover:bg-blue-100 transition"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Members
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider border-b border-slate-200">
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Full Name</th>
                <th className="py-3 px-3">Gender</th>
                <th className="py-3 px-3">Enrollment No</th>
                <th className="py-3 px-3">Dept</th>
                <th className="py-3 px-3">Sem</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {allMembers.map((m, idx) => (
                <tr key={idx} className={m.isLeader ? 'bg-blue-50/50 font-bold' : ''}>
                  <td className="py-3 px-3">
                    {m.isLeader ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1B3F8B] text-white">
                        TEAM LEADER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Member #{idx + 1}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-900 font-bold">{m.fullName}</td>
                  <td className="py-3 px-3">
                    <span className={m.gender === 'Female' ? 'text-purple-700 font-bold' : ''}>
                      {m.gender}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{m.enrollmentNo}</td>
                  <td className="py-3 px-3 font-bold text-[#1B3F8B]">{m.department}</td>
                  <td className="py-3 px-3">Sem {m.semester}</td>
                  <td className="py-3 px-3 font-mono">{m.mobile}</td>
                  <td className="py-3 px-3">{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
          {allMembers.map((m, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                m.isLeader ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  m.isLeader ? 'bg-[#1B3F8B] text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {m.isLeader ? 'TEAM LEADER' : `Member #${idx + 1}`}
                </span>
                <span className="font-bold text-[#1B3F8B]">{m.department} • Sem {m.semester}</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{m.fullName}</p>
              <p className="text-slate-600 font-mono">Enr: {m.enrollmentNo}</p>
              <p className="text-slate-600">Mobile: {m.mobile} | Email: {m.email}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5.3 MENTOR DETAILS SECTION */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Faculty Mentor Details (Phase 2)
            </h2>
          </div>
          <button
            onClick={openEditMentor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 transition"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {team.mentor ? 'Edit Mentor' : 'Add Mentor'}
          </button>
        </div>

        {team.mentor ? (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block">Mentor Name</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">
                {team.mentor.prefix} {team.mentor.fullName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Contact Number</span>
              <span className="text-sm font-mono font-bold text-slate-800 block mt-0.5">
                {team.mentor.contactNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Email Address</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {team.mentor.email}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Department &amp; Institute</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {team.mentor.department} • {team.mentor.institute}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 font-semibold block">Office Address</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {team.mentor.officeAddress}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
            <p className="text-sm font-bold text-amber-900">
              ⚠ Mentor details have not been submitted yet.
            </p>
            <p className="text-xs text-amber-800 max-w-md mx-auto">
              Phase 2 is required for final entry confirmation. Click below to submit your official faculty mentor details.
            </p>
            <button
              onClick={openEditMentor}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-orange-600 shadow-md hover:opacity-95 transition"
            >
              Add Mentor Details Now
            </button>
          </div>
        )}
      </div>

      {/* 5.5 SUPPORT CONSOLIDATED TILE */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Headset className="h-5 w-5 text-[#1B3F8B]" />
          <h2 className="text-lg font-bold text-slate-900">
            Help &amp; Support Contacts
          </h2>
        </div>

        <p className="text-xs text-slate-600">
          Need assistance with your team registration or pitch submissions? Contact any of the club coordinators below:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {clubCoordinators.map((c, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <h4 className="font-bold text-[#1B3F8B]">{c.clubName}</h4>
              <p className="text-[11px] text-slate-600 font-medium">Faculty: {c.facultyCoordinators[0]}</p>
              <p className="text-[11px] text-slate-500">Student: {c.studentCoordinators[0]?.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT TEAM MEMBERS MODAL */}
      {isEditingMembers && editLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full my-8 border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#1B3F8B]" />
                <h3 className="text-lg font-black text-slate-900">Edit Team Member Details</h3>
              </div>
              <button
                onClick={() => setIsEditingMembers(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMembers} className="space-y-6">
              {/* Leader Edit Section */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#1B3F8B] text-white">
                  TEAM LEADER
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editLeader.fullName}
                      onChange={(e) => setEditLeader({ ...editLeader, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mobile (10 digits)</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={editLeader.mobile}
                      onChange={(e) => setEditLeader({ ...editLeader, mobile: e.target.value.replace(/\D/g, '') })}
                      className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 ${
                        editLeader.mobile && editLeader.mobile.length !== 10
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 focus:border-[#1B3F8B]'
                      }`}
                    />
                    {editLeader.mobile && editLeader.mobile.length !== 10 && (
                      <p className="text-[10px] text-red-600 mt-1 font-semibold">
                        Mobile number must be exactly 10 digits.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editLeader.email}
                      onChange={(e) => setEditLeader({ ...editLeader, email: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 ${
                        editLeader.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editLeader.email.trim())
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 focus:border-[#1B3F8B]'
                      }`}
                    />
                    {editLeader.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editLeader.email.trim()) && (
                      <p className="text-[10px] text-red-600 mt-1 font-semibold">
                        Please enter a valid email address.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Department</label>
                    <select
                      value={editLeader.department}
                      onChange={(e) => setEditLeader({ ...editLeader, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                    >
                      <option value="IT">IT</option>
                      <option value="CSE">CSE</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Semester</label>
                    <select
                      value={editLeader.semester}
                      onChange={(e) => setEditLeader({ ...editLeader, semester: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={String(s)}>Sem {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Gender</label>
                    <select
                      value={editLeader.gender}
                      onChange={(e) => setEditLeader({ ...editLeader, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Members 1 to 5 Edit Section */}
              {editMembers.map((m, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    MEMBER #{idx + 1}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={m.fullName}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx].fullName = e.target.value;
                          setEditMembers(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mobile</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={m.mobile}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx].mobile = e.target.value.replace(/\D/g, '');
                          setEditMembers(updated);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 ${
                          m.mobile && m.mobile.length !== 10
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:border-[#1B3F8B]'
                        }`}
                      />
                      {m.mobile && m.mobile.length !== 10 && (
                        <p className="text-[10px] text-red-600 mt-1 font-semibold">
                          Invalid phone number.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={m.email}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx].email = e.target.value;
                          setEditMembers(updated);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 ${
                          m.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:border-[#1B3F8B]'
                        }`}
                      />
                      {m.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim()) && (
                        <p className="text-[10px] text-red-600 mt-1 font-semibold">
                          Invalid email address.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Dept</label>
                      <select
                        value={m.department}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx].department = e.target.value;
                          setEditMembers(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                      >
                        <option value="IT">IT</option>
                        <option value="CSE">CSE</option>
                        <option value="CE">CE</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Sem</label>
                      <select
                        value={m.semester}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx].semester = e.target.value;
                          setEditMembers(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={String(s)}>Sem {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Gender</label>
                      <select
                        value={m.gender}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx].gender = e.target.value;
                          setEditMembers(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMembers(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#1B3F8B] hover:bg-indigo-900 shadow-md inline-flex items-center gap-2"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Member Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MENTOR MODAL */}
      {isEditingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-black text-slate-900">Faculty Mentor Details</h3>
              </div>
              <button
                onClick={() => setIsEditingMentor(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMentor} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prefix</label>
                  <select
                    value={editMentor.prefix}
                    onChange={(e) => setEditMentor({ ...editMentor, prefix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="Prof.">Prof.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editMentor.fullName}
                    onChange={(e) => setEditMentor({ ...editMentor, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Number (10 digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={editMentor.contactNumber}
                    onChange={(e) => setEditMentor({ ...editMentor, contactNumber: e.target.value.replace(/\D/g, '') })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 ${
                      editMentor.contactNumber && editMentor.contactNumber.length !== 10
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300'
                    }`}
                  />
                  {editMentor.contactNumber && editMentor.contactNumber.length !== 10 && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">
                      Invalid phone number. Must be exactly 10 digits.
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editMentor.email}
                    onChange={(e) => setEditMentor({ ...editMentor, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 ${
                      editMentor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editMentor.email.trim())
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300'
                    }`}
                  />
                  {editMentor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editMentor.email.trim()) && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">
                      Invalid email address.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={editMentor.department}
                    onChange={(e) => setEditMentor({ ...editMentor, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Institute Name</label>
                  <input
                    type="text"
                    required
                    value={editMentor.institute}
                    onChange={(e) => setEditMentor({ ...editMentor, institute: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Office Address / Cabin</label>
                <input
                  type="text"
                  required
                  value={editMentor.officeAddress}
                  onChange={(e) => setEditMentor({ ...editMentor, officeAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingMentor(false)}
                  className="px-5 py-2 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-md inline-flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Mentor Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

