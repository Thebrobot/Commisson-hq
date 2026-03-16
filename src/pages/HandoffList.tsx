import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, ClipboardCheck, AlertCircle, Check, ChevronRight, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { handoffToolItems, handoffProductColumns } from "@/data/handoffToolbox";
import {
  defaultHandoff,
  HANDOFF_ITEMS,
  handoffProgress,
  isHandoffComplete,
} from "@/lib/handoff";
import { useDashboard } from "@/providers/DashboardProvider";

const HandoffList = () => {
  const reduceMotion = useReducedMotion();
  const { deals, reps } = useDashboard();

  const pendingHandoffs = useMemo(() => {
    const active = deals.filter((d) => d.status === "active");
    return active
      .filter((d) => !isHandoffComplete(d.handoff ?? defaultHandoff))
      .map((deal) => {
        const rep = reps.find((r) => r.id === deal.repId);
        const progress = handoffProgress(deal.handoff ?? defaultHandoff);
        return { deal, rep: rep ?? { id: deal.repId, name: "Unknown", email: "", avatar: "" }, progress };
      });
  }, [deals, reps]);

  const completedHandoffs = useMemo(() => {
    const active = deals.filter((d) => d.status === "active");
    return active
      .filter((d) => isHandoffComplete(d.handoff ?? defaultHandoff))
      .map((deal) => {
        const rep = reps.find((r) => r.id === deal.repId);
        const completedAt = deal.handoff?.completedAt;
        return { deal, rep: rep ?? { id: deal.repId, name: "Unknown", email: "", avatar: "" }, completedAt };
      })
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  }, [deals, reps]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative space-y-12"
    >
      {/* Subtle gradient blur orbs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />

      {/* Page header */}
      <div className="relative">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/25"
          >
            <ClipboardCheck className="h-6 w-6 text-white" strokeWidth={2.5} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Handoff Hub
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Complete order handoffs, manage pending work, and access sales links.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Needs attention — full width, prominent */}
      <section className="relative">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">
            Needs attention
          </h3>
          {pendingHandoffs.length > 0 && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-500">
              {pendingHandoffs.length}
            </span>
          )}
        </div>
        {pendingHandoffs.length > 0 ? (
          <div className="rounded-2xl border border-amber-500/25 bg-card shadow-sm">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-colors hover:bg-amber-500/5 [&[data-state=open]]:rounded-b-none [&[data-state=open]]:border-b [&[data-state=open]]:border-amber-500/20 [&[data-state=open]]:bg-amber-500/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <span className="font-semibold text-foreground">
                    {pendingHandoffs.length} client{pendingHandoffs.length !== 1 ? "s" : ""} need{pendingHandoffs.length === 1 ? "s" : ""} handoff attention
                  </span>
                </div>
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 border-t border-amber-500/20 bg-muted/20 p-4">
                  {pendingHandoffs.map(({ deal, rep, progress }) => (
                    <Link
                      key={deal.id}
                      to={`/clients/${deal.id}/handoff`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                          {deal.clientName}
                        </h4>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {rep.name} · {progress}/{HANDOFF_ITEMS.length} complete
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-muted/30 px-6 py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">All caught up — no pending handoffs</p>
            <p className="mt-1 text-xs text-muted-foreground">New orders will appear here when they need attention.</p>
          </div>
        )}
      </section>

      {/* Section 2: Completed — collapsible dropdown */}
      <section className="relative">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">
            Completed
          </h3>
          {completedHandoffs.length > 0 && (
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-500">
              {completedHandoffs.length}
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-colors hover:bg-muted/30 [&[data-state=open]]:rounded-b-none [&[data-state=open]]:border-b [&[data-state=open]]:border-border [&[data-state=open]]:bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-foreground">
                  {completedHandoffs.length} handoff{completedHandoffs.length !== 1 ? "s" : ""} complete
                </span>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 border-t border-border bg-muted/20 p-4">
                {completedHandoffs.length > 0 ? (
                  completedHandoffs.map(({ deal, rep, completedAt }) => (
                    <Link
                      key={deal.id}
                      to={`/clients/${deal.id}/handoff`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                          {deal.clientName}
                        </h4>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {rep.name}
                          {completedAt && (
                            <span className="ml-1">
                              · {new Date(completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No completed handoffs yet. Clients will appear here once their onboarding checklist is finished.
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      {/* Section 3: Tools */}
      <section className="relative">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-foreground">
          Tools
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {handoffToolItems.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.a
                key={tool.title}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool.title}
                    </h4>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      Open link
                      <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </section>

      {/* Section 3: Order links — reference, de-emphasized */}
      <section className="relative">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Order links
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {handoffProductColumns.map((column, colIdx) => (
            <motion.div
              key={column.title}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + colIdx * 0.08 }}
              className="flex flex-col gap-3"
            >
              <h4 className="rounded-full bg-muted/80 px-4 py-1.5 text-sm font-bold text-foreground w-fit">
                {column.title}
              </h4>
              <div className="flex flex-col gap-2">
                {column.products.map((product, i) => {
                  const Icon = product.icon;
                  return (
                    <motion.a
                      key={product.id}
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + colIdx * 0.1 + i * 0.05 }}
                      whileHover={reduceMotion ? undefined : { x: 4, scale: 1.01 }}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card/90"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {product.name}
                        </h5>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          Sales link
                          <ExternalLink className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-70" />
                        </span>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default HandoffList;
