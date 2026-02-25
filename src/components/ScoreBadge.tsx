import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  level: "green" | "yellow" | "red";
  size?: "sm" | "md";
}

const ScoreBadge = ({ score, level, size = "md" }: ScoreBadgeProps) => {
  const colorMap = {
    green: "bg-safe text-safe-foreground",
    yellow: "bg-warning text-warning-foreground",
    red: "bg-emergency text-emergency-foreground",
  };

  const sizeMap = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-display font-bold",
        colorMap[level],
        sizeMap[size]
      )}
    >
      {score}
    </div>
  );
};

export default ScoreBadge;
