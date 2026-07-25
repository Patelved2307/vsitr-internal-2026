// Vercel Serverless Function entry point
// This wraps the Express app from server.ts for Vercel's serverless environment.
// The Vite static frontend is served directly from the `dist/` outputDirectory.

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { EventSettings, FAQItem, Team, TimelineEvent } from '../src/types.js';
import { CLUB_COORDINATORS } from '../src/data/initialData.js';
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
} from '../src/db/neonDb.js';
import {
  dispatchTeamRegistrationEmails,
  dispatchDeadlineReminderToLeader,
  sendEmail,
  resendEmailLog,
  resetTransporter,
} from '../src/services/emailService.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize DB on cold start
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

const generateTeamId = (num: number) => {
  return `SIH2026-${num.toString().padStart(3, '0')}`;
};

const getAppUrl = (req: Request) => {
  if (process.env.APP_URL) return process.env.APP_URL;
  return `${req.protocol}://${req.get('host')}`;
};

// ─── Middleware: ensure DB before every request ───────────────────────────────
app.use(async (_req, _res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});

// ─── All API routes (copied from server.ts) ───────────────────────────────────

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

app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const { settings, timeline, faqs, rules } = req.body;
    const config = await getGlobalConfig();
    if (settings) config.settings = { ...config.settings, ...settings };
    if (timeline) config.timeline = timeline;
    if (faqs) config.faqs = faqs;
    if (rules) config.rules = rules;
    await saveGlobalConfig(config);
    res.json({ success: true, message: 'Settings updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/teams', async (req: Request, res: Response) => {
  try {
    const teams = await getAllTeams();
    res.json({ success: true, teams });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/teams/:id', async (req: Request, res: Response) => {
  try {
    const team = await getTeamById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });
    res.json({ success: true, team });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/teams', async (req: Request, res: Response) => {
  try {
    const config = await getGlobalConfig();
    if (!config.settings.registrationOpen) {
      return res.status(403).json({ success: false, message: 'Registration is currently closed.' });
    }
    const teams = await getAllTeams();
    const newId = generateTeamId(teams.length + 1);
    const team: Team = { ...req.body, id: newId, status: 'pending', createdAt: new Date().toISOString() };
    const created = await createTeam(team);
    await dispatchTeamRegistrationEmails(created, getAppUrl(req), config.settings);
    res.status(201).json({ success: true, team: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/teams/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateTeam(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Team not found.' });
    res.json({ success: true, team: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/teams/:id', async (req: Request, res: Response) => {
  try {
    await deleteTeam(req.params.id);
    res.json({ success: true, message: 'Team deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/email-logs', async (req: Request, res: Response) => {
  try {
    const logs = await getEmailLogs();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/email/resend/:logId', async (req: Request, res: Response) => {
  try {
    await resendEmailLog(parseInt(req.params.logId));
    res.json({ success: true, message: 'Email resent.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/email/deadline-reminder/:teamId', async (req: Request, res: Response) => {
  try {
    const team = await getTeamById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });
    const config = await getGlobalConfig();
    await dispatchDeadlineReminderToLeader(team, getAppUrl(req), config.settings);
    res.json({ success: true, message: 'Reminder sent.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/email/reset-transporter', async (req: Request, res: Response) => {
  try {
    await resetTransporter();
    res.json({ success: true, message: 'Email transporter reset.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default app;
