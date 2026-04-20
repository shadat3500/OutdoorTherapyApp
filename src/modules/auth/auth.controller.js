const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const authService = require('./auth.service');
const userService = require('../user/user.service');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const response = require('../../config/response');
const ApiError = require('../../utils/ApiError');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const config = require('../../config/config');

const client = new OAuth2Client(config.googleClientId);

const register = catchAsync(async (req, res) => {
  const { email, fullName, firstName, lastName, password, ...rest } = req.body;
  const isUser = await userService.getUserByEmail(email);

  const name = fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '');

  if (isUser) {
    if (isUser.isDeleted || !isUser.isEmailVerified) {
      // Update existing half-registered or deleted user
      await prisma.user.update({
        where: { id: isUser.id },
        data: {
          fullName: name,
          firstName,
          lastName,
          email,
          isDeleted: false,
          role: 'USER', // FORCE ROLE TO USER
          userType: 'FREE', // Ensure new/recovered users are FREE
          ...rest
        },
      });
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
  } else {
    // Create new user
    await userService.createUser({
      fullName: name,
      firstName,
      lastName,
      email,
      password,
      role: 'USER', // FORCE ROLE TO USER
      userType: 'FREE'
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.user.update({
    where: { email },
    data: { oneTimeCode: otp },
  });

  emailService.sendVerificationEmail(email, otp).catch((e) => console.error('Email error:', e));

  res.status(httpStatus.CREATED).json(
    response({
      message: 'Thank you for registering. Please verify your email',
      status: 'OK',
      code: httpStatus.CREATED,
      data: {},
    })
  );
});

const googleLogin = catchAsync(async (req, res) => {
  const { idToken } = req.body;
  const ticket = await client.verifyIdToken({
    idToken,
    audience: [config.googleClientId].filter(Boolean),
  });
  const { email, name, picture, sub: googleId } = ticket.getPayload();

  let user = await userService.getUserByEmail(email);

  if (user) {
    if (user.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This Account is Deleted');
    }
    if (user.isBanned) {
      throw new ApiError(httpStatus.FORBIDDEN, 'This Account is Banned');
    }
    // Update existing user with googleId and mark as verified
    if (!user.googleId || !user.isEmailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          googleId,
          isEmailVerified: true, 
          oneTimeCode: null      
        },
      });
    }
  } else {
    // Create new user from Google data
    user = await userService.createUser({
      email,
      fullName: name,
      googleId,
      profileImage: picture,
      isEmailVerified: true, // Google already verified this email
      password: Math.random().toString(36).slice(-16), // Dummy password
      role: 'USER',
      userType: 'FREE',
    });
  }

  const tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.OK).json(
    response({
      message: 'Google Login Successful',
      status: 'OK',
      code: httpStatus.OK,
      data: { user, tokens },
    })
  );
});

const appleLogin = catchAsync(async (req, res) => {
  const { identityToken, user: appleUser } = req.body;
  
  try {
    const { sub: appleId, email } = await appleSignin.verifyIdToken(identityToken, {
      audience: config.appleClientId,
    });

    let user = await userService.getUserByEmail(email);

    if (user) {
      if (user.isDeleted) throw new ApiError(httpStatus.BAD_REQUEST, 'This Account is Deleted');
      if (user.isBanned) throw new ApiError(httpStatus.FORBIDDEN, 'This Account is Banned');
      if (!user.appleId) {
        await prisma.user.update({ where: { id: user.id }, data: { appleId } });
      }
    } else {
      const name = appleUser && appleUser.name ? `${appleUser.name.firstName} ${appleUser.name.lastName}` : 'Apple User';
      
      user = await userService.createUser({
        email,
        fullName: name,
        appleId,
        isEmailVerified: true,
        password: Math.random().toString(36).slice(-16),
        role: 'USER',
        userType: 'FREE',
      });
    }

    const tokens = await tokenService.generateAuthTokens(user);

    res.status(httpStatus.OK).json(
      response({
        message: 'Apple Login Successful',
        status: 'OK',
        code: httpStatus.OK,
        data: { user, tokens },
      })
    );
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Apple authentication failed');
  }
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const isUser = await userService.getUserByEmail(email);

  if (!isUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  if (isUser.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This Account is Deleted');
  }
  if (isUser.isBanned) {
    throw new ApiError(httpStatus.FORBIDDEN, 'This Account is Banned');
  }
  if (!isUser.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email not verified');
  }

  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.OK).json(
    response({
      message: 'Login Successful',
      status: 'OK',
      code: httpStatus.OK,
      data: { user, tokens },
    })
  );
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const user = await authService.verifyEmail(email, code);
  const tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.OK).json(
    response({
      message: 'Email Verified',
      status: 'OK',
      code: httpStatus.OK,
      data: { user, tokens },
    })
  );
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.user.update({
    where: { id: req.user.id },
    data: { oneTimeCode: otp },
  });
  await emailService.sendVerificationEmail(req.user.email, otp);
  res.status(httpStatus.NO_CONTENT).send();
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }

  const oneTimeCode = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.user.update({
    where: { id: user.id },
    data: { oneTimeCode, isResetPassword: true },
  });

  await emailService.sendResetPasswordEmail(email, oneTimeCode);
  res.status(httpStatus.OK).json(
    response({
      message: 'Email Sent',
      status: 'OK',
      code: httpStatus.OK,
      data: {},
    })
  );
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.password, req.body.email);
  res.status(httpStatus.OK).json(
    response({
      message: 'Password Reset Successful',
      status: 'OK',
      code: httpStatus.OK,
      data: {},
    })
  );
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.OK).json(
    response({
      message: 'LogOut Successful',
      status: 'OK',
      code: httpStatus.OK,
    })
  );
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).json(
    response({
      message: 'Tokens Refreshed',
      status: 'OK',
      code: httpStatus.OK,
      data: { tokens },
    })
  );
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
  res.status(httpStatus.OK).json(
    response({
      message: 'Password Change Successful',
      status: 'OK',
      code: httpStatus.OK,
      data: {},
    })
  );
});

const deleteMe = catchAsync(async (req, res) => {
  const user = await authService.deleteMe(req.user.id, req.body.password);
  res.status(httpStatus.OK).json(
    response({
      message: 'Account Deleted',
      status: 'OK',
      code: httpStatus.OK,
      data: { user },
    })
  );
});

module.exports = {
  register,
  login,
  googleLogin,
  appleLogin,
  logout,
  refreshTokens,
  verifyEmail,
  sendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteMe,
};
