import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StatusBar } from "@/components/StatusBar";
import { PredictionCard } from "@/components/PredictionCard";
import { PredictionLog, LogEntry } from "@/components/PredictionLog";
import { SafetyMetrics } from "@/components/SafetyMetrics";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      setIsLoading(true);
      setPrediction(null);

      const response = await api.post("/predict/mine", { input: dataArray });
      const data = response.data;
      if (data.error) throw new Error(data.error);

      const pred = data.prediction === 1 ? "mine" : "clear";
      const conf = (data.probability * 100).toFixed(1);

      setTimeout(() => {
        setPrediction(pred);
        setConfidence(Number(conf));

        const newEntry: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          lat: Math.random() * 90,
          lng: Math.random() * 180,
          prediction: pred,
          confidence: Number(conf),
          model: "ML Model v1",
        };

        setLogEntries((prev) => [newEntry, ...prev]);
        toast.success(`Prediction: ${pred.toUpperCase()} (${conf}%)`);
        setIsLoading(false);
      }, 2500); // small delay for animation
    } catch (err: any) {
      console.error("Prediction error:", err);
      toast.error("Prediction failed. Ensure Flask backend is running on port 5000.");
      setIsLoading(false);
    }
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

      <StatusBar isConnected={true} selectedModel="Custom ML Model" />

      <main className="container mx-auto px-6 py-8 space-y-10">
        {/* Prediction & Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PredictionCard
            prediction={prediction}
            confidence={confidence}
            isActive={isLoading}
          />

          <div className="p-6 border border-primary/30 rounded-2xl bg-gray-900/60 shadow-xl backdrop-blur-sm">
            <h2 className="font-semibold text-xl mb-4 text-primary">Input Sensor Data</h2>

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

            {/* Scanner Animation */}
            {isLoading && (
              <div className="flex justify-center items-center mt-6">
                <motion.div
                  className="w-32 h-32 rounded-full border-4 border-primary/50 relative"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <motion.div
                    className="absolute top-1/2 left-1/2 w-2 h-12 bg-primary origin-bottom rounded"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Logs + Metrics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PredictionLog entries={logEntries} />
          <SafetyMetrics />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
