import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  steps: RouteStep[];
  rawDuration: number;
  rawDistance: number;
}

interface OpenStreetMapProps {
  userLat?: number;
  userLng?: number;
  hospitalLat?: number;
  hospitalLng?: number;
  showRoute?: boolean;
  navigating?: boolean;
  className?: string;
  onRouteInfo?: (info: RouteInfo) => void;
  allowToggleSize?: boolean;
}

const OpenStreetMap = ({ userLat, userLng, hospitalLat, hospitalLng, showRoute = false, navigating = false, className = "", onRouteInfo, allowToggleSize = false }: OpenStreetMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(
    userLat && userLng ? [userLat, userLng] : null
  );
  const lastFetchTime = useRef(0);
  const userZoomed = useRef(false);
  const fitBoundsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cachedRoute = useRef<any>(null);
  const cachedRouteKey = useRef<string>("");
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [displayRoute, setDisplayRoute] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const defaultCenter: [number, number] = currentPos || [16.4575, 80.5354];
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(defaultCenter, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    // Force Leaflet to recalculate size aggressively after animation/render
    const intervals = [100, 300, 500, 800, 1200, 2000, 3000];
    const timers = intervals.map((ms) => setTimeout(() => map.invalidateSize(), ms));

    // Also use ResizeObserver for when container becomes visible
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapRef.current) observer.observe(mapRef.current);

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      map.remove();
      mapInstance.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPos([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const fetchRoute = useCallback(async (from: [number, number], to: [number, number], retries = 3): Promise<any> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        if (res.status === 429) {
          // Rate limited — wait and retry
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        const data = await res.json();
        if (data.routes && data.routes.length > 0) return data.routes[0];
      } catch (e) {
        console.error("OSRM routing error:", e);
        if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    return null;
  }, []);

  const drawRoute = useCallback((route: any, map: L.Map, layer: L.LayerGroup, isNav: boolean) => {
    const coords: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] as [number, number]
    );

    const lineColor = isNav ? "#3b82f6" : "#ef4444";
    const shadowColor = isNav ? "#1e40af" : "#991b1b";
    L.polyline(coords, { color: shadowColor, weight: 8, opacity: 0.3 }).addTo(layer);
    L.polyline(coords, { color: lineColor, weight: 5, opacity: 0.9 }).addTo(layer);

    const bounds = L.latLngBounds(coords);
    if (!userZoomed.current) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    if (fitBoundsTimer.current) clearTimeout(fitBoundsTimer.current);
    fitBoundsTimer.current = setTimeout(() => { userZoomed.current = false; }, 5000);

    const steps: RouteStep[] = route.legs[0].steps.map((s: any) => ({
      instruction: formatInstruction(s.maneuver, s.name),
      distance: s.distance,
      duration: s.duration,
    }));

    const totalDist = route.distance;
    const totalTime = route.duration;

    const distStr = totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${Math.round(totalDist)} m`;
    const durStr = totalTime >= 3600
      ? `${Math.floor(totalTime / 3600)}h ${Math.round((totalTime % 3600) / 60)}min`
      : `${Math.round(totalTime / 60)} min`;

    setDisplayRoute({ distance: distStr, duration: durStr });

    onRouteInfo?.({
      distance: distStr,
      duration: durStr,
      steps,
      rawDuration: totalTime,
      rawDistance: totalDist,
    });
  }, [onRouteInfo]);

  useEffect(() => {
    const map = mapInstance.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !currentPos || !routeLayer) return;

    routeLayer.clearLayers();

    // User marker
    const userIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="position:relative;">
        <div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:2;position:relative;"></div>
        ${navigating ? '<div style="position:absolute;top:-4px;left:-4px;width:24px;height:24px;border-radius:50%;background:rgba(239,68,68,0.3);animation:pulse 1.5s infinite;"></div>' : ''}
      </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker(currentPos, { icon: userIcon }).addTo(routeLayer).bindPopup("You are here");

    if (!hospitalLat || !hospitalLng || !showRoute) {
      map.setView(currentPos, 14);
      return;
    }

    // Hospital marker
    const hospIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="display:flex;flex-direction:column;align-items:center;">
        <div style="background:#3b82f6;color:white;padding:4px 8px;border-radius:8px;font-size:10px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏥 Hospital</div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #3b82f6;"></div>
      </div>`,
      iconSize: [80, 30],
      iconAnchor: [40, 30],
    });
    L.marker([hospitalLat, hospitalLng], { icon: hospIcon }).addTo(routeLayer);

    // Throttle: at least 3s between fetches
    const now = Date.now();
    const routeKey = `${currentPos[0].toFixed(3)},${currentPos[1].toFixed(3)}-${hospitalLat.toFixed(3)},${hospitalLng.toFixed(3)}`;
    
    // Use cached route if same destination and recent
    if (cachedRoute.current && cachedRouteKey.current === routeKey) {
      drawRoute(cachedRoute.current, map, routeLayer, navigating);
      return;
    }

    if (now - lastFetchTime.current < 3000 && lastFetchTime.current > 0) {
      // Schedule a retry after cooldown
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(() => {
        // Trigger re-render by updating pos slightly
        setCurrentPos((prev) => prev ? [...prev] as [number, number] : prev);
      }, 3000);
      // Draw cached route if available
      if (cachedRoute.current) {
        drawRoute(cachedRoute.current, map, routeLayer, navigating);
      }
      return;
    }

    lastFetchTime.current = now;

    fetchRoute(currentPos, [hospitalLat, hospitalLng]).then((route) => {
      if (!route || !mapInstance.current || !routeLayerRef.current) return;
      cachedRoute.current = route;
      cachedRouteKey.current = routeKey;
      // Re-draw with fresh data (clear and re-add markers + route)
      routeLayerRef.current.clearLayers();
      L.marker(currentPos, { icon: userIcon }).addTo(routeLayerRef.current!).bindPopup("You are here");
      L.marker([hospitalLat!, hospitalLng!], { icon: hospIcon }).addTo(routeLayerRef.current!);
      drawRoute(route, mapInstance.current!, routeLayerRef.current!, navigating);
    });
  }, [currentPos, hospitalLat, hospitalLng, showRoute, navigating, fetchRoute, drawRoute]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    userZoomed.current = true;
    mapInstance.current?.zoomIn();
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    userZoomed.current = true;
    mapInstance.current?.zoomOut();
  };

  // Invalidate size when navigating/className changes
  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => mapInstance.current?.invalidateSize(), 50);
      setTimeout(() => mapInstance.current?.invalidateSize(), 300);
    }
  }, [navigating, className]);

  const mapHeight = navigating ? "300px" : "200px";

  return (
    <div className="relative w-full">
      <div ref={mapRef} className={`w-full rounded-2xl overflow-hidden ${className}`} style={{ height: mapHeight }} />
      {/* Distance overlay on map */}
      {navigating && displayRoute && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground font-medium">Distance</p>
            <p className="font-display font-bold text-sm text-foreground">{displayRoute.distance}</p>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground font-medium">ETA</p>
            <p className="font-display font-bold text-sm text-foreground">{displayRoute.duration}</p>
          </div>
        </div>
      )}
      {allowToggleSize && (
        <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-background/90 border border-border shadow-md flex items-center justify-center hover:bg-secondary transition-colors text-foreground font-bold text-lg leading-none"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-background/90 border border-border shadow-md flex items-center justify-center hover:bg-secondary transition-colors text-foreground font-bold text-lg leading-none"
            title="Zoom out"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
};

function formatInstruction(maneuver: any, streetName: string): string {
  const type = maneuver?.type || "";
  const modifier = maneuver?.modifier || "";
  const name = streetName || "the road";

  const modifierMap: Record<string, string> = {
    left: "Turn left",
    right: "Turn right",
    "sharp left": "Sharp left",
    "sharp right": "Sharp right",
    "slight left": "Bear left",
    "slight right": "Bear right",
    straight: "Continue straight",
    uturn: "Make a U-turn",
  };

  if (type === "depart") return `Head towards ${name}`;
  if (type === "arrive") return "You have arrived at your destination";
  if (type === "roundabout" || type === "rotary") return `Enter roundabout, then exit onto ${name}`;
  if (type === "merge") return `Merge onto ${name}`;
  if (type === "fork") return `${modifier === "left" ? "Keep left" : "Keep right"} onto ${name}`;

  const turn = modifierMap[modifier] || "Continue";
  return `${turn} onto ${name}`;
}

export default OpenStreetMap;
