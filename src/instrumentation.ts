export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import to avoid edge runtime issues
    const cron = await import('node-cron');
    const { sendDashboardReport } = await import('./lib/report');
    const { default: prisma } = await import('./lib/prisma');

    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        const settings = await prisma.reportSettings.findUnique({ where: { id: 1 } });
        if (settings && settings.enabled) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          const timeParts = (settings.sendTime || '08:00').split(':');
          const targetHour = parseInt(timeParts[0]);
          const targetMinute = parseInt(timeParts[1] || '0');

          const lastSentDate = new Date(settings.lastSentAt);
          lastSentDate.setHours(0, 0, 0, 0);
          
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          
          const msInDay = 24 * 60 * 60 * 1000;
          const daysPassed = Math.round((todayDate.getTime() - lastSentDate.getTime()) / msInDay);
          
          const currentTimeMins = currentHour * 60 + currentMinute;
          const targetTimeMins = targetHour * 60 + targetMinute;

          if (daysPassed >= settings.frequencyDays && currentTimeMins >= targetTimeMins) {
            console.log("[AutoReport] Time to send automated report. Generating...");
            await sendDashboardReport();
            console.log("[AutoReport] Sent successfully.");
          }
        }
      } catch (e) {
        console.error("[AutoReport] Error checking/sending report:", e);
      }
    });
    
    console.log("[AutoReport] Cron scheduler initialized.");
  }
}
