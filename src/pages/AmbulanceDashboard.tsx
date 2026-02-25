import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, HeartPulse, ShieldAlert, Wind, Brain, Baby, Skull, AlertCircle,
  Loader2, Navigation, Bell, Phone, Ambulance, User, Volume2, VolumeX, Clock, TriangleAlert,
} from "lucide-react";
import SmartERLogo from "@/components/SmartERLogo";
import HospitalCard from "@/components/HospitalCard";
import LanguageSelector from "@/components/LanguageSelector";
import OpenStreetMap from "@/components/OpenStreetMap";
import type { RouteInfo } from "@/components/OpenStreetMap";
import { useLanguage } from "@/i18n/LanguageContext";
import { mockHospitals, type Hospital } from "@/data/mockHospitals";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";
import { addNotification } from "@/stores/notificationStore";
import {
  markAmbulanceRequestSeen,
  subscribeAmbulance,
  type AmbulanceRequest,
} from "@/stores/notificationStore";

type Step = "location" | "condition-choice" | "results";

const AmbulanceDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("location");
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [userAddress, setUserAddress] = useState("");
  const [condition, setCondition] = useState("");
  const [urgency, setUrgency] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [notified, setNotified] = useState(false);
  const [customProblem, setCustomProblem] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [etaTime, setEtaTime] = useState<string | null>(null);
  const voice = useVoiceNavigation();
  const [ambRequests, setAmbRequests] = useState<AmbulanceRequest[]>([]);

  useEffect(() => {
    return subscribeAmbulance((reqs) => setAmbRequests(reqs));
  }, []);

  const handleRouteInfo = useCallback((info: RouteInfo) => {
    setRouteInfo(info);
    setEtaTime(info.duration);
    if (info.steps.length > 0) {
      voice.announceStep(info.steps, 0);
    }
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

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data?.display_name) {
        setUserAddress(data.display_name);
      }
    } catch {
      setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const detectLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(coords);
          setLocating(false);
          setLocated(true);
          reverseGeocode(coords[0], coords[1]);
          setTimeout(() => setStep("condition-choice"), 600);
        },
        () => {
          const fallback: [number, number] = [16.4575, 80.5354];
          setUserPos(fallback);
          setLocating(false);
          setLocated(true);
          reverseGeocode(fallback[0], fallback[1]);
          setTimeout(() => setStep("condition-choice"), 600);
        }
      );
    } else {
      const fallback: [number, number] = [16.4575, 80.5354];
      setUserPos(fallback);
      setLocating(false);
      setLocated(true);
      reverseGeocode(fallback[0], fallback[1]);
      setTimeout(() => setStep("condition-choice"), 600);
    }
  };

  const analyzeCriticality = (text: string): { condition: string; urgency: string } => {
    const lower = text.toLowerCase();

    const criticalKeywords = [
      "unconscious", "not breathing", "cardiac arrest", "heart attack", "choking",
      "drowning", "severe bleeding", "gunshot", "stab", "unresponsive", "no pulse",
      "anaphylaxis", "seizure", "convulsion", "stroke", "paralysis", "collapse",
      "electrocution", "hanging", "suffocation", "coma", "brain", "head injury",
      "skull fracture", "internal bleeding", "chest pain", "cardiac", "hemorrhage",
      "overdose", "poisoning", "suicide", "burn severe", "third degree", "amputation",
    ];

    const moderateKeywords = [
      "fracture", "broken bone", "dislocation", "deep cut", "laceration",
      "breathing difficulty", "asthma attack", "allergic reaction", "high fever",
      "vomiting blood", "severe pain", "abdominal pain", "pregnancy complication",
      "miscarriage", "premature labor", "contraction", "fall", "accident",
      "burn", "second degree", "blood", "bleeding", "wound", "trauma",
      "dizzy", "fainting", "dehydration severe", "diabetic emergency", "insulin",
    ];

    const stableKeywords = [
      "mild pain", "headache", "nausea", "vomiting", "diarrhea", "fever",
      "sprain", "bruise", "minor cut", "rash", "swelling", "sore throat",
      "cough", "cold", "flu", "infection", "itch", "insect bite",
    ];

    const isCritical = criticalKeywords.some((kw) => lower.includes(kw));
    const isModerate = moderateKeywords.some((kw) => lower.includes(kw));
    const isStable = stableKeywords.some((kw) => lower.includes(kw));

    if (isCritical) return { condition: text, urgency: "Critical" };
    if (isModerate) return { condition: text, urgency: "Moderate" };
    if (isStable) return { condition: text, urgency: "Stable" };

    // Default to Moderate for unrecognized problems (err on side of caution)
    return { condition: text, urgency: "Moderate" };
  };

  const handleKnownProblem = (cat: string) => {
    setCondition(cat.charAt(0).toUpperCase() + cat.slice(1) + " Emergency");
    setUrgency("Critical");
    setStep("results");
  };

  const sendNotification = useCallback((hospital: Hospital) => {
    setNotified(true);
    addNotification({
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      condition,
      urgency,
      driverUnit: "AMB-1042",
      eta: routeInfo?.duration || `${hospital.eta} min`,
      distance: routeInfo?.distance || `${hospital.distance} km`,
      source: "ambulance",
    });
    
  }, [condition, urgency, routeInfo]);

  const handleNotifyHospital = () => {
    const hosp = selectedHospital || sortedHospitals[0];
    if (hosp) sendNotification(hosp);
  };

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    if (isNavigating) {
      sendNotification(hospital);
      voice.speak(`Hospital changed to ${hospital.name}. Notification sent.`);
    }
  };

  const GOOGLE_API_KEY = "AIzaSyCPe3i8e4rY-ViSR78B5VMpWPWBtu1yki4";

  const [realDistances, setRealDistances] = useState<Record<string, { distance: number; eta: number }>>({});

  useEffect(() => {
    if (!userPos) return;

    const origins = `${userPos[0]},${userPos[1]}`;
    const destinations = mockHospitals.map((h) => `${h.lat},${h.lng}`).join("|");

    fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&key=${GOOGLE_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.rows && data.rows[0]?.elements) {
          const distances: Record<string, { distance: number; eta: number }> = {};
          data.rows[0].elements.forEach((el: any, idx: number) => {
            if (el.status === "OK") {
              distances[mockHospitals[idx].id] = {
                distance: parseFloat((el.distance.value / 1000).toFixed(1)),
                eta: Math.ceil(el.duration.value / 60),
              };
            }
          });
          setRealDistances(distances);
        }
      })
      .catch((err) => {
        console.error("Google Distance Matrix error:", err);
      });
  }, [userPos]);

  // Haversine fallback
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Map condition to required specialties for filtering
  const getRequiredSpecialties = (cond: string): string[] => {
    const lower = cond.toLowerCase();
    if (lower.includes("cardiac") || lower.includes("heart") || lower.includes("chest"))
      return ["Cardiology", "Trauma"];
    if (lower.includes("stroke") || lower.includes("brain") || lower.includes("neuro"))
      return ["Neurology", "Trauma"];
    if (lower.includes("trauma") || lower.includes("accident") || lower.includes("fracture"))
      return ["Trauma", "Orthopedics"];
    if (lower.includes("breathing") || lower.includes("respiratory"))
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
    return [];
  };

  const hospitalsInRange = (() => {
    const requiredSpecs = getRequiredSpecialties(condition);
    let hospitals = userPos
      ? mockHospitals.map((h) => ({
          ...h,
          distance: realDistances[h.id]?.distance ?? parseFloat(haversineDistance(userPos[0], userPos[1], h.lat, h.lng).toFixed(1)),
          eta: realDistances[h.id]?.eta ?? h.eta,
        })).filter((h) => h.distance <= 25)
      : [...mockHospitals];

    // Specialty-only hospitals to exclude when not relevant
    const nicheSpecialties = ["Ophthalmology", "Dentistry", "Dermatology", "ENT"];

    // Filter by matching specialties
    if (requiredSpecs.length > 0 && condition) {
      const matched = hospitals.filter((h) => h.specialties.some((s) => requiredSpecs.includes(s)));
      if (matched.length > 0) hospitals = matched;
    }

    // Exclude hospitals with ANY niche specialty unless condition requires it
    hospitals = hospitals.filter((h) => {
      const hasNiche = h.specialties.some((s) => nicheSpecialties.includes(s));
      if (!hasNiche) return true;
      return h.specialties.some((s) => nicheSpecialties.includes(s) && requiredSpecs.includes(s));
    });

    // Exclude 0 ICU beds for Critical
    if (urgency === "Critical") {
      const withICU = hospitals.filter((h) => h.beds.icu > 0);
      if (withICU.length > 0) hospitals = withICU;
    }

    return hospitals.sort((a, b) => b.smarterScore - a.smarterScore);
  })();

  const sortedHospitals = hospitalsInRange;

  // Auto-select best hospital when entering results
  useEffect(() => {
    if (step === "results" && !selectedHospital && sortedHospitals.length > 0) {
      const best = sortedHospitals[0];
      setSelectedHospital(best);
      sendNotification(best);
      voice.speak(`Connected to ${best.name}, ${best.distance} kilometers away. Hospital has been notified.`);
    }
  }, [step, sortedHospitals]);

  // Condition-specific emergency guidelines
  const getGuidelines = (cond: string): string[] => {
    const lower = cond.toLowerCase();
    if (lower.includes("cardiac") || lower.includes("heart") || lower.includes("chest pain"))
      return ["Keep patient still and seated upright", "Loosen tight clothing", "Administer aspirin if available and no allergy", "Be ready to perform CPR if patient becomes unresponsive", "Monitor breathing continuously"];
    if (lower.includes("stroke") || lower.includes("paralysis"))
      return ["Note the exact time symptoms started (critical for treatment)", "Keep patient lying with head slightly elevated", "Do NOT give food, water, or medication", "Keep airway clear — turn head to side if vomiting", "FAST check: Face drooping, Arm weakness, Speech difficulty, Time to call"];
    if (lower.includes("trauma") || lower.includes("accident") || lower.includes("bleeding") || lower.includes("fracture"))
      return ["Apply direct pressure to wounds with clean cloth", "Immobilize suspected fractures — do not attempt to realign", "Keep patient still, especially if spinal injury suspected", "Elevate bleeding limbs above heart level if possible", "Cover open wounds to prevent contamination"];
    if (lower.includes("breathing") || lower.includes("respiratory") || lower.includes("asthma") || lower.includes("choking"))
      return ["Sit patient upright to ease breathing", "Administer inhaler if available (asthma)", "For choking: perform back blows followed by abdominal thrusts", "Provide supplemental oxygen if available", "Monitor oxygen saturation if pulse oximeter available"];
    if (lower.includes("poison") || lower.includes("overdose"))
      return ["Identify the substance if possible — bring container/label", "Do NOT induce vomiting unless directed by medical control", "If chemical on skin, remove contaminated clothing and rinse", "Keep patient conscious and talking", "Monitor for seizures and breathing difficulty"];
    if (lower.includes("pregnancy") || lower.includes("labor") || lower.includes("premature"))
      return ["Keep patient comfortable in left lateral position", "Time contractions (duration and interval)", "Do NOT attempt to delay delivery if crowning", "Keep area clean and warm for potential delivery", "Monitor for excessive bleeding"];
    if (lower.includes("unconscious") || lower.includes("unresponsive") || lower.includes("not breathing"))
      return ["Check airway — tilt head back, lift chin", "Begin CPR: 30 compressions, 2 breaths", "Use AED if available — follow voice prompts", "Do NOT leave patient unattended", "Continue CPR until medical team arrives"];
    return ["Keep patient calm and comfortable", "Monitor vital signs: pulse, breathing, consciousness", "Do not administer medication without medical direction", "Keep airway clear at all times", "Document symptoms and timeline for hospital handoff"];
  };

  const urgencyColor: Record<string, string> = {
    Critical: "gradient-emergency text-emergency-foreground",
    Moderate: "bg-warning text-warning-foreground",
    Stable: "bg-safe text-safe-foreground",
  };

  const goBack = () => {
    if (step === "location") navigate("/pro");
    else if (step === "condition-choice") setStep("location");
    else setStep("condition-choice");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: '400px', backgroundRepeat: 'repeat' }} />
      <div className="relative z-10 min-h-screen">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <SmartERLogo size="sm" />
        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />
          <button
            className="relative w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"
            onClick={() => {
              const panel = document.getElementById("amb-notif-panel");
              if (panel) panel.classList.toggle("hidden");
            }}
          >
            <Bell className="w-5 h-5 text-foreground" />
            {ambRequests.filter((r) => !r.seen).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emergency text-emergency-foreground text-[10px] font-bold flex items-center justify-center">
                {ambRequests.filter((r) => !r.seen).length}
              </span>
            )}
          </button>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emergency/10 text-emergency flex items-center gap-1">
            <Ambulance className="w-3.5 h-3.5" /> {t.driverMode}
          </span>
        </div>
      </div>

      {/* Notification Panel */}
      <div id="amb-notif-panel" className="hidden px-5 max-w-lg mx-auto">
        <div className="mt-2 rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="p-3 bg-emergency/5 border-b border-border flex items-center justify-between">
            <span className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-emergency" /> Incoming Requests
            </span>
            <span className="text-xs text-muted-foreground">{ambRequests.length} total</span>
          </div>
          {ambRequests.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No requests yet</div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {ambRequests.map((req) => (
                <div key={req.id} className={`p-4 flex items-center gap-3 ${!req.seen ? "bg-emergency/5" : ""}`}>
                  <div className="w-10 h-10 rounded-full bg-emergency/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-emergency" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-foreground">{req.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      📍 {req.location[0].toFixed(4)}, {req.location[1].toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {!req.seen && (
                    <button
                      onClick={() => markAmbulanceRequestSeen(req.id)}
                      className="px-3 py-1.5 rounded-full bg-emergency text-emergency-foreground text-xs font-semibold active:scale-95 transition-transform"
                    >
                      Accept
                    </button>
                  )}
                  {req.seen && (
                    <span className="text-xs text-safe font-semibold">✓ Accepted</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {step === "location" && (
            <motion.div key="location" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-pro/10 border border-pro/20">
                <div className="w-10 h-10 rounded-full bg-pro/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-pro" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-foreground">Driver #AMB-1042</p>
                  <p className="text-xs text-muted-foreground">Unit: SmartER Ambulance 7</p>
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{t.trackLocation}</h2>
                <p className="text-muted-foreground mt-1">{t.trackLocationSub}</p>
              </div>

              <OpenStreetMap
                userLat={userPos?.[0]}
                userLng={userPos?.[1]}
                className="h-48"
                allowToggleSize
              />

              {/* Address auto-fill textbox */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground">Current Address</label>
                <input
                  type="text"
                  value={userAddress}
                  readOnly
                  placeholder="Address will appear after tracking..."
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-body"
                />
              </div>

              <button
                onClick={detectLocation}
                disabled={locating}
                className="w-full py-4 rounded-full gradient-emergency text-emergency-foreground font-display font-semibold text-lg shadow-emergency flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {locating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t.lockingGps}</>
                ) : located ? (
                  <><MapPin className="w-5 h-5" /> {t.locationTracked}</>
                ) : (
                  <><MapPin className="w-5 h-5" /> {t.startTracking}</>
                )}
              </button>
            </motion.div>
          )}

          {step === "condition-choice" && (
            <motion.div key="choice" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{t.patientAssessment}</h2>
                <p className="text-muted-foreground mt-1">{t.enterOrSelect}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.enterProblem}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t.problemPlaceholder}
                    value={customProblem}
                    onChange={(e) => setCustomProblem(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emergency/50 font-body"
                  />
                  <button
                    onClick={() => {
                      if (customProblem.trim()) {
                        const result = analyzeCriticality(customProblem.trim());
                        setCondition(result.condition);
                        setUrgency(result.urgency);
                        setStep("results");
                      }
                    }}
                    disabled={!customProblem.trim()}
                    className="px-5 py-3 rounded-full gradient-emergency text-emergency-foreground font-display font-semibold active:scale-95 transition-transform disabled:opacity-40"
                  >
                    {t.go}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">{t.orSelect}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* SOS Critical Button */}
              <button
                onClick={() => {
                  setCondition("Critical — Unconscious / Not Breathing");
                  setUrgency("Critical");
                  const best = sortedHospitals[0];
                  setSelectedHospital(best);
                  if (best) sendNotification(best);
                  setStep("results");
                  setIsNavigating(true);
                  voice.speak("SOS activated. Hospital notified. Navigation started.");
                }}
                className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-destructive text-destructive-foreground active:scale-[0.97] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-destructive/50"
              >
                <div className="w-11 h-11 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <TriangleAlert className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-display font-semibold text-sm">SOS — Patient Unconscious / Not Breathing</p>
                  <p className="text-xs opacity-80 mt-0.5">Notifies hospital & starts navigation instantly</p>
                </div>
              </button>

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

          {step === "results" && (
            <motion.div key="results" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className={`rounded-2xl p-4 ${urgencyColor[urgency] || "bg-secondary"}`}>
                <p className="text-sm font-body opacity-80">{t.patientCondition}</p>
                <h3 className="font-display font-bold text-xl">{condition}</h3>
                <p className="text-sm font-display font-semibold mt-1">{t.urgency}: {urgency}</p>
                {selectedHospital && (
                  <p className="text-sm mt-2 opacity-90 font-display">
                    → Connected to <span className="font-bold">{selectedHospital.name}</span> ({selectedHospital.distance} km)
                  </p>
                )}
              </div>

              {/* Emergency Guidelines */}
              <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
                <div className="p-3 bg-warning/10 border-b border-border flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="font-display font-semibold text-sm text-foreground">Emergency Guidelines</span>
                </div>
                <div className="p-4 space-y-2">
                  {getGuidelines(condition).map((g, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <span className="w-5 h-5 rounded-full bg-pro/10 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-pro">{i + 1}</span>
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
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
                        title={voice.voiceEnabled ? "Mute voice" : "Enable voice"}
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
                    {routeInfo.steps.filter(s => s.distance > 0).map((step, i) => (
                      <div
                        key={i}
                        className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-secondary/50 transition-colors ${voice.currentStepIndex === i ? "bg-pro/5 border-l-2 border-l-pro" : ""}`}
                        onClick={() => voice.announceStep(routeInfo.steps, i)}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${voice.currentStepIndex === i ? "bg-pro text-white" : "bg-pro/10"}`}>
                          <span className={`text-xs font-bold ${voice.currentStepIndex === i ? "" : "text-pro"}`}>{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{step.instruction}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`}
                            {" · "}
                            {Math.round(step.duration / 60)} min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleNotifyHospital} className={`p-4 rounded-2xl font-display font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform ${notified ? "bg-safe text-safe-foreground" : "bg-emergency text-white"}`}>
                  <Bell className="w-5 h-5" />
                  {notified ? "✓ Hospital Notified" : t.notifyHospital}
                </button>
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
                  className={`p-4 rounded-2xl font-display font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform ${isNavigating ? "bg-pro text-pro-foreground" : "bg-safe text-safe-foreground"}`}
                >
                  <Navigation className="w-5 h-5" /> {isNavigating ? "Navigating..." : t.navigate}
                </button>
                <a
                  href={`tel:${(selectedHospital || sortedHospitals[0])?.phone || ""}`}
                  className="col-span-2 p-4 rounded-2xl bg-pro text-pro-foreground font-display font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Phone className="w-5 h-5" /> {t.callHospital} — {(selectedHospital || sortedHospitals[0])?.name}
                </a>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-safe/10 border border-safe/20">
                <span className="w-2.5 h-2.5 rounded-full bg-safe animate-pulse" />
                <span className="text-sm font-medium text-safe">{t.liveTracking}</span>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{t.bestHospitals}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {sortedHospitals.length} hospital{sortedHospitals.length !== 1 ? "s" : ""} within 25 km radius
                </p>
                {sortedHospitals.length === 0 ? (
                  <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-center">
                    <TriangleAlert className="w-6 h-6 text-destructive mx-auto mb-2" />
                    <p className="text-sm font-display font-semibold text-destructive">No hospitals found within 25 km</p>
                    <p className="text-xs text-muted-foreground mt-1">Expanding search or contact emergency services directly</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedHospitals.map((hospital, i) => (
                      <HospitalCard
                        key={hospital.id}
                        hospital={hospital}
                        index={i}
                        onSelect={handleSelectHospital}
                        isSelected={selectedHospital?.id === hospital.id}
                        isNavigating={isNavigating}
                        onNavigate={(h) => {
                          handleSelectHospital(h);
                          if (!isNavigating) {
                            setIsNavigating(true);
                            sendNotification(h);
                            voice.speak(`Starting navigation to ${h.name}. Hospital has been notified.`);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
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
    </div>
  );
};

export default AmbulanceDashboard;
