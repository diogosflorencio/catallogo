"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getAnalyticsStats } from "@/lib/supabase/database";
import { UserProfile, Catalogo } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


export default function EstatisticasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalClicks: 0,
    conversionRate: 0,
    viewsByDate: [] as Array<{ date: string; views: number }>,
    clicksByCatalog: [] as Array<{ catalog: string; clicks: number }>,
  });

  useEffect(() => {
    // Exigir login
    if (!loading && !user) {
      router.push("/perfil");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, loading, router]);

  async function loadData() {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userProfile = await response.json();
        setProfile(userProfile);
        
        // Buscar catálogos via API route (retorna todos, públicos e privados)
        const catalogosResponse = await fetch("/api/catalogos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (catalogosResponse.ok) {
          const cats = await catalogosResponse.json();
          setCatalogos(cats);
        } else {
          console.error("Erro ao buscar catálogos:", await catalogosResponse.text());
        }
        
        // Buscar estatísticas reais
        if (userProfile.username) {
          const analyticsStats = await getAnalyticsStats(userProfile.username);
          setStats(analyticsStats);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <DashboardLayout profile={profile}>
      <div>
        <h2 className="text-3xl font-display font-semibold mb-8">
          Estatísticas
        </h2>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background-alt rounded-xl p-6"
          >
            <p className="text-sm text-foreground/60 mb-1">Total de Visualizações</p>
            <p className="text-3xl font-display font-semibold">{stats.totalViews.toLocaleString()}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-background-alt rounded-xl p-6"
          >
            <p className="text-sm text-foreground/60 mb-1">Cliques no WhatsApp</p>
            <p className="text-3xl font-display font-semibold">{stats.totalClicks.toLocaleString()}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-background-alt rounded-xl p-6"
          >
            <p className="text-sm text-foreground/60 mb-1">Taxa de Conversão</p>
            <p className="text-3xl font-display font-semibold">{stats.conversionRate}%</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-background-alt rounded-xl p-6"
          >
            <h3 className="text-lg font-display font-semibold mb-4">
              Visualizações (7 dias)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.viewsByDate.length > 0 ? stats.viewsByDate : [{ date: "Hoje", views: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F6D1D1" />
                <XAxis dataKey="date" stroke="#9F8DAF" />
                <YAxis stroke="#9F8DAF" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#9F8DAF"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-background-alt rounded-xl p-6"
          >
            <h3 className="text-lg font-display font-semibold mb-4">
              Cliques por Catálogo
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.clicksByCatalog.length > 0 ? stats.clicksByCatalog : [{ catalog: "Nenhum", clicks: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F6D1D1" />
                <XAxis dataKey="catalog" stroke="#9F8DAF" />
                <YAxis stroke="#9F8DAF" />
                <Tooltip />
                <Bar dataKey="clicks" fill="#9F8DAF" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-background-alt rounded-xl p-6"
        >
          <p className="text-sm text-foreground/60">
            As estatísticas são atualizadas em tempo real. Dados históricos
            completos disponíveis no plano Premium.
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

