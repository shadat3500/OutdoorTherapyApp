const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const categoryValidation = require('./category.validation');
const categoryController = require('./category.controller');
const upload = require('../../middlewares/fileUpload');

const adminRouter = express.Router();
const userRouter = express.Router();

const categoryUpload = upload('uploads/categories', ['image/jpeg', 'image/png', 'image/webp']);

// --- Admin Routes (/api/v1/admin/categories) ---
adminRouter
  .route('/')
  .post(
    auth('commonAdmin'),
    categoryUpload.fields([
      { name: 'icon', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
    validate(categoryValidation.createCategory),
    categoryController.createCategory
  )
  .get(auth('commonAdmin'), validate(categoryValidation.getCategories), categoryController.getCategories);

adminRouter
  .route('/:categoryId')
  .get(auth('commonAdmin'), validate(categoryValidation.getCategory), categoryController.getCategory)
  .patch(
    auth('commonAdmin'),
    categoryUpload.fields([
      { name: 'icon', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
    validate(categoryValidation.updateCategory),
    categoryController.updateCategory
  )
  .delete(auth('commonAdmin'), validate(categoryValidation.deleteCategory), categoryController.deleteCategory);

// --- User Routes (/api/v1/app/categories) ---
userRouter
  .route('/')
  .get(validate(categoryValidation.getCategories), categoryController.getCategories);

userRouter
  .route('/:categoryId')
  .get(validate(categoryValidation.getCategory), categoryController.getCategory);

module.exports = {
  adminRouter,
  userRouter,
};
