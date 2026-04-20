const { z } = require('zod');

const createUser = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.preprocess((val) => (typeof val === 'string' ? val.toUpperCase() : val), 
    z.enum(['USER', 'ADMIN', 'SUPERADMIN']).default('USER')),  
  }),
};

const getUsers = {
  query: z.object({
    email: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
    isBanned: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
    sortBy: z.string().optional(),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().optional()),
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().optional()),
  }),
};

const getUser = {
  params: z.object({
    userId: z.string().uuid(),
  }),
};

const updateUser = {
  params: z.object({
    userId: z.string().uuid(),
  }),
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    sleepTimer: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().optional()),
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
    isEmailVerified: z.boolean().optional(),
    isBanned: z.boolean().optional(),
  }).partial(),
};

const deleteUser = {
  params: z.object({
    userId: z.string().uuid(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
