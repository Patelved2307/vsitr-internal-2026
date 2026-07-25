import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TeamMember, Department, Gender, MentorPrefix } from '../types';
import {
  Shield,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  FileText,
  AlertCircle,
  Users,
  User,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  AlertTriangle,
  GraduationCap,
  Search,
  ShieldCheck,
  Calendar,
  Lock
} from 'lucide-react';

export const RegistrationRulesView: React.FC = () => {
  const { loginTeamSession, setActiveTab, showAlert, settings, rules, timeline, team, isTeamLoggedIn } = useAuth();

  // Mode state: 'register' or 'mentor_lookup'
  const [mode, setMode] = useState<'register' | 'mentor_lookup'>('register');

  // Step state for Registration
  // 1: Team Name, 2: Team Leader, 3: Members, 4: Success & Add Mentor, 5: Fully Completed
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    teamId: string;
    teamName: string;
    leaderEmail: string;
    team: any;
  } | null>(null);

  // Lookup / Direct Mentor Submission state
  const [teamIdInput, setTeamIdInput] = useState('');
  const [verifiedTeam, setVerifiedTeam] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Mentor Form fields
  const [mentorPrefix, setMentorPrefix] = useState<MentorPrefix>('Dr.');
  const [mentorName, setMentorName] = useState('');
  const [mentorMobile, setMentorMobile] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorDept, setMentorDept] = useState<Department>('IT');
  const [mentorInst, setMentorInst] = useState('KSV Kadi');
  const [mentorAddress, setMentorAddress] = useState('');
  const [isMentorSubmitting, setIsMentorSubmitting] = useState(false);

  // Step 1: Team Name
  const [teamName, setTeamName] = useState('');

  // Step 2: Leader Details
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

  // Step 3: Members Details
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 'm1', fullName: '', gender: 'Female', enrollmentNo: '', semester: '5', department: 'IT', mobile: '', email: '' },
    { id: 'm2', fullName: '', gender: 'Male', enrollmentNo: '', semester: '5', department: 'CSE', mobile: '', email: '' },
    { id: 'm3', fullName: '', gender: 'Male', enrollmentNo: '', semester: '5', department: 'CE', mobile: '', email: '' },
    { id: 'm4', fullName: '', gender: 'Male', enrollmentNo: '', semester: '3', department: 'IT', mobile: '', email: '' },
    { id: 'm5', fullName: '', gender: 'Male', enrollmentNo: '', semester: '3', department: 'CSE', mobile: '', email: '' },
  ]);

  // Accordion state for Rules
  const [openAccordion, setOpenAccordion] = useState<string | null>('eligibility');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const defaultRulesList = rules.length > 0 ? rules : [
    "Each team must consist of exactly 6 members, including the Team Leader.",
    "Each team must include at least 1 female participant. All-girls teams are welcome and eligible.",
    "All participants must be from the same college (VSITR) — inter-college teams are not permitted.",
    "Members may belong to different years, branches, or disciplines within the same college (IT, CSE, CE).",
    "Each team must use a unique team name that does NOT include the institute's name (e.g. VSITR, Vidush Somany).",
    "Each participant (by enrollment number) may be part of only one team.",
    "A team once registered cannot add/replace members after the registration deadline without admin approval.",
    "Registration is split into two independent phases: (a) Team Registration and (b) Mentor Details Submission. Phase (a) must be completed by deadline; Phase (b) is mandatory for final confirmation.",
    "Only the Team Leader may register the team and will be the sole point of contact for all official communication.",
    "All communication (screening schedules, problem statements, presentation dates, selection updates) will be sent only to the Team Leader's registered college email.",
    "Teams must report on time for screening rounds/presentations as per the schedule communicated via email.",
    "Plagiarism, misrepresentation of information, or providing false enrollment/contact details will lead to disqualification.",
    "Decisions of the organizing committee (Research, Coding, Design, Soft Skills clubs) and faculty coordinators are final and binding.",
    "Any change in team composition or mentor after submission must be communicated to the organizing committee in writing/email — not self-editable post-deadline."
  ];

  const eligibilityRules = defaultRulesList.slice(0, 7);
  const processRules = defaultRulesList.slice(7, 10);
  const conductRules = defaultRulesList.slice(10);

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
      showAlert('Minimum Required', 'You must have at least 2 members added here (plus leader) to form a complete team.', 'info');
      return;
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  // Validations & Step transitions
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
      setRegStep(2);
    } catch (err: any) {
      showAlert('Check Failed', err.message || 'Could not verify if team name exists.');
    }
  };

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
    setRegStep(3);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (members.length !== 5) {
      showAlert(
        'Registration Incomplete',
        'Each team must consist of exactly 6 members, including the Team Leader.'
      );
      return;
    }

    // Front-end gender check
    const allMembers = [leader, ...members];
    const femaleCount = allMembers.filter((m) => m.gender === 'Female').length;
    if (femaleCount < 1) {
      showAlert(
        'Registration Failed',
        'Every team must include at least one female participant. Please add the details of a female member before submitting the registration.'
      );
      return;
    }

    // Duplicate enrollment check removed per user request

    // Duplicate member name check removed per user request

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

    // Mobile & Email Validation for members
    for (const m of members) {
      if (!m.fullName || !m.enrollmentNo || !m.mobile || !m.email) {
        showAlert('Member Information Incomplete', 'Please fill in all details for all team members.');
        return;
      }
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

  const handleSuccessClose = () => {
    if (successData?.team) {
      loginTeamSession(successData.team);
    }
    setSuccessData(null);
  };

  // Mentor details submission
  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetTeamId = successData?.teamId || verifiedTeam?.id;
    if (!targetTeamId) {
      showAlert('Team Verification Required', 'Please register a team or verify your Team ID first.');
      return;
    }

    if (!mentorName.trim() || !mentorMobile.trim() || !mentorEmail.trim() || !mentorAddress.trim()) {
      showAlert('Fields Required', 'Please fill in all mentor contact and office details.');
      return;
    }

    if (!/^\d{10}$/.test(mentorMobile.trim())) {
      showAlert('Invalid Mobile Number', 'Please enter a valid 10-digit contact number for the mentor.');
      return;
    }

    try {
      setIsMentorSubmitting(true);
      const res = await api.submitMentor({
        teamId: targetTeamId,
        mentor: {
          prefix: mentorPrefix,
          fullName: mentorName.trim(),
          contactNumber: mentorMobile.trim(),
          email: mentorEmail.trim(),
          department: mentorDept,
          institute: mentorInst,
          officeAddress: mentorAddress.trim(),
        },
      });

      if (res.success) {
        setRegStep(5); // Fully Registered State
        if (res.team) {
          loginTeamSession(res.team);
        }
      }
    } catch (err: any) {
      showAlert('Submission Failed', err.message || 'Failed to submit mentor details.');
    } finally {
      setIsMentorSubmitting(false);
    }
  };

  // Verification lookup for returning users
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
        if (res.team.mentor) {
          setMentorPrefix(res.team.mentor.prefix);
          setMentorName(res.team.mentor.fullName);
          setMentorMobile(res.team.mentor.contactNumber);
          setMentorEmail(res.team.mentor.email);
          setMentorDept(res.team.mentor.department);
          setMentorInst(res.team.mentor.institute);
          setMentorAddress(res.team.mentor.officeAddress);
        }
        // If team is already completed, go straight to final step
        if (res.team.status === 'completed') {
          setRegStep(5);
        } else {
          setRegStep(4);
        }
      }
    } catch (err: any) {
      setVerifiedTeam(null);
      showAlert('Verification Failed', 'Registration ID not found.');
    } finally {
      setIsVerifying(false);
    }
  };

  const { team, isTeamLoggedIn } = useAuth();
  
  const now = new Date();
  const deadline = new Date(settings.registrationDeadline);
  const isDeadlinePassed = !settings.isRegistrationOpen || now > deadline;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner Area */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-[#C1272D] border border-red-100 text-xs font-extrabold uppercase tracking-wider mb-3">
          <span className="h-2 w-2 rounded-full bg-[#C1272D] animate-pulse" />
          Internal SIH 2026 Registration Portal
        </div>
        
        {isTeamLoggedIn && team ? (
          <>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {team.status === 'completed' ? 'You are all set!' : 'Complete Your Registration'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-2 font-medium">
              {team.status === 'completed' 
                ? 'Your team and mentor details are successfully registered. Keep an eye out for further announcements and prepare your pitch!' 
                : 'Please complete the remaining steps to finalize your team registration.'}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Streamlined Registration
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-2 font-medium">
              Register your team and submit mentor details in one continuous, simplified workflow.
            </p>
          </>
        )}

        {/* Mode Toggle & Lookup banner removed - Phase 2 Mentor Submission now accessed strictly post-registration or via Team Portal login */}
      </div>

      {/* Main Grid: Left (Rules), Right (Form Wizard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 5 Columns: Rules & Regulations */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Key Dates Badge Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-[#C1272D]" />
              Important Registration Deadlines
            </h3>
            <div className="space-y-3.5">
              {timeline && timeline.map((event, idx) => (
                <div key={event.id || idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium pr-2 truncate" title={event.title}>{event.title}</span>
                  <span className={`font-extrabold shrink-0 ${event.date.includes('Mandatory') || idx === 1 ? 'text-red-600' : 'text-slate-800'}`}>
                    {event.date}
                  </span>
                </div>
              ))}
              {(!timeline || timeline.length === 0) && (
                <div className="text-xs text-slate-400 text-center py-2">No deadlines scheduled yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 text-[#C1272D]">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">Rules &amp; Guidelines</h2>
            </div>

            <div className="space-y-3">
              {/* Eligibility Accordion */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => toggleAccordion('eligibility')}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition text-left text-xs font-bold text-slate-800"
                >
                  <span>01. Team &amp; Gender Requirements</span>
                  {openAccordion === 'eligibility' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {openAccordion === 'eligibility' && (
                  <div className="p-4 bg-white space-y-2 border-t border-slate-100">
                    {eligibilityRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle className="h-3.5 w-3.5 text-[#C1272D] shrink-0 mt-0.5" />
                        <p><span className="font-bold text-slate-800">Rule {idx + 1}:</span> {rule}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Process Accordion */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => toggleAccordion('process')}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition text-left text-xs font-bold text-slate-800"
                >
                  <span>02. Registration Phases</span>
                  {openAccordion === 'process' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {openAccordion === 'process' && (
                  <div className="p-4 bg-white space-y-2 border-t border-slate-100">
                    {processRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <FileText className="h-3.5 w-3.5 text-[#1B3F8B] shrink-0 mt-0.5" />
                        <p><span className="font-bold text-slate-800">Rule {idx + 8}:</span> {rule}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conduct Accordion */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => toggleAccordion('conduct')}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition text-left text-xs font-bold text-slate-800"
                >
                  <span>03. Conduct &amp; Decisions</span>
                  {openAccordion === 'conduct' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {openAccordion === 'conduct' && (
                  <div className="p-4 bg-white space-y-2 border-t border-slate-100">
                    {conductRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <p><span className="font-bold text-slate-800">Rule {idx + 11}:</span> {rule}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Form Wizard */}
        <div className="lg:col-span-7">
          {isTeamLoggedIn ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Problem Statement Container */}
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C1272D] to-[#1B3F8B]" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-50 text-[#C1272D]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      SIH 2026 Problem Statements
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Official Announcement
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {settings.problemStatementStatus || 'Problem statement announcements will be announced once we get update from the official SIH website.'}
                  </p>
                  
                  {settings.problemStatementLink && (
                    <a
                      href={settings.problemStatementLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#C1272D] to-red-600 hover:opacity-95 transition shadow-xs"
                    >
                      Visit Official SIH Problem Statements
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* PPT Template Container */}
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1B3F8B] to-[#C1272D]" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#1B3F8B]">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Download SIH PPT Template
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Presentation Deck Template
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {settings.pptTemplateStatus || 'The template will be released soon. Download it from here.'}
                  </p>
                  
                  {settings.pptTemplateLink && settings.pptTemplateLink !== '#' && (
                    <a
                      href={settings.pptTemplateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1B3F8B] to-blue-800 hover:opacity-95 transition shadow-xs"
                    >
                      Download Template PPT
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* PPT Submission Card */}
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C1272D] to-[#1B3F8B]" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-50 text-[#C1272D]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Submit Your PPT
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pitch Deck Submission Portal
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {settings.pptSubmissionStatus || 'PPT submission portal will open after the registration deadline. Stay tuned.'}
                  </p>
                  {settings.pptSubmissionDeadline && (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#C1272D]">
                      <Calendar className="h-3.5 w-3.5" />
                      Submission Deadline: {settings.pptSubmissionDeadline}
                    </div>
                  )}
                  {settings.pptSubmissionOpen ? (
                    <button
                      onClick={() => setActiveTab('ppt-submit')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#C1272D] to-red-700 hover:opacity-95 transition shadow-xs"
                    >
                      Submit Your PPT
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-500">
                      Submissions Not Yet Open
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {mode === 'register' && regStep <= 3 && (
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md">
              
              {/* Progress Steps Header */}
              {regStep <= 3 && (
                <div className="mb-6 max-w-md mx-auto">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] -translate-y-1/2 z-0 transition-all duration-300"
                      style={{
                        width: regStep === 1 ? '0%' : regStep === 2 ? '50%' : '100%',
                      }}
                    />

                    {/* Circle 1 */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                          regStep >= 1 ? 'bg-[#C1272D] text-white border-[#C1272D] ring-4 ring-red-50' : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        1
                      </div>
                      <span className="text-[10px] font-extrabold mt-1 text-slate-600">Team Name</span>
                    </div>

                    {/* Circle 2 */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                          regStep >= 2 ? 'bg-[#1B3F8B] text-white border-[#1B3F8B] ring-4 ring-blue-50' : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        2
                      </div>
                      <span className="text-[10px] font-extrabold mt-1 text-slate-600">Leader</span>
                    </div>

                    {/* Circle 3 */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                          regStep >= 3 ? 'bg-amber-600 text-white border-amber-600 ring-4 ring-amber-50' : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        3
                      </div>
                      <span className="text-[10px] font-extrabold mt-1 text-slate-600">Members</span>
                    </div>
                  </div>
                </div>
              )}

              {isDeadlinePassed && regStep <= 3 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Registrations are Closed</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The Phase 1 Team Registration deadline has passed. If you already registered, use the "Add Mentor / Resume Flow" mode to complete your registration.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); if (regStep === 3) handleRegisterSubmit(e); }}>
                  
                  {/* STEP 1: TEAM NAME */}
                  {regStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Users className="h-5 w-5 text-[#C1272D]" />
                        Choose a Team Name
                      </h3>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Team Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Innovators VSITR (without using forbidden keywords)"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#C1272D]"
                        />
                        <p className="text-[11px] text-slate-500 mt-2">
                          ⚠ Must be unique and must NOT contain the institute name ("VSITR" or "Vidush Somany").
                        </p>
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleStep1Next}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] hover:opacity-95 transition"
                        >
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: LEADER DETAILS */}
                  {regStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <User className="h-5 w-5 text-[#1B3F8B]" />
                        Team Leader Details
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name (First Middle Last) *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Patel Ved Rameshbhai"
                            value={leader.fullName}
                            onChange={(e) => setLeader({ ...leader, fullName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                          <select
                            value={leader.gender}
                            onChange={(e) => setLeader({ ...leader, gender: e.target.value as Gender })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none bg-white"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Enrollment Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 24BEIT54001"
                            value={leader.enrollmentNo}
                            onChange={(e) => setLeader({ ...leader, enrollmentNo: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                          <select
                            value={leader.department}
                            onChange={(e) => setLeader({ ...leader, department: e.target.value as Department })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none bg-white"
                          >
                            <option value="IT">IT</option>
                            <option value="CSE">CSE</option>
                            <option value="CE">CE</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Semester *</label>
                          <select
                            value={leader.semester}
                            onChange={(e) => setLeader({ ...leader, semester: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none bg-white"
                          >
                            {['1', '2', '3', '4', '5', '6', '7', '8'].map((s) => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10 digits"
                            value={leader.mobile}
                            onChange={(e) => setLeader({ ...leader, mobile: e.target.value.replace(/\D/g, '') })}
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none focus:ring-2 ${
                              leader.mobile && leader.mobile.length !== 10
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-slate-300 focus:ring-[#1B3F8B]'
                            }`}
                          />
                          {leader.mobile && leader.mobile.length !== 10 && (
                            <p className="text-[10px] text-red-600 mt-1 font-semibold">
                              Invalid phone number. Must be exactly 10 digits.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Email ID *</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. leader@gmail.com"
                            value={leader.email}
                            onChange={(e) => setLeader({ ...leader, email: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 ${
                              leader.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim())
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-slate-300 focus:ring-[#1B3F8B]'
                            }`}
                          />
                          {leader.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim()) && (
                            <p className="text-[10px] text-red-600 mt-1 font-semibold">
                              Invalid email address.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setRegStep(1)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleStep2Next}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] hover:opacity-95 transition"
                        >
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: MEMBERS */}
                  {regStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <Users className="h-5 w-5 text-amber-600" />
                          Add 5 Team Members
                        </h3>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border">
                          Total: {members.length + 1} / 6
                        </span>
                      </div>

                      <div className="space-y-4">
                        {members.map((member, idx) => (
                          <div key={member.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-extrabold text-slate-700">Member #{idx + 2} Details</span>
                              {/* No Remove Button (Fixed Team Size of 6) */}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600">Full Name *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Full Name"
                                  value={member.fullName}
                                  onChange={(e) => updateMember(idx, 'fullName', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600">Gender *</label>
                                <select
                                  value={member.gender}
                                  onChange={(e) => updateMember(idx, 'gender', e.target.value as Gender)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600">Enrollment No *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Enrollment No"
                                  value={member.enrollmentNo}
                                  onChange={(e) => updateMember(idx, 'enrollmentNo', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600">Department *</label>
                                <select
                                  value={member.department}
                                  onChange={(e) => updateMember(idx, 'department', e.target.value as Department)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                                >
                                  <option value="IT">IT</option>
                                  <option value="CSE">CSE</option>
                                  <option value="CE">CE</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600">Semester *</label>
                                <select
                                  value={member.semester}
                                  onChange={(e) => updateMember(idx, 'semester', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                                >
                                  {['1', '2', '3', '4', '5', '6', '7', '8'].map((s) => (
                                    <option key={s} value={s}>Sem {s}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600">Mobile *</label>
                                <input
                                  type="tel"
                                  required
                                  maxLength={10}
                                  placeholder="Mobile"
                                  value={member.mobile}
                                  onChange={(e) => updateMember(idx, 'mobile', e.target.value.replace(/\D/g, ''))}
                                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-white outline-none focus:ring-2 ${
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

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600">Email ID *</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="Email"
                                  value={member.email}
                                  onChange={(e) => updateMember(idx, 'email', e.target.value)}
                                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white outline-none focus:ring-2 ${
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

                      <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setRegStep(2)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] hover:opacity-95 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSubmitting ? 'Submitting...' : 'Register Team'}
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* LOOKUP MODE OR PHASE 2: ADD MENTOR DETAILS */}
          {(mode === 'mentor_lookup' || regStep === 4) && (
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
              
              {/* Lookup input if not verified yet */}
              {!verifiedTeam && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Search className="h-5 w-5 text-[#1B3F8B]" />
                    Find Registered Team
                  </h3>
                  <form onSubmit={handleVerifyId} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Registration ID (e.g. SIH2026-001)"
                      value={teamIdInput}
                      onChange={(e) => setTeamIdInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-[#1B3F8B] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-800 hover:opacity-95 transition disabled:opacity-50"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </form>
                </div>
              )}

              {/* SUCCESS / WARNING REMINDER DETAILS */}
              {verifiedTeam && (
                <div className="space-y-4">
                  {successData && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col items-center text-center space-y-1">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-1" />
                      <h4 className="text-sm font-black">Team Registration Successful!</h4>
                      <p className="text-xs text-slate-500">Your Team ID is generated:</p>
                      <span className="text-xl font-mono font-black text-[#1B3F8B] tracking-wider mt-1">{successData.teamId}</span>
                    </div>
                  )}

                  {/* Warning Reminder */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs uppercase">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>Action Required: Add Faculty Mentor</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700">
                      Hi <strong className="font-bold text-slate-900">{verifiedTeam.leader?.fullName}</strong> (Team Leader of "{verifiedTeam.teamName}"). 
                      Per hackathon rules, you must assign a Faculty Mentor immediately to complete your registration.
                    </p>
                  </div>

                  {/* Mentor Form */}
                  <form onSubmit={handleMentorSubmit} className="space-y-4 animate-in fade-in duration-200 border-t border-slate-100 pt-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-amber-600" />
                      Faculty Mentor details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Title *</label>
                        <select
                          value={mentorPrefix}
                          onChange={(e) => setMentorPrefix(e.target.value as MentorPrefix)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold outline-none bg-white"
                        >
                          <option value="Dr.">Dr.</option>
                          <option value="Prof.">Prof.</option>
                          <option value="Ph.D.">Ph.D.</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Parita Shah"
                          value={mentorName}
                          onChange={(e) => setMentorName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Contact (10 digits) *</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="Mobile"
                          value={mentorMobile}
                          onChange={(e) => setMentorMobile(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. mentor.it@ksv.ac.in"
                          value={mentorEmail}
                          onChange={(e) => setMentorEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Department *</label>
                        <select
                          value={mentorDept}
                          onChange={(e) => setMentorDept(e.target.value as Department)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none"
                        >
                          <option value="IT">IT</option>
                          <option value="CSE">CSE</option>
                          <option value="CE">CE</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Institute *</label>
                        <select
                          value={mentorInst}
                          onChange={(e) => setMentorInst(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none"
                        >
                          <option value="KSV Kadi">KSV Kadi (VSITR)</option>
                          <option value="KSV Gandhinagar">KSV Gandhinagar</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Office / Cabin Address *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="e.g. Cabin 204, IT Department, Block A"
                          value={mentorAddress}
                          onChange={(e) => setMentorAddress(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isMentorSubmitting}
                      className="w-full mt-3 py-3 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:opacity-95 transition disabled:opacity-50"
                    >
                      {isMentorSubmitting ? 'Submitting...' : 'Submit Mentor Details & Complete Registration'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* FINAL FULLY COMPLETED STEP */}
          {regStep === 5 && (
            <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-md text-center space-y-4 animate-in zoom-in duration-200">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="text-xl font-black text-slate-900">
                Team Fully Registered!
              </h2>

              <p className="text-xs font-semibold text-slate-600 max-w-sm mx-auto">
                Thank you! Your Internal SIH 2026 registration is complete. All details (including mentor information) have been verified.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-150 text-xs text-slate-500 text-left max-w-md mx-auto">
                Organizing coordinators will contact your Team Leader via registered college email for screening rounds and further presentations.
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-center gap-3">
                <button
                  onClick={() => {
                    setMode('register');
                    setRegStep(1);
                    setVerifiedTeam(null);
                    setSuccessData(null);
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Register Another Team
                </button>
                <button
                  onClick={() => setActiveTab('portal')}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-800 hover:opacity-95 transition"
                >
                  Enter Team Portal
                </button>
              </div>
            </div>
          )}
          </>
          )}

        </div>
      </div>

      {/* REGISTRATION SUCCESS MODAL OVERLAY */}
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
