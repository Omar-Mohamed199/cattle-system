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
    required: false,
  },
  sheepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sheep',
    required: false,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer'],
    default: 'cash'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
