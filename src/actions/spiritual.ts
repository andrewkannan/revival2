'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export async function submitPrayerRequest(data: { content: string }) {
  try {
    if (!data.content.trim()) {
      return { success: false, message: "Prayer request cannot be empty." };
    }

    await prisma.prayerRequest.create({
      data: {
        authorName: "Anonymous",
        content: data.content.trim(),
        isApproved: false // Admin must approve
      }
    });

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

export async function submitTestimony(data: { content: string }) {
  try {
    if (!data.content.trim()) {
      return { success: false, message: "Testimony cannot be empty." };
    }

    await prisma.testimony.create({
      data: {
        content: data.content.trim(),
        isApproved: false // Admin must approve
      }
    });

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
