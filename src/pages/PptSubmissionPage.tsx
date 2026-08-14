import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FileText,
  Upload,
  Video,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Play,
  Users,
  UserCheck,
  BookOpen,
  Check,
  Download,
  X
} from 'lucide-react';

export const PptSubmissionPage: React.FC = () => {
  const { team, isTeamLoggedIn, setActiveTab, settings, showAlert, loginTeamSession, refreshTeamSession } = useAuth();

  useEffect(() => {
    if (isTeamLoggedIn) {
      refreshTeamSession();
    }
  }, []);

  const [pptFile, setPptFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [demoVideoUrl, setDemoVideoUrl] = useState(team?.pptSubmission?.demoVideoUrl || '');
  const [githubRepoUrl, setGithubRepoUrl] = useState(team?.pptSubmission?.githubRepoUrl || '');
  const [githubCollaboratorsAdded, setGithubCollaboratorsAdded] = useState(team?.pptSubmission?.githubCollaboratorsAdded || false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = settings.pptSubmissionOpen ?? false;

  // Validate and set PPT file
  const validateAndSetFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'ppt' && ext !== 'pptx') {
      showAlert('Invalid File Format', 'Only PowerPoint files (.ppt or .pptx) are allowed. Please select a valid PPT file.');
      return false;
    }
    setPptFile(file);
    return true;
  };

  // Handle local PPT file selection via file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Clear / Remove selected file
  const handleRemoveFile = () => {
    setPptFile(null);
    const input = document.getElementById('pptFileInput') as HTMLInputElement;
    if (input) input.value = '';
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTeamLoggedIn || !team) {
      showAlert('Login Required', 'Please log in to your Team Portal first to submit your PPT.');
      setActiveTab('login');
      return;
    }

    if (!isOpen) {
      showAlert('Portal Closed', 'The PPT & Prototype submission portal is currently closed by the Admin Officer.');
      return;
    }

    if (!pptFile && !team.pptSubmission?.pptFileUrl) {
      showAlert('PPT File Required', 'Please select your team presentation PowerPoint file (.ppt or .pptx) to upload.');
      return;
    }

    if (!demoVideoUrl.trim()) {
      showAlert('Video Link Required', 'Please provide your 2-minute YouTube demo pitch video URL.');
      return;
    }

    if (!githubRepoUrl.trim()) {
      showAlert('GitHub Link Required', 'Please provide your 20% prototype GitHub repository URL.');
      return;
    }

    if (!githubCollaboratorsAdded) {
      showAlert('Collaborators Check Required', 'Please check the box confirming you have added the 2 organizing committee members as collaborators to your GitHub repository.');
      return;
    }

    try {
      setIsSubmitting(true);
      let pptFileBase64: string | undefined = undefined;
      let pptFileName = team.pptSubmission?.pptFileName || '';

      if (pptFile) {
        pptFileBase64 = await fileToBase64(pptFile);
        pptFileName = pptFile.name;
      }

      const res = await api.submitPpt({
        teamId: team.id,
        leaderEmail: team.leader.email,
        pptFileName,
        pptFileBase64,
        demoVideoUrl: demoVideoUrl.trim(),
        githubRepoUrl: githubRepoUrl.trim(),
        githubCollaboratorsAdded,
      });

      if (res.success && res.team) {
        loginTeamSession(res.team);
        showAlert(
          'Submission Successful!',
          `Your PPT presentation and prototype details for Team ${team.teamName} (${team.id}) have been submitted successfully.`,
          'success'
        );
        setActiveTab('portal');
      }
    } catch (err: any) {
      showAlert('Submission Failed', err.message || 'An error occurred while submitting your PPT.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTeamLoggedIn || !team) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Login Required</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            You must be logged into your Team Portal to access the PPT &amp; Prototype Submission form.
          </p>
          <button
            onClick={() => setActiveTab('login')}
            className="w-full py-3 rounded-xl bg-[#1B3F8B] text-white font-extrabold text-xs shadow-md hover:bg-blue-900 transition cursor-pointer"
          >
            Go to Team Login →
          </button>
        </div>
      </div>
    );
  }

  if (team?.pptSubmission?.submittedAt || team?.pptSubmission?.pptFileUrl) {
    const sub = team.pptSubmission;
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveTab('portal')}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-[#1B3F8B] transition bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Team Portal
          </button>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs uppercase tracking-wider border border-emerald-200 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Submission Verified &amp; Locked
          </span>
        </div>

        {/* VERIFIED RECEIPT CARD */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-emerald-50/90 p-6 sm:p-8 border border-emerald-200/90 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/60 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500 text-white shrink-0 shadow-md">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-emerald-950 tracking-tight">
                    Presentation &amp; Prototype Submission Received
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-300/60">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  Submitted on: {new Date(sub.submittedAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PPT FILE */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileText className="h-4 w-4 text-[#1B3F8B]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">PPT FILE DECK</span>
                </div>
                <p className="text-sm font-mono font-black text-slate-900 truncate" title={sub.pptFileName}>
                  {sub.pptFileName || 'SIH2026-Presentation.pptx'}
                </p>
              </div>
              {sub.pptFileUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (sub.pptFileUrl?.startsWith('data:')) {
                      const parts = sub.pptFileUrl.split(',');
                      const mimeMatch = parts[0].match(/:(.*?);/);
                      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                      const bstr = atob(parts[1]);
                      let n = bstr.length;
                      const u8arr = new Uint8Array(n);
                      while (n--) u8arr[n] = bstr.charCodeAt(n);
                      const blob = new Blob([u8arr], { type: mime });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = sub.pptFileName || `${team.id}_presentation.pptx`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } else {
                      window.open(sub.pptFileUrl, '_blank');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#1B3F8B] hover:underline pt-2 border-t border-slate-100 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download PPT Deck
                </button>
              )}
            </div>

            {/* VIDEO CLIP */}
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
              {sub.demoVideoUrl && (
                <a
                  href={sub.demoVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#C1272D] hover:underline pt-2 border-t border-slate-100"
                >
                  <Play className="h-3.5 w-3.5 fill-[#C1272D]" /> Watch YouTube Video →
                </a>
              )}
            </div>

            {/* GITHUB REPO */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <GitBranch className="h-4 w-4 text-slate-800" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">20% PROTOTYPE REPO</span>
                </div>
                <p className="text-sm font-extrabold text-slate-900 truncate">
                  GitHub Repository
                </p>
              </div>
              {sub.githubRepoUrl && (
                <a
                  href={sub.githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-slate-800 hover:underline pt-2 border-t border-slate-100"
                >
                  <GitBranch className="h-3.5 w-3.5" /> View GitHub Repo →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      
      {/* TOP BAR: NAVIGATION & STATUS BADGE */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => setActiveTab('portal')}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-[#1B3F8B] transition bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Team Portal
        </button>

        <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider whitespace-nowrap shadow-2xs ${
          isOpen
            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
            : 'text-red-700 bg-red-50 border border-red-200'
        }`}>
          {isOpen ? (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Submission Portal Live &amp; Open
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              Portal Closed by Admin
            </>
          )}
        </span>
      </div>

      {/* HERO BANNER SECTION (OFFICIAL NAVY BLUE THEME) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#1B3F8B] text-white p-6 sm:p-10 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md border border-white/20">
          <FileText className="h-3.5 w-3.5" /> Official Submission Portal
        </div>

        <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
          PPT Presentation &amp; Prototype Submission
        </h1>

        <p className="text-xs sm:text-sm text-blue-100/90 max-w-3xl font-medium leading-relaxed">
          Please review your team information below and upload your pitch presentation PowerPoint deck (<code className="font-mono text-amber-300 font-bold">{team.id}.ppt</code>), 2-minute YouTube demo pitch link, and 20% prototype GitHub repository details.
        </p>
      </div>

      {/* MAIN FORM CONTENT */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

        {/* SECTION 1: DIRECT MAIN CARD LAYOUT (CLEAN KEY-VALUE ROWS) */}
        <div className="rounded-3xl bg-white p-5 sm:p-8 border border-slate-200/90 shadow-lg space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#1B3F8B] border border-blue-100 shrink-0 flex items-center justify-center mt-0.5 sm:mt-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                  Team &amp; Selected Problem Statement Details
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Auto-fetched strictly from database records for team {team.id}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-black text-[11px] sm:text-xs uppercase tracking-wider border border-emerald-200 shadow-2xs self-start sm:self-auto shrink-0 whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified DB Records
            </span>
          </div>

          {/* Clean Key-Value Rows */}
          <div className="divide-y divide-slate-100 text-xs">

            {/* 1. TEAM ID */}
            <div className="py-3.5 grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] items-center gap-3">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">
                TEAM ID
              </span>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-[#1B3F8B] font-mono font-black text-sm border border-blue-200 shadow-2xs">
                  {team.id}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 shrink-0 sm:ml-auto">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Verified
              </span>
            </div>

            {/* 2. TEAM NAME */}
            <div className="py-3.5 grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] items-center gap-3">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">
                TEAM NAME
              </span>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm sm:text-base">
                  {team.teamName}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 shrink-0 sm:ml-auto">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Verified
              </span>
            </div>

            {/* 3. TEAM LEADER */}
            <div className="py-3.5 grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] items-center gap-3">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">
                TEAM LEADER
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-slate-900 text-sm">
                  {team.leader.fullName}
                </span>
                <span className="font-mono font-semibold text-slate-500 text-xs">
                  ({team.leader.email})
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 shrink-0 sm:ml-auto">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Verified
              </span>
            </div>

            {/* 4. SELECTED PROBLEM STATEMENT */}
            <div className="pt-3.5 grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] items-start gap-3">
              <span className="font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                PROBLEM STATEMENT
              </span>
              {team.selectedPsId ? (
                <>
                  <div className="flex items-start gap-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-[#1B3F8B] font-mono font-black text-xs border border-blue-200 shrink-0 mt-0.5">
                      {team.selectedPsId}
                    </span>
                    <span className="font-black text-slate-900 text-sm leading-relaxed">
                      {team.selectedPsTitle}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 shrink-0 sm:ml-auto mt-0.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Verified
                  </span>
                </>
              ) : (
                <p className="text-xs font-bold text-slate-400 italic">No Problem Statement Selected Yet</p>
              )}
            </div>

          </div>
        </div>

        {/* SECTION 2: POWERPOINT FILE UPLOAD WITH DRAG & DROP + CANCEL/REMOVE OPTION */}
        <div className="rounded-3xl bg-white p-5 sm:p-8 border border-slate-200/90 shadow-lg space-y-5">
          
          {/* Section Header */}
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#1B3F8B] border border-blue-100 shrink-0 flex items-center justify-center mt-0.5">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Upload PowerPoint Presentation Deck (.ppt / .pptx) <span className="text-[#C1272D]">*</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Upload your pitch presentation slides from your local computer
              </p>
            </div>
          </div>

          {/* MANDATORY USER REQUEST FORMAT NOTE */}
          <div className="p-4 rounded-2xl bg-amber-50 border-l-4 border-l-amber-500 border border-amber-200 shadow-2xs space-y-1">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-950 block">
                  📌 MANDATORY PPT FILE NAMING CONVENTION:
                </span>
                <p className="text-xs font-bold text-amber-900 leading-relaxed">
                  Make sure your PPT file is named with your Team ID. Example: <code className="bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md font-mono text-xs font-black border border-amber-300">{team.id}.ppt</code> (or <code className="bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md font-mono text-xs font-black border border-amber-300">{team.id}.pptx</code>).
                </p>
                <p className="text-xs text-amber-800 font-medium pt-0.5">
                  💡 <strong>Note:</strong> The official SIH PPT template is live! You can download the template and sample filled guide directly from your Team Portal or Home page.
                </p>
              </div>
            </div>
          </div>

          {/* SAMPLE FILLED PPT REFERENCE PDF DOWNLOAD BANNER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-white text-[#1B3F8B] border border-blue-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  Need Reference on How to Fill &amp; Structure Your PPT?
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                  Download our official sample filled reference PPT guide (PDF format) to see how solution architecture, flowcharts, diagrams, and content should be placed and written.
                </p>
              </div>
            </div>

            <a
              href={settings.pptReferenceLink || '/SIH-PPT-REFERANCE.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#1B3F8B] hover:bg-blue-900 transition shadow-md shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download Sample Guide (PDF) →
            </a>
          </div>

          {/* Interactive Drag & Drop Upload Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all duration-200 text-center space-y-3 relative ${
              isDragging
                ? 'border-[#1B3F8B] bg-blue-100/60 scale-[1.01] ring-4 ring-blue-200/60 shadow-lg'
                : 'border-[#1B3F8B]/30 bg-blue-50/20 hover:bg-blue-50/40'
            }`}
          >
            <input
              type="file"
              id="pptFileInput"
              accept=".ppt, .pptx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="pptFileInput" className="cursor-pointer space-y-2 block">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border transition-all duration-200 ${
                isDragging ? 'bg-[#1B3F8B] text-white border-[#1B3F8B] scale-110' : 'bg-blue-50 text-[#1B3F8B] border-blue-100'
              }`}>
                <Upload className="h-7 w-7" />
              </div>
              <div>
                <span className="font-black text-[#1B3F8B] text-sm sm:text-base hover:underline block truncate max-w-md mx-auto">
                  {pptFile 
                    ? pptFile.name 
                    : (team.pptSubmission?.pptFileName 
                        ? `Current File: ${team.pptSubmission.pptFileName} (Click or Drag to replace)` 
                        : 'Drag & Drop your PPT file here, or click to browse')}
                </span>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Accepted Formats: <strong className="text-slate-700">.ppt</strong> or <strong className="text-slate-700">.pptx</strong> (Max 50MB)
                </p>
              </div>
            </label>

            {/* SELECTED FILE BADGE + REMOVE BUTTON */}
            {pptFile && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Selected: <strong>{pptFile.name}</strong> ({(pptFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black border border-red-200 transition shadow-2xs cursor-pointer"
                  title="Remove selected file"
                >
                  <X className="h-4 w-4 text-red-600" />
                  Remove / Select Another
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: 2-MIN YOUTUBE VIDEO DEMO + REFERENCE VIDEO BANNER */}
        <div className="rounded-3xl bg-white p-5 sm:p-8 border border-slate-200/90 shadow-lg space-y-5">
          
          {/* Section Header */}
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="h-9 w-9 rounded-xl bg-red-50 text-[#C1272D] border border-red-100 shrink-0 flex items-center justify-center mt-0.5">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                2-Minute Pitch Video Clip (YouTube Link) <span className="text-[#C1272D]">*</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Provide your uploaded 2-minute video pitch YouTube URL
              </p>
            </div>
          </div>

          {/* REFERENCE DEMO VIDEO BANNER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50 via-orange-50/40 to-red-50 border border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-white text-red-600 border border-red-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                <Play className="h-5 w-5 fill-red-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  Need Help Recording Your 2-Minute Pitch Video?
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                  Watch our official reference guide video clip to understand how to record, structure, and pitch your 2-minute presentation.
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

          {/* Video Recording Guidelines Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <span className="font-black text-slate-900 block flex items-center gap-1.5">
              📋 Recording Instructions:
            </span>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
              <li>State your <strong>Team ID ({team.id})</strong>, <strong>Team Name ({team.teamName})</strong>, and Problem Statement at the start.</li>
              <li>Demonstrate your working solution, architecture diagram, and 20% prototype code.</li>
              <li>Upload video to YouTube (Public or Unlisted) and paste the link below.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-2">
              YouTube Video Link <span className="text-[#C1272D]">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={demoVideoUrl}
                onChange={(e) => setDemoVideoUrl(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#C1272D] outline-none shadow-2xs"
              />
              <Play className="h-4 w-4 text-[#C1272D] absolute left-3.5 top-3.5 fill-[#C1272D]" />
            </div>
          </div>
        </div>

        {/* SECTION 4: 20% PROTOTYPE GITHUB REPO */}
        <div className="rounded-3xl bg-white p-5 sm:p-8 border border-slate-200/90 shadow-lg space-y-5">
          
          {/* Section Header */}
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 shrink-0 flex items-center justify-center mt-0.5">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                20% Prototype Code (GitHub Repository) <span className="text-[#C1272D]">*</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Provide your GitHub repository URL &amp; add required committee collaborators
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-2">
            <span className="font-black text-[#1B3F8B] block">
              🐙 Required GitHub Collaborators (Organizing Committee Members):
            </span>
            <p className="text-slate-700 font-medium">
              You must add the following 2 organizing committee members as collaborators to your repository:
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              <span className="px-3 py-1 rounded-xl bg-white border border-blue-200 text-[#1B3F8B] font-mono font-bold text-xs shadow-2xs">
                @sih2026-vsitr-collab1
              </span>
              <span className="px-3 py-1 rounded-xl bg-white border border-blue-200 text-[#1B3F8B] font-mono font-bold text-xs shadow-2xs">
                @sih2026-vsitr-collab2
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-2">
              GitHub Repository Link <span className="text-[#C1272D]">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://github.com/your-username/your-repo-name"
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#1B3F8B] outline-none shadow-2xs"
              />
              <GitBranch className="h-4 w-4 text-slate-600 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <label className="flex items-start gap-3 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={githubCollaboratorsAdded}
              onChange={(e) => setGithubCollaboratorsAdded(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1B3F8B] focus:ring-[#1B3F8B]"
            />
            <span className="text-xs font-bold text-slate-800 leading-relaxed">
              I confirm that I have pushed the 20% prototype code to this GitHub repository and added both organizing committee members (@sih2026-vsitr-collab1 and @sih2026-vsitr-collab2) as collaborators.
            </span>
          </label>
        </div>

        {/* SECTION 5: ACTION BUTTONS (CLEAN INLINE LAYOUT) */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('portal')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-300 bg-white text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            Cancel &amp; Return to Portal
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !isOpen}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#1B3F8B] hover:bg-blue-900 text-white font-black text-sm shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>Submitting Presentation &amp; Prototype...</>
            ) : (
              <>Submit Your PPT &amp; Prototype →</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
