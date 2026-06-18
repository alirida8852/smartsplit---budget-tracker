export interface Budget {
  income: number;
  savingsGoal: number;
}

export interface PersonalExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  groupExpenseId?: string;
  groupId?: string;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: "equal" | "unequal";
  splits: { [member: string]: number };
  date: string;
  syncedPersonalExpenseId?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  expenses: GroupExpense[];
}

export interface BudgetStatus {
  budget: Budget;
  expenses: PersonalExpense[];
  totalExpenses: number;
  remaining: number;
  savingsProgress: number;
  categoryBreakdown: { [category: string]: number };
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface GroupBalanceSheet {
  groupId: string;
  groupName: string;
  members: string[];
  expenses: GroupExpense[];
  balances: { [member: string]: number };
  settlements: Settlement[];
}

export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}
