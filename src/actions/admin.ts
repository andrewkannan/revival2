'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { RegistrationStatus, OutreachLocation, TemplateType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sendPaymentRejectedEmail, sendEmail, parseTemplate } from '@/lib/email';
import QRCode from 'qrcode';

const ADMIN_COOKIE_NAME = 'revival_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 1 week

export async function loginAdmin(password: string) {
  const secret = process.env.ADMIN_SECRET;
  
  if (!secret) {
    console.warn("ADMIN_SECRET is not set in environment variables.");
    if (password === 'admin') {
      await (await cookies()).set(ADMIN_COOKIE_NAME, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });
      return { success: true };
    }
    return { success: false, message: 'Invalid password.' };
  }

  if (password === secret) {
    await (await cookies()).set(ADMIN_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return { success: true };
  }

  return { success: false, message: 'Invalid password.' };
}

export async function logoutAdmin() {
  await (await cookies()).delete(ADMIN_COOKIE_NAME);
  return { success: true };
}

export async function getAdminConfig() {
  let config = await prisma.adminConfig.findUnique({
    where: { id: 1 }
  });

  if (!config) {
    // Create default config if it doesn't exist
    config = await prisma.adminConfig.create({
      data: {
        id: 1,
        adultCapacity: 300,
        kidsCapacity: 100,
        isEarlyBird: true,
        adultPriceEarlyBird: 50,
        kidsPriceEarlyBird: 25,
        adultPriceRegular: 80,
        kidsPriceRegular: 40,
      }
    });
  }

  return config;
}

export async function updateAdminConfig(data: {
  adultCapacity: number;
  kidsCapacity: number;
  isEarlyBird: boolean;
  adultPriceEarlyBird: number;
  kidsPriceEarlyBird: number;
  adultPriceRegular: number;
  kidsPriceRegular: number;
  earlyBirdEndDate?: Date | null;
}) {
  try {
    await prisma.adminConfig.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data
      }
    });
    
    revalidatePath('/admin/settings');
    revalidatePath('/'); // revalidate the home page to update prices/availability
    
    return { success: true };
  } catch (e) {
    console.error("Failed to update admin config", e);
    return { success: false, message: "Failed to save configuration." };
  }
}

export async function updateRegistrationStatus(id: string, status: RegistrationStatus) {
  try {
    const registration = await prisma.registration.update({
      where: { id },
      data: { status },
      include: { attendee: true, tickets: true }
    });
    
    if (status === 'PAYMENT_REJECTED') {
      // Fire and forget email
      sendPaymentRejectedEmail(registration.attendee.email, registration.attendee.name).catch(e => console.error("Async email error:", e));
    } else if (status === 'SEAT_SECURED') {
      // Generate Master QR code for the registration
      let qrCodeUrl = registration.qrCodeUrl;
      if (!qrCodeUrl) {
        qrCodeUrl = await QRCode.toDataURL(registration.id);
        await prisma.registration.update({
          where: { id: registration.id },
          data: { qrCodeUrl }
        });
      }

      // Send E-Ticket email
      const template = await getEmailTemplate('E_TICKET');
      const formattedOrderNumber = 'R' + String(registration.orderNumber).padStart(5, '0');
      const parsedHtml = parseTemplate(template.bodyHtml, {
        name: registration.attendee.name,
        orderNumber: formattedOrderNumber
      });

      const attachments = [{
        filename: `revival-ticket-${formattedOrderNumber}.png`,
        content: qrCodeUrl.split("base64,")[1],
        encoding: 'base64',
        cid: `ticket_master`
      }];

      const totalTickets = registration.adultTickets + registration.kidsTickets;

      // Boarding Pass Style HTML
      let finalHtml = parsedHtml;
      if (!finalHtml.includes('ticket_master')) {
        const passHtml = `
          <div style="max-width: 400px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 16px; overflow: hidden; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; letter-spacing: 2px;">REVIVAL 2026</h2>
              <p style="margin: 5px 0 0; color: #94a3b8; font-size: 14px;">Official Conference Pass</p>
            </div>
            <div style="padding: 30px 20px; background-color: white; text-align: center;">
              <img src="cid:ticket_master" alt="QR Code" style="width: 200px; height: 200px; margin: 0 auto; display: block;" />
            </div>
            <div style="background-color: #f8fafc; border-top: 2px dashed #cbd5e1; padding: 20px; text-align: center;">
              <p style="margin: 0 0 5px; font-weight: bold; font-size: 18px; color: #0f172a;">Order ${formattedOrderNumber}</p>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Admit ${totalTickets} ${totalTickets === 1 ? 'Person' : 'People'}</p>
            </div>
          </div>
        `;
        finalHtml += `<br/>${passHtml}`;
      }

      // Fire and forget: send email asynchronously
      sendEmail(registration.attendee.email, template.subject, finalHtml, attachments).catch(e => console.error("Async email error:", e));
    }
    
    revalidatePath('/admin/registrations');
    
    return { success: true };
  } catch (e) {
    console.error("Failed to update registration status", e);
    return { success: false, message: "Failed to update status." };
  }
}

export async function updateRegistrationDetails(
  id: string,
  attendeeId: string,
  data: {
    name: string;
    email: string;
    phone: string;
    outreach: OutreachLocation;
    totalAmount: number;
    status: RegistrationStatus;
    receiptBase64?: string | null;
    adultTickets?: number;
    kidsTickets?: number;
  }
) {
  try {
    const oldReg = await prisma.registration.findUnique({ 
      where: { id },
      include: { tickets: true }
    });
    
    const updateData: any = {
      status: data.status,
      totalAmount: data.totalAmount,
    };
    if (data.receiptBase64) {
      updateData.receiptUrl = data.receiptBase64;
    }
    
    if (data.adultTickets !== undefined) {
      updateData.adultTickets = data.adultTickets;
    }
    if (data.kidsTickets !== undefined) {
      updateData.kidsTickets = data.kidsTickets;
    }

    await prisma.$transaction(async (tx) => {
      await tx.registration.update({
        where: { id },
        data: updateData
      });

      // Sync Ticket table if ticket counts changed
      if (oldReg && data.adultTickets !== undefined && data.adultTickets !== oldReg.adultTickets) {
        const diff = data.adultTickets - oldReg.adultTickets;
        if (diff > 0) {
          const newTickets = Array.from({ length: diff }).map(() => ({
            registrationId: id,
            ticketType: 'ADULT' as const
          }));
          await tx.ticket.createMany({ data: newTickets });
        } else if (diff < 0) {
          const excess = Math.abs(diff);
          const adultTickets = oldReg.tickets.filter(t => t.ticketType === 'ADULT');
          const toDelete = adultTickets.slice(0, excess).map(t => t.id);
          if (toDelete.length > 0) {
            await tx.ticket.deleteMany({ where: { id: { in: toDelete } } });
          }
        }
      }

      if (oldReg && data.kidsTickets !== undefined && data.kidsTickets !== oldReg.kidsTickets) {
        const diff = data.kidsTickets - oldReg.kidsTickets;
        if (diff > 0) {
          const newTickets = Array.from({ length: diff }).map(() => ({
            registrationId: id,
            ticketType: 'KIDS' as const
          }));
          await tx.ticket.createMany({ data: newTickets });
        } else if (diff < 0) {
          const excess = Math.abs(diff);
          const kidsTickets = oldReg.tickets.filter(t => t.ticketType === 'KIDS');
          const toDelete = kidsTickets.slice(0, excess).map(t => t.id);
          if (toDelete.length > 0) {
            await tx.ticket.deleteMany({ where: { id: { in: toDelete } } });
          }
        }
      }
    });

    const attendeeObj = await prisma.attendee.findUnique({
      where: { id: attendeeId },
      include: { _count: { select: { registrations: true } } }
    });

    if (attendeeObj && attendeeObj._count.registrations > 1) {
      // Create a NEW attendee for this specific registration and link it
      const newAttendee = await prisma.attendee.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          outreach: data.outreach,
        }
      });
      // Update this specific registration to point to the newly created attendee
      await prisma.registration.update({
        where: { id },
        data: { attendeeId: newAttendee.id }
      });
    } else {
      // Just update the existing attendee since it only has 1 registration
      await prisma.attendee.update({
        where: { id: attendeeId },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          outreach: data.outreach,
        }
      });
    }

    if (data.status === 'PAYMENT_REJECTED' && oldReg?.status !== 'PAYMENT_REJECTED') {
      // Fire and forget email
      sendPaymentRejectedEmail(data.email, data.name).catch(e => console.error("Async email error:", e));
    } else if (data.status === 'SEAT_SECURED' && oldReg?.status !== 'SEAT_SECURED') {
       // Also trigger E-ticket generation here
       await updateRegistrationStatus(id, 'SEAT_SECURED');
    }
    
    revalidatePath('/admin/registrations');
    return { success: true };
  } catch (e) {
    console.error("Failed to update registration details", e);
    return { success: false, message: "Failed to update details." };
  }
}

export async function deleteRegistration(id: string) {
  try {
    // Delete tickets first due to foreign key constraints, though Cascade should handle it
    await prisma.ticket.deleteMany({ where: { registrationId: id } });
    await prisma.registration.delete({ where: { id } });
    
    revalidatePath('/admin/registrations');
    return { success: true };
  } catch (e) {
    console.error("Failed to delete registration", e);
    return { success: false, message: "Failed to delete registration." };
  }
}

export async function getDashboardStats() {
  const config = await getAdminConfig();
  
  const totalRegistrations = await prisma.registration.count();

  const securedAgg = await prisma.registration.aggregate({
    _sum: { adultTickets: true, kidsTickets: true, totalAmount: true },
    where: { status: 'SEAT_SECURED' }
  });

  const pendingAgg = await prisma.registration.aggregate({
    _sum: { adultTickets: true, kidsTickets: true, totalAmount: true },
    where: { status: { in: ['PENDING_FOR_PAYMENT', 'PENDING_FOR_REVIEW'] } }
  });

  // Calculate outreach stats
  const allRegistrations = await prisma.registration.findMany({
    select: { status: true, adultTickets: true, kidsTickets: true, attendee: { select: { outreach: true } } }
  });
  
  type OutreachStats = { totalRegistrations: number; totalTickets: number; secured: number; pending: number };
  const outreachCounts = allRegistrations.reduce((acc, curr) => {
    const loc = curr.attendee?.outreach || 'OTHERS';
    if (!acc[loc]) {
      acc[loc] = { totalRegistrations: 0, totalTickets: 0, secured: 0, pending: 0 };
    }
    
    const ticketsInReg = curr.adultTickets + curr.kidsTickets;
    
    acc[loc].totalRegistrations += 1;
    acc[loc].totalTickets += ticketsInReg;
    
    if (curr.status === 'SEAT_SECURED') {
      acc[loc].secured += ticketsInReg;
    } else if (curr.status === 'PENDING_FOR_PAYMENT' || curr.status === 'PENDING_FOR_REVIEW') {
      acc[loc].pending += ticketsInReg;
    }
    return acc;
  }, {} as Record<string, OutreachStats>);

  return {
    adultCapacity: config.adultCapacity,
    kidsCapacity: config.kidsCapacity,
    securedAdults: securedAgg._sum.adultTickets || 0,
    securedKids: securedAgg._sum.kidsTickets || 0,
    pendingAdults: pendingAgg._sum.adultTickets || 0,
    pendingKids: pendingAgg._sum.kidsTickets || 0,
    totalRegistrations,
    totalPaidAmount: Number(securedAgg._sum.totalAmount || 0),
    totalPendingAmount: Number(pendingAgg._sum.totalAmount || 0),
    outreachCounts
  };
}

export async function getReportSettings() {
  let settings = await prisma.reportSettings.findUnique({
    where: { id: 1 }
  });

  if (!settings) {
    settings = await prisma.reportSettings.create({
      data: {
        id: 1,
        enabled: false,
        emails: "",
        frequencyDays: 3,
      }
    });
  }

  return settings;
}

export async function updateReportSettings(data: {
  enabled: boolean;
  emails: string;
  frequencyDays: number;
}) {
  try {
    await prisma.reportSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data
      }
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to update report settings", e);
    return { success: false, message: "Failed to update report settings." };
  }
}

export async function getEmailSettings() {
  let settings = await prisma.emailSettings.findUnique({
    where: { id: 1 }
  });

  if (!settings) {
    settings = await prisma.emailSettings.create({
      data: {
        id: 1,
        host: "smtp.gmail.com",
        port: 465,
        fromName: "REVIVAL Team",
      }
    });
  }

  return settings;
}

export async function updateEmailSettings(data: {
  host: string;
  port: number;
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
}) {
  try {
    await prisma.emailSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data
      }
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to update email settings", e);
    return { success: false, message: "Failed to save email settings." };
  }
}

export async function getEmailTemplate(type: TemplateType) {
  let template = await prisma.emailTemplate.findUnique({
    where: { type }
  });

  if (!template) {
    let subject = '';
    let bodyHtml = '';
    
    if (type === 'INVOICE') {
      subject = 'REVIVAL Conference - Registration Invoice';
      bodyHtml = `
<div style="max-width: 500px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 16px; overflow: hidden; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 24px; letter-spacing: 2px;">REVIVAL 2026</h2>
    <p style="margin: 5px 0 0; color: #94a3b8; font-size: 14px;">Registration Invoice</p>
  </div>
  <div style="padding: 30px 20px; background-color: white;">
    <p style="font-size: 18px; color: #0f172a; font-weight: bold;">Hi {{name}},</p>
    <p style="color: #475569; line-height: 1.6;">Thank you for registering for the REVIVAL conference! Your registration has been received and is currently pending payment.</p>
    <div style="margin: 25px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0 0 5px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold;">Order Number</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0f172a; font-family: monospace;">{{orderNumber}}</p>
    </div>
    <div style="margin: 25px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold;">Total Amount Due</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0f172a;">RM {{totalAmount}}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; font-size: 14px; padding: 15px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
      <strong>Action Required:</strong> If you selected 'Pay Later' or have not uploaded your payment receipt, please upload your proof of payment via the registration portal or reply to this email with your receipt attached.
    </p>
  </div>
  <div style="background-color: #f8fafc; border-top: 2px dashed #cbd5e1; padding: 20px; text-align: center;">
    <p style="margin: 0; color: #64748b; font-size: 14px;">Blessings,<br/>The REVIVAL Team</p>
  </div>
</div>`;
    } else if (type === 'E_TICKET') {
      subject = 'REVIVAL Conference - Your E-Tickets';
      bodyHtml = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2>Your Tickets are Confirmed!</h2>
  <p>Hi {{name}},</p>
  <p>Your payment has been verified. Attached are your unique QR code e-tickets for order <strong>{{orderNumber}}</strong>.</p>
  <p>Please present these QR codes at the entrance for scanning.</p>
  <br/>
  <p>See you there,<br/>The REVIVAL Team</p>
</div>`;
    } else if (type === 'REMINDER') {
      subject = 'REVIVAL Conference - Reminder';
      bodyHtml = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2>REVIVAL Conference is Approaching!</h2>
  <p>Hi {{name}},</p>
  <p>This is a friendly reminder for the upcoming REVIVAL conference. We are so excited to see you!</p>
  <p>Don't forget to have your QR code e-tickets ready for scanning at the entrance.</p>
  <br/>
  <p>Blessings,<br/>The REVIVAL Team</p>
</div>`;
    }

    template = await prisma.emailTemplate.create({
      data: {
        type,
        subject,
        bodyHtml
      }
    });
  }

  return template;
}

export async function updateEmailTemplate(type: TemplateType, subject: string, bodyHtml: string) {
  try {
    await prisma.emailTemplate.upsert({
      where: { type },
      update: { subject, bodyHtml },
      create: { type, subject, bodyHtml }
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to update email template", e);
    return { success: false, message: "Failed to save email template." };
  }
}

export async function sendConferenceReminders() {
  try {
    const registrations = await prisma.registration.findMany({
      where: { status: 'SEAT_SECURED' },
      include: { attendee: true }
    });

    const template = await getEmailTemplate('REMINDER');

    let sentCount = 0;
    for (const reg of registrations) {
      const parsedHtml = parseTemplate(template.bodyHtml, {
        name: reg.attendee.name,
        orderNumber: reg.orderNumber.toString()
      });
      const sent = await sendEmail(reg.attendee.email, template.subject, parsedHtml);
      if (sent) sentCount++;
    }

    return { success: true, message: `Sent ${sentCount} reminders.` };
  } catch (e) {
    console.error("Failed to send reminders", e);
    return { success: false, message: "Failed to send reminders." };
  }
}

export async function getEmailLogs() {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent 100 for dashboard performance
    });
    return { success: true, logs };
  } catch (e) {
    console.error("Failed to fetch email logs", e);
    return { success: false, logs: [] };
  }
}

export async function retryEmail(logId: string) {
  try {
    const log = await prisma.emailLog.findUnique({ where: { id: logId } });
    if (!log) return { success: false, message: 'Log not found' };

    const attendee = await prisma.attendee.findFirst({
      where: { email: log.to },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { tickets: true }
        }
      }
    });

    if (!attendee || attendee.registrations.length === 0) {
      return { success: false, message: 'Attendee or Registration not found' };
    }

    const registration = attendee.registrations[0];

    if (log.subject.includes('Registration Invoice')) {
      const template = await getEmailTemplate('INVOICE');
      const formattedOrderNumber = 'R' + String(registration.orderNumber).padStart(5, '0');
      const parsedHtml = parseTemplate(template.bodyHtml, {
        name: attendee.name,
        orderNumber: formattedOrderNumber,
        totalAmount: registration.totalAmount.toString()
      });
      const success = await sendEmail(log.to, template.subject, parsedHtml);
      if (success) {
        await prisma.emailLog.update({ where: { id: logId }, data: { status: 'SENT', error: null } });
      }
      revalidatePath('/admin/emails');
      return { success, message: success ? 'Retried successfully' : 'Retry failed again' };
    } else if (log.subject.includes('E-Tickets')) {
      const template = await getEmailTemplate('E_TICKET');
      const formattedOrderNumber = 'R' + String(registration.orderNumber).padStart(5, '0');
      const parsedHtml = parseTemplate(template.bodyHtml, {
        name: attendee.name,
        orderNumber: formattedOrderNumber
      });

      const attachments = registration.qrCodeUrl ? [{
        filename: `revival-ticket-${formattedOrderNumber}.png`,
        content: registration.qrCodeUrl.split("base64,")[1],
        encoding: 'base64',
        cid: `ticket_master`
      }] : [];

      const totalTickets = registration.adultTickets + registration.kidsTickets;

      let finalHtml = parsedHtml;
      if (!finalHtml.includes('ticket_master') && attachments.length > 0) {
        const passHtml = `
          <div style="max-width: 400px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 16px; overflow: hidden; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; letter-spacing: 2px;">REVIVAL 2026</h2>
              <p style="margin: 5px 0 0; color: #94a3b8; font-size: 14px;">Official Conference Pass</p>
            </div>
            <div style="padding: 30px 20px; background-color: white; text-align: center;">
              <img src="cid:ticket_master" alt="QR Code" style="width: 200px; height: 200px; margin: 0 auto; display: block;" />
            </div>
            <div style="background-color: #f8fafc; border-top: 2px dashed #cbd5e1; padding: 20px; text-align: center;">
              <p style="margin: 0 0 5px; font-weight: bold; font-size: 18px; color: #0f172a;">Order ${formattedOrderNumber}</p>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Admit ${totalTickets} ${totalTickets === 1 ? 'Person' : 'People'}</p>
            </div>
          </div>
        `;
        finalHtml += `<br/>${passHtml}`;
      }

      const success = await sendEmail(log.to, template.subject, finalHtml, attachments);
      if (success) {
        await prisma.emailLog.update({ where: { id: logId }, data: { status: 'SENT', error: null } });
      }
      revalidatePath('/admin/emails');
      return { success, message: success ? 'Retried successfully' : 'Retry failed again' };
    } else if (log.subject.includes('Action Required')) {
      const success = await sendPaymentRejectedEmail(log.to, attendee.name);
      if (success) {
        await prisma.emailLog.update({ where: { id: logId }, data: { status: 'SENT', error: null } });
      }
      revalidatePath('/admin/emails');
      return { success, message: success ? 'Retried successfully' : 'Retry failed again' };
    } else {
      return { success: false, message: 'Unknown email type for retry' };
    }
  } catch (e: any) {
    console.error("Retry failed:", e);
    return { success: false, message: e.message || 'Server error' };
  }
}
