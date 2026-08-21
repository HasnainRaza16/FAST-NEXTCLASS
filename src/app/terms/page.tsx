import Link from "next/link";
import { CalendarClock } from "lucide-react";

export const metadata = { title: "Terms of Service — FAST NextClass" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <CalendarClock className="h-5 w-5" />
          FAST NextClass
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Back home
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">Terms of Service</h1>
        <p className="mb-8 text-neutral-500">Last updated August 21, 2026.</p>

        <p className="mb-6">
          FAST NextClass is an independent, non-commercial student project, provided free of charge and
          on an &quot;as is&quot; basis. It is not an official product of, and is not endorsed by,
          FAST-NUCES or any university. By creating an account, you agree to these terms.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">The service</h2>
        <p className="mb-4">
          The app helps you track your class timetable, attendance, and reminders. Timetables can be
          auto-loaded from a section code matched against a public university timetable dataset, or
          entered manually. Auto-loaded data is provided for convenience — always verify official class
          timings, rooms, and instructors against your university&apos;s official sources before relying
          on it for anything time-sensitive.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Your account</h2>
        <p className="mb-4">
          You&apos;re responsible for the accuracy of the information you provide and for keeping your
          password secure. You agree not to use the account creation or feedback features to submit
          spam, abusive content, or attempt to disrupt the service for other users.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">No warranty</h2>
        <p className="mb-4">
          The service is provided without warranties of any kind, express or implied, including
          accuracy, availability, or fitness for a particular purpose. Reminders rely on your browser
          being open and notification permissions being granted — they are a convenience feature, not a
          guaranteed alert system.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
          Limitation of liability
        </h2>
        <p className="mb-4">
          To the fullest extent permitted by law, the developer is not liable for missed classes, missed
          deadlines, attendance discrepancies, or any other loss arising from use of, or inability to
          use, this app.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Changes and availability</h2>
        <p className="mb-4">
          Features, this app, and these terms may change or be discontinued at any time without notice,
          since this is a personal project rather than a commercially supported product.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Governing law</h2>
        <p className="mb-4">
          These terms are governed by the laws of Pakistan, without regard to conflict-of-law principles.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Data</h2>
        <p>
          See the{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>{" "}
          for how your data is collected, used, and how to request deletion.
        </p>
      </main>
    </div>
  );
}
