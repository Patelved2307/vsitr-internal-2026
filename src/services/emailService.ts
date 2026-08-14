import nodemailer from 'nodemailer';
import { Team, TeamMember, EmailLog, PptSubmission } from '../types.js';
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
  cc,
}: {
  recipientEmail: string;
  recipientName: string;
  teamId?: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  type: 'registration_confirmation' | 'deadline_reminder' | 'admin_announcement' | 'ps_selection' | 'ppt_submission';
  cc?: string;
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
        cc: cc,
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
  const hasMentor = !!(team.mentor && team.mentor.fullName && team.mentor.fullName.trim());
  const mentorName = hasMentor ? `${team.mentor!.prefix || 'Prof.'} ${team.mentor!.fullName}` : 'Not Assigned';
  const mentorEmail = hasMentor ? team.mentor!.email : 'N/A';
  const mentorStatus = hasMentor ? '✅ Completed / Selected' : '❌ Pending (Action Required)';

  // Conditional message and warning box
  let mentorMessageHtml = '';
  let mentorMessageText = '';
  if (hasMentor) {
    mentorMessageHtml = `
      <div style="background-color: #ECFDF5; border: 1px solid #10B981; border-radius: 8px; padding: 12px 16px; color: #065F46; font-size: 13px; font-weight: 500; margin-bottom: 20px;">
        <strong>Status Update:</strong> Your team has successfully selected a Faculty Mentor. The mentor has been copied (CC'd) on this communication.
      </div>
    `;
    mentorMessageText = `Status Update: Your team has successfully selected a Faculty Mentor. The mentor has been copied (CC'd) on this communication.`;
  } else {
    mentorMessageHtml = `
      <div style="background-color: #FFF1F2; border: 1px solid #F43F5E; border-radius: 8px; padding: 12px 16px; color: #9F1239; font-size: 13px; font-weight: 500; margin-bottom: 20px;">
        <strong>⚠️ Action Required:</strong> Your team has not yet selected a Faculty Mentor. Please assign your Faculty Mentor in the Team Portal by <strong>August 8, 2026</strong>.
      </div>
    `;
    mentorMessageText = `⚠️ Action Required: Your team has not yet selected a Faculty Mentor. Please assign your Faculty Mentor in the Team Portal by August 8, 2026.`;
  }

  const subject = `📢 Internal SIH 2026 – Action Required: Mentor Selection & Team Details Update`;

  const bodyHtml = `
    <div style="font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #1B3F8B 0%, #C1272D 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <span style="font-size: 32px; margin-bottom: 8px; display: inline-block;">📢</span>
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">Team Details & Mentor Update</h2>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Vidush Somany Institute of Technology & Research (VSITR)</p>
      </div>

      <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
        <p style="font-size: 15px; font-weight: 700; margin-top: 0; color: #0F172A;">Dear ${leader.fullName},</p>
        <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
          Greetings from the Internal Smart India Hackathon (SIH) 2026 Organizing Committee.
        </p>
        <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
          This is an important reminder regarding your team's Faculty Mentor selection and Team Details Update.
        </p>

        <!-- Information Cards -->
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
            📋 Team Information
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
            <tr>
              <td style="padding: 4px 0; color: #64748B; width: 35%;"><strong>Team ID:</strong></td>
              <td style="padding: 4px 0; font-weight: 700; color: #C1272D;">${team.id}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748B;"><strong>Team Name:</strong></td>
              <td style="padding: 4px 0; font-weight: 700; color: #1E293B;">${team.teamName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748B;"><strong>Team Leader:</strong></td>
              <td style="padding: 4px 0; color: #1E293B;">${leader.fullName}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
            🎓 Faculty Mentor Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 12px;">
            <tr>
              <td style="padding: 4px 0; color: #64748B; width: 35%;"><strong>Mentor Status:</strong></td>
              <td style="padding: 4px 0; font-weight: 700; color: ${hasMentor ? '#10B981' : '#F43F5E'};">${mentorStatus}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748B;"><strong>Faculty Mentor:</strong></td>
              <td style="padding: 4px 0; font-weight: 600; color: #1E293B;">${mentorName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748B;"><strong>Mentor Email:</strong></td>
              <td style="padding: 4px 0; color: #1E293B;">${mentorEmail}</td>
            </tr>
          </table>

          ${mentorMessageHtml}
        </div>

        <!-- Modification details -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 10px;">
            🔄 Team Details Modification
          </h3>
          <p style="font-size: 13px; color: #475569; margin: 0 0 10px;">
            Before the deadline, you may update your team information through the Team Portal, including:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
            <li style="margin-bottom: 6px;">Selecting or changing your Faculty Mentor.</li>
            <li style="margin-bottom: 6px;">Replacing a team member (if required).</li>
            <li style="margin-bottom: 6px;">Updating team member details.</li>
            <li style="margin-bottom: 6px;">Correcting any incorrect information submitted during registration.</li>
          </ul>
          <p style="font-size: 12px; color: #EF4444; font-weight: 600; margin-top: 10px;">
            ⚠️ Please note: No changes will be accepted after the registration deadline.
          </p>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${appUrl}" style="background: linear-gradient(135deg, #1B3F8B 0%, #C1272D 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(27, 63, 139, 0.15);">
            Go to Team Portal & Update Details
          </a>
        </div>

        <!-- Important note -->
        <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-bottom: 20px;">
          <h4 style="margin-top: 0; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #0F172A;">
            ⚠️ Important Instructions
          </h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
            <li style="margin-bottom: 6px;">The Team Leader is requested to coordinate with all team members and ensure that the required updates are completed within the specified timeline.</li>
            <li style="margin-bottom: 6px;">Please check the Team Portal and your registered email regularly for further announcements regarding the Internal Smart India Hackathon (SIH) 2026.</li>
            <li style="margin-bottom: 6px;">If you require any assistance, please contact the organizing committee at <a href="mailto:sihinternal.vsitr@gmail.com" style="color: #1B3F8B; text-decoration: none; font-weight: 600;">sihinternal.vsitr@gmail.com</a>.</li>
          </ul>
        </div>

        <p style="font-size: 13px; color: #475569; margin-top: 24px; margin-bottom: 0;">
          Thank you for your cooperation.
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

  const bodyText = `Dear ${leader.fullName},

Greetings from the Internal Smart India Hackathon (SIH) 2026 Organizing Committee.

This is an important reminder regarding your team's Faculty Mentor selection and Team Details Update.

Team Information:
Team ID: ${team.id}
Team Name: ${team.teamName}
Team Leader: ${leader.fullName}

Faculty Mentor Details:
Mentor Status: ${mentorStatus}
Faculty Mentor: ${mentorName}
Mentor Email: ${mentorEmail}

${mentorMessageText}

Team Details Modification:
Before the deadline, you may update your team information through the Team Portal, including:
- Selecting or changing your Faculty Mentor.
- Replacing a team member (if required).
- Updating team member details.
- Correcting any incorrect information submitted during registration.

Please note: No changes will be accepted after the registration deadline.

Important:
- The Team Leader is requested to coordinate with all team members and ensure that the required updates are completed within the specified timeline.
- Please check the Team Portal and your registered email regularly for further announcements regarding the Internal Smart India Hackathon (SIH) 2026.
- If you require any assistance, please contact the organizing committee at sihinternal.vsitr@gmail.com.

Thank you for your cooperation.

Warm Regards,
Internal Smart India Hackathon (SIH) 2026 Organizing Committee
Research Club | Coding Club | Design Club | Soft Skills Club
Vidush Somany Institute of Technology & Research (VSITR)
Kadi Sarva Vishwavidyalaya`;

  return await sendEmail({
    recipientEmail: leader.email,
    recipientName: leader.fullName,
    teamId: team.id,
    subject,
    bodyHtml,
    bodyText,
    type: 'deadline_reminder',
    cc: hasMentor ? mentorEmail : undefined,
  });
}

// 4. Dispatch Problem Statement Selection Confirmation Email to ALL 6 Team Members
export async function dispatchPsSelectionEmails(team: Team, psId: string, psTitle: string) {
  const globalConfig = await getGlobalConfig().catch(() => null);
  const whatsappLink = globalConfig?.settings?.whatsappGroupLink || 'https://chat.whatsapp.com/EfS0SSUc9aX4DJUhfrpD2U';

  const allMembers = [team.leader, ...team.members];
  const leaderName = team.leader.fullName;
  const teamId = team.id;
  const teamName = team.teamName;

  const emailPromises = allMembers.map(async (member) => {
    const subject = `📢 Internal SIH 2026 – Problem Statement Selection Confirmed`;

    const bodyHtml = `
      <div style="font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #1B3F8B 0%, #C1272D 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <span style="font-size: 32px; margin-bottom: 8px; display: inline-block;">📢</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">Problem Statement Selected</h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Vidush Somany Institute of Technology & Research (VSITR)</p>
        </div>

        <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: 700; margin-top: 0; color: #0F172A;">Dear ${member.fullName},</p>
          <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
            Greetings from the Internal Smart India Hackathon (SIH) 2026 Organizing Committee.
          </p>
          <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
            We are pleased to inform you that your team has successfully selected and submitted a Problem Statement for Internal SIH 2026 through the Team Portal.
          </p>

          <!-- Problem Statement Details Card -->
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 15px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
              📋 Problem Statement Details
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
                <td style="padding: 6px 0; color: #64748B;"><strong>Problem Statement ID:</strong></td>
                <td style="padding: 6px 0; font-weight: 700; color: #1B3F8B; font-family: monospace;">${psId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B; vertical-align: top;"><strong>Problem Statement Title:</strong></td>
                <td style="padding: 6px 0; font-weight: 700; color: #1E293B; line-height: 1.4;">${psTitle}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
            Your submitted Problem Statement details have been successfully recorded in the system. This confirmation email has been shared with the Team Leader and all registered team members for reference.
          </p>

          <!-- Important Next Steps -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 12px;">
              📌 Important Next Steps
            </h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
              <li style="margin-bottom: 8px;">After selecting your Problem Statement, you can start working on your proposed solution.</li>
              <li style="margin-bottom: 8px;">The PPT Submission Date will be announced soon. Please stay tuned to the official communication channels.</li>
              <li style="margin-bottom: 8px;">The Presentation Date will also be announced soon.</li>
              <li style="margin-bottom: 8px;">Please regularly check the Team Portal, registered email, and official WhatsApp group for important announcements and updates.</li>
            </ul>
          </div>

          <!-- WhatsApp Group -->
          <div style="background-color: #ECFDF5; border: 1px dashed #10B981; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 15px; font-weight: 700; color: #065F46;">
              💬 Join the Official WhatsApp Group
            </h3>
            <p style="font-size: 13px; color: #047857; margin-top: 0; margin-bottom: 16px; line-height: 1.5;">
              For regular updates and announcements, please join the official Internal SIH 2026 WhatsApp Group and share the link with all your team members.
            </p>
            <a href="${whatsappLink}" style="background-color: #10B981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
              👉 Join WhatsApp Group
            </a>
          </div>

          <!-- Need Assistance -->
          <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-bottom: 24px;">
            <h4 style="margin-top: 0; margin-bottom: 8px; font-size: 14px; font-weight: 700; color: #0F172A;">
              📞 Need Assistance?
            </h4>
            <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6;">
              For any queries or technical assistance, please contact us at:
              <br/>
              <strong>Email:</strong> <a href="mailto:sihinternal.vsitr@gmail.com" style="color: #1B3F8B; text-decoration: none; font-weight: 600;">sihinternal.vsitr@gmail.com</a>
            </p>
          </div>

          <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">
            Thank you for your participation and cooperation.
          </p>
          <p style="font-size: 14px; color: #334155; font-weight: 600; margin-bottom: 0;">
            We wish your team the very best for Internal SIH 2026! 🚀
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

    const bodyText = `Dear ${member.fullName},

Greetings from the Internal Smart India Hackathon (SIH) 2026 Organizing Committee.

We are pleased to inform you that your team has successfully selected and submitted a Problem Statement for Internal SIH 2026 through the Team Portal.

📋 Problem Statement Details

Team ID: ${teamId}
Team Name: ${teamName}
Problem Statement ID: ${psId}
Problem Statement Title: ${psTitle}

Your submitted Problem Statement details have been successfully recorded in the system. This confirmation email has been shared with the Team Leader and all registered team members for reference.

📌 Important Next Steps
After selecting your Problem Statement, you can start working on your proposed solution.
The PPT Submission Date will be announced soon. Please stay tuned to the official communication channels.
The Presentation Date will also be announced soon.
Please regularly check the Team Portal, registered email, and official WhatsApp group for important announcements and updates.

💬 Join the Official WhatsApp Group

For regular updates and announcements, please join the official Internal SIH 2026 WhatsApp Group and share the link with all your team members.

👉 Join WhatsApp Group: ${whatsappLink}

📞 Need Assistance?

For any queries or technical assistance, please contact us at:

📧 sihinternal.vsitr@gmail.com

Thank you for your participation and cooperation.

We wish your team the very best for Internal SIH 2026! 🚀

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
      type: 'ps_selection',
    });
  });

  await Promise.all(emailPromises);
}

// 4. Dispatch PPT & Prototype Submission Confirmation Email
export async function dispatchPptSubmissionEmail(team: Team, submission: PptSubmission, appUrl: string = 'http://localhost:3000') {
  const leaderName = team.leader.fullName || 'Team Leader';
  const leaderEmail = team.leader.email;
  const teamName = team.teamName || (team as any).name || `Team ${team.id}`;
  const teamId = team.id;
  const selectedPsId = team.selectedPsId || submission.teamId || 'N/A';
  const selectedPsTitle = team.selectedPsTitle || 'Institute Problem Statement';
  
  const fileName = submission.pptFileName || (submission as any).fileName || 'Presentation_Deck.pptx';
  const demoVideoUrl = submission.demoVideoUrl || 'N/A';
  const githubRepoUrl = submission.githubRepoUrl || 'N/A';
  const submittedAtDate = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
  const submittedAtFormatted = submittedAtDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const allMembers = [
    { email: leaderEmail, fullName: leaderName, role: 'Team Leader' },
    ...team.members.map((m: any) => ({
      email: m.email,
      fullName: m.fullName || m.name || 'Team Member',
      role: 'Team Member',
    })),
  ];

  const subject = `🎉 Submission Confirmed! Internal SIH 2026 - PPT & Prototype Received [Team ${teamId} - ${teamName}]`;

  const emailPromises = allMembers.map(async (member) => {
    const bodyHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PPT & Prototype Submission Successful - Internal SIH 2026</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6fb; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6fb; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #C1272D 0%, #1B3F8B 100%); padding: 35px 30px; text-align: center; color: #ffffff;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; opacity: 0.9;">
                Vidush Somany Institute of Technology &amp; Research (VSITR)
              </p>
              <h1 style="margin: 10px 0 0 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                Internal Smart India Hackathon 2026
              </h1>
            </td>
          </tr>

          <!-- SUCCESS BANNER -->
          <tr>
            <td style="background-color: #ecfdf5; padding: 20px 30px; border-bottom: 1px solid #a7f3d0; text-align: center;">
              <span style="font-size: 32px; display: block; margin-bottom: 5px;">🎉</span>
              <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #065f46;">
                PPT &amp; Prototype Submission Successful!
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #047857; font-weight: 600;">
                Your solution pitch deck, video demo link &amp; prototype repo have been recorded.
              </p>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0; font-weight: 600;">
                Dear <strong>${member.fullName}</strong> (${member.role}),
              </p>
              <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 25px 0;">
                Congratulations! We have successfully received official PPT &amp; Prototype submission for Team <strong>${teamName}</strong> (ID: <strong>${teamId}</strong>) for Internal SIH 2026. Below is your official submission receipt.
              </p>

              <!-- SUBMISSION RECEIPT TABLE -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 25px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="background-color: #1B3F8B; color: #ffffff; padding: 12px 18px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                    📋 Official Submission Receipt
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 18px; font-size: 12px; color: #64748b; font-weight: 700; width: 38%; border-bottom: 1px solid #f1f5f9;">Team ID &amp; Name:</td>
                  <td style="padding: 10px 18px; font-size: 13px; color: #0f172a; font-weight: 800; border-bottom: 1px solid #f1f5f9;">${teamId} &mdash; ${teamName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 18px; font-size: 12px; color: #64748b; font-weight: 700; border-bottom: 1px solid #f1f5f9;">Problem Statement:</td>
                  <td style="padding: 10px 18px; font-size: 12px; color: #1B3F8B; font-weight: 800; border-bottom: 1px solid #f1f5f9;">[${selectedPsId}] ${selectedPsTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 18px; font-size: 12px; color: #64748b; font-weight: 700; border-bottom: 1px solid #f1f5f9;">PPT Presentation:</td>
                  <td style="padding: 10px 18px; font-size: 12px; color: #047857; font-weight: 800; border-bottom: 1px solid #f1f5f9;">✔ ${fileName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 18px; font-size: 12px; color: #64748b; font-weight: 700; border-bottom: 1px solid #f1f5f9;">2-Min Pitch Video:</td>
                  <td style="padding: 10px 18px; font-size: 12px; color: #dc2626; font-weight: 700; border-bottom: 1px solid #f1f5f9;">
                    <a href="${demoVideoUrl}" target="_blank" style="color: #dc2626; text-decoration: underline;">Watch Video Clip</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 18px; font-size: 12px; color: #64748b; font-weight: 700; border-bottom: 1px solid #f1f5f9;">GitHub Repository:</td>
                  <td style="padding: 10px 18px; font-size: 12px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">
                    <a href="${githubRepoUrl}" target="_blank" style="color: #1B3F8B; text-decoration: underline;">View Repository</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 18px; font-size: 12px; color: #64748b; font-weight: 700;">Submission Timestamp:</td>
                  <td style="padding: 10px 18px; font-size: 12px; color: #475569; font-weight: 700;">${submittedAtFormatted}</td>
                </tr>
              </table>

              <!-- NEXT STEP CARD -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f9ff; border-radius: 14px; border: 1px solid #bae6fd; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
                      📍 Next Phase: PPT Presentation Day
                    </h3>
                    <ul style="margin: 0 0 15px 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                      <li><strong>Date:</strong> 27 August 2026</li>
                      <li><strong>Venue:</strong> Gandhinagar Campus</li>
                      <li><strong>Schedule:</strong> Detailed time slots will be shared soon.</li>
                    </ul>

                    <h4 style="margin: 12px 0 6px 0; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                      📌 Presentation Day Preparation Checklist:
                    </h4>
                    <ul style="margin: 0 0 15px 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.6;">
                      <li>Bring your laptop with your working prototype code &amp; local setup ready.</li>
                      <li>Prepare your live pitch presentation and working prototype demonstration strictly adhering to your submitted official PPT deck format.</li>
                      <li>All 6 team members must attend in formal attire with institute ID cards.</li>
                    </ul>

                    <div style="background-color: #ffffff; border-radius: 10px; padding: 10px 14px; border: 1px dashed #7dd3fc; font-size: 12px; color: #0369a1; font-weight: 600; line-height: 1.5;">
                      📢 <strong>Note:</strong> Detailed guidelines, presentation rules, evaluation criteria, and complete time-slot schedules will be shared with all team leaders soon via email and your Team Portal dashboard.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 20px 0;">
                    <a href="${appUrl}" style="display: inline-block; background-color: #1B3F8B; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(27, 63, 139, 0.25);">
                      Go to Team Portal Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SUPPORT INFO -->
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 20px 0 0 0; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                Need assistance? Contact our committee at <a href="mailto:sihinternal.vsitr@gmail.com" style="color: #1B3F8B; font-weight: 700; text-decoration: none;">sihinternal.vsitr@gmail.com</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; font-weight: 600;">
              Internal SIH 2026 Organizing Committee &bull; Department of IT, CSE &amp; CE<br>
              Vidush Somany Institute of Technology &amp; Research (VSITR), Kadi
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const bodyText = `
Internal Smart India Hackathon 2026 - PPT & Prototype Submission Confirmation

Dear ${member.fullName} (${member.role}),

Congratulations! We have successfully received official PPT & Prototype submission for Team ${teamName} (ID: ${teamId}).

SUBMISSION RECEIPT:
- Team ID: ${teamId}
- Team Name: ${teamName}
- Problem Statement: [${selectedPsId}] ${selectedPsTitle}
- PPT Presentation: ${fileName}
- 2-Min Pitch Video: ${demoVideoUrl}
- GitHub Repository: ${githubRepoUrl}
- Submission Timestamp: ${submittedAtFormatted}

NEXT PHASE: PPT PRESENTATION DAY
- Date: 27 August 2026
- Venue: Gandhinagar Campus
- Time Schedule: Detailed time slots will be shared soon.

PREPARATION CHECKLIST:
1. Bring your laptop with your working prototype code & local setup ready.
2. Prepare your live pitch presentation and working prototype demonstration strictly adhering to your submitted official PPT deck format.
3. All 6 team members must attend in formal attire with institute ID cards.

Note: Detailed guidelines, presentation rules, evaluation criteria, and complete time-slot schedules will be shared with all team leaders soon via email and your Team Portal dashboard.

Contact Support: sihinternal.vsitr@gmail.com
VSITR, Kadi
    `;

    await sendEmail({
      recipientEmail: member.email,
      recipientName: member.fullName,
      teamId: team.id,
      subject,
      bodyHtml,
      bodyText,
      type: 'ppt_submission',
    });
  });

  await Promise.all(emailPromises);
}
