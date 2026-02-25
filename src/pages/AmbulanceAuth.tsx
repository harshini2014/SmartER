import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ambulance, Loader2 } from "lucide-react";
import SmartERLogo from "@/components/SmartERLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

const AmbulanceAuth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const { isLoggedIn, loading, error, login, signup } = useAuth("ambulance");
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [license, setLicense] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  useEffect(() => {
    if (isLoggedIn && !loading) navigate("/pro/ambulance", { replace: true });
  }, [isLoggedIn, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signup({
          email,
          password,
          displayName: fullName,
          role: "ambulance",
          extra: { license, vehicleId },
        });
      } else {
        await login(email, password);
      }
      navigate("/pro/ambulance");
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emergency" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: '400px', backgroundRepeat: 'repeat' }} />
      <div className="relative z-10">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/pro")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <SmartERLogo size="sm" />
          <div className="ml-auto">
            <LanguageSelector />
          </div>
        </div>

        <div className="px-5 py-8 max-w-sm mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emergency-light flex items-center justify-center mx-auto mb-4">
              <Ambulance className="w-8 h-8 text-emergency" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {isSignUp ? "Ambulance Sign Up" : "Ambulance Login"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {isSignUp ? "Create your ambulance crew account" : "Sign in to your ambulance dashboard"}
            </p>
          </motion.div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="rounded-full h-12" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">License Number</label>
                  <Input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="e.g. AMB-2024-XXXX" className="rounded-full h-12" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Vehicle ID</label>
                  <Input value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} placeholder="Enter vehicle identification" className="rounded-full h-12" required />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="crew@ambulance.com" className="rounded-full h-12" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="rounded-full h-12" required />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-full bg-emergency text-white font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </motion.form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-emergency font-semibold underline-offset-2 underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceAuth;
