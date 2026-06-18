-- ========================================================================================
-- SQL SYSBOVI (V6.0) - Schema Corrigido e Alinhado com Frontend + Backend NestJS
--
-- MUDANÇAS EM RELAÇÃO À V5.2:
--   - Removidas todas as functions e triggers (lógica migrada para NestJS Services)
--   - bovinos: separado status em status + status_saude; adicionado peso_entrada, data_entrada
--   - lotes_pastos: renomeado capacidade_max; adicionado area_hectares, ultimo_rodizio, dias_descanso
--   - insumos: valores de tipo corrigidos; campos renomeados; adicionado nivel_minimo e validade
--   - usuarios: papel atualizado com COMUM; adicionado admin_usuarios para Super Admin (UA)
--   - planos_assinatura: preços corrigidos; adicionado codigo_role para mapeamento de papel
-- ========================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PLANOS E TENANTS (SaaS Multi-Tenant)
-- ==========================================

CREATE TABLE planos_assinatura (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL,
    codigo_role VARCHAR(10) NOT NULL,              -- UC | UP | UE (mapeamento com papel do usuário)
    limite_bovinos INT,                            -- NULL = ilimitado
    preco_mensal DECIMAL(10,2) DEFAULT 0.00
);

INSERT INTO planos_assinatura (nome, codigo_role, limite_bovinos, preco_mensal) VALUES
('COMUM',      'UC', 50,   0.00),
('PREMIUM',    'UP', NULL, 149.00),
('EMPRESARIAL','UE', NULL, 349.00);

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fazenda VARCHAR(150) NOT NULL,
    plano_id INT NOT NULL,
    status_conta VARCHAR(20) DEFAULT 'ATIVA' CHECK (status_conta IN ('ATIVA', 'INADIMPLENTE', 'BLOQUEADA')),
    regiao_cotacao VARCHAR(50) DEFAULT 'SP',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plano_id) REFERENCES planos_assinatura(id)
);

-- ==========================================
-- 2. USUÁRIOS
-- ==========================================

-- Usuários dos tenants (fazendas) - papéis operacionais
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    papel VARCHAR(20) NOT NULL CHECK (papel IN ('ADMIN_FAZENDA', 'ESPECIALISTA', 'COMUM')),
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Super Admin SysBovi (UA) - separado dos usuários de tenant
CREATE TABLE admin_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- 3. OPERACIONAL: PASTOS E REBANHO
-- ==========================================

CREATE TABLE lotes_pastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    capacidade INT NOT NULL,                       -- renomeado de capacidade_max
    area_hectares DECIMAL(8,2),                    -- NOVO: área em hectares
    ultimo_rodizio DATE,                           -- NOVO: data do último rodízio
    dias_descanso INT DEFAULT 30,                  -- NOVO: dias de descanso entre rodízios
    status_ocupacao VARCHAR(20) DEFAULT 'NORMAL' CHECK (status_ocupacao IN ('NORMAL', 'SUPERLOTADO')),
    metodo_criacao VARCHAR(20) DEFAULT 'LIVRE_PASTO' CHECK (metodo_criacao IN ('LIVRE_PASTO', 'SEMI_CONFINADO', 'CONFINADO')),
    alerta_massa_forrageira VARCHAR(10) DEFAULT 'NORMAL' CHECK (alerta_massa_forrageira IN ('NORMAL', 'BAIXA', 'CRITICA')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE bovinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lote_id UUID,
    brinco VARCHAR(50) NOT NULL,
    raca VARCHAR(50) NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F')),
    data_nascimento DATE NOT NULL,
    data_entrada DATE NOT NULL DEFAULT CURRENT_DATE, -- NOVO: data de entrada na fazenda
    peso_entrada DECIMAL(8,2),                       -- NOVO: peso no momento da entrada
    status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO', 'VENDIDO', 'MORTO')),
    status_saude VARCHAR(20) DEFAULT 'SAUDAVEL' CHECK (status_saude IN ('SAUDAVEL', 'EM_TRATAMENTO', 'OBSERVACAO')),
    custo_acumulado_nutricao DECIMAL(10,2) DEFAULT 0.00,
    versao INT DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes_pastos(id) ON DELETE SET NULL,
    UNIQUE (tenant_id, brinco)
);

CREATE TABLE pesagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    bovino_id UUID NOT NULL,
    peso DECIMAL(8,2) NOT NULL,
    data_pesagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gmd_calculado DECIMAL(8,3),                    -- calculado pelo NestJS PesagensService
    status_sincronizacao VARCHAR(20) DEFAULT 'SYNCED' CHECK (status_sincronizacao IN ('SYNCED', 'PENDING', 'CONFLICT')),
    versao INT DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (bovino_id) REFERENCES bovinos(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. ESTOQUE DE INSUMOS
-- ==========================================

CREATE TABLE insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('VACINA', 'SUPLEMENTO', 'MEDICAMENTO', 'MINERAL')),
    unidade VARCHAR(20) NOT NULL,                  -- renomeado de unidade_medida
    quantidade_atual DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- renomeado de quantidade_estoque
    custo_unitario DECIMAL(10,2) NOT NULL,
    nivel_minimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,     -- NOVO: para cálculo de status de alerta
    validade DATE,                                         -- NOVO: data de validade do produto
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE uso_insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    insumo_id UUID NOT NULL,
    lote_id UUID NOT NULL,
    quantidade_utilizada DECIMAL(10,2) NOT NULL,
    valor_unitario DECIMAL(10,2),
    custo_total DECIMAL(10,2) NOT NULL,
    data_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes_pastos(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. MÓDULO AVALIAVENDA
-- ==========================================

CREATE TABLE parametros_zootecnicos (
    id SERIAL PRIMARY KEY,
    metodo_criacao VARCHAR(20) NOT NULL,
    idade_meses INT NOT NULL,
    peso_min_arrobas DECIMAL(5,2) NOT NULL,
    peso_max_arrobas DECIMAL(5,2) NOT NULL,
    UNIQUE (metodo_criacao, idade_meses)
);

INSERT INTO parametros_zootecnicos (metodo_criacao, idade_meses, peso_min_arrobas, peso_max_arrobas) VALUES
('CONFINADO',      18, 14.0, 16.0),
('CONFINADO',      24, 17.0, 20.0),
('CONFINADO',      30, 20.0, 23.0),
('SEMI_CONFINADO', 18, 14.0, 16.0),
('SEMI_CONFINADO', 24, 17.0, 20.0),
('SEMI_CONFINADO', 30, 20.0, 23.0),
('LIVRE_PASTO',    24, 13.0, 15.0),
('LIVRE_PASTO',    30, 16.0, 18.0),
('LIVRE_PASTO',    36, 18.0, 20.0);

CREATE TABLE custo_diaria_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lote_id UUID NOT NULL,
    valor_diaria DECIMAL(10,2) NOT NULL,
    data_vigencia DATE NOT NULL DEFAULT CURRENT_DATE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes_pastos(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. RESILIÊNCIA OFFLINE (PWA)
-- ==========================================

CREATE TABLE sync_quarentena (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    tabela_afetada VARCHAR(50) NOT NULL,
    registro_id UUID NOT NULL,
    dados_conflitantes JSONB NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    status_resolucao VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status_resolucao IN ('PENDENTE', 'RESOLVIDO', 'DESCARTADO')),
    data_conflito TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ==========================================
-- 7. BACKOFFICE SAAS
-- ==========================================

CREATE TABLE faturas_saas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status_pagamento VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status_pagamento IN ('PAGO', 'PENDENTE', 'ATRASADO', 'CANCELADO')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    usuario_id UUID,
    acao VARCHAR(100) NOT NULL,
    detalhes TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ==========================================
-- 8. ÍNDICES DE PERFORMANCE
-- ==========================================

CREATE INDEX idx_bovinos_tenant_lote      ON bovinos(tenant_id, lote_id);
CREATE INDEX idx_bovinos_tenant_status    ON bovinos(tenant_id, status);
CREATE INDEX idx_pesagens_bovino          ON pesagens(bovino_id);
CREATE INDEX idx_pesagens_bovino_data     ON pesagens(bovino_id, data_pesagem DESC);
CREATE INDEX idx_uso_insumos_lote         ON uso_insumos(lote_id);
CREATE INDEX idx_insumos_tenant           ON insumos(tenant_id);
CREATE INDEX idx_faturas_tenant           ON faturas_saas(tenant_id);
CREATE INDEX idx_logs_tenant              ON logs_auditoria(tenant_id);
CREATE INDEX idx_sync_quarentena_tenant   ON sync_quarentena(tenant_id);
CREATE INDEX idx_custo_diaria_lote        ON custo_diaria_historico(lote_id, data_vigencia DESC);
