-- SIH Portal Database Schema for Neon PostgreSQL
-- Run this script in the Neon SQL Editor if you wish to manually re-run or inspect table structures.

-- 1. App Configuration Table (Global settings, timelines, FAQs, rules, next team number counter)
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- 2. Problem Statements Table
CREATE TABLE IF NOT EXISTS problem_statements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Software', 'Hardware', or 'Both'
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- 'open' or 'closed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Teams Table (Stores team info, leader details, members array, mentor details, registration status, and PS selection)
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL,
    leader JSONB NOT NULL,
    members JSONB NOT NULL,
    mentor JSONB,
    status TEXT NOT NULL,
    selected_ps_id TEXT REFERENCES problem_statements(id) ON DELETE SET NULL,
    selected_ps_title TEXT,
    selected_ps_organization TEXT,
    selected_ps_category TEXT,
    selected_ps_theme TEXT,
    ps_selected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Members Table (Individual member records including leaders)
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

-- 4. Mentors Table (Team mentors)
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

-- 6. Email Logs Table (Tracks all system notification emails)
CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PPT Submissions Table (Stores phase 3 presentation details)
CREATE TABLE IF NOT EXISTS ppt_submissions (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
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

-- 8. Leader Edit Requests Table (Queued change requests from team leaders for their own fields)
CREATE TABLE IF NOT EXISTS leader_edit_requests (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_name TEXT,
    leader_name TEXT,
    field_name TEXT NOT NULL,   -- e.g. 'fullName', 'email', 'mobile', 'enrollmentNo', 'department', 'semester', 'gender'
    old_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- Helper Views for Neon SQL Editor to query normalized Member, Leader, and Mentor details:

-- View for Team Leaders
CREATE OR REPLACE VIEW v_team_leaders AS
SELECT 
    t.id AS team_id,
    t.team_name,
    t.status,
    t.leader->>'fullName' AS leader_name,
    t.leader->>'email' AS leader_email,
    t.leader->>'phone' AS leader_phone,
    t.leader->>'enrollmentNo' AS leader_enrollment_no,
    t.leader->>'gender' AS leader_gender,
    t.leader->>'department' AS leader_department,
    t.leader->>'semester' AS leader_semester
FROM teams t;

-- View for All Team Members (Expands members JSONB array)
CREATE OR REPLACE VIEW v_team_members AS
SELECT 
    t.id AS team_id,
    t.team_name,
    m->>'fullName' AS member_name,
    m->>'email' AS member_email,
    m->>'phone' AS member_phone,
    m->>'enrollmentNo' AS member_enrollment_no,
    m->>'gender' AS member_gender,
    m->>'department' AS member_department,
    m->>'semester' AS member_semester
FROM teams t,
LATERAL jsonb_array_elements(t.members) AS m;

-- View for Team Mentors
CREATE OR REPLACE VIEW v_team_mentors AS
SELECT 
    t.id AS team_id,
    t.team_name,
    t.mentor->>'fullName' AS mentor_name,
    t.mentor->>'email' AS mentor_email,
    t.mentor->>'phone' AS mentor_phone,
    t.mentor->>'organization' AS mentor_organization,
    t.mentor->>'designation' AS mentor_designation
FROM teams t
WHERE t.mentor IS NOT NULL AND t.mentor != 'null'::jsonb;
