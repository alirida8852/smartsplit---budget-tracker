import React, { useState } from "react";
import { motion } from "motion/react";
import { PiggyBank, ArrowRight, ShieldCheck, Mail, User, Sparkles, DollarSign, Target } from "lucide-react";

interface OnboardingProps {
  onComplete: (data: { name: string; email: string; income: number; savingsGoal: number }) => void;
  themeMode: "light" | "dark";
}

export default function Onboarding({ onComplete, themeMode }: OnboardingProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [income, setIncome] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    const incomeVal = parseFloat(income) || 0;
    const savingsGoalVal = parseFloat(savingsGoal) || 0;

    if (income && incomeVal < 0) {
      setError("Monthly income cannot be negative.");
      return;
    }

    if (savingsGoal && savingsGoalVal < 0) {
      setError("Savings goal cannot be negative.");
      return;
    }

    onComplete({
      name: name.trim(),
      email: email.trim(),
      income: incomeVal,
      savingsGoal: savingsGoalVal,
    });
  };

  // Modern card bg & styles matching Gemetric Balance theme
  const cardBgClass = themeMode === "light"
    ? "bg-white border-slate-200/90 shadow-xl text-slate-800"
    : "bg-slate-900/60 border-slate-800/80 shadow-2xl backdrop-blur-md text-slate-100";

  const inputClass = themeMode === "light"
    ? "w-full border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white placeholder-slate-400 transition-all rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border"
    : "w-full border border-slate-800 bg-slate-950/40 text-white focus:ring-2 focus:ring-indigo-500 focus:bg-slate-900 focus:border-slate-700 placeholder-slate-500 transition-all rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none";

  const labelClass = themeMode === "light"
    ? "block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5"
    : "block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5";

  const headerTextClass = themeMode === "light" ? "text-slate-900" : "text-white";
  const mutedTextClass = themeMode === "light" ? "text-slate-500" : "text-slate-400";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Modern ambient blurred background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-75" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl shadow-xl flex items-center justify-center mb-4 ring-4 ring-indigo-500/10">
            <PiggyBank className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-extrabold font-display tracking-tight leading-none mb-2 ${headerTextClass}`}>
            SmartSplit
          </h1>
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-[11px] bg-indigo-500/10 px-3 py-1 rounded-full leading-none">
            Onboarding Workspace
          </p>
        </div>

        {/* Form Card */}
        <div className={`border rounded-2xl p-8 relative overflow-hidden ${cardBgClass}`}>
          <div className="mb-6 text-center">
            <h2 className={`text-xl font-bold font-display ${headerTextClass}`}>
              Welcome to SmartSplit
            </h2>
            <p className={`text-xs mt-1 max-w-xs mx-auto ${mutedTextClass}`}>
              Take control of your personal and shared finances
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className={labelClass}>Full Name <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajeev Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className={labelClass}>Email Address <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajeev@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Income Field */}
            <div>
              <label className={labelClass}>Monthly Income (Optional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 60000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Savings Goal Field */}
            <div>
              <label className={labelClass}>Savings Goal (Optional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 15000"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-2 group"
            >
              Enter Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        {/* Trust disclaimer */}
        <div className="flex justify-center items-center gap-1.5 mt-6 text-[10px] uppercase font-bold tracking-wider text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Local Storage Secure Sandbox</span>
        </div>
      </motion.div>
    </div>
  );
}
