import Link from "next/link";
import { CalendarClock } from "lucide-react";

export const metadata = { title: "Privacy Policy — FAST NextClass" };

export default function PrivacyPage() {
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
        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">Privacy Policy</h1>
        <p className="mb-8 text-neutral-500">Last updated August 21, 2026.</p>

        <p className="mb-6">
          FAST NextClass is an independent, non-commercial student project built by Hasnain Raza and is
          not operated by or affiliated with FAST-NUCES. It exists to help students track their own
          timetable, attendance, and reminders. This policy explains what data the app collects and how
          it&apos;s handled.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">What we collect</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>Account info you provide at signup: name, email, university, department, semester, section.</li>
          <li>
            Timetable/course data: either auto-loaded from your section (matched against a public
            university timetable) or entered manually by you.
          </li>
          <li>Attendance records, notes, and assignments you add for your own courses.</li>
          <li>Feedback messages you choose to submit through the in-app Feedback page.</li>
          <li>
            Standard authentication data (session cookies) needed to keep you signed in — no advertising
            or third-party tracking cookies are set.
          </li>
        </ul>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">How it&apos;s used</h2>
        <p className="mb-4">
          Solely to run the features you see in the app: showing your timetable, computing attendance
          percentages, sending in-browser class reminders, and letting you review your own past feedback.
          Nothing is sold, shared with advertisers, or used to train external models.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Who else can see it</h2>
        <p className="mb-4">
          Your data is stored in Supabase (the database/auth provider) and served via Vercel (hosting).
          Both are standard third-party infrastructure providers, not additional recipients who use your
          data for their own purposes. Database access is restricted so each account can only read or
          write its own rows — no other student can see your data, and there is currently no admin
          account that can browse all users&apos; data through the app itself.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
          Accessing, correcting, or deleting your data
        </h2>
        <p className="mb-4">
          You can edit your profile (name, university, department, semester, section) at any time from
          the Profile page, and edit or delete individual courses, timetable entries, notes, and
          assignments yourself from the Schedule and course pages. There is currently no self-service
          &quot;delete my account&quot; button — to request full account deletion, send a message through
          the in-app Feedback page and it will be actioned manually.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Retention</h2>
        <p className="mb-4">
          Data is kept for as long as your account exists. If your account is deleted, associated
          courses, timetable entries, attendance, notes, assignments, notifications, and feedback are
          deleted along with it.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Changes</h2>
        <p className="mb-4">
          This is a small, actively-developed student project, so this policy may change as features are
          added. Material changes will update the date at the top of this page.
        </p>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Contact</h2>
        <p>
          For any privacy question or data request, use the{" "}
          <Link href="/dashboard/feedback" className="underline">
            Feedback page
          </Link>{" "}
          if you have an account, or reach the developer directly on{" "}
          <a
            href="https://www.linkedin.com/in/hasnain-raza-15a7872b7"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            LinkedIn
          </a>
          .
        </p>
      </main>
    </div>
  );
}
