import { Card } from "@/components/ui/card";
import { MapPin, Skull, Navigation } from "lucide-react";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: "mine" | "clear" | "robot";
}

interface FieldMapProps {
  markers: MapMarker[];
  robotPosition: { lat: number; lng: number };
}

export const FieldMap = ({ markers, robotPosition }: FieldMapProps) => {
  // Simulate a tactical map view
  const mapCenterLat = 34.05;
  const mapCenterLng = -118.24;
  
  // Convert lat/lng to pixel positions (simplified)
  const coordToPixel = (lat: number, lng: number) => {
    const x = ((lng - (mapCenterLng - 0.05)) / 0.1) * 100;
    const y = ((mapCenterLat + 0.05 - lat) / 0.1) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <Card className="relative border-2 border-primary/30 bg-card overflow-hidden h-[600px]">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 bg-card/90 backdrop-blur-sm border-b border-border z-10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">FIELD MAP</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            CENTER: {mapCenterLat.toFixed(4)}°N, {Math.abs(mapCenterLng).toFixed(4)}°W
          </div>
        </div>
      </div>

      {/* Map Background with Grid */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background/80" />

      {/* Map Content */}
      <div className="relative h-full pt-16">
        {/* Robot Position */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{
            left: coordToPixel(robotPosition.lat, robotPosition.lng).x,
            top: coordToPixel(robotPosition.lat, robotPosition.lng).y,
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
            <Navigation className="h-6 w-6 text-primary relative z-10" />
          </div>
        </div>

        {/* Markers */}
        {markers.map((marker) => {
          const pos = coordToPixel(marker.lat, marker.lng);
          
          if (marker.type === "mine") {
            return (
              <div
                key={marker.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: pos.x, top: pos.y }}
              >
                <div className="relative pulse-danger">
                  <Skull className="h-8 w-8 text-destructive" />
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded font-bold">
                      MINE
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          if (marker.type === "clear") {
            return (
              <div
                key={marker.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: pos.x, top: pos.y }}
              >
                <div className="h-3 w-3 bg-success/50 rounded-full" />
              </div>
            );
          }
          
          return null;
        })}

        {/* Robot Path Trail (simulated) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          <path
            d={`M ${coordToPixel(34.048, -118.242).x} ${coordToPixel(34.048, -118.242).y} 
                L ${coordToPixel(34.050, -118.240).x} ${coordToPixel(34.050, -118.240).y}
                L ${coordToPixel(robotPosition.lat, robotPosition.lng).x} ${coordToPixel(robotPosition.lat, robotPosition.lng).y}`}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,5"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded p-3 text-xs">
        <div className="font-semibold mb-2 uppercase tracking-wide">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skull className="h-4 w-4 text-destructive" />
            <span>Mine Detected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-success/50 rounded-full" />
            <span>Clear Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            <span>Robot Position</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
