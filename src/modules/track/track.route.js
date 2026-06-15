const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const trackValidation = require('./track.validation');
const trackController = require('./track.controller');
const upload = require('../../middlewares/fileUpload');
const { cache } = require('../../middlewares/cache');

const adminRouter = express.Router();
const userRouter = express.Router();

const trackUpload = upload('uploads/tracks', [
  'image/jpeg', 'image/png', 'image/webp',
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'
]);

// --- Admin Routes (/api/v1/admin/tracks) ---
adminRouter
  .route('/')
  .post(
    auth('commonAdmin'), 
    trackUpload.fields([
      { name: 'audio', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ]), 
    validate(trackValidation.createTrack), 
    trackController.createTrack
  )
  .get(auth('commonAdmin'), validate(trackValidation.getTracks), trackController.getTracks);

adminRouter
  .route('/:trackId')
  .get(auth('commonAdmin'), trackController.incrementPlayCount, validate(trackValidation.getTrack), trackController.getTrack)
  .patch(
    auth('commonAdmin'), 
    trackUpload.fields([
      { name: 'audio', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ]), 
    validate(trackValidation.updateTrack), 
    trackController.updateTrack
  )
  .delete(auth('commonAdmin'), validate(trackValidation.deleteTrack), trackController.deleteTrack);

// --- User Routes (/api/v1/app/tracks) ---
userRouter
  .route('/popular')
  .get(auth(), cache(10, false), trackController.getPopularTracks);

userRouter
  .route('/')
  .get(auth(), cache(10), validate(trackValidation.getTracks), trackController.getTracks);

userRouter
  .route('/:trackId')
  .get(auth(), trackController.incrementPlayCount, cache(10), validate(trackValidation.getTrack), trackController.getTrack);


module.exports = {
  adminRouter,
  userRouter,
};
