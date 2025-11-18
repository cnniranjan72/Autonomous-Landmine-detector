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
        toast.error("Please fill all numeric values.");
        return;
      }

      setIsLoading(true);
      setPrediction(null);

      const response = await api.post("/predict/mine", {
        input: dataArray,
      });

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
          model: "Random Forest + PCA",
        };

        setLogEntries((prev) => [newEntry, ...prev]);
        toast.success(`Prediction: ${pred.toUpperCase()} (${conf}%)`);
        setIsLoading(false);
      }, 1500);
    } catch (err: any) {
      toast.error("Prediction failed. Check backend.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      <Navbar />

      {/* 👇 FIXED TOP HEADING WITH CLEAR VISIBILITY */}
      {/* TOP HEADING - HIGH TECH + FULL VISIBILITY */}
{/* HIGH-TECH HEADING FIX - ALWAYS VISIBLE */}
<header className="w-full py-10 mt-20 bg-[#0a0f1a]/95 bg-opacity-90 text-center shadow-[0_0_25px_rgba(0,115,255,0.25)]">
  <h1
    className="text-4xl md:text-5xl font-extrabold tracking-[0.3em]
               text-[#1a8cff]
               drop-shadow-[0_0_12px_rgba(0,140,255,0.9)]
               uppercase"
  >
    AUTONOMOUS LANDMINE DETECTION SYSTEM
  </h1>

  <p
    className="text-sm md:text-base text-gray-300 tracking-wide mt-3 uppercase
               drop-shadow-[0_0_8px_rgba(0,150,255,0.6)]"
  >
    ML-BASED MINE DETECTION USING SENSOR DATA
  </p>
</header>



      <div className="container mx-auto px-6 mt-4">
        <StatusBar isConnected={true} selectedModel="Random Forest + PCA Model" />
      </div>

      {/* MAIN */}
      <main className="container mx-auto px-6 py-12 space-y-14">

        {/* UPPER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">

          {/* LEFT CARD — SAME HEIGHT */}
          <div className="rounded-2xl bg-gray-900/50 border border-primary/30 shadow-[0_0_20px_rgba(0,122,255,0.15)] backdrop-blur-md p-5 flex flex-col justify-center">
            <PredictionCard
              prediction={prediction}
              confidence={confidence}
              isActive={isLoading}
            />
          </div>

          {/* RIGHT CARD — MATCH HEIGHT */}
          <div className="rounded-2xl bg-gray-900/50 border border-primary/30 shadow-[0_0_20px_rgba(0,122,255,0.15)] backdrop-blur-md p-6 flex flex-col justify-between">
            <h2 className="text-xl font-bold text-primary mb-6 tracking-wide">
              INPUT SENSOR DATA
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {Object.keys(inputValues).map((key) => (
                <div key={key}>
                  <label className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    type="number"
                    name={key}
                    value={inputValues[key as keyof typeof inputValues]}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 bg-black/40 border border-gray-700 rounded-md focus:ring-2 focus:ring-primary/60 text-sm"
                    placeholder="Enter value"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handlePredict}
              disabled={isLoading}
              className="w-full mt-6 py-3 text-base font-semibold tracking-wide"
            >
              {isLoading ? "Scanning..." : "Run Prediction"}
            </Button>

            {isLoading && (
              <div className="flex justify-center mt-6">
                <motion.div
                  className="w-24 h-24 rounded-full border-4 border-primary/50 relative"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <motion.div
                    className="absolute top-1/2 left-1/2 w-2 h-10 bg-primary origin-bottom rounded"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* LOWER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          <div className="rounded-2xl bg-gray-900/40 border border-primary/20 shadow-[0_0_15px_rgba(0,122,255,0.10)] p-4">
            <PredictionLog entries={logEntries} />
          </div>

          <div className="rounded-2xl bg-gray-900/40 border border-primary/20 shadow-[0_0_15px_rgba(0,122,255,0.10)] p-4">
            <SafetyMetrics />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
