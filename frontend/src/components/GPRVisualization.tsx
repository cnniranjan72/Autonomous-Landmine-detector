import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useEffect, useRef } from "react";

export const GPRVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Simulate GPR radargram data
    const drawRadargram = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = "rgba(59, 130, 246, 0.1)";
      ctx.lineWidth = 1;
      
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Simulate GPR signal with anomaly
      ctx.lineWidth = 2;
      
      for (let x = 0; x < width; x += 2) {
        const time = Date.now() * 0.001;
        const baseSignal = Math.sin(x * 0.1 + time) * 20;
        
        // Add anomaly in the middle (simulating buried object)
        const anomalyX = width * 0.6;
        const anomalyWidth = 80;
        const distanceFromAnomaly = Math.abs(x - anomalyX);
        
        let anomalyStrength = 0;
        if (distanceFromAnomaly < anomalyWidth) {
          anomalyStrength = (1 - distanceFromAnomaly / anomalyWidth) * 60;
        }
        
        // Draw signal lines
        for (let depth = 0; depth < height; depth += 4) {
          const depthFactor = depth / height;
          const signal = baseSignal + anomalyStrength * (1 - Math.abs(depthFactor - 0.4));
          const noise = (Math.random() - 0.5) * 10;
          
          const intensity = Math.abs(signal + noise);
          const normalizedIntensity = Math.min(intensity / 50, 1);
          
          // Color based on intensity (blue to red for anomalies)
          if (anomalyStrength > 20 && depthFactor > 0.3 && depthFactor < 0.5) {
            ctx.fillStyle = `rgba(239, 68, 68, ${normalizedIntensity})`;
          } else {
            ctx.fillStyle = `rgba(59, 130, 246, ${normalizedIntensity * 0.6})`;
          }
          
          ctx.fillRect(x, depth, 2, 4);
        }
      }

      // Draw anomaly indicator
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const anomalyY = height * 0.4;
      ctx.strokeRect(width * 0.6 - 40, anomalyY - 30, 80, 60);
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = "#ef4444";
      ctx.font = "12px monospace";
      ctx.fillText("ANOMALY DETECTED", width * 0.6 - 30, anomalyY - 40);
    };

    drawRadargram();
    const interval = setInterval(drawRadargram, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-2 border-primary/30">
      <div className="border-b border-border p-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">GPR Radargram</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success">LIVE</span>
        </div>
      </div>
      <div className="p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-[200px] rounded border border-border bg-background/50"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Depth: 0-2m</span>
          <span>Resolution: 5cm</span>
          <span>Frequency: 500MHz</span>
        </div>
      </div>
    </Card>
  );
};
