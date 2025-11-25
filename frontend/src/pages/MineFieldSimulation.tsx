import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Upload, Shuffle, Eye, EyeOff, Radar } from "lucide-react";
import { motion } from "framer-motion";

type Mine = { r: number; c: number; radius?: number; severity?: number };

const CELL = 22; // px

// Color codes
const COLORS = {
  free: "#0b1220",
  mine: "#ef4444",
  danger: "#f97316",
  path: "#06b6d4",
  start: "#10b981",
  goal: "#8b5cf6",
  fog: "#0f1724",
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const MineFieldSimulation: React.FC = () => {
  // ------------------------
  // STATE
  // ------------------------
  const [rows, setRows] = useState(20);
  const [cols, setCols] = useState(35);

  const [mines, setMines] = useState<Mine[]>([]);
  const [start, setStart] = useState<[number, number]>([0, 0]);
  const [goal, setGoal] = useState<[number, number]>([19, 34]);

  // grid values: 0 free, 1 mine, 2 danger
  const [grid, setGrid] = useState<number[][]>([]);
  const [path, setPath] = useState<[number, number][]>([]);

  const [animateIdx, setAnimateIdx] = useState(0);
  const robotTimer = useRef<number | null>(null);

  const [fog, setFog] = useState<boolean>(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // extras
  const [heatmap, setHeatmap] = useState(false);
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // simulated sensor readings
  const [sensors, setSensors] = useState({
    metal_level: 0.12,
    magnetic_field: 0.08,
    ground_density: 1.02,
    thermal_signature: 0.11,
  });

  // ------------------------
  // GRID INITIALIZATION
  // ------------------------
  useEffect(() => {
    const g = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 0)
    );
    setGrid(g);

    setRevealed(new Set());
    setPath([]);
    setAnimateIdx(0);
  }, [rows, cols]);

  // ------------------------
  // RANDOM MINE GENERATION
  // ------------------------
  const generateRandomMines = (count: number) => {
    const arr: Mine[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        r: Math.floor(Math.random() * rows),
        c: Math.floor(Math.random() * cols),
        radius: 1 + Math.floor(Math.random() * 2),
        severity: 0.4 + Math.random() * 0.6,
      });
    }
    setMines(arr);
  };

  // ------------------------
  // BUILD COST GRID & RUN A*
  // ------------------------
  const generateGrid = () => {
    const g = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 0)
    );

    // Mines = 1 and danger zones = 2
    mines.forEach((m) => {
      if (m.r >= 0 && m.r < rows && m.c >= 0 && m.c < cols) {
        g[m.r][m.c] = 1;
        const radius = m.radius ?? 1;
        for (let i = m.r - radius; i <= m.r + radius; i++) {
          for (let j = m.c - radius; j <= m.c + radius; j++) {
            if (i >= 0 && j >= 0 && i < rows && j < cols && g[i][j] === 0) {
              g[i][j] = 2;
            }
          }
        }
      }
    });

    setGrid(g);
    // redraw mini-map when grid changes
    setTimeout(() => drawMiniMap(g, path), 60);
  };

  // ------------------------
  // SIMPLE A* IMPLEMENTATION
  // ------------------------
  const heuristic = (a: [number, number], b: [number, number]) =>
    Math.hypot(b[0] - a[0], b[1] - a[1]);

  const neighbors = (node: [number, number]) => {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    const result: [number, number][] = [];
    dirs.forEach(([dr, dc]) => {
      const nr = node[0] + dr;
      const nc = node[1] + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        result.push([nr, nc]);
      }
    });
    return result;
  };

  const runPathfinding = () => {
    // ensure grid exists
    generateGrid(); // rebuild in case user tweaked mines
    // slight delay so grid state updates before A*
    setTimeout(() => {
      const open: any[] = [];
      const gScore: Record<string, number> = {};
      const cameFrom: Record<string, [number, number] | null> = {};

      const startKey = `${start[0]}-${start[1]}`;
      gScore[startKey] = 0;

      open.push({
        pos: start,
        f: heuristic(start, goal),
        g: 0,
      });

      const key = (r: number, c: number) => `${r}-${c}`;

      while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();
        const [r, c] = current.pos;

        if (r === goal[0] && c === goal[1]) {
          const final: [number, number][] = [];
          let cursor: [number, number] | null = current.pos;
          while (cursor) {
            final.push(cursor);
            cursor = cameFrom[key(cursor[0], cursor[1])] ?? null;
          }
          const finalPath = final.reverse();
          setPath(finalPath);
          animateRobot(finalPath);
          drawMiniMap(grid, finalPath);
          return;
        }

        for (let [nr, nc] of neighbors([r, c])) {
          // higher cost for mines/danger
          const cost = grid[nr][nc] === 1 ? 999 : grid[nr][nc] === 2 ? 5 : 1;
          const tentativeG = current.g + cost;
          if (tentativeG < (gScore[key(nr, nc)] ?? Infinity)) {
            cameFrom[key(nr, nc)] = [r, c];
            gScore[key(nr, nc)] = tentativeG;

            open.push({
              pos: [nr, nc],
              g: tentativeG,
              f: tentativeG + heuristic([nr, nc], goal),
            });
          }
        }
      }

      // fallback: no path
      setPath([]);
    }, 40);
  };

  // ------------------------
  // ROBOT ANIMATION + FOG REVEAL + SENSORS + SOUND
  // ------------------------
  const animateRobot = (p: [number, number][]) => {
    if (robotTimer.current) clearInterval(robotTimer.current);
    setAnimateIdx(0);

    // initialize WebAudio if not already
    if (!audioCtxRef.current && typeof window !== "undefined") {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    robotTimer.current = window.setInterval(() => {
      setAnimateIdx((i) => {
        const next = Math.min(i + 1, Math.max(0, p.length - 1));

        // reveal fog around robot
        if (p[next]) revealAround(p[next]);

        // update sensors based on underlying grid cell
        const [rr, rc] = p[next];
        const cell = grid[rr]?.[rc] ?? 0;
        updateSensorsBasedOnCell(cell);

        // sound
        playStepSound(cell);

        if (next >= p.length - 1) {
          if (robotTimer.current) {
            clearInterval(robotTimer.current);
            robotTimer.current = null;
          }
          return next;
        }
        return next;
      });
    }, 180);
  };

  const revealAround = ([r, c]: [number, number]) => {
    const newSet = new Set(revealed);
    for (let i = r - 2; i <= r + 2; i++) {
      for (let j = c - 2; j <= c + 2; j++) {
        if (i >= 0 && j >= 0 && i < rows && j < cols) {
          newSet.add(`${i}-${j}`);
        }
      }
    }
    setRevealed(newSet);
  };

  const updateSensorsBasedOnCell = (cellCode: number) => {
    // baseline noise
    const baseMetal = 0.1 + Math.random() * 0.03;
    const baseMag = 0.08 + Math.random() * 0.02;
    const baseDensity = 1.0 + Math.random() * 0.04;
    const baseThermal = 0.09 + Math.random() * 0.03;

    // bump values near mines/danger
    const metal = clamp(baseMetal + (cellCode === 1 ? 0.6 : cellCode === 2 ? 0.25 : 0.0), 0, 5);
    const mag = clamp(baseMag + (cellCode === 1 ? 0.4 : cellCode === 2 ? 0.18 : 0.0), 0, 5);
    const den = clamp(baseDensity + (cellCode === 1 ? 0.8 : cellCode === 2 ? 0.3 : 0.0), 0, 10);
    const therm = clamp(baseThermal + (cellCode === 1 ? 0.35 : cellCode === 2 ? 0.12 : 0.0), 0, 5);

    setSensors({
      metal_level: Number(metal.toFixed(3)),
      magnetic_field: Number(mag.toFixed(3)),
      ground_density: Number(den.toFixed(3)),
      thermal_signature: Number(therm.toFixed(3)),
    });
  };

  const playStepSound = (cellCode: number) => {
    try {
      const act = audioCtxRef.current;
      if (!act) return;

      const osc = act.createOscillator();
      const gain = act.createGain();
      osc.connect(gain);
      gain.connect(act.destination);

      if (cellCode === 1) {
        osc.frequency.value = 520; // strong beep
        gain.gain.value = 0.15;
      } else if (cellCode === 2) {
        osc.frequency.value = 340; // softer
        gain.gain.value = 0.08;
      } else {
        osc.frequency.value = 220;
        gain.gain.value = 0.02;
      }

      osc.type = "sine";
      osc.start();
      // short beep
      gain.gain.exponentialRampToValueAtTime(0.0001, act.currentTime + 0.12);
      setTimeout(() => {
        try { osc.stop(); } catch {}
      }, 160);
    } catch (e) {
      // ignore audio errors in some browsers (autoplay policy)
    }
  };

  // ------------------------
  // EXPORT JSON
  // ------------------------
  const downloadReplay = () => {
    const obj = { rows, cols, mines, start, goal, path };
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mine_sim_${Date.now()}.json`;
    a.click();
  };

  // ------------------------
  // IMPORT REPLAY
  // ------------------------
  const importReplay = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const data = JSON.parse(text);

    setRows(data.rows);
    setCols(data.cols);
    setMines(data.mines);
    setStart(data.start);
    setGoal(data.goal);

    setTimeout(() => {
      generateGrid();
      setPath(data.path ?? []);
      if (data.path?.length) animateRobot(data.path);
    }, 300);
  };

  // ------------------------
  // CELL COLOR FUNCTION (with heatmap)
  // ------------------------
  const getColor = (r: number, c: number): string => {
    if (path.find((p) => p[0] === r && p[1] === c)) return COLORS.path;
    if (r === start[0] && c === start[1]) return COLORS.start;
    if (r === goal[0] && c === goal[1]) return COLORS.goal;

    const val = grid[r]?.[c] ?? 0;

    if (heatmap) {
      // heat: free (blue) -> danger (orange) -> mine (red)
      if (val === 0) return "linear-gradient(180deg,#021028,#04243a)"; // cool
      if (val === 2) return "#ffb37a"; // light orange
      if (val === 1) return "#ff6b6b"; // light red
      return COLORS.free;
    }

    // regular colors with fog
    if (val === 1) return COLORS.mine;
    if (val === 2) return COLORS.danger;

    if (fog && !revealed.has(`${r}-${c}`)) return COLORS.fog;

    return COLORS.free;
  };

  // ------------------------
  // MINI MAP DRAW
  // ------------------------
  const drawMiniMap = (g: number[][], p: [number, number][]) => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cellW = w / cols;
    const cellH = h / rows;

    // background
    ctx.fillStyle = "#071221";
    ctx.fillRect(0, 0, w, h);

    // draw cells (mines & danger)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = g[r]?.[c] ?? 0;
        if (v === 1) {
          ctx.fillStyle = "#ff4d4d";
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        } else if (v === 2) {
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        } // free cells aren't drawn (dark background)
      }
    }

    // draw path
    if (p?.length) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = Math.max(1, Math.min(cellW, cellH) * 0.25);
      ctx.beginPath();
      p.forEach((pt, idx) => {
        const x = pt[1] * cellW + cellW / 2;
        const y = pt[0] * cellH + cellH / 2;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // start/goal
    ctx.fillStyle = "#10b981";
    ctx.fillRect(start[1] * cellW, start[0] * cellH, cellW, cellH);
    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(goal[1] * cellW, goal[0] * cellH, cellW, cellH);
  };

  useEffect(() => {
    drawMiniMap(grid, path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, path, rows, cols]);

  // ------------------------
  // Robot rotation for arrow
  // ------------------------
  const robotPosition = useMemo(() => {
    if (!path || path.length === 0) return start;
    const idx = Math.min(animateIdx, path.length - 1);
    return path[idx];
  }, [path, animateIdx, start]);

  const robotNext = useMemo(() => {
    if (!path || path.length <= 1) return null;
    const idx = Math.min(animateIdx + 1, path.length - 1);
    return path[idx] ?? null;
  }, [path, animateIdx]);

  const robotAngle = useMemo(() => {
    if (!robotNext) return 0;
    const dx = robotNext[1] - robotPosition[1];
    const dy = robotNext[0] - robotPosition[0];
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return angle;
  }, [robotNext, robotPosition]);

  // ------------------------
  // CLICK to toggle mine locally
  // ------------------------
  const toggleMineAt = (r: number, c: number) => {
    const found = mines.findIndex((m) => m.r === r && m.c === c);
    if (found >= 0) {
      const copy = [...mines];
      copy.splice(found, 1);
      setMines(copy);
    } else {
      setMines([...mines, { r, c, radius: 1, severity: 0.8 }]);
    }
  };

  // ------------------------
  // CLEANUP on unmount
  // ------------------------
  useEffect(() => {
    return () => {
      if (robotTimer.current) clearInterval(robotTimer.current);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, []);

  // ------------------------
  // RENDER
  // ------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white pt-16">
      <Navbar />

      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-primary">Mine Field Simulation</h1>

          {/* mini radar + small stats */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <canvas
                ref={miniCanvasRef}
                width={160}
                height={100}
                className="rounded border border-primary/20 shadow-lg"
              />
              <div className="absolute -right-2 -bottom-2 px-2 py-1 bg-black/60 border border-primary/20 rounded text-xs font-mono">
                {path?.length ? `${path.length} steps` : "no path"}
              </div>
            </div>

            <div className="p-3 bg-gray-900/40 border border-primary/20 rounded w-52">
              <div className="text-xs text-muted-foreground mb-1">Sensors (live)</div>
              <div className="grid grid-cols-2 text-sm gap-1">
                <div>Metal</div>
                <div className="font-mono text-right">{sensors.metal_level}</div>
                <div>Magnetic</div>
                <div className="font-mono text-right">{sensors.magnetic_field}</div>
                <div>Density</div>
                <div className="font-mono text-right">{sensors.ground_density}</div>
                <div>Thermal</div>
                <div className="font-mono text-right">{sensors.thermal_signature}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* CONTROL PANEL */}
          <Card className="p-5 bg-gray-900/60 border-primary/40 border">
            <h2 className="text-primary text-lg font-semibold mb-3">Controls</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs mb-1">Rows</p>
                <input
                  type="range"
                  min={10}
                  max={40}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs">{rows}</span>
              </div>

              <div>
                <p className="text-xs mb-1">Columns</p>
                <input
                  type="range"
                  min={15}
                  max={70}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs">{cols}</span>
              </div>

              <div>
                <p className="text-xs mb-1">Mine Density (slider adds random mines)</p>
                <input
                  type="range"
                  min={2}
                  max={40}
                  defaultValue={10}
                  onChange={(e) => generateRandomMines(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button onClick={() => { generateRandomMines(Math.max(6, Math.floor((rows * cols) / 120))); generateGrid(); }} className="w-full">
                <Shuffle className="mr-2" /> Randomize & Generate Field
              </Button>

              <Button onClick={runPathfinding} className="w-full bg-primary/80">
                <Play className="mr-2" /> Simulate Path
              </Button>

              <Button variant="outline" onClick={() => { setFog(!fog); if (!fog) setRevealed(new Set()); }} className="w-full">
                {fog ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />} Toggle Fog
              </Button>

              

              <div className="text-xs text-muted-foreground mt-2">
                Click any cell on the grid to toggle a mine. Use "Simulate" to run A* and watch the robot explore.
              </div>
            </div>
          </Card>

          {/* LEGEND */}
          <Card className="p-4 bg-gray-900/60 border-primary/40 border">
            <h3 className="text-primary mb-3 text-sm font-semibold">Legend</h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div style={{ background: COLORS.mine }} className="w-4 h-4 rounded" />
                Mine
              </div>
              <div className="flex items-center gap-2">
                <div style={{ background: COLORS.danger }} className="w-4 h-4 rounded" />
                Danger Zone
              </div>
              <div className="flex items-center gap-2">
                <div style={{ background: COLORS.path }} className="w-4 h-4 rounded" />
                Path
              </div>
              <div className="flex items-center gap-2">
                <div style={{ background: COLORS.start }} className="w-4 h-4 rounded" />
                Start
              </div>
              <div className="flex items-center gap-2">
                <div style={{ background: COLORS.goal }} className="w-4 h-4 rounded" />
                Goal
              </div>
              <div className="flex items-center gap-2">
                <div style={{ background: COLORS.fog }} className="w-4 h-4 rounded" />
                Fog of War
              </div>
              <br></br>
              <div className="space-y-4"><Button variant="secondary" onClick={downloadReplay} className="w-full">
                <Download className="mr-2" /> Export Replay
              </Button>
              <br></br>
              <br></br>
              <label className="w-full">
                <div className="cursor-pointer bg-gray-800/60 border border-gray-700 rounded p-2 flex items-center justify-center hover:bg-gray-700/70 transition">
                  <Upload className="mr-2" /> Load Replay
                </div>
                <input type="file" className="hidden" onChange={importReplay} />
              </label>

              <div className="flex gap-2">
                <Button onClick={() => { setHeatmap(!heatmap); }} className="flex-1">
                  <Radar className="mr-2" /> {heatmap ? "Heatmap: ON" : "Heatmap: OFF"}
                </Button>
              
                <Button onClick={() => { setMines([]); setGrid(Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))); setPath([]); setAnimateIdx(0); }} variant="outline">Reset</Button>
              </div></div>
              
            </div>
          </Card>

          {/* GRID CANVAS (spans 2 cols) */}
          <div className="lg:col-span-2">
            <Card className="p-4 bg-gray-900/40 border-primary/30 border">
              <div
                className="relative"
                style={{
                  width: cols * (CELL + 2),
                  height: rows * (CELL + 2),
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
                    gridTemplateRows: `repeat(${rows}, ${CELL}px)`,
                    gap: 2,
                  }}
                >
                  {Array.from({ length: rows }).map((_, r) =>
                    Array.from({ length: cols }).map((_, c) => {
                      const pos = `${r}-${c}`;
                      const color = getColor(r, c);

                      return (
                        <div
                          key={pos}
                          onClick={() => {
                            toggleMineAt(r, c);
                            // immediate visual update
                            setTimeout(generateGrid, 30);
                          }}
                          title={`r:${r}, c:${c}`}
                          style={{
                            background:
                              typeof color === "string" && color.startsWith("linear-gradient")
                                ? undefined
                                : color,
                            width: CELL,
                            height: CELL,
                            borderRadius: 4,
                            border: "1px solid rgba(255,255,255,0.03)",
                            boxSizing: "border-box",
                            cursor: "pointer",
                            backgroundImage:
                              typeof color === "string" && color.startsWith("linear-gradient")
                                ? color
                                : undefined,
                          }}
                        />
                      );
                    })
                  )}
                </div>

                {/* ROBOT - absolute positioned and rotates to direction */}
                {path.length > 0 && (
                  <>
                    <motion.div
                      className="absolute z-40"
                      animate={{
                        x: path[animateIdx][1] * (CELL + 2),
                        y: path[animateIdx][0] * (CELL + 2),
                      }}
                      transition={{ duration: 0.17, ease: "linear" }}
                      style={{ top: 2, left: 2 }}
                    >
                      <div
                        className="rounded-md shadow-lg flex items-center justify-center"
                        style={{
                          width: CELL - 6,
                          height: CELL - 6,
                          background: "linear-gradient(180deg,#60a5fa,#0284c7)",
                        }}
                      >
                        {/* direction arrow - rotates toward next step */}
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: "6px solid transparent",
                            borderRight: "6px solid transparent",
                            borderBottom: "10px solid white",
                            transform: `rotate(${robotAngle}deg) translateY(-1px)`,
                          }}
                        />
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MineFieldSimulation;
