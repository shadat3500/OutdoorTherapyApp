const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const downloadService = require('./download.service');
const response = require('../../config/response');
const { clearCache } = require('../../middlewares/cache');

const startDownload = catchAsync(async (req, res) => {
  const result = await downloadService.startDownload(req.user.id, req.params.trackId);
  res.status(httpStatus.CREATED).json(
    response({
      message: 'Download started',
      status: 'OK',
      code: httpStatus.CREATED,
      data: result,
    })
  );
});

const updateStatus = catchAsync(async (req, res) => {
  const result = await downloadService.updateDownloadStatus(req.params.downloadId, req.user.id, req.body);

  // Logic: Download complete hole user-er track list update kora dorkar (isDownloaded status)
  if (req.body.status === 'COMPLETED') {
    await clearCache(`*cache:/api/v1/app/tracks*user:${req.user.id}*`);
    await clearCache(`*cache:/api/v1/app/downloads*user:${req.user.id}*`);
  }

  res.status(httpStatus.OK).json(
    response({
      message: 'Download status updated',
      status: 'OK',
      code: httpStatus.OK,
      data: result,
    })
  );
});

const getMyDownloads = catchAsync(async (req, res) => {
  const result = await downloadService.getMyDownloads(req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: 'My downloads fetched',
      status: 'OK',
      code: httpStatus.OK,
      data: result,
    })
  );
});

const deleteDownload = catchAsync(async (req, res) => {
  await downloadService.deleteDownload(req.params.downloadId, req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: 'Download record deleted',
      status: 'OK',
      code: httpStatus.OK,
    })
  );
});

module.exports = {
  startDownload,
  updateStatus,
  getMyDownloads,
  deleteDownload,
};
