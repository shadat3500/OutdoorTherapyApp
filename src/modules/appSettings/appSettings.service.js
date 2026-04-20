const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');

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
