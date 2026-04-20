const { z } = require('zod');

const register = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    // fullName: z.string().min(1),
    // role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
    role: z.preprocess((val) => (typeof val === 'string' ? val.toUpperCase() : val), 
    z.enum(['USER', 'ADMIN', 'SUPERADMIN']).default('USER')),
  }),
};

const login = {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
};

const googleLogin = {
  body: z.object({
    idToken: z.string(),
  }),
};

const appleLogin = {
  body: z.object({
    identityToken: z.string(),
    user: z.object({
      name: z.object({
        firstName: z.string(),
        lastName: z.string(),
      }).optional(),
    }).optional(),
  }),
};

const logout = {
  body: z.object({
    refreshToken: z.string(),
  }),
};

const refreshTokens = {
  body: z.object({
    refreshToken: z.string(),
  }),
};

const forgotPassword = {
  body: z.object({
    email: z.string().email(),
  }),
};

const resetPassword = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
};

const verifyEmail = {
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
  }),
};

const changePassword = {
  body: z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(8),
  }),
};

const deleteMe = {
  body: z.object({
    password: z.string(),
  }),
};

module.exports = {
  register,
  login,
  googleLogin,
  appleLogin,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  deleteMe,
};
