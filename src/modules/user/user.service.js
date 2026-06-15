const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const bcrypt = require('bcryptjs');
const { getSignedFileUrl } = require('../../services/r2.service');

const mapUserImageUrl = async (user) => {
  if (!user) return user;
  return {
    ...user,
    profileImage: await getSignedFileUrl(user.profileImage),
  };
};

const createUser = async (userBody) => {
  if (await prisma.user.findUnique({ where: { email: userBody.email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const hashedPassword = await bcrypt.hash(userBody.password, 8);
  const user = await prisma.user.create({
    data: {
      ...userBody,
      password: hashedPassword,
      isEmailVerified: userBody.isEmailVerified !== undefined ? userBody.isEmailVerified : false,
    },
  });
  return mapUserImageUrl(user);
};

// const queryUsers = async (filter, options) => {
//   const { search, userType } = filter;
  
//   // Logic: Always exclude deleted users
//   const where = { isDeleted: false };

//   // Filter by userType (FREE, BASIC, PREMIUM) - Case Insensitive handled here
//   if (userType) {
//     where.userType = userType.toUpperCase();
//   }

//   // Global search across multiple fields
//   if (search) {
//     where.OR = [
//       { firstName: { contains: search, mode: 'insensitive' } },
//       { lastName: { contains: search, mode: 'insensitive' } },
//       { email: { contains: search, mode: 'insensitive' } },
//       { fullName: { contains: search, mode: 'insensitive' } },
//     ];
//   }

//   // Paginate utility expects { where } as the second argument
//   const users = await paginate(prisma.user, { where }, options);
  
//   // Map signed URLs for profile images
//   users.results = await Promise.all(users.results.map(mapUserImageUrl));
  
//   return users;
// };


const queryUsers = async (filter = {}, options) => {
  const { search, userType } = filter;

  const where = { isDeleted: false };

  if (userType) {
    where.userType = userType.toUpperCase();
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email:     { contains: search, mode: 'insensitive' } },
      { fullName:  { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await paginate(prisma.user, { where }, options);

  // Fix: remove the extra wrapping array []
  users.results = await Promise.all(users.results.map(mapUserImageUrl));

  return users;
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return mapUserImageUrl(user);
};

const getUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return mapUserImageUrl(user);
};

const updateUserById = async (userId, updateBody) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await prisma.user.findUnique({ where: { email: updateBody.email, NOT: { id: userId } } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 8);
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
  });
  return mapUserImageUrl(updatedUser);
};

const deleteUserById = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return prisma.user.delete({
    where: { id: userId },
  });
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};
