import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TeamMember, LeaderEditRequest } from '../types';
import {
  ArrowLeft, Edit3, Save, X, Lock, AlertTriangle, CheckCircle2, RefreshCw, User, Clock, Send
} from 'lucide-react';

type Department = 'IT' | 'CSE' | 'CE';
type Gender = 'Male' | 'Female' | 'Other';

const DEPARTMENTS: Department[] = ['IT', 'CSE', 'CE'];
const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const LEADER_FIELD_LABELS: Record<string, string> = {
  fullName: 'Full Name',
  email: 'Email Address',
  mobile: 'Mobile Number',
  enrollmentNo: 'Enrollment Number',
  department: 'Department',
  semester: 'Semester',
  gender: 'Gender',
};

// Member row component
const MemberRow: React.FC<{
  member: TeamMember;
  index: number;
  isEditing: boolean;
  editData: Partial<TeamMember>;
  errors: Record<string, string>;
  onEdit: () => void;
  onCancel: () => void;
  onChange: (field: keyof TeamMember, value: string) => void;
}> = ({ member, index, isEditing, editData, errors, onEdit, onCancel, onChange }) => {
  const d: TeamMember = { ...member, ...editData };

  const fc = (field: string) =>
    `w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-[#1B3F8B]'
    }`;

  return (
    <tr className={`border-b border-slate-100 last:border-none ${isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50 transition'}`}>
      <td className="py-3 px-4 align-middle">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1B3F8B]/10 text-[#1B3F8B] whitespace-nowrap">M{index + 1}</span>
      </td>
      <td className="py-3 px-3 align-middle min-w-[140px]">
        {isEditing
          ? <><input value={d.fullName || ''} onChange={(e) => onChange('fullName', e.target.value)} className={fc('fullName')} placeholder="Full Name" />{errors.fullName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName}</p>}</>
          : <span className="font-bold text-slate-900 text-xs">{d.fullName}</span>}
      </td>
      <td className="py-3 px-3 align-middle min-w-[160px]">
        {isEditing
          ? <><input type="email" value={d.email || ''} onChange={(e) => onChange('email', e.target.value)} className={fc('email')} placeholder="email@vsitr.ac.in" />{errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}</>
          : <span className="text-slate-600 text-xs">{d.email}</span>}
      </td>
      <td className="py-3 px-3 align-middle min-w-[120px]">
        {isEditing
          ? <><input value={d.mobile || ''} onChange={(e) => onChange('mobile', e.target.value)} className={fc('mobile')} placeholder="10-digit" />{errors.mobile && <p className="text-[10px] text-red-500 mt-0.5">{errors.mobile}</p>}</>
          : <span className="text-slate-600 text-xs">{d.mobile}</span>}
      </td>
      <td className="py-3 px-3 align-middle min-w-[130px]">
        {isEditing
          ? <><input value={d.enrollmentNo || ''} onChange={(e) => onChange('enrollmentNo', e.target.value)} className={fc('enrollmentNo')} placeholder="Enrollment No." />{errors.enrollmentNo && <p className="text-[10px] text-red-500 mt-0.5">{errors.enrollmentNo}</p>}</>
          : <span className="text-slate-600 text-xs font-mono">{d.enrollmentNo}</span>}
      </td>
      <td className="py-3 px-3 align-middle">
        {isEditing
          ? <select value={d.department || ''} onChange={(e) => onChange('department', e.target.value)} className={fc('department')}>{DEPARTMENTS.map((dep) => <option key={dep} value={dep}>{dep}</option>)}</select>
          : <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1B3F8B]/10 text-[#1B3F8B] uppercase">{d.department}</span>}
      </td>
      <td className="py-3 px-3 align-middle">
        {isEditing
          ? <select value={d.semester || ''} onChange={(e) => onChange('semester', e.target.value)} className={fc('semester')}>{SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          : <span className="text-slate-600 text-xs">{d.semester}</span>}
      </td>
      <td className="py-3 px-3 align-middle">
        {isEditing
          ? <select value={d.gender || ''} onChange={(e) => onChange('gender', e.target.value)} className={fc('gender')}>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}</select>
          : <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${d.gender === 'Female' ? 'bg-pink-100 text-pink-700' : d.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{d.gender}</span>}
      </td>
      <td className="py-3 px-3 align-middle text-right">
        {isEditing
          ? <button onClick={onCancel} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer" title="Cancel"><X className="h-3 w-3" /> Cancel</button>
          : <button onClick={onEdit} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-[#1B3F8B]/10 text-[#1B3F8B] hover:bg-[#1B3F8B]/20 transition cursor-pointer"><Edit3 className="h-3 w-3" /> Edit</button>}
      </td>
    </tr>
  );
};

// Leader Change Request Modal (All Fields)
const LeaderChangeRequestModal: React.FC<{
  leader: any;
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ leader, teamId, onClose, onSuccess }) => {
  const { showAlert } = useAuth();
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const changedFields = Object.keys(newValues).filter(
      (k) => newValues[k].trim() !== '' && newValues[k].trim() !== String(leader[k] || '')
    );

    if (changedFields.length === 0) {
      showAlert('No Changes', 'You have not entered any new data to request a change for.');
      return;
    }
    if (!reason.trim()) {
      showAlert('Required', 'Please provide a reason for these changes.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(
        changedFields.map((field) =>
          api.submitLeaderEditRequest({
            teamId,
            leaderEmail: leader.email,
            fieldName: field,
            oldValue: String(leader[field] || ''),
            newValue: newValues[field].trim(),
            reason: reason.trim(),
          })
        )
      );
      showAlert('Requests Submitted', `Successfully submitted ${changedFields.length} change request(s). An admin will review them soon.`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showAlert('Submission Error', err.message || 'Failed to submit change requests.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, val: string) => {
    setNewValues((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center"><Edit3 className="h-5 w-5 text-amber-600" /></div>
            <div>
              <h3 className="text-base font-black text-slate-900">Request Leader Details Change</h3>
              <p className="text-xs text-slate-500">Enter new values for the fields you want to change.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer transition"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-3 mb-4 shrink-0 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 font-medium">
          ⚠️ This will <strong>not</strong> change your live data immediately. An admin must <strong>approve</strong> this request before it takes effect.
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-5 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(LEADER_FIELD_LABELS).map(([field, label]) => {
              const currentVal = String(leader[field] || '');
              return (
                <div key={field} className="p-3 rounded-2xl border border-slate-200 bg-slate-50">
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">{label}</label>
                  <p className="text-[11px] text-slate-500 mb-2">Current: <strong className="font-mono">{currentVal || '—'}</strong></p>
                  <input
                    type="text"
                    value={newValues[field] !== undefined ? newValues[field] : ''}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={`Enter new ${label.toLowerCase()} (optional)`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-amber-500 focus:outline-none bg-white placeholder:text-slate-300"
                  />
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Changes <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly explain why these changes are needed (e.g. 'Typo in enrollment number' or 'Updated mobile number')."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-700 transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-md">
              <Send className="h-3.5 w-3.5" />{isSubmitting ? 'Submitting...' : 'Submit All Requests'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main TeamEditPage
export const TeamEditPage: React.FC = () => {
  const { team, isTeamLoggedIn, settings, setActiveTab, showAlert, refreshTeamSession, loginTeamSession } = useAuth();
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [memberEdits, setMemberEdits] = useState<Record<number, Partial<TeamMember>>>({});
  const [memberErrors, setMemberErrors] = useState<Record<number, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [myRequests, setMyRequests] = useState<LeaderEditRequest[]>([]);
  const [countdown, setCountdown] = useState('');

  useEffect(() => { if (!isTeamLoggedIn) setActiveTab('login'); }, [isTeamLoggedIn]);
  useEffect(() => { if (isTeamLoggedIn) refreshTeamSession(); }, []);

  const loadMyRequests = () => {
    if (!team?.id) return;
    api.getTeamLeaderEditRequests(team.id).then((res) => setMyRequests(res.requests || [])).catch(() => {});
  };
  useEffect(() => { loadMyRequests(); }, [team?.id]);

  useEffect(() => {
    if (!settings.teamEditCloseAt) { setCountdown(''); return; }
    const update = () => {
      const diff = new Date(settings.teamEditCloseAt!).getTime() - Date.now();
      if (diff <= 0) { setCountdown('Closing now\u2026'); return; }
      const h = Math.floor(diff / 3_600_000), m = Math.floor((diff % 3_600_000) / 60_000), s = Math.floor((diff % 60_000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [settings.teamEditCloseAt]);

  if (!isTeamLoggedIn || !team) return null;

  const isWindowOpen = settings.teamEditOpen && !(settings.teamEditCloseAt && new Date(settings.teamEditCloseAt) <= new Date());

  const handleMemberEdit = (index: number) => {
    setEditingMemberIndex(index);
    setMemberEdits((prev) => ({ ...prev, [index]: { ...team.members[index] } }));
    setMemberErrors((prev) => ({ ...prev, [index]: {} }));
  };

  const handleMemberCancel = (index: number) => {
    setEditingMemberIndex(null);
    setMemberEdits((prev) => { const n = { ...prev }; delete n[index]; return n; });
    setMemberErrors((prev) => { const n = { ...prev }; delete n[index]; return n; });
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    setMemberEdits((prev) => ({ ...prev, [index]: { ...(prev[index] || {}), [field]: value } }));
    setMemberErrors((prev) => ({ ...prev, [index]: { ...(prev[index] || {}), [field]: '' } }));
  };

  const handleSaveAll = async () => {
    if (!isWindowOpen) { showAlert('Edit Window Closed', 'Team editing is currently closed.'); return; }
    if (Object.keys(memberEdits).length === 0) { showAlert('No Changes', 'Edit a member row first before saving.'); return; }

    const finalMembers: TeamMember[] = team.members.map((m, i) => ({ ...m, ...(memberEdits[i] || {}), isLeader: false }));
    const requiredFields: (keyof TeamMember)[] = ['fullName', 'email', 'mobile', 'enrollmentNo', 'department', 'semester', 'gender'];
    const newErrors: Record<number, Record<string, string>> = {};
    const errMessages: string[] = [];

    for (let i = 0; i < finalMembers.length; i++) {
      if (!memberEdits[i]) continue;
      newErrors[i] = {};
      for (const f of requiredFields) {
        if (!finalMembers[i][f] || !String(finalMembers[i][f]).trim()) {
          newErrors[i][f] = `${f} cannot be empty`;
          errMessages.push(`Member ${i + 1}: "${f}" cannot be empty`);
        }
      }
    }

    const femaleCount = [team.leader, ...finalMembers].filter((m) => m.gender === 'Female').length;
    if (femaleCount < 1) errMessages.push('Team must have at least one female participant (including the leader).');

    if (errMessages.length > 0) { 
      setMemberErrors(newErrors); 
      showAlert('Validation Errors', 'Please fix the following issues:\n\n• ' + errMessages.join('\n• ')); 
      return; 
    }

    setIsSaving(true);
    try {
      const res = await api.editTeamMembers({ teamId: team.id, leaderEmail: team.leader.email, members: finalMembers });
      if (res.success) {
        if (res.team) loginTeamSession(res.team); else await refreshTeamSession();
        setMemberEdits({}); setEditingMemberIndex(null); setMemberErrors({});
        showAlert('Saved!', 'Team member details updated successfully.', 'success');
      }
    } catch (err: any) {
      showAlert('Save Failed', err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const editedCount = Object.keys(memberEdits).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('portal')} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Team Details</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{team.teamName} &bull; <span className="font-mono text-[#C1272D]">{team.id}</span></p>
          </div>
        </div>

        {/* Edit Window Banner */}
        {!isWindowOpen ? (
          <div className="flex items-center gap-3 p-5 rounded-3xl bg-slate-900 border border-slate-700 text-white">
            <Lock className="h-6 w-6 text-slate-400 shrink-0" />
            <div>
              <p className="text-sm font-black">Team Editing is Currently Closed</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {settings.teamEditOpen === false ? 'The admin has not opened the edit window yet.' : 'The edit window deadline has passed.'} Please contact the organizing committee.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-3xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-black text-emerald-800">Team Edit Window is Open</p>
              {countdown && <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" /> Closes in: {countdown}</p>}
            </div>
          </div>
        )}


        {/* Leader Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="h-7 w-7 rounded-xl bg-[#C1272D]/10 flex items-center justify-center"><User className="h-4 w-4 text-[#C1272D]" /></div>
            <div className="flex-1">
              <h2 className="text-sm font-black text-slate-900">Team Leader (Read-Only)</h2>
              <p className="text-[10px] text-slate-500 font-medium">Use the Edit Details button to request admin approval for changing leader information.</p>
            </div>
            {isWindowOpen ? (
              <button onClick={() => setIsLeaderModalOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 transition cursor-pointer uppercase tracking-wider shadow-2xs">
                <Edit3 className="h-3.5 w-3.5" /> Request Edit Details
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 shadow-2xs">
                <Lock className="h-3.5 w-3.5" /> Window Closed
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  {['Field', 'Current Value'].map((h) => <th key={h} className="py-3 px-4 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(LEADER_FIELD_LABELS).map(([field, label]) => {
                  const val = (team.leader as any)[field] || '';
                  return (
                    <tr key={field} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">{label}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{val || <em className="text-slate-300">—</em>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="h-7 w-7 rounded-xl bg-[#1B3F8B]/10 flex items-center justify-center"><Edit3 className="h-4 w-4 text-[#1B3F8B]" /></div>
            <div className="flex-1">
              <h2 className="text-sm font-black text-slate-900">Team Members (1–5)</h2>
              <p className="text-[10px] text-slate-500 font-medium">Click <strong>Edit</strong> on a row to edit inline. Click <strong>Save All Changes</strong> once done.</p>
            </div>
            {editedCount > 0 && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">{editedCount} row{editedCount > 1 ? 's' : ''} edited</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  {['#', 'Full Name', 'Email', 'Mobile', 'Enrollment', 'Dept', 'Sem', 'Gender', ''].map((h, i) => <th key={i} className="py-3 px-3 text-left whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {team.members.map((m, i) => (
                  <MemberRow
                    key={i}
                    member={m}
                    index={i}
                    isEditing={editingMemberIndex === i}
                    editData={memberEdits[i] || {}}
                    errors={memberErrors[i] || {}}
                    onEdit={() => { if (!isWindowOpen) { showAlert('Window Closed', 'The edit window is currently closed.'); return; } handleMemberEdit(i); }}
                    onCancel={() => handleMemberCancel(i)}
                    onChange={(f, v) => handleMemberChange(i, f, v)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[11px] text-slate-500 font-medium">
              {editedCount > 0 ? <span className="text-blue-700 font-bold">{editedCount} member row{editedCount > 1 ? 's' : ''} with unsaved changes.</span> : 'No pending changes.'}
            </p>
            <div className="flex items-center gap-3">
              {editedCount > 0 && (
                <button type="button" onClick={() => { setMemberEdits({}); setEditingMemberIndex(null); setMemberErrors({}); setGlobalErrors([]); }} className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer">
                  Discard All
                </button>
              )}
              <button
                onClick={handleSaveAll}
                disabled={isSaving || editedCount === 0 || !isWindowOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs text-white bg-[#C1272D] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition cursor-pointer"
              >
                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* My Change Requests */}
        {myRequests.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900">My Leader Change Requests</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 ml-auto">{myRequests.filter((r) => r.status === 'pending').length} Pending</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                    {['Field', 'Old Value', 'New Value', 'Reason', 'Requested', 'Status'].map((h) => <th key={h} className="py-3 px-4 text-left whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRequests.map((req) => (
                    <tr key={req.id} className={`hover:bg-slate-50 transition ${req.status === 'approved' ? 'bg-emerald-50/30' : req.status === 'rejected' ? 'bg-red-50/30 opacity-80' : ''}`}>
                      <td className="py-3 px-4 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full bg-[#1B3F8B]/10 text-[#1B3F8B] text-[10px] font-extrabold">{LEADER_FIELD_LABELS[req.fieldName] || req.fieldName}</span></td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{req.oldValue || <em>—</em>}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-[11px]">{req.newValue}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px]"><span className="line-clamp-2 text-[11px]">{req.reason}</span></td>
                      <td className="py-3 px-4 text-slate-400 text-[10px] whitespace-nowrap">{new Date(req.requestedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {isLeaderModalOpen && (
        <LeaderChangeRequestModal
          leader={team.leader}
          teamId={team.id}
          onClose={() => setIsLeaderModalOpen(false)}
          onSuccess={loadMyRequests}
        />
      )}
    </div>
  );
};
