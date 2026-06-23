'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';

// --- Prayer Wall Actions ---

export async function getApprovedPrayers() {
  try {
    const prayers = await prisma.prayerRequest.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: prayers };
  } catch (error) {
    console.error("Failed to fetch prayers:", error);
    return { success: false, data: [] };
  }
}

export async function submitPrayerRequest(data: { content: string; authorName?: string }) {
  try {
    if (!data.content.trim()) {
      return { success: false, message: "Prayer request cannot be empty." };
    }

    await prisma.prayerRequest.create({
      data: {
        authorName: data.authorName?.trim() || "Conference Attendee",
        content: data.content.trim(),
        isApproved: false // Admin must approve
      }
    });

    // Send email notification to admins
    try {
      const config = await prisma.adminConfig.findUnique({ where: { id: 1 } });
      if (config?.notificationEmails) {
        const emails = config.notificationEmails.split(',').map(e => e.trim()).filter(Boolean);
        const html = `
          <h2>New Prayer Request Submitted</h2>
          <p>A new prayer request has been submitted by <strong>${data.authorName?.trim() || 'Conference Attendee'}</strong> and is pending your approval.</p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; font-style: italic;">
            ${data.content.trim()}
          </blockquote>
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://revival-conference.com'}/admin/spiritual">Click here to review and approve</a></p>
        `;
        
        for (const email of emails) {
          await prisma.emailQueue.create({
            data: {
              to: email,
              subject: "New Prayer Request Pending Approval",
              html: html,
              status: 'PENDING'
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to send prayer notification email:", e);
    }

    revalidatePath('/admin/spiritual'); // Update admin dashboard
    return { success: true, message: "Prayer request submitted! It will appear on the wall once approved." };
  } catch (error) {
    console.error("Failed to submit prayer:", error);
    return { success: false, message: "Failed to submit prayer request." };
  }
}

export async function incrementPrayerCount(id: string) {
  try {
    await prisma.prayerRequest.update({
      where: { id },
      data: { prayCount: { increment: 1 } }
    });
    
    revalidatePath('/itinerary');
    return { success: true };
  } catch (error) {
    console.error("Failed to increment prayer count:", error);
    return { success: false };
  }
}

// Admin only actions
export async function getAllPrayers() {
  try {
    const prayers = await prisma.prayerRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: prayers };
  } catch (error) {
    console.error("Failed to fetch all prayers:", error);
    return { success: false, data: [] };
  }
}

export async function approvePrayer(id: string) {
  try {
    await prisma.prayerRequest.update({
      where: { id },
      data: { isApproved: true }
    });
    revalidatePath('/admin/spiritual');
    revalidatePath('/itinerary');
    return { success: true };
  } catch (error) {
    console.error("Failed to approve prayer:", error);
    return { success: false, message: "Failed to approve prayer." };
  }
}

export async function deletePrayer(id: string) {
  try {
    await prisma.prayerRequest.delete({
      where: { id }
    });
    revalidatePath('/admin/spiritual');
    revalidatePath('/itinerary');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete prayer:", error);
    return { success: false, message: "Failed to delete prayer." };
  }
}

// --- Testimony Box Actions ---

export async function getApprovedTestimonies() {
  try {
    const testimonies = await prisma.testimony.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: testimonies };
  } catch (error) {
    console.error("Failed to fetch testimonies:", error);
    return { success: false, data: [] };
  }
}

export async function submitTestimony(data: { content: string; authorName?: string }) {
  try {
    if (!data.content.trim()) {
      return { success: false, message: "Testimony cannot be empty." };
    }

    await prisma.testimony.create({
      data: {
        authorName: data.authorName?.trim() || "Conference Attendee",
        content: data.content.trim(),
        isApproved: false // Admin must approve
      }
    });

    // Send email notification to admins
    try {
      const config = await prisma.adminConfig.findUnique({ where: { id: 1 } });
      if (config?.notificationEmails) {
        const emails = config.notificationEmails.split(',').map(e => e.trim()).filter(Boolean);
        const html = `
          <h2>New Testimony Submitted</h2>
          <p>A new testimony has been submitted by <strong>${data.authorName?.trim() || 'Conference Attendee'}</strong> and is pending your approval.</p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; font-style: italic;">
            ${data.content.trim()}
          </blockquote>
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://revival-conference.com'}/admin/spiritual">Click here to review and approve</a></p>
        `;
        
        for (const email of emails) {
          await prisma.emailQueue.create({
            data: {
              to: email,
              subject: "New Testimony Pending Approval",
              html: html,
              status: 'PENDING'
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to send testimony notification email:", e);
    }

    revalidatePath('/admin/spiritual');
    return { success: true, message: "Testimony submitted! It will appear on the feed once approved." };
  } catch (error) {
    console.error("Failed to submit testimony:", error);
    return { success: false, message: "Failed to submit testimony." };
  }
}

export async function incrementTestimonyLike(id: string) {
  try {
    await prisma.testimony.update({
      where: { id },
      data: { likeCount: { increment: 1 } }
    });
    
    revalidatePath('/itinerary');
    return { success: true };
  } catch (error) {
    console.error("Failed to increment testimony like:", error);
    return { success: false };
  }
}

// Admin only actions
export async function getTestimonies() {
  try {
    const testimonies = await prisma.testimony.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: testimonies };
  } catch (error) {
    console.error("Failed to fetch testimonies:", error);
    return { success: false, data: [] };
  }
}

export async function approveTestimony(id: string) {
  try {
    await prisma.testimony.update({
      where: { id },
      data: { isApproved: true }
    });
    revalidatePath('/admin/spiritual');
    revalidatePath('/itinerary');
    return { success: true };
  } catch (error) {
    console.error("Failed to approve testimony:", error);
    return { success: false, message: "Failed to approve testimony." };
  }
}

export async function deleteTestimony(id: string) {
  try {
    await prisma.testimony.delete({
      where: { id }
    });
    revalidatePath('/admin/spiritual');
    revalidatePath('/itinerary');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete testimony:", error);
    return { success: false, message: "Failed to delete testimony." };
  }
}
