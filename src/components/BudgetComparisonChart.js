import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

function BudgetComparisonChart({ budget, progressModifier, totalExpenseAmount }) {
  const chartData = [
    { label: 'Budget', amount: budget },
    { label: 'Actual Spending', amount: totalExpenseAmount },
  ];

  const actualBarColor =
    progressModifier === 'over'
      ? 'var(--budget-fill-over)'
      : progressModifier === 'warning'
        ? 'var(--budget-fill-warning)'
        : 'var(--budget-fill-safe)';

  return (
    <section className="budget-chart-card">
      <div className="budget-chart-header">
        <div>
          <h3>Budget vs Actual</h3>
          <p>Compare your target with your current spending at a glance.</p>
        </div>
      </div>

      <div className="budget-chart-frame">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="var(--chart-text)" />
            <YAxis
              stroke="var(--chart-text)"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--surface-border)',
                borderRadius: '16px',
                color: 'var(--text-primary)',
              }}
              formatter={(value) => formatCurrency(value)}
            />
            <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
              <Cell fill="var(--chart-bar)" />
              <Cell fill={actualBarColor} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default BudgetComparisonChart;
