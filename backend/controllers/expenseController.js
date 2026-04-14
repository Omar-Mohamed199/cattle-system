const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
  res.json(expenses);
});

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Public
const createExpense = asyncHandler(async (req, res) => {
  const newExpense = new Expense(req.body);
  const saved = await newExpense.save();
  
  if (req.io) req.io.emit('data_updated');
  res.json(saved);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Public
const deleteExpense = asyncHandler(async (req, res) => {
  const deleted = await Expense.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error('المصروف غير موجود');
  }
  
  if (req.io) req.io.emit('data_updated');
  res.json({ message: 'Deleted successfully' });
});

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};
