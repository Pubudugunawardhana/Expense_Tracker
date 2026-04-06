import ExpenseCharts from '../components/ExpenseCharts';

function SummaryPage({ categorySummary, expenses, totalExpenseAmount }) {
  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>Summary</h2>
        <p>
          See your total spending, category breakdown, and chart trends across
          daily, monthly, and yearly views.
        </p>
      </div>

      <div className="summary-panel">
        <span>Total Expenses</span>
        <strong>${totalExpenseAmount.toFixed(2)}</strong>
      </div>

      {categorySummary.length > 0 ? (
        <>
          <section className="category-summary">
            <div className="list-header">
              <h2>Category Breakdown</h2>
              <span>{categorySummary.length} categories</span>
            </div>

            <div className="category-total-grid">
              {categorySummary.map(([category, total]) => (
                <article className="category-total-card" key={category}>
                  <p>{category}</p>
                  <strong>${total.toFixed(2)}</strong>
                </article>
              ))}
            </div>
          </section>

          <ExpenseCharts expenses={expenses} />
        </>
      ) : (
        <div className="empty-state">
          <h2>No summary yet</h2>
          <p>Add some expenses to see totals, category breakdowns, and charts.</p>
        </div>
      )}
    </section>
  );
}

export default SummaryPage;
