import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Trash2, 
  Receipt, 
  DollarSign, 
  Percent, 
  Check, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { Group, GroupBalanceSheet, Settlement } from "../types";

interface GroupSplitProps {
  groups: Group[];
  activeGroup: Group | null;
  balanceSheet: GroupBalanceSheet | null;
  onSelectGroup: (id: string) => void;
  onCreateGroup: (name: string, members: string[]) => Promise<void>;
  onAddGroupExpense: (
    groupId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitType: "equal" | "unequal",
    splits: { [member: string]: number },
    doSync: boolean
  ) => Promise<void>;
  onDeleteGroupExpense: (groupId: string, id: string) => Promise<void>;
  currency: string;
  themeMode?: "light" | "dark";
}

export default function GroupSplit({
  groups,
  activeGroup,
  balanceSheet,
  onSelectGroup,
  onCreateGroup,
  onAddGroupExpense,
  onDeleteGroupExpense,
  currency,
  themeMode = "dark"
}: GroupSplitProps) {
  // Create Group Form States
  const [newGroupName, setNewGroupName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [tempMembers, setTempMembers] = useState<string[]>(["You"]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // New shared expense states
  const [exprDesc, setExprDesc] = useState("");
  const [exprAmount, setExprAmount] = useState("");
  const [exprPaidBy, setExprPaidBy] = useState("You");
  const [exprSplitType, setExprSplitType] = useState<"equal" | "unequal">("equal");
  
  // Custom manual splits mapping
  const [manualSplits, setManualSplits] = useState<{ [member: string]: string }>({});
  const [doSync, setDoSync] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Sync internal states with active group selection change
  useEffect(() => {
    if (activeGroup) {
      // Set default paidBy to "You" or first member
      if (activeGroup.members.includes("You")) {
        setExprPaidBy("You");
      } else if (activeGroup.members.length > 0) {
        setExprPaidBy(activeGroup.members[0]);
      }

      // Initialize manual splits to zeroes
      const initSplits: { [member: string]: string } = {};
      activeGroup.members.forEach(m => {
        initSplits[m] = "";
      });
      setManualSplits(initSplits);
    }
  }, [activeGroup]);

  // Handle adding temporary member to creation list
  const handleAddTempMember = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = memberInput.trim();
    if (!cleanName) return;
    if (tempMembers.some(m => m.toLowerCase() === cleanName.toLowerCase())) {
      alert("This member is already added!");
      return;
    }
    setTempMembers([...tempMembers, cleanName]);
    setMemberInput("");
  };

  const handleRemoveTempMember = (name: string) => {
    if (name.toLowerCase() === "you") {
      alert("Primary user 'You' must be kept in the group to enable smart sync functionality!");
      return;
    }
    setTempMembers(tempMembers.filter(m => m !== name));
  };

  const handleGroupCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert("Please provide a group name (e.g. PG Friends).");
      return;
    }
    if (tempMembers.length < 2) {
      alert("A sharing group needs at least 2 members.");
      return;
    }
    setIsCreatingGroup(true);
    try {
      await onCreateGroup(newGroupName.trim(), tempMembers);
      setNewGroupName("");
      setTempMembers(["You"]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Split calculations
  const totalAmountNum = parseFloat(exprAmount) || 0;
  const numMembers = activeGroup?.members.length || 1;

  // Calculate live split distributions to show
  const getCalculatedSplits = (): { [member: string]: number } => {
    const finalSplits: { [member: string]: number } = {};
    if (!activeGroup) return finalSplits;

    if (exprSplitType === "equal") {
      const share = parseFloat((totalAmountNum / numMembers).toFixed(2));
      let distributedSum = 0;
      
      activeGroup.members.forEach((m, idx) => {
        if (idx === activeGroup.members.length - 1) {
          // Adjust last member share due to float rounding inaccuracies
          finalSplits[m] = parseFloat((totalAmountNum - distributedSum).toFixed(2));
        } else {
          finalSplits[m] = share;
          distributedSum += share;
        }
      });
    } else {
      // Unequal splits
      activeGroup.members.forEach(m => {
        finalSplits[m] = parseFloat(manualSplits[m]) || 0;
      });
    }

    return finalSplits;
  };

  const calculatedSplits = getCalculatedSplits();
  const currentAssignedSum = Object.values(calculatedSplits).reduce((sum, v) => sum + v, 0);
  const remainingToAssign = parseFloat((totalAmountNum - currentAssignedSum).toFixed(2));
  const isUnequalSplitValid = exprSplitType === "equal" || Math.abs(remainingToAssign) < 0.05;

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    if (!exprDesc.trim()) {
      alert("Please enter a valid expense description.");
      return;
    }
    if (totalAmountNum <= 0) {
      alert("Please enter a valid shared amount.");
      return;
    }
    if (!isUnequalSplitValid) {
      alert(`The split split sum does not match the total expense of ${totalAmountNum}. Please match all amounts.`);
      return;
    }

    setIsAddingExpense(true);
    try {
      await onAddGroupExpense(
        activeGroup.id,
        exprDesc.trim(),
        totalAmountNum,
        exprPaidBy,
        exprSplitType,
        calculatedSplits,
        doSync
      );
      // Reset shared expense forms
      setExprDesc("");
      setExprAmount("");
      if (activeGroup.members.includes("You")) {
        setExprPaidBy("You");
      }
      setExprSplitType("equal");
      const clearedSplits: { [member: string]: string } = {};
      activeGroup.members.forEach(m => { clearedSplits[m] = ""; });
      setManualSplits(clearedSplits);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingExpense(false);
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
      
      {/* Header section */}
      <div>
        <h2 className={`text-3xl font-bold tracking-tight font-display mb-1 ${headerTextClass}`}>Smart Hostels & Split Bills</h2>
        <p className={`${mutedTextClass} text-sm`}>
          Coordinate living assets, split flats bills unequally or equally with roommates, and trigger automatic budget syncs.
        </p>
      </div>

      {/* Select active share group scroll row */}
      {groups.length > 0 && (
        <div className="space-y-2">
          <p className={labelClass}>Active sharing group</p>
          <div className="flex flex-wrap gap-2.5">
            {groups.map((g) => {
              const isActive = activeGroup?.id === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => onSelectGroup(g.id)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-550 shadow-md shadow-indigo-600/10 border-indigo-500"
                      : themeMode === "light"
                        ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  {g.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? "bg-indigo-700 text-indigo-100" 
                      : themeMode === "light" 
                        ? "bg-slate-100 text-slate-500" 
                        : "bg-slate-800 text-slate-400"
                  }`}>
                    {g.members.length} members
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main split screens grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Manage groups database & create group form */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`border rounded-2xl p-6 ${cardBgClass}`}>
            <h3 className={`text-base font-bold tracking-tight font-display mb-4 flex items-center gap-2 ${headerTextClass}`}>
              <Users className="w-5 h-5 text-indigo-500" />
              Configure New Flat Group
            </h3>

            <form onSubmit={handleGroupCreateSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={`${inputClass} px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2`}
                  placeholder="e.g. PG Friends, Flat Roommates"
                  required
                />
              </div>

              {/* Add member box */}
              <div>
                <label className={labelClass}>
                  Add Roommates / Members
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    className={`flex-1 ${inputClass} px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2`}
                    placeholder="Member full name"
                  />
                  <button
                    type="button"
                    onClick={handleAddTempMember}
                    className={`px-3 font-bold rounded-xl text-sm flex items-center justify-center cursor-pointer ${
                      themeMode === "light"
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-100"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List of currently accumulated temp members */}
              <div className={`space-y-1.5 border-t pt-3 mt-1 ${themeMode === "light" ? "border-slate-100" : "border-slate-800/80"}`}>
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Members List</span>
                  <span>{tempMembers.length} Joined</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pt-1">
                  {tempMembers.map((name) => (
                    <div 
                      key={name} 
                      className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs rounded-lg font-semibold group ${
                        themeMode === "light"
                          ? "bg-slate-50 border-slate-200 text-slate-700"
                          : "bg-slate-800/80 border-slate-700/50 text-slate-200"
                      }`}
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTempMember(name)}
                        className="text-slate-400 hover:text-red-500 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingGroup}
                className={`w-full py-2.5 font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-1.5 ${
                  themeMode === "light"
                    ? "bg-slate-900 hover:bg-slate-800 text-white"
                    : "bg-slate-800 hover:bg-slate-750 text-white"
                }`}
              >
                Create Group
              </button>
            </form>
          </div>
        </div>

        {/* MIDDLE COLUMN: ACTIVE GROUP SPLIT DETAILS AND BILL FORM */}
        <div className="lg:col-span-8">
          {activeGroup ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Add Split Bill Form Column */}
              <div className={`md:col-span-6 border rounded-2xl p-6 ${cardBgClass}`}>
                <h3 className={`text-base font-bold tracking-tight font-display mb-4 flex items-center gap-2 ${headerTextClass}`}>
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  Split Shared Bill
                </h3>

                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>
                      Bill description / Title
                    </label>
                    <input
                      type="text"
                      value={exprDesc}
                      onChange={(e) => setExprDesc(e.target.value)}
                      className={`${inputClass} px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2`}
                      placeholder="e.g. Swiggy Dinner, Rent, Wifi"
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
                          value={exprAmount}
                          onChange={(e) => setExprAmount(e.target.value)}
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
                        Who paid?
                      </label>
                      <select
                        value={exprPaidBy}
                        onChange={(e) => setExprPaidBy(e.target.value)}
                        className={`${inputClass} px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 font-semibold cursor-pointer animate-fade-in`}
                      >
                        {activeGroup.members.map(m => (
                          <option key={m} value={m} className={themeMode === "light" ? "text-slate-900" : "text-white bg-slate-900"}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Split toggle select */}
                  <div>
                    <label className={labelClass}>
                      Split Distribution Mode
                    </label>
                    <div className={`flex gap-2 p-1 rounded-xl border ${
                      themeMode === "light"
                        ? "bg-slate-50 border-slate-200"
                        : "bg-slate-950/40 border-slate-800"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setExprSplitType("equal")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          exprSplitType === "equal"
                            ? themeMode === "light"
                              ? "bg-white text-indigo-605 shadow-sm border border-slate-200 text-indigo-600"
                              : "bg-slate-800 text-indigo-400 shadow-sm"
                            : "text-slate-400 hover:text-slate-500"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 opacity-60" />
                        Equally ({currency}{(totalAmountNum / numMembers).toFixed(0)} each)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExprSplitType("unequal")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          exprSplitType === "unequal"
                            ? themeMode === "light"
                              ? "bg-white text-indigo-605 shadow-sm border border-slate-200 text-indigo-600"
                              : "bg-slate-800 text-indigo-400 shadow-sm"
                            : "text-slate-400 hover:text-slate-500"
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5 opacity-60" />
                        Unequally
                      </button>
                    </div>
                  </div>

                  {/* Split Detail Input Area (only if unequal) */}
                  {exprSplitType === "unequal" && (
                    <div className={`space-y-3.5 border p-4 rounded-xl max-h-[220px] overflow-y-auto ${
                      themeMode === "light"
                        ? "bg-slate-50 border-slate-200"
                        : "bg-slate-950/50 border-slate-800"
                    }`}>
                      <div className={`flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2 ${
                        themeMode === "light" ? "border-slate-100" : "border-slate-805"
                      }`}>
                        <span>Assign Member Share</span>
                        <span className={remainingToAssign === 0 ? "text-emerald-500 font-bold" : "text-amber-550 font-bold"}>
                          {remainingToAssign === 0 ? "Sum Matches!" : `Left: ${currency}${remainingToAssign}`}
                        </span>
                      </div>
                      
                      {activeGroup.members.map((member) => (
                        <div key={member} className="flex justify-between items-center gap-3">
                          <span className={`text-xs font-semibold truncate ${themeMode === "light" ? "text-slate-700" : "text-slate-300"}`}>{member}</span>
                          <div className="relative w-32 shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-404 text-slate-400">{currency}</span>
                            <input
                              type="number"
                              value={manualSplits[member] || ""}
                              onChange={(e) => {
                                setManualSplits({
                                  ...manualSplits,
                                  [member]: e.target.value
                                });
                              }}
                              className={`w-full pl-6 pr-2.5 py-1.5 text-xs text-right border rounded-lg focus:outline-none ${
                                themeMode === "light"
                                  ? "bg-white border-slate-200 text-slate-800"
                                  : "bg-slate-900 border-slate-800 text-slate-100"
                              }`}
                              placeholder="0"
                              min="0"
                              step="any"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Auto-sync Trigger */}
                  <div className={`flex items-center justify-between border p-3 rounded-xl ${
                    themeMode === "light"
                      ? "bg-indigo-50 border-indigo-100"
                      : "bg-indigo-500/5 border-indigo-500/10"
                  }`}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-505 text-indigo-500" />
                      <div>
                        <p className={`text-xs font-bold ${themeMode === "light" ? "text-indigo-900" : "text-indigo-400"}`}>Stream Split to Personal tracker</p>
                        <p className="text-[10px] text-zinc-400">Syncs personal share into Budget Spends</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={doSync} 
                        onChange={(e) => setDoSync(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingExpense || !isUnequalSplitValid}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add shared bill to group
                  </button>
                </form>
              </div>
              {/* Settlement table & balances sheet Column */}
              <div className="md:col-span-6 space-y-6">
                
                {/* Balance score card per person */}
                <div className={`border rounded-2xl p-6 ${cardBgClass}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-base font-bold tracking-tight font-display ${headerTextClass}`}>Flat Ledgers Core</h3>
                  </div>
                  
                  {balanceSheet && (
                    <div className="space-y-3">
                      {balanceSheet.members.map((member) => {
                        const bal = balanceSheet.balances[member] || 0;
                        const isCreditor = bal > 0.01;
                        const isDebtor = bal < -0.01;
                        return (
                          <div 
                            key={member} 
                            className={`flex justify-between items-center p-3.5 rounded-xl border ${
                              themeMode === "light"
                                ? "bg-slate-50 border-slate-100"
                                : "bg-slate-950/20 border-slate-800/40"
                            }`}
                          >
                            <span className="text-sm font-semibold">{member}</span>
                            <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                              isCreditor 
                                ? "text-emerald-600 bg-emerald-500/10 border border-emerald-500/20" 
                                : isDebtor 
                                  ? "text-red-500 bg-red-500/10 border border-red-500/20" 
                                  : themeMode === "light"
                                    ? "text-slate-550 bg-slate-100 border border-slate-205"
                                    : "text-slate-500 bg-slate-800 border border-slate-700/50"
                            }`}>
                              {isCreditor ? `Gets back: ${currency}${bal.toFixed(0)}` : isDebtor ? `Owes: ${currency}${Math.abs(bal).toFixed(0)}` : "All settled"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Who owes whom settlements transactions */}
                <div className={`border rounded-2xl p-6 ${cardBgClass}`}>
                  <h3 className="text-base font-bold tracking-tight font-display mb-4 flex items-center justify-between">
                    <span className={headerTextClass}>Direct Settlement Pathways</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Minimal Transactions</span>
                  </h3>

                  {balanceSheet && balanceSheet.settlements.length > 0 ? (
                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto">
                      {balanceSheet.settlements.map((settle, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-3.5 border rounded-xl ${
                            themeMode === "light"
                              ? "bg-indigo-50/60 border-indigo-100/80"
                              : "bg-indigo-500/10 border-indigo-500/20"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`text-sm font-bold truncate ${themeMode === "light" ? "text-slate-800" : "text-slate-200"}`}>{settle.from}</span>
                            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className={`text-sm font-medium truncate ${themeMode === "light" ? "text-slate-650" : "text-slate-300"}`}>{settle.to}</span>
                          </div>
                          <span className={`font-mono text-sm font-bold shrink-0 ${themeMode === "light" ? "text-indigo-600" : "text-indigo-400"}`}>
                            {currency}{settle.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`h-28 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl ${
                      themeMode === "light" ? "border-slate-200" : "border-slate-800"
                    }`}>
                      <p className="text-xs text-slate-400">All roommates balances match or no group transaction entered.</p>
                      <span className="text-[10px] text-emerald-555 font-semibold mt-1 text-emerald-500">Excellent budgeting!</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Group Shared Transactions Registry Block */}
              <div className={`md:col-span-12 border rounded-3xl p-6 mt-2 ${cardBgClass}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className={`text-base font-bold tracking-tight font-display ${headerTextClass}`}>Shared Billings Archive ({activeGroup.name})</h3>
                    <p className="text-xs text-slate-400 font-mono">{activeGroup.expenses.length} Shared Transactions</p>
                  </div>
                </div>

                {activeGroup.expenses.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {activeGroup.expenses.slice().reverse().map((exp) => (
                      <div 
                        key={exp.id} 
                        className={`flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 group animate-fade-in ${
                          themeMode === "light"
                            ? "bg-white hover:bg-slate-50 border-slate-100"
                            : "bg-slate-900/10 hover:bg-slate-800/40 border-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2 rounded-xl ${themeMode === "light" ? "bg-slate-100" : "bg-slate-800"}`}>
                            <Receipt className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                            <h4 className={`text-sm font-semibold ${themeMode === "light" ? "text-slate-800" : "text-slate-100"}`}>{exp.description}</h4>
                            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mt-1">
                              <span className="font-semibold text-indigo-500">Paid by {exp.paidBy}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-500 dark:text-slate-400">{currency}{exp.amount}</span>
                              <span>•</span>
                              <span className="font-mono">{exp.date}</span>
                              <span>•</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
                                themeMode === "light" 
                                  ? "text-slate-600 bg-slate-50 border-slate-200" 
                                  : "text-slate-400 bg-slate-950/20 border-slate-800"
                              }`}>
                                {exp.splitType === "equal" ? "Equally Split" : "Unequally Split"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`font-mono text-base font-bold ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
                            {currency}{exp.amount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => onDeleteGroupExpense(activeGroup.id, exp.id)}
                            className={`p-2 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100 ${
                              themeMode === "light"
                                ? "text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-600 hover:text-rose-500 hover:bg-rose-950/20"
                            }`}
                            title="Delete Shared Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`h-32 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-2xl ${
                    themeMode === "light" ? "border-slate-205 border-slate-20a border-slate-200" : "border-slate-800/40"
                  }`}>
                    <p className="text-xs text-slate-400">No shared ledger entries found. Record your roommates utilities above!</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className={`h-[420px] flex flex-col items-center justify-center text-center p-6 border rounded-3xl shadow-sm ${cardBgClass}`}>
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold tracking-tight font-display mb-1">No Active Group Selected</h3>
              <p className="text-sm text-slate-400 max-w-sm mb-6">
                Create a hostel, roommate team, or friends flat group using the config tool on the left to start splitting utilities!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
