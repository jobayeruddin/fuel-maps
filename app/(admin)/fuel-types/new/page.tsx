"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function NewFuelTypePage() {
  const router = useRouter();
  const [fuel_name, setFuelName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price_per_liter, setPricePerLiter] = React.useState("");
  const [status, setStatus] = React.useState("ACTIVE");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/admin/fuel-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fuel_name,
          description: description || null,
          price_per_liter: parseFloat(price_per_liter),
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error || "Failed to create fuel type");
      }
      router.push("/fuel-types");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Fuel Types
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">
            Add Fuel Type
          </h1>
        </div>

        <div className="rounded-card bg-surface border border-border p-8">
          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Fuel Name
              </span>
              <input
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                placeholder="Diesel, Octane, CNG, etc."
                type="text"
                value={fuel_name}
                onChange={(e) => setFuelName(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Description (Optional)
              </span>
              <input
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                placeholder="High-grade diesel for commercial vehicles"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Price Per Liter
              </span>
              <input
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                min="0"
                placeholder="85.00"
                step="0.01"
                type="number"
                value={price_per_liter}
                onChange={(e) => setPricePerLiter(e.target.value)}
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
              {pending ? "Creating..." : "Create Fuel Type"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            <a className="text-primary hover:underline" href="/fuel-types">
              ← Back to fuel types
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
