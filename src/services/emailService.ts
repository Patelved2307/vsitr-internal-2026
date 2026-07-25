import nodemailer from 'nodemailer';
import { Team, TeamMember, EmailLog } from '../types.js';
import { saveEmailLog } from '../db/neonDb.js';

// Lazy Transporter initialization
let transporter: nodemailer.Transporter | null = null;

export function resetTransporter() {
  transporter = null;
}

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && host.trim() && user && user.trim() && pass && pass.trim()) {
    transporter = nodemailer.createTransport({
      host: host.trim(),
      port,
      secure: port === 465,
      auth: { user: user.trim(), pass: pass.trim() },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

// Generic Send Email Function with DB Logging
export async function sendEmail({
  recipientEmail,
  recipientName,
  teamId,
  subject,
  bodyHtml,
  bodyText,
  type,
}: {
  recipientEmail: string;
  recipientName: string;
  teamId?: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  type: 'registration_confirmation' | 'deadline_reminder' | 'admin_announcement';
}): Promise<EmailLog> {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || '"Internal SIH 2026 Committee" <sih.vsitr@ksv.ac.in>';
  let status: 'sent' | 'simulated' | 'failed' = 'simulated';
  let errorMsg = '';

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject: subject,
        html: bodyHtml,
        text: bodyText,
      });
      status = 'sent';
      console.log(`[Email Sent] Successfully dispatched email to ${recipientEmail} (${subject})`);
    } catch (err: any) {
      errorMsg = err.message || String(err);
      console.error(`[Email Failed] Could not dispatch to ${recipientEmail}:`, errorMsg);
      status = 'failed';
    }
  } else {
    console.log(`[Email Simulated Log] (${type.toUpperCase()}) To: ${recipientName} <${recipientEmail}> | Subject: "${subject}"`);
  }

  const emailLog: EmailLog = {
    id: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipientEmail,
    recipientName,
    teamId,
    subject,
    body: errorMsg ? `${bodyText}\n\n[DELIVERY ERROR: ${errorMsg}]` : bodyText,
    type,
    status,
    sentAt: new Date().toISOString(),
  };

  await saveEmailLog(emailLog);
  return emailLog;
}

// Resend an existing email log
export async function resendEmailLog(log: EmailLog): Promise<EmailLog> {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || '"Internal SIH 2026 Committee" <sih.vsitr@ksv.ac.in>';

  let updatedStatus: 'sent' | 'simulated' | 'failed' = 'simulated';
  let errorMsg = '';

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: fromAddress,
        to: log.recipientEmail,
        subject: log.subject,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">${log.body.replace(/\n/g, '<br/>')}</div>`,
        text: log.body,
      });
      updatedStatus = 'sent';
    } catch (err: any) {
      errorMsg = err.message || String(err);
      updatedStatus = 'failed';
    }
  }

  const updatedLog: EmailLog = {
    ...log,
    status: updatedStatus,
    body: errorMsg ? `${log.body}\n\n[RESEND ERROR: ${errorMsg}]` : log.body.replace(/\[DELIVERY ERROR:.*\]/g, '').trim(),
    sentAt: new Date().toISOString(),
  };

  await saveEmailLog(updatedLog);
  return updatedLog;
}

// 1. Dispatch Registration Confirmation to ALL 6 Team Members
export async function dispatchTeamRegistrationEmails(team: Team, appUrl: string = 'http://localhost:3000') {
  const allMembers: TeamMember[] = [team.leader, ...team.members];

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
              <tr><td style="padding: 4px 0; color: #64748B;"><strong>Your Role:</strong></td><td style="padding: 4px 0; font-weight: bold;">${isLeader ? 'Team Leader' : 'Team Member'}</td></tr>
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
            Organized by Research, Coding, Design & Soft Skills Clubs • VSITR Kadi (KSV)
          </p>
        </div>
      </div>
    `;

    const bodyText = `Dear ${member.fullName},

You have been successfully registered for the Internal Smart India Hackathon (SIH) 2026 at VSITR (KSV).

Team ID: ${team.id}
Team Name: ${team.teamName}
Your Role: ${isLeader ? 'Team Leader' : 'Team Member'}
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
      type: 'registration_confirmation',
    });
  }
}

// 2. Dispatch Deadline Reminder Email to Team Leader
export async function dispatchDeadlineReminderToLeader(team: Team, deadlineFormatted: string, appUrl: string = 'http://localhost:3000') {
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
    type: 'deadline_reminder',
  });
}
