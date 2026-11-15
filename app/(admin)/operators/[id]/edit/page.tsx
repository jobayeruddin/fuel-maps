"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditOperatorPage() {
  const params = useParams();
  const router = useRouter();
  const operatorId = params.id as string;

  const [user_id, setUserId] = React.useState("");
  const [pump_id, setPumpId] = React.useState("");
  const [status, setStatus] = React.useState("ACTIVE");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [users, setUsers] = React.useState([]);
  const [pumps, setPumps] = React.useState([]);

  React.useEffect(() => {
    Promise.all([
      fetch(`/api/admin/operators/${operatorId}`),
      fetch("/api/admin/users/list"),
      fetch("/api/admin/pumps/list"),
    ])
      .then(([opRes, usersRes, pumpsRes]) =>
        Promise.all([opRes.json(), usersRes.json(), pumpsRes.json()]),
      )
      .then(([opData, usersData, pumpsData]) => {
        if (opData.error) throw new Error(opData.error);
        setUserId(opData.user_id);
        setPumpId(String(opData.pump_id));
        setStatus(opData.status);
        setUsers(usersData.filter((u: any) => u.role === "USER"));
        setPumps(pumpsData.filter((p: any) => p.status === "ACTIVE"));
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [operatorId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch(`/api/admin/operators/${operatorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, pump_id: parseInt(pump_id), status }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error || "Failed to update operator");
      }
      router.push("/operators");
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
            Admin / Operators
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">
            Edit Operator
          </h1>
        </div>

        <div className="rounded-card bg-surface border border-border p-8">
          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                User
              </span>
              <select
                required
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                value={user_id}
                onChange={(e) => setUserId(e.target.value)}
              >
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </label>

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
                {pumps.map((p: any) => (
                  <option key={p.pump_id} value={p.pump_id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
            <a className="text-primary hover:underline" href="/operators">
              ← Back to operators
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
