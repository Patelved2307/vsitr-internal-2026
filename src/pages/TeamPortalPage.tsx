import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserCheck, ShieldCheck, UserPlus, ExternalLink, Headset, Users, GraduationCap, AlertTriangle, ArrowRight, Edit3, X, Save, Check, User, Lock, BookOpen, Clock, FileText, Upload, Video, GitBranch, CheckCircle2, FileUp, Download, Play } from 'lucide-react';
import { ProblemStatement } from '../types';

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

  // Official SIH 2026 PS Manual Entry
  const [showSihPsModal, setShowSihPsModal] = useState(false);
  const [sihPsNumber, setSihPsNumber] = useState('');
  const [sihPsTitle, setSihPsTitle] = useState('');
  const [isSubmittingSihPs, setIsSubmittingSihPs] = useState(false);

  // PPT & Prototype Submission Form State (Phase 3)
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [pptFileBase64, setPptFileBase64] = useState<string>('');
  const [demoVideoUrl, setDemoVideoUrl] = useState<string>('');
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>('');
  const [githubCollabChecked, setGithubCollabChecked] = useState<boolean>(false);
  const [isSubmittingPpt, setIsSubmittingPpt] = useState<boolean>(false);

  // Helper to handle smooth downloading of both Base64 Data URIs and regular URLs
  const handleDownloadPpt = (fileUrl?: string, fileName?: string) => {
    if (!fileUrl) {
      showAlert('No File Available', 'The PPT presentation file URL is missing or unavailable.');
      return;
    }

    try {
      if (fileUrl.startsWith('data:')) {
        // Base64 Data URI - convert to blob for instant browser download
        const parts = fileUrl.split(',');
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
        a.download = fileName || 'presentation.pptx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // Regular URL download fallback
      window.location.href = fileUrl;
    } catch (err: any) {
      console.error('Error downloading PPT file:', err);
      showAlert('Download Failed', 'Could not process the PPT file download.');
    }
  };

  useEffect(() => {
    if (team?.pptSubmission) {
      setDemoVideoUrl(team.pptSubmission.demoVideoUrl || '');
      setGithubRepoUrl(team.pptSubmission.githubRepoUrl || '');
      setGithubCollabChecked(team.pptSubmission.githubCollaboratorsAdded || false);
    }
  }, [team]);

  const handlePptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/\.(ppt|pptx)$/i.test(file.name)) {
      showAlert('Invalid File Extension', 'Please select a valid PowerPoint presentation file (.ppt or .pptx ONLY).');
      e.target.value = '';
      return;
    }

    setPptFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPptFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPptForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!team?.pptSubmission && !pptFile) {
      showAlert('PPT File Required', 'Please select and upload your PowerPoint presentation file (.ppt or .pptx).');
      return;
    }

    if (!demoVideoUrl || !/(youtube\.com|youtu\.be)/i.test(demoVideoUrl.trim())) {
      showAlert('Invalid YouTube URL', 'Please enter a valid YouTube video URL (e.g. https://youtu.be/... or https://www.youtube.com/watch?v=...).');
      return;
    }

    if (!githubRepoUrl || !/(github\.com)/i.test(githubRepoUrl.trim())) {
      showAlert('Invalid GitHub URL', 'Please enter a valid GitHub repository URL (e.g. https://github.com/username/repo).');
      return;
    }

    if (!githubCollabChecked) {
      showAlert('Collaborators Confirmation Required', 'Please check the box confirming you have added the 2 organizing committee members as collaborators to your repository.');
      return;
    }

    setIsSubmittingPpt(true);
    try {
      const res = await api.submitPpt({
        teamId: team!.id,
        leaderEmail: team!.leader.email,
        pptFileName: pptFile ? pptFile.name : (team!.pptSubmission?.pptFileName || 'presentation.pptx'),
        pptFileBase64: pptFileBase64 || undefined,
        demoVideoUrl: demoVideoUrl.trim(),
        githubRepoUrl: githubRepoUrl.trim(),
        githubCollaboratorsAdded: githubCollabChecked,
      });

      if (res.success && res.team) {
        loginTeamSession(res.team);
        showAlert('Submission Successful', 'Your PPT presentation, demo video link, and 20% prototype repository have been submitted successfully!', 'success');
      } else if (res.success) {
        await refreshTeamSession();
        showAlert('Submission Successful', 'Your PPT presentation, demo video link, and 20% prototype repository have been submitted successfully!', 'success');
      }
    } catch (err: any) {
      showAlert('Submission Error', err.message || 'Failed to submit presentation details.');
    } finally {
      setIsSubmittingPpt(false);
    }
  };

  // Problem Statement selection states
  const [psTimeLeft, setPsTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const effectivePptDeadline = settings.isPptExtended && settings.pptExtendedDeadline
    ? settings.pptExtendedDeadline
    : settings.pptSubmissionDeadline;
  const isPptOpen = (settings.pptSubmissionOpen ?? false) && !(
    effectivePptDeadline && new Date() > new Date(effectivePptDeadline)
  );

  // Countdown timer for PS Selection Deadline (controlled from Admin Panel → Event Settings)
  useEffect(() => {
    const calculatePsTimeLeft = () => {
      // Use admin-set deadline, fallback to 16 Aug 2026 11:59 PM IST
      const deadlineStr = settings.psSelectionDeadline || '2026-08-16T18:29:00.000Z';
      const psDeadline = new Date(deadlineStr).getTime();
      const nowVal = new Date().getTime();
      const difference = psDeadline - nowVal;

      if (difference <= 0) {
        setPsTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setPsTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculatePsTimeLeft();
    const timer = setInterval(calculatePsTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [settings.psSelectionDeadline]);


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
        <p className="text-sm text-slate-500 max-w-sm mt-1">
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
    if (!team) return;
    setEditLeader({ ...team.leader });
    setEditMembers(team.members.map((m: any) => ({ ...m })));
    setIsEditingMembers(true);
  };

  // Open Mentor Edit Modal
  const openEditMentor = () => {
    showAlert('Submissions Locked', 'Faculty mentor submissions and modifications are now closed.', 'info');
  };

  // Save Member Edits
  const handleSaveMembers = async (e: React.FormEvent) => {
    e.preventDefault();

    // Full name validation
    if (!editLeader.fullName?.trim()) {
      showAlert('Name Required', 'Team Leader full name cannot be empty.');
      return;
    }
    for (let i = 0; i < editMembers.length; i++) {
      if (!editMembers[i].fullName?.trim()) {
        showAlert('Name Required', `Member #${i + 1} full name cannot be empty.`);
        return;
      }
    }

    if (editLeader.mobile.trim().length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editLeader.email.trim())) {
      return;
    }
    for (const m of editMembers) {
      if (m.mobile.trim().length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
        return;
      }
    }

    const leaderEnrollmentRequired = editLeader.semester !== '1';
    if (leaderEnrollmentRequired && !editLeader.enrollmentNo?.trim()) {
      showAlert('Enrollment Number Required', 'Enrollment Number is required for the Team Leader.');
      return;
    }

    for (let i = 0; i < editMembers.length; i++) {
      const m = editMembers[i];
      const memberEnrollmentRequired = m.semester !== '1';
      if (memberEnrollmentRequired && !m.enrollmentNo?.trim()) {
        showAlert('Enrollment Number Required', `Enrollment Number is required for Member #${i + 1} (${m.fullName || 'Member'}).`);
        return;
      }
    }

    const allMembers = [editLeader, ...editMembers];
    const enrollments = allMembers
      .map((m) => m.enrollmentNo?.trim().toUpperCase())
      .filter((e) => e && e.length > 0);
    const uniqueEnrollments = new Set(enrollments);
    if (uniqueEnrollments.size !== enrollments.length) {
      showAlert('Duplicate Enrollment Number', 'An enrollment number has been entered more than once in your team.');
      return;
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
    <div className="py-8 px-4 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* 5.1 TEAM ID SUMMARY BANNER */}
      <div className="relative p-6 sm:p-10 rounded-3xl bg-slate-950 text-white overflow-hidden shadow-2xl border border-slate-800/80">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-60"
          style={{ backgroundImage: 'url("/tech_banner_bg.png")' }}
        />

        {/* Dark overlay backdrop to shield the text and maximize contrast */}
        <div className="absolute inset-0 z-0 bg-slate-950/70 rounded-3xl pointer-events-none" />

        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-mono font-black bg-slate-900/90 text-slate-200 border border-slate-700/80">
                {team.id}
              </span>
              
              {isPendingMentor ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Pending Mentor Details
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-450" />
                  Registration Completed
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Team "{team.teamName}"
            </h1>

            <p className="text-sm text-slate-400">
              Registered on: <span className="font-semibold text-slate-200">{new Date(team.createdAt).toLocaleString('en-IN')}</span>
            </p>
          </div>

          {/* Quick Action Buttons - Locked/Disabled because deadline passed */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-2 rounded-2xl text-xs font-black bg-red-500/10 text-red-450 border border-red-500/20 inline-flex items-center gap-1.5 shadow-2xs">
              <Lock className="h-3.5 w-3.5" />
              Modifications Locked
            </span>

            {/* Team Edit Window Button */}
            {settings.teamEditOpen && !(settings.teamEditCloseAt && new Date(settings.teamEditCloseAt) <= new Date()) ? (
              <button
                onClick={() => setActiveTab('team-edit')}
                className="px-3.5 py-2 rounded-2xl text-xs font-black bg-blue-500/15 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1.5 shadow-2xs hover:bg-blue-500/25 transition cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Team Members
              </button>
            ) : (
              <span className="px-3.5 py-2 rounded-2xl text-xs font-black bg-slate-500/10 text-slate-400 border border-slate-500/20 inline-flex items-center gap-1.5 shadow-2xs">
                <Lock className="h-3.5 w-3.5" />
                Edit Window Closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5.4 JOIN WHATSAPP GROUP CARD */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 border border-emerald-850/60 shadow-xl text-white hover:border-emerald-800 transition duration-300">
        {/* Background decorative glowing blur */}
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Official Communication Channel
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">
              Join Official SIH 2026 WhatsApp Group
            </h3>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              All real-time updates, screening calls, presentation schedules, and reminders will be shared here.
            </p>
          </div>

          <a
            href="https://chat.whatsapp.com/EfS0SSUc9aX4DJUhfrpD2U"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition transform active:scale-95 duration-200"
          >
            Join WhatsApp Group
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* 5.1A PROBLEM STATEMENT SELECTION SECTION */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xl space-y-4 hover:shadow-2xl/10 transition duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-50 text-[#C1272D] border border-red-100 shrink-0 mt-0.5 sm:mt-0">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Problem Statement Selection
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Institute-level problem statement selection details
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {!psTimeLeft.isExpired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 shadow-2xs whitespace-nowrap">
                <Clock className="h-3.5 w-3.5" />
                {psTimeLeft.days > 0 ? `${psTimeLeft.days}d ${psTimeLeft.hours}h left` : `${psTimeLeft.hours}h ${psTimeLeft.minutes}m left`}
              </span>
            )}
            {psTimeLeft.isExpired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 shadow-2xs whitespace-nowrap">
                <Lock className="h-3.5 w-3.5" />
                Selection Closed
              </span>
            )}
          </div>
        </div>

        {/* Selection Status or Selection Form */}
        {team.selectedPsId ? (
          /* Selection is already made - show full details, no change button */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Selected PS Details Card */}
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/10 border-b border-emerald-200">
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-emerald-300 text-emerald-600 shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-emerald-700 tracking-wider">Problem Statement Selected</p>
                  <p className="text-sm font-bold text-emerald-800">Your selection has been locked.</p>
                </div>
              </div>

              {/* Full PS Details */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black font-mono text-[#1B3F8B] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                    PSID: {team.selectedPsId}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Title</p>
                  <p className="text-sm font-black text-slate-900 leading-snug">{team.selectedPsTitle}</p>
                </div>
                {team.psSelectedAt && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Selected On</p>
                    <p className="text-sm font-semibold text-slate-700">{new Date(team.psSelectedAt).toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation note */}
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <p className="text-slate-600 font-semibold leading-relaxed">
                📢 Confirmation email sent to <strong className="text-slate-800">{team.leader.email}</strong> and all registered members.
              </p>
            </div>
          </div>
        ) : (
          /* Selection is NOT made */
          <div className="space-y-4 animate-in fade-in duration-200">
            {!psTimeLeft.isExpired ? (
              <>
                {/* Option 1: Institute PS */}
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-[#1B3F8B] text-white shrink-0">
                        <BookOpen className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-black text-[#1B3F8B] uppercase tracking-wider">Option 1 — Institute Problem Statements</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-7">
                      Select from problem statements curated by VSITR organizers for Internal SIH 2026.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('problem-statements');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white bg-[#1B3F8B] hover:bg-indigo-900 transition transform active:scale-95 duration-200 cursor-pointer"
                  >
                    Browse Institute PS
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Option 2: Official SIH 2026 PS */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Option 2 — Official SIH 2026 PS (226 Problems)</span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-7">
                        Browse all 226 official problem statements on sih.gov.in, then enter your selected PS Number and Title below.
                      </p>
                    </div>
                    <a
                      href="https://www.sih.gov.in/sih2026PS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white bg-amber-500 hover:bg-amber-600 transition transform active:scale-95 duration-200"
                    >
                      Browse SIH 2026 PS
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Manual Entry Form */}
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-[11px] font-bold text-amber-700 mb-3">After selecting on the official website, enter your PS details here:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="PS Number (e.g. SIH26001)"
                        value={sihPsNumber}
                        onChange={(e) => setSihPsNumber(e.target.value.toUpperCase())}
                        className="px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 placeholder:font-normal placeholder:text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Full PS Title (copy from sih.gov.in)"
                        value={sihPsTitle}
                        onChange={(e) => setSihPsTitle(e.target.value)}
                        className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!sihPsNumber.trim() || !sihPsTitle.trim() || isSubmittingSihPs}
                      onClick={async () => {
                        if (!sihPsNumber.trim() || !sihPsTitle.trim()) return;
                        setIsSubmittingSihPs(true);
                        try {
                          await api.selectProblemStatement({ teamId: team!.id, psId: sihPsNumber.trim(), psTitle: `[SIH Official] ${sihPsTitle.trim()}` });
                          await refreshTeamSession();
                          showAlert('Problem Statement Confirmed!', `Your team has selected official SIH 2026 PS: ${sihPsNumber} — ${sihPsTitle}`, 'success');
                          setSihPsNumber('');
                          setSihPsTitle('');
                        } catch (err: any) {
                          showAlert('Error', err.message || 'Failed to save PS selection.');
                        } finally {
                          setIsSubmittingSihPs(false);
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 duration-200"
                    >
                      {isSubmittingSihPs ? (
                        <><span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirming...</>
                      ) : (
                        <><Check className="h-3.5 w-3.5" /> Confirm Official SIH PS Selection</>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-xs">
                <Lock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-black text-slate-700">Problem Statement Selection Closed</h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">The selection deadline has passed. No further selections can be made.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5.2 TEAM MEMBER DETAILS TABLE / CARDS */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xl space-y-4 hover:shadow-2xl/10 transition duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#1B3F8B] border border-blue-100 shrink-0 mt-0.5 sm:mt-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Team Composition (6 Members)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Registered student leader &amp; 5 team members
              </p>
            </div>
          </div>
          {settings.teamEditOpen && !(settings.teamEditCloseAt && new Date(settings.teamEditCloseAt) <= new Date()) ? (
            <button
              onClick={() => setActiveTab('team-edit')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 shadow-2xs transition cursor-pointer self-start sm:self-auto shrink-0 whitespace-nowrap"
            >
              <Edit3 className="h-4 w-4" />
              Edit Details
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 shadow-2xs self-start sm:self-auto shrink-0 whitespace-nowrap">
              <Lock className="h-3.5 w-3.5" />
              Locked
            </span>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/85 text-slate-500 uppercase font-black tracking-wider border-b border-slate-200/80">
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4">Enrollment No</th>
                <th className="py-3.5 px-4">Dept</th>
                <th className="py-3.5 px-4">Sem</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {allMembers.map((m, idx) => (
                <tr 
                  key={idx} 
                  className={`transition duration-150 ${
                    m.isLeader 
                      ? 'bg-blue-50/40 font-bold border-l-4 border-l-[#1B3F8B]' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    {m.isLeader ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#1B3F8B] text-white">
                        TEAM LEADER
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-500">
                        MEMBER #{idx + 1}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">{m.fullName}</td>
                  <td className="py-3.5 px-4">
                    <span className={m.gender === 'Female' ? 'text-purple-700 font-bold' : ''}>
                      {m.gender}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{m.enrollmentNo}</td>
                  <td className="py-3.5 px-4 font-bold text-[#1B3F8B]">{m.department}</td>
                  <td className="py-3.5 px-4">Sem {m.semester}</td>
                  <td className="py-3.5 px-4 font-mono">{m.mobile}</td>
                  <td className="py-3.5 px-4">{m.email}</td>
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
              className={`p-4 rounded-2xl border text-xs space-y-2 transition duration-200 ${
                m.isLeader 
                  ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/30 border-blue-200 border-l-4 border-l-[#1B3F8B] shadow-sm shadow-blue-100/50' 
                  : 'bg-white hover:bg-slate-50/50 border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                  m.isLeader ? 'bg-[#1B3F8B] text-white' : 'bg-slate-200 text-slate-600'
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
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xl space-y-4 hover:shadow-2xl/10 transition duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0 mt-0.5 sm:mt-0">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Faculty Mentor Details
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Allocated faculty mentor information
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 shadow-2xs self-start sm:self-auto shrink-0 whitespace-nowrap">
            <Lock className="h-3.5 w-3.5" />
            Locked
          </span>
        </div>

        {team.mentor ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/20 border border-slate-200 flex flex-col md:flex-row gap-6 items-start shadow-sm">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 shrink-0">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 w-full text-xs">
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Mentor Name</span>
                <span className="text-sm font-black text-slate-950 block mt-0.5">
                  {team.mentor.prefix} {team.mentor.fullName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Contact Number</span>
                <span className="text-sm font-mono font-black text-slate-900 block mt-0.5">
                  {team.mentor.contactNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Email Address</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  {team.mentor.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Mentor's Branch/Department &amp; Institute</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  {team.mentor.department} • {team.mentor.institute}
                </span>
              </div>

            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4 shadow-sm">
            <AlertTriangle className="h-10 w-10 text-slate-400 mx-auto" />
            <div>
              <p className="text-base font-black text-slate-800">
                Mentor Details Not Registered
              </p>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed font-semibold">
                Faculty Mentor Submissions are closed. Your team did not register a Faculty Mentor before the deadline. Please reach out to your club coordinators immediately for emergency support or allocation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RULES & REGULATIONS DOCUMENT CARD */}
      {(settings.rulesDocumentLink || settings.rulesDocumentPdfUrl) && (
        <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xl space-y-4 hover:shadow-2xl/10 transition duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-50 text-[#C1272D] border border-red-100 shrink-0 mt-0.5 sm:mt-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                  Rules &amp; Regulations
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {settings.rulesDocumentTitle || 'Official Rules & Regulations – Internal SIH 2026'}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider text-[#C1272D] bg-red-50 border border-red-100 shadow-2xs self-start sm:self-auto shrink-0 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-[#C1272D] animate-pulse" />
              Official Document
            </span>
          </div>

          {/* Body */}
          <p className="text-sm text-slate-600 font-semibold leading-relaxed">
            Review the official eligibility criteria, team composition rules, conduct policies, and
            competition phase guidelines before participating in Internal SIH 2026.
          </p>

          {/* CTA Button */}
          <div className="flex flex-wrap gap-3">
            {settings.rulesDocumentPdfUrl ? (
              <a
                href={settings.rulesDocumentPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download="SIH2026-Rules-Regulations.pdf"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#C1272D] to-red-600 hover:from-red-600 hover:to-red-500 transition shadow-md shadow-red-500/10 transform active:scale-95 duration-200"
              >
                <FileText className="h-4 w-4" />
                View / Download Rules PDF
              </a>
            ) : (
              <a
                href={settings.rulesDocumentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#C1272D] to-red-600 hover:from-red-600 hover:to-red-500 transition shadow-md shadow-red-500/10 transform active:scale-95 duration-200"
              >
                <ExternalLink className="h-4 w-4" />
                Open Official Rules Document
              </a>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-[#C1272D] bg-red-50 hover:bg-red-100 border border-red-100 transition transform active:scale-95 duration-200"
            >
              <BookOpen className="h-4 w-4" />
              View Rules Page
            </button>
          </div>
        </div>
      )}

      {/* PPT TEMPLATE & SAMPLE FILLED REFERENCE GUIDE SECTION */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xl space-y-5 hover:shadow-2xl/10 transition duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#1B3F8B] border border-blue-100 shrink-0 mt-0.5 sm:mt-0">
              <Download className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Official SIH PPT Template &amp; Sample Reference Guide
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Download presentation template and filled reference guide PDF
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#1B3F8B] font-black text-[10px] sm:text-xs uppercase tracking-wider border border-blue-100 shadow-2xs self-start sm:self-auto shrink-0 whitespace-nowrap">
            Live &amp; Available
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            📌 <strong>Note:</strong> The official SIH presentation template is live! Download the template file to prepare your presentation deck, and download our sample filled reference guide PDF to see how solution architecture diagrams, flowcharts, and content should be placed and written.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={(settings.pptTemplateLink && settings.pptTemplateLink !== '#' && !settings.pptTemplateLink.includes('drive.google')) ? settings.pptTemplateLink : '/SIH2026-IDEA-Presentation-Format.pptx'}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1B3F8B] text-white font-extrabold text-xs shadow-md hover:bg-blue-900 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download Official PPT Template (.pptx)
            </a>

            <a
              href={settings.pptReferenceLink || '/SIH-PPT-REFERANCE.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-extrabold text-xs shadow-2xs hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-[#1B3F8B]" /> Download Sample Filled Guide (PDF)
            </a>
          </div>

          {/* REFERENCE DEMO YOUTUBE VIDEO BANNER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50 via-orange-50/40 to-red-50 border border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs mt-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-white text-red-600 border border-red-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                <Play className="h-5 w-5 fill-red-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  Need Reference Guide for Recording Your 2-Minute Video Pitch?
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                  Watch our official reference guide video clip to understand how to record, structure, and pitch your 2-minute solution presentation before uploading your link.
                </p>
              </div>
            </div>

            <a
              href="https://youtu.be/Dq56dKHGbcQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 transition shadow-md shrink-0 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" /> Watch Reference Video →
            </a>
          </div>

          {/* GITHUB COLLABORATION REQUIREMENT */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/50 to-blue-50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs mt-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-white text-slate-800 border border-indigo-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                <GitBranch className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  GitHub Repository &amp; Collaboration Required for 20% Coding Submission
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                  Create your GitHub repository, upload the required 20% of your solution code, and invite the Internal SIH 2026 Organizing Committee as a collaborator. Please send the invitation to <span className="font-mono font-black text-[#1B3F8B]">sihinternalvsitr-boop</span> and ensure the repository is accessible to the committee.
                </p>
              </div>
            </div>

            <a
              href="https://github.com/sihinternalvsitr-boop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#1B3F8B] hover:bg-blue-900 transition shadow-md shrink-0 cursor-pointer"
            >
              <GitBranch className="h-4 w-4" /> View GitHub Account <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* PPT & PROTOTYPE SUBMISSION SECTION */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xl space-y-5 hover:shadow-2xl/10 transition duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#1B3F8B] border border-blue-100 shrink-0 mt-0.5 sm:mt-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Submit Your PPT &amp; Prototype
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Pitch Presentation Deck, 2-Min Demo Video Clip &amp; 20% Code Repository
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider self-start sm:self-auto shrink-0 whitespace-nowrap ${
            isPptOpen
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs'
              : 'text-slate-500 bg-slate-100 border border-slate-200 shadow-2xs'
          }`}>
            {isPptOpen ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Portal Live &amp; Open
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Locked
              </>
            )}
          </span>
        </div>

        {/* Short Summary Information & State */}
        {!isPptOpen ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-black text-slate-800">
                PPT Submission Portal Currently Locked
              </h4>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed font-medium">
                PPT submission portal will open after the registration deadline. Stay tuned.
              </p>
            </div>
            <button
              disabled
              className="px-6 py-3 rounded-xl bg-slate-200 text-slate-400 font-extrabold text-xs cursor-not-allowed shrink-0"
            >
              Submit Your PPT →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* If Already Submitted */}
            {team.pptSubmission ? (
              <div className="rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-emerald-50/90 p-5 sm:p-7 border border-emerald-200/90 shadow-md space-y-6">
                
                {/* Top Header: Title & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/60 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-emerald-500 text-white shrink-0 shadow-md">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight">
                          Presentation &amp; Prototype Submission Received
                        </h3>
                        <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-300/60">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 font-medium mt-0.5">
                        Submitted on: {new Date(team.pptSubmission.submittedAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clean Structured Grid Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* 1. PPT FILE */}
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <FileText className="h-4 w-4 text-[#1B3F8B]" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">PPT FILE DECK</span>
                      </div>
                      <p className="text-sm font-mono font-black text-slate-900 truncate" title={team.pptSubmission.pptFileName}>
                        {team.pptSubmission.pptFileName}
                      </p>
                    </div>
                    {team.pptSubmission.pptFileUrl && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPpt(team.pptSubmission?.pptFileUrl, team.pptSubmission?.pptFileName)}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-[#1B3F8B] hover:underline pt-2 border-t border-slate-100 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> Download PPT Deck
                      </button>
                    )}
                  </div>

                  {/* 2. 2-MIN VIDEO CLIP */}
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Video className="h-4 w-4 text-[#C1272D]" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">2-MIN PITCH VIDEO</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 truncate">
                        YouTube Video Pitch
                      </p>
                    </div>
                    <a
                      href={team.pptSubmission.demoVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#C1272D] hover:underline pt-2 border-t border-slate-100"
                    >
                      <Play className="h-3.5 w-3.5 fill-[#C1272D]" /> Watch YouTube Video →
                    </a>
                  </div>

                  {/* 3. 20% PROTOTYPE REPO */}
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <GitBranch className="h-4 w-4 text-slate-800" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">20% PROTOTYPE REPO</span>
                      </div>
                      <p className="text-sm font-mono font-extrabold text-slate-900 truncate">
                        GitHub Repository
                      </p>
                    </div>
                    <a
                      href={team.pptSubmission.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900 hover:underline pt-2 border-t border-slate-100"
                    >
                      <GitBranch className="h-3.5 w-3.5" /> View GitHub Repo →
                    </a>
                  </div>

                </div>
              </div>
            ) : (
              /* If Portal is Open & Not Submitted Yet */
              <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xs">
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-[#1B3F8B] font-extrabold text-[10px] uppercase tracking-wider">
                    Submission Portal Active
                  </span>
                  <h4 className="text-base font-black text-slate-900">
                    Submit Pitch Presentation &amp; Prototype
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-medium">
                    Upload your local PowerPoint presentation deck (<code className="font-mono text-[#1B3F8B] font-bold">{team.id}.ppt/.pptx</code>), 2-minute YouTube demo pitch link, and 20% prototype code repository.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('ppt-submit')}
                  className="px-8 py-3.5 rounded-xl bg-[#1B3F8B] hover:bg-blue-900 text-white font-extrabold text-xs shadow-xl transition shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  Submit Your PPT →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5.5 SUPPORT CONSOLIDATED TILE */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xl space-y-4 hover:shadow-2xl/10 transition duration-300">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-blue-50 text-[#1B3F8B]">
            <Headset className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Help &amp; Support Contacts
          </h2>
        </div>

        <p className="text-sm text-slate-600">
          Need assistance with your team registration or pitch submissions? Contact any of the club coordinators below:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {clubCoordinators.map((c, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition duration-300 text-xs space-y-3">
              <h4 className="font-extrabold text-sm text-[#1B3F8B] border-b border-slate-100 pb-1.5">{c.clubName}</h4>
              
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Faculty Coordinators</span>
                <div className="text-slate-800 font-bold space-y-0.5">
                  {c.facultyCoordinators.map((fac, fIdx) => (
                    <p key={fIdx}>{fac}</p>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Student Coordinators</span>
                <div className="text-slate-700 font-semibold space-y-0.5">
                  {c.studentCoordinators.map((stud, sIdx) => (
                    <p key={sIdx}>
                      {stud.name} <span className="text-[10px] text-slate-500 font-normal">({stud.sem})</span>
                    </p>
                  ))}
                </div>
              </div>
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
                    <label className="font-bold text-slate-700 block mb-1">
                      Enrollment Number {editLeader.semester !== '1' && <span className="text-red-600">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder={editLeader.semester === '1' ? 'Not required for Sem 1' : 'e.g. 24BEIT54026'}
                      required={editLeader.semester !== '1'}
                      value={editLeader.enrollmentNo || ''}
                      onChange={(e) => setEditLeader({ ...editLeader, enrollmentNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                    />
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
                      <label className="font-bold text-slate-700 block mb-1">
                        Enrollment No {m.semester !== '1' && <span className="text-red-600">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={m.semester === '1' ? 'Not required for Sem 1' : 'e.g. 24BEIT54026'}
                        required={m.semester !== '1'}
                        value={m.enrollmentNo || ''}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx].enrollmentNo = e.target.value;
                          setEditMembers(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1B3F8B]"
                      />
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
                  <label className="font-bold text-slate-700 block mb-1">Mentor's Branch / Department</label>
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
