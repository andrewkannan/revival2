import { prisma } from './prisma';
import { getDashboardStats } from '@/actions/admin';
import nodemailer from 'nodemailer';

export async function sendDashboardReport() {
  const settings = await prisma.reportSettings.findUnique({ where: { id: 1 } });
  if (!settings || !settings.enabled || !settings.emails) {
    return { success: false, message: 'Reports disabled or no emails configured' };
  }

  const emailSettings = await prisma.emailSettings.findUnique({ where: { id: 1 } });
  if (!emailSettings) {
    return { success: false, message: 'SMTP not configured' };
  }

  const stats = await getDashboardStats();
  
  // Format the email body to look like the dashboard
  let html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #000;">Dashboard Overview Report</h1>
      <p style="color: #666;">Here is your automated summary of the latest registration statistics.</p>
      
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #495057;">Capacity & Tickets</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Adult Tickets Taken</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right;">${stats.securedAdults + stats.pendingAdults} / ${stats.adultCapacity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Total Groups</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right;">${stats.totalRegistrations}</td>
          </tr>
        </table>
      </div>

      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #495057;">Revenue</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Paid Revenue</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right; color: #10b981; font-weight: bold;">RM ${stats.totalPaidAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Pending Revenue</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right; color: #f59e0b; font-weight: bold;">RM ${stats.totalPendingAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px;">
        <h2 style="margin-top: 0; color: #495057;">Outreach Locations</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #dee2e6;">Location</th>
              <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #dee2e6;">Total Tickets</th>
              <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #dee2e6;">Secured</th>
              <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #dee2e6;">Pending</th>
            </tr>
          </thead>
          <tbody>
  `;

  const sortedOutreach = Object.entries(stats.outreachCounts || {}).sort((a, b) => b[1].totalTickets - a[1].totalTickets);
  
  for (const [location, countStats] of sortedOutreach) {
    html += `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${location.replace('_', ' ')}</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: bold;">${countStats.totalTickets}</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right; color: #10b981;">${countStats.secured}</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right; color: #f59e0b;">${countStats.pending}</td>
            </tr>
    `;
  }

  html += `
          </tbody>
        </table>
      </div>
      <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">This is an automated report from the REVIVAL system.</p>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host: emailSettings.host,
    port: emailSettings.port,
    secure: emailSettings.port === 465,
    auth: {
      user: emailSettings.username,
      pass: emailSettings.password,
    },
  });

  const emailList = settings.emails.split(',').map(e => e.trim()).filter(e => e.length > 0);
  
  if (emailList.length === 0) {
    return { success: false, message: 'No valid emails found' };
  }

  try {
    await transporter.sendMail({
      from: `"${emailSettings.fromName}" <${emailSettings.fromEmail || emailSettings.username}>`,
      to: emailList,
      subject: `Dashboard Automated Report - ${new Date().toLocaleDateString()}`,
      html: html,
    });

    // Update last sent time
    await prisma.reportSettings.update({
      where: { id: 1 },
      data: { lastSentAt: new Date() }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send auto report", error);
    return { success: false, message: error.message };
  }
}
