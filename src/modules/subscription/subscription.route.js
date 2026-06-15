const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const subscriptionValidation = require('./subscription.validation');
const subscriptionController = require('./subscription.controller');

const adminRouter = express.Router();
const userRouter = express.Router();

// --- Admin Routes (/api/v1/admin/subscriptions) ---
adminRouter.get('/plans', auth('commonAdmin'), subscriptionController.getPlans);
adminRouter.post('/plans', auth('commonAdmin'), validate(subscriptionValidation.createPlan), subscriptionController.createPlan);
adminRouter.patch('/plans/:planId', auth('commonAdmin'), validate(subscriptionValidation.updatePlan), subscriptionController.updatePlan);
adminRouter.delete('/plans/:planId', auth('commonAdmin'), validate(subscriptionValidation.deletePlan), subscriptionController.deletePlan);

// --- User Routes (/api/v1/app/subscriptions) ---
userRouter.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);
userRouter.get('/plans', subscriptionController.getPlans);
userRouter.post('/create-checkout', auth(), validate(subscriptionValidation.createCheckoutSession), subscriptionController.createCheckoutSession);
userRouter.get('/status', auth(), subscriptionController.getStatus);


module.exports = {
  adminRouter,
  userRouter,
};
