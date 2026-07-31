import nodemailer from 'nodemailer';
import { Team, TeamMember, EmailLog } from '../types.js';
import { saveEmailLog, getGlobalConfig } from '../db/neonDb.js';

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
  const globalConfig = await getGlobalConfig().catch(() => null);
  const whatsappLink = globalConfig?.settings?.whatsappGroupLink || 'https://chat.whatsapp.com/EfS0SSUc9aX4DJUhfrpD2U';

  const allMembers: TeamMember[] = [team.leader, ...team.members];

  // Helper variables for template
  const leaderName = team.leader.fullName;
  const leaderEmail = team.leader.email;
  const teamId = team.id;
  const teamName = team.teamName;

  const memberNames = team.members.map(m => m.fullName);
  const m2 = memberNames[0] || 'N/A';
  const m3 = memberNames[1] || 'N/A';
  const m4 = memberNames[2] || 'N/A';
  const m5 = memberNames[3] || 'N/A';
  const m6 = memberNames[4] || 'N/A';

  // Format team members HTML list
  const membersHtmlList = `
    <li style="margin-bottom: 4px;"><strong>${leaderName}</strong> (Team Leader)</li>
    <li style="margin-bottom: 4px;"><strong>${m2}</strong></li>
    <li style="margin-bottom: 4px;"><strong>${m3}</strong></li>
    <li style="margin-bottom: 4px;"><strong>${m4}</strong></li>
    <li style="margin-bottom: 4px;"><strong>${m5}</strong></li>
    <li style="margin-bottom: 4px;"><strong>${m6}</strong></li>
  `;

  const emailPromises = allMembers.map(async (member) => {
    const isLeader = member.enrollmentNo === team.leader.enrollmentNo;
    const recipientGreeting = isLeader ? `${leaderName} (Team Leader)` : member.fullName;
    const subject = `🎉 Internal Smart India Hackathon (SIH) 2026 – Team Registration Confirmed`;

    const bodyHtml = `
      <div style="font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #1B3F8B 0%, #C1272D 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <span style="font-size: 32px; margin-bottom: 8px; display: inline-block;">🎉</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">Internal SIH 2026</h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Vidush Somany Institute of Technology & Research (VSITR)</p>
        </div>

        <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: 700; margin-top: 0; color: #0F172A;">Dear ${recipientGreeting},</p>
          <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">
            Greetings from the Internal Smart India Hackathon (SIH) 2026 Organizing Committee.
          </p>
          <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">
            We are pleased to inform you that your team has been successfully registered for the <strong>Internal Smart India Hackathon (SIH) 2026</strong> organized at Vidush Somany Institute of Technology & Research (VSITR).
          </p>
          <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">
            Please keep this email for future reference, as it contains your team's registration details and important information regarding the upcoming event.
          </p>

          <!-- Team Details Card -->
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 15px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📋</span> Team Details
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; color: #64748B; width: 35%;"><strong>Team ID:</strong></td>
                <td style="padding: 6px 0; font-weight: 700; color: #C1272D;">${teamId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B;"><strong>Team Name:</strong></td>
                <td style="padding: 6px 0; font-weight: 700; color: #1E293B;">${teamName}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 12px; border-top: 1px dashed #E2E8F0;"></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B;"><strong>Team Leader Name:</strong></td>
                <td style="padding: 6px 0; font-weight: 600; color: #1E293B;">${leaderName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B;"><strong>Team Leader Email:</strong></td>
                <td style="padding: 6px 0; color: #1E293B;">${leaderEmail}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 12px; border-top: 1px dashed #E2E8F0;"></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B; vertical-align: top;"><strong>Team Members:</strong></td>
                <td style="padding: 6px 0;">
                  <ul style="margin: 0; padding-left: 18px; color: #1E293B; line-height: 1.5;">
                    ${membersHtmlList}
                  </ul>
                </td>
              </tr>
            </table>
          </div>

          <!-- Team Portal Login Details -->
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; font-weight: 700; color: #0F172A; display: flex; align-items: center;">
              <span style="margin-right: 8px;">🔐</span> Team Portal Login
            </h3>
            <p style="font-size: 13px; color: #475569; margin-top: 0; margin-bottom: 12px;">
              You can access your Team Portal using the following credentials:
            </p>
            <div style="background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 12px;">
              <strong>Team ID:</strong> ${teamId}<br/>
              <strong>Team Leader Name:</strong> ${leaderName}<br/>
              <strong>Team Leader Email Address:</strong> ${leaderEmail}
            </div>
            <p style="font-size: 12px; color: #E11D48; font-weight: 600; margin: 0;">
              ⚠️ Please keep your Team ID safe. It will be required whenever you log in to the Team Portal.
            </p>
            <div style="text-align: center; margin-top: 16px;">
              <a href="${appUrl}" style="background: #1B3F8B; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">
                Go to Team Portal
              </a>
            </div>
          </div>

          <!-- Important Information Section -->
          <div style="margin-bottom: 28px;">
            <h3 style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 12px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📢</span> Important Information
            </h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Your Team ID is your unique identification for the Internal SIH 2026 portal.</li>
              <li style="margin-bottom: 8px;">Once the official Smart India Hackathon Problem Statements are released, you will be notified via email and through the Team Portal. The portal already contains the official SIH Problem Statement link for your reference.</li>
              <li style="margin-bottom: 8px;">The official Smart India Hackathon (SIH) PPT Template is available for download in the Team Portal. Prepare your presentation in the prescribed SIH format before submission.</li>
              <li style="margin-bottom: 8px;">Details regarding the screening process, presentation schedule, and other event updates will be shared after the registration process is completed.</li>
              <li style="margin-bottom: 8px;">The Team Leader is responsible for coordinating with team members and ensuring that all important updates are communicated to the entire team.</li>
            </ul>
          </div>

          <!-- WhatsApp Group -->
          <div style="background-color: #ECFDF5; border: 1px dashed #10B981; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 15px; font-weight: 700; color: #065F46; display: flex; align-items: center; justify-content: center;">
              <span style="margin-right: 8px;">💬</span> Join the Official WhatsApp Group
            </h3>
            <p style="font-size: 13px; color: #047857; margin-top: 0; margin-bottom: 16px; line-height: 1.5;">
              Please join the official Internal SIH 2026 WhatsApp group to receive important announcements and updates.
            </p>
            <a href="${whatsappLink}" style="background-color: #10B981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
              🔗 Join WhatsApp Group
            </a>
            <p style="font-size: 12px; color: #065F46; margin-top: 12px; margin-bottom: 0; font-style: italic;">
              Kindly share the above link with all your team members.
            </p>
          </div>

          <!-- Need Assistance -->
          <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-bottom: 24px;">
            <h4 style="margin-top: 0; margin-bottom: 8px; font-size: 14px; font-weight: 700; color: #0F172A; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📞</span> Need Assistance?
            </h4>
            <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6;">
              For any queries related to registration, team details, mentor submission, or technical support, please contact to Clubs Faculty coordinator or Student Coordinators or you can mail in our Official Support Email:
              <br/>
              <strong>Email:</strong> <a href="mailto:sihinternal.vsitr@gmail.com" style="color: #1B3F8B; text-decoration: none; font-weight: 600;">sihinternal.vsitr@gmail.com</a>
            </p>
          </div>

          <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">
            Thank you for registering for Internal Smart India Hackathon (SIH) 2026.
          </p>
          <p style="font-size: 14px; color: #334155; font-weight: 600; margin-bottom: 0;">
            We wish you and your team the very best and look forward to your innovative ideas. Best wishes for a successful hackathon journey!
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F1F5F9; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center; color: #64748B; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0 0 4px; font-weight: 700; color: #475569;">Warm Regards,</p>
          <p style="margin: 0 0 12px; font-weight: 700; color: #1E293B; font-size: 13px;">Internal Smart India Hackathon (SIH) 2026 Organizing Committee</p>
          <p style="margin: 0 0 6px; font-weight: 600; color: #475569;">Research Club | Coding Club | Design Club | Soft Skills Club</p>
          <p style="margin: 0 0 2px;">Vidush Somany Institute of Technology & Research (VSITR)</p>
          <p style="margin: 0;">Kadi Sarva Vishwavidyalaya</p>
        </div>
      </div>
    `;

    const bodyText = `Dear ${recipientGreeting},

Greetings from the Internal Smart India Hackathon (SIH) 2026 Organizing Committee.

We are pleased to inform you that your team has been successfully registered for the Internal Smart India Hackathon (SIH) 2026 organized at Vidush Somany Institute of Technology & Research (VSITR).

Please keep this email for future reference, as it contains your team's registration details and important information regarding the upcoming event.

📋 Team Details

Team ID: ${teamId}

Team Name: ${teamName}

Team Leader
Name: ${leaderName}
Email: ${leaderEmail}

Team Members
${leaderName} (Team Leader)
${m2}
${m3}
${m4}
${m5}
${m6}

🔐 Team Portal Login

You can access your Team Portal using the following credentials:

Team ID: ${teamId}
Team Leader Name: ${leaderName}
Team Leader Email Address: ${leaderEmail}

Please keep your Team ID safe. It will be required whenever you log in to the Team Portal.

📢 Important Information
- Your Team ID is your unique identification for the Internal SIH 2026 portal.
- Once the official Smart India Hackathon Problem Statements are released, you will be notified via email and through the Team Portal. The portal already contains the official SIH Problem Statement link for your reference.
- The official Smart India Hackathon (SIH) PPT Template is available for download in the Team Portal. Prepare your presentation in the prescribed SIH format before submission.
- Details regarding the screening process, presentation schedule, and other event updates will be shared after the registration process is completed.
- The Team Leader is responsible for coordinating with team members and ensuring that all important updates are communicated to the entire team.

💬 Join the Official WhatsApp Group

Please join the official Internal SIH 2026 WhatsApp group to receive important announcements and updates.

WhatsApp Group Link:
🔗 ${whatsappLink}

Kindly share the above link with all your team members.

📞 Need Assistance?

For any queries related to registration, team details, mentor submission, or technical support, please contact to Clubs Faculty coordinator or Student Coordinators or you can mail in our Official Support Email: sihinternal.vsitr@gmail.com

Thank you for registering for Internal Smart India Hackathon (SIH) 2026.

We wish you and your team the very best and look forward to your innovative ideas. Best wishes for a successful hackathon journey!

Warm Regards,

Internal Smart India Hackathon (SIH) 2026 Organizing Committee
Research Club | Coding Club | Design Club | Soft Skills Club
Vidush Somany Institute of Technology & Research (VSITR)
Kadi Sarva Vishwavidyalaya`;

    await sendEmail({
      recipientEmail: member.email,
      recipientName: member.fullName,
      teamId: team.id,
      subject,
      bodyHtml,
      bodyText,
      type: 'registration_confirmation',
    });
  });

  await Promise.all(emailPromises);
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
