import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Team, EventSettings, TimelineEvent, FAQItem, EmailLog, PptSubmission, Rule, RuleCategory, ProblemStatement, LeaderEditRequest } from '../types';
import { formatTimelineDate, toTimelineDateTimeInput } from '../lib/timeline';
import {
  ShieldCheck,
  LogOut,
  Users,
  Settings,
  Download,
  Trash2,
  Edit3,
  Search,
  Filter,
  Plus,
  Mail,
  Calendar,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  MoreVertical,
  Clock,
  HelpCircle,
  Bell,
  ChevronRight,
  Eye,
  Check,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  LayoutDashboard,
  Send,
  Database,
  SendHorizontal,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Cpu,
  Laptop,
  Play,
  GitBranch,
  GraduationCap,
  Link,
  Phone,
  UserSearch,
} from 'lucide-react';

// ─── CSV Export Utility ───────────────────────────────────────────────────────
// Wraps fields that contain a comma, double-quote, or newline in double-quotes
// and escapes internal double-quotes per RFC 4180.
const escapeCsvField = (value: any): string => {
  const str = value === undefined || value === null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const buildCsvString = (headers: string[], rows: string[][]): string => {
  const lines = [headers.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(','));
  }
  return lines.join('\r\n');
};

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Shared autocomplete hook ─────────────────────────────────────────────────
function useAutocomplete(items: string[]) {
  const [query, setQuery] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) => item.toLowerCase().includes(q));
  }, [items, query]);

  return { query, setQuery, showDropdown, setShowDropdown, filtered };
}

// ─── Team Lookup Tab ──────────────────────────────────────────────────────────
const TeamLookupTab: React.FC = () => {
  const { showAlert } = useAuth();
  const [teamIds, setTeamIds] = React.useState<string[]>([]);
  const [isLoadingIds, setIsLoadingIds] = React.useState(false);
  const [selectedTeamId, setSelectedTeamId] = React.useState('');
  const [teamData, setTeamData] = React.useState<any>(null);
  const [isLoadingTeam, setIsLoadingTeam] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);
  const autocomplete = useAutocomplete(teamIds);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsLoadingIds(true);
    api.getAllTeamIds()
      .then((d) => setTeamIds(d.teamIds || []))
      .catch(() => {})
      .finally(() => setIsLoadingIds(false));
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        autocomplete.setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (id: string) => {
    autocomplete.setQuery(id);
    autocomplete.setShowDropdown(false);
    setSelectedTeamId(id);
    setTeamData(null);
    setNotFound(false);
    setIsLoadingTeam(true);
    try {
      const res = await api.getAdminTeamById(id);
      setTeamData(res.team);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        showAlert('Lookup Error', err.message || 'Failed to load team data.');
      }
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!teamData) return;
    const t = teamData;
    const allMembers = [t.leader, ...(t.members || [])];
    const headers = [
      'Team ID', 'Team Name', 'Status', 'Registered At',
      'Leader Name', 'Leader Email', 'Leader Phone', 'Leader Enrollment', 'Leader Department', 'Leader Semester', 'Leader Gender',
      'M1 Name', 'M1 Email', 'M1 Phone', 'M1 Enrollment', 'M1 Department', 'M1 Semester', 'M1 Gender',
      'M2 Name', 'M2 Email', 'M2 Phone', 'M2 Enrollment', 'M2 Department', 'M2 Semester', 'M2 Gender',
      'M3 Name', 'M3 Email', 'M3 Phone', 'M3 Enrollment', 'M3 Department', 'M3 Semester', 'M3 Gender',
      'M4 Name', 'M4 Email', 'M4 Phone', 'M4 Enrollment', 'M4 Department', 'M4 Semester', 'M4 Gender',
      'M5 Name', 'M5 Email', 'M5 Phone', 'M5 Enrollment', 'M5 Department', 'M5 Semester', 'M5 Gender',
      'Mentor Name', 'Mentor Contact', 'Mentor Email',
      'PS ID', 'PS Title', 'PS Selected At',
      'PPT Link', 'YouTube Link', 'GitHub Link',
    ];
    const leader = t.leader || {};
    const mentor = t.mentor ? `${t.mentor.prefix || ''} ${t.mentor.fullName}`.trim() : '';
    const memberCells: string[] = [];
    for (let i = 0; i < 5; i++) {
      const m = (t.members || [])[i] || {};
      memberCells.push(m.fullName || '', m.email || '', m.mobile || '', m.enrollmentNo || '', m.department || '', m.semester || '', m.gender || '');
    }
    const ppt = t.pptSubmission || {};
    const row = [
      t.id, t.teamName, t.status, t.createdAt,
      leader.fullName || '', leader.email || '', leader.mobile || '', leader.enrollmentNo || '', leader.department || '', leader.semester || '', leader.gender || '',
      ...memberCells,
      mentor, t.mentor?.contactNumber || '', t.mentor?.email || '',
      t.selectedPsId || '', t.selectedPsTitle || '', t.psSelectedAt || '',
      ppt.pptFileUrl || '', ppt.demoVideoUrl || '', ppt.githubRepoUrl || '',
    ];
    const csv = buildCsvString(headers, [row]);
    downloadCsv(csv, `team_${t.id}.csv`);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
    } catch { return iso; }
  };

  const statusBadge = (s: string) => {
    if (s === 'completed') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Completed</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 uppercase tracking-wider">Pending Mentor</span>;
  };

  const allMembers = teamData ? [{ ...teamData.leader, isLeader: true }, ...(teamData.members || [])] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Lookup</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Search any registered team by ID and inspect all details.</p>
        </div>
        {teamData && (
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition cursor-pointer shrink-0"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-700 mb-1">Search Team ID</label>
        <div className="relative" ref={dropdownRef}>
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={autocomplete.query}
            onChange={(e) => { autocomplete.setQuery(e.target.value); autocomplete.setShowDropdown(true); setTeamData(null); setNotFound(false); }}
            onFocus={() => autocomplete.setShowDropdown(true)}
            placeholder={isLoadingIds ? 'Loading team IDs...' : 'Type or select a Team ID (e.g. SIH2026-001)'}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#C1272D] shadow-xs"
          />
          {autocomplete.query && (
            <button onClick={() => { autocomplete.setQuery(''); setTeamData(null); setNotFound(false); autocomplete.setShowDropdown(false); }} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
          {autocomplete.showDropdown && autocomplete.filtered.length > 0 && (
            <div className="absolute z-30 top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg">
              {autocomplete.filtered.map((id) => (
                <button
                  key={id}
                  onMouseDown={() => handleSelect(id)}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-[#C1272D] transition"
                >
                  {id}
                </button>
              ))}
            </div>
          )}
        </div>
        {autocomplete.query && !autocomplete.showDropdown && (
          <button
            onClick={() => handleSelect(autocomplete.query)}
            disabled={isLoadingTeam}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#C1272D] hover:opacity-90 shadow transition cursor-pointer disabled:opacity-50"
          >
            <UserSearch className="h-3.5 w-3.5" />
            {isLoadingTeam ? 'Looking up...' : 'Look Up Team'}
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoadingTeam && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-[#C1272D]" />
          <span className="ml-3 text-sm font-bold text-slate-500">Fetching team data…</span>
        </div>
      )}

      {/* Not found */}
      {notFound && !isLoadingTeam && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
          <p className="text-sm font-black text-slate-700">Team Not Found</p>
          <p className="text-xs text-slate-400 mt-1">No team with ID <span className="font-bold text-slate-600">{autocomplete.query}</span> exists in the registry.</p>
        </div>
      )}

      {/* Team Detail */}
      {teamData && !isLoadingTeam && (
        <div className="space-y-5">
          {/* Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-wrap items-start gap-3 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-black text-slate-900">{teamData.teamName}</h2>
                  {statusBadge(teamData.status)}
                </div>
                <p className="text-xs text-slate-500 font-medium">Team ID: <span className="font-bold text-slate-700">{teamData.id}</span></p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Registered: <span className="font-semibold text-slate-600">{formatDate(teamData.createdAt)}</span></p>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">Team Members ({allMembers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {['Role', 'Name', 'Email', 'Phone', 'Enrollment', 'Dept', 'Sem', 'Gender'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allMembers.map((m: any, i: number) => (
                    <tr key={i} className={m.isLeader ? 'bg-rose-50/40' : 'hover:bg-slate-50 transition'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {m.isLeader
                          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C1272D]/10 text-[#C1272D] uppercase tracking-wide">Leader</span>
                          : <span className="text-slate-400 font-bold">M{i}</span>}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{m.fullName || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{m.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{m.mobile || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{m.enrollmentNo || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1B3F8B]/10 text-[#1B3F8B] uppercase">{m.department || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{m.semester || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          m.gender === 'Female' ? 'bg-pink-100 text-pink-700' : m.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>{m.gender || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mentor + PS + Submission — 3-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mentor */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-4 w-4 text-[#1B3F8B]" />
                <h3 className="text-sm font-black text-slate-800">Mentor</h3>
              </div>
              {teamData.mentor?.fullName ? (
                <dl className="space-y-1.5">
                  <div>
                    <dt className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Name</dt>
                    <dd className="text-xs font-bold text-slate-800">{teamData.mentor.prefix} {teamData.mentor.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Contact</dt>
                    <dd className="text-xs font-semibold text-slate-700">{teamData.mentor.contactNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Email</dt>
                    <dd className="text-xs font-semibold text-slate-700 break-all">{teamData.mentor.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dept / Institute</dt>
                    <dd className="text-xs font-semibold text-slate-700">{teamData.mentor.department || '—'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-xs text-amber-600 font-bold">⏳ Not yet submitted</p>
              )}
            </div>

            {/* PS Selection */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-[#C1272D]" />
                <h3 className="text-sm font-black text-slate-800">Problem Statement</h3>
              </div>
              {teamData.selectedPsId ? (
                <dl className="space-y-1.5">
                  <div>
                    <dt className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">PS ID</dt>
                    <dd className="text-xs font-black text-[#C1272D]">{teamData.selectedPsId}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Title</dt>
                    <dd className="text-xs font-bold text-slate-800 leading-relaxed">{teamData.selectedPsTitle || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Selected At</dt>
                    <dd className="text-xs font-semibold text-slate-600">{formatDate(teamData.psSelectedAt)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-xs text-slate-400 font-bold italic">Not yet selected</p>
              )}
            </div>

            {/* Submission Links */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Link className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-800">Submissions</h3>
              </div>
              {teamData.pptSubmission?.submittedAt ? (
                <dl className="space-y-2">
                  {[['PPT', teamData.pptSubmission?.pptFileUrl], ['YouTube', teamData.pptSubmission?.demoVideoUrl], ['GitHub', teamData.pptSubmission?.githubRepoUrl]].map(([label, url]) => (
                    <div key={label}>
                      <dt className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">{label}</dt>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#1B3F8B] underline underline-offset-2 hover:text-[#C1272D] break-all transition">
                          {String(url).length > 50 ? String(url).slice(0, 48) + '…' : url}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not submitted</span>
                      )}
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-slate-400 font-bold italic">Not submitted</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Mentor Lookup Tab ────────────────────────────────────────────────────────
const MentorLookupTab: React.FC = () => {
  const { showAlert } = useAuth();
  const [mentorNames, setMentorNames] = React.useState<string[]>([]);
  const [isLoadingNames, setIsLoadingNames] = React.useState(false);
  const [mentorData, setMentorData] = React.useState<any>(null);
  const [isLoadingMentor, setIsLoadingMentor] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);
  const autocomplete = useAutocomplete(mentorNames);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsLoadingNames(true);
    api.getAllMentorNames()
      .then((d) => setMentorNames(d.mentorNames || []))
      .catch(() => {})
      .finally(() => setIsLoadingNames(false));
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        autocomplete.setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (name: string) => {
    autocomplete.setQuery(name);
    autocomplete.setShowDropdown(false);
    setMentorData(null);
    setNotFound(false);
    setIsLoadingMentor(true);
    try {
      const res = await api.getAdminMentorTeams(name);
      setMentorData(res);
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('no teams'))) {
        setNotFound(true);
      } else {
        showAlert('Lookup Error', err.message || 'Failed to load mentor data.');
      }
    } finally {
      setIsLoadingMentor(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!mentorData) return;
    const headers = ['Team ID', 'Team Name', 'Leader Name', 'Leader Phone', 'PS ID', 'PS Title', 'Status'];
    const rows = (mentorData.teams || []).map((t: any) => [
      t.teamId, t.teamName, t.leaderName, t.leaderPhone,
      t.selectedPsId || '', t.selectedPsTitle || '', t.status,
    ]);
    const csv = buildCsvString(headers, rows);
    const safeName = (mentorData.mentorName || 'mentor').replace(/[^a-zA-Z0-9]/g, '_');
    downloadCsv(csv, `mentor_${safeName}.csv`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentor Lookup</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Find a mentor and see all teams they are guiding.</p>
        </div>
        {mentorData && (
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition cursor-pointer shrink-0"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-700 mb-1">Search Mentor Name</label>
        <div className="relative" ref={dropdownRef}>
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={autocomplete.query}
            onChange={(e) => { autocomplete.setQuery(e.target.value); autocomplete.setShowDropdown(true); setMentorData(null); setNotFound(false); }}
            onFocus={() => autocomplete.setShowDropdown(true)}
            placeholder={isLoadingNames ? 'Loading mentor names...' : 'Type or select a mentor name'}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#C1272D] shadow-xs"
          />
          {autocomplete.query && (
            <button onClick={() => { autocomplete.setQuery(''); setMentorData(null); setNotFound(false); autocomplete.setShowDropdown(false); }} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
          {autocomplete.showDropdown && autocomplete.filtered.length > 0 && (
            <div className="absolute z-30 top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg">
              {autocomplete.filtered.map((name) => (
                <button
                  key={name}
                  onMouseDown={() => handleSelect(name)}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-[#C1272D] transition"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        {autocomplete.query && !autocomplete.showDropdown && (
          <button
            onClick={() => handleSelect(autocomplete.query)}
            disabled={isLoadingMentor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#C1272D] hover:opacity-90 shadow transition cursor-pointer disabled:opacity-50"
          >
            <UserSearch className="h-3.5 w-3.5" />
            {isLoadingMentor ? 'Looking up...' : 'Look Up Mentor'}
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoadingMentor && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-[#C1272D]" />
          <span className="ml-3 text-sm font-bold text-slate-500">Fetching mentor data…</span>
        </div>
      )}

      {/* Not found */}
      {notFound && !isLoadingMentor && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
          <p className="text-sm font-black text-slate-700">Mentor Not Found</p>
          <p className="text-xs text-slate-400 mt-1">No teams found for mentor <span className="font-bold text-slate-600">{autocomplete.query}</span>.</p>
        </div>
      )}

      {/* Mentor Detail */}
      {mentorData && !isLoadingMentor && (
        <div className="space-y-5">
          {/* Mentor Info Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-wrap gap-4 items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-5 w-5 text-[#1B3F8B]" />
                  <h2 className="text-lg font-black text-slate-900">{mentorData.mentorName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1B3F8B]/10 text-[#1B3F8B] uppercase tracking-wider">
                    {mentorData.teamCount} {mentorData.teamCount === 1 ? 'Team' : 'Teams'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {mentorData.mentorContact && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {mentorData.mentorContact}
                    </div>
                  )}
                  {mentorData.mentorEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {mentorData.mentorEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Teams Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">Mentored Teams</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {['Team ID', 'Team Name', 'Leader Name', 'Leader Phone', 'PS ID', 'PS Title', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(mentorData.teams || []).map((t: any) => (
                    <tr key={t.teamId} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-black text-[#C1272D] whitespace-nowrap">{t.teamId}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{t.teamName}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{t.leaderName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.leaderPhone || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.selectedPsId
                          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C1272D]/10 text-[#C1272D]">{t.selectedPsId}</span>
                          : <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        <span className="line-clamp-2">{t.selectedPsTitle || <span className="italic text-slate-300">Not selected</span>}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.status === 'completed'
                          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 uppercase">Completed</span>
                          : <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 uppercase">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to convert UTC ISO string from server to local YYYY-MM-DDTHH:mm for datetime-local inputs
const toLocalISOString = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

export const AdminPage: React.FC = () => {
  const {
    isAdminLoggedIn,
    loginAdminSession,
    logoutAdminSession,
    setActiveTab,
    settings,
    timeline,
    faqs,
    rules,
    reloadPortalData,
    showAlert,
  } = useAuth();

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Sidebar navigation selection
  const [sidebarTab, setSidebarTab] = useState<'overview' | 'teams' | 'timeline' | 'faqs' | 'settings' | 'emails' | 'ppt-submissions' | 'problem-statements' | 'team-lookup' | 'mentor-lookup' | 'edit-requests'>('overview');

  // Email & Neon Database state
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoadingEmailLogs, setIsLoadingEmailLogs] = useState(false);
  const [isSendingDeadlineReminders, setIsSendingDeadlineReminders] = useState(false);
  const [isNeonConnected, setIsNeonConnected] = useState(false);
  const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Teams list state
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Team Modal for Inspect / Admin Edit
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<Team | null>(null);

  // Editable Event Settings State
  const [editDeadline, setEditDeadline] = useState(settings.registrationDeadline);
  const [editIsOpen, setEditIsOpen] = useState(settings.isRegistrationOpen);
  const [editWhatsapp, setEditWhatsapp] = useState(settings.whatsappGroupLink);
  const [editBanner, setEditBanner] = useState(settings.announcementBanner || '');
  const [editProblemStatementLink, setEditProblemStatementLink] = useState(settings.problemStatementLink || '');
  const [editProblemStatementStatus, setEditProblemStatementStatus] = useState(settings.problemStatementStatus || '');
  const [editPptTemplateLink, setEditPptTemplateLink] = useState(settings.pptTemplateLink || '');
  const [editPptTemplateStatus, setEditPptTemplateStatus] = useState(settings.pptTemplateStatus || '');
  // PPT Submission Settings
  const [editPptSubmissionOpen, setEditPptSubmissionOpen] = useState(settings.pptSubmissionOpen ?? true);
  const [editPptSubmissionStatus, setEditPptSubmissionStatus] = useState(settings.pptSubmissionStatus || '');
  const [editPptSubmissionDeadline, setEditPptSubmissionDeadline] = useState(settings.pptSubmissionDeadline || '');
  const [editPptReferenceLink, setEditPptReferenceLink] = useState(settings.pptReferenceLink || '');
  const [editIsPptExtended, setEditIsPptExtended] = useState(settings.isPptExtended ?? false);
  const [editPptExtendedDeadline, setEditPptExtendedDeadline] = useState(settings.pptExtendedDeadline || '');
  // Rules & Regulations Document
  const [editRulesDocumentLink, setEditRulesDocumentLink] = useState(settings.rulesDocumentLink || '');
  const [editRulesDocumentPdfUrl, setEditRulesDocumentPdfUrl] = useState(settings.rulesDocumentPdfUrl || '');
  const [editRulesDocumentTitle, setEditRulesDocumentTitle] = useState(settings.rulesDocumentTitle || 'Official Rules & Regulations – Internal SIH 2026');
  const [rulesDocUploadMode, setRulesDocUploadMode] = useState<'link' | 'pdf'>(settings.rulesDocumentPdfUrl ? 'pdf' : 'link');
  const [isUploadingRulesPdf, setIsUploadingRulesPdf] = useState(false);
  // PS Selection Deadline (admin-controlled)
  const [editPsSelectionDeadline, setEditPsSelectionDeadline] = useState(settings.psSelectionDeadline || '2026-08-16T18:29:00.000Z');
  // Extension & custom closed message
  const [editIsExtended, setEditIsExtended] = useState(settings.isExtended ?? false);
  const [editExtendedDeadline, setEditExtendedDeadline] = useState(settings.extendedDeadline || '');
  const [editCustomQuote, setEditCustomQuote] = useState(settings.customQuote || '');
  const [editCustomQuoteAuthor, setEditCustomQuoteAuthor] = useState(settings.customQuoteAuthor || '');
  // PPT Submissions list
  const [pptSubmissions, setPptSubmissions] = useState<PptSubmission[]>([]);
  const [isLoadingPptSubmissions, setIsLoadingPptSubmissions] = useState(false);
  const [deletingPptId, setDeletingPptId] = useState<string | null>(null);

  // Team Edit Window state
  const [editTeamEditOpen, setEditTeamEditOpen] = useState(settings.teamEditOpen ?? false);
  const [editTeamEditCloseAt, setEditTeamEditCloseAt] = useState(settings.teamEditCloseAt ? toLocalISOString(settings.teamEditCloseAt) : '');
  // Leader Edit Requests
  const [leaderEditRequests, setLeaderEditRequests] = useState<LeaderEditRequest[]>([]);
  const [isLoadingEditRequests, setIsLoadingEditRequests] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  // Countdown for team edit close
  const [teamEditCountdown, setTeamEditCountdown] = useState('');

  // Editable Timeline State
  const [editTimeline, setEditTimeline] = useState<TimelineEvent[]>(timeline);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [timelineEditItem, setTimelineEditItem] = useState<{ title: string; date: string; description: string; active: boolean }>({
    title: '',
    date: '',
    description: '',
    active: true,
  });
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineDate, setNewTimelineDate] = useState('');
  const [newTimelineDesc, setNewTimelineDesc] = useState('');

  // Editable FAQs State
  const [editFaqs, setEditFaqs] = useState<FAQItem[]>(faqs);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Editable Rules State
  const [editRules, setEditRules] = useState<Rule[]>(rules);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<RuleCategory>('official');

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTestType, setSmtpTestType] = useState<'connection' | 'mentor_pending' | 'mentor_completed'>('connection');
  const [isExportingReport, setIsExportingReport] = useState(false);

  // Problem statement list management state
  const [adminPsList, setAdminPsList] = useState<ProblemStatement[]>([]);
  const [isLoadingPs, setIsLoadingPs] = useState(false);
  const [isEditingPs, setIsEditingPs] = useState(false);
  const [editingPsData, setEditingPsData] = useState<Partial<ProblemStatement> | null>(null);
  const [isCreatingPs, setIsCreatingPs] = useState(false);

  // Helper to handle smooth downloading of both Base64 Data URIs and regular URLs
  const handleDownloadPpt = (fileUrl?: string, fileName?: string, teamId?: string) => {
    let targetUrl = fileUrl;

    // Smart fallback 1: Look up team from teams array if URL is missing
    if (!targetUrl && teamId) {
      const foundTeam = teams.find(t => t.id === teamId || t.id.toLowerCase() === teamId.toLowerCase());
      if (foundTeam?.pptSubmission) {
        targetUrl = foundTeam.pptSubmission.pptFileUrl || foundTeam.pptSubmission.fileUrl || (foundTeam.pptSubmission as any).ppt_file_url;
      }
    }

    // Smart fallback 2: Check pptSubmissions state array
    if (!targetUrl && teamId) {
      const foundSub = pptSubmissions.find(s => s.teamId === teamId || s.id === teamId);
      if (foundSub) {
        targetUrl = foundSub.fileUrl || foundSub.pptFileUrl || (foundSub as any).file_url || (foundSub as any).ppt_file_url;
      }
    }

    if (!targetUrl) {
      showAlert('No File Available', 'The PPT presentation file URL is missing or unavailable for this team.');
      return;
    }

    try {
      if (targetUrl.startsWith('data:')) {
        // Base64 Data URI - convert to blob for instant browser download
        const parts = targetUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `${teamId || 'presentation'}.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // Regular URL download fallback (e.g. /api/uploads/ppt/...)
      window.location.href = targetUrl;
    } catch (err: any) {
      console.error('Error downloading PPT file:', err);
      showAlert('Download Failed', 'Could not process the PPT file download.');
    }
  };

  const fetchAdminProblemStatements = async () => {
    try {
      setIsLoadingPs(true);
      const res = await api.getProblemStatements();
      if (res.success) {
        setAdminPsList(res.problemStatements || []);
      }
    } catch (err) {
      console.error('Failed to fetch problem statements', err);
    } finally {
      setIsLoadingPs(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn && sidebarTab === 'problem-statements') {
      fetchAdminProblemStatements();
    }
  }, [isAdminLoggedIn, sidebarTab]);

  const handleCreatePs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPsData?.id || !editingPsData?.title || !editingPsData?.category) {
      showAlert('Required Fields', 'Please fill in ID, Title, and Category.');
      return;
    }
    try {
      const res = await api.createProblemStatement(editingPsData as any);
      if (res.success) {
        showAlert('Success', 'Problem statement created successfully.', 'success');
        setIsCreatingPs(false);
        setEditingPsData(null);
        fetchAdminProblemStatements();
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to create problem statement.');
    }
  };

  const handleUpdatePs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPsData?.id || !editingPsData?.title || !editingPsData?.category) {
      showAlert('Required Fields', 'Please fill in ID, Title, and Category.');
      return;
    }
    try {
      const res = await api.updateProblemStatement(editingPsData.id, editingPsData);
      if (res.success) {
        showAlert('Success', 'Problem statement updated successfully.', 'success');
        setIsEditingPs(false);
        setEditingPsData(null);
        fetchAdminProblemStatements();
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to update problem statement.');
    }
  };

  const handleDeletePs = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete problem statement ${id}?`)) {
      return;
    }
    try {
      const res = await api.deleteProblemStatement(id);
      if (res.success) {
        showAlert('Deleted', 'Problem statement deleted successfully.', 'success');
        fetchAdminProblemStatements();
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to delete problem statement.');
    }
  };

  // Handle DB Manual Sync to Neon
  const handleSyncDb = async () => {
    try {
      setIsSyncingDb(true);
      const res = await api.syncDb();
      if (res.success) {
        setIsNeonConnected(res.isNeonConnected);
        showAlert('Database Synced', res.message || 'Neon PostgreSQL tables synchronized successfully!', 'success');
        await loadAdminData();
      }
    } catch (err: any) {
      showAlert('Database Sync Error', err.message || 'Could not sync with Neon database.');
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Handle Resend Email
  const handleResendEmail = async (emailId: string) => {
    try {
      setResendingEmailId(emailId);
      const res = await api.resendEmail(emailId);
      if (res.success) {
        showAlert(
          res.log.status === 'sent' ? 'Email Resent Successfully' : 'Resend Dispatched',
          res.message,
          res.log.status === 'sent' ? 'success' : res.log.status === 'failed' ? 'error' : 'info'
        );
        const emailLogsData = await api.getEmailLogs().catch(() => ({ logs: [] }));
        if (emailLogsData.logs) setEmailLogs(emailLogsData.logs);
      }
    } catch (err: any) {
      showAlert('Resend Failed', err.message || 'Could not resend email.');
    } finally {
      setResendingEmailId(null);
    }
  };

  // Handle Test SMTP
  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpTestEmail.trim()) {
      showAlert('Recipient Required', 'Please enter a target recipient email address for testing.');
      return;
    }
    try {
      setIsTestingSmtp(true);
      const res = await api.testSmtp({
        testRecipient: smtpTestEmail.trim(),
        testType: smtpTestType
      } as any);
      if (res.success) {
        showAlert('SMTP Test Outcome', res.message, 'success');
        const emailLogsData = await api.getEmailLogs().catch(() => ({ logs: [] }));
        if (emailLogsData.logs) setEmailLogs(emailLogsData.logs);
      }
    } catch (err: any) {
      showAlert('SMTP Connection Error', err.message || 'SMTP test email failed.');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Sync from context when settings change
  useEffect(() => {
    setEditDeadline(settings.registrationDeadline);
    setEditIsOpen(settings.isRegistrationOpen);
    setEditWhatsapp(settings.whatsappGroupLink);
    setEditBanner(settings.announcementBanner || '');
    setEditProblemStatementLink(settings.problemStatementLink || '');
    setEditProblemStatementStatus(settings.problemStatementStatus || '');
    setEditPptTemplateLink(settings.pptTemplateLink || '');
    setEditPptTemplateStatus(settings.pptTemplateStatus || '');
    setEditPptSubmissionOpen(settings.pptSubmissionOpen ?? true);
    setEditPptSubmissionStatus(settings.pptSubmissionStatus || '');
    setEditPptSubmissionDeadline(settings.pptSubmissionDeadline || '');
    setEditPptReferenceLink(settings.pptReferenceLink || '');
    setEditIsPptExtended(settings.isPptExtended ?? false);
    setEditPptExtendedDeadline(settings.pptExtendedDeadline || '');
    setEditIsExtended(settings.isExtended ?? false);
    setEditExtendedDeadline(settings.extendedDeadline || '');
    setEditCustomQuote(settings.customQuote || '');
    setEditCustomQuoteAuthor(settings.customQuoteAuthor || '');
    setEditRulesDocumentLink(settings.rulesDocumentLink || '');
    setEditRulesDocumentPdfUrl(settings.rulesDocumentPdfUrl || '');
    setEditRulesDocumentTitle(settings.rulesDocumentTitle || 'Official Rules & Regulations – Internal SIH 2026');
    setRulesDocUploadMode(settings.rulesDocumentPdfUrl ? 'pdf' : 'link');
    setEditPsSelectionDeadline(settings.psSelectionDeadline || '2026-08-16T18:29:00.000Z');
    setEditTimeline(timeline);
    setEditFaqs(faqs);
    setEditRules(rules);
    // Team Edit Window
    setEditTeamEditOpen(settings.teamEditOpen ?? false);
    setEditTeamEditCloseAt(settings.teamEditCloseAt ? toLocalISOString(settings.teamEditCloseAt) : '');
  }, [settings, timeline, faqs, rules]);

  // Countdown timer for team edit close-at
  useEffect(() => {
    if (!editTeamEditCloseAt) { setTeamEditCountdown(''); return; }
    const updateCountdown = () => {
      const closeAt = new Date(editTeamEditCloseAt);
      const diff = closeAt.getTime() - Date.now();
      if (diff <= 0) { setTeamEditCountdown('Closing now…'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTeamEditCountdown(`${h}h ${m}m ${s}s`);
    };
    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, [editTeamEditCloseAt]);

  // Fetch admin stats, teams, email logs & neon status
  const loadAdminData = async () => {
    try {
      setIsLoadingStats(true);
      setIsLoadingTeams(true);
      setIsLoadingEmailLogs(true);

      const [statsData, teamsData, emailLogsData, settingsData, psData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminTeams({
          search: searchQuery,
          department: deptFilter,
          status: statusFilter,
        }),
        api.getEmailLogs().catch(() => ({ logs: [] })),
        api.getSettings().catch(() => ({})),
        api.getProblemStatements().catch(() => ({ problemStatements: [] })),
      ]);

      if (statsData.stats) setStats(statsData.stats);
      if (teamsData.teams) setTeams(teamsData.teams);
      if (emailLogsData.logs) setEmailLogs(emailLogsData.logs);
      if (settingsData.isNeon !== undefined) setIsNeonConnected(settingsData.isNeon);
      if (psData.problemStatements) setAdminPsList(psData.problemStatements);

      await reloadPortalData();
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setIsLoadingStats(false);
      setIsLoadingTeams(false);
      setIsLoadingEmailLogs(false);
    }
  };

  const handleTriggerDeadlineReminders = async () => {
    try {
      setIsSendingDeadlineReminders(true);
      const res = await api.triggerDeadlineReminders();
      if (res.success) {
        showAlert(
          'Deadline Emails Triggered',
          res.message || `Deadline edit reminders dispatched to Team Leaders.`,
          'success'
        );
        const emailLogsData = await api.getEmailLogs().catch(() => ({ logs: [] }));
        if (emailLogsData.logs) setEmailLogs(emailLogsData.logs);
      }
    } catch (err: any) {
      showAlert('Email Dispatch Error', err.message || 'Could not send deadline reminders.');
    } finally {
      setIsSendingDeadlineReminders(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAdminData();
    }
  }, [isAdminLoggedIn, searchQuery, deptFilter, statusFilter]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAuthLoading(true);
      const res = await api.adminLogin({ username, password });
      if (res.success && res.token) {
        loginAdminSession(res.token);
        setSidebarTab('overview');
        await loadAdminData();
        showAlert('Welcome Admin', 'Successfully authenticated as VSITR SIH Admin.', 'success');
      }
    } catch (err: any) {
      showAlert('Login Failed', err.message || 'Invalid admin credentials.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Team Delete
  const handleDeleteTeam = async (id: string) => {
    try {
      const res = await api.deleteTeamAdmin(id);
      if (res.success) {
        setDeleteConfirmTeam(null);
        setSelectedTeam(null);
        showAlert('Team Deleted', res.message || 'Team removed from database.', 'info');
        loadAdminData();
      }
    } catch (err: any) {
      showAlert('Delete Failed', err.message || 'Could not delete team.');
    }
  };

  // Save Settings & Live Deadlines
  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);

      const formatToTimelineDate = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        }).replace(' at ', ', ').replace(' pm', ' PM').replace(' am', ' AM');
      };

      const finalDeadline = editIsExtended && editExtendedDeadline ? editExtendedDeadline : editDeadline;
      const formattedTimelineDate = formatToTimelineDate(finalDeadline);

      // Auto update timeline first event
      const updatedTimeline = editTimeline.map(item => {
        if (item.id === 't1' || item.title.toLowerCase().includes('phase 1') || item.title.toLowerCase().includes('registration deadline')) {
          return { ...item, date: formattedTimelineDate };
        }
        return item;
      });

      // Auto update FAQ f6 (What if I miss the registration deadline?)
      const updatedFaqs = editFaqs.map(item => {
        if (item.id === 'f6' || item.question.toLowerCase().includes('miss the registration deadline')) {
          return {
            ...item,
            answer: `Registrations automatically close on ${formattedTimelineDate}. Late entries will not be entertained under any circumstances.`
          };
        }
        return item;
      });

      const res = await api.updateSettings({
        settings: {
          registrationDeadline: new Date(editDeadline).toISOString(),
          isRegistrationOpen: editIsOpen,
          whatsappGroupLink: editWhatsapp,
          announcementBanner: editBanner,
          problemStatementLink: editProblemStatementLink,
          problemStatementStatus: editProblemStatementStatus,
          pptTemplateLink: editPptTemplateLink,
          pptTemplateStatus: editPptTemplateStatus,
          pptSubmissionOpen: editPptSubmissionOpen,
          pptSubmissionStatus: editPptSubmissionStatus,
          pptSubmissionDeadline: editPptSubmissionDeadline,
          pptReferenceLink: editPptReferenceLink,
          isPptExtended: editIsPptExtended,
          pptExtendedDeadline: editPptExtendedDeadline,
          isExtended: editIsExtended,
          extendedDeadline: editExtendedDeadline,
          customQuote: editCustomQuote,
          customQuoteAuthor: editCustomQuoteAuthor,
          rulesDocumentLink: rulesDocUploadMode === 'link' ? editRulesDocumentLink : '',
          rulesDocumentPdfUrl: rulesDocUploadMode === 'pdf' ? editRulesDocumentPdfUrl : '',
          rulesDocumentTitle: editRulesDocumentTitle,
          psSelectionDeadline: editPsSelectionDeadline,
          teamEditOpen: editTeamEditOpen,
          teamEditCloseAt: editTeamEditCloseAt ? new Date(editTeamEditCloseAt).toISOString() : undefined,
        },
        timeline: updatedTimeline,
        faqs: updatedFaqs,
        rules: editRules,
      });

      if (res.success) {
        if (res.settings) {
          setEditBanner(res.settings.announcementBanner ?? editBanner);
          setEditDeadline(res.settings.registrationDeadline ?? editDeadline);
          setEditIsOpen(res.settings.isRegistrationOpen ?? editIsOpen);
          setEditWhatsapp(res.settings.whatsappGroupLink ?? editWhatsapp);
          setEditProblemStatementLink(res.settings.problemStatementLink ?? editProblemStatementLink);
          setEditProblemStatementStatus(res.settings.problemStatementStatus ?? editProblemStatementStatus);
          setEditPptTemplateLink(res.settings.pptTemplateLink ?? editPptTemplateLink);
          setEditPptTemplateStatus(res.settings.pptTemplateStatus ?? editPptTemplateStatus);
          setEditPptSubmissionOpen(res.settings.pptSubmissionOpen ?? editPptSubmissionOpen);
          setEditPptSubmissionStatus(res.settings.pptSubmissionStatus ?? editPptSubmissionStatus);
          setEditPptSubmissionDeadline(res.settings.pptSubmissionDeadline ?? editPptSubmissionDeadline);
          setEditPptReferenceLink(res.settings.pptReferenceLink ?? editPptReferenceLink);
          setEditIsPptExtended(res.settings.isPptExtended ?? editIsPptExtended);
          setEditPptExtendedDeadline(res.settings.pptExtendedDeadline ?? editPptExtendedDeadline);
          setEditIsExtended(res.settings.isExtended ?? editIsExtended);
          setEditExtendedDeadline(res.settings.extendedDeadline ?? editExtendedDeadline);
          setEditCustomQuote(res.settings.customQuote ?? editCustomQuote);
          setEditCustomQuoteAuthor(res.settings.customQuoteAuthor ?? editCustomQuoteAuthor);
          if (res.settings.teamEditOpen !== undefined) setEditTeamEditOpen(res.settings.teamEditOpen);
          if (res.settings.teamEditCloseAt !== undefined) setEditTeamEditCloseAt(res.settings.teamEditCloseAt ? toLocalISOString(res.settings.teamEditCloseAt) : '');
        }
        setEditTimeline(updatedTimeline);
        setEditFaqs(updatedFaqs);
        showAlert('Settings Updated', 'Event settings, timelines, FAQs & rules saved successfully!', 'success');
        await reloadPortalData();
      }
    } catch (err: any) {
      showAlert('Save Error', err.message || 'Failed to update settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Toggle Team Edit Window Quick Action
  const handleToggleTeamEdit = async () => {
    const newStatus = !editTeamEditOpen;
    setEditTeamEditOpen(newStatus);
    try {
      await api.updateSettings({
        settings: { teamEditOpen: newStatus },
      });
      await reloadPortalData();
      showAlert('Status Changed', `Team Edit Window is now ${newStatus ? 'OPEN' : 'CLOSED'}.`, 'info');
    } catch (err: any) {
      setEditTeamEditOpen(!newStatus);
      showAlert('Error', err.message || 'Failed to toggle team edit window.');
    }
  };

  // Load leader edit requests
  const loadEditRequests = async () => {
    setIsLoadingEditRequests(true);
    try {
      const res = await api.getAdminLeaderEditRequests();
      setLeaderEditRequests(res.requests || []);
    } catch (err) {
      console.error('Error loading edit requests:', err);
    } finally {
      setIsLoadingEditRequests(false);
    }
  };

  // Review a leader edit request
  const handleReviewRequest = async (id: string, action: 'approved' | 'rejected') => {
    setReviewingRequestId(id);
    try {
      const res = await api.reviewLeaderEditRequest(id, action);
      showAlert(
        action === 'approved' ? 'Request Approved' : 'Request Rejected',
        res.message,
        action === 'approved' ? 'success' : 'info'
      );
      await loadEditRequests();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to review request.');
    } finally {
      setReviewingRequestId(null);
    }
  };

  // Toggle Registration Open/Closed Quick Action
  const handleToggleRegistration = async () => {
    const newStatus = !editIsOpen;
    setEditIsOpen(newStatus);
    try {
      await api.updateSettings({
        settings: { isRegistrationOpen: newStatus },
      });
      await reloadPortalData();
      showAlert('Status Changed', `Registration is now ${newStatus ? 'OPEN' : 'CLOSED'}.`, 'info');
    } catch (err: any) {
      setEditIsOpen(!newStatus);
      showAlert('Error', err.message || 'Failed to toggle status.');
    }
  };

  // Timeline handlers
  const handleStartEditTimeline = (item: TimelineEvent) => {
    setEditingTimelineId(item.id);
    setTimelineEditItem({ title: item.title, date: item.date, description: item.description, active: item.active });
  };

  const publishTimeline = async (nextTimeline: TimelineEvent[], message: string) => {
    try {
      setIsSavingSettings(true);
      const res = await api.updateSettings({ timeline: nextTimeline });
      if (!res.success) throw new Error('Failed to save timeline changes.');
      setEditTimeline(nextTimeline);
      localStorage.setItem('sih_2026_timeline_updated_at', new Date().toISOString());
      await reloadPortalData();
      showAlert('Timeline Updated', message, 'success');
    } catch (err: any) {
      showAlert('Timeline Save Error', err.message || 'Failed to publish timeline changes.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveTimelineItem = async (id: string) => {
    const nextTimeline = editTimeline.map((item) =>
        item.id === id
          ? { ...item, ...timelineEditItem }
          : item
    );
    await publishTimeline(nextTimeline, 'The event has been saved and is now live on the website.');
    setEditingTimelineId(null);
  };

  // Saves only the milestones shown on the public Event Timeline.  It must not
  // also apply unsaved values from the wider Event Settings form.
  const handleSaveTimeline = async () => {
    await publishTimeline(editTimeline, 'The Event Timeline is now updated on the main website.');
  };

  const handleAddTimeline = async () => {
    if (!newTimelineTitle.trim() || !newTimelineDate.trim()) return;
    const newItem: TimelineEvent = {
      id: `t_${Date.now()}`,
      title: newTimelineTitle.trim(),
      date: newTimelineDate.trim(),
      description: newTimelineDesc.trim(),
      active: true,
    };
    await publishTimeline([...editTimeline, newItem], 'The new event is now live on the website.');
    setNewTimelineTitle('');
    setNewTimelineDate('');
    setNewTimelineDesc('');
  };

  const handleDeleteTimelineItem = async (id: string) => {
    if (!confirm('Delete this timeline event from the website?')) return;
    await publishTimeline(editTimeline.filter((t) => t.id !== id), 'The event has been removed from the website.');
  };

  // FAQ handlers
  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const newItem: FAQItem = {
      id: `faq_${Date.now()}`,
      question: newFaqQ.trim(),
      answer: newFaqA.trim(),
    };
    setEditFaqs([...editFaqs, newItem]);
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleDeleteFaq = (id: string) => {
    setEditFaqs(editFaqs.filter((f) => f.id !== id));
  };

  // Rule handlers
  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setEditRules([...editRules, { id: 'r' + Date.now(), categoryId: newRuleCategory, text: newRuleText.trim() }]);
    setNewRuleText('');
  };

  const handleDeleteRule = (id: string) => {
    setEditRules(editRules.filter((r) => r.id !== id));
  };

  const handleMoveRule = (id: string, direction: 'up' | 'down') => {
    const ruleIndex = editRules.findIndex(r => r.id === id);
    if (ruleIndex === -1) return;
    const rule = editRules[ruleIndex];

    const catRules = editRules.filter(r => r.categoryId === rule.categoryId);
    const catIndex = catRules.findIndex(r => r.id === id);

    if (direction === 'up' && catIndex > 0) {
      const prevRuleId = catRules[catIndex - 1].id;
      const prevIndex = editRules.findIndex(r => r.id === prevRuleId);
      const newRules = [...editRules];
      newRules[ruleIndex] = newRules[prevIndex];
      newRules[prevIndex] = rule;
      setEditRules(newRules);
    } else if (direction === 'down' && catIndex < catRules.length - 1) {
      const nextRuleId = catRules[catIndex + 1].id;
      const nextIndex = editRules.findIndex(r => r.id === nextRuleId);
      const newRules = [...editRules];
      newRules[ruleIndex] = newRules[nextIndex];
      newRules[nextIndex] = rule;
      setEditRules(newRules);
    }
  };

  // Bulk Reminder
  const handleBulkReminder = async () => {
    try {
      const res = await api.sendBulkReminders();
      showAlert('Reminders Dispatched', res.message || 'Notifications sent to pending leaders.', 'success');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to send reminders.');
    }
  };

  // Export full .xlsx Report
  const handleExportReport = async () => {
    setIsExportingReport(true);
    try {
      const res = await fetch('/api/admin/export/full-report');
      if (!res.ok) {
        const errText = await res.text().catch(() => 'Server error');
        throw new Error(errText || `Server returned ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SIH_2026_Report.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showAlert('Export Failed', err.message || 'Could not generate the report. Please try again.');
    } finally {
      setIsExportingReport(false);
    }
  };

  // LOGIN SCREEN FOR ADMIN
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#F8FAFC] relative">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white px-3.5 py-2 rounded-full border border-slate-200 shadow-xs"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Home
        </button>

        <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B] z-10" />

          {/* LEFT SIDE: LOGIN FORM */}
          <div className="p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#C1272D] mb-4 shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Admin Portal Authentication
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                Authorized faculty, club coordinators &amp; event administrator access only.
              </p>

              <form onSubmit={handleAdminLogin} className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sih_admin_vsitr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#C1272D] outline-none transition font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#C1272D] outline-none transition font-medium text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#C1272D] to-red-700 hover:opacity-95 shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAuthLoading ? 'Authenticating Admin...' : 'Login to Admin Console'}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT SIDE ONLY: IMAGE & OVERLAY BADGE */}
          <div className="relative hidden md:block bg-slate-900 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80"
              alt="Hackathon Administration Portal"
              className="absolute inset-0 w-full h-full object-cover opacity-50 filter contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-8 flex flex-col justify-end text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 border border-white/20 text-xs font-bold w-fit mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Internal SIH 2026 Oversight</span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight">
                Vidush Somany Institute of Technology &amp; Research
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Centralized management console for student team verification, department metrics, timelines, and live hackathon registration controls.
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased">

      {/* LEFT SIDEBAR NAVIGATION */}
      <div className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-30 shadow-2xs overflow-y-auto no-scrollbar">
        <div className="space-y-6">

          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#C1272D] to-rose-600 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                SIH Admin Console
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                VSITR 2026
              </span>
            </div>
          </div>

          {/* Nav Menu Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setSidebarTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'overview'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="truncate">Overview &amp; Stats</span>
            </button>

            <button
              onClick={() => setSidebarTab('teams')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'teams'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users className="h-4 w-4 shrink-0" />
                <span className="truncate">Team Registry</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold shrink-0">
                {teams.length}
              </span>
            </button>

            <button
              onClick={() => setSidebarTab('timeline')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'timeline'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate">Timeline &amp; Schedule</span>
            </button>

            <button
              onClick={() => setSidebarTab('faqs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'faqs'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">FAQs &amp; Rules</span>
            </button>

            <button
              onClick={() => setSidebarTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'settings'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="truncate">Event Settings</span>
            </button>

            <button
              onClick={() => setSidebarTab('emails')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'emails'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">Emails &amp; Logs</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-extrabold shrink-0">
                {emailLogs.length}
              </span>
            </button>

            <button
              onClick={async () => {
                setSidebarTab('ppt-submissions');
                setIsLoadingPptSubmissions(true);
                try {
                  const d = await api.getAdminPptSubmissions();
                  setPptSubmissions(d.submissions || []);
                } catch (e) { } finally {
                  setIsLoadingPptSubmissions(false);
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'ppt-submissions'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">PPT Submissions</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-extrabold shrink-0">
                {pptSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setSidebarTab('problem-statements')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'problem-statements'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="truncate">Problem Statements</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-extrabold shrink-0">
                {adminPsList.length}
              </span>
            </button>

            <button
              onClick={async () => {
                setSidebarTab('edit-requests');
                await loadEditRequests();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'edit-requests'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Edit3 className="h-4 w-4 shrink-0" />
                <span className="truncate">Edit Requests</span>
              </div>
              {leaderEditRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-extrabold shrink-0">
                  {leaderEditRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="mx-1 pt-2 pb-1">
              <p className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest px-2">Lookup Tools</p>
            </div>

            <button
              onClick={() => setSidebarTab('team-lookup')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'team-lookup'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <UserSearch className="h-4 w-4 shrink-0" />
              <span className="truncate">Team Lookup</span>
            </button>

            <button
              onClick={() => setSidebarTab('mentor-lookup')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${sidebarTab === 'mentor-lookup'
                  ? 'bg-rose-50 text-[#C1272D] shadow-2xs border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span className="truncate">Mentor Lookup</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Action: Status Toggle & Logout */}
        <div className="pt-4 mt-6 border-t border-slate-100 space-y-2.5">
          {/* Quick Registration Mode Toggle */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                Registration Status
              </span>
              <span className={`text-[10px] font-extrabold block ${editIsOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                {editIsOpen ? 'Live & Open' : 'Closed'}
              </span>
            </div>
            <button
              onClick={handleToggleRegistration}
              className={`p-1 rounded-full transition cursor-pointer ${editIsOpen ? 'text-emerald-600' : 'text-slate-300'}`}
              title="Toggle Registration Open/Closed"
            >
              {editIsOpen ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
            </button>
          </div>

          {/* Quick Team Edit Window Toggle */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                Team Edit Window
              </span>
              <span className={`text-[10px] font-extrabold block ${editTeamEditOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                {editTeamEditOpen ? 'Open' : 'Closed'}
              </span>
              {editTeamEditOpen && teamEditCountdown && (
                <span className="text-[9px] text-amber-600 font-bold block mt-0.5">⏱ {teamEditCountdown}</span>
              )}
            </div>
            <button
              onClick={handleToggleTeamEdit}
              className={`p-1 rounded-full transition cursor-pointer ${editTeamEditOpen ? 'text-blue-600' : 'text-slate-300'}`}
              title="Toggle Team Edit Window Open/Closed"
            >
              {editTeamEditOpen ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
            </button>
          </div>

          <button
            onClick={() => setActiveTab('home')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#1B3F8B] hover:bg-blue-50 transition cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4 text-[#1B3F8B] shrink-0" />
            <span className="truncate">Go to Main Website</span>
          </button>

          <button
            onClick={logoutAdminSession}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Log out Admin</span>
          </button>
        </div>
      </div>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 flex flex-col justify-between overflow-y-auto no-scrollbar min-h-screen">

        <div className="space-y-6 max-w-[1600px] w-full mx-auto">
          {/* TOP HEADER BAR */}
          <div className="sticky top-0 bg-[#F8FAFC]/95 backdrop-blur-md z-20 pb-4 pt-1 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            {/* Search Bar Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search team name, ID, leader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#C1272D] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Indicator & Admin Profile */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-700">
                <span className={`h-2.5 w-2.5 rounded-full ${editIsOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {editIsOpen ? 'Open For Registration' : 'Registration Closed'}
              </div>

              <button
                onClick={loadAdminData}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 ${(isLoadingStats || isLoadingTeams || isLoadingEmailLogs) ? 'animate-spin text-[#C1272D]' : ''}`} />
              </button>

              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="h-9 w-9 rounded-full bg-[#1B3F8B] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  AD
                </div>
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-black text-slate-900 block leading-tight">VSITR Admin</span>
                  <span className="text-[10px] font-semibold text-slate-400 block">Co-ordinator</span>
                </div>
              </div>
            </div>

          </div>

          {/* TAB 1: OVERVIEW & STATS */}
          {sidebarTab === 'overview' && stats && (
            <div className="space-y-6 animate-in fade-in duration-200">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Registration Overview
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Real-time internal hackathon metrics, gender ratio &amp; departmental stats.
                  </p>
                </div>

                <button
                  id="btn-export-report"
                  onClick={handleExportReport}
                  disabled={isExportingReport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md transition cursor-pointer shrink-0"
                >
                  {isExportingReport ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isExportingReport ? 'Generating…' : 'Export Report'}
                </button>
              </div>

              {/* Stat KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div 
                  onClick={() => setSidebarTab('teams')}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1 cursor-pointer hover:border-[#C1272D] transition group"
                >
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Total Teams
                  </span>
                  <span className="text-3xl font-black text-[#C1272D] block">
                    {stats.totalTeams}
                  </span>
                  <span className="text-[11px] text-[#C1272D] font-bold block group-hover:underline">
                    View All {stats.totalTeams} Teams →
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Total Students
                  </span>
                  <span className="text-3xl font-black text-[#1B3F8B] block">
                    {stats.totalParticipants}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    VSITR Participants
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Female Participants
                  </span>
                  <span className="text-3xl font-black text-purple-700 block">
                    {stats.femaleParticipants}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-bold block">
                    ✔ Min 1 female rule strictly met
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Mentors Submitted
                  </span>
                  <span className="text-3xl font-black text-emerald-600 block">
                    {stats.completedMentorCount}
                  </span>
                  <button
                    onClick={handleBulkReminder}
                    className="text-[11px] font-bold text-amber-700 hover:underline block cursor-pointer"
                  >
                    Remind {stats.pendingMentorCount} Pending →
                  </button>
                </div>

                <div 
                  onClick={() => setSidebarTab('teams')}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1 cursor-pointer hover:border-purple-500 transition group"
                >
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    PS Selected
                  </span>
                  <span className="text-3xl font-black text-purple-700 block">
                    {teams.filter(t => t.selectedPsId).length} / {stats.totalTeams}
                  </span>
                  <span className="text-[11px] text-purple-700 font-bold block group-hover:underline">
                    Teams Locked PS →
                  </span>
                </div>
              </div>

              {/* PPT Submission Portal Live Quick Control Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/90 border border-blue-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="space-y-1.5 text-left w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider border ${
                      editPptSubmissionOpen
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {editPptSubmissionOpen ? '🟢 PPT PORTAL LIVE & OPEN' : '🔴 PPT PORTAL CLOSED'}
                    </span>
                    {editIsPptExtended && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase tracking-wider border border-amber-300">
                        ⏳ Extension Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    PPT &amp; Prototype Submission Portal Management
                  </h3>
                  <p className="text-xs text-slate-600 font-medium max-w-xl leading-relaxed">
                    {editPptSubmissionOpen 
                      ? 'The submission portal is currently LIVE. Students can upload their PPT decks, 2-minute video pitch links, and GitHub prototype repos.'
                      : 'The portal is currently CLOSED. Turn live ON to open submissions or grant deadline extensions.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      const nextState = !editPptSubmissionOpen;
                      setEditPptSubmissionOpen(nextState);
                      try {
                        await api.updateSettings({ settings: { pptSubmissionOpen: nextState } });
                        await reloadPortalData();
                        showAlert('PPT Portal Status', `PPT Submission Portal is now ${nextState ? 'LIVE & OPEN' : 'CLOSED'}.`, 'info');
                      } catch (err: any) {
                        setEditPptSubmissionOpen(!nextState);
                        showAlert('Error', err.message || 'Could not update PPT portal state.');
                      }
                    }}
                    className={`px-5 py-2.5 rounded-2xl font-black text-xs text-white shadow-md transition cursor-pointer ${
                      editPptSubmissionOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {editPptSubmissionOpen ? 'Close PPT Portal' : 'Make PPT Portal LIVE'}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setSidebarTab('ppt-submissions');
                      setIsLoadingPptSubmissions(true);
                      try {
                        const d = await api.getAdminPptSubmissions();
                        setPptSubmissions(d.submissions || []);
                      } catch (e) {} finally {
                        setIsLoadingPptSubmissions(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-2xl font-black text-xs text-white bg-[#1B3F8B] hover:bg-blue-900 shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    Manage Submissions &amp; Extensions →
                  </button>
                </div>
              </div>

              {/* Department breakdown */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Department Participation (IT, CSE, CE)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <span className="text-slate-500 block uppercase text-[10px]">Information Tech (IT)</span>
                    <span className="text-2xl font-black text-[#1B3F8B] mt-1 block">
                      {stats.departmentStats?.IT || 0}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
                    <span className="text-slate-500 block uppercase text-[10px]">Computer Science (CSE)</span>
                    <span className="text-2xl font-black text-[#C1272D] mt-1 block">
                      {stats.departmentStats?.CSE || 0}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <span className="text-slate-500 block uppercase text-[10px]">Computer Engg (CE)</span>
                    <span className="text-2xl font-black text-amber-700 mt-1 block">
                      {stats.departmentStats?.CE || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Problem Statement Selection Metrics */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Problem Statement Selections ({teams.filter(t => t.selectedPsId).length} / {teams.length} Teams)
                  </h3>
                </div>

                {/* Problem Statement Selection Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold my-2">
                  <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-slate-500 block uppercase text-[9px] tracking-wider font-extrabold">AI Dropout Prediction (7-L)</span>
                      <span className="text-xs font-bold text-slate-700 block leading-tight">AI-Powered Academic Dropout Prediction</span>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-2xl font-black text-indigo-700 block">
                        {teams.filter(t => t.selectedPsId === '7-L').length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">teams</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-slate-500 block uppercase text-[9px] tracking-wider font-extrabold">Smart Waste Management (8-L)</span>
                      <span className="text-xs font-bold text-slate-700 block leading-tight">Smart Waste and Citizen Reporting</span>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-2xl font-black text-emerald-700 block">
                        {teams.filter(t => t.selectedPsId === '8-L').length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">teams</span>
                    </div>
                  </div>
                </div>

                {teams.filter(t => t.selectedPsId).length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium py-2">No teams have selected a problem statement yet.</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="py-2.5 px-3">Team</th>
                          <th className="py-2.5 px-3">PS ID</th>
                          <th className="py-2.5 px-3">PS Title</th>
                          <th className="py-2.5 px-3">Selected At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {teams
                          .filter(t => t.selectedPsId)
                          .map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                {t.teamName} <span className="text-[10px] text-slate-400 font-mono">({t.id})</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-black text-[#C1272D] whitespace-nowrap">{t.selectedPsId}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{t.selectedPsTitle}</td>
                              <td className="py-2.5 px-3 text-slate-500 font-semibold whitespace-nowrap">
                                {t.psSelectedAt ? new Date(t.psSelectedAt).toLocaleString('en-IN') : 'N/A'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: TEAM REGISTRY (Clean Perfect-Fit Layout & Table) */}
          {sidebarTab === 'teams' && (
            <div className="space-y-4 animate-in fade-in duration-200">

              {/* Unified Header Card with Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Team Registry
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    All registered 6-member teams. Click inspect or use actions to edit/delete.
                  </p>
                </div>

                {/* Department Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 shrink-0">
                  {['ALL', 'IT', 'CSE', 'CE'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDeptFilter(d)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${deptFilter === d
                          ? 'bg-[#C1272D] text-white shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                      {d === 'ALL' ? 'All Depts' : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teams List Table with Proportional Colgroup & Perfect Fit */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto no-scrollbar w-full">
                  <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                    <colgroup>
                      <col className="w-[12%]" />
                      <col className="w-[18%]" />
                      <col className="w-[24%]" />
                      <col className="w-[13%]" />
                      <col className="w-[11%]" />
                      <col className="w-[14%]" />
                      <col className="w-[8%]" />
                    </colgroup>
                    <thead className="bg-slate-50/90 border-b border-slate-200/80">
                      <tr className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap">
                        <th className="py-3.5 px-4 bg-slate-50/90">Team ID</th>
                        <th className="py-3.5 px-4 bg-slate-50/90">Team Name</th>
                        <th className="py-3.5 px-4 bg-slate-50/90">Leader &amp; Contact</th>
                        <th className="py-3.5 px-4 bg-slate-50/90">Dept &amp; Sem</th>
                        <th className="py-3.5 px-4 bg-slate-50/90">Status</th>
                        <th className="py-3.5 px-4 bg-slate-50/90">PS Selected</th>
                        <th className="py-3.5 px-4 bg-slate-50/90 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {teams.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No registered teams found matching the search or department filter.
                          </td>
                        </tr>
                      ) : (
                        teams.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#1B3F8B] text-xs whitespace-nowrap align-middle">
                              {t.id}
                            </td>
                            <td className="py-3.5 px-4 font-black text-slate-900 text-sm whitespace-nowrap align-middle truncate max-w-[180px]" title={t.teamName}>
                              {t.teamName}
                            </td>
                            <td className="py-3.5 px-4 align-middle">
                              <span className="font-bold text-slate-900 text-xs block whitespace-nowrap">{t.leader.fullName}</span>
                              <span className="text-[11px] text-slate-500 font-medium block truncate max-w-[200px]" title={t.leader.email}>{t.leader.email}</span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#1B3F8B] text-xs whitespace-nowrap align-middle">
                              {t.leader.department} • Sem {t.leader.semester}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                              {t.status === 'completed' ? (
                                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Completed
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                  Pending Mentor
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 align-middle">
                              {t.selectedPsId ? (
                                <div>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 inline-block mb-0.5">
                                    {t.selectedPsId}
                                  </span>
                                  <span className="text-[11px] text-slate-600 font-medium block truncate max-w-[180px]" title={t.selectedPsTitle}>
                                    {t.selectedPsTitle || '—'}
                                  </span>
                                </div>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                                  Not Selected
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {t.pptSubmission && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPpt(t.pptSubmission?.pptFileUrl || t.pptSubmission?.fileUrl, t.pptSubmission?.pptFileName || `${t.id}.pptx`, t.id)}
                                    className="px-2.5 py-1 rounded-xl font-black text-[11px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="Download PPT Deck"
                                  >
                                    <Download className="h-3 w-3 text-emerald-600" /> PPT
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedTeam(t)}
                                  className="px-3 py-1.5 rounded-xl font-bold text-xs text-[#1B3F8B] bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition cursor-pointer"
                                >
                                  Inspect / Edit
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmTeam(t)}
                                  className="p-1.5 rounded-xl text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100/80 transition cursor-pointer"
                                  title="Delete Team"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TIMELINE & SCHEDULE EDITABLE MANAGER */}
          {sidebarTab === 'timeline' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Timeline &amp; Schedule Editor
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Directly add, update, or remove hackathon event milestone dates.
                  </p>
                </div>

                <button
                  onClick={handleSaveTimeline}
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] shadow-md hover:opacity-95 transition cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  {isSavingSettings ? 'Saving...' : 'Save Timeline Changes'}
                </button>
              </div>

              {/* Timeline items list */}
              <div className="space-y-3">
                {editTimeline.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3"
                  >
                    {editingTimelineId === item.id ? (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={timelineEditItem.title}
                            onChange={(e) => setTimelineEditItem({ ...timelineEditItem, title: e.target.value })}
                            className="p-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                          />
                          {(item.id === 't5' || item.title.toLowerCase().includes('presentation day')) ? (
                            <input
                              type="text"
                              aria-label="PPT Presentation Day date text"
                              placeholder="e.g. 26 August 2026, 10:00 AM"
                              value={timelineEditItem.date}
                              onChange={(e) => setTimelineEditItem({ ...timelineEditItem, date: e.target.value })}
                              className="p-2 rounded-xl border border-[#1B3F8B] ring-1 ring-[#1B3F8B]/20 font-bold text-slate-900 focus:outline-none bg-blue-50/40"
                            />
                          ) : toTimelineDateTimeInput(timelineEditItem.date) ? (
                            <input
                              type="datetime-local"
                              aria-label="Timeline date and time"
                              value={toTimelineDateTimeInput(timelineEditItem.date)}
                              onChange={(e) => setTimelineEditItem({ ...timelineEditItem, date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                              className="p-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                            />
                          ) : (
                            <input
                              type="text"
                              aria-label="Timeline schedule note"
                              placeholder="Schedule note (for example, Time will be shared soon)"
                              value={timelineEditItem.date}
                              onChange={(e) => setTimelineEditItem({ ...timelineEditItem, date: e.target.value })}
                              className="p-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                            />
                          )}
                        </div>
                        <textarea
                          value={timelineEditItem.description}
                          onChange={(e) => setTimelineEditItem({ ...timelineEditItem, description: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-300 text-slate-900"
                          rows={2}
                        />
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={timelineEditItem.active}
                            onChange={(e) => setTimelineEditItem({ ...timelineEditItem, active: e.target.checked })}
                            className="h-4 w-4 accent-[#1B3F8B]"
                          />
                          Mark this event as active on the public timeline
                        </label>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTimelineId(null)}
                            className="px-3 py-1 rounded-xl bg-slate-100 font-bold text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveTimelineItem(item.id)}
                            className="px-4 py-1 rounded-xl bg-[#1B3F8B] text-white font-bold cursor-pointer"
                          >
                            Save Item
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#1B3F8B]">
                              {(item.id === 't5' || item.title.toLowerCase().includes('presentation day'))
                                ? item.date
                                : formatTimelineDate(item.date)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditTimeline(item)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTimelineItem(item.id)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new milestone card */}
              <div className="p-5 rounded-3xl bg-slate-100/70 border border-slate-200 space-y-3 text-xs">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                  + Add New Timeline Event
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Milestone Title (e.g. Mentor Review Round)"
                    value={newTimelineTitle}
                    onChange={(e) => setNewTimelineTitle(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none text-slate-900"
                  />
                  <input
                    type="datetime-local"
                    aria-label="New timeline date and time"
                    placeholder="Date and time"
                    value={newTimelineDate}
                    onChange={(e) => setNewTimelineDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Event Description / Notes"
                    value={newTimelineDesc}
                    onChange={(e) => setNewTimelineDesc(e.target.value)}
                    className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none text-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTimeline}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-black shadow-xs transition cursor-pointer"
                >
                  Add Event Milestone
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: FAQS & RULES EDITABLE MANAGER */}
          {sidebarTab === 'faqs' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    FAQs &amp; Official Rules Editor
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Edit rules and frequently asked questions displayed to students.
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] shadow-md hover:opacity-95 transition cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  {isSavingSettings ? 'Saving...' : 'Save All FAQs & Rules'}
                </button>
              </div>

              {/* FAQ Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Frequently Asked Questions ({editFaqs.length})
                </h3>
                {editFaqs.map((faq) => (
                  <div key={faq.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block">{faq.question}</span>
                      <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="text-red-500 hover:text-red-700 p-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">+ Add New FAQ Item</span>
                  <input
                    type="text"
                    placeholder="Question title..."
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                  <textarea
                    placeholder="Answer text..."
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white cursor-pointer"
                  >
                    Add FAQ
                  </button>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-6 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">
                  Official Hackathon Rules ({editRules.length})
                </h3>

                {(['official', 'phases', 'conduct'] as RuleCategory[]).map((catId) => {
                  const catRules = editRules.filter(r => r.categoryId === catId);
                  const title = catId === 'official' ? '01. Official SIH Rules & Regulations' : catId === 'phases' ? '02. Internal SIH 2026 Registration Phases' : '03. Internal SIH 2026 Conduct & Decisions';

                  return (
                    <div key={catId} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{title}</h4>
                      <div className="space-y-2">
                        {catRules.map((r, idx) => (
                          <div key={r.id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-3">
                            <span className="font-medium text-slate-800 flex-1">
                              <strong className="text-[#1B3F8B] mr-1">Rule {idx + 1}:</strong> {r.text}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveRule(r.id, 'up')}
                                disabled={idx === 0}
                                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1 cursor-pointer"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRule(r.id, 'down')}
                                disabled={idx === catRules.length - 1}
                                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1 cursor-pointer"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(r.id)}
                                className="text-red-500 hover:text-red-700 p-1 ml-1 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-3 text-xs">
                  <span className="font-bold text-slate-700 block">+ Add New Rule</span>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as RuleCategory)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                  >
                    <option value="official">01. Official SIH Rules &amp; Regulations</option>
                    <option value="phases">02. Internal SIH 2026 Registration Phases</option>
                    <option value="conduct">03. Internal SIH 2026 Conduct &amp; Decisions</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter new rule text..."
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white cursor-pointer"
                  >
                    Add Rule
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: EVENT SETTINGS */}
          {sidebarTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Portal &amp; Live Deadline Settings
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Configure registration cutoff dates, links &amp; live announcement banner.
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] shadow-md hover:opacity-95 transition cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  {isSavingSettings ? 'Saving...' : 'Save Settings Live'}
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Registration Cutoff Deadline Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={toLocalISOString(editDeadline)}
                    onChange={(e) => setEditDeadline(new Date(e.target.value).toISOString())}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-[#C1272D] outline-none text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Updates the live home page countdown timer immediately.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Registration Manual Override
                  </label>
                  <select
                    value={editIsOpen ? 'true' : 'false'}
                    onChange={(e) => setEditIsOpen(e.target.value === 'true')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold outline-none text-slate-900 bg-white"
                  >
                    <option value="true">OPEN — Allow Student Registration</option>
                    <option value="false">CLOSED — Lock Registration Site-Wide</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Deadline Extension Status
                  </label>
                  <select
                    value={editIsExtended ? 'true' : 'false'}
                    onChange={(e) => setEditIsExtended(e.target.value === 'true')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold outline-none text-slate-900 bg-white"
                  >
                    <option value="false">REGULAR — Close exactly at deadline</option>
                    <option value="true">EXTENDED — Allow registrations post-deadline (Extension Active)</option>
                  </select>
                </div>

                {editIsExtended && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block font-bold text-slate-800 mb-1">
                      Extended Deadline Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={toLocalISOString(editExtendedDeadline)}
                      onChange={(e) => setEditExtendedDeadline(new Date(e.target.value).toISOString())}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-[#C1272D] outline-none text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      The countdown timer will automatically switch to count down to this new date.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      Closed Registration Custom Quote
                    </label>
                    <input
                      type="text"
                      value={editCustomQuote || ''}
                      onChange={(e) => setEditCustomQuote(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                      placeholder="e.g. Innovation distinguishes between a leader and a follower."
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Quote Author
                    </label>
                    <input
                      type="text"
                      value={editCustomQuoteAuthor || ''}
                      onChange={(e) => setEditCustomQuoteAuthor(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                      placeholder="e.g. Steve Jobs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Official WhatsApp Group Invite Link
                  </label>
                  <input
                    type="url"
                    required
                    value={editWhatsapp || ''}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Announcement Banner Message (Header Alert)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 📢 Registrations close on 05 August 2026!"
                    value={editBanner || ''}
                    onChange={(e) => setEditBanner(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Problem Statement Link
                    </label>
                    <input
                      type="url"
                      value={editProblemStatementLink || ''}
                      onChange={(e) => setEditProblemStatementLink(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                      placeholder="e.g. https://www.sih.gov.in/sih2025PS"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Problem Statement Status / Message
                    </label>
                    <input
                      type="text"
                      value={editProblemStatementStatus || ''}
                      onChange={(e) => setEditProblemStatementStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                      placeholder="e.g. Announced soon..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      PPT Template Download Link
                    </label>
                    <input
                      type="text"
                      value={editPptTemplateLink || ''}
                      onChange={(e) => setEditPptTemplateLink(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                      placeholder="e.g. /templates/sih_template.pptx"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      PPT Template Status / Message
                    </label>
                    <input
                      type="text"
                      value={editPptTemplateStatus || ''}
                      onChange={(e) => setEditPptTemplateStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                      placeholder="e.g. Coming soon..."
                    />
                  </div>
                </div>

                {/* PS Selection Deadline */}
                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                  <h3 className="text-xs font-black text-[#1B3F8B] uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Problem Statement Selection Deadline
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    When this date &amp; time passes, the PS selection is automatically <strong className="text-red-600">locked</strong> for all teams — no further selections can be made.
                  </p>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">PS Selection Cutoff Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={toLocalISOString(editPsSelectionDeadline)}
                      onChange={(e) => setEditPsSelectionDeadline(new Date(e.target.value).toISOString())}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-[#1B3F8B] outline-none text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Current deadline: <strong>{new Date(editPsSelectionDeadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</strong>
                    </p>
                  </div>
                </div>

                {/* Team Edit Window Settings */}
                <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                  <h3 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                    <Edit3 className="h-4 w-4" /> Team Edit Window
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    When open, team leaders can edit their member details and submit change requests for their own fields. The window auto-closes at the scheduled time below.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1 text-xs">Window Status</label>
                      <select
                        value={editTeamEditOpen ? 'true' : 'false'}
                        onChange={(e) => setEditTeamEditOpen(e.target.value === 'true')}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold outline-none text-slate-900 bg-white"
                      >
                        <option value="true">Open — Leaders can edit</option>
                        <option value="false">Closed — Editing disabled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1 text-xs">Auto-close Date &amp; Time (optional)</label>
                      <input
                        type="datetime-local"
                        value={editTeamEditCloseAt}
                        onChange={(e) => setEditTeamEditCloseAt(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-blue-500 outline-none text-slate-900"
                      />
                      {editTeamEditCloseAt && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          {teamEditCountdown
                            ? <span>Closes in: <strong className="text-amber-600">{teamEditCountdown}</strong></span>
                            : <span>Auto-close at: <strong>{new Date(editTeamEditCloseAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</strong></span>}
                        </p>
                      )}
                      {editTeamEditCloseAt && (
                        <button type="button" onClick={() => setEditTeamEditCloseAt('')} className="mt-1 text-[10px] text-red-500 hover:underline font-bold cursor-pointer">
                          Clear auto-close time
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* PPT Submission Settings */}
                <div className="p-5 rounded-2xl bg-[#C1272D]/5 border border-[#C1272D]/20 space-y-4">
                  <h3 className="text-xs font-black text-[#C1272D] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4" /> PPT Submission Portal Live Control &amp; Extensions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Submission Portal Status</label>
                      <select
                        value={editPptSubmissionOpen ? 'true' : 'false'}
                        onChange={(e) => setEditPptSubmissionOpen(e.target.value === 'true')}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold outline-none text-slate-900 bg-white"
                      >
                        <option value="true">🟢 OPEN — Teams Can Submit PPTs</option>
                        <option value="false">🔴 CLOSED — Submission Locked</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Deadline Extension Mode</label>
                      <select
                        value={editIsPptExtended ? 'true' : 'false'}
                        onChange={(e) => setEditIsPptExtended(e.target.value === 'true')}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold outline-none text-slate-900 bg-white"
                      >
                        <option value="false">REGULAR — Close at deadline</option>
                        <option value="true">EXTENDED — Allow extension submissions</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Submission Deadline (Auto-Close Date &amp; Time)</label>
                      <input
                        type="datetime-local"
                        required
                        value={toLocalISOString(editPptSubmissionDeadline)}
                        onChange={(e) => setEditPptSubmissionDeadline(new Date(e.target.value).toISOString())}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-[#C1272D] outline-none text-slate-900"
                      />
                    </div>
                    {editIsPptExtended && (
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Extended Submission Deadline</label>
                        <input
                          type="datetime-local"
                          required
                          value={toLocalISOString(editPptExtendedDeadline)}
                          onChange={(e) => setEditPptExtendedDeadline(new Date(e.target.value).toISOString())}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-[#C1272D] outline-none text-slate-900"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Submission Status Message (Shown to Students)</label>
                      <textarea
                        rows={2}
                        value={editPptSubmissionStatus || ''}
                        onChange={(e) => setEditPptSubmissionStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#C1272D] outline-none resize-none text-slate-900"
                        placeholder="e.g. PPT & Prototype submission portal is now open..."
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Sample Filled Guide PDF Link</label>
                      <input
                        type="text"
                        value={editPptReferenceLink || ''}
                        onChange={(e) => setEditPptReferenceLink(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#C1272D] outline-none text-slate-900"
                        placeholder="e.g. /SIH-PPT-REFERANCE.pdf"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules & Regulations Document Section */}
              <div className="p-5 rounded-2xl bg-[#1B3F8B]/5 border border-[#1B3F8B]/20 space-y-4">
                <h3 className="text-xs font-black text-[#1B3F8B] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Rules &amp; Regulations Document
                </h3>
                <p className="text-[11px] text-slate-500 font-medium -mt-2">
                  Share the official rules &amp; regulations with students — either via an external link or by uploading a PDF file directly.
                </p>

                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Document Title (shown on cards)</label>
                  <input
                    type="text"
                    value={editRulesDocumentTitle || ''}
                    onChange={(e) => setEditRulesDocumentTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                    placeholder="e.g. Official Rules & Regulations – Internal SIH 2026"
                  />
                </div>

                {/* Upload Mode Toggle */}
                <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-slate-300 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setRulesDocUploadMode('link')}
                    className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-black transition cursor-pointer ${
                      rulesDocUploadMode === 'link'
                        ? 'bg-[#1B3F8B] text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔗 Upload Link (URL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRulesDocUploadMode('pdf')}
                    className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-black transition cursor-pointer border-l border-slate-300 ${
                      rulesDocUploadMode === 'pdf'
                        ? 'bg-[#1B3F8B] text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📄 Upload PDF File
                  </button>
                </div>

                {/* URL Mode */}
                {rulesDocUploadMode === 'link' && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block font-bold text-slate-800 mb-1">Rules Document URL</label>
                    <input
                      type="url"
                      value={editRulesDocumentLink || ''}
                      onChange={(e) => setEditRulesDocumentLink(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none text-slate-900"
                      placeholder="e.g. https://drive.google.com/file/d/... or /rules.pdf"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Students will see a button linking to this URL (external link, Google Drive, or internal path).
                    </p>
                  </div>
                )}

                {/* PDF Upload Mode */}
                {rulesDocUploadMode === 'pdf' && (
                  <div className="animate-in fade-in duration-200 space-y-3">
                    <label className="block font-bold text-slate-800 mb-1">Upload PDF File</label>
                    <div className="flex items-start gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#1B3F8B]/50 bg-blue-50 text-[#1B3F8B] text-xs font-black hover:bg-blue-100 transition">
                        <FileText className="h-4 w-4" />
                        {isUploadingRulesPdf ? 'Processing...' : 'Choose PDF File'}
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          disabled={isUploadingRulesPdf}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!file.name.toLowerCase().endsWith('.pdf')) {
                              showAlert('Invalid File', 'Please select a PDF file (.pdf) only.');
                              return;
                            }
                            if (file.size > 10 * 1024 * 1024) {
                              showAlert('File Too Large', 'PDF file must be 10 MB or smaller.');
                              return;
                            }
                            setIsUploadingRulesPdf(true);
                            const reader = new FileReader();
                            reader.onload = () => {
                              setEditRulesDocumentPdfUrl(reader.result as string);
                              setIsUploadingRulesPdf(false);
                            };
                            reader.onerror = () => {
                              showAlert('Read Error', 'Could not read the PDF file.');
                              setIsUploadingRulesPdf(false);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {editRulesDocumentPdfUrl && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          PDF Uploaded — Ready to save
                          <button
                            type="button"
                            onClick={() => setEditRulesDocumentPdfUrl('')}
                            className="ml-1 text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      The PDF will be encoded and served directly. Students can view or download it from the portal. Max 10 MB.
                    </p>
                  </div>
                )}

                {/* Preview note */}
                {(editRulesDocumentLink || editRulesDocumentPdfUrl) && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-800 font-semibold">
                    <Eye className="h-3.5 w-3.5" />
                    Document configured. Click &quot;Save Settings Live&quot; to publish to students.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: PPT SUBMISSIONS */}
          {sidebarTab === 'ppt-submissions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="h-6 w-6 text-[#C1272D]" />
                    PPT &amp; Prototype Submissions Management
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Directly control portal submission status, deadline extensions, and review team pitch decks.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setIsLoadingPptSubmissions(true);
                      try {
                        const d = await api.getAdminPptSubmissions();
                        setPptSubmissions(d.submissions || []);
                      } catch (e) { } finally {
                        setIsLoadingPptSubmissions(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-[#1B3F8B] hover:bg-blue-900 transition cursor-pointer shrink-0 shadow-md"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPptSubmissions ? 'animate-spin' : ''}`} />
                    Refresh List
                  </button>
                </div>
              </div>

              {isLoadingPptSubmissions ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pptSubmissions.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold text-slate-700">No PPT submissions recorded yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Submissions will appear here in real-time once teams upload their decks.</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs space-y-2">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Recorded Submissions ({pptSubmissions.length} Teams Submitted)
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      💡 Click "Reset &amp; Allow Re-Submission" to delete a submission and unlock a team's portal.
                    </span>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-xs border-collapse min-w-[950px]">
                      <thead className="bg-slate-50/90 border-b border-slate-200/80">
                        <tr className="text-left font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          <th className="py-3.5 px-4 bg-slate-50/90">Team ID</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">Team Name</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">Leader</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">PPT Deck</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">YouTube Demo</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">GitHub Repo</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">Submitted</th>
                          <th className="py-3.5 px-4 bg-slate-50/90 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {pptSubmissions.map((sub: any) => (
                          <tr key={sub.id || sub.teamId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#1B3F8B] whitespace-nowrap">{sub.teamId}</td>
                            <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">{sub.teamName}</td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block whitespace-nowrap">{sub.leaderName}</span>
                              <span className="text-[11px] text-slate-500 font-medium block truncate max-w-[180px]">{sub.leaderEmail}</span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDownloadPpt(sub.fileUrl || sub.pptFileUrl || sub.ppt_file_url, sub.fileName || sub.pptFileName || `${sub.teamId || 'presentation'}.pptx`, sub.teamId || sub.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-blue-50 text-[#1B3F8B] hover:bg-blue-100 transition border border-blue-200 shadow-2xs cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" /> Download PPT
                              </button>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {sub.demoVideoUrl ? (
                                <a
                                  href={sub.demoVideoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-red-50 text-red-600 hover:underline border border-red-200"
                                >
                                  <Play className="h-3 w-3 fill-red-600" /> Watch Video
                                </a>
                              ) : (
                                <span className="text-slate-400 font-medium">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {sub.githubRepoUrl ? (
                                <a
                                  href={sub.githubRepoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-900 hover:underline border border-slate-200"
                                >
                                  <GitBranch className="h-3 w-3 text-slate-700" /> GitHub Repo
                                </a>
                              ) : (
                                <span className="text-slate-400 font-medium">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={async () => {
                                  if (!confirm(`Are you sure you want to delete PPT submission from Team ${sub.teamId}? This will unlock their Team Portal so they can re-submit.`)) return;
                                  setDeletingPptId(sub.id);
                                  try {
                                    await api.deletePptSubmission(sub.id);
                                    setPptSubmissions(prev => prev.filter(s => s.id !== sub.id));
                                    showAlert('Submission Reset', `PPT submission for Team ${sub.teamId} has been deleted. Team Portal unlocked for re-submission.`, 'info');
                                    await loadAdminData();
                                  } catch (e: any) {
                                    showAlert('Error', e.message || 'Could not delete submission.');
                                  } finally {
                                    setDeletingPptId(null);
                                  }
                                }}
                                disabled={deletingPptId === sub.id}
                                className="px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 transition border border-red-200 hover:border-red-300 font-extrabold text-[11px] disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                                title="Delete submission and unlock team portal for re-submission"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete &amp; Allow Re-Submission
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PROBLEM STATEMENTS CRUD PANEL */}
          {sidebarTab === 'problem-statements' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Problem Statement Manager
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Create, edit, close, and delete institute-level problem statements for student selection.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={async () => {
                      const SIH_2026_OFFICIAL_PS = [
                        { id: 'SIH26001', title: 'AI-Based Early Warning and Landslide Risk Monitoring System in NER', category: 'Software', theme: 'Disaster Management', org: 'Ministry of Development of North Eastern Region (MDoNER)' },
                        { id: 'SIH26002', title: 'AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (NER)', category: 'Software', theme: 'Transportation & Logistics', org: 'Ministry of Development of North Eastern Region (MDoNER)' },
                        { id: 'SIH26003', title: 'AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in NER', category: 'Software', theme: 'MedTech/HealthTech/BioTech', org: 'Ministry of Development of North Eastern Region (MDoNER)' },
                        { id: 'SIH26004', title: 'AI-Assisted Early Detection System for Osteoarthritis (OA) Risk Markers in NER', category: 'Software', theme: 'MedTech/HealthTech/BioTech', org: 'Ministry of Development of North Eastern Region (MDoNER)' },
                        { id: 'SIH26005', title: 'Solar-Powered Smart Mini Cold Storage System for Fresh Vegetables in NER', category: 'Hardware', theme: 'Agriculture, FoodTech & Rural Development', org: 'Ministry of Development of North Eastern Region (MDoNER)' },
                        { id: 'SIH26006', title: 'Development of an Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement', category: 'Software', theme: 'Transportation & Logistics', org: 'Ministry of Ports, Shipping & Waterways' },
                        { id: 'SIH26007', title: 'Safe and Efficient Operation of Mine Vehicles in Fog and Low-Visibility Conditions in Open Cast Iron Ore Mines', category: 'Software', theme: 'Smart Vehicles', org: 'Ministry of Steel' },
                        { id: 'SIH26008', title: 'Belt Joint Rupture and Conveyor Belt Damages in Iron Ore Mining Industry: Intelligent Monitoring and Prediction', category: 'Software', theme: 'Smart Automation', org: 'Ministry of Steel' },
                        { id: 'SIH26009', title: 'Using AI/ML and Space Technology to Identify Manganese Reserves and Overcome Production Shortfalls', category: 'Software', theme: 'Space Technology', org: 'Ministry of Steel' },
                        { id: 'SIH26010', title: 'Survey/Resurvey of Rural Agricultural Land in India using AI/ML', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Rural Development' },
                        { id: 'SIH26011', title: '3D ULPIN Generation and Vertical Property Mapping System', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Rural Development' },
                        { id: 'SIH26012', title: 'AI-Based Automated Urban Parcel Mapping and Cadastral Feature Extraction System using Drone Imagery', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Rural Development' },
                        { id: 'SIH26013', title: 'Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Rural Development' },
                        { id: 'SIH26014', title: 'An Integrated GIS-based Digital Public Infrastructure for Land Governance', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Rural Development' },
                        { id: 'SIH26015', title: 'Real-Time National Land Acquisition & Management System for End-to-End Digital Monitoring and Decision Support', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Rural Development' },
                        { id: 'SIH26016', title: 'Predictive Analytics System for Early Detection of Land Acquisition Delays', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Rural Development' },
                        { id: 'SIH26017', title: 'Intelligent Land Record Digitization and Validation System', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Rural Development' },
                        { id: 'SIH26018', title: 'Design and Development of Innovative Hand-Spinning Equipment for Enhancing Khadi Artisan Productivity', category: 'Hardware', theme: 'Heritage and Culture', org: 'KVIC' },
                        { id: 'SIH26019', title: 'Honey Chain: A Blockchain-Based System for Honey Traceability and Smart Beekeeping Management', category: 'Software', theme: 'Blockchain & Cybersecurity', org: 'KVIC' },
                        { id: 'SIH26020', title: 'Design and Develop a Smart Solar-Powered Drying and Compact Packaging System for Home-Based Agarbatti Manufacturing', category: 'Hardware', theme: 'Agriculture, FoodTech & Rural Development', org: 'KVIC' },
                        { id: 'SIH26021', title: 'AI-Powered Geological, Mining and other Reporting Solution for CMPDI/CIL Subsidiaries', category: 'Software', theme: 'Smart Automation', org: 'Ministry of Coal' },
                        { id: 'SIH26022', title: 'AI-Based Smart Governance and Compliance Monitoring System for Coal Mines', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Coal' },
                        { id: 'SIH26023', title: 'Development of AI-Enabled Low Cost Real-Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines', category: 'Software', theme: 'Disaster Management', org: 'Ministry of Coal' },
                        { id: 'SIH26024', title: 'Development of Mobile (Quadruped)/Handheld Device/System for Real-Time Detection of Narcotics and Explosives across Indian Railways', category: 'Hardware', theme: 'Robotics and Drones', org: 'Ministry of Railways' },
                        { id: 'SIH26025', title: 'AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways', category: 'Software', theme: 'Transportation & Logistics', org: 'Ministry of Railways' },
                        { id: 'SIH26026', title: 'Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains', category: 'Software', theme: 'Transportation & Logistics', org: 'Ministry of Railways' },
                        { id: 'SIH26027', title: 'Automated High-Current Short-Circuit Test System for IEC 60898-1:2015 MCB Compliance', category: 'Hardware', theme: 'Smart Automation', org: 'BIS' },
                        { id: 'SIH26028', title: 'Automated Cable Specimen Preparation System for IS 10810 and IS 7098 Compliance', category: 'Hardware', theme: 'Smart Automation', org: 'BIS' },
                        { id: 'SIH26029', title: 'Quality Assessment and Grading of Onions using AI/ML for Standardized Procurement', category: 'Software', theme: 'Agriculture, FoodTech & Rural Development', org: 'NAFED' },
                        { id: 'SIH26030', title: 'Farmers Smart Procurement Information System with Real-Time Updates and Status Tracking', category: 'Software', theme: 'Agriculture, FoodTech & Rural Development', org: 'NAFED' },
                        { id: 'SIH26031', title: 'Multi-Intermediary Reduction Platform for Direct Farmer Market Linkage and Price Discovery', category: 'Software', theme: 'Agriculture, FoodTech & Rural Development', org: 'NAFED' },
                        { id: 'SIH26032', title: 'Software System to Check Compliance of Packaged Commodities under Legal Metrology Rules 2011', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Consumer Affairs' },
                        { id: 'SIH26033', title: 'Development of a Software Program for Generation of Test Reports for Non-Automatic Weighing Instruments (NAWI) as per OIML R-76', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Consumer Affairs' },
                        { id: 'SIH26034', title: 'Development of an Online Verification System for Weighing and Measuring Instruments', category: 'Software', theme: 'Smart Governance', org: 'Ministry of Consumer Affairs' },
                        { id: 'SIH26035', title: 'Adaptive Path Planning and Collision Avoidance for Autonomous Vehicles on Unstructured Indian Roads', category: 'Software', theme: 'Smart Vehicles', org: 'MoRTH' },
                        { id: 'SIH26036', title: 'Explainable AI for Diabetic Retinopathy Screening in Rural India', category: 'Software', theme: 'MedTech/HealthTech/BioTech', org: 'Ministry of Health' },
                        { id: 'SIH26037', title: 'AI-Powered Underground Mine Safety, Monitoring and Rescue System', category: 'Hardware', theme: 'Disaster Management', org: 'Ministry of Mines' },
                        { id: 'SIH26038', title: 'Smart Water Purification and Quality Monitoring System for Rural and Mining-Affected Areas', category: 'Hardware', theme: 'Clean & Green Tech', org: 'Ministry of Mines' },
                        { id: 'SIH26039', title: 'AR-Based Vocational Training Simulator for Industrial Safety in Mining & Manufacturing Sector', category: 'Software', theme: 'Smart Education', org: 'Government of Jharkhand' },
                        { id: 'SIH26040', title: 'AI-Powered Vernacular Pedagogy and Real-Time Translation Tool for Mother Tongue-Based Primary Education', category: 'Software', theme: 'Smart Education', org: 'Ministry of Education' },
                        { id: 'SIH26041', title: 'A Digital Platform to Crowdsource Societal Challenges and Facilitate Collaborative Problem Solving through Universities and Industry', category: 'Software', theme: 'Smart Education', org: 'Ministry of Education' },
                        { id: 'SIH26042', title: 'Portal for Academia-Industry Collaboration for Skill Mapping, Internships and Placement', category: 'Software', theme: 'Smart Education', org: 'Ministry of Education' },
                        { id: 'SIH26043', title: 'IP-SAKTI: Multilingual RAG-Based AI Assistant for Intellectual Property and Regulatory Guidance in Ayurveda', category: 'Software', theme: 'MedTech/HealthTech/BioTech', org: 'AIIA' },
                        { id: 'SIH26044', title: 'AIIA Clinical Trials Dashboard: GCP-Compliant Clinical Trial Management System for Ayurveda Research', category: 'Software', theme: 'MedTech/HealthTech/BioTech', org: 'AIIA' },
                        { id: 'SIH26045', title: 'Modifications to Improve Reliability of Electrical Equipment in Subzero Temperature Conditions of High Altitude Areas of Ladakh', category: 'Hardware', theme: 'Smart Automation', org: 'Government of Ladakh' },
                        { id: 'SIH26046', title: 'High Altitude Performance Optimization and Robust Design of Anti-Drone System', category: 'Hardware', theme: 'Robotics and Drones', org: 'Government of Ladakh' },
                        { id: 'SIH26047', title: 'AI/ML-Enabled Adaptive Noise Cancellation (ANC) System for Defence Noise Suppression with Real-Time Performance', category: 'Hardware', theme: 'Smart Automation', org: 'DRDO' },
                        { id: 'SIH26048', title: 'Adaptive Variable Resolution 2.5D Lidar Mapping for Dynamic Environment Perception', category: 'Hardware', theme: 'Robotics and Drones', org: 'DRDO' },
                        { id: 'SIH26049', title: 'AI-Enabled Real-Time Digital Twin System for Health Monitoring and Fault Prediction of Aero Piston Engines in MALE UAVs', category: 'Software', theme: 'Robotics and Drones', org: 'DRDO' },
                        { id: 'SIH26050', title: 'Smart Scan Strategy for Electronic Warfare', category: 'Software', theme: 'Miscellaneous', org: 'DRDO' },
                      ];

                      if (!confirm(`This will import ${SIH_2026_OFFICIAL_PS.length} official SIH 2026 Problem Statements from the government website. Existing IDs will be skipped. Continue?`)) return;

                      let added = 0; let skipped = 0;
                      for (const ps of SIH_2026_OFFICIAL_PS) {
                        const exists = adminPsList.some(p => p.id === ps.id);
                        if (exists) { skipped++; continue; }
                        try {
                          await api.createProblemStatement({ ...ps, status: 'open', description: `Organization: ${(ps as any).org || 'Government of India'}. Theme: ${ps.theme}. PS Number: ${ps.id}. Source: https://sih.gov.in/sih2026PS` });
                          added++;
                        } catch { skipped++; }
                      }
                      await loadAdminData();
                      showAlert('Import Complete', `✅ ${added} SIH 2026 official PS imported successfully. ${skipped} skipped (already exist or error).`, 'success');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-[#1B3F8B] bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-xs transition cursor-pointer shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    Import Official SIH 2026 PS (SIH26001–SIH26050)
                  </button>

                  <button
                    onClick={() => {
                      setEditingPsData({ id: '', title: '', category: 'Software', description: '', status: 'open' });
                      setIsCreatingPs(true);
                      setIsEditingPs(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-[#C1272D] hover:bg-red-700 shadow-md transition cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    Add Problem Statement
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (adminPsList.length === 0) {
                        showAlert('Nothing to Remove', 'There are no problem statements to delete.', 'info');
                        return;
                      }
                      if (!confirm(`⚠️ Are you sure you want to DELETE ALL ${adminPsList.length} problem statements? This cannot be undone.`)) return;
                      if (!confirm(`Final confirmation: This will permanently remove all ${adminPsList.length} PS entries. Proceed?`)) return;
                      let removed = 0;
                      for (const ps of [...adminPsList]) {
                        try { await api.deleteProblemStatement(ps.id); removed++; } catch { /* skip */ }
                      }
                      await loadAdminData();
                      showAlert('All PS Removed', `✅ ${removed} problem statements have been permanently deleted.`, 'info');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 shadow-xs transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove All PS
                  </button>
                </div>
              </div>

              {/* Problem Statement List table */}
              {isLoadingPs ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : adminPsList.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold text-slate-700">No Problem Statements found.</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-xs border-collapse min-w-[800px]">
                      <thead className="bg-slate-50/90 border-b border-slate-200/80">
                        <tr className="text-left font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          <th className="py-3.5 px-4 bg-slate-50/90">ID</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">Title</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">Category</th>
                          <th className="py-3.5 px-4 bg-slate-50/90">Status</th>
                          <th className="py-3.5 px-4 bg-slate-50/90 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {adminPsList.map((ps) => (
                          <tr key={ps.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#1B3F8B] whitespace-nowrap">{ps.id}</td>
                            <td className="py-3.5 px-4 font-black text-slate-900">{ps.title}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">{ps.category}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase ${ps.status === 'open'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                {ps.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setEditingPsData(ps);
                                  setIsEditingPs(true);
                                  setIsCreatingPs(false);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition inline-block cursor-pointer border border-transparent hover:border-blue-100"
                                title="Edit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePs(ps.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition inline-block cursor-pointer border border-transparent hover:border-red-100"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODAL: CREATE / EDIT PROBLEM STATEMENT */}
              {(isCreatingPs || isEditingPs) && editingPsData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
                  <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-150">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C1272D]" />

                    <div className="p-6 flex items-center justify-between border-b border-slate-100">
                      <h3 className="text-base font-black text-slate-950">
                        {isCreatingPs ? 'Add New Problem Statement' : 'Edit Problem Statement'}
                      </h3>
                      <button
                        onClick={() => {
                          setIsCreatingPs(false);
                          setIsEditingPs(false);
                          setEditingPsData(null);
                        }}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={isCreatingPs ? handleCreatePs : handleUpdatePs} className="p-6 space-y-4 text-xs font-bold text-slate-700">
                      <div className="space-y-1.5">
                        <label className="block">Problem Statement ID <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          disabled={isEditingPs}
                          placeholder="e.g. VSITR-PS07"
                          value={editingPsData.id || ''}
                          onChange={(e) => setEditingPsData({ ...editingPsData, id: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] disabled:opacity-50 text-slate-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block">Problem Statement Title <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Smart Traffic Management System"
                          value={editingPsData.title || ''}
                          onChange={(e) => setEditingPsData({ ...editingPsData, title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] text-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block">Category <span className="text-red-500">*</span></label>
                          <select
                            value={editingPsData.category || 'Software'}
                            onChange={(e) => setEditingPsData({ ...editingPsData, category: e.target.value as any })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] bg-white text-slate-900"
                          >
                            <option value="Software">Software</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Both">Both</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block">Status <span className="text-red-500">*</span></label>
                          <select
                            value={editingPsData.status || 'open'}
                            onChange={(e) => setEditingPsData({ ...editingPsData, status: e.target.value as any })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] bg-white text-slate-900"
                          >
                            <option value="open">Open (Available)</option>
                            <option value="closed">Closed (Unavailable)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block">Description</label>
                        <textarea
                          placeholder="Provide brief problem details, scope, or technology stack..."
                          rows={4}
                          value={editingPsData.description || ''}
                          onChange={(e) => setEditingPsData({ ...editingPsData, description: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] resize-none text-slate-900"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-3 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingPs(false);
                            setIsEditingPs(false);
                            setEditingPsData(null);
                          }}
                          className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#C1272D] hover:bg-red-700 transition cursor-pointer"
                        >
                          {isCreatingPs ? 'Create' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EMAIL DISPATCH NOTIFICATIONS & NEON DATABASE LOGS */}
          {sidebarTab === 'emails' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Mail className="h-6 w-6 text-[#1B3F8B]" />
                    Email Dispatch &amp; Database Hub
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Monitor automated team member registration notifications and trigger deadline edit emails.
                  </p>
                </div>

                <button
                  onClick={handleTriggerDeadlineReminders}
                  disabled={isSendingDeadlineReminders}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-amber-600 shadow-md hover:opacity-95 transition disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isSendingDeadlineReminders ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dispatching Emails...
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="h-4 w-4" />
                      Send Registration Deadline Edit Reminder to Team Leaders
                    </>
                  )}
                </button>
              </div>

              {/* Database & System Architecture Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Neon Database Status */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Database Status &amp; Sync
                        </h3>
                        <span className={`text-xs font-bold ${isNeonConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isNeonConnected ? 'Neon PostgreSQL Connected' : 'Local JSON Fallback Active'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSyncDb}
                      disabled={isSyncingDb}
                      className="px-3.5 py-2 rounded-xl font-extrabold text-[11px] text-white bg-[#1B3F8B] hover:bg-blue-900 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                      {isSyncingDb ? 'Syncing...' : 'Sync to Neon DB'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isNeonConnected
                      ? 'All team registrations, members, mentors, and email dispatch audit logs are synchronized in Neon PostgreSQL.'
                      : 'Using file DB fallback. Click "Sync to Neon DB" to initialize and populate all Neon PostgreSQL tables.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Tables: teams, members, mentors, email_logs</span>
                    <span className="font-bold text-slate-700">{teams.length} Teams Saved</span>
                  </div>
                </div>

                {/* SMTP Server Live Tester */}
                <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-2xs space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                        SMTP Mail Server Tester
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SMTP Mail Server Configuration
                    </span>
                  </div>

                  <form onSubmit={handleTestSmtp} className="space-y-3">
                    <p className="text-xs text-slate-300">
                      Test your mail server connection and send a sample email to verify delivery:
                    </p>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-medium block">Select Test Template:</label>
                      <select
                        value={smtpTestType}
                        onChange={(e) => setSmtpTestType(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="connection">Basic Connection Test Email</option>
                        <option value="mentor_pending">Mentor Selection Pending (Case B - Reminder)</option>
                        <option value="mentor_completed">Mentor Selection Completed (Case A - Confirm)</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter recipient email..."
                        value={smtpTestEmail}
                        onChange={(e) => setSmtpTestEmail(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="submit"
                        disabled={isTestingSmtp}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <SendHorizontal className={`h-3.5 w-3.5 ${isTestingSmtp ? 'animate-spin' : ''}`} />
                        {isTestingSmtp ? 'Testing...' : 'Send Test'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Email Audit Logs Table */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Email Dispatch Audit Log ({emailLogs.length})
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Log of all automated registration confirmations and deadline reminder emails.
                    </p>
                  </div>

                  <button
                    onClick={loadAdminData}
                    disabled={isLoadingEmailLogs}
                    className="p-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingEmailLogs ? 'animate-spin text-[#C1272D]' : ''}`} />
                    Refresh Logs
                  </button>
                </div>

                {emailLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No emails logged yet. Register a team or click "Send Registration Deadline Edit Reminder" above to test automated email dispatching.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200/80 max-h-[520px] overflow-y-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10 shadow-2xs">
                        <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                          <th className="py-3 px-3 bg-slate-50">Recipient</th>
                          <th className="py-3 px-2 bg-slate-50">Team ID</th>
                          <th className="py-3 px-2 bg-slate-50">Type</th>
                          <th className="py-3 px-2 bg-slate-50">Subject</th>
                          <th className="py-3 px-2 bg-slate-50">Status</th>
                          <th className="py-3 px-2 bg-slate-50">Timestamp</th>
                          <th className="py-3 px-3 text-right bg-slate-50">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {emailLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[160px] truncate" title={`${log.recipientName} (${log.recipientEmail})`}>
                              <span className="block truncate">{log.recipientName}</span>
                              <span className="block text-[10px] font-normal text-slate-500 font-mono truncate">
                                {log.recipientEmail}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 font-mono font-bold text-[#1B3F8B] whitespace-nowrap">
                              {log.teamId || 'N/A'}
                            </td>
                            <td className="py-2.5 px-2 whitespace-nowrap">
                              {(() => {
                                const isPsSelection = log.type === 'ps_selection' || (log.subject && log.subject.toLowerCase().includes('problem statement selection'));
                                const isRegistration = log.type === 'registration_confirmation' && !isPsSelection;

                                return (
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    isPsSelection
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : isRegistration
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {isPsSelection ? 'PS Selection Completion' : isRegistration ? 'Member Confirmation' : 'Deadline Edit Reminder'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 px-2 text-slate-800 font-semibold max-w-[160px] truncate" title={log.subject}>
                              {log.subject}
                            </td>
                            <td className="py-2.5 px-2 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${log.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'simulated'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                {log.status === 'simulated' ? 'Simulated' : log.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-[10px] text-slate-500 whitespace-nowrap">
                              {new Date(log.sentAt).toLocaleString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleResendEmail(log.id)}
                                  disabled={resendingEmailId === log.id}
                                  className="px-2 py-1 rounded-lg bg-[#1B3F8B] hover:bg-blue-900 text-white font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                                  title="Resend email to recipient"
                                >
                                  <SendHorizontal className={`h-2.5 w-2.5 ${resendingEmailId === log.id ? 'animate-spin' : ''}`} />
                                  {resendingEmailId === log.id ? 'Sending...' : 'Resend'}
                                </button>
                                <button
                                  onClick={() => setSelectedEmailLog(log)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                                >
                                  View Body
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>

            </div>
          )}

          {/* TAB: TEAM LOOKUP */}
          {sidebarTab === 'team-lookup' && (
            <TeamLookupTab />
          )}

          {/* TAB: MENTOR LOOKUP */}
          {sidebarTab === 'mentor-lookup' && (
            <MentorLookupTab />
          )}

          {/* TAB: EDIT REQUESTS */}
          {sidebarTab === 'edit-requests' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leader Edit Requests</h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">Change requests submitted by team leaders for their own details. Approve to apply, Reject to dismiss.</p>
                </div>
                <button
                  onClick={loadEditRequests}
                  disabled={isLoadingEditRequests}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingEditRequests ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {isLoadingEditRequests ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#C1272D]" />
                  <span className="ml-3 text-sm font-bold text-slate-500">Loading requests…</span>
                </div>
              ) : leaderEditRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-200">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                  <p className="text-sm font-black text-slate-700">No edit requests yet</p>
                  <p className="text-xs text-slate-400 mt-1">When team leaders request leader field changes, they'll appear here for review.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pending first */}
                  {['pending', 'approved', 'rejected'].map((statusGroup) => {
                    const grouped = leaderEditRequests.filter(r => r.status === statusGroup);
                    if (grouped.length === 0) return null;
                    return (
                      <div key={statusGroup}>
                        <h3 className={`text-[10px] font-extrabold uppercase tracking-widest mb-2 px-1 ${
                          statusGroup === 'pending' ? 'text-amber-600' :
                          statusGroup === 'approved' ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {statusGroup === 'pending' ? `⏳ Pending (${grouped.length})` :
                           statusGroup === 'approved' ? `✅ Approved (${grouped.length})` :
                           `❌ Rejected (${grouped.length})`}
                        </h3>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[900px]">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                                  {['Team', 'Leader', 'Field', 'Old Value', 'New Value', 'Reason', 'Requested At', statusGroup === 'pending' ? 'Actions' : 'Status'].map(h => (
                                    <th key={h} className="py-3 px-4 text-left whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {grouped.map((req) => (
                                  <tr key={req.id} className={`hover:bg-slate-50 transition ${
                                    req.status === 'approved' ? 'bg-emerald-50/30' :
                                    req.status === 'rejected' ? 'bg-slate-50/50 opacity-70' : ''
                                  }`}>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                      <span className="font-black text-[#C1272D] font-mono text-[10px]">{req.teamId}</span>
                                      {req.teamName && <span className="text-slate-500 block text-[10px] truncate max-w-[100px]">{req.teamName}</span>}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">{req.leaderName || '—'}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                      <span className="px-2 py-0.5 rounded-full bg-[#1B3F8B]/10 text-[#1B3F8B] text-[10px] font-extrabold">{req.fieldName}</span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 max-w-[140px]">
                                      <span className="line-clamp-2 text-[11px]">{req.oldValue || <em>empty</em>}</span>
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-900 max-w-[140px]">
                                      <span className="line-clamp-2 text-[11px]">{req.newValue}</span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 max-w-[180px]">
                                      <span className="line-clamp-2 text-[11px]">{req.reason}</span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[10px]">
                                      {new Date(req.requestedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                      {req.status === 'pending' ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            disabled={reviewingRequestId === req.id}
                                            onClick={() => handleReviewRequest(req.id, 'approved')}
                                            className="px-3 py-1 rounded-xl font-black text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                          >
                                            <Check className="h-3 w-3" /> Approve
                                          </button>
                                          <button
                                            disabled={reviewingRequestId === req.id}
                                            onClick={() => handleReviewRequest(req.id, 'rejected')}
                                            className="px-3 py-1 rounded-xl font-black text-[10px] bg-slate-200 text-slate-700 hover:bg-red-100 hover:text-red-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                          >
                                            <X className="h-3 w-3" /> Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                          {req.status}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
        {/* FOOTER BAR INSIDE DASHBOARD */}
        <div className="pt-6 mt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium gap-2">
          <span>VSITR Internal SIH 2026 Control Center</span>
          <span>Research, Coding, Design &amp; Soft Skills Clubs</span>
        </div>

      </div>

      {/* INSPECT TEAM MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 pr-8">
              <span className="px-3 py-1 rounded-full font-mono font-bold bg-[#1B3F8B] text-white text-xs">
                {selectedTeam.id}
              </span>
              <h2 className="text-lg font-black text-slate-900 truncate">
                "{selectedTeam.teamName}"
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border text-xs space-y-1">
              <span className="font-bold text-slate-900 block">Leader: {selectedTeam.leader.fullName}</span>
              <p className="text-slate-600">Email: {selectedTeam.leader.email} | Phone: {selectedTeam.leader.mobile}</p>
              <p className="text-slate-600 font-mono">Enrolment: {selectedTeam.leader.enrollmentNo}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                6 Team Members
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[selectedTeam.leader, ...selectedTeam.members].map((m, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-100/80 border text-slate-800 space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span className="truncate mr-2">{m.fullName} {m.isLeader ? '(Leader)' : ''}</span>
                      <span className="text-[#1B3F8B] whitespace-nowrap">{m.department} • Sem {m.semester}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">Enr: {m.enrollmentNo} | {m.gender}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedTeam.mentor ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                <span className="font-bold block">Faculty Mentor:</span>
                <p>{selectedTeam.mentor.prefix} {selectedTeam.mentor.fullName} ({selectedTeam.mentor.department})</p>
                <p>Phone: {selectedTeam.mentor.contactNumber} | Email: {selectedTeam.mentor.email}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold">
                ⚠ Mentor details pending submission (Phase 2)
              </div>
            )}

            {/* Problem Statement Details */}
            {selectedTeam.selectedPsId ? (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#1B3F8B]" />
                  <span className="font-black text-slate-900 uppercase tracking-wider text-[10px]">Problem Statement Selected</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">PSID</p>
                    <p className="font-black text-[#1B3F8B] font-mono">{selectedTeam.selectedPsId}</p>
                  </div>
                  {selectedTeam.psSelectedAt && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Selected At</p>
                      <p className="font-semibold text-slate-700">{new Date(selectedTeam.psSelectedAt).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Title</p>
                  <p className="font-bold text-slate-800 leading-snug">{selectedTeam.selectedPsTitle || '—'}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>No Problem Statement Selected Yet</span>
              </div>
            )}

            {/* PPT & Prototype Submission Details */}
            {selectedTeam.pptSubmission ? (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-[#1B3F8B]">
                    <FileText className="h-4 w-4 text-[#1B3F8B]" />
                    <span>PPT &amp; Prototype Submission</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {new Date(selectedTeam.pptSubmission.submittedAt || Date.now()).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200 space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">PPT File</span>
                    <span className="font-bold text-slate-900 block truncate">{selectedTeam.pptSubmission.pptFileName}</span>
                    {selectedTeam.pptSubmission && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPpt(
                          selectedTeam.pptSubmission?.pptFileUrl || selectedTeam.pptSubmission?.fileUrl || (selectedTeam.pptSubmission as any)?.ppt_file_url,
                          selectedTeam.pptSubmission?.pptFileName || `${selectedTeam.id}.pptx`,
                          selectedTeam.id
                        )}
                        className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#1B3F8B] hover:underline pt-0.5 cursor-pointer"
                      >
                        <Download className="h-3 w-3" /> Download PPT
                      </button>
                    )}
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200 space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">2-Min Video Clip</span>
                    <a
                      href={selectedTeam.pptSubmission.demoVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-red-600 hover:underline flex items-center gap-1 truncate text-[11px] pt-1"
                    >
                      <Play className="h-3 w-3 fill-red-600" /> YouTube Video
                    </a>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200 space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">20% Prototype Repo</span>
                    <a
                      href={selectedTeam.pptSubmission.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-slate-900 hover:underline flex items-center gap-1 truncate text-[11px] pt-1"
                    >
                      <GitBranch className="h-3 w-3 text-slate-700" /> GitHub Repo
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>PPT &amp; Prototype presentation not submitted yet</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmTeam(selectedTeam)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer"
              >
                Delete Team
              </button>
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-red-200 text-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-black">Confirm Delete Team</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete team <strong className="text-slate-900">"{deleteConfirmTeam.teamName}"</strong> ({deleteConfirmTeam.id})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setDeleteConfirmTeam(null)}
                className="px-4 py-2 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTeam(deleteConfirmTeam.id)}
                className="px-4 py-2 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-md transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL BODY INSPECTOR MODAL */}
      {selectedEmailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedEmailLog(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 pr-8">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${selectedEmailLog.type === 'registration_confirmation'
                  ? 'bg-blue-100 text-blue-800'
                  : selectedEmailLog.type === 'ps_selection'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                {selectedEmailLog.type === 'registration_confirmation' ? 'Member Confirmation' : selectedEmailLog.type === 'ps_selection' ? 'PS Selection Confirmed' : 'Deadline Edit Reminder'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {selectedEmailLog.id}
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                {selectedEmailLog.subject}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                To: <strong className="text-slate-800">{selectedEmailLog.recipientName}</strong> ({selectedEmailLog.recipientEmail})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-700 max-h-[400px] overflow-y-auto">
              {selectedEmailLog.body}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  if (selectedEmailLog) {
                    handleResendEmail(selectedEmailLog.id);
                  }
                }}
                disabled={resendingEmailId === selectedEmailLog.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1B3F8B] text-white hover:bg-blue-900 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <SendHorizontal className={`h-3.5 w-3.5 ${resendingEmailId === selectedEmailLog.id ? 'animate-spin' : ''}`} />
                {resendingEmailId === selectedEmailLog.id ? 'Resending Email...' : 'Resend Email Now'}
              </button>
              <button
                onClick={() => setSelectedEmailLog(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black transition cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
