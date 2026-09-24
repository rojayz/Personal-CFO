
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

type ChartPoint = {
  month: number;
  existing: number;
  refinance: number;
};

type MortgageChartProps = {
  title: string;
  description: string;
  points: ChartPoint[];
  breakEvenMonth?: number | null;
};

function MortgageChart({
  title,
  description,
  points,
  breakEvenMonth,
}: MortgageChartProps) {
  if (points.length === 0) return null;

  // SVG chart dimensions
  const left = 88;
  const right = 728;
  const top = 24;
  const bottom = 220;

  const plotWidth = right - left;
  const plotHeight = bottom - top;

  const lastMonth = Math.max(
    1,
    points[points.length - 1].month
  );

  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [
      point.existing,
      point.refinance,
    ])
  );

  // Add some space above the highest line.
  const ceiling = maxValue * 1.1;

  const x = (month: number) =>
    left + (month / lastMonth) * plotWidth;

  const y = (value: number) =>
    bottom - (value / ceiling) * plotHeight;

  function makeLine(
    key: "existing" | "refinance"
  ) {
    return points
      .map(
        (point) =>
          `${x(point.month)},${y(point[key])}`
      )
      .join(" ");
  }

  const compactMoney = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  const showBreakEven =
    breakEvenMonth != null &&
    breakEvenMonth > 0 &&
    breakEvenMonth <= lastMonth;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-5 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-1 w-7 rounded bg-slate-600" />
          <span>Existing mortgage</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-1 w-7 rounded bg-emerald-600" />
          <span>Refinance</span>
        </div>

        {showBreakEven && (
          <div className="flex items-center gap-2">
            <span className="h-4 border-l-2 border-dashed border-amber-500" />
            <span>First break-even month</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="mt-5 w-full overflow-x-auto">
        <svg
          viewBox="0 0 760 270"
          className="h-auto min-w-[360px] w-full"
          role="img"
          aria-label={title}
        >
          <title>{title}</title>

          {/* Horizontal gridlines and money labels */}
          {[0, 1, 2, 3, 4].map((tick) => {
            const value = (ceiling * tick) / 4;
            const position = y(value);

            return (
              <g key={`y-${tick}`}>
                <line
                  x1={left}
                  x2={right}
                  y1={position}
                  y2={position}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />

                <text
                  x={left - 12}
                  y={position + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="12"
                >
                  {compactMoney(value)}
                </text>
              </g>
            );
          })}

          {/* Timeline labels */}
          {[0, 1, 2, 3, 4].map((tick) => {
            const month = (lastMonth * tick) / 4;
            const years = month / 12;

            return (
              <text
                key={`x-${tick}`}
                x={x(month)}
                y={bottom + 23}
                textAnchor="middle"
                fill="#64748b"
                fontSize="12"
              >
                {Number(years.toFixed(1))}y
              </text>
            );
          })}

          {/* Existing mortgage line */}
          <polyline
            points={makeLine("existing")}
            fill="none"
            stroke="#475569"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Refinance line */}
          <polyline
            points={makeLine("refinance")}
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Break-even marker */}
          {showBreakEven && (
            <g>
              <line
                x1={x(breakEvenMonth)}
                x2={x(breakEvenMonth)}
                y1={top}
                y2={bottom}
                stroke="#d97706"
                strokeWidth="2"
                strokeDasharray="5 5"
              />

              <text
                x={x(breakEvenMonth)}
                y={top - 8}
                textAnchor="middle"
                fill="#b45309"
                fontSize="12"
                fontWeight="600"
              >
                Month {breakEvenMonth}
              </text>
            </g>
          )}

          <text
            x={(left + right) / 2}
            y="263"
            textAnchor="middle"
            fill="#64748b"
            fontSize="12"
          >
            Years from today
          </text>
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
        <span className="text-slate-500">
          At the end of the selected period
        </span>

        <div className="flex flex-wrap gap-5">
          <span>
            Existing:{" "}
            <strong>
              {money(points[points.length - 1].existing)}
            </strong>
          </span>

          <span>
            Refinance:{" "}
            <strong>
              {money(points[points.length - 1].refinance)}
            </strong>
          </span>
        </div>
      </div>
    </section>
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

  
  // Generate monthly chart data for both mortgages.
  const chartData = invalid
    ? []
    : Array.from(
        { length: horizon + 1 },
        (_, month) => {
          // Total financing cost to date:
          // payments + remaining debt + upfront costs
          // minus the original outstanding principal.
          //
          // This equals accrued interest and
          // refinance fees over the selected period.

          const existingCost =
            costAtMonth(
              balance,
              currentRate,
              oldMonths,
              month,
              0
            ) - balance;

          const refinanceCost =
            costAtMonth(
              financedPrincipal,
              newRate,
              newMonths,
              month,
              upfrontCosts
            ) - balance;

          const existingBalance = remainingBalance(
            balance,
            currentRate,
            oldMonths,
            month
          );

          const refinanceBalance = remainingBalance(
            financedPrincipal,
            newRate,
            newMonths,
            month
          );

          return {
            month,
            costs: {
              existing: Math.max(0, existingCost),
              refinance: Math.max(0, refinanceCost),
            },
            balances: {
              existing: existingBalance,
              refinance: refinanceBalance,
            },
          };
        }
      );

  const costChart: ChartPoint[] = chartData.map(
    (point) => ({
      month: point.month,
      ...point.costs,
    })
  );

  const balanceChart: ChartPoint[] = chartData.map(
    (point) => ({
      month: point.month,
      ...point.balances,
    })
  );

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
          
          {/* Interactive mortgage charts */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">
                Mortgage Comparison Over Time
              </h2>

              <p className="mt-2 text-slate-500">
                Visualize how each mortgage performs
                over your expected time in the home.
              </p>
            </div>

            <MortgageChart
              title="Cumulative Borrowing Costs"
              description="Interest incurred plus refinance closing costs. Lower is better when comparing borrowing costs over the same period."
              points={costChart}
              breakEvenMonth={breakEvenMonth}
            />

            <MortgageChart
              title="Remaining Mortgage Balance"
              description="The outstanding principal on each mortgage. This amount generally must be repaid when the property is sold."
              points={balanceChart}
            />
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