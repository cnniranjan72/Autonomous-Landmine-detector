import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Skull } from "lucide-react";

const MINE_ENCYCLOPEDIA: Record<
  number,
  { desc: string; blast_radius: string; activation: string; note?: string }
> = {
  1: { desc: "Null / No mine", blast_radius: "0 m", activation: "N/A", note: "No threat." },
  2: { desc: "Anti-Tank", blast_radius: "2-4 m", activation: "Vehicle pressure", note: "High severity." },
  3: { desc: "Anti-Personnel", blast_radius: "0.5-1.5 m", activation: "Person pressure", note: "Common small AP." },
  4: { desc: "Booby-Trapped AP", blast_radius: "0.5-2 m", activation: "Secondary trigger", note: "Booby traps increase risk." },
  5: { desc: "M14 AP", blast_radius: "0.5-1 m", activation: "Pressure", note: "Small plastic-cased AP." },
};

const BigRedRadar = ({ size = 260 }: { size?: number }) => {
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
        <div className="absolute inset-0 rounded-full border-2 border-red-700/30" />
        <div className="absolute inset-[10px] rounded-full border-2 border-red-700/20" />
        <div className="absolute inset-[22px] rounded-full border-2 border-red-700/12" />

        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: "linear" }}
          style={{ transformOrigin: "50% 50%" }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${size * 1.15}px`,
              height: `${size * 1.15}px`,
              transform: `translate(-50%, -50%) rotate(0deg)`,
              background:
                "conic-gradient(rgba(239,68,68,0.30), rgba(239,68,68,0.08) 25%, rgba(239,68,68,0.0) 40%)",
              filter: "blur(6px)",
            }}
          />
        </motion.div>

        <motion.div
          initial={{ scale: 0.92, opacity: 0.95 }}
          animate={{ scale: [1, 1.14, 1], opacity: [1, 0.65, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            transform: "translate(-50%,-50%)",
            width: 16,
            height: 16,
            background: "radial-gradient(circle at 30% 30%, #ff7b7b, #ef4444)",
            boxShadow: "0 0 16px rgba(239,68,68,0.9)",
          }}
        />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <div className="text-xs font-mono font-semibold text-red-300 uppercase">SCANNING — THREAT MODE</div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-red-200/80 font-mono">
          <div>Sweep: 500MHz · Depth: 0—2m · Res: 5cm</div>
        </div>
      </motion.div>
    </div>
  );
};

const MineTypeDetection = () => {
  const [values, setValues] = useState({ V: "", H: "", S: "" });

  const [result, setResult] = useState<{
    mine_type: number;
    label: string;
    confidence: number;
    severity_score?: number;
    severity_level?: string;
    severity_color?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const modelStats = {
    model: "Random Forest (Tabular)",
    accuracy: 0.837,
    macroPrecision: 0.84,
    macroRecall: 0.83,
    macroF1: 0.83,
    datasetSize: 1690,
    confusionNotes:
      "Model performs best on Anti-Tank, weakest on M14 AP — common due to class imbalance.",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handlePredict = async () => {
    if (!values.V || !values.H || !values.S) {
      toast.error("Please enter V, H and S before predicting.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await api.post("/predict/mine-type", {
        V: parseFloat(values.V),
        H: parseFloat(values.H),
        S: parseInt(values.S),
      });

      const data = response.data;

      // Keep same structure + allow optional severity fields if backend provides them
      setResult({
        mine_type: data.mine_type,
        label: data.label,
        confidence: data.confidence,
        severity_score: data.severity_score,
        severity_level: data.severity_level,
        severity_color: data.severity_color,
      });

      toast.success(
        `Predicted: ${data.label} (${(data.confidence * 100).toFixed(1)}%)${data.severity_level ? " — " + data.severity_level : ""}`
      );
    } catch (err) {
      console.error("Prediction failed:", err);
      toast.error("Prediction failed. Check backend or inputs.");
    }

    setIsLoading(false);
  };

  const severityColorOrDefault = (color?: string) => color ?? "#ef4444";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white pt-16">
      <Navbar />

      <header className="border-b border-primary/40 bg-black/50 backdrop-blur-md shadow-md">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-wider text-primary drop-shadow-lg">
            MINE TYPE CLASSIFICATION MODULE
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wide">
            ML Model to Classify Landmine Category using V, H, S Inputs
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-10">
        {/* Model Performance */}
        <div className="max-w-4xl mx-auto p-6 bg-gray-900/40 backdrop-blur-md rounded-2xl border border-primary/30 shadow-lg">
          <h2 className="text-2xl font-bold text-primary text-center mb-4">Model Performance Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-sm"><span className="font-semibold text-primary">Model:</span> {modelStats.model}</p>
              <p className="text-sm"><span className="font-semibold text-primary">Accuracy:</span> {(modelStats.accuracy * 100).toFixed(2)}%</p>
              <p className="text-sm"><span className="font-semibold text-primary">Macro Precision:</span> {(modelStats.macroPrecision * 100).toFixed(2)}%</p>
              <p className="text-sm"><span className="font-semibold text-primary">Macro Recall:</span> {(modelStats.macroRecall * 100).toFixed(2)}%</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm"><span className="font-semibold text-primary">Training Samples:</span> {modelStats.datasetSize}</p>
              <p className="text-sm leading-relaxed"><span className="font-semibold text-primary">Confusion Matrix Notes:</span><br/>{modelStats.confusionNotes}</p>
            </div>
          </div>
        </div>

        {/* Input + Display area */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: Radar + result card */}
          <div className="space-y-4">
            <Card className="p-4 border border-primary/30 bg-gray-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mine Classifier</h3>
                  <div className="text-xs text-muted-foreground mt-1">Tabular sensor classifier (V, H, S)</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Model</div>
                  <div className="text-sm font-medium">RF (Tabular)</div>
                </div>
              </div>

              <div className="mt-4">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="radar"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <BigRedRadar size={220} />
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="mt-2">
                        <div className="flex items-center gap-4">
                          <div>
                            {result.mine_type === 1 ? (
                              <CheckCircle2 className="h-12 w-12 text-success" />
                            ) : result.mine_type === 2 ? (
                              <Skull className="h-12 w-12 text-destructive" />
                            ) : (
                              <AlertTriangle className="h-12 w-12 text-warning" />
                            )}
                          </div>

                          <div>
                            <div className="text-sm text-muted-foreground">Result</div>
                            <div className="text-2xl font-bold">{result.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">Confidence: {(result.confidence * 100).toFixed(1)}%</div>
                          </div>
                        </div>

                        {typeof result.severity_score === "number" && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground uppercase">Threat Severity</div>
                              <div className="text-xs font-mono">{(result.severity_score * 100).toFixed(0)}%</div>
                            </div>

                            <div className="mt-2 h-3 bg-border rounded overflow-hidden">
                              <div
                                style={{
                                  width: `${(result.severity_score * 100).toFixed(0)}%`,
                                  background: severityColorOrDefault(result.severity_color),
                                }}
                                className="h-full transition-all"
                              />
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground">{result.severity_level ?? "—"}</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <div className="text-center py-8 text-muted-foreground">Enter V, H, S and click Predict to classify mine type.</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* Encyclopedia small card */}
            <Card className="p-4 border border-border bg-black/30">
              <h4 className="text-sm text-primary font-semibold">Mine Encyclopedia</h4>
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="font-semibold">Quick facts</p>
                <ul className="mt-2 space-y-1">
                  <li>• Anti-Tank: large blast radius, vehicle-activated.</li>
                  <li>• Anti-Personnel: small radius, common risk for foot traffic.</li>
                  <li>• Booby-Trapped AP: secondary triggers increase danger.</li>
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">Tip: Combine this classifier with the GPR detector for both presence and type estimation.</p>
              </div>
            </Card>
          </div>

          {/* RIGHT: Input form + details */}
          <div className="space-y-4">
            <Card className="p-4 border border-primary/30 bg-gray-900/60">
              <h3 className="text-sm font-semibold text-primary mb-2">Input Sensor Data</h3>

              <div className="grid grid-cols-1 gap-3">
                {["V", "H", "S"].map((k) => (
                  <div key={k} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{k}</label>
                    <input
                      name={k}
                      type="number"
                      placeholder={`Enter ${k}`}
                      value={values[k as keyof typeof values]}
                      onChange={(e) => handleChange(e as any)}
                      className="p-2 bg-black/40 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60 text-sm text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <Button onClick={handlePredict} disabled={isLoading} className="flex-1">
                  {isLoading ? "Classifying..." : "Predict Mine Type"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setValues({ V: "", H: "", S: "" });
                    setResult(null);
                  }}
                >
                  Reset
                </Button>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                <div>Model: <span className="font-mono">Random Forest (tabular)</span></div>
                <div>Dataset: <span className="font-mono">Processed V,H,S samples</span></div>
              </div>
            </Card>

            {/* Expanded Encyclopedia/result details (shows when result exists) */}
            <AnimatePresence>
              {result && (
                <motion.div
                  key="detail-card"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Card className="p-4 border border-border bg-black/30">
                    <h4 className="text-sm text-primary font-semibold">Details — {result.label}</h4>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                      <div><strong>Description:</strong> {MINE_ENCYCLOPEDIA[result.mine_type]?.desc}</div>
                      <div><strong>Blast radius:</strong> {MINE_ENCYCLOPEDIA[result.mine_type]?.blast_radius}</div>
                      <div><strong>Activation:</strong> {MINE_ENCYCLOPEDIA[result.mine_type]?.activation}</div>
                      {MINE_ENCYCLOPEDIA[result.mine_type]?.note && <div className="text-xs text-muted-foreground mt-1">{MINE_ENCYCLOPEDIA[result.mine_type]?.note}</div>}

                      <div className="mt-3 flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">Safety advice:</div>
                        <div className="text-sm">If a mine is suspected, evacuate the area and notify EOD teams. Do not attempt manual probing.</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MineTypeDetection;
