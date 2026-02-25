import { motion } from "framer-motion";

const SmartERLogo = ({ size = "lg" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <motion.div
      className="flex items-center gap-2 font-display font-bold"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-xl gradient-emergency flex items-center justify-center shadow-emergency">
          <span className="text-emergency-foreground text-lg font-bold">+</span>
        </div>
        <div className="absolute inset-0 rounded-xl animate-pulse-emergency" />
      </div>
      <div className={sizes[size]}>
        <span className="text-foreground">Smart</span>
        <span className="text-emergency">ER</span>
      </div>
    </motion.div>
  );
};

export default SmartERLogo;
