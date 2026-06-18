import React, { useState, useEffect } from "react";
import { 
  PiggyBank, 
  Users, 
  Receipt, 
  LineChart, 
  Sun, 
  Moon, 
  ExternalLink, 
  Settings,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { BudgetStatus, Group, GroupBalanceSheet, ToastMessage } from "./types";
import Dashboard from "./components/Dashboard";
import PersonalTracker from "./components/PersonalTracker";
import GroupSplit from "./components/GroupSplit";
import NotificationToast from "./components/NotificationToast";
import Onboarding from "./components/Onboarding";

export default function App() {
  const [activePage, setActivePage] = useState<string>("dashboard");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [currency] = useState<string>("₹");
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem("user_name");
  });

  // Core backend stats state
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<GroupBalanceSheet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Function to show toast notifications
  const addToast = (text: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync server side logs
  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // 1. Fetch personal budget status
      const budgetRes = await fetch("/api/budget/status");
      const budgetData = await budgetRes.json();
      setBudgetStatus(budgetData);

      // 2. Fetch groups
      const groupsRes = await fetch("/api/groups");
      const groupsData = await groupsRes.json();
      setGroups(groupsData);

      // 3. Fetch active group details & balances
      if (groupsData.length > 0) {
        // Keep active group selected if it's in the list, otherwise default to first
        const currentGroup = activeGroup 
          ? groupsData.find((g: Group) => g.id === activeGroup.id) 
          : groupsData[0];
          
        if (currentGroup) {
          setActiveGroup(currentGroup);
          // Fetch its balance sheet ledger solver
          const bsRes = await fetch(`/api/group/${currentGroup.id}/balance-sheet`);
          const bsData = await bsRes.json();
          setBalanceSheet(bsData);
        }
      } else {
        setActiveGroup(null);
        setBalanceSheet(null);
      }
    } catch (err: any) {
      console.error("Error loading finance records: ", err);
      addToast("Failed to connect to the backend server. Reconnecting...", "error");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Sync theme changes to wrapper
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "light") {
      root.classList.add("light-mode");
    } else {
      root.classList.remove("light-mode");
    }
  }, [themeMode]);

  // Handler: Update budget & savings goal
  const handleUpdateBudget = async (income: number, savingsGoal: number) => {
    try {
      const res = await fetch("/api/budget/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income, savingsGoal }),
      });
      if (!res.ok) throw new Error("Failed to update pocket plan");
      
      addToast("Budget layout updated successfully!", "success");
      await fetchAllData(true);
    } catch (err: any) {
      addToast(err.message || "Failed to update financial plan", "error");
    }
  };

  // Handler: Add custom personal expense
  const handleAddPersonalExpense = async (title: string, amount: number, category: string, date: string) => {
    try {
      const res = await fetch("/api/expense/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, category, date }),
      });
      if (!res.ok) throw new Error("Failed to log transaction");

      addToast("Expense record added to personal budget tracker!", "success");
      await fetchAllData(true);
    } catch (err: any) {
      addToast(err.message || "Failed to add personal transaction", "error");
    }
  };

  // Handler: Delete personal expense
  const handleDeletePersonalExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expense/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to purge spend item");

      addToast("Spend entry removed successfully", "info");
      await fetchAllData(true);
    } catch (err: any) {
      addToast(err.message || "Failed to delete spend entry", "error");
    }
  };

  // Handler: Create group sharing locker
  const handleCreateGroup = async (name: string, members: string[]) => {
    try {
      const res = await fetch("/api/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, members }),
      });
      if (!res.ok) throw new Error("Failed to assemble sharing locker");
      const created = await res.json();

      addToast(`Split group '${name}' compiled successfully!`, "success");
      
      // Refresh list and auto-select newly compiled group
      setIsLoading(true);
      const groupsRes = await fetch("/api/groups");
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
      
      const newActive = groupsData.find((g: Group) => g.id === created.id) || created;
      setActiveGroup(newActive);

      const bsRes = await fetch(`/api/group/${newActive.id}/balance-sheet`);
      const bsData = await bsRes.json();
      setBalanceSheet(bsData);
      
      const budgetRes = await fetch("/api/budget/status");
      const budgetData = await budgetRes.json();
      setBudgetStatus(budgetData);
      
      setIsLoading(false);
    } catch (err: any) {
      addToast(err.message || "Failed to compile split group", "error");
    }
  };

  // Handler: Add shared group expense & auto-sync to budget
  const handleAddGroupExpense = async (
    groupId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitType: "equal" | "unequal",
    splits: { [member: string]: number },
    doSync: boolean
  ) => {
    try {
      const res = await fetch("/api/group/add-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, description, amount, paidBy, splitType, splits, doSync }),
      });
      if (!res.ok) throw new Error("Failed to log shared transaction");

      addToast(`Shared bill split logged. auto-sync executed.`, "success");
      await fetchAllData(true);
    } catch (err: any) {
      addToast(err.message || "Failed to add shared transaction", "error");
    }
  };

  // Handler: Delete group expense (also cleans synced items)
  const handleDeleteGroupExpense = async (groupId: string, id: string) => {
    try {
      const res = await fetch(`/api/group/${groupId}/expense/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove shared transaction");

      addToast("Shared transaction purged. Synced budget entries updated.", "info");
      await fetchAllData(true);
    } catch (err: any) {
      addToast(err.message || "Failed to delete shared transaction", "error");
    }
  };

  // Switch active selection group
  const handleSelectGroup = async (groupId: string) => {
    const found = groups.find(g => g.id === groupId);
    if (found) {
      setActiveGroup(found);
      try {
        const bsRes = await fetch(`/api/group/${groupId}/balance-sheet`);
        const bsData = await bsRes.json();
        setBalanceSheet(bsData);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Reset demo base data
  const handleResetDB = async () => {
    if (window.confirm("Are you sure you want to reset the finance tracker with beautiful example demo data?")) {
      try {
        const res = await fetch("/api/db/reset");
        if (res.ok) {
          addToast("Locker database successfully refreshed with starting examples!", "success");
          await fetchAllData();
        }
      } catch (err) {
        addToast("Reset failed.", "error");
      }
    }
  };

  const [showSunIcon, setShowSunIcon] = useState(true); // Dummy state to preserve sun icon dependency if tsc demands it
  
  if (!currentUser) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex flex-col justify-center items-center font-sans relative ${
        themeMode === "light" ? "bg-slate-50 text-slate-900" : "bg-[#0b0f19] text-slate-100"
      }`}>
        <NotificationToast toasts={toasts} onRemove={removeToast} />
        
        {/* Simple floating theme toggler for onboarding screen */}
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
            className={`p-2.5 border rounded-xl transition-all duration-300 cursor-pointer ${
              themeMode === "light"
                ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                : "border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Toggle system theme colors"
          >
            {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <Onboarding
          themeMode={themeMode}
          onComplete={async (data) => {
            localStorage.setItem("user_name", data.name);
            localStorage.setItem("user_email", data.email);
            localStorage.setItem("user_income", data.income.toString());
            localStorage.setItem("user_savings_goal", data.savingsGoal.toString());

            // Check if values are specified, else use some sensible default or 0
            const incomeToSubmit = data.income > 0 ? data.income : 60000;
            const savingsGoalToSubmit = data.savingsGoal > 0 ? data.savingsGoal : 15000;
            
            await handleUpdateBudget(incomeToSubmit, savingsGoalToSubmit);
            
            setCurrentUser(data.name);
            addToast(`Welcome to SmartSplit, ${data.name}! 👋`, "success");
            setActivePage("dashboard");
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col font-sans ${
      themeMode === "light" ? "text-slate-900" : "text-slate-100"
    }`}>
      
      {/* Dynamic Global Notifications */}
      <NotificationToast toasts={toasts} onRemove={removeToast} />

      {/* Main layout navbar header */}
      <header className={`border-b sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur-md transition-colors duration-300 ${
        themeMode === "light" 
          ? "border-slate-200/90 bg-white/80" 
          : "border-slate-800 bg-slate-950/80"
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-md flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className={`text-xl font-bold font-display tracking-tight flex items-center gap-1.5 leading-none transition-colors duration-300 ${
                themeMode === "light" ? "text-slate-900" : "text-white"
              }`}>
                SmartSplit
                <span className="text-xs font-semibold text-indigo-400 font-sans tracking-normal bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  Budget
                </span>
              </h1>
              <p className={`text-[10px] font-medium tracking-wide mt-0.5 transition-colors duration-300 ${
                themeMode === "light" ? "text-slate-500" : "text-slate-400"
              }`}>Automated Group & Personal Sync</p>
            </div>
          </div>

          {/* Nav pills */}
          <nav className={`hidden md:flex gap-1.5 p-1.5 rounded-xl border transition-colors duration-300 ${
            themeMode === "light" 
              ? "bg-slate-100/80 border-slate-200" 
              : "bg-slate-900/60 border-slate-800"
          }`}>
            <button
              onClick={() => setActivePage("dashboard")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activePage === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : themeMode === "light"
                    ? "text-slate-600 hover:text-indigo-600"
                    : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActivePage("budget")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activePage === "budget"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : themeMode === "light"
                    ? "text-slate-600 hover:text-indigo-600"
                    : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Personal Tracker
            </button>
            <button
              onClick={() => setActivePage("split")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activePage === "split"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : themeMode === "light"
                    ? "text-slate-600 hover:text-indigo-600"
                    : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Roommate Splitting
            </button>
          </nav>

          {/* Right utility toolbar */}
          <div className="flex items-center gap-3">
            
            {/* Quick reset database button */}
            <button
              onClick={handleResetDB}
              title="Reset sample starting database state"
              className={`p-2 border rounded-xl transition-colors cursor-pointer ${
                themeMode === "light"
                  ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Dark & Light toggle */}
            <button
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              className={`p-2 border rounded-xl transition-colors cursor-pointer ${
                themeMode === "light"
                  ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
              }`}
              title="Toggle system theme colors"
            >
              {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation layout tracker */}
        <div className={`md:hidden flex gap-1 p-1.5 rounded-xl border mt-4 overflow-x-auto ${
          themeMode === "light"
            ? "bg-slate-100 border-slate-200"
            : "bg-slate-900/60 border-slate-800"
        }`}>
          <button
            onClick={() => setActivePage("dashboard")}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg shrink-0 ${
              activePage === "dashboard" ? "bg-indigo-600 text-white animate-fade-in" : themeMode === "light" ? "text-slate-600" : "text-zinc-400"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActivePage("budget")}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg shrink-0 ${
              activePage === "budget" ? "bg-indigo-600 text-white animate-fade-in" : themeMode === "light" ? "text-slate-600" : "text-zinc-400"
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setActivePage("split")}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg shrink-0 ${
              activePage === "split" ? "bg-indigo-600 text-white animate-fade-in" : themeMode === "light" ? "text-slate-600" : "text-zinc-400"
            }`}
          >
            Split ledgers
          </button>
        </div>
      </header>

      {/* Main core layout box */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className={`font-medium text-sm ${themeMode === "light" ? "text-slate-500" : "text-slate-400"}`}>Syncing fiscal database modules safely...</p>
          </div>
        ) : !budgetStatus ? (
          <div className={`h-96 flex flex-col items-center justify-center text-center p-6 rounded-3xl border ${
            themeMode === "light" ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-850"
          }`}>
            <p className={`text-sm mb-4 ${themeMode === "light" ? "text-slate-500" : "text-slate-400"}`}>A connection error occurred. Click button to force sync.</p>
            <button
              onClick={() => fetchAllData()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs rounded-xl transition-all text-white cursor-pointer"
            >
              Force Fetch Data
            </button>
          </div>
        ) : (
          <div>
            {activePage === "dashboard" && (
              <Dashboard
                status={budgetStatus}
                groups={groups}
                onNavigate={setActivePage}
                onDeleteExpense={handleDeletePersonalExpense}
                currency={currency}
                themeMode={themeMode}
              />
            )}

            {activePage === "budget" && (
              <PersonalTracker
                status={budgetStatus}
                onUpdateBudget={handleUpdateBudget}
                onAddExpense={handleAddPersonalExpense}
                onDeleteExpense={handleDeletePersonalExpense}
                currency={currency}
                themeMode={themeMode}
              />
            )}

            {activePage === "split" && (
              <GroupSplit
                groups={groups}
                activeGroup={activeGroup}
                balanceSheet={balanceSheet}
                onSelectGroup={handleSelectGroup}
                onCreateGroup={handleCreateGroup}
                onAddGroupExpense={handleAddGroupExpense}
                onDeleteGroupExpense={handleDeleteGroupExpense}
                currency={currency}
                themeMode={themeMode}
              />
            )}
          </div>
        )}
      </main>

      {/* Main professional custom footer layout containing required elements */}
      <footer className={`border-t py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        themeMode === "light"
          ? "border-slate-250 bg-slate-100 text-slate-800"
          : "border-slate-900 bg-slate-950 text-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Logo brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-indigo-500 animate-bounce" />
              <span className={`font-bold font-display text-base ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>SmartSplit + Budget Tracker</span>
            </div>
            <p className={`text-xs leading-relaxed max-w-sm ${themeMode === "light" ? "text-slate-500" : "text-slate-400"}`}>
              An elegant joint fintech planner built to let hostiles, roommates, and flat teams budget together and split liabilities unequally or equally.
            </p>
          </div>

          {/* REQUIRED BUTTON ELEMENT: "Built for Digital Heroes" */}
          <div className="flex flex-col items-center md:items-end gap-3.5">
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              id="built-for-digital-heroes-btn"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/20 animate-pulse"
            >
              Built for Digital Heroes
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            
            {/* REQUIRED FOOTER METADATA: Name and Email */}
            <div className={`text-right text-xs space-y-1 font-mono uppercase tracking-wider text-center md:text-right ${themeMode === "light" ? "text-slate-600" : "text-slate-400"}`}>
              <p>Name: <span className={`font-bold ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>Rida Ali</span></p>
              <p>Email: <span className={`font-bold ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>ridaali8852@gmail.com</span></p>
            </div>
          </div>

        </div>

        <div className={`max-w-7xl mx-auto border-t pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono gap-4 ${
          themeMode === "light" ? "border-slate-200 text-slate-500" : "border-slate-900 text-slate-500"
        }`}>
          <span>SmartSplit v1.1.0 — COMPLIANT DIGITAL HEROES FLATS UTILITY</span>
          <span>© 2026 SmartSplit System. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
