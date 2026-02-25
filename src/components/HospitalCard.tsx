import { motion } from "framer-motion";
import { MapPin, Clock, Bed, UserCheck, Phone, Navigation } from "lucide-react";
import ScoreBadge from "./ScoreBadge";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Hospital } from "@/data/mockHospitals";

interface HospitalCardProps {
  hospital: Hospital;
  index: number;
  onSelect: (hospital: Hospital) => void;
  onNavigate?: (hospital: Hospital) => void;
  isNavigating?: boolean;
  isSelected?: boolean;
}

const HospitalCard = ({ hospital, index, onSelect, onNavigate, isNavigating, isSelected }: HospitalCardProps) => {
  const { t } = useLanguage();

  const borderColor = {
    green: "border-safe/30",
    yellow: "border-warning/30",
    red: "border-emergency/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSelect(hospital)}
      className={`bg-card rounded-2xl p-4 shadow-card border-2 ${isSelected ? "border-pro ring-2 ring-pro/20" : borderColor[hospital.scoreLevel]} cursor-pointer active:scale-[0.98] transition-transform`}
    >
      <div className="flex items-start gap-3">
        <ScoreBadge score={hospital.smarterScore} level={hospital.scoreLevel} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-lg truncate">{hospital.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{hospital.distance} km</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{hospital.eta} min</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="flex items-center gap-1 text-xs bg-secondary rounded-full px-2.5 py-1">
              <Bed className="w-3 h-3" />
              ICU: {hospital.beds.icu} | Gen: {hospital.beds.general}
            </span>
            <span className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${hospital.specialistAvailable ? "bg-safe/10 text-safe" : "bg-emergency/10 text-emergency"}`}>
              <UserCheck className="w-3 h-3" />
              {hospital.specialistAvailable ? t.specialist : t.noSpecialist}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex flex-wrap gap-1">
          {hospital.equipment.slice(0, 3).map((eq) => (
            <span key={eq} className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">{eq}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(hospital); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                isNavigating && isSelected
                  ? "bg-pro text-pro-foreground"
                  : "bg-safe/10 text-safe hover:bg-safe/20"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              {isNavigating && isSelected ? "Navigating" : "Navigate"}
            </button>
          )}
          <a href={`tel:${hospital.phone}`} onClick={(e) => e.stopPropagation()} className="w-9 h-9 rounded-full gradient-emergency flex items-center justify-center shadow-emergency">
            <Phone className="w-4 h-4 text-emergency-foreground" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default HospitalCard;
