import { motion } from "framer-motion";
import { DollarSign, Calculator } from "lucide-react";

interface QuickSimProps {
  currentMRR?: number;
}

const QuickSim = ({ currentMRR = 12400 }: QuickSimProps) => {
  // Simulate selling one of each hot product
  const scenarios = [
    { product: "Agent Broski (Ai Receptionist)", mrc: 852, newMRR: currentMRR + 852 },
    { product: "Agent Broski (Ai Voice + SMS)", mrc: 1042, newMRR: currentMRR + 1042 },
    { product: "Brobot One Core", mrc: 297, newMRR: currentMRR + 297 },
  ];

  const getResidualRate = (mrr: number) => {
    if (mrr >= 35000) return 0.2;
    if (mrr >= 20000) return 0.15;
    if (mrr >= 10000) return 0.1;
    return 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="obsidian-card p-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="h-4 w-4 text-primary" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Quick Math
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        What happens if you close one more deal right now?
      </p>

      <div className="space-y-3">
        {scenarios.map((s, i) => {
          const upfront = s.mrc;
          const newRate = getResidualRate(s.newMRR);
          const monthlyResidual = s.newMRR * newRate;

          return (
            <motion.div
              key={s.product}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="rounded-lg border border-border bg-secondary/20 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{s.product}</p>
                <span className="text-sm uppercase tracking-widest text-muted-foreground">If you close</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">Upfront</p>
                  <p className="font-mono-tabular text-sm font-bold text-primary">${upfront}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">New MRR</p>
                  <p className="font-mono-tabular text-sm font-bold text-foreground">${s.newMRR.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">Monthly Residual</p>
                  <p className="font-mono-tabular text-sm font-bold text-accent">${monthlyResidual.toLocaleString()}/mo</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <DollarSign className="h-3 w-3" />
        <span>Residuals = passive income on your entire active MRR book</span>
      </div>
    </motion.div>
  );
};

export default QuickSim;
