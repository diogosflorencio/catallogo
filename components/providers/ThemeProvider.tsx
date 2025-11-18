"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile } from "@/lib/supabase/database";

interface ThemeContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  effectiveTheme: "light" | "dark";
  appearance: "feminine" | "masculine" | null;
  setAppearance: (appearance: "feminine" | "masculine" | null) => void;
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
  const [appearance, setAppearanceState] = useState<"feminine" | "masculine" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Aplicar aparência do usuário - usar null se não tiver definido (padrão será feminino no CSS)
    const userAppearance = userProfile?.appearance || null;
    setAppearanceState(userAppearance);
    applyAppearance(userAppearance || "feminine"); // Aplicar feminino como padrão se null
    
    if (isLandingPage) {
      // Landing page: sempre tema claro
      setThemeState("light");
      setEffectiveTheme("light");
      applyTheme("light");
    } else {
      // Dashboard/Catálogos públicos: usa tema do usuário ou padrão claro
      const userTheme = userProfile?.theme;
      if (userTheme === "light" || userTheme === "dark") {
        setThemeState(userTheme);
        setEffectiveTheme(userTheme);
        applyTheme(userTheme);
      } else {
        // null = usar tema claro como padrão
        setThemeState("light");
        setEffectiveTheme("light");
        applyTheme("light");
      }
    }
  }, [isLandingPage, userProfile?.theme, userProfile?.appearance]);

  function applyTheme(newTheme: "light" | "dark") {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
  }

  function applyAppearance(newAppearance: "feminine" | "masculine" | null) {
    const root = document.documentElement;
    if (newAppearance) {
      root.setAttribute("data-appearance", newAppearance);
    } else {
      root.setAttribute("data-appearance", "feminine"); // Padrão
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

  function setAppearance(newAppearance: "feminine" | "masculine" | null) {
    setAppearanceState(newAppearance);
    applyAppearance(newAppearance);
  }

  if (!mounted) {
    return <>{children}</>; // Evitar flash
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme, appearance, setAppearance }}>
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

