const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const fs = require('fs');
const path = require('path');
const { getSignedFileUrl } = require('../../services/r2.service');

/**
 * Helper function to delete files from local storage
 * @param {string} filePath 
 */
const deleteLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to delete local file: ${filePath}`, err);
    }
  }
};

/**
 * Create a category
 * @param {Object} categoryBody
 * @returns {Promise<Category>}
 */
const createCategory = async (categoryBody) => {
  return prisma.category.create({
    data: categoryBody,
  });
};

/**
 * Query for categories
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryCategories = async (filter, options) => {
  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  let orderBy = { createdAt: 'desc' };
  if (sortBy) {
    const [field, order] = sortBy.split(':');
    orderBy = { [field]: order };
  }

  // Improve search filter (Case-insensitive partial match)
  const where = {};
  if (filter.name) {
    where.name = {
      contains: filter.name,
      mode: 'insensitive',
    };
  }

  const categories = await prisma.category.findMany({
    where,
    take: Number(limit),
    skip: skip,
    orderBy: orderBy,
    include: {
      _count: {
        select: { tracks: true }
      }
    }
  });

  // Map dynamic count and signed URLs
  const results = await Promise.all(categories.map(async (cat) => ({
    ...cat,
    iconUrl: await getSignedFileUrl(cat.iconUrl),
    coverImageUrl: await getSignedFileUrl(cat.coverImageUrl),
    totalTracks: cat._count.tracks
  })));

  const totalResults = await prisma.category.count({ where });
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: results,
    page: Number(page),
    limit: Number(limit),
    totalPages,
    totalResults,
  };
};

/**
 * Get category by id
 * @param {string} id
 * @returns {Promise<Category>}
 */
const getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      tracks: {
        include: {
          category: { select: { name: true } }
        }
      },
      _count: {
        select: { tracks: true }
      }
    }
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  
  // Map signed URLs for category and its tracks
  const mappedCategory = {
    ...category,
    iconUrl: await getSignedFileUrl(category.iconUrl),
    coverImageUrl: await getSignedFileUrl(category.coverImageUrl),
    totalTracks: category._count.tracks,
    tracks: await Promise.all(category.tracks.map(async (track) => ({
      ...track,
      audioUrl: await getSignedFileUrl(track.audioUrl),
      coverImageUrl: await getSignedFileUrl(track.coverImageUrl),
    })))
  };

  return mappedCategory;
};

/**
 * Update category by id
 * @param {string} categoryId
 * @param {Object} updateBody
 * @returns {Promise<Category>}
 */
const updateCategoryById = async (categoryId, updateBody) => {
  const category = await getCategoryById(categoryId);
  
  // If a new icon is uploaded, delete the old one
  if (updateBody.iconUrl && category.iconUrl && updateBody.iconUrl !== category.iconUrl) {
    deleteLocalFile(category.iconUrl);
  }

  // If a new cover image is uploaded, delete the old one
  if (updateBody.coverImageUrl && category.coverImageUrl && updateBody.coverImageUrl !== category.coverImageUrl) {
    deleteLocalFile(category.coverImageUrl);
  }

  const updatedCategory = await prisma.category.update({
    where: { id: category.id },
    data: updateBody,
  });

  return updatedCategory;
};

/**
 * Delete category by id
 * @param {string} categoryId
 * @returns {Promise<Category>}
 */
const deleteCategoryById = async (categoryId) => {
  const category = await getCategoryById(categoryId);
  
  // Delete associated files from storage
  deleteLocalFile(category.iconUrl);
  deleteLocalFile(category.coverImageUrl);

  await prisma.category.delete({
    where: { id: category.id },
  });

  return category;
};

module.exports = {
  createCategory,
  queryCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};
