import { EventSettings, FAQItem, Team, TimelineEvent, Rule } from '../types';

export const api = {
  // Fetch site settings, FAQs, rules, and timeline
  getSettings: async () => {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load portal settings');
    return res.json();
  },

  // Check Team Name Availability
  checkTeamName: async (name: string) => {
    const res = await fetch(`/api/teams/check-name?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to check team name availability');
    }
    return data;
  },

  // Team Registration (Phase 1)
  registerTeam: async (payload: {
    teamName: string;
    leader: any;
    members: any[];
  }) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  // Team Login
  loginTeam: async (payload: {
    teamId: string;
    teamName: string;
    leaderEmail: string;
  }) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  },

  // Verify Team ID
  verifyTeam: async (teamId: string) => {
    const res = await fetch(`/api/teams/verify/${encodeURIComponent(teamId)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Team ID not found');
    }
    return data;
  },

  // Submit Mentor Details (Phase 2)
  submitMentor: async (payload: { teamId: string; mentor: any }) => {
    const res = await fetch('/api/mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit mentor details');
    }
    return data;
  },

  // Update Team Details (Self-Service)
  updateTeamSelf: async (payload: {
    teamId: string;
    teamName: string;
    leaderEmail: string;
    leader?: any;
    members?: any[];
    mentor?: any;
  }) => {
    const res = await fetch('/api/teams/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update team details');
    }
    return data;
  },

  // Submit PPT Presentation & Prototype (Phase 3)
  submitPpt: async (payload: {
    teamId: string;
    leaderEmail: string;
    teamName?: string;
    leaderName?: string;
    fileUrl?: string;
    note?: string;
    pptFileName?: string;
    pptFileBase64?: string;
    demoVideoUrl?: string;
    githubRepoUrl?: string;
    githubCollaboratorsAdded?: boolean;
  }) => {
    const res = await fetch('/api/teams/submit-ppt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit PPT presentation');
    }
    return data;
  },

  // Admin Login
  adminLogin: async (credentials: { username: string; password: string }) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Admin authentication failed');
    }
    return data;
  },

  // Update Settings (Admin)
  updateSettings: async (payload: {
    settings?: Partial<EventSettings>;
    timeline?: TimelineEvent[];
    faqs?: FAQItem[];
    rules?: Rule[];
  }) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update settings');
    }
    return data;
  },

  uploadRulesPdf: async (fileName: string, fileBase64: string) => {
    const res = await fetch('/api/admin/rules-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName, fileBase64 }) });
    const responseText = await res.text();
    let data: any;
    try { data = JSON.parse(responseText); } catch { throw new Error('The upload service returned an invalid response. Please use the PDF Link option or contact the site administrator.'); }
    if (!res.ok) throw new Error(data.message || 'Failed to upload rules PDF');
    return data;
  },

  // Admin Teams List
  getAdminTeams: async (params?: {
    search?: string;
    department?: string;
    status?: string;
    semester?: string;
    gender?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/admin/teams?${query}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch teams');
    }
    return data;
  },

  // Admin Stats
  getAdminStats: async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch statistics');
    }
    return data;
  },

  // Admin Update Team
  updateTeamAdmin: async (id: string, teamData: Partial<Team>) => {
    const res = await fetch(`/api/admin/teams/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update team');
    }
    return data;
  },

  // Admin Delete Team
  deleteTeamAdmin: async (id: string) => {
    const res = await fetch(`/api/admin/teams/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete team');
    }
    return data;
  },

  // Admin Trigger Deadline Reminder Emails to Team Leaders
  triggerDeadlineReminders: async () => {
    const res = await fetch('/api/admin/trigger-deadline-reminders', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to trigger deadline reminders');
    }
    return data;
  },

  // Admin Get Email Dispatch Logs
  getEmailLogs: async () => {
    const res = await fetch('/api/admin/email-logs');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch email logs');
    }
    return data;
  },

  // Admin Resend Email
  resendEmail: async (emailId: string) => {
    const res = await fetch('/api/admin/emails/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to resend email');
    }
    return data;
  },

  // Admin Test SMTP Configuration
  testSmtp: async (smtpConfig: { host?: string; port?: number; user?: string; pass?: string; from?: string; testRecipient?: string }) => {
    const res = await fetch('/api/admin/smtp/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpConfig),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'SMTP Test failed');
    }
    return data;
  },

  // DB Status & Sync
  getDbStatus: async () => {
    const res = await fetch('/api/db/status');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch database status');
    }
    return data;
  },

  syncDb: async () => {
    const res = await fetch('/api/db/init', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to sync database');
    }
    return data;
  },

  // Admin Send Bulk Reminders
  sendBulkReminders: async () => {
    const res = await fetch('/api/admin/bulk-reminder', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send bulk reminders');
    }
    return data;
  },

  // Admin: Get all PPT submissions
  getAdminPptSubmissions: async () => {
    const res = await fetch('/api/admin/ppt-submissions');
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch PPT submissions');
    return data;
  },

  // Admin: Delete PPT submission
  deletePptSubmission: async (id: string) => {
    const res = await fetch(`/api/admin/ppt-submissions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete PPT submission');
    return data;
  },

  // Problem Statements
  getProblemStatements: async () => {
    const res = await fetch('/api/problem-statements');
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load problem statements');
    return data;
  },

  selectProblemStatement: async (payload: { teamId: string; psId: string; psTitle: string }) => {
    const res = await fetch('/api/teams/select-ps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit problem statement selection');
    return data;
  },

  createProblemStatement: async (payload: any) => {
    const res = await fetch('/api/problem-statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create problem statement');
    return data;
  },

  updateProblemStatement: async (id: string, payload: any) => {
    const res = await fetch(`/api/problem-statements/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update problem statement');
    return data;
  },

  deleteProblemStatement: async (id: string) => {
    const res = await fetch(`/api/problem-statements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete problem statement');
    return data;
  },
};
