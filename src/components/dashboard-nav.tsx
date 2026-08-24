"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Bell,
  Search,
  User,
  LogOut,
  CalendarClock,
  MessageSquarePlus,
  GraduationCap,
  DoorOpen,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Links that live in the desktop sidebar but don't fit as their own icon
// in the mobile bottom bar — grouped under mobile's "More" tab instead so
// they're still reachable on phones.
const MORE_ITEMS = [
  { href: "/dashboard/gpa", label: "GPA", icon: GraduationCap },
  { href: "/dashboard/search", label: "Search", icon: Search },
  { href: "/dashboard/free-rooms", label: "Free Rooms", icon: DoorOpen },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquarePlus },
];

// Every link shown individually in the desktop sidebar, beyond the core 4
// nav items below. Kept as one list so desktop and the mobile "More"
// dropdown can't drift out of sync with each other.
const SIDEBAR_EXTRA_ITEMS = [
  { href: "/dashboard/gpa", label: "GPA", icon: GraduationCap },
  { href: "/dashboard/search", label: "Search", icon: Search },
  { href: "/dashboard/free-rooms", label: "Free Rooms", icon: DoorOpen },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquarePlus },
];

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/attendance", label: "Attendance", icon: TrendingUp },
  { href: "/dashboard/notifications", label: "Alerts", icon: Bell },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 p-4 dark:border-neutral-800 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold">
        <CalendarClock className="h-5 w-5" />
        FAST NextClass
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {SIDEBAR_EXTRA_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-between px-2">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const onMoreItem = MORE_ITEMS.some((item) => pathname === item.href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              active ? "text-neutral-900 dark:text-white" : "text-neutral-400"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium outline-none",
            onMoreItem ? "text-neutral-900 dark:text-white" : "text-neutral-400"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Link
        href="/dashboard/profile"
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
          pathname === "/dashboard/profile" ? "text-neutral-900 dark:text-white" : "text-neutral-400"
        )}
      >
        <User className="h-5 w-5" />
        Profile
      </Link>
    </nav>
  );
}
