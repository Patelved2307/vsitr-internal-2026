var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/data/initialData.ts
var INITIAL_SETTINGS = {
  registrationDeadline: "2026-08-02T23:59:59.000Z",
  isRegistrationOpen: true,
  whatsappGroupLink: "https://chat.whatsapp.com/SIH2026InternalVSITR",
  announcementBanner: "Internal SIH 2026 Registrations are now OPEN! Deadline: 02 August 2026, 11:59 PM.",
  problemStatementLink: "https://www.sih.gov.in/sih2025PS",
  problemStatementStatus: "Problem statement announcements will be announced once we get update from the official SIH website.",
  pptTemplateLink: "#",
  pptTemplateStatus: "The template will be released soon. Download it from here."
};
var INITIAL_TIMELINE_EVENTS = [
  {
    id: "t1",
    title: "Phase 1: Team Registration Deadline",
    date: "02 August 2026, 11:59 PM",
    description: "All teams must complete 6-member team registration with at least 1 female participant.",
    active: true
  },
  {
    id: "t2",
    title: "Phase 2: Mentor Details Submission",
    date: "05 August 2026, 11:59 PM",
    description: "Registered teams submit verified mentor contact details for final confirmation.",
    active: true
  },
  {
    id: "t3",
    title: "Internal Screening & Presentation Round",
    date: "08 August 2026",
    description: "In-person pitch deck presentation & technical evaluation before faculty panel.",
    active: false
  },
  {
    id: "t4",
    title: "Final Selected Teams Announcement",
    date: "12 August 2026",
    description: "Official nomination of top teams representing VSITR at National SIH 2026.",
    active: false
  }
];
var INITIAL_FAQS = [
  {
    id: "f1",
    question: "Who can participate in Internal SIH 2026?",
    answer: "All enrolled students from Vidush Somany Institute of Technology & Research (VSITR), Kadi across IT, CSE, and CE departments (Semesters 1-8) are eligible to participate."
  },
  {
    id: "f2",
    question: "Is it compulsory to have a female team member?",
    answer: "Yes! Every team MUST include at least 1 female participant. All-girls teams are also fully welcome and eligible."
  },
  {
    id: "f3",
    question: "Can I register without a mentor initially?",
    answer: "Yes! Registration is conducted in two phases. In Phase 1, you complete your 6-member Team Registration before the deadline. In Phase 2, you can submit your Mentor Details using your Team ID."
  },
  {
    id: "f4",
    question: "What happens if my team name already exists?",
    answer: "Team names must be unique across the institute. If your chosen team name is already taken, the registration portal will prompt you to choose another unique name."
  },
  {
    id: "f5",
    question: "Can I edit my team details after submission?",
    answer: "Post-submission changes to team members or details are not allowed through the portal. Any critical modifications require official approval from the organizing committee."
  },
  {
    id: "f6",
    question: "What if I miss the registration deadline?",
    answer: "Registrations automatically close on 02 August 2026, 11:59 PM. Late entries will not be entertained under any circumstances."
  },
  {
    id: "f7",
    question: "How will I receive further updates?",
    answer: "All official updates, screening schedules, and problem statement announcements will be communicated exclusively to the Team Leader via their registered college email and the official WhatsApp group."
  },
  {
    id: "f8",
    question: "Can members be from different departments or semesters?",
    answer: "Yes! Members can be from different departments (IT, CSE, CE) and different semesters/years, provided all 6 members belong to VSITR."
  },
  {
    id: "f9",
    question: "How do I log back in to see my team status?",
    answer: 'Click "Team Login" in the navbar and enter your Team ID (e.g. SIH2026-001), Team Name, and Team Leader Email ID to access your dedicated Team Portal.'
  },
  {
    id: "f10",
    question: "I forgot my Team ID \u2014 how do I recover it?",
    answer: "Check the confirmation email sent to your Team Leader upon registration, or reach out to your club student coordinators with your team leader enrollment number."
  }
];
var CLUB_COORDINATORS = [
  {
    clubName: "Research Club",
    facultyCoordinators: ["Dr. Parita Shah", "Prof. Amit P. Modi"],
    studentCoordinators: [
      { name: "Sorathiya Jenish", sem: "7th Sem" },
      { name: "Patel Ved", sem: "5th Sem" }
    ]
  },
  {
    clubName: "Coding Club",
    facultyCoordinators: ["Prof. Ankit Vaghela", "Prof. Ridhish Sir"],
    studentCoordinators: [
      { name: "Patel Devang", sem: "5th Sem" },
      { name: "Vekariya Jeel", sem: "5th Sem" }
    ]
  },
  {
    clubName: "Soft Skills Club",
    facultyCoordinators: ["Prof. Nirzari S. Patel", "Prof. Nehal Shah"],
    studentCoordinators: [
      { name: "Salina Hirani", sem: "5th Sem" },
      { name: "Christian Sanyam", sem: "5th Sem" }
    ]
  },
  {
    clubName: "Design Club",
    facultyCoordinators: ["Prof. Sanjay Makwana"],
    studentCoordinators: [
      { name: "Patel Dev", sem: "Kadi" },
      { name: "Patel Semi", sem: "3rd Sem" }
    ]
  }
];

// src/db/neonDb.ts
var import_serverless = require("@neondatabase/serverless");
var import_pg = __toESM(require("pg"), 1);
var import_ws = __toESM(require("ws"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
import_serverless.neonConfig.webSocketConstructor = import_ws.default;
import_dotenv.default.config({ path: ".env" });
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "sih_db.json");
var INITIAL_RULES = [
  "Each team must consist of exactly 6 members, including the Team Leader.",
  "Each team must include at least 1 female participant. All-girls teams are welcome and eligible.",
  "All participants must be from the same college (VSITR) \u2014 inter-college teams are not permitted.",
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
  "Any change in team composition or mentor after submission must be communicated to the organizing committee in writing/email \u2014 not self-editable post-deadline."
];
var activePool = null;
var neonSql = null;
var isNeonConnected = false;
async function runQuery(queryText, params = []) {
  if (activePool) {
    const res = await activePool.query(queryText, params);
    return { rows: res.rows || [], rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0) };
  } else if (neonSql) {
    const rows = await neonSql.query(queryText, params);
    const rowsArray = Array.isArray(rows) ? rows : [rows];
    return { rows: rowsArray, rowCount: rowsArray.length };
  }
  throw new Error("No active database client available");
}
async function syncNormalizedMembersAndMentors(team) {
  if (!team || !team.id) return;
  try {
    await runQuery("DELETE FROM members WHERE team_id = $1", [team.id]);
    await runQuery("DELETE FROM mentors WHERE team_id = $1", [team.id]);
    if (team.leader) {
      await runQuery(
        `INSERT INTO members (team_id, full_name, email, phone, enrollment_no, gender, department, semester, is_leader)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          team.id,
          team.leader.fullName || "",
          team.leader.email || "",
          team.leader.mobile || "",
          team.leader.enrollmentNo || "",
          team.leader.gender || "",
          team.leader.department || "",
          team.leader.semester || "",
          true
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
            m.fullName || "",
            m.email || "",
            m.mobile || "",
            m.enrollmentNo || "",
            m.gender || "",
            m.department || "",
            m.semester || "",
            false
          ]
        );
      }
    }
    if (team.mentor && team.mentor.fullName) {
      const fullMentorName = `${team.mentor.prefix || ""} ${team.mentor.fullName}`.trim();
      await runQuery(
        `INSERT INTO mentors (team_id, full_name, email, phone, organization, designation)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          team.id,
          fullMentorName,
          team.mentor.email || "",
          team.mentor.contactNumber || "",
          team.mentor.institute || "",
          team.mentor.department || team.mentor.officeAddress || ""
        ]
      );
    }
  } catch (err) {
    console.error("Error syncing normalized members/mentors tables:", err);
  }
}
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!url || typeof url !== "string") return void 0;
  let trimmed = url.trim();
  if (!trimmed || !trimmed.startsWith("postgres://") && !trimmed.startsWith("postgresql://")) {
    return void 0;
  }
  trimmed = trimmed.replace(/([?&])channel_binding=[^&]*&?/g, "$1").replace(/[?&]$/, "");
  return trimmed;
}
function isUsingNeon() {
  return isNeonConnected;
}
async function initDatabase() {
  const dbUrl = getDatabaseUrl();
  if (dbUrl) {
    try {
      console.log("Connecting to Neon PostgreSQL database...");
      activePool = null;
      neonSql = null;
      isNeonConnected = false;
      try {
        neonSql = (0, import_serverless.neon)(dbUrl);
        await neonSql.query("SELECT 1");
        console.log("Successfully connected to Neon PostgreSQL via HTTP driver!");
      } catch (eHttp) {
        console.warn("Neon HTTP driver failed, trying pg Pool connection...", eHttp);
        try {
          const pgPool = new import_pg.default.Pool({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false }
          });
          await pgPool.query("SELECT 1");
          activePool = pgPool;
          console.log("Successfully connected to Neon PostgreSQL via pg Pool!");
        } catch (ePool) {
          console.warn("pg Pool connection failed, trying serverless Pool...", ePool);
          const serverlessPool = new import_serverless.Pool({ connectionString: dbUrl });
          await serverlessPool.query("SELECT 1");
          activePool = serverlessPool;
          console.log("Successfully connected to Neon PostgreSQL via serverless Pool!");
        }
      }
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
      isNeonConnected = true;
      const configRes = await runQuery("SELECT value FROM app_config WHERE key = $1", ["global_settings"]);
      const fileDb = ensureFileDb();
      if (configRes.rows.length === 0) {
        const initialConfig = {
          settings: fileDb.settings || INITIAL_SETTINGS,
          timeline: fileDb.timeline || INITIAL_TIMELINE_EVENTS,
          faqs: fileDb.faqs || INITIAL_FAQS,
          rules: fileDb.rules || INITIAL_RULES,
          nextTeamNumber: fileDb.nextTeamNumber || 1
        };
        await runQuery(
          "INSERT INTO app_config (key, value) VALUES ($1, $2)",
          ["global_settings", JSON.stringify(initialConfig)]
        );
      }
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
              t.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
              t.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
          await syncNormalizedMembersAndMentors(t);
        }
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
                log.sentAt
              ]
            );
          }
        }
        const cfgRes = await runQuery("SELECT value FROM app_config WHERE key = $1", ["global_settings"]);
        if (cfgRes.rows.length > 0) {
          const currentConfig = typeof cfgRes.rows[0].value === "string" ? JSON.parse(cfgRes.rows[0].value) : cfgRes.rows[0].value;
          if (fileDb.nextTeamNumber && fileDb.nextTeamNumber > (currentConfig.nextTeamNumber || 1)) {
            currentConfig.nextTeamNumber = fileDb.nextTeamNumber;
            await runQuery(
              "UPDATE app_config SET value = $1 WHERE key = $2",
              [JSON.stringify(currentConfig), "global_settings"]
            );
          }
        }
      } else {
        console.log("Local database has no teams. Resetting/clearing Neon PostgreSQL tables for a clean slate...");
        await runQuery("TRUNCATE TABLE members CASCADE;");
        await runQuery("TRUNCATE TABLE mentors CASCADE;");
        await runQuery("TRUNCATE TABLE teams CASCADE;");
        await runQuery("TRUNCATE TABLE email_logs CASCADE;");
        const cfgRes = await runQuery("SELECT value FROM app_config WHERE key = $1", ["global_settings"]);
        if (cfgRes.rows.length > 0) {
          const currentConfig = typeof cfgRes.rows[0].value === "string" ? JSON.parse(cfgRes.rows[0].value) : cfgRes.rows[0].value;
          currentConfig.nextTeamNumber = 1;
          await runQuery(
            "UPDATE app_config SET value = $1 WHERE key = $2",
            [JSON.stringify(currentConfig), "global_settings"]
          );
        }
      }
      console.log("Successfully connected, initialized and synced Neon PostgreSQL database tables!");
      return;
    } catch (err) {
      console.error("Failed to connect to Neon DB, falling back to local file database:", err);
      isNeonConnected = false;
    }
  } else {
    console.log("No DATABASE_URL found. Running with local JSON database storage.");
  }
  ensureFileDb();
}
function ensureFileDb() {
  if (!import_fs.default.existsSync(DATA_DIR)) {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!import_fs.default.existsSync(DB_FILE)) {
    const initialDb = {
      settings: INITIAL_SETTINGS,
      timeline: INITIAL_TIMELINE_EVENTS,
      faqs: INITIAL_FAQS,
      rules: INITIAL_RULES,
      teams: [],
      emailLogs: [],
      nextTeamNumber: 1
    };
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    return initialDb;
  }
  try {
    const data = import_fs.default.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.emailLogs) parsed.emailLogs = [];
    return parsed;
  } catch (err) {
    console.error("Error reading DB file, reinitializing", err);
    const initialDb = {
      settings: INITIAL_SETTINGS,
      timeline: INITIAL_TIMELINE_EVENTS,
      faqs: INITIAL_FAQS,
      rules: INITIAL_RULES,
      teams: [],
      emailLogs: [],
      nextTeamNumber: 1
    };
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    return initialDb;
  }
}
function saveFileDb(db) {
  if (!import_fs.default.existsSync(DATA_DIR)) {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  }
  import_fs.default.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}
async function getGlobalConfig() {
  if (isNeonConnected) {
    try {
      const res = await runQuery("SELECT value FROM app_config WHERE key = $1", ["global_settings"]);
      if (res.rows.length > 0) {
        const val = res.rows[0].value;
        return typeof val === "string" ? JSON.parse(val) : val;
      }
    } catch (err) {
      console.error("Error fetching global_settings from Neon:", err);
    }
  }
  const fileDb = ensureFileDb();
  return {
    settings: fileDb.settings,
    timeline: fileDb.timeline,
    faqs: fileDb.faqs,
    rules: fileDb.rules,
    nextTeamNumber: fileDb.nextTeamNumber
  };
}
async function saveGlobalConfig(data) {
  const currentConfig = await getGlobalConfig();
  const updated = { ...currentConfig, ...data };
  if (isNeonConnected) {
    try {
      await runQuery(
        `INSERT INTO app_config (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ["global_settings", JSON.stringify(updated)]
      );
    } catch (err) {
      console.error("Error saving global_settings to Neon:", err);
    }
  }
  const db = ensureFileDb();
  if (data.settings) db.settings = { ...db.settings, ...data.settings };
  if (data.timeline) db.timeline = data.timeline;
  if (data.faqs) db.faqs = data.faqs;
  if (data.rules) db.rules = data.rules;
  if (data.nextTeamNumber !== void 0) db.nextTeamNumber = data.nextTeamNumber;
  saveFileDb(db);
  return updated;
}
async function getAllTeams() {
  if (isNeonConnected) {
    try {
      const res = await runQuery("SELECT * FROM teams ORDER BY created_at DESC");
      return res.rows.map((row) => ({
        id: row.id,
        teamName: row.team_name,
        leader: typeof row.leader === "string" ? JSON.parse(row.leader) : row.leader,
        members: typeof row.members === "string" ? JSON.parse(row.members) : row.members,
        mentor: row.mentor ? typeof row.mentor === "string" ? JSON.parse(row.mentor) : row.mentor : void 0,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (err) {
      console.error("Error fetching teams from Neon, returning file teams:", err);
    }
  }
  const db = ensureFileDb();
  return db.teams;
}
async function getTeamById(id) {
  if (isNeonConnected) {
    try {
      const res = await runQuery("SELECT * FROM teams WHERE UPPER(id) = UPPER($1)", [id.trim()]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          teamName: row.team_name,
          leader: typeof row.leader === "string" ? JSON.parse(row.leader) : row.leader,
          members: typeof row.members === "string" ? JSON.parse(row.members) : row.members,
          mentor: row.mentor ? typeof row.mentor === "string" ? JSON.parse(row.mentor) : row.mentor : void 0,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch (err) {
      console.error("Error fetching team by ID from Neon:", err);
    }
  }
  const db = ensureFileDb();
  return db.teams.find((t) => t.id.toUpperCase() === id.trim().toUpperCase()) || null;
}
async function createTeam(team) {
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
          team.updatedAt
        ]
      );
      await syncNormalizedMembersAndMentors(team);
      const config = await getGlobalConfig();
      config.nextTeamNumber = (config.nextTeamNumber || 1) + 1;
      await saveGlobalConfig({ nextTeamNumber: config.nextTeamNumber });
    } catch (err) {
      console.error("Error creating team in Neon DB:", err);
    }
  }
  const db = ensureFileDb();
  const existingIdx = db.teams.findIndex((t) => t.id.toUpperCase() === team.id.toUpperCase());
  if (existingIdx !== -1) {
    db.teams[existingIdx] = team;
  } else {
    db.teams.push(team);
    db.nextTeamNumber += 1;
  }
  saveFileDb(db);
  return team;
}
async function updateTeam(id, updatedFields) {
  const current = await getTeamById(id);
  if (!current) return null;
  const merged = {
    ...current,
    ...updatedFields,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (isNeonConnected) {
    try {
      await runQuery(
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
          id.trim()
        ]
      );
      await syncNormalizedMembersAndMentors(merged);
    } catch (err) {
      console.error("Error updating team in Neon DB:", err);
    }
  }
  const db = ensureFileDb();
  const idx = db.teams.findIndex((t) => t.id.toUpperCase() === id.trim().toUpperCase());
  if (idx !== -1) {
    db.teams[idx] = merged;
    saveFileDb(db);
  }
  return merged;
}
async function deleteTeam(id) {
  if (isNeonConnected) {
    try {
      await runQuery("DELETE FROM teams WHERE UPPER(id) = UPPER($1)", [id.trim()]);
    } catch (err) {
      console.error("Error deleting team in Neon DB:", err);
    }
  }
  const db = ensureFileDb();
  const idx = db.teams.findIndex((t) => t.id.toUpperCase() === id.trim().toUpperCase());
  if (idx !== -1) {
    db.teams.splice(idx, 1);
    saveFileDb(db);
    return true;
  }
  return false;
}
async function saveEmailLog(log) {
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
          log.sentAt
        ]
      );
    } catch (err) {
      console.error("Error saving email log to Neon DB:", err);
    }
  }
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
async function getEmailLogs() {
  if (isNeonConnected) {
    try {
      const res = await runQuery("SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100");
      return res.rows.map((row) => ({
        id: row.id,
        recipientEmail: row.recipient_email,
        recipientName: row.recipient_name,
        teamId: row.team_id || void 0,
        subject: row.subject,
        body: row.body,
        type: row.type,
        status: row.status,
        sentAt: row.sent_at
      }));
    } catch (err) {
      console.error("Error fetching email logs from Neon DB:", err);
    }
  }
  const db = ensureFileDb();
  return db.emailLogs || [];
}

// src/services/emailService.ts
var import_nodemailer = __toESM(require("nodemailer"), 1);
var transporter = null;
function resetTransporter() {
  transporter = null;
}
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && host.trim() && user && user.trim() && pass && pass.trim()) {
    transporter = import_nodemailer.default.createTransport({
      host: host.trim(),
      port,
      secure: port === 465,
      auth: { user: user.trim(), pass: pass.trim() },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}
async function sendEmail({
  recipientEmail,
  recipientName,
  teamId,
  subject,
  bodyHtml,
  bodyText,
  type
}) {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || '"Internal SIH 2026 Committee" <sih.vsitr@ksv.ac.in>';
  let status = "simulated";
  let errorMsg = "";
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject,
        html: bodyHtml,
        text: bodyText
      });
      status = "sent";
      console.log(`[Email Sent] Successfully dispatched email to ${recipientEmail} (${subject})`);
    } catch (err) {
      errorMsg = err.message || String(err);
      console.error(`[Email Failed] Could not dispatch to ${recipientEmail}:`, errorMsg);
      status = "failed";
    }
  } else {
    console.log(`[Email Simulated Log] (${type.toUpperCase()}) To: ${recipientName} <${recipientEmail}> | Subject: "${subject}"`);
  }
  const emailLog = {
    id: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    recipientEmail,
    recipientName,
    teamId,
    subject,
    body: errorMsg ? `${bodyText}

[DELIVERY ERROR: ${errorMsg}]` : bodyText,
    type,
    status,
    sentAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await saveEmailLog(emailLog);
  return emailLog;
}
async function resendEmailLog(log) {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || '"Internal SIH 2026 Committee" <sih.vsitr@ksv.ac.in>';
  let updatedStatus = "simulated";
  let errorMsg = "";
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: fromAddress,
        to: log.recipientEmail,
        subject: log.subject,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">${log.body.replace(/\n/g, "<br/>")}</div>`,
        text: log.body
      });
      updatedStatus = "sent";
    } catch (err) {
      errorMsg = err.message || String(err);
      updatedStatus = "failed";
    }
  }
  const updatedLog = {
    ...log,
    status: updatedStatus,
    body: errorMsg ? `${log.body}

[RESEND ERROR: ${errorMsg}]` : log.body.replace(/\[DELIVERY ERROR:.*\]/g, "").trim(),
    sentAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await saveEmailLog(updatedLog);
  return updatedLog;
}
async function dispatchTeamRegistrationEmails(team, appUrl = "http://localhost:3000") {
  const allMembers = [team.leader, ...team.members];
  for (const member of allMembers) {
    const isLeader = member.enrollmentNo === team.leader.enrollmentNo;
    const subject = `[Internal SIH 2026] You are Registered in Team "${team.teamName}" (${team.id})`;
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(90deg, #C1272D, #1B3F8B); padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 800;">Internal SIH 2026 Hackathon</h2>
          <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Vidush Somany Institute of Technology & Research (VSITR, Kadi)</p>
        </div>

        <div style="padding: 24px; color: #1E293B;">
          <p style="font-size: 15px; font-weight: bold; margin-top: 0;">Dear ${member.fullName},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Congratulations! You have been successfully registered for the <strong>Internal Smart India Hackathon (SIH) 2026</strong> at VSITR (KSV University).
          </p>

          <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #1E293B;">
              <tr><td style="padding: 4px 0; color: #64748B; width: 40%;"><strong>Team ID:</strong></td><td style="padding: 4px 0; font-weight: bold; color: #C1272D;">${team.id}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;"><strong>Team Name:</strong></td><td style="padding: 4px 0; font-weight: bold;">${team.teamName}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;"><strong>Your Role:</strong></td><td style="padding: 4px 0; font-weight: bold;">${isLeader ? "Team Leader" : "Team Member"}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;"><strong>Department / Sem:</strong></td><td style="padding: 4px 0;">${member.department} - Sem ${member.semester}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;"><strong>Team Leader:</strong></td><td style="padding: 4px 0;">${team.leader.fullName} (${team.leader.email})</td></tr>
            </table>
          </div>

          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400E; font-weight: bold;">Important SIH Communication Note:</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #78350F; line-height: 1.5;">
              All subsequent hackathon updates, screening schedules, problem statements, and Phase 2 Mentor submissions will be communicated <strong>exclusively to your Team Leader (${team.leader.fullName})</strong>. Please stay in close touch with your Team Leader throughout SIH 2026.
            </p>
          </div>

          <p style="font-size: 13px; color: #475569; margin-bottom: 20px;">
            Team Leaders can log into the SIH Team Portal to check status, join the official WhatsApp coordination group, or submit Phase 2 Mentor details:
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${appUrl}" style="background-color: #1B3F8B; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Visit Internal SIH Portal
            </a>
          </div>

          <p style="font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; pt: 16px; margin-top: 24px; text-align: center;">
            Organized by Research, Coding, Design & Soft Skills Clubs \u2022 VSITR Kadi (KSV)
          </p>
        </div>
      </div>
    `;
    const bodyText = `Dear ${member.fullName},

You have been successfully registered for the Internal Smart India Hackathon (SIH) 2026 at VSITR (KSV).

Team ID: ${team.id}
Team Name: ${team.teamName}
Your Role: ${isLeader ? "Team Leader" : "Team Member"}
Team Leader: ${team.leader.fullName} (${team.leader.email})

IMPORTANT NOTE: All further communication, schedule updates, screening details, and Phase 2 mentor submissions will be shared EXCLUSIVELY with your Team Leader (${team.leader.fullName}). Please coordinate directly with your Team Leader.

Portal URL: ${appUrl}`;
    await sendEmail({
      recipientEmail: member.email,
      recipientName: member.fullName,
      teamId: team.id,
      subject,
      bodyHtml,
      bodyText,
      type: "registration_confirmation"
    });
  }
}
async function dispatchDeadlineReminderToLeader(team, deadlineFormatted, appUrl = "http://localhost:3000") {
  const leader = team.leader;
  const subject = `[Internal SIH 2026] Important Reminder: Registration Editing Deadline (${team.id})`;
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(90deg, #1B3F8B, #C1272D); padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800;">Internal SIH 2026 Team Update Reminder</h2>
        <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">VSITR Kadi (KSV University)</p>
      </div>

      <div style="padding: 24px; color: #1E293B;">
        <p style="font-size: 15px; font-weight: bold; margin-top: 0;">Dear Team Leader (${leader.fullName}),</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          This is an official reminder regarding your team registration for <strong>"${team.teamName}" (${team.id})</strong>.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          The official registration deadline for Internal SIH 2026 is approaching: <strong>${deadlineFormatted}</strong>.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          If you need to make any corrections to your 6 team members' details (enrollment numbers, mobile numbers, department) or submit your Phase 2 Mentor details, please log in now.
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${appUrl}" style="background-color: #C1272D; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Log In & Edit Team Details
          </a>
        </div>
      </div>
    </div>
  `;
  const bodyText = `Dear Team Leader (${leader.fullName}),

This is a reminder regarding your team "${team.teamName}" (${team.id}). The registration deadline is ${deadlineFormatted}.

If you wish to edit your team details or submit Phase 2 mentor details, please log in at ${appUrl}.`;
  await sendEmail({
    recipientEmail: leader.email,
    recipientName: leader.fullName,
    teamId: team.id,
    subject,
    bodyHtml,
    bodyText,
    type: "deadline_reminder"
  });
}

// server.ts
import_dotenv2.default.config({ path: ".env" });
var PORT = 3e3;
async function startServer() {
  await initDatabase();
  const app = (0, import_express.default)();
  app.use(import_express.default.json({ limit: "10mb" }));
  const generateTeamId = (num) => {
    return `SIH2026-${num.toString().padStart(3, "0")}`;
  };
  const getAppUrl = (req) => {
    if (process.env.APP_URL) return process.env.APP_URL;
    return `${req.protocol}://${req.get("host")}`;
  };
  app.get("/api/db/status", async (req, res) => {
    try {
      const isNeon = isUsingNeon();
      const teams = await getAllTeams();
      res.json({
        success: true,
        isNeonConnected: isNeon,
        teamCount: teams.length,
        tables: ["app_config", "teams", "members", "mentors", "email_logs"]
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.post("/api/db/init", async (req, res) => {
    try {
      await initDatabase();
      const isNeon = isUsingNeon();
      const teams = await getAllTeams();
      res.json({
        success: true,
        message: "Database initialized and synced successfully!",
        isNeonConnected: isNeon,
        teamCount: teams.length
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.get("/api/settings", async (req, res) => {
    try {
      const config = await getGlobalConfig();
      res.json({
        settings: config.settings,
        timeline: config.timeline,
        faqs: config.faqs,
        rules: config.rules,
        clubCoordinators: CLUB_COORDINATORS,
        isNeon: isUsingNeon()
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "admin2026" || username === "sih" && password === "vsitr2026") {
      return res.json({ success: true, token: "sih-admin-secret-token-2026", adminName: "VSITR SIH Admin" });
    }
    return res.status(401).json({ success: false, message: "Invalid admin credentials." });
  });
  app.put("/api/settings", async (req, res) => {
    try {
      const { settings, timeline, faqs, rules } = req.body;
      const updatedConfig = await saveGlobalConfig({ settings, timeline, faqs, rules });
      res.json({
        success: true,
        settings: updatedConfig.settings,
        timeline: updatedConfig.timeline,
        faqs: updatedConfig.faqs,
        rules: updatedConfig.rules
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.get("/api/teams/check-name", async (req, res) => {
    try {
      const name = req.query.name;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ success: false, message: "Team name is required." });
      }
      const trimmed = name.trim().toLowerCase();
      const existingTeams = await getAllTeams();
      const exists = existingTeams.some((t) => t.teamName.toLowerCase() === trimmed);
      res.json({ success: true, exists });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.post("/api/register", async (req, res) => {
    try {
      const config = await getGlobalConfig();
      const existingTeams = await getAllTeams();
      const now = /* @__PURE__ */ new Date();
      const deadline = new Date(config.settings.registrationDeadline);
      if (!config.settings.isRegistrationOpen || now > deadline) {
        return res.status(400).json({
          success: false,
          message: "Registrations are currently closed for Internal SIH 2026."
        });
      }
      const { teamName, leader, members } = req.body;
      if (!teamName || !teamName.trim()) {
        return res.status(400).json({ success: false, message: "Team Name is required." });
      }
      const cleanTeamName = teamName.trim();
      if (cleanTeamName.length < 3 || cleanTeamName.length > 10) {
        return res.status(400).json({
          success: false,
          message: "Team name must be between 3 and 10 characters long."
        });
      }
      const lowerName = cleanTeamName.toLowerCase();
      if (lowerName.includes("vsitr") || lowerName.includes("vidush somany") || lowerName.includes("vidushsomany")) {
        return res.status(400).json({
          success: false,
          message: 'Team name must NOT contain the institute name ("VSITR" or "Vidush Somany") per Rule 5.'
        });
      }
      const existingNameTeam = existingTeams.find((t) => t.teamName.toLowerCase() === lowerName);
      if (existingNameTeam) {
        return res.status(400).json({
          success: false,
          title: "Team Name Already Exists",
          message: "This team name has already been registered. Please choose another unique team name."
        });
      }
      if (!leader || !Array.isArray(members) || members.length !== 5) {
        return res.status(400).json({
          success: false,
          title: "Registration Incomplete",
          message: "Each team must consist of exactly 6 members, including the Team Leader."
        });
      }
      const allMembers = [leader, ...members];
      for (let i = 0; i < allMembers.length; i++) {
        const m = allMembers[i];
        if (!m.fullName || !m.enrollmentNo || !m.mobile || !m.email || !m.department || !m.semester || !m.gender) {
          return res.status(400).json({
            success: false,
            title: "Missing Member Information",
            message: `Please complete all details for member ${i + 1} (${m.fullName || "Member"}).`
          });
        }
      }
      const validDepts = ["IT", "CSE", "CE"];
      for (const m of allMembers) {
        if (!validDepts.includes(m.department)) {
          return res.status(400).json({
            success: false,
            title: "Invalid Department",
            message: "Departments must be IT, CSE, or CE only."
          });
        }
      }
      const femaleCount = allMembers.filter((m) => m.gender === "Female").length;
      if (femaleCount < 1) {
        return res.status(400).json({
          success: false,
          title: "Registration Failed",
          message: "Every team must include at least one female participant. Please add the details of a female member before submitting the registration."
        });
      }
      const enrollmentsInTeam = allMembers.map((m) => m.enrollmentNo.trim().toUpperCase());
      const uniqueInTeam = new Set(enrollmentsInTeam);
      if (uniqueInTeam.size !== enrollmentsInTeam.length) {
        return res.status(400).json({
          success: false,
          title: "Duplicate Entry",
          message: "This enrollment number has been entered more than once in your team."
        });
      }
      const memberNames = allMembers.map((m) => m.fullName.trim().toLowerCase());
      if (new Set(memberNames).size !== memberNames.length) {
        return res.status(400).json({
          success: false,
          title: "Duplicate Member Name",
          message: "Each team member must have a unique name. Duplicate names are not allowed within the team."
        });
      }
      const registeredEnrollments = /* @__PURE__ */ new Map();
      existingTeams.forEach((t) => {
        [t.leader, ...t.members].forEach((m) => {
          registeredEnrollments.set(m.enrollmentNo.trim().toUpperCase(), t.teamName);
        });
      });
      for (const enr of enrollmentsInTeam) {
        if (registeredEnrollments.has(enr)) {
          return res.status(400).json({
            success: false,
            title: "Participant Already Registered",
            message: `The enrollment number ${enr} has already been registered with team "${registeredEnrollments.get(enr)}".`
          });
        }
      }
      for (const m of allMembers) {
        if (!/^\d{10}$/.test(m.mobile.trim())) {
          return res.status(400).json({
            success: false,
            title: "Invalid Mobile Number",
            message: `Please enter a valid 10-digit mobile number for ${m.fullName}.`
          });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
          return res.status(400).json({
            success: false,
            title: "Invalid Email Address",
            message: `Please enter a valid email address for ${m.fullName}.`
          });
        }
      }
      const teamNumber = config.nextTeamNumber || 1;
      const teamId = generateTeamId(teamNumber);
      const formattedLeader = { ...leader, isLeader: true };
      const formattedMembers = members.map((m) => ({ ...m, isLeader: false }));
      const newTeam = {
        id: teamId,
        teamName: cleanTeamName,
        leader: formattedLeader,
        members: formattedMembers,
        status: "pending_mentor",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await createTeam(newTeam);
      const appUrl = getAppUrl(req);
      dispatchTeamRegistrationEmails(newTeam, appUrl).catch(
        (e) => console.error("Background email dispatch error:", e)
      );
      res.json({
        success: true,
        teamId,
        teamName: cleanTeamName,
        leaderEmail: formattedLeader.email,
        team: newTeam
      });
    } catch (err) {
      console.error("Error during registration:", err);
      res.status(500).json({ success: false, message: err.message || "Server error during team registration." });
    }
  });
  app.post("/api/login", async (req, res) => {
    try {
      const { teamId, teamName, leaderEmail } = req.body;
      if (!teamId || !teamName || !leaderEmail) {
        return res.status(400).json({
          success: false,
          message: "Please provide Team ID, Team Name, and Team Leader Email."
        });
      }
      const tId = teamId.trim().toUpperCase();
      const tName = teamName.trim().toLowerCase();
      const lEmail = leaderEmail.trim().toLowerCase();
      const existingTeams = await getAllTeams();
      const team = existingTeams.find(
        (t) => t.id.toUpperCase() === tId && t.teamName.toLowerCase() === tName && t.leader.email.toLowerCase() === lEmail
      );
      if (!team) {
        return res.status(401).json({
          success: false,
          title: "Login Failed",
          message: "The details you entered do not match our records. Please check your Team ID, Team Name, and Team Leader Email and try again."
        });
      }
      res.json({ success: true, team });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.put("/api/teams/update", async (req, res) => {
    try {
      const { teamId, teamName, leaderEmail, leader, members, mentor } = req.body;
      if (!teamId || !teamName || !leaderEmail) {
        return res.status(400).json({ success: false, message: "Authentication details required." });
      }
      const currentTeam = await getTeamById(teamId);
      if (!currentTeam || currentTeam.teamName.toLowerCase() !== teamName.trim().toLowerCase() || currentTeam.leader.email.toLowerCase() !== leaderEmail.trim().toLowerCase()) {
        return res.status(401).json({ success: false, message: "Unauthorized or team not found." });
      }
      const updatePayload = {};
      if (leader && Array.isArray(members) && members.length === 5) {
        const allMembers = [leader, ...members];
        const validDepts = ["IT", "CSE", "CE"];
        for (const m of allMembers) {
          if (!validDepts.includes(m.department)) {
            return res.status(400).json({ success: false, message: "Department must be IT, CSE, or CE." });
          }
          if (!/^\d{10}$/.test(m.mobile.trim())) {
            return res.status(400).json({ success: false, message: `Invalid 10-digit mobile for ${m.fullName}` });
          }
        }
        const femaleCount = allMembers.filter((m) => m.gender === "Female").length;
        if (femaleCount < 1) {
          return res.status(400).json({
            success: false,
            message: "Team must include at least one female participant."
          });
        }
        const memberNames = allMembers.map((m) => m.fullName.trim().toLowerCase());
        if (new Set(memberNames).size !== memberNames.length) {
          return res.status(400).json({
            success: false,
            message: "Each team member must have a unique name. Duplicate names are not allowed."
          });
        }
        updatePayload.leader = { ...leader, isLeader: true };
        updatePayload.members = members.map((m) => ({ ...m, isLeader: false }));
      }
      if (mentor) {
        if (!mentor.fullName || !mentor.contactNumber || !mentor.email || !mentor.department) {
          return res.status(400).json({ success: false, message: "Please complete required mentor fields." });
        }
        updatePayload.mentor = {
          ...mentor,
          submittedAt: currentTeam.mentor?.submittedAt || (/* @__PURE__ */ new Date()).toISOString()
        };
        updatePayload.status = "completed";
      }
      const updatedTeam = await updateTeam(teamId, updatePayload);
      res.json({ success: true, team: updatedTeam, message: "Team details updated successfully!" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.get("/api/teams/verify/:id", async (req, res) => {
    try {
      const team = await getTeamById(req.params.id);
      if (!team) {
        return res.status(404).json({ success: false, message: "Registration ID not found." });
      }
      res.json({ success: true, team });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.post("/api/mentor", async (req, res) => {
    try {
      const { teamId, mentor } = req.body;
      if (!teamId || !mentor) {
        return res.status(400).json({ success: false, message: "Team ID and Mentor details are required." });
      }
      const team = await getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, message: "Registration ID not found." });
      }
      if (!mentor.fullName || !mentor.contactNumber || !mentor.email || !mentor.department || !mentor.officeAddress) {
        return res.status(400).json({ success: false, message: "All mentor fields are required." });
      }
      if (!/^\d{10}$/.test(mentor.contactNumber.trim())) {
        return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mentor contact number." });
      }
      const updatedTeam = await updateTeam(teamId, {
        mentor: {
          ...mentor,
          submittedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        status: "completed"
      });
      res.json({ success: true, team: updatedTeam });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.get("/api/admin/teams", async (req, res) => {
    try {
      const { search, department, status, semester, gender } = req.query;
      let result = await getAllTeams();
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (t) => t.id.toLowerCase().includes(q) || t.teamName.toLowerCase().includes(q) || t.leader.fullName.toLowerCase().includes(q) || t.leader.enrollmentNo.toLowerCase().includes(q)
        );
      }
      if (department && department !== "ALL") {
        result = result.filter(
          (t) => [t.leader, ...t.members].some((m) => m.department === department)
        );
      }
      if (status && status !== "ALL") {
        result = result.filter((t) => t.status === status);
      }
      if (semester && semester !== "ALL") {
        result = result.filter(
          (t) => [t.leader, ...t.members].some((m) => m.semester === semester)
        );
      }
      if (gender === "ALL_FEMALE") {
        result = result.filter(
          (t) => [t.leader, ...t.members].every((m) => m.gender === "Female")
        );
      }
      res.json({ success: true, teams: result, total: result.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const teams = await getAllTeams();
      const totalTeams = teams.length;
      let totalParticipants = 0;
      let maleParticipants = 0;
      let femaleParticipants = 0;
      const departmentStats = { IT: 0, CSE: 0, CE: 0 };
      const semesterStats = {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0
      };
      let pendingMentorCount = 0;
      let completedMentorCount = 0;
      const dailyMap = /* @__PURE__ */ new Map();
      teams.forEach((t) => {
        if (t.status === "completed") completedMentorCount++;
        else pendingMentorCount++;
        const dateStr = new Date(t.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        });
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
        const allMembers = [t.leader, ...t.members];
        totalParticipants += allMembers.length;
        allMembers.forEach((m) => {
          if (m.gender === "Male") maleParticipants++;
          if (m.gender === "Female") femaleParticipants++;
          if (departmentStats[m.department] !== void 0) {
            departmentStats[m.department]++;
          }
          if (semesterStats[m.semester] !== void 0) {
            semesterStats[m.semester]++;
          }
        });
      });
      const dailyRegistrations = Array.from(dailyMap.entries()).map(([date, count]) => ({
        date,
        count
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
          dailyRegistrations
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.put("/api/admin/teams/:id", async (req, res) => {
    try {
      const updated = await updateTeam(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Team not found." });
      }
      res.json({ success: true, team: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.delete("/api/admin/teams/:id", async (req, res) => {
    try {
      const ok = await deleteTeam(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, message: "Team not found." });
      }
      res.json({ success: true, message: `Team deleted successfully.` });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.post("/api/admin/trigger-deadline-reminders", async (req, res) => {
    try {
      const config = await getGlobalConfig();
      const teams = await getAllTeams();
      const appUrl = getAppUrl(req);
      const deadlineFormatted = new Date(config.settings.registrationDeadline).toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short"
      });
      let sentCount = 0;
      for (const team of teams) {
        await dispatchDeadlineReminderToLeader(team, deadlineFormatted, appUrl);
        sentCount++;
      }
      res.json({
        success: true,
        sentCount,
        message: `Deadline reminder emails dispatched to ${sentCount} Team Leaders asking if they wish to edit or update their team details.`
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.get("/api/admin/email-logs", async (req, res) => {
    try {
      const logs = await getEmailLogs();
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.post("/api/admin/emails/resend", async (req, res) => {
    try {
      const { emailId } = req.body;
      if (!emailId) {
        return res.status(400).json({ success: false, message: "Email ID required." });
      }
      const logs = await getEmailLogs();
      const targetLog = logs.find((l) => l.id === emailId);
      if (!targetLog) {
        return res.status(404).json({ success: false, message: "Email log not found." });
      }
      const updated = await resendEmailLog(targetLog);
      res.json({
        success: true,
        log: updated,
        message: updated.status === "sent" ? `Email resent successfully to ${updated.recipientEmail}!` : updated.status === "failed" ? `Email resend failed: check SMTP credentials or connection.` : `Email delivery simulated (SMTP server not configured).`
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.post("/api/admin/smtp/test", async (req, res) => {
    try {
      const { host, port, user, pass, from, testRecipient } = req.body;
      if (host) process.env.SMTP_HOST = host;
      if (port) process.env.SMTP_PORT = String(port);
      if (user) process.env.SMTP_USER = user;
      if (pass) process.env.SMTP_PASS = pass;
      if (from) process.env.SMTP_FROM = from;
      resetTransporter();
      const recipient = testRecipient || user || "admin@vsitr.ac.in";
      const result = await sendEmail({
        recipientEmail: recipient,
        recipientName: "Admin Tester",
        subject: "[Internal SIH 2026] SMTP Integration Test",
        bodyHtml: "<p>This is a test email sent from the Internal SIH 2026 portal to verify SMTP server integration.</p>",
        bodyText: "This is a test email sent from the Internal SIH 2026 portal to verify SMTP server integration.",
        type: "admin_announcement"
      });
      if (result.status === "sent") {
        res.json({ success: true, message: `SMTP test email successfully sent to ${recipient}!`, log: result });
      } else if (result.status === "failed") {
        res.status(400).json({ success: false, message: `SMTP Test Failed. Please verify host, port, username, or App Password.`, log: result });
      } else {
        res.json({ success: true, message: `Simulated Email Dispatch: SMTP credentials not set. Simulated log saved.`, log: result });
      }
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.get("/api/export/csv", async (req, res) => {
    try {
      const teams = await getAllTeams();
      let csv = "Team ID,Team Name,Status,Leader Name,Leader Email,Leader Phone,Leader Enrolment,Leader Dept,Leader Sem,Female Members Count,Mentor Name,Mentor Contact,Mentor Email,Registered At\n";
      teams.forEach((t) => {
        const allMembers = [t.leader, ...t.members];
        const females = allMembers.filter((m) => m.gender === "Female").length;
        const mName = t.mentor ? `"${t.mentor.prefix} ${t.mentor.fullName}"` : "Pending";
        const mContact = t.mentor ? t.mentor.contactNumber : "";
        const mEmail = t.mentor ? t.mentor.email : "";
        csv += `"${t.id}","${t.teamName}","${t.status}","${t.leader.fullName}","${t.leader.email}","${t.leader.mobile}","${t.leader.enrollmentNo}","${t.leader.department}","${t.leader.semester}",${females},${mName},"${mContact}","${mEmail}","${t.createdAt}"
`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="VSITR_SIH_2026_Teams.csv"');
      res.status(200).send(csv);
    } catch (err) {
      res.status(500).send("Error generating CSV");
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Internal SIH 2026 Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
