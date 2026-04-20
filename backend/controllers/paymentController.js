const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Public
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('customerId')
    .populate('cowId')
    .populate('sheepId')
    .sort({ date: -1, createdAt: -1 });
  res.json(payments);
});

// @desc    Create a payment
// @route   POST /api/payments
// @access  Public
const createPayment = asyncHandler(async (req, res) => {
  const newPayment = new Payment(req.body);
  const saved = await newPayment.save();
  
  if (req.io) req.io.emit('data_updated');
  res.json(saved);
});

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Public
const deletePayment = asyncHandler(async (req, res) => {
  const deleted = await Payment.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error('العملية غير موجودة');
  }
  
  if (req.io) req.io.emit('data_updated');
  res.json({ message: 'Deleted successfully' });
});

module.exports = {
  getPayments,
  createPayment,
  deletePayment,
};
