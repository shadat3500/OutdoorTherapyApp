const express = require('express');
const authRoute = require('../../modules/auth/auth.route');
const userRoute = require('../../modules/user/user.route');
const dashboardRoute = require('../../modules/dashboard/dashboard.route');
const appSettingsRoute = require('../../modules/appSettings/appSettings.route');
const categoryRoute = require('../../modules/category/category.route');
const trackRoute = require('../../modules/track/track.route');
const favouriteRoute = require('../../modules/favourite/favourite.route');
const downloadRoute = require('../../modules/download/download.route');
const playHistoryRoute = require('../../modules/playHistory/playHistory.route');
const subscriptionRoute = require('../../modules/subscription/subscription.route');
const notificationRoute = require('../../modules/notification/notification.route');
const cmsRoute = require('../../modules/cms/cms.route');
const docsRoute = require('./docs.routes');
const config = require('../../config/config');

const router = express.Router();

// Common routes (Auth, Profile, Docs)
const commonRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/docs',
    route: docsRoute,
  },
];

// Admin specific routes
const adminRoutes = [
  {
    path: '/admin/dashboard',
    route: dashboardRoute,
  },
  {
    path: '/admin/users',
    route: userRoute.adminRouter,
  },
  {
    path: '/admin/categories',
    route: categoryRoute.adminRouter,
  },
  {
    path: '/admin/tracks',
    route: trackRoute.adminRouter,
  },
  {
    path: '/admin/settings',
    route: appSettingsRoute.adminRouter,
  },
  {
    path: '/admin/subscriptions',
    route: subscriptionRoute.adminRouter,
  },
  {
    path: '/admin/notifications',
    route: notificationRoute.adminRouter,
  },
  {
    path: '/admin/cms',
    route: cmsRoute.adminRouter,
  },
];

// App/User specific routes
const appRoutes = [
  {
    path: '/app/profile',
    route: userRoute.userRouter,
  },
  {
    path: '/app/categories',
    route: categoryRoute.userRouter,
  },
  {
    path: '/app/tracks',
    route: trackRoute.userRouter,
  },
  {
    path: '/app/favourites',
    route: favouriteRoute,
  },
  {
    path: '/app/play-history',
    route: playHistoryRoute,
  },
  {
    path: '/app/downloads',
    route: downloadRoute,
  },
  {
    path: '/app/subscriptions',
    route: subscriptionRoute.userRouter,
  },
  {
    path: '/app/notifications',
    route: notificationRoute.userRouter,
  },
  {
    path: '/app/cms',
    route: cmsRoute.userRouter,
  },
  {
    path: '/app/settings',
    route: appSettingsRoute.userRouter,
  },
];

// Register common routes
commonRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// Register admin routes
adminRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// Register app/user routes
appRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
