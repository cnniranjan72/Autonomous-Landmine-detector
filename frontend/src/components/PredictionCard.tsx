import { AlertTriangle, CheckCircle2, Skull } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PredictionCardProps {
  prediction: "mine" | "clear" | null;
  confidence: number;
  isActive: boolean;
  severityScore?: number | null;    // 0..1
  severityLevel?: string | null;    // LOW/MODERATE/HIGH/CRITICAL
  severityColor?: string | null;    // hex color
}

export const PredictionCard = ({
  prediction,
  confidence,
  isActive,
  severityScore = null,
  severityLevel = null,
  severityColor = null,
}: PredictionCardProps) => {
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

        {/* Compact Threat Level Card at top-right of detection card */}
        {severityLevel && severityScore !== null && (
          <div className="mb-4 flex items-center justify-center">
            <div className="w-full max-w-xs p-3 rounded-lg border border-border bg-black/40 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Threat</div>
                <div className="font-semibold">{severityLevel}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Severity</div>
                <div className="font-mono font-bold text-lg">{(severityScore * 100).toFixed(0)}%</div>
              </div>
              <div style={{ width: 10, height: 40, background: severityColor ?? "#999", borderRadius: 4, marginLeft: 8 }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-center py-6">
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

            {/* Severity bar under confidence */}
            {severityScore !== null && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground uppercase">Threat Severity</span>
                  <span className="text-xs font-mono">{(severityScore * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-3 bg-border rounded overflow-hidden">
                  <div style={{ width: `${(severityScore * 100).toFixed(0)}%`, background: severityColor ?? "#999" }} className="h-full transition-all" />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {severityLevel} — {severityScore !== null ? `${(severityScore * 100).toFixed(0)}%` : ""}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
