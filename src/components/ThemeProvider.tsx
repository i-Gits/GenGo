// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Theme Provider
//   "day and night in the garden" 🌙
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Apply theme directly to the DOM -- this is the source of truth
function applyTheme(newTheme: Theme) {
  if (newTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // On first load, read saved theme and apply immediately
  useEffect(() => {
    const saved = localStorage.getItem("gengo-theme") as Theme | null;
    if (saved === "dark") {
      setThemeState("dark");
      applyTheme("dark");
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("gengo-theme", newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem("gengo-theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components outside ThemeProvider
    return {
      theme: "light" as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
