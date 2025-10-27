import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Settings } from "lucide-react";

interface ControlPanelProps {
  isScanning: boolean;
  onToggleScan: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export const ControlPanel = ({
  isScanning,
  onToggleScan,
  selectedModel,
  onModelChange,
}: ControlPanelProps) => {
  return (
    <Card className="border-2 border-primary/30">
      <div className="border-b border-border p-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">Control Panel</h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Scan Control */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
            Scan Control
          </label>
          <Button
            onClick={onToggleScan}
            size="lg"
            className={
              isScanning
                ? "w-full bg-destructive hover:bg-destructive/90 glow-primary"
                : "w-full bg-success hover:bg-success/90 glow-primary"
            }
          >
            {isScanning ? (
              <>
                <Square className="mr-2 h-5 w-5" />
                STOP SCAN
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                START SCAN
              </>
            )}
          </Button>
        </div>

        {/* Model Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
            Detection Model
          </label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LogisticRegression + PCA">
                LogisticRegression + PCA
              </SelectItem>
              <SelectItem value="RandomForest + PCA">
                RandomForest + PCA
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* System Info */}
        <div className="pt-4 border-t border-border">
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Status:</span>
              <span className="font-semibold text-success">OPERATIONAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Connection:</span>
              <span className="font-semibold text-success">READY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scan Mode:</span>
              <span className="font-semibold">CONTINUOUS</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
