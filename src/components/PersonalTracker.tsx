import React, { useState } from "react";
import { 
  PiggyBank, 
  Wallet, 
  Plus, 
  Trash2, 
  Calendar, 
  Search, 
  Filter, 
  Sparkles, 
  Layers, 
  Utensils, 
  Car, 
  ShoppingBag, 
  DollarSign
} from "lucide-react";
import { BudgetStatus } from "../types";

interface PersonalTrackerProps {
  status: BudgetStatus;
  onUpdateBudget: (income: number, savingsGoal: number) => Promise<void>;
  onAddExpense: (title: string, amount: number, category: string, date: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  currency: string;
  themeMode?: "light" | "dark";
}

export default function PersonalTracker({ 
  status, 
  onUpdateBudget, 
  onAddExpense, 
  onDeleteExpense, 
  currency,
  themeMode = "dark"
}: PersonalTrackerProps) {
  const { budget, expenses } = status;

  // State budgets
  const [incInput, setIncInput] = useState(budget.income.toString());
  const [saveInput, setSaveInput] = useState(budget.savingsGoal.toString());
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);

  // State new expense
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Filter/Search states
  const [searchText, setSearchText] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  const categoryOptions = ["Food", "Transport", "Shopping", "Entertainment", "Rent", "Utilities", "Shared", "Other"];

  // Handle budget updates
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedInc = parseFloat(incInput);
    const parsedSave = parseFloat(saveInput);
    if (isNaN(parsedInc) || parsedInc < 0 || isNaN(parsedSave) || parsedSave < 0) {
      alert("Please provide valid non-negative numbers.");
      return;
    }
    setIsUpdatingBudget(true);
    try {
      await onUpdateBudget(parsedInc, parsedSave);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  // Handle expense submit
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!title.trim()) {
      alert("Please enter a valid title description.");
      return;
    }
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert("Please enter a positive numeric amount.");
      return;
    }
    setIsAddingExpense(true);
    try {
      await onAddExpense(title.trim(), parsedAmt, category, date);
      // reset form
      setTitle("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingExpense(false);
    }
  };

  // Filter logic
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.title.toLowerCase().includes(searchText.toLowerCase()) || 
                          exp.category.toLowerCase().includes(searchText.toLowerCase());
    const matchesCat = selectedCat === "All" || exp.category.toLowerCase() === selectedCat.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // Category Icon selector
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "food":
        return <Utensils className="w-4 h-4 text-orange-500" />;
      case "transport":
        return <Car className="w-4 h-4 text-blue-500" />;
      case "shopping":
        return <ShoppingBag className="w-4 h-4 text-pink-500" />;
      case "shared":
        return <Layers className="w-4 h-4 text-indigo-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-zinc-500" />;
    }
  };

  const cardBgClass = themeMode === "light" 
    ? "bg-white border-slate-200 shadow-sm text-slate-800" 
    : "bg-slate-900/60 border-slate-800/80 shadow-xl backdrop-blur-sm text-slate-100";

  const inputClass = themeMode === "light"
    ? "w-full border-slate-200 bg-slate-50 text-slate-900 focus:ring-indigo-500 focus:bg-white placeholder-slate-400"
    : "w-full border border-slate-800 bg-slate-950/40 text-white focus:ring-indigo-500 focus:bg-slate-900 focus:border-slate-700 placeholder-slate-500";

  const labelClass = themeMode === "light"
    ? "block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5"
    : "block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5";

  const headerTextClass = themeMode === "light" ? "text-slate-900" : "text-white";
  const mutedTextClass = themeMode === "light" ? "text-slate-500" : "text-slate-400";

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Header info */}
      <div>
        <h2 className={`text-3xl font-bold tracking-tight font-display mb-1 ${headerTextClass}`}>Personal Pocket Budgeting</h2>
        <p className={`${mutedTextClass} text-sm`}>
          Plan your monthly cycle income, set savings targets, and log individual purchases or view synced expenses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Setup Budget plan + Log form */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Income Setup */}
          <div className={`border rounded-2xl p-6 ${cardBgClass}`}>
            <h3 className={`text-base font-bold tracking-tight font-display mb-4 flex items-center gap-2 ${headerTextClass}`}>
              <Wallet className="w-5 h-5 text-indigo-500" />
              Adjust Income Plan
            </h3>

            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>
                  Monthly Income ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-semibold">{currency}</span>
                  <input
                    type="number"
                    value={incInput}
                    onChange={(e) => setIncInput(e.target.value)}
                    className={`${inputClass} pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2`}
                    placeholder="Enter income amount"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Savings Goal target ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-semibold">{currency}</span>
                  <input
                    type="number"
                    value={saveInput}
                    onChange={(e) => setSaveInput(e.target.value)}
                    className={`${inputClass} pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2`}
                    placeholder="e.g. 15000"
                    min="0"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingBudget}
                className={`w-full py-2.5 font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer flex justify-center items-center gap-1.5 ${
                  themeMode === "light"
                    ? "bg-slate-905 hover:bg-slate-800 text-white bg-slate-900"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                {isUpdatingBudget ? "Saving Changes..." : "Apply Financial Plan"}
              </button>
            </form>
          </div>

          {/* Card 2: Log New Expense Form */}
          <div className={`border rounded-2xl p-6 ${cardBgClass}`}>
            <h3 className={`text-base font-bold tracking-tight font-display mb-4 flex items-center gap-2 ${headerTextClass}`}>
              <Plus className="w-5 h-5 text-indigo-500" />
              Record Personal Spend
            </h3>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>
                  Expense Description Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`${inputClass} px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2`}
                  placeholder="e.g. Evening Starbucks, Laundry"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Amount ({currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currency}</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`${inputClass} pl-7 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2`}
                      placeholder="Amount"
                      min="1"
                      step="any"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputClass} px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 font-semibold`}
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt} className={themeMode === "light" ? "text-slate-900" : "text-white bg-slate-900"}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Spends Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`${inputClass} pl-9 pr-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 font-mono`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAddingExpense}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-medium text-xs rounded-xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500"
              >
                <Plus className="w-4 h-4" />
                {isAddingExpense ? "Logging Record..." : "Log Expense"}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: Full Expense transaction archive */}
        <div className="lg:col-span-8">
          <div className={`border rounded-3xl p-6 ${cardBgClass}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className={`text-lg font-bold tracking-tight font-display ${headerTextClass}`}>Personal Expense Registry</h3>
                <p className={`${mutedTextClass} text-xs mt-0.5`}>Showing your personal outlays and synchronized billing metrics.</p>
              </div>

              {/* Category selector pill toggles */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer focus:outline-none ${
                    themeMode === "light" 
                      ? "border-slate-200 bg-slate-50 text-slate-800"
                      : "border-slate-850 bg-slate-950/40 text-slate-200 border-slate-800"
                  }`}
                >
                  <option value="All" className={themeMode === "light" ? "text-slate-900" : "text-white bg-slate-900"}>All Categories</option>
                  {categoryOptions.map(c => (
                    <option key={c} value={c} className={themeMode === "light" ? "text-slate-900" : "text-white bg-slate-900"}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative mb-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`${inputClass} pl-9 pr-4 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2`}
                placeholder="Search transactions by title or keyword..."
              />
            </div>

            {/* Expenses List */}
            {filteredExpenses.length > 0 ? (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredExpenses.slice().reverse().map((exp) => (
                  <div 
                    key={exp.id} 
                    className={`flex justify-between items-center p-3.5 rounded-xl border transition-all duration-300 group animate-fade-in ${
                      themeMode === "light"
                        ? "bg-white hover:bg-slate-50 border-slate-100"
                        : "bg-slate-900/20 hover:bg-slate-800/60 border-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl ${themeMode === "light" ? "bg-slate-100" : "bg-slate-800"}`}>
                        {getCategoryIcon(exp.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold truncate leading-snug ${themeMode === "light" ? "text-slate-800" : "text-slate-100"}`}>
                            {exp.title}
                          </h4>
                          {exp.groupExpenseId && (
                            <span 
                              title="This expense was generated automatically via group splits"
                              className="shrink-0 text-[9px] font-bold text-indigo-505 bg-indigo-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 text-indigo-500"
                            >
                              <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                              Synced
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1">
                          <span className={`${themeMode === "light" ? "text-slate-500 font-medium" : "text-slate-400 font-medium"}`}>{exp.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {exp.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-bold text-base font-mono ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
                        -{currency}{exp.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${
                          themeMode === "light"
                            ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            : "text-slate-500 hover:text-rose-500 hover:bg-rose-950/25"
                        }`}
                        title="Delete spend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl ${
                themeMode === "light" ? "border-slate-200" : "border-slate-800"
              }`}>
                <p className="text-sm text-slate-400">No transactions match your filters</p>
                <button
                  onClick={() => { setSearchText(""); setSelectedCat("All"); }}
                  className="mt-2 text-xs text-indigo-500 hover:underline font-semibold"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
