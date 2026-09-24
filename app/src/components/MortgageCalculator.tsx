
"use client";

import { useState } from "react";

const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

function monthlyPayment(
  principal: number,
  annualRate: number,
  months: number
) {
  if (months <= 0) return 0;

  const rate = annualRate / 100 / 12;

  if (rate === 0) return principal / months;

  return (
    (principal * rate) /
    (1 - Math.pow(1 + rate, -months))
  );
}

function remainingBalance(
  principal: number,
  annualRate: number,
  months: number,
  elapsed: number
) {
  if (elapsed >= months) return 0;

  const payment = monthlyPayment(
    principal,
    annualRate,
    months
  );

  const rate = annualRate / 100 / 12;

  if (rate === 0) {
    return Math.max(0, principal - payment * elapsed);
  }

  const growth = Math.pow(1 + rate, elapsed);

  return Math.max(
    0,
    principal * growth -
      payment * ((growth - 1) / rate)
  );
}

function costAtMonth(
  principal: number,
  rate: number,
  term: number,
  month: number,
  upfrontCosts: number
) {
  const monthsPaid = Math.min(month, term);
  const payment = monthlyPayment(principal, rate, term);

  return (
    payment * monthsPaid +
    remainingBalance(
      principal,
      rate,
      term,
      monthsPaid
    ) +
    upfrontCosts
  );
}

type FieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
};

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
}: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-slate-600">
        {label}
      </span>
      <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) =>
            onChange(Number(e.target.value))
          }
          className="w-full min-w-0 rounded-lg bg-transparent p-3 outline-none"
        />
        {suffix && (
          <span className="pr-3 text-sm text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export default function MortgageCalculator() {
  // Fictional starting assumptions.
  const [balance, setBalance] = useState(390000);
  const [currentRate, setCurrentRate] = useState(6.124);
  const [remainingYears, setRemainingYears] = useState(29);

  const [newRate, setNewRate] = useState(4.875);
  const [newTerm, setNewTerm] = useState(30);
  const [closingCosts, setClosingCosts] = useState(5000);
  const [financeCosts, setFinanceCosts] = useState(false);

  const [holdingYears, setHoldingYears] = useState(5);

  const invalid =
    !Number.isFinite(balance) ||
    balance <= 0 ||
    !Number.isFinite(currentRate) ||
    currentRate < 0 ||
    !Number.isFinite(newRate) ||
    newRate < 0 ||
    !Number.isFinite(remainingYears) ||
    remainingYears < 1 ||
    remainingYears > 40 ||
    !Number.isFinite(newTerm) ||
    newTerm < 1 ||
    newTerm > 40 ||
    !Number.isFinite(closingCosts) ||
    closingCosts < 0 ||
    !Number.isFinite(holdingYears) ||
    holdingYears < 1 ||
    holdingYears > 40;

  const oldMonths = Math.round(remainingYears * 12);
  const newMonths = Math.round(newTerm * 12);
  const horizon = Math.round(holdingYears * 12);

  const financedPrincipal =
    balance + (financeCosts ? closingCosts : 0);

  const upfrontCosts = financeCosts ? 0 : closingCosts;

  const oldPayment = invalid
    ? 0
    : monthlyPayment(balance, currentRate, oldMonths);

  const newPayment = invalid
    ? 0
    : monthlyPayment(
        financedPrincipal,
        newRate,
        newMonths
      );

  const monthlySavings = oldPayment - newPayment;

  const oldInterest = oldPayment * oldMonths - balance;

  const newInterest =
    newPayment * newMonths - financedPrincipal;

  const oldBalanceAtHorizon = invalid
    ? 0
    : remainingBalance(
        balance,
        currentRate,
        oldMonths,
        horizon
      );

  const newBalanceAtHorizon = invalid
    ? 0
    : remainingBalance(
        financedPrincipal,
        newRate,
        newMonths,
        horizon
      );

  // Costs include payments, remaining loan balance,
  // and closing costs paid upfront, where applicable.
  const oldHorizonCost = invalid
    ? 0
    : costAtMonth(
        balance,
        currentRate,
        oldMonths,
        horizon,
        0
      );

  const newHorizonCost = invalid
    ? 0
    : costAtMonth(
        financedPrincipal,
        newRate,
        newMonths,
        horizon,
        upfrontCosts
      );

  const horizonSavings =
    oldHorizonCost - newHorizonCost;

  // First month where cumulative borrowing costs
  // are no greater than keeping the existing loan.
  let breakEvenMonth: number | null = null;

  if (!invalid) {
    for (
      let month = 1;
      month <= Math.max(oldMonths, newMonths);
      month++
    ) {
      const oldCost = costAtMonth(
        balance,
        currentRate,
        oldMonths,
        month,
        0
      );

      const newCost = costAtMonth(
        financedPrincipal,
        newRate,
        newMonths,
        month,
        upfrontCosts
      );

      if (newCost <= oldCost) {
        breakEvenMonth = month;
        break;
      }
    }
  }

  const scenarios = [
    {
      title: "Existing Mortgage",
      payment: oldPayment,
      balance: oldBalanceAtHorizon,
      cost: oldHorizonCost,
      interest: oldInterest,
    },
    {
      title: "Refinanced Mortgage",
      payment: newPayment,
      balance: newBalanceAtHorizon,
      cost: newHorizonCost,
      interest: newInterest + closingCosts,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">
          Mortgage Refinance Analyzer
        </h2>
        <p className="mt-2 text-slate-500">
          Compare your current mortgage against a new
          loan over your expected time in the home.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Existing mortgage */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-semibold">
            Current Mortgage
          </h3>

          <div className="space-y-5">
            <NumberField
              label="Outstanding Principal"
              value={balance}
              onChange={setBalance}
              min={1}
              step={1000}
              suffix="$"
            />

            <NumberField
              label="Current Interest Rate"
              value={currentRate}
              onChange={setCurrentRate}
              min={0}
              step={0.001}
              suffix="%"
            />

            <NumberField
              label="Remaining Loan Term"
              value={remainingYears}
              onChange={setRemainingYears}
              min={1}
              max={40}
              step={1}
              suffix="years"
            />
          </div>
        </section>

        {/* New mortgage */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-semibold">
            Proposed Refinance
          </h3>

          <div className="space-y-5">
            <NumberField
              label="New Interest Rate"
              value={newRate}
              onChange={setNewRate}
              min={0}
              step={0.001}
              suffix="%"
            />

            <NumberField
              label="New Loan Term"
              value={newTerm}
              onChange={setNewTerm}
              min={1}
              max={40}
              step={1}
              suffix="years"
            />

            <NumberField
              label="Closing Costs"
              value={closingCosts}
              onChange={setClosingCosts}
              min={0}
              step={500}
              suffix="$"
            />

            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={financeCosts}
                onChange={(e) =>
                  setFinanceCosts(e.target.checked)
                }
                className="h-5 w-5 accent-emerald-700"
              />
              Finance closing costs into the new loan
            </label>
          </div>
        </section>
      </div>

      {/* Time horizon */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">
              Expected Time in Home
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Compare the two loans over this period.
            </p>
          </div>
          <span className="text-2xl font-bold text-emerald-700">
            {holdingYears} years
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={holdingYears}
          onChange={(e) =>
            setHoldingYears(Number(e.target.value))
          }
          className="mt-6 w-full accent-emerald-700"
        />

        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>1 year</span>
          <span>10 years</span>
          <span>20 years</span>
        </div>
      </section>

      {invalid ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          Enter a positive loan balance and valid rates,
          loan terms, closing costs, and holding period.
        </div>
      ) : (
        <>
          {/* Primary results */}
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900 p-6 text-white">
              <p className="text-sm text-slate-300">
                New Monthly Payment
              </p>
              <p className="mt-3 text-3xl font-bold">
                {money(newPayment)}
              </p>
              <p className="mt-2 text-xs text-slate-300">
                Principal and interest only
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">
                Monthly Payment Savings
              </p>
              <p
                className={`mt-3 text-3xl font-bold ${
                  monthlySavings >= 0
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                {money(monthlySavings)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Before escrow, taxes and insurance
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">
                First Break-Even Month
              </p>
              <p className="mt-3 text-3xl font-bold">
                {breakEvenMonth === null
                  ? "Not reached"
                  : `${breakEvenMonth} months`}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Based on cumulative borrowing costs,
                without discounting future cash flows.
              </p>
            </div>
          </section>

          {/* Comparison table */}
          <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-semibold">
              Side-by-Side Comparison
            </h3>

            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3">Metric</th>
                  {scenarios.map((item) => (
                    <th key={item.title} className="py-3 text-right">
                      {item.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Monthly P&I", "payment"],
                  [
                    `Balance After ${holdingYears} Years`,
                    "balance",
                  ],
                  [
                    `Cost Over ${holdingYears} Years`,
                    "cost",
                  ],
                  ["Lifetime Interest + Fees", "interest"],
                ].map(([label, key]) => (
                  <tr
                    key={label}
                    className="border-b border-slate-100"
                  >
                    <td className="py-4 text-slate-600">
                      {label}
                    </td>
                    {scenarios.map((item) => (
                      <td
                        key={item.title}
                        className="py-4 text-right font-semibold"
                      >
                        {money(
                          item[
                            key as
                              | "payment"
                              | "balance"
                              | "cost"
                              | "interest"
                          ] as number
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Holding period result */}
          <section
            className={`rounded-2xl p-6 ${
              horizonSavings >= 0
                ? "border border-emerald-200 bg-emerald-50"
                : "border border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-sm font-semibold">
              Estimated Difference Over {holdingYears} Years
            </p>

            <p
              className={`mt-3 text-4xl font-bold ${
                horizonSavings >= 0
                  ? "text-emerald-800"
                  : "text-amber-800"
              }`}
            >
              {money(Math.abs(horizonSavings))}
            </p>

            <p className="mt-2 text-sm">
              {horizonSavings >= 0
                ? "Lower estimated borrowing costs with the refinance."
                : "Higher estimated borrowing costs with the refinance."}
            </p>

            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              This comparison includes scheduled payments,
              the remaining mortgage balance at the end of
              the holding period, and closing costs. It
              assumes the home has the same value under
              either scenario. It does not discount future
              cash flows or account for taxes, investment
              returns, prepayment penalties, or changes
              in escrow.
            </p>
          </section>
        </>
      )}
    </div>
  );
}