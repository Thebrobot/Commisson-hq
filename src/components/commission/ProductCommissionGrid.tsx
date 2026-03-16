import { motion, useReducedMotion } from "framer-motion";
import { Repeat, Zap } from "lucide-react";
import { productCatalog, setupFeeCatalog } from "@/data/catalog/commission";
import { currency, preciseCurrency } from "@/lib/commission";

const ProductCommissionGrid = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-6">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="obsidian-card p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Repeat className="h-4 w-4 text-primary" strokeWidth={2.5} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recurring commission catalog
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Monthly products pay 1x commissionable MRR upfront and stack toward residual tiers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {productCatalog.map((product, i) => (
            <motion.div
              key={product.id}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`flex items-center justify-between rounded-lg border p-4 snap-transition ${
                product.commissionableMrr >= 497 ? "border-primary/20 bg-primary/5" : "border-border bg-secondary/20"
              }`}
            >
              <div className="min-w-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                    {product.commissionableMrr >= 497 && (
                      <span className="flex items-center gap-0.5 text-sm font-bold uppercase tracking-widest text-accent">
                        <Zap className="h-3 w-3" strokeWidth={3} />
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Default {preciseCurrency.format(product.defaultMrr)}
                    {product.perUnit ? " per unit" : " monthly"}
                    {product.allowOverride ? " · override allowed" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="font-mono-tabular text-sm font-bold text-primary">
                  {preciseCurrency.format(product.commissionableMrr)}
                </p>
                <p className="text-sm text-muted-foreground">Commissionable MRR</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
          <p className="text-sm text-primary/80">
            RevuBro Growth and Pro use reduced commissionable MRR, while Brobot One Basic supports per-deal MRR overrides.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="obsidian-card p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-accent" strokeWidth={2.5} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Setup fee commissions
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Setup fees pay a fixed percentage on the actual amount sold.
        </p>

        <div className="space-y-3">
          {setupFeeCatalog.map((item, i) => (
            <motion.div
              key={`${item.id}-${i}`}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Client pays: {item.isVariable ? "Variable amount" : currency.format(item.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono-tabular text-sm font-bold text-accent">
                  {(item.commissionRate * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">of actual amount</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductCommissionGrid;
