import { BudgetStatus, Group, GroupBalanceSheet } from "../types";

/**
 * Downloads a text string as a CSV file in the browser.
 */
function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports personal expenses to a clean, standard CSV file.
 * Columns: Date, Title, Amount, Category
 */
export function exportPersonalExpensesCSV(expenses: BudgetStatus["expenses"]) {
  const headers = ["Date", "Title", "Amount", "Category"];
  
  const rows = expenses.map(exp => [
    exp.date,
    exp.title,
    exp.amount,
    exp.category
  ]);

  const csvRows = [
    headers.join(","),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
  ];

  const csvContent = csvRows.join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `personal_expenses_${dateStr}.csv`);
}

/**
 * Exports group expenses to a clean, standard CSV file.
 * Columns: Date, Description, Amount, Paid By, Split Type
 */
export function exportGroupExpensesCSV(group: Group) {
  const headers = ["Date", "Description", "Amount", "Paid By", "Split Type"];

  const rows = group.expenses.map(exp => [
    exp.date,
    exp.description,
    exp.amount,
    exp.paidBy,
    exp.splitType === "equal" ? "Equal" : "Unequal"
  ]);

  const csvRows = [
    headers.join(","),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
  ];

  const csvContent = csvRows.join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  const groupNameSlug = group.name.toLowerCase().replace(/\s+/g, "_");
  downloadCSV(csvContent, `${groupNameSlug}_expenses_${dateStr}.csv`);
}

/**
 * Exports group settlement ledger balances.
 * Columns: Person, Owes, Is Owed, Net Balance
 */
export function exportSettlementLedgerCSV(groupName: string, balanceSheet: GroupBalanceSheet) {
  const headers = ["Person", "Owes", "Is Owed", "Net Balance"];

  const rows = balanceSheet.members.map(member => {
    const bal = balanceSheet.balances[member] || 0;
    const owes = bal < 0 ? Math.abs(bal) : 0;
    const isOwed = bal > 0 ? bal : 0;

    return [
      member,
      owes.toFixed(2),
      isOwed.toFixed(2),
      bal.toFixed(2)
    ];
  });

  const csvRows = [
    headers.join(","),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
  ];

  const csvContent = csvRows.join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  const groupNameSlug = groupName.toLowerCase().replace(/\s+/g, "_");
  downloadCSV(csvContent, `${groupNameSlug}_settlement_ledger_${dateStr}.csv`);
}
