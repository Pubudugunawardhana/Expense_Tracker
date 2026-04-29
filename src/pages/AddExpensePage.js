import ExpenseForm from '../components/ExpenseForm';

function AddExpensePage({
  editingExpense,
  expenseError,
  isSavingExpense,
  onCancelEdit,
  onSaveExpense,
}) {
  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
        <p>
          {editingExpense
            ? 'Adjust the details below and save to update the existing record.'
            : 'Log a new expense with a title, amount, category, and date.'}
        </p>
      </div>

      <ExpenseForm
        editingExpense={editingExpense}
        apiError={expenseError}
        isSaving={isSavingExpense}
        onCancelEdit={onCancelEdit}
        onSaveExpense={onSaveExpense}
        showHeading={false}
      />
    </section>
  );
}

export default AddExpensePage;
