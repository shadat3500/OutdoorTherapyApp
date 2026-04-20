const express = require('express');
const validate = require('../../middlewares/validate');
const appSettingsValidation = require('./appSettings.validation');
const appSettingsController = require('./appSettings.controller');
const auth = require('../../middlewares/auth');

const adminRouter = express.Router();
const userRouter = express.Router();

// Admin: Update settings
adminRouter.patch('/', auth('admin'), validate(appSettingsValidation.updateSettings), appSettingsController.updateSettings);
adminRouter.get('/', auth('admin'), appSettingsController.getSettings);

// User: Get settings
userRouter.get('/', appSettingsController.getSettings);

module.exports = { adminRouter, userRouter };
