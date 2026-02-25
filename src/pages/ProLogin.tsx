import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ambulance, Building2, Lock } from "lucide-react";
import SmartERLogo from "@/components/SmartERLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";

const ProLogin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: '400px', backgroundRepeat: 'repeat' }} />
      <div className="relative z-10">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <SmartERLogo size="sm" />
        <div className="ml-auto">
          <LanguageSelector />
        </div>
      </div>

      <div className="px-5 py-8 max-w-sm mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-pro flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-pro-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">{t.professionalLogin}</h2>
          <p className="text-muted-foreground mt-1">{t.proSubtitle}</p>
        </motion.div>

        <div className="space-y-4">
          <motion.button
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="w-full p-5 rounded-full bg-card shadow-card border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
            onClick={() => navigate("/pro/ambulance/auth")}
          >
            <div className="w-12 h-12 rounded-full bg-emergency-light flex items-center justify-center">
              <Ambulance className="w-6 h-6 text-emergency" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-semibold text-foreground">{t.ambulanceLogin}</h3>
              <p className="text-muted-foreground text-sm">{t.ambulanceLoginSub}</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="w-full p-5 rounded-full bg-card shadow-card border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
            onClick={() => navigate("/pro/hospital/auth")}
          >
            <div className="w-12 h-12 rounded-full bg-pro/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-pro" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-semibold text-foreground">{t.hospitalLogin}</h3>
              <p className="text-muted-foreground text-sm">{t.hospitalLoginSub}</p>
            </div>
          </motion.button>
        </div>

        <p className="text-muted-foreground text-xs text-center whitespace-pre-line">{t.proNote}</p>
      </div>
      </div>
    </div>
  );
};

export default ProLogin;
