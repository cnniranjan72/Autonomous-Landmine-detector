import { useEffect, useState } from "react";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusBarProps {
  isConnected: boolean;
  selectedModel: string;
}

export const StatusBar = ({ isConnected, selectedModel }: StatusBarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-success" />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm font-semibold">
                {isConnected ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                Model: <span className="text-foreground font-medium">{selectedModel}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">
              {currentTime.toLocaleTimeString()}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {currentTime.toLocaleDateString()}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
