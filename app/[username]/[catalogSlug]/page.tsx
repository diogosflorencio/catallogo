import { getPublicCatalogo } from "@/lib/supabase/database";
import { notFound } from "next/navigation";
import { PublicCatalogoView } from "@/components/catalogo/PublicCatalogoView";

interface PageProps {
  params: Promise<{
    username: string;
    catalogSlug: string;
  }>;
}

export default async function PublicCatalogoPage({ params }: PageProps) {
  const { username, catalogSlug } = await params;
  
  const data = await getPublicCatalogo(username, catalogSlug);
  
  if (!data) {
    notFound();
  }

  return <PublicCatalogoView data={data} username={username} catalogSlug={catalogSlug} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { username, catalogSlug } = await params;
  const data = await getPublicCatalogo(username, catalogSlug);

  if (!data) {
    return {
      title: "Catálogo não encontrado",
    };
  }

  return {
    title: `${data.catalogo.nome} - ${data.user.nome_loja || username}`,
    description: data.catalogo.descricao || `Catálogo de produtos de ${data.user.nome_loja || username}`,
    openGraph: {
      title: `${data.catalogo.nome} - ${data.user.nome_loja || username}`,
      description: data.catalogo.descricao || `Catálogo de produtos de ${data.user.nome_loja || username}`,
      images: data.user.photo_url ? [data.user.photo_url] : [],
    },
  };
}

