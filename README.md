<div align="center">

# 🏆 VSITR — Internal SIH 2026 Registration Portal

**Smart India Hackathon 2026 — Internal Portal for VSITR under KSV University**  
Organized by **Research Club · Coding Club · Design Club · Soft Skills Club**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&style=flat-square)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org)
[![Neon DB](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E699?logo=postgresql&style=flat-square)](https://neon.tech)
[![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38BDF8?logo=tailwindcss&style=flat-square)](https://tailwindcss.com)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Pages & Modules](#-pages--modules)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Getting Started (Local Dev)](#-getting-started-local-dev)
- [Deployment (Vercel)](#-deployment-vercel)
- [Recent Changes & Changelog](#-recent-changes--changelog)
- [Team & Contributors](#-team--contributors)

---

## 🎯 About the Project

This is the **official internal web portal** for Smart India Hackathon (SIH) 2026, built exclusively for students and faculty of **VSITR (Vishwakarma Institute of Technology and Research)** under **KSV University, Gandhinagar / Kadi**.

The platform manages the **end-to-end internal SIH journey** — from team registration and mentor assignment to problem statement selection and PPT/prototype submission — all in one place.

---

## ✨ Key Features

| Feature | Description |
|--------|-------------|
| 🏠 **Landing Page** | Hero banner with live countdown timer, marquee announcements, event timeline & FAQ |
| 📝 **Team Registration** | 6-member team form (1 leader + 5 members) with full validation across IT, CSE, CE departments |
| 🔐 **Team Login** | Secure login by Team ID for portal access |
| 🖥️ **Team Portal** | Dashboard for teams — view registration details, select problem statements, submit PPT |
| 📤 **PPT & Prototype Submission** | Upload `.ppt/.pptx` file, YouTube pitch link, and 20% GitHub repo URL |
| 👨‍🏫 **Mentor Submission** | Separate page for mentors to complete their profile and link it to a team |
| 📂 **Problem Statements** | Browse & select internal problem statements (admin-controlled open/close) |
| 🔔 **Email Notifications** | Automated emails for registration, PS selection & PPT submission via Nodemailer/SMTP |
| 🛡️ **Admin Panel** | Full-featured admin dashboard — manage teams, settings, email logs, stats |
| 📊 **Admin Statistics** | Real-time stats: total teams, gender breakdown, department-wise, daily registration chart |
| 🗓️ **Timeline Management** | Admin-editable event timeline rendered on the landing page |
| 📣 **Live Announcement Banner** | Scrolling marquee banner controlled by admin |
| 💾 **Dual DB Support** | Uses Neon PostgreSQL in production; falls back gracefully to local `data/sih_db.json` |
| 🤖 **Gemini AI Integration** | Server-side Gemini API integration capability (via `GEMINI_API_KEY`) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Styling** | Tailwind CSS 4.x, Framer Motion (animations) |
| **Icons** | Lucide React |
| **Backend** | Express.js (Node.js), `tsx` for local dev |
| **Database** | Neon PostgreSQL (`@neondatabase/serverless`) with JSON fallback |
| **Email** | Nodemailer (SMTP) with simulation mode fallback |
| **AI** | Google Gemini API (`@google/genai`) |
| **3D / WebGL** | Three.js, OGL, Postprocessing |
| **Deployment** | Vercel (serverless) |
| **Build Tool** | Vite + esbuild |

---

## 📁 Project Structure

```
vsitr-internal-2026-main/
├── api/                          # Vercel serverless API handlers
├── data/                         # Local JSON fallback database (sih_db.json)
├── dist/                         # Production build output
├── public/                       # Static public assets
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.tsx            # Navigation bar
│   │   ├── Footer.tsx            # Footer with club info & links
│   │   ├── BigTitleSection.tsx   # Hero title area
│   │   ├── CountdownTimer.tsx    # Live countdown to registration deadline
│   │   ├── FAQSection.tsx        # FAQ accordion
│   │   ├── HeroSlider.tsx        # Hero image slider
│   │   ├── InfoViews.tsx         # FAQ & Support page views
│   │   ├── MentorPendingCard.tsx # Pending mentor status card
│   │   ├── ModalAlert.tsx        # Global custom alert modal
│   │   ├── RegistrationRulesView.tsx  # Home/rules view
│   │   ├── RulesSection.tsx      # Rules & regulations display
│   │   ├── SupportSection.tsx    # Contact & support info
│   │   ├── TimelineSection.tsx   # Event timeline display
│   │   └── ui/                   # Low-level UI primitives
│   ├── context/
│   │   └── AuthContext.tsx       # Global auth + navigation state
│   ├── data/
│   │   └── initialData.js        # Club coordinators & seed data
│   ├── db/
│   │   └── neonDb.ts             # All DB operations (Neon + JSON fallback)
│   ├── pages/
│   │   ├── AdminPage.tsx             # Full admin dashboard
│   │   ├── MentorSubmissionPage.tsx  # Mentor profile form
│   │   ├── PptSubmissionPage.tsx     # PPT + GitHub + Video submission
│   │   ├── ProblemStatementsPage.tsx # Browse & select PS
│   │   ├── RegistrationPage.tsx      # Team registration form
│   │   ├── TeamLoginPage.tsx         # Team login
│   │   └── TeamPortalPage.tsx        # Team dashboard/portal
│   ├── services/
│   │   ├── api.ts                # Frontend API client functions
│   │   └── emailService.ts       # Email dispatch logic (Nodemailer)
│   ├── App.tsx                   # Root component + tab-based routing
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Global styles
│   └── types.ts                  # TypeScript type definitions
├── schema.sql                    # Neon PostgreSQL database schema + views
├── server.ts                     # Express server (dev + all API endpoints)
├── vite.config.ts                # Vite build config
├── vercel.json                   # Vercel deployment config
├── tsconfig.json                 # TypeScript config
├── .env.example                  # Environment variable template
└── package.json
```

---

## 🖥️ Pages & Modules

### 🏠 Home / Rules

- Full landing page with hero slider, countdown timer, scrolling announcement banner
- Rules & regulations, FAQ, support contact, and event timeline sections
- Announcement banner toggled and edited from the Admin panel

### 📝 Registration

- Multi-step team registration: 1 leader + 5 members (6 total)
- Department options: IT, CSE, CE
- Full field validation (enrollment no., email, mobile, semester)
- Automatically sends **registration confirmation emails** to all members
- Generates unique Team ID in format `SIH2026-XXX`

### 🔐 Team Login

- Teams log in using their assigned `SIH2026-XXX` Team ID

### 🖥️ Team Portal

- View full team registration details
- Select a Problem Statement from admin-published list
- Track submission statuses and deadlines
- Navigate directly to PPT Submission portal

### 👨‍🏫 Mentor Submission

- Faculty mentors submit their details (name, department, institute, contact)
- Linked to a team; triggers email notification on completion

### 📂 Problem Statements

- Browse open/closed problem statements published by admin
- Teams can select one PS (with admin-controlled deadline)
- Sends **PS selection confirmation emails** to all team members

### 📤 PPT & Prototype Submission

- Upload PowerPoint file (`.ppt`/`.pptx`)
- Submit 2-minute YouTube pitch video link
- Submit 20% GitHub prototype repository URL
- Deadline: **25 August 2026, 12:00 AM IST**
- Sends **PPT submission confirmation emails**

### 🛡️ Admin Panel

- Password-protected admin dashboard
- **Settings:** Control registration open/close, deadlines, banners, PS link, PPT template link, WhatsApp group link
- **Teams:** List, search, filter, view, edit, delete teams; export to CSV
- **PPT Submissions:** View all submitted PPTs with download links
- **Email Logs:** View all sent/simulated/failed emails, resend capability
- **Statistics:** Real-time charts (total teams, gender, department, semester, daily registrations)
- **Problem Statements:** Create, edit, open/close, delete PS entries
- **Timeline:** Manage event dates displayed on the homepage
- **FAQ:** Add/edit/delete FAQ entries

---

## 🗄️ Database Schema

The portal uses **Neon PostgreSQL** with the following tables:

| Table | Purpose |
|-------|---------|
| `app_config` | Global key-value store for settings, timeline, FAQs, rules |
| `teams` | All registered teams with leader, members, mentor, PS selection |
| `members` | Normalized individual member records |
| `mentors` | Normalized mentor records |
| `email_logs` | Complete log of all outbound system emails |
| `problem_statements` | Admin-managed list of internal SIH problem statements |

**Helper SQL Views** (for Neon SQL Editor queries):

- `v_team_leaders` — Flat leader data per team
- `v_team_members` — Expanded member data from JSONB array
- `v_team_mentors` — Mentor data per team

> Run `schema.sql` in your Neon SQL Editor to manually inspect or reset table structures.

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# Required — Google Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# Required — Public URL of the deployed app (used in email links)
APP_URL="https://your-app-url.vercel.app"

# Required for Neon DB (omit to use local JSON fallback)
DATABASE_URL=postgresql://USER:PASSWORD@YOUR-PROJECT.neon.tech/neondb?sslmode=require

# Optional SMTP Email Config (falls back to simulated logs if missing)
SMTP_HOST=smtp.yourhost.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=sih.vsitr@ksv.ac.in
```

> **Note:** Without `DATABASE_URL`, the app uses `data/sih_db.json` as a local JSON-based fallback database — useful for quick local development without Neon setup.

---

## 🚀 Getting Started (Local Dev)

### Prerequisites

- **Node.js** v18+
- A **Neon PostgreSQL** database (optional — JSON fallback available)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, SMTP config, etc.

# 3. Start the development server
npm run dev
```

The app starts at **http://localhost:3000**

### Build for Production

```bash
npm run build
```

---

## ☁️ Deployment (Vercel)

This project is pre-configured for **Vercel** deployment:

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add all required environment variables in the Vercel project settings
4. Deploy — Vercel runs `npm run build` automatically

The `vercel.json` configuration:
- Routes all `/api/*` requests to the serverless API handler
- Falls back to `index.html` for all other routes (client-side routing)

---

## 📝 Recent Changes & Changelog

---

### v2.3 — August 2026 *(Latest)*

#### 📤 PPT & Prototype Submission Portal

- **NEW PAGE:** `PptSubmissionPage.tsx` — Full submission form for uploading PowerPoint decks (`.ppt`/`.pptx`), 2-minute YouTube pitch video link, and 20% GitHub prototype repository URL
- File upload stored as Base64 in the Neon database
- Real-time submission deadline countdown displayed on the page
- Auto-confirmation email dispatched on successful submission (`ppt_submission` email type)
- Admin can view, download, and delete all PPT submissions from the Admin Panel

#### 📂 Problem Statements Module

- **NEW PAGE:** `ProblemStatementsPage.tsx` — Teams can browse and select one problem statement
- **NEW DB TABLE:** `problem_statements` with fields: `id`, `title`, `category`, `description`, `status`, `sdg`, `theme`
- Admin can create, edit, open/close, and delete problem statements from the admin panel
- `psSelectionDeadline` setting added to admin-controlled `EventSettings`
- Auto-confirmation email on PS selection (`ps_selection` email type)

#### 🔔 Email System Enhancements

- **NEW:** `dispatchPsSelectionEmails()` — sends confirmation to team leader & all members on PS selection
- **NEW:** `dispatchPptSubmissionEmail()` — sends PPT submission acknowledgement email
- Resend email functionality added in Admin → Email Logs tab
- New email type enum values: `'ps_selection'`, `'ppt_submission'`

#### 🛡️ Admin Panel Additions

- **NEW Tab:** Problem Statements management (create, edit, open/close, delete PS entries)
- **NEW Section:** PPT Submissions viewer — list all team submissions with download links
- Admin stats now include PS selection count and PPT submission count
- New admin settings: `pptSubmissionOpen`, `pptSubmissionDeadline`, `pptReferenceLink`, `pptTemplateLink`, `pptTemplateStatus`, `psSelectionDeadline`
- Added `isPptExtended` & `pptExtendedDeadline` toggle for deadline extension management

#### 📣 Live Announcement Bar

- Scrolling marquee bar added to top of all pages (except admin)
- Shows dual message loop: admin-set announcement + PPT deadline alert
- Toggled via admin settings panel (`announcementBanner` field)

#### 🖥️ Team Portal Enhancements

- Teams can now view their selected Problem Statement title and ID in the portal
- Direct navigation button to PPT Submission portal from team dashboard
- Mentor status displayed with clear pending/complete badge indicator

#### 🗄️ Database Updates

- **New DB functions:** `createProblemStatement`, `updateProblemStatement`, `deleteProblemStatement`, `getAllProblemStatements`, `updateTeamPsSelection`, `updateTeamPptSubmission`, `createPptSubmission`, `getAllPptSubmissions`, `deletePptSubmission`
- `teams` table extended: new columns `selected_ps_id`, `selected_ps_title`, `ps_selected_at`
- New `problem_statements` table added to schema
- SQL helper views added: `v_team_leaders`, `v_team_members`, `v_team_mentors`

#### 🔧 Type System Updates

- **NEW:** `ProblemStatement` interface (`id`, `title`, `category`, `description`, `status`, `sdg`, `theme`)
- **NEW:** `PptSubmission` interface (file, video, and GitHub fields)
- `EventSettings` extended with PPT and PS deadline/status fields
- `Team` interface extended with `selectedPsId`, `selectedPsTitle`, `psSelectedAt`, `pptSubmission`
- `EmailLog.type` union extended with `'ps_selection'` and `'ppt_submission'`

---

### v2.0 — July 2026

- Initial launch of the internal SIH 2026 portal
- Team registration with 6-member form (1 leader + 5 members)
- Departments supported: IT, CSE, CE
- Neon PostgreSQL integration with local JSON fallback
- Email notifications via Nodemailer — registration confirmation & deadline reminders
- Full admin panel with team management, settings, and statistics
- Live countdown timer, event timeline, FAQ, and support sections
- Mentor submission page and complete mentor linking flow
- Vercel deployment configuration

---

## 👥 Team & Contributors

| Role | Details |
|------|---------|
| **Institution** | VSITR (Vishwakarma Institute of Technology and Research) |
| **University** | KSV University, Gandhinagar / Kadi |
| **Event** | Smart India Hackathon (SIH) 2026 — Internal Round |
| **Organizing Clubs** | Research Club · Coding Club · Design Club · Soft Skills Club |

---

## 📞 Support

For technical issues or portal access problems, reach out via the **Support** tab on the portal or contact the organizing clubs directly.

---

<div align="center">

**Made with ❤️ for VSITR students — SIH 2026**

*"Innovation begins here."*

</div>
