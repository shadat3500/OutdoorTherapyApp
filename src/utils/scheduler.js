const cron = require('node-cron');
const prisma = require('../config/prisma');
const notificationService = require('../modules/notification/notification.service');

/**
 * Initialize all cron jobs
 */
const initSchedulers = () => {
  // Check for scheduled notifications every minute
  cron.schedule('* * * * *', async () => {
    // Safety Check: Ensure Prisma and the model are loaded
    if (!prisma || !prisma.notificationCampaign) {
      console.warn('[Cron] Warning: Prisma or NotificationCampaign model not yet initialized.');
      return;
    }

    console.log('[Cron] Checking for pending notifications...');
    
    const pendingCampaigns = await prisma.notificationCampaign.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: new Date() },
      },
    });

    if (pendingCampaigns.length > 0) {
      console.log(`[Cron] Found ${pendingCampaigns.length} pending campaigns to execute.`);
    }

    for (const campaign of pendingCampaigns) {
      try {
        console.log(`[Cron] Executing campaign: ${campaign.title}`);
        await notificationService.sendToAll(campaign.title, campaign.body);
        
        await prisma.notificationCampaign.update({
          where: { id: campaign.id },
          data: { status: 'sent' },
        });
      } catch (error) {
        console.error(`[Cron] Error in campaign ${campaign.id}:`, error.message);
        await prisma.notificationCampaign.update({
          where: { id: campaign.id },
          data: { status: 'failed' },
        });
      }
    }
  });
};

module.exports = initSchedulers;
