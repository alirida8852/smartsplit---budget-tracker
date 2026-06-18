import React, { useState } from "react";
import { Download, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { BudgetStatus, Group, GroupBalanceSheet } from "../types";
import { 
  exportPersonalExpensesCSV, 
  exportGroupExpensesCSV, 
  exportSettlementLedgerCSV 
} from "../utils/exportCSV";

interface ExportPanelProps {
  status: BudgetStatus;
  groups: Group[];
  themeMode: "light" | "dark";
}

export default function ExportPanel({ status, groups, themeMode }: ExportPanelProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups.length > 0 ? groups[0].id : ""
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const triggerFeedback = (message: string, isError = false) => {
    if (isError) {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleExportPersonal = () => {
    try {
      setIsExporting(true);
      exportPersonalExpensesCSV(status.expenses);
      triggerFeedback("Personal expenses exported successfully!");
    } catch {
      triggerFeedback("Failed to export personal expenses.", true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGroupExpenses = () => {
    if (!selectedGroup) {
      triggerFeedback("Please select a group first.", true);
      return;
    }
    try {
      setIsExporting(true);
      exportGroupExpensesCSV(selectedGroup);
      triggerFeedback(`Group expenses for "${selectedGroup.name}" exported!`);
    } catch {
      triggerFeedback("Failed to export group expenses.", true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportLedger = async () => {
    if (!selectedGroup) {
      triggerFeedback("Please select a group first.", true);
      return;
    }
    try {
      setIsExporting(true);
      // Fetch fresh balance sheet from backend
      const res = await fetch(`/api/group/${selectedGroup.id}/balance-sheet`);
      if (!res.ok) throw new Error("Failed to load balance sheet");
      const balanceSheet: GroupBalanceSheet = await res.json();
      
      exportSettlementLedgerCSV(selectedGroup.name, balanceSheet);
      triggerFeedback(`Settlement ledger for "${selectedGroup.name}" exported!`);
    } catch (err: any) {
      triggerFeedback(err.message || "Failed to export settlement ledger.", true);
    } finally {
      setIsExporting(false);
    }
  };

  // Modern card layout matching the theme
  const cardBgClass = themeMode === "light"
    ? "bg-white border-slate-200/90 shadow-sm text-slate-800"
    : "bg-slate-900/60 border-slate-800/80 shadow-xl backdrop-blur-md text-slate-100";

  const containerClass = themeMode === "light"
    ? "bg-slate-50 border-slate-100"
    : "bg-slate-950/40 border-slate-900/50";

  const buttonClass = themeMode === "light"
    ? "w-full py-2.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    : "w-full py-2.5 px-4 border border-slate-850 bg-slate-900/40 hover:bg-slate-850 hover:text-white hover:border-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const headerTextClass = themeMode === "light" ? "text-slate-900" : "text-white";
  const mutedTextClass = themeMode === "light" ? "text-slate-500" : "text-slate-400";

  return (
    <div className={`border rounded-3xl p-6 relative overflow-hidden transition-all duration-300 ${cardBgClass}`}>
      
      {/* Decorative gradient light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

      {/* Header Info */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className={`text-lg font-bold font-display tracking-tight ${headerTextClass}`}>
              Export Data
            </h3>
            <div className="relative group/tooltip">
              <Info className="w-4 h-4 text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 text-center font-sans tracking-normal font-normal">
                Download your financial data as clean, standard CSV spreadsheet reports.
              </div>
            </div>
          </div>
          <p className={`text-xs mt-0.5 ${mutedTextClass}`}>
            Securely save flat bills and pocket books offline
          </p>
        </div>
      </div>

      {/* Loading state indicator */}
      {isExporting && (
        <div className="mb-4 flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 text-xs text-indigo-400 animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span>Generating clean financial ledger logs...</span>
        </div>
      )}

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-500 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-500 font-medium font-sans">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Personal Export section */}
      <div className={`p-4 rounded-2xl border mb-4 ${containerClass}`}>
        <h4 className={`text-xs font-bold uppercase tracking-widest ${mutedTextClass} mb-2.5`}>
          Personal Ledger
        </h4>
        <button
          type="button"
          onClick={handleExportPersonal}
          disabled={isExporting}
          className={buttonClass}
        >
          <Download className="w-4 h-4 text-indigo-500 group-hover:translate-y-0.5 transition-transform" />
          <span>Export Personal Expenses</span>
        </button>
      </div>

      {/* Group Export section */}
      <div className={`p-4 rounded-2xl border ${containerClass}`}>
        <h4 className={`text-xs font-bold uppercase tracking-widest ${mutedTextClass} mb-2.5`}>
          Roommate Flat Data
        </h4>

        {groups.length > 0 ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="group-select" className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${mutedTextClass}`}>
                Select Target Flat Group
              </label>
              <select
                id="group-select"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className={`w-full text-xs font-medium py-2 px-3 border rounded-xl focus:outline-none transition-all ${
                  themeMode === "light"
                    ? "border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    : "border-slate-800 bg-slate-900/50 text-white focus:ring-2 focus:ring-indigo-505/20 focus:ring-indigo-500/20"
                }`}
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id} className={themeMode === "light" ? "text-slate-900" : "text-white bg-slate-900"}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportGroupExpenses}
                disabled={isExporting || !selectedGroupId}
                className={buttonClass}
              >
                <Download className="w-4 h-4 text-indigo-500 group-hover:translate-y-0.5 transition-transform" />
                <span>Group Expenses</span>
              </button>

              <button
                type="button"
                onClick={handleExportLedger}
                disabled={isExporting || !selectedGroupId}
                className={buttonClass}
              >
                <Download className="w-4 h-4 text-emerald-500 group-hover:translate-y-0.5 transition-transform" />
                <span>Settlement Ledger</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-2.5">
            Create or join a flat group to export shared roommate split reports.
          </p>
        )}
      </div>
    </div>
  );
}
