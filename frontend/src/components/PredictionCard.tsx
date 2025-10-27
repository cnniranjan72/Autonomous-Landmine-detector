import { AlertTriangle, CheckCircle2, Skull } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PredictionCardProps {
  prediction: "mine" | "clear" | null;
  confidence: number;
  isActive: boolean;
}

export const PredictionCard = ({ prediction, confidence, isActive }: PredictionCardProps) => {
  const isMineDetected = prediction === "mine";

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-300",
        isMineDetected
          ? "border-destructive bg-destructive/10 pulse-danger"
          : prediction === "clear"
          ? "border-success bg-success/10 pulse-success"
          : "border-border bg-card"
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Detection Status
          </h2>
          {isActive && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success">SCANNING</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center py-8">
          {isMineDetected ? (
            <div className="text-center">
              <Skull className="h-20 w-20 text-destructive mx-auto mb-4 animate-pulse" />
              <div className="text-4xl font-bold text-destructive mb-2">
                MINE DETECTED
              </div>
              <div className="text-destructive/80 font-semibold uppercase tracking-wide">
                ⚠️ EXTREME THREAT ⚠️
              </div>
            </div>
          ) : prediction === "clear" ? (
            <div className="text-center">
              <CheckCircle2 className="h-20 w-20 text-success mx-auto mb-4" />
              <div className="text-4xl font-bold text-success mb-2">
                AREA CLEAR
              </div>
              <div className="text-success/80 font-semibold uppercase tracking-wide">
                No Threat Detected
              </div>
            </div>
          ) : (
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <div className="text-2xl font-semibold text-muted-foreground mb-2">
                AWAITING DATA
              </div>
              <div className="text-muted-foreground/60 text-sm uppercase tracking-wide">
                Initialize Scan
              </div>
            </div>
          )}
        </div>

        {prediction && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground uppercase tracking-wide">
                Confidence Level
              </span>
              <span
                className={cn(
                  "text-2xl font-bold font-mono",
                  isMineDetected ? "text-destructive" : "text-success"
                )}
              >
                {confidence.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  isMineDetected ? "bg-destructive" : "bg-success"
                )}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
