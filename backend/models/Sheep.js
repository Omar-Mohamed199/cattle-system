const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  share: {
    type: Number, // Percentage, e.g., 25
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  slaughterCostShare: {
    type: Number,
    default: 0,
  }
});

const sheepSchema = new mongoose.Schema({
  numberId: {
    type: Number,
    required: true,
    unique: true,
  },
  weight: {
    type: Number,
    default: 0,
  },
  totalSlaughterCost: {
    type: Number,
    default: 0,
  },
  sheepType: {
    type: String,
    enum: ['بلدي', 'برقي'],
    default: 'بلدي'
  },
  partners: [partnerSchema],
}, { timestamps: true });

module.exports = mongoose.model('Sheep', sheepSchema);
