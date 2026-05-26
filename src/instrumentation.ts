export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import to avoid edge runtime issues
    const cron = await import('node-cron');
    const { sendDashboardReport } = await import('./lib/report');
    const { default: prisma } = await import('./lib/prisma');

    // Run every hour
    cron.schedule('0 * * * *', async () => {
      try {
        const settings = await prisma.reportSettings.findUnique({ where: { id: 1 } });
        if (settings && settings.enabled) {
          const lastSent = new Date(settings.lastSentAt).getTime();
          const now = Date.now();
          const msInDay = 24 * 60 * 60 * 1000;
          
          const daysPassed = (now - lastSent) / msInDay;
          if (daysPassed >= settings.frequencyDays) {
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
