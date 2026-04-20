const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const downloadValidation = require('./download.validation');
const downloadController = require('./download.controller');

const router = express.Router();

router
  .route('/')
  .get(auth(), downloadController.getMyDownloads);

router
  .route('/:trackId')
  .post(auth(), validate(downloadValidation.startDownload), downloadController.startDownload);

router
  .route('/:downloadId')
  .patch(auth(), validate(downloadValidation.updateStatus), downloadController.updateStatus)
  .delete(auth(), validate(downloadValidation.deleteDownload), downloadController.deleteDownload);

module.exports = router;
