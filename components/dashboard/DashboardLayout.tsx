"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/firebase/auth";
import { UserProfile } from "@/lib/supabase/database";
import { Home, ShoppingBag, User, LogOut, BookOpen } from "lucide-react";
// BarChart3 importado mas não usado (estatísticas ocultas temporariamente)
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  profile: UserProfile | null;
}

export function DashboardLayout({
  children,
  profile,
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  const navItems = [
    { href: `/dashboard`, icon: Home, label: "Home" },
    { href: `/dashboard/catalogos`, icon: ShoppingBag, label: "Catálogos" },
    { href: `/dashboard/tutorial`, icon: BookOpen, label: "Tutorial" },
    // Estatísticas temporariamente ocultas - será implementado no futuro
    // { href: `/dashboard/estatisticas`, icon: BarChart3, label: "Estatísticas" },
    { href: `/dashboard/conta`, icon: User, label: "Conta" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-blush/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-semibold">Catallogo</h1>
          <nav className="flex gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-foreground/70 hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sair</span>
            </button>
          )}
          {!user && (
            <Link href="/" className="flex items-center gap-2 text-foreground/70 hover:text-foreground">
              <span className="hidden lg:inline">Entrar</span>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-blush/20 z-50">
        <nav className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-foreground/60"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}

