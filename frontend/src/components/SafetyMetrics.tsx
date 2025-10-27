import { Card } from "@/components/ui/card";
import { Shield, TrendingUp, Target } from "lucide-react";

export const SafetyMetrics = () => {
  return (
    <Card className="border-2 border-success/30 bg-success/5">
      <div className="border-b border-border p-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-success" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">Safety Metrics</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4">
          {/* CV Accuracy */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold font-mono text-primary">93.8%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              CV Accuracy
            </div>
          </div>

          {/* False Positive Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div className="text-3xl font-bold font-mono text-success">&lt; 5%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              False Positive
            </div>
          </div>

          {/* Detection Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-5 w-5 text-success" />
            </div>
            <div className="text-3xl font-bold font-mono text-success">98.2%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Detection Rate
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-card rounded border border-border">
          <p className="text-xs text-center text-muted-foreground">
            Model trained on 10,000+ GPR scans with validated ground truth data
          </p>
        </div>
      </div>
    </Card>
  );
};
