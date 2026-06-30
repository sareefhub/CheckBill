"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

// ============================================================
// ThemeToggle — ปุ่มสลับ Dark / Light Mode
// ============================================================
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "เปลี่ยนเป็น Light Mode" : "เปลี่ยนเป็น Dark Mode"}
      className="
        w-11 h-11 rounded-xl flex items-center justify-center
        bg-secondary/60 border border-border
        hover:bg-secondary transition-all duration-200
        text-muted-foreground hover:text-foreground
        active:scale-95
      "
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  )
}
