const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const dashboardService = require('./dashboard.service');
const response = require('../../config/response');

const getDashboardStats = catchAsync(async (req, res) => {
  const stats = await dashboardService.getStats();
  res.status(httpStatus.OK).json(
    response({
      message: 'Dashboard stats fetched successfully',
      status: 'OK',
      code: httpStatus.OK,
      data: stats,
    })
  );
});

module.exports = {
  getDashboardStats,
};
