const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const favouriteService = require('./favourite.service');
const pick = require('../../utils/pick');
const response = require('../../config/response');

const toggleFavourite = catchAsync(async (req, res) => {
  const result = await favouriteService.toggleFavourite(req.user.id, req.params.trackId);
  res.status(httpStatus.OK).json(
    response({
      message: result.message,
      status: 'OK',
      code: httpStatus.OK,
      data: { isFavourite: result.isFavourite },
    })
  );
});

const getFavourites = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit', 'page']);
  const result = await favouriteService.getFavourites(req.user.id, options);
  res.status(httpStatus.OK).json(
    response({
      message: 'Favourites fetched successfully',
      status: 'OK',
      code: httpStatus.OK,
      data: { tracks: result.data, pagination: result.pagination },
    })
  );
});

module.exports = {
  toggleFavourite,
  getFavourites,
};
