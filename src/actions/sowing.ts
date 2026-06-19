'use server';

import prisma from '@/lib/prisma';
import { OutreachLocation } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function submitSowing(data: {
  name: string;
  amount: number;
  receiptUrl: string;
}) {
  try {
    const sowing = await prisma.sowing.create({
      data: {
        name: data.name,
        amount: data.amount,
        receiptUrl: data.receiptUrl,
      }
    });
    
    // We could revalidate an admin path if they were looking at it
    revalidatePath('/admin/sowing');
    return { success: true, sowingId: sowing.id };
  } catch (error: any) {
    console.error("Failed to submit sowing:", error);
    return { success: false, message: error.message };
  }
}

export async function getSowings() {
  try {
    const sowings = await prisma.sowing.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: sowings };
  } catch (error: any) {
    console.error("Failed to fetch sowings:", error);
    return { success: false, message: error.message };
  }
}

export async function editSowing(id: string, data: { name: string; amount: number; receiptUrl?: string }) {
  try {
    await prisma.sowing.update({
      where: { id },
      data: {
        name: data.name,
        amount: data.amount,
        ...(data.receiptUrl ? { receiptUrl: data.receiptUrl } : {})
      }
    });
    revalidatePath('/admin/sowing');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to edit sowing:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteSowing(id: string) {
  try {
    await prisma.sowing.delete({
      where: { id }
    });
    revalidatePath('/admin/sowing');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete sowing:", error);
    return { success: false, message: error.message };
  }
}
