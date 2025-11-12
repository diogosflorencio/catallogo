-- Schema do Supabase para Catallogo

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Firebase UID
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  username TEXT UNIQUE,
  nome_loja TEXT,
  plano TEXT NOT NULL DEFAULT 'free' CHECK (plano IN ('free', 'pro', 'premium')),
  whatsapp_number TEXT,
  mensagem_template TEXT DEFAULT 'Olá! Vi o produto {{produtoNome}} no seu Catallogo 💖',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabela de catálogos
CREATE TABLE IF NOT EXISTS catalogos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Índices para catalogos
CREATE INDEX IF NOT EXISTS idx_catalogos_user_id ON catalogos(user_id);
CREATE INDEX IF NOT EXISTS idx_catalogos_slug ON catalogos(slug);
CREATE INDEX IF NOT EXISTS idx_catalogos_public ON catalogos(public);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  catalogo_id UUID NOT NULL REFERENCES catalogos(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2),
  imagem_url TEXT,
  link_externo TEXT,
  visivel BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(catalogo_id, slug)
);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_produtos_catalogo_id ON produtos(catalogo_id);
CREATE INDEX IF NOT EXISTS idx_produtos_visivel ON produtos(visivel);

-- Tabela de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('view', 'whatsapp_click')),
  username TEXT NOT NULL,
  catalog_slug TEXT NOT NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_analytics_username ON analytics_events(username);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(type);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_catalogos_updated_at BEFORE UPDATE ON catalogos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies para users
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Public can read public usernames" ON users
  FOR SELECT USING (username IS NOT NULL);

-- Policies para catalogos
CREATE POLICY "Users can read own catalogos" ON catalogos
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own catalogos" ON catalogos
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Public can read public catalogos" ON catalogos
  FOR SELECT USING (public = true);

-- Policies para produtos
CREATE POLICY "Users can read own produtos" ON produtos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM catalogos 
      WHERE catalogos.id = produtos.catalogo_id 
      AND catalogos.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own produtos" ON produtos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM catalogos 
      WHERE catalogos.id = produtos.catalogo_id 
      AND catalogos.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Public can read visible produtos" ON produtos
  FOR SELECT USING (visivel = true);

-- Policies para analytics (todos podem inserir, apenas o próprio usuário pode ler)
CREATE POLICY "Anyone can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own analytics" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.username = analytics_events.username 
      AND users.id = auth.uid()::text
    )
  );

