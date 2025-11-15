-- Adicionar coluna appearance na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS appearance TEXT CHECK (appearance IN ('feminine', 'masculine'));

-- Definir valor padrão como 'feminine' para usuários existentes
UPDATE users 
SET appearance = 'feminine' 
WHERE appearance IS NULL;

