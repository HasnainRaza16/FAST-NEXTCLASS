import { DesktopSidebar, MobileBottomNav } from "@/components/dashboard-nav";
import { ReminderEngine } from "@/components/reminder-engine";

// Deliberately does NOT fetch data here. This layout wraps every dashboard
// route, so anything it awaits adds a delay to every single navigation
// between sections (Dashboard → Attendance → Schedule → ...). Each page
// fetches exactly what it needs itself; ReminderEngine now fetches its own
// timetable data client-side (see reminder-engine.tsx) instead of requiring
// this layout to block on a Supabase query on every navigation.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <DesktopSidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</div>
      </main>
      <MobileBottomNav />
      <ReminderEngine />
    </div>
  );
}
