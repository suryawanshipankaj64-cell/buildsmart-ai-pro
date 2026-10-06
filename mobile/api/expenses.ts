import { apiClient } from './client';
import { Expense, ExpenseCategory } from '../types';

export async function fetchExpenses(projectId?: string): Promise<Expense[]> {
  const endpoint = projectId ? `/expenses?projectId=${encodeURIComponent(projectId)}` : '/expenses';
  return apiClient<Expense[]>(endpoint);
}

export interface CreateExpensePayload {
  projectId: string;
  category: ExpenseCategory | string;
  itemName: string;
  amount: number;
  date: string;
  receiptUrl?: string;
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  return apiClient<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      amount: Number(payload.amount),
    }),
  });
}

