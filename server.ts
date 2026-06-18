import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// Type interfaces for DB structures
interface Budget {
  income: number;
  savingsGoal: number;
}

interface PersonalExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  groupExpenseId?: string; // Optional reference for synced group split expense
  groupId?: string; // Optional reference for synced group
}

interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // member name
  splitType: "equal" | "unequal";
  splits: { [member: string]: number }; // percentage or amount share of each member
  date: string;
  syncedPersonalExpenseId?: string;
}

interface Group {
  id: string;
  name: string;
  members: string[];
  expenses: GroupExpense[];
}

interface DatabaseSchema {
  budget: Budget;
  personalExpenses: PersonalExpense[];
  groups: Group[];
}

// Default DB values
const DEFAULT_DB: DatabaseSchema = {
  budget: {
    income: 60000,
    savingsGoal: 15000,
  },
  personalExpenses: [
    {
      id: "p1",
      title: "Grocery Shopping",
      amount: 2500,
      category: "Food",
      date: "2026-06-12",
    },
    {
      id: "p2",
      title: "Metro Transport Card",
      amount: 800,
      category: "Transport",
      date: "2026-06-15",
    },
    {
      id: "p3",
      title: "Uniqlo Summer Tee",
      amount: 1999,
      category: "Shopping",
      date: "2026-06-16",
    },
  ],
  groups: [
    {
      id: "g1",
      name: "PG Friends Room 303",
      members: ["You", "Ayush", "Vikram", "Rohan"],
      expenses: [
        {
          "id": "e1",
          "description": "Highspeed Fiber Wifi",
          "amount": 1200,
          "paidBy": "Ayush",
          "splitType": "equal",
          "splits": { "You": 300, "Ayush": 300, "Vikram": 300, "Rohan": 300 },
          "date": "2026-06-10",
        },
        {
          "id": "e2",
          "description": "Pizza Party",
          "amount": 1600,
          "paidBy": "You",
          "splitType": "equal",
          "splits": { "You": 400, "Ayush": 400, "Vikram": 400, "Rohan": 400 },
          "date": "2026-06-14",
          "syncedPersonalExpenseId": "pe-sync-e2",
        }
      ],
    },
  ],
};

// Help load/save functions ensuring existence of db.json
async function loadDB(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    // If not exists, write default and return
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
    return DEFAULT_DB;
  }
}

async function saveDB(data: DatabaseSchema): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/* =======================================
   API ENDPOINTS -- PERSONAL BUDGET
   ======================================= */

// GET budget status
app.get("/api/budget/status", async (req, res) => {
  try {
    const db = await loadDB();
    const { budget, personalExpenses } = db;
    
    // Calculate total spent
    const totalExpenses = personalExpenses.reduce((sum, item) => sum + item.amount, 0);
    const remaining = budget.income - totalExpenses;
    
    // Savings progress: (Income - Spent) / SavingsGoal * 100
    // Max 100, Min 0
    let savingsProgress = 0;
    const actualSavings = budget.income - totalExpenses;
    if (budget.savingsGoal > 0) {
      savingsProgress = Math.min(
        100,
        Math.max(0, (actualSavings / budget.savingsGoal) * 100)
      );
    }

    // Category breakdown
    const categoryBreakdown: { [category: string]: number } = {};
    personalExpenses.forEach((item) => {
      const cat = item.category || "Uncategorized";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + item.amount;
    });

    res.json({
      budget,
      expenses: personalExpenses,
      totalExpenses,
      remaining,
      savingsProgress,
      categoryBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST budget create/update
app.post("/api/budget/create", async (req, res) => {
  try {
    const { income, savingsGoal } = req.body;
    if (typeof income !== "number" || typeof savingsGoal !== "number") {
      return res.status(400).json({ error: "income and savingsGoal must be numbers" });
    }

    const db = await loadDB();
    db.budget.income = income;
    db.budget.savingsGoal = savingsGoal;
    await saveDB(db);

    res.json(db.budget);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST expense add (Personal)
app.post("/api/expense/add", async (req, res) => {
  try {
    const { title, amount, category, date, groupExpenseId, groupId } = req.body;
    if (!title || typeof amount !== "number" || !category) {
      return res.status(400).json({ error: "title, amount (number), and category are required" });
    }

    const db = await loadDB();
    const newExpense: PersonalExpense = {
      id: "pe-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      title,
      amount,
      category,
      date: date || new Date().toISOString().split("T")[0],
      groupExpenseId,
      groupId,
    };

    db.personalExpenses.push(newExpense);
    await saveDB(db);

    res.status(201).json(newExpense);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE expense (Personal)
app.delete("/api/expense/:id", async (req, res) => {
  try {
    const db = await loadDB();
    const index = db.personalExpenses.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const deleted = db.personalExpenses.splice(index, 1)[0];
    await saveDB(db);

    res.json({ message: "Expense deleted successfully", deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


/* =======================================
   API ENDPOINTS -- GROUP SPLIT
   ======================================= */

// GET all groups
app.get("/api/groups", async (req, res) => {
  try {
    const db = await loadDB();
    res.json(db.groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET group details
app.get("/api/groups/:id", async (req, res) => {
  try {
    const db = await loadDB();
    const group = db.groups.find((g) => g.id === req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create group
app.post("/api/group/create", async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "name and a non-empty list of members are required" });
    }

    // Ensure "You" is always in members list if it isn't listed, to support personal budget tracking sync
    const sanitizedMembers = [...new Set(members.map(m => m.trim()).filter(Boolean))];
    if (!sanitizedMembers.some(m => m.toLowerCase() === "you")) {
      sanitizedMembers.unshift("You");
    }

    const db = await loadDB();
    const newGroup: Group = {
      id: "g-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      members: sanitizedMembers,
      expenses: [],
    };

    db.groups.push(newGroup);
    await saveDB(db);

    res.status(201).json(newGroup);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add group expense
app.post("/api/group/add-expense", async (req, res) => {
  try {
    const { groupId, description, amount, paidBy, splitType, splits, date, doSync } = req.body;
    // doSync is an optional boolean. If true, auto-syncs to Personal Expenses. Defaults to true.

    if (!groupId || !description || typeof amount !== "number" || !paidBy || !splitType || !splits) {
      return res.status(400).json({ error: "groupId, description, amount (number), paidBy, splitType, and splits are required" });
    }

    const db = await loadDB();
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const expenseId = "ge-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const actualDate = date || new Date().toISOString().split("T")[0];

    const newGroupExpense: GroupExpense = {
      id: expenseId,
      description: description.trim(),
      amount,
      paidBy,
      splitType,
      splits,
      date: actualDate,
    };

    // Auto-sync logic if enabled (defaulting to true)
    // Synchronize to Personal Budget tracker If 'You' is the payer *or* if 'You' is one of the participants.
    // Let's decide how much to log:
    // If 'You' paid the expense: we log a personal expense for 'You'.
    // The expense amount could reflect 'You's individual share of the item, OR the total amount 'You' paid, labeled appropriately.
    // Let's support logging 'You's portion, which directly updates their true budget spending.
    // Let's check 'You's share in this split:
    const youShare = splits["You"] || 0;
    const isPayerYou = paidBy.toLowerCase() === "you";

    // Standard sync: sync the user's specific share as their actual personal spending.
    // If the user paid, we can sync either their share or total paid. Let's sync their share by default
    // as it reflects what represents their net financial spending after settlement. Or even cleaner,
    // let's sync the SHARE (e.g. ₹300 for Wifi, or ₹400 for Pizza). This ensures their Personal Tracker remains 
    // mathematically accurate. Let's make sure we log this clearly!
    const shouldAddPersonalExpense = (doSync !== false) && (isPayerYou || youShare > 0);

    if (shouldAddPersonalExpense) {
      const personalSyncId = "pe-sync-" + expenseId;
      newGroupExpense.syncedPersonalExpenseId = personalSyncId;

      // Check if already in personalExpenses to avoid duplicate (just in case)
      const exists = db.personalExpenses.some((pe) => pe.id === personalSyncId);
      if (!exists) {
        // Calculate the amount to sync
        // If "You" paid, their actual personal share is splits["You"], and remaining is lent out.
        // If Snhea paid, You owe Sneha splits["You"], which is also your personal share cost.
        // So the TRUE net expense of the user is always splits["You"]! Let's log 'You's share.
        // Let's specify that clearly: "Shared: description (Group Name)" of splits["You"].
        const syncAmount = youShare;

        if (syncAmount > 0) {
          db.personalExpenses.push({
            id: personalSyncId,
            title: `Split: ${description} (${group.name})`,
            amount: syncAmount,
            category: "Shared",
            date: actualDate,
            groupExpenseId: expenseId,
            groupId: group.id,
          });
        }
      }
    }

    group.expenses.push(newGroupExpense);
    await saveDB(db);

    res.status(201).json(newGroupExpense);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE group expense
app.delete("/api/group/:groupId/expense/:expenseId", async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;
    const db = await loadDB();
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const expIndex = group.expenses.findIndex((e) => e.id === expenseId);
    if (expIndex === -1) {
      return res.status(404).json({ error: "Group expense not found" });
    }

    const deletedExpense = group.expenses.splice(expIndex, 1)[0];

    // If there was a synced personal tracker item, remove it too!
    if (deletedExpense.syncedPersonalExpenseId) {
      db.personalExpenses = db.personalExpenses.filter(
        (pe) => pe.id !== deletedExpense.syncedPersonalExpenseId && pe.groupExpenseId !== expenseId
      );
    } else {
      // Also fallback filter in case ID format matched
      db.personalExpenses = db.personalExpenses.filter(
        (pe) => pe.groupExpenseId !== expenseId
      );
    }

    await saveDB(db);
    res.json({ message: "Group expense deleted successfully", deletedExpense });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET group balance sheet & settlement
app.get("/api/group/:groupId/balance-sheet", async (req, res) => {
  try {
    const db = await loadDB();
    const group = db.groups.find((g) => g.id === req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const { members, expenses } = group;

    // Initialize balance map
    const balances: { [member: string]: number } = {};
    members.forEach((m) => (balances[m] = 0));

    // Calculate balances
    // balance[M] = (total paid by M) - (total M owes for everything)
    expenses.forEach((exp) => {
      const amount = exp.amount;
      const payer = exp.paidBy;
      
      // If payer isn't in current member list (e.g., added and then removed?), initialize
      if (balances[payer] === undefined) {
        balances[payer] = 0;
      }

      // Add to payer's total paid
      balances[payer] += amount;

      // Subtract share of each member
      const splits = exp.splits;
      Object.keys(splits).forEach((m) => {
        if (balances[m] === undefined) {
          balances[m] = 0;
        }
        balances[m] -= splits[m] || 0;
      });
    });

    // Generate settlements (minimal transactions algorithm)
    const settlements: { from: string; to: string; amount: number }[] = [];
    
    // Copy balances to manipulate
    const balList = Object.keys(balances).map((name) => ({
      name,
      balance: balances[name],
    }));

    // Separate debtors and creditors
    let debtors = balList
      .filter((b) => b.balance < -0.01)
      .sort((a, b) => a.balance - b.balance); // Biggest debtors first (most negative)
    let creditors = balList
      .filter((b) => b.balance > 0.01)
      .sort((a, b) => b.balance - a.balance); // Biggest creditors first (most positive)

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const oweAmount = Math.abs(debtor.balance);
      const creditAmount = creditor.balance;

      const settlementAmount = Math.min(oweAmount, creditAmount);

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: parseFloat(settlementAmount.toFixed(2)),
      });

      debtor.balance += settlementAmount;
      creditor.balance -= settlementAmount;

      if (Math.abs(debtor.balance) < 0.01) {
        dIdx++;
      }
      if (Math.abs(creditor.balance) < 0.01) {
        cIdx++;
      }
    }

    res.json({
      groupId: group.id,
      groupName: group.name,
      members,
      expenses,
      balances,
      settlements,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset database route for test/debug purposes
app.get("/api/db/reset", async (req, res) => {
  try {
    await saveDB(DEFAULT_DB);
    res.json({ status: "success", message: "Database reset to compliance examples" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================================
   VITE DEVELOPMENTS / PRODUCTION MIDDLEWARES
   ======================================= */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
