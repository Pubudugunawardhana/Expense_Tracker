import { useEffect, useState } from 'react';
import EXPENSE_CATEGORIES, {
  DEFAULT_CATEGORY,
} from '../data/expenseCategories';

const createExpenseId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

function ExpenseForm({ editingExpense, onCancelEdit, onSaveExpense, showHeading = true }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setError('');
      return;
    }

    setTitle('');
    setAmount('');
    setCategory(DEFAULT_CATEGORY);
    setError('');
  }, [editingExpense]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const numericAmount = Number(amount);

    if (!trimmedTitle) {
      setError('Please enter an expense title.');
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Please enter an amount greater than 0.');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    onSaveExpense({
      id: editingExpense?.id ?? createExpenseId(),
      title: trimmedTitle,
      amount: numericAmount,
      category,
    });

    setTitle('');
    setAmount('');
    setCategory(DEFAULT_CATEGORY);
    setError('');
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      {showHeading ? (
        <div className="form-heading">
          <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
          <p>
            {editingExpense
              ? 'Update the title and amount, then save your changes.'
              : 'Add a title and amount to keep track of your spending.'}
          </p>
        </div>
      ) : null}

      <div className="form-grid">
        <label className="form-field" htmlFor="expense-title">
          <span>Title</span>
          <input
            id="expense-title"
            type="text"
            placeholder="Groceries"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="form-field" htmlFor="expense-amount">
          <span>Amount</span>
          <input
            id="expense-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="45.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>

        <label className="form-field" htmlFor="expense-category">
          <span>Category</span>
          <select
            id="expense-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {EXPENSE_CATEGORIES.map((categoryOption) => (
              <option key={categoryOption} value={categoryOption}>
                {categoryOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button className="primary-button" type="submit">
          {editingExpense ? 'Update Expense' : 'Add Expense'}
        </button>

        {editingExpense ? (
          <button
            className="secondary-button"
            type="button"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default ExpenseForm;
