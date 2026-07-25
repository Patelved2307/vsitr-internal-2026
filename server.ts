import dotenv from 'dotenv';
import fs from 'fs';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { EventSettings, FAQItem, Team, TimelineEvent } from './src/types.js';
import { CLUB_COORDINATORS } from './src/data/initialData.js';

// Load environment variables strictly from .env (never from .env.example,
// which is meant to be a safe-to-commit template, not a secrets source)
dotenv.config({ path: '.env' });
import {
  initDatabase,
  isUsingNeon,
  getGlobalConfig,
  saveGlobalConfig,
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getEmailLogs,
  getNextTeamNumber,
  createPptSubmission,
  getAllPptSubmissions,
  deletePptSubmission,
} from './src/db/neonDb.js';
import {
  dispatchTeamRegistrationEmails,
  dispatchDeadlineReminderToLeader,
  sendEmail,
  resendEmailLog,
  resetTransporter,
} from './src/services/emailService.js';

const PORT = 3000;

async function startServer() {
  // Initialize Neon PostgreSQL Database or fallback to JSON file
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const generateTeamId = (num: number) => {
    return `SIH2026-${num.toString().padStart(3, '0')}`;
  };

  const getAppUrl = (req: Request) => {
    if (process.env.APP_URL) return process.env.APP_URL;
    return `${req.protocol}://${req.get('host')}`;
  };

  // API Endpoints

  // DB Status & Manual Init
  app.get('/api/db/status', async (req: Request, res: Response) => {
    try {
      const isNeon = isUsingNeon();
      const teams = await getAllTeams();
      res.json({
        success: true,
        isNeonConnected: isNeon,
        teamCount: teams.length,
        tables: ['app_config', 'teams', 'members', 'mentors', 'email_logs'],
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/db/init', async (req: Request, res: Response) => {
    try {
      await initDatabase();
      const isNeon = isUsingNeon();
      const teams = await getAllTeams();
      res.json({
        success: true,
        message: 'Database initialized and synced successfully!',
        isNeonConnected: isNeon,
        teamCount: teams.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 1. Get Settings & Event Info
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const config = await getGlobalConfig();
      res.json({
        settings: config.settings,
        timeline: config.timeline,
        faqs: config.faqs,
        rules: config.rules,
        clubCoordinators: CLUB_COORDINATORS,
        isNeon: isUsingNeon(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 1.5 Update Settings & Event Info (Admin)
  app.put('/api/settings', async (req: Request, res: Response) => {
    try {
      const { settings, timeline, faqs, rules } = req.body;
      
      const payload: any = {};
      if (settings) payload.settings = settings;
      if (timeline) payload.timeline = timeline;
      if (faqs) payload.faqs = faqs;
      if (rules) payload.rules = rules;

      await saveGlobalConfig(payload);

      res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 2. Admin Login
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const ADMIN_USER = process.env.ADMIN_USERNAME || 'sih_admin_vsitr';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'Sih!2026@SecureAdmin';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.json({ success: true, token: 'sih-admin-secret-token-2026', adminName: 'VSITR SIH Admin' });
    }
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
  });

  // 3. Update Settings (Admin)
  app.put('/api/settings', async (req: Request, res: Response) => {
    try {
      const { settings, timeline, faqs, rules } = req.body;
      const updatedConfig = await saveGlobalConfig({ settings, timeline, faqs, rules });
      res.json({
        success: true,
        settings: updatedConfig.settings,
        timeline: updatedConfig.timeline,
        faqs: updatedConfig.faqs,
        rules: updatedConfig.rules,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3.5 Check Team Name Availability
  app.get('/api/teams/check-name', async (req: Request, res: Response) => {
    try {
      const name = req.query.name;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, message: 'Team name is required.' });
      }
      const trimmed = name.trim().toLowerCase();
      const existingTeams = await getAllTeams();
      const exists = existingTeams.some((t) => t.teamName.toLowerCase() === trimmed);
      res.json({ success: true, exists });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Register Team (Phase 1)
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const config = await getGlobalConfig();
      const existingTeams = await getAllTeams();

      // Check registration deadline & switch
      const now = new Date();
      const deadline = new Date(config.settings.registrationDeadline);
      if (!config.settings.isRegistrationOpen || now > deadline) {
        return res.status(400).json({
          success: false,
          message: 'Registrations are currently closed for Internal SIH 2026.',
        });
      }

      const { teamName, leader, members } = req.body;

      if (!teamName || !teamName.trim()) {
        return res.status(400).json({ success: false, message: 'Team Name is required.' });
      }

      const cleanTeamName = teamName.trim();
      if (cleanTeamName.length < 3 || cleanTeamName.length > 200) {
        return res.status(400).json({
          success: false,
          title: 'Invalid Team Name',
          message: 'Team name must be between 3 and 200 characters long.',
        });
      }

      const lowerName = cleanTeamName.toLowerCase();

      // Rule 5: Team Name check
      if (lowerName.includes('vsitr') || lowerName.includes('vidush somany') || lowerName.includes('vidushsomany')) {
        return res.status(400).json({
          success: false,
          message: 'Team name must NOT contain the institute name ("VSITR" or "Vidush Somany") per Rule 5.',
        });
      }

      const existingNameTeam = existingTeams.find((t) => t.teamName.toLowerCase() === lowerName);
      if (existingNameTeam) {
        return res.status(400).json({
          success: false,
          title: 'Team Name Already Exists',
          message: 'This team name has already been registered. Please choose another unique team name.',
        });
      }

      // Check 6 members (1 leader + 5 members)
      if (!leader || !Array.isArray(members) || members.length !== 5) {
        return res.status(400).json({
          success: false,
          title: 'Registration Incomplete',
          message: 'Each team must consist of exactly 6 members, including the Team Leader.',
        });
      }

      const allMembers = [leader, ...members];

      for (let i = 0; i < allMembers.length; i++) {
        const m = allMembers[i];
        if (!m.fullName || !m.enrollmentNo || !m.mobile || !m.email || !m.department || !m.semester || !m.gender) {
          return res.status(400).json({
            success: false,
            title: 'Missing Member Information',
            message: `Please complete all details for member ${i + 1} (${m.fullName || 'Member'}).`,
          });
        }
      }

      // Department check
      const validDepts = ['IT', 'CSE', 'CE'];
      for (const m of allMembers) {
        if (!validDepts.includes(m.department)) {
          return res.status(400).json({
            success: false,
            title: 'Invalid Department',
            message: 'Departments must be IT, CSE, or CE only.',
          });
        }
      }

      // Rule 2: At least 1 female participant across team
      const femaleCount = allMembers.filter((m) => m.gender === 'Female').length;
      if (femaleCount < 1) {
        return res.status(400).json({
          success: false,
          title: 'Registration Failed',
          message: 'Every team must include at least one female participant. Please add the details of a female member before submitting the registration.',
        });
      }

      // Duplicate enrollment check WITHIN team
      const enrollmentsInTeam = allMembers.map((m) => m.enrollmentNo.trim().toUpperCase());
      const uniqueInTeam = new Set(enrollmentsInTeam);
      if (uniqueInTeam.size !== enrollmentsInTeam.length) {
        return res.status(400).json({
          success: false,
          title: 'Duplicate Entry',
          message: 'This enrollment number has been entered more than once in your team.',
        });
      }

      // Duplicate member name check WITHIN team
      const memberNames = allMembers.map((m) => m.fullName.trim().toLowerCase());
      if (new Set(memberNames).size !== memberNames.length) {
        return res.status(400).json({
          success: false,
          title: 'Duplicate Member Name',
          message: 'Each team member must have a unique name. Duplicate names are not allowed within the team.',
        });
      }

      // Duplicate enrollment check ACROSS existing teams
      const registeredEnrollments = new Map<string, string>();
      existingTeams.forEach((t) => {
        [t.leader, ...t.members].forEach((m) => {
          registeredEnrollments.set(m.enrollmentNo.trim().toUpperCase(), t.teamName);
        });
      });

      for (const enr of enrollmentsInTeam) {
        if (registeredEnrollments.has(enr)) {
          return res.status(400).json({
            success: false,
            title: 'Participant Already Registered',
            message: `The enrollment number ${enr} has already been registered with team "${registeredEnrollments.get(enr)}".`,
          });
        }
      }

      // Validate Mobile & Email format
      for (const m of allMembers) {
        if (!/^\d{10}$/.test(m.mobile.trim())) {
          return res.status(400).json({
            success: false,
            title: 'Invalid Mobile Number',
            message: `Please enter a valid 10-digit mobile number for ${m.fullName}.`,
          });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
          return res.status(400).json({
            success: false,
            title: 'Invalid Email Address',
            message: `Please enter a valid email address for ${m.fullName}.`,
          });
        }
      }

      const teamNumber = await getNextTeamNumber();
      const teamId = generateTeamId(teamNumber);

      const formattedLeader = { ...leader, isLeader: true };
      const formattedMembers = members.map((m: any) => ({ ...m, isLeader: false }));

      const newTeam: Team = {
        id: teamId,
        teamName: cleanTeamName,
        leader: formattedLeader,
        members: formattedMembers,
        status: 'pending_mentor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createTeam(newTeam);

      // EMAIL DISPATCH: Send confirmation email to ALL 6 TEAM MEMBERS
      const appUrl = getAppUrl(req);
      dispatchTeamRegistrationEmails(newTeam, appUrl).catch((e) =>
        console.error('Background email dispatch error:', e)
      );

      res.json({
        success: true,
        teamId,
        teamName: cleanTeamName,
        leaderEmail: formattedLeader.email,
        team: newTeam,
      });
    } catch (err: any) {
      console.error('Error during registration:', err);
      res.status(500).json({ success: false, message: err.message || 'Server error during team registration.' });
    }
  });

  // 5. Team Login
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { teamId, teamName, leaderEmail } = req.body;

      if (!teamId || !teamName || !leaderEmail) {
        return res.status(400).json({
          success: false,
          message: 'Please provide Team ID, Team Name, and Team Leader Email.',
        });
      }

      const tId = teamId.trim().toUpperCase();
      const tName = teamName.trim().toLowerCase();
      const lEmail = leaderEmail.trim().toLowerCase();

      const existingTeams = await getAllTeams();
      const team = existingTeams.find(
        (t) =>
          t.id.toUpperCase() === tId &&
          t.teamName.toLowerCase() === tName &&
          t.leader.email.toLowerCase() === lEmail
      );

      if (!team) {
        return res.status(401).json({
          success: false,
          title: 'Login Failed',
          message: 'The details you entered do not match our records. Please check your Team ID, Team Name, and Team Leader Email and try again.',
        });
      }

      res.json({ success: true, team });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5b. Team Update Details (Self-Service Edit)
  app.put('/api/teams/update', async (req: Request, res: Response) => {
    try {
      const { teamId, teamName, leaderEmail, leader, members, mentor } = req.body;

      if (!teamId || !teamName || !leaderEmail) {
        return res.status(400).json({ success: false, message: 'Authentication details required.' });
      }

      const currentTeam = await getTeamById(teamId);
      if (
        !currentTeam ||
        currentTeam.teamName.toLowerCase() !== teamName.trim().toLowerCase() ||
        currentTeam.leader.email.toLowerCase() !== leaderEmail.trim().toLowerCase()
      ) {
        return res.status(401).json({ success: false, message: 'Unauthorized or team not found.' });
      }

      const updatePayload: Partial<Team> = {};

      if (leader && Array.isArray(members) && members.length === 5) {
        const allMembers = [leader, ...members];
        const validDepts = ['IT', 'CSE', 'CE'];
        for (const m of allMembers) {
          if (!validDepts.includes(m.department)) {
            return res.status(400).json({ success: false, message: 'Department must be IT, CSE, or CE.' });
          }
          if (!/^\d{10}$/.test(m.mobile.trim())) {
            return res.status(400).json({ success: false, message: `Invalid 10-digit mobile for ${m.fullName}` });
          }
        }

        const femaleCount = allMembers.filter((m) => m.gender === 'Female').length;
        if (femaleCount < 1) {
          return res.status(400).json({
            success: false,
            message: 'Team must include at least one female participant.',
          });
        }

        // Duplicate member name check WITHIN team
        const memberNames = allMembers.map((m) => m.fullName.trim().toLowerCase());
        if (new Set(memberNames).size !== memberNames.length) {
          return res.status(400).json({
            success: false,
            message: 'Each team member must have a unique name. Duplicate names are not allowed.',
          });
        }

        updatePayload.leader = { ...leader, isLeader: true };
        updatePayload.members = members.map((m: any) => ({ ...m, isLeader: false }));
      }

      if (mentor) {
        if (!mentor.fullName || !mentor.contactNumber || !mentor.email || !mentor.department) {
          return res.status(400).json({ success: false, message: 'Please complete required mentor fields.' });
        }
        updatePayload.mentor = {
          ...mentor,
          submittedAt: currentTeam.mentor?.submittedAt || new Date().toISOString(),
        };
        updatePayload.status = 'completed';
      }

      const updatedTeam = await updateTeam(teamId, updatePayload);
      res.json({ success: true, team: updatedTeam, message: 'Team details updated successfully!' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. Verify Team for Mentor Details
  app.get('/api/teams/verify/:id', async (req: Request, res: Response) => {
    try {
      const team = await getTeamById(req.params.id);
      if (!team) {
        return res.status(404).json({ success: false, message: 'Registration ID not found.' });
      }
      res.json({ success: true, team });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 7. Submit Mentor Details (Phase 2)
  app.post('/api/mentor', async (req: Request, res: Response) => {
    try {
      const { teamId, mentor } = req.body;

      if (!teamId || !mentor) {
        return res.status(400).json({ success: false, message: 'Team ID and Mentor details are required.' });
      }

      const team = await getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, message: 'Registration ID not found.' });
      }

      if (!mentor.fullName || !mentor.contactNumber || !mentor.email || !mentor.department || !mentor.officeAddress) {
        return res.status(400).json({ success: false, message: 'All mentor fields are required.' });
      }

      if (!/^\d{10}$/.test(mentor.contactNumber.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mentor contact number.' });
      }

      const updatedTeam = await updateTeam(teamId, {
        mentor: {
          ...mentor,
          submittedAt: new Date().toISOString(),
        },
        status: 'completed',
      });

      res.json({ success: true, team: updatedTeam });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 8. Admin List Teams
  app.get('/api/admin/teams', async (req: Request, res: Response) => {
    try {
      const { search, department, status, semester, gender } = req.query;
      let result = await getAllTeams();

      if (search) {
        const q = (search as string).toLowerCase();
        result = result.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.teamName.toLowerCase().includes(q) ||
            (t.leader?.fullName || '').toLowerCase().includes(q) ||
            (t.leader?.enrollmentNo || '').toLowerCase().includes(q)
        );
      }

      if (department && department !== 'ALL') {
        result = result.filter((t) =>
          [t.leader, ...(Array.isArray(t.members) ? t.members : [])].some((m) => m?.department === department)
        );
      }

      if (status && status !== 'ALL') {
        result = result.filter((t) => t.status === status);
      }

      if (semester && semester !== 'ALL') {
        result = result.filter((t) =>
          [t.leader, ...(Array.isArray(t.members) ? t.members : [])].some((m) => m?.semester === semester)
        );
      }

      if (gender === 'ALL_FEMALE') {
        result = result.filter((t) =>
          [t.leader, ...(Array.isArray(t.members) ? t.members : [])].every((m) => m?.gender === 'Female')
        );
      }

      res.json({ success: true, teams: result, total: result.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 9. Admin Stats Overview
  app.get('/api/admin/stats', async (req: Request, res: Response) => {
    try {
      const teams = await getAllTeams();
      const totalTeams = teams.length;
      let totalParticipants = 0;
      let maleParticipants = 0;
      let femaleParticipants = 0;
      const departmentStats: Record<string, number> = { IT: 0, CSE: 0, CE: 0 };
      const semesterStats: Record<string, number> = {
        '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0,
      };
      let pendingMentorCount = 0;
      let completedMentorCount = 0;

      const dailyMap = new Map<string, number>();

      teams.forEach((t) => {
        if (t.status === 'completed') completedMentorCount++;
        else pendingMentorCount++;

        const dateStr = new Date(t.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);

        const allMembers = [t.leader, ...t.members];
        totalParticipants += allMembers.length;

        allMembers.forEach((m) => {
          if (m.gender === 'Male') maleParticipants++;
          if (m.gender === 'Female') femaleParticipants++;

          if (departmentStats[m.department] !== undefined) {
            departmentStats[m.department]++;
          }

          if (semesterStats[m.semester] !== undefined) {
            semesterStats[m.semester]++;
          }
        });
      });

      const dailyRegistrations = Array.from(dailyMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      res.json({
        success: true,
        stats: {
          totalTeams,
          totalParticipants,
          maleParticipants,
          femaleParticipants,
          departmentStats,
          semesterStats,
          pendingMentorCount,
          completedMentorCount,
          dailyRegistrations,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 10. Admin Update Team
  app.put('/api/admin/teams/:id', async (req: Request, res: Response) => {
    try {
      const updated = await updateTeam(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Team not found.' });
      }
      res.json({ success: true, team: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 11. Admin Delete Team
  app.delete('/api/admin/teams/:id', async (req: Request, res: Response) => {
    try {
      const ok = await deleteTeam(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, message: 'Team not found.' });
      }
      res.json({ success: true, message: `Team deleted successfully.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 12. Trigger Registration Deadline Reminder Emails to Team Leaders
  app.post('/api/admin/trigger-deadline-reminders', async (req: Request, res: Response) => {
    try {
      const config = await getGlobalConfig();
      const teams = await getAllTeams();
      const appUrl = getAppUrl(req);

      const deadlineFormatted = new Date(config.settings.registrationDeadline).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
      });

      let sentCount = 0;
      for (const team of teams) {
        await dispatchDeadlineReminderToLeader(team, deadlineFormatted, appUrl);
        sentCount++;
      }

      res.json({
        success: true,
        sentCount,
        message: `Deadline reminder emails dispatched to ${sentCount} Team Leaders asking if they wish to edit or update their team details.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 13. Admin Email Logs
  app.get('/api/admin/email-logs', async (req: Request, res: Response) => {
    try {
      const logs = await getEmailLogs();
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 13b. Resend Email Log
  app.post('/api/admin/emails/resend', async (req: Request, res: Response) => {
    try {
      const { emailId } = req.body;
      if (!emailId) {
        return res.status(400).json({ success: false, message: 'Email ID required.' });
      }
      const logs = await getEmailLogs();
      const targetLog = logs.find((l) => l.id === emailId);
      if (!targetLog) {
        return res.status(404).json({ success: false, message: 'Email log not found.' });
      }

      const updated = await resendEmailLog(targetLog);
      res.json({
        success: true,
        log: updated,
        message: updated.status === 'sent'
          ? `Email resent successfully to ${updated.recipientEmail}!`
          : updated.status === 'failed'
          ? `Email resend failed: check SMTP credentials or connection.`
          : `Email delivery simulated (SMTP server not configured).`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 13c. Test SMTP Configuration
  app.post('/api/admin/smtp/test', async (req: Request, res: Response) => {
    try {
      const { host, port, user, pass, from, testRecipient } = req.body;
      if (host) process.env.SMTP_HOST = host;
      if (port) process.env.SMTP_PORT = String(port);
      if (user) process.env.SMTP_USER = user;
      if (pass) process.env.SMTP_PASS = pass;
      if (from) process.env.SMTP_FROM = from;

      resetTransporter();

      const recipient = testRecipient || user || 'admin@vsitr.ac.in';
      const result = await sendEmail({
        recipientEmail: recipient,
        recipientName: 'Admin Tester',
        subject: '[Internal SIH 2026] SMTP Integration Test',
        bodyHtml: '<p>This is a test email sent from the Internal SIH 2026 portal to verify SMTP server integration.</p>',
        bodyText: 'This is a test email sent from the Internal SIH 2026 portal to verify SMTP server integration.',
        type: 'admin_announcement',
      });

      if (result.status === 'sent') {
        res.json({ success: true, message: `SMTP test email successfully sent to ${recipient}!`, log: result });
      } else if (result.status === 'failed') {
        res.status(400).json({ success: false, message: `SMTP Test Failed. Please verify host, port, username, or App Password.`, log: result });
      } else {
        res.json({ success: true, message: `Simulated Email Dispatch: SMTP credentials not set. Simulated log saved.`, log: result });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

    // 14. CSV Export Endpoint
    app.get('/api/export/csv', async (req: Request, res: Response) => {
      try {
        const teams = await getAllTeams();
        let csv = 'Team ID,Team Name,Status,Leader Name,Leader Email,Leader Phone,Leader Enrolment,Leader Dept,Leader Sem,Leader Gender,';
        
        // Add headers for 5 members
        for (let i = 1; i <= 5; i++) {
          csv += `M${i} Name,M${i} Email,M${i} Phone,M${i} Enrolment,M${i} Dept,M${i} Sem,M${i} Gender,`;
        }
        csv += 'Female Members Count,Mentor Name,Mentor Contact,Mentor Email,Registered At\n';
  
        teams.forEach((t) => {
          const allMembers = [t.leader, ...t.members];
          const females = allMembers.filter((m) => m.gender === 'Female').length;
          const mName = t.mentor ? `"${t.mentor.prefix} ${t.mentor.fullName}"` : 'Pending';
          const mContact = t.mentor ? t.mentor.contactNumber : '';
          const mEmail = t.mentor ? t.mentor.email : '';
  
          let row = `"${t.id}","${t.teamName}","${t.status}","${t.leader.fullName}","${t.leader.email}","${t.leader.mobile}","${t.leader.enrollmentNo}","${t.leader.department}","${t.leader.semester}","${t.leader.gender}",`;
          
          for (let i = 0; i < 5; i++) {
            const m = t.members[i];
            if (m && m.fullName && m.fullName.trim() !== '') {
              row += `"${m.fullName}","${m.email}","${m.mobile}","${m.enrollmentNo}","${m.department}","${m.semester}","${m.gender}",`;
            } else {
              row += `,,,,,,,`; // 7 empty columns
            }
          }
          
          row += `${females},${mName},"${mContact}","${mEmail}","${t.createdAt}"\n`;
          csv += row;
        });
  
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="VSITR_SIH_2026_Teams.csv"');
        res.status(200).send(csv);
      } catch (err: any) {
        res.status(500).send('Error generating CSV');
      }
    });

  // =====================
  // PPT SUBMISSION ROUTES
  // =====================

  // Public: Submit PPT
  app.post('/api/ppt-submission', async (req: Request, res: Response) => {
    try {
      const { teamId, teamName, leaderName, leaderEmail, fileUrl, note } = req.body;
      if (!teamId || !teamName || !leaderName || !leaderEmail || !fileUrl) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }
      const id = `PPT-${teamId}-${Date.now()}`;
      const submission = await createPptSubmission({ id, teamId, teamName, leaderName, leaderEmail, fileUrl, note });
      res.json({ success: true, message: 'PPT submitted successfully!', submission });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to submit PPT.' });
    }
  });

  // Admin: Get all PPT submissions
  app.get('/api/admin/ppt-submissions', async (req: Request, res: Response) => {
    try {
      const submissions = await getAllPptSubmissions();
      res.json({ success: true, submissions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Delete a PPT submission
  app.delete('/api/admin/ppt-submissions/:id', async (req: Request, res: Response) => {
    try {
      await deletePptSubmission(req.params.id);
      res.json({ success: true, message: 'PPT submission deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Serve Vite in dev mode / static files in production mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Internal SIH 2026 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
/ /   T r i g g e r   V e r c e l   d e p l o y  
 