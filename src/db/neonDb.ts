import { Pool, neon, neonConfig } from '@neondatabase/serverless';
import pg from 'pg';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { EventSettings, FAQItem, Team, TimelineEvent, EmailLog, Rule, ProblemStatement } from '../types.js';
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
  problemStatements: ProblemStatement[];
  pptSubmissions?: PptSubmission[];
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
export async function initDatabase(force = false): Promise<void> {
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

      // Check if database tables already exist to skip migrations & seeding (prevents serverless cold start latency)
      if (!force) {
        try {
          const checkRes = await runQuery(`
            SELECT EXISTS (
              SELECT FROM pg_tables 
              WHERE schemaname = 'public' 
              AND tablename = 'app_config'
            );
          `);
          if (checkRes.rows && checkRes.rows[0] && (checkRes.rows[0].exists === true || checkRes.rows[0].exists === 't')) {
            isNeonConnected = true;
            console.log('Database tables already exist. Running schema migrations, syncing test team & settings...');
            await runTableMigrations();
            await ensureTestTeamSeeded();
            return;
          }
        } catch (err) {
          console.warn('App config table check failed, will run full database initialization:', err);
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
          ppt_file_name TEXT,
          ppt_file_url TEXT,
          ppt_file_size BIGINT,
          demo_video_url TEXT,
          github_repo_url TEXT,
          github_collaborators_added BOOLEAN DEFAULT FALSE,
          submitted_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runQuery(`
        CREATE TABLE IF NOT EXISTS problem_statements (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'open',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runTableMigrations();

      await runQuery(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS selected_ps_id TEXT;`);
      await runQuery(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS selected_ps_title TEXT;`);
      await runQuery(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS ps_selected_at TIMESTAMPTZ;`);
      await runQuery(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS ppt_submission JSONB;`);

      await runQuery(`ALTER TABLE problem_statements ADD COLUMN IF NOT EXISTS sdg TEXT;`);
      await runQuery(`ALTER TABLE problem_statements ADD COLUMN IF NOT EXISTS theme TEXT;`);

      // Seed and synchronize default problem statements in Neon DB
      for (const ps of INITIAL_PROBLEM_STATEMENTS) {
        await runQuery(
          `INSERT INTO problem_statements (id, title, category, description, status, sdg, theme)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             category = EXCLUDED.category,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             sdg = EXCLUDED.sdg,
             theme = EXCLUDED.theme`,
          [ps.id, ps.title, ps.category, ps.description || null, ps.status, ps.sdg || null, ps.theme || null]
        );
      }

      isNeonConnected = true;

      // Seed initial app_config in Neon if missing or sync Neon settings into local DB
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
        const neonConfig = typeof configRes.rows[0].value === 'string' ? JSON.parse(configRes.rows[0].value) : configRes.rows[0].value;
        if (neonConfig.settings) fileDb.settings = { ...fileDb.settings, ...neonConfig.settings };
        if (neonConfig.timeline) fileDb.timeline = neonConfig.timeline;
        if (neonConfig.faqs) fileDb.faqs = neonConfig.faqs;
        if (neonConfig.rules) fileDb.rules = neonConfig.rules;
        saveFileDb(fileDb);
      }

      // Sync any local teams from sih_db.json into Neon teams, members, and mentors tables
      if (fileDb.teams && fileDb.teams.length > 0) {
        console.log(`Syncing ${fileDb.teams.length} local teams into Neon PostgreSQL...`);
        for (const t of fileDb.teams) {
          const res = await runQuery(
            `INSERT INTO teams (id, team_name, leader, members, mentor, status, selected_ps_id, selected_ps_title, ps_selected_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET
               team_name = EXCLUDED.team_name,
               leader = EXCLUDED.leader,
               members = EXCLUDED.members,
               mentor = EXCLUDED.mentor,
               status = EXCLUDED.status,
               selected_ps_id = COALESCE(EXCLUDED.selected_ps_id, teams.selected_ps_id),
               selected_ps_title = COALESCE(EXCLUDED.selected_ps_title, teams.selected_ps_title),
               ps_selected_at = COALESCE(EXCLUDED.ps_selected_at, teams.ps_selected_at),
               updated_at = EXCLUDED.updated_at`,
            [
              t.id,
              t.teamName,
              JSON.stringify(t.leader),
              JSON.stringify(t.members),
              t.mentor ? JSON.stringify(t.mentor) : null,
              t.status,
              t.selectedPsId || null,
              t.selectedPsTitle || null,
              t.psSelectedAt || null,
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

      await ensureTestTeamSeeded();

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
  await ensureTestTeamSeeded();
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
    problemStatements: INITIAL_PROBLEM_STATEMENTS,
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
    if (!parsed.teams) parsed.teams = [];
    const testTeamIdx = parsed.teams.findIndex((t: any) => t.id && t.id.toUpperCase() === 'SIH2026-000');
    if (testTeamIdx === -1) {
      parsed.teams.unshift(TEST_TEAM);
    }
    saveFileDb(parsed);
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
        const mergedSettings = { ...fileDb.settings, ...(val.settings || {}) };
        if (!mergedSettings.pptSubmissionDeadline || mergedSettings.pptSubmissionDeadline === '25 August 2026, 11:59 PM' || mergedSettings.pptSubmissionDeadline.includes('23 August')) {
          mergedSettings.pptSubmissionDeadline = '25 August 2026, 12:00 AM';
        }
        const mergedTimeline = (val.timeline || fileDb.timeline).map((t: any) => {
          if (t.id === 't4') {
            return {
              ...t,
              title: 'PPT, Video Clip & 20% Prototype Submission',
              date: '25 August 2026, 12:00 AM',
              description: 'Submit your PowerPoint deck (.ppt/.pptx), 2-minute YouTube video pitch clip, and 20% prototype code repository by 12:00 AM.',
              active: true,
            };
          }
          if (t.id === 't5') {
            return {
              ...t,
              title: 'PPT Presentation Day',
              date: '26 August 2026 (Time will be shared soon)',
              description: 'In-person pitch deck presentation & technical evaluation before faculty panel. Venue: Gandhinagar Campus. Schedule & time slots will be shared soon.',
            };
          }
          return t;
        });
        return {
          settings: mergedSettings,
          timeline: mergedTimeline,
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
  if (!fileDb.settings.pptSubmissionDeadline || fileDb.settings.pptSubmissionDeadline === '25 August 2026, 11:59 PM' || fileDb.settings.pptSubmissionDeadline.includes('23 August')) {
    fileDb.settings.pptSubmissionDeadline = '25 August 2026, 12:00 AM';
    saveFileDb(fileDb);
  }
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

export async function saveGlobalConfig(data: { settings?: Partial<EventSettings>; timeline?: TimelineEvent[]; faqs?: FAQItem[]; rules?: Rule[]; nextTeamNumber?: number }) {
  const currentConfig = await getGlobalConfig();
  const mergedSettings = data.settings
    ? { ...currentConfig.settings, ...data.settings }
    : currentConfig.settings;

  const updated = {
    ...currentConfig,
    ...data,
    settings: mergedSettings,
  };

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
  if (data.settings) db.settings = mergedSettings;
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

        let pptSubmissionData: any = undefined;
        try {
          if (row.ppt_submission) {
            pptSubmissionData = typeof row.ppt_submission === 'string' ? JSON.parse(row.ppt_submission) : row.ppt_submission;
          }
        } catch(e) { console.warn('Failed to parse ppt_submission json for team:', row.id); }

        return {
          id: row.id,
          teamName: row.team_name,
          leader: leaderData,
          members: membersData,
          mentor: mentorData,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          selectedPsId: row.selected_ps_id || undefined,
          selectedPsTitle: row.selected_ps_title || undefined,
          psSelectedAt: row.ps_selected_at || undefined,
          pptSubmission: pptSubmissionData,
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
  const cleanId = (id || '').trim().toUpperCase();
  if (isNeonConnected) {
    try {
      const res = await runQuery('SELECT * FROM teams WHERE UPPER(id) = UPPER($1)', [cleanId]);
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
          selectedPsId: row.selected_ps_id || undefined,
          selectedPsTitle: row.selected_ps_title || undefined,
          psSelectedAt: row.ps_selected_at || undefined,
          pptSubmission: row.ppt_submission ? (typeof row.ppt_submission === 'string' ? JSON.parse(row.ppt_submission) : row.ppt_submission) : undefined,
        };
      }
    } catch (err) {
      console.error('Error fetching team by ID from Neon:', err);
    }
  }
  if (cleanId === 'SIH2026-000') {
    const db = ensureFileDb();
    const foundInDb = db.teams.find((t) => t.id.toUpperCase() === 'SIH2026-000');
    return foundInDb || TEST_TEAM;
  }
  const db = ensureFileDb();
  return db.teams.find((t) => t.id.toUpperCase() === cleanId) || null;
}

export async function createTeam(team: Team): Promise<Team> {
  // Save to Neon DB
  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO teams (id, team_name, leader, members, mentor, status, selected_ps_id, selected_ps_title, ps_selected_at, ppt_submission, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           team_name = EXCLUDED.team_name,
           leader = EXCLUDED.leader,
           members = EXCLUDED.members,
           mentor = EXCLUDED.mentor,
           status = EXCLUDED.status,
           selected_ps_id = EXCLUDED.selected_ps_id,
           selected_ps_title = EXCLUDED.selected_ps_title,
           ps_selected_at = EXCLUDED.ps_selected_at,
           ppt_submission = EXCLUDED.ppt_submission,
           updated_at = EXCLUDED.updated_at`,
        [
          team.id,
          team.teamName,
          JSON.stringify(team.leader),
          JSON.stringify(team.members),
          team.mentor ? JSON.stringify(team.mentor) : null,
          team.status,
          team.selectedPsId || null,
          team.selectedPsTitle || null,
          team.psSelectedAt || null,
          team.pptSubmission ? JSON.stringify(team.pptSubmission) : null,
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
         SET team_name = $1, leader = $2, members = $3, mentor = $4, status = $5, updated_at = $6,
             selected_ps_id = $7, selected_ps_title = $8, ps_selected_at = $9, ppt_submission = $10
         WHERE UPPER(id) = UPPER($11)
         RETURNING *`,
        [
          merged.teamName,
          JSON.stringify(merged.leader),
          JSON.stringify(merged.members),
          merged.mentor ? JSON.stringify(merged.mentor) : null,
          merged.status,
          merged.updatedAt,
          merged.selectedPsId || null,
          merged.selectedPsTitle || null,
          merged.psSelectedAt || null,
          merged.pptSubmission ? JSON.stringify(merged.pptSubmission) : null,
          id.trim(),
        ]
      );
      if (res.rows && res.rows.length > 0) {
        neonSuccess = true;
      } else {
        await createTeam(merged);
      }
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
  } else {
    db.teams.push(merged);
  }
  saveFileDb(db);
  return merged;
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
      const res = await runQuery('SELECT * FROM email_logs ORDER BY sent_at DESC');
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

export async function runTableMigrations() {
  if (!isNeonConnected) return;
  try {
    await runQuery(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS selected_ps_id TEXT;`);
    await runQuery(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS selected_ps_title TEXT;`);
    await runQuery(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS ps_selected_at TIMESTAMPTZ;`);
    await runQuery(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS ppt_submission JSONB;`);

    // Clean column reorganization for ppt_submissions table
    await runQuery(`ALTER TABLE ppt_submissions ADD COLUMN IF NOT EXISTS ppt_file_name TEXT;`);
    await runQuery(`ALTER TABLE ppt_submissions ADD COLUMN IF NOT EXISTS ppt_file_url TEXT;`);
    await runQuery(`ALTER TABLE ppt_submissions ADD COLUMN IF NOT EXISTS ppt_file_size BIGINT;`);
    await runQuery(`ALTER TABLE ppt_submissions ADD COLUMN IF NOT EXISTS demo_video_url TEXT;`);
    await runQuery(`ALTER TABLE ppt_submissions ADD COLUMN IF NOT EXISTS github_repo_url TEXT;`);
    await runQuery(`ALTER TABLE ppt_submissions ADD COLUMN IF NOT EXISTS github_collaborators_added BOOLEAN DEFAULT FALSE;`);

    // Drop legacy unused columns if present
    await runQuery(`ALTER TABLE ppt_submissions DROP COLUMN IF EXISTS file_url;`).catch(() => {});
    await runQuery(`ALTER TABLE ppt_submissions DROP COLUMN IF EXISTS note;`).catch(() => {});
  } catch (e) {
    console.error('Error running table migrations:', e);
  }
}

export async function createPptSubmission(data: any): Promise<PptSubmission> {
  const submittedAt = data.submittedAt || new Date().toISOString();
  const fileUrl = data.pptFileUrl || data.fileUrl || '';
  const fileName = data.pptFileName || data.fileName || '';
  const submission: any = {
    ...data,
    pptFileUrl: fileUrl,
    fileUrl: fileUrl,
    pptFileName: fileName,
    fileName: fileName,
    submittedAt,
  };

  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO ppt_submissions (id, team_id, team_name, leader_name, leader_email, ppt_file_name, ppt_file_url, ppt_file_size, demo_video_url, github_repo_url, github_collaborators_added, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           team_name = EXCLUDED.team_name,
           leader_name = EXCLUDED.leader_name,
           leader_email = EXCLUDED.leader_email,
           ppt_file_name = EXCLUDED.ppt_file_name,
           ppt_file_url = EXCLUDED.ppt_file_url,
           ppt_file_size = EXCLUDED.ppt_file_size,
           demo_video_url = EXCLUDED.demo_video_url,
           github_repo_url = EXCLUDED.github_repo_url,
           github_collaborators_added = EXCLUDED.github_collaborators_added,
           submitted_at = EXCLUDED.submitted_at`,
        [
          submission.id || `PPT-${submission.teamId || 'TEAM'}-${Date.now()}`,
          submission.teamId || '',
          submission.teamName || '',
          submission.leaderName || '',
          submission.leaderEmail || '',
          submission.pptFileName || null,
          submission.pptFileUrl || null,
          submission.pptFileSize || null,
          submission.demoVideoUrl || null,
          submission.githubRepoUrl || null,
          submission.githubCollaboratorsAdded ?? false,
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

  // Automatically dispatch confirmation emails to team leader & team members
  try {
    const teamData = await getTeamById(submission.teamId);
    if (teamData) {
      const { dispatchPptSubmissionEmail } = await import('../services/emailService.js');
      await dispatchPptSubmissionEmail(teamData, submission);
    }
  } catch (emailErr) {
    console.error('Error dispatching PPT submission confirmation emails:', emailErr);
  }

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
        pptFileName: row.ppt_file_name || row.file_name,
        pptFileUrl: row.ppt_file_url || row.file_url,
        fileUrl: row.ppt_file_url || row.file_url,
        fileName: row.ppt_file_name || row.file_name,
        pptFileSize: row.ppt_file_size,
        demoVideoUrl: row.demo_video_url,
        githubRepoUrl: row.github_repo_url,
        githubCollaboratorsAdded: row.github_collaborators_added,
        submittedAt: row.submitted_at,
      }));
    } catch (err) {
      console.error('Error fetching PPT submissions from Neon DB:', err);
    }
  }

  const db = ensureFileDb() as any;
  const list = db.pptSubmissions || [];
  return list.map((s: any) => ({
    ...s,
    fileUrl: s.fileUrl || s.pptFileUrl,
    pptFileUrl: s.pptFileUrl || s.fileUrl,
    fileName: s.fileName || s.pptFileName,
    pptFileName: s.pptFileName || s.fileName,
  }));
}

export async function deletePptSubmission(id: string): Promise<void> {
  let targetTeamId: string | null = null;
  if (isNeonConnected) {
    try {
      const selectRes = await runQuery('SELECT team_id FROM ppt_submissions WHERE id = $1', [id]);
      if (selectRes.rows.length > 0 && selectRes.rows[0].team_id) {
        targetTeamId = selectRes.rows[0].team_id;
      }
      await runQuery('DELETE FROM ppt_submissions WHERE id = $1', [id]);
      if (targetTeamId) {
        await runQuery('UPDATE teams SET ppt_submission = NULL WHERE id = $1', [targetTeamId]);
      }
    } catch (err) {
      console.error('Error deleting PPT submission from Neon DB:', err);
    }
  }

  const db = ensureFileDb() as any;
  if (db.pptSubmissions) {
    const existing = db.pptSubmissions.find((s: PptSubmission) => s.id === id);
    if (existing && existing.teamId) {
      targetTeamId = existing.teamId;
    }
    db.pptSubmissions = db.pptSubmissions.filter((s: PptSubmission) => s.id !== id);
    if (targetTeamId && db.teams) {
      const teamIdx = db.teams.findIndex((t: any) => t.id.toUpperCase() === targetTeamId!.toUpperCase());
      if (teamIdx !== -1) {
        delete db.teams[teamIdx].pptSubmission;
      }
    }
    saveFileDb(db);
  }
}

// =============================
// PROBLEM STATEMENTS CRUD & SELECTION
// =============================

export const INITIAL_PROBLEM_STATEMENTS: ProblemStatement[] = [
  {
    id: "7-L",
    title: "AI-Powered Academic Dropout Prediction and Intervention System",
    category: "EdTech & Learning Analytics",
    description: "Develop a platform that analyzes attendance, academic performance, learning behavior, and socio-economic indicators to identify students at risk of dropping out and recommend personalized interventions.",
    status: "open",
    sdg: "SDG 4: Quality Education",
    theme: "AI for Education and Human Development"
  },
  {
    id: "8-L",
    title: "Smart Waste Management and Citizen Reporting Platform",
    category: "Smart Governance",
    description: "Create a system that enables citizens to report waste issues, tracks collection vehicles, predicts waste generation hotspots, and optimizes collection routes.",
    status: "open",
    sdg: "SDG 11: Sustainable Cities, SDG 12: Responsible Consumption",
    theme: "Digital Solutions for Smart Cities and Circular Economy"
  }
];

export async function getAllProblemStatements(): Promise<ProblemStatement[]> {
  if (isNeonConnected) {
    try {
      const res = await runQuery('SELECT * FROM problem_statements ORDER BY id ASC');
      return res.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        description: row.description || undefined,
        status: row.status as 'open' | 'closed',
        createdAt: row.created_at,
        sdg: row.sdg || undefined,
        theme: row.theme || undefined,
      }));
    } catch (err) {
      console.error('Error fetching problem statements from Neon DB:', err);
    }
  }

  const db = ensureFileDb();
  return db.problemStatements || [];
}

export async function createProblemStatement(ps: ProblemStatement): Promise<ProblemStatement> {
  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO problem_statements (id, title, category, description, status, sdg, theme)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           status = EXCLUDED.status,
           sdg = EXCLUDED.sdg,
           theme = EXCLUDED.theme`,
        [ps.id, ps.title, ps.category, ps.description || null, ps.status, ps.sdg || null, ps.theme || null]
      );
    } catch (err) {
      console.error('Error creating problem statement in Neon DB:', err);
    }
  }

  const db = ensureFileDb();
  if (!db.problemStatements) db.problemStatements = [];
  const existingIdx = db.problemStatements.findIndex((p) => p.id === ps.id);
  if (existingIdx !== -1) {
    db.problemStatements[existingIdx] = ps;
  } else {
    db.problemStatements.push(ps);
  }
  saveFileDb(db);

  return ps;
}

export async function updateProblemStatement(id: string, fields: Partial<ProblemStatement>): Promise<ProblemStatement | null> {
  const all = await getAllProblemStatements();
  const target = all.find((p) => p.id === id);
  if (!target) return null;

  const merged = { ...target, ...fields };

  if (isNeonConnected) {
    try {
      await runQuery(
        `UPDATE problem_statements
         SET title = $1, category = $2, description = $3, status = $4, sdg = $5, theme = $6
         WHERE id = $7`,
        [merged.title, merged.category, merged.description || null, merged.status, merged.sdg || null, merged.theme || null, id]
      );
    } catch (err) {
      console.error('Error updating problem statement in Neon DB:', err);
    }
  }

  const db = ensureFileDb();
  const idx = db.problemStatements.findIndex((p) => p.id === id);
  if (idx !== -1) {
    db.problemStatements[idx] = merged;
    saveFileDb(db);
  }

  return merged;
}

export async function deleteProblemStatement(id: string): Promise<boolean> {
  let neonSuccess = false;
  if (isNeonConnected) {
    try {
      const res = await runQuery('DELETE FROM problem_statements WHERE id = $1', [id]);
      if (res.rowCount > 0) neonSuccess = true;
    } catch (err) {
      console.error('Error deleting problem statement in Neon DB:', err);
    }
  }

  const db = ensureFileDb();
  const idx = db.problemStatements.findIndex((p) => p.id === id);
  if (idx !== -1) {
    db.problemStatements.splice(idx, 1);
    saveFileDb(db);
    return true;
  }
  return neonSuccess;
}

export async function updateTeamPsSelection(teamId: string, psId: string | null, psTitle: string | null): Promise<Team | null> {
  const team = await getTeamById(teamId);
  if (!team) return null;

  const updatedFields = {
    selectedPsId: psId || undefined,
    selectedPsTitle: psTitle || undefined,
    psSelectedAt: psId ? new Date().toISOString() : undefined,
  };

  return await updateTeam(teamId, updatedFields);
}

export async function updateTeamPptSubmission(teamId: string, pptSubmission: PptSubmission): Promise<Team | null> {
  const team = await getTeamById(teamId);
  if (!team) return null;

  return await updateTeam(teamId, { pptSubmission });
}

export const TEST_TEAM: Team = {
  id: 'SIH2026-000',
  teamName: 'VSITR Testing Team (Internal)',
  leader: {
    fullName: 'Test Leader (VSITR)',
    enrollmentNo: '24BECSE54999',
    mobile: '9876543210',
    email: 'test.sih2026@vsitr.ac.in',
    department: 'CSE',
    semester: '5',
    gender: 'Male',
    isLeader: true,
  },
  members: [
    { fullName: 'Member One', enrollmentNo: '24BECSE54998', mobile: '9876543211', email: 'member1@vsitr.ac.in', department: 'CSE', semester: '5', gender: 'Female', isLeader: false },
    { fullName: 'Member Two', enrollmentNo: '24BECSE54997', mobile: '9876543212', email: 'member2@vsitr.ac.in', department: 'CSE', semester: '5', gender: 'Male', isLeader: false },
    { fullName: 'Member Three', enrollmentNo: '24BEIT54996', mobile: '9876543213', email: 'member3@vsitr.ac.in', department: 'IT', semester: '5', gender: 'Male', isLeader: false },
    { fullName: 'Member Four', enrollmentNo: '24BECE54995', mobile: '9876543214', email: 'member4@vsitr.ac.in', department: 'CE', semester: '5', gender: 'Male', isLeader: false },
    { fullName: 'Member Five', enrollmentNo: '24BEIT54994', mobile: '9876543215', email: 'member5@vsitr.ac.in', department: 'IT', semester: '5', gender: 'Male', isLeader: false },
  ],
  mentor: {
    prefix: 'Prof.',
    fullName: 'Dr. Testing Mentor',
    contactNumber: '9876543216',
    email: 'mentor.test@vsitr.ac.in',
    department: 'CSE',
    institute: 'VSITR Kadi',
    submittedAt: '2026-08-05T10:00:00.000Z',
  },
  status: 'completed',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

export async function ensureTestTeamSeeded() {
  const db = ensureFileDb();
  const idx = db.teams.findIndex((t) => t.id.toUpperCase() === 'SIH2026-000');
  if (idx === -1) {
    db.teams.push(TEST_TEAM);
    saveFileDb(db);
  }

  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO teams (id, team_name, leader, members, mentor, status, selected_ps_id, selected_ps_title, ps_selected_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          TEST_TEAM.id,
          TEST_TEAM.teamName,
          JSON.stringify(TEST_TEAM.leader),
          JSON.stringify(TEST_TEAM.members),
          TEST_TEAM.mentor ? JSON.stringify(TEST_TEAM.mentor) : null,
          TEST_TEAM.status,
          TEST_TEAM.selectedPsId || null,
          TEST_TEAM.selectedPsTitle || null,
          TEST_TEAM.psSelectedAt || null,
          TEST_TEAM.createdAt,
          TEST_TEAM.updatedAt,
        ]
      );
    } catch (e) {
      console.error('Error seeding test team SIH2026-000 into Neon DB:', e);
    }
  }
}
