import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { FloatingNav } from "@/components/FloatingNav";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import {
  Shield,
  Activity,
  Map,
  TrendingUp,
  Radar,
  Zap,
  BrainCircuit,
  Globe,
  Target,
  Cpu,
  Satellite,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Radar,
      title: "Real-Time GPR Analysis",
      description:
        "Advanced Ground Penetrating Radar system processes subsurface reflections with ML-powered anomaly detection.",
    },
    {
      icon: Shield,
      title: "Low False Positive Rate",
      description:
        "Optimized ML algorithms keep false alarms under 5%, ensuring high mission efficiency.",
    },
    {
      icon: Map,
      title: "Live Field Mapping",
      description:
        "Track robot movement, geo-plot detected threats, and map hazard zones with precision.",
    },
    {
      icon: BrainCircuit,
      title: "Dual-Model Architecture",
      description:
        "Two ML models: Mine Presence Detector (GPR-PCA) + Mine Type Classifier (Tabular Sensor Input).",
    },
    {
      icon: TrendingUp,
      title: "High Cross-Validated Accuracy",
      description:
        "RF + PCA achieves 98% accuracy and tested across multiple terrain datasets.",
    },
    {
      icon: Zap,
      title: "Autonomous Operation",
      description:
        "Designed for autonomous UGVs/robots, reducing human presence in mine-risk areas.",
    },
  ];

  const defenceBenefits = [
    {
      icon: Target,
      title: "Accurate Threat Detection",
      description:
        "ML-powered radar processing significantly boosts accuracy over traditional metal detectors.",
    },
    {
      icon: Globe,
      title: "Safe Humanitarian Demining",
      description:
        "Ideal for UN peacekeeping missions and NGOs clearing post-war hazard zones.",
    },
    {
      icon: Cpu,
      title: "AI-Driven Decision Support",
      description:
        "Classifies mine type (Anti-Tank, AP, etc.) to enable better mission planning.",
    },
    {
      icon: Satellite,
      title: "Deployable with Drones / UGVs",
      description:
        "Lightweight ML inference supports integration with ground robots and aerial scanning drones.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ScrollIndicator />
      <FloatingNav />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="relative w-96 h-96">
            <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping" />
            <div className="absolute inset-8 border-2 border-primary rounded-full animate-ping delay-75" />
            <div className="absolute inset-16 border-2 border-primary rounded-full animate-ping delay-150" />
          </div>
        </div>
      
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block">
              <br></br>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                  Defence-Ready Detection Technology
                </span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-primary">AUTONOMOUS</span>
              <br />
              <span className="text-foreground">LANDMINE DETECTION SYSTEM</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered Ground Penetrating Radar (GPR) + Sensor-based ML
              classification for real-time landmine detection.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 glow-primary text-lg px-8 py-6"
                onClick={() => navigate("/dashboard")}
              >
                <Activity className="mr-2 h-5 w-5" />
                LAUNCH DETECTION DASHBOARD
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary/30 text-lg px-12 py-6 ml-4"
                onClick={() => navigate("/mine-type")}
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                OPEN MINE CLASSIFIER
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary/30 text-lg px-8 py-6"
                onClick={() =>
                  document
                    .getElementById("purpose")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                LEARN MORE
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">98.2%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Detection Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-success mb-2">&lt;5%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  False Positives
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">93.8%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  CV Accuracy
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Purpose Section */}
      <section id="purpose" className="py-24 bg-card/30 backdrop-blur-xl border-y border-primary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-6">
            PROJECT PURPOSE & CORE OBJECTIVE
          </h2>
          <p className="text-muted-foreground max-w-4xl mx-auto text-center text-lg leading-relaxed">
            Landmines cause over <span className="text-primary font-semibold">5,000+ casualties every year</span>.
            Manual detection is slow, dangerous, and highly error-prone.  
            This project aims to build an{" "}
            <span className="text-primary font-semibold">
              AI-driven autonomous detection system
            </span>{" "}
            using Ground Penetrating Radar + machine learning to detect buried
            landmines safely and efficiently — reducing human exposure to
            life-threatening zones.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-card/30" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                System Capabilities
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              ADVANCED DETECTION FEATURES
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Military-grade technology designed for maximum safety and accuracy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300"
                >
                  <div className="mb-4 inline-flex p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Defence Sector Benefits */}
      <section className="py-24 bg-background border-t border-primary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            WHY THE DEFENCE SECTOR NEEDS THIS TECHNOLOGY
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {defenceBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={index}
                  className="p-6 border-2 border-primary/20 bg-card/40 hover:border-primary/40 transition-all duration-300"
                >
                  <Icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-bold text-xl mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              );
            })}
          </div>

          <p className="text-center mt-10 text-lg text-muted-foreground max-w-4xl mx-auto">
            This system offers a <b>zero-risk, high-precision, autonomous</b> alternative
            to manual mine detection — making it ideal for military rescue operations,
            border patrol, drone deployments, and battlefield route clearance.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 grid-pattern opacity-10" />

        <div className="container mx-auto px-4 relative z-10">
          <Card className="max-w-4xl mx-auto border-2 border-primary/30 bg-card/50 backdrop-blur-sm p-12 text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              READY TO DEPLOY?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Access the command center to begin autonomous landmine detection
              operations.
            </p>

            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 glow-primary text-lg px-12 py-6"
              onClick={() => navigate("/dashboard")}
            >
              <Activity className="mr-2 h-5 w-5" />
              LAUNCH DETECTION DASHBOARD
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary/30 text-lg px-12 py-6 ml-4"
              onClick={() => navigate("/mine-type")}
            >
              <Activity className="mr-2 h-5 w-5" />
              OPEN MINE CLASSIFIER
            </Button>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              © 2025 Intellimine — Autonomous Landmine Detection System.
              All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
