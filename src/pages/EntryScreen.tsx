import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Shield } from "lucide-react";
import SmartERLogo from "@/components/SmartERLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";

const EntryScreen = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url(/images/background2.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute top-0 left-0 right-0 h-[40vh] gradient-hero opacity-[0.04] rounded-b-[60px]" />

      {/* Language selector top-right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <SmartERLogo size="lg" />

        <motion.p
          className="text-muted-foreground text-center text-base font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {t.tagline}
        </motion.p>


        <div className="w-full space-y-4 mt-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/pro")}
            className="w-full py-5 rounded-full bg-foreground text-background font-display font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
          >
            <Shield className="w-6 h-6" />
            {t.proLogin}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/public/auth")}
            className="w-full py-4 rounded-full bg-card border border-border text-foreground font-display font-semibold text-base flex items-center justify-center gap-3"
          >
            <Heart className="w-5 h-5 text-emergency" />
            {t.publicHelp}
          </motion.button>
        </div>

        <p className="text-muted-foreground text-xs text-center mt-4 font-body whitespace-pre-line">
          {t.privacyNote}
        </p>
      </motion.div>
    </div>
  );
};

export default EntryScreen;
