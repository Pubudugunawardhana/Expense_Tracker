const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const BUDGET_ENDPOINT = `${API_BASE_URL}/api/budget`;

const parseApiResponse = async (response) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'The budget API request failed.');
  }

  return data;
};

export const fetchBudget = async () => {
  const response = await fetch(BUDGET_ENDPOINT);
  return parseApiResponse(response);
};

export const updateBudget = async (budgetData) => {
  const response = await fetch(BUDGET_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(budgetData),
  });

  return parseApiResponse(response);
};
