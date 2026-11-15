"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const NearbyMap = dynamic(() => import("./NearbyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full rounded-control border border-border bg-background animate-pulse" />
  ),
});

export default function NearbyClient() {
  const router = useRouter();
  const [userLat, setUserLat] = React.useState<number | null>(null);
  const [userLng, setUserLng] = React.useState<number | null>(null);
  const [radius, setRadius] = React.useState(10);
  const [pumps, setPumps] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [manualLat, setManualLat] = React.useState("");
  const [manualLng, setManualLng] = React.useState("");

  const fetchPumps = React.useCallback(async () => {
    if (userLat === null || userLng === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/pumps/nearby?lat=${userLat}&lng=${userLng}&radius=${radius}`,
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch pumps");
      setPumps(data.pumps || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, radius]);

  React.useEffect(() => {
    fetchPumps();
  }, [fetchPumps]);

  const handleGeoLocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");

      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      (err) => {
        setError(`Geolocation error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid latitude and longitude");

      return;
    }
    setUserLat(lat);
    setUserLng(lng);
  };

  const handleRequestFuel = (pumpId: number) => {
    router.push(`/requests/new?pump_id=${pumpId}`);
  };

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            User / Nearby
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Find Nearby Pumps
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Your Location</h2>
            <div className="space-y-3">
              <button
                className="w-full rounded-pill bg-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                disabled={loading}
                onClick={handleGeoLocate}
              >
                Use My Location
              </button>
              <div className="border-t border-border pt-3">
                <p className="font-mono text-xs text-text-secondary uppercase mb-2">
                  Or enter manually
                </p>
                <form className="space-y-2" onSubmit={handleManualSubmit}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className="w-full rounded-control bg-background border border-border px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                      placeholder="Latitude"
                      step="any"
                      type="number"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                    />
                    <input
                      className="w-full rounded-control bg-background border border-border px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                      placeholder="Longitude"
                      step="any"
                      type="number"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                    />
                  </div>
                  <button
                    className="w-full rounded-pill border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary hover:text-text-primary transition-colors"
                    type="submit"
                  >
                    Set Location
                  </button>
                </form>
              </div>
              {(userLat !== null || userLng !== null) && (
                <div className="text-sm text-text-secondary font-mono">
                  Lat: {userLat?.toFixed(6) ?? "—"} · Lng:{" "}
                  {userLng?.toFixed(6) ?? "—"}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Search Radius</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none accent-primary"
                  max="50"
                  min="1"
                  type="range"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                />
                <span className="font-mono text-sm text-text-primary min-w-[3rem]">
                  {radius} km
                </span>
              </label>
              <p className="text-xs text-text-secondary">
                Adjust to expand or narrow your search area
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-pill bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <NearbyMap
            pumps={pumps}
            userLat={userLat}
            userLng={userLng}
            onRequestFuel={handleRequestFuel}
          />

          <div className="rounded-card bg-surface border border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-medium">
                Nearby Pumps ({pumps.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-text-secondary">
                  Loading pumps...
                </div>
              ) : pumps.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  {userLat
                    ? "No pumps found in radius. Try expanding the search area."
                    : "Set your location to find nearby pumps."}
                </div>
              ) : (
                pumps.map((pump) => (
                  <div
                    key={pump.pump_id}
                    className="p-4 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{pump.name}</p>
                        <p className="text-sm text-text-secondary truncate">
                          {pump.address}
                        </p>
                        <p className="text-sm text-primary font-mono mt-1">
                          {pump.distance_km} km away
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pump.fuel.map((f: any) => (
                            <span
                              key={f.fuel_type_id}
                              className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full"
                            >
                              {f.fuel_name} — ${Number(f.price_per_liter)}/L (
                              {Number(f.quantity)} L)
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        className="rounded-pill bg-primary px-5 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity whitespace-nowrap"
                        onClick={() => handleRequestFuel(pump.pump_id)}
                      >
                        Request Fuel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
