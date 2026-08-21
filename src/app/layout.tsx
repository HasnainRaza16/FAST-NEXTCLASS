import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FAST NextClass",
  description: "Your personal academic assistant — timetable, next class, attendance, and reminders.",
  appleWebApp: {
    // Lets iOS open the app full-screen (no browser chrome) when added to
    // the home screen, using the app's own title instead of the page title.
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NextClass",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Avoid dark-mode flash: apply saved theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('nextclass-theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
