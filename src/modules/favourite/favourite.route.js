const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const favouriteValidation = require('./favourite.validation');
const favouriteController = require('./favourite.controller');

const router = express.Router();

router
  .route('/')
  .get(auth(), validate(favouriteValidation.getFavourites), favouriteController.getFavourites);

router
  .route('/:trackId')
  .post(auth(), validate(favouriteValidation.toggleFavourite), favouriteController.toggleFavourite);

module.exports = router;
