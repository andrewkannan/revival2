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
    // Process email queue every minute (rate limit: 2 per minute)
    const { sendEmail } = await import('./lib/email');
    cron.schedule('* * * * *', async () => {
      try {
        const config = await prisma.adminConfig.findFirst();
        if (config?.isEmailQueuePaused) {
          // Skip processing if queue is paused
          return;
        }

        const pendingEmails = await prisma.emailQueue.findMany({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          take: 2
        });

        if (pendingEmails.length > 0) {
          console.log(`[EmailQueue] Processing ${pendingEmails.length} emails...`);
          
          for (const email of pendingEmails) {
            try {
              let finalHtml = email.html;
              let attachments = [];
              const match = finalHtml.match(/<script type="application\/json" id="attachments">(.*?)<\/script>/);
              if (match) {
                try {
                  attachments = JSON.parse(match[1]);
                  finalHtml = finalHtml.replace(match[0], '');
                } catch (e) {
                  console.error("Failed to parse attachments JSON", e);
                }
              }

              const success = await sendEmail(email.to, email.subject, finalHtml, attachments);
              if (success) {
                await prisma.emailQueue.update({
                  where: { id: email.id },
                  data: { status: 'SENT', sentAt: new Date(), attempts: { increment: 1 } }
                });
              } else {
                await prisma.emailQueue.update({
                  where: { id: email.id },
                  data: { status: 'FAILED', attempts: { increment: 1 }, error: "sendEmail returned false" }
                });
              }
            } catch (err: any) {
              await prisma.emailQueue.update({
                where: { id: email.id },
                data: { status: 'FAILED', attempts: { increment: 1 }, error: err.message }
              });
            }
          }
        }
      } catch (e) {
        console.error("[EmailQueue] Error processing queue:", e);
      }
    });

    console.log("[AutoReport] Cron scheduler initialized.");
  }
}
