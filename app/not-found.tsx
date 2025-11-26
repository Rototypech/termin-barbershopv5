import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md p-6 rounded-lg border border-[#C5A059] bg-black text-center">
        <div className="text-2xl text-[#C5A059] mb-3">404 – Seite nicht gefunden</div>
        <div className="mb-6">Es sieht so aus, als hätten Sie sich verlaufen.</div>
        <Link href="/" className="px-4 py-2 inline-block rounded bg-[#C5A059] text-black">Zur Startseite</Link>
      </div>
    </div>
  );
}
