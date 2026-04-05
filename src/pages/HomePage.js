import ExpenseList from '../components/ExpenseList';

function HomePage({ editingExpenseId, expenses, onDeleteExpense, onEditExpense }) {
  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>Home</h2>
        <p>Review your latest spending and edit any expense when plans change.</p>
      </div>

      <ExpenseList
        editingExpenseId={editingExpenseId}
        expenses={expenses}
        onDeleteExpense={onDeleteExpense}
        onEditExpense={onEditExpense}
      />
    </section>
  );
}

export default HomePage;
