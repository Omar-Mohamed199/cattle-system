const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const Cow = require('../models/Cow');
const Payment = require('../models/Payment');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find().sort({ createdAt: -1 });
  res.json(customers);
});

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Public
const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('اسم العميل مطلوب');
  }
  if (!phone) {
    res.status(400);
    throw new Error('رقم الهاتف مطلوب');
  }
  
  const newCustomer = new Customer(req.body);
  const saved = await newCustomer.save();
  
  if (req.io) req.io.emit('data_updated');
  res.json(saved);
});

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = asyncHandler(async (req, res) => {
  const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) {
    res.status(404);
    throw new Error('العميل غير موجود');
  }
  
  if (req.io) req.io.emit('data_updated');
  res.json(updated);
});

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = asyncHandler(async (req, res) => {
  await Customer.findByIdAndDelete(req.params.id);
  
  // Cleanup related data
  await Cow.updateMany(
    {},
    { $pull: { partners: { customerId: req.params.id } } }
  );
  await Payment.deleteMany({ customerId: req.params.id });
  
  if (req.io) req.io.emit('data_updated');
  res.json({ message: 'Deleted successfully' });
});

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
