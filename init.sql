-- Script de inicialização do banco de dados
-- Este arquivo será executado automaticamente na primeira vez que o container MySQL for criado
-- Baseado no dump do banco original

CREATE DATABASE IF NOT EXISTS controle_presenca;

USE controle_presenca;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) DEFAULT NULL,
    google_id VARCHAR(255) DEFAULT NULL,
    perfil ENUM('admin', 'gestor', 'lancador') NOT NULL DEFAULT 'lancador',
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de condomínios
CREATE TABLE IF NOT EXISTS condominios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    codigo_interno VARCHAR(50) DEFAULT NULL,
    endereco TEXT DEFAULT NULL,
    cidade VARCHAR(100) DEFAULT NULL,
    estado VARCHAR(2) DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    endereco VARCHAR(255) DEFAULT NULL,
    responsavel VARCHAR(100) DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de postos
CREATE TABLE IF NOT EXISTS postos (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    empresa_id INT DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_nome_global (nome)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    empresa_id INT NOT NULL,
    condominio_id INT DEFAULT NULL,
    posto_id INT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    tipo ENUM('fixo', 'cobertura') NOT NULL DEFAULT 'fixo',
    PRIMARY KEY (id),
    KEY empresa_id (empresa_id),
    KEY posto_id (posto_id),
    KEY idx_colaboradores_condominio (condominio_id),
    CONSTRAINT colaboradores_ibfk_1 FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    CONSTRAINT colaboradores_ibfk_2 FOREIGN KEY (posto_id) REFERENCES postos (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de relacionamento usuário-condomínio
CREATE TABLE IF NOT EXISTS usuario_condominios (
    id INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    condominio_id INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuario_condominio (usuario_id, condominio_id),
    KEY fk_uc_condominio (condominio_id),
    CONSTRAINT fk_uc_condominio FOREIGN KEY (condominio_id) REFERENCES condominios (id),
    CONSTRAINT fk_uc_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de coberturas
CREATE TABLE IF NOT EXISTS coberturas (
    id INT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY fk_coberturas_empresa (empresa_id),
    CONSTRAINT fk_coberturas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de relacionamento condomínio-postos
CREATE TABLE IF NOT EXISTS condominio_postos (
    id INT NOT NULL AUTO_INCREMENT,
    condominio_id INT NOT NULL,
    posto_id INT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_condominio_posto (condominio_id, posto_id),
    KEY fk_cp_posto (posto_id),
    CONSTRAINT fk_cp_condominio FOREIGN KEY (condominio_id) REFERENCES condominios (id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_posto FOREIGN KEY (posto_id) REFERENCES postos (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de presenças diárias
CREATE TABLE IF NOT EXISTS presencas_diarias (
    id INT NOT NULL AUTO_INCREMENT,
    data DATE NOT NULL,
    colaborador_id INT NOT NULL,
    condominio_id INT NOT NULL,
    posto_id INT DEFAULT NULL,
    status ENUM(
        'presente',
        'falta',
        'folga',
        'atestado'
    ) NOT NULL DEFAULT 'falta',
    observacoes TEXT DEFAULT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cobertura_id INT DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_presenca (
        data,
        colaborador_id,
        posto_id
    ),
    KEY posto_id (posto_id),
    KEY idx_data (data),
    KEY idx_colaborador (colaborador_id),
    KEY idx_condominio (condominio_id),
    KEY fk_pd_cobertura_colab (cobertura_id),
    CONSTRAINT fk_pd_cobertura_colab FOREIGN KEY (cobertura_id) REFERENCES colaboradores (id),
    CONSTRAINT presencas_diarias_ibfk_1 FOREIGN KEY (colaborador_id) REFERENCES colaboradores (id) ON DELETE CASCADE,
    CONSTRAINT presencas_diarias_ibfk_2 FOREIGN KEY (condominio_id) REFERENCES condominios (id) ON DELETE CASCADE,
    CONSTRAINT presencas_diarias_ibfk_3 FOREIGN KEY (posto_id) REFERENCES postos (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Inserir usuário admin padrão (senha: 123456)
-- Hash bcrypt para '123456'
INSERT INTO
    usuarios (
        nome,
        email,
        senha_hash,
        perfil
    )
VALUES (
        'Admin Sistema',
        'admin@sistema.com',
        '$2b$10$JjLDu2/oJk71IF4EK0pY..4fF.WOAxQmv76/qV6eHWsVandJMEg9.',
        'admin'
    )
ON DUPLICATE KEY UPDATE
    nome = nome;

-- Dados de exemplo (opcional - remova se não quiser)
INSERT INTO
    condominios (nome, codigo_interno)
VALUES ('DVR Embu', '1'),
    ('DVR Caçapava', '2'),
    ('DVR Itapevi', '3')
ON DUPLICATE KEY UPDATE
    nome = nome;

-- Empresas de exemplo
INSERT INTO
    empresas (nome)
VALUES ('Prevenção'),
    ('Fernandes')
ON DUPLICATE KEY UPDATE
    nome = nome;

-- Postos de exemplo
INSERT INTO
    postos (nome)
VALUES ('Posto Exemplo')
ON DUPLICATE KEY UPDATE
    nome = nome;

-- Vincular admin a todos os condomínios
INSERT INTO
    usuario_condominios (usuario_id, condominio_id)
SELECT u.id, c.id
FROM usuarios u
    CROSS JOIN condominios c
WHERE
    u.email = 'admin@sistema.com'
ON DUPLICATE KEY UPDATE
    usuario_id = usuario_id;