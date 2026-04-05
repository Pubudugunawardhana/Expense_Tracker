import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

test('renders the expense tracker heading and total', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /expense tracker/i })).toBeInTheDocument();
  expect(screen.getByText(/total expenses/i)).toBeInTheDocument();
});

test('edits an existing expense instead of adding a new one', () => {
  render(<App />);

  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'Groceries' },
  });
  fireEvent.change(screen.getByLabelText(/amount/i), {
    target: { value: '45' },
  });
  fireEvent.change(screen.getByLabelText(/category/i), {
    target: { value: 'Food' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

  fireEvent.click(screen.getByRole('button', { name: /edit/i }));

  expect(screen.getByRole('button', { name: /update expense/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/title/i)).toHaveValue('Groceries');
  expect(screen.getByLabelText(/amount/i)).toHaveValue(45);
  expect(screen.getByLabelText(/category/i)).toHaveValue('Food');

  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'Rent' },
  });
  fireEvent.change(screen.getByLabelText(/amount/i), {
    target: { value: '1200' },
  });
  fireEvent.change(screen.getByLabelText(/category/i), {
    target: { value: 'Bills' },
  });
  fireEvent.click(screen.getByRole('button', { name: /update expense/i }));

  expect(screen.getByText('Rent')).toBeInTheDocument();
  expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  expect(
    screen.getByText('Bills', { selector: '.category-badge' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('Bills', { selector: '.category-total-card p' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('$1200.00', { selector: '.summary-panel strong' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('$1200.00', { selector: '.category-total-card strong' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('$1200.00', { selector: '.expense-actions strong' })
  ).toBeInTheDocument();
  expect(screen.getByText('1 items')).toBeInTheDocument();
});

test('stores the selected category and shows totals by category', () => {
  render(<App />);

  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'Flight' },
  });
  fireEvent.change(screen.getByLabelText(/amount/i), {
    target: { value: '500' },
  });
  fireEvent.change(screen.getByLabelText(/category/i), {
    target: { value: 'Travel' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

  const savedExpenses = JSON.parse(
    localStorage.getItem('expense-tracker-expenses')
  );

  expect(savedExpenses[0].category).toBe('Travel');
  expect(screen.getByText(/totals by category/i)).toBeInTheDocument();
  expect(
    screen.getByText('Travel', { selector: '.category-badge' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('Travel', { selector: '.category-total-card p' })
  ).toBeInTheDocument();
});
