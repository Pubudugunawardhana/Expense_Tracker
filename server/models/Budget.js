const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, 'Monthly budget cannot be negative.'],
    },
    categoryBudgets: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Budget', budgetSchema);
