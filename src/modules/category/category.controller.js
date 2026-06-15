const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { categoryService } = require('./index');
const { clearCache } = require('../../middlewares/cache');

/**
 * Utility to extract relative file path
 */
const getFilePath = (file) => {
  if (!file) return null;
  const rawPath = file.key || file.path;
  return rawPath ? rawPath.replace(/\\/g, '/') : null;
};

const createCategory = catchAsync(async (req, res) => {
  const categoryBody = {
    ...req.body,
  };

  if (req.files) {
    if (req.files.icon) {
      categoryBody.iconUrl = getFilePath(req.files.icon[0]);
    }
    if (req.files.coverImage) {
      categoryBody.coverImageUrl = getFilePath(req.files.coverImage[0]);
    }
  }

  const category = await categoryService.createCategory(categoryBody);
  
  // Logic: Notun category create hole, User-er "Category List" refresh kora dorkar.
  // Tai Redis memory theke purono category list-er shob cache delete kore ditesi.
  await clearCache('cache:/api/v1/app/categories*');

  res.status(httpStatus.CREATED).send({
    code: httpStatus.CREATED,
    message: 'Category created successfully',
    data: category,
  });
});

const getCategories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await categoryService.queryCategories(filter, options);
  res.send({
    code: httpStatus.OK,
    message: 'Categories fetched successfully',
    data: result,
  });
});

const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId);
  res.send({
    code: httpStatus.OK,
    message: 'Category fetched successfully',
    data: category,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const updateBody = { ...req.body };
  
  if (req.files) {
    if (req.files.icon) {
      updateBody.iconUrl = getFilePath(req.files.icon[0]);
    }
    if (req.files.coverImage) {
      updateBody.coverImageUrl = getFilePath(req.files.coverImage[0]);
    }
  }

  const category = await categoryService.updateCategoryById(req.params.categoryId, updateBody);
  
  // Logic: Category update hole user jeno purono cover ba icon na dekhe,
  // tai cache clear kore ditesi.
  await clearCache('cache:/api/v1/app/categories*');

  res.send({
    code: httpStatus.OK,
    message: 'Category updated successfully',
    data: category,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategoryById(req.params.categoryId);
  
  // Logic: Category delete hoye gele list update hote hobe, tai cache clear.
  await clearCache('cache:/api/v1/app/categories*');

  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
