"use client";

import * as React from "react";

export default function RoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [role, setRole] = React.useState(currentRole);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value;

    setRole(nextRole);
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error || "Failed to update role");
      }
    } catch (err: any) {
      setError(err.message);
      setRole(currentRole);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        className="w-full rounded-control bg-background border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
        disabled={pending}
        value={role}
        onChange={onChange}
      >
        <option value="USER">USER</option>
        <option value="OPERATOR">OPERATOR</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
}
