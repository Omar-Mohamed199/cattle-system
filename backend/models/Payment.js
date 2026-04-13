const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  cowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cow',
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer'],
    default: 'cash'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
