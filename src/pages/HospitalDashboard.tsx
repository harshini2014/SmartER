import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bed, UserCheck, Wrench, Clock, AlertTriangle, Bell, Ambulance, MapPin, CheckCircle, Plus, Minus, X, Save } from "lucide-react";
import SmartERLogo from "@/components/SmartERLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";
import { subscribe, markSeen, type AmbulanceNotification } from "@/stores/notificationStore";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<AmbulanceNotification[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showBedsModal, setShowBedsModal] = useState(false);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [icuAvailable, setIcuAvailable] = useState(3);
  const [icuTotal, setIcuTotal] = useState(10);
  const [generalAvailable, setGeneralAvailable] = useState(12);
  const [generalTotal, setGeneralTotal] = useState(40);
  const [doctorsOnCall, setDoctorsOnCall] = useState(5);
  const [specialistsList, setSpecialistsList] = useState([
    { name: "Cardiologist", count: 1 },
    { name: "Surgeon", count: 2 },
    { name: "Neurologist", count: 1 },
    { name: "General", count: 1 },
  ]);

  useEffect(() => {
    const unsubscribe = subscribe((updated) => {
      setNotifications(updated);
      const hasUnseen = updated.some((n) => !n.seen);
      if (hasUnseen) {
        setShowAlert(true);
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTIAAABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZAA=");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}
      }
    });
    return unsubscribe;
  }, []);

  const stats = [
    { label: t.icuBeds, value: `${icuAvailable}/${icuTotal}`, icon: Bed, color: "text-emergency" },
    { label: t.generalBeds, value: `${generalAvailable}/${generalTotal}`, icon: Bed, color: "text-safe" },
    { label: t.doctorsOnCall, value: `${doctorsOnCall}`, icon: UserCheck, color: "text-pro" },
    { label: t.equipmentReady, value: "98%", icon: Wrench, color: "text-foreground" },
  ];

  const incomingCases = [
    { id: 1, type: t.cardiac + " Emergency", eta: "8 min", urgency: "Critical" },
    { id: 2, type: t.accidentTrauma, eta: "14 min", urgency: "Moderate" },
  ];

  const unseenCount = notifications.filter((n) => !n.seen).length;

  const formatTime = (ts: number) => {
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: '400px', backgroundRepeat: 'repeat' }} />
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header - compact on mobile */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-1.5 sm:gap-3">
          <button onClick={() => navigate("/pro")} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
          <div className="shrink-0">
            <SmartERLogo size="sm" />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center"
            >
              <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${unseenCount > 0 ? "text-emergency animate-bounce" : "text-foreground"}`} />
              {unseenCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emergency text-white text-[8px] sm:text-[10px] font-bold flex items-center justify-center">
                  {unseenCount}
                </span>
              )}
            </button>
            <span className="text-[9px] sm:text-xs font-semibold px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-pro/10 text-pro whitespace-nowrap">
              🏥 Hospital
            </span>
          </div>
        </div>

        {/* Notification Dropdown Panel */}
        <AnimatePresence>
          {showNotifPanel && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 sm:top-16 right-2 sm:right-4 z-[60] w-[calc(100%-1rem)] sm:w-96 max-h-[70vh] overflow-y-auto rounded-xl sm:rounded-2xl bg-card border border-border shadow-xl"
            >
              <div className="p-3 bg-emergency/5 border-b border-border flex items-center justify-between sticky top-0 z-10 bg-card">
                <span className="font-display font-semibold text-xs sm:text-sm text-foreground flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emergency" /> Notifications
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{notifications.length} total</span>
                  <button onClick={() => setShowNotifPanel(false)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <X className="w-3 h-3 text-foreground" />
                  </button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs sm:text-sm text-muted-foreground">No notifications yet</div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-3 ${!notif.seen ? "bg-emergency/5" : ""}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!notif.seen && <span className="w-2 h-2 rounded-full bg-emergency animate-pulse shrink-0" />}
                          <span className="font-display font-bold text-xs text-foreground truncate">
                            {notif.source === "public" ? "👤 Public User" : `🚑 Unit ${notif.driverUnit}`}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground shrink-0 ml-2">{formatTime(notif.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <AlertTriangle className={`w-3 h-3 ${notif.urgency === "Critical" ? "text-emergency" : "text-warning"}`} />
                        <span className="text-[11px] font-semibold text-foreground">{notif.condition || "Emergency"}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                          notif.urgency === "Critical" ? "bg-emergency/10 text-emergency" : "bg-warning/10 text-warning"
                        }`}>{notif.urgency}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {notif.eta}</span>
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {notif.distance}</span>
                      </div>
                      {!notif.seen && (
                        <button
                          onClick={() => markSeen(notif.id)}
                          className="mt-2 w-full py-1.5 rounded-lg bg-safe text-safe-foreground text-[10px] font-display font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                          <CheckCircle className="w-3 h-3" /> Acknowledge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 px-2 sm:px-4 md:px-6 py-3 sm:py-6 w-full max-w-2xl mx-auto space-y-3 sm:space-y-5">

          {/* Incoming Ambulance Notifications */}
          <AnimatePresence>
            {notifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 sm:space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base sm:text-xl font-bold text-foreground flex items-center gap-1.5 sm:gap-2">
                    <Ambulance className="w-4 h-4 sm:w-5 sm:h-5 text-emergency" />
                    Incoming Ambulances
                  </h2>
                  <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-emergency/10 text-emergency">
                    {notifications.length} active
                  </span>
                </div>

                {notifications.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border shadow-card ${
                      !notif.seen
                        ? "bg-emergency/5 border-emergency/30 ring-1 ring-emergency/20"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        {!notif.seen && (
                          <span className="w-2 h-2 rounded-full bg-emergency animate-pulse shrink-0" />
                        )}
                        <span className="font-display font-bold text-xs sm:text-sm text-foreground truncate">
                          {notif.source === "public" ? "👤" : "🚑"} {notif.source === "public" ? "Public User" : `Unit ${notif.driverUnit}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2">
                        <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
                          notif.source === "public" ? "bg-pro/10 text-pro" : "bg-emergency/10 text-emergency"
                        }`}>
                          {notif.source === "public" ? "Public" : "Ambulance"}
                        </span>
                        <span className="text-[8px] sm:text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(notif.timestamp)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <AlertTriangle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${notif.urgency === "Critical" ? "text-emergency" : "text-warning"}`} />
                        <span className="text-xs sm:text-sm font-semibold text-foreground">{notif.condition || "Emergency"}</span>
                        <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
                          notif.urgency === "Critical" ? "bg-emergency/10 text-emergency" : "bg-warning/10 text-warning"
                        }`}>
                          {notif.urgency}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> ETA: {notif.eta}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {notif.distance}
                        </span>
                      </div>
                    </div>

                    {!notif.seen && (
                      <button
                        onClick={() => markSeen(notif.id)}
                        className="mt-2 sm:mt-3 w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-safe text-safe-foreground text-[10px] sm:text-xs font-display font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Acknowledge
                      </button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hospital Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-display text-base sm:text-xl font-bold text-foreground mb-2 sm:mb-4">{t.hospitalStatus}</h2>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
              {stats.map((s) => (
                <div key={s.label} className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card shadow-card border border-border">
                  <s.icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${s.color} mb-1 sm:mb-2`} />
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Incoming Cases */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="font-display text-base sm:text-xl font-bold text-foreground mb-2 sm:mb-4">{t.incomingCases}</h2>
            <div className="space-y-2 sm:space-y-3">
              {incomingCases.map((c) => (
                <div key={c.id} className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card shadow-card border border-border flex items-center gap-2.5 sm:gap-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${c.urgency === "Critical" ? "bg-emergency/10" : "bg-yellow-500/10"}`}>
                    <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${c.urgency === "Critical" ? "text-emergency" : "text-yellow-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-xs sm:text-sm truncate">{c.type}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{c.urgency}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {c.eta}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-1.5 sm:gap-3 pb-4">
            <button onClick={() => setShowBedsModal(true)} className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-safe text-safe-foreground font-display font-semibold text-[11px] sm:text-sm active:scale-95 transition-transform">
              {t.updateBeds}
            </button>
            <button onClick={() => setShowDoctorsModal(true)} className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-pro text-pro-foreground font-display font-semibold text-[11px] sm:text-sm active:scale-95 transition-transform">
              {t.updateDoctors}
            </button>
          </motion.div>
        </div>

        {/* Update Beds Modal */}
        <AnimatePresence>
          {showBedsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center"
              onClick={() => setShowBedsModal(false)}
            >
              <motion.div
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-6 space-y-3 sm:space-y-5 border-t border-border max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-safe" /> {t.updateBeds}
                  </h3>
                  <button onClick={() => setShowBedsModal(false)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center">
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
                  </button>
                </div>

                {/* ICU Beds */}
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emergency/5 border border-emergency/20 space-y-2.5 sm:space-y-3">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">{t.icuBeds}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Available</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button onClick={() => setIcuAvailable(Math.max(0, icuAvailable - 1))} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emergency/10 flex items-center justify-center active:scale-90 transition-transform">
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emergency" />
                      </button>
                      <span className="text-lg sm:text-xl font-bold text-foreground w-6 sm:w-8 text-center">{icuAvailable}</span>
                      <button onClick={() => setIcuAvailable(Math.min(icuTotal, icuAvailable + 1))} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-safe/10 flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-safe" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Total Capacity</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button onClick={() => setIcuTotal(Math.max(icuAvailable, icuTotal - 1))} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
                      </button>
                      <span className="text-lg sm:text-xl font-bold text-foreground w-6 sm:w-8 text-center">{icuTotal}</span>
                      <button onClick={() => setIcuTotal(icuTotal + 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* General Beds */}
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-safe/5 border border-safe/20 space-y-2.5 sm:space-y-3">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">{t.generalBeds}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Available</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button onClick={() => setGeneralAvailable(Math.max(0, generalAvailable - 1))} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emergency/10 flex items-center justify-center active:scale-90 transition-transform">
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emergency" />
                      </button>
                      <span className="text-lg sm:text-xl font-bold text-foreground w-6 sm:w-8 text-center">{generalAvailable}</span>
                      <button onClick={() => setGeneralAvailable(Math.min(generalTotal, generalAvailable + 1))} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-safe/10 flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-safe" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Total Capacity</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button onClick={() => setGeneralTotal(Math.max(generalAvailable, generalTotal - 1))} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
                      </button>
                      <span className="text-lg sm:text-xl font-bold text-foreground w-6 sm:w-8 text-center">{generalTotal}</span>
                      <button onClick={() => setGeneralTotal(generalTotal + 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={() => setShowBedsModal(false)} className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-safe text-safe-foreground font-display font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Save Changes
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update Doctors Modal */}
        <AnimatePresence>
          {showDoctorsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center"
              onClick={() => setShowDoctorsModal(false)}
            >
              <motion.div
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-6 space-y-3 sm:space-y-5 border-t border-border max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-pro" /> {t.updateDoctors}
                  </h3>
                  <button onClick={() => setShowDoctorsModal(false)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center">
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
                  </button>
                </div>

                {/* Total Doctors on Call */}
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-pro/5 border border-pro/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">{t.doctorsOnCall}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Total on duty now</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button onClick={() => setDoctorsOnCall(Math.max(0, doctorsOnCall - 1))} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emergency/10 flex items-center justify-center active:scale-90 transition-transform">
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emergency" />
                      </button>
                      <span className="text-xl sm:text-2xl font-bold text-foreground w-6 sm:w-8 text-center">{doctorsOnCall}</span>
                      <button onClick={() => setDoctorsOnCall(doctorsOnCall + 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-safe/10 flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-safe" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specialists Breakdown */}
                <div className="space-y-1.5 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">Specialists Available</p>
                  {specialistsList.map((spec, i) => (
                    <div key={spec.name} className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-border">
                      <span className="text-xs sm:text-sm text-foreground">{spec.name}</span>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => {
                            const updated = [...specialistsList];
                            updated[i] = { ...spec, count: Math.max(0, spec.count - 1) };
                            setSpecialistsList(updated);
                          }}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emergency/10 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Minus className="w-3 h-3 text-emergency" />
                        </button>
                        <span className="text-xs sm:text-sm font-bold text-foreground w-4 sm:w-5 text-center">{spec.count}</span>
                        <button
                          onClick={() => {
                            const updated = [...specialistsList];
                            updated[i] = { ...spec, count: spec.count + 1 };
                            setSpecialistsList(updated);
                          }}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-safe/10 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Plus className="w-3 h-3 text-safe" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setShowDoctorsModal(false)} className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-pro text-pro-foreground font-display font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Save Changes
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HospitalDashboard;
