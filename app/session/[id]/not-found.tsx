import Link from "next/link";

export default function SessionNotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-slate-600 font-medium">Session not found</p>
      <Link href="/dashboard" className="saido-brand mt-4 inline-block text-sm">
        ← Back to dashboard
      </Link>
    </div>
  );
}
