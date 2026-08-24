// Vercel Serverless Function entry point
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import express, { Request, Response } from 'express';
import { EventSettings, FAQItem, Team, TimelineEvent } from '../src/types.js';
import { CLUB_COORDINATORS } from '../src/data/initialData.js';
import { buildFullReportWorkbook } from '../src/utils/reportBuilder.js';
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
  getAllProblemStatements,
  createProblemStatement,
  updateProblemStatement,
  deleteProblemStatement,
  updateTeamPsSelection,
  updateTeamPptSubmission,
  createLeaderEditRequest,
  getAllLeaderEditRequests,
  updateLeaderEditRequest,
  getLeaderEditRequestsByTeam,
} from '../src/db/neonDb.js';
import {
  dispatchTeamRegistrationEmails,
  dispatchDeadlineReminderToLeader,
  sendEmail,
  resendEmailLog,
  resetTransporter,
  dispatchPsSelectionEmails,
  dispatchPptSubmissionEmail,
} from '../src/services/emailService.js';

const app = express();

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});

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
    await initDatabase(true);
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
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

// Production Rules PDF upload. When BLOB_READ_WRITE_TOKEN is configured, the
// PDF is stored in Vercel Blob for a permanent public URL. Otherwise it falls
// back to returning the file as a base64 data URL so the Admin can still save
// the Rules PDF link in the database settings without any extra infrastructure.
app.post('/api/admin/rules-pdf', async (req: Request, res: Response) => {
  try {
    const { fileName, fileBase64 } = req.body;
    if (!fileName || !fileBase64 || !/\.pdf$/i.test(fileName)) {
      return res.status(400).json({ success: false, message: 'Please choose a PDF file.' });
    }
    const cleanBase64 = String(fileBase64).replace(/^data:.*?;base64,/, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');
    if (!fileBuffer.length || fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'The PDF must be 10 MB or smaller.' });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    // --- Vercel Blob path (when token is configured) ---
    if (blobToken) {
      const safeBaseName = path.basename(fileName, '.pdf').replace(/[^a-zA-Z0-9_-]/g, '_') || 'rules';
      const blobResponse = await fetch(`https://blob.vercel-storage.com/rules/${Date.now()}_${safeBaseName}.pdf`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${blobToken}`,
          'x-api-version': '7',
          'x-add-random-suffix': '1',
          'content-type': 'application/pdf',
        },
        body: fileBuffer,
      });
      const blobData = await blobResponse.json().catch(() => null);
      if (!blobResponse.ok || !blobData?.url) {
        return res.status(502).json({ success: false, message: blobData?.error?.message || 'Could not store the PDF. Please try again or use the PDF Link option.' });
      }
      return res.json({ success: true, url: blobData.url });
    }

    // --- Fallback: return as base64 data URL stored in database settings ---
    const dataUrl = fileBase64.startsWith('data:')
      ? fileBase64
      : `data:application/pdf;base64,${cleanBase64}`;
    return res.json({ success: true, url: dataUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Could not upload the Rules PDF.' });
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
    const effectiveDeadline = config.settings.isExtended && config.settings.extendedDeadline ? config.settings.extendedDeadline : config.settings.registrationDeadline;
    const deadline = new Date(effectiveDeadline);
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
      const enrollmentRequired = m.semester !== '1';
      if (!m.fullName || (enrollmentRequired && !m.enrollmentNo) || !m.mobile || !m.email || !m.department || !m.semester || !m.gender) {
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

    // Duplicate enrollment check WITHIN team (skip empty enrollments from sem 1 students)
    const enrollmentsInTeam = allMembers
      .map((m) => m.enrollmentNo.trim().toUpperCase())
      .filter((e) => e.length > 0);
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
    try {
      await dispatchTeamRegistrationEmails(newTeam, appUrl);
    } catch (e) {
      console.error('Email dispatch error:', e);
    }

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

    // Fetch team directly by ID first (supports test team SIH2026-000 login)
    let team = await getTeamById(tId);

    if (!team) {
      const existingTeams = await getAllTeams();
      team = existingTeams.find((t) => t.id.toUpperCase() === tId) || null;
    }

    if (!team) {
      return res.status(401).json({
        success: false,
        title: 'Login Failed',
        message: 'The Team ID you entered does not exist in our records.',
      });
    }

    const dbEmail = (team.leader?.email || '').trim().toLowerCase();
    const dbTeamName = (team.teamName || '').trim().toLowerCase();

    const emailMatches = dbEmail === lEmail;
    const nameMatches = dbTeamName === tName ||
      tId === 'SIH2026-000' ||
      dbTeamName.includes(tName) ||
      tName.includes(dbTeamName);

    if (!emailMatches || !nameMatches) {
      return res.status(401).json({
        success: false,
        title: 'Login Failed',
        message: 'The Team Name or Team Leader Email does not match our records. Please check your credentials.',
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
        if (!m.fullName || !m.fullName.trim()) {
          return res.status(400).json({ success: false, message: 'All member names are required and cannot be blank.' });
        }
        if (!validDepts.includes(m.department)) {
          return res.status(400).json({ success: false, message: 'Department must be IT, CSE, or CE.' });
        }
        if (!/^\d{10}$/.test(m.mobile.trim())) {
          return res.status(400).json({ success: false, message: `Invalid 10-digit mobile for ${m.fullName}` });
        }
        const enrollmentRequired = m.semester !== '1';
        if (enrollmentRequired && (!m.enrollmentNo || !m.enrollmentNo.trim())) {
          return res.status(400).json({ success: false, message: `Enrollment number is required for ${m.fullName}.` });
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

      // Duplicate enrollment check WITHIN team
      const enrollmentsInTeam = allMembers
        .map((m) => m.enrollmentNo?.trim().toUpperCase())
        .filter((e) => e && e.length > 0);
      const uniqueInTeam = new Set(enrollmentsInTeam);
      if (uniqueInTeam.size !== enrollmentsInTeam.length) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate enrollment number entered in your team.',
        });
      }

      // Duplicate enrollment check ACROSS other teams
      const existingTeams = await getAllTeams();
      const registeredEnrollments = new Map<string, string>();
      existingTeams.forEach((t) => {
        if (t.id.toUpperCase() === teamId.toUpperCase()) return; // skip current team
        [t.leader, ...t.members].forEach((m) => {
          if (m.enrollmentNo) {
            registeredEnrollments.set(m.enrollmentNo.trim().toUpperCase(), t.teamName);
          }
        });
      });

      for (const enr of enrollmentsInTeam) {
        if (registeredEnrollments.has(enr)) {
          return res.status(400).json({
            success: false,
            message: `The enrollment number ${enr} has already been registered with team "${registeredEnrollments.get(enr)}".`,
          });
        }
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

    if (!mentor.fullName || !mentor.contactNumber || !mentor.email || !mentor.department) {
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
          t.leader.fullName.toLowerCase().includes(q) ||
          t.leader.enrollmentNo.toLowerCase().includes(q)
      );
    }

    if (department && department !== 'ALL') {
      result = result.filter((t) =>
        [t.leader, ...t.members].some((m) => m.department === department)
      );
    }

    if (status && status !== 'ALL') {
      result = result.filter((t) => t.status === status);
    }

    if (semester && semester !== 'ALL') {
      result = result.filter((t) =>
        [t.leader, ...t.members].some((m) => m.semester === semester)
      );
    }

    if (gender === 'ALL_FEMALE') {
      result = result.filter((t) =>
        [t.leader, ...t.members].every((m) => m.gender === 'Female')
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

    const effectiveDeadline = config.settings.isExtended && config.settings.extendedDeadline ? config.settings.extendedDeadline : config.settings.registrationDeadline;
    const deadlineFormatted = new Date(effectiveDeadline).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
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
    const { host, port, user, pass, from, testRecipient, testType } = req.body;
    if (host) process.env.SMTP_HOST = host;
    if (port) process.env.SMTP_PORT = String(port);
    if (user) process.env.SMTP_USER = user;
    if (pass) process.env.SMTP_PASS = pass;
    if (from) process.env.SMTP_FROM = from;

    resetTransporter();

    const recipient = testRecipient || user || 'admin@vsitr.ac.in';
    let result;

    if (testType === 'mentor_pending' || testType === 'mentor_completed') {
      const isCompleted = testType === 'mentor_completed';
      const teamMock = {
        id: 'SIH2026-042',
        teamName: 'Cyber Knights',
        status: isCompleted ? 'completed' : 'pending',
        createdAt: new Date().toISOString(),
        leader: {
          fullName: 'Ved Patel',
          email: recipient,
          mobile: '9876543210',
          enrollmentNo: '23070101001',
          department: 'IT',
          semester: '5',
          gender: 'Male'
        },
        members: [
          { fullName: 'Aarav Sharma', email: 'aarav@example.com', mobile: '9876543211', enrollmentNo: '23070101002', department: 'IT', semester: '5', gender: 'Male' },
          { fullName: 'Diya Patel', email: 'diya@example.com', mobile: '9876543212', enrollmentNo: '23070101003', department: 'IT', semester: '5', gender: 'Female' },
          { fullName: 'Ishaan Verma', email: 'ishaan@example.com', mobile: '9876543213', enrollmentNo: '23070101004', department: 'CSE', semester: '5', gender: 'Male' },
          { fullName: 'Kabir Mehta', email: 'kabir@example.com', mobile: '9876543214', enrollmentNo: '23070101005', department: 'CSE', semester: '5', gender: 'Male' },
          { fullName: 'Meera Joshi', email: 'meera@example.com', mobile: '9876543215', enrollmentNo: '23070101006', department: 'CE', semester: '5', gender: 'Female' }
        ],
        mentor: isCompleted ? {
          prefix: 'Dr.',
          fullName: 'Ramesh Shah',
          email: recipient, // Send mentor CC to the same recipient for testing
          contactNumber: '9988776655',
          department: 'IT',
          submittedAt: new Date().toISOString()
        } : undefined
      };

      result = await dispatchDeadlineReminderToLeader(teamMock as any, 'August 8, 2026', getAppUrl(req));
    } else {
      result = await sendEmail({
        recipientEmail: recipient,
        recipientName: 'Admin Tester',
        subject: '[Internal SIH 2026] SMTP Integration Test',
        bodyHtml: '<p>This is a test email sent from the Internal SIH 2026 portal to verify SMTP server integration.</p>',
        bodyText: 'This is a test email sent from the Internal SIH 2026 portal to verify SMTP server integration.',
        type: 'admin_announcement',
      });
    }

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

// 14. Full Report Export Endpoint (returning multi-sheet Excel XLSX)
app.get('/api/admin/export/full-report', async (req: Request, res: Response) => {
  try {
    const teams = await getAllTeams();
    const buffer = await buildFullReportWorkbook(teams);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="SIH_2026_Report.xlsx"');
    res.status(200).send(buffer);
  } catch (err: any) {
    console.error('Error generating Excel report:', err);
    res.status(500).send('Error generating Excel report');
  }
});

  // =====================
// PPT SUBMISSION ROUTES
// =====================

// 7.5 Submit PPT & Prototype Presentation (Phase 3)
app.post('/api/teams/submit-ppt', async (req: Request, res: Response) => {
  try {
    const { teamId, leaderEmail, pptFileName, pptFileBase64, demoVideoUrl, githubRepoUrl, githubCollaboratorsAdded } = req.body;

    if (!teamId || !leaderEmail) {
      return res.status(400).json({ success: false, message: 'Team ID and Leader Email are required.' });
    }

    const globalConfig = await getGlobalConfig();
    if (!globalConfig.settings?.pptSubmissionOpen) {
      return res.status(403).json({ success: false, message: 'PPT Submission portal is currently closed by the Admin Officer.' });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team Registration ID not found.' });
    }

    if (team.pptSubmission && (team.pptSubmission.submittedAt || team.pptSubmission.pptFileUrl)) {
      return res.status(403).json({ success: false, message: 'Submission Locked: PPT presentation and prototype details have already been submitted. No further modifications are permitted.' });
    }

    if (team.leader.email.trim().toLowerCase() !== leaderEmail.trim().toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Team Leader email does not match registration records.' });
    }

    // 1. PPT File Validation (.ppt or .pptx ONLY)
    if (!pptFileName || !/\.(ppt|pptx)$/i.test(pptFileName.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid presentation file extension. Only PowerPoint files (.ppt, .pptx) are accepted.',
      });
    }

    // 2. Demo Video Link Validation (YouTube URL)
    if (!demoVideoUrl || !/(youtube\.com|youtu\.be)/i.test(demoVideoUrl.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube Video URL. Please paste a valid YouTube video link (e.g. https://youtu.be/... or https://www.youtube.com/watch?v=...).',
      });
    }

    // 3. GitHub Repo Link Validation
    if (!githubRepoUrl || !/(github\.com)/i.test(githubRepoUrl.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub Repository URL. Please paste a valid GitHub link (e.g. https://github.com/username/repo).',
      });
    }

    // Save PPT File locally
    let pptFileUrl = team.pptSubmission?.pptFileUrl || '';
    let pptFileSize = team.pptSubmission?.pptFileSize || 0;

    if (pptFileBase64) {
      const cleanBase64 = pptFileBase64.replace(/^data:.*?;base64,/, '');
      const fileBuffer = Buffer.from(cleanBase64, 'base64');
      pptFileSize = fileBuffer.length;

      const ext = path.extname(pptFileName) || '.pptx';
      const safeName = `${team.id}_${Date.now()}_${path.basename(pptFileName, ext).replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;

      try {
        const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'ppt');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, safeName);
        fs.writeFileSync(filePath, fileBuffer);
        pptFileUrl = `/api/uploads/ppt/${safeName}`;
      } catch (fsErr) {
        console.warn('Local disk write skipped (read-only environment like Vercel):', fsErr);
        pptFileUrl = pptFileBase64.startsWith('data:')
          ? pptFileBase64
          : `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${cleanBase64}`;
      }
    }

    const pptSubmissionData = {
      pptFileName: pptFileName.trim(),
      pptFileUrl,
      pptFileSize,
      pptUploadedAt: new Date().toISOString(),
      demoVideoUrl: demoVideoUrl.trim(),
      githubRepoUrl: githubRepoUrl.trim(),
      githubCollaboratorsAdded: !!githubCollaboratorsAdded,
      submittedAt: new Date().toISOString(),
    };

    const updatedTeam = await updateTeamPptSubmission(team.id, pptSubmissionData);

    const submissionPayload = {
      id: `PPT-${team.id}`,
      teamId: team.id,
      teamName: team.teamName,
      leaderName: team.leader.fullName,
      leaderEmail: team.leader.email,
      fileUrl: pptFileUrl,
      pptFileName: pptFileName.trim(),
      pptFileUrl,
      pptFileSize,
      demoVideoUrl: demoVideoUrl.trim(),
      githubRepoUrl: githubRepoUrl.trim(),
      githubCollaboratorsAdded: !!githubCollaboratorsAdded,
      submittedAt: pptSubmissionData.submittedAt,
    };

    // Populate ppt_submissions database table
    await createPptSubmission(submissionPayload);

    // Send formatted HTML confirmation emails to leader and all team members
    try {
      const fullTeam = updatedTeam || team;
      await dispatchPptSubmissionEmail(fullTeam, submissionPayload);
    } catch (emailErr) {
      console.error('Error dispatching PPT confirmation emails:', emailErr);
    }

    res.json({
      success: true,
      team: updatedTeam || { ...team, pptSubmission: pptSubmissionData },
      message: 'PPT presentation and prototype details submitted successfully!',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve Uploaded PPT files
app.use('/api/uploads', express.static(path.join(process.cwd(), 'data', 'uploads')));

app.get('/api/uploads/ppt/:filename', async (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(process.cwd(), 'data', 'uploads', 'ppt', filename);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    return res.download(filePath, filename);
  }

  // Database fallback stream if disk file is missing
  try {
    const teams = await getAllTeams();
    const matchingTeam = teams.find((t) => {
      const sub = t.pptSubmission;
      if (!sub) return false;
      return (sub.pptFileUrl && sub.pptFileUrl.includes(filename)) || sub.pptFileName === filename;
    });

    const base64Data = (matchingTeam?.pptSubmission as any)?.pptFileBase64;
    if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '');
      const fileBuffer = Buffer.from(cleanBase64, 'base64');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(fileBuffer);
    }
  } catch (e) {
    console.error('Error serving fallback PPT from database:', e);
  }

  res.status(404).send('PPT File not found.');
});

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

// ============================
// PROBLEM STATEMENT ROUTES
// ============================

// Get all problem statements (Public)
app.get('/api/problem-statements', async (req: Request, res: Response) => {
  try {
    const list = await getAllProblemStatements();
    res.json({ success: true, problemStatements: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a problem statement (Admin)
app.post('/api/problem-statements', async (req: Request, res: Response) => {
  try {
    const { id, title, category, description, status } = req.body;
    if (!id || !title || !category) {
      return res.status(400).json({ success: false, message: 'ID, Title, and Category are required.' });
    }
    const created = await createProblemStatement({ id, title, category, description, status: status || 'open' });
    res.json({ success: true, message: 'Problem Statement created successfully.', problemStatement: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update a problem statement (Admin)
app.put('/api/problem-statements/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateProblemStatement(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Problem Statement not found.' });
    }
    res.json({ success: true, message: 'Problem Statement updated successfully.', problemStatement: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a problem statement (Admin)
app.delete('/api/problem-statements/:id', async (req: Request, res: Response) => {
  try {
    const ok = await deleteProblemStatement(req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Problem Statement not found.' });
    }
    res.json({ success: true, message: 'Problem Statement deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit PS Selection for Team (Self-Service in Team Portal)
app.post('/api/teams/select-ps', async (req: Request, res: Response) => {
  try {
    const { teamId, psId, psTitle, organization, category, theme } = req.body;

    if (!teamId || !psId || !psTitle || !organization || !category || !theme) {
      return res.status(400).json({ success: false, message: 'All problem statement details are required.' });
    }

    // Use the same Admin Panel setting as the Team Portal countdown.
    const globalConfig = await getGlobalConfig();
    const psDeadlineStr = globalConfig.settings?.psSelectionDeadline;
    // Fallback: 25 August 2026, 11:59 PM IST.
    const deadline = psDeadlineStr && !isNaN(new Date(psDeadlineStr).getTime())
      ? new Date(psDeadlineStr)
      : new Date('2026-08-25T18:29:00.000Z');
    const now = new Date();
    if (now > deadline) {
      const fmtDeadline = deadline.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      return res.status(400).json({
        success: false,
        message: `The deadline for selecting problem statements has passed (${fmtDeadline} IST).`
      });
    }

    const updatedTeam = await updateTeamPsSelection(teamId, psId, psTitle, organization, category, theme);
    if (!updatedTeam) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // Automatically dispatch confirmation emails to all 6 team members
    try {
      await dispatchPsSelectionEmails(updatedTeam, psId, psTitle);
      console.log(`[PS Selection Email] Successfully dispatched confirmation emails for team ${teamId} (${psId})`);
    } catch (emailErr) {
      console.error('[PS Selection Email Error] Failed to dispatch PS selection emails:', emailErr);
    }

    res.json({
      success: true,
      message: 'Problem Statement selection confirmed successfully!',
      team: updatedTeam,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================
// ADMIN LOOKUP ROUTES
// ============================

// Admin: Get all team IDs (for autocomplete in Team Lookup)
app.get('/api/admin/all-team-ids', async (req: Request, res: Response) => {
  try {
    const teams = await getAllTeams();
    const teamIds = teams
      .map((t) => t.id)
      .sort((a, b) => {
        // Sort numerically by the trailing number (e.g. SIH2026-001 < SIH2026-010)
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
    res.json({ success: true, teamIds });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get distinct mentor names (case-insensitive dedup, most-common casing wins)
app.get('/api/admin/all-mentor-names', async (req: Request, res: Response) => {
  try {
    const teams = await getAllTeams();

    // Group by normalised key (UPPER TRIM) → track each original-casing variant count
    const normMap = new Map<string, Map<string, number>>();

    for (const t of teams) {
      if (!t.mentor?.fullName) continue;
      const raw = `${t.mentor.prefix || ''} ${t.mentor.fullName}`.trim();
      if (!raw) continue;
      const norm = raw.trim().toUpperCase();
      if (!normMap.has(norm)) normMap.set(norm, new Map());
      const variants = normMap.get(norm)!;
      variants.set(raw, (variants.get(raw) || 0) + 1);
    }

    // Pick the variant with the highest count as display label
    const mentorNames: string[] = [];
    for (const variants of normMap.values()) {
      let bestLabel = '';
      let bestCount = 0;
      for (const [label, count] of variants.entries()) {
        if (count > bestCount || (count === bestCount && label < bestLabel)) {
          bestLabel = label;
          bestCount = count;
        }
      }
      if (bestLabel) mentorNames.push(bestLabel);
    }

    mentorNames.sort((a, b) => a.localeCompare(b));
    res.json({ success: true, mentorNames });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get full team record by team ID (Team Lookup)
app.get('/api/admin/team/:teamId', async (req: Request, res: Response) => {
  try {
    const team = await getTeamById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: `Team ID "${req.params.teamId}" not found.` });
    }
    res.json({ success: true, team });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get all teams for a given mentor name (case-insensitive, trim) — Mentor Lookup
app.get('/api/admin/mentor/:mentorName', async (req: Request, res: Response) => {
  try {
    const rawName = decodeURIComponent(req.params.mentorName).trim();
    if (!rawName) {
      return res.status(400).json({ success: false, message: 'Mentor name is required.' });
    }
    const normSearch = rawName.toUpperCase();

    const allTeams = await getAllTeams();

    // Case-insensitive match: trim + upper both sides
    const matchingTeams = allTeams.filter((t) => {
      if (!t.mentor?.fullName) return false;
      const fullDisplay = `${t.mentor.prefix || ''} ${t.mentor.fullName}`.trim();
      return fullDisplay.toUpperCase() === normSearch;
    });

    if (matchingTeams.length === 0) {
      return res.status(404).json({ success: false, message: `No teams found for mentor "${rawName}".` });
    }

    // Use the first team's mentor object for contact/email display
    const representative = matchingTeams[0].mentor!;

    const teamsData = matchingTeams.map((t) => ({
      teamId: t.id,
      teamName: t.teamName,
      leaderName: t.leader.fullName,
      leaderPhone: t.leader.mobile,
        selectedPsId: t.selectedPsId || null,
        selectedPsTitle: t.selectedPsTitle || null,
        selectedPsOrganization: t.selectedPsOrganization || null,
        selectedPsCategory: t.selectedPsCategory || null,
        selectedPsTheme: t.selectedPsTheme || null,
      status: t.status,
    }));

    res.json({
      success: true,
      mentorName: rawName,
      mentorContact: representative.contactNumber || '',
      mentorEmail: representative.email || '',
      teamCount: matchingTeams.length,
      teams: teamsData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

  async function checkTeamEditOpen() {
    const config = await getGlobalConfig();
    const s = config.settings;
    if (s.teamEditOpen && s.teamEditCloseAt) {
      if (new Date() >= new Date(s.teamEditCloseAt)) {
        await saveGlobalConfig({ settings: { teamEditOpen: false } });
        return { open: false, message: 'The edit window deadline has passed. Editing is now closed.' };
      }
    }
    if (!s.teamEditOpen) {
      return { open: false, message: 'Team editing is currently closed. Please check with the admin for the next edit window.' };
    }
    return { open: true };
  }

  // POST /api/teams/edit-members — Save edited member data
  app.post('/api/teams/edit-members', async (req: Request, res: Response) => {
    try {
      const { teamId, leaderEmail, members } = req.body;

      if (!teamId || !leaderEmail) {
        return res.status(400).json({ success: false, message: 'Team ID and leader email are required.' });
      }

      // Server-side gate: check edit window open
      const windowStatus = await checkTeamEditOpen();
      if (!windowStatus.open) {
        return res.status(403).json({ success: false, message: windowStatus.message });
      }

      const team = await getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, message: 'Team not found.' });
      }
      if (team.leader.email.trim().toLowerCase() !== leaderEmail.trim().toLowerCase()) {
        return res.status(401).json({ success: false, message: 'Only the team leader can edit member details.' });
      }

      if (!Array.isArray(members) || members.length !== 5) {
        return res.status(400).json({ success: false, message: 'Exactly 5 member records are required.' });
      }

      // Validation a: No empty fields
      const requiredFields = ['fullName', 'email', 'mobile', 'enrollmentNo', 'department', 'semester', 'gender'] as const;
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        for (const f of requiredFields) {
          if (!m[f] || !String(m[f]).trim()) {
            return res.status(400).json({
              success: false,
              message: `Member ${i + 1}: field "${f}" cannot be empty.`,
              field: f,
              memberIndex: i,
            });
          }
        }
      }

      // Validation b: At least 1 female across leader + all 5 members
      const allMembersCheck = [team.leader, ...members];
      const femaleCount = allMembersCheck.filter((m: any) => m.gender === 'Female').length;
      if (femaleCount < 1) {
        return res.status(400).json({
          success: false,
          message: 'Team must include at least one female participant (leader + members combined).',
        });
      }

      // Validation c: Global enrollment uniqueness
      const allTeams = await getAllTeams();
      const incomingEnrollments = members
        .map((m: any) => String(m.enrollmentNo || '').trim().toUpperCase())
        .filter(Boolean);

      for (const enr of incomingEnrollments) {
        for (const t of allTeams) {
          if (t.id.toUpperCase() === teamId.toUpperCase()) continue;
          const otherMembers = [t.leader, ...t.members];
          if (otherMembers.some((m) => String(m.enrollmentNo || '').trim().toUpperCase() === enr)) {
            return res.status(400).json({
              success: false,
              message: `Enrollment number ${enr} is already registered in team "${t.teamName}". Each student can only belong to one team.`,
            });
          }
        }
      }

      // Also check within-team duplicates (members vs each other + leader)
      const leaderEnr = String(team.leader.enrollmentNo || '').trim().toUpperCase();
      const allNewEnrollments = leaderEnr ? [leaderEnr, ...incomingEnrollments] : incomingEnrollments;
      if (new Set(allNewEnrollments).size !== allNewEnrollments.length) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate enrollment number detected within the team (including the leader).',
        });
      }

      const updatedTeam = await updateTeam(teamId, {
        members: members.map((m: any) => ({ ...m, isLeader: false })),
      });

      res.json({ success: true, team: updatedTeam, message: 'Team members updated successfully!' });
    } catch (err: any) {
      console.error('Error editing team members:', err);
      res.status(500).json({ success: false, message: err.message || 'Server error during member edit.' });
    }
  });

  // POST /api/teams/leader-edit-request — Queue a change request for a leader field
  app.post('/api/teams/leader-edit-request', async (req: Request, res: Response) => {
    try {
      const { teamId, leaderEmail, fieldName, oldValue, newValue, reason } = req.body;

      if (!teamId || !leaderEmail || !fieldName || !newValue || !reason) {
        return res.status(400).json({ success: false, message: 'All fields (teamId, leaderEmail, fieldName, newValue, reason) are required.' });
      }

      const windowStatus = await checkTeamEditOpen();
      if (!windowStatus.open) {
        return res.status(403).json({ success: false, message: windowStatus.message });
      }

      const team = await getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, message: 'Team not found.' });
      }
      if (team.leader.email.trim().toLowerCase() !== leaderEmail.trim().toLowerCase()) {
        return res.status(401).json({ success: false, message: 'Only the team leader can submit change requests.' });
      }

      if (fieldName === 'enrollmentNo') {
        const enr = String(newValue).trim().toUpperCase();
        const allTeams = await getAllTeams();
        for (const t of allTeams) {
          if (t.id.toUpperCase() === teamId.toUpperCase()) continue;
          const otherMembers = [t.leader, ...t.members];
          if (otherMembers.some((m) => String(m.enrollmentNo || '').trim().toUpperCase() === enr)) {
            return res.status(400).json({
              success: false,
              message: `Enrollment number ${enr} is already registered in team "${t.teamName}".`,
            });
          }
        }
      }

      const requestId = `LER-${teamId}-${Date.now()}`;
      const created = await createLeaderEditRequest({
        id: requestId,
        teamId,
        teamName: team.teamName,
        leaderName: team.leader.fullName,
        fieldName,
        oldValue: oldValue || '',
        newValue,
        reason,
        status: 'pending',
      });

      res.json({ success: true, request: created, message: 'Change request submitted successfully! An admin will review it.' });
    } catch (err: any) {
      console.error('Error creating leader edit request:', err);
      res.status(500).json({ success: false, message: err.message || 'Server error.' });
    }
  });

  // GET /api/teams/leader-edit-requests/:teamId — Get requests for a specific team (leader self-view)
  app.get('/api/teams/leader-edit-requests/:teamId', async (req: Request, res: Response) => {
    try {
      const requests = await getLeaderEditRequestsByTeam(req.params.teamId);
      res.json({ success: true, requests });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/admin/leader-edit-requests — Admin: get all pending requests
  app.get('/api/admin/leader-edit-requests', async (req: Request, res: Response) => {
    try {
      const requests = await getAllLeaderEditRequests();
      res.json({ success: true, requests });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // PUT /api/admin/leader-edit-requests/:id — Admin: approve or reject a request
  app.put('/api/admin/leader-edit-requests/:id', async (req: Request, res: Response) => {
    try {
      const { action } = req.body;
      if (action !== 'approved' && action !== 'rejected') {
        return res.status(400).json({ success: false, message: 'Action must be "approved" or "rejected".' });
      }

      const allRequests = await getAllLeaderEditRequests();
      const target = allRequests.find((r) => r.id === req.params.id);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
      }

      const updated = await updateLeaderEditRequest(req.params.id, action);

      if (action === 'approved' && updated) {
        const team = await getTeamById(target.teamId);
        if (team) {
          if (target.fieldName === 'enrollmentNo') {
            const enr = String(target.newValue).trim().toUpperCase();
            const allTeams = await getAllTeams();
            for (const t of allTeams) {
              if (t.id.toUpperCase() === target.teamId.toUpperCase()) continue;
              const otherMembers = [t.leader, ...t.members];
              if (otherMembers.some((m) => String(m.enrollmentNo || '').trim().toUpperCase() === enr)) {
                return res.status(400).json({
                  success: false,
                  message: `Cannot approve: Enrollment number ${enr} is already registered in team "${t.teamName}".`,
                });
              }
            }
          }

          const fieldMap: Record<string, string> = {
            fullName: 'fullName',
            email: 'email',
            mobile: 'mobile',
            enrollmentNo: 'enrollmentNo',
            department: 'department',
            semester: 'semester',
            gender: 'gender',
          };
          if (fieldMap[target.fieldName]) {
            const updatedLeader = { ...team.leader, [target.fieldName]: target.newValue };
            await updateTeam(target.teamId, { leader: updatedLeader });
          }
        }
      }

      res.json({ success: true, request: updated, message: `Request ${action} successfully.${action === 'approved' ? ' Leader record has been updated.' : ''}` });
    } catch (err: any) {
      console.error('Error reviewing leader edit request:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

export default app;

