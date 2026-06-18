import React from "react";
import { 
  PiggyBank, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ShoppingBag, 
  Utensils, 
  Car, 
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { BudgetStatus, PersonalExpense, Group } from "../types";
import ExportPanel from "./ExportPanel";

interface DashboardProps {
  status: BudgetStatus;
  groups: Group[];
  onNavigate: (page: string) => void;
  onDeleteExpense: (id: string) => void;
  currency: string;
  themeMode?: "light" | "dark";
}

export default function Dashboard({ status, groups, onNavigate, onDeleteExpense, currency, themeMode = "dark" }: DashboardProps) {
  const { budget, expenses, totalExpenses, remaining, savingsProgress, categoryBreakdown } = status;

  // Sync state stats
  const syncedExpenses = expenses.filter(e => e.groupExpenseId);
  const totalSyncedAmount = syncedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "food":
        return <Utensils className="w-4 h-4 text-orange-500" />;
      case "transport":
      case "travel":
        return <Car className="w-4 h-4 text-blue-500" />;
      case "shopping":
        return <ShoppingBag className="w-4 h-4 text-pink-500" />;
      case "shared":
        return <Layers className="w-4 h-4 text-indigo-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-zinc-500" />;
    }
  };

  // Get budget status warning or encouragement message
  const getSavingsAdvice = () => {
    const netSavings = budget.income - totalExpenses;
    if (netSavings >= budget.savingsGoal) {
      return {
        message: "Amazing! You have beat your savings goal. Solid job keeping your pocket safe!",
        type: "success",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      };
    } else if (netSavings > 0) {
      const remainingToGoal = budget.savingsGoal - netSavings;
      return {
        message: `On track! Save ${currency}${remainingToGoal.toFixed(0)} more to hit your ${currency}${budget.savingsGoal} goal. Keep pushing!`,
        type: "info",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
      };
    } else {
      return {
        message: "Warning: You are running a deficit! Expenses have eaten into your savings goal. Time to check group splittings!",
        type: "warning",
        color: "text-red-500 bg-red-500/10 border-red-500/20"
      };
    }
  };

  const advice = getSavingsAdvice();

  // Find top categories for a simple custom bar chart
  const hasCategories = Object.keys(categoryBreakdown).length > 0;
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

  const cardBgClass = themeMode === "light" 
    ? "bg-white border-slate-200/90 shadow-sm" 
    : "bg-slate-900/60 border-slate-800/80 shadow-xl backdrop-blur-sm";

  const headerTextClass = themeMode === "light" ? "text-slate-900" : "text-white";
  const mutedTextClass = themeMode === "light" ? "text-slate-500" : "text-slate-400";

  const userName = React.useMemo(() => localStorage.getItem("user_name") || "Rajeev", []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic welcome header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-3xl font-bold tracking-tight font-display mb-1 ${headerTextClass}`}>
            Welcome back, {userName} 👋
          </h2>
          <p className={`${mutedTextClass} text-sm`}>
            Automatic tracking of your roommates' expenses and personal finances merged in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate("budget")}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors flex items-center gap-2 cursor-pointer ${
              themeMode === "light"
                ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                : "border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-300"
            }`}
          >
            Adjust Budget
          </button>
          <button
            onClick={() => onNavigate("split")}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            Manage Hostels / Groups <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Metric Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Income Card */}
        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-shadow ${cardBgClass}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Monthly Income</p>
              <h3 className={`text-2.5xl font-bold font-display mt-1 font-mono ${headerTextClass}`}>
                {currency}{budget.income.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/25 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-sans">
            <span className="font-semibold text-emerald-500">Active Pocket</span>
            <span>Allocated for monthly cycles</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-shadow ${cardBgClass}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outgoing Spent</p>
              <h3 className={`text-2.5xl font-bold font-display mt-1 font-mono ${headerTextClass}`}>
                {currency}{totalExpenses.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-red-500/10 dark:bg-red-500/25 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 font-sans">
            <span className="font-semibold text-red-500 font-mono">
              {((totalExpenses / (budget.income || 1)) * 100).toFixed(0)}%
            </span>
            <span>of your income spent</span>
          </div>
        </div>

        {/* Smart Remaining Balance Card */}
        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-shadow ${cardBgClass}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining Balance</p>
              <h3 className={`text-2.5xl font-bold font-display mt-1 font-mono ${remaining < 0 ? "text-rose-500" : headerTextClass}`}>
                {remaining < 0 ? "-" : ""}{currency}{Math.abs(remaining).toLocaleString()}
              </h3>
            </div>
            <div className={`p-2 rounded-xl ${remaining < 0 ? "bg-red-500/10" : "bg-indigo-500/10 dark:bg-indigo-500/25"}`}>
              {remaining < 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
          </div>
          <div className="text-xs text-slate-500 font-sans">
            {remaining < 0 ? (
              <span className="font-semibold text-rose-500">Overdrawn by {currency}{Math.abs(remaining).toLocaleString()}</span>
            ) : (
              <span>Safe to spend: {currency}{Math.max(0, remaining - budget.savingsGoal).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Savings Goal Progress Card */}
        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-shadow ${cardBgClass}`}>
          {budget.savingsGoal > 0 ? (
            <>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Savings Target</p>
                  <h3 className={`text-2.5xl font-bold font-display mt-1 font-mono ${headerTextClass}`}>
                    {savingsProgress.toFixed(0)}%
                  </h3>
                </div>
                <div className="p-2 bg-amber-500/10 dark:bg-amber-500/25 rounded-xl">
                  <PiggyBank className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>

              {/* Progress bar */}
              <div className={`w-full h-2 rounded-full overflow-hidden mb-2 ${themeMode === "light" ? "bg-slate-100" : "bg-slate-800"}`}>
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, savingsProgress)}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 flex justify-between font-mono">
                <span>Goal: {currency}{budget.savingsGoal.toLocaleString()}</span>
                <span>Saved: {currency}{Math.max(0, budget.income - totalExpenses).toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-between h-full min-h-[100px]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Savings Target</p>
                  <p className={`text-xs mt-2.5 font-medium ${mutedTextClass}`}>
                    No goal configured yet during onboarding.
                  </p>
                </div>
                <div className="p-2 bg-slate-500/10 rounded-xl">
                  <PiggyBank className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              <button
                onClick={() => onNavigate("budget")}
                className="mt-4 text-left text-xs text-indigo-505 text-indigo-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                Set a Savings Goal →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Smart Budget Advice Banner */}
      <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${advice.color}`}>
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-semibold">{advice.message}</p>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Charts & Sync logic visualization */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Category breakdown visualizer */}
          <div className={`border rounded-3xl p-6 ${cardBgClass}`}>
            <h3 className={`text-lg font-bold tracking-tight font-display mb-4 ${headerTextClass}`}>Category Expenditures</h3>
            
            {hasCategories ? (
              <div className="space-y-5">
                {sortedCategories.map(([category, amt]) => {
                  const percentage = ((amt / totalExpenses) * 100);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={`flex items-center gap-2 font-semibold ${headerTextClass}`}>
                          {getCategoryIcon(category)}
                          {category}
                        </span>
                        <span className={`${mutedTextClass} font-mono font-medium`}>
                          {currency}{amt.toLocaleString()} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden ${themeMode === "light" ? "bg-slate-100" : "bg-slate-800"}`}>
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`h-44 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-2xl ${
                themeMode === "light" ? "border-slate-200" : "border-slate-800"
              }`}>
                <p className="text-sm text-slate-400 mb-1">No transaction records entered yet</p>
                <button 
                  onClick={() => onNavigate("budget")}
                  className="text-xs text-indigo-500 hover:underline font-semibold"
                >
                  Create personal expense +
                </button>
              </div>
            )}
          </div>

          {/* Sync Engine Details */}
          <div className={`border rounded-3xl p-6 relative overflow-hidden transition-all duration-300 ${
            themeMode === "light"
              ? "bg-indigo-50/40 border-slate-200/90 shadow-sm"
              : "bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-slate-950/80 border-slate-800 shadow-xl"
          }`}>
            <div className="absolute top-0 right-0 p-8 transform translate-x-8 -translate-y-8 opacity-10">
              <Layers className="w-32 h-32 text-indigo-500" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-indigo-500 tracking-widest uppercase">Smart Sync Enabled</span>
              </div>
              <h3 className={`text-xl font-bold tracking-tight font-display ${headerTextClass}`}>Smart Split Bill Integration</h3>
              <p className={`text-sm leading-relaxed max-w-xl ${mutedTextClass}`}>
                Any shared cost logged in Living Groups paid by you (or your split share) automatically streams straight into your monthly pocket expenses list in real-time. Eliminates manual double-logging.
              </p>

              <div className={`grid grid-cols-2 gap-4 border-t pt-4 mt-2 ${
                themeMode === "light" ? "border-slate-200" : "border-slate-800"
              }`}>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Synchronized cost</p>
                  <p className={`text-2.5xl font-bold font-display font-mono mt-1 ${headerTextClass}`}>
                    {currency}{totalSyncedAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Synced records count</p>
                  <p className={`text-2.5xl font-bold font-display font-mono mt-1 ${headerTextClass}`}>
                    {syncedExpenses.length} Items
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Quick Recent Expenses */}
        <div className="lg:col-span-5 space-y-8">
          <div className={`border rounded-3xl p-6 flex flex-col ${cardBgClass}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-bold tracking-tight font-display ${headerTextClass}`}>Recent Personal Output</h3>
              <button 
                onClick={() => onNavigate("budget")}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                View all
              </button>
            </div>

            {expenses.length > 0 ? (
              <div className="space-y-3.5 overflow-y-auto max-h-[400px]">
                {expenses.slice(-6).reverse().map((expense) => (
                  <div 
                    key={expense.id} 
                    className={`flex justify-between items-center p-3 rounded-xl border transition-all duration-300 group ${
                      themeMode === "light"
                        ? "bg-white hover:bg-slate-50/60 border-slate-100"
                        : "bg-slate-900/20 hover:bg-slate-800/40 border-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg group-hover:scale-105 transition-transform ${
                        themeMode === "light" ? "bg-slate-100" : "bg-slate-800/60"
                      }`}>
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-sm font-semibold truncate flex items-center gap-1.5 leading-snug ${
                          themeMode === "light" ? "text-slate-850" : "text-slate-200"
                        }`}>
                          {expense.title}
                          {expense.groupExpenseId && (
                            <span className="shrink-0 text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Synced
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="font-medium">{expense.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {expense.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`font-bold text-sm font-mono ${
                        themeMode === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        -{currency}{expense.amount}
                      </span>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer"
                        title="Delete record"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-2xl ${
                themeMode === "light" ? "border-slate-100" : "border-slate-800"
              }`}>
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-400">Your journal has no recorded spends</p>
                <button
                  onClick={() => onNavigate("budget")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg mt-3 transition-colors cursor-pointer ${
                    themeMode === "light"
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  Log Expense +
                </button>
              </div>
            )}
          </div>

          <ExportPanel status={status} groups={groups} themeMode={themeMode as "light" | "dark"} />
        </div>

      </div>
    </div>
  );
}

// Small helper clear icon
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
