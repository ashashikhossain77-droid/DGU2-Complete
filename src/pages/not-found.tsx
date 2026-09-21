import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#f4f2eb] px-4">
      <section className="w-full max-w-md rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-7 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-[#b84c3c]" />
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-[#17343a]">
            Control surface not found
          </h1>
        </div>
        <p className="text-sm leading-6 text-[#527078]">
          The requested IE Daily Control view is not available in this station shell.
        </p>
      </section>
    </div>
  );
}