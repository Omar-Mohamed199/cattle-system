const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Cow = require('../models/Cow');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

// Helper to emit updates
const emitUpdate = (req) => {
  if (req.io) {
    req.io.emit('data_updated');
  }
};


// ================= CUSTOMERS =================

router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم العميل مطلوب' });
    if (!phone) return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
    
    const newCustomer = new Customer(req.body);
    const saved = await newCustomer.save();
    emitUpdate(req);
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    emitUpdate(req);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    await Cow.updateMany(
      {},
      { $pull: { partners: { customerId: req.params.id } } }
    );
    await Payment.deleteMany({ customerId: req.params.id });
    emitUpdate(req);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= COWS =================

router.get('/cows', async (req, res) => {
  try {
    const cows = await Cow.find().populate('partners.customerId').sort({ createdAt: -1 });
    res.json(cows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cows', async (req, res) => {
  try {
    const newCow = new Cow(req.body);
    const saved = await newCow.save();
    emitUpdate(req);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cows/:id', async (req, res) => {
  try {
    const updated = await Cow.findByIdAndUpdate(req.params.id, req.body, { new: true });
    emitUpdate(req);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cows/:id', async (req, res) => {
  try {
    await Cow.findByIdAndDelete(req.params.id);
    // Optionally delete related payments? 
    // Usually payments are linked to cow, maybe we should keep them or delete.
    await Payment.deleteMany({ cowId: req.params.id });
    emitUpdate(req);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= PAYMENTS =================

router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('customerId')
      .populate('cowId')
      .sort({ date: -1, createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments', async (req, res) => {
  try {
    const newPayment = new Payment(req.body);
    const saved = await newPayment.save();
    emitUpdate(req);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/payments/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    emitUpdate(req);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= EXPENSES =================

router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    const saved = await newExpense.save();
    emitUpdate(req);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    emitUpdate(req);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DASHBOARD METRICS =================
router.get('/dashboard', async (req, res) => {
  try {
    // Total Cows
    const totalCows = await Cow.countDocuments();
    
    // Total Revenue (Expected total from all partners of all cows)
    const allCows = await Cow.find();
    let totalExpectedRevenue = 0;
    allCows.forEach(cow => {
      cow.partners.forEach(p => {
        let customerWeight = ((p.share || 0) / 100) * (cow.weight || 0);
        let customerTotal = (customerWeight * (p.price || 0)) + (p.slaughterCostShare || 0);
        totalExpectedRevenue += customerTotal;
      });
    });

    // Total Expenses
    const expensesAggr = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expensesAggr.length > 0 ? expensesAggr[0].total : 0;

    // Total Payments Received
    const paymentsAggr = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalPaymentsReceived = paymentsAggr.length > 0 ? paymentsAggr[0].total : 0;

    // Outstanding Payments
    const totalOutstanding = totalExpectedRevenue - totalPaymentsReceived;

    res.json({
      totalCows,
      totalExpectedRevenue,
      totalExpenses,
      totalPaymentsReceived,
      totalOutstanding,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
