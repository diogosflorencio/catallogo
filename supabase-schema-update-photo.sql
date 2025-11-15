-- Adicionar coluna custom_photo_url na tabela users
-- Execute este script no SQL Editor do Supabase

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS custom_photo_url TEXT;

-- Comentário na coluna
COMMENT ON COLUMN users.custom_photo_url IS 'URL da foto de perfil customizada do usuário (substitui photo_url do Google nos catálogos públicos)';

