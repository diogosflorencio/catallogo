-- Atualização do schema para suportar múltiplas imagens
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna imagens_urls (JSON array) mantendo imagem_url para compatibilidade
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS imagens_urls JSONB DEFAULT '[]'::jsonb;

-- Migrar dados existentes: se imagem_url existe, mover para imagens_urls
UPDATE produtos 
SET imagens_urls = CASE 
  WHEN imagem_url IS NOT NULL AND imagem_url != '' THEN jsonb_build_array(imagem_url)
  ELSE '[]'::jsonb
END
WHERE imagens_urls IS NULL OR imagens_urls = '[]'::jsonb;

-- Criar índice para busca por imagens
CREATE INDEX IF NOT EXISTS idx_produtos_imagens_urls ON produtos USING GIN (imagens_urls);

-- Comentário na coluna
COMMENT ON COLUMN produtos.imagens_urls IS 'Array JSON com URLs das imagens do produto (máximo 3 imagens)';

