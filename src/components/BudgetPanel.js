const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

function BudgetPanel({ budget, onBudgetChange, totalExpenseAmount }) {
  const remainingBudget = budget - totalExpenseAmount;
  const spentPercentage =
    budget > 0 ? Math.min((totalExpenseAmount / budget) * 100, 100) : 0;

  const handleBudgetInputChange = (event) => {
    const nextValue = event.target.value;

    if (nextValue === '') {
      onBudgetChange(0);
      return;
    }

    const numericValue = Number(nextValue);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return;
    }

    onBudgetChange(numericValue);
  };

  return (
    <section className="budget-panel">
      <div className="budget-panel-header">
        <div>
          <h2>Budget</h2>
          <p>Set a target and compare it with what you have already spent.</p>
        </div>

        <label className="budget-input-group" htmlFor="budget-input">
          <span>Budget Amount</span>
          <input
            id="budget-input"
            min="0"
            placeholder="1500.00"
            step="0.01"
            type="number"
            value={budget === 0 ? '' : budget}
            onChange={handleBudgetInputChange}
          />
        </label>
      </div>

      <div className="budget-metric-grid">
        <article className="budget-metric-card">
          <span>Current Budget</span>
          <strong>{formatCurrency(budget)}</strong>
        </article>

        <article className="budget-metric-card">
          <span>Total Spending</span>
          <strong>{formatCurrency(totalExpenseAmount)}</strong>
        </article>

        <article className="budget-metric-card">
          <span>Remaining</span>
          <strong
            className={remainingBudget < 0 ? 'budget-negative' : 'budget-positive'}
          >
            {formatCurrency(remainingBudget)}
          </strong>
        </article>
      </div>

      <div className="budget-progress" aria-hidden="true">
        <div className="budget-progress-track">
          <span
            className={`budget-progress-fill${
              remainingBudget < 0 ? ' budget-progress-fill-over' : ''
            }`}
            style={{ width: `${spentPercentage}%` }}
          />
        </div>
        <p>
          {budget > 0
            ? `${spentPercentage.toFixed(0)}% of your budget has been used.`
            : 'Add a budget to see how your spending compares.'}
        </p>
      </div>
    </section>
  );
}

export default BudgetPanel;
