const express = require('express');
const auth = require('../../middlewares/auth');
const dashboardController = require('./dashboard.controller');

const router = express.Router();

router.get('/', auth('commonAdmin'), dashboardController.getDashboardStats);

module.exports = router;
