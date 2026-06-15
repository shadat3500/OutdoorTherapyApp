const admin = require('firebase-admin');
const prisma = require('../../config/prisma');
const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');

// Initialize Firebase Admin (Using Env for path or sorasori config)
let firebaseApp = null;
try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : null;

  if (serviceAccount) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase] Initialized Successfully');
  } else {
    console.warn('[Firebase] Warning: FIREBASE_SERVICE_ACCOUNT not found in .env. Notifications will be disabled.');
  }
} catch (error) {
  console.error('[Firebase] Initialization Error:', error.message);
}

/**
 * Send notification to a specific user
 */
const sendToUser = async (userId, title, body, data = {}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Save to In-App Notification history
  await prisma.notification.create({
    data: { userId, title, message: body },
  });

  if (!firebaseApp || !user?.fcmToken) return;

  const message = {
    notification: { title, body },
    data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
    token: user.fcmToken,
  };

  try {
    await admin.messaging().send(message);
  } catch (error) {
    console.error(`[FCM] Error sending to user ${userId}:`, error.message);
  }
};

/**
 * Send mass notification to all users
 */
const sendToAll = async (title, body, data = {}) => {
  // Fetch all active users (to send In-App notifications)
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    select: { fcmToken: true, id: true },
  });

  if (users.length === 0) return;

  // 1. Save to In-App Notification history for ALL users
  const notificationsData = users.map(u => ({ userId: u.id, title, message: body }));
  await prisma.notification.createMany({ data: notificationsData });

  // 2. Filter users who have FCM tokens for Push Notification
  const tokens = users.map(u => u.fcmToken).filter(t => t !== null);
  
  if (!firebaseApp || tokens.length === 0) {
    console.log(`[FCM] In-app notifications saved for ${users.length} users. Push skipped (No tokens or Firebase not config).`);
    return;
  }

  const message = {
    notification: { title, body },
    data: data,
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`[FCM] Push sent to ${response.successCount} users. Failed: ${response.failureCount}`);
  } catch (error) {
    console.error('[FCM] Mass send error:', error.message);
  }
};

/**
 * Create a Campaign (Scheduled)
 */
const createCampaign = async (campaignBody) => {
  return prisma.notificationCampaign.create({
    data: campaignBody,
  });
};

/**
 * Get Campaigns
 */
const queryCampaigns = async () => {
  return prisma.notificationCampaign.findMany({
    orderBy: { scheduledAt: 'desc' },
  });
};

module.exports = {
  sendToUser,
  sendToAll,
  createCampaign,
  queryCampaigns,
};
