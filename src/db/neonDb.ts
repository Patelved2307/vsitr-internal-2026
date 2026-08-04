import { Pool, neon, neonConfig } from '@neondatabase/serverless';
import pg from 'pg';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { EventSettings, FAQItem, Team, TimelineEvent, EmailLog, Rule } from '../types.js';
import { CLUB_COORDINATORS, INITIAL_FAQS, INITIAL_SETTINGS, INITIAL_TIMELINE_EVENTS, INITIAL_RULES } from '../data/initialData.js';

// Configure WebSocket for serverless Neon pool in Node environment
neonConfig.webSocketConstructor = ws;

// Load environment variables strictly from .env (never from .env.example,
// which is meant to be a safe-to-commit template, not a secrets source)
dotenv.config({ path: '.env' });

// Setup File-based fallback DB path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sih_db.json');

export interface DatabaseSchema {
  settings: EventSettings;
  timeline: TimelineEvent[];
  faqs: FAQItem[];
  rules: Rule[];
  teams: Team[];
  emailLogs: EmailLog[];
  nextTeamNumber: number;
}


let activePool: any = null;
let neonSql: any = null;
let isNeonConnected = false;

export async function runQuery(queryText: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  if (activePool) {
    const res = await activePool.query(queryText, params);
    return { rows: res.rows || [], rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0) };
  } else if (neonSql) {
    const rows = await neonSql.query(queryText, params);
    const rowsArray = Array.isArray(rows) ? rows : [rows];
    return { rows: rowsArray, rowCount: rowsArray.length };
  }
  throw new Error('No active database client available');
}

async function syncNormalizedMembersAndMentors(team: Team) {
  if (!team || !team.id) return;
  try {
    await runQuery('DELETE FROM members WHERE team_id = $1', [team.id]);
    await runQuery('DELETE FROM mentors WHERE team_id = $1', [team.id]);

    if (team.leader) {
      await runQuery(
        `INSERT INTO members (team_id, full_name, email, phone, enrollment_no, gender, department, semester, is_leader)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          team.id,
          team.leader.fullName || '',
          team.leader.email || '',
          team.leader.mobile || '',
          team.leader.enrollmentNo || '',
          team.leader.gender || '',
          team.leader.department || '',
          team.leader.semester || '',
          true,
        ]
      );
    }

    if (Array.isArray(team.members)) {
      for (const m of team.members) {
        if (!m) continue;
        await runQuery(
          `INSERT INTO members (team_id, full_name, email, phone, enrollment_no, gender, department, semester, is_leader)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            team.id,
            m.fullName || '',
            m.email || '',
            m.mobile || '',
            m.enrollmentNo || '',
            m.gender || '',
            m.department || '',
            m.semester || '',
            false,
          ]
        );
      }
    }

    if (team.mentor && team.mentor.fullName) {
      const fullMentorName = `${team.mentor.prefix || ''} ${team.mentor.fullName}`.trim();
      await runQuery(
        `INSERT INTO mentors (team_id, full_name, email, phone, organization, designation)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          team.id,
          fullMentorName,
          team.mentor.email || '',
          team.mentor.contactNumber || '',
          team.mentor.institute || '',
          team.mentor.department || team.mentor.officeAddress || '',
        ]
      );
    }
  } catch (err) {
    console.error('Error syncing normalized members/mentors tables:', err);
  }
}

export function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!url || typeof url !== 'string') return undefined;
  let trimmed = url.trim();
  if (!trimmed || (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://'))) {
    return undefined;
  }
  // Sanitize connection string parameters that might cause TLS channel_binding issue in JS driver
  trimmed = trimmed.replace(/([?&])channel_binding=[^&]*&?/g, '$1').replace(/[?&]$/, '');
  return trimmed;
}

export function isUsingNeon(): boolean {
  return isNeonConnected;
}

// Initialize Neon PostgreSQL or File Fallback
export async function initDatabase(): Promise<void> {
  const dbUrl = getDatabaseUrl();

  if (dbUrl) {
    try {
      console.log('Connecting to Neon PostgreSQL database...');
      
      // Reset active clients
      activePool = null;
      neonSql = null;
      isNeonConnected = false;

      // Try serverless HTTP client first (ultra-reliable for serverless/cloud environments)
      try {
        neonSql = neon(dbUrl);
        await neonSql.query('SELECT 1');
        console.log('Successfully connected to Neon PostgreSQL via HTTP driver!');
      } catch (eHttp) {
        console.warn('Neon HTTP driver failed, trying pg Pool connection...', eHttp);
        try {
          const pgPool = new pg.Pool({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false }
          });
          await pgPool.query('SELECT 1');
          activePool = pgPool;
          console.log('Successfully connected to Neon PostgreSQL via pg Pool!');
        } catch (ePool) {
          console.warn('pg Pool connection failed, trying serverless Pool...', ePool);
          const serverlessPool = new Pool({ connectionString: dbUrl });
          await serverlessPool.query('SELECT 1');
          activePool = serverlessPool;
          console.log('Successfully connected to Neon PostgreSQL via serverless Pool!');
        }
      }

      // Auto-create all required database tables
      await runQuery(`
        CREATE TABLE IF NOT EXISTS app_config (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL
        );
      `);

      await runQuery(`
        CREATE TABLE IF NOT EXISTS teams (
          id TEXT PRIMARY KEY,
          team_name TEXT NOT NULL,
          leader JSONB NOT NULL,
          members JSONB NOT NULL,
          mentor JSONB,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runQuery(`
        CREATE TABLE IF NOT EXISTS members (
          id SERIAL PRIMARY KEY,
          team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          enrollment_no TEXT,
          gender TEXT,
          department TEXT,
          semester TEXT,
          is_leader BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runQuery(`
        CREATE TABLE IF NOT EXISTS mentors (
          id SERIAL PRIMARY KEY,
          team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          organization TEXT,
          designation TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runQuery(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id TEXT PRIMARY KEY,
          recipient_email TEXT NOT NULL,
          recipient_name TEXT NOT NULL,
          team_id TEXT,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          sent_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runQuery(`
        CREATE TABLE IF NOT EXISTS ppt_submissions (
          id TEXT PRIMARY KEY,
          team_id TEXT NOT NULL,
          team_name TEXT NOT NULL,
          leader_name TEXT NOT NULL,
          leader_email TEXT NOT NULL,
          file_url TEXT NOT NULL,
          note TEXT,
          submitted_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      isNeonConnected = true;

      // Seed initial app_config in Neon if missing or update from local DB
      const configRes = await runQuery('SELECT value FROM app_config WHERE key = $1', ['global_settings']);
      const fileDb = ensureFileDb();

      if (configRes.rows.length === 0) {
        const initialConfig = {
          settings: fileDb.settings || INITIAL_SETTINGS,
          timeline: fileDb.timeline || INITIAL_TIMELINE_EVENTS,
          faqs: fileDb.faqs || INITIAL_FAQS,
          rules: fileDb.rules || INITIAL_RULES,
          nextTeamNumber: fileDb.nextTeamNumber || 1,
        };
        await runQuery(
          'INSERT INTO app_config (key, value) VALUES ($1, $2)',
          ['global_settings', JSON.stringify(initialConfig)]
        );
      } else {
        const currentDbConfig = configRes.rows[0].value;
        if (currentDbConfig && currentDbConfig.settings && fileDb.settings) {
          let needsUpdate = false;
          if (currentDbConfig.settings.registrationDeadline !== fileDb.settings.registrationDeadline) {
            currentDbConfig.settings.registrationDeadline = fileDb.settings.registrationDeadline;
            needsUpdate = true;
          }
          if (currentDbConfig.settings.extendedDeadline !== fileDb.settings.extendedDeadline) {
            currentDbConfig.settings.extendedDeadline = fileDb.settings.extendedDeadline;
            needsUpdate = true;
          }
          if (needsUpdate) {
            console.log('Updating Neon database config with updated local deadline settings...');
            await runQuery(
              'UPDATE app_config SET value = $1 WHERE key = $2',
              [JSON.stringify(currentDbConfig), 'global_settings']
            );
          }
        }
      }

      // Sync any local teams from sih_db.json into Neon teams, members, and mentors tables
      if (fileDb.teams && fileDb.teams.length > 0) {
        console.log(`Syncing ${fileDb.teams.length} local teams into Neon PostgreSQL...`);
        for (const t of fileDb.teams) {
          await runQuery(
            `INSERT INTO teams (id, team_name, leader, members, mentor, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET
               team_name = EXCLUDED.team_name,
               leader = EXCLUDED.leader,
               members = EXCLUDED.members,
               mentor = EXCLUDED.mentor,
               status = EXCLUDED.status,
               updated_at = EXCLUDED.updated_at`,
            [
              t.id,
              t.teamName,
              JSON.stringify(t.leader),
              JSON.stringify(t.members),
              t.mentor ? JSON.stringify(t.mentor) : null,
              t.status,
              t.createdAt || new Date().toISOString(),
              t.updatedAt || new Date().toISOString(),
            ]
          );
          await syncNormalizedMembersAndMentors(t);
        }

        // Also sync email logs if any exist locally
        if (fileDb.emailLogs && fileDb.emailLogs.length > 0) {
          for (const log of fileDb.emailLogs) {
            await runQuery(
              `INSERT INTO email_logs (id, recipient_email, recipient_name, team_id, subject, body, type, status, sent_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (id) DO NOTHING`,
              [
                log.id,
                log.recipientEmail,
                log.recipientName,
                log.teamId || null,
                log.subject,
                log.body,
                log.type,
                log.status,
                log.sentAt,
              ]
            );
          }
        }

        // Also update nextTeamNumber in global_settings if needed
        const cfgRes = await runQuery('SELECT value FROM app_config WHERE key = $1', ['global_settings']);
        if (cfgRes.rows.length > 0) {
          const currentConfig = typeof cfgRes.rows[0].value === 'string' ? JSON.parse(cfgRes.rows[0].value) : cfgRes.rows[0].value;
          if (fileDb.nextTeamNumber && fileDb.nextTeamNumber > (currentConfig.nextTeamNumber || 1)) {
            currentConfig.nextTeamNumber = fileDb.nextTeamNumber;
            await runQuery(
              'UPDATE app_config SET value = $1 WHERE key = $2',
              [JSON.stringify(currentConfig), 'global_settings']
            );
          }
        }
      }

      console.log('Successfully connected, initialized and synced Neon PostgreSQL database tables!');
      return;
    } catch (err) {
      console.error('Failed to connect to Neon DB, falling back to local file database:', err);
      isNeonConnected = false;
    }
  } else {
    console.log('No DATABASE_URL found. Running with local JSON database storage.');
  }

  // File-based fallback initialization
  ensureFileDb();
}

function ensureFileDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) { /* ignore on Vercel read-only */ }

  const initialDb: DatabaseSchema = {
    settings: INITIAL_SETTINGS,
    timeline: INITIAL_TIMELINE_EVENTS,
    faqs: INITIAL_FAQS,
    rules: INITIAL_RULES,
    teams: [],
    emailLogs: [],
    nextTeamNumber: 1,
  };

  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
  } catch (err) {
    if (!fs.existsSync(DB_FILE)) return initialDb;
  }

  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.emailLogs) parsed.emailLogs = [];
    return parsed;
  } catch (err) {
    console.error('Error reading DB file, reinitializing', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    } catch (e) {}
    return initialDb;
  }
}

function saveFileDb(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    // Ignore file write errors in read-only environments (like Vercel)
  }
}

// DB Data Getters & Setters

export async function getGlobalConfig() {
  if (isNeonConnected) {
    try {
      const res = await runQuery('SELECT value FROM app_config WHERE key = $1', ['global_settings']);
      if (res.rows.length > 0) {
        let val = res.rows[0].value;
        val = typeof val === 'string' ? JSON.parse(val) : val;
        
        // Migrate legacy string rules to object rules if needed
        if (val.rules && val.rules.length > 0 && typeof val.rules[0] === 'string') {
          val.rules = val.rules.map((ruleStr: string, idx: number) => {
            let categoryId = 'official';
            if (idx >= 7 && idx < 10) categoryId = 'phases';
            else if (idx >= 10) categoryId = 'conduct';
            return {
              id: `r${idx + 1}`,
              categoryId,
              text: ruleStr
            };
          });
        }
        
        const fileDb = ensureFileDb();
        return {
          settings: { ...fileDb.settings, ...(val.settings || {}) },
          timeline: val.timeline || fileDb.timeline,
          faqs: val.faqs || fileDb.faqs,
          rules: val.rules || fileDb.rules,
          nextTeamNumber: val.nextTeamNumber || fileDb.nextTeamNumber || 1,
        };
      }
    } catch (err) {
      console.error('Error fetching global_settings from Neon:', err);
    }
  }
  const fileDb = ensureFileDb();
  return {
    settings: fileDb.settings,
    timeline: fileDb.timeline,
    faqs: fileDb.faqs,
    rules: fileDb.rules,
    nextTeamNumber: fileDb.nextTeamNumber,
  };
}

export async function getNextTeamNumber(): Promise<number> {
  if (isNeonConnected) {
    try {
      const res = await runQuery(`
        UPDATE app_config 
        SET value = jsonb_set(value, '{nextTeamNumber}', (COALESCE((value->>'nextTeamNumber')::int, 1) + 1)::text::jsonb) 
        WHERE key = 'global_settings' 
        RETURNING value->>'nextTeamNumber' as next_num;
      `);
      if (res.rows.length > 0) {
        // We incremented it in the DB, so the number for the CURRENT team is next_num - 1
        return parseInt(res.rows[0].next_num, 10) - 1;
      }
    } catch (err) {
      console.error('Error atomically incrementing nextTeamNumber:', err);
    }
  }
  
  // Fallback for local DB
  const db = ensureFileDb();
  const num = db.nextTeamNumber || 1;
  db.nextTeamNumber = num + 1;
  saveFileDb(db);
  return num;
}

export async function saveGlobalConfig(data: { settings?: EventSettings; timeline?: TimelineEvent[]; faqs?: FAQItem[]; rules?: Rule[]; nextTeamNumber?: number }) {
  const currentConfig = await getGlobalConfig();
  const updated = { ...currentConfig, ...data };

  // Save to Neon DB
  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO app_config (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ['global_settings', JSON.stringify(updated)]
      );
    } catch (err) {
      console.error('Error saving global_settings to Neon:', err);
    }
  }

  // Dual-write to local JSON file
  const db = ensureFileDb();
  if (data.settings) db.settings = { ...db.settings, ...data.settings };
  if (data.timeline) db.timeline = data.timeline;
  if (data.faqs) db.faqs = data.faqs;
  if (data.rules) db.rules = data.rules;
  if (data.nextTeamNumber !== undefined) db.nextTeamNumber = data.nextTeamNumber;
  saveFileDb(db);

  return updated;
}

export async function getAllTeams(): Promise<Team[]> {
  if (isNeonConnected) {
    try {
      const res = await runQuery("SELECT * FROM teams WHERE UPPER(id) != 'SIH2026-000' ORDER BY created_at DESC");
      
      const parsedTeams = res.rows.map((row: any) => {
        let leaderData: any = {};
        let membersData: any = [];
        let mentorData: any = undefined;

        try {
          leaderData = typeof row.leader === 'string' ? JSON.parse(row.leader) : row.leader;
        } catch(e) { console.warn('Failed to parse leader json for team:', row.id); }

        try {
          membersData = typeof row.members === 'string' ? JSON.parse(row.members) : row.members;
        } catch(e) { console.warn('Failed to parse members json for team:', row.id); }

        try {
          if (row.mentor) {
            mentorData = typeof row.mentor === 'string' ? JSON.parse(row.mentor) : row.mentor;
          }
        } catch(e) { console.warn('Failed to parse mentor json for team:', row.id); }

        return {
          id: row.id,
          teamName: row.team_name,
          leader: leaderData,
          members: membersData,
          mentor: mentorData,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
      return parsedTeams;
    } catch (err) {
      console.error('Error fetching teams from Neon, returning file teams:', err);
    }
  }
  const db = ensureFileDb();
  return db.teams.filter((t) => t.id.toUpperCase() !== 'SIH2026-000');
}

export async function getTeamById(id: string): Promise<Team | null> {
  if (id.toUpperCase() === 'SIH2026-000') return null;
  if (isNeonConnected) {
    try {
      const res = await runQuery('SELECT * FROM teams WHERE UPPER(id) = UPPER($1)', [id.trim()]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          teamName: row.team_name,
          leader: typeof row.leader === 'string' ? JSON.parse(row.leader) : row.leader,
          members: typeof row.members === 'string' ? JSON.parse(row.members) : row.members,
          mentor: row.mentor ? (typeof row.mentor === 'string' ? JSON.parse(row.mentor) : row.mentor) : undefined,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } catch (err) {
      console.error('Error fetching team by ID from Neon:', err);
    }
  }
  const db = ensureFileDb();
  return db.teams.find((t) => t.id.toUpperCase() === id.trim().toUpperCase() && t.id.toUpperCase() !== 'SIH2026-000') || null;
}

export async function createTeam(team: Team): Promise<Team> {
  // Save to Neon DB
  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO teams (id, team_name, leader, members, mentor, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           team_name = EXCLUDED.team_name,
           leader = EXCLUDED.leader,
           members = EXCLUDED.members,
           mentor = EXCLUDED.mentor,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
        [
          team.id,
          team.teamName,
          JSON.stringify(team.leader),
          JSON.stringify(team.members),
          team.mentor ? JSON.stringify(team.mentor) : null,
          team.status,
          team.createdAt,
          team.updatedAt,
        ]
      );
      await syncNormalizedMembersAndMentors(team);
    } catch (err) {
      console.error('Error creating team in Neon DB:', err);
    }
  }

  // Always dual-write to local JSON DB
  const db = ensureFileDb();
  const existingIdx = db.teams.findIndex((t) => t.id.toUpperCase() === team.id.toUpperCase());
  if (existingIdx !== -1) {
    db.teams[existingIdx] = team;
  } else {
    db.teams.push(team);
  }
  saveFileDb(db);

  return team;
}

export async function updateTeam(id: string, updatedFields: Partial<Team>): Promise<Team | null> {
  const current = await getTeamById(id);
  if (!current) return null;

  const merged: Team = {
    ...current,
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  };

  let neonSuccess = false;
  if (isNeonConnected) {
    try {
      const res = await runQuery(
        `UPDATE teams 
         SET team_name = $1, leader = $2, members = $3, mentor = $4, status = $5, updated_at = $6
         WHERE UPPER(id) = UPPER($7)`,
        [
          merged.teamName,
          JSON.stringify(merged.leader),
          JSON.stringify(merged.members),
          merged.mentor ? JSON.stringify(merged.mentor) : null,
          merged.status,
          merged.updatedAt,
          id.trim(),
        ]
      );
      if (res.rowCount > 0) neonSuccess = true;
      await syncNormalizedMembersAndMentors(merged);
    } catch (err) {
      console.error('Error updating team in Neon DB:', err);
    }
  }

  // Always dual-write to local JSON DB
  const db = ensureFileDb();
  const idx = db.teams.findIndex((t) => t.id.toUpperCase() === id.trim().toUpperCase());
  if (idx !== -1) {
    db.teams[idx] = merged;
    saveFileDb(db);
    return merged;
  }
  return neonSuccess ? merged : null;
}

export async function deleteTeam(id: string): Promise<boolean> {
  let neonSuccess = false;
  if (isNeonConnected) {
    try {
      const res = await runQuery('DELETE FROM teams WHERE UPPER(id) = UPPER($1)', [id.trim()]);
      if (res.rowCount > 0) neonSuccess = true;
    } catch (err) {
      console.error('Error deleting team in Neon DB:', err);
    }
  }

  const db = ensureFileDb();
  const idx = db.teams.findIndex((t) => t.id.toUpperCase() === id.trim().toUpperCase());
  if (idx !== -1) {
    db.teams.splice(idx, 1);
    saveFileDb(db);
    return true;
  }
  return neonSuccess;
}

// Email Logs

export async function saveEmailLog(log: EmailLog): Promise<EmailLog> {
  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO email_logs (id, recipient_email, recipient_name, team_id, subject, body, type, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, body = EXCLUDED.body`,
        [
          log.id,
          log.recipientEmail,
          log.recipientName,
          log.teamId || null,
          log.subject,
          log.body,
          log.type,
          log.status,
          log.sentAt,
        ]
      );
    } catch (err) {
      console.error('Error saving email log to Neon DB:', err);
    }
  }

  // Dual-write to file DB
  const db = ensureFileDb();
  if (!db.emailLogs) db.emailLogs = [];
  const existingIndex = db.emailLogs.findIndex((l) => l.id === log.id);
  if (existingIndex !== -1) {
    db.emailLogs[existingIndex] = log;
  } else {
    db.emailLogs.unshift(log);
  }
  saveFileDb(db);

  return log;
}

export async function getEmailLogs(): Promise<EmailLog[]> {
  if (isNeonConnected) {
    try {
      const res = await runQuery('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100');
      return res.rows.map((row) => ({
        id: row.id,
        recipientEmail: row.recipient_email,
        recipientName: row.recipient_name,
        teamId: row.team_id || undefined,
        subject: row.subject,
        body: row.body,
        type: row.type,
        status: row.status,
        sentAt: row.sent_at,
      }));
    } catch (err) {
      console.error('Error fetching email logs from Neon DB:', err);
    }
  }

  const db = ensureFileDb();
  return db.emailLogs || [];
}

// =====================
// PPT SUBMISSIONS CRUD
// =====================

import type { PptSubmission } from '../types.js';

export async function createPptSubmission(data: Omit<PptSubmission, 'submittedAt'>): Promise<PptSubmission> {
  const submittedAt = new Date().toISOString();
  const submission: PptSubmission = { ...data, submittedAt };

  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO ppt_submissions (id, team_id, team_name, leader_name, leader_email, file_url, note, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET file_url = EXCLUDED.file_url, note = EXCLUDED.note, submitted_at = EXCLUDED.submitted_at`,
        [
          submission.id,
          submission.teamId,
          submission.teamName,
          submission.leaderName,
          submission.leaderEmail,
          submission.fileUrl,
          submission.note || null,
          submittedAt,
        ]
      );
    } catch (err) {
      console.error('Error saving PPT submission to Neon DB:', err);
    }
  }

  // File DB fallback
  const db = ensureFileDb() as any;
  if (!db.pptSubmissions) db.pptSubmissions = [];
  const existingIdx = db.pptSubmissions.findIndex((s: PptSubmission) => s.id === submission.id);
  if (existingIdx !== -1) {
    db.pptSubmissions[existingIdx] = submission;
  } else {
    db.pptSubmissions.unshift(submission);
  }
  saveFileDb(db);

  return submission;
}

export async function getAllPptSubmissions(): Promise<PptSubmission[]> {
  if (isNeonConnected) {
    try {
      const res = await runQuery('SELECT * FROM ppt_submissions ORDER BY submitted_at DESC');
      return res.rows.map((row: any) => ({
        id: row.id,
        teamId: row.team_id,
        teamName: row.team_name,
        leaderName: row.leader_name,
        leaderEmail: row.leader_email,
        fileUrl: row.file_url,
        note: row.note || undefined,
        submittedAt: row.submitted_at,
      }));
    } catch (err) {
      console.error('Error fetching PPT submissions from Neon DB:', err);
    }
  }

  const db = ensureFileDb() as any;
  return db.pptSubmissions || [];
}

export async function deletePptSubmission(id: string): Promise<void> {
  if (isNeonConnected) {
    try {
      await runQuery('DELETE FROM ppt_submissions WHERE id = $1', [id]);
    } catch (err) {
      console.error('Error deleting PPT submission from Neon DB:', err);
    }
  }

  const db = ensureFileDb() as any;
  if (db.pptSubmissions) {
    db.pptSubmissions = db.pptSubmissions.filter((s: PptSubmission) => s.id !== id);
    saveFileDb(db);
  }
}
