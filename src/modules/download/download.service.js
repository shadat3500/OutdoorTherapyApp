const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { getSignedFileUrl } = require('../../services/r2.service');

/**
 * Start a download (Check unique quota and return signed link)
 */
const startDownload = async (userId, trackId) => {
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { 
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
        take: 1
      }
    }
  });
  const track = await prisma.track.findUnique({ where: { id: trackId } });

  if (!track) throw new ApiError(httpStatus.NOT_FOUND, 'Track not found');

  // 1. Check if this track was ALREADY completed by this user (Re-download case)
  const existingDownload = await prisma.download.findUnique({
    where: { userId_trackId: { userId, trackId } },
  });

  // If already COMPLETED, allow re-downloading without quota checks
  if (existingDownload && existingDownload.status === 'COMPLETED') {
    const downloadUrl = await getSignedFileUrl(track.audioUrl);
    return { ...existingDownload, downloadUrl };
  }

  // 2. Quota enforcement for NEW downloads
  if (user.userType === 'FREE') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Downloads are not available for Free users.');
  }

  if (user.userType === 'BASIC') {
    const activeSub = user.subscriptions[0];
    const maxLimit = activeSub?.plan?.downloadLimit || 3; // Default to 3 if not set in plan

    // Count how many UNIQUE tracks this user has already COMPLETED
    const completedCount = await prisma.download.count({
      where: { userId, status: 'COMPLETED' },
    });

    if (completedCount >= maxLimit) {
      throw new ApiError(httpStatus.FORBIDDEN, `Download limit reached for Basic plan (${maxLimit} tracks).`);
    }
  }

  // 3. Create or Reset PENDING record
  const downloadRecord = await prisma.download.upsert({
    where: { userId_trackId: { userId, trackId } },
    update: { status: 'PENDING', progressPercent: 0 },
    create: { userId, trackId, status: 'PENDING', progressPercent: 0 },
  });

  const downloadUrl = await getSignedFileUrl(track.audioUrl);

  return {
    ...downloadRecord,
    downloadUrl
  };
};

/**
 * Update status (Trigger for counting logic)
 */
const updateDownloadStatus = async (downloadId, userId, updateBody) => {
  const download = await prisma.download.findUnique({
    where: { id: downloadId },
    include: { track: true }
  });

  if (!download || download.userId !== userId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Download record not found');
  }

  // Logic: If status is being changed to COMPLETED for the first time
  const isNewlyCompleted = updateBody.status === 'COMPLETED' && download.status !== 'COMPLETED';

  const updatedDownload = await prisma.download.update({
    where: { id: downloadId },
    data: updateBody,
  });

  if (isNewlyCompleted) {
    // Increment global track download count
    await prisma.track.update({
      where: { id: download.trackId },
      data: { downloadCount: { increment: 1 } }
    });
  }

  return updatedDownload;
};

/**
 * Get user's completed downloads list
 */
const getMyDownloads = async (userId) => {
  const downloads = await prisma.download.findMany({
    where: { userId, status: 'COMPLETED' },
    include: {
      track: {
        include: {
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return Promise.all(downloads.map(async (item) => ({
    ...item,
    track: {
      ...item.track,
      audioUrl: await getSignedFileUrl(item.track.audioUrl),
      coverImageUrl: await getSignedFileUrl(item.track.coverImageUrl),
    }
  })));
};

/**
 * Delete download record (Optional)
 */
const deleteDownload = async (downloadId, userId) => {
  const download = await prisma.download.findUnique({ where: { id: downloadId } });
  if (!download || download.userId !== userId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Download record not found');
  }
  return prisma.download.delete({ where: { id: downloadId } });
};

module.exports = {
  startDownload,
  updateDownloadStatus,
  getMyDownloads,
  deleteDownload,
};
