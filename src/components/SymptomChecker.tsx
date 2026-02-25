import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, AlertTriangle, Activity } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface SymptomCheckerProps {
  onComplete: (result: { condition: string; urgency: string }) => void;
}

const SymptomChecker = ({ onComplete }: SymptomCheckerProps) => {
  const { t } = useLanguage();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const questions = [
    { id: "conscious", text: t.isConscious, icon: Activity },
    { id: "breathing", text: t.isBreathing, icon: Activity },
    { id: "chestPain", text: t.hasChestPain, icon: AlertTriangle },
    { id: "bleeding", text: t.isBleeding, icon: AlertTriangle },
    { id: "fever", text: t.hasFever, icon: Activity },
    { id: "severePain", text: t.inSeverePain, icon: AlertTriangle },
  ];

  const handleAnswer = (answer: boolean) => {
    const q = questions[currentQ];
    const newAnswers = { ...answers, [q.id]: answer };
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const critical = !newAnswers.conscious || !newAnswers.breathing || newAnswers.chestPain;
      const moderate = newAnswers.bleeding || newAnswers.severePain;

      let condition = "General Emergency";
      if (newAnswers.chestPain) condition = "Suspected Cardiac Event";
      else if (!newAnswers.conscious) condition = "Unconsciousness - Critical";
      else if (!newAnswers.breathing) condition = "Respiratory Emergency";
      else if (newAnswers.bleeding) condition = "Trauma / Bleeding";
      else if (newAnswers.severePain && newAnswers.fever) condition = "Acute Infection / Pain";

      onComplete({
        condition,
        urgency: critical ? "Critical" : moderate ? "Moderate" : "Stable",
      });
    }
  };

  const Icon = questions[currentQ].icon;
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div className="h-full gradient-emergency rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>
      <p className="text-muted-foreground text-sm text-center">
        {t.questionOf} {currentQ + 1} / {questions.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emergency-light flex items-center justify-center mx-auto">
            <Icon className="w-8 h-8 text-emergency" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">{questions[currentQ].text}</h3>
          <div className="flex gap-4 justify-center">
            <button onClick={() => handleAnswer(true)} className="flex-1 max-w-[160px] py-4 rounded-[12px] bg-safe text-safe-foreground font-display font-semibold text-base active:scale-[0.97] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-safe/50">
              {t.yes}
            </button>
            <button onClick={() => handleAnswer(false)} className="flex-1 max-w-[160px] py-4 rounded-[12px] bg-destructive text-destructive-foreground font-display font-semibold text-base active:scale-[0.97] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-destructive/50">
              {t.no}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SymptomChecker;
