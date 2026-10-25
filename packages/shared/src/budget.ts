import { NEAR_LIMIT_RATIO } from './constants';

export type BudgetStatus = 'none' | 'safe' | 'warning' | 'over';

export const getBudgetStatus = (spent: number, budget: number): BudgetStatus => {
  if (budget <= 0) return 'none';
  if (spent > budget) return 'over';
  if (spent / budget >= NEAR_LIMIT_RATIO) return 'warning';
  return 'safe';
};

export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  none: 'No budget set',
  safe: 'On track',
  warning: 'Near limit',
  over: 'Over budget',
};

export interface BudgetProgress {
  budget: number;
  spent: number;
  remaining: number;
  /** 0–100+, 0 when no budget is set. */
  percent: number;
  status: BudgetStatus;
}

export const getBudgetProgress = (spent: number, budget: number): BudgetProgress => ({
  budget,
  spent,
  remaining: budget - spent,
  percent: budget > 0 ? (spent / budget) * 100 : 0,
  status: getBudgetStatus(spent, budget),
});
