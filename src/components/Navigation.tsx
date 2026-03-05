// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Navigation Component
//   "the garden path signs" 🪧
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { href: "/",         label: "Garden",   emoji: "🌸" },
  { href: "/lessons",  label: "Lessons",  emoji: "" },
  { href: "/reviews",  label: "Reviews",  emoji: "" },
  { href: "/settings", label: "Settings", emoji: "" },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-border" style={{ backgroundColor: "var(--nav-bg)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🌸</span>
            <span style={{ color: "var(--primary-hover)" }}>GenGo!</span>
          </Link>

          {/* Nav links + theme toggle */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? "bg-primary/20 text-primary-hover"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  {item.emoji && <span className="text-base">{item.emoji}</span>}
                  <span className={item.emoji ? "hidden sm:inline" : ""}>{item.label}</span>
                </Link>
              );
            })}

            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              aria-label="Toggle theme"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
