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
        relative w-10 h-10 rounded-full flex items-center justify-center
        bg-secondary/40 border border-border/50
        active:scale-90
        transition-all duration-300 ease-out
        focus:outline-none
        overflow-hidden shadow-inner
      "
    >
      {/* ไอคอนพระอาทิตย์ (สว่าง) — แสดงเฉพาะในโหมดดาร์ก และมีเอฟเฟกต์หมุนพร้อมย่อขยายด้วย Tailwind CSS */}
      <Sun className={`
        h-[1.2rem] w-[1.2rem] transition-all duration-300 absolute
        ${theme === "dark" ? "rotate-0 scale-100 opacity-100 text-amber-500" : "rotate-90 scale-0 opacity-0"}
      `} />
      
      {/* ไอคอนดวงจันทร์ (มืด) — แสดงเฉพาะในโหมดไลท์ และมีเอฟเฟกต์หมุนพร้อมย่อขยายด้วย Tailwind CSS */}
      <Moon className={`
        h-[1.2rem] w-[1.2rem] transition-all duration-300 absolute
        ${theme !== "dark" ? "rotate-0 scale-100 opacity-100 text-indigo-400" : "-rotate-90 scale-0 opacity-0"}
      `} />
    </button>
  )
}
