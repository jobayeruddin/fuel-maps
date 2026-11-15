"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditPumpPage() {
  const params = useParams();
  const router = useRouter();
  const pumpId = params.id as string;

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");
  const [status, setStatus] = React.useState("ACTIVE");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/admin/pumps/${pumpId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setName(data.name);
        setAddress(data.address);
        setContact(data.contact || "");
        setLatitude(data.latitude ? String(data.latitude) : "");
        setLongitude(data.longitude ? String(data.longitude) : "");
        setStatus(data.status);
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [pumpId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch(`/api/admin/pumps/${pumpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          contact: contact || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error || "Failed to update pump");
      }
      router.push("/pumps");
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
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Pumps
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">
            Edit Pump
          </h1>
        </div>

        <div className="rounded-card bg-surface border border-border p-8">
          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Name
              </span>
              <input
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                placeholder="Central Fuel Station"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Address
              </span>
              <textarea
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary resize-none"
                placeholder="123 Main Street, Dhaka"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Contact Information
              </span>
              <input
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                placeholder="Phone or email"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                  Latitude
                </span>
                <input
                  className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                  placeholder="23.8103"
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                  Longitude
                </span>
                <input
                  className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                  placeholder="90.4125"
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </label>
            </div>

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
            <a className="text-primary hover:underline" href="/pumps">
              ← Back to pumps
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
