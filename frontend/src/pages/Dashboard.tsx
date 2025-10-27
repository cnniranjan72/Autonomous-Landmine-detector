import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { StatusBar } from "@/components/StatusBar";
import { PredictionCard } from "@/components/PredictionCard";
import { FieldMap } from "@/components/FieldMap";
import { PredictionLog, LogEntry } from "@/components/PredictionLog";
import { GPRVisualization } from "@/components/GPRVisualization";
import { ControlPanel } from "@/components/ControlPanel";
import { SafetyMetrics } from "@/components/SafetyMetrics";
import { toast } from "sonner";

const Dashboard = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedModel, setSelectedModel] = useState("LogisticRegression + PCA");
  const [currentPrediction, setCurrentPrediction] = useState<"mine" | "clear" | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [robotPosition, setRobotPosition] = useState({ lat: 34.050, lng: -118.240 });

  // Simulate prediction updates
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      // Simulate receiving new prediction
      const isMine = Math.random() > 0.7; // 30% chance of mine detection
      const newConfidence = isMine ? 85 + Math.random() * 13 : 75 + Math.random() * 20;
      const prediction = isMine ? "mine" : "clear";

      setCurrentPrediction(prediction);
      setConfidence(newConfidence);

      // Update robot position (simulate movement)
      setRobotPosition((prev) => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.002,
        lng: prev.lng + (Math.random() - 0.5) * 0.002,
      }));

      // Add to log
      const newEntry: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        lat: robotPosition.lat,
        lng: robotPosition.lng,
        prediction,
        confidence: newConfidence,
        model: selectedModel,
      };

      setLogEntries((prev) => [newEntry, ...prev].slice(0, 50));

      // Add marker to map
      if (isMine) {
        setMarkers((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            lat: robotPosition.lat,
            lng: robotPosition.lng,
            type: "mine",
          },
        ]);
        toast.error("⚠️ MINE DETECTED!", {
          description: `Location: ${robotPosition.lat.toFixed(4)}°N, ${Math.abs(
            robotPosition.lng
          ).toFixed(4)}°W`,
        });
      } else {
        setMarkers((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            lat: robotPosition.lat,
            lng: robotPosition.lng,
            type: "clear",
          },
        ]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isScanning, robotPosition.lat, robotPosition.lng, selectedModel]);

  const handleToggleScan = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      toast.success("Scan initiated", {
        description: "System is now actively scanning the field",
      });
    } else {
      toast.info("Scan stopped", {
        description: "System monitoring paused",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Navbar />
      
      {/* Header */}
      <header className="border-b-2 border-primary/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">
                AUTONOMOUS LANDMINE DETECTION SYSTEM
              </h1>
              <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wide">
                Real-Time GPR Analysis & Threat Assessment
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <StatusBar isConnected={true} selectedModel={selectedModel} />

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Prediction & Controls */}
          <div className="space-y-6">
            <PredictionCard
              prediction={currentPrediction}
              confidence={confidence}
              isActive={isScanning}
            />
            <ControlPanel
              isScanning={isScanning}
              onToggleScan={handleToggleScan}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
            <SafetyMetrics />
          </div>

          {/* Center Column - Map */}
          <div className="lg:col-span-2">
            <FieldMap markers={markers} robotPosition={robotPosition} />
          </div>
        </div>

        {/* Bottom Section - GPR & Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <GPRVisualization />
          <PredictionLog entries={logEntries} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
