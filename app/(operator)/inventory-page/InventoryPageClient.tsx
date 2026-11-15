"use client";

import { useState } from "react";

import InventoryModal from "./InventoryModal";

import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export interface InventoryItem {
  inventory_id: number;
  fuel_type_id: number;
  fuel_name: string;
  price_per_liter: number;
  status: string;
  quantity: number;
}

interface InventoryPageClientProps {
  items: InventoryItem[];
  pumpName: string;
}

export default function InventoryPageClient({
  items,
  pumpName,
}: InventoryPageClientProps) {
  const [modal, setModal] = useState<{
    mode: "receive" | "adjust";
    fuelTypeId: number;
    fuelName: string;
    quantity: number;
  } | null>(null);

  const lowStockCount = items.filter(
    (inv) => inv.quantity < LOW_STOCK_THRESHOLD,
  ).length;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Operator / Inventory
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            {pumpName} Inventory
          </h1>
        </div>
        {lowStockCount > 0 && (
          <span className="text-xs font-mono px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600">
            {lowStockCount} Low Stock Item(s)
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">
            No inventory configured for this pump.
          </p>
          <p className="text-sm text-text-secondary">
            Contact admin to set up fuel types and stock.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((inv) => (
            <div
              key={inv.inventory_id}
              className="rounded-card bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <p className="font-mono text-lg font-medium">{inv.fuel_name}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  ${inv.price_per_liter}/L • {inv.status}
                </p>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4">
                <div className="text-right">
                  <p className="font-mono text-2xl font-medium">
                    {inv.quantity} L
                  </p>
                  <p className="text-xs text-text-secondary">
                    ${inv.price_per_liter}/L
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {inv.quantity < LOW_STOCK_THRESHOLD && (
                    <span className="text-xs font-mono px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600">
                      Low Stock
                    </span>
                  )}
                  {inv.status === "INACTIVE" && (
                    <span className="text-xs font-mono px-2 py-1 rounded-full bg-text-secondary/20 text-text-secondary">
                      Inactive
                    </span>
                  )}
                  {inv.quantity >= LOW_STOCK_THRESHOLD &&
                    inv.status === "ACTIVE" && (
                      <span className="text-xs font-mono px-2 py-1 rounded-full bg-green-500/20 text-green-600">
                        OK
                      </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-pill bg-primary/20 text-primary px-4 py-2 text-xs font-medium hover:bg-primary/30 transition-colors"
                    type="button"
                    onClick={() =>
                      setModal({
                        mode: "receive",
                        fuelTypeId: inv.fuel_type_id,
                        fuelName: inv.fuel_name,
                        quantity: inv.quantity,
                      })
                    }
                  >
                    Receive
                  </button>
                  <button
                    className="rounded-pill bg-text-secondary/20 text-text-secondary px-4 py-2 text-xs font-medium hover:bg-text-secondary/30 transition-colors"
                    type="button"
                    onClick={() =>
                      setModal({
                        mode: "adjust",
                        fuelTypeId: inv.fuel_type_id,
                        fuelName: inv.fuel_name,
                        quantity: inv.quantity,
                      })
                    }
                  >
                    Adjust
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <InventoryModal
          fuelName={modal.fuelName}
          fuelTypeId={modal.fuelTypeId}
          initialStock={modal.quantity}
          mode={modal.mode}
          pumpName={pumpName}
          onClose={() => setModal(null)}
          onSuccess={() => setModal(null)}
        />
      )}
    </>
  );
}
