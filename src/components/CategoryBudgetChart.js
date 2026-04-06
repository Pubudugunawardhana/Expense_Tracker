import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  }).format(Number(value) || 0);

function CategoryBudgetChart({ categoryBudgetSummary }) {
  const chartData = categoryBudgetSummary.map((item) => ({
    category: item.category,
    budget: item.budget,
    spending: item.spending,
  }));

  return (
    <article className="category-budget-chart-card">
      <div className="chart-card-header">
        <div>
          <h3>Budget vs Spending by Category</h3>
          <p>See how each category budget compares with actual spending.</p>
        </div>
      </div>

      <div className="category-budget-chart-frame">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="category" minTickGap={18} stroke="var(--chart-text)" />
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
            <Legend />
            <Bar
              dataKey="budget"
              fill="var(--chart-bar)"
              name="Category budget"
              radius={[10, 10, 0, 0]}
            />
            <Bar
              dataKey="spending"
              fill="var(--chart-area)"
              name="Actual spending"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default CategoryBudgetChart;
