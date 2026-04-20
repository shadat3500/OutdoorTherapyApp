const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const userService = require('./user.service');
const pick = require('../../utils/pick');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullName', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const updateBody = req.body;
  if (updateBody.isEmailVerified === true) {
    updateBody.oneTimeCode = null;
  }
  const user = await userService.updateUserById(req.params.userId, updateBody);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getProfile = catchAsync(async (req, res) => {
  res.send(req.user);
});

const updateProfile = catchAsync(async (req, res) => {
  const updateBody = { ...req.body };
  if (req.file) {
    updateBody.profileImage = `/uploads/users/${req.file.filename}`;
  }
  const user = await userService.updateUserById(req.user.id, updateBody);
  res.send(user);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
};
