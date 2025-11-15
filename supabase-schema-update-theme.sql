-- Adicionar coluna theme na tabela users
-- Execute este script no SQL Editor do Supabase

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS theme TEXT CHECK (theme IN ('light', 'dark')) DEFAULT NULL;

-- Comentário na coluna
COMMENT ON COLUMN users.theme IS 'Tema preferido do usuário (light, dark ou NULL para usar preferência do sistema). Aplica-se ao dashboard e catálogos públicos do usuário.';

