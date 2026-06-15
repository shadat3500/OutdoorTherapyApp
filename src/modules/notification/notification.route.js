const express = require('express');
const auth = require('../../middlewares/auth');
const notificationController = require('./notification.controller');

const adminRouter = express.Router();
const userRouter = express.Router();

// --- Admin Routes (/api/v1/admin/notifications) ---
adminRouter.post('/campaign', auth('commonAdmin'), notificationController.createCampaign);
adminRouter.get('/campaign', auth('commonAdmin'), notificationController.getCampaigns);

// --- User Routes (/api/v1/app/notifications) ---
userRouter.get('/', auth('common'), notificationController.getMyNotifications);
userRouter.patch('/read-all', auth('common'), notificationController.markAsRead);

module.exports = {
  adminRouter,
  userRouter,
};