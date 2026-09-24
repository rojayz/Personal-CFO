
const accounts = [
  { name: "Checking", type: "Cash", balance: 25000 },
  { name: "High-Yield Savings", type: "Cash", balance: 30000 },
  { name: "401(k)", type: "Investments", balance: 100000 },
  { name: "Roth IRA", type: "Investments", balance: 15000 },
  { name: "Brokerage", type: "Investments", balance: 20000 },
  { name: "HSA", type: "Investments", balance: 12000 },
];

const debts = [
  { name: "Mortgage", balance: 390000 },
  { name: "Auto Loan", balance: 24000 },
  { name: "Student Loans", balance: 12000 },
];

const money = (amount: number) =>
  amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export default function Home() {
  const totalAssets = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  const totalDebt = debts.reduce(
    (sum, debt) => sum + debt.balance,
    0
  );

  const netWorth = totalAssets - totalDebt;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Personal Finance
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            Personal CFO
          </h1>
          <p className="mt-2 text-slate-500">
            Your household financial command center
          </p>
        </header>

        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Demo mode: All balances are fictional.
        </div>

        <section className="mb-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 p-6 text-white">
            <p className="text-sm text-slate-300">
              Net Worth
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              {money(netWorth)}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Total Assets
            </p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-700">
              {money(totalAssets)}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Total Debt
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              {money(totalDebt)}
            </h2>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              Assets
            </h2>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.name}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div>
                    <p className="font-semibold">
                      {account.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {account.type}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {money(account.balance)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              Liabilities
            </h2>
            <div className="space-y-3">
              {debts.map((debt) => (
                <div
                  key={debt.name}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5"
                >
                  <span className="font-semibold">
                    {debt.name}
                  </span>
                  <span className="font-semibold">
                    {money(debt.balance)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-400">
          Personal CFO · Development Version 0.1
        </footer>
      </div>
    </main>
  );
}