import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatTimelineDate } from '../lib/timeline';
import { api } from '../services/api';
import { TeamMember, Department, Gender, MentorPrefix } from '../types';
import { MentorPendingCard } from './MentorPendingCard';
import { Button } from '@/components/ui/rainbow-borders-button';
import { motion, AnimatePresence } from 'framer-motion';
import { BorderBeamPanel } from '@/components/ui/border-beam-panel';
import { GlowingShadow } from '@/components/ui/glowing-shadow';
import { GradientBlobCard } from '@/components/ui/gradient-blob-card';
import { LiquidGradientCard } from '@/components/ui/liquid-gradient-card';
import RotatingText from '@/components/ui/RotatingText';
import FloatingLines from '@/components/ui/FloatingLines';
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
  Lock,
  Clock,
  BookOpen
} from 'lucide-react';

const FLOATING_LINES_WAVES = ['top', 'middle', 'bottom'] as Array<'top' | 'middle' | 'bottom'>;
const FLOATING_LINES_COUNT = [10, 15, 20];
const FLOATING_LINES_DISTANCE = [8, 6, 4];
const FLOATING_LINES_GRADIENT = ['#C1272D', '#8B235E', '#1B3F8B'];
const FLOATING_LINES_BOTTOM_POS = { x: 2.0, y: -0.7, rotate: -1 };

export const RegistrationRulesView: React.FC = () => {
  const { loginTeamSession, setActiveTab, showAlert, settings, rules, timeline, team, isTeamLoggedIn, activeTab, clubCoordinators } = useAuth();

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
  const [mentorInst, setMentorInst] = useState('VSITR Kadi');
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  // Countdown Timer state for Sidebar
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const effectiveDeadline = settings.isExtended && settings.extendedDeadline ? settings.extendedDeadline : settings.registrationDeadline;
      const deadlineVal = new Date(effectiveDeadline).getTime();
      const nowVal = new Date().getTime();
      const difference = deadlineVal - nowVal;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [settings.registrationDeadline, settings.extendedDeadline, settings.isExtended]);

  const [pptTimeLeft, setPptTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculatePptTimeLeft = () => {
      const deadlineStr = settings?.pptExtendedDeadline || settings?.pptSubmissionDeadline;
      if (!deadlineStr) return;
      const pptDeadline = new Date(deadlineStr).getTime();
      const nowVal = new Date().getTime();
      const difference = pptDeadline - nowVal;

      if (difference <= 0) {
        setPptTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setPptTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculatePptTimeLeft();
    const timer = setInterval(calculatePptTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [settings?.pptExtendedDeadline, settings?.pptSubmissionDeadline]);

  const eligibilityRules = rules.filter(r => r.categoryId === 'official');
  const processRules = rules.filter(r => r.categoryId === 'phases');
  const conductRules = rules.filter(r => r.categoryId === 'conduct');

  const processOffset = eligibilityRules.length;
  const conductOffset = eligibilityRules.length + processRules.length;

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
    const leaderEnrollmentRequired = leader.semester !== '1';
    if (!leader.fullName || (leaderEnrollmentRequired && !leader.enrollmentNo) || !leader.mobile || !leader.email) {
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
      const memberEnrollmentRequired = m.semester !== '1';
      if (!m.fullName || (memberEnrollmentRequired && !m.enrollmentNo) || !m.mobile || !m.email) {
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

    const targetTeamId = successData?.teamId || verifiedTeam?.id || teamIdInput.trim();
    if (!targetTeamId) {
      showAlert('Team ID Required', 'Please enter your Team Registration ID.');
      return;
    }

    if (!mentorName.trim() || !mentorMobile.trim() || !mentorEmail.trim()) {
      showAlert('Fields Required', 'Please fill in all mentor contact details.');
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



  const now = new Date();
  const deadline = new Date(settings.isExtended && settings.extendedDeadline ? settings.extendedDeadline : settings.registrationDeadline);
  const isDeadlinePassed = !settings.isRegistrationOpen || now > deadline;

  const formattedExtendedDeadline = React.useMemo(() => {
    const target = settings.isExtended && settings.extendedDeadline ? settings.extendedDeadline : settings.registrationDeadline;
    if (!target) return '';
    try {
      return new Date(target).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).replace(' at ', ', ').replace(/\s*[pP][mM]\s*$/, ' PM').replace(/\s*[aA][mM]\s*$/, ' AM');
    } catch {
      return '';
    }
  }, [settings.extendedDeadline, settings.registrationDeadline, settings.isExtended]);

  if (activeTab === 'rules') {
    const accordionItems = [
      {
        id: "eligibility",
        number: "01",
        title: "Official SIH Rules & Regulations",
        renderContent: () => (
          <div className="space-y-5">
            {eligibilityRules.map((rule, idx) => (
              <div key={rule.id || idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                <CheckCircle className="h-4.5 w-4.5 text-[#C1272D] shrink-0 mt-0.5" />
                <p><span className="font-extrabold text-slate-800">Rule {idx + 1}:</span> {rule.text}</p>
              </div>
            ))}
          </div>
        )
      },
      {
        id: "process",
        number: "02",
        title: "Internal SIH 2026 Registration Phases",
        renderContent: () => (
          <div className="space-y-5">
            {processRules.map((rule, idx) => (
              <div key={rule.id || idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                <FileText className="h-4.5 w-4.5 text-[#1B3F8B] shrink-0 mt-0.5" />
                <p><span className="font-extrabold text-slate-800">Step {idx + 1}:</span> {rule.text}</p>
              </div>
            ))}
          </div>
        )
      },
      {
        id: "conduct",
        number: "03",
        title: "Internal SIH 2026 Conduct & Decisions",
        renderContent: () => (
          <div className="space-y-5">
            {conductRules.map((rule, idx) => (
              <div key={rule.id || idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                <p><span className="font-extrabold text-slate-800">Rule {idx + 1 + conductOffset}:</span> {rule.text}</p>
              </div>
            ))}
          </div>
        )
      }
    ];

    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Rules Top Banner */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-[#C1272D] border border-red-100 text-xs font-extrabold uppercase tracking-wider mb-3 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C1272D] animate-pulse" />
            OFFICIAL RULES &amp; GUIDELINES
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Rules &amp; Regulations
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2 font-medium">
            Please review the official eligibility criteria, registration phases, and conduct policies for the Internal SIH 2026.
          </p>
        </div>

        {/* Rules Accordions directly on the page */}
        <div className="space-y-0 divide-y divide-slate-200 border-t border-b border-slate-200">
          {accordionItems.map((item, index) => {
            const isActive = openAccordion === item.id;
            const isHovered = hoveredId === item.id;

            return (
              <div key={item.id} className="py-2 first:pt-0 last:pb-0">
                <motion.button
                  type="button"
                  onClick={() => toggleAccordion(isActive ? '' : item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="w-full group relative text-left py-6 px-1 focus:outline-none cursor-pointer"
                  initial={false}
                >
                  <div className="flex items-center gap-6">
                    {/* Number with animated circle */}
                    <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        initial={false}
                        animate={{
                          scale: isActive ? 1 : isHovered ? 0.85 : 0,
                          opacity: isActive ? 1 : isHovered ? 0.1 : 0,
                          backgroundColor: isActive ? "#1B3F8B" : "#C1272D",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                      />
                      <motion.span
                        className="relative z-10 text-sm font-black tracking-wide"
                        animate={{
                          color: isActive ? "#FFFFFF" : isHovered ? "#C1272D" : "#64748B",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.number}
                      </motion.span>
                    </div>

                    {/* Title */}
                    <motion.h3
                      className="text-base sm:text-xl font-bold tracking-tight text-slate-900"
                      animate={{
                        x: isActive || isHovered ? 6 : 0,
                        color: isActive
                          ? "#1B3F8B"
                          : isHovered
                            ? "#C1272D"
                            : "#1E293B",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    >
                      {item.title}
                    </motion.h3>

                    {/* Animated indicator */}
                    <div className="ml-auto flex items-center gap-3">
                      <motion.div
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-slate-50/50"
                        animate={{ rotate: isActive ? 45 : 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <motion.svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="text-slate-800"
                          animate={{
                            opacity: isActive || isHovered ? 1 : 0.4,
                            color: isActive ? "#1B3F8B" : isHovered ? "#C1272D" : "#1E293B",
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.path
                            d="M8 1V15M1 8H15"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            initial={false}
                          />
                        </motion.svg>
                      </motion.div>
                    </div>
                  </div>

                  {/* Animated underline */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#C1272D] via-[#8B235E] to-[#1B3F8B] origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: isActive ? 1 : isHovered ? 0.3 : 0,
                      width: "100%"
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                </motion.button>

                {/* Content */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        transition: {
                          height: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2, delay: 0.1 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.1 },
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        className="pl-16 pr-4 pb-6 pt-6 text-slate-600 leading-relaxed font-medium"
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        exit={{ y: -10 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                      >
                        {item.renderContent()}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner Area */}
      <div className="relative text-center mb-8 p-6 sm:p-10 rounded-3xl bg-slate-950 text-white overflow-hidden shadow-2xl border border-slate-800/80">
        {/* FloatingLines Background */}
        <div className="absolute inset-0 z-0 rounded-3xl overflow-hidden opacity-90 pointer-events-none">
          <FloatingLines
            linesGradient={FLOATING_LINES_GRADIENT}
            enabledWaves={FLOATING_LINES_WAVES}
            lineCount={FLOATING_LINES_COUNT}
            lineDistance={FLOATING_LINES_DISTANCE}
            bottomWavePosition={FLOATING_LINES_BOTTOM_POS}
            bendRadius={5.0}
            bendStrength={-0.6}
            interactive={true}
            parallax={true}
            animationSpeed={0.6}
            mixBlendMode="screen"
          />
        </div>

        {/* Dark overlay backdrop to shield the text and maximize contrast */}
        <div className="absolute inset-0 z-0 bg-slate-950/20 rounded-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 text-red-400 border border-slate-800 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-4 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#C1272D] animate-pulse" />
            Internal SIH 2026 Registration Portal
          </div>

          {isTeamLoggedIn && team ? (
            <>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {team.status === 'completed' ? 'You are all set!' : 'Complete Your Registration'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-2 font-medium">
                {team.status === 'completed'
                  ? 'Your team and mentor details are successfully registered. Keep an eye out for further announcements and prepare your pitch!'
                  : 'Please complete the remaining steps to finalize your team registration.'}
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap justify-center items-center gap-1.5 mb-3 text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase">
                <span>Let's</span>
                <RotatingText
                  texts={['Innovate', 'Build', 'Compete', 'Succeed']}
                  mainClassName="px-2 py-0.5 bg-red-600 text-white rounded-md font-black overflow-hidden shadow-md shadow-red-900/30 border border-red-500/20 whitespace-nowrap"
                  staggerFrom="first"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-120%", opacity: 0 }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-0.5"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={3500}
                />
                <span>for SIH 2026</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Streamlined Registration
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md sm:max-w-xl mx-auto mt-3 font-medium leading-relaxed">
                Register your team and submit mentor details in one continuous, simplified workflow.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm w-full">
                <span className="text-slate-400">Ready to</span>
                <RotatingText
                  texts={['pitch your innovative ideas?', 'complete your team setup?', 'take the lead?']}
                  mainClassName="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-md shadow-blue-900/30 overflow-hidden border border-blue-500/30 text-center whitespace-nowrap inline-flex items-center justify-center"
                  staggerFrom="first"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-120%", opacity: 0 }}
                  staggerDuration={0.02}
                  splitLevelClassName="overflow-hidden pb-0.5"
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  rotationInterval={5000}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <MentorPendingCard />

      {settings.isExtended && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-amber-50/75 border border-amber-200/80 text-amber-900 flex items-start gap-3 shadow-xs animate-in slide-in-from-top duration-300">
          <span className="font-extrabold px-2.5 py-1 rounded-xl bg-amber-200/90 text-amber-950 text-[10px] sm:text-xs uppercase shrink-0 mt-0.5 tracking-wider border border-amber-300/80">Extended</span>
          <div>
            <p className="font-black text-sm sm:text-base text-amber-950">Registration Deadline Extended!</p>
            <p className="mt-1 text-slate-700 text-xs sm:text-sm leading-relaxed font-semibold">
              The organizing coordinators have extended registrations. You can register your team regularly until <strong className="text-[#1B3F8B] font-extrabold">{formattedExtendedDeadline}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Official SIH Announcement Banner */}
      <div className="mb-8 p-6 rounded-3xl bg-[#FFF9E6] border border-amber-300 text-amber-950 flex flex-col md:flex-row items-start gap-4 shadow-md relative overflow-hidden animate-in fade-in duration-500">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl shrink-0">
          <AlertTriangle className="h-6 w-6 animate-pulse" />
        </div>
        <div className="space-y-1.5 flex-1">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-amber-950 flex items-center gap-2">
            📢 Important Announcement: Official SIH Problem Statements Delayed
          </h3>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
            SIH has officially announced a delay in releasing the official Problem Statements. Until they are released, VSITR will conduct the Internal SIH using institute-released problem statements. Selected teams will participate on these. Once the official SIH problem statements are released later, teams will select their official statement and the Internal SIH will be conducted again.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => setActiveTab('problem-statements')}
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-sm transition cursor-pointer"
            >
              View Institute Problem Statements
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Deadlines - wider when registration is closed), Right (Form Wizard / Info Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Side: Deadlines & Announcements */}
        <div className={`${isDeadlinePassed ? 'lg:col-span-5' : 'lg:col-span-4'} space-y-6`}>

          {/* Key Dates Badge Card */}
          <div className={`relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 shadow-md hover:shadow-lg transition duration-200 ${isDeadlinePassed ? 'sm:p-8 border-red-150' : ''}`}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#C1272D] to-red-500" />
            <h3 className={`${isDeadlinePassed ? 'text-base' : 'text-sm'} font-extrabold text-slate-950 flex items-center gap-2 mb-4`}>
              <Calendar className={`${isDeadlinePassed ? 'h-5 w-5' : 'h-4.5 w-4.5'} text-[#C1272D]`} />
              Important Registration Deadlines
            </h3>
            <div className="space-y-3">
              {timeline && timeline.map((event, idx) => {
                const isClosed = event.date.toLowerCase().includes('closed') || (!event.active && event.id !== 't5');
                const displayDate = formatTimelineDate(event.date);
                const isLivePpt = event.title.toLowerCase().includes('ppt') && event.title.toLowerCase().includes('prototype');
                return (
                  <div key={event.id || idx} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl border transition ${
                    isLivePpt
                      ? 'bg-emerald-50/70 border-emerald-200/80'
                      : isClosed
                      ? 'bg-slate-50/90 border-slate-200/60'
                      : 'bg-white border-slate-200/80 shadow-2xs'
                  }`}>
                    <span className="text-xs font-extrabold text-slate-800 leading-snug" title={event.title}>
                      {event.title}
                    </span>
                    <span className={`font-black text-xs max-w-full self-start sm:self-auto sm:max-w-[60%] px-2.5 py-1 rounded-xl whitespace-normal break-words leading-snug ${
                      isClosed
                        ? 'text-red-700 bg-red-100/90 border border-red-200'
                        : isLivePpt
                        ? 'text-emerald-900 bg-emerald-100 border border-emerald-300 font-extrabold flex items-center gap-1.5'
                        : 'text-slate-900 bg-slate-100 border border-slate-200'
                    }`}>
                      {isLivePpt && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                      {isClosed && <span className="mr-1.5 text-red-600">Closed</span>}
                      {displayDate}
                    </span>
                  </div>
                );
              })}
              {(!timeline || timeline.length === 0) && (
                <div className="text-xs text-slate-400 text-center py-2">No deadlines scheduled yet.</div>
              )}
            </div>
          </div>

          {/* Countdown Card - Only shown when registration is open */}
          {!isDeadlinePassed && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 shadow-lg text-white">
              {/* Soft decorative radial glow */}
              <div className="absolute -right-8 -top-8 w-20 h-20 bg-red-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-slate-800">
                <Clock className="h-4 w-4 text-red-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Registration Closes In
                </span>
              </div>

              {timeLeft.isExpired ? (
                <div className="text-center py-3 bg-red-950/30 rounded-2xl border border-red-900/40">
                  <span className="text-sm font-black text-red-400 block uppercase tracking-wider">Registration Closed</span>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {/* Days */}
                  <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2.5 shadow-inner">
                    <span className="text-xl font-black text-white font-mono leading-none">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase mt-1 tracking-wider">
                      Days
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2.5 shadow-inner">
                    <span className="text-xl font-black text-white font-mono leading-none">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase mt-1 tracking-wider">
                      Hrs
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2.5 shadow-inner">
                    <span className="text-xl font-black text-white font-mono leading-none">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase mt-1 tracking-wider">
                      Mins
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className="flex flex-col items-center bg-[#C1272D]/15 border border-[#C1272D]/35 rounded-2xl p-2.5 shadow-inner">
                    <span className="text-xl font-black text-red-400 font-mono leading-none animate-pulse">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-black text-red-500 uppercase mt-1 tracking-wider">
                      Secs
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIH Discussion & Sharing Card - Moved here when registration is closed */}
          {isDeadlinePassed && (
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/85 p-6 shadow-md hover:shadow-lg transition duration-200 border-l-4 border-l-blue-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/15">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950">
                    SIH Discussion &amp; Sharing
                  </h3>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Join Official Channels
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-550 font-semibold leading-relaxed">
                  Need help choosing a problem statement, comparing solutions, or checking Solution feasibility? Discuss &amp; share SIH 2026 ideas with peers in our official channels.
                </p>

                <div className="space-y-2">
                  {settings.whatsappGroupLink && (
                    <a
                      href={settings.whatsappGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#1B3F8B] bg-blue-50 hover:bg-blue-100/70 border border-blue-100 transition"
                    >
                      <span>💬 Join Official WhatsApp Group</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {settings.problemStatementLink && (
                    <a
                      href={settings.problemStatementLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
                    >
                      <span>💡 Visit Official SIH PS Page</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rules & Regulations Document Card - always shown when configured */}
          {(settings.rulesDocumentLink || settings.rulesDocumentPdfUrl) && (
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/85 p-6 shadow-md hover:shadow-lg transition duration-200 border-l-4 border-l-[#C1272D]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10 text-[#C1272D] border border-red-500/15">
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950">
                    Rules &amp; Regulations
                  </h3>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Official Document
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-semibold leading-relaxed mb-4">
                {settings.rulesDocumentTitle || 'Official Rules & Regulations – Internal SIH 2026'}. Read all eligibility criteria, conduct policies, and competition guidelines before registering.
              </p>

              {settings.rulesDocumentPdfUrl ? (
                <a
                  href={settings.rulesDocumentPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="SIH2026-Rules-Regulations.pdf"
                  className="inline-flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#C1272D] bg-red-50 hover:bg-red-100/70 border border-red-100 transition"
                >
                  <span>📄 View / Download Rules PDF</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <a
                  href={settings.rulesDocumentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#C1272D] bg-red-50 hover:bg-red-100/70 border border-red-100 transition"
                >
                  <span>🔗 Open Official Rules Document</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Form Wizard or Important Information */}
        <div className={isDeadlinePassed ? 'lg:col-span-7' : 'lg:col-span-8'}>
          {isTeamLoggedIn ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Problem Statement Container */}
              <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-md hover:shadow-xl hover:border-slate-300 transition duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#C1272D] to-red-500" />
                <div className="flex items-center gap-3.5 mb-4 pl-1">
                  <div className="p-2.5 rounded-2xl bg-red-500/10 text-[#C1272D] border border-red-500/15">
                    <FileText className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950 tracking-tight">
                      SIH 2026 Problem Statements
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Official Announcement
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pl-1">
                  <p className="text-sm text-slate-650 leading-relaxed font-semibold">
                    {settings.problemStatementStatus || 'Problem statement announcements will be announced once we get update from the official SIH website.'}
                  </p>

                  {settings.problemStatementLink && (
                    <a
                      href={settings.problemStatementLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#C1272D] to-red-600 hover:from-red-655 hover:to-red-500 transition shadow-md shadow-red-500/10 transform active:scale-95 duration-200"
                    >
                      Visit Official SIH Problem Statements
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* PPT Template Container */}
              <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-md hover:shadow-xl hover:border-slate-300 transition duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#1B3F8B] to-indigo-600" />
                <div className="flex items-center gap-3.5 mb-4 pl-1">
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 text-[#1B3F8B] border border-blue-500/15">
                    <GraduationCap className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950 tracking-tight">
                      Download SIH PPT Template
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Presentation Deck Template
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pl-1">
                  <p className="text-sm text-slate-650 leading-relaxed font-semibold">
                    {settings.pptTemplateStatus || 'The template will be released soon. Download it from here.'}
                  </p>

                  <a
                    href={(settings.pptTemplateLink && settings.pptTemplateLink !== '#' && !settings.pptTemplateLink.includes('drive.google')) ? settings.pptTemplateLink : '/SIH2026-IDEA-Presentation-Format.pptx'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1B3F8B] to-blue-800 hover:from-blue-700 hover:to-indigo-800 transition shadow-md shadow-blue-500/10 transform active:scale-95 duration-200 cursor-pointer"
                  >
                    Download Template PPT
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* PPT Submission Card */}
              {settings.pptSubmissionOpen && (
                <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-md hover:shadow-xl hover:border-slate-300 transition duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#1B3F8B] to-indigo-600" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pl-1">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-blue-500/10 text-[#1B3F8B] border border-blue-500/15">
                        <FileText className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-950 tracking-tight">
                          Submit Your PPT &amp; Prototype
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Pitch Deck Submission Portal
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs self-start sm:self-auto shrink-0 whitespace-nowrap">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Portal Open
                    </span>
                  </div>

                  <div className="space-y-4 pl-1">
                    <p className="text-sm text-slate-650 leading-relaxed font-semibold">
                      {settings.pptSubmissionStatus || 'PPT submission portal is live! Submit your PowerPoint presentation file, 2-minute YouTube video pitch clip, and 20% prototype GitHub repository.'}
                    </p>

                    {settings.pptSubmissionDeadline && (
                      <div className="flex items-center gap-2 text-xs font-bold text-[#C1272D] bg-red-50 px-2.5 py-1 rounded-lg border border-red-100/55 inline-flex w-auto">
                        <Calendar className="h-3.5 w-3.5" />
                        Submission Deadline: {new Date(settings.isPptExtended && settings.pptExtendedDeadline ? settings.pptExtendedDeadline : settings.pptSubmissionDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST
                      </div>
                    )}

                    <div>
                      <button
                        onClick={() => setActiveTab('ppt-submit')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1B3F8B] to-blue-800 hover:from-blue-700 hover:to-indigo-800 transition shadow-md shadow-blue-500/10 transform active:scale-95 duration-200 cursor-pointer"
                      >
                        Submit Your PPT
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {mode === 'register' && regStep <= 3 && (
                isDeadlinePassed ? (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* CARD 1: PPT & PROTOTYPE SUBMISSION PORTAL (LIVE NOW) */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#1E3E62] to-[#000000] p-6 sm:p-8 text-white shadow-2xl border border-blue-500/25 space-y-6">
                      <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 relative z-10">
                        <div className="flex items-center gap-3.5">
                          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5 shadow-2xs">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                Submission Portal Live &amp; Open
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                              PPT &amp; 20% Prototype Submission
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed relative z-10">
                        Official Internal SIH 2026 presentation PowerPoint deck (.ppt / .pptx), 2-minute YouTube video pitch clip link, and 20% working prototype GitHub repository submission portal is now active for all registered teams!
                      </p>

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center gap-1.5 text-amber-300 font-extrabold">
                            <Clock className="h-4 w-4 animate-pulse text-amber-400" />
                            PPT Submission Deadline Closes In:
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-200 bg-white/10 px-3 py-1 rounded-xl border border-white/15 backdrop-blur-md">
                            {formatTimelineDate(settings?.pptExtendedDeadline || settings?.pptSubmissionDeadline || '')}
                          </span>
                        </div>

                        {pptTimeLeft.isExpired ? (
                          <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-800/60 text-center">
                            <span className="text-xs font-black text-red-400 uppercase tracking-wider">PPT Submission Portal Closed</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-3">
                            <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-lg">
                              <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
                                {String(pptTimeLeft.days).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] font-black text-slate-300 uppercase mt-1.5 tracking-wider">
                                Days
                              </span>
                            </div>

                            <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-lg">
                              <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
                                {String(pptTimeLeft.hours).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] font-black text-slate-300 uppercase mt-1.5 tracking-wider">
                                Hours
                              </span>
                            </div>

                            <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-lg">
                              <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
                                {String(pptTimeLeft.minutes).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] font-black text-slate-300 uppercase mt-1.5 tracking-wider">
                                Mins
                              </span>
                            </div>

                            <div className="flex flex-col items-center bg-emerald-500/25 border border-emerald-400/50 rounded-2xl p-3.5 shadow-lg">
                              <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono leading-none animate-pulse">
                                {String(pptTimeLeft.seconds).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] font-black text-emerald-400 uppercase mt-1.5 tracking-wider">
                                Secs
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 relative z-10">
                        <button
                          type="button"
                          onClick={() => setActiveTab(isTeamLoggedIn ? 'ppt-submit' : 'login')}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 transition shadow-lg shadow-emerald-500/20 transform active:scale-95 duration-200 cursor-pointer"
                        >
                          <FileText className="h-4 w-4" />
                          {isTeamLoggedIn ? 'Submit PPT & Prototype Deck →' : 'Log In & Submit PPT →'}
                        </button>

                        <a
                          href="/SIH2026-IDEA-Presentation-Format.pptx"
                          download
                          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-black text-white bg-white/10 hover:bg-white/20 border border-white/20 transition backdrop-blur-md cursor-pointer"
                        >
                          <GraduationCap className="h-4 w-4 text-amber-300" />
                          Download Template PPT
                        </a>
                      </div>
                    </div>

                    {/* CARD 2: PROBLEM STATEMENT SELECTION PHASE */}
                    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition duration-300 space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-[#1B3F8B] border border-blue-500/15 shrink-0">
                          <BookOpen className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#1B3F8B] border border-blue-200">
                              Selection Phase Active
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                            Select Your Problem Statement
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
                        Team registration is closed, and the Problem Statement Selection Phase is live! All selected team leaders must log in to their Team Portal to finalize their chosen problem statement by <strong className="text-[#C1272D]">{formatTimelineDate(settings?.psSelectionDeadline || '')}</strong>.
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setActiveTab('login')}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1B3F8B] to-blue-700 hover:from-blue-900 hover:to-indigo-800 transition shadow-md shadow-blue-900/15 transform active:scale-95 duration-200 cursor-pointer"
                        >
                          <BookOpen className="h-4 w-4" />
                          Select Problem Statement →
                        </button>

                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#C1272D] bg-red-50 px-3.5 py-2 rounded-xl border border-red-100/70">
                          <Calendar className="h-4 w-4" />
                          Selection Deadline: {formatTimelineDate(settings?.psSelectionDeadline || '').split(',')[0]}
                        </div>
                      </div>

                      {/* Inspiring quote */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 border-l-4 border-l-[#C1272D] text-left relative overflow-hidden shadow-2xs">
                        <span className="absolute -top-2 -left-1 text-slate-200/80 text-5xl font-serif select-none pointer-events-none">
                          “
                        </span>
                        <p className="text-xs italic font-bold text-slate-800 relative z-10 pl-5 leading-relaxed">
                          {settings.customQuote || "Innovation distinguishes between a leader and a follower."}
                        </p>
                        <p className="text-[10px] font-extrabold text-[#C1272D] text-right mt-1.5 uppercase tracking-wider">
                          — {settings.customQuoteAuthor || "Steve Jobs"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
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
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Enrollment Number {leader.semester !== '1' ? '*' : ''}
                                {leader.semester === '1' && <span className="text-slate-400 text-[10px] ml-1">(Optional for Sem 1)</span>}
                              </label>
                              <input
                                type="text"
                                required={leader.semester !== '1'}
                                placeholder={leader.semester === '1' ? 'Not required for Sem 1' : 'e.g. 24BEIT54001'}
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
                                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none focus:ring-2 ${leader.mobile && leader.mobile.length !== 10
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
                                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 ${leader.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim())
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
                            <div className="flex flex-col sm:flex-row gap-2">
                              {(() => {
                                const filledMembersCount = members.filter(m => m.fullName && m.fullName.trim().length > 0).length;
                                const totalFilled = 1 + filledMembersCount; // 1 for leader
                                const hasFemale = leader.gender === 'Female' || members.some(m => m.gender === 'Female' && m.fullName && m.fullName.trim().length > 0);

                                return (
                                  <>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors duration-300 flex items-center justify-center ${hasFemale ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                      {hasFemale ? '✓ Female Selected' : '✗ No Female Selected'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border flex items-center justify-center">
                                      Total: {totalFilled} / 6
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
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
                                    <label className="block text-[10px] font-bold text-slate-600">
                                      Enrollment No {member.semester !== '1' ? '*' : ''}
                                      {member.semester === '1' && <span className="text-slate-400 text-[9px] ml-1">(Optional)</span>}
                                    </label>
                                    <input
                                      type="text"
                                      required={member.semester !== '1'}
                                      placeholder={member.semester === '1' ? 'Not required for Sem 1' : 'Enrollment No'}
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
                                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-white outline-none focus:ring-2 ${member.mobile && member.mobile.length !== 10
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
                                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white outline-none focus:ring-2 ${member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())
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
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-6 py-2.5 font-bold text-xs"
                            >
                              {isSubmitting ? 'Submitting...' : 'Register Team'}
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                )
              )}

              {/* LOOKUP MODE OR PHASE 2: ADD MENTOR DETAILS */}
              {(mode === 'mentor_lookup' || regStep === 4) && (
                <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">

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
                          <span>Action Required: Add Faculty Mentor (Branch-specific)</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700">
                          Hi <strong className="font-bold text-slate-900">{verifiedTeam.leader?.fullName}</strong> (Team Leader of "{verifiedTeam.teamName}").
                          Per hackathon rules, you must assign a Faculty Mentor from their respective branch immediately to complete your registration.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mentor Form */}
                  <form onSubmit={handleMentorSubmit} className="space-y-4 animate-in fade-in duration-200 border-t border-slate-100 pt-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-amber-600" />
                      Faculty Mentor Details (from Branch/Department)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {!verifiedTeam && (
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Team Registration ID *</label>
                          <input
                            type="text"
                            required
                            placeholder="Registration ID (e.g. SIH2026-001)"
                            value={teamIdInput}
                            onChange={(e) => setTeamIdInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono uppercase outline-none font-semibold"
                          />
                        </div>
                      )}
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
                            <label className="block text-[10px] font-bold text-slate-700 mb-1">Mentor's Branch / Department *</label>
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
                              <option value="VSITR Kadi">VSITR Kadi</option>
                              <option value="VSITR Gandhinagar">VSITR Gandhinagar</option>
                            </select>
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
