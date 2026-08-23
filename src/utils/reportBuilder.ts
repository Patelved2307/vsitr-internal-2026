import ExcelJS from 'exceljs';
import type { Team } from '../types.js';

const headerStyle = (ws: ExcelJS.Worksheet, row: number) => {
  ws.getRow(row).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3F8B' } };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFC1272D' } } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
  });
  ws.getRow(row).height = 20;
};

const dataStyle = (cell: ExcelJS.Cell, rowIdx: number) => {
  cell.fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: rowIdx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' },
  };
  cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
  cell.alignment = { vertical: 'middle', wrapText: false };
};

const autoWidth = (ws: ExcelJS.Worksheet) => {
  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const val = cell.value ? String(cell.value) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(maxLen + 2, 60);
  });
};

const fmtDate = (iso: string | undefined): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
};

export async function buildFullReportWorkbook(teams: Team[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'VSITR SIH 2026 Admin';
  wb.created = new Date();

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Summary');
    ws.columns = [
      { header: 'Metric', key: 'metric', width: 38 },
      { header: 'Value',  key: 'value',  width: 20 },
    ];
    headerStyle(ws, 1);

    let totalStudents = 0, female = 0, mentorDone = 0, ps7L = 0, ps8L = 0;
    const dept: Record<string, number> = { IT: 0, CSE: 0, CE: 0 };
    for (const t of teams) {
      const all = [t.leader, ...(t.members || [])];
      totalStudents += all.length;
      female += all.filter((m: any) => m?.gender === 'Female').length;
      if (t.mentor?.fullName) mentorDone++;
      if (t.selectedPsId === '7-L') ps7L++;
      else if (t.selectedPsId === '8-L') ps8L++;
      const d = t.leader?.department;
      if (d && dept[d] !== undefined) dept[d]++;
    }
    const rows = [
      ['Total Registered Teams', teams.length],
      ['Total Students', totalStudents],
      ['Female Participants', female],
      ['Male Participants', totalStudents - female],
      ['Mentor Submitted (Completed)', mentorDone],
      ['Mentor Pending', teams.length - mentorDone],
      ['IT Teams (Leader Dept)', dept.IT],
      ['CSE Teams (Leader Dept)', dept.CSE],
      ['CE Teams (Leader Dept)', dept.CE],
      ['PS Selected Teams', teams.filter((t) => t.selectedPsId).length],
      ['AI Dropout Prediction (7-L)', ps7L],
      ['Smart Waste Management (8-L)', ps8L],
      ['PPT Submitted Teams', teams.filter((t) => t.pptSubmission?.submittedAt).length],
    ];
    rows.forEach(([metric, value], i) => {
      const row = ws.addRow({ metric, value });
      row.eachCell((cell) => dataStyle(cell, i));
    });
  }

  // ── Sheet 2: Team Details ───────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Team Details');
    ws.columns = [
      { header: 'Team ID',             key: 'id',          width: 16 },
      { header: 'Team Name',           key: 'teamName',    width: 30 },
      { header: 'Status',              key: 'status',      width: 18 },
      { header: 'Registered At (IST)', key: 'createdAt',   width: 26 },
      { header: 'Mentor Name',         key: 'mentorName',  width: 30 },
      { header: 'Mentor Contact',      key: 'mentorPhone', width: 18 },
      { header: 'Mentor Email',        key: 'mentorEmail', width: 34 },
      { header: 'PS ID',               key: 'psId',        width: 12 },
      { header: 'PS Title',            key: 'psTitle',     width: 52 },
      { header: 'PS Selected At (IST)',key: 'psAt',        width: 26 },
    ];
    headerStyle(ws, 1);
    teams.forEach((t, i) => {
      const mentor = t.mentor ? `${t.mentor.prefix || ''} ${t.mentor.fullName}`.trim() : '';
      const row = ws.addRow({
        id: t.id, teamName: t.teamName,
        status: t.status === 'completed' ? 'Completed' : 'Pending Mentor',
        createdAt: fmtDate(t.createdAt),
        mentorName: mentor || 'Pending',
        mentorPhone: t.mentor?.contactNumber || '',
        mentorEmail: t.mentor?.email || '',
        psId: t.selectedPsId || '', psTitle: t.selectedPsTitle || '', psAt: fmtDate(t.psSelectedAt),
      });
      row.eachCell((cell) => dataStyle(cell, i));
    });
    autoWidth(ws);
  }

  // ── Sheet 3: Members ────────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Members');
    ws.columns = [
      { header: 'Team ID',    key: 'teamId',   width: 16 },
      { header: 'Team Name',  key: 'teamName', width: 28 },
      { header: 'Role',       key: 'role',     width: 10 },
      { header: 'Full Name',  key: 'name',     width: 28 },
      { header: 'Email',      key: 'email',    width: 34 },
      { header: 'Phone',      key: 'phone',    width: 16 },
      { header: 'Enrollment', key: 'enroll',   width: 18 },
      { header: 'Department', key: 'dept',     width: 14 },
      { header: 'Semester',   key: 'sem',      width: 10 },
      { header: 'Gender',     key: 'gender',   width: 10 },
    ];
    headerStyle(ws, 1);
    let idx = 0;
    for (const t of teams) {
      const all = [
        { ...t.leader, role: 'Leader' },
        ...(t.members || []).map((m: any) => ({ ...m, role: 'Member' })),
      ];
      for (const m of all) {
        if (!m?.fullName) continue;
        const row = ws.addRow({
          teamId: t.id, teamName: t.teamName, role: m.role,
          name: m.fullName, email: m.email, phone: m.mobile,
          enroll: m.enrollmentNo, dept: m.department, sem: m.semester, gender: m.gender,
        });
        row.eachCell((cell) => dataStyle(cell, idx));
        idx++;
      }
    }
    autoWidth(ws);
  }

  // ── Sheet 4: PS Selections ──────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('PS Selections');
    ws.columns = [
      { header: 'Team ID',           key: 'id',       width: 16 },
      { header: 'Team Name',         key: 'teamName', width: 28 },
      { header: 'Leader Name',       key: 'leader',   width: 28 },
      { header: 'Leader Email',      key: 'email',    width: 34 },
      { header: 'PS ID',             key: 'psId',     width: 12 },
      { header: 'PS Title',          key: 'psTitle',  width: 55 },
      { header: 'Selected At (IST)', key: 'psAt',     width: 26 },
    ];
    headerStyle(ws, 1);
    teams.filter((t) => t.selectedPsId).forEach((t, i) => {
      const row = ws.addRow({
        id: t.id, teamName: t.teamName,
        leader: t.leader?.fullName || '', email: t.leader?.email || '',
        psId: t.selectedPsId, psTitle: t.selectedPsTitle || '', psAt: fmtDate(t.psSelectedAt),
      });
      row.eachCell((cell) => dataStyle(cell, i));
    });
    autoWidth(ws);
  }

  // ── Sheet 5: PPT Submissions ─────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('PPT Submissions');
    ws.columns = [
      { header: 'Team ID',             key: 'id',          width: 16 },
      { header: 'Team Name',           key: 'teamName',    width: 28 },
      { header: 'Leader Name',         key: 'leader',      width: 28 },
      { header: 'Leader Email',        key: 'email',       width: 34 },
      { header: 'PPT File Name',       key: 'pptFile',     width: 38 },
      { header: 'YouTube Pitch Link',  key: 'youtube',     width: 55 },
      { header: 'GitHub Repo Link',    key: 'github',      width: 55 },
      { header: 'Submitted At (IST)',  key: 'submittedAt', width: 26 },
    ];
    headerStyle(ws, 1);
    teams.filter((t) => t.pptSubmission?.submittedAt).forEach((t, i) => {
      const s = t.pptSubmission!;
      const row = ws.addRow({
        id: t.id, teamName: t.teamName,
        leader: t.leader?.fullName || '', email: t.leader?.email || '',
        pptFile: s.pptFileName || '', youtube: s.demoVideoUrl || '',
        github: s.githubRepoUrl || '', submittedAt: fmtDate(s.submittedAt),
      });
      row.eachCell((cell) => dataStyle(cell, i));
    });
    autoWidth(ws);
  }

  // ── Sheet 6: Mentor Summary ─────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Mentor Summary');
    ws.columns = [
      { header: 'Mentor Name',  key: 'mentor',  width: 32 },
      { header: 'Contact',      key: 'contact', width: 18 },
      { header: 'Email',        key: 'email',   width: 36 },
      { header: 'No. of Teams', key: 'count',   width: 14 },
      { header: 'Team IDs',     key: 'teamIds', width: 55 },
    ];
    headerStyle(ws, 1);
    const mentorMap = new Map<string, { label: string; contact: string; email: string; teams: string[] }>();
    for (const t of teams) {
      if (!t.mentor?.fullName) continue;
      const label = `${t.mentor.prefix || ''} ${t.mentor.fullName}`.trim();
      const key = label.toUpperCase();
      if (!mentorMap.has(key)) mentorMap.set(key, { label, contact: t.mentor.contactNumber || '', email: t.mentor.email || '', teams: [] });
      mentorMap.get(key)!.teams.push(t.id);
    }
    [...mentorMap.values()].sort((a, b) => a.label.localeCompare(b.label)).forEach((e, i) => {
      const row = ws.addRow({ mentor: e.label, contact: e.contact, email: e.email, count: e.teams.length, teamIds: e.teams.join(', ') });
      row.eachCell((cell) => dataStyle(cell, i));
    });
    autoWidth(ws);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
