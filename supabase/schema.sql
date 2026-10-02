-- ========================================================================
-- TURING LAB — SCHEMA COMPLETO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- ========================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE EVENTOS / DIAS DE FEIRA
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE VISITANTES (AGENTES)
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    agent_number INTEGER NOT NULL,
    nickname TEXT NOT NULL,
    total_score INTEGER DEFAULT 0,
    pre_exp_opinion TEXT,           -- 'SIM', 'NAO', 'NAO_SEI'
    pre_exp_trust INTEGER,          -- 0 a 10
    post_exp_opinion TEXT,          -- 'SIM', 'NAO', 'DEPENDE', 'NAO_SEI'
    post_exp_trust INTEGER,         -- 0 a 10
    completed_stations_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequência para numeração legível dos agentes (ex: AGENTE #0101)
CREATE SEQUENCE IF NOT EXISTS public.agent_number_seq START WITH 101 INCREMENT BY 1;

-- 3. TABELA DE ESTAÇÕES
CREATE TABLE IF NOT EXISTS public.stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,       -- 'turing', 'carrinhos', 'aprendizado', etc.
    title TEXT NOT NULL,
    subtitle TEXT,
    order_num INTEGER NOT NULL,
    icon_name TEXT DEFAULT 'Cpu',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE PERGUNTAS DAS ESTAÇÕES
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'single_choice', -- 'single_choice', 'scale', 'text'
    correct_option TEXT,             -- NULL para perguntas de pura reflexão/ética
    explanation TEXT,
    xp_value INTEGER DEFAULT 50,
    order_num INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OPÇÕES DE RESPOSTA
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    order_num INTEGER DEFAULT 1
);

-- 6. RESPOSTAS DOS VISITANTES
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE,
    station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    is_kiosk_vote BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DESAFIOS "REAL OU IA" (DETETIVE DIGITAL)
CREATE TABLE IF NOT EXISTS public.media_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image', -- 'image' ou 'video'
    is_ai_generated BOOLEAN NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    order_num INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROJETOS DO 9º ANO
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    problem_desc TEXT NOT NULL,
    solution_desc TEXT NOT NULL,
    ai_role TEXT NOT NULL,
    human_decision TEXT NOT NULL,
    order_num INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REAÇÕES / VOTOS NOS PROJETOS
CREATE TABLE IF NOT EXISTS public.project_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,     -- 'inovador', 'impacto', 'usaria'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, visitor_id, reaction_type)
);

-- 10. CÓDIGOS SECRETOS (BLETCHLEY PARK)
CREATE TABLE IF NOT EXISTS public.secret_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_key TEXT UNIQUE NOT NULL,   -- Ex: 'ENIGMA1950', 'ULTRA', 'COLOSSUS'
    title TEXT NOT NULL,
    secret_content TEXT NOT NULL,
    xp_value INTEGER DEFAULT 150,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DESBLOQUEIOS DO VISITANTE
CREATE TABLE IF NOT EXISTS public.visitor_unlocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE,
    secret_code_id UUID REFERENCES public.secret_codes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(visitor_id, secret_code_id)
);

-- 12. REFLEXÕES ABERTAS (COM MODERAÇÃO PARA O TELÃO)
CREATE TABLE IF NOT EXISTS public.open_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    reflection_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending',   -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CONFIGURAÇÕES DA APLICAÇÃO (CONTROLADAS PELO ADMIN)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- ÍNDICES PARA VELOCIDADE EM REALTIME E CONSULTAS
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_responses_station ON public.responses(station_id);
CREATE INDEX IF NOT EXISTS idx_responses_visitor ON public.responses(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_score ON public.visitors(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_stations_order ON public.stations(order_num);

-- ========================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ========================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Leitura pública para tabelas de exibição
CREATE POLICY "Leitura pública de eventos ativos" ON public.events FOR SELECT USING (is_active = true);
CREATE POLICY "Leitura pública de estações ativas" ON public.stations FOR SELECT USING (is_active = true);
CREATE POLICY "Leitura pública de perguntas" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Leitura pública de opções" ON public.question_options FOR SELECT USING (true);
CREATE POLICY "Leitura pública de mídias ativas" ON public.media_challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Leitura pública de projetos ativos" ON public.projects FOR SELECT USING (is_active = true);
CREATE POLICY "Leitura pública de configurações" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Leitura pública de reflexões aprovadas" ON public.open_reflections FOR SELECT USING (status = 'approved');

-- Inserção pública para visitantes anônimos
CREATE POLICY "Criar visitante anônimo" ON public.visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Ler dados do próprio visitante ou ranking" ON public.visitors FOR SELECT USING (true);
CREATE POLICY "Atualizar próprio codinome e pontuação" ON public.visitors FOR UPDATE USING (true);
CREATE POLICY "Excluir ou moderar visitante" ON public.visitors FOR DELETE USING (true);

CREATE POLICY "Registrar resposta anônima" ON public.responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Ler respostas para cálculo agregado" ON public.responses FOR SELECT USING (true);

CREATE POLICY "Votar em projetos" ON public.project_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Ler votos em projetos" ON public.project_reactions FOR SELECT USING (true);

CREATE POLICY "Registrar desbloqueio de código secreto" ON public.visitor_unlocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Ler desbloqueios" ON public.visitor_unlocks FOR SELECT USING (true);

CREATE POLICY "Submeter reflexão aberta" ON public.open_reflections FOR INSERT WITH CHECK (true);

-- ========================================================================
-- HABILITAR REALTIME NAS TABELAS ESSENCIAIS DO TELÃO
-- ========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.open_reflections;

-- ========================================================================
-- SEEDS INICIAIS (CONFIGURAÇÕES, ESTAÇÕES E PERGUNTAS)
-- ========================================================================

-- Evento Padrão
INSERT INTO public.events (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Feira de Ciências 2026 — Turing Lab', 'Exposição interativa sobre computação, IA e ética', true)
ON CONFLICT (id) DO NOTHING;

-- Configurações Iniciais da Feira
INSERT INTO public.app_settings (key, value) VALUES
('navigation_mode', '"free"'),
('reveal_turing_mode', '"on_finish"'),
('enable_leaderboard', 'true'),
('live_rotation_seconds', '15'),
('kiosk_reset_seconds', '6')
ON CONFLICT (key) DO NOTHING;

-- Inserção das 8 Estações da Exposição
INSERT INTO public.stations (slug, title, subtitle, order_num, icon_name, description) VALUES
('turing', '01. O Teste de Turing', 'Fácil ou Difícil Reconhecer uma IA?', 1, 'MessageSquare', 'Na sua opinião, hoje é fácil ou difícil reconhecer quando você está interagindo com uma Inteligência Artificial?'),
('carrinhos', '02. Máquina ou Inteligência?', 'Automação vs IA', 2, 'Car', 'Dois carrinhos na pista: um usa sensores e regras fixas; o outro aprendeu padrões com visão computacional.'),
('aprendizado', '03. Como uma IA Aprende?', 'Dados e Treinamento', 3, 'Brain', 'Modelos não recebem regras prontas: eles encontram correlações e padrões em milhares de exemplos.'),
('engane-a-ia', '04. Engane a IA', 'Limites e Condições Inéditas', 4, 'ShieldAlert', 'Descubra por que modelos de visão falham diante de sombras, ângulos novos ou dados fora do treinamento.'),
('real-ou-ia', '05. Detetive de IA', 'Real ou Gerado por Algoritmo?', 5, 'Search', 'Analise imagens e tente descobrir: esta cena realmente existiu ou foi gerada por inteligência artificial?'),
('confianca-etica', '06. Você Confiaria na IA?', 'Dilemas e Decisões Críticas', 6, 'Scale', 'Uma IA prevê riscos de reprovação ou seleciona currículos: até onde devemos delegar o julgamento?'),
('auditoria', '07. Audite uma IA', 'Checagem Humana e Alucinações', 7, 'FileCheck', 'Os cartazes desta sala foram feitos com auxílio de IA. Veja os rascunhos, as correções e os erros encontrados.'),
('pergunta-final', '08. A Decisão Humana', 'O Que Deixar as Máquinas Decidirem?', 8, 'HelpCircle', 'A reflexão final da sua jornada no Turing Lab: para onde caminhamos na relação entre humanos e máquinas?')
ON CONFLICT (slug) DO NOTHING;

-- Inserção de Códigos Secretos para o Arquivo Bletchley Park
INSERT INTO public.secret_codes (code_key, title, secret_content, xp_value) VALUES
('ENIGMA', 'A Máquina Bombe', 'Alan Turing e sua equipe criaram em Bletchley Park máquinas eletromecânicas chamadas Bombes para decifrar as transmissões militares da Enigma, encurtando a Segunda Guerra Mundial em pelo menos dois anos.', 150),
('COLOSSUS', 'O Primeiro Computador Programável', 'Desenvolvido por Tommy Flowers com contribuições teóricas fundamentais de Turing, o Colossus usava válvulas termiônicas para acelerar a quebra do código Lorenz.', 150),
('TESTE1950', 'Computing Machinery and Intelligence', 'O artigo pioneiro de Turing publicado na revista Mind em 1950 inaugurou o campo da Inteligência Artificial ao propor o Jogo da Imitação.', 200)
ON CONFLICT (code_key) DO NOTHING;
