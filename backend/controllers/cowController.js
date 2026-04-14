const asyncHandler = require('express-async-handler');
const Cow = require('../models/Cow');
const Payment = require('../models/Payment');

// @desc    Get all cows
// @route   GET /api/cows
// @access  Public
const getCows = asyncHandler(async (req, res) => {
  const cows = await Cow.find().populate('partners.customerId').sort({ createdAt: -1 });
  res.json(cows);
});

// @desc    Create a cow
// @route   POST /api/cows
// @access  Public
const createCow = asyncHandler(async (req, res) => {
  const newCow = new Cow(req.body);
  const saved = await newCow.save();
  
  if (req.io) req.io.emit('data_updated');
  res.json(saved);
});

// @desc    Update a cow
// @route   PUT /api/cows/:id
// @access  Public
const updateCow = asyncHandler(async (req, res) => {
  const updated = await Cow.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) {
    res.status(404);
    throw new Error('العجل غير موجود');
  }
  
  if (req.io) req.io.emit('data_updated');
  res.json(updated);
});

// @desc    Delete a cow
// @route   DELETE /api/cows/:id
// @access  Public
const deleteCow = asyncHandler(async (req, res) => {
  const deleted = await Cow.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error('العجل غير موجود');
  }
  
  // Cleanup related payments
  await Payment.deleteMany({ cowId: req.params.id });
  
  if (req.io) req.io.emit('data_updated');
  res.json({ message: 'Deleted successfully' });
});

module.exports = {
  getCows,
  createCow,
  updateCow,
  deleteCow,
};
