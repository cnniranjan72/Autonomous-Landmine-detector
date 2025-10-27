import { useEffect, useState } from "react";

export const ScrollIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2">
      <div className="h-32 w-1 bg-border rounded-full overflow-hidden">
        <div
          className="w-full bg-primary transition-all duration-200 glow-primary"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-mono">
        {Math.round(scrollProgress)}%
      </span>
    </div>
  );
};
