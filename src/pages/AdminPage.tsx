import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Team, EventSettings, TimelineEvent, FAQItem, EmailLog } from '../types';
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
  SendHorizontal
} from 'lucide-react';

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
  const [sidebarTab, setSidebarTab] = useState<'overview' | 'teams' | 'timeline' | 'faqs' | 'settings' | 'emails'>('overview');

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
  const [editRules, setEditRules] = useState<string[]>(rules);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [ruleEditText, setRuleEditText] = useState('');
  const [newRuleText, setNewRuleText] = useState('');

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');

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
      const res = await api.testSmtp({ testRecipient: smtpTestEmail.trim() });
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

      const [statsData, teamsData, emailLogsData, settingsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminTeams({
          search: searchQuery,
          department: deptFilter,
          status: statusFilter,
        }),
        api.getEmailLogs().catch(() => ({ logs: [] })),
        api.getSettings().catch(() => ({})),
      ]);

      if (statsData.stats) setStats(statsData.stats);
      if (teamsData.teams) setTeams(teamsData.teams);
      if (emailLogsData.logs) setEmailLogs(emailLogsData.logs);
      if (settingsData.isNeon !== undefined) setIsNeonConnected(settingsData.isNeon);
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
        },
        timeline: editTimeline,
        faqs: editFaqs,
        rules: editRules,
      });

      if (res.success) {
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
    setEditRules([...editRules, newRuleText.trim()]);
    setNewRuleText('');
  };

  const handleDeleteRule = (idx: number) => {
    setEditRules(editRules.filter((_, i) => i !== idx));
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
    <div className="min-h-screen bg-[#F4F6F9] py-6 px-4 lg:px-8">
      
      {/* MAIN CONTAINER (MIRRORING THE BRINGOVA DEDICATED ADMIN DASHBOARD IMAGE LAYOUT) */}
      <div className="max-w-7xl mx-auto rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[820px]">
        
        {/* LEFT SIDEBAR NAVIGATION (Matching image layout) */}
        <div className="w-full md:w-64 bg-white border-r border-slate-100 p-5 flex flex-col justify-between shrink-0">
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
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition ${
                  sidebarTab === 'overview'
                    ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview &amp; Stats</span>
              </button>

              <button
                onClick={() => setSidebarTab('teams')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition ${
                  sidebarTab === 'teams'
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
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition ${
                  sidebarTab === 'timeline'
                    ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Timeline &amp; Schedule</span>
              </button>

              <button
                onClick={() => setSidebarTab('faqs')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition ${
                  sidebarTab === 'faqs'
                    ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                <span>FAQs &amp; Rules</span>
              </button>

              <button
                onClick={() => setSidebarTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition ${
                  sidebarTab === 'settings'
                    ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Event Settings</span>
              </button>

              <button
                onClick={() => setSidebarTab('emails')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition ${
                  sidebarTab === 'emails'
                    ? 'bg-rose-50 text-[#C1272D] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4" />
                  <span>Emails &amp; Neon DB</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                  {emailLogs.length}
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          deptFilter === d
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                          <th className="py-3.5 px-4">Team ID</th>
                          <th className="py-3.5 px-4">Team Name</th>
                          <th className="py-3.5 px-4">Leader &amp; Contact</th>
                          <th className="py-3.5 px-4">Dept</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {teams.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
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
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    Official Hackathon Rules ({editRules.length})
                  </h3>
                  <div className="space-y-2">
                    {editRules.map((r, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-800">
                          <strong className="text-[#C1272D]">Rule {idx + 1}:</strong> {r}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(idx)}
                          className="text-red-500 hover:text-red-700 p-1 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 block">+ Add New Rule</span>
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
                      value={editDeadline.slice(0, 16)}
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
                      Official WhatsApp Group Invite Link
                    </label>
                    <input
                      type="url"
                      required
                      value={editWhatsapp}
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
                      value={editBanner}
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
                        value={editProblemStatementLink}
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
                        value={editProblemStatementStatus}
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
                        value={editPptTemplateLink}
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
                        value={editPptTemplateStatus}
                        onChange={(e) => setEditPptTemplateStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:border-[#1B3F8B] outline-none"
                        placeholder="e.g. Coming soon..."
                      />
                    </div>
                  </div>
                </div>

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

                    <form onSubmit={handleTestSmtp} className="space-y-2">
                      <p className="text-xs text-slate-300">
                        Test your mail server connection and send a sample email to verify delivery:
                      </p>
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                            <th className="py-3 px-4 rounded-l-xl">Recipient</th>
                            <th className="py-3 px-4">Team ID</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
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
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  log.type === 'registration_confirmation'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {log.type === 'registration_confirmation' ? 'Member Confirmation' : 'Deadline Edit Reminder'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-800 font-semibold max-w-xs truncate" title={log.subject}>
                                {log.subject}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  log.status === 'sent'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : log.status === 'simulated'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  <CheckCircle2 className="h-3 w-3" />
                                  {log.status === 'simulated' ? 'Logged / Sent' : log.status}
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
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                selectedEmailLog.type === 'registration_confirmation'
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
