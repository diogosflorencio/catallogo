import { supabase } from "./client";
import { supabaseAdmin } from "./server";

// Types
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  photo_url: string | null; // Foto do Google (mantida para compatibilidade)
  custom_photo_url: string | null; // Foto customizada do usuário
  username: string | null;
  nome_loja: string | null;
  plano: "free" | "pro" | "premium";
  whatsapp_number: string | null;
  mensagem_template: string;
  created_at: string;
  last_active_at: string | null;
}

export interface Catalogo {
  id: string;
  user_id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  catalogo_id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null; // Mantido para compatibilidade
  imagens_urls: string[]; // Array de URLs (máximo 3 imagens)
  link_externo: string | null;
  visivel: boolean;
  created_at: string;
  updated_at: string;
}

// User functions
// IMPORTANTE: Esta função usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/user/profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("getUserProfile não pode ser chamado no cliente. Use a API route /api/user/profile");
  }

  if (!supabaseAdmin) {
    console.warn("Supabase não está configurado");
    return null;
  }

  // Usar supabaseAdmin para ter certeza de que podemos ler o perfil
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
  
  if (!data) return null;
  return data as UserProfile;
}

export async function createUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Supabase não está configurado. Configure SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local");
  }

  await supabaseAdmin.from("users").insert({
    id: userId,
    email: data.email,
    display_name: data.display_name,
    photo_url: data.photo_url,
    username: data.username,
    nome_loja: data.nome_loja,
    plano: "free",
    whatsapp_number: data.whatsapp_number,
    mensagem_template: "Olá! Vi o produto {{produtoNome}} no seu Catallogo 💖",
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  });
}

// IMPORTANTE: Esta função usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/user/update
export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("updateUserProfile não pode ser chamado no cliente. Use a API route /api/user/update");
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase não está configurado. Configure SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local");
  }

  console.log("💾 [updateUserProfile] Atualizando perfil:", { userId, data });

  const updateData: any = {
    ...data,
    last_active_at: new Date().toISOString(),
  };

  console.log("💾 [updateUserProfile] Dados que serão salvos:", updateData);

  const { data: updatedData, error } = await supabaseAdmin
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select();

  if (error) {
    console.error("❌ [updateUserProfile] Erro ao atualizar:", error);
    console.error("❌ [updateUserProfile] Código do erro:", error.code);
    console.error("❌ [updateUserProfile] Detalhes:", error.details);
    console.error("❌ [updateUserProfile] Hint:", error.hint);
    throw new Error(`Erro ao atualizar perfil: ${error.message}`);
  }

  console.log("✅ [updateUserProfile] Perfil atualizado:", updatedData);
  
  // Verificar se realmente foi atualizado
  if (!updatedData || updatedData.length === 0) {
    console.warn("⚠️ [updateUserProfile] Nenhum registro foi atualizado. Verifique se o userId está correto:", userId);
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  if (!supabase) {
    console.warn("Supabase não está configurado");
    return false;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  return !error && data !== null;
}

// IMPORTANTE: Esta função usa updateUserProfile que usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/user/username
export async function setUsername(userId: string, username: string): Promise<void> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("setUsername não pode ser chamado no cliente. Use a API route /api/user/username");
  }

  const usernameLower = username.toLowerCase();
  
  console.log("🔤 [setUsername] Definindo username:", { userId, username: usernameLower });
  
  // Verificar se já existe
  const exists = await checkUsernameExists(usernameLower);
  if (exists) {
    throw new Error("Username já está em uso");
  }

  // Atualizar usuário
  await updateUserProfile(userId, { username: usernameLower });
  
  console.log("✅ [setUsername] Username definido com sucesso");
}

// IMPORTANTE: Esta função pode ser chamada no servidor ou cliente
// No servidor, usa supabaseAdmin; no cliente, usa supabase
export async function getUidByUsername(username: string): Promise<string | null> {
  // Se estiver no servidor, usar supabaseAdmin
  if (typeof window === "undefined") {
    if (!supabaseAdmin) {
      console.warn("Supabase Admin não está configurado");
      return null;
    }
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username.toLowerCase())
      .single();

    if (error || !data) return null;
    return data.id;
  }

  // Se estiver no cliente, usar supabase
  if (!supabase) {
    console.warn("Supabase não está configurado");
    return null;
  }
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !data) return null;
  return data.id;
}

// Catalogo functions
// IMPORTANTE: Esta função pode ser chamada no servidor ou cliente
// No servidor, usa supabaseAdmin; no cliente, usa supabase
export async function getCatalogos(userId: string): Promise<Catalogo[]> {
  // Se estiver no servidor, usar supabaseAdmin
  if (typeof window === "undefined") {
    if (!supabaseAdmin) {
      console.warn("Supabase Admin não está configurado");
      return [];
    }
    const { data, error } = await supabaseAdmin
      .from("catalogos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Catalogo[];
  }

  // Se estiver no cliente, usar supabase
  if (!supabase) {
    console.warn("Supabase não está configurado");
    return [];
  }
  const { data, error } = await supabase
    .from("catalogos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Catalogo[];
}

// IMPORTANTE: Esta função pode ser chamada no servidor ou cliente
// No servidor, usa supabaseAdmin; no cliente, usa supabase
export async function getCatalogo(userId: string, catalogoId: string): Promise<Catalogo | null> {
  // Se estiver no servidor, usar supabaseAdmin
  if (typeof window === "undefined") {
    if (!supabaseAdmin) {
      console.warn("Supabase Admin não está configurado");
      return null;
    }
    const { data, error } = await supabaseAdmin
      .from("catalogos")
      .select("*")
      .eq("id", catalogoId)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data as Catalogo;
  }

  // Se estiver no cliente, usar supabase
  if (!supabase) {
    console.warn("Supabase não está configurado");
    return null;
  }
  const { data, error } = await supabase
    .from("catalogos")
    .select("*")
    .eq("id", catalogoId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as Catalogo;
}

// IMPORTANTE: Esta função pode ser chamada no servidor ou cliente
// No servidor, usa supabaseAdmin; no cliente, usa supabase
export async function getCatalogoBySlug(
  userId: string,
  slug: string
): Promise<Catalogo | null> {
  // Se estiver no servidor, usar supabaseAdmin
  if (typeof window === "undefined") {
    if (!supabaseAdmin) {
      console.warn("Supabase Admin não está configurado");
      return null;
    }
    const { data, error } = await supabaseAdmin
      .from("catalogos")
      .select("*")
      .eq("user_id", userId)
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return data as Catalogo;
  }

  // Se estiver no cliente, usar supabase
  if (!supabase) {
    console.warn("Supabase não está configurado");
    return null;
  }
  const { data, error } = await supabase
    .from("catalogos")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as Catalogo;
}

// IMPORTANTE: Esta função usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/catalogos/create
export async function createCatalogo(
  userId: string,
  data: Omit<Catalogo, "id" | "user_id" | "created_at" | "updated_at">
): Promise<string> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("createCatalogo não pode ser chamado no cliente. Use a API route /api/catalogos/create");
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase não está configurado");
  }

  console.log("📦 [createCatalogo] Criando catálogo:", { userId, data });

  // Garantir que 'public' seja um boolean válido
  const insertData: any = {
    user_id: userId,
    nome: data.nome,
    slug: data.slug,
    descricao: data.descricao || null,
    public: data.public !== undefined ? Boolean(data.public) : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log("📦 [createCatalogo] Dados que serão inseridos:", insertData);

  const { data: newCatalogo, error } = await supabaseAdmin
    .from("catalogos")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("❌ [createCatalogo] Erro ao criar catálogo:", error);
    console.error("❌ [createCatalogo] Código do erro:", error.code);
    console.error("❌ [createCatalogo] Detalhes:", error.details);
    console.error("❌ [createCatalogo] Hint:", error.hint);
    console.error("❌ [createCatalogo] Mensagem:", error.message);
    throw new Error(`Erro ao criar catálogo: ${error.message}`);
  }

  if (!newCatalogo) {
    console.error("❌ [createCatalogo] Nenhum catálogo foi retornado");
    throw new Error("Erro ao criar catálogo: Nenhum registro foi criado");
  }

  console.log("✅ [createCatalogo] Catálogo criado com sucesso:", newCatalogo);
  return newCatalogo.id;
}

// IMPORTANTE: Esta função usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/catalogos/update
export async function updateCatalogo(
  userId: string,
  catalogoId: string,
  data: Partial<Catalogo>
): Promise<void> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("updateCatalogo não pode ser chamado no cliente. Use a API route /api/catalogos/update");
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase não está configurado");
  }

  console.log("📝 [updateCatalogo] Atualizando catálogo:", { userId, catalogoId, data });

  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  console.log("📝 [updateCatalogo] Dados que serão atualizados:", updateData);

  const { error } = await supabaseAdmin
    .from("catalogos")
    .update(updateData)
    .eq("id", catalogoId)
    .eq("user_id", userId);

  if (error) {
    console.error("❌ [updateCatalogo] Erro ao atualizar catálogo:", error);
    console.error("❌ [updateCatalogo] Código do erro:", error.code);
    console.error("❌ [updateCatalogo] Detalhes:", error.details);
    console.error("❌ [updateCatalogo] Hint:", error.hint);
    throw new Error(`Erro ao atualizar catálogo: ${error.message}`);
  }

  console.log("✅ [updateCatalogo] Catálogo atualizado com sucesso");
}

// IMPORTANTE: Esta função usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/catalogos/delete
export async function deleteCatalogo(userId: string, catalogoId: string): Promise<void> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("deleteCatalogo não pode ser chamado no cliente. Use a API route /api/catalogos/delete");
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase não está configurado");
  }

  console.log("🗑️ [deleteCatalogo] Deletando catálogo:", { userId, catalogoId });

  const { error } = await supabaseAdmin
    .from("catalogos")
    .delete()
    .eq("id", catalogoId)
    .eq("user_id", userId);

  if (error) {
    console.error("❌ [deleteCatalogo] Erro ao deletar catálogo:", error);
    throw new Error(`Erro ao deletar catálogo: ${error.message}`);
  }

  console.log("✅ [deleteCatalogo] Catálogo deletado com sucesso");
}

// Produto functions
// IMPORTANTE: Esta função pode ser chamada no servidor ou cliente
// No servidor, usa supabaseAdmin; no cliente, usa supabase
export async function getProdutos(catalogoId: string): Promise<Produto[]> {
  // Se estiver no servidor, usar supabaseAdmin
  if (typeof window === "undefined") {
    if (!supabaseAdmin) {
      console.warn("Supabase Admin não está configurado");
      return [];
    }
    const { data, error } = await supabaseAdmin
      .from("produtos")
      .select("*")
      .eq("catalogo_id", catalogoId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Produto[];
  }

  // Se estiver no cliente, usar supabase
  if (!supabase) {
    console.warn("Supabase não está configurado");
    return [];
  }
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("catalogo_id", catalogoId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Produto[];
}

// IMPORTANTE: Esta função pode ser chamada no servidor ou cliente
// No servidor, usa supabaseAdmin; no cliente, usa supabase
export async function getProduto(catalogoId: string, produtoId: string): Promise<Produto | null> {
  // Se estiver no servidor, usar supabaseAdmin
  if (typeof window === "undefined") {
    if (!supabaseAdmin) {
      console.warn("Supabase Admin não está configurado");
      return null;
    }
    const { data, error } = await supabaseAdmin
      .from("produtos")
      .select("*")
      .eq("id", produtoId)
      .eq("catalogo_id", catalogoId)
      .single();

    if (error || !data) return null;
    return data as Produto;
  }

  // Se estiver no cliente, usar supabase
  if (!supabase) {
    console.warn("Supabase não está configurado");
    return null;
  }
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", produtoId)
    .eq("catalogo_id", catalogoId)
    .single();

  if (error || !data) return null;
  return data as Produto;
}

// IMPORTANTE: Esta função usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/produtos/create
export async function createProduto(
  catalogoId: string,
  data: Omit<Produto, "id" | "catalogo_id" | "created_at" | "updated_at">
): Promise<string> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("createProduto não pode ser chamado no cliente. Use a API route /api/produtos/create");
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase não está configurado");
  }

  console.log("📦 [createProduto] Criando produto:", { catalogoId, data });

  // Processar imagens: garantir que imagens_urls seja um array válido
  const imagensUrls = data.imagens_urls && Array.isArray(data.imagens_urls) 
    ? data.imagens_urls.slice(0, 3) // Limitar a 3 imagens
    : (data.imagem_url ? [data.imagem_url] : []); // Fallback para compatibilidade

  const insertData: any = {
    catalogo_id: catalogoId,
    nome: data.nome,
    slug: data.slug,
    descricao: data.descricao || null,
    preco: data.preco || null,
    imagem_url: imagensUrls[0] || null, // Manter primeira imagem para compatibilidade
    imagens_urls: imagensUrls, // Array de imagens
    link_externo: data.link_externo || null,
    visivel: data.visivel !== undefined ? Boolean(data.visivel) : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log("📦 [createProduto] Dados que serão inseridos:", insertData);

  const { data: newProduto, error } = await supabaseAdmin
    .from("produtos")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("❌ [createProduto] Erro ao criar produto:", error);
    console.error("❌ [createProduto] Código do erro:", error.code);
    console.error("❌ [createProduto] Detalhes:", error.details);
    console.error("❌ [createProduto] Hint:", error.hint);
    throw new Error(`Erro ao criar produto: ${error.message}`);
  }

  if (!newProduto) {
    console.error("❌ [createProduto] Nenhum produto foi retornado");
    throw new Error("Erro ao criar produto: Nenhum registro foi criado");
  }

  console.log("✅ [createProduto] Produto criado com sucesso:", newProduto);
  return newProduto.id;
}

// IMPORTANTE: Esta função usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/produtos/update
export async function updateProduto(
  catalogoId: string,
  produtoId: string,
  data: Partial<Produto>
): Promise<void> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("updateProduto não pode ser chamado no cliente. Use a API route /api/produtos/update");
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase não está configurado");
  }

  console.log("📝 [updateProduto] Atualizando produto:", { catalogoId, produtoId, data });

  // Processar imagens se fornecidas
  const updateData: any = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Se imagens_urls foi fornecido, processar
  if (data.imagens_urls !== undefined) {
    const imagensUrls = Array.isArray(data.imagens_urls) 
      ? data.imagens_urls.slice(0, 3) // Limitar a 3 imagens
      : [];
    updateData.imagens_urls = imagensUrls;
    updateData.imagem_url = imagensUrls[0] || null; // Manter primeira imagem para compatibilidade
  } else if (data.imagem_url !== undefined) {
    // Se apenas imagem_url foi fornecido, converter para array
    updateData.imagens_urls = data.imagem_url ? [data.imagem_url] : [];
  }

  console.log("📝 [updateProduto] Dados que serão atualizados:", updateData);

  const { error } = await supabaseAdmin
    .from("produtos")
    .update(updateData)
    .eq("id", produtoId)
    .eq("catalogo_id", catalogoId);

  if (error) {
    console.error("❌ [updateProduto] Erro ao atualizar produto:", error);
    console.error("❌ [updateProduto] Código do erro:", error.code);
    console.error("❌ [updateProduto] Detalhes:", error.details);
    throw new Error(`Erro ao atualizar produto: ${error.message}`);
  }

  console.log("✅ [updateProduto] Produto atualizado com sucesso");
}

// IMPORTANTE: Esta função usa supabaseAdmin (chave secreta)
// Só pode ser chamada no servidor (API routes, server components)
// Para uso no cliente, use a API route /api/produtos/delete
export async function deleteProduto(catalogoId: string, produtoId: string): Promise<void> {
  // Verificar se estamos no servidor
  if (typeof window !== "undefined") {
    throw new Error("deleteProduto não pode ser chamado no cliente. Use a API route /api/produtos/delete");
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase não está configurado");
  }

  console.log("🗑️ [deleteProduto] Deletando produto:", { catalogoId, produtoId });

  const { error } = await supabaseAdmin
    .from("produtos")
    .delete()
    .eq("id", produtoId)
    .eq("catalogo_id", catalogoId);

  if (error) {
    console.error("❌ [deleteProduto] Erro ao deletar produto:", error);
    throw new Error(`Erro ao deletar produto: ${error.message}`);
  }

  console.log("✅ [deleteProduto] Produto deletado com sucesso");
}

// Public functions
export async function getPublicCatalogo(
  username: string,
  catalogSlug: string
): Promise<{ catalogo: Catalogo; produtos: Produto[]; user: UserProfile } | null> {
  // Buscar user pelo username
  const userId = await getUidByUsername(username);
  if (!userId) return null;

  const user = await getUserProfile(userId);
  if (!user) return null;

  const catalogo = await getCatalogoBySlug(userId, catalogSlug);
  if (!catalogo || !catalogo.public) return null;

  const produtos = await getProdutos(catalogo.id);
  const produtosVisiveis = produtos.filter((p) => p.visivel);

  return { catalogo, produtos: produtosVisiveis, user };
}

// Analytics functions
export interface AnalyticsStats {
  totalViews: number;
  totalClicks: number;
  conversionRate: number;
  viewsByDate: Array<{ date: string; views: number }>;
  clicksByCatalog: Array<{ catalog: string; clicks: number }>;
}

export async function getAnalyticsStats(username: string): Promise<AnalyticsStats> {
  if (!supabaseAdmin) {
    return {
      totalViews: 0,
      totalClicks: 0,
      conversionRate: 0,
      viewsByDate: [],
      clicksByCatalog: [],
    };
  }

  try {
    // Buscar todos os eventos do usuário
    const { data: events } = await supabaseAdmin
      .from("analytics_events")
      .select("*")
      .eq("username", username)
      .order("timestamp", { ascending: false });

    if (!events || events.length === 0) {
      return {
        totalViews: 0,
        totalClicks: 0,
        conversionRate: 0,
        viewsByDate: [],
        clicksByCatalog: [],
      };
    }

    const views = events.filter((e) => e.type === "view");
    const clicks = events.filter((e) => e.type === "whatsapp_click");

    // Agrupar views por data (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const viewsByDate = last7Days.map((date) => {
      const count = views.filter((v) => {
        const eventDate = new Date(v.timestamp).toISOString().split("T")[0];
        return eventDate === date;
      }).length;
      return {
        date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        views: count,
      };
    });

    // Agrupar cliques por catálogo
    const clicksByCatalogMap = new Map<string, number>();
    clicks.forEach((click) => {
      const catalog = click.catalog_slug;
      clicksByCatalogMap.set(catalog, (clicksByCatalogMap.get(catalog) || 0) + 1);
    });

    const clicksByCatalog = Array.from(clicksByCatalogMap.entries()).map(([catalog, count]) => ({
      catalog,
      clicks: count,
    }));

    const totalViews = views.length;
    const totalClicks = clicks.length;
    const conversionRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

    return {
      totalViews,
      totalClicks,
      conversionRate,
      viewsByDate,
      clicksByCatalog,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return {
      totalViews: 0,
      totalClicks: 0,
      conversionRate: 0,
      viewsByDate: [],
      clicksByCatalog: [],
    };
  }
}

