const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const notificationService = require('./notification.service');
const response = require('../../config/response');
const prisma = require('../../config/prisma');

const createCampaign = catchAsync(async (req, res) => {
  const campaign = await notificationService.createCampaign(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: 'Notification campaign created successfully',
      status: 'OK',
      code: httpStatus.CREATED,
      data: campaign,
    })
  );
});

const getCampaigns = catchAsync(async (req, res) => {
  const campaigns = await notificationService.queryCampaigns();
  res.status(httpStatus.OK).json(
    response({
      message: 'Campaigns fetched successfully',
      status: 'OK',
      code: httpStatus.OK,
      data: campaigns,
    })
  );
});

const getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.status(httpStatus.OK).json(
    response({
      message: 'Notifications fetched successfully',
      status: 'OK',
      code: httpStatus.OK,
      data: notifications,
    })
  );
});

const markAsRead = catchAsync(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.status(httpStatus.OK).json(
    response({
      message: 'All notifications marked as read',
      status: 'OK',
      code: httpStatus.OK,
    })
  );
});

module.exports = {
  createCampaign,
  getCampaigns,
  getMyNotifications,
  markAsRead,
};
