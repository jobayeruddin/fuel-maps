"use client";

import * as React from "react";
import { divIcon, type LatLngExpression } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapController({
  userLat,
  userLng,
}: {
  userLat: number | null;
  userLng: number | null;
}) {
  const map = useMap();

  React.useEffect(() => {
    if (userLat !== null && userLng !== null) {
      map.flyTo([userLat, userLng], 13);
    }
  }, [map, userLat, userLng]);

  return null;
}

function makeIcon(color: string) {
  return divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 2px ${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function NearbyMap({
  userLat,
  userLng,
  pumps,
  onRequestFuel,
}: {
  userLat: number | null;
  userLng: number | null;
  pumps: any[];
  onRequestFuel: (pumpId: number) => void;
}) {
  const defaultLat = 23.8103;
  const defaultLng = 90.4125;

  const centerLat = userLat ?? defaultLat;
  const centerLng = userLng ?? defaultLng;

  const userIcon = React.useMemo(() => makeIcon("#22c55e"), []);
  const pumpIcon = React.useMemo(() => makeIcon("#3b82f6"), []);

  return (
    <div className="h-96 w-full rounded-control border border-border overflow-hidden">
      <MapContainer
        center={[centerLat, centerLng] as LatLngExpression}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoom={userLat !== null ? 12 : 8}
      >
        <MapController userLat={userLat} userLng={userLng} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLat !== null && userLng !== null && (
          <Marker icon={userIcon} position={[userLat, userLng]}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        {pumps.map((pump: any) => (
          <Marker
            key={pump.pump_id}
            icon={pumpIcon}
            position={[pump.latitude, pump.longitude] as LatLngExpression}
          >
            <Popup>
              <div className="min-w-[200px]">
                <p className="font-medium">{pump.name}</p>
                <p className="text-sm text-text-secondary">{pump.address}</p>
                <p className="text-sm text-text-secondary">
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
                <button
                  className="mt-2 w-full rounded-pill bg-primary px-4 py-1.5 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                  onClick={() => onRequestFuel(pump.pump_id)}
                >
                  Request Fuel
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
