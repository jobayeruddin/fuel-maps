"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ModalMode = "receive" | "adjust";

interface InventoryModalProps {
  mode: ModalMode;
  fuelTypeId: number;
  fuelName: string;
  pumpName: string;
  initialStock: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryModal({
  mode,
  fuelTypeId,
  fuelName,
  pumpName,
  initialStock,
  onClose,
  onSuccess,
}: InventoryModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("absolute");
  const [remarks, setRemarks] = useState("");
  const [currentStock, setCurrentStock] = useState<number | null>(initialStock);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isReceive = mode === "receive";

  useEffect(() => {
    if (isReceive) return;

    let cancelled = false;

    fetch(`/api/operator/inventory/check/${fuelTypeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.quantity !== undefined) {
          setCurrentStock(Number(data.quantity));
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load current stock");
      });

    return () => {
      cancelled = true;
    };
  }, [fuelTypeId, isReceive]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const qty = parseFloat(quantity);

    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity");
      setPending(false);

      return;
    }

    if (!isReceive && !remarks.trim()) {
      setError("Remarks are required for adjustments");
      setPending(false);

      return;
    }

    try {
      const url = isReceive
        ? "/api/operator/inventory/receive"
        : "/api/operator/inventory/adjust";

      const body = isReceive
        ? {
            fuel_type_id: fuelTypeId,
            quantity: qty,
            remarks: remarks.trim() || null,
          }
        : {
            fuel_type_id: fuelTypeId,
            adjustment_type: adjustmentType,
            quantity: qty,
            remarks: remarks.trim(),
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update stock");
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update stock");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        aria-hidden="true"
        className="w-full max-w-md rounded-card bg-white border border-border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              {isReceive ? "Receive Stock" : "Adjust Stock"}
            </p>
            <h2 className="mt-1 text-xl font-medium">{fuelName}</h2>
          </div>
          <button
            aria-label="Close"
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
            type="button"
            onClick={onClose}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>
        </div>

        <div className="mb-5 p-3 rounded-control bg-background border border-border">
          <p className="font-mono text-xs text-text-secondary uppercase">
            Pump
          </p>
          <p className="mt-1 text-sm font-medium">{pumpName}</p>
        </div>

        {!isReceive && currentStock !== null && (
          <div className="mb-5 p-3 rounded-control bg-background border border-border">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Current Stock
            </p>
            <p className="mt-1 font-mono text-2xl font-medium text-primary">
              {currentStock} L
            </p>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          {!isReceive && (
            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                Adjustment Type
              </span>
              <select
                className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
              >
                <option value="absolute">Set to exact quantity</option>
                <option value="relative">Add/Subtract from current</option>
              </select>
            </label>
          )}

          <label className="flex flex-col gap-2">
            <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
              {isReceive
                ? "Quantity (Liters)"
                : adjustmentType === "absolute"
                  ? "New Quantity (Liters)"
                  : "Quantity Change (Liters, use - for decrease)"}
            </span>
            <input
              required
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
              min={isReceive || adjustmentType === "absolute" ? "0" : undefined}
              placeholder={
                isReceive
                  ? "1000"
                  : adjustmentType === "absolute"
                    ? "5000"
                    : "1000 or -500"
              }
              step="0.01"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
              Remarks {!isReceive && "(Required)"}
            </span>
            <textarea
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary resize-none"
              placeholder={
                isReceive
                  ? "Supplier: XYZ Corp, Invoice #12345, etc."
                  : "e.g., Corrected measurement error, Written off damaged stock"
              }
              required={!isReceive}
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
            {pending
              ? isReceive
                ? "Receiving..."
                : "Adjusting..."
              : isReceive
                ? "Receive Stock"
                : "Adjust Stock"}
          </button>
        </form>
      </div>
    </div>
  );
}
