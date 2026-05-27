import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-3xl font-bold text-slate-950">Thank you</h1>
        <p className="mt-3 text-slate-600">Your exam submission has been recorded successfully.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
