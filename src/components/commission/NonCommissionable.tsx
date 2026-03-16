import { motion } from "framer-motion";
import { Ban } from "lucide-react";
import { nonCommissionableItems } from "@/data/catalog/commission";

const NonCommissionable = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="obsidian-card p-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <Ban className="h-4 w-4 text-destructive" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Exclusions and watch-outs
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        These items are not part of the current commission plan unless leadership defines an exception.
      </p>

      <div className="space-y-2">
        {nonCommissionableItems.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="rounded-lg border border-border/50 bg-background/30 px-4 py-3"
          >
            <p className="text-sm font-medium text-foreground">{item.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default NonCommissionable;
