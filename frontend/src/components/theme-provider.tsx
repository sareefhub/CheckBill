"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"

// ============================================================
// Context สำหรับ Theme (dark / light)
// ============================================================
type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

// ============================================================
// ThemeProvider — ห่อทั้ง app เพื่อควบคุม theme
// ============================================================
export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // โหลด theme จาก localStorage ถ้ามี ไม่งั้นใช้ light เป็น default
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    if (globalThis.window !== undefined) {
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

  // ใช้ useCallback เพื่อป้องกันไม่ให้สร้างฟังก์ชันใหม่ในทุกการเรนเดอร์
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  // ใช้ useMemo เพื่อจำค่า value และป้องกันไม่ให้ Context Provider ส่งค่าใหม่ทุกครั้งที่เรนเดอร์
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
