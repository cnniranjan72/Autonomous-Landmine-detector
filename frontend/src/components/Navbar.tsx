import { Button } from "@/components/ui/button";
import { Shield, LogIn, UserPlus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline">INTELLIMINE-LANDMINE DETECTION</span>
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
           
            <button
              onClick={() => {
                if (location.pathname === "/") {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                } else {
                  navigate("/");
                  setTimeout(() => {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              }}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              FEATURES
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              MINE PREDICTOR
            </button>
            <button
              onClick={() => navigate("/mine-type")}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/mine-type" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              MINE CLASSIFIER
            </button>
            <Button variant="ghost" onClick={() => navigate("/safe-path")}> SAFE PATH </Button>
            <Button variant="ghost" onClick={() => navigate("/mission-dashboard")}> MISSION DASHBOARD </Button>
            <Button variant="ghost" onClick={() => navigate("/mine-field-simulation")}> MINEFIELD SIMULATION </Button>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="border-primary/30"
            >
              <LogIn className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">LOGIN</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 glow-primary"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">REGISTER</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
