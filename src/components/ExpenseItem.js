import { formatExpenseDate } from '../utils/expenseAnalytics';

function ExpenseItem({
  expense,
  isDeleting,
  isEditing,
  onDeleteExpense,
  onEditExpense,
}) {
  return (
    <li className={`expense-item${isEditing ? ' expense-item-editing' : ''}`}>
      <div className="expense-content">
        <h3>{expense.title}</h3>
        <div className="expense-details">
          <span className="category-badge">{expense.category}</span>
          <p className="expense-meta">
            {isEditing
              ? `Currently editing | ${formatExpenseDate(expense.date)}`
              : formatExpenseDate(expense.date)}
          </p>
        </div>
      </div>

      <div className="expense-actions">
        <strong>${expense.amount.toFixed(2)}</strong>
        <div className="expense-button-group">
          <button
            className="edit-button"
            disabled={isDeleting}
            type="button"
            onClick={() => onEditExpense(expense.id)}
          >
            Edit
          </button>
          <button
            className="delete-button"
            disabled={isDeleting}
            type="button"
            onClick={() => onDeleteExpense(expense.id)}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </li>
  );
}

export default ExpenseItem;
