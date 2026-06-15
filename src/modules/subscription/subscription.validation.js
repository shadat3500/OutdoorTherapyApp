const { z } = require('zod');

const createCheckoutSession = {
  body: z.object({
    planId: z.string().uuid(),
  }),
};

const createPlan = {
  body: z.object({
    name: z.string(),
    type: z.preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(['BASIC', 'PREMIUM']).default('BASIC')
    ),
    description: z.array(z.string()).optional(),
    price: z.number().positive(),
    currency: z.string().default('USD'),
    interval: z.enum(['month', 'year']),
    downloadLimit: z.preprocess(
      (val) => (val === null || val === undefined ? 0 : parseInt(val, 10)),
      z.number().int().min(0).default(0).optional()
    ),
    stripePriceId: z.string(),
    paypalPlanId: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
};

const updatePlan = {
  params: z.object({
    planId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().optional(),
    type: z.preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(['BASIC', 'PREMIUM']).optional()
    ),
    description: z.array(z.string()).optional(),
    price: z.number().positive().optional(),
    currency: z.string().optional(),
    interval: z.enum(['month', 'year']).optional(),
    downloadLimit: z.preprocess(
      (val) => (val === null || val === undefined ? undefined : parseInt(val, 10)),
      z.number().int().min(0).optional()
    ),
    stripePriceId: z.string().optional(),
    paypalPlanId: z.string().optional(),
    isActive: z.boolean().optional(),
  }).partial(),
};

const deletePlan = {
  params: z.object({
    planId: z.string().uuid(),
  }),
};

module.exports = {
  createCheckoutSession,
  createPlan,
  updatePlan,
  deletePlan,
};
