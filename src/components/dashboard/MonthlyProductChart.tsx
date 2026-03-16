import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  buildMonthlyProductData,
  compactCurrency,
  getProductById,
} from "@/lib/commission";
import type { Deal } from "@/types/commission";

const CHART_CONFIG = {} as const;

interface MonthlyProductChartProps {
  deals: Deal[];
  monthLabel?: string;
}

export default function MonthlyProductChart({
  deals,
  monthLabel,
}: MonthlyProductChartProps) {
  const { data, products } = useMemo(
    () => buildMonthlyProductData(deals),
    [deals],
  );

  const monthName = monthLabel ?? new Date().toLocaleDateString("en-US", { month: "long" });

  if (products.length === 0 || data.length === 0) {
    return (
      <div className="w-full py-6 text-center">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          {monthName} product sales
        </p>
        <p className="text-sm text-muted-foreground">No product sales this month yet</p>
      </div>
    );
  }

  const todayLabel = data.find((d) => d.isToday)?.dateLabel;

  return (
    <div className="w-full">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
        {monthName} product sales
      </p>
      <ChartContainer
        config={CHART_CONFIG}
        className="h-[140px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground"
      >
        <LineChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 9 }}
            ticks={data.length > 15 ? data.filter((_, i) => i % 5 === 0).map((d) => d.dateLabel) : undefined}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 9 }}
            tickFormatter={(v) => compactCurrency.format(v)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              fontSize: "11px",
            }}
            labelFormatter={(label) => {
              const point = data.find((d) => d.dateLabel === label);
              return point?.isToday ? `${label} (today)` : (label ?? "");
            }}
            formatter={(value: number, name: string, props: { payload: Record<string, unknown> }) => {
              const productId = name;
              const qty = (props.payload[`${productId}_qty`] as number | undefined) ?? 0;
              const product = getProductById(productId);
              const productName = product?.name ?? productId;
              return [`${compactCurrency.format(value)} (${qty} sold)`, productName];
            }}
          />
          {todayLabel && (
            <ReferenceLine
              x={todayLabel}
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeDasharray="3 2"
              label={{
                value: "▼ Today",
                position: "top",
                fill: "hsl(var(--primary))",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}
          {products.map((p) => (
            <Line
              key={p.productId}
              type="monotone"
              dataKey={p.productId}
              stroke={p.color}
              strokeWidth={2}
              dot={{ fill: p.color, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: p.color, strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
