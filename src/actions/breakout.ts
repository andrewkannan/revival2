'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function loginSpeaker(password: string) {
  if (password === 'revival2026') { 
    const c = await cookies();
    c.set('speaker_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });
    return { success: true };
  }
  return { success: false, message: 'Invalid speaker password' };
}

export async function submitBreakoutQuestion(sessionId: number, content: string, authorName?: string) {
  try {
    if (!content || content.trim().length === 0) {
      return { success: false, message: "Question cannot be empty." };
    }

    const question = await prisma.breakoutQuestion.create({
      data: {
        sessionId,
        content: content.trim(),
        authorName: authorName && authorName.trim() ? authorName.trim() : null
      }
    });

    return { success: true, question };
  } catch (error: any) {
    console.error("Failed to submit breakout question:", error);
    return { success: false, message: error.message };
  }
}

export async function getBreakoutQuestions(sessionId: number) {
  try {
    const questions = await prisma.breakoutQuestion.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, questions };
  } catch (error: any) {
    console.error("Failed to fetch breakout questions:", error);
    return { success: false, message: error.message };
  }
}

export async function markBreakoutQuestionDone(id: string, isDone: boolean) {
  try {
    const question = await prisma.breakoutQuestion.update({
      where: { id },
      data: { isDone }
    });
    return { success: true, question };
  } catch (error: any) {
    console.error("Failed to update breakout question:", error);
    return { success: false, message: error.message };
  }
}
