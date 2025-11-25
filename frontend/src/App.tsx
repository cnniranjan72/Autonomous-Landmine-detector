import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MineTypeDetection from "@/pages/MineTypeDetection";
import SafePath from "@/pages/SafePath";
import CalibrationPage from "./pages/CalibrationPage";
import MissionDashboard from "./pages/MissionDashboard";
import MineFieldSimulation from "./pages/MineFieldSimulation";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mine-type" element={<MineTypeDetection />} />
          <Route path="/safe-path" element={<SafePath />} />
          <Route path="/mission-dashboard" element={<MissionDashboard />} />
          <Route path="/mine-field-simulation" element={<MineFieldSimulation />} />
          <Route path="/calibration" element={<CalibrationPage />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
