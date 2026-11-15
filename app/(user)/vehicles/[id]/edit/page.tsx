"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [registration_number, setRegistrationNumber] = React.useState("");
  const [vehicle_type, setVehicleType] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [model, setModel] = React.useState("");
  const [manufacturing_year, setManufacturingYear] = React.useState("");
  const [status, setStatus] = React.useState("ACTIVE");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/user/vehicles/${vehicleId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRegistrationNumber(data.registration_number);
        setVehicleType(data.vehicle_type || "");
        setBrand(data.brand || "");
        setModel(data.model || "");
        setManufacturingYear(
          data.manufacturing_year ? String(data.manufacturing_year) : "",
        );
        setStatus(data.status);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [vehicleId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch(`/api/user/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_number,
          vehicle_type,
          brand: brand || null,
          model: model || null,
          manufacturing_year: manufacturing_year
            ? parseInt(manufacturing_year)
            : null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error || "Failed to update vehicle");
      }
      router.push("/vehicles");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  if (!loaded) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-mono text-sm text-text-secondary">Loading...</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Vehicles
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">
            Edit Vehicle
          </h1>
        </div>

        <div className="rounded-card bg-surface border border-border p-8">
          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Registration Number
              </span>
              <input
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                placeholder="DHAKA-1234"
                type="text"
                value={registration_number}
                onChange={(e) =>
                  setRegistrationNumber(e.target.value.toUpperCase())
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Vehicle Type
              </span>
              <input
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                placeholder="Sedan, Truck, Motorcycle, etc."
                type="text"
                value={vehicle_type}
                onChange={(e) => setVehicleType(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Brand
              </span>
              <input
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                placeholder="Toyota, Honda, etc."
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Model
              </span>
              <input
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                placeholder="Corolla, Civic, etc."
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Manufacturing Year
              </span>
              <input
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                max="2099"
                min="1900"
                placeholder="2019"
                type="number"
                value={manufacturing_year}
                onChange={(e) => setManufacturingYear(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Status
              </span>
              <select
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>

            {error && <p className="text-sm text-red-400 font-mono">{error}</p>}

            <button
              className="w-full rounded-pill bg-primary text-black text-sm font-medium py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={pending}
              type="submit"
            >
              {pending ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            <a className="text-primary hover:underline" href="/vehicles">
              ← Back to vehicles
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
