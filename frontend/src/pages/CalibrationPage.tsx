// src/pages/CalibrationPage.tsx
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

type PredictResp = {
  prediction: number;
  raw_probability: number;
  calibrated_probability: number;
  message: string;
  severity_score?: number;
  severity_level?: string;
};

const defaultInput = {
  Metal_Level: "",
  Magnetic_Field: "",
  Ground_Density: "",
  Thermal_Signature: "",
  Metal_Mag_Ratio: "",
  Metal_Diff: "",
  Metal_Mag_Energy: "",
  Metal_Mag_Avg: ""
};

const Bar = ({ value, color, label }: { value: number; color: string; label: string }) => {
  const width = Math.max(2, Math.min(100, Math.round(value * 100)));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <div>{label}</div>
        <div className="font-mono">{(value * 100).toFixed(1)}%</div>
      </div>
      <div className="w-full h-4 bg-border rounded overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.7 }}
          style={{ background: color }}
          className="h-full"
        />
      </div>
    </div>
  );
};

const CalibrationPage: React.FC = () => {
  const [inputs, setInputs] = useState(defaultInput);
  const [result, setResult] = useState<PredictResp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<any | null>(null);

  useEffect(() => {
    // fetch calibration metrics if present
    (async () => {
      try {
        const res = await api.get("/calibration/metrics");
        setMeta(res.data);
      } catch (e) {
        // no metadata available is ok
        setMeta(null);
      }
    })();
  }, []);

  const handleChange = (k: string, v: string) => {
    setInputs((s) => ({ ...s, [k]: v }));
  };

  const handlePredict = async () => {
    // basic input validation
    const arr = Object.values(inputs).map((v) => parseFloat(v as any));
    if (arr.some((n) => Number.isNaN(n))) {
      toast.error("Please fill all 8 numeric input values.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const resp = await api.post("/predict/mine", { input: arr });
      if (resp.data.error) throw new Error(resp.data.error);
      setResult(resp.data as PredictResp);
      toast.success("Prediction received.");
    } catch (err: any) {
      console.error(err);
      toast.error("Prediction failed. Check backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white pt-16">
      <Navbar />
      <main className="container mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-primary mb-6">Probability Calibration — Isotonic Regression</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 p-4 border border-primary/30 bg-gray-900/40 rounded-lg">
            <h3 className="text-sm text-primary font-semibold mb-3">Input (8 sensor features)</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(defaultInput).map((k) => (
                <div key={k}>
                  <label className="text-xs uppercase text-muted-foreground">{k.replace(/_/g, " ")}</label>
                  <input
                    className="w-full p-2 mt-1 bg-black/40 rounded border border-gray-700 text-sm"
                    value={inputs[k as keyof typeof defaultInput]}
                    onChange={(e) => handleChange(k, e.target.value)}
                    type="number"
                  />
                </div>
              ))}
            </div>
            <Button onClick={handlePredict} className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Scanning..." : "Run Detector (raw → calibrated)"}
            </Button>

            <div className="mt-4 text-xs text-muted-foreground">
              {meta ? (
                <>
                  <div><strong>Calibration:</strong> Isotonic Regression</div>
                  <div><strong>Holdout Brier (raw → calibrated):</strong> {(meta.metrics.raw.brier).toFixed(3)} → {(meta.metrics.calibrated.brier).toFixed(3)}</div>
                  <div className="mt-2">Brier improvement: {(meta.metrics.improvement.brier_delta).toFixed(3)}</div>
                </>
              ) : (
                <div>No calibration metadata available.</div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 p-4 border border-primary/30 bg-gray-900/40 rounded-lg">
            <h3 className="text-sm text-primary font-semibold mb-3">Results</h3>

            {!result ? (
              <div className="text-center text-muted-foreground py-10">
                <div className="mb-2">No prediction yet.</div>
                <div className="text-xs">Run the detector to see raw vs calibrated probabilities.</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Bar value={result.raw_probability} color="linear-gradient(90deg,#60a5fa,#0284c7)" label="Raw Probability" />
                    <div className="mt-3 text-sm text-muted-foreground">Model message: {result.message}</div>
                  </div>
                  <div>
                    <Bar value={result.calibrated_probability} color="linear-gradient(90deg,#34d399,#10b981)" label="Calibrated Probability" />
                    <div className="mt-3 text-sm text-muted-foreground">Severity: {result.severity_level ?? "—"} {(result.severity_score ? `${(result.severity_score*100).toFixed(0)}%` : "")}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-primary mb-2">Quick Comparison</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-3 bg-black/30 rounded">
                      <div className="text-muted-foreground">Raw</div>
                      <div className="font-mono text-lg">{(result.raw_probability * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded">
                      <div className="text-muted-foreground">Calibrated</div>
                      <div className="font-mono text-lg">{(result.calibrated_probability * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded">
                      <div className="text-muted-foreground">Delta</div>
                      <div className="font-mono text-lg">{((result.calibrated_probability - result.raw_probability) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {meta && meta.reliability_curve && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-primary mb-2">Reliability (holdout)</h4>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      {meta.reliability_curve.mean_predicted_value.map((mv: number, i: number) => (
                        <div key={i} className="p-2 bg-black/30 rounded text-center">
                          <div className="font-mono">{(mv*100).toFixed(0)}%</div>
                          <div className="text-muted-foreground">{(meta.reliability_curve.fraction_of_pos[i]*100).toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Top = mean predicted, bottom = observed fraction of positives (binned)</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CalibrationPage;
