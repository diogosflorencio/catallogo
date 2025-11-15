"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile } from "@/lib/supabase/database";

interface ThemeContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  effectiveTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  userProfile?: UserProfile | null;
  isLandingPage?: boolean; // Se true, usa preferência do sistema; se false, usa tema do usuário
}

export function ThemeProvider({ 
  children, 
  userProfile, 
  isLandingPage = false 
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (isLandingPage) {
      // Landing page: sempre usa preferência do sistema
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = systemPrefersDark ? "dark" : "light";
      setThemeState("system");
      setEffectiveTheme(initialTheme);
      applyTheme(initialTheme);
      
      // Listener para mudanças na preferência do sistema
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? "dark" : "light";
        setEffectiveTheme(newTheme);
        applyTheme(newTheme);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Dashboard/Catálogos: usa tema do usuário ou preferência do sistema
      const userTheme = userProfile?.theme;
      if (userTheme === "light" || userTheme === "dark") {
        setThemeState(userTheme);
        setEffectiveTheme(userTheme);
        applyTheme(userTheme);
      } else {
        // null = usar preferência do sistema
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = systemPrefersDark ? "dark" : "light";
        setThemeState("system");
        setEffectiveTheme(initialTheme);
        applyTheme(initialTheme);
        
        // Listener para mudanças na preferência do sistema
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
          const newTheme = e.matches ? "dark" : "light";
          setEffectiveTheme(newTheme);
          applyTheme(newTheme);
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      }
    }
  }, [isLandingPage, userProfile?.theme]);

  function applyTheme(newTheme: "light" | "dark") {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
  }

  function setTheme(newTheme: "light" | "dark" | "system") {
    setThemeState(newTheme);
    
    if (newTheme === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const effective = systemPrefersDark ? "dark" : "light";
      setEffectiveTheme(effective);
      applyTheme(effective);
    } else {
      setEffectiveTheme(newTheme);
      applyTheme(newTheme);
    }
  }

  if (!mounted) {
    return <>{children}</>; // Evitar flash
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

