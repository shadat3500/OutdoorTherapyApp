const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { categoryService } = require('./index');

const createCategory = catchAsync(async (req, res) => {
  const categoryBody = {
    ...req.body,
  };

  // Handle file uploads (icon and cover image)
  if (req.files) {
    if (req.files.icon) {
      const iconFile = req.files.icon[0];
      categoryBody.iconUrl = iconFile.key || iconFile.path || iconFile.location;
    }
    if (req.files.coverImage) {
      const coverFile = req.files.coverImage[0];
      categoryBody.coverImageUrl = coverFile.key || coverFile.path || coverFile.location;
    }
  }

  const category = await categoryService.createCategory(categoryBody);
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
  
  // Handle file uploads (icon and cover image)
  if (req.files) {
    if (req.files.icon) {
      const iconFile = req.files.icon[0];
      updateBody.iconUrl = iconFile.key || iconFile.path || iconFile.location;
    }
    if (req.files.coverImage) {
      const coverFile = req.files.coverImage[0];
      updateBody.coverImageUrl = coverFile.key || coverFile.path || coverFile.location;
    }
  }

  const category = await categoryService.updateCategoryById(req.params.categoryId, updateBody);
  res.send({
    code: httpStatus.OK,
    message: 'Category updated successfully',
    data: category,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategoryById(req.params.categoryId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
