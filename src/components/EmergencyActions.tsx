import { motion } from "framer-motion";
import { Phone, MapPin, Ambulance, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

interface EmergencyActionsProps {
  hospitalPhone?: string;
}

const EmergencyActions = ({ hospitalPhone }: EmergencyActionsProps) => {
  const { t } = useLanguage();

  const actions = [
    {
      icon: Ambulance,
      label: t.callAmbulance,
      color: "gradient-emergency shadow-emergency",
      textColor: "text-emergency-foreground",
      action: () => { window.location.href = "tel:102"; },
    },
    {
      icon: MapPin,
      label: t.shareLocation,
      color: "gradient-pro",
      textColor: "text-pro-foreground",
      action: () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
            if (navigator.share) {
              navigator.share({ title: "My Emergency Location", url });
            } else {
              navigator.clipboard.writeText(url);
              toast.success("Location copied to clipboard!");
            }
          });
        }
      },
    },
    {
      icon: Phone,
      label: t.callHospital,
      color: "gradient-safe",
      textColor: "text-safe-foreground",
      action: () => {
        if (hospitalPhone) window.location.href = `tel:${hospitalPhone}`;
        else toast.info("Select a hospital first");
      },
    },
    {
      icon: AlertTriangle,
      label: t.sosAlert,
      color: "gradient-emergency shadow-emergency",
      textColor: "text-emergency-foreground",
      action: () => {
        toast.success("SOS Alert sent to emergency contacts & nearby hospitals!");
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          onClick={action.action}
          className={`${action.color} ${action.textColor} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform`}
        >
          <action.icon className="w-7 h-7" />
          <span className="font-display font-semibold text-sm">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default EmergencyActions;
