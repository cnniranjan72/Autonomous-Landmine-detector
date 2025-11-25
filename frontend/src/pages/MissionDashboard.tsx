// src/pages/MissionDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GPRVisualization } from "@/components/GPRVisualization";
import { PredictionLog, LogEntry } from "@/components/PredictionLog";
import { SafetyMetrics } from "@/components/SafetyMetrics";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { PieChart, Play, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";

/**
 * Mission Dashboard - Battle Ops Console (blue/green/red accents)
 * Widgets included:
 * - W2: GPR mini heatmap (uses GPRVisualization)
 * - W4: Threat Severity Gauge (Gauge)
 * - W5: Mission Summary Cards
 * - W6: Mini Safe Path Map (MiniGridPath)
 * - W7: Mine-Type Pie Chart (PieChartSVG)
 * - W8: GPR Scan Timeline (timeline strip)
 * - W10: Danger Heatmap (DangerHeatmap)
 *
 * The page fetches:
 * - recent detections (from your PredictionLog or simulated)
 * - current mission summary (simulated or from API)
 * - safe path (calls /path/generate)
 *
 * If any API fails (Mongo not ready), the UI falls back to simulated data.
 */

// ----------------------- Small helpers / types -----------------------
type MissionSummary = {
  total_scans: number;
  mines_found: number;
  mines_cleared: number;
  distance_m: number;
  uptime: string;
};

type HeatCell = { x: number; y: number; val: number };

// ----------------------- Gauge component (Threat Severity) -----------------------
const Gauge = ({ value = 0.28 }: { value?: number }) => {
  // value 0..1
  const angle = useMemo(() => 180 * Math.min(1, Math.max(0, value)), [value]);
  const color =
    value < 0.25 ? "#16a34a" : value < 0.5 ? "#f59e0b" : value < 0.75 ? "#f97316" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="200" height="110" viewBox="0 0 200 110">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor={color} />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* semicircle background */}
          <path
            d="M10 100 A90 90 0 0 1 190 100"
            stroke="#0b1220"
            strokeWidth="18"
            fill="none"
            strokeLinejoin="round"
          />
          {/* gauge arc - use strokeDasharray trick */}
          <path
            d="M10 100 A90 90 0 0 1 190 100"
            stroke="url(#g1)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${(angle / 180) * 283} 283`}
            transform="translate(0,0)"
          />
          {/* pointer */}
          <g transform={`translate(100,100) rotate(${angle - 90})`}>
            <rect x="-3" y="-2" width="2" height="-72" rx="2" fill={color} />
            <circle cx="0" cy="0" r="6" fill="#0b1220" stroke={color} strokeWidth="3" />
          </g>
          {/* labels */}
          <text x="100" y="95" textAnchor="middle" fontFamily="monospace" fontSize="14" fill="#a7b3c1">
            {(value * 100).toFixed(0)}%
          </text>
        </svg>
      </div>
      <div className="mt-2 text-sm text-muted-foreground uppercase tracking-wider">Threat Severity</div>
    </div>
  );
};

// ----------------------- Pie chart (mine-type distribution) -----------------------
const PieChartSVG = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let start = 0;
  return (
    <svg viewBox="0 0 200 200" width="200" height="200">
      <g transform="translate(100,100)">
        {data.map((d, i) => {
          const angle = (d.value / total) * Math.PI * 2;
          const x1 = Math.cos(start) * 80;
          const y1 = Math.sin(start) * 80;
          const x2 = Math.cos(start + angle) * 80;
          const y2 = Math.sin(start + angle) * 80;
          const large = angle > Math.PI ? 1 : 0;
          const path = `M 0 0 L ${x1} ${y1} A 80 80 0 ${large} 1 ${x2} ${y2} Z`;
          start += angle;
          return <path key={i} d={path} fill={d.color} stroke="#0b1220" strokeWidth={1} />;
        })}
      </g>
    </svg>
  );
};

// ----------------------- MiniGridPath: simplified safe-path preview -----------------------
const MiniGridPath = ({
  rows = 12,
  cols = 18,
  path = [] as number[][],
  mines = [] as { x: number; y: number; radius?: number }[],
  activePos,
}: {
  rows?: number;
  cols?: number;
  path?: number[][];
  mines?: { x: number; y: number; radius?: number }[];
  activePos?: number[];
}) => {
  const cell = 14;
  const gap = 2;
  const w = cols * (cell + gap);
  const h = rows * (cell + gap);

  // convert path to set
  const pathSet = new Set(path.map((p) => `${p[0]}-${p[1]}`));
  const mineSet = new Set(mines.map((m) => `${m.x}-${m.y}`));

  return (
    <div style={{ width: w, height: h, position: "relative" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
          gridTemplateRows: `repeat(${rows}, ${cell}px)`,
          gap: gap,
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const key = `${r}-${c}`;
            const isPath = pathSet.has(key);
            const isMine = mineSet.has(key);
            const isActive = activePos && activePos[0] === r && activePos[1] === c;
            const style: React.CSSProperties = {
              width: cell,
              height: cell,
              borderRadius: 4,
              boxSizing: "border-box",
              border: "1px solid rgba(255,255,255,0.03)",
              background: isMine ? "#ef4444" : isPath ? "#06b6d4" : "#071226",
              transform: isActive ? "scale(1.05)" : undefined,
              transition: "transform 150ms linear, background 180ms",
            };
            return <div key={key} style={style} />;
          })
        )}
      </div>

      {/* robot marker */}
      {activePos && (
        <div
          style={{
            position: "absolute",
            left: activePos[1] * (cell + gap),
            top: activePos[0] * (cell + gap),
            width: cell,
            height: cell,
            transform: "translate(0,0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 6, background: "#fff", boxShadow: "0 6px 18px rgba(2,6,23,0.6)" }} />
        </div>
      )}
    </div>
  );
};

// ----------------------- DangerHeatmap (canvas) -----------------------
const DangerHeatmap = ({ dangerZones = [] as { x: number; y: number; radius: number; severity: number }[], w = 300, h = 220 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    // base background
    ctx.fillStyle = "#031021";
    ctx.fillRect(0, 0, w, h);

    // draw gaussian spreads for each danger zone
    dangerZones.forEach((d) => {
      const cx = (d.x / 30) * w; // assume grid 30 wide for scaling (demo)
      const cy = (d.y / 20) * h;
      const rad = d.radius * 12 + 16;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const color = d.severity > 0.75 ? "rgba(239,68,68," : d.severity > 0.5 ? "rgba(249,115,22," : "rgba(16,185,129,";
      grd.addColorStop(0, `${color}0.85)`);
      grd.addColorStop(0.4, `${color}0.45)`);
      grd.addColorStop(1, `${color}0.0)`);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // subtle grid
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, [dangerZones, w, h]);

  return <canvas ref={ref} width={w} height={h} className="rounded border border-border shadow-md" />;
};

// ----------------------- Main Mission Dashboard -----------------------
const MissionDashboard: React.FC = () => {
  // mission state
  const [summary, setSummary] = useState<MissionSummary | null>(null);
  const [detections, setDetections] = useState<LogEntry[]>([]);
  const [threatScore, setThreatScore] = useState<number>(0.18);
  const [pieData, setPieData] = useState<{ label: string; value: number; color: string }[]>([
    { label: "Anti-Tank", value: 12, color: "#ef4444" },
    { label: "Anti-Personnel", value: 28, color: "#06b6d4" },
    { label: "Booby-Trap", value: 7, color: "#f97316" },
    { label: "M14 AP", value: 4, color: "#8b5cf6" },
  ]);
  const [pathPreview, setPathPreview] = useState<number[][]>([]);
  const [dangerZones, setDangerZones] = useState<{ x: number; y: number; radius: number; severity: number }[]>([]);
  const [robotIdx, setRobotIdx] = useState(0);
  const animRef = useRef<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [gridSize, setGridSize] = useState<[number, number]>([30, 25]);

  // fetch mission summary + recent detections (try backend, fallback simulated)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // try call your existing endpoints (example path for detections)
        const [logRes, sumRes] = await Promise.allSettled([
          api.get("/detection/recent"), // if you have this
          api.get("/mission/summary"), // optional
        ]);

        if (mounted) {
          if (logRes.status === "fulfilled" && Array.isArray(logRes.value.data)) {
            setDetections(logRes.value.data.slice(0, 12));
          } else {
            // fallback simulated detections
            setDetections(generateSampleDetections());
          }

          if (sumRes.status === "fulfilled" && sumRes.value.data) {
            setSummary(sumRes.value.data);
          } else {
            setSummary(generateSummaryFallback());
          }
        }
      } catch (e) {
        if (mounted) {
          setDetections(generateSampleDetections());
          setSummary(generateSummaryFallback());
        }
      }
    };
    load();
    return () => {
      mounted = false;
      if (animRef.current) window.clearInterval(animRef.current);
    };
  }, []);

  // small robot animation along pathPreview
  useEffect(() => {
    if (pathPreview.length === 0) {
      setRobotIdx(0);
      setIsRunning(false);
      if (animRef.current) {
        window.clearInterval(animRef.current);
        animRef.current = null;
      }
      return;
    }
    // start animation
    setIsRunning(true);
    let idx = 0;
    setRobotIdx(0);
    if (animRef.current) {
      window.clearInterval(animRef.current);
      animRef.current = null;
    }
    animRef.current = window.setInterval(() => {
      idx = Math.min(idx + 1, pathPreview.length - 1);
      setRobotIdx(idx);
      if (idx >= pathPreview.length - 1 && animRef.current) {
        window.clearInterval(animRef.current);
        animRef.current = null;
        setIsRunning(false);
      }
    }, 220);
    return () => {
      if (animRef.current) {
        window.clearInterval(animRef.current);
        animRef.current = null;
      }
    };
  }, [pathPreview]);

  // helper: call /path/generate to create preview path & danger zones
  const generateSafePath = async () => {
    try {
      const payload = {
        width: gridSize[0],
        height: gridSize[1],
        start: [0, 0],
        goal: [gridSize[0] - 1, gridSize[1] - 1],
        obstacle_threshold: 0.75,
      };
      const res = await api.post("/path/generate", payload);
      const d = res.data;
      // convert path format [ [x,y], ... ] to rows,cols
      // our MiniGridPath expects [row,col] ordering; backend uses [x,y] where x ~ row
      setPathPreview((d.path || []).map((p: any) => [p[0], p[1]]));
      setDangerZones(d.danger_zones || []);
      setThreatScore(Math.min(1, (d.danger_zones?.reduce((s: number, z: any) => s + (z.severity || 0), 0) / 6) || 0.2));
      toast.success("Safe path generated");
    } catch (e) {
      // fallback demo: create synthetic path & zones
      const demoPath = Array.from({ length: 28 }).map((_, i) => [Math.min(gridSize[1] - 1, i), Math.min(gridSize[0] - 1, i)]);
      setPathPreview(demoPath);
      setDangerZones([
        { x: 8, y: 6, radius: 2, severity: 0.9 },
        { x: 15, y: 12, radius: 1, severity: 0.7 },
      ]);
      setThreatScore(0.62);
      toast.success("Demo path generated (fallback)");
    }
  };

  // regenerate mission summary (simulate)
  const refreshSummary = async () => {
    try {
      // call backend if you have stored mission data
      const res = await api.get("/mission/summary");
      setSummary(res.data);
      toast.success("Mission summary refreshed");
    } catch {
      setSummary(generateSummaryFallback());
      toast.success("Mission summary refreshed (demo)");
    }
  };

  // small handlers
  const clearPath = () => {
    setPathPreview([]);
    setDangerZones([]);
    setThreatScore(0.12);
    setRobotIdx(0);
  };

  // PIE data mapping from detections
  useEffect(() => {
    const counts = new Map<string, number>();
    detections.forEach((d) => {
      const lab = (d as any).label || (d.prediction === "mine" ? "Unknown" : "Clear");
      counts.set(lab, (counts.get(lab) || 0) + 1);
    });
    const mapped = [
      { label: "Anti-Tank", value: counts.get("Anti-Tank") || 8, color: "#ef4444" },
      { label: "Anti-Personnel", value: counts.get("Anti-Personnel") || 20, color: "#06b6d4" },
      { label: "Booby-Trap", value: counts.get("Booby-Trapped AP") || 5, color: "#f97316" },
      { label: "M14 AP", value: counts.get("M14 AP") || 3, color: "#8b5cf6" },
    ];
    setPieData(mapped);
  }, [detections]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#021226] via-[#031832] to-[#00070a] text-white pt-16">
      <Navbar />
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary drop-shadow-md">MISSION DASHBOARD</h1>
            <p className="text-sm text-muted-foreground mt-1">Battle Ops — real-time overview & mission controls</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={generateSafePath} className="flex items-center gap-2">
              <Play /> Generate Safe Path
            </Button>
            <Button variant="ghost" onClick={refreshSummary} className="flex items-center gap-2">
              <RotateCcw /> Refresh
            </Button>
            <Button variant="outline" onClick={clearPath} className="flex items-center gap-2">
              <RefreshCw /> Clear
            </Button>
          </div>
        </div>

        {/* GRID: Left visual column + right controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT LARGE: GPR mini + Danger heatmap + Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-4 bg-black/30 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-[#06b6d4] to-[#0369a1] rounded" />
                  <div>
                    <div className="text-sm font-semibold">Live GPR Feed</div>
                    <div className="text-xs text-muted-foreground">Frequency: 500MHz • Depth: 0–2m</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Simulated / Live</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {/* GPRVisualization component (existing) */}
                  <div className="mb-2 text-xs text-muted-foreground">Radargram</div>
                  <GPRVisualization />
                </div>

                <div>
                  <div className="mb-2 text-xs text-muted-foreground">Danger Heatmap</div>
                  <DangerHeatmap dangerZones={dangerZones} w={380} h={220} />
                </div>
              </div>
            </Card>

            {/* Timeline (W8) */}
            <Card className="p-4 bg-black/30 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">GPR Scan Timeline</div>
                <div className="text-xs text-muted-foreground">last 24 scans</div>
              </div>
              <div className="overflow-x-auto py-2">
                <div className="flex gap-3 items-end">
                  {/* timeline items - map detections or simulated scans */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const severity = (i % 6) / 6;
                    const height = 36 + severity * 60;
                    const isAlert = severity > 0.6;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div
                          className={`rounded-md transition-all`}
                          style={{
                            width: 36,
                            height,
                            background: isAlert ? "linear-gradient(180deg,#ef4444,#f97316)" : "linear-gradient(180deg,#06b6d4,#0369a1)",
                            boxShadow: isAlert ? "0 6px 18px rgba(239,68,68,0.2)" : "0 6px 18px rgba(3,105,161,0.14)",
                          }}
                        />
                        <div className="text-xs text-muted-foreground">{`T-${i * 2}m`}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: Controls + Gauge + Summary + Mini Path + Pie */}
          <div className="space-y-6">
            <Card className="p-4 bg-black/30 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Mission Summary</div>
                  <div className="text-lg font-bold">{summary ? `${summary.mines_found} mines found` : "—"}</div>
                </div>

                <div className="space-y-2 text-right">
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="font-mono text-sm">{summary?.uptime ?? "00:42:17"}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{summary?.total_scans ?? 128}</div>
                  <div className="text-xs text-muted-foreground uppercase">Scans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{summary?.mines_found ?? 24}</div>
                  <div className="text-xs text-muted-foreground uppercase">Mines Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{summary?.mines_cleared ?? 8}</div>
                  <div className="text-xs text-muted-foreground uppercase">Cleared</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-black/30 border border-primary/20">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Threat Gauge</div>
                  <Gauge value={threatScore} />
                </div>

                <div className="ml-auto">
                  <div className="text-xs text-muted-foreground">Mine-Type Distribution</div>
                  <div className="flex items-center gap-3 mt-2">
                    <PieChartSVG data={pieData} />
                    <div>
                      {pieData.map((p) => (
                        <div key={p.label} className="flex items-center gap-2 text-sm mb-2">
                          <div style={{ width: 10, height: 10, background: p.color, borderRadius: 3 }} />
                          <div className="text-xs">{p.label}</div>
                          <div className="text-xs text-muted-foreground ml-2">({p.value})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-black/30 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Safe Path Preview</div>
                <div className="text-xs text-muted-foreground">Grid {gridSize[0]}×{gridSize[1]}</div>
              </div>

              <div className="flex items-center gap-4">
                <MiniGridPath
                  rows={12}
                  cols={18}
                  path={pathPreview.slice(0, 40)}
                  mines={dangerZones.map((z) => ({ x: z.x, y: z.y, radius: z.radius }))}
                  activePos={pathPreview[robotIdx] || undefined}
                />
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">Path length</div>
                  <div className="text-lg font-bold">{pathPreview.length || 0}</div>

                  <div className="text-xs text-muted-foreground">Danger zones</div>
                  <div className="text-lg font-bold">{dangerZones.length}</div>

                  <Button size="sm" onClick={() => setRobotIdx(0)}>Reset Robot</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* bottom row: Detection log + Safety metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PredictionLog entries={detections as LogEntry[]} />
          </div>
          <div>
            <SafetyMetrics />
            <Card className="mt-4 p-4 bg-black/30 border border-primary/20">
              <div className="text-sm text-muted-foreground">Quick Actions</div>
              <div className="mt-3 flex flex-col gap-2">
                <Button onClick={generateSafePath} className="w-full">Regenerate Path (A*)</Button>
                <Button variant="outline" onClick={() => { setPieData(shufflePie(pieData)); toast.success("Randomized distribution (demo)"); }}>Shuffle Distribution</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MissionDashboard;

// ----------------------- Utility/demo helpers -----------------------
function generateSampleDetections(): LogEntry[] {
  const now = Date.now();
  const labels = ["Anti-Tank", "Anti-Personnel", "Booby-Trapped AP", "M14 AP"];
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `${now}-${i}`,
    timestamp: new Date(now - i * 60000).toLocaleTimeString(),
    lat: parseFloat((12.97 + Math.random() * 0.02).toFixed(4)),
    lng: parseFloat((77.59 + Math.random() * 0.02).toFixed(4)),
    prediction: Math.random() > 0.5 ? "mine" : "clear",
    confidence: parseFloat((50 + Math.random() * 50).toFixed(1)),
    model: "Random Forest + PCA",
    // attach label for pie mapping
    ...(Math.random() > 0.4 ? { label: labels[Math.floor(Math.random() * labels.length)] } : {}),
  })) as LogEntry[];
}

function generateSummaryFallback(): MissionSummary {
  return {
    total_scans: 128,
    mines_found: 24,
    mines_cleared: 8,
    distance_m: 3200,
    uptime: "00:42:17",
  };
}

function shufflePie<T extends { label: string; value: number; color: string }>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
