// Notification store backed by Firebase Realtime Database
// Falls back to in-memory when Firebase is unavailable

import { ref, push, onValue, update, get } from "firebase/database";
import { db } from "@/lib/firebase";

export type NotificationSource = "ambulance" | "public";

export interface AmbulanceNotification {
  id: string;
  hospitalId: string;
  hospitalName: string;
  condition: string;
  urgency: string;
  driverUnit: string;
  eta: string;
  distance: string;
  timestamp: number;
  seen: boolean;
  source: NotificationSource;
}

// ── Hospital Notifications (from ambulance/public → hospital) ──

export function addNotification(n: Omit<AmbulanceNotification, "id" | "timestamp" | "seen">) {
  const notifRef = ref(db, "notifications");
  push(notifRef, {
    ...n,
    timestamp: Date.now(),
    seen: false,
  });
}

export function getNotifications(): AmbulanceNotification[] {
  // This is for initial sync — use subscribe for live updates
  return [];
}

export function getNotificationsForHospital(hospitalId: string): AmbulanceNotification[] {
  // Use subscribe for live data instead
  return [];
}

export function markSeen(id: string) {
  const notifRef = ref(db, `notifications/${id}/seen`);
  update(ref(db, `notifications/${id}`), { seen: true });
}

type Listener = () => void;

// Subscribe to all notifications — returns unsubscribe function
export function subscribe(fn: (notifications: AmbulanceNotification[]) => void): () => void {
  const notifRef = ref(db, "notifications");
  const unsub = onValue(notifRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      fn([]);
      return;
    }
    const list: AmbulanceNotification[] = Object.entries(data)
      .map(([key, val]: [string, any]) => ({
        id: key,
        hospitalId: val.hospitalId || "",
        hospitalName: val.hospitalName || "",
        condition: val.condition || "",
        urgency: val.urgency || "",
        driverUnit: val.driverUnit || "",
        eta: val.eta || "",
        distance: val.distance || "",
        timestamp: val.timestamp || 0,
        seen: val.seen || false,
        source: val.source || "ambulance",
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    fn(list);
  });
  return unsub;
}

// ── Ambulance-side notifications (from public users requesting ambulance) ──

export interface AmbulanceRequest {
  id: string;
  userName: string;
  location: [number, number];
  timestamp: number;
  seen: boolean;
}

export function addAmbulanceRequest(r: Omit<AmbulanceRequest, "id" | "timestamp" | "seen">) {
  const reqRef = ref(db, "ambulanceRequests");
  push(reqRef, {
    ...r,
    timestamp: Date.now(),
    seen: false,
  });
}

export function getAmbulanceRequests(): AmbulanceRequest[] {
  return [];
}

export function markAmbulanceRequestSeen(id: string) {
  update(ref(db, `ambulanceRequests/${id}`), { seen: true });
}

export function subscribeAmbulance(fn: (requests: AmbulanceRequest[]) => void): () => void {
  const reqRef = ref(db, "ambulanceRequests");
  const unsub = onValue(reqRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      fn([]);
      return;
    }
    const list: AmbulanceRequest[] = Object.entries(data)
      .map(([key, val]: [string, any]) => ({
        id: key,
        userName: val.userName || "",
        location: val.location || [0, 0],
        timestamp: val.timestamp || 0,
        seen: val.seen || false,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    fn(list);
  });
  return unsub;
}
