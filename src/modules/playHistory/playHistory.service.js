const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { getSignedFileUrl } = require('../../services/r2.service');

/**
 * Update play history (Upsert)
 * @param {string} userId
 * @param {string} trackId
 * @param {number} playedSeconds
 * @returns {Promise<Object>}
 */
const updatePlayHistory = async (userId, trackId, playedSeconds) => {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
  });

  if (!track) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Track not found');
  }

  // Check if history already exists for this user and track
  const existingHistory = await prisma.playHistory.findFirst({
    where: {
      userId,
      trackId,
    },
  });

  if (existingHistory) {
    return prisma.playHistory.update({
      where: { id: existingHistory.id },
      data: {
        playedSeconds,
        playedAt: new Date(),
      },
    });
  }

  return prisma.playHistory.create({
    data: {
      userId,
      trackId,
      playedSeconds,
    },
  });
};

/**
 * Get "Continue Listening" tracks (Last 5 played)
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const getContinueListening = async (userId) => {
  const history = await prisma.playHistory.findMany({
    where: { userId },
    take: 5,
    orderBy: { playedAt: 'desc' },
    include: {
      track: {
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return Promise.all(history.map(async (item) => ({
    ...item,
    track: {
      ...item.track,
      audioUrl: await getSignedFileUrl(item.track.audioUrl),
      coverImageUrl: await getSignedFileUrl(item.track.coverImageUrl),
    }
  })));
};

module.exports = {
  updatePlayHistory,
  getContinueListening,
};
