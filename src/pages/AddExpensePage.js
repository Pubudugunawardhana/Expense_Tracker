import ExpenseForm from '../components/ExpenseForm';

function AddExpensePage({ editingExpense, onCancelEdit, onSaveExpense }) {
  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
        <p>
          {editingExpense
            ? 'Adjust the details below and save to update the existing record.'
            : 'Log a new expense with a title, amount, and category.'}
        </p>
      </div>

      <ExpenseForm
        editingExpense={editingExpense}
        onCancelEdit={onCancelEdit}
        onSaveExpense={onSaveExpense}
        showHeading={false}
      />
    </section>
  );
}

export default AddExpensePage;
