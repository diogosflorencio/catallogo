"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { user } = useAuth();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  async function handleThemeChange(newTheme: "light" | "dark" | "system") {
    setTheme(newTheme);
    
    // Salvar no perfil do usuário se estiver logado
    if (user && newTheme !== "system") {
      setSaving(true);
      try {
        const token = await user.getIdToken();
        await fetch("/api/user/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              theme: newTheme,
            },
          }),
        });
      } catch (error) {
        console.error("Erro ao salvar tema:", error);
      } finally {
        setSaving(false);
      }
    }
  }

  function toggleTheme() {
    if (theme === "light") {
      handleThemeChange("dark");
    } else if (theme === "dark") {
      handleThemeChange("system");
    } else {
      handleThemeChange("light");
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        onClick={() => handleThemeChange("light")}
        disabled={saving}
        className="flex items-center gap-2"
        aria-label="Tema claro"
      >
        <Sun className="w-4 h-4" />
        <span>Claro</span>
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        onClick={() => handleThemeChange("dark")}
        disabled={saving}
        className="flex items-center gap-2"
        aria-label="Tema escuro"
      >
        <Moon className="w-4 h-4" />
        <span>Escuro</span>
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        onClick={() => handleThemeChange("system")}
        disabled={saving}
        className="flex items-center gap-2"
        aria-label="Tema do sistema"
      >
        <Monitor className="w-4 h-4" />
        <span>Sistema</span>
      </Button>
    </div>
  );
}

