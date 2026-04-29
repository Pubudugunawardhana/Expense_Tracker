const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required.'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required.'],
      min: [0.01, 'Expense amount must be greater than 0.'],
    },
    category: {
      type: String,
      required: [true, 'Expense category is required.'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required.'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', expenseSchema);