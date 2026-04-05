function ExpenseItem({ expense, isEditing, onDeleteExpense, onEditExpense }) {
  return (
    <li className={`expense-item${isEditing ? ' expense-item-editing' : ''}`}>
      <div className="expense-content">
        <h3>{expense.title}</h3>
        <div className="expense-details">
          <span className="category-badge">{expense.category}</span>
          <p className="expense-meta">
            {isEditing ? 'Currently editing' : 'Added expense'}
          </p>
        </div>
      </div>

      <div className="expense-actions">
        <strong>${expense.amount.toFixed(2)}</strong>
        <div className="expense-button-group">
          <button
            className="edit-button"
            type="button"
            onClick={() => onEditExpense(expense.id)}
          >
            Edit
          </button>
          <button
            className="delete-button"
            type="button"
            onClick={() => onDeleteExpense(expense.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

export default ExpenseItem;
