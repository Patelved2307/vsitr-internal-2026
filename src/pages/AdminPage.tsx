import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Team, EventSettings, TimelineEvent, FAQItem, EmailLog, PptSubmission, Rule, RuleCategory, ProblemStatement } from '../types';
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
  Laptop
} from 'lucide-react';

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
  const [sidebarTab, setSidebarTab] = useState<'overview' | 'teams' | 'timeline' | 'faqs' | 'settings' | 'emails' | 'ppt-submissions' | 'problem-statements'>('overview');

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

  // Active action menu for team row
  const [activeMenuTeamId, setActiveMenuTeamId] = useState<string | null>(null);

  // Selected Team Modal for Inspect / Admin Edit
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditingTeamAdmin, setIsEditingTeamAdmin] = useState(false);
  const [adminEditTeamData, setAdminEditTeamData] = useState<any>(null);
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
  const [editPptSubmissionOpen, setEditPptSubmissionOpen] = useState(settings.pptSubmissionOpen ?? false);
  const [editPptSubmissionStatus, setEditPptSubmissionStatus] = useState(settings.pptSubmissionStatus || '');
  const [editPptSubmissionDeadline, setEditPptSubmissionDeadline] = useState(settings.pptSubmissionDeadline || '');
  // Extension & custom closed message
  const [editIsExtended, setEditIsExtended] = useState(settings.isExtended ?? false);
  const [editExtendedDeadline, setEditExtendedDeadline] = useState(settings.extendedDeadline || '');
  const [editCustomQuote, setEditCustomQuote] = useState(settings.customQuote || '');
  const [editCustomQuoteAuthor, setEditCustomQuoteAuthor] = useState(settings.customQuoteAuthor || '');
  // PPT Submissions list
  const [pptSubmissions, setPptSubmissions] = useState<PptSubmission[]>([]);
  const [isLoadingPptSubmissions, setIsLoadingPptSubmissions] = useState(false);
  const [deletingPptId, setDeletingPptId] = useState<string | null>(null);

  // Editable Timeline State
  const [editTimeline, setEditTimeline] = useState<TimelineEvent[]>(timeline);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [timelineEditItem, setTimelineEditItem] = useState<{ title: string; date: string; description: string }>({
    title: '',
    date: '',
    description: '',
  });
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineDate, setNewTimelineDate] = useState('');
  const [newTimelineDesc, setNewTimelineDesc] = useState('');

  // Editable FAQs State
  const [editFaqs, setEditFaqs] = useState<FAQItem[]>(faqs);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqEditItem, setFaqEditItem] = useState<{ question: string; answer: string }>({
    question: '',
    answer: '',
  });
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Editable Rules State
  const [editRules, setEditRules] = useState<Rule[]>(rules);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleEditText, setRuleEditText] = useState('');
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<RuleCategory>('official');

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTestType, setSmtpTestType] = useState<'connection' | 'mentor_pending' | 'mentor_completed'>('connection');

  // Problem statement list management state
  const [adminPsList, setAdminPsList] = useState<ProblemStatement[]>([]);
  const [isLoadingPs, setIsLoadingPs] = useState(false);
  const [isEditingPs, setIsEditingPs] = useState(false);
  const [editingPsData, setEditingPsData] = useState<Partial<ProblemStatement> | null>(null);
  const [isCreatingPs, setIsCreatingPs] = useState(false);

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
    setEditPptSubmissionOpen(settings.pptSubmissionOpen ?? false);
    setEditPptSubmissionStatus(settings.pptSubmissionStatus || '');
    setEditPptSubmissionDeadline(settings.pptSubmissionDeadline || '');
    setEditIsExtended(settings.isExtended ?? false);
    setEditExtendedDeadline(settings.extendedDeadline || '');
    setEditCustomQuote(settings.customQuote || '');
    setEditCustomQuoteAuthor(settings.customQuoteAuthor || '');
    setEditTimeline(timeline);
    setEditFaqs(faqs);
    setEditRules(rules);
  }, [settings, timeline, faqs, rules]);

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
          isExtended: editIsExtended,
          extendedDeadline: editExtendedDeadline,
          customQuote: editCustomQuote,
          customQuoteAuthor: editCustomQuoteAuthor,
        },
        timeline: updatedTimeline,
        faqs: updatedFaqs,
        rules: editRules,
      });

      if (res.success) {
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
    setTimelineEditItem({ title: item.title, date: item.date, description: item.description });
  };

  const handleSaveTimelineItem = (id: string) => {
    setEditTimeline(
      editTimeline.map((item) =>
        item.id === id
          ? { ...item, ...timelineEditItem }
          : item
      )
    );
    setEditingTimelineId(null);
  };

  const handleAddTimeline = () => {
    if (!newTimelineTitle.trim() || !newTimelineDate.trim()) return;
    const newItem: TimelineEvent = {
      id: `t_${Date.now()}`,
      title: newTimelineTitle.trim(),
      date: newTimelineDate.trim(),
      description: newTimelineDesc.trim(),
      active: true,
    };
    setEditTimeline([...editTimeline, newItem]);
    setNewTimelineTitle('');
    setNewTimelineDate('');
    setNewTimelineDesc('');
  };

  const handleDeleteTimelineItem = (id: string) => {
    setEditTimeline(editTimeline.filter((t) => t.id !== id));
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

  // Export CSV
  const handleExportCSV = () => {
    window.open('/api/export/csv', '_blank');
  };

  // LOGIN SCREEN FOR ADMIN
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 bg-[#F8FAFC] relative">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
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
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
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
                    placeholder="e.g. admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#C1272D] outline-none transition font-medium"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#C1272D] outline-none transition font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#C1272D] to-red-700 hover:opacity-95 shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col md:flex-row">

      {/* LEFT SIDEBAR NAVIGATION (Matching image layout) */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">

          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#C1272D] to-rose-500 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                SIH Admin
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                VSITR 2026
              </span>
            </div>
          </div>

          {/* Nav Menu Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setSidebarTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition ${sidebarTab === 'overview'
                  ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview &amp; Stats</span>
            </button>

            <button
              onClick={() => setSidebarTab('teams')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition ${sidebarTab === 'teams'
                  ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span>Team Registry</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {teams.length}
              </span>
            </button>

            <button
              onClick={() => setSidebarTab('timeline')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition ${sidebarTab === 'timeline'
                  ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Clock className="h-4 w-4" />
              <span>Timeline &amp; Schedule</span>
            </button>

            <button
              onClick={() => setSidebarTab('faqs')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition ${sidebarTab === 'faqs'
                  ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>FAQs &amp; Rules</span>
            </button>

            <button
              onClick={() => setSidebarTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition ${sidebarTab === 'settings'
                  ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Settings className="h-4 w-4" />
              <span>Event Settings</span>
            </button>

            <button
              onClick={() => setSidebarTab('emails')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition ${sidebarTab === 'emails'
                  ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <span>Emails &amp; </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                {emailLogs.length}
              </span>
            </button>

            <button
              onClick={async () => { setSidebarTab('ppt-submissions'); setIsLoadingPptSubmissions(true); try { const d = await api.getAdminPptSubmissions(); setPptSubmissions(d.submissions || []); } catch (e) { } finally { setIsLoadingPptSubmissions(false); } }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition ${sidebarTab === 'ppt-submissions'
                  ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" />
                <span>PPT Submissions</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                {pptSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setSidebarTab('problem-statements')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition ${sidebarTab === 'problem-statements'
                  ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4" />
                <span>Problem Statements</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                {adminPsList.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Action: Status Toggle & Logout */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          {/* Quick Registration Mode Toggle (Matching 'Busy Mode' in reference image) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                Registration
              </span>
              <span className={`text-[10px] font-extrabold block ${editIsOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                {editIsOpen ? 'Live & Open' : 'Closed'}
              </span>
            </div>
            <button
              onClick={handleToggleRegistration}
              className={`p-1 rounded-full transition ${editIsOpen ? 'text-emerald-600' : 'text-slate-300'}`}
              title="Toggle Registration Open/Closed"
            >
              {editIsOpen ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
            </button>
          </div>

          <button
            onClick={() => setActiveTab('home')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#1B3F8B] hover:bg-blue-50 transition"
          >
            <LayoutDashboard className="h-4 w-4 text-[#1B3F8B]" />
            <span>Go to Main Website</span>
          </button>

          <button
            onClick={logoutAdminSession}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out Admin</span>
          </button>
        </div>
      </div>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 bg-[#FAFAFC] p-6 lg:p-8 flex flex-col justify-between overflow-y-auto">

        <div className="space-y-6">
          {/* TOP HEADER BAR (Matching reference image) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">

            {/* Search Bar Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search team, leader, enrollment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-[#C1272D] shadow-2xs"
              />
            </div>

            {/* Status Indicator & Admin Profile */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-700">
                <span className={`h-2 w-2 rounded-full ${editIsOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {editIsOpen ? 'Open For Registration' : 'Registration Closed'}
              </div>

              <button
                onClick={loadAdminData}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition"
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="h-9 w-9 rounded-full bg-[#1B3F8B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
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

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Registration Overview
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Real-time internal hackathon metrics, gender ratio &amp; departmental stats.
                  </p>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>

              {/* Stat KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Total Teams
                  </span>
                  <span className="text-3xl font-black text-[#C1272D] block">
                    {stats.totalTeams}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    6 members per team
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
                    className="text-[11px] font-bold text-amber-700 hover:underline block"
                  >
                    Remind {stats.pendingMentorCount} Pending →
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="py-2.5">Team</th>
                          <th className="py-2.5">PS ID</th>
                          <th className="py-2.5">PS Title</th>
                          <th className="py-2.5">Selected At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {teams
                          .filter(t => t.selectedPsId)
                          .map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50">
                              <td className="py-2 font-bold text-slate-900">
                                {t.teamName} <span className="text-[10px] text-slate-400 font-mono">({t.id})</span>
                              </td>
                              <td className="py-2 font-mono font-black text-[#C1272D]">{t.selectedPsId}</td>
                              <td className="py-2 font-semibold text-slate-800">{t.selectedPsTitle}</td>
                              <td className="py-2 text-slate-500 font-semibold">
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

          {/* TAB 2: TEAM REGISTRY (Matching reference image table style with clean cards/rows) */}
          {sidebarTab === 'teams' && (
            <div className="space-y-4 animate-in fade-in duration-200">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Team Registry
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    All registered 6-member teams. Click inspect or use actions to edit/delete.
                  </p>
                </div>

                {/* Department Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['ALL', 'IT', 'CSE', 'CE'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDeptFilter(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${deptFilter === d
                          ? 'bg-[#C1272D] text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {d === 'ALL' ? 'All Depts' : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teams List Table (Styled like Bringova Order History table in reference) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-auto max-h-[550px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                      <tr className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4 bg-slate-50">Team ID</th>
                        <th className="py-3.5 px-4 bg-slate-50">Team Name</th>
                        <th className="py-3.5 px-4 bg-slate-50">Leader &amp; Contact</th>
                        <th className="py-3.5 px-4 bg-slate-50">Dept</th>
                        <th className="py-3.5 px-4 bg-slate-50">Status</th>
                        <th className="py-3.5 px-4 bg-slate-50">PS Selected</th>
                        <th className="py-3.5 px-4 text-right bg-slate-50">Action</th>
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
                          <tr key={t.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#1B3F8B]">
                              {t.id}
                            </td>
                            <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                              {t.teamName}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block">{t.leader.fullName}</span>
                              <span className="text-[11px] text-slate-500 block">{t.leader.email}</span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#1B3F8B]">
                              {t.leader.department} • Sem {t.leader.semester}
                            </td>
                            <td className="py-3.5 px-4">
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
                            <td className="py-3.5 px-4">
                              {t.selectedPsId ? (
                                <div>
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 block w-fit mb-0.5">
                                    {t.selectedPsId}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-semibold">{t.selectedPsTitle || '—'}</span>
                                </div>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                                  Not Selected
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right relative">
                              <button
                                onClick={() => setSelectedTeam(t)}
                                className="px-3 py-1.5 rounded-xl font-bold text-xs text-[#1B3F8B] bg-blue-50 hover:bg-blue-100 transition mr-1"
                              >
                                Inspect / Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirmTeam(t)}
                                className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 transition"
                                title="Delete Team"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Directly add, update, or remove hackathon event milestone dates.
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] shadow-md hover:opacity-95 transition"
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
                            className="p-2 rounded-xl border border-slate-300 font-bold"
                          />
                          <input
                            type="text"
                            value={timelineEditItem.date}
                            onChange={(e) => setTimelineEditItem({ ...timelineEditItem, date: e.target.value })}
                            className="p-2 rounded-xl border border-slate-300 font-bold"
                          />
                        </div>
                        <textarea
                          value={timelineEditItem.description}
                          onChange={(e) => setTimelineEditItem({ ...timelineEditItem, description: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-300"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTimelineId(null)}
                            className="px-3 py-1 rounded-xl bg-slate-100 font-bold text-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveTimelineItem(item.id)}
                            className="px-4 py-1 rounded-xl bg-[#1B3F8B] text-white font-bold"
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
                              {item.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEditTimeline(item)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTimelineItem(item.id)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
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
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Date & Time string (e.g. 10 Aug 2026, 11:00 AM)"
                    value={newTimelineDate}
                    onChange={(e) => setNewTimelineDate(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Event Description / Notes"
                    value={newTimelineDesc}
                    onChange={(e) => setNewTimelineDesc(e.target.value)}
                    className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTimeline}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-black shadow-xs transition"
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
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Edit rules and frequently asked questions displayed to students.
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] shadow-md hover:opacity-95 transition"
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
                      className="text-red-500 hover:text-red-700 p-1 shrink-0"
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
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                  <textarea
                    placeholder="Answer text..."
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white"
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
                                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRule(r.id, 'down')}
                                disabled={idx === catRules.length - 1}
                                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(r.id)}
                                className="text-red-500 hover:text-red-700 p-1 ml-1"
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
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-medium"
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
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white"
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
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configure registration cutoff dates, links &amp; live announcement banner.
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] shadow-md hover:opacity-95 transition"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-[#C1272D] outline-none"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold outline-none"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold outline-none"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-[#C1272D] outline-none"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
                      placeholder="e.g. Coming soon..."
                    />
                  </div>
                </div>

                {/* PPT Submission Settings */}
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 space-y-4">
                  <h3 className="text-xs font-extrabold text-[#C1272D] uppercase tracking-wider">PPT Submission Portal Control</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Submission Portal Status</label>
                      <select
                        value={editPptSubmissionOpen ? 'true' : 'false'}
                        onChange={(e) => setEditPptSubmissionOpen(e.target.value === 'true')}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold outline-none"
                      >
                        <option value="true">OPEN — Teams Can Submit PPTs</option>
                        <option value="false">CLOSED — Submission Not Allowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Submission Deadline (display text)</label>
                      <input
                        type="text"
                        value={editPptSubmissionDeadline || ''}
                        onChange={(e) => setEditPptSubmissionDeadline(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#C1272D] outline-none"
                        placeholder="e.g. 08 August 2026, 11:59 PM"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Submission Status Message (shown on card)</label>
                    <textarea
                      rows={2}
                      value={editPptSubmissionStatus || ''}
                      onChange={(e) => setEditPptSubmissionStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#C1272D] outline-none resize-none"
                      placeholder="e.g. PPT submission portal is now open..."
                    />
                  </div>
                </div>
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
                    PPT Submissions
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    All team pitch deck submissions. Click the link to view the shared presentation.
                  </p>
                </div>
                <button
                  onClick={async () => { setIsLoadingPptSubmissions(true); try { const d = await api.getAdminPptSubmissions(); setPptSubmissions(d.submissions || []); } catch (e) { } finally { setIsLoadingPptSubmissions(false); } }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs text-white bg-[#1B3F8B] hover:bg-blue-900 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPptSubmissions ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {isLoadingPptSubmissions ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pptSubmissions.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No PPT submissions yet.</p>
                  <p className="text-xs mt-1">Submissions will appear here once teams submit their presentations.</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200 overflow-auto max-h-[500px] shadow-xs">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
                      <tr className="text-left font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 bg-slate-50">Team ID</th>
                        <th className="py-3 px-4 bg-slate-50">Team Name</th>
                        <th className="py-3 px-4 bg-slate-50">Leader</th>
                        <th className="py-3 px-4 bg-slate-50">PPT Link</th>
                        <th className="py-3 px-4 bg-slate-50">Submitted</th>
                        <th className="py-3 px-4 bg-slate-50 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pptSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#1B3F8B]">{sub.teamId}</td>
                          <td className="py-3.5 px-4 font-black text-slate-900">{sub.teamName}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{sub.leaderName}</span>
                            <span className="text-[11px] text-slate-500">{sub.leaderEmail}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <a
                              href={sub.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            >
                              View PPT →
                            </a>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={async () => {
                                if (!confirm(`Delete submission from ${sub.teamId}?`)) return;
                                setDeletingPptId(sub.id);
                                try {
                                  await api.deletePptSubmission(sub.id);
                                  setPptSubmissions(prev => prev.filter(s => s.id !== sub.id));
                                } catch (e: any) {
                                  showAlert('Error', e.message || 'Could not delete submission.');
                                } finally {
                                  setDeletingPptId(null);
                                }
                              }}
                              disabled={deletingPptId === sub.id}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                              title="Delete submission"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PROBLEM STATEMENTS CRUD PANEL */}
          {sidebarTab === 'problem-statements' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Problem Statement Manager
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Create, edit, close, and delete institute-level problem statements for student selection.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingPsData({ id: '', title: '', category: 'Software', description: '', status: 'open' });
                    setIsCreatingPs(true);
                    setIsEditingPs(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-[#C1272D] hover:bg-red-700 shadow-md transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Problem Statement
                </button>
              </div>

              {/* Problem Statement List table */}
              {isLoadingPs ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : adminPsList.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No Problem Statements found.</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200 overflow-auto max-h-[600px] shadow-xs">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
                      <tr className="text-left font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 bg-slate-50">ID</th>
                        <th className="py-3 px-4 bg-slate-50">Title</th>
                        <th className="py-3 px-4 bg-slate-50">Category</th>
                        <th className="py-3 px-4 bg-slate-50">Status</th>
                        <th className="py-3 px-4 bg-slate-50 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {adminPsList.map((ps) => (
                        <tr key={ps.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#1B3F8B]">{ps.id}</td>
                          <td className="py-3.5 px-4 font-black text-slate-900 max-w-sm truncate">{ps.title}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">{ps.category}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${ps.status === 'open'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                              {ps.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingPsData(ps);
                                setIsEditingPs(true);
                                setIsCreatingPs(false);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition inline-block cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePs(ps.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition inline-block cursor-pointer"
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
              )}

              {/* MODAL: CREATE / EDIT PROBLEM STATEMENT */}
              {(isCreatingPs || isEditingPs) && editingPsData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
                  <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
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
                        className="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition cursor-pointer"
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
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] disabled:opacity-50"
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
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block">Category <span className="text-red-500">*</span></label>
                          <select
                            value={editingPsData.category || 'Software'}
                            onChange={(e) => setEditingPsData({ ...editingPsData, category: e.target.value as any })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] bg-white"
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
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] bg-white"
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
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#C1272D] resize-none"
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
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Monitor automated team member registration notifications and trigger deadline edit emails.
                  </p>
                </div>

                <button
                  onClick={handleTriggerDeadlineReminders}
                  disabled={isSendingDeadlineReminders}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#C1272D] to-amber-600 shadow-md hover:opacity-95 transition disabled:opacity-50 shrink-0"
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
                      className="px-3 py-1.5 rounded-xl font-extrabold text-[11px] text-white bg-[#1B3F8B] hover:bg-blue-900 shadow-xs flex items-center gap-1.5 transition"
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
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-1.5 transition"
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
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingEmailLogs ? 'animate-spin' : ''}`} />
                    Refresh Logs
                  </button>
                </div>

                {emailLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No emails logged yet. Register a team or click "Send Registration Deadline Edit Reminder" above to test automated email dispatching.
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[500px] border border-slate-200/60 rounded-2xl shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                        <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-4 bg-slate-50">Recipient</th>
                          <th className="py-3.5 px-4 bg-slate-50">Team ID</th>
                          <th className="py-3.5 px-4 bg-slate-50">Type</th>
                          <th className="py-3.5 px-4 bg-slate-50">Subject</th>
                          <th className="py-3.5 px-4 bg-slate-50">Status</th>
                          <th className="py-3.5 px-4 bg-slate-50">Timestamp</th>
                          <th className="py-3.5 px-4 text-right bg-slate-50">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {emailLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {log.recipientName}
                              <span className="block text-[11px] font-normal text-slate-500 font-mono">
                                {log.recipientEmail}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-[#1B3F8B]">
                              {log.teamId || 'N/A'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${log.type === 'registration_confirmation'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                {log.type === 'registration_confirmation' ? 'Member Confirmation' : 'Deadline Edit Reminder'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-800 font-semibold max-w-[180px] truncate" title={log.subject}>
                              {log.subject}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${log.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'simulated'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                <CheckCircle2 className="h-3 w-3" />
                                {log.status === 'simulated' ? 'Simulated (No SMTP)' : log.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-slate-500">
                              {new Date(log.sentAt).toLocaleString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-right flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleResendEmail(log.id)}
                                disabled={resendingEmailId === log.id}
                                className="px-2.5 py-1.5 rounded-xl bg-[#1B3F8B] hover:bg-blue-900 text-white font-bold text-[11px] transition flex items-center gap-1 shadow-2xs"
                                title="Resend email to recipient"
                              >
                                <SendHorizontal className={`h-3 w-3 ${resendingEmailId === log.id ? 'animate-spin' : ''}`} />
                                {resendingEmailId === log.id ? 'Sending...' : 'Resend'}
                              </button>
                              <button
                                onClick={() => setSelectedEmailLog(log)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                              >
                                View Body
                              </button>
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

        </div>

        {/* FOOTER BAR INSIDE DASHBOARD */}
        <div className="pt-6 mt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium gap-2">
          <span>VSITR Internal SIH 2026 Control Center</span>
          <span>Research, Coding, Design &amp; Soft Skills Clubs</span>
        </div>

      </div>

      {/* INSPECT TEAM MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full font-mono font-bold bg-[#1B3F8B] text-white text-xs">
                {selectedTeam.id}
              </span>
              <h2 className="text-lg font-black text-slate-900">
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
                  <div key={i} className="p-2.5 rounded-xl bg-slate-100 border text-slate-800 space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{m.fullName} {m.isLeader ? '(Leader)' : ''}</span>
                      <span className="text-[#1B3F8B]">{m.department} • Sem {m.semester}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">Enr: {m.enrollmentNo} | {m.gender}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedTeam.mentor ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
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
                No Problem Statement Selected Yet
              </div>
            )}


            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmTeam(selectedTeam)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition"
              >
                Delete Team
              </button>
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-red-200 text-slate-800">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold">Confirm Delete Team</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to permanently delete team <strong className="text-slate-900">"{deleteConfirmTeam.teamName}"</strong> ({deleteConfirmTeam.id})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setDeleteConfirmTeam(null)}
                className="px-4 py-2 rounded-xl font-bold bg-slate-100 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTeam(deleteConfirmTeam.id)}
                className="px-4 py-2 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL BODY INSPECTOR MODAL */}
      {selectedEmailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedEmailLog(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${selectedEmailLog.type === 'registration_confirmation'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
                }`}>
                {selectedEmailLog.type === 'registration_confirmation' ? 'Member Confirmation' : 'Deadline Edit Reminder'}
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

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-700">
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1B3F8B] text-white hover:bg-blue-900 flex items-center gap-1.5 shadow-xs"
              >
                <SendHorizontal className={`h-3.5 w-3.5 ${resendingEmailId === selectedEmailLog.id ? 'animate-spin' : ''}`} />
                {resendingEmailId === selectedEmailLog.id ? 'Resending Email...' : 'Resend Email Now'}
              </button>
              <button
                onClick={() => setSelectedEmailLog(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
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
