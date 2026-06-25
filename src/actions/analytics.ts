'use server';

import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

/**
 * Tracks a page visit. Should be called from a client component on route change.
 */
export async function trackPageVisit(path: string) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || null;

    await prisma.pageVisit.create({
      data: {
        path,
        userAgent
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to track page visit:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Fetches aggregated analytics data for the admin dashboard.
 */
export async function getAnalyticsData() {
  try {
    const totalVisits = await prisma.pageVisit.count();

    // Get the most visited paths
    const visitsByPathRaw = await prisma.pageVisit.groupBy({
      by: ['path'],
      _count: {
        path: true,
      },
      orderBy: {
        _count: {
          path: 'desc',
        },
      },
      take: 10,
    });

    const visitsByPath = visitsByPathRaw.map((item) => ({
      path: item.path,
      count: item._count.path,
    }));

    // Get visits over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVisitsRaw = await prisma.pageVisit.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group recent visits by day string (YYYY-MM-DD)
    const visitsByDayMap: Record<string, number> = {};
    for (const visit of recentVisitsRaw) {
      const day = visit.createdAt.toISOString().split('T')[0];
      visitsByDayMap[day] = (visitsByDayMap[day] || 0) + 1;
    }

    const visitsByDay = Object.entries(visitsByDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        totalVisits,
        visitsByPath,
        visitsByDay,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch analytics data:", error);
    return { success: false, message: error.message, data: null };
  }
}
