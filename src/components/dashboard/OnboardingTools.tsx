import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handoffTools } from "@/data/handoffTools";

const OnboardingTools = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">
          Handoff Hub
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1"
          onClick={() => navigate("/handoff")}
          asChild
        >
          <Link to="/handoff">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {handoffTools.map((tool, i) => {
          const Icon = tool.icon;
          return (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            whileHover={{ y: -3 }}
            className="obsidian-card group p-4"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 snap-transition rounded-xl" />
            <div className="relative z-10">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">{tool.title}</h4>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{tool.description}</p>
              <Button
                variant="obsidian"
                size="sm"
                className="w-full"
                aria-label={tool.cta}
                onClick={() => tool.title === "Onboard Checklist" && navigate("/handoff")}
              >
                {tool.cta}
              </Button>
            </div>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingTools;
