import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import EntryScreen from "./pages/EntryScreen";
import EmergencyFlow from "./pages/EmergencyFlow";
import ProLogin from "./pages/ProLogin";
import PublicAuth from "./pages/PublicAuth";
import AmbulanceAuth from "./pages/AmbulanceAuth";
import HospitalAuth from "./pages/HospitalAuth";
import AmbulanceDashboard from "./pages/AmbulanceDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<EntryScreen />} />
            <Route path="/public/auth" element={<PublicAuth />} />
            <Route path="/emergency" element={<EmergencyFlow />} />
            <Route path="/pro" element={<ProLogin />} />
            <Route path="/pro/ambulance/auth" element={<AmbulanceAuth />} />
            <Route path="/pro/hospital/auth" element={<HospitalAuth />} />
            <Route path="/pro/ambulance" element={<AmbulanceDashboard />} />
            <Route path="/pro/hospital" element={<HospitalDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
