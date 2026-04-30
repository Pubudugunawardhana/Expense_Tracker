const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const EXPENSES_ENDPOINT = `${API_BASE_URL}/api/expenses`;

// Get JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('expense-tracker-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseApiResponse = async (response) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'The expense API request failed.');
  }

  return data;
};

export const fetchExpenses = async () => {
  const response = await fetch(EXPENSES_ENDPOINT, {
    headers: getAuthHeaders(),
  });
  return parseApiResponse(response);
};

export const createExpense = async (expense) => {
  const response = await fetch(EXPENSES_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(expense),
  });

  return parseApiResponse(response);
};

export const updateExpense = async (expenseId, expense) => {
  const response = await fetch(`${EXPENSES_ENDPOINT}/${expenseId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(expense),
  });

  return parseApiResponse(response);
};

export const deleteExpense = async (expenseId) => {
  const response = await fetch(`${EXPENSES_ENDPOINT}/${expenseId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  return parseApiResponse(response);
};
