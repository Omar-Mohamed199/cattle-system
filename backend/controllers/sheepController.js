const asyncHandler = require('express-async-handler');
const Sheep = require('../models/Sheep');
const Payment = require('../models/Payment');

// @desc    Get all sheep
// @route   GET /api/sheep
// @access  Public
const getSheep = asyncHandler(async (req, res) => {
  const sheep = await Sheep.find().populate('partners.customerId').sort({ createdAt: -1 });
  res.json(sheep);
});

// @desc    Create a sheep
// @route   POST /api/sheep
// @access  Public
const createSheep = asyncHandler(async (req, res) => {
  const newSheep = new Sheep(req.body);
  const saved = await newSheep.save();
  
  if (req.io) req.io.emit('data_updated');
  res.json(saved);
});

// @desc    Update a sheep
// @route   PUT /api/sheep/:id
// @access  Public
const updateSheep = asyncHandler(async (req, res) => {
  const updated = await Sheep.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) {
    res.status(404);
    throw new Error('الخروف غير موجود');
  }
  
  if (req.io) req.io.emit('data_updated');
  res.json(updated);
});

// @desc    Delete a sheep
// @route   DELETE /api/sheep/:id
// @access  Public
const deleteSheep = asyncHandler(async (req, res) => {
  const deleted = await Sheep.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error('الخروف غير موجود');
  }
  
  // Cleanup related payments
  await Payment.deleteMany({ sheepId: req.params.id });
  
  if (req.io) req.io.emit('data_updated');
  res.json({ message: 'Deleted successfully' });
});

module.exports = {
  getSheep,
  createSheep,
  updateSheep,
  deleteSheep,
};
