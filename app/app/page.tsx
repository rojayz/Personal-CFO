
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Kind = "asset" | "liability";

type Account = {
  id: string;
  name: string;
  kind: Kind;
  category: string;
  balance: number;
};

const categories = {
  asset: ["Cash", "Investments", "Retirement", "Real Estate", "Other"],
  liability: ["Mortgage", "Auto Loan", "Student Loan", "Credit Card", "Other"],
};

const sampleAccounts: Account[] = [
  { id: "1", name: "Checking", kind: "asset", category: "Cash", balance: 25000 },
  { id: "2", name: "High-Yield Savings", kind: "asset", category: "Cash", balance: 30000 },
  { id: "3", name: "401(k)", kind: "asset", category: "Retirement", balance: 100000 },
  { id: "4", name: "Brokerage", kind: "asset", category: "Investments", balance: 20000 },
  { id: "5", name: "Home", kind: "asset", category: "Real Estate", balance: 550000 },
  { id: "6", name: "Mortgage", kind: "liability", category: "Mortgage", balance: 390000 },
  { id: "7", name: "Auto Loan", kind: "liability", category: "Auto Loan", balance: 24000 },
];

const storageKey = "personal-cfo-v03";

const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const navigation = [
  "Dashboard",
  "Accounts",
  "Cash Flow",
  "Investments",
  "Debts",
  "Scenario Lab",
] as const;

type Page = (typeof navigation)[number];

function validAccounts(value: unknown): value is Account[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        (item.kind === "asset" || item.kind === "liability") &&
        typeof item.category === "string" &&
        typeof item.balance === "number" &&
        Number.isFinite(item.balance) &&
        item.balance >= 0
    )
  );
}

export default function Home() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [accounts, setAccounts] = useState<Account[]>(sampleAccounts);
  const [ready, setReady] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("asset");
  const [category, setCategory] = useState("Cash");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");

  // Load previously saved test accounts.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);
        if (validAccounts(parsed)) {
          setAccounts(parsed);
        }
      }
    } catch {
      console.error("Unable to read saved accounts.");
    }
    setReady(true);
  }, []);

  // Save changes after browser storage has been loaded.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(accounts));
    } catch {
      console.error("Unable to save accounts.");
    }
  }, [accounts, ready]);

  const assets = accounts.filter((a) => a.kind === "asset");
  const debts = accounts.filter((a) => a.kind === "liability");

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalDebts = debts.reduce((sum, a) => sum + a.balance, 0);
  const netWorth = totalAssets - totalDebts;

  const cash = assets
    .filter((a) => a.category === "Cash")
    .reduce((sum, a) => sum + a.balance, 0);

  const invested = assets
    .filter((a) => ["Investments", "Retirement"].includes(a.category))
    .reduce((sum, a) => sum + a.balance, 0);

  const property = assets
    .filter((a) => a.category === "Real Estate")
    .reduce((sum, a) => sum + a.balance, 0);

  const otherAssets = totalAssets - cash - invested - property;

  const allocation = [
    { label: "Cash", value: cash, color: "bg-emerald-600" },
    { label: "Investments", value: invested, color: "bg-blue-600" },
    { label: "Real Estate", value: property, color: "bg-violet-600" },
    { label: "Other", value: otherAssets, color: "bg-amber-500" },
  ];

  function resetForm() {
    setEditingId(null);
    setName("");
    setKind("asset");
    setCategory("Cash");
    setBalance("");
    setError("");
    setFormOpen(false);
  }

  function openAdd() {
    resetForm();
    setFormOpen(true);
    setPage("Accounts");
  }

  function openEdit(account: Account) {
    setEditingId(account.id);
    setName(account.name);
    setKind(account.kind);
    setCategory(account.category);
    setBalance(String(account.balance));
    setError("");
    setFormOpen(true);
    setPage("Accounts");
  }

  function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(balance);

    if (
      !name.trim() ||
      balance.trim() === "" ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 99999999999999
    ) {
      setError("Please enter a valid account name and balance.");
      return;
    }

    const details = {
      name: name.trim(),
      kind,
      category,
      balance: Math.round((amount + Number.EPSILON) * 100) / 100,
    };

    if (editingId) {
      setAccounts((current) =>
        current.map((account) =>
          account.id === editingId ? { ...account, ...details } : account
        )
      );
    } else {
      setAccounts((current) => [
        ...current,
        { id: crypto.randomUUID(), ...details },
      ]);
    }

    resetForm();
  }

  function deleteAccount(account: Account) {
    if (!window.confirm(`Delete "${account.name}"?`)) return;
    setAccounts((current) => current.filter((a) => a.id !== account.id));
  }

  function changePage(next: Page) {
    setPage(next);
    resetForm();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      {/* Sidebar */}
      <aside className="bg-slate-950 p-6 text-white md:min-h-screen md:w-64 md:shrink-0">
        <div className="mb-10">
          <div className="text-2xl font-bold tracking-tight">
            Personal<span className="text-emerald-400">CFO</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Household Financial Command Center
          </p>
        </div>

        <nav aria-label="Main navigation" className="flex flex-wrap gap-2 md:flex-col">
          {navigation.map((item) => (
            <button
              key={item}
              onClick={() => changePage(item)}
              className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                page === item
                  ? "bg-emerald-700 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mt-10 rounded-xl border border-slate-700 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Development
          </p>
          <p className="mt-2 font-semibold">Version 0.3</p>
          <p className="mt-1 text-xs text-slate-400">
            Browser storage · Sample data
          </p>
        </div>
      </aside>

      {/* Main application */}
      <main className="min-w-0 flex-1 p-5 md:p-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Personal Finance
              </p>
              <h1 className="mt-1 text-3xl font-bold md:text-4xl">
                {page}
              </h1>
              <p className="mt-2 text-slate-500">
                Your household financial overview
              </p>
            </div>

            <button
              onClick={openAdd}
              className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
            >
              + Add Account
            </button>
          </header>

          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Development mode — fictional data only. This version uses
            temporary browser storage, not a secure financial database.
          </div>

          {!ready ? (
            <p>Loading dashboard...</p>
          ) : (
            <>
              {/* Dashboard */}
              {page === "Dashboard" && (
                <div className="space-y-8">
                  <section className="grid gap-4 md:grid-cols-3">
                    {[
                      { label: "Net Worth", value: netWorth, featured: true },
                      { label: "Total Assets", value: totalAssets, featured: false },
                      { label: "Total Debt", value: totalDebts, featured: false },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className={`rounded-2xl p-6 shadow-sm ${
                          metric.featured
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white"
                        }`}
                      >
                        <p className={`text-sm ${
                          metric.featured ? "text-slate-300" : "text-slate-500"
                        }`}>
                          {metric.label}
                        </p>
                        <p className="mt-3 break-words text-3xl font-bold">
                          {money(metric.value)}
                        </p>
                      </div>
                    ))}
                  </section>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Asset allocation */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-xl font-semibold">Asset Allocation</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Where your assets are held
                      </p>

                      <div className="mt-8 space-y-6">
                        {allocation
                          .filter((item) => item.value > 0)
                          .map((item) => {
                            const percent =
                              totalAssets > 0
                                ? (item.value / totalAssets) * 100
                                : 0;

                            return (
                              <div key={item.label}>
                                <div className="mb-2 flex justify-between gap-3 text-sm">
                                  <span className="font-medium">{item.label}</span>
                                  <span className="text-slate-500">
                                    {percent.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full ${item.color}`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <p className="mt-1 text-right text-xs text-slate-500">
                                  {money(item.value)}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </section>

                    {/* Financial snapshot */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-xl font-semibold">Financial Snapshot</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Your current balance sheet
                      </p>

                      <div className="mt-6 space-y-5">
                        {[
                          ["Cash", cash],
                          ["Invested Assets", invested],
                          ["Real Estate", property],
                          ["Other Assets", otherAssets],
                          ["Outstanding Debt", totalDebts],
                        ].map(([label, value]) => (
                          <div
                            key={String(label)}
                            className="flex justify-between gap-3 border-b border-slate-100 pb-3"
                          >
                            <span className="text-slate-600">{label}</span>
                            <span className="font-semibold">
                              {money(Number(value))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Account preview */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold">Your Accounts</h2>
                      <button
                        onClick={() => changePage("Accounts")}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        View All →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {accounts.slice(0, 5).map((account) => (
                        <div
                          key={account.id}
                          className="flex justify-between gap-4 py-4"
                        >
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-slate-500">
                              {account.category}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {account.kind === "liability" ? "−" : ""}
                            {money(account.balance)}
                          </p>
                        </div>
                      ))}
                      {accounts.length === 0 && (
                        <p className="py-4 text-slate-500">No accounts yet.</p>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {/* Accounts */}
              {page === "Accounts" && (
                <div className="space-y-6">
                  {formOpen && (
                    <form
                      onSubmit={saveAccount}
                      className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
                    >
                      <h2 className="text-xl font-semibold md:col-span-2">
                        {editingId ? "Edit Account" : "New Account"}
                      </h2>

                      <label className="space-y-2">
                        <span className="block text-sm font-medium">
                          Account Name
                        </span>
                        <input
                          required
                          maxLength={100}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-3"
                          placeholder="e.g. Roth IRA"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="block text-sm font-medium">Type</span>
                        <select
                          value={kind}
                          onChange={(e) => {
                            const next = e.target.value as Kind;
                            setKind(next);
                            setCategory(categories[next][0]);
                          }}
                          className="w-full rounded-lg border border-slate-300 p-3"
                        >
                          <option value="asset">Asset</option>
                          <option value="liability">Liability</option>
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="block text-sm font-medium">Category</span>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-3"
                        >
                          {categories[kind].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="block text-sm font-medium">
                          Balance ($)
                        </span>
                        <input
                          required
                          type="number"
                          min="0"
                          max="99999999999999"
                          step="0.01"
                          value={balance}
                          onChange={(e) => setBalance(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-3"
                        />
                      </label>

                      {error && (
                        <p role="alert" className="text-sm text-red-700 md:col-span-2">
                          {error}
                        </p>
                      )}

                      <div className="flex gap-3 md:col-span-2">
                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white"
                        >
                          Save Account
                        </button>
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-lg border border-slate-300 px-5 py-3"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {(["asset", "liability"] as const).map((section) => (
                    <section
                      key={section}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <h2 className="mb-5 text-xl font-semibold">
                        {section === "asset" ? "Assets" : "Liabilities"}
                      </h2>

                      <div className="divide-y divide-slate-100">
                        {accounts
                          .filter((a) => a.kind === section)
                          .map((account) => (
                            <div
                              key={account.id}
                              className="flex flex-wrap items-center justify-between gap-4 py-4"
                            >
                              <div>
                                <p className="font-semibold">{account.name}</p>
                                <p className="text-sm text-slate-500">
                                  {account.category}
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="font-semibold">
                                  {money(account.balance)}
                                </span>
                                <button
                                  onClick={() => openEdit(account)}
                                  className="text-sm font-medium text-blue-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteAccount(account)}
                                  className="text-sm font-medium text-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {/* Future modules */}
              {!["Dashboard", "Accounts"].includes(page) && (
                <section className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
                  <div className="mb-4 text-4xl">◈</div>
                  <h2 className="text-2xl font-semibold">{page}</h2>
                  <p className="mt-3 max-w-xl text-slate-600">
                    This module is reserved for a future version of
                    Personal CFO. The dashboard and account-management
                    features are available now.
                  </p>
                  <button
                    onClick={() => changePage("Dashboard")}
                    className="mt-6 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white"
                  >
                    Return to Dashboard
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}