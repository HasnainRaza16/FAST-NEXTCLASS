import { DesktopSidebar, MobileBottomNav } from "@/components/dashboard-nav";
import { ReminderEngine } from "@/components/reminder-engine";
import { getTimetable } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const entries = await getTimetable();
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <DesktopSidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</div>
      </main>
      <MobileBottomNav />
      <ReminderEngine entries={entries} />
    </div>
  );
}
