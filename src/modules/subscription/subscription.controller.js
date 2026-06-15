const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const subscriptionService = require('./subscription.service');
const response = require('../../config/response');

const createCheckoutSession = catchAsync(async (req, res) => {
  const { planId, paymentMethod } = req.body; // paymentMethod: 'stripe' or 'paypal'
  const checkoutUrl = await subscriptionService.createCheckoutSession(req.user, planId, paymentMethod);
  res.status(httpStatus.OK).json(
    response({
      message: 'Checkout session created',
      status: 'OK',
      code: httpStatus.OK,
      data: { checkoutUrl },
    })
  );
});

const getStatus = catchAsync(async (req, res) => {
  const status = await subscriptionService.getSubscriptionStatus(req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: 'Subscription status fetched',
      status: 'OK',
      code: httpStatus.OK,
      data: status,
    })
  );
});

const getPlans = catchAsync(async (req, res) => {
  const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN');
  const result = await subscriptionService.getPlans(isAdmin);
  res.status(httpStatus.OK).json(
    response({
      message: 'Plans fetched successfully',
      status: 'OK',
      code: httpStatus.OK,
      data: result,
    })
  );
});

const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  await subscriptionService.handleWebhook(req.body, signature);
  res.status(httpStatus.OK).send('Webhook handled successfully');
});

// --- Admin Controllers ---

const createPlan = catchAsync(async (req, res) => {
  const plan = await subscriptionService.createPlan(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: 'Subscription plan created',
      status: 'OK',
      code: httpStatus.CREATED,
      data: plan,
    })
  );
});

const updatePlan = catchAsync(async (req, res) => {
  const plan = await subscriptionService.updatePlan(req.params.planId, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: 'Subscription plan updated',
      status: 'OK',
      code: httpStatus.OK,
      data: plan,
    })
  );
});

const deletePlan = catchAsync(async (req, res) => {
  await subscriptionService.deletePlan(req.params.planId);
  res.status(httpStatus.OK).json(
    response({
      message: 'Subscription plan deleted',
      status: 'OK',
      code: httpStatus.OK,
    })
  );
});

module.exports = {
  createCheckoutSession,
  getStatus,
  getPlans,
  handleWebhook,
  createPlan,
  updatePlan,
  deletePlan,
};
