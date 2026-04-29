import axios from 'axios';
import type { Account, Transaction, Category, Budget, Goal, NetWorthSnapshot, DashboardData } from '../types';

const api = axios.create({ baseURL: '/api' });

// ── Dashboard ──────────────────────────────────────────────────────────────
export const getDashboard = () =>
  api.get<DashboardData>('/dashboard').then(r => r.data);

// ── Accounts ───────────────────────────────────────────────────────────────
export const getAccounts = () =>
  api.get<Account[]>('/accounts').then(r => r.data);

export const createAccount = (data: Partial<Account>) =>
  api.post<Account>('/accounts', data).then(r => r.data);

export const updateAccount = (id: number, data: Partial<Account>) =>
  api.put<Account>(`/accounts/${id}`, data).then(r => r.data);

export const deleteAccount = (id: number) =>
  api.delete(`/accounts/${id}`);

// ── Transactions ───────────────────────────────────────────────────────────
export const getTransactions = (params?: {
  search?: string;
  category_id?: number;
  account_id?: number;
  month?: number;
  year?: number;
}) => api.get<Transaction[]>('/transactions', { params }).then(r => r.data);

export const createTransaction = (data: Partial<Transaction>) =>
  api.post<Transaction>('/transactions', data).then(r => r.data);

export const updateTransaction = (id: number, data: Partial<Transaction>) =>
  api.put<Transaction>(`/transactions/${id}`, data).then(r => r.data);

export const deleteTransaction = (id: number) =>
  api.delete(`/transactions/${id}`);

// ── Categories ─────────────────────────────────────────────────────────────
export const getCategories = () =>
  api.get<Category[]>('/categories').then(r => r.data);

// ── Budgets ────────────────────────────────────────────────────────────────
export const getBudgets = (month: number, year: number) =>
  api.get<Budget[]>('/budgets', { params: { month, year } }).then(r => r.data);

export const upsertBudget = (data: { category_id: number; month: number; year: number; amount: number }) =>
  api.post<Budget>('/budgets', data).then(r => r.data);

// ── Goals ──────────────────────────────────────────────────────────────────
export const getGoals = () =>
  api.get<Goal[]>('/goals').then(r => r.data);

export const createGoal = (data: Partial<Goal>) =>
  api.post<Goal>('/goals', data).then(r => r.data);

export const updateGoal = (id: number, data: Partial<Goal>) =>
  api.put<Goal>(`/goals/${id}`, data).then(r => r.data);

export const deleteGoal = (id: number) =>
  api.delete(`/goals/${id}`);

// ── Net Worth ──────────────────────────────────────────────────────────────
export const getNetWorth = () =>
  api.get<NetWorthSnapshot[]>('/networth').then(r => r.data);
