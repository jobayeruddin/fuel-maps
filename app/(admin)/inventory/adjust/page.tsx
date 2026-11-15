"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function AdjustStockPage() {
  const router = useRouter();
  const [pump_id, setPumpId] = React.useState("");
  const [fuel_type_id, setFuelTypeId] = React.useState("");
  const [adjustment_type, setAdjustmentType] = React.useState("absolute");
  const [quantity, setQuantity] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [pumps, setPumps] = React.useState([]);
  const [fuelTypes, setFuelTypes] = React.useState([]);
  const [currentStock, setCurrentStock] = React.useState(null);

  React.useEffect(() => {
    fetch("/api/admin/pumps/list")
      .then((res) => res.json())
      .then((data) => setPumps(data.filter((p: any) => p.status === "ACTIVE")))
      .catch(() => setError("Failed to load pumps"));
    fetch("/api/admin/fuel-types/list")
      .then((res) => res.json())
      .then((data) =>
        setFuelTypes(data.filter((f: any) => f.status === "ACTIVE")),
      )
      .catch(() => setError("Failed to load fuel types"));
  }, []);

  React.useEffect(() => {
    if (pump_id && fuel_type_id) {
      fetch(`/api/admin/inventory/check/${pump_id}/${fuel_type_id}`)
        .then((res) => res.json())
        .then((data) => setCurrentStock(data.quantity))
        .catch(() => setCurrentStock(null));
    } else {
      setCurrentStock(null);
    }
  }, [pump_id, fuel_type_id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pump_id: parseInt(pump_id),
          fuel_type_id: parseInt(fuel_type_id),
          adjustment_type,
          quantity: parseFloat(quantity),
          remarks: remarks.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error || "Failed to adjust stock");
      }
      router.push("/inventory");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Inventory
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">
            Adjust Stock
          </h1>
        </div>

        <div className="rounded-card bg-surface border border-border p-8">
          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Pump
              </span>
              <select
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                value={pump_id}
                onChange={(e) => setPumpId(e.target.value)}
              >
                <option value="">Select a pump</option>
                {pumps.map((p: any) => (
                  <option key={p.pump_id} value={p.pump_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Fuel Type
              </span>
              <select
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                value={fuel_type_id}
                onChange={(e) => setFuelTypeId(e.target.value)}
              >
                <option value="">Select a fuel type</option>
                {fuelTypes.map((f: any) => (
                  <option key={f.fuel_type_id} value={f.fuel_type_id}>
                    {f.fuel_name} (${Number(f.price_per_liter)}/L)
                  </option>
                ))}
              </select>
            </label>

            {currentStock !== null && (
              <div className="p-4 rounded-control bg-background border border-border">
                <p className="font-mono text-xs text-text-secondary uppercase">
                  Current Stock
                </p>
                <p className="mt-1 font-mono text-2xl font-medium text-primary">
                  {currentStock} L
                </p>
              </div>
            )}

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Adjustment Type
              </span>
              <select
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                value={adjustment_type}
                onChange={(e) => setAdjustmentType(e.target.value)}
              >
                <option value="absolute">Set to exact quantity</option>
                <option value="relative">Add/Subtract from current</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                {adjustment_type === "absolute"
                  ? "New Quantity (Liters)"
                  : "Quantity Change (Liters, use - for decrease)"}
              </span>
              <input
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                min={adjustment_type === "absolute" ? "0" : undefined}
                placeholder={
                  adjustment_type === "absolute" ? "5000" : "1000 or -500"
                }
                step="0.01"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Remarks (Required)
              </span>
              <textarea
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary resize-none"
                placeholder="e.g., Corrected measurement error, Physical count adjustment, Written off damaged stock"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </label>

            {error && <p className="text-sm text-red-400 font-mono">{error}</p>}

            <button
              className="w-full rounded-pill bg-primary text-black text-sm font-medium py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={pending}
              type="submit"
            >
              {pending ? "Adjusting..." : "Adjust Stock"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            <a className="text-primary hover:underline" href="/inventory">
              ← Back to inventory
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
