const Cow = require('../models/Cow');
const Sheep = require('../models/Sheep');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

/**
 * Calculates dashboard metrics
 */
const getMetrics = async () => {
  // Total Animals
  const totalCows = await Cow.countDocuments();
  const totalSheep = await Sheep.countDocuments();
  
  // Total Revenue (Expected total from all partners of all cows and sheep)
  const allCows = await Cow.find();
  const allSheep = await Sheep.find();
  
  let totalExpectedRevenue = 0;
  
  allCows.forEach(cow => {
    cow.partners.forEach(p => {
      let customerWeight = ((p.share || 0) / 100) * (cow.weight || 0);
      let customerTotal = (customerWeight * (p.price || 0)) + (p.slaughterCostShare || 0);
      totalExpectedRevenue += customerTotal;
    });
  });

  allSheep.forEach(sheep => {
    sheep.partners.forEach(p => {
      let customerWeight = ((p.share || 0) / 100) * (sheep.weight || 0);
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

  return {
    totalCows,
    totalSheep,
    totalExpectedRevenue,
    totalExpenses,
    totalPaymentsReceived,
    totalOutstanding,
  };
};

module.exports = {
  getMetrics,
};
