import { create } from 'zustand';
import type { Transaction, TransactionInput } from '@spendly/shared';

interface TransactionSheetState {
  open: boolean;
  editing: Transaction | null;
  /** Prefilled values, e.g. from AI quick add or a receipt scan. */
  draft: Partial<TransactionInput> | null;
  openNew: (draft?: Partial<TransactionInput>) => void;
  openEdit: (transaction: Transaction) => void;
  close: () => void;
}

/** One add/edit sheet for the whole app, so any page (or ⌘K) can open it. */
export const useTransactionSheet = create<TransactionSheetState>((set) => ({
  open: false,
  editing: null,
  draft: null,
  openNew: (draft) => set({ open: true, editing: null, draft: draft ?? null }),
  openEdit: (transaction) => set({ open: true, editing: transaction, draft: null }),
  close: () => set({ open: false }),
}));

interface CommandState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCommandMenu = create<CommandState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
