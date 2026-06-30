"use client"

import { createContext, useContext, useEffect, useState } from "react"

// ============================================================
// Context สำหรับ Theme (dark / light)
// ============================================================
type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

// ============================================================
// ThemeProvider — ห่อทั้ง app เพื่อควบคุม theme
// ============================================================
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // โหลด theme จาก localStorage ถ้ามี ไม่งั้นใช้ dark เป็น default
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("checkbill-theme") as Theme | null
      if (saved === "light" || saved === "dark") {
        setTheme(saved)
      }
    }
  }, [])

  // อัปเดต class บน html element เมื่อ theme เปลี่ยน
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove("dark", "light")
    html.classList.add(theme)
    localStorage.setItem("checkbill-theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
