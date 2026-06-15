const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const favouriteValidation = require('./favourite.validation');
const favouriteController = require('./favourite.controller');

const { cache } = require('../../middlewares/cache');

const router = express.Router();

router
  .route('/')
  .get(auth(), cache(10), validate(favouriteValidation.getFavourites), favouriteController.getFavourites);

router
  .route('/:trackId')
  .post(auth(), validate(favouriteValidation.toggleFavourite), favouriteController.toggleFavourite);

module.exports = router;
