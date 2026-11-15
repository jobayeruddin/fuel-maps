"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DispenseFormProps {
  requestId: string;
  pricePerLiter: number;
  quantity: number;
}

export default function DispenseForm({
  requestId,
  pricePerLiter,
  quantity,
}: DispenseFormProps) {
  const router = useRouter();
  const [actualQuantity, setActualQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const qty = parseFloat(actualQuantity);

    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity");
      setPending(false);

      return;
    }

    if (qty > quantity) {
      setError("Dispensed quantity cannot exceed requested quantity");
      setPending(false);

      return;
    }

    try {
      const res = await fetch("/api/operator/requests/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: parseInt(requestId),
          actual_quantity: qty,
          remarks: remarks || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispense fuel");
      }

      router.push(`/operator/requests/${requestId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to dispense fuel");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input name="requestId" type="hidden" value={requestId} />
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
            Actual Quantity (L)
          </span>
          <input
            required
            className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
            min="0.01"
            name="actual_quantity"
            placeholder="Enter actual dispensed quantity"
            step="0.01"
            type="number"
            value={actualQuantity}
            onChange={(e) => setActualQuantity(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
            Unit Price ($/L)
          </span>
          <input
            disabled
            className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-secondary cursor-not-allowed"
            defaultValue={pricePerLiter}
            step="0.01"
            type="number"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
            Remarks
          </span>
          <input
            className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
            name="remarks"
            placeholder="Optional notes"
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-control bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        className="rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Dispensing..." : "Record Dispensing"}
      </button>
    </form>
  );
}
