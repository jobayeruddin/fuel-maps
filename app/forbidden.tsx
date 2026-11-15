import Link from "next/link";

export default function Forbidden() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
        403 Forbidden
      </p>
      <h1 className="text-4xl font-medium tracking-tight text-text-primary">
        Access denied
      </h1>
      <p className="max-w-md text-sm text-text-secondary">
        Your account does not have permission to view this page.
      </p>
      <Link
        className="mt-2 rounded-pill bg-primary px-8 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
        href="/"
      >
        Back home
      </Link>
    </section>
  );
}
