import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Radar, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FloatingNav = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // Show floating nav after scrolling 100px
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur-lg border-2 border-primary/30 rounded-full px-6 py-3 shadow-lg glow-primary">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="rounded-full hover:bg-primary/20"
        >
          <Home className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="h-6 w-px bg-border" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => scrollToSection("features")}
          className="rounded-full hover:bg-primary/20"
        >
          <Radar className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Features</span>
        </Button>
        <div className="h-6 w-px bg-border" />
        <Button
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="rounded-full bg-primary hover:bg-primary/90"
        >
          <Activity className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </div>
    </div>
  );
};
