import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StatusBar } from "@/components/StatusBar";
import { PredictionCard } from "@/components/PredictionCard";
import { PredictionLog, LogEntry } from "@/components/PredictionLog";
import { SafetyMetrics } from "@/components/SafetyMetrics";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GPRVisualization } from "@/components/GPRVisualization";

const BigRedRadar = ({ size = 320 }: { size?: number }) => {
  // Pure presentational radar — red threat scanner style (Style 3)
  return (
    <div className="flex items-center justify-center w-full">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Outer rings */}
        <div className="absolute inset-0 rounded-full border-2 border-red-600/30" />
        <div className="absolute inset-[12px] rounded-full border-2 border-red-600/20" />
        <div className="absolute inset-[28px] rounded-full border-2 border-red-600/15" />

        {/* rotating sweep beam */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          style={{ transformOrigin: "50% 50%" }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${size * 1.1}px`,
              height: `${size * 1.1}px`,
              transform: `translate(-50%, -50%) rotate(0deg)`,
              background:
                "conic-gradient(rgba(239,68,68,0.28), rgba(239,68,68,0.08) 30%, rgba(239,68,68,0.0) 40%)",
              filter: "blur(6px)",
            }}
          />
        </motion.div>

        {/* pulsing center */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0.9 }}
          animate={{ scale: [1, 1.18, 1], opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            transform: "translate(-50%,-50%)",
            width: 18,
            height: 18,
            background: "radial-gradient(circle at 30% 30%, #ff7b7b, #ef4444)",
            boxShadow: "0 0 16px rgba(239,68,68,0.8)",
          }}
        />

        {/* status label */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <div className="text-xs font-mono font-semibold text-red-300 uppercase">
            SCANNING — THREAT MODE
          </div>
        </div>

        {/* small HUD info at bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-red-200/80 font-mono">
          <div>Sweep: 500 MHz · Depth: 0—2m · Resolution: 5cm</div>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const [inputValues, setInputValues] = useState({
    Metal_Level: "",
    Magnetic_Field: "",
    Ground_Density: "",
    Thermal_Signature: "",
    Metal_Mag_Ratio: "",
    Metal_Diff: "",
    Metal_Mag_Energy: "",
    Metal_Mag_Avg: "",
  });

  const [prediction, setPrediction] = useState<"mine" | "clear" | null>(null);
  const [confidence, setConfidence] = useState(0);

  // NEW severity states
  const [severityScore, setSeverityScore] = useState<number | null>(null);
  const [severityLevel, setSeverityLevel] = useState<string | null>(null);
  const [severityColor, setSeverityColor] = useState<string | null>(null);

  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const modelOverview = {
    name: "Random Forest + PCA",
    accuracy: "93% (CV) • 100% Holdout",
    dataset: "Radar GPR Scan Dataset (66 samples → 74800 features)",
    features: 8,
    note: "High accuracy due to PCA + radar frequency-domain signals.",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValues({ ...inputValues, [e.target.name]: e.target.value });
  };

  const handlePredict = async () => {
    try {
      const dataArray = Object.values(inputValues).map((v) => parseFloat(v));
      if (dataArray.some(isNaN)) {
        toast.error("Please fill all 8 numeric values before predicting.");
        return;
      }

      // Start scanning animation (big radar replaces PredictionCard)
      setIsLoading(true);
      setPrediction(null);
      setSeverityScore(null);
      setSeverityLevel(null);
      setSeverityColor(null);

      // call backend — keep logic unchanged
      const response = await api.post("/predict/mine", {
        input: Object.values(inputValues).map((v) => parseFloat(v)),
      });

      const data = response.data;
      if (data.error) throw new Error(data.error);

      const pred = data.prediction === 1 ? "mine" : "clear";
      const conf = (data.probability * 100).toFixed(1);

      // severity fields from backend (optional)
      const sevScore = data.severity_score ?? null;
      const sevLevel = data.severity_level ?? null;
      const sevColor = data.severity_color ?? null;

      // keep big radar for a short UX pause, then transition
      setTimeout(() => {
        setPrediction(pred);
        setConfidence(Number(conf));
        setSeverityScore(sevScore);
        setSeverityLevel(sevLevel);
        setSeverityColor(sevColor);

        const newEntry: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          lat: parseFloat((Math.random() * 90).toFixed(4)),
          lng: parseFloat((Math.random() * 180).toFixed(4)),
          prediction: pred,
          confidence: Number(conf),
          model: "Random Forest + PCA",
        };

        setLogEntries((prev) => [newEntry, ...prev]);
        toast.success(`Prediction: ${pred.toUpperCase()} (${conf}%) ${sevLevel ? "— " + sevLevel : ""}`);
        setIsLoading(false);
      }, 1500); // keep radar visible at least 1.5s for the wow effect
    } catch (err: any) {
      console.error("Prediction error:", err);
      toast.error("Prediction failed. Check backend logs or input data.");
      setIsLoading(false);
    }
  };

  // Model Info (static text)
  const modelInfo = {
    model: "Random Forest + PCA",
    accuracy: "98%",
    dataset: "50 GPR scans → 75,000+ PCA features",
    features: 8,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white pt-16">
      <Navbar />

      <header className="border-b border-primary/40 bg-black/50 backdrop-blur-md shadow-md">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-wider text-primary drop-shadow-lg">
            AUTONOMOUS LANDMINE DETECTION SYSTEM
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wide">
            ML-Based Mine Detection using Sensor Data
          </p>
        </div>
      </header>

      <StatusBar isConnected={true} selectedModel="Random Forest + PCA Model" />

      <main className="container mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Visual + Card area */}
          <div className="space-y-6">
            <GPRVisualization />

            {/* AnimatePresence handles swap between big radar (loading) and PredictionCard (result) */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="big-radar"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="p-6 border border-primary/30 rounded-2xl bg-gray-900/60 shadow-xl backdrop-blur-sm flex items-center justify-center"
                >
                  <BigRedRadar size={360} />
                </motion.div>
              ) : (
                <motion.div
                  key="prediction-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                >
                  <PredictionCard
                    prediction={prediction}
                    confidence={confidence}
                    isActive={isLoading}
                    severityScore={severityScore}
                    severityLevel={severityLevel}
                    severityColor={severityColor}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend and small severity badge */}
            <div className="p-4 bg-gray-900/60 border border-primary/30 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-primary">Legend</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  • Green: Low • Yellow: Moderate • Orange: High • Red: Critical
                </p>
              </div>

              {severityScore !== null && severityLevel && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Threat Level</div>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        background: severityColor ?? "#999",
                        borderRadius: 4,
                      }}
                    />
                    <div className="font-semibold text-sm">{severityLevel}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(severityScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Tabs + Input Form (moved to right for cleaner layout) */}
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-primary/30 shadow-xl">
            <Tabs defaultValue="info">
              <TabsList className="flex w-full justify-center bg-black/40 border border-primary/20 rounded-lg p-1 gap-1">
                <TabsTrigger value="info">Model Info</TabsTrigger>
                <TabsTrigger value="summary">Threat Summary</TabsTrigger>
                <TabsTrigger value="scan">Scan</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <div className="mt-4 space-y-2">
                  <div className="text-sm">
                    <strong className="text-primary">Model:</strong> {modelInfo.model}
                  </div>
                  <div className="text-sm">
                    <strong className="text-primary">Accuracy:</strong> {modelInfo.accuracy}
                  </div>
                  <div className="text-sm">
                    <strong className="text-primary">Dataset:</strong> {modelInfo.dataset}
                  </div>
                  <div className="text-sm">
                    <strong className="text-primary">Features:</strong> {modelInfo.features}
                  </div>

                  {/* Threat Level Card (separate card) */}
                  {severityScore !== null && (
                    <div className="mt-4 p-4 border border-border rounded-lg bg-black/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">Threat Level</div>
                          <div className="text-lg font-bold">{severityLevel}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Severity</div>
                          <div className="text-2xl font-mono font-bold">
                            {(severityScore * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 h-3 rounded overflow-hidden bg-border">
                        <div
                          style={{
                            width: `${(severityScore * 100).toFixed(0)}%`,
                            background: severityColor ?? "#ef4444",
                          }}
                          className="h-full transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="summary">
                <div className="mt-4">
                  <h4 className="text-sm text-primary font-semibold">Recent Detections</h4>
                  <div className="mt-3">
                    {/* keep PredictionLog inside tab */}
                    <PredictionLog entries={logEntries} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scan">
                <div className="mt-6 flex justify-center">
                  <motion.div
                    className="w-48 h-48 rounded-full border-4 border-primary/50 relative"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-2 h-14 bg-primary origin-bottom rounded"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                  </motion.div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Input Form moved to right side below tabs (keeps layout fixed) */}
            <div className="mt-6 p-4 border border-primary/20 rounded-lg bg-black/30">
              <h3 className="text-sm font-semibold text-primary mb-3">Input Sensor Data</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(inputValues).map((key) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      type="number"
                      name={key}
                      value={inputValues[key as keyof typeof inputValues]}
                      onChange={handleChange}
                      className="p-2 bg-black/40 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60 text-sm text-white"
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handlePredict}
                disabled={isLoading}
                className="w-full mt-4 py-2 text-base font-semibold tracking-wide"
              >
                {isLoading ? "Scanning Environment..." : "Run Prediction"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PredictionLog entries={logEntries} />
          <SafetyMetrics />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
