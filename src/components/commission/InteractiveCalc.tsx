import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Calculator, CalendarClock, Lock, Flame, Rocket, Crown, Plus, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productCatalog, setupFeeCatalog, tierConfig } from "@/data/catalog/commission";
import {
  calcDealCommission,
  currency,
  getNextTier,
  getPayoutDate,
  getTierForMrr,
  longDateFormat,
} from "@/lib/commission";
import type { Deal } from "@/types/commission";

const TIER_ICONS = [Lock, Flame, Rocket, Crown] as const;

function getTierIcon(tierLabel: string) {
  const idx = tierConfig.findIndex((t) => t.label === tierLabel);
  return TIER_ICONS[Math.max(0, idx)] ?? Lock;
}

interface LineItem {
  id: string;
  productId: string;
  quantity: number;
  overrideMrr: string;
}

function defaultLineItem(productId: string): LineItem {
  return {
    id: crypto.randomUUID(),
    productId,
    quantity: 1,
    overrideMrr: "",
  };
}

interface SetupFeeItem {
  id: string;
  feeId: string;
  amount: string;
}

function defaultSetupFeeItem(): SetupFeeItem {
  return {
    id: crypto.randomUUID(),
    feeId: "none",
    amount: "0",
  };
}

const INITIAL_PRODUCTS = ["brobot-one-core", "brobot-one-basic"];

interface InteractiveCalcProps {
  currentMRR?: number;
}

const InteractiveCalc = ({ currentMRR = 12400 }: InteractiveCalcProps) => {
  const reduceMotion = useReducedMotion();
  const [lineItems, setLineItems] = useState<LineItem[]>(() =>
    INITIAL_PRODUCTS.map((id) => defaultLineItem(id)),
  );
  const [setupFeeItems, setSetupFeeItems] = useState<SetupFeeItem[]>(() => [
    { id: crypto.randomUUID(), feeId: "deployment_standard", amount: "1500" },
  ]);

  const result = useMemo(() => {
    const products = lineItems.map((item) => {
      const product = productCatalog.find((p) => p.id === item.productId);
      const parsedOverride = item.overrideMrr ? Number(item.overrideMrr) : null;
      return {
        productId: item.productId,
        quantity: Math.max(item.quantity, 1),
        overrideMrr:
          product?.allowOverride && parsedOverride != null ? parsedOverride : null,
      };
    });
    const setupFeesForDeal = setupFeeItems
      .filter((item) => item.feeId && item.feeId !== "none")
      .map((item) => {
        const feeConfig = setupFeeCatalog.find((f) => f.id === item.feeId);
        const parsedAmount = item.amount ? Number(item.amount) : 0;
        return {
          type: item.feeId,
          actualAmount: parsedAmount || (feeConfig?.price ?? 0),
        };
      });
    const simulatedDeal: Deal = {
      id: "simulated-deal",
      repId: "simulated-rep",
      clientName: "Projected deal",
      ghlContactId: null,
      products,
      setupFees: setupFeesForDeal,
      closeDate: new Date().toISOString().slice(0, 10),
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };
    const summary = calcDealCommission(simulatedDeal);
    const nextMrr = currentMRR + summary.mrr;
    const currentTier = getTierForMrr(currentMRR);
    const projectedTier = getTierForMrr(nextMrr);
    const nextTier = getNextTier(nextMrr);
    const currentResidual = currentMRR * currentTier.rate;
    const projectedResidual = nextMrr * projectedTier.rate;
    const residualDelta = projectedResidual - currentResidual;

    return {
      summary,
      nextMrr,
      currentTier,
      projectedTier,
      nextTier,
      currentResidual,
      projectedResidual,
      residualDelta,
      payoutDate: getPayoutDate(simulatedDeal.closeDate),
    };
  }, [currentMRR, lineItems, setupFeeItems]);

  const addProduct = () => {
    setLineItems((prev) => [...prev, defaultLineItem(productCatalog[0].id)]);
  };

  const removeProduct = (id: string) => {
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const addSetupFee = () => {
    setSetupFeeItems((prev) => [...prev, defaultSetupFeeItem()]);
  };

  const removeSetupFee = (id: string) => {
    setSetupFeeItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const updateSetupFee = (id: string, updates: Partial<SetupFeeItem>) => {
    setSetupFeeItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const reset = () => {
    setLineItems(INITIAL_PRODUCTS.map((id) => defaultLineItem(id)));
    setSetupFeeItems([{ id: crypto.randomUUID(), feeId: "deployment_standard", amount: "1500" }]);
  };

  const tierDisplay =
    result.currentTier.label === result.projectedTier.label && result.nextTier
      ? `${result.currentTier.label} → ${result.nextTier.label}`
      : `${result.currentTier.label} → ${result.projectedTier.label}`;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="obsidian-card w-full min-w-0 overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/30 px-4 py-4 md:px-5 md:py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Calculator className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                Deal impact simulator
              </h2>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                Simulate your commission using the product catalog, setup fees, and residual tiers.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-5">
  <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1fr]">
    {/* LEFT COLUMN */}
    <div className="min-w-0">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Simulate your commission
      </h4>

      <div className="flex flex-col gap-2.5">
        {/* Products */}
        <div className="rounded-lg border border-border bg-secondary/10 p-2.5 md:px-3 md:py-2.5 shadow-sm">
          <label className="mb-1 block text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Products
          </label>
          <div className="flex flex-col gap-1.5">
            {lineItems.map((item) => {
              const product =
                productCatalog.find((p) => p.id === item.productId) ?? productCatalog[0];
              const defaultMrr = currency.format(product.commissionableMrr);

              return (
                <div
                  key={item.id}
                  className="flex min-w-0 w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-1.5"
                >
                  <Select
                    value={item.productId}
                    onValueChange={(v) => updateLineItem(item.id, { productId: v })}
                  >
                    <SelectTrigger className="h-9 min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground">
                      <SelectValue aria-label="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCatalog.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    aria-label="Quantity"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        quantity: Math.max(Number(e.target.value) || 1, 1),
                      })
                    }
                    className="h-9 w-14 min-w-[3.5rem] rounded-md border border-border bg-card px-2 text-center text-sm text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  {product.allowOverride ? (
                    <input
                      aria-label="Override MRR"
                      type="number"
                      min={0}
                      placeholder={defaultMrr}
                      value={item.overrideMrr}
                      onChange={(e) => updateLineItem(item.id, { overrideMrr: e.target.value })}
                      className="h-9 min-w-[5rem] flex-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  ) : (
                    <span className="flex min-w-[5rem] flex-1 items-center rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-sm font-medium text-foreground">
                      {defaultMrr}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(item.id)}
                    disabled={lineItems.length <= 1}
                    aria-label="Remove product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-1.5 h-8" onClick={addProduct}>
            <Plus className="h-3 w-3" />
            Add product
          </Button>
        </div>

        {/* Setup fees */}
        <div className="rounded-lg border border-border bg-secondary/10 p-2.5 md:px-3 md:py-2.5 shadow-sm">
          <div className="mb-1 flex shrink-0 items-center gap-2">
            <label className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Setup fees
            </label>
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={addSetupFee}>
              <Plus className="h-3 w-3" />
              Add setup fee
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {setupFeeItems.map((item) => {
              const feeConfig = setupFeeCatalog.find((f) => f.id === item.feeId);
              const hasFee = item.feeId && item.feeId !== "none";
              return (
                <div
                  key={item.id}
                  className="flex min-w-0 w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-1.5"
                >
                  <Select
                    value={item.feeId}
                    onValueChange={(v) => {
                      const config = setupFeeCatalog.find((f) => f.id === v);
                      updateSetupFee(item.id, {
                        feeId: v,
                        amount: config?.price ? String(config.price) : "0",
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground">
                      <SelectValue aria-label="Select setup fee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No setup fee</SelectItem>
                      {setupFeeCatalog.map((fee) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.name}
                          {fee.isVariable ? " (variable)" : ` — ${currency.format(fee.price)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    aria-label="Setup amount"
                    type="number"
                    min={0}
                    disabled={!hasFee}
                    value={item.amount}
                    onChange={(e) => updateSetupFee(item.id, { amount: e.target.value })}
                    className="h-9 w-20 min-w-[5rem] rounded-md border border-border bg-card px-2.5 text-sm text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSetupFee(item.id)}
                    disabled={setupFeeItems.length <= 1}
                    aria-label="Remove setup fee"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom metrics */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex flex-col justify-center rounded-lg border border-border bg-secondary/20 px-2.5 py-1.5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current MRR</p>
            <p className="mt-0.5 font-mono-tabular text-lg font-bold text-foreground">
              {currency.format(currentMRR)}
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-border bg-secondary/20 px-2.5 py-1.5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current tier</p>
            <p className="mt-0.5 flex items-center gap-1 text-lg font-bold text-foreground">
              {(() => {
                const Icon = getTierIcon(result.currentTier.label);
                return <Icon className="h-5 w-5" />;
              })()}
              {result.currentTier.label}
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-border bg-secondary/20 px-2.5 py-1.5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Future tier</p>
            <p className="mt-0.5 flex items-center gap-1 text-lg font-bold text-primary">
              {(() => {
                const Icon = getTierIcon(result.projectedTier.label);
                return <Icon className="h-5 w-5" />;
              })()}
              {result.projectedTier.label}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* RIGHT COLUMN */}
    <div className="min-w-0">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Deal impact
      </h4>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          <div className="self-start rounded-xl border border-primary/25 bg-primary/5 p-2.5 md:p-3 shadow-sm">
          <p className="mb-0.5 text-sm uppercase tracking-wider text-muted-foreground">
            Upfront commission
          </p>
          <motion.p
            key={result.summary.totalCommission}
            initial={reduceMotion ? false : { y: 10, opacity: 0 }}
            animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
            className="font-mono-tabular text-3xl font-bold text-primary md:text-4xl"
          >
            {currency.format(result.summary.totalCommission)}
          </motion.p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {currency.format(result.summary.upfrontCommission)} from product +{" "}
            {currency.format(result.summary.setupCommission)} from setup
          </p>
        </div>

        <div className="self-start rounded-xl border border-accent/25 bg-accent/5 p-2.5 md:p-3 shadow-sm">
          <p className="mb-0.5 text-sm uppercase tracking-wider text-muted-foreground">
            Projected MRR
          </p>
          <motion.p
            key={result.nextMrr}
            initial={reduceMotion ? false : { y: 10, opacity: 0 }}
            animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
            className="font-mono-tabular text-3xl font-bold text-accent md:text-4xl"
          >
            {currency.format(result.nextMrr)}
          </motion.p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            +{currency.format(result.summary.mrr)} added to the active book
          </p>
        </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-2.5 md:p-3">
          <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">
              Residual projection
            </p>
            <span className="text-sm font-bold text-muted-foreground">
              {(result.currentTier.rate * 100).toFixed(0)}% now →{" "}
              {(result.projectedTier.rate * 100).toFixed(0)}% after deal
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <motion.p
              key={result.projectedResidual}
              initial={reduceMotion ? false : { y: 10, opacity: 0 }}
              animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
              className="font-mono-tabular text-3xl font-bold text-foreground md:text-4xl"
            >
              {currency.format(result.projectedResidual)}
              <span className="text-sm text-muted-foreground">/mo</span>
            </motion.p>
            <p className="text-sm text-muted-foreground">
              Current run rate is {currency.format(result.currentResidual)}/mo
              {result.residualDelta !== 0 && (
                <span className="ml-1 font-medium text-primary">
                  ({result.residualDelta > 0 ? "+" : ""}
                  {currency.format(result.residualDelta)})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-lg border border-border bg-card/60 p-2.5 md:p-3">
          <div className="mb-1 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-accent" />
            <p className="text-sm uppercase tracking-wider text-muted-foreground">
              Projected payout
            </p>
          </div>
          <p className="text-base font-semibold text-foreground">
            {longDateFormat.format(result.payoutDate)}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            Close today, wait 5 days, then land on the next 1st or 15th.
          </p>
        </div>

          <div
            className={`flex h-full flex-col rounded-lg border px-2.5 py-2.5 md:px-3 md:py-3 ${
            result.projectedTier.label !== result.currentTier.label
              ? "border-accent/30 bg-accent/10"
              : "border-border bg-card/60"
          }`}
        >
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm uppercase tracking-wider text-muted-foreground">
              Tier impact
            </p>
          </div>
          <p className="text-base font-semibold text-foreground">{tierDisplay}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {result.nextTier
              ? `${currency.format(result.nextTier.mrr - result.nextMrr)} more MRR to the next unlock after this deal.`
              : "This deal keeps you at the top residual tier."}
          </p>
        </div>
        </div>
      </div>
    </div>
  </div>
      </div>
    </motion.div>
  );
};

export default InteractiveCalc;
