import { useMemo } from "react";
import {
  Bar,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { calcDealCommission, compactCurrency } from "@/lib/commission";
import type { Deal } from "@/types/commission";

const CHART_CONFIG = {
  monthly: { label: "Monthly", color: "hsl(var(--primary))" },
  rolling: { label: "90-day avg", color: "hsl(var(--primary))" },
} as const;

/** Build real 3-month commission history from deals. */
function buildRealMonthlyData(deals: Deal[]) {
  const now = new Date();
  const months: { month: string; year: number; monthNum: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      year: d.getFullYear(),
      monthNum: d.getMonth(),
    });
  }

  const monthlyValues = months.map((m) => {
    const monthDeals = deals.filter((deal) => {
      if (deal.status === "cancelled") return false;
      const [y, mo] = deal.closeDate.split("-").map(Number);
      return y === m.year && mo === m.monthNum + 1;
    });
    return monthDeals.reduce(
      (sum, deal) => sum + calcDealCommission(deal).totalCommission,
      0,
    );
  });

  const rolling: number[] = [];
  for (let i = 0; i < 3; i++) {
    const slice = monthlyValues.slice(0, i + 1);
    rolling.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }

  return months.map((m, i) => ({
    month: m.month,
    monthly: Math.round(monthlyValues[i]!),
    rolling: Math.round(rolling[i]!),
  }));
}

/** Fallback simulation when no deal data available */
function buildSimulatedData(residualMonthly: number, lastMonthPayout: number) {
  const now = new Date();
  const months: { month: string }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.toLocaleDateString("en-US", { month: "short" }) });
  }

  const monthlyValues: number[] = [];
  if (residualMonthly > 0) {
    const base = Math.max(lastMonthPayout * 0.5, residualMonthly * 0.25);
    for (let i = 0; i < 3; i++) {
      const t = i / 2;
      const v = base + (residualMonthly - base) * Math.pow(t, 0.6);
      monthlyValues.push(v);
    }
    monthlyValues[2] = residualMonthly;
  } else {
    const peak = Math.max(lastMonthPayout * 0.5, 1500);
    for (let i = 0; i < 3; i++) {
      monthlyValues.push(peak * Math.pow(i / 2, 1.2));
    }
  }

  const rolling: number[] = [];
  for (let i = 0; i < 3; i++) {
    const slice = monthlyValues.slice(0, i + 1);
    rolling.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }

  return months.map((m, i) => ({
    ...m,
    monthly: Math.round(monthlyValues[i]!),
    rolling: Math.round(rolling[i]!),
  }));
}

interface Rolling90DayChartProps {
  residualMonthly?: number;
  lastMonthPayout: number;
  commissionDelta?: number;
  pctChange?: number;
  currentValue?: number;
  title?: string;
  compact?: boolean;
  /** Real deal data for accurate historical chart. When provided, overrides simulation. */
  deals?: Deal[];
}

export default function Rolling90DayChart({
  residualMonthly = 0,
  lastMonthPayout,
  commissionDelta = 0,
  pctChange = 0,
  currentValue,
  title = "Last 90 days",
  compact = false,
  deals,
}: Rolling90DayChartProps) {
  const data = useMemo(() => {
    if (deals && deals.length > 0) {
      return buildRealMonthlyData(deals);
    }
    const trendValue = currentValue ?? residualMonthly;
    return buildSimulatedData(trendValue, lastMonthPayout);
  }, [deals, currentValue, residualMonthly, lastMonthPayout]);

  const maxVal = Math.max(...data.map((d) => d.monthly), 1);
  const showVs = lastMonthPayout > 0 && Math.abs(commissionDelta) >= 1;

  return (
    <div className={compact ? "w-full" : "mt-3 w-full max-w-[200px]"}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {showVs && (
          <p className={`text-[10px] font-semibold tabular-nums ${(commissionDelta ?? 0) >= 0 ? "text-primary" : "text-amber-500"}`}>
            {(commissionDelta ?? 0) >= 0 ? "+" : ""}
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(commissionDelta ?? 0)}{" "}
            ({(pctChange ?? 0) >= 0 ? "+" : ""}{(pctChange ?? 0).toFixed(0)}%)
          </p>
        )}
      </div>
      <ChartContainer
        config={CHART_CONFIG}
        className="h-[72px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground"
      >
        <ComposedChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 9 }}
            interval={0}
          />
          <YAxis hide domain={[0, maxVal * 1.2]} />
          <Tooltip
            contentStyle={{
              borderRadius: "6px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              fontSize: "11px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "monthly") return [compactCurrency.format(value), "Monthly"];
              return [compactCurrency.format(value), "90-day avg"];
            }}
          />
          <Bar
            dataKey="monthly"
            fill="hsl(var(--primary) / 0.7)"
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
          />
          <Line
            type="monotone"
            dataKey="rolling"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 2 }}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ChartContainer>
      {deals && deals.length > 0 ? (
        <p className="text-[9px] text-muted-foreground mt-1 text-center">Commission booked per month</p>
      ) : showVs ? (
        <p className="text-[9px] text-muted-foreground mt-1 text-center">Added vs last month</p>
      ) : null}
    </div>
  );
}
