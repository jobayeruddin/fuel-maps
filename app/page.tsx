import { title, subtitle } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-10 py-16 px-6 text-center">
      <div className="inline-block max-w-2xl">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
          Oil Pump Management System
        </p>
        <h1 className={title({ size: "lg", color: "foreground" })}>
          BDFuelMaps
        </h1>
        <p className={subtitle({ class: "mt-4" })}>
          Centralized web system managing vehicles, oil pumps, fuel requests,
          distribution, and inventory.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 text-left">
        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium">Vehicle registration</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Register each vehicle by registration number and the details
            required for verification at the pump.
          </p>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium">Fuel requests with maps</h2>
          <p className="mt-1 text-sm text-text-secondary">
            When fuel is needed, nearby registered pump stations show up on
            Google Maps with locations and distances. Pick a pump, choose fuel
            type and quantity, then submit the request.
          </p>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium">Verified dispensing</h2>
          <p className="mt-1 text-sm text-text-secondary">
            At the pump, the operator verifies the vehicle by registration
            number before dispensing. Unregistered or unauthorized vehicles are
            refused.
          </p>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium">Inventory and audit trail</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Each dispense auto-deducts the quantity from the pump stock and
            stores a transaction record: vehicle, pump, fuel type, quantity,
            date, time, and operator.
          </p>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium">Admin dashboard</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage users, vehicles, pumps, inventory, operators, and
            transactions. Monitor overall fuel consumption and pump-wise stock
            in real time.
          </p>
        </div>
      </div>

      <a
        className="inline-flex items-center rounded-pill bg-primary px-8 py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity"
        href="/login"
      >
        Sign in
      </a>
    </section>
  );
}
