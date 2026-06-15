const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { getSignedFileUrl, deleteFile } = require('../../services/r2.service');

/**
 * Create a track
 * @param {Object} trackBody
 * @returns {Promise<Track>}
 */
const createTrack = async (trackBody) => {
  // Check limits for Featured tracks
  if (trackBody.isFeatured === true || trackBody.isFeatured === 'true') {
    const featuredCount = await prisma.track.count({ where: { isFeatured: true } });
    if (featuredCount >= 6) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Featured tracks limit reached (Max 6). Please unfeature another track first.');
    }
  }

  // Check limits for Sleep Tonight tracks
  if (trackBody.isSleepTonight === true || trackBody.isSleepTonight === 'true') {
    const sleepTonightCount = await prisma.track.count({ where: { isSleepTonight: true } });
    if (sleepTonightCount >= 6) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Sleep Tonight tracks limit reached (Max 6). Please remove another track from this list first.');
    }
  }

  return prisma.track.create({
    data: trackBody,
  });
};

/**
 * Query for tracks
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [userId] - Optional userId for context
 * @returns {Promise<QueryResult>}
 */
const queryTracks = async (filter, options, userId = null) => {
  const { limit = 20, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  let orderBy = { createdAt: 'desc' };
  if (sortBy) {
    const [field, order] = sortBy.split(':');
    orderBy = { [field]: order };
  }

  const where = {};
  if (filter.title) {
    where.title = { contains: filter.title, mode: 'insensitive' };
  }
  if (filter.categoryId) {
    where.categoryId = filter.categoryId;
  }
  
  if (filter.isFeatured !== undefined) {
    where.isFeatured = filter.isFeatured === 'true' || filter.isFeatured === true;
  }
  if (filter.isSleepTonight !== undefined) {
    where.isSleepTonight = filter.isSleepTonight === 'true' || filter.isSleepTonight === true;
  }

  const tracks = await prisma.track.findMany({
    where,
    take: Number(limit),
    skip: Number(skip),
    orderBy: orderBy,
    include: {
      category: {
        select: { id: true, name: true }
      },
      // Efficiently check favorites/downloads if userId is provided
      favourites: userId ? { where: { userId }, select: { id: true } } : false,
      downloads: userId ? { where: { userId, status: 'COMPLETED' }, select: { id: true } } : false,
    }
  });

  const results = await Promise.all(tracks.map(async (track) => ({
    ...track,
    audioUrl: await getSignedFileUrl(track.audioUrl),
    coverImageUrl: await getSignedFileUrl(track.coverImageUrl),
    isFavourite: userId ? track.favourites.length > 0 : false,
    isDownloaded: userId ? track.downloads.length > 0 : false,
    favourites: undefined, // Remove relational data from output
    downloads: undefined,
  })));

  const totalResults = await prisma.track.count({ where });
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results,
    page: Number(page),
    limit: Number(limit),
    totalPages,
    totalResults,
  };
};

/**
 * Get track by id
 * @param {string} id
 * @param {string} [userId] - Optional userId to fetch play history
 * @returns {Promise<Track>}
 */
const getTrackById = async (id, userId) => {
  const [track, favourite, download] = await Promise.all([
    prisma.track.findUnique({
      where: { id },
      include: {
        category: {
          select: { name: true }
        },
        playHistory: userId ? {
          where: { userId },
          select: { playedSeconds: true }
        } : false
      }
    }),
    userId ? prisma.favourite.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId: id
        }
      }
    }) : null,
    userId ? prisma.download.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId: id
        }
      }
    }) : null,
  ]);
  
  if (!track) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Track not found');
  }

  // Generate signed URLs
  const audioUrl = await getSignedFileUrl(track.audioUrl);

  const coverImageUrl = await getSignedFileUrl(track.coverImageUrl);

  // Flatten playHistory for easier frontend access
  const playedSeconds = track.playHistory && track.playHistory.length > 0 
    ? track.playHistory[0].playedSeconds 
    : 0;

  // Fetch user to check tier
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { userType: true } }) : null;
  const listenLimitSeconds = (!user || user.userType === 'FREE') ? 300 : null; // 300s = 5m

  return {
    ...track,
    audioUrl,
    coverImageUrl,
    playedSeconds,
    listenLimitSeconds,
    isFavourite: !!favourite, // Converts object/null to boolean
    isDownloaded: !!(download && download.status === 'COMPLETED'),
    playHistory: undefined // Remove the array from response
  };
};

/**
 * Update track by id
 * @param {string} trackId
 * @param {Object} updateBody
 * @returns {Promise<Track>}
 */
const updateTrackById = async (trackId, updateBody) => {
  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Track not found');
  }

  // Check limits for Featured tracks if it's being enabled now
  if ((updateBody.isFeatured === true || updateBody.isFeatured === 'true') && track.isFeatured !== true) {
    const featuredCount = await prisma.track.count({ where: { isFeatured: true } });
    if (featuredCount >= 6) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Featured tracks limit reached (Max 6). Please unfeature another track first.');
    }
  }

  // Check limits for Sleep Tonight tracks if it's being enabled now
  if ((updateBody.isSleepTonight === true || updateBody.isSleepTonight === 'true') && track.isSleepTonight !== true) {
    const sleepTonightCount = await prisma.track.count({ where: { isSleepTonight: true } });
    if (sleepTonightCount >= 6) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Sleep Tonight tracks limit reached (Max 6). Please remove another track from this list first.');
    }
  }
  
  // Cleanup old files if new ones are uploaded
  if (updateBody.audioUrl && track.audioUrl && updateBody.audioUrl !== track.audioUrl) {
    await deleteFile(track.audioUrl);
  }
  if (updateBody.coverImageUrl && track.coverImageUrl && updateBody.coverImageUrl !== track.coverImageUrl) {
    await deleteFile(track.coverImageUrl);
  }

  const updatedTrack = await prisma.track.update({
    where: { id: trackId },
    data: updateBody,
  });

  return updatedTrack;
};

/**
 * Delete track by id
 * @param {string} trackId
 * @returns {Promise<Track>}
 */
const deleteTrackById = async (trackId) => {
  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Track not found');
  }
  
  // Cleanup files
  await deleteFile(track.audioUrl);
  await deleteFile(track.coverImageUrl);

  await prisma.track.delete({
    where: { id: trackId },
  });

  return track;
};

/**
 * Get popular tracks (Top 10 by playCount)
 * @returns {Promise<Array>}
 */
const getPopularTracks = async () => {
  const tracks = await prisma.track.findMany({
    take: 10,
    orderBy: {
      playCount: 'desc',
    },
    include: {
      category: {
        select: { name: true }
      }
    }
  });

  return Promise.all(tracks.map(async (track) => ({
    ...track,
    audioUrl: await getSignedFileUrl(track.audioUrl),
    coverImageUrl: await getSignedFileUrl(track.coverImageUrl),
  })));
};

/**
 * Increment playCount of a track
 * @param {string} trackId
 * @returns {Promise<Track>}
 */
const incrementPlayCount = async (trackId) => {
  return prisma.track.update({
    where: { id: trackId },
    data: { playCount: { increment: 1 } },
  });
};

module.exports = {
  createTrack,
  queryTracks,
  getTrackById,
  getPopularTracks,
  updateTrackById,
  deleteTrackById,
  incrementPlayCount,
};
