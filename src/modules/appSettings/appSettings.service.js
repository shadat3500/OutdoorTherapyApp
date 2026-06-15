const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { encrypt } = require('../../utils/crypto');

/**
 * Get app settings (only the first record)
 * @returns {Promise<AppSettings>}
 */
const getSettings = async () => {
  return prisma.appSettings.findFirst();
};

/**
 * Update app settings (upsert logic: if not exists, create)
 * @param {Object} updateBody
 * @returns {Promise<AppSettings>}
 */
const updateSettings = async (updateBody) => {
  const settings = await prisma.appSettings.findFirst();

  // Encrypt sensitive Stripe keys if they are provided in the update
  if (updateBody.stripeSecretKey) updateBody.stripeSecretKey = encrypt(updateBody.stripeSecretKey);
  if (updateBody.stripeWebhookSecret) updateBody.stripeWebhookSecret = encrypt(updateBody.stripeWebhookSecret);

  if (settings) {
    return prisma.appSettings.update({
      where: { id: settings.id },
      data: updateBody,
    });
  }
  
  return prisma.appSettings.create({
    data: updateBody,
  });
};

module.exports = {
  getSettings,
  updateSettings,
};
