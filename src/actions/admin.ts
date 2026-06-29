'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { RegistrationStatus, OutreachLocation, TemplateType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sendPaymentRejectedEmail, sendEmail, parseTemplate } from '@/lib/email';
import QRCode from 'qrcode';

const ADMIN_COOKIE_NAME = 'revival_admin_session';
const SCANNER_COOKIE_NAME = 'revival_scanner_session';
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

export async function loginScanner(password: string) {
  const secret = process.env.SCANNER_SECRET || 'scanner';
  
  // If the admin logs in using the admin secret here, we can also grant them scanner access
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (password === secret || (adminSecret && password === adminSecret) || (password === 'admin' && !adminSecret)) {
    await (await cookies()).set(SCANNER_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return { success: true };
  }

  return { success: false, message: 'Invalid scanner password.' };
}

export async function logoutScanner() {
  await (await cookies()).delete(SCANNER_COOKIE_NAME);
  return { success: true };
}

export async function getAdminConfig() {
  let config = await prisma.adminConfig.findUnique({
    where: { id: 1 }
  });

  if (!config) {
    config = await prisma.adminConfig.create({
      data: {
        id: 1,
        adultCapacity: 300,
        kidsCapacity: 100,
        isEarlyBird: true,
        adultPriceEarlyBird: 50,
        kidsPriceEarlyBird: 30,
        adultPriceRegular: 80,
        kidsPriceRegular: 50,
        isPrayerLocked: true,
        prayerUnlockTime: new Date('2026-06-26T12:00:00+08:00'),
        isTestimonyLocked: true,
        testimonyUnlockTime: new Date('2026-06-26T12:00:00+08:00'),
        isGalleryLocked: true,
        galleryUnlockTime: new Date('2026-06-26T12:00:00+08:00'),
        isBreakoutQALocked: true,
        isEventCompleted: false
      }
    });
  }

  return {
    adultCapacity: config.adultCapacity,
    kidsCapacity: config.kidsCapacity,
    isEarlyBird: config.isEarlyBird,
    adultPriceEarlyBird: Number(config.adultPriceEarlyBird),
    kidsPriceEarlyBird: Number(config.kidsPriceEarlyBird),
    adultPriceRegular: Number(config.adultPriceRegular),
    kidsPriceRegular: Number(config.kidsPriceRegular),
    earlyBirdEndDate: config.earlyBirdEndDate ? config.earlyBirdEndDate.toISOString() : null,
    liveAnnouncement: config.liveAnnouncement,
    notificationEmails: config.notificationEmails || '',
    instagramUrl: config.instagramUrl || '',
    tiktokUrl: config.tiktokUrl || '',
    youtubeUrl: config.youtubeUrl || '',
    playlistUrl: config.playlistUrl || '',
    isPrayerLocked: config.isPrayerLocked,
    prayerUnlockTime: config.prayerUnlockTime ? config.prayerUnlockTime.toISOString() : null,
    isTestimonyLocked: config.isTestimonyLocked,
    testimonyUnlockTime: config.testimonyUnlockTime ? config.testimonyUnlockTime.toISOString() : null,
    isGalleryLocked: config.isGalleryLocked,
    galleryUnlockTime: config.galleryUnlockTime ? config.galleryUnlockTime.toISOString() : null,
    isEmailQueuePaused: config.isEmailQueuePaused,
    isBreakoutQALocked: config.isBreakoutQALocked,
    isEventCompleted: config.isEventCompleted,
  };
}

export async function toggleEmailQueue(paused: boolean) {
  try {
    await prisma.adminConfig.upsert({
      where: { id: 1 },
      update: { isEmailQueuePaused: paused },
      create: { id: 1, isEmailQueuePaused: paused }
    });
    revalidatePath('/admin/emails/queue');
    return { success: true };
  } catch (e) {
    console.error("Failed to toggle email queue", e);
    return { success: false, message: "Failed to update queue status" };
  }
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
  liveAnnouncement?: string | null;
  notificationEmails?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  playlistUrl?: string | null;
  isPrayerLocked?: boolean;
  prayerUnlockTime?: Date | null;
  isTestimonyLocked?: boolean;
  testimonyUnlockTime?: Date | null;
  isGalleryLocked?: boolean;
  galleryUnlockTime?: Date | null;
  isBreakoutQALocked?: boolean;
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
    revalidatePath('/itinerary'); // revalidate itinerary page for live announcements
    
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
      data: { 
        status,
        seatSecuredAt: status === 'SEAT_SECURED' ? new Date() : undefined
      },
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

      let queuedHtml = finalHtml;
      if (attachments && attachments.length > 0) {
        queuedHtml += `<script type="application/json" id="attachments">${JSON.stringify(attachments)}</script>`;
      }
      await prisma.emailQueue.create({
        data: {
          to: registration.attendee.email,
          subject: template.subject,
          html: queuedHtml,
          status: 'PENDING'
        }
      });
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
    receiptBase64_2?: string | null;
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
      updateData.receiptUploadedAt = new Date();
    }
    if (data.receiptBase64_2 !== undefined) {
      updateData.receiptUrl2 = data.receiptBase64_2;
      if (data.receiptBase64_2) updateData.receipt2UploadedAt = new Date();
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

  const wristbandAgg = await prisma.registration.aggregate({
    _sum: { adultTickets: true, kidsTickets: true },
    where: { wristbandCollected: true }
  });

  const starterPackAgg = await prisma.registration.aggregate({
    _sum: { adultTickets: true, kidsTickets: true },
    where: { starterPackCollected: true }
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
    wristbandsCollected: (wristbandAgg._sum.adultTickets || 0) + (wristbandAgg._sum.kidsTickets || 0),
    starterPacksCollected: (starterPackAgg._sum.adultTickets || 0) + (starterPackAgg._sum.kidsTickets || 0),
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
        sendTime: "08:00",
      }
    });
  }

  return settings;
}

export async function updateReportSettings(data: {
  enabled: boolean;
  emails: string;
  frequencyDays: number;
  sendTime: string;
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
      await prisma.emailQueue.create({
        data: {
          to: reg.attendee.email,
          subject: template.subject,
          html: parsedHtml,
          status: 'PENDING'
        }
      });
      sentCount++;
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
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, logs };
  } catch (e) {
    console.error("Failed to fetch email logs", e);
    return { success: false, logs: [] };
  }
}

export async function retryAllFailedEmails() {
  try {
    const result = await prisma.emailQueue.updateMany({
      where: { status: 'FAILED' },
      data: { status: 'PENDING', attempts: 0, error: null }
    });
    return { success: true, count: result.count, message: `Retriggered ${result.count} failed emails.` };
  } catch (e: any) {
    console.error("Failed to retrigger emails:", e);
    return { success: false, message: e.message };
  }
}

export async function getEmailQueue() {
  try {
    const queue = await prisma.emailQueue.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, queue };
  } catch (error: any) {
    console.error("Error fetching email queue:", error);
    return { success: false, queue: [], message: error.message };
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
      await prisma.emailQueue.create({
        data: {
          to: log.to,
          subject: template.subject,
          html: parsedHtml,
          status: 'PENDING'
        }
      });
      await prisma.emailLog.update({ where: { id: logId }, data: { status: 'SENT', error: 'Queued instead' } });
      revalidatePath('/admin/emails');
      return { success: true, message: 'Queued successfully' };
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

      let queuedHtml = finalHtml;
      if (attachments && attachments.length > 0) {
        queuedHtml += `<script type="application/json" id="attachments">${JSON.stringify(attachments)}</script>`;
      }
      await prisma.emailQueue.create({
        data: {
          to: log.to,
          subject: template.subject,
          html: queuedHtml,
          status: 'PENDING'
        }
      });
      await prisma.emailLog.update({ where: { id: logId }, data: { status: 'SENT', error: 'Queued instead' } });
      revalidatePath('/admin/emails');
      return { success: true, message: 'Queued successfully' };
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

export async function sendPaymentReminderTest() {
  try {
    const adminConfig = await prisma.adminConfig.findUnique({ where: { id: 1 } });
    const emailSettings = await prisma.emailSettings.findUnique({ where: { id: 1 } });
    
    if (!emailSettings || !emailSettings.username) {
      return { success: false, message: "SMTP not configured" };
    }

    const testEmail = emailSettings.username;
    
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #000;">Action Required: Payment Reminder</h2>
        <p>Hi Test User,</p>
        <p>We noticed that you have successfully registered for REVIVAL but have not yet uploaded your payment receipt. To secure your tickets, please complete your payment of <strong>RM 50.00</strong>.</p>
        
        <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Bank Details</h3>
          <p style="margin: 0;"><strong>Bank Name:</strong> Maybank<br>
          <strong>Account Name:</strong> CALVARY COMMUNITY TT<br>
          <strong>Account Number:</strong> 551016737305<br>
          <strong>Payment Reference:</strong> BIL CONF</p>
        </div>

        <p>Once you have made the transfer, please click the button below to upload your receipt:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://revival.thisiscccbilingual.com/upload/test-id" style="background-color: #cdff64; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Upload Payment Receipt</a>
        </div>
        
        <p>If you have already paid, please ignore this email or upload your receipt using the link above.</p>
        <p>Best regards,<br>The REVIVAL Team</p>
      </div>
    `;

    await prisma.emailQueue.create({
      data: {
        to: testEmail,
        subject: "REVIVAL - Payment Reminder (TEST)",
        html: html,
        status: 'PENDING'
      }
    });
    
    return { success: true, message: `Test email queued to ${testEmail}` };
  } catch (error: any) {
    console.error("Test email error:", error);
    return { success: false, message: error.message };
  }
}

export async function sendBulkPaymentReminders() {
  try {
    const pendingUsers = await prisma.registration.findMany({
      where: {
        status: 'PENDING_FOR_PAYMENT',
        receiptUrl: null
      },
      include: {
        attendee: true
      }
    });

    if (pendingUsers.length === 0) {
      return { success: true, message: "No pending users without receipts found." };
    }

    let successCount = 0;
    
    for (const reg of pendingUsers) {
      const orderNum = 'R' + String(reg.orderNumber).padStart(5, '0');
      const html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h2 style="color: #000;">Action Required: Payment Reminder</h2>
          <p>Hi ${reg.attendee.name},</p>
          <p>We noticed that you have successfully registered for REVIVAL but have not yet uploaded your payment receipt. To secure your tickets, please complete your payment of <strong>RM ${reg.totalAmount.toFixed(2)}</strong>.</p>
          
          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Bank Details</h3>
            <p style="margin: 0;"><strong>Bank Name:</strong> Maybank<br>
            <strong>Account Name:</strong> CALVARY COMMUNITY TT<br>
            <strong>Account Number:</strong> 551016737305<br>
            <strong>Payment Reference:</strong> BIL CONF</p>
          </div>

          <p>Once you have made the transfer, please click the button below to upload your receipt:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://revival.thisiscccbilingual.com/upload/${reg.id}" style="background-color: #cdff64; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Upload Payment Receipt</a>
          </div>
          
          <p>If you have already paid, please ignore this email or upload your receipt using the link above.</p>
          <p>Best regards,<br>The REVIVAL Team</p>
        </div>
      `;

      await prisma.emailQueue.create({
        data: {
          to: reg.attendee.email,
          subject: `REVIVAL - Payment Reminder (Order #${orderNum})`,
          html: html,
          status: 'PENDING'
        }
      });
      successCount++;
    }

    return { success: true, message: `Successfully queued ${successCount} reminders to be sent at 2 per minute.` };
  } catch (error: any) {
    console.error("Bulk email error:", error);
    return { success: false, message: error.message };
  }
}

export async function sendIndividualPaymentReminder(registrationId: string) {
  try {
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { attendee: true }
    });

    if (!reg) {
      return { success: false, message: "Registration not found" };
    }

    if (reg.receiptUrl) {
      return { success: false, message: "User already uploaded a receipt" };
    }

    const orderNum = 'R' + String(reg.orderNumber).padStart(5, '0');
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #000;">Action Required: Payment Reminder</h2>
        <p>Hi ${reg.attendee.name},</p>
        <p>We noticed that you have successfully registered for REVIVAL but have not yet uploaded your payment receipt. To secure your tickets, please complete your payment of <strong>RM ${reg.totalAmount.toFixed(2)}</strong>.</p>
        
        <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Bank Details</h3>
          <p style="margin: 0;"><strong>Bank Name:</strong> Maybank<br>
          <strong>Account Name:</strong> CALVARY COMMUNITY TT<br>
          <strong>Account Number:</strong> 551016737305<br>
          <strong>Payment Reference:</strong> BIL CONF</p>
        </div>

        <p>Once you have made the transfer, please click the button below to upload your receipt:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://revival.thisiscccbilingual.com/upload/${reg.id}" style="background-color: #cdff64; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Upload Payment Receipt</a>
        </div>
        
        <p>If you have already paid, please ignore this email or upload your receipt using the link above.</p>
        <p>Best regards,<br>The REVIVAL Team</p>
      </div>
    `;

    await prisma.emailQueue.create({
      data: {
        to: reg.attendee.email,
        subject: `REVIVAL - Payment Reminder (Order #${orderNum})`,
        html: html,
        status: 'PENDING'
      }
    });
    
    return { success: true, message: `Reminder queued to ${reg.attendee.name}` };
  } catch (error: any) {
    console.error("Individual email error:", error);
    return { success: false, message: error.message };
  }
}



export async function toggleRegistrationCheckin(
  registrationId: string, 
  field: 'wristbandCollected' | 'starterPackCollected' | 'allCollected',
  value: boolean
) {
  try {
    const updateData: any = {};
    if (field === 'allCollected') {
      updateData.wristbandCollected = value;
      updateData.starterPackCollected = value;
    } else {
      updateData[field] = value;
    }
    
    // Auto-set checkedInAt on the first item collected
    if (value === true) {
      const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
      if (reg && !reg.checkedInAt) {
        updateData.checkedInAt = new Date();
      }
    }

    await prisma.registration.update({
      where: { id: registrationId },
      data: updateData
    });
    
    revalidatePath('/admin');
    revalidatePath('/admin/registrations');
    revalidatePath('/admin/scanner');
    return { success: true };
  } catch (error: any) {
    console.error("Checkin toggle error:", error);
    return { success: false, message: error.message };
  }
}

export async function searchRegistrationManual(query: string) {
  try {
    if (!query || query.trim() === '') {
      return { success: false, message: "Query is empty" };
    }

    const cleanQuery = query.trim();
    
    // Check if query looks like an order number (e.g. R00015 or 15)
    let orderNumber: number | undefined;
    const orderMatch = cleanQuery.match(/^(?:R|r)?0*(\d+)$/);
    if (orderMatch) {
      orderNumber = parseInt(orderMatch[1], 10);
    }

    const regs = await prisma.registration.findMany({
      where: {
        OR: [
          ...(orderNumber ? [{ orderNumber }] : []),
          { attendee: { name: { contains: cleanQuery, mode: 'insensitive' } } },
          { attendee: { email: { contains: cleanQuery, mode: 'insensitive' } } },
          { attendee: { phone: { contains: cleanQuery, mode: 'insensitive' } } }
        ]
      },
      include: {
        attendee: true,
        tickets: true
      },
      take: 10 // Limit results to prevent massive payloads
    });

    return { success: true, registrations: regs };
  } catch (error: any) {
    console.error("Search error:", error);
    return { success: false, message: error.message };
  }
}

export async function getRegistrationByTicketId(ticketId: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        registration: {
          include: {
            attendee: true,
            tickets: true
          }
        }
      }
    });

    if (!ticket) {
      // Fallback: Check if the scanned QR code is actually a Registration ID (Master QR Code)
      const reg = await prisma.registration.findUnique({
        where: { id: ticketId },
        include: {
          attendee: true,
          tickets: true
        }
      });
      
      if (reg) {
        return { success: true, registration: reg };
      }

      return { success: false, message: "Invalid QR Code: Registration or Ticket not found." };
    }

    return { success: true, registration: ticket.registration };
  } catch (error: any) {
    console.error("Error fetching registration by ticket:", error);
    return { success: false, message: error.message };
  }
}

export async function sendTestAnticipationEmail(testEmail: string) {
  try {
    const reg = await prisma.registration.findFirst({
      where: { attendee: { email: testEmail } },
      include: { attendee: true, tickets: true }
    });

    if (!reg) {
      return { success: false, message: "No registration found for this test email to generate the QR code." };
    }

    let qrCodeUrl = reg.qrCodeUrl;
    if (!qrCodeUrl) {
      qrCodeUrl = await QRCode.toDataURL(reg.id);
      await prisma.registration.update({
        where: { id: reg.id },
        data: { qrCodeUrl }
      });
    }

    const formattedOrderNumber = 'R' + String(reg.orderNumber).padStart(5, '0');
    const attachments = [{
      filename: `revival-ticket-${formattedOrderNumber}.png`,
      content: qrCodeUrl.split("base64,")[1],
      encoding: 'base64',
      cid: 'qrcode'
    }];

    const name = reg.attendee.name.split(' ')[0] || 'Friend';

    const ticketCount = reg.tickets ? reg.tickets.length : 1;
    const ticketText = ticketCount === 1 ? '1 Ticket' : `${ticketCount} Tickets`;

    const html = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; text-align: center; background-color: #0f171a; color: #ffffff; padding: 40px; border-radius: 20px;">
        <h2 style="color: #cdff64; margin-bottom: 20px;">⏳ The countdown begins!</h2>
        <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">Hi ${name},</p>
        <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">We are exactly 7 days away from REVIVAL! We can't wait to see what God is going to do in our midst next week.</p>
        
        <div style="margin: 40px 0; padding: 20px; border: 2px solid #cdff64; border-radius: 15px; display: inline-block;">
          <h1 style="color: #cdff64; font-size: 32px; margin: 0; letter-spacing: 2px;">7 DAYS LEFT</h1>
        </div>

        <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">We want to give you early access to the official <strong>REVIVAL Itinerary & Experience Hub</strong>. Here, you can check out the full schedule, listen to our worship playlist to prepare your heart, and even share a testimony or drop a prayer request ahead of time!</p>
        
        <div style="margin: 30px 0;">
          <a href="https://revival.thisiscccbilingual.com/itinerary" style="display: inline-block; background-color: #cdff64; color: #0f171a; font-weight: bold; padding: 16px 32px; border-radius: 12px; text-decoration: none;">View Itinerary & Experience Hub</a>
          <p style="font-size: 14px; color: #cbd5e1; margin-top: 10px;">Experience the preparation.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #334155; margin: 40px 0;" />
        
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">Use this QR code for fast group check-in and collection of wristbands and starter packs.</p>
        
        <!-- Ticket Design -->
        <div style="max-width: 320px; margin: 0 auto 30px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Top Header -->
          <div style="background-color: #0f172a; padding: 24px 20px; text-align: center;">
            <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 1px;">REVIVAL 2026</h3>
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">Official Conference Pass</p>
          </div>
          
          <!-- QR Code Section -->
          <div style="padding: 30px 20px; background-color: #ffffff; text-align: center;">
            <img src="cid:qrcode" alt="Master Ticket QR Code" style="width: 200px; height: 200px; display: inline-block; margin: 0 auto;" />
          </div>
          
          <!-- Divider -->
          <div style="border-top: 2px dashed #cbd5e1; margin: 0;"></div>
          
          <!-- Details Section -->
          <div style="background-color: #f8fafc; padding: 24px 20px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px; font-weight: bold;">${reg.attendee.name}</h4>
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-family: monospace; letter-spacing: 2px;">${formattedOrderNumber}</p>
            <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">${ticketText}</p>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid #334155; margin: 40px 0;" />

        <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">Start preparing your hearts, and we will see you very soon!</p>
        <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">The REVIVAL Team</p>
      </div>
    `;

    const { sendEmail } = await import('@/lib/email');

    const success = await sendEmail(
      testEmail,
      "7 Days to REVIVAL 2026",
      html,
      attachments
    );

    if (success) {
      return { success: true };
    } else {
      return { success: false, message: "Failed to send email. Check logs." };
    }
  } catch (error: any) {
    console.error("Test email error:", error);
    return { success: false, message: error.message };
  }
}

export async function sendMassAnticipationEmail() {
  try {
    const registrations = await prisma.registration.findMany({
      where: {
        status: 'SEAT_SECURED'
      },
      include: {
        attendee: true,
        tickets: true
      }
    });

    if (registrations.length === 0) {
      return { success: false, message: "No secured registrations found." };
    }

    let successCount = 0;
    let failCount = 0;

    const { sendEmail } = await import('@/lib/email');

    for (const reg of registrations) {
      const email = reg.attendee.email;
      const name = reg.attendee.name.split(' ')[0] || 'Friend';

      if (!email) continue;

      let qrCodeUrl = reg.qrCodeUrl;
      if (!qrCodeUrl) {
        qrCodeUrl = await QRCode.toDataURL(reg.id);
        await prisma.registration.update({
          where: { id: reg.id },
          data: { qrCodeUrl }
        });
      }

      const formattedOrderNumber = 'R' + String(reg.orderNumber).padStart(5, '0');
      const attachments = [{
        filename: `revival-ticket-${formattedOrderNumber}.png`,
        content: qrCodeUrl.split("base64,")[1],
        encoding: 'base64',
        cid: 'qrcode'
      }];

      const attachmentsHtml = `<script type="application/json" id="attachments">${JSON.stringify(attachments)}</script>`;

      const ticketCount = reg.tickets ? reg.tickets.length : 1;
      const ticketText = ticketCount === 1 ? '1 Ticket' : `${ticketCount} Tickets`;

      const html = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; text-align: center; background-color: #0f171a; color: #ffffff; padding: 40px; border-radius: 20px;">
          <h2 style="color: #cdff64; margin-bottom: 20px;">⏳ The countdown begins!</h2>
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">Hi ${name},</p>
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">We are exactly 7 days away from REVIVAL! We can't wait to see what God is going to do in our midst next week.</p>
          
          <div style="margin: 40px 0; padding: 20px; border: 2px solid #cdff64; border-radius: 15px; display: inline-block;">
            <h1 style="color: #cdff64; font-size: 32px; margin: 0; letter-spacing: 2px;">7 DAYS LEFT</h1>
          </div>

          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">We want to give you early access to the official <strong>REVIVAL Itinerary & Experience Hub</strong>. Here, you can check out the full schedule, listen to our worship playlist to prepare your heart, and even share a testimony or drop a prayer request ahead of time!</p>
          
          <div style="margin: 30px 0;">
            <a href="https://revival.thisiscccbilingual.com/itinerary" style="display: inline-block; background-color: #cdff64; color: #0f171a; font-weight: bold; padding: 16px 32px; border-radius: 12px; text-decoration: none;">Check out the Revival Itinerary</a>
            <p style="font-size: 14px; color: #cbd5e1; margin-top: 10px; font-weight: bold;">Click now!</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #334155; margin: 40px 0;" />
          
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">Use this QR code for fast group check-in and collection of wristbands and starter packs.</p>
          
          <!-- Ticket Design -->
          <div style="max-width: 320px; margin: 0 auto 30px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <!-- Top Header -->
            <div style="background-color: #0f172a; padding: 24px 20px; text-align: center;">
              <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 1px;">REVIVAL 2026</h3>
              <p style="margin: 0; color: #94a3b8; font-size: 14px;">Official Conference Pass</p>
            </div>
            
            <!-- QR Code Section -->
            <div style="padding: 30px 20px; background-color: #ffffff; text-align: center;">
              <img src="cid:qrcode" alt="Master Ticket QR Code" style="width: 200px; height: 200px; display: inline-block; margin: 0 auto;" />
            </div>
            
            <!-- Divider -->
            <div style="border-top: 2px dashed #cbd5e1; margin: 0;"></div>
            
            <!-- Details Section -->
            <div style="background-color: #f8fafc; padding: 24px 20px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px; font-weight: bold;">${reg.attendee.name}</h4>
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-family: monospace; letter-spacing: 2px;">${formattedOrderNumber}</p>
              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">${ticketText}</p>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #334155; margin: 40px 0;" />

          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">Start preparing your hearts, and we will see you very soon!</p>
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; text-align: left;">The REVIVAL Team</p>
        </div>
        ${attachmentsHtml}
      `;

      await prisma.emailQueue.create({
        data: {
          to: email,
          subject: "7 Days to REVIVAL 2026",
          html: html,
          status: 'PENDING'
        }
      });
      successCount++;
    }

    return { 
      success: true, 
      message: `Successfully queued ${successCount} emails to be sent at 2 per minute.` 
    };
  } catch (error: any) {
    console.error("Mass email error:", error);
    return { success: false, message: error.message };
  }
}

function generateConferenceEveHtml(name: string, formattedOrderNumber: string, ticketText: string, reg: any) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b1013; color: #ffffff; padding: 0; border-radius: 24px; overflow: hidden; border: 1px solid #1c272a;">
      
      <!-- Hero Header -->
      <div style="background-color: #11181a; padding: 50px 30px; text-align: center; border-bottom: 1px solid #233135;">
        <h1 style="color: #ffffff; font-size: 34px; font-weight: 900; margin: 0; letter-spacing: 5px; text-transform: uppercase;">REVIVAL 2026</h1>
        <p style="color: #8caeb0; font-size: 13px; font-weight: 700; letter-spacing: 3px; margin: 12px 0 0 0; text-transform: uppercase;">1 Day to Go</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #ffffff; line-height: 1.6; margin: 0 0 20px 0;">Hi ${name},</p>
        <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 35px 0;">We are just <strong>ONE DAY</strong> away from REVIVAL! Below is your official ticket. Please have the QR code ready on your phone for fast group check-in.</p>
        
        <!-- Registration Instructions Panel -->
        <div style="background-color: rgba(140, 174, 176, 0.08); border: 1px solid rgba(140, 174, 176, 0.2); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 45px;">
          <h2 style="color: #8caeb0; font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 15px 0;">Important Info</h2>
          <p style="font-size: 15px; color: #cbd5e1; margin: 0;">Registration & Check-in strictly opens at:</p>
          <div style="background-color: #0b1013; padding: 15px 25px; border-radius: 12px; margin: 18px auto; display: inline-block; border: 1px solid rgba(205, 255, 100, 0.15); box-shadow: 0 4px 20px rgba(205, 255, 100, 0.05);">
            <p style="font-size: 26px; color: #cdff64; font-weight: 800; margin: 0; letter-spacing: 1px;">6:00 PM - 7:30 PM</p>
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin: 0; line-height: 1.5;">Please arrive early to collect your wristbands and starter packs!</p>
        </div>
        
        <!-- Original Ticket Design -->
        <div style="max-width: 320px; margin: 30px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Top Header -->
          <div style="background-color: #0f172a; padding: 24px 20px; text-align: center;">
            <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 1px;">REVIVAL 2026</h3>
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">Official Conference Pass</p>
          </div>
          
          <!-- QR Code Section -->
          <div style="padding: 30px 20px; background-color: #ffffff; text-align: center;">
            <img src="cid:qrcode" alt="Master Ticket QR Code" style="width: 200px; height: 200px; display: inline-block; margin: 0 auto;" />
          </div>
          
          <!-- Divider -->
          <div style="border-top: 2px dashed #cbd5e1; margin: 0;"></div>
          
          <!-- Details Section -->
          <div style="background-color: #f8fafc; padding: 24px 20px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px; font-weight: bold;">${reg.attendee.name}</h4>
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-family: monospace; letter-spacing: 2px;">${formattedOrderNumber}</p>
            <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">${ticketText}</p>
          </div>
        </div>

        <!-- Call to Action -->
        <div style="text-align: center; margin: 45px 0;">
          <a href="https://revival.thisiscccbilingual.com/itinerary" style="display: inline-block; background-color: #8caeb0; color: #0b1013; font-size: 14px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 20px 45px; border-radius: 50px; text-decoration: none; box-shadow: 0 10px 30px rgba(140, 174, 176, 0.2);">View Full Itinerary</a>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 15px; font-weight: 500;">Check out the schedule before you arrive!</p>
        </div>

        <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 35px;">
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 8px 0;">Start preparing your hearts.</p>
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0;">We will see you tomorrow!</p>
          <p style="font-size: 13px; color: #64748b; margin: 30px 0 0 0; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">— The REVIVAL Team</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendConferenceEveEmailTest(testEmail: string) {
  try {
    const reg = await prisma.registration.findFirst({
      where: { status: 'SEAT_SECURED' },
      include: { attendee: true, tickets: true }
    });

    if (!reg) return { success: false, message: "No secured registration found to generate test." };

    let qrCodeUrl = reg.qrCodeUrl;
    if (!qrCodeUrl) {
      qrCodeUrl = await QRCode.toDataURL(reg.id);
      await prisma.registration.update({ where: { id: reg.id }, data: { qrCodeUrl } });
    }

    const formattedOrderNumber = 'R' + String(reg.orderNumber).padStart(5, '0');
    const attachments = [{
      filename: `revival-ticket-${formattedOrderNumber}.png`,
      content: qrCodeUrl.split("base64,")[1],
      encoding: 'base64',
      cid: 'qrcode'
    }];
    const attachmentsHtml = `<script type="application/json" id="attachments">${JSON.stringify(attachments)}</script>`;

    const name = reg.attendee.name.split(' ')[0] || 'Friend';
    const ticketCount = reg.tickets ? reg.tickets.length : 1;
    const ticketText = ticketCount === 1 ? '1 Ticket' : `${ticketCount} Tickets`;

    const html = generateConferenceEveHtml(name, formattedOrderNumber, ticketText, reg) + attachmentsHtml;

    await prisma.emailQueue.create({
      data: {
        to: testEmail,
        subject: "[TEST] See you tomorrow at REVIVAL 2026!",
        html: html,
        status: 'PENDING'
      }
    });

    return { success: true, message: `Test email queued for ${testEmail}` };
  } catch (error: any) {
    console.error("Test email error:", error);
    return { success: false, message: error.message };
  }
}

export async function sendConferenceEveEmailBulk() {
  try {
    const registrations = await prisma.registration.findMany({
      where: { status: 'SEAT_SECURED' },
      include: { attendee: true, tickets: true }
    });

    if (registrations.length === 0) return { success: false, message: "No secured registrations found." };

    let successCount = 0;

    for (const reg of registrations) {
      const email = reg.attendee.email;
      if (!email) continue;

      let qrCodeUrl = reg.qrCodeUrl;
      if (!qrCodeUrl) {
        qrCodeUrl = await QRCode.toDataURL(reg.id);
        await prisma.registration.update({ where: { id: reg.id }, data: { qrCodeUrl } });
      }

      const formattedOrderNumber = 'R' + String(reg.orderNumber).padStart(5, '0');
      const attachments = [{
        filename: `revival-ticket-${formattedOrderNumber}.png`,
        content: qrCodeUrl.split("base64,")[1],
        encoding: 'base64',
        cid: 'qrcode'
      }];
      const attachmentsHtml = `<script type="application/json" id="attachments">${JSON.stringify(attachments)}</script>`;

      const name = reg.attendee.name.split(' ')[0] || 'Friend';
      const ticketCount = reg.tickets ? reg.tickets.length : 1;
      const ticketText = ticketCount === 1 ? '1 Ticket' : `${ticketCount} Tickets`;

      const html = generateConferenceEveHtml(name, formattedOrderNumber, ticketText, reg) + attachmentsHtml;

      await prisma.emailQueue.create({
        data: {
          to: email,
          subject: "See you tomorrow at REVIVAL 2026!",
          html: html,
          status: 'PENDING'
        }
      });
      successCount++;
    }

    return { success: true, message: `Successfully queued ${successCount} emails.` };
  } catch (error: any) {
    console.error("Mass email error:", error);
    return { success: false, message: error.message };
  }
}

export async function resendTicketEmail(registrationId: string) {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { attendee: true }
    });

    if (!registration) throw new Error("Registration not found");
    if (registration.status !== 'SEAT_SECURED') throw new Error("Ticket is not secured yet");

    let qrCodeUrl = registration.qrCodeUrl;
    if (!qrCodeUrl) {
      qrCodeUrl = await QRCode.toDataURL(registration.id);
      await prisma.registration.update({
        where: { id: registration.id },
        data: { qrCodeUrl }
      });
    }

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

    let queuedHtml = finalHtml;
    if (attachments && attachments.length > 0) {
      queuedHtml += `<script type="application/json" id="attachments">${JSON.stringify(attachments)}</script>`;
    }
    await prisma.emailQueue.create({
      data: {
        to: registration.attendee.email,
        subject: template.subject,
        html: queuedHtml,
        status: 'PENDING'
      }
    });
    
    return { success: true, message: `Ticket queued to ${registration.attendee.name}` };
  } catch (error: any) {
    console.error("Resend ticket error:", error);
    return { success: false, message: error.message };
  }
}

export async function prioritizeEmailInQueue(id: string) {
  try {
    // Set createdAt to an old date so it gets picked up first
    await prisma.emailQueue.update({
      where: { id },
      data: { createdAt: new Date(0) }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Prioritize email error:", error);
    return { success: false, message: error.message };
  }
}

export async function getMerchandiseOrders() {

  try {
    const orders = await prisma.merchandiseOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: orders };
  } catch (e) {
    console.error(e);
    return { success: false, data: [] };
  }
}

export async function updateMerchandiseOrderStatus(orderId: string, status: string) {
  try {
    await prisma.merchandiseOrder.update({
      where: { id: orderId },
      data: { status }
    });
    revalidatePath('/admin/merchandise');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update merchandise order status:", error);
    return { success: false, message: 'Failed to update order status' };
  }
}

function generatePostEventHtml(name: string) {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #0b1013; color: #f8fafc; padding: 40px 20px; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #162024 0%, #0b1013 100%); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://revival.thisiscccbilingual.com/hero/revival-logo.png" alt="REVIVAL Logo" style="max-width: 250px; height: auto; margin: 0 auto; display: block;" />
          <h2 style="margin: 20px 0 0; font-size: 20px; letter-spacing: 4px; color: white; text-transform: uppercase;">Revival Is Here</h2>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 35px; margin-bottom: 35px;">
          <h3 style="margin: 0 0 15px; font-size: 22px; color: white;">Hi ${name},</h3>
          <p style="font-size: 16px; color: #cbd5e1; margin: 0 0 20px;">What an incredible time we had at REVIVAL 2026! Thank you for being a part of this amazing journey and for bringing your faith, energy, and presence to the conference.</p>
          <p style="font-size: 16px; color: #cbd5e1; margin: 0 0 20px;">Although the physical event has concluded, the movement is just beginning. We want to invite you to stay connected and continue engaging with everything that God is doing.</p>
        </div>

        <!-- Links Section -->
        <div style="margin-bottom: 35px;">
          <h4 style="margin: 0 0 20px 0; color: white; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Stay Connected</h4>
          
          <a href="https://revival.thisiscccbilingual.com/itinerary#photos" style="display: block; background-color: rgba(255,255,255,0.05); border: 1px solid rgba(140, 174, 176, 0.3); border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; color: #8caeb0; text-decoration: none; font-size: 16px; font-weight: bold;">📸 View Photo Gallery <span style="float: right;">→</span></a>
          
          <a href="https://revival.thisiscccbilingual.com/itinerary#testimonies" style="display: block; background-color: rgba(255,255,255,0.05); border: 1px solid rgba(140, 174, 176, 0.3); border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; color: #8caeb0; text-decoration: none; font-size: 16px; font-weight: bold;">🙌 Share Your Testimonies <span style="float: right;">→</span></a>
          
          <a href="https://revival.thisiscccbilingual.com/itinerary#prayers" style="display: block; background-color: rgba(255,255,255,0.05); border: 1px solid rgba(140, 174, 176, 0.3); border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; color: #8caeb0; text-decoration: none; font-size: 16px; font-weight: bold;">🙏 Join the Prayer Wall <span style="float: right;">→</span></a>
          
          <a href="https://revival.thisiscccbilingual.com/itinerary#merchandise" style="display: block; background-color: rgba(255,255,255,0.05); border: 1px solid rgba(140, 174, 176, 0.3); border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; color: #8caeb0; text-decoration: none; font-size: 16px; font-weight: bold;">👕 Pre-Order Merchandise <span style="float: right;">→</span></a>
          
          <a href="https://revival.thisiscccbilingual.com/itinerary#sow" style="display: block; background-color: rgba(255,255,255,0.05); border: 1px solid rgba(140, 174, 176, 0.3); border-radius: 12px; padding: 16px 20px; color: #8caeb0; text-decoration: none; font-size: 16px; font-weight: bold;">🌱 Sow & Give <span style="float: right;">→</span></a>
        </div>

        <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 35px;">
          <p style="font-size: 20px; color: white; line-height: 1.6; margin: 0 0 10px 0; font-weight: bold; font-style: italic;">"I Will Pour Out My Spirit"</p>
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 15px 0;">An Outpouring. An Awakening. A Generation Arising.</p>
          <p style="font-size: 14px; color: #8caeb0; line-height: 1.6; margin: 0 0 40px 0; font-weight: bold; letter-spacing: 1px;">Acts 2:17-18</p>

          <p style="font-size: 13px; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">— The REVIVAL Team, CCC Bilingual</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendPostEventEmailTest(testEmail: string) {
  try {
    const html = generatePostEventHtml('Friend');

    await prisma.emailQueue.create({
      data: {
        to: testEmail,
        subject: "[TEST] Thank You for Joining REVIVAL 2026",
        html: html,
        status: 'PENDING'
      }
    });

    return { success: true, message: `Test post-event email queued for ${testEmail}` };
  } catch (error: any) {
    console.error("Test post-event email error:", error);
    return { success: false, message: error.message };
  }
}

export async function sendPostEventEmailBulk() {
  try {
    const registrations = await prisma.registration.findMany({
      where: { status: 'SEAT_SECURED' },
      include: { attendee: true }
    });

    if (registrations.length === 0) return { success: false, message: "No secured registrations found." };

    let successCount = 0;

    for (const reg of registrations) {
      const email = reg.attendee.email;
      if (!email) continue;

      const name = reg.attendee.name.split(' ')[0] || 'Friend';
      const html = generatePostEventHtml(name);

      await prisma.emailQueue.create({
        data: {
          to: email,
          subject: "Thank You for Joining REVIVAL 2026",
          html: html,
          status: 'PENDING'
        }
      });
      successCount++;
    }

    return { success: true, message: `Successfully queued ${successCount} post-event emails.` };
  } catch (error: any) {
    console.error("Mass post-event email error:", error);
    return { success: false, message: error.message };
  }
}
