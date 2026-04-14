const asyncHandler = require('express-async-handler');
const dashboardService = require('../services/dashboardService');

// @desc    Get dashboard metrics
// @route   GET /api/dashboard
// @access  Public
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const metrics = await dashboardService.getMetrics();
  res.json(metrics);
});

module.exports = {
  getDashboardMetrics,
};
