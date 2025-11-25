// src/pages/SafePath.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import { Play, Download, Shuffle, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Mine = { r: number; c: number; type?: number; severity?: number };

const CELL_SIZE = 26; // px
const GAP = 4; // gap between cells

const cellStyle = (code: number) => {
  // 0 free, 1 mine, 2 danger, 3 path, 4 start, 5 goal
  switch (code) {
    case 1:
      return { background: "#ef4444", borderColor: "#7f1d1d" }; // mine
    case 2:
      return { background: "linear-gradient(180deg,#fb923c,#fb7185)", borderColor: "#92400e" }; // danger
    case 3:
      return { background: "#06b6d4", borderColor: "#075985" }; // path
    case 4:
      return { background: "#10b981", borderColor: "#064e3b" }; // start
    case 5:
      return { background: "#8b5cf6", borderColor: "#4c1d95" }; // goal
    default:
      return { background: "#071025", borderColor: "#0f1724" }; // free (very dark blue)
  }
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const formatCoord = (p: [number, number]) => `${p[0]},${p[1]}`;

const SafePath: React.FC = () => {
  const [rows, setRows] = useState<number>(14);
  const [cols, setCols] = useState<number>(26);
  const [mines, setMines] = useState<Mine[]>([
    { r: 5, c: 8, type: 2, severity: 0.9 },
    { r: 9, c: 16, type: 3, severity: 0.7 },
  ]);
  const [start, setStart] = useState<[number, number]>([0, 0]);
  const [goal, setGoal] = useState<[number, number]>([13, 25]);
  const [grid, setGrid] = useState<number[][]>([]);
  const [path, setPath] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [animateIdx, setAnimateIdx] = useState<number>(0);
  const animTimerRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [playingShuffle, setPlayingShuffle] = useState(false);

  useEffect(() => {
    // generate empty grid when size changes
    const g = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    // place mines locally for preview
    mines.forEach((m) => {
      if (m.r >= 0 && m.r < rows && m.c >= 0 && m.c < cols) g[m.r][m.c] = 1;
    });
    setGrid(g);
  }, [rows, cols, mines]);

  useEffect(() => {
    // stop animation on unmount
    return () => {
      if (animTimerRef.current) window.clearInterval(animTimerRef.current);
    };
  }, []);

  // Toggle mine by clicking cell
  const toggleMineAt = (r: number, c: number) => {
    const found = mines.findIndex((m) => m.r === r && m.c === c);
    if (found >= 0) {
      const copy = [...mines];
      copy.splice(found, 1);
      setMines(copy);
    } else {
      setMines([...mines, { r, c, type: 2, severity: 0.8 }]);
    }
  };

  const randomizeMines = (count = Math.max(4, Math.floor((rows * cols) / 100))) => {
    setPlayingShuffle(true);
    const arr: Mine[] = [];
    const rnd = (max: number) => Math.floor(Math.random() * max);
    for (let i = 0; i < count; i++) {
      arr.push({ r: rnd(rows), c: rnd(cols), type: 2 + (i % 3), severity: Number((0.4 + Math.random() * 0.6).toFixed(2)) });
    }
    // small UI flair: wait a bit to show shuffle animation
    setTimeout(() => {
      setMines(arr);
      setPlayingShuffle(false);
    }, 650);
  };

  const callGenerate = async (blockMines = true) => {
    setIsLoading(true);
    setPath([]);
    setAnimateIdx(0);
    if (animTimerRef.current) {
      window.clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }

    try {
      const payload = {
        width: cols,
        height: rows,
        start: [start[1], start[0]], // your backend expects [x,y] where x is column index - adapt if needed
        goal: [goal[1], goal[0]],
        // convert mines into backend-friendly shape
        mines: mines.map((m) => ({ x: m.c, y: m.r, radius: 1 + (m.type ?? 2) % 3, severity: m.severity ?? 0.8 })),
        obstacle_threshold: 0.75,
      };

      // API unchanged
      const res = await api.post("/path/generate", payload);
      const data = res.data;
      if (data.error) throw new Error(data.error || "unknown");

      // The backend returned grid_size [W,H] and path [[x,y],...]
      // convert backend grid to [row][col] consistent with frontend. If backend doesn't return grid,
      // fallback to drawing danger zones over base grid.
      if (data.grid && Array.isArray(data.grid) && data.grid.length === rows) {
        // backend grid consistent
        setGrid(data.grid as number[][]);
      } else {
        // overlay danger zones onto generated base grid
        const g = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
        (data.danger_zones || []).forEach((dz: any) => {
          const cx = dz.x;
          const cy = dz.y;
          const radius = dz.radius || 1;
          for (let rr = Math.max(0, cy - radius - 1); rr <= Math.min(rows - 1, cy + radius + 1); rr++) {
            for (let cc = Math.max(0, cx - radius - 1); cc <= Math.min(cols - 1, cx + radius + 1); cc++) {
              const dist = Math.hypot(cc - cx, rr - cy);
              if (dist <= radius + 0.6) {
                g[rr][cc] = g[rr][cc] === 1 ? 1 : 2; // mine remains mine, else danger
              }
            }
          }
        });
        setGrid(g);
      }

      // convert path coordinates from backend [x,y] to frontend [r,c]
      const serverPath = (data.path as any[]) ?? [];
      const convertedPath = serverPath.map((p: any) => {
        const x = p[0];
        const y = p[1];
        // backend used [x,y] = [col,row] maybe — attempt both patterns
        if (x < cols && y < rows) {
          return [y, x] as [number, number];
        }
        return [x, y] as [number, number];
      });
      setPath(convertedPath);

      // animate robot
      if (convertedPath.length > 0) {
        let idx = 0;
        setAnimateIdx(0);
        animTimerRef.current = window.setInterval(() => {
          idx++;
          setAnimateIdx(idx);
          if (idx >= convertedPath.length) {
            if (animTimerRef.current) {
              window.clearInterval(animTimerRef.current);
              animTimerRef.current = null;
            }
          }
        }, 160);
      }

      toast.success("Safe path generated.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate path. Check backend logs.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportPath = () => {
    const payload = { grid, path, rows, cols, mines, start, goal };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safe_path_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported JSON");
  };

  const copyCoords = (coords: [number, number]) => {
    navigator.clipboard?.writeText(formatCoord(coords));
    toast.success("Coordinates copied");
  };

  const robotPosition = useMemo(() => {
    if (!path || path.length === 0) return start;
    const idx = Math.min(animateIdx, path.length - 1);
    return path[idx];
  }, [path, animateIdx, start]);

  // helpers to create path polyline SVG
  const svgPath = useMemo(() => {
    if (!path || path.length === 0) return "";
    const points = path.map(([r, c]) => {
      const x = c * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const y = r * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      return `${x},${y}`;
    });
    return points.join(" ");
  }, [path]);

  // keyboard shortcut: Enter generates path
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        callGenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, mines, start, goal]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white pt-16">
      <Navbar />

      <main className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-primary">Safe Path Generator — A*</h1>

          <div className="flex items-center gap-3">
            <Button onClick={() => randomizeMines()} className={`flex items-center gap-2 ${playingShuffle ? "animate-pulse" : ""}`}>
              <Shuffle /> Randomize
            </Button>
            <Button onClick={() => callGenerate(true)} disabled={isLoading} className="flex items-center gap-2">
              <Play /> Generate
            </Button>
            <Button variant="outline" onClick={exportPath} className="flex items-center gap-2">
              <Download /> Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <Card className="p-5 bg-gray-900/50 border border-primary/30">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-20">Rows</label>
                <input
                  aria-label="rows"
                  type="number"
                  min={6}
                  max={80}
                  value={rows}
                  onChange={(e) => setRows(clamp(Number(e.target.value || 0), 6, 80))}
                  className="ml-auto p-2 w-28 bg-black/40 rounded border border-gray-700 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-20">Cols</label>
                <input
                  aria-label="cols"
                  type="number"
                  min={6}
                  max={140}
                  value={cols}
                  onChange={(e) => setCols(clamp(Number(e.target.value || 0), 6, 140))}
                  className="ml-auto p-2 w-28 bg-black/40 rounded border border-gray-700 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-20">Start</label>
                <input
                  aria-label="start"
                  type="text"
                  value={`${start[0]},${start[1]}`}
                  onChange={(e) => {
                    const [a, b] = e.target.value.split(",").map((s) => Number(s.trim()));
                    if (!Number.isNaN(a) && !Number.isNaN(b)) setStart([a, b]);
                  }}
                  className="ml-auto p-2 w-36 bg-black/40 rounded border border-gray-700 text-sm"
                />
                <button
                  onClick={() => {
                    setStart([0, 0]);
                    toast.success("Start reset");
                  }}
                  className="ml-2 text-xs text-muted-foreground hover:text-white"
                  title="Reset start"
                >
                  reset
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-20">Goal</label>
                <input
                  aria-label="goal"
                  type="text"
                  value={`${goal[0]},${goal[1]}`}
                  onChange={(e) => {
                    const [a, b] = e.target.value.split(",").map((s) => Number(s.trim()));
                    if (!Number.isNaN(a) && !Number.isNaN(b)) setGoal([a, b]);
                  }}
                  className="ml-auto p-2 w-36 bg-black/40 rounded border border-gray-700 text-sm"
                />
                <button
                  onClick={() => {
                    setGoal([rows - 1, cols - 1]);
                    toast.success("Goal reset");
                  }}
                  className="ml-2 text-xs text-muted-foreground hover:text-white"
                  title="Reset goal"
                >
                  reset
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button onClick={() => randomizeMines()} variant="ghost" className="flex-1">
                    <Shuffle /> Shuffle mines
                  </Button>
                  <Button onClick={() => setMines([])} variant="ghost" className="flex-1">
                    Clear
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tip: Click cells on grid to toggle mines. Press <kbd className="px-2 py-1 ml-1 rounded bg-black/30">Enter</kbd> to generate.
                </div>
              </div>
            </div>
          </Card>

          {/* Legend & Details */}
          <Card className="p-5 bg-gray-900/50 border border-primary/30">
            <h3 className="text-sm text-primary font-semibold mb-3">Legend</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2"><div style={{ width: 18, height: 18, background: "#ef4444", borderRadius: 6 }} /> Mine</div>
              <div className="flex items-center gap-2"><div style={{ width: 18, height: 18, background: "#fb923c", borderRadius: 6 }} /> Danger</div>
              <div className="flex items-center gap-2"><div style={{ width: 18, height: 18, background: "#06b6d4", borderRadius: 6 }} /> Path</div>
              <div className="flex items-center gap-2"><div style={{ width: 18, height: 18, background: "#10b981", borderRadius: 6 }} /> Start</div>
              <div className="flex items-center gap-2"><div style={{ width: 18, height: 18, background: "#8b5cf6", borderRadius: 6 }} /> Goal</div>
              <div className="col-span-2 text-xs text-muted-foreground mt-2">
                Export: JSON includes grid & path. Use exported file for mission replay.
              </div>
            </div>
          </Card>

          {/* Grid + large preview (span 2 columns) */}
          <div className="lg:col-span-2">
            <Card className="p-4 bg-gray-900/40 border border-primary/30">
              <div ref={boardRef} className="relative select-none">
                {/* heatmap overlay - uses danger intensity from grid */}
                <div
                  className="absolute inset-0 pointer-events-none rounded"
                  aria-hidden
                  style={{ mixBlendMode: "screen", opacity: 0.55 }}
                >
                  {/* create gradient radial overlays for danger cells */}
                  {grid.flatMap((row, r) =>
                    row.flatMap((cell, c) => {
                      if (cell === 2 || cell === 1) {
                        const intensity = cell === 1 ? 0.85 : 0.45;
                        const left = c * (CELL_SIZE + GAP);
                        const top = r * (CELL_SIZE + GAP);
                        return (
                          <div
                            key={`hm-${r}-${c}`}
                            style={{
                              position: "absolute",
                              left: left - CELL_SIZE,
                              top: top - CELL_SIZE,
                              width: CELL_SIZE * 3,
                              height: CELL_SIZE * 3,
                              borderRadius: "50%",
                              background: `radial-gradient(circle at 50% 50%, rgba(239,68,68,${intensity}), rgba(239,68,68,0) 60%)`,
                              transform: `translate(0,0)`,
                              filter: "blur(10px)",
                            }}
                          />
                        );
                      }
                      return [];
                    })
                  )}
                </div>

                {/* path svg line */}
                <svg
                  width={cols * (CELL_SIZE + GAP)}
                  height={rows * (CELL_SIZE + GAP)}
                  className="absolute inset-0 pointer-events-none"
                  style={{ overflow: "visible", zIndex: 20 }}
                  aria-hidden
                >
                  <AnimatePresence>
                    {path.length > 0 && (
                      <motion.polyline
                        key={`poly-${path.length}`}
                        points={svgPath}
                        initial={{ pathLength: 0, opacity: 0.1 }}
                        animate={{ pathLength: 1, opacity: 0.9 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        stroke="#7dd3fc"
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: "drop-shadow(0 4px 10px rgba(34,211,238,0.08))" }}
                      />
                    )}
                  </AnimatePresence>
                </svg>

                {/* grid */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
                    gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
                    gap: GAP,
                    zIndex: 10,
                  }}
                >
                  {Array.from({ length: rows }).map((_, r) =>
                    Array.from({ length: cols }).map((_, c) => {
                      // code resolution: 0 default, override with server grid if available
                      let code = 0;
                      if (grid && grid[r] && typeof grid[r][c] === "number") code = grid[r][c];
                      const localMine = mines.find((m) => m.r === r && m.c === c);
                      if (localMine && code === 0) code = 1;
                      if (path && path.find((p) => p[0] === r && p[1] === c)) code = 3;
                      if (r === start[0] && c === start[1]) code = 4;
                      if (r === goal[0] && c === goal[1]) code = 5;

                      const pos = `${r}-${c}`;
                      const base = cellStyle(code);

                      return (
                        <motion.div
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === " ") toggleMineAt(r, c);
                          }}
                          onClick={() => toggleMineAt(r, c)}
                          key={pos}
                          title={`r:${r}, c:${c}`}
                          aria-label={`cell ${r} ${c}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center rounded-md transition-all duration-150"
                          style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            background: base.background,
                            border: `1px solid ${base.borderColor}`,
                            boxShadow: code === 3 ? "0 6px 14px rgba(6,182,212,0.06)" : "none",
                            cursor: "pointer",
                          }}
                        >
                          {/* small pulse for mines */}
                          {code === 1 && (
                            <div className="w-1/2 h-1/2 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.12)" }} />
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Robot marker */}
                {path && path.length > 0 && (
                  <motion.div
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    style={{
                      position: "absolute",
                      width: CELL_SIZE - 8,
                      height: CELL_SIZE - 8,
                      transform: `translate(${(robotPosition[1]) * (CELL_SIZE + GAP)}px, ${robotPosition[0] * (CELL_SIZE + GAP)}px)`,
                      top: 0,
                      left: 0,
                      zIndex: 50,
                      pointerEvents: "none",
                    }}
                    aria-hidden
                  >
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 10,
                          background: "linear-gradient(180deg,#60a5fa,#0284c7)",
                          boxShadow: "0 12px 30px rgba(2,6,23,0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: 4, background: "#fff" }} />
                      </div>

                      {/* breathing glow */}
                      <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                        style={{
                          position: "absolute",
                          borderRadius: 12,
                          width: CELL_SIZE + 8,
                          height: CELL_SIZE + 8,
                          background: "radial-gradient(circle,#60a5fa55,#60a5fa00)",
                          zIndex: 40,
                          top: -4,
                          left: -4,
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* footer area with stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="p-4 bg-gray-900/50 border border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Last Path Length</div>
                <div className="text-lg font-mono font-bold">{path.length}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Mines</div>
                <div className="text-lg font-mono font-bold">{mines.length}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gray-900/50 border border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Start</div>
                <div className="text-sm font-semibold">{formatCoord(start)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Goal</div>
                <div className="text-sm font-semibold">{formatCoord(goal)}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={() => copyCoords(start)} variant="outline" className="flex-1">
                <Copy /> Copy Start
              </Button>
              <Button size="sm" onClick={() => copyCoords(goal)} variant="outline" className="flex-1">
                <Copy /> Copy Goal
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-gray-900/50 border border-primary/30">
            <div className="text-sm text-muted-foreground">Actions</div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => setPath([])} variant="ghost" className="flex-1">Clear Path</Button>
              <Button onClick={() => setGrid(Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0)))} variant="ghost" className="flex-1">Clear Grid</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SafePath;
