import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Stethoscope, HelpCircle, HeartPulse, ShieldAlert, Wind, Brain, Baby, Skull, AlertCircle,
  Loader2, Navigation, Volume2, VolumeX, Clock, Bell, Ambulance as AmbulanceIcon, TriangleAlert, Car,
} from "lucide-react";
import SmartERLogo from "@/components/SmartERLogo";
import SymptomChecker from "@/components/SymptomChecker";
import HospitalCard from "@/components/HospitalCard";
import EmergencyActions from "@/components/EmergencyActions";
import OpenStreetMap from "@/components/OpenStreetMap";
import type { RouteInfo } from "@/components/OpenStreetMap";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";
import { mockHospitals, type Hospital } from "@/data/mockHospitals";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";
import { addNotification } from "@/stores/notificationStore";
import { addAmbulanceRequest } from "@/stores/notificationStore";

type Mode = "select" | "ambulance" | "own-vehicle";
type Step = "mode-select" | "location" | "condition-choice" | "known" | "unknown" | "results" | "ambulance-tracking";

const EmergencyFlow = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("select");
  const [step, setStep] = useState<Step>("mode-select");
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [condition, setCondition] = useState("");
  const [urgency, setUrgency] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [notified, setNotified] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [etaTime, setEtaTime] = useState<string | null>(null);
  const [ambulanceAllocated, setAmbulanceAllocated] = useState(false);
  const [ambulanceEta, setAmbulanceEta] = useState("5 min");
  const voice = useVoiceNavigation();

  const handleRouteInfo = useCallback((info: RouteInfo) => {
    setRouteInfo(info);
    setEtaTime(info.duration);
    if (info.steps.length > 0) voice.announceStep(info.steps, 0);
  }, [voice]);

  useEffect(() => {
    if (!isNavigating || !routeInfo) return;
    const interval = setInterval(() => {
      if (routeInfo) voice.announceETA(routeInfo.duration, routeInfo.distance);
    }, 30000);
    return () => clearInterval(interval);
  }, [isNavigating, routeInfo, voice]);

  useEffect(() => {
    if (!isNavigating) { voice.reset(); setEtaTime(null); }
  }, [isNavigating, voice]);

  const categories = [
    { id: "cardiac", label: t.cardiac, icon: HeartPulse, accent: "bg-destructive", iconBg: "bg-destructive/10", iconText: "text-destructive" },
    { id: "trauma", label: t.accidentTrauma, icon: ShieldAlert, accent: "bg-warning", iconBg: "bg-warning/10", iconText: "text-warning" },
    { id: "breathing", label: t.breathingProblem, icon: Wind, accent: "bg-pro", iconBg: "bg-pro/10", iconText: "text-pro" },
    { id: "stroke", label: t.strokeSymptoms, icon: Brain, accent: "bg-destructive", iconBg: "bg-destructive/10", iconText: "text-destructive" },
    { id: "pregnancy", label: t.pregnancyEmergency, icon: Baby, accent: "bg-warning", iconBg: "bg-warning/10", iconText: "text-warning" },
    { id: "poisoning", label: t.poisoning, icon: Skull, accent: "bg-destructive", iconBg: "bg-destructive/10", iconText: "text-destructive" },
    { id: "unknown", label: t.unknownOther, icon: AlertCircle, accent: "bg-muted-foreground", iconBg: "bg-muted", iconText: "text-muted-foreground" },
  ];

  const detectLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
          setLocated(true);
          if (mode === "ambulance") {
            setTimeout(() => requestAmbulance(), 600);
          } else {
            setTimeout(() => setStep("condition-choice"), 600);
          }
        },
        () => {
          setUserPos([16.4575, 80.5354]);
          setLocating(false);
          setLocated(true);
          if (mode === "ambulance") {
            setTimeout(() => requestAmbulance(), 600);
          } else {
            setTimeout(() => setStep("condition-choice"), 600);
          }
        }
      );
    } else {
      setUserPos([16.4575, 80.5354]);
      setLocating(false);
      setLocated(true);
      if (mode === "ambulance") {
        setTimeout(() => requestAmbulance(), 600);
      } else {
        setTimeout(() => setStep("condition-choice"), 600);
      }
    }
  };

  const requestAmbulance = () => {
    setStep("ambulance-tracking");
    setAmbulanceAllocated(false);
    // Notify ambulance dashboard
    addAmbulanceRequest({
      userName: "Public User",
      location: userPos || [16.4575, 80.5354],
    });
    // Simulate ambulance allocation after 2s
    setTimeout(() => {
      setAmbulanceAllocated(true);
      setAmbulanceEta("5 min");
      voice.speak("Ambulance AMB-1042 has been allocated and is on its way.");
    }, 2000);
  };

  const handleKnownProblem = (cat: string) => {
    setCondition(cat.charAt(0).toUpperCase() + cat.slice(1) + " Emergency");
    setUrgency("Critical");
    // Auto-select best hospital and go to results
    const best = sortedHospitals[0];
    setSelectedHospital(best);
    setStep("results");
    // Auto-start navigation after a brief delay
    setTimeout(() => {
      setIsNavigating(true);
      if (best) {
        sendNotification(best);
        voice.speak(`Navigating to ${best.name}. Hospital has been notified.`);
      }
    }, 800);
  };

  const handleSymptomResult = (result: { condition: string; urgency: string }) => {
    setCondition(result.condition);
    setUrgency(result.urgency);
    const best = sortedHospitals[0];
    setSelectedHospital(best);
    setStep("results");
    // Auto-start navigation
    setTimeout(() => {
      setIsNavigating(true);
      if (best) {
        sendNotificationDirect(best, result.condition, result.urgency);
        voice.speak(`Condition identified: ${result.condition}. Navigating to ${best.name}. Hospital has been notified.`);
      }
    }, 800);
  };

  const sendNotificationDirect = useCallback((hospital: Hospital, cond: string, urg: string) => {
    setNotified(true);
    addNotification({
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      condition: cond,
      urgency: urg,
      driverUnit: "PUBLIC-USER",
      eta: routeInfo?.duration || `${hospital.eta} min`,
      distance: routeInfo?.distance || `${hospital.distance} km`,
      source: "public",
    });
    setTimeout(() => setNotified(false), 3000);
  }, [routeInfo]);

  const sendNotification = useCallback((hospital: Hospital) => {
    sendNotificationDirect(hospital, condition, urgency);
  }, [condition, urgency, sendNotificationDirect]);

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    if (isNavigating) {
      sendNotification(hospital);
      voice.speak(`Hospital changed to ${hospital.name}. Notification sent.`);
    }
  };

  // Map condition keywords to required hospital specialties
  const getRequiredSpecialties = (cond: string): string[] => {
    const lower = cond.toLowerCase();
    if (lower.includes("cardiac") || lower.includes("heart") || lower.includes("chest pain"))
      return ["Cardiology", "Trauma"];
    if (lower.includes("stroke") || lower.includes("paralysis") || lower.includes("brain"))
      return ["Neurology", "Trauma"];
    if (lower.includes("trauma") || lower.includes("accident") || lower.includes("fracture") || lower.includes("bleeding"))
      return ["Trauma", "Orthopedics"];
    if (lower.includes("breathing") || lower.includes("respiratory") || lower.includes("asthma"))
      return ["General Medicine", "Trauma"];
    if (lower.includes("poison") || lower.includes("overdose"))
      return ["General Medicine", "Trauma"];
    if (lower.includes("pregnancy") || lower.includes("labor"))
      return ["General Medicine"];
    if (lower.includes("eye") || lower.includes("vision") || lower.includes("sight") || lower.includes("blind") || lower.includes("ophthal"))
      return ["Ophthalmology", "General Medicine"];
    if (lower.includes("dental") || lower.includes("tooth") || lower.includes("teeth"))
      return ["Dentistry", "General Medicine"];
    if (lower.includes("skin") || lower.includes("rash") || lower.includes("burn"))
      return ["Dermatology", "General Medicine"];
    if (lower.includes("ear") || lower.includes("hearing") || lower.includes("nose") || lower.includes("throat") || lower.includes("ent"))
      return ["ENT", "General Medicine"];
    if (lower.includes("unconscious") || lower.includes("not breathing"))
      return ["Trauma", "Cardiology", "Neurology"];
    return []; // no filter for unknown conditions
  };

  const detectUrgency = (text: string): string => {
    const lower = text.toLowerCase();
    const criticalKeywords = ["unconscious", "not breathing", "cardiac arrest", "heart attack", "severe bleeding", "stroke", "seizure", "choking"];
    const moderateKeywords = ["pain", "fracture", "breathing", "fever", "vomiting", "dizziness", "swelling", "burn"];
    if (criticalKeywords.some((k) => lower.includes(k))) return "Critical";
    if (moderateKeywords.some((k) => lower.includes(k))) return "Moderate";
    return "Moderate";
  };

  const getFilteredHospitals = (cond: string, urg: string) => {
    const requiredSpecs = getRequiredSpecialties(cond);
    let hospitals = [...mockHospitals];

    // Specialty-only hospitals that should be excluded when condition doesn't match
    const nicheSpecialties = ["Ophthalmology", "Dentistry", "Dermatology", "ENT"];

    if (requiredSpecs.length > 0 && cond) {
      const matched = hospitals.filter((h) =>
        h.specialties.some((s) => requiredSpecs.includes(s))
      );
      if (matched.length > 0) hospitals = matched;
    }

    // Exclude hospitals that have ANY niche specialty unless the condition requires it
    hospitals = hospitals.filter((h) => {
      const hasNiche = h.specialties.some((s) => nicheSpecialties.includes(s));
      if (!hasNiche) return true; // no niche specialty, always keep
      // Keep only if at least one of its niche specialties is required
      return h.specialties.some((s) => nicheSpecialties.includes(s) && requiredSpecs.includes(s));
    });

    if (urg === "Critical") {
      const withICU = hospitals.filter((h) => h.beds.icu > 0);
      if (withICU.length > 0) hospitals = withICU;
    }
    return hospitals.sort((a, b) => b.smarterScore - a.smarterScore);
  };

  const sortedHospitals = getFilteredHospitals(condition, urgency);

  const urgencyColor = {
    Critical: "gradient-emergency text-emergency-foreground",
    Moderate: "bg-warning text-warning-foreground",
    Stable: "bg-safe text-safe-foreground",
  };

  const handleModeSelect = (selectedMode: "ambulance" | "own-vehicle") => {
    setMode(selectedMode);
    setStep("location");
  };

  const goBack = () => {
    if (step === "mode-select") navigate("/");
    else if (step === "location") setStep("mode-select");
    else if (step === "condition-choice") setStep("location");
    else if (step === "known" || step === "unknown") setStep("condition-choice");
    else if (step === "ambulance-tracking") setStep("mode-select");
    else setStep("condition-choice");
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 z-0 opacity-40" style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: '400px', backgroundRepeat: 'repeat' }} />
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <SmartERLogo size="sm" />
        <div className="ml-auto">
          <LanguageSelector />
        </div>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* MODE SELECTION */}
          {step === "mode-select" && (
            <motion.div key="mode-select" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">How do you need help?</h2>
                <p className="text-muted-foreground mt-1">Choose your emergency transport mode</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleModeSelect("ambulance")}
                  className="w-full p-6 rounded-2xl bg-card shadow-card border border-border flex items-center gap-5 active:scale-[0.98] transition-transform"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emergency/10 flex items-center justify-center">
                    <AmbulanceIcon className="w-8 h-8 text-emergency" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-lg text-foreground">Request for Ambulance</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">An ambulance will be dispatched to your location</p>
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect("own-vehicle")}
                  className="w-full p-6 rounded-2xl bg-card shadow-card border border-warning/30 flex items-center gap-5 active:scale-[0.98] transition-transform relative"
                >
                  <div className="absolute top-3 right-3">
                    <TriangleAlert className="w-5 h-5 text-warning" />
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-pro/10 flex items-center justify-center">
                    <Car className="w-8 h-8 text-pro" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-lg text-foreground">Own Vehicle</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Navigate to the best hospital yourself</p>
                    <p className="text-warning text-[10px] sm:text-xs font-semibold mt-1 flex items-center gap-1">
                      <TriangleAlert className="w-3 h-3" /> Use only if ambulance services are unreachable
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* LOCATION DETECTION */}
          {step === "location" && (
            <motion.div key="location" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{t.detectingLocation}</h2>
                <p className="text-muted-foreground mt-1">{t.detectLocationSub}</p>
              </div>

              <OpenStreetMap userLat={userPos?.[0]} userLng={userPos?.[1]} className="h-48" allowToggleSize />

              <button
                onClick={detectLocation}
                disabled={locating}
                className="w-full py-4 rounded-full gradient-emergency text-emergency-foreground font-display font-semibold text-lg shadow-emergency flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {locating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t.detecting}</>
                ) : located ? (
                  <><MapPin className="w-5 h-5" /> {t.locationDetected}</>
                ) : (
                  <><MapPin className="w-5 h-5" /> {t.detectMyLocation}</>
                )}
              </button>
            </motion.div>
          )}

          {/* AMBULANCE TRACKING */}
          {step === "ambulance-tracking" && (
            <motion.div key="ambulance-tracking" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {ambulanceAllocated ? "Ambulance On The Way" : "Requesting Ambulance..."}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {ambulanceAllocated ? "Your ambulance is heading to your location" : "Finding the nearest available ambulance"}
                </p>
              </div>

              {!ambulanceAllocated && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <Loader2 className="w-12 h-12 text-emergency animate-spin" />
                  <p className="text-sm text-muted-foreground">Dispatching nearest ambulance...</p>
                </div>
              )}

              {ambulanceAllocated && (
                <>
                  {/* Ambulance Info Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl bg-emergency/5 border border-emergency/20 p-5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emergency/10 flex items-center justify-center">
                        <AmbulanceIcon className="w-7 h-7 text-emergency" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-foreground">Unit AMB-1042</p>
                        <p className="text-xs text-muted-foreground">SmartER Ambulance 7</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-muted-foreground">ETA</p>
                        <p className="font-display font-bold text-xl text-emergency">{ambulanceEta}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-safe font-semibold">
                      <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                      Live tracking active
                    </div>
                  </motion.div>

                  {/* Live Map showing ambulance approaching */}
                  <OpenStreetMap
                    userLat={userPos?.[0]}
                    userLng={userPos?.[1]}
                    hospitalLat={(userPos?.[0] || 16.4575) + 0.005}
                    hospitalLng={(userPos?.[1] || 80.5354) + 0.003}
                    showRoute
                    navigating
                    className="h-64"
                    onRouteInfo={(info) => setAmbulanceEta(info.duration)}
                    allowToggleSize
                  />

                  <div className="rounded-2xl bg-safe/10 border border-safe/20 p-4 text-center">
                    <p className="text-sm font-medium text-safe">
                      🚑 Ambulance notified and en route to your location
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Stay where you are. Help is on the way.</p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* OWN VEHICLE: CONDITION CHOICE */}
          {step === "condition-choice" && (
            <motion.div key="choice" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{t.whatsEmergency}</h2>
                <p className="text-muted-foreground mt-1">{t.helpFindHospital}</p>
              </div>

              <div className="space-y-3">
                <button onClick={() => setStep("known")} className="w-full p-5 rounded-[14px] bg-card shadow-sm border border-border/60 flex items-center gap-4 active:scale-[0.98] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring">
                  <div className="w-12 h-12 rounded-xl bg-emergency-light flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-emergency" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-semibold text-foreground">{t.iKnowProblem}</h3>
                    <p className="text-muted-foreground text-sm">{t.selectFromCategories}</p>
                  </div>
                </button>

                <button onClick={() => setStep("unknown")} className="w-full p-5 rounded-[14px] bg-card shadow-sm border border-border/60 flex items-center gap-4 active:scale-[0.98] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring">
                  <div className="w-12 h-12 rounded-xl bg-pro/10 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-pro" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-semibold text-foreground">{t.iDontKnow}</h3>
                    <p className="text-muted-foreground text-sm">{t.aiWillHelp}</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* KNOWN PROBLEM */}
          {step === "known" && (
            <motion.div key="known" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{t.selectEmergencyType}</h2>
                <p className="text-muted-foreground mt-1">{t.chooseClosest}</p>
              </div>
              {/* SOS Critical Button */}
              <button
                onClick={() => {
                  setCondition("Critical — Unconscious / Not Breathing");
                  setUrgency("Critical");
                  const best = sortedHospitals[0];
                  setSelectedHospital(best);
                  if (best) {
                    sendNotificationDirect(best, "Critical — Unconscious / Not Breathing", "Critical");
                  }
                  requestAmbulance();
                  voice.speak("SOS activated. Ambulance dispatched. Nearest hospital notified.");
                }}
                className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-destructive text-destructive-foreground active:scale-[0.97] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-destructive/50"
              >
                <div className="w-11 h-11 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <TriangleAlert className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-display font-semibold text-sm">SOS — Patient Unconscious / Not Breathing</p>
                  <p className="text-xs opacity-80 mt-0.5">Dispatches ambulance & notifies hospital instantly</p>
                </div>
              </button>

              {/* Text input for custom problem */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Or type your problem here..."
                  className="w-full px-4 py-3 rounded-[14px] border border-border/60 bg-card text-foreground placeholder:text-muted-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring pr-20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                      const val = (e.target as HTMLInputElement).value.trim();
                      const urg = detectUrgency(val);
                      const filtered = getFilteredHospitals(val, urg);
                      const best = filtered[0];
                      setCondition(val);
                      setUrgency(urg);
                      setSelectedHospital(best);
                      setStep("results");
                      setTimeout(() => {
                        setIsNavigating(true);
                        if (best) {
                          sendNotificationDirect(best, val, urg);
                          voice.speak(`Navigating to ${best.name}. Hospital has been notified.`);
                        }
                      }, 800);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder="Or type your problem here..."]');
                    if (input && input.value.trim()) {
                      const val = input.value.trim();
                      const urg = detectUrgency(val);
                      const filtered = getFilteredHospitals(val, urg);
                      const best = filtered[0];
                      setCondition(val);
                      setUrgency(urg);
                      setSelectedHospital(best);
                      setStep("results");
                      setTimeout(() => {
                        setIsNavigating(true);
                        if (best) {
                          sendNotificationDirect(best, val, urg);
                          voice.speak(`Navigating to ${best.name}. Hospital has been notified.`);
                        }
                      }, 800);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  Go
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground font-medium">or select a category</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleKnownProblem(cat.id)}
                    className="relative overflow-hidden bg-card border border-border/60 rounded-[14px] shadow-sm flex items-center gap-3 p-4 text-left active:scale-[0.98] transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${cat.accent}`} />
                    <div className={`w-11 h-11 rounded-lg ${cat.iconBg} flex items-center justify-center shrink-0`}>
                      <cat.icon className={`w-6 h-6 ${cat.iconText}`} />
                    </div>
                    <span className="font-display font-medium text-[13px] leading-tight text-foreground">{cat.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* UNKNOWN - SYMPTOM CHECKER */}
          {step === "unknown" && (
            <motion.div key="unknown" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{t.aiSymptomCheck}</h2>
                <p className="text-muted-foreground mt-1">{t.answerQuestions}</p>
              </div>
              <SymptomChecker onComplete={handleSymptomResult} />
            </motion.div>
          )}

          {/* RESULTS & NAVIGATION */}
          {step === "results" && (
            <motion.div key="results" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className={`rounded-2xl p-4 ${urgencyColor[urgency as keyof typeof urgencyColor] || "bg-secondary"}`}>
                <p className="text-sm font-body opacity-80">{t.predictedCondition}</p>
                <h3 className="font-display font-bold text-xl">{condition}</h3>
                <p className="text-sm font-display font-semibold mt-1">{t.urgency}: {urgency}</p>
              </div>

              {/* Live ETA Banner */}
              {isNavigating && etaTime && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-pro/10 border border-pro/20 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pro/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-pro" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                      <p className="font-display font-bold text-xl text-foreground">{etaTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-display font-semibold text-foreground">{routeInfo?.distance}</p>
                  </div>
                </motion.div>
              )}

              {/* Route Map */}
              <div className="space-y-2">
                <h4 className="font-display font-semibold text-sm text-foreground flex items-center justify-between">
                  Route to Hospital
                  {routeInfo && !isNavigating && (
                    <span className="text-xs font-body text-muted-foreground">
                      {routeInfo.distance} · {routeInfo.duration}
                    </span>
                  )}
                </h4>
                <OpenStreetMap
                  userLat={userPos?.[0]}
                  userLng={userPos?.[1]}
                  hospitalLat={selectedHospital?.lat || sortedHospitals[0]?.lat}
                  hospitalLng={selectedHospital?.lng || sortedHospitals[0]?.lng}
                  showRoute
                  navigating={isNavigating}
                  className={isNavigating ? "h-72" : "h-48"}
                  onRouteInfo={handleRouteInfo}
                  allowToggleSize
                />
              </div>

              {/* Turn-by-turn directions */}
              {isNavigating && routeInfo && routeInfo.steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  <div className="p-3 bg-pro/10 border-b border-border flex items-center justify-between">
                    <span className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-pro" /> Directions
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={voice.toggleVoice}
                        className={`p-1.5 rounded-full transition-colors ${voice.voiceEnabled ? "bg-pro/20 text-pro" : "bg-secondary text-muted-foreground"}`}
                      >
                        {voice.voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setIsNavigating(false); setRouteInfo(null); }}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-full bg-secondary"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border">
                    {routeInfo.steps.filter(s => s.distance > 0).map((s, i) => (
                      <div
                        key={i}
                        className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-secondary/50 transition-colors ${voice.currentStepIndex === i ? "bg-pro/5 border-l-2 border-l-pro" : ""}`}
                        onClick={() => voice.announceStep(routeInfo.steps, i)}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${voice.currentStepIndex === i ? "bg-pro text-white" : "bg-pro/10"}`}>
                          <span className={`text-xs font-bold ${voice.currentStepIndex === i ? "" : "text-pro"}`}>{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{s.instruction}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.distance >= 1000 ? `${(s.distance / 1000).toFixed(1)} km` : `${Math.round(s.distance)} m`}
                            {" · "}
                            {Math.round(s.duration / 60)} min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Navigate button */}
              <button
                onClick={() => {
                  const newVal = !isNavigating;
                  setIsNavigating(newVal);
                  if (newVal) {
                    const hosp = selectedHospital || sortedHospitals[0];
                    if (hosp) sendNotification(hosp);
                    voice.speak(`Starting navigation. ${hosp?.name || "Hospital"} has been notified.`);
                  }
                }}
                className={`w-full p-4 rounded-2xl font-display font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform ${isNavigating ? "bg-pro text-pro-foreground" : "bg-safe text-safe-foreground"}`}
              >
                <Navigation className="w-5 h-5" /> {isNavigating ? "Navigating..." : "Navigate to Hospital"}
              </button>

              {/* Auto-notification banner */}
              {notified && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-safe/10 border border-safe/20 p-3 flex items-center gap-3"
                >
                  <Bell className="w-5 h-5 text-safe" />
                  <span className="text-sm font-medium text-safe">
                    {selectedHospital?.name || sortedHospitals[0]?.name} has been notified of your arrival
                  </span>
                </motion.div>
              )}

              <EmergencyActions hospitalPhone={selectedHospital?.phone} />

              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-3">{t.bestHospitalsNearby}</h3>
                <div className="space-y-3">
                  {sortedHospitals.map((hospital, i) => (
                    <HospitalCard key={hospital.id} hospital={hospital} index={i} onSelect={handleSelectHospital} />
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
                <h4 className="font-display font-semibold text-sm text-foreground mb-2">{t.scoreGuide}</h4>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-safe" /> {t.bestMatch}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-warning" /> {t.moderate}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emergency" /> {t.notRecommended}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmergencyFlow;
